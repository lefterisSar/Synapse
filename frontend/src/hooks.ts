import { useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  data: T | undefined
  error: string | undefined
  loading: boolean
  reload: () => void
}

/** Runs an async fetcher, re-running whenever `deps` change; exposes loading/error + manual reload. */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(undefined)
    fetcher()
      .then((result) => {
        if (alive) setData(result)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, error, loading, reload: () => setNonce((n) => n + 1) }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Eases a number from 0 up to `target` over `duration` ms. Snaps instantly if motion is reduced. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const frame = useRef<number>(0)

  useEffect(() => {
    if (prefersReducedMotion() || target === 0) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(target * eased)
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return value
}
