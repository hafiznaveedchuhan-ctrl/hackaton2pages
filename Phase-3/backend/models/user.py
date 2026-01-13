"""
User Model

Represents a user in the todo system.
Implements @specs/phase-3-overview.md - Authentication

@author: Phase-3 System
@created: 2025-12-18
"""

from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
import bcrypt

if TYPE_CHECKING:
    from .task import Task


class User(SQLModel, table=True):
    """User database model for persistence"""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    name: str = Field(max_length=100, min_length=1)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tasks: List["Task"] = Relationship(back_populates="user")

    def verify_password(self, password: str) -> bool:
        """Verify a password against the hashed password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.hashed_password.encode('utf-8'))

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


class UserCreate(SQLModel):
    """Schema for user registration"""
    email: str = Field(max_length=255)
    name: str = Field(max_length=100, min_length=1)
    password: str = Field(min_length=8, max_length=100)


class UserRead(SQLModel):
    """Schema for reading a user (response)"""
    id: int
    email: str
    name: str
    created_at: datetime


class UserLogin(SQLModel):
    """Schema for user login"""
    email: str = Field(max_length=255)
    password: str = Field(max_length=100)
