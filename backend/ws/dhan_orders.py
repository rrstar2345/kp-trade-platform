"""
Dhan OrderUpdate WebSocket bridge — P1-21 to P1-22
Connects to Dhan's order update feed for each active account and
broadcasts updates to all frontend clients via the internal WS manager.
"""
import asyncio
import logging
from typing import Callable

from ..db.database import SessionLocal
from ..db.models import Account, OrderLog
from ..db.encryption import decrypt

logger = logging.getLogger(__name__)


async def _listen_account_orders(acc: Account, broadcast_fn: Callable):
    """
    Subscribe to Dhan OrderUpdate feed for one account.
    Dhan's dhanhq library provides order_update websocket via DhanSDK.
    We wrap it to run asynchronously and broadcast updates.
    """
    client_id = acc.client_id or ""
    access_token = decrypt(acc.access_token_enc) if acc.access_token_enc else ""
    if not client_id or not access_token:
        return

    try:
        # Dhan's order-update WS via dhanhq
        from dhanhq import DhanContext
        from dhanhq import orderupdate

        ctx = DhanContext(client_id, access_token)

        def on_message(data):
            """Called by Dhan SDK on each order update."""
            asyncio.create_task(_handle_order_update(acc, data, broadcast_fn))

        def on_close(code, reason):
            logger.info("Dhan order WS closed for account %s: %s %s", acc.id, code, reason)

        def on_error(error):
            logger.error("Dhan order WS error for account %s: %s", acc.id, error)

        feed = orderupdate.OrderUpdate(ctx)
        feed.on_message = on_message
        feed.on_close = on_close
        feed.on_error = on_error

        # Run the blocking connect in a thread so we don't block the event loop
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, feed.run_forever)

    except ImportError:
        logger.warning("dhanhq orderupdate module not available; skipping WS bridge for account %s", acc.id)
    except Exception as e:
        logger.error("Order WS bridge error for account %s: %s", acc.id, e)


async def _handle_order_update(acc: Account, data: dict, broadcast_fn: Callable):
    """Persist order update to DB and broadcast to frontend."""
    try:
        db = SessionLocal()
        try:
            order_id = str(data.get("orderId", ""))
            status = data.get("orderStatus", "UNKNOWN")

            # Upsert order log entry
            existing = db.query(OrderLog).filter(OrderLog.order_id == order_id).first()
            if existing:
                existing.status = status
                existing.price = data.get("price", existing.price)
                existing.quantity = data.get("quantity", existing.quantity)
                db.commit()
            else:
                entry = OrderLog(
                    account_id=acc.id,
                    order_id=order_id,
                    instrument=data.get("tradingSymbol", ""),
                    exchange_segment=data.get("exchangeSegment", ""),
                    transaction_type=data.get("transactionType", ""),
                    quantity=data.get("quantity", 0),
                    price=data.get("price", 0.0),
                    order_type=data.get("orderType", "MARKET"),
                    product_type=data.get("productType", "INTRADAY"),
                    status=status,
                    is_copy=False,
                )
                db.add(entry)
                db.commit()
        finally:
            db.close()

        await broadcast_fn({
            "type": "order_update",
            "data": {
                "account_id": acc.id,
                "account_name": acc.name,
                "order_id": order_id,
                "instrument": data.get("tradingSymbol", ""),
                "transaction_type": data.get("transactionType", ""),
                "quantity": data.get("quantity", 0),
                "price": data.get("price", 0.0),
                "status": status,
                "created_at": data.get("createTime", ""),
            },
        })
    except Exception as e:
        logger.error("Error handling order update: %s", e)


async def start_order_bridges(broadcast_fn: Callable):
    """Start order update WS connections for all active accounts."""
    db = SessionLocal()
    try:
        accounts = db.query(Account).filter(Account.session_active == True).all()  # noqa: E712
    finally:
        db.close()

    if not accounts:
        logger.info("No active accounts found for order WS bridges")
        return

    tasks = [_listen_account_orders(acc, broadcast_fn) for acc in accounts]
    await asyncio.gather(*tasks, return_exceptions=True)