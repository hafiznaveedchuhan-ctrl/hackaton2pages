# Phase-3: Todo AI Chatbot - Complete Specification

**Status**: In Development
**Architecture**: OpenAI Agents SDK + MCP Server + FastAPI Backend
**Frontend**: OpenAI ChatKit + Next.js
**Database**: Neon PostgreSQL (Conversation History)

---

## Overview

Phase-3 introduces an AI-powered chatbot interface for managing todos through natural language. The system uses OpenAI Agents SDK to process user messages and MCP (Model Context Protocol) tools for task operations.

### Key Features
- **Natural Language Task Management**: Users manage todos via conversational AI
- **Stateless Chat Architecture**: Server doesn't maintain chat state; all history persists in database
- **MCP Tools Integration**: 5 tools for task operations (add, list, complete, delete, update)
- **Multi-user Support**: Each user has isolated conversations and tasks
- **Real-time Response**: Async FastAPI backend with streaming responses

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   OpenAI ChatKit Component (Hosted UI)                   │  │
│  │   - Chat interface with message history                  │  │
│  │   - User inputs and AI responses                         │  │
│  │   - Purple UI body with proper sidebar spacing           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                    API: POST /api/{user_id}/chat
                    (Request: message + conversation_id)
                    (Response: assistant_response + tool_calls)
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Chat Endpoint Handler                                  │  │
│  │   1. Extract & validate JWT token                        │  │
│  │   2. Fetch conversation from database                    │  │
│  │   3. Build message history from DB                       │  │
│  │   4. Call OpenAI Agents SDK                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │   OpenAI Agents SDK                                      │  │
│  │   - Processes natural language                           │  │
│  │   - Selects appropriate MCP tools                        │  │
│  │   - Executes stateless tool calls                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │   MCP Server (Official MCP SDK)                          │  │
│  │   Tools:                                                  │  │
│  │   - add_task: Create new todo                            │  │
│  │   - list_tasks: List all user todos                      │  │
│  │   - complete_task: Mark todo as done                     │  │
│  │   - delete_task: Remove todo                             │  │
│  │   - update_task: Edit todo name                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │   Database Operations                                    │  │
│  │   - Store user message                                   │  │
│  │   - Store assistant response + tool_calls                │  │
│  │   - Execute task operations via Task CRUD               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│              Database (Neon PostgreSQL)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Tables:                                                 │  │
│  │   - users (id, email, password_hash, name, created_at)  │  │
│  │   - conversations (id, user_id, created_at, updated_at) │  │
│  │   - messages (id, conversation_id, role, content, ...)  │  │
│  │   - tasks (id, user_id, name, status, created_at)       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stateless Request Cycle

### Single Chat Message Flow

```
User Types: "Add task: Complete Phase-3"
         │
         ▼
1. Frontend sends POST /api/{user_id}/chat
   ├─ authorization: "Bearer {jwt_token}"
   ├─ conversation_id: 123 (or null for new)
   └─ message: "Add task: Complete Phase-3"
         │
         ▼
2. Backend ChatEndpoint receives request
   ├─ Validates JWT token
   ├─ Fetches conversation from DB (or creates new)
   ├─ Stores user message in DB
   └─ Fetches previous messages from DB
         │
         ▼
3. OpenAI Agents SDK processes message
   ├─ Builds message history from DB
   ├─ Sends to OpenAI API with MCP tools available
   └─ Receives response + selected tool_calls
         │
         ▼
4. MCP Server executes tool calls (stateless)
   ├─ Example: add_task tool
   ├─ Executes: INSERT INTO tasks (name, user_id, status)
   └─ Returns: Task created result
         │
         ▼
5. Backend stores response in DB
   ├─ Stores assistant response text
   ├─ Stores tool_calls used
   └─ Stores function results
         │
         ▼
6. Frontend receives ChatResponse
   ├─ conversation_id
   ├─ response (assistant text)
   ├─ tool_calls (["add_task", "list_tasks"])
   └─ status: "success"
         │
         ▼
User sees: "I've created the task 'Complete Phase-3' for you.
            You now have 5 tasks in total."
```

### Key Points
- **No Server State**: Chat server holds zero state in memory
- **Database Persistence**: All conversation history in database
- **Stateless Tools**: Each tool call is independent
- **JWT Validation**: Every request authenticated
- **Multi-user Isolation**: Users see only their conversations/tasks

---

## Frontend Specification

### OpenAI ChatKit Integration

**Component**: `<ChatKit />` from OpenAI ChatKit SDK
**Location**: `frontend/src/app/chat/page.tsx`

```tsx
import ChatKit from '@openai/chat-kit'

export default function ChatPage() {
  return (
    <ChatKit
      apiKey={process.env.NEXT_PUBLIC_OPENAI_API_KEY}
      model="gpt-4"
      systemPrompt="You are a helpful todo management assistant..."
    />
  )
}
```

