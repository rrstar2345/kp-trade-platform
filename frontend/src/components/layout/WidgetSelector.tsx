import { useState, useRef, useEffect } from 'react'
import { PlusCircle, X } from 'lucide-react'
import type { WidgetType } from '@/types'
import { cn } from '@/lib/utils'

const WIDGETS: { type: WidgetType; label: string; description: string }[] = [
  { type: 'accounts', label: 'Accounts', description: 'Manage broker accounts' },
  { type: 'option_chain', label: 'Option Chain', description: 'Options table with buy/sell' },
  { type: 'order_log', label: 'Order Log', description: 'Live order status across accounts' },
  { type: 'overview', label: 'Overview', description: "Today's P&L summary" },
  { type: 'positions', label: 'Positions', description: 'Open positions with live P&L' },
]

interface Props {
  onSelect: (type: WidgetType) => void
}

export function WidgetSelector({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-slate-100 transition-colors"
        title="Add widget"
      >
        <PlusCircle size={13} />
        Add widget
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-surface-2 border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted">Add widget</span>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-slate-100">
              <X size={12} />
            </button>
          </div>
          {WIDGETS.map((w) => (
            <button
              key={w.type}
              onClick={() => { onSelect(w.type); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 hover:bg-surface-3 transition-colors',
                'flex flex-col gap-0.5'
              )}
            >
              <span className="text-sm text-slate-100">{w.label}</span>
              <span className="text-xs text-muted">{w.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
