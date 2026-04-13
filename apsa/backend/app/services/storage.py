"""
Supabase Storage — upload et suppression de PDFs.
Le bucket doit être créé manuellement dans Supabase Dashboard (Storage > New bucket)
avec le nom défini dans settings.SUPABASE_BUCKET (défaut : "pdfs") et en mode PUBLIC.
"""
from __future__ import annotations
from app.config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        from supabase import create_client
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client


def _is_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)


def upload_pdf(user_id: int, doc_id: int, content: bytes) -> str | None:
    """
    Upload le PDF dans le bucket Supabase et retourne l'URL publique.
    Retourne None si Supabase n'est pas configuré.
    """
    if not _is_configured():
        return None

    sb   = _get_client()
    path = f"{user_id}/{doc_id}.pdf"

    sb.storage.from_(settings.SUPABASE_BUCKET).upload(
        path=path,
        file=content,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )

    return sb.storage.from_(settings.SUPABASE_BUCKET).get_public_url(path)


def delete_pdf(user_id: int, doc_id: int) -> None:
    """
    Supprime le PDF du bucket Supabase.
    Silencieux si Supabase n'est pas configuré ou si le fichier est introuvable.
    """
    if not _is_configured():
        return

    try:
        sb   = _get_client()
        path = f"{user_id}/{doc_id}.pdf"
        sb.storage.from_(settings.SUPABASE_BUCKET).remove([path])
    except Exception:
        pass
