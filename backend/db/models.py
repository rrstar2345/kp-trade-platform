from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text,
    ForeignKey, DateTime, func
)
from sqlalchemy.orm import declarative_base, relationship, backref

Base = declarative_base()


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    broker = Column(String, default="dhan")

    # Dhan credentials (encrypted at rest)
    client_id = Column(String)
    access_token_enc = Column(Text)
    app_id = Column(String)
    app_secret_enc = Column(Text)
    api_key_enc = Column(Text)

    # Hierarchy
    is_parent = Column(Boolean, default=False)
    parent_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    trade_factor = Column(Float, default=1.0)  # 0.01–1.0; children only
    session_active = Column(Boolean, default=True)

    # Trade proxy (optional)
    proxy_url = Column(String, nullable=True)
    proxy_port = Column(Integer, nullable=True)
    proxy_username = Column(String, nullable=True)
    proxy_password_enc = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    children = relationship(
        "Account",
        backref=backref("parent", remote_side="Account.id"),
        foreign_keys=[parent_id],
    )


class LayoutConfig(Base):
    __tablename__ = "layout_config"

    id = Column(Integer, primary_key=True)
    layout_json = Column(Text, nullable=False, default="{}")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class OrderLog(Base):
    __tablename__ = "order_log"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    order_id = Column(String, index=True)
    instrument = Column(String)
    exchange_segment = Column(String)
    transaction_type = Column(String)   # BUY / SELL
    quantity = Column(Integer)
    price = Column(Float, nullable=True)
    order_type = Column(String)          # LIMIT / MARKET
    product_type = Column(String)        # INTRADAY / DELIVERY
    status = Column(String)
    is_copy = Column(Boolean, default=False)
    parent_order_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())