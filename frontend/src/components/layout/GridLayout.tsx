import { useEffect } from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useLayoutStore } from '@/store/layoutStore'
import { Panel } from './Panel'
import type { PanelConfig } from '@/types'

const ReactGridLayout = WidthProvider(RGL)

export function GridLayout() {
  const { panels, load, setPanels, addPanel } = useLayoutStore()

  useEffect(() => { load() }, [load])

  const rglLayout: Layout[] = panels.map((p) => ({
    i: p.id,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    minW: 3,
    minH: 3,
  }))

  function handleLayoutChange(newLayout: Layout[]) {
    const updated: PanelConfig[] = panels.map((p) => {
      const item = newLayout.find((l) => l.i === p.id)
      if (!item) return p
      return { ...p, x: item.x, y: item.y, w: item.w, h: item.h }
    })
    setPanels(updated)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-1 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-slate-100 tracking-tight">KP Trade</span>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={addPanel}
          className="text-xs text-muted hover:text-accent transition-colors"
        >
          + New panel
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-profit animate-pulse" />
          Connected
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <ReactGridLayout
          className="layout"
          layout={rglLayout}
          cols={12}
          rowHeight={60}
          margin={[8, 8]}
          containerPadding={[8, 8]}
          draggableHandle=".drag-handle"
          onLayoutChange={handleLayoutChange}
          resizeHandles={['se']}
        >
          {panels.map((panel) => (
            <div key={panel.id} className="drag-handle cursor-grab active:cursor-grabbing">
              <Panel panel={panel} />
            </div>
          ))}
        </ReactGridLayout>
      </div>
    </div>
  )
}
