import { X, Trash2 } from 'lucide-react'
import type { PanelConfig, WidgetType } from '@/types'
import { useLayoutStore } from '@/store/layoutStore'
import { Widget } from '@/components/widgets'
import { WidgetSelector } from './WidgetSelector'
import { cn } from '@/lib/utils'

interface Props {
  panel: PanelConfig
}

export function Panel({ panel }: Props) {
  const { addWidget, removeWidget, setActiveTab, removePanel } = useLayoutStore()

  const activeWidget = panel.widgets.find((w) => w.id === panel.activeTab)

  return (
    <div className="flex flex-col h-full bg-surface-1 border border-border rounded-lg overflow-hidden">
      {/* Header / tab bar */}
      <div className="drag-handle cursor-grab active:cursor-grabbing flex items-center gap-1 px-2 py-1 bg-surface-2 border-b border-border min-h-[34px] shrink-0">
        {panel.widgets.map((w) => (
          <button
            key={w.id}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setActiveTab(panel.id, w.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors group',
              panel.activeTab === w.id
                ? 'bg-surface-3 text-slate-100'
                : 'text-muted hover:text-slate-100 hover:bg-surface-3/50'
            )}
          >
            {w.title}
            <span
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removeWidget(panel.id, w.id) }}
              className="opacity-0 group-hover:opacity-100 hover:text-loss transition-opacity"
              title="Remove widget"
            >
              <X size={11} />
            </span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <WidgetSelector onSelect={(type: WidgetType) => addWidget(panel.id, type)} />
          <button
            onClick={() => removePanel(panel.id)}
            className="p-1 text-muted hover:text-loss transition-colors"
            title="Remove panel"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Widget content */}
      <div className="flex-1 overflow-auto p-2">
        {activeWidget ? (
          <Widget type={activeWidget.type} title={activeWidget.title} />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted">
            Add a widget using the button above
          </div>
        )}
      </div>
    </div>
  )
}