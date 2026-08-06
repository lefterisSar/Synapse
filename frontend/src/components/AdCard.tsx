import { useState } from 'react'
import { AD_FORMATS, api, type Ad } from '../api'
import { statusLabel, statusTone } from '../format'
import { ScaledPreview } from './ScaledPreview'
import { StatusDot } from './ui'

interface PreviewState {
  loading: boolean
  error?: string
  body?: string | null
}

const DEFAULT_FORMAT = 'MOBILE_FEED_STANDARD'

export function AdCard({ ad }: { ad: Ad }) {
  const [imgFailed, setImgFailed] = useState(false)
  const [format, setFormat] = useState(DEFAULT_FORMAT)
  const [showLive, setShowLive] = useState(false)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  async function loadPreview(fmt: string) {
    setPreview({ loading: true })
    try {
      // The iframe src carries the access token (that's how Meta's preview edge works) — fine for a
      // local read-only dashboard; proxy previews server-side for a public deploy.
      const r = await api.adPreview(ad.id, fmt)
      setPreview({ loading: false, body: r.body })
    } catch (e) {
      setPreview({ loading: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  function toggleLive() {
    const next = !showLive
    setShowLive(next)
    if (next && !preview) loadPreview(format)
  }

  function changeFormat(fmt: string) {
    setFormat(fmt)
    if (showLive) loadPreview(fmt)
  }

  return (
    <article className="adcard reveal">
      <div className="adcard__media">
        {imgFailed ? (
          <div className="adcard__noimg" aria-hidden>
            ▢
          </div>
        ) : (
          // Proxied through our backend → loads same-origin, so ad blockers / tracking protection
          // can't block it, and no fbcdn expiry issues.
          <img
            className="adcard__img"
            src={`/api/ads/${ad.id}/thumbnail`}
            alt={ad.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      <div className="adcard__body">
        <div className="adcard__top">
          <span className="adcard__name" title={ad.name}>
            {ad.name}
          </span>
          <StatusDot tone={statusTone(ad.status)} label={statusLabel(ad.status)} />
        </div>

        <div className="adcard__actions">
          <button className="btn btn--ghost" onClick={toggleLive}>
            {showLive ? 'Hide preview' : 'Live preview'}
          </button>
          {ad.preview_shareable_link && (
            <a
              className="btn btn--ghost"
              href={ad.preview_shareable_link}
              target="_blank"
              rel="noreferrer"
            >
              Open ↗
            </a>
          )}
        </div>

        {showLive && (
          <div className="adcard__live">
            <select
              className="select__control select__control--sm"
              value={format}
              onChange={(e) => changeFormat(e.target.value)}
              aria-label="Preview format"
            >
              {AD_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            {preview?.loading && <div className="adcard__loadingtxt">Rendering…</div>}
            {preview?.error && (
              <div className="adcard__hint">Preview unavailable: {preview.error}</div>
            )}
            {preview?.body === null && !preview.loading && (
              <div className="adcard__hint">Meta returned no preview for this format.</div>
            )}
            {preview?.body && <ScaledPreview html={preview.body} />}
          </div>
        )}
      </div>
    </article>
  )
}
