from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import SummaryOut
from app.routes.deps import get_current_user
from app.services.ai_service import generate_summary

router = APIRouter(tags=["summary"])


@router.get("/summary/{doc_id}", response_model=SummaryOut)
async def get_summary(
    doc_id: int,
    length: str = Query("medium", pattern="^(short|medium|detailed)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")

    # Cache en DB — ne pas rappeler Gemini si déjà généré
    cached = getattr(doc, f"summary_{length}")
    if cached:
        keywords = doc.keywords or []
        return SummaryOut(doc_id=doc.id, length=length, summary=cached, keywords=keywords)

    summary, keywords = await generate_summary(doc.raw_text, length)

    setattr(doc, f"summary_{length}", summary)
    doc.keywords = keywords
    db.commit()

    return SummaryOut(doc_id=doc.id, length=length, summary=summary, keywords=keywords)
