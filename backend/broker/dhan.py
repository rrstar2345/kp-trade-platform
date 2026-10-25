"""
Dhan broker wrapper.
Wraps DhanHQ-py SDK calls and provides a uniform interface.
"""
from dhanhq import DhanContext, dhanhq


class DhanBroker:
    def __init__(self, client_id: str, access_token: str):
        self.client_id = client_id
        self._ctx = DhanContext(client_id, access_token)
        self._dhan = dhanhq(self._ctx)

    def test_connection(self) -> dict:
        """Test credentials by fetching fund limits."""
        return self._dhan.get_fund_limits()

    def get_positions(self) -> dict:
        return self._dhan.get_positions()

    def get_holdings(self) -> dict:
        return self._dhan.get_holdings()

    def get_order_list(self) -> dict:
        return self._dhan.get_order_list()

    def get_fund_limits(self) -> dict:
        return self._dhan.get_fund_limits()

    def place_order(self, **kwargs) -> dict:
        return self._dhan.place_order(**kwargs)

    def option_chain(self, under_security_id: int, under_exchange_segment: str, expiry: str) -> dict:
        return self._dhan.option_chain(
            under_security_id=under_security_id,
            under_exchange_segment=under_exchange_segment,
            expiry=expiry,
        )

    @property
    def dhan_context(self):
        return self._ctx
