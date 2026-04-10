from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.routes.deps import get_current_user
from app.services.ai_service import generate_chat_response
from app.services.whisper_service import transcribe_audio
from app.services.tts_service import synthesize_speech

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" ou "assistant"
    content: str


class ChatRequest(BaseModel):
    doc_id: int
    message: str
    history: Optional[List[ChatMessage]] = []


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
    response = await generate_chat_response(doc.raw_text, history, data.message)
    return {"response": response}


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
    response = await generate_chat_response(doc.raw_text, [], transcription)

    return {"transcription": transcription, "response": response}


@router.post("/tts")
async def tts(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Texte vide.")
    audio_bytes = await synthesize_speech(text)
    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=response.wav"},
    )
