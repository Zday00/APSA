import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
import app.models  # noqa — importer tous les modèles pour qu'Alembic les détecte

from app.routes import auth, upload, summary, quiz, chat, analytics, tts

# Créer les tables si elles n'existent pas (dev only — en prod utiliser Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="APSA — AI-Powered Study Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(summary.router)
app.include_router(quiz.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(tts.router)


@app.get("/health")
def health():
    return {"status": "ok"}
