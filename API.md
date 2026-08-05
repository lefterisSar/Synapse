# Synapse API — testing guide

Copy-paste curls to exercise the backend. All endpoints are **read-only** and return JSON.

## 0. Start the server first

```bash
cd ~/IdeaProjects/Synapse
./gradlew bootRun               # reads .env automatically; leave running, use a 2nd terminal for curls
```

Base URL: **`http://localhost:8080`**

> Tip: pipe any curl into `jq` for pretty output, e.g. `curl -s ... | jq`. (Install with `brew install jq` if you don't have it.)

---

## 1. `GET /api/status` — is the backend wired up?

Cheapest check. Confirms the app read your token + ad account id. Doesn't call Meta.

```bash
curl -s http://localhost:8080/api/status
```

**You'll see:**
```json
{"configured":true}
```
`false` means `META_ACCESS_TOKEN` / `META_AD_ACCOUNT_ID` weren't loaded — re-run the `source .env` step.

---

## 2. `GET /api/campaigns` — list your campaigns

Every campaign in the ad account with its status, objective, and budgets.

```bash
curl -s http://localhost:8080/api/campaigns
```

**With data:**
```json
[
  {
    "id": "120200000000000000",
    "name": "Summer Sale - Conversions",
    "status": "ACTIVE",
    "objective": "OUTCOME_SALES",
    "daily_budget": "5000",
    "lifetime_budget": null
  }
]
```
**Playground/empty account:** `[]`

> Budgets are **strings in minor currency units** — `"5000"` = €50.00 for a EUR account.

---

## 3. `GET /api/insights` — account-level performance

One aggregate row of metrics for the whole account over a time window.

```bash
# default window is last 30 days
curl -s "http://localhost:8080/api/insights"

# pick a window with datePreset
curl -s "http://localhost:8080/api/insights?datePreset=last_7d"
curl -s "http://localhost:8080/api/insights?datePreset=today"
```

**With data:**
```json
{
  "impressions": "12840",
  "clicks": "318",
  "spend": "142.57",
  "cpc": "0.448",
  "cpm": "11.10",
  "ctr": "2.47",
  "reach": "9021"
}
```
**Playground/empty account:** empty response (no rows for the window).

---

## 4. `GET /api/insights/by-campaign` — performance per campaign

Same metrics as above, but one row per campaign (adds `campaign_id` / `campaign_name`).

```bash
curl -s "http://localhost:8080/api/insights/by-campaign?datePreset=last_30d"
```

**With data:**
```json
[
  {
    "impressions": "8000",
    "clicks": "210",
    "spend": "98.20",
    "cpc": "0.467",
    "cpm": "12.27",
    "ctr": "2.62",
    "reach": "6100",
    "campaign_id": "120200000000000000",
    "campaign_name": "Summer Sale - Conversions",
    "date_start": "2026-07-06",
    "date_stop": "2026-08-04"
  }
]
```
**Playground/empty account:** `[]`

---

## 5. Ads & previews (powers the **Ad Previews** tab)

**Ads in a campaign** — `GET /api/campaigns/{campaignId}/ads`

```bash
curl -s http://localhost:8080/api/campaigns/120251232788860391/ads
```
```json
[
  {
    "id": "120251232788870391",
    "name": "Ad_1",
    "status": "PAUSED",
    "adset_id": "120251232788880391",
    "creative": { "id": "916…", "thumbnail_url": "https://…jpg", "title": null, "body": null,
                  "object_type": "SHARE" },
    "preview_shareable_link": "https://fb.me/…"
  }
]
```

**Embeddable preview for one ad** — `GET /api/ads/{adId}/preview?adFormat=…`

```bash
curl -s "http://localhost:8080/api/ads/120251232788870391/preview?adFormat=DESKTOP_FEED_STANDARD"
```
```json
{ "adFormat": "DESKTOP_FEED_STANDARD", "body": "<iframe src=\"https://…preview_iframe.php…\"></iframe>" }
```

`adFormat` ∈ `DESKTOP_FEED_STANDARD`, `MOBILE_FEED_STANDARD`, `INSTAGRAM_STANDARD`,
`INSTAGRAM_STORY`, `FACEBOOK_STORY_MOBILE`, `RIGHT_COLUMN_STANDARD`. Ids must be numeric
(otherwise **HTTP 400**). **Security note:** the preview iframe src carries the access token — fine
for a local read-only dashboard; a public deploy should proxy previews server-side so the token
never reaches the browser.

---

## `datePreset` values you can use

`today`, `yesterday`, `last_3d`, `last_7d`, `last_14d`, `last_28d`, `last_30d`, `last_90d`,
`this_week_mon_today`, `this_month`, `last_month`, `this_quarter`, `last_quarter`,
`this_year`, `last_year`, `maximum`.

---

## Errors — what they look like

**App can't reach Meta / bad token / missing scope** → HTTP 502:
```json
{"error":"Meta Graph API error: Invalid OAuth access token - Cannot parse access token"}
```

**Credentials not loaded** → HTTP 502:
```json
{"error":"Meta API is not configured. Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID."}
```

To see the HTTP status code alongside the body:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/campaigns
```

---

## Bonus: hit Meta directly (no backend needed)

Useful for sanity-checking the token itself. Uses the env vars you sourced above; the token
goes in a header so it's not logged in the URL.

```bash
# account overview
curl -s "https://graph.facebook.com/v23.0/act_${META_AD_ACCOUNT_ID}?fields=name,currency,account_status,amount_spent,timezone_name" \
  -H "Authorization: Bearer ${META_ACCESS_TOKEN}"

# raw campaigns straight from Meta
curl -s "https://graph.facebook.com/v23.0/act_${META_AD_ACCOUNT_ID}/campaigns?fields=id,name,status,objective" \
  -H "Authorization: Bearer ${META_ACCESS_TOKEN}"

# verify the token's scopes include ads_read
curl -s "https://graph.facebook.com/v23.0/me/permissions" \
  -H "Authorization: Bearer ${META_ACCESS_TOKEN}"
```
