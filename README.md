# Synapse

A read-only dashboard over the **Meta Marketing (Ads) API**. This repo is the **Spring Boot backend**
(Java 21) that talks to the Graph API and exposes a small REST API for a separate JS frontend.

## 1. Get Meta credentials (one-time, in the browser)

1. Create an app at <https://developers.facebook.com/apps> — type **Business**.
2. Add the **Marketing API** product to the app.
3. In <https://business.facebook.com/settings> → **System Users**, create one and **assign your ad account**
   to it with *View Performance* access.
4. **Generate a token** for that system user: select the app, scope **`ads_read`**, expiration **Never**.
5. Note your **Ad Account ID** (Business Settings → Ad Accounts, looks like `act_1234567890`).

`ads_read` **Standard Access** is enough for accounts your business owns — no Meta App Review required.

## 2. Configure & run the backend

```bash
cp .env.example .env          # then paste your token + ad account id (no spaces around '=')
./gradlew bootRun             # reads .env automatically (spring-dotenv) — works from IntelliJ too
```

Verify:

```bash
curl localhost:8080/api/status                 # {"configured":true}
curl localhost:8080/api/campaigns
curl "localhost:8080/api/insights?datePreset=last_30d"
curl "localhost:8080/api/insights/by-campaign?datePreset=last_7d"
```

## Endpoints

| Method & path                       | Returns                                             |
|-------------------------------------|-----------------------------------------------------|
| `GET /api/status`                   | `{ "configured": bool }` — credential check         |
| `GET /api/account`                  | Account name, currency, timezone                    |
| `GET /api/campaigns`                | Campaigns with status, objective, budgets           |
| `GET /api/insights?datePreset=`     | Account-level metrics (impressions, spend, ctr, …)  |
| `GET /api/insights/by-campaign`     | Same metrics, one row per campaign                  |
| `GET /api/campaigns/{id}/ads`       | Ads in a campaign (creative + shareable link)       |
| `GET /api/ads/{id}/preview?adFormat=` | Embeddable `<iframe>` preview of an ad             |
| `GET /api/ads/{id}/thumbnail`       | Creative thumbnail, proxied (dodges ad blockers)    |

`datePreset` accepts Graph API presets: `today`, `yesterday`, `last_7d`, `last_30d`, `this_month`, etc.

## Notes

- Never commit `.env` or tokens (already gitignored).
- Update the Graph API version in `application.yml` (`meta.api-version`) when Meta ships a new one.
- CORS allows `http://localhost:5173` / `:3000` by default — override with `CORS_ALLOWED_ORIGINS`.
