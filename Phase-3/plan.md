# Phase-3: Implementation Plan
## AI-Powered Todo Chatbot with Multi-Agent Architecture

---

## Phase 0: Research & Setup

### Research Tasks (COMPLETED in Clarification)

✅ **OpenAI GPT-4 via Agents SDK**
- Decision: Use OpenAI Agents SDK with GPT-4 model
- Rationale: Industry standard, proven NLP, full SDK support
- Integration: Python OpenAI client library

✅ **Official MCP Reference Implementation**
- Decision: Use official MCP SDK
- Rationale: Spec-aligned, tested, reduces implementation bugs
- Installation: `pip install mcp`

✅ **Full Conversation History**
- Decision: Store all messages, send complete context to AI
- Rationale: Better UX, database-driven, stateless backend
- Storage: Conversation + Message tables

### Setup Tasks

1. Create Phase-3 backend folder structure
2. Create Phase-3 frontend folder structure
3. Setup requirements.txt for backend dependencies
4. Setup package.json for frontend dependencies

---

## Phase 1: Design & Data Model

### Data Model (data-model.md)

**Entities:**

1. **Task** (inherited from Phase-2)
   - id, user_id, title, description, completed, created_at, updated_at

2. **Conversation** (NEW)
   - id: Integer (Primary Key)
   - user_id: Integer (Foreign Key → User)
   - created_at: DateTime
   - updated_at: DateTime
   - Relationships: 1 Conversation → Many Messages

3. **Message** (NEW)
   - id: Integer (Primary Key)
   - conversation_id: Integer (Foreign Key → Conversation)
   - user_id: Integer (Foreign Key → User)
   - role: Enum ('user' | 'assistant')
   - content: Text
   - created_at: DateTime
   - Relationships: Many → 1 Conversation

**Validation Rules:**
- Message.user_id MUST match Conversation.user_id
- Only users with valid JWT can create conversations
- Conversation.user_id cannot be changed after creation

---

### API Contracts (contracts/*)

**Endpoint: POST /api/{user_id}/chat**

```
Request:
{
  "conversation_id": integer (optional),
  "message": string (required, max 2000 chars)
}

Response (200):
{
  "conversation_id": integer,
  "message_id": integer,
  "response": string,
  "tool_calls": [string],
  "status": "success"
}

Response (400):
{
  "error": string,
  "status": "error"
}

Response (401):
{
  "error": "Unauthorized",
  "status": "error"
}

Response (403):
{
  "error": "Forbidden",
  "status": "error"
}
```

**Security:**
- Requires JWT token in Authorization header
- User ID in URL must match token user_id
- Returns 403 if user tries to access other user's conversation

---

### Agent Architecture

**5 Domain Agents:**

1. **AuthAgent** (Runs first)
   - Validates JWT token
   - Verifies user_id matches URL parameter
   - Enforces user isolation
   - Output: Authenticated user context

2. **ConversationAgent** (Runs second)
   - Fetches conversation history from database
   - Loads all prior messages for context
   - Stores new user message in database
   - Output: Full conversation context

3. **ToolRouterAgent** (Runs third)
   - Receives user message + full context
   - Parses intent using GPT-4
   - Selects appropriate MCP tools
   - Chains tools if needed (e.g., list → delete)
   - Output: Tool execution plan

4. **TaskManagerAgent** (Runs when ToolRouter selects task tools)
   - Executes tool calls via MCP server
   - Validates task ownership
   - Returns results to AI
   - Output: Task execution results

5. **ErrorHandlingAgent** (Runs on any exception)
   - Catches errors from any agent
   - Formats user-friendly error messages
   - Logs errors for debugging
   - Output: Recovery response

**Agent Execution Order:**
```
User Message
    ↓
AuthAgent (verify token)
    ↓
ConversationAgent (fetch context)
    ↓
ToolRouterAgent (parse intent → select tools)
    ↓
TaskManagerAgent (execute MCP tools)
    ↓
ConversationAgent (store response)
    ↓
Return Response
    ↓
On Error: ErrorHandlingAgent (handle gracefully)
```

---

### Skills Documentation (skills/*)

Each agent has a skills.md file:

**skills/auth_agent.skills.md**
```
# AuthAgent Skills

## Domain
Authentication & Authorization

## Expertise
- JWT token validation
- User identity verification
- User isolation enforcement

## Responsibilities
- Verify Bearer token on every request
- Extract user_id from token
- Enforce URL user_id matches token user_id
- Return 401 if invalid, 403 if mismatch

## Guarantees
- Zero cross-user data leakage
- All requests authenticated
- All requests authorized
```

