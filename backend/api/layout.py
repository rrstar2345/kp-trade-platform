from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..db.database import get_db
from ..db.models import LayoutConfig

router = APIRouter(prefix="/layout", tags=["layout"])


class LayoutPayload(BaseModel):
    layout_json: str


@router.get("")
def get_layout(db: Session = Depends(get_db)):
    config = db.query(LayoutConfig).first()
    if not config:
        return {"layout_json": "{}"}
    return {"layout_json": config.layout_json}


@router.put("")
def save_layout(payload: LayoutPayload, db: Session = Depends(get_db)):
    config = db.query(LayoutConfig).first()
    if config:
        config.layout_json = payload.layout_json
    else:
        config = LayoutConfig(layout_json=payload.layout_json)
        db.add(config)
    db.commit()
    return {"status": "saved"}
