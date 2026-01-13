# Phase-3: AI-Powered Todo Chatbot Specification

## Overview

Phase-3 transforms the existing full-stack Todo application into an AI-powered conversational system that allows users to manage todos using natural language through a chat interface.

Users can now say:
- "Add task: Complete project setup"
- "Show my tasks"
- "Mark first task as done"
- "Delete my completed tasks"

The AI understands intent and executes appropriate actions.

## Architecture

```
ChatKit UI (Frontend)
    ↓
FastAPI Chat Endpoint (Stateless)

    ↓
ConversationAgent (AI Agent)
    ↓
ToolRouterAgent (MCP Router)
    ↓
MCP Server (Tools)
    ↓
PostgreSQL Database
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + ChatKit UI |
| Backend | FastAPI (Python) |
| AI Framework | OpenAI Agents SDK (GPT-4 Model) |
| MCP Server | Official MCP Reference Implementation |
| ORM | SQLModel |
| Database | Neon PostgreSQL |
| Authentication | JWT (Better Auth) |

## Key Agents (Multi-Agent Architecture)

### 1. TaskManagerAgent
**Domain**: Task CRUD operations
**Responsibility**: Execute task creation, reading, updating, deletion
**Skills**: Direct task manipulation through MCP tools

### 2. ConversationAgent
**Domain**: Conversation flow and context
**Responsibility**: Maintain conversation history, manage stateless context
**Skills**: Message history reconstruction, conversation lifecycle

### 3. AuthAgent
**Domain**: Authentication and authorization
**Responsibility**: Validate JWT tokens, enforce user isolation
**Skills**: Token verification, user boundary enforcement

### 4. ToolRouterAgent
**Domain**: Intent-to-tool mapping
**Responsibility**: Parse user intent, select appropriate MCP tools, chain tools if needed
**Skills**: Natural language understanding, tool selection, multi-step execution

### 5. ErrorHandlingAgent
**Domain**: Failure management and recovery
**Responsibility**: Graceful error handling, user-friendly messaging
**Skills**: Exception handling, recovery strategies, clear feedback

## MCP Tools Specification

All operations must go through MCP tools. AI agents NEVER directly access the database.

### Tool: add_task
**Parameters**: user_id, title, description (optional)
**Returns**: task_id, status, title
**Example**: "Create task: Finish report"

### Tool: list_tasks
**Parameters**: user_id, status (optional: active, completed, all)
**Returns**: Array of tasks
**Example**: "Show my tasks"

### Tool: update_task
**Parameters**: user_id, task_id, title (optional), description (optional)
**Returns**: task_id, status
**Example**: "Change task title to new title"

### Tool: delete_task
**Parameters**: user_id, task_id
**Returns**: task_id, status
**Example**: "Delete task"

### Tool: complete_task
**Parameters**: user_id, task_id
**Returns**: task_id, status
**Example**: "Mark task as done"

## Chat API Specification

### Endpoint: POST /api/{user_id}/chat

**Request Body**:
```json
{
  "conversation_id": 123,  // Optional
  "message": "Add task: Complete project"
}
```

**Response**:
```json
{
  "conversation_id": 123,
  "response": "I've created the task 'Complete project' for you.",
  "tool_calls": ["add_task"],
  "status": "success"
}
```

## Stateless Conversation Flow

1. Client sends user message
2. Fetch full conversation history from database (all prior messages)
3. Store user message in database
4. Run AI agent pipeline with complete context
5. AI calls appropriate MCP tools
6. Store assistant response in database
7. Return response to client
8. No state retained in server memory

**Conversation Context**: Full conversation history is maintained in database and sent to AI model on each request. This ensures:
- AI has complete context of all prior interactions
- Conversation persists across user sessions
- Restarts don't lose context
- Better AI understanding of user intent

## Database Models

### Task Table
```
id (Primary Key)
user_id (Foreign Key)
title (String)
description (Text, nullable)
completed (Boolean, default: False)
created_at (Timestamp)
updated_at (Timestamp)
```

### Conversation Table
```
id (Primary Key)
user_id (Foreign Key)
created_at (Timestamp)
updated_at (Timestamp)
```

### Message Table
```
id (Primary Key)
user_id (Foreign Key)
conversation_id (Foreign Key)
role (Enum: 'user' | 'assistant')
content (Text)
created_at (Timestamp)
```

## Security Requirements

- All API endpoints require JWT token authentication
- User isolation enforced: users can only access their own tasks and conversations
- Token validation on every request via AuthAgent
- No cross-user data leakage
- MCP tools enforce user_id parameter validation

## Success Criteria

✅ Users can chat with AI to manage todos
✅ AI correctly understands natural language commands
✅ All CRUD operations work through chat
✅ Conversation history persists
✅ Multi-user isolation guaranteed
✅ Zero unhandled errors
✅ Response time under 2 seconds per message

## Implementation Order

1. Setup Phase-3 backend structure
2. Implement MCP server with 5 tools
3. Create AI agent pipeline (OpenAI SDK)
4. Build FastAPI chat endpoint
5. Implement database models (Conversation, Message)
6. Build chat UI component (Next.js)
7. Integrate frontend with chat API
8. Testing and validation

## Important Rules

1. AI agents MUST NOT directly access the database
2. All operations MUST go through MCP tools
3. Each agent has ONE clear responsibility
4. Agents are reusable across phases
5. Skills documentation required for each agent
6. No server-side state retention (stateless)

## Reusable Intelligence Components

Each agent can be reused in Phase-4 and Phase-5:

- **TaskManagerAgent** → Kubernetes orchestration, event streams
- **ConversationAgent** → Multi-modal conversations, analytics
- **AuthAgent** → Microservices authentication, token management
- **ToolRouterAgent** → Complex workflows, tool composition
- **ErrorHandlingAgent** → Distributed system resilience, fallbacks

## Clarifications

### Session 2025-12-16

- Q1: AI Provider & Model → A: OpenAI GPT-4 (industry standard, proven agents SDK, best NLP quality)
- Q2: MCP Protocol Implementation → A: Official MCP Reference Implementation (spec-aligned, tested, reduces bugs)
- Q3: Conversation History Storage → A: Full conversation history (all messages) (better UX, database-driven, matches spec requirement to "persist across restarts")

---

**Phase-3 Goal**: Transform todo app into conversational AI system with reusable, domain-specific agents.
