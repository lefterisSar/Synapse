import { useState } from 'react'
import { api } from './api'
import { Banner } from './components/ui'
import { Header } from './components/Header'
import { Tabs, type TabKey } from './components/Tabs'
import { OverviewTab } from './tabs/OverviewTab'
import { PreviewsTab } from './tabs/PreviewsTab'
import { useAsync } from './hooks'

export default function App() {
  const [tab, setTab] = useState<TabKey>(() =>
    window.location.hash === '#previews' ? 'previews' : 'overview',
  )
  const changeTab = (t: TabKey) => {
    setTab(t)
    window.location.hash = t
  }
  const [preset, setPreset] = useState('last_30d')
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  // Shared across tabs and needed by the header.
  const status = useAsync(() => api.status(), [reloadKey])
  const account = useAsync(() => api.account(), [reloadKey])

  // The /status endpoint never calls Meta, so its only failure mode is the backend being down.
  const offline = !!status.error
  const configured = status.data?.configured === true
  const currency = account.data?.currency ?? 'USD'
  const refreshing = status.loading || account.loading

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
        showWindow={tab === 'overview'}
      />

      <Tabs tab={tab} onChange={changeTab} />

      <main className="content">
        {offline && (
          <Banner title="Can't reach the backend">
            Start it with <code>./gradlew bootRun</code> (or the Run button in IntelliJ), then hit
            refresh. The dev server proxies <code>/api</code> to <code>http://localhost:8080</code>.
          </Banner>
        )}

        {!offline && status.data && !configured && (
          <Banner tone="info" title="Backend is up, but Meta credentials aren't configured">
            Set <code>META_ACCESS_TOKEN</code> and <code>META_AD_ACCOUNT_ID</code> in{' '}
            <code>.env</code>, restart the backend, and refresh.
          </Banner>
        )}

        {!offline &&
          configured &&
          (tab === 'overview' ? (
            <OverviewTab preset={preset} reloadKey={reloadKey} currency={currency} />
          ) : (
            <PreviewsTab reloadKey={reloadKey} />
          ))}
      </main>

      <footer className="footer">
        <span>Synapse</span>
        <span className="footer__dot">·</span>
        <span>Meta Marketing API · read-only</span>
      </footer>
    </div>
  )
}
