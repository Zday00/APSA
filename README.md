# APSA — AI-Powered Personal Study Assistant

## Lancement rapide

### Backend
```bash
cd apsa/backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # puis remplis les variables
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd apsa/frontend
npm install
cp .env.example .env
npm run dev
```

L'app est accessible sur http://localhost:5173

## Variables d'environnement backend (.env)
| Variable | Description |
|---|---|
| DATABASE_URL | URL PostgreSQL Supabase |
| GEMINI_API_KEY | Clé API Google Gemini |
| SECRET_KEY | Secret JWT (chaîne aléatoire longue) |
| WHISPER_MODEL | `base` ou `small` (à installer séparément) |
