import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentOut
from app.routes.deps import get_current_user
from app.services.pdf_parser import extract_text
from app.config import settings

router = APIRouter(tags=["upload"])

MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


@router.get("/upload/{doc_id}", response_model=DocumentOut)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    return DocumentOut(
        id=doc.id,
        filename=doc.filename,
        page_count=doc.page_count,
        preview_text=(doc.raw_text or "")[:500],
        created_at=doc.created_at,
    )


@router.delete("/upload/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    # Supprimer le fichier physique s'il existe
    file_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{doc.filename}")
    if os.path.exists(file_path):
        os.unlink(file_path)
    db.delete(doc)
    db.commit()


@router.post("/upload", response_model=DocumentOut)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"Fichier trop volumineux (max {settings.MAX_FILE_SIZE_MB} MB).")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{file.filename}")

    with open(save_path, "wb") as f:
        f.write(content)

    try:
        raw_text, page_count = extract_text(save_path)
    except Exception as e:
        os.unlink(save_path)
        raise HTTPException(status_code=422, detail=f"Impossible de lire le PDF : {str(e)}")

    if page_count > 100:
        os.unlink(save_path)
        raise HTTPException(status_code=400, detail="Le PDF ne doit pas dépasser 100 pages.")

    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        raw_text=raw_text,
        page_count=page_count,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentOut(
        id=doc.id,
        filename=doc.filename,
        page_count=doc.page_count,
        preview_text=raw_text[:500],
        created_at=doc.created_at,
    )
