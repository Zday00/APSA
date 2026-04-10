from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class DocumentOut(BaseModel):
    id: int
    filename: str
    page_count: int
    preview_text: str
    created_at: datetime

    class Config:
        from_attributes = True


class SummaryOut(BaseModel):
    doc_id: int
    length: str
    summary: str
    keywords: Optional[List[str]] = None
