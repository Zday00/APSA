# 🎓 APSA — AI-Powered Personal Study Assistant

## Contexte du projet

Tu es un agent de développement fullstack. Tu dois construire **APSA**, une application web qui permet à des étudiants d'uploader des fichiers PDF de cours et d'obtenir automatiquement : un résumé intelligent, un quiz QCM, et un assistant conversationnel contextuel avec support vocal.

Le projet est réalisé dans un cadre académique (module U4.6) et doit être **déployé en ligne** pour être démontré au jury via un simple lien URL.

---

## Stack technique (ne pas dévier de ces choix)

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| IA | Google Gemini Pro via `google-generativeai` SDK |
| Parsing PDF | PyMuPDF (`fitz`) |
| Vocal STT | Whisper local (`openai-whisper`) — 100% offline, aucune clé API |
| Vocal TTS | Qwen3-TTS local — 100% offline, aucune clé API |
| Base de données | PostgreSQL via Supabase |
| ORM | SQLAlchemy + Alembic |
| Auth | JWT (python-jose) |
| Déploiement | Frontend → Vercel / Backend → Render / DB → Supabase |

---

## Structure des dossiers à créer

```
apsa/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── UploadZone.jsx
│   │   │   ├── QuizCard.jsx
│   │   │   ├── SummaryView.jsx
│   │   │   ├── ChatWidget.jsx
│   │   │   └── ProgressChart.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Quiz.jsx
│   │   │   └── Chat.jsx
│   │   ├── api/
│   │   │   └── client.js        ← axios instance avec baseURL
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py              ← entry point FastAPI
│   │   ├── config.py            ← variables d'env (pydantic BaseSettings)
│   │   ├── database.py          ← connexion SQLAlchemy
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   └── quiz_result.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   └── quiz.py
│   │   ├── routes/
│   │   │   ├── auth.py          ← /auth/register, /auth/login
│   │   │   ├── upload.py        ← /upload (POST PDF)
│   │   │   ├── summary.py       ← /summary/{doc_id}
│   │   │   ├── quiz.py          ← /quiz/generate, /quiz/submit
│   │   │   ├── chat.py          ← /chat (POST message)
│   │   │   └── analytics.py     ← /analytics/me
│   │   └── services/
│   │       ├── pdf_parser.py    ← extraction texte via PyMuPDF
│   │       ├── ai_service.py    ← appels Gemini (résumé, quiz, chat)
│   │       ├── whisper_service.py ← transcription audio
│   │       └── tts_service.py   ← synthèse vocale
│   ├── alembic/                 ← migrations DB
│   ├── requirements.txt         ← sans versions figées
│   └── .env.example
│
└── README.md
```

---

## Features à implémenter (dans cet ordre)

### 1. Upload & Parsing PDF
- Endpoint `POST /upload` qui accepte un fichier PDF (multipart/form-data)
- Extraction du texte avec **PyMuPDF** (`fitz`)
- Nettoyage du texte (suppression caractères spéciaux, double espaces)
- Tentative de segmentation par chapitres (chercher des patterns : "Chapitre", "Chapter", "I.", "II.", titres en majuscules)
- Sauvegarde en base (table `documents`) avec `user_id`, `filename`, `raw_text`, `created_at`
- Stockage du fichier PDF localement dans `/uploads/` (ou S3 en prod)
- Retourner `{ doc_id, filename, page_count, preview_text }`

### 2. Résumé Automatique
- Endpoint `GET /summary/{doc_id}`
- Paramètre query : `?length=short|medium|detailed`
- Appel Gemini avec prompt structuré (voir section Prompts IA)
- Extraction des mots-clés et définitions importantes
- Cacher le résultat en DB pour ne pas rappeler l'IA à chaque fois

### 3. Génération de Quiz QCM
- Endpoint `POST /quiz/generate` avec `{ doc_id, num_questions: 10 }`
- Générer des QCM **basés uniquement sur le contenu du document**
- Format de réponse : liste de questions avec 4 choix + bonne réponse + explication
- Endpoint `POST /quiz/submit` avec `{ quiz_id, answers: [...] }`
- Retourner le score, les corrections, les explications pour les erreurs
- Sauvegarder le résultat en DB (table `quiz_results`)

### 4. Chatbot Contextuel
- Endpoint `POST /chat` avec `{ doc_id, message, history: [...] }`
- L'IA répond **uniquement en se basant sur le contenu du document**
- Passer tout l'historique de conversation à chaque appel (pas de mémoire serveur)
- Support du streaming de la réponse (`StreamingResponse` FastAPI)

### 5. Support Vocal
- Endpoint `POST /chat/voice` qui accepte un fichier audio (WAV/MP3/WebM)
- Transcrire avec **Whisper local** (modèle `base` ou `small` selon les ressources) → obtenir le texte → envoyer au chatbot → retourner réponse texte
- Endpoint `POST /tts` avec `{ text }` → synthèse vocale via **Qwen3-TTS en local** → retourner fichier audio WAV/MP3
- **Aucune clé API requise pour le vocal**, tout tourne en local sur le serveur backend

### 6. Dashboard Analytics
- Endpoint `GET /analytics/me`
- Retourner : nombre de documents uploadés, scores moyens par document, évolution des scores dans le temps, sujets les moins bien maîtrisés
- Frontend : graphique d'évolution des scores avec Recharts (LineChart)