### UI Requirements
- **Body Background**: PURPLE (#7c3aed or similar)
- **Sidebar**: Proper spacing (padding: 1rem)
- **Chat Interface**: Conversation list on left, chat on right
- **Message Layout**: User messages right-aligned, assistant left-aligned
- **Forms**: White background with black text (signup/login unchanged)
- **Navigation**: Tasks, AI Chat links only

### Responsive Design
- Mobile: Single column (chat full width)
- Tablet: Two columns with collapsible sidebar
- Desktop: Fixed sidebar + main chat area

---

## Backend API Specification

### Chat Endpoint

```
POST /api/{user_id}/chat
Authorization: Bearer {jwt_token}
Content-Type: application/json

Request Body:
{
  "conversation_id": 123 (optional, null for new),
  "message": "Add task: Complete Phase-3"
}

Response:
{
  "conversation_id": 123,
  "response": "I've created the task 'Complete Phase-3' for you.",
  "tool_calls": ["add_task"],
  "status": "success"
}
```

### Error Responses

```
401 Unauthorized - Invalid/missing JWT token
403 Forbidden - User doesn't own conversation
500 Internal Server Error - OpenAI API error or database error
```

---

## MCP Tools Specification

### Tool 1: add_task

**Purpose**: Create a new todo task

```json
{
  "name": "add_task",
  "description": "Create a new todo task",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_name": {
        "type": "string",
        "description": "Name/description of the task"
      }
    },
    "required": ["task_name"]
  }
}
```

**Returns**:
```json
{
  "success": true,
  "task_id": 456,
  "task_name": "Complete Phase-3",
  "status": "pending",
  "message": "Task created successfully"
}
```

---

### Tool 2: list_tasks

**Purpose**: Get all user's tasks

```json
{
  "name": "list_tasks",
  "description": "List all user's tasks with their status"
}
```

**Returns**:
```json
{
  "success": true,
  "tasks": [
    {
      "id": 1,
      "name": "Complete Phase-3",
      "status": "pending",
      "created_at": "2024-12-19T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Review spec",
      "status": "completed",
      "created_at": "2024-12-19T09:00:00Z"
    }
  ],
  "total": 2
}
```

---

### Tool 3: complete_task

**Purpose**: Mark a task as completed

```json
{
  "name": "complete_task",
  "description": "Mark a task as completed",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "ID of the task to complete"
      }
    },
    "required": ["task_id"]
  }
}
```

**Returns**:
```json
{
  "success": true,
  "task_id": 456,
  "status": "completed",
  "message": "Task marked as completed"
}
```

---

### Tool 4: delete_task

**Purpose**: Delete a task

```json
{
  "name": "delete_task",
  "description": "Delete a task",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "ID of the task to delete"
      }
    },
    "required": ["task_id"]
  }
}
```

**Returns**:
```json
{
  "success": true,
  "task_id": 456,
  "message": "Task deleted successfully"
}
```

---

### Tool 5: update_task

**Purpose**: Update task name

```json
{
  "name": "update_task",
  "description": "Update a task's name",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "ID of the task to update"
      },
      "new_name": {
        "type": "string",
        "description": "New name for the task"
      }
    },
    "required": ["task_id", "new_name"]
  }
}
```

**Returns**:
```json
{
  "success": true,
  "task_id": 456,
  "task_name": "Complete Phase-3 & Phase-4",
  "message": "Task updated successfully"
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  tool_calls JSONB, -- Array of tool calls made
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Installation & Dependencies

### Frontend
```bash
npm install @openai/chat-kit
npm install next react react-dom
npm install tailwindcss
```

### Backend
```bash
pip install openai
pip install openai-agents-sdk
pip install mcp
pip install fastapi uvicorn
pip install sqlmodel python-jose
pip install neon-driver
```

---

## Implementation Checklist

- [ ] Create `/specs` directory with all specification files
- [ ] Install OpenAI ChatKit in frontend
- [ ] Update frontend UI to PURPLE with proper sidebar spacing
- [ ] Configure OpenAI ChatKit component
- [ ] Install OpenAI Agents SDK in backend
- [ ] Build MCP Server with Official MCP SDK
- [ ] Implement all 5 MCP tools (add, list, complete, delete, update)
- [ ] Create/update chat endpoint in FastAPI
- [ ] Implement stateless message handling
- [ ] Add database persistence for conversations
- [ ] Test chat flow end-to-end
- [ ] Test all MCP tools
- [ ] Test multi-user isolation
- [ ] Deploy and verify

---

## Testing Strategy

### Manual Testing
1. **Chat Flow**: Send message → AI responds → Tool executes
2. **Task Operations**: Add, list, complete, delete via chat
3. **Persistence**: Restart server → messages still visible
4. **Multi-user**: Two users have separate conversations
5. **Auth**: Unauthenticated requests rejected
6. **Errors**: Invalid tokens, nonexistent tasks handled gracefully

### Test Commands
```bash
# Test add_task
curl -X POST http://localhost:8000/api/1/chat \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add task: Test task"}'

# Test list_tasks
curl -X POST http://localhost:8000/api/1/chat \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show my tasks"}'
```

---

## UI Mockup

```
┌────────────────────────────────────────────────────────┐
│ FZ Todo    Tasks  AI Chat      Search      [Hello, User]│ <- Navbar
├─────────────┬────────────────────────────────────────┤
│             │  CHAT TITLE                             │
│  Convo 1    │  (Conversation or Chat Details)         │
│  Convo 2    ├────────────────────────────────────────┤
│  Convo 3    │ Message 1 (User)                        │
│  + New      │                    Message 1 (Assistant)│
│             │ Message 2 (User)                        │
│             │                    Message 2 (Assistant)│
│             ├────────────────────────────────────────┤
│             │ Type your message...        [Send →]    │
└─────────────┴────────────────────────────────────────┘
```

---

## Next Steps

1. **Frontend Setup**: Install and configure OpenAI ChatKit
2. **Backend Setup**: Install OpenAI Agents SDK and MCP SDK
3. **MCP Tools**: Implement all 5 tools
4. **Chat Endpoint**: Build stateless request handler
5. **Database**: Ensure conversation schema is ready
6. **Testing**: End-to-end chat flow verification
7. **Deployment**: Test in production environment

---

## Notes

- **Spec-Driven**: All implementation follows this specification
- **Stateless**: Backend holds zero state in memory
- **Persistent**: All data in Neon PostgreSQL
- **Scalable**: Each request independent, no session affinity
- **Secure**: JWT-based authentication on every request
