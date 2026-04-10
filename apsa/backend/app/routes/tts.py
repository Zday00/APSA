from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.routes.deps import get_current_user
from app.services.tts_service import synthesize_speech

router = APIRouter(tags=["tts"])


class TTSRequest(BaseModel):
    text: str


@router.post("/tts")
async def text_to_speech(
    body: TTSRequest,
    current_user: User = Depends(get_current_user),
):
    if not body.text or not body.text.strip():
        raise HTTPException(status_code=400, detail="Texte vide.")

    if len(body.text) > 2000:
        raise HTTPException(status_code=400, detail="Texte trop long (max 2000 caractères).")

    audio_bytes = await synthesize_speech(body.text.strip())
    return Response(content=audio_bytes, media_type="audio/mpeg")
