import asyncio
import tempfile
import os
import sys
from faster_whisper import WhisperModel

# Sur Windows, ctranslate2 a besoin des DLLs CUDA (cublas64_12.dll etc.)
# On les cherche dans le torch global si non trouvés dans le venv
if sys.platform == "win32":
    try:
        import torch as _torch
        _dll_path = os.path.join(os.path.dirname(_torch.__file__), "lib")
        if os.path.exists(_dll_path) and hasattr(os, "add_dll_directory"):
            os.add_dll_directory(_dll_path)
    except Exception:
        pass

_model = None


def _get_model(device: str = "cuda") -> WhisperModel:
    global _model
    if _model is None:
        if device == "cuda":
            try:
                _model = WhisperModel("large-v3", device="cuda", compute_type="int8_float16")
            except Exception:
                _model = WhisperModel("large-v3", device="cpu", compute_type="int8")
        else:
            _model = WhisperModel("large-v3", device="cpu", compute_type="int8")
    return _model


def _transcribe_sync(file_bytes: bytes, content_type: str) -> str:
    global _model
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
        model = _get_model(device="cuda")
        try:
            segments, _ = model.transcribe(tmp_path, language="fr", beam_size=5)
            return " ".join(seg.text.strip() for seg in segments)
        except RuntimeError as e:
            if "cublas" in str(e).lower() or "cuda" in str(e).lower():
                # CUDA indisponible dans ce contexte, bascule sur CPU
                _model = WhisperModel("large-v3", device="cpu", compute_type="int8")
                segments, _ = _model.transcribe(tmp_path, language="fr", beam_size=5)
                return " ".join(seg.text.strip() for seg in segments)
            raise
    finally:
        os.unlink(tmp_path)


async def transcribe_audio(file_bytes: bytes, content_type: str) -> str:
    return await asyncio.to_thread(_transcribe_sync, file_bytes, content_type)
