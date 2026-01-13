"""
Message Model

Represents individual messages in a conversation.
Stores both user and assistant messages for full context.

@specs/phase-3-overview.md - Message Model Design
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Message(SQLModel, table=True):
    """
    Message entity for storing conversation messages.

    Each message belongs to a conversation.
    Role can be 'user' or 'assistant'.
    Content is the message text.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id", index=True)
    user_id: int = Field(index=True)  # From JWT token
    role: str = Field(index=True)  # 'user' or 'assistant'
    content: str = Field(min_length=1, max_length=4000)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Relationship to conversation
    conversation: "Conversation" = Relationship(back_populates="messages")

    def __repr__(self) -> str:
        return f"<Message {self.id} ({self.role}) in conversation {self.conversation_id}>"

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "conversation_id": 1,
                "user_id": 1,
                "role": "user",
                "content": "Add task: Complete project setup",
                "created_at": "2025-12-16T10:00:00"
            }
        }


class MessageRead(SQLModel):
    """Schema for reading message data."""
    id: int
    conversation_id: int
    user_id: int
    role: str  # 'user' or 'assistant'
    content: str
    created_at: datetime


class MessageCreate(SQLModel):
    """Schema for creating message."""
    conversation_id: int
    user_id: int
    role: str  # 'user' or 'assistant'
    content: str
