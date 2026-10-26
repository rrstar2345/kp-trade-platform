"""
Positions API — P1-08 to P1-11
GET /api/positions
Background poll loop (5s) + WS broadcast
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..services.positions import positions_cache

router = APIRouter(prefix="/positions", tags=["positions"])


@router.get("")
def get_positions(db: Session = Depends(get_db)):
    """Return latest merged positions from all active accounts."""
    return positions_cache.get_all()