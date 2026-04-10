import whisper
import tempfile
import os
from app.config import settings

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = whisper.load_model(settings.WHISPER_MODEL)
    return _model


async def transcribe_audio(file_bytes: bytes, content_type: str) -> str:
    """Transcrit un fichier audio en texte via Whisper local."""
    ext_map = {
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/mpeg": ".mp3",
        "audio/webm": ".webm",
        "audio/ogg": ".ogg",
    }
    ext = ext_map.get(content_type, ".wav")

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        model = _get_model()
        result = model.transcribe(tmp_path, language="fr")
        return result["text"].strip()
    finally:
        os.unlink(tmp_path)
