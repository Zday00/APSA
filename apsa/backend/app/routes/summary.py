import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import SummaryOut
from app.routes.deps import get_current_user
from app.services.ai_service import generate_summary
from app.routes.upload import generating_summaries

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

    # Si le résumé medium est en cours de génération en arrière-plan, on attend
    if doc_id in generating_summaries and length == "medium":
        for _ in range(20):  # attend jusqu'à 60s (20 x 3s)
            await asyncio.sleep(3)
            db.refresh(doc)
            if doc.summary_medium:
                return SummaryOut(
                    doc_id=doc.id,
                    length=length,
                    summary=doc.summary_medium,
                    keywords=doc.keywords or [],
                )

    # Cache en DB — ne pas rappeler Gemini si déjà généré
    cached = getattr(doc, f"summary_{length}")
    if cached:
        return SummaryOut(doc_id=doc.id, length=length, summary=cached, keywords=doc.keywords or [])

    summary, keywords = await generate_summary(doc.raw_text, length)

    setattr(doc, f"summary_{length}", summary)
    doc.keywords = keywords
    db.commit()

    return SummaryOut(doc_id=doc.id, length=length, summary=summary, keywords=keywords)
