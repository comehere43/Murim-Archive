from typing import Literal

from pydantic import BaseModel


class TitleGenerateRequest(BaseModel):
    source_text: str
    source_type: Literal["title", "description"]
    force_generate: bool = False


class TitleCandidate(BaseModel):
    title: str
    hanja: str
    meaning: str
    reason: str


class TitleGenerateResponse(BaseModel):
    valid_input: bool
    error_code: str | None
    titles: list[TitleCandidate]
