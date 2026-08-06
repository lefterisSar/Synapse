# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Synapse is a **read-only** dashboard over the Meta Marketing (Ads) Graph API. Two independently-run
parts:

- **Backend** — Spring Boot (Java 21), repo root. Talks to the Graph API, exposes a small REST API under `/api`.
- **Frontend** — Vite + React 19 + TypeScript, in `frontend/`. Consumes that REST API.

Auth is a long-lived **System User token** with the `ads_read` scope (not the OAuth login redirect flow),
supplied via env vars. There is no token-refresh flow and no Meta App Review dependency by design — see
`README.md` for the rationale.

## Commands

Backend (repo root):

```bash
./gradlew bootRun          # run on :8080; reads .env automatically (spring-dotenv), works from IntelliJ too
./gradlew build            # compile + test + assemble jar
./gradlew test             # run tests (none exist yet)
```

Frontend (`frontend/`):

```bash
npm install                # first time only
npm run dev                # dev server on :5173, proxies /api -> :8080
npm run build              # tsc --noEmit type-check + production build to dist/
npm run typecheck          # type-check only
```

Run **both** for the full app. `API.md` has copy-paste curls for exercising every endpoint (including
hitting Meta's Graph API directly to sanity-check a token).

## Configuration

- Copy `.env.example` → `.env`, set `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID`. **No spaces around `=`** —
  spring-dotenv is literal. `.env` is gitignored; never commit tokens.
- `META_AD_ACCOUNT_ID` accepts `1234567890` or `act_1234567890` (normalized in `MetaProperties`).
- Graph API version is `meta.api-version` in `src/main/resources/application.yml` (currently `v23.0`) — bump it
  when Meta ships a new version, not in code.
- `CORS_ALLOWED_ORIGINS` (comma-separated) overrides the allowed frontend origins; defaults cover the Vite/CRA dev ports.

## Architecture

Backend request flow is a thin three-layer chain:

```
DashboardController (@RestController /api)  ← HTTP, input defaults, ResponseEntity
  → MarketingService                        ← unwraps Graph list envelope, validates ids, applies defaults
    → MetaMarketingClient                   ← builds Graph API calls, maps errors to MetaApiException
      → Graph API (via metaRestClient bean)
```

- **`meta/dto/`** records mirror the Graph API JSON verbatim (snake_case field names). `GraphListResponse<T>`
  is the `{ "data": [...] }` envelope; `MarketingService` calls `.data()` to unwrap it. Frontend `api.ts`
  types deliberately match these snake_case shapes.
- **Ad previews are rendered to PNG server-side** by `PreviewRenderer` (Playwright headless Chromium), not
  embedded as Meta's iframe in the browser. Meta's `preview_iframe.php` is cross-origin facebook.com content:
  in the browser its GDPR cookie-consent wall can't be dismissed and its URL leaks the access token.
  Rendering it headless lets us click the consent dialog and screenshot the ad — identical pixels, no wall,
  token stays server-side. `GET /api/ads/{id}/preview.png` is what the UI's `<img>` loads; the older
  `/preview` (raw iframe HTML) endpoint still exists but the frontend no longer uses it.
- **All endpoints are GET and read-only.** `WebConfig` restricts CORS to `GET`. Adding a write path means
  reconsidering the whole auth/permission model.
- **Errors:** `MetaMarketingClient.execute(...)` wraps every Graph call and throws `MetaApiException` carrying
  Meta's human-readable message; `ApiExceptionHandler` renders it as `502 {"error": "..."}`. Bad input
  (`IllegalArgumentException`) → `400`.

## Non-obvious things that will bite you

These are load-bearing; don't "clean them up" without understanding why:

- **Graph API labels JSON responses `Content-Type: text/javascript`.** `RestClientConfig` adds that media type
  to the Jackson converter or every response fails to deserialize. Keep it.
- **Field-expansion braces.** Graph `fields=creative{...}` collides with Spring's `{...}` URI-template syntax
  ("Not enough variable values"). The fix used in `MetaMarketingClient`: pass the fields string as a URI
  *variable* (`.queryParam("fields", "{fields}").build(Map.of("fields", AD_FIELDS))`) so the braces are encoded
  as a literal. Follow this pattern for any expanded-field query.
- **Numeric-id validation.** `MarketingService` rejects non-numeric ids (regex) before they reach a Graph path,
  and `adFormat` is checked against an allowlist (`AD_FORMATS`). Keep the frontend `AD_FORMATS` in `api.ts` a
  subset of the backend set.
- **Image proxy + SSRF guard.** Creative thumbnails live on `fbcdn.net`, which browser ad blockers/tracking
  protection block. `GET /api/ads/{id}/thumbnail` fetches the image server-side (same-origin, blocker-proof);
  `fetchImage` host-checks the URL to `fbcdn.net`/`facebook.com` to prevent SSRF. `full_picture` needs
  `pages_read_engagement` (outside `ads_read`), so it silently falls back to the small thumbnail.
- **Preview iframe carries the access token** in its `src`. This is why the UI uses the server-rendered
  `/preview.png` instead — the token never reaches the browser. The raw `/preview` (iframe HTML) endpoint
  still exposes it, so don't route the frontend back to it.
- **`PreviewRenderer` is single-threaded on purpose.** Playwright objects are thread-affine — every call must
  come from the thread that created the `Playwright` instance — so all renders run on one owned daemon thread
  and serialize. Don't call it from arbitrary request threads. Widen to a small pool (one Playwright each) only
  if throughput demands it. First render auto-downloads Chromium (~150MB, cached).
- **Empty responses are normal.** The account-level `/api/insights` returns an empty body (not `[]`) when Meta
  has no data for the window; `api.ts` and `MarketingService` handle that as `null`. An account with no
  campaigns legitimately returns empty everything — that's a data condition, not a bug.

## Frontend notes

- Two tabs, deep-linkable via `#overview` / `#previews` (Overview = KPIs + campaigns table; Ad Previews =
  campaigns expand to ad-card grids with live Meta preview iframes). See `frontend/README.md`.
- The design system (fonts, palette, component classes) lives entirely in `src/index.css`.
- In dev, Vite proxies `/api` → `:8080` (no CORS needed). In a production build there is no proxy: set
  `VITE_API_BASE_URL` to the deployed backend and add that origin to the backend's `CORS_ALLOWED_ORIGINS`.
