from pydantic import BaseModel


class ProgressUpdate(BaseModel):
    current_page: int


class PositionUpdate(BaseModel):
    current_page: int