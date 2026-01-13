"""
MCP Tools Implementation

5 MCP tools for task management via AI agents.
All operations must go through these tools - NO direct database access.

@specs/phase-3-overview.md - MCP Tools Specification
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Session, select

logger = logging.getLogger(__name__)


async def add_task(
    session: Session,
    user_id: int,
    title: str,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Add a new task via MCP tool.

    Parameters:
    - user_id: Authenticated user ID
    - title: Task title (required)
    - description: Task description (optional)

    Returns: {task_id, status, title}
    """
    from models.task import Task

    try:
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            completed=False
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        logger.info(f"Created task {task.id} for user {user_id}")
        return {
            "task_id": task.id,
            "status": "success",
            "title": task.title
        }
    except Exception as e:
        logger.error(f"Failed to create task: {str(e)}")
        raise


async def list_tasks(
    session: Session,
    user_id: int,
    status: str = "all"
) -> List[Dict[str, Any]]:
    """
    List tasks filtered by status.

    Parameters:
    - user_id: Authenticated user ID
    - status: "active" | "completed" | "all"

    Returns: Array of tasks
    """
    from models.task import Task

    try:
        query = select(Task).where(Task.user_id == user_id)

        if status == "active":
            query = query.where(Task.completed == False)
        elif status == "completed":
            query = query.where(Task.completed == True)

        tasks = session.exec(query).all()

        result = [
            {
                "task_id": t.id,
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "created_at": t.created_at.isoformat()
            }
            for t in tasks
        ]

        logger.info(f"Listed {len(result)} tasks for user {user_id} (status={status})")
        return result
    except Exception as e:
        logger.error(f"Failed to list tasks: {str(e)}")
        raise


async def update_task(
    session: Session,
    user_id: int,
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Update task details.

    Parameters:
    - user_id: Authenticated user ID (ownership check)
    - task_id: Task ID to update
    - title: New title (optional)
    - description: New description (optional)

    Returns: {task_id, status}
    """
    from models.task import Task

    try:
        task = session.exec(
            select(Task).where(
                Task.id == task_id,
                Task.user_id == user_id
            )
        ).first()

        if not task:
            raise ValueError("Task not found or unauthorized")

        if title:
            task.title = title
        if description:
            task.description = description

        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()

        logger.info(f"Updated task {task_id} for user {user_id}")
        return {"task_id": task.id, "status": "success"}
    except Exception as e:
        logger.error(f"Failed to update task: {str(e)}")
        raise


async def delete_task(
    session: Session,
    user_id: int,
    task_id: int
) -> Dict[str, Any]:
    """
    Delete a task.

    Parameters:
    - user_id: Authenticated user ID (ownership check)
    - task_id: Task ID to delete

    Returns: {task_id, status}
    """
    from models.task import Task

    try:
        task = session.exec(
            select(Task).where(
                Task.id == task_id,
                Task.user_id == user_id
            )
        ).first()

        if not task:
            raise ValueError("Task not found or unauthorized")

        session.delete(task)
        session.commit()

        logger.info(f"Deleted task {task_id} for user {user_id}")
        return {"task_id": task_id, "status": "success"}
    except Exception as e:
        logger.error(f"Failed to delete task: {str(e)}")
        raise


async def complete_task(
    session: Session,
    user_id: int,
    task_id: int
) -> Dict[str, Any]:
    """
    Mark task as complete.

    Parameters:
    - user_id: Authenticated user ID (ownership check)
    - task_id: Task ID to complete

    Returns: {task_id, status}
    """
    from models.task import Task

    try:
        task = session.exec(
            select(Task).where(
                Task.id == task_id,
                Task.user_id == user_id
            )
        ).first()

        if not task:
            raise ValueError("Task not found or unauthorized")

        task.completed = True
        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()

        logger.info(f"Completed task {task_id} for user {user_id}")
        return {"task_id": task.id, "status": "success"}
    except Exception as e:
        logger.error(f"Failed to complete task: {str(e)}")
        raise
