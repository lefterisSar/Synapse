import { useState } from 'react'
import { api, type Campaign } from '../api'
import { AdCard } from '../components/AdCard'
import { EmptyState, Skeleton, StatusDot } from '../components/ui'
import { statusLabel, statusTone } from '../format'
import { useAsync } from '../hooks'

export function PreviewsTab({ reloadKey }: { reloadKey: number }) {
  const campaigns = useAsync(() => api.campaigns(), [reloadKey])

  if (campaigns.loading) {
    return (
      <section className="block">
        <div className="camp-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="camp">
              <div className="camp__head camp__head--static">
                <Skeleton w={220} h={16} />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (campaigns.error) {
    return <EmptyState glyph="⚠" title="Couldn't load campaigns" hint={campaigns.error} />
  }

  if (!campaigns.data || campaigns.data.length === 0) {
    return (
      <EmptyState
        glyph="◎"
        title="No campaigns to preview"
        hint="Ad previews live under campaigns. Once this account has campaigns with ads, they'll show up here."
      />
    )
  }

  return (
    <section className="block">
      <div className="block__head">
        <h2 className="block__title">Ad previews</h2>
        <span className="block__sub">{campaigns.data.length} campaigns</span>
      </div>
      <p className="note">
        Previews render live from facebook.com. If a card stays blank, an ad blocker or tracking
        protection is likely blocking it — allowlist this site, or use “Open&nbsp;↗”.
      </p>
      <div className="camp-list">
        {campaigns.data.map((c, i) => (
          <CampaignSection key={c.id} campaign={c} defaultOpen={i === 0} />
        ))}
      </div>
    </section>
  )
}

function CampaignSection({ campaign, defaultOpen }: { campaign: Campaign; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="camp">
      <button className="camp__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`camp__chev${open ? ' camp__chev--open' : ''}`} aria-hidden>
          ▸
        </span>
        <span className="camp__name">{campaign.name}</span>
        <StatusDot tone={statusTone(campaign.status)} label={statusLabel(campaign.status)} />
        <span className="camp__id">{campaign.id}</span>
      </button>
      {open && <CampaignAds campaignId={campaign.id} />}
    </div>
  )
}

function CampaignAds({ campaignId }: { campaignId: string }) {
  const ads = useAsync(() => api.adsForCampaign(campaignId), [campaignId])

  if (ads.loading) {
    return (
      <div className="ad-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="adcard">
            <Skeleton w="100%" h={150} />
            <div className="adcard__body">
              <Skeleton w="70%" h={14} />
              <div style={{ marginTop: 10 }}>
                <Skeleton w="90%" h={12} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (ads.error) {
    return <div className="camp__msg camp__msg--err">{ads.error}</div>
  }

  if (!ads.data || ads.data.length === 0) {
    return <div className="camp__msg">No ads in this campaign.</div>
  }

  return (
    <div className="ad-grid">
      {ads.data.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  )
}
