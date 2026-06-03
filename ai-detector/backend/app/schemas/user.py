from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=255)


class UserRead(UserBase):
    id: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)
