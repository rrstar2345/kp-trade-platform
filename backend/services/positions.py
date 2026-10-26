"""
Positions service — P1-08 to P1-11
- In-memory cache of latest net positions across all active accounts
- 5-second polling loop that fetches from Dhan and broadcasts via WS
"""
import asyncio
import logging
from typing import List, Dict, Any

from ..db.database import SessionLocal
from ..db.models import Account
from ..db.encryption import decrypt
from ..broker.factory import get_broker

logger = logging.getLogger(__name__)


class PositionsCache:
    """Thread-safe in-memory store for merged positions."""

    def __init__(self):
        self._positions: List[Dict[str, Any]] = []

    def set(self, positions: List[Dict[str, Any]]):
        self._positions = positions

    def get_all(self) -> List[Dict[str, Any]]:
        return list(self._positions)


positions_cache = PositionsCache()


def _fetch_account_positions(acc: Account) -> List[Dict[str, Any]]:
    """Fetch net positions from Dhan for a single account."""
    client_id = acc.client_id or ""
    access_token = decrypt(acc.access_token_enc) if acc.access_token_enc else ""
    if not client_id or not access_token:
        return []

    try:
        broker = get_broker(acc.broker, client_id, access_token)
        resp = broker.get_positions()
        if resp.get("status") != "success":
            return []

        results = []
        # Dhan returns {"data": {"netPositions": [...], "dayPositions": [...]}}
        net_positions = resp.get("data", {}).get("netPositions", [])
        for pos in net_positions:
            qty = pos.get("netQty", 0)
            if qty == 0:
                continue
            avg_price = pos.get("costPrice", 0.0) or 0.0
            ltp = pos.get("lastTradedPrice", 0.0) or 0.0
            pnl = pos.get("unrealizedProfit", 0.0) or 0.0

            results.append({
                "account_id": acc.id,
                "account_name": acc.name,
                "instrument": pos.get("tradingSymbol", ""),
                "security_id": pos.get("securityId", ""),
                "exchange_segment": pos.get("exchangeSegment", ""),
                "quantity": qty,
                "avg_price": avg_price,
                "ltp": ltp,
                "pnl": pnl,
                "product_type": pos.get("productType", ""),
            })
        return results
    except Exception as e:
        logger.warning("Failed to fetch positions for account %s: %s", acc.id, e)
        return []


async def poll_positions_loop(broadcast_fn):
    """Background task: poll every 5 seconds, update cache, broadcast."""
    while True:
        try:
            db = SessionLocal()
            try:
                accounts = (
                    db.query(Account)
                    .filter(Account.session_active == True)  # noqa: E712
                    .all()
                )
            finally:
                db.close()

            all_positions: List[Dict[str, Any]] = []
            for acc in accounts:
                positions = await asyncio.get_event_loop().run_in_executor(
                    None, _fetch_account_positions, acc
                )
                all_positions.extend(positions)

            positions_cache.set(all_positions)
            await broadcast_fn({"type": "positions_update", "data": all_positions})

        except Exception as e:
            logger.error("positions poll error: %s", e)

        await asyncio.sleep(5)