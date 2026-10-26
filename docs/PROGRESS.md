# Progress Tracker

## Current Phase: Phase 1 (Complete)

## Status Legend
- ⬜ Not started
- 🔄 In progress
- ✅ Done
- ❌ Blocked

---

## Phase 0 — Project Setup
| Task | Status | Notes |
|------|--------|-------|
| P0-01: Backend scaffold | ✅ | FastAPI app, CORS, health endpoint, layout API, WS manager |
| P0-02: Frontend scaffold | ✅ | Vite+React+TS, Tailwind, react-grid-layout, Zustand, drag-drop panels, widget registry |
| P0-03: Database schema | ✅ | Included in P0-01: accounts, layout_config, order_log tables |
| P0-04: Encryption utility | ✅ | Included in P0-01: AES-256-GCM in db/encryption.py |
| P0-05: Docker Compose | ⬜ | Optional — skipped for now |
| P0-06: End-to-end empty run | ✅ | Ran `./start.sh` and verified |

## Phase 1 — MVP
| Task | Status | Notes |
|------|--------|-------|
| P1-01: GET/POST/PUT/DELETE /api/accounts | ✅ | backend/api/accounts.py |
| P1-02: Dhan SDK wrapper + connection test | ✅ | broker/dhan.py + /accounts/{id}/test-connection |
| P1-03: Parent/child relationship, trade_factor | ✅ | DB model + accounts API |
| P1-04: Trade proxy config per account | ✅ | proxy fields in DB + API |
| P1-05: Frontend Accounts widget: add/edit/delete | ✅ | AccountsWidget.tsx |
| P1-06: Parent/child toggle, trade factor slider, session toggle | ✅ | AccountsWidget.tsx |
| P1-07: Connection status / test connection button | ✅ | AccountsWidget.tsx |
| P1-08: GET /api/positions from all active accounts | ✅ | api/positions.py + services/positions.py |
| P1-09: Merge positions across parent + children | ✅ | services/positions.py |
| P1-10: 5s poll loop storing positions in memory cache | ✅ | services/positions.py::poll_positions_loop |
| P1-11: WebSocket /ws broadcasting positions_update | ✅ | main.py + ws/manager.py |
| P1-12: Positions widget table | ✅ | PositionsWidget.tsx |
| P1-13: Color coding green/red P&L, account column | ✅ | PositionsWidget.tsx |
| P1-14: GET /api/overview → aggregate P&L per account | ✅ | api/overview.py |
| P1-15: Realized + unrealized P&L computation | ✅ | services/overview.py |
| P1-16: Overview widget: total P&L card + table | ✅ | OverviewWidget.tsx |
| P1-17: Auto-refresh via WS + poll | ✅ | OverviewWidget.tsx |
| P1-18: services/copier.py: compute child lots + place | ✅ | services/copier.py |
| P1-19: Skip child if lots < 1; log skip reason | ✅ | services/copier.py |
| P1-20: POST /api/orders/place triggering copy | ✅ | api/orders.py |
| P1-21: Dhan OrderUpdate WS bridge per active account | ✅ | ws/dhan_orders.py |
| P1-22: Internal WS broadcast order updates to frontend | ✅ | ws/dhan_orders.py + manager.py |
| P1-23: react-grid-layout 12-col grid, drag + resize | ✅ | GridLayout.tsx (Phase 0) |
| P1-24: Widget selector: click to add widget to panel | ✅ | WidgetSelector.tsx (Phase 0) |
| P1-25: Panel with >1 widget rendered as tabs | ✅ | Panel.tsx (Phase 0) |
| P1-26: Save layout to backend PUT /api/layout on change | ✅ | layoutStore.ts (Phase 0) |
| P1-27: Load saved layout on app start | ✅ | layoutStore.ts (Phase 0) |

## Phase 2 — Option Chain
| Task | Status | Notes |
|------|--------|-------|
| P2-01 to P2-14 | ⬜ | |

## Phase 3 — Order Log
| Task | Status | Notes |
|------|--------|-------|
| P3-01 to P3-06 | ⬜ | |

## Phase 4 — Polish
| Task | Status | Notes |
|------|--------|-------|
| P4-01 to P4-09 | ⬜ | |

---

## Session Log
| Date | Session Summary |
|------|----------------|
| 2026-10-25 | Project plan created, repo scaffolded, docs committed |
| 2026-10-25 | P0-01 & P0-02 built: backend (FastAPI, SQLite, AES encryption, WS manager) + frontend (Vite/React/TS, Tailwind, drag-drop grid, panel/tab system, widget registry) |
| 2026-10-26 | Phase 1 complete: all 27 tasks done. Backend: accounts CRUD + test-connection, positions poll loop + WS broadcast, overview P&L aggregation, trade copy core (copier.py), Dhan order WS bridge, orders API. Frontend: AccountsWidget, PositionsWidget, OverviewWidget wired into widget registry. |