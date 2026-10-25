# Architecture

## Overview
```
Browser (React + TypeScript)
    │
    ├── REST API calls ──────► FastAPI (port 8000)
    │                              │
    └── WebSocket ◄────────────────┤
                                   ├── SQLite DB (accounts, layout, logs)
                                   ├── Dhan REST API (orders, positions, option chain)
                                   └── Dhan WebSocket (order updates, market LTP)
```

## Backend Modules
| Module | Responsibility |
|--------|----------------|
| `api/accounts.py` | CRUD for broker accounts |
| `api/orders.py` | Place/modify/cancel orders, copy to children |
| `api/positions.py` | Fetch open positions across accounts |
| `api/overview.py` | Aggregate P&L calculations |
| `api/option_chain.py` | Fetch option chain + greeks |
| `api/layout.py` | Save/load user layout configs |
| `broker/dhan.py` | Dhan SDK wrapper |
| `broker/factory.py` | Broker factory (for future broker additions) |
| `db/models.py` | SQLAlchemy models |
| `db/database.py` | SQLite connection + init |
| `services/copier.py` | Trade copy logic (parent → children, trade factor) |
| `services/greeks.py` | Black-Scholes fallback for greeks |
| `ws/manager.py` | WebSocket connection manager (broadcast to frontend) |
| `ws/dhan_feed.py` | Dhan MarketFeed WebSocket bridge |
| `ws/dhan_orders.py` | Dhan OrderUpdate WebSocket bridge |

## Frontend Modules
| Module | Responsibility |
|--------|----------------|
| `components/layout/GridLayout.tsx` | Drag-and-drop grid (react-grid-layout) |
| `components/layout/WidgetPanel.tsx` | Widget selector / tab manager |
| `components/widgets/Accounts.tsx` | Accounts widget |
| `components/widgets/OptionChain.tsx` | Option chain widget |
| `components/widgets/OrderLog.tsx` | Order log widget |
| `components/widgets/Overview.tsx` | P&L overview widget |
| `components/widgets/Positions.tsx` | Positions widget |
| `components/widgets/TradeDialog.tsx` | Trade execution modal |
| `store/layoutStore.ts` | Zustand store for layout state |
| `store/accountStore.ts` | Zustand store for accounts |
| `store/marketStore.ts` | Zustand store for live prices |
| `hooks/useWebSocket.ts` | WebSocket hook for live updates |

## Data Flow: Trade Copy
1. User places order from Option Chain widget (parent account)
2. Backend places order on parent via Dhan API
3. `copier.py` iterates child accounts: `lots = floor(parent_lots × trade_factor)`
4. If `lots >= 1`, places order on child account
5. All order statuses streamed to frontend via internal WebSocket

## Real-Time Strategy
- **Order updates**: Dhan WebSocket (`wss://api-order-update.dhan.co`) per account → bridge to frontend WS
- **LTP (market prices)**: Dhan MarketFeed WebSocket → bridge to frontend WS
- **Positions / P&L**: REST poll every 5 seconds (no Dhan WebSocket for this)
- **Option chain**: Fetched on demand (user selects instrument/expiry)

## Security
- Credentials stored in SQLite with AES-256 encryption (cryptography library)
- Encryption key derived from a machine-local secret on first run
- No credentials ever sent to frontend; only masked display (last 4 chars)
