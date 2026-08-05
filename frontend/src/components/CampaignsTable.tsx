import type { Campaign, Insight } from '../api'
import { humanizeObjective, integer, money, statusTone, toNumber } from '../format'
import { EmptyState, Skeleton, StatusDot } from './ui'

interface Props {
  campaigns: Campaign[] | undefined
  byCampaign: Insight[] | undefined
  currency: string
  loading: boolean
}

const STATUS_LABEL: Record<'live' | 'paused' | 'muted', string> = {
  live: 'Active',
  paused: 'Paused',
  muted: 'Archived',
}

export function CampaignsTable({ campaigns, byCampaign, currency, loading }: Props) {
  if (loading) {
    return (
      <div className="table-wrap">
        <table className="table">
          <TableHead />
          <tbody>
            {[0, 1, 2, 3].map((i) => (
              <tr key={i}>
                {[0, 1, 2, 3, 4, 5].map((c) => (
                  <td key={c}>
                    <Skeleton w={c === 0 ? '80%' : '50%'} h={14} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        glyph="◎"
        title="No campaigns in this account yet"
        hint={
          <>
            Once campaigns exist on <code>act_…</code> they'll appear here with live spend and
            reach. Nothing to show for a fresh / playground account.
          </>
        }
      />
    )
  }

  const insightById = new Map<string, Insight>()
  for (const row of byCampaign ?? []) {
    if (row.campaign_id) insightById.set(row.campaign_id, row)
  }

  const maxSpend = Math.max(
    1,
    ...(byCampaign ?? []).map((r) => toNumber(r.spend)),
  )

  return (
    <div className="table-wrap">
      <table className="table">
        <TableHead />
        <tbody>
          {campaigns.map((c) => {
            const ins = insightById.get(c.id)
            const spend = ins ? toNumber(ins.spend) : 0
            const tone = statusTone(c.status)
            return (
              <tr key={c.id}>
                <td>
                  <div className="cell-name">{c.name}</div>
                  <div className="cell-id">{c.id}</div>
                </td>
                <td>
                  <StatusDot tone={tone} label={STATUS_LABEL[tone]} />
                </td>
                <td className="cell-dim">{humanizeObjective(c.objective)}</td>
                <td className="cell-num">{money(c.daily_budget, currency, true)}</td>
                <td className="cell-num">{ins ? integer(ins.impressions) : '—'}</td>
                <td className="cell-num">
                  <div className="spendcell">
                    <span>{ins ? money(ins.spend, currency) : '—'}</span>
                    <span className="spendbar" aria-hidden>
                      <span
                        className="spendbar__fill"
                        style={{ width: `${(spend / maxSpend) * 100}%` }}
                      />
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TableHead() {
  return (
    <thead>
      <tr>
        <th>Campaign</th>
        <th>Status</th>
        <th>Objective</th>
        <th className="cell-num">Daily budget</th>
        <th className="cell-num">Impressions</th>
        <th className="cell-num">Spend</th>
      </tr>
    </thead>
  )
}
