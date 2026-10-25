# KP Trade Platform — Project Plan

## Phases Overview
| Phase | Name | Goal |
|-------|------|------|
| 0 | Project Setup | Scaffold, tooling, CI skeleton |
| 1 | MVP | Accounts + Overview + Positions widgets, Dhan integration, trade copy core |
| 2 | Option Chain | Option chain widget with trade execution |
| 3 | Order Log | Real-time order log widget |
| 4 | Polish | Layout persistence, greeks, trade proxy, multi-broker prep |

---

## Phase 0 — Project Setup
**Goal**: Working dev environment, repo structure, empty app skeleton that runs.

### Tasks
- [ ] P0-01: Backend scaffold — FastAPI app, SQLite init, health endpoint
- [ ] P0-02: Frontend scaffold — Vite + React + TypeScript, Tailwind CSS, react-grid-layout
- [ ] P0-03: Database schema — accounts, layout_config, order_log tables
- [ ] P0-04: Encryption utility — AES-256 for credential fields in SQLite
- [ ] P0-05: Docker Compose (optional) — single command startup
- [ ] P0-06: Project runs end-to-end with empty widgets

### Deliverable
`npm run dev` + `uvicorn main:app` → browser shows empty grid layout at localhost:5173

---

## Phase 1 — MVP: Accounts + Overview + Positions
**Goal**: Fully working accounts management, live P&L overview, and open positions view.

### 1-A: Accounts Widget
- [ ] P1-01: Backend — `GET/POST/PUT/DELETE /api/accounts`
- [ ] P1-02: Backend — Dhan SDK wrapper (`broker/dhan.py`) with connection test
- [ ] P1-03: Backend — Parent/child relationship, trade_factor field (0.01–1.0)
- [ ] P1-04: Backend — Trade proxy config (url, port, username, password) per account
- [ ] P1-05: Frontend — Accounts widget: add/edit/delete account form
- [ ] P1-06: Frontend — Parent/child toggle, trade factor slider, session enable/disable
- [ ] P1-07: Frontend — Connection status indicator (test connection button)

