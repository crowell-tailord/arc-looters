# Arc Raiders Loot Catalog

This repository now hosts a Vite-powered React catalog that surfaces Arc Raiders loot in a responsive grid and a detail modal. The
`src/data/loot.json` file ships with a short sample dataset, and the UI sorts loot by sell value while exposing each item's recycle parts.

## Development

1. Install dependencies with `npm install`.
2. Local dev with API: run `npm run vercel:dev` (forces npm for the Vercel CLI) and open the URL it prints (usually `http://localhost:3000`). This serves the Vite app and `/api/report-issue` on the same origin.
3. Pure Vite dev (no local API): `npm run dev` (default port 4173). Set `VITE_API_BASE_URL` to your deployed API origin—or to `http://localhost:3000` while `vercel dev` is running in another terminal—if you need the feedback modal to work without the same-origin dev server.
4. Build for production with `npm run build` and preview the result with `npm run preview`.

## Feedback → Slack webhook

- Configure env vars: `SLACK_WEBHOOK_URL` (required) and `ALLOWED_ORIGINS` (comma separated).
- `/api/report-issue.js` is the serverless function that posts to Slack. In production it sits on the same origin as the site; set `VITE_API_BASE_URL` only if you host the API elsewhere.
- Origin checks and basic validation help reduce abuse.

## Deploying to Vercel

- `/api/report-issue.js` is a serverless function that mirrors the local server endpoint; Vercel will automatically route `/api/report-issue` to it.
- Set env vars in the Vercel dashboard: `SLACK_WEBHOOK_URL` (required), `ALLOWED_ORIGINS` (comma separated, e.g., `https://yourapp.vercel.app ,https://yourdomain.com`), and optionally `VITE_API_BASE_URL` if the API is on a different origin (leave blank if same origin).
- `vercel.json` is optional; Vercel will run `npm run build` and serve `dist` by default. Use `vercel dev` locally to run the function and the site on one origin.

## Updating Loot Data

The scraper relies on Node 18+ so it can use the native `fetch` API.

`scripts/fetchLoot.js` gathers each item’s page by following the first `/wiki/` link in the table row, scrapes that page for the canonical `og:image` or infobox thumbnail, and only falls back to the row’s local image attributes when the detail page lacks one. When a thumbnail still points to a file page, the script rewrites it via `Special:FilePath` so every entry preserves a usable image URL.

```bash
npm run fetch-loot
```

The scraper requires network access and depends on `node-html-parser`. If it fails because the wiki page format changes, inspect the script and adjust header heuristics or selectors accordingly before re-running.
