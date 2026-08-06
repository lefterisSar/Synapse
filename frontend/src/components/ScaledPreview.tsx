import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Fallback viewport height used only when we can't measure the real ad — i.e. the consent-dismisser
// extension isn't installed. With the extension, the iframe reports its true content height (via
// postMessage) and each card sizes itself to show the whole ad with no scrolling.
const FALLBACK_HEIGHT = 520

interface Parsed {
  src: string
  w: number
  h: number
}

// Meta returns `<iframe src="…" width="335" height="450" …>`. Pull those out so we can render our
// own iframe at a controlled scale instead of embedding its fixed-size markup verbatim.
function parseIframe(html: string): Parsed | null {
  const src = html.match(/src="([^"]+)"/)?.[1]
  const w = Number(html.match(/width="(\d+)"/)?.[1])
  const h = Number(html.match(/height="(\d+)"/)?.[1])
  if (!src || !w || !h) return null
  return { src: src.replace(/&amp;/g, '&'), w, h }
}

export function ScaledPreview({ html }: { html: string }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [boxWidth, setBoxWidth] = useState(0)
  // Real content height (in the iframe's own px) reported by the consent-dismisser extension.
  const [contentHeight, setContentHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setBoxWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Switching formats loads a different ad — forget the previous ad's measured height until the new
  // frame reports its own (otherwise the card briefly keeps the wrong size).
  useEffect(() => {
    setContentHeight(null)
  }, [html])

  // The browser extension posts the preview's true height from inside the facebook.com iframe. We
  // only trust messages from *our* iframe's window and a facebook.com origin.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.origin.endsWith('facebook.com')) return
      if (!e.data || e.data.type !== 'synapse:preview-height') return
      if (iframeRef.current && e.source === iframeRef.current.contentWindow) {
        const h = Number(e.data.height)
        if (h > 0) setContentHeight(h)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const parsed = parseIframe(html)
  if (!parsed) {
    // eslint-disable-next-line react/no-danger
    return <div className="adcard__frame" dangerouslySetInnerHTML={{ __html: html }} />
  }

  // Scale so the ad's declared width exactly fills the card width.
  const scale = boxWidth > 0 ? boxWidth / parsed.w : 0
  const exact = contentHeight != null && contentHeight > 0

  // Exact mode: make the iframe tall enough to hold the whole ad (no internal scroll) and size the
  // box to the scaled full height. Fallback: fixed viewport, scroll internally.
  const iframeHeight = exact
    ? contentHeight!
    : scale > 0
      ? Math.ceil(FALLBACK_HEIGHT / scale)
      : parsed.h
  const boxHeight = exact && scale > 0 ? Math.round(contentHeight! * scale) : FALLBACK_HEIGHT

  return (
    <div className="adcard__scaler" ref={boxRef} style={{ height: boxHeight }}>
      {scale > 0 && (
        <iframe
          ref={iframeRef}
          title="Ad preview"
          className="adcard__scaled-iframe"
          src={parsed.src}
          width={parsed.w}
          height={iframeHeight}
          scrolling={exact ? 'no' : 'yes'}
          style={{ transform: `scale(${scale})` }}
        />
      )}
    </div>
  )
}
