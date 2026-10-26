"""
Orders API — P1-20
POST /api/orders/place — places order on parent + copies to children
GET  /api/orders       — recent order log
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from ..db.database import get_db
from ..db.models import OrderLog
from ..services.copier import place_and_copy

router = APIRouter(prefix="/orders", tags=["orders"])


class PlaceOrderRequest(BaseModel):
    account_id: int                  # parent account to originate from
    security_id: str
    exchange_segment: str
    transaction_type: str            # BUY | SELL
    quantity: int
    order_type: str = "MARKET"       # LIMIT | MARKET
    product_type: str = "INTRADAY"   # INTRADAY | DELIVERY
    price: float = 0.0
    disclosed_quantity: int = 0
    validity: str = "DAY"
    tag: Optional[str] = None


@router.post("/place")
async def place_order(payload: PlaceOrderRequest, db: Session = Depends(get_db)):
    result = await place_and_copy(db, payload.model_dump())
    if not result["success"]:
        raise HTTPException(400, result.get("message", "Order placement failed"))
    return result


@router.get("")
def list_orders(limit: int = 100, db: Session = Depends(get_db)):
    orders = (
        db.query(OrderLog)
        .order_by(OrderLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": o.id,
            "account_id": o.account_id,
            "order_id": o.order_id,
            "instrument": o.instrument,
            "exchange_segment": o.exchange_segment,
            "transaction_type": o.transaction_type,
            "quantity": o.quantity,
            "price": o.price,
            "order_type": o.order_type,
            "product_type": o.product_type,
            "status": o.status,
            "is_copy": o.is_copy,
            "parent_order_id": o.parent_order_id,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]