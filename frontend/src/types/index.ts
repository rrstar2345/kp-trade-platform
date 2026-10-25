// ── Accounts ──────────────────────────────────────────────────────────────────
export interface Account {
  id: number
  name: string
  broker: string
  client_id: string
  is_parent: boolean
  parent_id: number | null
  trade_factor: number
  session_active: boolean
  proxy_url?: string
  proxy_port?: number
  proxy_username?: string
}

// ── Layout ────────────────────────────────────────────────────────────────────
export type WidgetType = 'accounts' | 'option_chain' | 'order_log' | 'overview' | 'positions'

export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
}

export interface PanelConfig {
  id: string
  x: number
  y: number
  w: number
  h: number
  widgets: WidgetConfig[]
  activeTab: string
}

export interface LayoutState {
  panels: PanelConfig[]
}

// ── Positions ─────────────────────────────────────────────────────────────────
export interface Position {
  account_id: number
  account_name: string
  instrument: string
  exchange_segment: string
  quantity: number
  avg_price: number
  ltp: number
  pnl: number
  product_type: string
}

// ── Overview ──────────────────────────────────────────────────────────────────
export interface AccountPnL {
  account_id: number
  account_name: string
  realized_pnl: number
  unrealized_pnl: number
  total_pnl: number
}

export interface OverviewData {
  total_pnl: number
  accounts: AccountPnL[]
}

// ── Orders ────────────────────────────────────────────────────────────────────
export type OrderStatus = 'PENDING' | 'TRANSIT' | 'TRADED' | 'REJECTED' | 'CANCELLED'

export interface OrderLogEntry {
  id: number
  account_id: number
  account_name: string
  order_id: string
  instrument: string
  transaction_type: 'BUY' | 'SELL'
  quantity: number
  price: number
  product_type: string
  status: OrderStatus
  is_copy: boolean
  created_at: string
}

// ── WebSocket messages ────────────────────────────────────────────────────────
export type WsMessage =
  | { type: 'positions_update'; data: Position[] }
  | { type: 'order_update'; data: OrderLogEntry }
  | { type: 'ltp_update'; data: Record<string, number> }
