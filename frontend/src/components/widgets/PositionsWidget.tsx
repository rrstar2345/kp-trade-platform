/**
 * Positions Widget — P1-12 to P1-13
 * Table: instrument, qty, avg price, LTP, live P&L (green/red), account column
 * Live updates via WebSocket (positions_update messages)
 */
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { Position, WsMessage } from '@/types'
import { cn } from '@/lib/utils'

export function PositionsWidget() {
  const { data: initial = [], isLoading } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: () => api.get('/positions').then(r => r.data),
    refetchInterval: 10_000,
  })

  const [positions, setPositions] = useState<Position[]>([])

  useEffect(() => {
    setPositions(initial)
  }, [initial])

  // Live updates via WS
  const { lastMessage } = useWebSocket('/ws')
  useEffect(() => {
    if (!lastMessage) return
    try {
      const msg: WsMessage = JSON.parse(lastMessage)
      if (msg.type === 'positions_update') {
        setPositions(msg.data)
      }
    } catch { /* ignore */ }
  }, [lastMessage])

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0)

  if (isLoading) return <div className="text-xs text-muted">Loading positions…</div>

  return (
    <div className="flex flex-col h-full gap-1 text-xs">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1 py-1 shrink-0">
        <span className="text-muted">{positions.length} open position{positions.length !== 1 ? 's' : ''}</span>
        <span className={cn('font-mono font-semibold', totalPnL >= 0 ? 'text-profit' : 'text-loss')}>
          {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
        </span>
      </div>

      {positions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted">No open positions</div>
      ) : (
        <div className="overflow-auto flex-1">
          <table className="w-full min-w-[520px]">
            <thead className="sticky top-0 bg-surface-2 text-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="text-left py-1.5 px-2">Account</th>
                <th className="text-left py-1.5 px-2">Instrument</th>
                <th className="text-right py-1.5 px-2">Qty</th>
                <th className="text-right py-1.5 px-2">Avg</th>
                <th className="text-right py-1.5 px-2">LTP</th>
                <th className="text-right py-1.5 px-2">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {positions.map((pos, i) => (
                <tr key={i} className="hover:bg-surface-2/60 transition-colors">
                  <td className="py-1.5 px-2 text-muted truncate max-w-[90px]">{pos.account_name}</td>
                  <td className="py-1.5 px-2 font-medium text-slate-200 truncate max-w-[140px]">{pos.instrument}</td>
                  <td className="py-1.5 px-2 text-right font-mono">
                    <span className={pos.quantity > 0 ? 'text-profit' : 'text-loss'}>
                      {pos.quantity > 0 ? '+' : ''}{pos.quantity}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-300">
                    ₹{pos.avg_price.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-200">
                    ₹{pos.ltp.toFixed(2)}
                  </td>
                  <td className={cn('py-1.5 px-2 text-right font-mono font-semibold', pos.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                    {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toFixed(2)}
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