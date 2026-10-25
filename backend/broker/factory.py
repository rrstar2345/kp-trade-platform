"""
Broker factory — returns the right broker client for a given broker name.
Extend this when adding new brokers.
"""
from .dhan import DhanBroker


def get_broker(broker: str, client_id: str, access_token: str):
    if broker == "dhan":
        return DhanBroker(client_id=client_id, access_token=access_token)
    raise ValueError(f"Unsupported broker: {broker}")
