# Phase-3 Chat API Documentation

AI-Powered Todo Chatbot API with Multi-Agent Architecture

**Base URL:** `http://localhost:8000`

---

## Overview

The Phase-3 API provides a conversational interface for todo management. Users interact through natural language, and the system orchestrates a multi-agent pipeline to execute tasks.

### Architecture

```
Client → Authentication → Conversation Management → Intent Parsing → Tool Selection → Execution → Response
```

**Agents involved:**
1. AuthAgent: Token validation and user isolation
2. ConversationAgent: Conversation lifecycle management
3. ToolRouterAgent: Natural language understanding
4. TaskManagerAgent: Tool execution
5. ErrorHandlingAgent: Exception handling

---

## Authentication

### Bearer Token

All endpoints require Bearer token authentication via `Authorization` header.

```
Authorization: Bearer {JWT_TOKEN}
```

**Token Format:**
- Algorithm: HS256
- Payload: `{user_id, exp}`
- Expiry: 7 days from creation

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." http://localhost:8000/api/1/chat
```

---

## Endpoints

### Health Check

Check API health status.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy"
}
```

**Status:** 200

---

### Chat Endpoint

Send a message to the todo chatbot and receive AI-powered response.

**Request:**
```http
POST /api/{user_id}/chat
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Path Parameters:**
- `user_id` (integer): User ID - must match token user_id

**Request Body:**
```json
{
  "conversation_id": null,
  "message": "Add task: Buy groceries"
}
```

**Parameters:**
- `conversation_id` (integer, optional): Existing conversation ID. If null, creates new conversation
- `message` (string, required): User message (1-2000 characters)

**Response:**
```json
{
  "conversation_id": 1,
  "response": "Task 'Buy groceries' has been added to your todo list.",
  "tool_calls": ["add_task"],
  "status": "success"
}
```

**Response Fields:**
- `conversation_id` (integer): Conversation ID for this chat session
- `response` (string): AI-generated natural language response
- `tool_calls` (array): List of tools executed
- `status` (string): "success" or "error"

**Status Codes:**
- 200: Success
- 400: Invalid request (missing/invalid parameters)
- 401: Unauthorized (invalid token)
- 403: Forbidden (user_id doesn't match token)
- 500: Server error

---

## Agent Pipeline

When a message is received, the following pipeline executes:

### 1. Authentication (AuthAgent)
- Validates Bearer token format
- Decodes JWT and extracts user_id
- Verifies token hasn't expired
- Ensures user_id matches request user_id

**Errors:**
- `401: Invalid token format` - Missing "Bearer " prefix
- `401: Invalid token` - Token decode failed
- `403: Forbidden` - user_id mismatch

### 2. Conversation Management (ConversationAgent)

#### Get or Create Conversation
- If conversation_id provided: retrieves existing conversation
- If conversation_id null: creates new conversation
- Verifies conversation belongs to authenticated user

#### Fetch Message History
- Retrieves last 20 messages from conversation
- Used for AI context window

#### Store User Message
- Persists user message to database
- Records timestamp

### 3. Intent Parsing (ToolRouterAgent)

Analyzes user message to identify intent using GPT-4:

**Supported Intents:**
- `add_task`: Create new task
- `list_tasks`: Retrieve all tasks
- `update_task`: Modify existing task
- `complete_task`: Mark task as complete
- `delete_task`: Remove task

**Example:**
```
User: "Add task: Buy groceries"
→ Intent: add_task
→ Params: {title: "Buy groceries"}
```

### 4. Tool Selection (ToolRouterAgent)

Based on parsed intent, selects appropriate MCP tools:

```python
tools = [
    {
        "tool": "add_task",
        "params": {
            "title": "Buy groceries",
            "description": ""
        }
    }
]
```

### 5. Tool Execution (TaskManagerAgent)

Executes selected tools via MCP:

- Validates user ownership of tasks
- Executes tool with provided parameters
- Collects results
- Handles errors per tool

### 6. Response Generation (ToolRouterAgent)

Generates natural language response based on:
- Original user message
- Tool execution results
- Conversation history

### 7. Store Response (ConversationAgent)

Persists assistant message to database for future context.

---

## Supported Intents & Tools

### Add Task

**User Input:**
```
"Add task: Buy groceries"
"Create a task for shopping"
"I need to remember to call the doctor"
```

**Tool Execution:**
```
Tool: add_task
Params: {title: "Buy groceries", description: ""}
```

**Response:**
```
"Task 'Buy groceries' has been added."
```

---

### List Tasks

**User Input:**
```
"Show my tasks"
"What are my pending tasks?"
"List all todos"
```

**Tool Execution:**
```
Tool: list_tasks
Params: {status: null}
```

**Response:**
```
"You have 5 tasks: 1. Buy groceries, 2. Call doctor, ..."
```

---

### Complete Task

**User Input:**
```
"Mark task 1 complete"
"I finished buying groceries"
"Complete task #2"
```

**Tool Execution:**
```
Tool: complete_task
Params: {task_id: 1}
```

**Response:**
```
"Task 'Buy groceries' marked as complete."
```

---

### Update Task

**User Input:**
```
"Update task 1 to buy more groceries"
"Change task 2 description"
```

**Tool Execution:**
```
Tool: update_task
Params: {task_id: 1, title: "Buy more groceries"}
```

**Response:**
```
"Task updated successfully."
```

---

### Delete Task

**User Input:**
```
"Delete task 1"
"Remove that task"
"I don't need that todo anymore"
```

**Tool Execution:**
```
Tool: delete_task
Params: {task_id: 1}
```

**Response:**
```
"Task 'Buy groceries' has been deleted."
```

---

## Error Handling

### Error Response Format

```json
{
  "detail": "User-friendly error message"
}
```

### Error Types

#### Authentication Errors

**401 - Invalid Token**
```json
{
  "detail": "Invalid token"
}
```

**401 - Invalid Token Format**
```json
{
  "detail": "Invalid token format"
}
```

#### Authorization Errors

**403 - Forbidden**
```json
{
  "detail": "Forbidden"
}
```

#### Validation Errors

**400 - Invalid Request**
```json
{
  "detail": "request body must include 'message'"
}
```

#### Server Errors

**500 - Server Error**
```json
{
  "detail": "An unexpected error occurred. Please try again."
}
```

### Recovery Strategies

**Authentication Error:**
- Get new token from authentication service
- Retry request with new token

**Intent Parsing Error:**
- Clarify request with user
- Provide example commands

**Tool Execution Error:**
- Validate task ownership
- Check task exists
- Retry operation

**Database Error:**
- Check database connectivity
- Retry with exponential backoff
- Escalate if persistent

---

## Data Models

### Message

```json
{
  "id": 1,
  "conversation_id": 1,
  "user_id": 1,
  "role": "user",
  "content": "Add task: Buy groceries",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Fields:**
- `id` (integer): Message ID
- `conversation_id` (integer): Parent conversation
- `user_id` (integer): Message author
- `role` (string): "user" or "assistant"
- `content` (string): Message text (1-4000 chars)
- `created_at` (datetime): Creation timestamp

### Conversation

```json
{
  "id": 1,
  "user_id": 1,
  "created_at": "2024-01-15T10:25:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Fields:**
- `id` (integer): Conversation ID
- `user_id` (integer): Conversation owner
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last activity timestamp

---

## Rate Limiting

Currently no rate limiting. Recommended limits for production:
- 100 messages per minute per user
- 1000 messages per hour per user

---

## Pagination

Not implemented yet. Consider for Phase-4:
- Conversation history pagination
- Message list pagination
- Task list pagination

---

## WebSocket Support

Not implemented yet. Recommended for Phase-5:
- Real-time message streaming
- Live typing indicators
- Presence awareness

---

## Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### Send Message
```bash
curl -X POST http://localhost:8000/api/1/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": null,
    "message": "Add task: Buy groceries"
  }'
