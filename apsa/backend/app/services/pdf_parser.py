import fitz  # PyMuPDF
import re
from typing import Tuple


def extract_text(file_path: str) -> Tuple[str, int]:
    """Extrait le texte brut d'un PDF et retourne (texte_nettoyé, nb_pages)."""
    doc = fitz.open(file_path)
    page_count = len(doc)
    raw_pages = []

    for page in doc:
        raw_pages.append(page.get_text())

    doc.close()
    full_text = "\n".join(raw_pages)
    cleaned = _clean_text(full_text)
    return cleaned, page_count


def _clean_text(text: str) -> str:
    # Supprime les caractères de contrôle sauf newline
    text = re.sub(r"[^\S\n]+", " ", text)
    # Supprime les lignes vides multiples
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Supprime les espaces en début/fin de ligne
    text = "\n".join(line.strip() for line in text.splitlines())
    return text.strip()


def segment_by_chapters(text: str) -> dict:
    """Tente de segmenter le texte par chapitres."""
    patterns = [
        r"^(Chapitre\s+\w+[\s\S]*?)$",
        r"^(Chapter\s+\w+[\s\S]*?)$",
        r"^([IVX]+\.\s+.+)$",
        r"^(\d+\.\s+.+)$",
    ]
    combined = "|".join(patterns)
    lines = text.splitlines()
    chapters = {}
    current_title = "Introduction"
    current_content = []

    for line in lines:
        if re.match(combined, line, re.MULTILINE):
            if current_content:
                chapters[current_title] = "\n".join(current_content).strip()
            current_title = line.strip()
            current_content = []
        else:
            current_content.append(line)

    if current_content:
        chapters[current_title] = "\n".join(current_content).strip()

    return chapters
