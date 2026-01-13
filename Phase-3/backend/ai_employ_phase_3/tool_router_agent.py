"""
ToolRouterAgent - Intent Parsing & Tool Selection

Domain: Tool Selection & Routing
Responsibility: Parse user intent, select MCP tools, chain tools if needed
Skills: Natural language intent detection, tool selection, tool chaining

@specs/phase-3-overview.md - ToolRouterAgent
"""

import logging
import json
import os
from typing import List, Dict, Any
from openai import OpenAI

logger = logging.getLogger(__name__)

# Lazy-load client to ensure OPENAI_API_KEY is set
_client = None

def get_client():
    """Get or create OpenAI client"""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        _client = OpenAI(api_key=api_key)
    return _client

# Intent patterns for tool selection
INTENT_PATTERNS = {
    "add": ["create", "add", "new", "make", "start"],
    "list": ["show", "list", "get", "display", "view", "what are"],
    "complete": ["complete", "done", "finish", "mark", "check", "finish"],
    "update": ["change", "update", "edit", "modify", "rename"],
    "delete": ["delete", "remove", "remove", "erase", "drop"]
}


class ToolRouterAgent:
    """
    Routes user messages to appropriate MCP tools.
    Uses Claude 3.5 Sonnet for natural language understanding.
    """

    @staticmethod
    async def parse_intent(
        user_message: str,
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Parse user intent and select appropriate MCP tools.
        Uses GPT-4 for semantic understanding.
        """
        try:
            # Build context from history
            context = "\n".join([
                f"{msg['role']}: {msg['content']}"
                for msg in conversation_history[-5:]  # Last 5 messages
            ])

            # Create prompt for Claude
            system_prompt = """You are an intent classifier for a todo application.
Classify the user message into one of these actions:
- add_task: Create a new task
- list_tasks: Show/display tasks (optionally filter by status)
- complete_task: Mark a task as complete
- update_task: Modify task details
- delete_task: Remove a task

Respond with JSON: {"action": "action_name", "task_id": task_id_if_applicable, "params": {...}}
"""

            response = get_client().chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=500,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context}\n\nMessage: {user_message}"}
                ]
            )

            intent_response = json.loads(response.choices[0].message.content)
            logger.info(f"Parsed intent: {intent_response['action']}")
            return intent_response

        except Exception as e:
            logger.error(f"Failed to parse intent: {str(e)}")
            return {"action": "unknown", "error": str(e)}

    @staticmethod
    async def select_tools(intent: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Select MCP tools based on parsed intent"""
        action_to_tools = {
            "add_task": [{"tool": "add_task", "params": params}],
            "list_tasks": [{"tool": "list_tasks", "params": {"status": params.get("status", "all")}}],
            "complete_task": [{"tool": "complete_task", "params": {"task_id": params.get("task_id")}}],
            "update_task": [{"tool": "update_task", "params": params}],
            "delete_task": [{"tool": "delete_task", "params": {"task_id": params.get("task_id")}}],
        }

        tools = action_to_tools.get(intent, [])
        logger.info(f"Selected tools for {intent}: {[t['tool'] for t in tools]}")
        return tools

    @staticmethod
    async def generate_response(
        user_message: str,
        tool_results: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]]
    ) -> str:
        """Generate natural language response from tool results"""
        try:
            context = "\n".join([
                f"{msg['role']}: {msg['content']}"
                for msg in conversation_history[-3:]
            ])

            system_prompt = """You are a helpful todo assistant.
Generate a natural, friendly response based on the user request and tool results.
Keep responses concise and helpful."""

            response = get_client().chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=500,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User: {user_message}\n\nResults: {json.dumps(tool_results)}"}
                ]
            )

            assistant_response = response.choices[0].message.content
            logger.info(f"Generated response: {assistant_response[:100]}...")
            return assistant_response

        except Exception as e:
            logger.error(f"Failed to generate response: {str(e)}")
            return "I encountered an error processing your request. Please try again."
