from pydantic import BaseModel


class TitleGenerateRequest(BaseModel):
    original_title: str
