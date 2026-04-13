@echo off
start "Backend" cmd /k "cd apsa\backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
start "Frontend" cmd /k "cd apsa\frontend && npm run dev"
