"""
Service TTS (Text-to-Speech) — Microsoft Edge TTS
Voix française : fr-FR-DeniseNeural (féminine) ou fr-FR-HenriNeural (masculine)
Gratuit, sans API key, qualité neurale.
"""
import io
import edge_tts

VOICE = "fr-FR-DeniseNeural"


async def synthesize_speech(text: str) -> bytes:
    """Convertit du texte en audio MP3 (bytes) via Edge TTS."""
    communicate = edge_tts.Communicate(text, VOICE)
    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    buf.seek(0)
    return buf.read()
