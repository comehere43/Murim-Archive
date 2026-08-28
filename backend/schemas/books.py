from pydantic import BaseModel, Field


class ProgressUpdate(BaseModel):
    current_page: int


class PositionUpdate(BaseModel):
    current_page: int


class BookUpdate(BaseModel):
    display_title: str = Field(
        min_length=1,
        max_length=255,
    )

    original_title: str | None = Field(
        default=None,
        max_length=255,
    )

    source_description: str | None = Field(
        default=None,
        max_length=1000,
    )

    cover_style: str | None = Field(
        default=None,
        max_length=50,
    )

    cover_color: str | None = Field(
        default=None,
        pattern=r"^#[0-9A-Fa-f]{6}$",
    )
