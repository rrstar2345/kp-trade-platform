"""
Trade Copy Core — P1-18 to P1-20
Given a parent order, compute child lots and place copies on all active children.
"""
import asyncio
import logging
import math
from typing import Any, Dict

from sqlalchemy.orm import Session

from ..db.models import Account, OrderLog
from ..db.encryption import decrypt
from ..broker.factory import get_broker

logger = logging.getLogger(__name__)


def _place_single_order(acc: Account, order_params: Dict[str, Any]) -> Dict[str, Any]:
    """Place one order on a single account (blocking, run in executor)."""
    client_id = acc.client_id or ""
    access_token = decrypt(acc.access_token_enc) if acc.access_token_enc else ""
    if not client_id or not access_token:
        return {"success": False, "message": "Missing credentials"}

    broker = get_broker(acc.broker, client_id, access_token)
    resp = broker.place_order(**order_params)
    return resp


async def place_and_copy(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    1. Place order on the parent account.
    2. Find all active children of that parent.
    3. For each child: compute lots = floor(parent_qty * trade_factor); skip if < 1.
    4. Place copy orders concurrently.
    5. Persist all orders to order_log.
    """
    account_id: int = payload["account_id"]

    parent_acc = db.query(Account).filter(
        Account.id == account_id,
        Account.session_active == True,  # noqa: E712
    ).first()

    if not parent_acc:
        return {"success": False, "message": "Parent account not found or inactive"}

    parent_qty: int = payload["quantity"]
    order_params = {
        "security_id": payload["security_id"],
        "exchange_segment": payload["exchange_segment"],
        "transaction_type": payload["transaction_type"],
        "quantity": parent_qty,
        "order_type": payload.get("order_type", "MARKET"),
        "product_type": payload.get("product_type", "INTRADAY"),
        "price": payload.get("price", 0.0),
        "disclosed_quantity": payload.get("disclosed_quantity", 0),
        "validity": payload.get("validity", "DAY"),
        "tag": payload.get("tag", ""),
        "trigger_price": 0,
        "after_market_order": False,
    }

    # ── Place parent order ────────────────────────────────────────────────────
    loop = asyncio.get_event_loop()
    parent_resp = await loop.run_in_executor(None, _place_single_order, parent_acc, order_params)
    parent_order_id = None

    if parent_resp.get("status") == "success":
        parent_order_id = parent_resp.get("data", {}).get("orderId") or parent_resp.get("data")
        _log_order(db, parent_acc, order_params, parent_order_id, parent_resp, is_copy=False)
        logger.info("Parent order placed: %s (account %s)", parent_order_id, parent_acc.id)
    else:
        msg = parent_resp.get("remarks", "Parent order failed")
        logger.error("Parent order failed for account %s: %s", parent_acc.id, msg)
        return {"success": False, "message": msg}

    # ── Find active children ──────────────────────────────────────────────────
    children = db.query(Account).filter(
        Account.parent_id == account_id,
        Account.session_active == True,  # noqa: E712
    ).all()

    copy_results = []

    async def copy_to_child(child: Account):
        child_qty = math.floor(parent_qty * child.trade_factor)
        if child_qty < 1:
            reason = f"Computed lots={child_qty} < 1 (trade_factor={child.trade_factor}); skipping"
            logger.info("Skipping child %s: %s", child.id, reason)
            _log_order(db, child, {**order_params, "quantity": 0}, parent_order_id, {}, is_copy=True, status="SKIPPED")
            copy_results.append({"account_id": child.id, "skipped": True, "reason": reason})
            return

        child_params = {**order_params, "quantity": child_qty}
        resp = await loop.run_in_executor(None, _place_single_order, child, child_params)
        child_order_id = None

        if resp.get("status") == "success":
            child_order_id = resp.get("data", {}).get("orderId") or resp.get("data")
            _log_order(db, child, child_params, child_order_id, resp, is_copy=True, parent_order_id=parent_order_id)
            copy_results.append({"account_id": child.id, "order_id": child_order_id, "quantity": child_qty})
        else:
            msg = resp.get("remarks", "Unknown error")
            logger.error("Copy failed for child %s: %s", child.id, msg)
            _log_order(db, child, child_params, None, resp, is_copy=True, status="REJECTED", parent_order_id=parent_order_id)
            copy_results.append({"account_id": child.id, "error": msg})

    await asyncio.gather(*[copy_to_child(c) for c in children])

    return {
        "success": True,
        "parent_order_id": parent_order_id,
        "copies": copy_results,
    }


def _log_order(
    db: Session,
    acc: Account,
    params: Dict[str, Any],
    order_id: Any,
    resp: Dict[str, Any],
    is_copy: bool = False,
    status: str = None,
    parent_order_id: Any = None,
):
    """Persist an order to order_log."""
    if status is None:
        status = "TRANSIT" if resp.get("status") == "success" else "REJECTED"

    entry = OrderLog(
        account_id=acc.id,
        order_id=str(order_id) if order_id else None,
        instrument=params.get("security_id", ""),
        exchange_segment=params.get("exchange_segment", ""),
        transaction_type=params.get("transaction_type", ""),
        quantity=params.get("quantity", 0),
        price=params.get("price", 0.0),
        order_type=params.get("order_type", "MARKET"),
        product_type=params.get("product_type", "INTRADAY"),
        status=status,
        is_copy=is_copy,
        parent_order_id=str(parent_order_id) if parent_order_id else None,
    )
    db.add(entry)
    db.commit()