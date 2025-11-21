// api/v1/models.js
import fetch from 'node-fetch';

let cache = { ts: 0, data: null };
const CACHE_MS = 10 * 60 * 1000; // 10 minutes

function mapModel(raw) {
  // Example mapper: adjust to upstream shape from OpenRouter
  // raw.id or raw.name may contain "provider/model"
  const id = raw.id || raw.name || '';
  const parts = id.split('/');
  const provider = parts.length > 1 ? parts[0] : raw.provider || 'openrouter';
  const model = parts.length > 1 ? parts.slice(1).join('/') : id;

  return {
    id: id,
    provider,
    model,
    label: raw.title || raw.display_name || model,
    free: raw.free === true || (raw.tiers && raw.tiers.includes('free')) || false,
    maxTokens: raw.max_tokens || raw.context || null,
    contextSize: raw.context || raw.max_tokens || null,
    description: raw.description || '',
    logo: `/model-icons/${(model.replace(/\W+/g,'-')).toLowerCase()}.png`, // best-effort local path
    params: {
      temperature: 0.7,
      maxLength: 2048
    },
    streaming: raw.streaming_supported === true || false
  };
}

export default async function handler(req, res) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set' });

  const now = Date.now();
  if (cache.data && (now - cache.ts < CACHE_MS)) {
    return res.json({ source: 'cache', models: cache.data });
  }

  try {
    const r = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${key}` }
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('OpenRouter models fetch failed', r.status, text);
      return res.status(502).json({ error: 'Upstream error', details: text });
    }

    const raw = await r.json();
    // raw may be array or object - adapt accordingly
    const items = Array.isArray(raw) ? raw : (raw.models || raw.data || []);
    const mapped = items.map(mapModel);

    cache = { ts: now, data: mapped };
    return res.json({ source: 'upstream', models: mapped });
  } catch (err) {
    console.error('models handler error', err);
    return res.status(502).json({ error: 'Failed to fetch models' });
  }
}
