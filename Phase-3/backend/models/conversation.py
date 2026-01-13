"""
Conversation Model

Represents a conversation between a user and the AI chatbot.
Each conversation maintains full message history for context.

@specs/phase-3-overview.md - Conversation Model Design
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Conversation(SQLModel, table=True):
    """
    Conversation entity for storing user-AI conversations.

    Each user can have multiple conversations.
    Full message history is stored in Message table.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)  # From JWT token, no foreign key needed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to messages
    messages: list["Message"] = Relationship(back_populates="conversation")

    def __repr__(self) -> str:
        return f"<Conversation {self.id} (user_id={self.user_id})>"

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "user_id": 1,
                "created_at": "2025-12-16T10:00:00",
                "updated_at": "2025-12-16T10:00:00"
            }
        }


class ConversationRead(SQLModel):
    """Schema for reading conversation data."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class ConversationCreate(SQLModel):
    """Schema for creating conversation."""
    user_id: int