**skills/conversation_agent.skills.md**
```
# ConversationAgent Skills

## Domain
Conversation Management

## Expertise
- Conversation lifecycle management
- Message history reconstruction
- Stateless context orchestration

## Responsibilities
- Fetch full conversation history from database
- Format history for AI model
- Store new user message in database
- Store AI response in database
- Maintain conversation state in database only

## Guarantees
- No in-memory state retention
- Conversation persists across restarts
- Full context available to AI
- Stateless backend operation
```

**skills/tool_router_agent.skills.md**
```
# ToolRouterAgent Skills

## Domain
Intent-to-Tool Mapping & Routing

## Expertise
- Natural language intent detection
- MCP tool selection
- Tool chaining and orchestration

## Responsibilities
- Parse user message for intent
- Map intent to MCP tools
- Select appropriate tool(s)
- Chain tools for complex operations
- Validate tool parameters

## Guarantees
- Correct tool selection
- No direct database access
- All operations via MCP tools
- Safe parameter validation
```

**skills/task_manager_agent.skills.md**
```
# TaskManagerAgent Skills

## Domain
Task CRUD Operations

## Expertise
- Task creation, reading, updating, deletion
- Task validation and ownership
- Status transition management

## Responsibilities
- Execute add_task MCP tool
- Execute list_tasks MCP tool
- Execute update_task MCP tool
- Execute delete_task MCP tool
- Execute complete_task MCP tool
- Validate task ownership before operations

## Guarantees
- Only authenticated user tasks modified
- Idempotent operations
- Clear confirmation messages
- Proper error handling
```

**skills/error_handling_agent.skills.md**
```
# ErrorHandlingAgent Skills

## Domain
Failure Management & Recovery

## Expertise
- Graceful error handling
- User-friendly error messaging
- Recovery strategy execution

## Responsibilities
- Catch exceptions from all agents
- Format errors for user readability
- Log errors for debugging
- Suggest recovery actions
- Prevent agent crashes

## Guarantees
- No unhandled exceptions
- Clear feedback to users
- Errors logged and traceable
- System remains stable
```

---

### MCP Tools Implementation

**MCP Server Tools (via Official MCP SDK):**

```python
@mcp_tool
def add_task(user_id: int, title: str, description: str = None) -> dict:
    """Create a new task"""
    # Validate user owns this operation
    # Create task in database
    # Return task_id, status, title

@mcp_tool
def list_tasks(user_id: int, status: str = "all") -> list:
    """List tasks by status (active, completed, all)"""
    # Validate user_id
    # Query tasks filtered by status
    # Return array of tasks

@mcp_tool
def update_task(user_id: int, task_id: int, title: str = None, description: str = None) -> dict:
    """Update task title/description"""
    # Validate user owns task
    # Update task in database
    # Return task_id, status

@mcp_tool
def delete_task(user_id: int, task_id: int) -> dict:
    """Delete a task"""
    # Validate user owns task
    # Delete task from database
    # Return task_id, status

@mcp_tool
def complete_task(user_id: int, task_id: int) -> dict:
    """Mark task as complete"""
    # Validate user owns task
    # Update task.completed = True
    # Return task_id, status
```

---

### Chat Endpoint Implementation

**FastAPI Route:**

```python
@app.post("/api/{user_id}/chat")
async def chat_endpoint(
    user_id: int,
    request: ChatRequest,
    token: str = Header(...)
):
    """
    Main chat endpoint for todo management.

    Flow:
    1. AuthAgent validates token
    2. ConversationAgent fetches context
    3. ToolRouterAgent selects tools
    4. TaskManagerAgent executes tools
    5. ConversationAgent stores response
    6. Return response to client
    """
    try:
        # 1. AuthAgent
        user = await auth_agent.validate_token(token, user_id)

        # 2. ConversationAgent
        conversation = await conversation_agent.get_or_create(user_id, request.conversation_id)
        history = await conversation_agent.fetch_history(conversation.id)

        # Store user message
        await conversation_agent.store_message(conversation.id, user_id, "user", request.message)

        # 3. ToolRouterAgent
        tools_plan = await tool_router_agent.parse_intent(request.message, history)

        # 4. TaskManagerAgent
        tool_results = await task_manager_agent.execute_tools(tools_plan, user_id)

        # 5. ConversationAgent
        ai_response = await tool_router_agent.generate_response(tool_results, history)
        await conversation_agent.store_message(conversation.id, user_id, "assistant", ai_response)

        return ChatResponse(
            conversation_id=conversation.id,
            response=ai_response,
            tool_calls=tools_plan,
            status="success"
        )

    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        # ErrorHandlingAgent
        error_response = await error_handling_agent.handle_error(e, user_id)
        return ChatResponse(
            conversation_id=None,
            response=error_response,
            tool_calls=[],
            status="error"
        )
```

---

## Phase 2: Implementation Tasks

### Backend Implementation