### 7. Authentification
- `POST /auth/register` → créer un utilisateur (hash password avec bcrypt)
- `POST /auth/login` → retourner un JWT valide 7 jours
- Middleware qui protège toutes les routes sauf register/login

---

## Prompts IA à utiliser (dans `ai_service.py`)

### Résumé
```python
SUMMARY_PROMPT = """
Tu es un assistant pédagogique expert. Voici le contenu d'un cours :

{text}

Génère un résumé {length} en français avec :
- Les idées principales clairement énoncées
- Les concepts clés en **gras**
- Une liste des définitions importantes à la fin

Format : Markdown structuré avec titres et listes.
"""
```

### Génération Quiz
```python
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
```

### Chatbot Contextuel
```python
CHAT_PROMPT = """
Tu es un assistant pédagogique. Tu aides un étudiant à comprendre son cours.

CONTENU DU COURS :
{document_text}

RÈGLE ABSOLUE : Réponds UNIQUEMENT en te basant sur le contenu du cours ci-dessus.
Si la question ne concerne pas le cours, dis-le poliment.
Explique de façon claire, avec des exemples si nécessaire.
"""
```

---

## Modèles de base de données (SQLAlchemy)

```python
# User
id, email, password_hash, created_at

# Document
id, user_id (FK), filename, raw_text, summary_short, summary_medium,
summary_detailed, keywords (JSON), page_count, created_at

# QuizResult
id, user_id (FK), document_id (FK), score, total_questions,
answers (JSON), created_at
```

---

## Variables d'environnement (`.env`)

```env
DATABASE_URL=postgresql://user:password@host:5432/apsa
GEMINI_API_KEY=your_gemini_key
SECRET_KEY=your_jwt_secret
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
FRONTEND_URL=http://localhost:5173
WHISPER_MODEL=base
```

---

## Configuration CORS (important pour le déploiement)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL"), "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Requirements backend (utiliser les dernières versions stables disponibles)

```
fastapi
uvicorn[standard]
sqlalchemy
alembic
psycopg2-binary
python-multipart
python-jose[cryptography]
passlib[bcrypt]
PyMuPDF
google-generativeai
openai-whisper
torch
torchaudio
pydantic-settings
python-dotenv
httpx
soundfile
```

> ⚠️ **Note pour Claude Code** : Pour Qwen3-TTS, utiliser le package `qwen-tts` via HuggingFace (`transformers` + `torch`). Whisper tourne entièrement en local via `openai-whisper`. Aucune clé API OpenAI n'est nécessaire.

---

## Frontend — comportement attendu

### Page Upload (Home)
- Zone drag & drop centrale (composant `UploadZone`)
- Affichage du nom du fichier + nombre de pages après upload
- Boutons : "Générer le résumé" / "Créer un quiz" / "Ouvrir le chat"
- Indicateur de chargement pendant les appels IA (skeleton loader)

### Page Quiz
- Affichage des questions une par une (pas toutes en même temps)
- Barre de progression en haut (Question 3/10)
- Après soumission : affichage du score + correction détaillée question par question
- Bouton "Rejouer" pour régénérer un nouveau quiz

### Page Chat
- Interface chat classique (bulles gauche/droite)
- Bouton micro pour enregistrer une question vocale (MediaRecorder API)
- Bouton speaker sur chaque réponse pour l'entendre (TTS)
- Sélecteur de ton de l'IA : Sérieux / Encourageant / Simple

### Dashboard
- Cards en haut : nombre de docs, score moyen, quiz passés
- LineChart (Recharts) : évolution des scores dans le temps
- Liste des documents uploadés avec leurs scores

---

## Contraintes importantes

- **Pas de données hallucinations** : le quiz et le chat doivent se baser UNIQUEMENT sur le document uploadé, jamais sur des connaissances générales
- **Gestion des erreurs** : chaque endpoint retourne des erreurs claires (400, 401, 404, 500) avec un message lisible
- **Taille max PDF** : 10 MB, 100 pages max
- **Langue** : l'interface est en français, les prompts IA en français
- **Responsive** : l'interface doit fonctionner sur mobile et desktop
- **Git** : commits atomiques avec messages clairs (`feat:`, `fix:`, `chore:`)

---

## Ordre de développement recommandé

1. Setup projet (init React + FastAPI + DB)
2. Auth (register/login + middleware JWT)
3. Upload PDF + parsing PyMuPDF
4. Résumé automatique (Gemini)
5. Quiz QCM (Gemini)
6. Chatbot contextuel (Gemini streaming)
7. Vocal (Whisper + TTS)
8. Dashboard analytics
9. Export PDF des résumés/quiz
10. Déploiement Vercel + Render + Supabase

---

## Critères de succès (pour la soutenance)

- [ ] On peut uploader un PDF et obtenir un résumé en moins de 30 secondes
- [ ] Le quiz généré est cohérent avec le contenu du PDF
- [ ] Le chatbot répond correctement à des questions sur le cours
- [ ] Le dashboard affiche des données réelles
- [ ] L'application est accessible via une URL publique
- [ ] Le code est sur GitHub avec au moins 2 branches (une par membre du groupe)
