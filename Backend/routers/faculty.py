from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Optional
from pathlib import Path
import os
from uuid import uuid4

from database import get_db
from models import (
    Module,
    ModulePublic,
    ModuleMaterial,
    ModuleMaterialPublic,
    UserModule,
    User,
)
from security import require_role
from models import utc_now
from ingestion import ingest_material, delete_material_vectors

router = APIRouter(prefix="/api/faculty", tags=["Faculty Studio"])

FACULTY_UPLOAD_DIR = Path(
    os.getenv("FACULTY_UPLOAD_DIR", "faculty_uploads")
).resolve()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


def ensure_module_access(module_id: int, user: User, session: Session) -> Module:
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if user.role == "admin":
        return module

    if user.role != "lecturer":
        raise HTTPException(status_code=403, detail="Operation not permitted for this role.")

    link = session.exec(
        select(UserModule).where(
            UserModule.user_id == user.id,
            UserModule.module_id == module_id,
        )
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="No access to this module.")

    return module


def validate_upload(file: UploadFile) -> str:
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type.")

    if file.content_type not in ALLOWED_CONTENT_TYPES and file.content_type != "application/octet-stream":
        raise HTTPException(status_code=400, detail="Invalid content type.")

    return suffix


@router.get("/modules", response_model=List[ModulePublic], dependencies=[Depends(require_role("admin", "lecturer"))])
def list_modules(
    session: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lecturer")),
):
    if current_user.role == "admin":
        modules = session.exec(select(Module).order_by(Module.code)).all()
    else:
        modules = session.exec(
            select(Module)
            .join(UserModule)
            .where(UserModule.user_id == current_user.id)
            .order_by(Module.code)
        ).all()

    return [ModulePublic.model_validate(module) for module in modules]


@router.put("/modules/{module_id}/guidelines", response_model=ModulePublic, dependencies=[Depends(require_role("admin", "lecturer"))])
def update_module_guidelines(
    module_id: int,
    guidelines: str = Form(...),
    session: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lecturer")),
):
    module = ensure_module_access(module_id, current_user, session)
    module.system_prompt = guidelines
    session.add(module)
    session.commit()
    session.refresh(module)
    return ModulePublic.model_validate(module)


@router.get("/modules/{module_id}/materials", response_model=List[ModuleMaterialPublic], dependencies=[Depends(require_role("admin", "lecturer"))])
def list_module_materials(
    module_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lecturer")),
):
    ensure_module_access(module_id, current_user, session)

    materials = session.exec(
        select(ModuleMaterial)
        .where(ModuleMaterial.module_id == module_id)
        .order_by(ModuleMaterial.created_at.desc())
    ).all()

    return [ModuleMaterialPublic.model_validate(material) for material in materials]


@router.post("/modules/{module_id}/materials", response_model=ModuleMaterialPublic, dependencies=[Depends(require_role("admin", "lecturer"))])
async def upload_module_material(
    module_id: int,
    background_tasks: BackgroundTasks,
    tag: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lecturer")),
):
    ensure_module_access(module_id, current_user, session)

    suffix = validate_upload(file)
    FACULTY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    storage_filename = f"{uuid4().hex}{suffix}"
    storage_path = FACULTY_UPLOAD_DIR / storage_filename

    with storage_path.open("wb") as target:
        contents = await file.read()
        target.write(contents)

    material = ModuleMaterial(
        module_id=module_id,
        uploader_id=current_user.id,
        original_filename=file.filename,
        storage_filename=storage_filename,
        content_type=file.content_type or "application/octet-stream",
        tag=tag,
        created_at=utc_now(),
        updated_at=utc_now(),
    )

    session.add(material)
    session.commit()
    session.refresh(material)

    background_tasks.add_task(ingest_material, material.id)

    return ModuleMaterialPublic.model_validate(material)


@router.put("/materials/{material_id}", response_model=ModuleMaterialPublic, dependencies=[Depends(require_role("admin", "lecturer"))])
async def update_module_material(
    material_id: int,
    background_tasks: BackgroundTasks,
    tag: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    session: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lecturer")),
):
    material = session.get(ModuleMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    ensure_module_access(material.module_id, current_user, session)

    if tag:
        material.tag = tag

    if file:
        suffix = validate_upload(file)
        FACULTY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        new_storage_filename = f"{uuid4().hex}{suffix}"
        new_storage_path = FACULTY_UPLOAD_DIR / new_storage_filename

        with new_storage_path.open("wb") as target:
            contents = await file.read()
            target.write(contents)

        old_path = FACULTY_UPLOAD_DIR / material.storage_filename
        if old_path.exists():
            old_path.unlink()

        material.storage_filename = new_storage_filename
        material.original_filename = file.filename
        material.content_type = file.content_type or "application/octet-stream"

    material.updated_at = utc_now()

    session.add(material)
    session.commit()
    session.refresh(material)

    background_tasks.add_task(ingest_material, material.id)

    return ModuleMaterialPublic.model_validate(material)


@router.delete("/materials/{material_id}", status_code=204, dependencies=[Depends(require_role("admin", "lecturer"))])
def delete_module_material(
    material_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lecturer")),
):
    material = session.get(ModuleMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    ensure_module_access(material.module_id, current_user, session)

    storage_path = FACULTY_UPLOAD_DIR / material.storage_filename
    if storage_path.exists():
        storage_path.unlink()

    session.delete(material)
    session.commit()

    delete_material_vectors(material_id)
    return
