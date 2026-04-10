import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.quiz_result import QuizResult
from app.schemas.quiz import QuizGenerateRequest, QuizOut, QuizSubmitRequest, QuizResultOut
from app.routes.deps import get_current_user
from app.services.ai_service import generate_quiz

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.post("/generate", response_model=QuizOut)
async def quiz_generate(
    data: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == data.doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")

    questions = await generate_quiz(doc.raw_text, data.num_questions)
    quiz_id = str(uuid.uuid4())

    return QuizOut(quiz_id=quiz_id, doc_id=data.doc_id, questions=questions)


@router.post("/submit", response_model=QuizResultOut)
async def quiz_submit(
    data: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(data.answers) != len(data.questions):
        raise HTTPException(status_code=400, detail="Nombre de réponses incorrect.")

    corrections = []
    correct_count = 0

    for question, user_answer in zip(data.questions, data.answers):
        is_correct = user_answer.strip().upper() == question.correct_answer.strip().upper()
        if is_correct:
            correct_count += 1
        corrections.append({
            "question_id": question.id,
            "question": question.question,
            "user_answer": user_answer,
            "correct_answer": question.correct_answer,
            "is_correct": is_correct,
            "explanation": question.explanation if not is_correct else None,
        })

    score = round(correct_count / len(data.questions) * 100, 2)

    result = QuizResult(
        user_id=current_user.id,
        document_id=data.doc_id,
        score=score,
        total_questions=len(data.questions),
        answers=[{"q": q.id, "a": a} for q, a in zip(data.questions, data.answers)],
    )
    db.add(result)
    db.commit()

    return QuizResultOut(
        score=score,
        total_questions=len(data.questions),
        correct_count=correct_count,
        corrections=corrections,
    )
