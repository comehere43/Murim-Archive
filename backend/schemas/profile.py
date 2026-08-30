from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    sect: str = Field(min_length=1, max_length=100)
    position: str = Field(min_length=1, max_length=100)


class ProfileResponse(BaseModel):
    id: int
    name: str
    sect: str
    position: str

    model_config = {"from_attributes": True}
