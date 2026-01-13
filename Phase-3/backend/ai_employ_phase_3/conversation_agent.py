"""
ConversationAgent - Conversation Flow & Context Management

Domain: Conversation Management
Responsibility: Maintain conversation history, manage stateless context
Skills: Message history reconstruction, conversation lifecycle

@specs/phase-3-overview.md - ConversationAgent
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Session, select

logger = logging.getLogger(__name__)


class ConversationAgent:
    """
    Manages conversation lifecycle and message history.
    Provides full context to AI model for better understanding.
    Stateless - all state stored in database.
    """

    @staticmethod
    async def get_or_create_conversation(
        session: Session,
        user_id: int,
        conversation_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get existing conversation or create new one"""
        from models.conversation import Conversation

        try:
            if conversation_id:
                conversation = session.exec(
                    select(Conversation).where(
                        Conversation.id == conversation_id,
                        Conversation.user_id == user_id
                    )
                ).first()

                if not conversation:
                    raise ValueError(f"Conversation {conversation_id} not found")
            else:
                conversation = Conversation(user_id=user_id)
                session.add(conversation)
                session.commit()
                session.refresh(conversation)

            logger.info(f"Got conversation {conversation.id} for user {user_id}")
            return {
                "conversation_id": conversation.id,
                "user_id": conversation.user_id,
                "created_at": conversation.created_at.isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get/create conversation: {str(e)}")
            raise

    @staticmethod
    async def fetch_message_history(
        session: Session,
        conversation_id: int,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Fetch full message history for context"""
        from models.message import Message

        try:
            query = select(Message).where(
                Message.conversation_id == conversation_id
            ).order_by(Message.created_at)

            if limit:
                query = query.limit(limit).offset(offset)

            messages = session.exec(query).all()

            history = [
                {
                    "role": msg.role,
                    "content": msg.content
                }
                for msg in messages
            ]

            logger.info(f"Fetched {len(history)} messages for conversation {conversation_id}")
            return history
        except Exception as e:
            logger.error(f"Failed to fetch message history: {str(e)}")
            raise

    @staticmethod
    async def store_user_message(
        session: Session,
        conversation_id: int,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Store user message in database"""
        from models.message import Message

        try:
            message = Message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="user",
                content=content
            )
            session.add(message)
            session.commit()
            session.refresh(message)

            logger.info(f"Stored user message {message.id} in conversation {conversation_id}")
            return {"message_id": message.id, "role": "user"}
        except Exception as e:
            logger.error(f"Failed to store user message: {str(e)}")
            raise

    @staticmethod
    async def store_assistant_message(
        session: Session,
        conversation_id: int,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Store assistant message in database"""
        from models.message import Message

        try:
            message = Message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="assistant",
                content=content
            )
            session.add(message)
            session.commit()
            session.refresh(message)

            logger.info(f"Stored assistant message {message.id} in conversation {conversation_id}")
            return {"message_id": message.id, "role": "assistant"}
        except Exception as e:
            logger.error(f"Failed to store assistant message: {str(e)}")
            raise

    @staticmethod
    async def list_user_conversations(
        session: Session,
        user_id: int
    ) -> List[Any]:
        """List all conversations for a user"""
        from models.conversation import Conversation

        try:
            conversations = session.exec(
                select(Conversation)
                .where(Conversation.user_id == user_id)
                .order_by(Conversation.updated_at.desc())
            ).all()

            logger.info(f"Listed {len(conversations)} conversations for user {user_id}")
            return conversations
        except Exception as e:
            logger.error(f"Failed to list conversations: {str(e)}")
            raise

    @staticmethod
    async def get_conversation(
        session: Session,
        conversation_id: int
    ) -> Optional[Any]:
        """Get a specific conversation"""
        from models.conversation import Conversation

        try:
            conversation = session.exec(
                select(Conversation).where(Conversation.id == conversation_id)
            ).first()

            if conversation:
                logger.info(f"Retrieved conversation {conversation_id}")
            else:
                logger.warning(f"Conversation {conversation_id} not found")

            return conversation
        except Exception as e:
            logger.error(f"Failed to get conversation: {str(e)}")
            raise

    @staticmethod
    async def delete_conversation(
        session: Session,
        conversation_id: int,
        user_id: int
    ) -> bool:
        """Delete a conversation and all its messages"""
        from models.conversation import Conversation
        from models.message import Message

        try:
            # Verify ownership
            conversation = session.exec(
                select(Conversation).where(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id
                )
            ).first()

            if not conversation:
                logger.warning(f"Conversation {conversation_id} not found for user {user_id}")
                return False

            # Delete all messages first
            messages = session.exec(
                select(Message).where(Message.conversation_id == conversation_id)
            ).all()

            for message in messages:
                session.delete(message)

            # Delete conversation
            session.delete(conversation)
            session.commit()

            logger.info(f"Deleted conversation {conversation_id} and {len(messages)} messages")
            return True
        except Exception as e:
            logger.error(f"Failed to delete conversation: {str(e)}")
            raise

    @staticmethod
    async def fetch_message_history_paginated(
        session: Session,
        conversation_id: int,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Any]:
        """Fetch message history with optional pagination"""
        from models.message import Message

        try:
            query = select(Message).where(
                Message.conversation_id == conversation_id
            ).order_by(Message.created_at)

            if limit:
                query = query.limit(limit).offset(offset)

            messages = session.exec(query).all()

            logger.info(f"Fetched {len(messages)} messages for conversation {conversation_id}")
            return messages
        except Exception as e:
            logger.error(f"Failed to fetch message history: {str(e)}")
            raise
