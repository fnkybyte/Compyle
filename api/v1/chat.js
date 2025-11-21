// api/v1/chat.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { provider, model, messages, options } = req.body || {};

    // Build upstream body (non-streaming)
    const body = {
      model: provider ? `${provider}/${model}` : model,
      messages,
      stream: false, // IMPORTANT: non-streaming for serverless reliability
      ...options,
    };

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      return res.status(502).json({ error: `Upstream ${upstream.status}`, body: txt });
    }

    // Upstream returns JSON — forward as-is
    const data = await upstream.json();
    // If OpenRouter returns choices with content tokens (or text), adapt as needed.
    return res.status(200).json(data);
  } catch (err) {
    console.error('chat proxy error', err);
    res.status(502).json({ error: 'Failed to proxy chat' });
  }
}
