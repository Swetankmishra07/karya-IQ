from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.core.roles import UserRole


class UserBase(BaseModel):
    """Base fields shared across User schemas."""
    username: str = Field(..., min_length=3, max_length=50, examples=["swetank"])
    email: EmailStr = Field(..., examples=["swetank@example.com"])

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return value.lower()


class UserCreate(UserBase):
    """Schema for public or explicitly enabled development-demo registration."""
    password: str = Field(..., min_length=8, max_length=72, examples=["StrongPassword123"])
    role: UserRole | None = None
    demo_registration_code: str | None = Field(default=None, max_length=128)


class UserResponse(UserBase):
    """
    Schema for User response.
    IMPORTANT: Never include password_hash in response models!
    """
    id: int
    role: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoleUpdate(BaseModel):
    """Role changes are accepted only by the admin-protected endpoint."""
    role: UserRole
