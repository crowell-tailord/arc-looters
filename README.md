# Arc Raiders Loot Catalog

This repository now hosts a Vite-powered React catalog that surfaces Arc Raiders loot in a responsive grid and a detail modal. The 
`src/data/loot.json` file ships with a short sample dataset, and the UI sorts loot by sell value while exposing each item's recycle parts.

## Development

1. Install dependencies with `npm install`.
2. Launch the dev server via `npm run dev` (default port 5173).
3. Build for production with `npm run build` and preview the result with `npm run preview`.

## Updating Loot Data

The scraper relies on Node 18+ so it can use the native `fetch` API.

`scripts/fetchLoot.js` gathers each item’s page by following the first `/wiki/` link in the table row, scrapes that page for the canonical `og:image` or infobox thumbnail, and only falls back to the row’s local image attributes when the detail page lacks one. When a thumbnail still points to a file page, the script rewrites it via `Special:FilePath` so every entry preserves a usable image URL.

```bash
npm run fetch-loot
```

The scraper requires network access and depends on `node-html-parser`. If it fails because the wiki page format changes, inspect the script and adjust header heuristics or selectors accordingly before re-running.
