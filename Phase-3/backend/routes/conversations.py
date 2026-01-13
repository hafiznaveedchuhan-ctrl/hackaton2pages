"""
Conversation Routes

Endpoints for conversation management
- GET /api/{user_id}/conversations - List all conversations
- GET /api/{user_id}/conversations/{conversation_id} - Get conversation details
- DELETE /api/{user_id}/conversations/{conversation_id} - Delete conversation
- GET /api/{user_id}/conversations/{conversation_id}/messages - Get messages

@specs/phase-3-overview.md - Conversation Management Specification
"""

import logging
from typing import List
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlmodel import Session

from db import get_session
from ai_employ_phase_3 import AuthAgent, ConversationAgent, ErrorHandlingAgent
from models import Conversation, Message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["conversations"])


class ConversationResponse:
    """Conversation response model"""
    id: int
    user_id: int
    message_count: int
    created_at: str
    updated_at: str
    preview: str  # Last message preview


class MessageResponse:
    """Message response model"""
    id: int
    conversation_id: int
    role: str
    content: str
    created_at: str


@router.get("/{user_id}/conversations", tags=["conversations"])
async def list_conversations(
    user_id: int,
    authorization: str = Header(...),
    session: Session = Depends(get_session)
):
    """
    List all conversations for a user.

    Returns conversations with message count and preview.
    """
    try:
        # Extract and validate token
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid token format")
        token = authorization[7:]

        # 1. AuthAgent: Validate token
        auth_result = AuthAgent.validate_token(token)
        if not auth_result:
            raise HTTPException(status_code=401, detail="Invalid token")

        token_user_id = auth_result["user_id"]

        # 2. AuthAgent: Verify user ownership
        if not AuthAgent.verify_user_ownership(token_user_id, user_id):
            raise HTTPException(status_code=403, detail="Forbidden")

        logger.info(f"Listing conversations for user {user_id}")

        # 3. ConversationAgent: Get all conversations
        conversations = await ConversationAgent.list_user_conversations(
            session,
            user_id
        )

        # 4. Format response with previews
        result = []
        for conv in conversations:
            messages = await ConversationAgent.fetch_message_history_paginated(
                session,
                conv.id,
                limit=1
            )
            preview = messages[-1].content[:50] if messages else "No messages"

            all_messages = await ConversationAgent.fetch_message_history_paginated(session, conv.id)
            result.append({
                "id": conv.id,
                "user_id": conv.user_id,
                "message_count": len(all_messages),
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat(),
                "preview": preview
            })

        return {
            "user_id": user_id,
            "total": len(result),
            "conversations": result
        }

    except HTTPException:
        raise
    except Exception as e:
        error_response = ErrorHandlingAgent.handle_error(e)
        logger.error(f"Error listing conversations: {error_response}")
        raise HTTPException(status_code=500, detail=error_response["message"])


@router.get("/{user_id}/conversations/{conversation_id}", tags=["conversations"])
async def get_conversation(
    user_id: int,
    conversation_id: int,
    authorization: str = Header(...),
    session: Session = Depends(get_session)
):
    """
    Get conversation details with full message history.
    """
    try:
        # Extract and validate token
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid token format")
        token = authorization[7:]

        # 1. AuthAgent: Validate token
        auth_result = AuthAgent.validate_token(token)
        if not auth_result:
            raise HTTPException(status_code=401, detail="Invalid token")

        token_user_id = auth_result["user_id"]

        # 2. AuthAgent: Verify user ownership
        if not AuthAgent.verify_user_ownership(token_user_id, user_id):
            raise HTTPException(status_code=403, detail="Forbidden")

        logger.info(f"Getting conversation {conversation_id} for user {user_id}")

        # 3. ConversationAgent: Verify conversation ownership
        conversation = await ConversationAgent.get_conversation(
            session,
            conversation_id
        )

        if not conversation or conversation.user_id != user_id:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # 4. ConversationAgent: Fetch message history (returns Message objects)
        messages = await ConversationAgent.fetch_message_history_paginated(
            session,
            conversation_id
        )

        # 5. Format response
        formatted_messages = [
            {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]

        return {
            "id": conversation.id,
            "user_id": conversation.user_id,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat(),
            "message_count": len(messages),
            "messages": formatted_messages
        }

    except HTTPException:
        raise
    except Exception as e:
        error_response = ErrorHandlingAgent.handle_error(e)
        logger.error(f"Error getting conversation: {error_response}")
        raise HTTPException(status_code=500, detail=error_response["message"])


@router.get("/{user_id}/conversations/{conversation_id}/messages", tags=["conversations"])
async def get_conversation_messages(
    user_id: int,
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
    authorization: str = Header(...),
    session: Session = Depends(get_session)
):
    """
    Get paginated messages from a conversation.
    """
    try:
        # Extract and validate token
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid token format")
        token = authorization[7:]

        # 1. AuthAgent: Validate token
        auth_result = AuthAgent.validate_token(token)
        if not auth_result:
            raise HTTPException(status_code=401, detail="Invalid token")

        token_user_id = auth_result["user_id"]

        # 2. AuthAgent: Verify user ownership
        if not AuthAgent.verify_user_ownership(token_user_id, user_id):
            raise HTTPException(status_code=403, detail="Forbidden")

        logger.info(f"Getting messages for conversation {conversation_id}")

        # 3. ConversationAgent: Verify conversation ownership
        conversation = await ConversationAgent.get_conversation(
            session,
            conversation_id
        )

        if not conversation or conversation.user_id != user_id:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # 4. ConversationAgent: Fetch paginated messages (returns Message objects)
        messages = await ConversationAgent.fetch_message_history_paginated(
            session,
            conversation_id,
            limit=limit,
            offset=skip
        )

        # 5. Format response
        formatted_messages = [
            {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]

        return {
            "conversation_id": conversation_id,
            "skip": skip,
            "limit": limit,
            "total": len(formatted_messages),
            "messages": formatted_messages
        }

    except HTTPException:
        raise
    except Exception as e:
        error_response = ErrorHandlingAgent.handle_error(e)
        logger.error(f"Error getting messages: {error_response}")
        raise HTTPException(status_code=500, detail=error_response["message"])


@router.delete("/{user_id}/conversations/{conversation_id}", tags=["conversations"])
async def delete_conversation(
    user_id: int,
    conversation_id: int,
    authorization: str = Header(...),
    session: Session = Depends(get_session)
):
    """
    Delete a conversation and all its messages.
    """
    try:
        # Extract and validate token
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid token format")
        token = authorization[7:]

        # 1. AuthAgent: Validate token
        auth_result = AuthAgent.validate_token(token)
        if not auth_result:
            raise HTTPException(status_code=401, detail="Invalid token")

        token_user_id = auth_result["user_id"]

        # 2. AuthAgent: Verify user ownership
        if not AuthAgent.verify_user_ownership(token_user_id, user_id):
            raise HTTPException(status_code=403, detail="Forbidden")

        logger.info(f"Deleting conversation {conversation_id} for user {user_id}")

        # 3. ConversationAgent: Delete conversation
        result = await ConversationAgent.delete_conversation(
            session,
            conversation_id,
            user_id
        )

        if not result:
            raise HTTPException(status_code=404, detail="Conversation not found")

        logger.info(f"Conversation {conversation_id} deleted successfully")

        return {
            "status": "success",
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id
        }

    except HTTPException:
        raise
    except Exception as e:
        error_response = ErrorHandlingAgent.handle_error(e)
        logger.error(f"Error deleting conversation: {error_response}")
        raise HTTPException(status_code=500, detail=error_response["message"])
