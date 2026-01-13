# Phase-3: AI-Powered Todo Chatbot - Setup Guide

## Overview

Phase-3 transforms the full-stack Todo application into an AI-powered conversational system using a multi-agent architecture with OpenAI GPT-4, MCP tools, and FastAPI.

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 13+ (or Neon Serverless)
- OpenAI API key

### Backend Setup

```bash
cd Phase-3/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp ../.env.example ../.env
# Edit .env with your DATABASE_URL, OPENAI_API_KEY, JWT_SECRET

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn main:app --reload --port 8000
```

Backend runs on `http://localhost:8000`

### Frontend Setup

```bash
cd Phase-3/frontend

# Install dependencies
npm install

# Setup environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# Start frontend dev server
npm run dev
```

Frontend runs on `http://localhost:3000`

## Project Structure

```
Phase-3/
├── backend/
│   ├── agents/           # 5 domain agents
│   ├── mcp/              # MCP server and tools
│   ├── models/           # SQLModel data models
│   ├── routes/           # FastAPI endpoints
│   ├── db/               # Database setup and migrations
│   ├── tests/            # Unit and integration tests
│   ├── main.py           # FastAPI application
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and API client
│   │   ├── pages/        # Next.js pages
│   │   └── tests/        # Component tests
│   ├── package.json
│   └── tsconfig.json
│
├── specs/
│   └── spec.md           # Complete specification
│
├── plan.md               # Implementation plan
├── tasks.md              # 85 executable tasks
├── .env.example          # Environment template
└── SETUP.md             # This file
```

## Architecture

```
ChatKit UI (Frontend)
    ↓
FastAPI Chat Endpoint
    ↓
AuthAgent → ConversationAgent → ToolRouterAgent → TaskManagerAgent
    ↓
MCP Server (5 Tools)
    ↓
PostgreSQL Database
```

## Key Components

### 5 Domain Agents

1. **AuthAgent** - JWT validation and user isolation
2. **ConversationAgent** - Conversation history management
3. **ToolRouterAgent** - Intent parsing and MCP tool selection
4. **TaskManagerAgent** - Task CRUD via MCP tools
5. **ErrorHandlingAgent** - Exception handling and recovery

### 5 MCP Tools

- `add_task` - Create new task
- `list_tasks` - List tasks by status
- `update_task` - Update task details
- `delete_task` - Delete task
- `complete_task` - Mark task complete

### Chat API

**Endpoint**: `POST /api/{user_id}/chat`

**Request**:
```json
{
  "conversation_id": 123,
  "message": "Add task: Complete project setup"
}
```

**Response**:
```json
{
  "conversation_id": 123,
  "response": "I've created the task 'Complete project setup' for you.",
  "tool_calls": ["add_task"],
  "status": "success"
}
```

## Database Models

### Conversation
- id (Primary Key)
- user_id (Foreign Key)
- created_at
- updated_at

### Message
- id (Primary Key)
- conversation_id (Foreign Key)
- user_id (Foreign Key)
- role (user | assistant)
- content (Text)
- created_at

### Task (inherited from Phase-2)
- id, user_id, title, description, completed, created_at, updated_at

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run specific test file
pytest tests/test_agents.py -v
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Environment Variables

Create `.env` file in Phase-3 root:

```
DATABASE_URL=postgresql://user:password@localhost:5432/phase3_db
OPENAI_API_KEY=sk-your-api-key
JWT_SECRET=your-secret-key-min-32-chars
NEXT_PUBLIC_API_URL=http://localhost:8000/api
MCP_ENABLED=true
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## Deployment

### Docker

```bash
# Build backend image
docker build -t phase3-backend ./backend

# Build frontend image
docker build -t phase3-frontend ./frontend

# Run with docker-compose
docker-compose up
```

### Kubernetes

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check status
kubectl get pods
```

## Documentation

- **Specification**: `specs/spec.md` - Complete feature specification
- **Implementation Plan**: `plan.md` - Architecture and design decisions
- **Task List**: `tasks.md` - 85 executable tasks
- **API Docs**: `backend/docs/API.md` - API endpoint documentation
- **Agent Skills**: `backend/agents/*.skills.md` - Agent documentation

## Success Criteria

✅ Users can chat with AI to manage todos
✅ AI understands natural language commands
✅ All CRUD operations work through chat
✅ Conversation history persists across sessions
✅ Multi-user isolation guaranteed
✅ Response time under 2 seconds
✅ 80%+ test coverage
✅ All tasks completed

## Support & Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.8+

# Verify virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend build fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database connection issues

```bash
# Verify PostgreSQL is running
psql postgres://user:password@localhost:5432

# Check DATABASE_URL in .env
# Run migrations
alembic upgrade head
```

## Phased Implementation (MVP First)

- **Phase 1**: Setup (T001-T006) ✓
- **Phase 2**: Foundational (T007-T023) - In Progress
- **Phase 3**: User Story 1 - Basic Chat (T024-T046)
- **Phase 4**: User Story 2 - Multi-Agent (T047-T058)
- **Phase 5**: User Story 3 - Advanced (T059-T070)
- **Phase 6**: Polish & Documentation (T071-T085)

---

**Status**: Phase 1 Setup Complete ✅

Next: Run Phase 2 Foundational tasks
