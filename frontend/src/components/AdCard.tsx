import { useEffect, useState } from 'react'
import { AD_FORMATS, api, type Ad } from '../api'
import { statusLabel, statusTone } from '../format'
import { Skeleton, StatusDot } from './ui'

interface PreviewState {
  loading: boolean
  error?: string
  body?: string | null
}

// Compact, self-contained format that fits a card and shows the whole ad.
const DEFAULT_FORMAT = 'MOBILE_FEED_STANDARD'

export function AdCard({ ad }: { ad: Ad }) {
  const [format, setFormat] = useState(DEFAULT_FORMAT)
  const [preview, setPreview] = useState<PreviewState>({ loading: true })
  const [thumbFailed, setThumbFailed] = useState(false)

  // Auto-render the real ad preview on mount and whenever the format changes.
  useEffect(() => {
    let alive = true
    setPreview({ loading: true })
    api
      .adPreview(ad.id, format)
      .then((r) => alive && setPreview({ loading: false, body: r.body }))
      .catch(
        (e) =>
          alive &&
          setPreview({ loading: false, error: e instanceof Error ? e.message : String(e) }),
      )
    return () => {
      alive = false
    }
  }, [ad.id, format])

  const showFallback = !preview.loading && (!!preview.error || preview.body == null)

  return (
    <article className="adcard reveal">
      <div className="adcard__media">
        {preview.loading && (
          <div className="adcard__loading">
            <Skeleton w="72%" h={18} />
            <span className="adcard__loadingtxt">Rendering preview…</span>
          </div>
        )}

        {!preview.loading && preview.body && (
          // The iframe src carries the access token (that's how Meta's preview edge works) — fine
          // for a local read-only dashboard; proxy previews server-side for a public deploy.
          // eslint-disable-next-line react/no-danger
          <div className="adcard__frame" dangerouslySetInnerHTML={{ __html: preview.body }} />
        )}

        {showFallback &&
          (thumbFailed ? (
            <div className="adcard__noimg" aria-hidden>
              ▢
            </div>
          ) : (
            <img
              className="adcard__thumb"
              src={`/api/ads/${ad.id}/thumbnail`}
              alt={ad.name}
              loading="lazy"
              onError={() => setThumbFailed(true)}
            />
          ))}
      </div>

      <div className="adcard__body">
        <div className="adcard__top">
          <span className="adcard__name" title={ad.name}>
            {ad.name}
          </span>
          <StatusDot tone={statusTone(ad.status)} label={statusLabel(ad.status)} />
        </div>

        {showFallback && (
          <div className="adcard__hint">
            {preview.error
              ? `Inline preview unavailable: ${preview.error}`
              : 'No inline preview for this format — showing the creative thumbnail.'}
          </div>
        )}

        <div className="adcard__actions">
          <select
            className="select__control select__control--sm"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            aria-label="Preview format"
          >
            {AD_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
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
      </div>
    </article>
  )
}
