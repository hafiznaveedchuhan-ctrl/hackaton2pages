"""
Pytest Configuration

Shared fixtures and setup for backend tests
"""

import pytest
import os
from unittest.mock import Mock, AsyncMock, MagicMock
from datetime import datetime, timedelta
import jwt


@pytest.fixture(scope="session")
def test_secret_key():
    """Test JWT secret key"""
    return "test-secret-key-min-32-chars-long!"


@pytest.fixture(autouse=True)
def setup_test_env(test_secret_key):
    """Setup test environment variables"""
    os.environ['JWT_SECRET'] = test_secret_key
    os.environ['DATABASE_URL'] = 'sqlite:///./test.db'
    os.environ['OPENAI_API_KEY'] = 'test-key'
    yield
    # Cleanup
    if os.path.exists('./test.db'):
        os.remove('./test.db')


@pytest.fixture
def test_token(test_secret_key):
    """Create valid test JWT token"""
    payload = {
        'user_id': 1,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, test_secret_key, algorithm='HS256')


@pytest.fixture
def expired_token(test_secret_key):
    """Create expired test JWT token"""
    payload = {
        'user_id': 1,
        'exp': datetime.utcnow() - timedelta(days=1)
    }
    return jwt.encode(payload, test_secret_key, algorithm='HS256')


@pytest.fixture
def mock_db_session():
    """Create mock database session"""
    session = AsyncMock()
    session.add = Mock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.exec = AsyncMock()
    session.delete = Mock()
    return session


@pytest.fixture
def mock_user():
    """Create mock user object"""
    user = MagicMock()
    user.id = 1
    user.email = "test@example.com"
    user.name = "Test User"
    return user


@pytest.fixture
def mock_conversation():
    """Create mock conversation object"""
    conv = MagicMock()
    conv.id = 1
    conv.user_id = 1
    conv.created_at = datetime.utcnow()
    conv.updated_at = datetime.utcnow()
    return conv


@pytest.fixture
def mock_message():
    """Create mock message object"""
    msg = MagicMock()
    msg.id = 1
    msg.conversation_id = 1
    msg.user_id = 1
    msg.role = "user"
    msg.content = "Test message"
    msg.created_at = datetime.utcnow()
    return msg


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


@pytest.fixture
def sample_chat_request():
    """Create sample chat request"""
    return {
        "conversation_id": None,
        "message": "Add task: Buy groceries"
    }


@pytest.fixture
def sample_chat_response():
    """Create sample chat response"""
    return {
        "conversation_id": 1,
        "response": "Task added successfully",
        "tool_calls": ["add_task"],
        "status": "success"
    }


# Async test support
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
