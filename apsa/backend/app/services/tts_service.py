"""
Service TTS (Text-to-Speech) — Kokoro-82M
Voix française : ff_siwis
"""
import io
import numpy as np
import soundfile as sf

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from kokoro import KPipeline
        _pipeline = KPipeline(lang_code="f")  # "f" = French
    return _pipeline


async def synthesize_speech(text: str) -> bytes:
    """Convertit du texte en audio WAV (bytes) via Kokoro-82M."""
    pipeline = _get_pipeline()

    audio_chunks = []
    for _, _, audio in pipeline(text, voice="ff_siwis", speed=1.0):
        audio_chunks.append(audio)

    if not audio_chunks:
        raise ValueError("Kokoro n'a produit aucun audio.")

    audio_np = np.concatenate(audio_chunks)

    buf = io.BytesIO()
    sf.write(buf, audio_np, samplerate=24000, format="WAV")
    buf.seek(0)
    return buf.read()
