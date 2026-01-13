"""
Task CRUD Routes

Handles task creation, reading, updating, and deletion.

Implements @specs/phase-3-overview.md - Task Management

@author: Phase-3 System
@created: 2025-12-18
"""

from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Header
from sqlmodel import Session, select
from models.task import Task, TaskCreate, TaskRead, TaskUpdate
from models.user import User
from db import get_session
from ai_employ_phase_3.auth_agent import AuthAgent
from typing import List
import os

router = APIRouter(tags=["tasks"])

# Get JWT secret from environment
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")


def get_token_from_header(authorization: str = Header(...)) -> str:
    """Extract JWT token from Authorization header"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    return authorization[7:]  # Remove "Bearer " prefix


@router.get("/api/{user_id}/tasks", response_model=List[TaskRead])
def get_tasks(
    user_id: int = Path(..., gt=0, description="User ID"),
    completed: bool | None = Query(None, description="Filter by completion status"),
    token: str = Depends(get_token_from_header),
    session: Session = Depends(get_session)
):
    """
    Get all tasks for a user

    - **user_id**: The user's ID
    - **completed**: Optional filter (true/false/null for all)
    - **token**: JWT token in Authorization header

    Returns list of tasks
    """
    # Validate token and user ownership
    auth_result = AuthAgent.validate_token(token)
    if not auth_result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    token_user_id = auth_result.get("user_id")
    if not AuthAgent.verify_user_ownership(token_user_id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this user's tasks")

    # Verify user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Query tasks
    query = select(Task).where(Task.user_id == user_id)
    if completed is not None:
        query = query.where(Task.completed == completed)

    tasks = session.exec(query).all()
    return tasks


@router.post("/api/{user_id}/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    user_id: int = Path(..., gt=0, description="User ID"),
    task_data: TaskCreate = None,
    token: str = Depends(get_token_from_header),
    session: Session = Depends(get_session)
):
    """
    Create a new task for a user

    - **user_id**: The user's ID
    - **title**: Task title (required)
    - **description**: Task description (optional)
    - **token**: JWT token in Authorization header

    Returns the created task
    """
    # Validate token and user ownership
    auth_result = AuthAgent.validate_token(token)
    if not auth_result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    token_user_id = auth_result.get("user_id")
    if not AuthAgent.verify_user_ownership(token_user_id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this user's tasks")

    # Verify user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create task
    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description
    )

    try:
        session.add(task)
        session.commit()
        session.refresh(task)
        return task
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task"
        )


@router.patch("/api/{user_id}/tasks/{task_id}", response_model=TaskRead)
def update_task(
    user_id: int = Path(..., gt=0, description="User ID"),
    task_id: int = Path(..., gt=0, description="Task ID"),
    task_data: TaskUpdate = None,
    token: str = Depends(get_token_from_header),
    session: Session = Depends(get_session)
):
    """
    Update a task

    - **user_id**: The user's ID
    - **task_id**: The task's ID
    - **title**: New title (optional)
    - **description**: New description (optional)
    - **completed**: Mark as completed (optional)
    - **token**: JWT token in Authorization header

    Returns the updated task
    """
    # Validate token and user ownership
    auth_result = AuthAgent.validate_token(token)
    if not auth_result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    token_user_id = auth_result.get("user_id")
    if not AuthAgent.verify_user_ownership(token_user_id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this user's tasks")

    # Get task
    task = session.get(Task, task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Update fields
    update_data = task_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    try:
        session.add(task)
        session.commit()
        session.refresh(task)
        return task
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task"
        )


@router.delete("/api/{user_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    user_id: int = Path(..., gt=0, description="User ID"),
    task_id: int = Path(..., gt=0, description="Task ID"),
    token: str = Depends(get_token_from_header),
    session: Session = Depends(get_session)
):
    """
    Delete a task

    - **user_id**: The user's ID
    - **task_id**: The task's ID
    - **token**: JWT token in Authorization header

    Returns 204 No Content on success
    """
    # Validate token and user ownership
    auth_result = AuthAgent.validate_token(token)
    if not auth_result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    token_user_id = auth_result.get("user_id")
    if not AuthAgent.verify_user_ownership(token_user_id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this user's tasks")

    # Get task
    task = session.get(Task, task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    try:
        session.delete(task)
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task"
        )
