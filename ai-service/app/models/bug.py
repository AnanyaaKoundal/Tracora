from pydantic import BaseModel, Field

from app.config import settings


class SuggestionRequest(BaseModel):
    description: str = Field(min_length=1)


class SuggestionResponse(BaseModel):
    title: str


class DuplicateMatch(BaseModel):
    bug_id: str
    title: str | None = None
    score: float


class DuplicatesRequest(BaseModel):
    title: str | None = None
    description: str = Field(min_length=1)
    company_id: str = Field(min_length=1)
    threshold: float = Field(default=settings.duplicate_threshold, ge=0.0, le=1.0)
    limit: int = Field(default=settings.duplicate_limit, ge=1, le=25)


class DuplicatesResponse(BaseModel):
    matches: list[DuplicateMatch]
