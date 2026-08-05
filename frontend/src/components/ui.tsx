import type { ReactNode } from 'react'

type Tone = 'live' | 'paused' | 'muted' | 'offline'

export function StatusDot({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={`status status--${tone}`}>
      <span className="status__dot" />
      {label}
    </span>
  )
}

export function Banner({
  tone = 'error',
  title,
  children,
}: {
  tone?: 'error' | 'info'
  title: string
  children?: ReactNode
}) {
  return (
    <div className={`banner banner--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="banner__title">{title}</div>
      {children && <div className="banner__body">{children}</div>}
    </div>
  )
}

export function EmptyState({
  glyph,
  title,
  hint,
}: {
  glyph: string
  title: string
  hint?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty__glyph" aria-hidden>
        {glyph}
      </div>
      <div className="empty__title">{title}</div>
      {hint && <div className="empty__hint">{hint}</div>}
    </div>
  )
}

export function Skeleton({ w = '100%', h = 16 }: { w?: string | number; h?: string | number }) {
  return <span className="skeleton" style={{ width: w, height: h }} />
}
