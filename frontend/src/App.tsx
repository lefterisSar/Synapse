import { useMemo, useState } from 'react'
import { api, DATE_PRESETS } from './api'
import { Banner, EmptyState } from './components/ui'
import { CampaignsTable } from './components/CampaignsTable'
import { Header } from './components/Header'
import { KpiGrid } from './components/KpiGrid'
import { useAsync } from './hooks'

export default function App() {
  const [preset, setPreset] = useState('last_30d')
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  const status = useAsync(() => api.status(), [reloadKey])
  const account = useAsync(() => api.account(), [reloadKey])
  const campaigns = useAsync(() => api.campaigns(), [reloadKey])
  const insight = useAsync(() => api.accountInsights(preset), [preset, reloadKey])
  const byCampaign = useAsync(() => api.insightsByCampaign(preset), [preset, reloadKey])

  // The /status endpoint never calls Meta, so its only failure mode is the backend being down.
  const offline = !!status.error
  const configured = status.data?.configured === true
  const currency = account.data?.currency ?? 'USD'
  const presetLabel = useMemo(
    () => DATE_PRESETS.find((p) => p.value === preset)?.label ?? preset,
    [preset],
  )

  const refreshing =
    status.loading || account.loading || insight.loading || byCampaign.loading

  const noDelivery = configured && !insight.loading && !insight.error && insight.data == null

  return (
    <div className="app">
      <div className="grain" aria-hidden />
      <div className="glow" aria-hidden />

      <Header
        account={account.data}
        status={status.data}
        offline={offline}
        preset={preset}
        onPresetChange={setPreset}
        onReload={reload}
        refreshing={refreshing}
      />

      <main className="content">
        {offline && (
          <Banner title="Can't reach the backend">
            Start it with <code>./gradlew bootRun</code> (after{' '}
            <code>set -a; source .env; set +a</code>), then hit refresh. The dev server proxies{' '}
            <code>/api</code> to <code>http://localhost:8080</code>.
          </Banner>
        )}

        {!offline && status.data && !configured && (
          <Banner tone="info" title="Backend is up, but Meta credentials aren't configured">
            Set <code>META_ACCESS_TOKEN</code> and <code>META_AD_ACCOUNT_ID</code> in{' '}
            <code>.env</code>, restart <code>bootRun</code>, and refresh.
          </Banner>
        )}

        {!offline && configured && (
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
                  No delivery recorded for this window — figures read zero until an active
                  campaign spends.
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
        )}
      </main>

      <footer className="footer">
        <span>Synapse</span>
        <span className="footer__dot">·</span>
        <span>Meta Marketing API · read-only</span>
      </footer>
    </div>
  )
}
