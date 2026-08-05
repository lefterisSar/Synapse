import type { Insight } from '../api'
import { integer, money, percent, toNumber } from '../format'
import { useCountUp } from '../hooks'
import { Skeleton } from './ui'

interface CardDef {
  key: string
  label: string
  unit: string
  value: number | null
  format: (n: number) => string
  featured?: boolean
}

function KpiCard({ def, index }: { def: CardDef; index: number }) {
  const animated = useCountUp(def.value ?? 0)
  const display = def.value == null ? '—' : def.format(animated)

  return (
    <article
      className={`kpi reveal${def.featured ? ' kpi--featured' : ''}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="kpi__label">{def.label}</div>
      <div className="kpi__value">{display}</div>
      <div className="kpi__unit">{def.unit}</div>
    </article>
  )
}

function KpiSkeleton({ index }: { index: number }) {
  return (
    <article className="kpi reveal" style={{ animationDelay: `${index * 70}ms` }}>
      <Skeleton w={70} h={11} />
      <div style={{ margin: '18px 0 10px' }}>
        <Skeleton w="70%" h={34} />
      </div>
      <Skeleton w={44} h={11} />
    </article>
  )
}

export function KpiGrid({
  insight,
  currency,
  loading,
}: {
  insight: Insight | null | undefined
  currency: string
  loading: boolean
}) {
  if (loading) {
    return (
      <section className="kpi-grid">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <KpiSkeleton key={i} index={i} />
        ))}
      </section>
    )
  }

  const i = insight ?? null
  const val = (field: keyof Insight): number | null =>
    i && i[field] != null ? toNumber(i[field] as string) : null

  const cards: CardDef[] = [
    {
      key: 'spend',
      label: 'Spend',
      unit: currency,
      value: val('spend'),
      format: (n) => money(String(n), currency),
      featured: true,
    },
    { key: 'impressions', label: 'Impressions', unit: 'total', value: val('impressions'), format: (n) => integer(String(n)) },
    { key: 'clicks', label: 'Clicks', unit: 'total', value: val('clicks'), format: (n) => integer(String(n)) },
    { key: 'ctr', label: 'CTR', unit: 'click-through', value: val('ctr'), format: (n) => percent(String(n)) },
    { key: 'cpc', label: 'CPC', unit: `${currency} / click`, value: val('cpc'), format: (n) => money(String(n), currency) },
    { key: 'reach', label: 'Reach', unit: 'people', value: val('reach'), format: (n) => integer(String(n)) },
  ]

  return (
    <section className="kpi-grid">
      {cards.map((def, idx) => (
        <KpiCard key={def.key} def={def} index={idx} />
      ))}
    </section>
  )
}
