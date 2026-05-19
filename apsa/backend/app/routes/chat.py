import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.document import Document
from app.models.chat_history import ChatHistory
from app.routes.deps import get_current_user
from app.services.ai_service import generate_chat_response_stream
from app.services.whisper_service import transcribe_audio

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    doc_id: int
    message: str
    history: Optional[List[ChatMessage]] = []


def _save_messages(user_id: int, doc_id: int, user_text: str, assistant_text: str):
    db = SessionLocal()
    try:
        db.add(ChatHistory(user_id=user_id, doc_id=doc_id, role="user",      content=user_text))
        db.add(ChatHistory(user_id=user_id, doc_id=doc_id, role="assistant", content=assistant_text))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


@router.get("/history")
def get_history(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id, ChatHistory.doc_id == doc_id)
        .order_by(ChatHistory.created_at)
        .limit(200)
        .all()
    )
    return [{"role": r.role, "content": r.content} for r in rows]


@router.delete("/history")
def clear_history(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id,
        ChatHistory.doc_id == doc_id,
    ).delete()
    db.commit()
    return {"ok": True}


@router.post("")
async def chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == data.doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")

    history = [{"role": m.role, "content": m.content} for m in (data.history or [])]
    uid, did, user_text = current_user.id, data.doc_id, data.message

    async def event_stream():
        chunks = []
        async for chunk in generate_chat_response_stream(doc.raw_text, history, user_text):
            chunks.append(chunk)
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"
        _save_messages(uid, did, user_text, "".join(chunks))

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@router.post("/voice")
async def chat_voice(
    doc_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")

    audio_bytes = await file.read()
    transcription = await transcribe_audio(audio_bytes, file.content_type)
    uid, did = current_user.id, doc_id

    async def event_stream():
        yield f"data: {json.dumps({'type': 'transcription', 'text': transcription})}\n\n"
        chunks = []
        async for chunk in generate_chat_response_stream(doc.raw_text, [], transcription):
            chunks.append(chunk)
            yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"
        _save_messages(uid, did, transcription, "".join(chunks))

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
