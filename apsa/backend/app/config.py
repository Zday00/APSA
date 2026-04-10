from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    SECRET_KEY: str
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10
    FRONTEND_URL: str = "http://localhost:5173"
    WHISPER_MODEL: str = "base"

    class Config:
        env_file = ".env"


settings = Settings()
