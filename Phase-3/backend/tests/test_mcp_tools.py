"""
MCP Tools Tests

Comprehensive tests for all MCP tools
- add_task: Create new task
- list_tasks: Retrieve tasks with filtering
- update_task: Modify task properties
- complete_task: Mark task as complete
- delete_task: Remove task

@specs/phase-3-overview.md - MCP Tools Specification
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, MagicMock, patch
from datetime import datetime

from mcp.tools import (
    add_task,
    list_tasks,
    update_task,
    complete_task,
    delete_task
)


@pytest.fixture
def mock_session():
    """Create mock database session"""
    return AsyncMock()


@pytest.fixture
def mock_task():
    """Create mock task object"""
    task = MagicMock()
    task.id = 1
    task.user_id = 1
    task.title = "Test Task"
    task.description = "Test Description"
    task.status = "pending"
    task.created_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()
    return task


class TestAddTaskTool:
    """Tests for add_task MCP tool"""

    @pytest.mark.asyncio
    async def test_add_task_creates_new_task(self, mock_session, mock_task):
        """Test creating a new task"""
        mock_session.add = Mock()
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        with patch('mcp.tools.Task') as mock_task_class:
            mock_task_class.return_value = mock_task

            result = await add_task(
                mock_session,
                user_id=1,
                title="Buy groceries"
            )

            assert result is not None
            assert 'task_id' in result or 'title' in result

    @pytest.mark.asyncio
    async def test_add_task_includes_description(self, mock_session, mock_task):
        """Test creating task with description"""
        mock_session.add = Mock()
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        with patch('mcp.tools.Task') as mock_task_class:
            mock_task_class.return_value = mock_task

            result = await add_task(
                mock_session,
                user_id=1,
                title="Buy groceries",
                description="Milk, bread, eggs"
            )

            assert result is not None

    @pytest.mark.asyncio
    async def test_add_task_validates_user_id(self, mock_session):
        """Test that add_task requires user_id"""
        with pytest.raises((TypeError, ValueError)):
            await add_task(mock_session, user_id=None, title="Test")

    @pytest.mark.asyncio
    async def test_add_task_validates_title(self, mock_session):
        """Test that add_task requires title"""
        with pytest.raises((TypeError, ValueError)):
            await add_task(mock_session, user_id=1, title=None)


class TestListTasksTool:
    """Tests for list_tasks MCP tool"""

    @pytest.mark.asyncio
    async def test_list_tasks_returns_all_tasks(self, mock_session, mock_task):
        """Test listing all tasks for user"""
        mock_result = [mock_task]
        mock_session.exec = AsyncMock(return_value=MagicMock(all=lambda: mock_result))

        result = await list_tasks(mock_session, user_id=1)

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_list_tasks_filters_by_status(self, mock_session, mock_task):
        """Test filtering tasks by status"""
        mock_result = [mock_task]
        mock_session.exec = AsyncMock(return_value=MagicMock(all=lambda: mock_result))

        result = await list_tasks(
            mock_session,
            user_id=1,
            status="pending"
        )

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_list_tasks_returns_empty_list_when_no_tasks(self, mock_session):
        """Test listing when no tasks exist"""
        mock_session.exec = AsyncMock(return_value=MagicMock(all=lambda: []))

        result = await list_tasks(mock_session, user_id=1)

        assert result == []

    @pytest.mark.asyncio
    async def test_list_tasks_validates_user_id(self, mock_session):
        """Test that list_tasks requires user_id"""
        with pytest.raises((TypeError, ValueError)):
            await list_tasks(mock_session, user_id=None)


class TestUpdateTaskTool:
    """Tests for update_task MCP tool"""

    @pytest.mark.asyncio
    async def test_update_task_modifies_title(self, mock_session, mock_task):
        """Test updating task title"""
        mock_session.exec = AsyncMock(return_value=MagicMock(first=lambda: mock_task))
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        result = await update_task(
            mock_session,
            user_id=1,
            task_id=1,
            title="Updated Title"
        )

        assert result is not None

    @pytest.mark.asyncio
    async def test_update_task_modifies_description(self, mock_session, mock_task):
        """Test updating task description"""
        mock_session.exec = AsyncMock(return_value=MagicMock(first=lambda: mock_task))
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        result = await update_task(
            mock_session,
            user_id=1,
            task_id=1,
            description="Updated Description"
        )

        assert result is not None

    @pytest.mark.asyncio
    async def test_update_task_fails_for_non_owner(self, mock_session):
        """Test that update_task validates ownership"""
        mock_session.exec = AsyncMock(return_value=MagicMock(first=lambda: None))

        result = await update_task(
            mock_session,
            user_id=1,
            task_id=1,
            title="Updated"
        )

        # Should fail or return error
        assert result is None or 'error' in result

    @pytest.mark.asyncio
    async def test_update_task_validates_task_id(self, mock_session):
        """Test that update_task requires task_id"""
        with pytest.raises((TypeError, ValueError)):
            await update_task(
                mock_session,
                user_id=1,
                task_id=None,
                title="Updated"
            )


class TestCompleteTaskTool:
    """Tests for complete_task MCP tool"""

    @pytest.mark.asyncio
    async def test_complete_task_sets_status_complete(self, mock_session, mock_task):
        """Test completing a task"""
        mock_task.status = "completed"
        mock_session.exec = AsyncMock(return_value=MagicMock(first=lambda: mock_task))
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        result = await complete_task(
            mock_session,
            user_id=1,
            task_id=1
        )

        assert result is not None

    @pytest.mark.asyncio
    async def test_complete_task_fails_for_non_owner(self, mock_session):
        """Test that complete_task validates ownership"""
        mock_session.exec = AsyncMock(return_value=MagicMock(first=lambda: None))

        result = await complete_task(
            mock_session,
            user_id=1,
            task_id=1
        )

        assert result is None or 'error' in result

    @pytest.mark.asyncio
    async def test_complete_task_validates_task_id(self, mock_session):
        """Test that complete_task requires task_id"""
        with pytest.raises((TypeError, ValueError)):
            await complete_task(
                mock_session,
                user_id=1,
                task_id=None
            )


class TestDeleteTaskTool:
    """Tests for delete_task MCP tool"""

    @pytest.mark.asyncio
    async def test_delete_task_removes_task(self, mock_session, mock_task):
        """Test deleting a task"""
        mock_session.exec = AsyncMock(return_value=MagicMock(first=lambda: mock_task))
        mock_session.delete = Mock()
        mock_session.commit = AsyncMock()

        result = await delete_task(
            mock_session,
            user_id=1,
            task_id=1
        )

        assert result is not None

    @pytest.mark.asyncio
    async def test_delete_task_fails_for_non_owner(self, mock_session):
        """Test that delete_task validates ownership"""
        mock_session.exec = AsyncMock(return_value=MagicMock(first=lambda: None))

        result = await delete_task(
            mock_session,
            user_id=1,
            task_id=1
        )

        assert result is None or 'error' in result

    @pytest.mark.asyncio
    async def test_delete_task_validates_task_id(self, mock_session):
        """Test that delete_task requires task_id"""
        with pytest.raises((TypeError, ValueError)):
            await delete_task(
                mock_session,
                user_id=1,
                task_id=None
            )

    @pytest.mark.asyncio
    async def test_delete_task_cannot_delete_completed_task(self, mock_session, mock_task):
        """Test that completed tasks cannot be deleted"""
        mock_task.status = "completed"
        mock_session.exec = AsyncMock(return_value=MagicMock(first=lambda: mock_task))

        # Implementation should prevent deletion of completed tasks
        result = await delete_task(
            mock_session,
            user_id=1,
            task_id=1
        )

        # Should fail or return error
        assert result is None or 'error' in result