**Subtask 2.1: Setup Backend Structure**
- Create Phase-3/backend/ directory
- Create subdirectories: agents/, mcp/, models/, routes/, db/
- Create requirements.txt with dependencies:
  - fastapi
  - uvicorn
  - sqlmodel
  - openai
  - mcp
  - pydantic
  - python-dotenv
  - psycopg2-binary
  - alembic (migrations)

**Subtask 2.2: Database Models**
- Create models/conversation.py with Conversation SQLModel
- Create models/message.py with Message SQLModel
- Extend models/task.py if needed
- Run alembic migrations to create tables in Neon PostgreSQL

**Subtask 2.3: MCP Server Setup**
- Create mcp/server.py with Official MCP SDK
- Implement 5 MCP tools (add_task, list_tasks, update_task, delete_task, complete_task)
- Add tool validation and error handling
- Add logging for tool execution

**Subtask 2.4: Agent Implementation**
- Create agents/auth_agent.py
- Create agents/conversation_agent.py
- Create agents/tool_router_agent.py
- Create agents/task_manager_agent.py
- Create agents/error_handling_agent.py
- Each agent gets skills.md file

**Subtask 2.5: OpenAI Integration**
- Setup OpenAI client (GPT-4)
- Create agents/ai_engine.py for agent orchestration
- Implement intent parsing using GPT-4
- Implement response generation using GPT-4
- Add context window management

**Subtask 2.6: Chat Endpoint**
- Create routes/chat.py
- Implement POST /api/{user_id}/chat
- Wire up all 5 agents in correct order
- Add error handling and logging
- Add response validation

**Subtask 2.7: Backend Testing**
- Create tests/test_chat_endpoint.py
- Create tests/test_agents.py
- Create tests/test_mcp_tools.py
- Add integration tests

### Frontend Implementation

**Subtask 2.8: Setup Frontend Structure**
- Create Phase-3/frontend/ as new Next.js app
- Create components/Chat.tsx (chat UI)
- Create hooks/useChat.ts (chat API integration)
- Create lib/chat-client.ts (API client)

**Subtask 2.9: Chat UI Component**
- Build Chat.tsx with:
  - Message display area
  - Input field
  - Send button
  - Loading states
  - Error display
  - Conversation history

**Subtask 2.10: Chat Hook Implementation**
- Create useChat.ts hook:
  - sendMessage() function
  - Conversation state management
  - Error handling
  - Loading state management

**Subtask 2.11: Chat API Integration**
- Create chat-client.ts:
  - POST /api/{user_id}/chat
  - Bearer token handling
  - Error response parsing
  - Response validation

**Subtask 2.12: Dashboard Integration**
- Add Chat component to dashboard
- Add conversation history sidebar
- Add new conversation button
- Add delete conversation option

**Subtask 2.13: Frontend Testing**
- Create tests/Chat.test.tsx
- Create tests/useChat.test.ts
- Add integration tests

### Documentation

**Subtask 2.14: Agent Skills Documentation**
- Create agents/auth_agent.skills.md
- Create agents/conversation_agent.skills.md
- Create agents/tool_router_agent.skills.md
- Create agents/task_manager_agent.skills.md
- Create agents/error_handling_agent.skills.md

**Subtask 2.15: API Documentation**
- Create docs/API.md with all endpoints
- Create docs/AGENTS.md explaining agent architecture
- Create docs/MCP_TOOLS.md explaining MCP tools

**Subtask 2.16: Quickstart Guide**
- Create QUICKSTART.md for Phase-3
- Setup instructions
- Running instructions
- Testing instructions

---

## Success Criteria

✅ Users can send messages via chat
✅ AI understands natural language commands
✅ All 5 CRUD operations work through chat
✅ Conversation history persists across sessions
✅ Multi-user isolation guaranteed
✅ Full agent skills documentation complete
✅ MCP tools execute correctly
✅ Response time under 2 seconds
✅ Zero unhandled errors
✅ 100% of acceptance tests pass

---

## Dependencies & Prerequisites

**Backend:**
- Python 3.8+
- PostgreSQL/Neon
- OpenAI API key
- Official MCP SDK

**Frontend:**
- Node.js 18+
- Next.js 16+
- React 18+

**Phase-3 depends on:**
- Phase-2 complete (auth, database, API structure)
- OpenAI GPT-4 access
- MCP protocol understanding

---

## Reusability for Future Phases

Each agent is designed to be reused in Phase-4 and Phase-5:

- **AuthAgent** → Microservices auth in Phase-4
- **ConversationAgent** → Multi-modal in Phase-5
- **ToolRouterAgent** → Complex workflows in Phase-4/5
- **TaskManagerAgent** → Event-driven in Phase-5
- **ErrorHandlingAgent** → Distributed resilience in Phase-4/5

---

**Plan Status**: ✅ READY FOR IMPLEMENTATION

Next: `/sp.tasks` to generate task list
