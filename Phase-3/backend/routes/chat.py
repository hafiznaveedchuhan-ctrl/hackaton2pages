"""
Chat Endpoint - OpenAI Integration

POST /api/{user_id}/chat - Main chat endpoint for todo management

Uses OpenAI GPT-4 with function calling to process natural language and execute task operations.

@specs/phase-3-overview.md - Chat API Specification
"""

import logging
import os
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from sqlmodel import Session
from openai import OpenAI

from db import get_session
from ai_employ_phase_3 import (
    AuthAgent, ConversationAgent,
    TaskManagerAgent, ErrorHandlingAgent
)

logger = logging.getLogger(__name__)

# Get OpenAI client
def get_openai_client():
    """Get OpenAI client with API key from environment"""
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY not found in environment!")
        return None
    logger.info(f"OpenAI API key loaded: {OPENAI_API_KEY[:15]}...")
    return OpenAI(api_key=OPENAI_API_KEY)

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    """Chat request model"""
    conversation_id: Optional[int] = None
    message: str


class ChatResponse(BaseModel):
    """Chat response model"""
    conversation_id: int
    response: str
    tool_calls: list
    status: str


# OpenAI Function Definitions for MCP Tools
OPENAI_FUNCTIONS = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task with a title and optional description",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Task title (required, e.g., 'Buy groceries')"
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional task description with more details"
                    }
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "List all tasks or filter by status (active/completed/all)",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["all", "active", "completed"],
                        "description": "Filter tasks by status: 'all', 'active' (not completed), or 'completed'. Default is 'all'."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update a task's title or description",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "ID of the task to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "New task title (optional)"
                    },
                    "description": {
                        "type": "string",
                        "description": "New task description (optional)"
                    }
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark a task as completed",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "ID of the task to mark as complete"
                    }
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task permanently",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "ID of the task to delete"
                    }
                },
                "required": ["task_id"]
            }
        }
    }
]


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat_endpoint(
    user_id: int,
    request: ChatRequest,
    authorization: str = Header(...),
    session: Session = Depends(get_session)
):
    """
    Main chat endpoint for todo management with OpenAI function calling.

    Workflow:
    1. AuthAgent validates token
    2. ConversationAgent fetches context
    3. OpenAI processes message with function calling
    4. TaskManagerAgent executes MCP tools
    5. ConversationAgent stores response
    6. Return response to client
    """
    try:
        # Extract token
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

        logger.info(f"Authenticated user {user_id}")

        # 3. ConversationAgent: Get or create conversation
        try:
            conv_result = await ConversationAgent.get_or_create_conversation(
                session,
                user_id,
                request.conversation_id
            )
            conversation_id = conv_result["conversation_id"]

            # 4. ConversationAgent: Fetch message history
            history = await ConversationAgent.fetch_message_history(
                session,
                conversation_id
            )

            # 5. ConversationAgent: Store user message
            await ConversationAgent.store_user_message(
                session,
                conversation_id,
                user_id,
                request.message
            )
        except Exception as e:
            logger.error(f"ConversationAgent failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to manage conversation")

        # 6. Get OpenAI client
        client = get_openai_client()
        if not client:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
            )

        # 7. Build conversation history for OpenAI
        messages = [
            {
                "role": "system",
                "content": """You are a helpful AI assistant for a todo management system.
You help users manage their tasks through natural language commands.

When users ask to perform task operations, use the provided functions:
- add_task: Create new tasks
- list_tasks: Show tasks (can filter by status: all/active/completed)
- update_task: Modify task details
- complete_task: Mark tasks as done
- delete_task: Remove tasks

Always use functions when the user wants to perform an action. Be conversational and helpful.
When listing tasks, present them in a clear, organized format."""
            }
        ]

        # Add conversation history
        for msg in history:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

        # Add current user message
        messages.append({
            "role": "user",
            "content": request.message
        })

        tools_used = []
        assistant_response = ""

        try:
            # 8. FIRST API CALL: Let OpenAI decide if it needs functions
            logger.info(f"Calling OpenAI with {len(messages)} messages")

            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Using GPT-4 for better function calling
                messages=messages,
                tools=OPENAI_FUNCTIONS,
                tool_choice="auto"  # Let OpenAI decide when to use tools
            )

            assistant_message = response.choices[0].message
            logger.info(f"OpenAI response: finish_reason={response.choices[0].finish_reason}")

            # 9. Check if OpenAI wants to call functions
            if assistant_message.tool_calls:
                logger.info(f"OpenAI requested {len(assistant_message.tool_calls)} function calls")

                # Add assistant's message to conversation
                messages.append(assistant_message)

                # Execute each function call
                for tool_call in assistant_message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    logger.info(f"Executing function: {function_name} with args: {function_args}")
                    tools_used.append(function_name)

                    try:
                        # 10. Execute tool via TaskManagerAgent
                        tool_config = {
                            "tool": function_name,
                            "params": function_args
                        }

                        execution_results = await TaskManagerAgent.execute_tools(
                            session,
                            user_id,
                            [tool_config]
                        )

                        # Get result from execution
                        if execution_results and len(execution_results) > 0:
                            tool_result = execution_results[0].get("result", {})
                            function_response = json.dumps(tool_result)
                        else:
                            function_response = json.dumps({"error": "Tool execution failed"})

                        logger.info(f"Function {function_name} result: {function_response}")

                    except Exception as e:
                        logger.error(f"Tool {function_name} execution error: {str(e)}")
                        function_response = json.dumps({"error": str(e)})

                    # Add function result to messages
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": function_response
                    })

                # 11. SECOND API CALL: Get natural language response from OpenAI
                logger.info("Calling OpenAI again for natural language response")

                final_response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages
                )

                assistant_response = final_response.choices[0].message.content

            else:
                # No functions needed, just conversational response
                assistant_response = assistant_message.content

            logger.info(f"Final response generated for user {user_id}")

        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            assistant_response = f"I'm having trouble processing your request. Please try again."
            tools_used = []

        # 12. ConversationAgent: Store assistant response
        try:
            await ConversationAgent.store_assistant_message(
                session,
                conversation_id,
                user_id,
                assistant_response
            )
        except Exception as e:
            logger.warning(f"Could not store response: {e}")

        logger.info(f"Chat completed successfully for user {user_id}")

        return ChatResponse(
            conversation_id=conversation_id,
            response=assistant_response,
            tool_calls=tools_used,
            status="success"
        )

    except HTTPException:
        raise
    except Exception as e:
        # ErrorHandlingAgent: Handle exception
        import traceback
        full_traceback = traceback.format_exc()
        logger.error(f"Chat endpoint full error:\n{full_traceback}")
        error_response = ErrorHandlingAgent.handle_error(e)
        logger.error(f"Chat endpoint error: {error_response}")
        raise HTTPException(status_code=500, detail=f"{error_response['message']} - {str(e)}")
