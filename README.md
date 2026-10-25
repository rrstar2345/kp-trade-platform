# KP Trade Platform

A local trading copier app — run locally, access via browser.

## Stack
- **Frontend**: React + TypeScript, drag-and-drop grid layout
- **Backend**: Python FastAPI
- **Database**: SQLite (local, encrypted credentials)
- **Broker**: Dhan (DhanHQ-py SDK)
- **Real-time**: Dhan WebSocket (order updates + market feed LTP); positions polled every 5s

## Quick Start
```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
# Access at http://localhost:5173
```

## Project Docs
- [Project Plan](docs/PROJECT_PLAN.md)
- [Progress Tracker](docs/PROGRESS.md)
- [Architecture](docs/ARCHITECTURE.md)

## For New Claude Sessions
Read `docs/PROJECT_PLAN.md` and `docs/PROGRESS.md` first to understand what's built and what's next.
