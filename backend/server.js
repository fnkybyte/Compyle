require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT || 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// In-memory cache for models
let modelsCache = {
  data: null,
  lastFetched: 0,
};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// API routes
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Models endpoint
apiRouter.get('/models', async (req, res) => {
  const now = Date.now();
  if (modelsCache.data && (now - modelsCache.lastFetched < CACHE_DURATION)) {
    return res.status(200).json(modelsCache.data);
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API responded with ${response.status}`);
    }

    const data = await response.json();
    modelsCache = {
      data: data,
      lastFetched: now,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Failed to fetch models from OpenRouter:', error);
    res.status(502).json({ error: 'Failed to fetch models from upstream service.' });
  }
});

// TODO: Implement /chat endpoint

app.use('/api/v1', apiRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