```

### Run Tests
```bash
pytest tests/ -v --cov
```

---

## Performance

### Typical Response Times
- Authentication: 5ms
- Conversation lookup: 10ms
- Intent parsing (GPT-4): 500-1000ms
- Tool execution: 50-200ms
- Response generation: 200-500ms
- **Total: 800-1700ms**

### Optimization Tips
- Reuse conversation IDs to avoid lookup overhead
- Cache frequently used task lists
- Use connection pooling for database

---

## Security Considerations

### Data Privacy
- All user data isolated by user_id
- Tokens expire after 7 days
- No data persistence across conversations (except explicit storage)

### Validation
- User ownership verified for all operations
- Input validation on message length (1-2000 chars)
- SQL injection prevention via SQLModel/SQLAlchemy

### CORS
- Configured for `http://localhost:3000` and `http://localhost:8000`
- Restrict in production

---

## Deployment

### Environment Variables

```
DATABASE_URL=postgresql://user:pass@localhost/phase3
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key-min-32-chars
NEXT_PUBLIC_API_URL=http://localhost:8000
MCP_ENABLED=true
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Docker
```bash
docker-compose up
```

### Kubernetes
```bash
kubectl apply -f k8s/deployment.yaml
```

---

## Changelog

### v1.0.0 (Phase-3 Release)
- Initial chat API implementation
- 5 domain agents
- 5 MCP tools
- Full message history
- Error handling
- JWT authentication

---

## Support

For issues, questions, or suggestions:
- GitHub Issues: https://github.com/NAVEED261/GIAIC-HACKATON-2
- Email: support@example.com
- Documentation: See specs/ directory

---

**Last Updated:** 2024-01-15
**Status:** Phase-3 Release Candidate
