from pydantic import BaseModel


class ProgressUpdate(BaseModel):
    current_page: int


class PositionUpdate(BaseModel):
    current_page: int


class BookUpdate(BaseModel):
    display_title: str
    original_title: str | None = None
    source_description: str | None = None
    cover_style: str | None = None
    cover_color: str | None = None
