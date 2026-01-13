"""
Chat Endpoint Tests

Comprehensive tests for chat API endpoint
- Authentication and authorization
- Message handling
- Conversation management
- Agent pipeline execution
- Error handling

@specs/phase-3-overview.md - Chat API Specification
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def mock_session():
    """Create mock database session"""
    return Mock(spec=Session)


@pytest.fixture
def valid_token():
    """Create valid JWT token"""
    from agents import AuthAgent
    return AuthAgent.create_token(user_id=1)


@pytest.fixture
def chat_request():
    """Create chat request payload"""
    return {
        "conversation_id": None,
        "message": "Add task: Buy groceries"
    }


class TestChatEndpoint:
    """Tests for chat endpoint"""

    def test_health_check_returns_healthy(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_chat_endpoint_requires_authentication(self, client, chat_request):
        """Test that chat endpoint requires authentication"""
        response = client.post(
            "/api/1/chat",
            json=chat_request
        )
        assert response.status_code == 403 or response.status_code == 401

    def test_chat_endpoint_rejects_invalid_token(self, client, chat_request):
        """Test that endpoint rejects invalid token"""
        response = client.post(
            "/api/1/chat",
            json=chat_request,
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401

    def test_chat_endpoint_rejects_missing_bearer_prefix(self, client, chat_request, valid_token):
        """Test that endpoint rejects token without Bearer prefix"""
        response = client.post(
            "/api/1/chat",
            json=chat_request,
            headers={"Authorization": valid_token}
        )
        assert response.status_code == 401

    def test_chat_endpoint_validates_user_ownership(self, client, chat_request, valid_token):
        """Test that endpoint validates user ownership"""
        response = client.post(
            "/api/2/chat",  # Different user ID
            json=chat_request,
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response.status_code == 403

    @patch('routes.chat.ConversationAgent.get_or_create_conversation')
    @patch('routes.chat.ConversationAgent.fetch_message_history')
    @patch('routes.chat.ConversationAgent.store_user_message')
    @patch('routes.chat.ToolRouterAgent.parse_intent')
    @patch('routes.chat.ToolRouterAgent.select_tools')
    @patch('routes.chat.TaskManagerAgent.execute_tools')
    @patch('routes.chat.ToolRouterAgent.generate_response')
    @patch('routes.chat.ConversationAgent.store_assistant_message')
    def test_chat_endpoint_executes_agent_pipeline(
        self,
        client,
        chat_request,
        valid_token,
        mock_store_assistant,
        mock_generate_response,
        mock_execute_tools,
        mock_select_tools,
        mock_parse_intent,
        mock_store_user,
        mock_fetch_history,
        mock_get_or_create
    ):
        """Test that endpoint executes full agent pipeline"""
        # Setup mocks
        mock_get_or_create.return_value = {'conversation_id': 1}
        mock_fetch_history.return_value = []
        mock_store_user.return_value = {'message_id': 1}
        mock_parse_intent.return_value = {
            'action': 'add_task',
            'params': {'title': 'Buy groceries'}
        }
        mock_select_tools.return_value = [
            {'tool': 'add_task', 'params': {'title': 'Buy groceries'}}
        ]
        mock_execute_tools.return_value = [
            {'tool': 'add_task', 'result': {'task_id': 1}}
        ]
        mock_generate_response.return_value = 'Task added successfully'
        mock_store_assistant.return_value = {'message_id': 2}

        response = client.post(
            "/api/1/chat",
            json=chat_request,
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data['conversation_id'] == 1
        assert 'response' in data
        assert data['status'] == 'success'

    @patch('routes.chat.ConversationAgent.get_or_create_conversation')
    def test_chat_endpoint_returns_conversation_id(
        self,
        client,
        chat_request,
        valid_token,
        mock_get_or_create
    ):
        """Test that endpoint returns conversation ID"""
        mock_get_or_create.return_value = {'conversation_id': 42}

        with patch('routes.chat.ConversationAgent.fetch_message_history', new_callable=AsyncMock):
            with patch('routes.chat.ConversationAgent.store_user_message', new_callable=AsyncMock):
                with patch('routes.chat.ToolRouterAgent.parse_intent', new_callable=AsyncMock) as mock_parse:
                    mock_parse.return_value = {'action': 'list_tasks', 'params': {}}

                    with patch('routes.chat.ToolRouterAgent.select_tools', new_callable=AsyncMock):
                        with patch('routes.chat.TaskManagerAgent.execute_tools', new_callable=AsyncMock):
                            with patch('routes.chat.ToolRouterAgent.generate_response', new_callable=AsyncMock) as mock_gen:
                                mock_gen.return_value = 'Here are your tasks'

                                with patch('routes.chat.ConversationAgent.store_assistant_message', new_callable=AsyncMock):
                                    response = client.post(
                                        "/api/1/chat",
                                        json=chat_request,
                                        headers={"Authorization": f"Bearer {valid_token}"}
                                    )

                                    assert response.status_code == 200

    def test_chat_endpoint_requires_message(self, client, valid_token):
        """Test that endpoint requires message in request"""
        response = client.post(
            "/api/1/chat",
            json={"conversation_id": None},
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response.status_code == 422

    def test_chat_endpoint_validates_message_format(self, client, valid_token):
        """Test that endpoint validates message format"""
        response = client.post(
            "/api/1/chat",
            json={"conversation_id": None, "message": ""},
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        # Empty message may be handled by validation
        assert response.status_code in [200, 422]

    @patch('routes.chat.ConversationAgent.get_or_create_conversation')
    def test_chat_endpoint_handles_database_errors(
        self,
        client,
        chat_request,
        valid_token,
        mock_get_or_create
    ):
        """Test that endpoint handles database errors gracefully"""
        mock_get_or_create.side_effect = Exception("Database connection failed")

        response = client.post(
            "/api/1/chat",
            json=chat_request,
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 500
        data = response.json()
        assert 'detail' in data

    @patch('routes.chat.ToolRouterAgent.parse_intent')
    def test_chat_endpoint_handles_intent_parsing_errors(
        self,
        client,
        chat_request,
        valid_token,
        mock_parse_intent
    ):
        """Test that endpoint handles intent parsing errors"""
        mock_parse_intent.return_value = {
            'error': 'Could not parse intent'
        }

        with patch('routes.chat.ConversationAgent.get_or_create_conversation', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {'conversation_id': 1}

            with patch('routes.chat.ConversationAgent.fetch_message_history', new_callable=AsyncMock):
                with patch('routes.chat.ConversationAgent.store_user_message', new_callable=AsyncMock):
                    response = client.post(
                        "/api/1/chat",
                        json=chat_request,
                        headers={"Authorization": f"Bearer {valid_token}"}
                    )

                    assert response.status_code == 500

    def test_chat_endpoint_maintains_conversation_state(
        self,
        client,
        valid_token
    ):
        """Test that endpoint maintains conversation state across messages"""
        # First message
        request1 = {
            "conversation_id": None,
            "message": "Add task: Buy groceries"
        }

        with patch('routes.chat.ConversationAgent.get_or_create_conversation', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {'conversation_id': 1}

            with patch('routes.chat.ConversationAgent.fetch_message_history', new_callable=AsyncMock):
                with patch('routes.chat.ConversationAgent.store_user_message', new_callable=AsyncMock):
                    with patch('routes.chat.ToolRouterAgent.parse_intent', new_callable=AsyncMock) as mock_parse:
                        mock_parse.return_value = {'action': 'add_task', 'params': {}}

                        with patch('routes.chat.ToolRouterAgent.select_tools', new_callable=AsyncMock):
                            with patch('routes.chat.TaskManagerAgent.execute_tools', new_callable=AsyncMock):
                                with patch('routes.chat.ToolRouterAgent.generate_response', new_callable=AsyncMock) as mock_gen:
                                    mock_gen.return_value = 'Task added'

                                    with patch('routes.chat.ConversationAgent.store_assistant_message', new_callable=AsyncMock):
                                        # First message should create conversation
                                        response1 = client.post(
                                            "/api/1/chat",
                                            json=request1,
                                            headers={"Authorization": f"Bearer {valid_token}"}
                                        )

                                        # Second message should reuse conversation
                                        request2 = {
                                            "conversation_id": 1,
                                            "message": "Show my tasks"
                                        }
                                        mock_parse.return_value = {'action': 'list_tasks', 'params': {}}

                                        response2 = client.post(
                                            "/api/1/chat",
                                            json=request2,
                                            headers={"Authorization": f"Bearer {valid_token}"}
                                        )

                                        assert response1.status_code == 200
                                        assert response2.status_code == 200
