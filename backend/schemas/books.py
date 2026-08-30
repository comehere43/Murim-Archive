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


class BookResponse(BaseModel):
    id: int
    display_title: str
    original_title: str | None = None
    source_description: str | None = None
    original_filename: str
    file_path: str | None = None
    title_mode: str
    total_pages: int
    current_page: int
    max_read_page: int
    cover_style: str | None = None
    cover_color: str | None = None

    model_config = {"from_attributes": True}


class ProgressResponse(BaseModel):
    id: int
    max_read_page: int


class PositionResponse(BaseModel):
    id: int
    current_page: int


class DeleteBookResponse(BaseModel):
    message: str
    id: int
