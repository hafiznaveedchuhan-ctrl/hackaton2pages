"""
Conversation Endpoints Tests

Tests for conversation management endpoints
- GET /api/{user_id}/conversations
- GET /api/{user_id}/conversations/{conversation_id}
- GET /api/{user_id}/conversations/{conversation_id}/messages
- DELETE /api/{user_id}/conversations/{conversation_id}

@specs/phase-3-overview.md - Conversation Management
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


class TestListConversations:
    """Tests for list conversations endpoint"""

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.list_user_conversations')
    @patch('routes.conversations.ConversationAgent.fetch_message_history')
    def test_list_conversations_returns_user_conversations(
        self,
        client,
        valid_token,
        mock_fetch_history,
        mock_list_conv,
        mock_validate
    ):
        """Test listing conversations for user"""
        mock_validate.return_value = {'user_id': 1}
        mock_list_conv.return_value = []
        mock_fetch_history.return_value = []

        response = client.get(
            "/api/1/conversations",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert 'conversations' in data
        assert data['user_id'] == 1

    def test_list_conversations_requires_authentication(self, client):
        """Test that endpoint requires authentication"""
        response = client.get("/api/1/conversations")
        assert response.status_code == 401 or response.status_code == 403

    def test_list_conversations_rejects_invalid_token(self, client):
        """Test that endpoint rejects invalid token"""
        response = client.get(
            "/api/1/conversations",
            headers={"Authorization": "Bearer invalid"}
        )
        assert response.status_code == 401

    def test_list_conversations_validates_user_ownership(self, client, valid_token):
        """Test user isolation"""
        response = client.get(
            "/api/2/conversations",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response.status_code == 403


class TestGetConversation:
    """Tests for get conversation endpoint"""

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.get_conversation')
    @patch('routes.conversations.ConversationAgent.fetch_message_history')
    def test_get_conversation_returns_messages(
        self,
        client,
        valid_token,
        mock_fetch_history,
        mock_get_conv,
        mock_validate
    ):
        """Test getting conversation with messages"""
        mock_validate.return_value = {'user_id': 1}

        mock_conv = Mock()
        mock_conv.id = 1
        mock_conv.user_id = 1
        mock_conv.created_at = Mock(isoformat=lambda: '2024-01-15T10:00:00')
        mock_conv.updated_at = Mock(isoformat=lambda: '2024-01-15T10:30:00')
        mock_get_conv.return_value = mock_conv

        mock_msg = Mock()
        mock_msg.id = 1
        mock_msg.conversation_id = 1
        mock_msg.role = 'user'
        mock_msg.content = 'Test message'
        mock_msg.created_at = Mock(isoformat=lambda: '2024-01-15T10:00:00')
        mock_fetch_history.return_value = [mock_msg]

        response = client.get(
            "/api/1/conversations/1",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 1
        assert len(data['messages']) == 1

    def test_get_conversation_requires_authentication(self, client):
        """Test that endpoint requires authentication"""
        response = client.get("/api/1/conversations/1")
        assert response.status_code == 401 or response.status_code == 403

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.get_conversation')
    def test_get_conversation_returns_404_for_missing(
        self,
        client,
        valid_token,
        mock_get_conv,
        mock_validate
    ):
        """Test that missing conversation returns 404"""
        mock_validate.return_value = {'user_id': 1}
        mock_get_conv.return_value = None

        response = client.get(
            "/api/1/conversations/999",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 404


class TestGetConversationMessages:
    """Tests for get messages endpoint"""

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.get_conversation')
    @patch('routes.conversations.ConversationAgent.fetch_message_history')
    def test_get_messages_returns_paginated_messages(
        self,
        client,
        valid_token,
        mock_fetch_history,
        mock_get_conv,
        mock_validate
    ):
        """Test getting paginated messages"""
        mock_validate.return_value = {'user_id': 1}

        mock_conv = Mock()
        mock_conv.id = 1
        mock_conv.user_id = 1
        mock_get_conv.return_value = mock_conv

        messages = []
        for i in range(5):
            msg = Mock()
            msg.id = i
            msg.conversation_id = 1
            msg.role = 'user' if i % 2 == 0 else 'assistant'
            msg.content = f'Message {i}'
            msg.created_at = Mock(isoformat=lambda: f'2024-01-15T10:0{i}:00')
            messages.append(msg)

        mock_fetch_history.return_value = messages

        response = client.get(
            "/api/1/conversations/1/messages?skip=0&limit=50",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data['conversation_id'] == 1
        assert data['total'] == 5
        assert len(data['messages']) == 5

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.get_conversation')
    @patch('routes.conversations.ConversationAgent.fetch_message_history')
    def test_get_messages_supports_pagination(
        self,
        client,
        valid_token,
        mock_fetch_history,
        mock_get_conv,
        mock_validate
    ):
        """Test message pagination parameters"""
        mock_validate.return_value = {'user_id': 1}

        mock_conv = Mock()
        mock_conv.id = 1
        mock_conv.user_id = 1
        mock_get_conv.return_value = mock_conv

        mock_msg = Mock()
        mock_msg.id = 1
        mock_msg.conversation_id = 1
        mock_msg.role = 'user'
        mock_msg.content = 'Message'
        mock_msg.created_at = Mock(isoformat=lambda: '2024-01-15T10:00:00')
        mock_fetch_history.return_value = [mock_msg]

        response = client.get(
            "/api/1/conversations/1/messages?skip=10&limit=20",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 200


class TestDeleteConversation:
    """Tests for delete conversation endpoint"""

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.delete_conversation')
    def test_delete_conversation_succeeds(
        self,
        client,
        valid_token,
        mock_delete_conv,
        mock_validate
    ):
        """Test deleting a conversation"""
        mock_validate.return_value = {'user_id': 1}
        mock_delete_conv.return_value = True

        response = client.delete(
            "/api/1/conversations/1",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'success'
        assert data['conversation_id'] == 1

    def test_delete_conversation_requires_authentication(self, client):
        """Test that endpoint requires authentication"""
        response = client.delete("/api/1/conversations/1")
        assert response.status_code == 401 or response.status_code == 403

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.delete_conversation')
    def test_delete_conversation_returns_404_for_missing(
        self,
        client,
        valid_token,
        mock_delete_conv,
        mock_validate
    ):
        """Test that deleting non-existent conversation returns 404"""
        mock_validate.return_value = {'user_id': 1}
        mock_delete_conv.return_value = False

        response = client.delete(
            "/api/1/conversations/999",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 404

    def test_delete_conversation_validates_user_ownership(self, client, valid_token):
        """Test user isolation on delete"""
        response = client.delete(
            "/api/2/conversations/1",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response.status_code == 403


class TestConversationErrorHandling:
    """Tests for error handling in conversation endpoints"""

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.list_user_conversations')
    def test_list_conversations_handles_database_error(
        self,
        client,
        valid_token,
        mock_list_conv,
        mock_validate
    ):
        """Test handling database errors"""
        mock_validate.return_value = {'user_id': 1}
        mock_list_conv.side_effect = Exception("Database connection failed")

        response = client.get(
            "/api/1/conversations",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        assert response.status_code == 500
        data = response.json()
        assert 'detail' in data

    @patch('routes.conversations.AuthAgent.validate_token')
    def test_endpoints_handle_missing_token(self, client, mock_validate):
        """Test handling missing authorization header"""
        response = client.get("/api/1/conversations")
        # Should fail with 422 (validation error) or 401 (missing header)
        assert response.status_code in [401, 403, 422]


class TestConversationIntegration:
    """Integration tests for conversation workflow"""

    @patch('routes.conversations.AuthAgent.validate_token')
    @patch('routes.conversations.ConversationAgent.list_user_conversations')
    @patch('routes.conversations.ConversationAgent.get_conversation')
    @patch('routes.conversations.ConversationAgent.delete_conversation')
    @patch('routes.conversations.ConversationAgent.fetch_message_history')
    def test_conversation_workflow(
        self,
        client,
        valid_token,
        mock_fetch_history,
        mock_delete_conv,
        mock_get_conv,
        mock_list_conv,
        mock_validate
    ):
        """Test complete conversation workflow"""
        mock_validate.return_value = {'user_id': 1}

        mock_conv = Mock()
        mock_conv.id = 1
        mock_conv.user_id = 1
        mock_conv.created_at = Mock(isoformat=lambda: '2024-01-15T10:00:00')
        mock_conv.updated_at = Mock(isoformat=lambda: '2024-01-15T10:30:00')

        mock_list_conv.return_value = [mock_conv]
        mock_get_conv.return_value = mock_conv
        mock_delete_conv.return_value = True
        mock_fetch_history.return_value = []

        # 1. List conversations
        list_response = client.get(
            "/api/1/conversations",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert list_response.status_code == 200

        # 2. Get specific conversation
        get_response = client.get(
            "/api/1/conversations/1",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert get_response.status_code == 200

        # 3. Get messages
        msgs_response = client.get(
            "/api/1/conversations/1/messages",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert msgs_response.status_code == 200

        # 4. Delete conversation
        delete_response = client.delete(
            "/api/1/conversations/1",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert delete_response.status_code == 200
