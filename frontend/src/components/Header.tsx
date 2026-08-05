import type { Account, DatePreset, Status } from '../api'
import { DATE_PRESETS } from '../api'
import { Skeleton, StatusDot } from './ui'

interface Props {
  account: Account | undefined
  status: Status | undefined
  offline: boolean
  preset: string
  onPresetChange: (value: string) => void
  onReload: () => void
  refreshing: boolean
  showWindow: boolean
}

export function Header({
  account,
  status,
  offline,
  preset,
  onPresetChange,
  onReload,
  refreshing,
  showWindow,
}: Props) {
  const connected = !offline && status?.configured === true

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__mark">Synapse</div>
        <div className="header__tag">Meta&nbsp;Ads&nbsp;·&nbsp;Read&nbsp;Console</div>
      </div>

      <div className="header__meta">
        {offline ? (
          <StatusDot tone="offline" label="Backend offline" />
        ) : connected ? (
          <StatusDot tone="live" label="Connected" />
        ) : (
          <StatusDot tone="paused" label="Not configured" />
        )}

        <div className="header__account">
          {account ? (
            <>
              <span className="header__account-name">{account.name}</span>
              <span className="header__account-sub">
                {account.currency} · {account.timezone_name}
              </span>
            </>
          ) : offline ? (
            <span className="header__account-name">—</span>
          ) : (
            <Skeleton w={160} h={14} />
          )}
        </div>

        {showWindow && (
          <label className="select">
            <span className="select__label">Window</span>
            <select
              className="select__control"
              value={preset}
              onChange={(e) => onPresetChange(e.target.value)}
            >
              {DATE_PRESETS.map((p: DatePreset) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <button className="icon-btn" onClick={onReload} disabled={refreshing} title="Refresh">
          <span className={refreshing ? 'spin' : ''}>↻</span>
        </button>
      </div>
    </header>
  )
}
