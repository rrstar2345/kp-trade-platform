"""
Overview service — P1-14 to P1-15
Aggregate realized P&L (from order history) + unrealized (from positions cache).
"""
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from ..db.models import Account
from ..db.encryption import decrypt
from ..broker.factory import get_broker
from .positions import positions_cache

logger = logging.getLogger(__name__)


def _get_realized_pnl(acc: Account) -> float:
    """Compute realized P&L from today's order fills via Dhan."""
    client_id = acc.client_id or ""
    access_token = decrypt(acc.access_token_enc) if acc.access_token_enc else ""
    if not client_id or not access_token:
        return 0.0

    try:
        broker = get_broker(acc.broker, client_id, access_token)
        resp = broker.get_positions()
        if resp.get("status") != "success":
            return 0.0
        # Dhan includes realizedProfit in netPositions
        net_positions = resp.get("data", {}).get("netPositions", [])
        realized = sum(float(p.get("realizedProfit", 0.0) or 0.0) for p in net_positions)
        return realized
    except Exception as e:
        logger.warning("Failed realized P&L for account %s: %s", acc.id, e)
        return 0.0


def get_overview_data(db: Session) -> Dict[str, Any]:
    accounts = (
        db.query(Account)
        .filter(Account.session_active == True)  # noqa: E712
        .all()
    )

    # Group cached positions by account
    pos_by_account: Dict[int, List[Dict]] = {}
    for pos in positions_cache.get_all():
        aid = pos["account_id"]
        pos_by_account.setdefault(aid, []).append(pos)

    account_summaries = []
    total_pnl = 0.0

    for acc in accounts:
        unrealized = sum(p["pnl"] for p in pos_by_account.get(acc.id, []))
        realized = _get_realized_pnl(acc)
        total = realized + unrealized
        total_pnl += total
        account_summaries.append({
            "account_id": acc.id,
            "account_name": acc.name,
            "realized_pnl": round(realized, 2),
            "unrealized_pnl": round(unrealized, 2),
            "total_pnl": round(total, 2),
        })

    return {
        "total_pnl": round(total_pnl, 2),
        "accounts": account_summaries,
    }