// Formatting helpers. Graph API returns every metric as a string; money fields land in two
// different units depending on the field, so keep the conversions in one place.

export function money(value: string | null | undefined, currency: string, minorUnits = false): string {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  const amount = minorUnits ? n / 100 : n
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function integer(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

export function percent(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  // Graph API already returns CTR as a percentage number (e.g. "2.47" => 2.47%).
  return `${n.toFixed(2)}%`
}

export function toNumber(value: string | null | undefined): number {
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

const STATUS_TONE: Record<string, 'live' | 'paused' | 'muted'> = {
  ACTIVE: 'live',
  PAUSED: 'paused',
  ARCHIVED: 'muted',
  DELETED: 'muted',
}

export function statusTone(status: string): 'live' | 'paused' | 'muted' {
  return STATUS_TONE[status] ?? 'muted'
}

export function statusLabel(status: string): string {
  const tone = statusTone(status)
  return tone === 'live' ? 'Active' : tone === 'paused' ? 'Paused' : 'Archived'
}

// "OUTCOME_SALES" -> "Sales", "LINK_CLICKS" -> "Link Clicks"
export function humanizeObjective(objective: string | null): string {
  if (!objective) return '—'
  return objective
    .replace(/^OUTCOME_/, '')
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
