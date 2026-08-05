import { api, DATE_PRESETS } from '../api'
import { Banner, EmptyState } from '../components/ui'
import { CampaignsTable } from '../components/CampaignsTable'
import { KpiGrid } from '../components/KpiGrid'
import { useAsync } from '../hooks'

interface Props {
  preset: string
  reloadKey: number
  currency: string
}

export function OverviewTab({ preset, reloadKey, currency }: Props) {
  const campaigns = useAsync(() => api.campaigns(), [reloadKey])
  const insight = useAsync(() => api.accountInsights(preset), [preset, reloadKey])
  const byCampaign = useAsync(() => api.insightsByCampaign(preset), [preset, reloadKey])

  const presetLabel = DATE_PRESETS.find((p) => p.value === preset)?.label ?? preset
  const noDelivery = !insight.loading && !insight.error && insight.data == null

  return (
    <>
      {(insight.error || byCampaign.error || campaigns.error) && (
        <Banner title="Meta returned an error">
          {insight.error ?? byCampaign.error ?? campaigns.error}
        </Banner>
      )}

      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Performance</h2>
          <span className="block__sub">{presetLabel}</span>
        </div>
        {noDelivery && (
          <p className="note">
            No delivery recorded for this window — figures read zero until an active campaign
            spends.
          </p>
        )}
        <KpiGrid insight={insight.data} currency={currency} loading={insight.loading} />
      </section>

      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Campaigns</h2>
          <span className="block__sub">
            {campaigns.data ? `${campaigns.data.length} total` : ' '}
          </span>
        </div>
        {campaigns.error ? (
          <EmptyState glyph="⚠" title="Couldn't load campaigns" hint={campaigns.error} />
        ) : (
          <CampaignsTable
            campaigns={campaigns.data}
            byCampaign={byCampaign.data}
            currency={currency}
            loading={campaigns.loading}
          />
        )}
      </section>
    </>
  )
}
