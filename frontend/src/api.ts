// Typed client for the Synapse backend. Field names are snake_case to mirror exactly
// what the Graph API (and therefore our Spring controller) returns.

export interface Account {
  id: string
  name: string
  currency: string
  account_status: number
  amount_spent: string
  timezone_name: string
}

export interface Campaign {
  id: string
  name: string
  status: string
  objective: string | null
  daily_budget: string | null
  lifetime_budget: string | null
}

export interface Insight {
  impressions: string
  clicks: string
  spend: string
  cpc: string
  cpm: string
  ctr: string
  reach: string
  campaign_id?: string
  campaign_name?: string
  date_start?: string
  date_stop?: string
}

export interface Status {
  configured: boolean
}

// In dev, Vite proxies /api to the backend, so a relative base works same-origin.
// In prod, point VITE_API_BASE_URL at the deployed backend.
const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {}

async function get<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } })
  } catch {
    throw new ApiError(
      'Cannot reach the backend. Is it running on http://localhost:8080? (./gradlew bootRun)',
    )
  }

  const text = await res.text()
  // The account-level /api/insights returns an empty body when Meta has no data for the window.
  const body = text.length > 0 ? JSON.parse(text) : null

  if (!res.ok) {
    const message =
      body && typeof body.error === 'string' ? body.error : `Request failed (${res.status})`
    throw new ApiError(message)
  }
  return body as T
}

export const api = {
  status: () => get<Status>('/api/status'),
  account: () => get<Account>('/api/account'),
  campaigns: () => get<Campaign[]>('/api/campaigns'),
  accountInsights: (datePreset: string) =>
    get<Insight | null>(`/api/insights?datePreset=${datePreset}`),
  insightsByCampaign: (datePreset: string) =>
    get<Insight[]>(`/api/insights/by-campaign?datePreset=${datePreset}`),
}

export interface DatePreset {
  value: string
  label: string
}

export const DATE_PRESETS: DatePreset[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7d', label: 'Last 7 days' },
  { value: 'last_14d', label: 'Last 14 days' },
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'last_90d', label: 'Last 90 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'maximum', label: 'Maximum' },
]
