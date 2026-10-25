#!/usr/bin/env bash
# Start both backend and frontend in development mode
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Starting KP Trade Platform..."

# Backend
cd "$ROOT/backend"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created backend/.env from example — edit ENCRYPTION_KEY if needed"
fi
if [ ! -d .venv ]; then
  python3 -m venv .venv
  echo "  Created Python venv"
fi
source .venv/bin/activate
pip install -q -r requirements.txt
echo "  Backend dependencies ready"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Frontend
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install
  echo "  Frontend dependencies installed"
fi
npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ KP Trade Platform running:"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:8000"
echo "   API docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
