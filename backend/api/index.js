// backend/api/index.js
// Vercel serverless wrapper for your existing server.js
// Exports the Express app so Vercel can run it as a serverless function.

const app = require('../server'); // path to your server.js (adjust if needed)
module.exports = app;
