# Synapse — dashboard (frontend)

React + TypeScript + Vite dashboard for the Meta Ads read-only API. Talks to the Spring Boot
backend in the repo root. In dev, Vite proxies `/api` → `http://localhost:8080`, so there's no
CORS setup and no base URL to configure.

## Run it

Two terminals:

```bash
# 1) backend (repo root)
cd ..
set -a; source .env; set +a
./gradlew bootRun

# 2) frontend (this folder)
npm install          # first time only
npm run dev          # http://localhost:5173
```

Open **http://localhost:5173**. If the header shows **Backend offline**, the backend isn't up on
:8080. If it shows **Not configured**, `META_ACCESS_TOKEN` / `META_AD_ACCOUNT_ID` aren't set.

## What it shows

- **Header** — account name, currency, connection status, date-window selector, refresh.
- **Performance** — Spend / Impressions / Clicks / CTR / CPC / Reach for the selected window
  (`/api/insights`). Figures animate on load; show `—` when there's no delivery.
- **Campaigns** — one row per campaign with status, objective, daily budget, impressions, and a
  spend bar (`/api/campaigns` joined with `/api/insights/by-campaign`).

Your Playground account has no campaigns/spend yet, so KPIs read `—` and the campaign table shows
an empty state. Point the backend at an account with active campaigns to see live numbers.

## Scripts

| Command           | What it does                                  |
|-------------------|-----------------------------------------------|
| `npm run dev`     | Dev server with `/api` proxy + hot reload     |
| `npm run build`   | Type-check (`tsc`) + production build to `dist/` |
| `npm run preview` | Serve the production build locally            |
| `npm run typecheck` | Type-check only                             |

## Layout

```
src/
├── api.ts            typed fetch client + response types + date presets
├── format.ts         money / integer / percent formatting (handles unit quirks)
├── hooks.ts          useAsync (fetch state) + useCountUp (figure animation)
├── App.tsx           data orchestration + offline / not-configured / empty / error states
├── index.css         the design system (fonts, palette, components)
└── components/       Header, KpiGrid, CampaignsTable, ui (status/banner/empty/skeleton)
```

## Prod note

There's no proxy in a production build. Set `VITE_API_BASE_URL` to the deployed backend URL at
build time, and make sure that origin is in the backend's `CORS_ALLOWED_ORIGINS`.
