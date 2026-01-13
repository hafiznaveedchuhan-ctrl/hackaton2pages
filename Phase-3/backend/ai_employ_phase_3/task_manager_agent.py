"""
TaskManagerAgent - Task CRUD Operations

Domain: Task Management
Responsibility: Execute task operations via MCP tools
Skills: Task validation, CRUD execution, result handling

@specs/phase-3-overview.md - TaskManagerAgent
"""

import logging
from typing import List, Dict, Any
from sqlmodel import Session

logger = logging.getLogger(__name__)


class TaskManagerAgent:
    """
    Executes MCP tools for task management.
    All database operations go through MCP tools.
    """

    @staticmethod
    async def execute_tools(
        session: Session,
        user_id: int,
        tools: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Execute MCP tools in sequence"""
        from mcp.tools import (
            add_task, list_tasks, update_task, delete_task, complete_task
        )

        results = []

        for tool_config in tools:
            tool_name = tool_config.get("tool")
            params = tool_config.get("params", {})

            try:
                # Add user_id and session to params
                params["session"] = session
                params["user_id"] = user_id

                if tool_name == "add_task":
                    result = await add_task(**params)
                elif tool_name == "list_tasks":
                    result = await list_tasks(**params)
                elif tool_name == "update_task":
                    result = await update_task(**params)
                elif tool_name == "delete_task":
                    result = await delete_task(**params)
                elif tool_name == "complete_task":
                    result = await complete_task(**params)
                else:
                    result = {"status": "error", "error": f"Unknown tool: {tool_name}"}

                logger.info(f"Executed {tool_name}: {result}")
                results.append({
                    "tool": tool_name,
                    "result": result
                })

            except Exception as e:
                logger.error(f"Tool {tool_name} execution failed: {str(e)}")
                results.append({
                    "tool": tool_name,
                    "error": str(e)
                })

        return results

    @staticmethod
    async def validate_task_ownership(
        session: Session,
        user_id: int,
        task_id: int
    ) -> bool:
        """Verify user owns the task"""
        from models.task import Task
        from sqlmodel import select

        try:
            task = session.exec(
                select(Task).where(
                    Task.id == task_id,
                    Task.user_id == user_id
                )
            ).first()

            return task is not None
        except Exception as e:
            logger.error(f"Failed to validate task ownership: {str(e)}")
            return False
