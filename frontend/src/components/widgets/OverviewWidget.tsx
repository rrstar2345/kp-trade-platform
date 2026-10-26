/**
 * Overview Widget — P1-16 to P1-17
 * Total P&L card + per-account breakdown table
 * Auto-refreshes via poll (10s) and WebSocket positions_update
 */
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { OverviewData, WsMessage } from '@/types'
import { cn } from '@/lib/utils'

export function OverviewWidget() {
  const { data, isLoading, refetch } = useQuery<OverviewData>({
    queryKey: ['overview'],
    queryFn: () => api.get('/overview').then(r => r.data),
    refetchInterval: 10_000,
  })

  // Re-fetch when positions update
  const { lastMessage } = useWebSocket('/ws')
  useEffect(() => {
    if (!lastMessage) return
    try {
      const msg: WsMessage = JSON.parse(lastMessage)
      if (msg.type === 'positions_update') refetch()
    } catch { /* ignore */ }
  }, [lastMessage, refetch])

  if (isLoading || !data) return <div className="text-xs text-muted">Loading overview…</div>

  const { total_pnl, accounts } = data

  return (
    <div className="flex flex-col h-full gap-3 text-xs">
      {/* Total P&L card */}
      <div className={cn(
        'rounded-lg p-3 border',
        total_pnl >= 0
          ? 'bg-profit/10 border-profit/30'
          : 'bg-loss/10 border-loss/30'
      )}>
        <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Today's Total P&L</div>
        <div className={cn('text-2xl font-bold font-mono', total_pnl >= 0 ? 'text-profit' : 'text-loss')}>
          {total_pnl >= 0 ? '+' : ''}₹{total_pnl.toFixed(2)}
        </div>
      </div>

      {/* Per-account table */}
      {accounts.length === 0 ? (
        <div className="text-muted text-center flex-1 flex items-center justify-center">
          No active accounts
        </div>
      ) : (
        <div className="overflow-auto flex-1">
          <table className="w-full min-w-[360px]">
            <thead className="sticky top-0 bg-surface-2 text-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="text-left py-1.5 px-2">Account</th>
                <th className="text-right py-1.5 px-2">Realized</th>
                <th className="text-right py-1.5 px-2">Unrealized</th>
                <th className="text-right py-1.5 px-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {accounts.map(acc => (
                <tr key={acc.account_id} className="hover:bg-surface-2/60 transition-colors">
                  <td className="py-1.5 px-2 text-slate-300 truncate max-w-[120px]">{acc.account_name}</td>
                  <td className={cn('py-1.5 px-2 text-right font-mono', acc.realized_pnl >= 0 ? 'text-profit' : 'text-loss')}>
                    {acc.realized_pnl >= 0 ? '+' : ''}₹{acc.realized_pnl.toFixed(2)}
                  </td>
                  <td className={cn('py-1.5 px-2 text-right font-mono', acc.unrealized_pnl >= 0 ? 'text-profit' : 'text-loss')}>
                    {acc.unrealized_pnl >= 0 ? '+' : ''}₹{acc.unrealized_pnl.toFixed(2)}
                  </td>
                  <td className={cn('py-1.5 px-2 text-right font-mono font-semibold', acc.total_pnl >= 0 ? 'text-profit' : 'text-loss')}>
                    {acc.total_pnl >= 0 ? '+' : ''}₹{acc.total_pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}