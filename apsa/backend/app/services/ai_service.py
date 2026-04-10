import json
import re
from google import genai
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.0-flash"

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


async def generate_summary(text: str, length: str = "medium") -> tuple[str, list]:
    length_label = {
        "short": "court (5-8 phrases)",
        "medium": "moyen (1-2 pages)",
        "detailed": "détaillé et exhaustif",
    }.get(length, "moyen")

    prompt = SUMMARY_PROMPT.format(text=_truncate(text), length=length_label)
    response = client.models.generate_content(model=MODEL, contents=prompt)
    summary = response.text

    keywords = re.findall(r"\*\*(.+?)\*\*", summary)
    keywords = list(set(keywords))[:20]

    return summary, keywords


async def generate_quiz(text: str, num_questions: int = 10) -> list:
    prompt = QUIZ_PROMPT.format(text=_truncate(text), num_questions=num_questions)
    response = client.models.generate_content(model=MODEL, contents=prompt)
    raw = response.text

    raw = re.sub(r"```json\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)

    data = json.loads(raw.strip())
    return data["questions"]


async def generate_chat_response(document_text: str, history: list, message: str) -> str:
    system = CHAT_PROMPT.format(document_text=_truncate(document_text))
    full_message = f"{system}\n\nQuestion de l'étudiant : {message}"

    response = client.models.generate_content(model=MODEL, contents=full_message)
    return response.text
