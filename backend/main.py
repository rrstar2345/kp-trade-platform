from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from .db.database import init_db
from .ws.manager import manager
from .api.health import router as health_router
from .api.layout import router as layout_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[startup] Database initialised")
    yield


app = FastAPI(title="KP Trade Platform", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST routes ──────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api")
app.include_router(layout_router, prefix="/api")


# ── Internal WebSocket (frontend connects here for live updates) ──────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; messages are pushed from the server
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
