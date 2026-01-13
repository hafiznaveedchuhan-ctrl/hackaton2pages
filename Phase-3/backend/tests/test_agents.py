"""
Agent Tests

Comprehensive tests for all domain agents
- AuthAgent: Token validation and user ownership
- ConversationAgent: Conversation lifecycle
- ToolRouterAgent: Intent parsing and tool selection
- TaskManagerAgent: Task CRUD operations
- ErrorHandlingAgent: Error classification and recovery

@specs/phase-3-overview.md - Agent Specifications
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
import jwt
import os

from agents import (
    AuthAgent,
    ConversationAgent,
    ToolRouterAgent,
    TaskManagerAgent,
    ErrorHandlingAgent
)


class TestAuthAgent:
    """Tests for AuthAgent"""

    def setup_method(self):
        """Setup test fixtures"""
        self.secret_key = "test-secret-key-min-32-chars-long!"
        self.user_id = 1
        os.environ['JWT_SECRET'] = self.secret_key

    def test_create_token_returns_valid_token(self):
        """Test token creation"""
        token = AuthAgent.create_token(self.user_id)
        assert token is not None
        assert isinstance(token, str)

    def test_validate_token_succeeds_with_valid_token(self):
        """Test token validation with valid token"""
        token = AuthAgent.create_token(self.user_id)
        result = AuthAgent.validate_token(token)

        assert result is not None
        assert result.get('user_id') == self.user_id

    def test_validate_token_fails_with_invalid_token(self):
        """Test token validation with invalid token"""
        result = AuthAgent.validate_token("invalid-token")
        assert result is None

    def test_validate_token_fails_with_expired_token(self):
        """Test token validation with expired token"""
        # Create expired token
        payload = {
            'user_id': self.user_id,
            'exp': datetime.utcnow() - timedelta(days=1)
        }
        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        result = AuthAgent.validate_token(token)
        assert result is None

    def test_verify_user_ownership_returns_true_for_same_user(self):
        """Test user ownership verification"""
        result = AuthAgent.verify_user_ownership(1, 1)
        assert result is True

    def test_verify_user_ownership_returns_false_for_different_user(self):
        """Test user ownership verification fails for different users"""
        result = AuthAgent.verify_user_ownership(1, 2)
        assert result is False


class TestConversationAgent:
    """Tests for ConversationAgent"""

    @pytest.mark.asyncio
    async def test_get_or_create_conversation_creates_new(self):
        """Test conversation creation"""
        mock_session = AsyncMock()

        with patch('agents.conversation_agent.get_or_create_conversation_db', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = {
                'conversation_id': 1,
                'user_id': 1,
                'created_at': datetime.utcnow().isoformat()
            }

            result = await ConversationAgent.get_or_create_conversation(
                mock_session,
                user_id=1,
                conversation_id=None
            )

            assert result is not None
            assert 'conversation_id' in result

    @pytest.mark.asyncio
    async def test_fetch_message_history_returns_messages(self):
        """Test fetching message history"""
        mock_session = AsyncMock()
        mock_messages = [
            {'role': 'user', 'content': 'Hello'},
            {'role': 'assistant', 'content': 'Hi there!'}
        ]

        with patch('agents.conversation_agent.fetch_messages_db', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = mock_messages

            result = await ConversationAgent.fetch_message_history(
                mock_session,
                conversation_id=1
            )

            assert result == mock_messages

    @pytest.mark.asyncio
    async def test_store_user_message_succeeds(self):
        """Test storing user message"""
        mock_session = AsyncMock()

        with patch('agents.conversation_agent.store_message_db', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = {'message_id': 1, 'status': 'stored'}

            result = await ConversationAgent.store_user_message(
                mock_session,
                conversation_id=1,
                user_id=1,
                content='Test message'
            )

            assert result is not None
            assert result.get('status') == 'stored'

    @pytest.mark.asyncio
    async def test_store_assistant_message_succeeds(self):
        """Test storing assistant message"""
        mock_session = AsyncMock()

        with patch('agents.conversation_agent.store_message_db', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = {'message_id': 2, 'status': 'stored'}

            result = await ConversationAgent.store_assistant_message(
                mock_session,
                conversation_id=1,
                user_id=1,
                content='Assistant response'
            )

            assert result is not None
            assert result.get('status') == 'stored'


class TestToolRouterAgent:
    """Tests for ToolRouterAgent"""

    @pytest.mark.asyncio
    async def test_parse_intent_identifies_add_task(self):
        """Test intent parsing for add_task"""
        with patch('agents.tool_router_agent.parse_intent_gpt4', new_callable=AsyncMock) as mock_gpt:
            mock_gpt.return_value = {
                'action': 'add_task',
                'params': {'title': 'Buy groceries'}
            }

            result = await ToolRouterAgent.parse_intent(
                'Add a task to buy groceries',
                []
            )

            assert result.get('action') == 'add_task'
            assert 'params' in result

    @pytest.mark.asyncio
    async def test_parse_intent_identifies_list_tasks(self):
        """Test intent parsing for list_tasks"""
        with patch('agents.tool_router_agent.parse_intent_gpt4', new_callable=AsyncMock) as mock_gpt:
            mock_gpt.return_value = {
                'action': 'list_tasks',
                'params': {}
            }

            result = await ToolRouterAgent.parse_intent(
                'Show me all my tasks',
                []
            )

            assert result.get('action') == 'list_tasks'

    @pytest.mark.asyncio
    async def test_select_tools_returns_tool_list(self):
        """Test tool selection"""
        tools = await ToolRouterAgent.select_tools(
            'add_task',
            {'title': 'Test task'}
        )

        assert isinstance(tools, list)
        assert len(tools) > 0

    @pytest.mark.asyncio
    async def test_generate_response_creates_text(self):
        """Test response generation"""
        with patch('agents.tool_router_agent.generate_response_gpt4', new_callable=AsyncMock) as mock_gpt:
            mock_gpt.return_value = 'Task added successfully'

            result = await ToolRouterAgent.generate_response(
                'Add task: Buy groceries',
                [{'tool': 'add_task', 'result': {'task_id': 1}}],
                []
            )

            assert isinstance(result, str)
            assert len(result) > 0


class TestTaskManagerAgent:
    """Tests for TaskManagerAgent"""

    @pytest.mark.asyncio
    async def test_execute_tools_executes_all_tools(self):
        """Test tool execution"""
        mock_session = AsyncMock()
        tools = [
            {'tool': 'add_task', 'params': {'title': 'Test'}}
        ]

        result = await TaskManagerAgent.execute_tools(
            mock_session,
            user_id=1,
            tools=tools
        )

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_validate_task_ownership_succeeds_for_owner(self):
        """Test task ownership validation"""
        mock_session = AsyncMock()

        with patch('agents.task_manager_agent.get_task_owner', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = 1

            result = await TaskManagerAgent.validate_task_ownership(
                mock_session,
                user_id=1,
                task_id=1
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_validate_task_ownership_fails_for_non_owner(self):
        """Test task ownership validation fails for non-owner"""
        mock_session = AsyncMock()

        with patch('agents.task_manager_agent.get_task_owner', new_callable=AsyncMock) as mock_db:
            mock_db.return_value = 2

            result = await TaskManagerAgent.validate_task_ownership(
                mock_session,
                user_id=1,
                task_id=1
            )

            assert result is False


class TestErrorHandlingAgent:
    """Tests for ErrorHandlingAgent"""

    def test_classify_error_identifies_auth_error(self):
        """Test error classification for auth errors"""
        error = ValueError('Invalid token')
        error_type = ErrorHandlingAgent.classify_error(error)

        assert error_type is not None

    def test_handle_error_returns_user_friendly_message(self):
        """Test error handling"""
        error = ValueError('Database connection failed')
        result = ErrorHandlingAgent.handle_error(error)

        assert 'message' in result
        assert isinstance(result['message'], str)
        assert len(result['message']) > 0

    def test_recovery_strategy_suggests_action(self):
        """Test recovery strategy generation"""
        from agents.error_handling_agent import ErrorType
        strategy = ErrorHandlingAgent.recovery_strategy(ErrorType.DATABASE_ERROR)

        assert isinstance(strategy, str)
        assert len(strategy) > 0

    @pytest.mark.asyncio
    async def test_safe_execute_catches_exceptions(self):
        """Test safe execution wrapper"""
        async def failing_func():
            raise ValueError('Test error')

        result = await ErrorHandlingAgent.safe_execute(failing_func)

        assert result is not None
        assert 'error' in result or 'message' in result
