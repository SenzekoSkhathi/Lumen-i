from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Optional

from database import get_db
from models import HelpRequest, HelpRequestPublic, UserModule, Module, User
from security import get_current_user

router = APIRouter(prefix="/api/help-requests", tags=["Help Requests"], dependencies=[Depends(get_current_user)])


class HelpRequestCreate(BaseModel):
    module_id: Optional[int] = None
    message: str


def ensure_module_access(module_id: int, user: User, session: Session) -> None:
    if user.role == "admin":
        return

    link = session.exec(
        select(UserModule).where(
            UserModule.user_id == user.id,
            UserModule.module_id == module_id,
        )
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="No access to this module.")


@router.post("", response_model=HelpRequestPublic, status_code=status.HTTP_201_CREATED)
def create_help_request(
    payload: HelpRequestCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if payload.module_id:
        module = session.get(Module, payload.module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        ensure_module_access(payload.module_id, current_user, session)

    request = HelpRequest(
        user_id=current_user.id,
        module_id=payload.module_id,
        message=payload.message.strip(),
    )

    session.add(request)
    session.commit()
    session.refresh(request)
    return HelpRequestPublic.model_validate(request)
