from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.quiz_result import QuizResult
from app.routes.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/me")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc_count = db.query(func.count(Document.id)).filter(Document.user_id == current_user.id).scalar()

    results = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == current_user.id)
        .order_by(QuizResult.created_at)
        .all()
    )

    quiz_count = len(results)
    avg_score = round(sum(r.score for r in results) / quiz_count, 2) if quiz_count else 0

    score_history = [
        {
            "date": r.created_at.isoformat(),
            "score": r.score,
            "document_id": r.document_id,
        }
        for r in results
    ]

    # Scores par document
    docs_scores = {}
    for r in results:
        if r.document_id not in docs_scores:
            docs_scores[r.document_id] = []
        docs_scores[r.document_id].append(r.score)

    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    documents_summary = [
        {
            "id": d.id,
            "filename": d.filename,
            "page_count": d.page_count,
            "avg_score": round(sum(docs_scores.get(d.id, [0])) / max(len(docs_scores.get(d.id, [1])), 1), 2),
            "quiz_count": len(docs_scores.get(d.id, [])),
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]

    return {
        "doc_count": doc_count,
        "quiz_count": quiz_count,
        "avg_score": avg_score,
        "score_history": score_history,
        "documents": documents_summary,
    }
