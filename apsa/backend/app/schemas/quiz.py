from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class QuizGenerateRequest(BaseModel):
    doc_id: int
    num_questions: int = 10


class QuizQuestion(BaseModel):
    id: int
    question: str
    choices: List[str]
    correct_answer: str
    explanation: str


class QuizOut(BaseModel):
    quiz_id: str
    doc_id: int
    questions: List[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    doc_id: int
    answers: List[str]
    questions: List[QuizQuestion]


class QuizResultOut(BaseModel):
    score: float
    total_questions: int
    correct_count: int
    corrections: List[dict]
