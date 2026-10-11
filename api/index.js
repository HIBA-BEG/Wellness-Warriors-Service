// Vercel serverless entry. The TypeScript is compiled to dist/ by
// `npm run build` (see vercel.json); this file only forwards to it.
const handler = require('../dist/vercel-handler').default;

module.exports = handler;
