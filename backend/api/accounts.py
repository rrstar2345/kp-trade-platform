"""
Accounts CRUD API — P1-01 to P1-04
GET/POST/PUT/DELETE /api/accounts
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from ..db.database import get_db
from ..db.models import Account
from ..db.encryption import encrypt, decrypt
from ..broker.factory import get_broker

router = APIRouter(prefix="/accounts", tags=["accounts"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class AccountCreate(BaseModel):
    name: str
    broker: str = "dhan"
    client_id: str = ""
    access_token: str = ""        # plain; stored encrypted
    app_id: str = ""
    app_secret: str = ""          # plain; stored encrypted
    api_key: str = ""             # plain; stored encrypted
    is_parent: bool = False
    parent_id: Optional[int] = None
    trade_factor: float = Field(1.0, ge=0.01, le=1.0)
    session_active: bool = True
    proxy_url: Optional[str] = None
    proxy_port: Optional[int] = None
    proxy_username: Optional[str] = None
    proxy_password: Optional[str] = None  # plain; stored encrypted


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    broker: Optional[str] = None
    client_id: Optional[str] = None
    access_token: Optional[str] = None
    app_id: Optional[str] = None
    app_secret: Optional[str] = None
    api_key: Optional[str] = None
    is_parent: Optional[bool] = None
    parent_id: Optional[int] = None
    trade_factor: Optional[float] = Field(None, ge=0.01, le=1.0)
    session_active: Optional[bool] = None
    proxy_url: Optional[str] = None
    proxy_port: Optional[int] = None
    proxy_username: Optional[str] = None
    proxy_password: Optional[str] = None


class AccountResponse(BaseModel):
    id: int
    name: str
    broker: str
    client_id: str
    is_parent: bool
    parent_id: Optional[int]
    trade_factor: float
    session_active: bool
    proxy_url: Optional[str]
    proxy_port: Optional[int]
    proxy_username: Optional[str]

    class Config:
        from_attributes = True


def _to_response(acc: Account) -> dict:
    return {
        "id": acc.id,
        "name": acc.name,
        "broker": acc.broker,
        "client_id": acc.client_id or "",
        "is_parent": acc.is_parent,
        "parent_id": acc.parent_id,
        "trade_factor": acc.trade_factor,
        "session_active": acc.session_active,
        "proxy_url": acc.proxy_url,
        "proxy_port": acc.proxy_port,
        "proxy_username": acc.proxy_username,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("")
def list_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).all()
    return [_to_response(a) for a in accounts]


@router.get("/{account_id}")
def get_account(account_id: int, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(404, "Account not found")
    return _to_response(acc)


@router.post("", status_code=201)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    acc = Account(
        name=payload.name,
        broker=payload.broker,
        client_id=payload.client_id,
        access_token_enc=encrypt(payload.access_token) if payload.access_token else "",
        app_id=payload.app_id,
        app_secret_enc=encrypt(payload.app_secret) if payload.app_secret else "",
        api_key_enc=encrypt(payload.api_key) if payload.api_key else "",
        is_parent=payload.is_parent,
        parent_id=payload.parent_id,
        trade_factor=payload.trade_factor,
        session_active=payload.session_active,
        proxy_url=payload.proxy_url,
        proxy_port=payload.proxy_port,
        proxy_username=payload.proxy_username,
        proxy_password_enc=encrypt(payload.proxy_password) if payload.proxy_password else "",
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return _to_response(acc)


@router.put("/{account_id}")
def update_account(account_id: int, payload: AccountUpdate, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(404, "Account not found")

    if payload.name is not None:
        acc.name = payload.name
    if payload.broker is not None:
        acc.broker = payload.broker
    if payload.client_id is not None:
        acc.client_id = payload.client_id
    if payload.access_token is not None:
        acc.access_token_enc = encrypt(payload.access_token)
    if payload.app_id is not None:
        acc.app_id = payload.app_id
    if payload.app_secret is not None:
        acc.app_secret_enc = encrypt(payload.app_secret)
    if payload.api_key is not None:
        acc.api_key_enc = encrypt(payload.api_key)
    if payload.is_parent is not None:
        acc.is_parent = payload.is_parent
    if payload.parent_id is not None:
        acc.parent_id = payload.parent_id
    if payload.trade_factor is not None:
        acc.trade_factor = payload.trade_factor
    if payload.session_active is not None:
        acc.session_active = payload.session_active
    if payload.proxy_url is not None:
        acc.proxy_url = payload.proxy_url
    if payload.proxy_port is not None:
        acc.proxy_port = payload.proxy_port
    if payload.proxy_username is not None:
        acc.proxy_username = payload.proxy_username
    if payload.proxy_password is not None:
        acc.proxy_password_enc = encrypt(payload.proxy_password)

    db.commit()
    db.refresh(acc)
    return _to_response(acc)


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(404, "Account not found")
    db.delete(acc)
    db.commit()


@router.post("/{account_id}/test-connection")
def test_connection(account_id: int, db: Session = Depends(get_db)):
    """Test broker credentials for an account — P1-02."""
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc:
        raise HTTPException(404, "Account not found")

    client_id = acc.client_id or ""
    access_token = decrypt(acc.access_token_enc) if acc.access_token_enc else ""

    if not client_id or not access_token:
        return {"success": False, "message": "client_id or access_token not set"}

    try:
        broker = get_broker(acc.broker, client_id, access_token)
        result = broker.test_connection()
        if result.get("status") == "success":
            return {"success": True, "message": "Connection successful", "data": result.get("data")}
        return {"success": False, "message": result.get("remarks", "Unknown error")}
    except Exception as e:
        return {"success": False, "message": str(e)}