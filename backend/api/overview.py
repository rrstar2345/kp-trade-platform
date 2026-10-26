"""
Overview API — P1-14 to P1-15
GET /api/overview → aggregate P&L per account + total
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..services.overview import get_overview_data

router = APIRouter(prefix="/overview", tags=["overview"])


@router.get("")
def get_overview(db: Session = Depends(get_db)):
    return get_overview_data(db)