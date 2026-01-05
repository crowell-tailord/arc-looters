# Arc Raiders Loot Catalog - Project Context

## Project Overview
**arc-loot** is a responsive web application that serves as a catalog for "Arc Raiders" game loot. It displays items in a grid, sorted by value or other metrics, and provides detailed information (recipes, rarity) via a modal. The project is designed to be deployed on Vercel.

## Tech Stack
*   **Frontend:** React 18, Vite 4
*   **Styling:** Standard CSS (imported in components)
*   **Backend (Serverless):** Vercel Serverless Functions (Node.js)
*   **Data Source:** Static JSON (`src/data/loot.json`) scraped from external wikis.
*   **Deployment:** Vercel

## Key Directories & Files

### Source Code (`src/`)
*   **`src/App.jsx`**: Main application component containing the loot grid, sorting logic, and modal handling.
*   **`src/data/loot.json`**: The core dataset containing item details (name, rarity, value, image URL, etc.).
*   **`src/App.css`**: Global styles for the application.

### Backend (`api/`)
*   **`api/report-issue.js`**: A Vercel Serverless Function that handles user feedback. It accepts POST requests and forwards data to a configured Webhook (likely Discord based on payload structure, though comments mention Slack).

### Scripts (`scripts/`)
*   **`scripts/fetchLoot.js`**: Node.js script to scrape loot data from the Arc Raiders Wiki and update `src/data/loot.json`.
*   **`scripts/add-local-image-property.js`**: Utility to manage local image references.

### Public Assets (`public/`)
*   **`public/assets/loot/`**: Stores local copies of item images.

## Setup & Development

### Installation
```bash
npm install
```

### Running Locally
**Option 1: Full Stack (Frontend + API)**
Requires Vercel CLI. This mimics the production environment.
```bash
npm run dev:vercel
# or
vercel dev
```

**Option 2: Frontend Only**
Faster for UI work, but the feedback API won't function without extra configuration.
```bash
npm run dev:vite
# or
npm run dev
```

### Building for Production
```bash
npm run build
```

### Updating Data
To scrape the latest loot data from the wiki:
```bash
npm run fetch-loot
```

## Architecture Notes

*   **Data Flow:** The app loads `loot.json` directly into the client bundle. State management is handled locally within React components (`useState`, `useMemo`).
*   **Images:** Images are primarily hosted remotely (wiki) but the app supports local fallbacks in `public/assets/loot`.
*   **Feedback System:** A custom form in the UI sends a POST request to `/api/report-issue`, which validates the origin and forwards the message to a webhook.

## Conventions
*   **Components:** Functional components with Hooks.
*   **Styling:** Plain CSS files imported into components.
*   **Environment Variables:**
    *   `WEBHOOK_URL`: URL for the feedback webhook.
    *   `ALLOWED_ORIGINS`: CORS configuration for the API.
    *   `VITE_API_BASE_URL`: (Optional) Overrides the API endpoint for local dev.
