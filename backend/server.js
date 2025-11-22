// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

const app = express();

// PORT is used only for local development. Vercel provides its own runtime.
const PORT = process.env.PORT || 3001;

// Ensure fetch exists (Node 18+ has global fetch). Fallback to node-fetch if available.
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    const nf = require('node-fetch');
    fetchFn = nf && (nf.default || nf);
  } catch (e) {
    console.error('No global fetch and node-fetch not installed. Streaming to OpenRouter may fail.', e);
  }
}

app.use(express.json());

// CORS: allow origins from env var CORS_ORIGIN (comma-separated). If not set, allow all (dev convenience).
const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Simple in-memory models cache
let modelsCache = { data: null, lastFetched: 0 };
const CACHE_DURATION = 10 * 60 * 1000; // 10 min

const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.get('/models', async (req, res) => {
  const now = Date.now();
  if (modelsCache.data && (now - modelsCache.lastFetched < CACHE_DURATION)) {
    return res.status(200).json(modelsCache.data);
  }
  if (!fetchFn) return res.status(500).json({ error: 'Server fetch not available' });

  try {
    const upstream = await fetchFn('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error('OpenRouter /models returned', upstream.status, text);
      return res.status(502).json({ error: 'Failed to fetch models', status: upstream.status, body: text });
    }
    const data = await upstream.json();
    modelsCache = { data, lastFetched: now };
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching models from OpenRouter:', err);
    return res.status(502).json({ error: 'Failed to fetch models from upstream service.' });
  }
});

apiRouter.post('/chat', async (req, res) => {
  const { messages, provider, model, options } = req.body;
  if (!messages || !model) {
    return res.status(400).json({ error: 'Missing required fields: messages and model' });
  }
  if (!fetchFn) return res.status(500).json({ error: 'Server fetch not available' });
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set in environment');
    return res.status(500).json({ error: 'Server misconfiguration: missing OPENROUTER_API_KEY' });
  }

  // Build model id and normalize options to OpenRouter expected names
  const modelId = provider ? `${provider}/${model}` : model;
  const payload = {
    model: modelId,
    messages,
    stream: true,
  };

  // Map frontend options to upstream fields (example: maxLength -> max_tokens)
  if (options) {
    if (typeof options.temperature === 'number') payload.temperature = options.temperature;
    if (typeof options.maxLength === 'number') payload.max_tokens = options.maxLength;
    // Add other mappings if needed: top_p, presence_penalty, etc.
  }

  try {
    const upstream = await fetchFn('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const errBody = await upstream.text();
      console.error('OpenRouter /chat/completions error:', upstream.status, errBody);
      return res.status(502).json({ error: 'Upstream OpenRouter error', status: upstream.status, body: errBody });
    }

    // If upstream content-type is JSON (non-stream), forward JSON directly
    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream') && contentType.includes('application/json')) {
      const json = await upstream.json();
      return res.status(200).json(json);
    }

    // Begin streaming response to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders(); // make sure headers are sent

    if (!upstream.body) {
      console.error('Upstream response has no body to stream');
      return res.status(502).json({ error: 'Upstream has no streaming body' });
    }

    try {
      await streamPipeline(upstream.body, res);
    } catch (streamErr) {
      console.error('Error while streaming from upstream to client:', streamErr);
      try { res.end(); } catch (e) {}
    }
  } catch (error) {
    console.error('Error proxying chat request to OpenRouter:', error);
    res.status(502).json({ error: 'Failed to proxy chat request to upstream service.' });
  }
});

app.use('/api/v1', apiRouter);

// Local dev server only — Vercel will ignore this (it exports app instead).
if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server (dev) is running on port ${port}`);
  });
}

module.exports = app;
