from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from database import get_db
from models import Module, ModulePublic, UserModule, User
from security import get_current_user

router = APIRouter(prefix="/api/modules", tags=["Modules"], dependencies=[Depends(get_current_user)])


def get_user_modules(user: User, session: Session) -> List[Module]:
    if user.role == "admin":
        return session.exec(select(Module).order_by(Module.code)).all()

    return session.exec(
        select(Module)
        .join(UserModule)
        .where(UserModule.user_id == user.id)
        .order_by(Module.code)
    ).all()


@router.get("/mine", response_model=List[ModulePublic])
def list_my_modules(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    modules = get_user_modules(current_user, session)
    return [ModulePublic.model_validate(module) for module in modules]
