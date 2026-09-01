from pydantic import BaseModel, Field
from datetime import datetime


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


class ProfileTitleResponse(BaseModel):
    id: int
    title_key: str
    acquired_at: datetime
    is_seen: bool
    is_equipped: bool

    model_config = {"from_attributes": True}


class EquipTitleResponse(BaseModel):
    title_key: str
    is_equipped: bool


class ProfileRealmEventResponse(BaseModel):
    id: int
    realm_key: str
    realm_name: str
    acquired_at: datetime
    is_seen: bool


class ProfileRealmResponse(BaseModel):
    realm_key: str
    realm: str
    next_realm_key: str | None
    next_realm: str | None
    progress: int
    total_read_pages: int


class BookCompletionEventResponse(BaseModel):
    id: int
    book_id: int
    book_title: str
    acquired_at: datetime
    is_seen: bool
