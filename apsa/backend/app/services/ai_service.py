import json
import re
import time
from google import genai
from google.genai.errors import ClientError, ServerError
from fastapi import HTTPException
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash"]

SUMMARY_PROMPT = """
Tu es un assistant pédagogique expert. Voici le contenu d'un cours :

{text}

Génère un résumé {length} en français avec :
- Les idées principales clairement énoncées
- Les concepts clés en **gras**
- Une liste des définitions importantes à la fin

Format : Markdown structuré avec titres et listes.
"""

QUIZ_PROMPT = """
Tu es un professeur qui crée des évaluations. Voici le contenu d'un cours :

{text}

Génère exactement {num_questions} questions QCM en français basées UNIQUEMENT sur ce contenu.

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{{
  "questions": [
    {{
      "id": 1,
      "question": "...",
      "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": "A",
      "explanation": "Explication détaillée pourquoi c'est la bonne réponse..."
    }}
  ]
}}
"""

CHAT_PROMPT = """
Tu es un assistant pédagogique. Tu aides un étudiant à comprendre son cours.

CONTENU DU COURS :
{document_text}

RÈGLE ABSOLUE : Réponds UNIQUEMENT en te basant sur le contenu du cours ci-dessus.
Si la question ne concerne pas le cours, dis-le poliment.
Explique de façon claire, avec des exemples si nécessaire.
"""


def _truncate(text: str, max_chars: int = 28000) -> str:
    return text[:max_chars] if len(text) > max_chars else text


def _call_gemini(prompt: str) -> str:
    last_error = None
    for model in MODELS:
        for attempt in range(4):
            try:
                response = client.models.generate_content(model=model, contents=prompt)
                return response.text
            except ClientError as e:
                if "RESOURCE_EXHAUSTED" in str(e.status):
                    last_error = f"Quota épuisé pour {model}"
                    break  # essaie le modèle suivant
                raise HTTPException(status_code=502, detail=f"Erreur Gemini : {e.message}")
            except ServerError:
                wait = 5 * (attempt + 1)
                time.sleep(wait)
                last_error = f"Serveur surchargé pour {model}"
    raise HTTPException(status_code=503, detail=f"Tous les modèles Gemini sont indisponibles. ({last_error})")


async def generate_summary(text: str, length: str = "medium") -> tuple[str, list]:
    length_label = {
        "short": "court (5-8 phrases)",
        "medium": "moyen (1-2 pages)",
        "detailed": "détaillé et exhaustif",
    }.get(length, "moyen")

    prompt = SUMMARY_PROMPT.format(text=_truncate(text), length=length_label)
    summary = _call_gemini(prompt)

    keywords = re.findall(r"\*\*(.+?)\*\*", summary)
    keywords = list(set(keywords))[:20]

    return summary, keywords


async def generate_quiz(text: str, num_questions: int = 10) -> list:
    prompt = QUIZ_PROMPT.format(text=_truncate(text), num_questions=num_questions)
    raw = _call_gemini(prompt)

    raw = re.sub(r"```json\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)

    data = json.loads(raw.strip())
    return data["questions"]


async def generate_chat_response(document_text: str, history: list, message: str) -> str:
    system = CHAT_PROMPT.format(document_text=_truncate(document_text))
    full_message = f"{system}\n\nQuestion de l'étudiant : {message}"
    return _call_gemini(full_message)
