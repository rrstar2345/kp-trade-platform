import { create } from 'zustand'
import type { LayoutState, PanelConfig, WidgetConfig, WidgetType } from '@/types'
import { api } from '@/lib/api'

const DEFAULT_LAYOUT: LayoutState = {
  panels: [
    {
      id: 'panel-1',
      x: 0, y: 0, w: 12, h: 4,
      widgets: [{ id: 'w-welcome', type: 'overview', title: 'Overview' }],
      activeTab: 'w-welcome',
    },
  ],
}

interface LayoutStore extends LayoutState {
  load: () => Promise<void>
  save: () => Promise<void>
  setPanels: (panels: PanelConfig[]) => void
  addWidget: (panelId: string, type: WidgetType) => void
  removeWidget: (panelId: string, widgetId: string) => void
  setActiveTab: (panelId: string, widgetId: string) => void
  addPanel: () => void
  removePanel: (panelId: string) => void
}

const WIDGET_TITLES: Record<WidgetType, string> = {
  accounts: 'Accounts',
  option_chain: 'Option Chain',
  order_log: 'Order Log',
  overview: 'Overview',
  positions: 'Positions',
}

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  panels: DEFAULT_LAYOUT.panels,

  async load() {
    try {
      const { data } = await api.get('/layout')
      const parsed: LayoutState = JSON.parse(data.layout_json)
      if (parsed?.panels?.length) set({ panels: parsed.panels })
    } catch {
      // keep defaults
    }
  },

  async save() {
    const { panels } = get()
    await api.put('/layout', { layout_json: JSON.stringify({ panels }) })
  },

  setPanels(panels) {
    set({ panels })
    get().save()
  },

  addWidget(panelId, type) {
    const widgetId = `w-${Date.now()}`
    const widget: WidgetConfig = { id: widgetId, type, title: WIDGET_TITLES[type] }
    set((s) => ({
      panels: s.panels.map((p) =>
        p.id === panelId
          ? { ...p, widgets: [...p.widgets, widget], activeTab: widgetId }
          : p
      ),
    }))
    get().save()
  },

  removeWidget(panelId, widgetId) {
    set((s) => ({
      panels: s.panels.map((p) => {
        if (p.id !== panelId) return p
        const widgets = p.widgets.filter((w) => w.id !== widgetId)
        return {
          ...p,
          widgets,
          activeTab: widgets.length ? widgets[0].id : '',
        }
      }),
    }))
    get().save()
  },

  setActiveTab(panelId, widgetId) {
    set((s) => ({
      panels: s.panels.map((p) =>
        p.id === panelId ? { ...p, activeTab: widgetId } : p
      ),
    }))
  },

  addPanel() {
    const id = `panel-${Date.now()}`
    set((s) => ({
      panels: [
        ...s.panels,
        { id, x: 0, y: Infinity, w: 6, h: 4, widgets: [], activeTab: '' },
      ],
    }))
    get().save()
  },

  removePanel(panelId) {
    set((s) => ({ panels: s.panels.filter((p) => p.id !== panelId) }))
    get().save()
  },
}))