#### Account DB Schema
```sql
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    broker TEXT DEFAULT 'dhan',
    client_id TEXT,
    access_token_enc TEXT,      -- AES encrypted
    app_id TEXT,
    app_secret_enc TEXT,        -- AES encrypted
    api_key_enc TEXT,           -- AES encrypted
    is_parent BOOLEAN DEFAULT 0,
    parent_id INTEGER REFERENCES accounts(id),
    trade_factor REAL DEFAULT 1.0,
    session_active BOOLEAN DEFAULT 1,
    proxy_url TEXT,
    proxy_port INTEGER,
    proxy_username TEXT,
    proxy_password_enc TEXT,    -- AES encrypted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1-B: Positions Widget
- [ ] P1-08: Backend — `GET /api/positions` → fetch from all active accounts via Dhan `get_positions()`
- [ ] P1-09: Backend — Merge positions across parent + children, add account label
- [ ] P1-10: Backend — Poll loop (5s) storing latest positions in memory cache
- [ ] P1-11: Backend — WebSocket endpoint `/ws/positions` broadcasting updates
- [ ] P1-12: Frontend — Positions widget: table with instrument, qty, avg price, LTP, live P&L
- [ ] P1-13: Frontend — Color coding (green/red) for P&L, account column

### 1-C: Overview Widget
- [ ] P1-14: Backend — `GET /api/overview` → aggregate today's P&L per account + total
- [ ] P1-15: Backend — Compute realized P&L from order history + unrealized from positions
- [ ] P1-16: Frontend — Overview widget: total P&L card + per-account breakdown table
- [ ] P1-17: Frontend — Auto-refresh via WebSocket or poll

### 1-D: Trade Copy Core
- [ ] P1-18: Backend — `services/copier.py`: given a parent order, compute child lots (`floor(lots × trade_factor)`) and place orders
- [ ] P1-19: Backend — Skip child if computed lots < 1; log skip reason
- [ ] P1-20: Backend — Order placement endpoint `POST /api/orders/place` that triggers copy
- [ ] P1-21: Backend — Dhan OrderUpdate WebSocket bridge (`ws/dhan_orders.py`) per active account
- [ ] P1-22: Backend — Internal WS broadcast order updates to frontend

### 1-E: Layout System
- [ ] P1-23: Frontend — `react-grid-layout` 12-column grid, draggable + resizable panels
- [ ] P1-24: Frontend — Widget selector: click to add widget to a panel
- [ ] P1-25: Frontend — If panel has >1 widget: render as tabs within panel
- [ ] P1-26: Frontend — Save layout to backend `PUT /api/layout` on change
- [ ] P1-27: Frontend — Load saved layout on app start

#### Layout DB Schema
```sql
CREATE TABLE layout_config (
    id INTEGER PRIMARY KEY,
    layout_json TEXT NOT NULL,   -- JSON blob of react-grid-layout config + widget assignments
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Phase 2 — Option Chain Widget
**Goal**: Full option chain with filtering and trade execution.

- [ ] P2-01: Backend — `GET /api/option-chain?security_id=&expiry=&exchange=` → Dhan `option_chain()` 
- [ ] P2-02: Backend — `GET /api/instruments` → list of tradeable index/stock instruments
- [ ] P2-03: Backend — Greeks: use Dhan response if present, else compute via Black-Scholes (`services/greeks.py`)
- [ ] P2-04: Backend — ATM filtering: identify ATM strike, return ±N rows
- [ ] P2-05: Backend — Greek filtering: delta/gamma/theta/vega range filters
- [ ] P2-06: Frontend — Option chain widget: instrument selector, expiry date picker
- [ ] P2-07: Frontend — Table: Strike | Call OI | Call LTP | Call Greeks | Buy/Sell | Put Buy/Sell | Put Greeks | Put LTP | Put OI
- [ ] P2-08: Frontend — ATM filter control (±N strikes from ATM)
- [ ] P2-09: Frontend — Greek filter controls (delta range, etc.)
- [ ] P2-10: Frontend — Buy/Sell button → opens TradeDialog modal
- [ ] P2-11: Frontend — TradeDialog: lots input, order type (INTRADAY/NORMAL), target, stop loss, trailing SL
- [ ] P2-12: Frontend — TradeDialog: shows computed child lots preview before placing
- [ ] P2-13: Backend — Dhan MarketFeed WebSocket for option chain LTP updates (`ws/dhan_feed.py`)
- [ ] P2-14: Frontend — Live LTP updates in option chain via WebSocket

---

## Phase 3 — Order Log Widget
**Goal**: Real-time order status log across all accounts.

- [ ] P3-01: Backend — `GET /api/orders` → fetch order list from all active accounts
- [ ] P3-02: Backend — Persist order log to `order_log` SQLite table on each update
- [ ] P3-03: Backend — WebSocket broadcasts order updates (from Dhan OrderUpdate WS bridge)
- [ ] P3-04: Frontend — Order log widget: table with Time | Account | Instrument | Side | Qty | Price | Status
- [ ] P3-05: Frontend — Color code by status (PENDING=yellow, FILLED=green, REJECTED=red, CANCELLED=grey)
- [ ] P3-06: Frontend — Filter by account, status, date

#### Order Log DB Schema
```sql
CREATE TABLE order_log (
    id INTEGER PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    order_id TEXT,
    instrument TEXT,
    exchange_segment TEXT,
    transaction_type TEXT,
    quantity INTEGER,
    price REAL,
    order_type TEXT,
    product_type TEXT,
    status TEXT,
    is_copy BOOLEAN DEFAULT 0,
    parent_order_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Phase 4 — Polish & Future-Proofing
**Goal**: Production-ready local app.

- [ ] P4-01: Layout — Multiple named layout presets (save/load by name)
- [ ] P4-02: Positions — Square-off button per position (calls cancel/exit)
- [ ] P4-03: Overview — Daily P&L chart (sparkline per account)
- [ ] P4-04: Broker factory — Abstract broker interface for future broker additions
- [ ] P4-05: Trade proxy — Route API calls through configurable HTTP proxy per account
- [ ] P4-06: Super orders / Conditional orders — Expose Dhan's advanced order types
- [ ] P4-07: Kill switch — UI button triggering Dhan kill switch for an account
- [ ] P4-08: Settings page — App-level settings (poll interval, default lot size, theme)
- [ ] P4-09: Export — Order log export to CSV

---

## Key Dependencies

### Backend (Python)
```
fastapi
uvicorn
sqlalchemy
dhanhq          # pip install dhanhq
websockets
cryptography    # AES encryption
httpx           # async HTTP client
python-dotenv
```

### Frontend (Node)
```
react + typescript
vite
react-grid-layout   # drag-and-drop grid
zustand             # state management
@tanstack/react-query  # data fetching + cache
tailwindcss
shadcn/ui           # component library
recharts            # P&L sparklines
```

---

## Notes for Claude Sessions
- **Always read this file + `PROGRESS.md` first** before writing any code.
- Broker credentials are always encrypted at rest; never log them.
- The `copier.py` service is the core of the app — handle edge cases (lots=0, child account offline).
- Dhan's `get_positions()` returns both day positions and net positions — use net for display.
- For Dhan market feed, each account needs its own WebSocket connection; bridge them all to one internal WS that the frontend connects to.
- Trade factor applies only to children, never to the parent account.
- `session_active=False` accounts are completely skipped in all operations.
