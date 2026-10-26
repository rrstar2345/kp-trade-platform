import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db.database import init_db
from .ws.manager import manager
from .api.health import router as health_router
from .api.layout import router as layout_router
from .api.accounts import router as accounts_router
from .api.positions import router as positions_router
from .api.overview import router as overview_router
from .api.orders import router as orders_router
from .services.positions import poll_positions_loop
from .ws.dhan_orders import start_order_bridges


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[startup] Database initialised")

    # Start background tasks
    asyncio.create_task(poll_positions_loop(manager.broadcast))
    asyncio.create_task(start_order_bridges(manager.broadcast))
    print("[startup] Background tasks started")

    yield


app = FastAPI(title="KP Trade Platform", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST routes ───────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api")
app.include_router(layout_router, prefix="/api")
app.include_router(accounts_router, prefix="/api")
app.include_router(positions_router, prefix="/api")
app.include_router(overview_router, prefix="/api")
app.include_router(orders_router, prefix="/api")


# ── Internal WebSocket (frontend connects here for live updates) ───────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)