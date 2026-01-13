# MCP Tools Documentation

Model Context Protocol Tools for Todo Management

**Version:** 1.0.0
**Status:** Phase-3 Release

---

## Overview

MCP Tools provide a standardized interface for agent-to-database interaction. All tool execution is:
- **Asynchronous:** Non-blocking operations
- **User-Isolated:** User ID validation on every call
- **Ownership-Validated:** Users can only access their resources
- **Error-Safe:** Comprehensive exception handling
- **Auditable:** Full logging for debugging

---

## Architecture

```
Agent → MCP Server → Tool Registry → Database
                           ↓
                    Input Validation
                    User ID Check
                    Ownership Verification
                    Database Operation
                    Error Handling
```

**MCP Server:** Located in `backend/mcp/server.py`
**Tools:** Located in `backend/mcp/tools.py`
**Registration:** Automatic on server initialization

---

## Tools

### 1. add_task

Create a new task for the user.

**Signature:**
```python
async def add_task(
    session: Session,
    user_id: int,
    title: str,
    description: str = ""
) -> Dict[str, Any]
```

**Parameters:**
- `session` (Session): Database session
- `user_id` (int): Owner user ID
- `title` (str): Task title (1-255 characters, required)
- `description` (str): Task description (0-2000 characters, optional)

**Returns:**
```python
{
    "task_id": 1,
    "user_id": 1,
    "title": "Buy groceries",
    "description": "Milk, bread, eggs",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `ValueError`: Missing title or invalid user_id
- `DatabaseError`: Database connection failure
- `IntegrityError`: Duplicate or constraint violation

**Examples:**

Simple task:
```python
result = await add_task(session, user_id=1, title="Buy groceries")
# Returns: {task_id: 1, title: "Buy groceries", status: "pending", ...}
```

Task with description:
```python
result = await add_task(
    session,
    user_id=1,
    title="Project Review",
    description="Review Q1 project deliverables with team"
)
```

**Use Cases:**
- User says: "Add task: Buy groceries"
- User says: "Remember to call the doctor"
- User says: "Create a task for the meeting tomorrow"

---

### 2. list_tasks

Retrieve all tasks for the user with optional filtering.

**Signature:**
```python
async def list_tasks(
    session: Session,
    user_id: int,
    status: str = None
) -> List[Dict[str, Any]]
```

**Parameters:**
- `session` (Session): Database session
- `user_id` (int): User ID
- `status` (str, optional): Filter by status - "pending", "completed", or None for all

**Returns:**
```python
[
    {
        "task_id": 1,
        "user_id": 1,
        "title": "Buy groceries",
        "description": "Milk, bread, eggs",
        "status": "pending",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    },
    {
        "task_id": 2,
        "user_id": 1,
        "title": "Call doctor",
        "description": "",
        "status": "completed",
        "created_at": "2024-01-14T15:00:00Z",
        "updated_at": "2024-01-15T09:00:00Z"
    }
]
```

**Errors:**
- `ValueError`: Invalid user_id or status
- `DatabaseError`: Database connection failure

**Examples:**

All tasks:
```python
tasks = await list_tasks(session, user_id=1)
# Returns list of all user's tasks
```

Pending tasks only:
```python
tasks = await list_tasks(session, user_id=1, status="pending")
# Returns only pending tasks
```

Completed tasks:
```python
tasks = await list_tasks(session, user_id=1, status="completed")
# Returns only completed tasks
```

**Use Cases:**
- User says: "Show my tasks"
- User says: "What are my pending todos?"
- User says: "List completed tasks"
- User says: "Show everything I need to do"

---

### 3. update_task

Modify an existing task's properties.

**Signature:**
```python
async def update_task(
    session: Session,
    user_id: int,
    task_id: int,
    title: str = None,
    description: str = None
) -> Dict[str, Any]
```

**Parameters:**
- `session` (Session): Database session
- `user_id` (int): Owner user ID (must match task owner)
- `task_id` (int): Task ID to update
- `title` (str, optional): New title
- `description` (str, optional): New description

**Returns:**
```python
{
    "task_id": 1,
    "user_id": 1,
    "title": "Buy groceries and cook dinner",
    "description": "Updated description",
    "status": "pending",
    "updated_at": "2024-01-15T10:35:00Z"
}
```

**Errors:**
- `ValueError`: Invalid user_id or task_id
- `PermissionError`: Task doesn't belong to user (ownership violation)
- `NotFoundError`: Task doesn't exist
- `DatabaseError`: Database connection failure

**Examples:**

Update title:
```python
result = await update_task(
    session,
    user_id=1,
    task_id=1,
    title="Buy groceries and cook dinner"
)
```

Update description:
```python
result = await update_task(
    session,
    user_id=1,
    task_id=1,
    description="Milk, bread, eggs, chicken, rice"
)
```

Update both:
```python
result = await update_task(
    session,
    user_id=1,
    task_id=1,
    title="Shopping list",
    description="Complete shopping for the week"
)
```

**Use Cases:**
- User says: "Update task 1 to buy milk also"
- User says: "Change task 2 description"
- User says: "Rename task 3 to something else"
- User says: "Edit my first task"

---

### 4. complete_task

Mark a task as complete.

**Signature:**
```python
async def complete_task(
    session: Session,
    user_id: int,
    task_id: int
) -> Dict[str, Any]
```

**Parameters:**
- `session` (Session): Database session
- `user_id` (int): Owner user ID (must match task owner)
- `task_id` (int): Task ID to mark complete

**Returns:**
```python
{
    "task_id": 1,
    "user_id": 1,
    "title": "Buy groceries",
    "status": "completed",
    "updated_at": "2024-01-15T10:40:00Z"
}
```

**Errors:**
- `ValueError`: Invalid user_id or task_id
- `PermissionError`: Task doesn't belong to user (ownership violation)
- `NotFoundError`: Task doesn't exist
- `DatabaseError`: Database connection failure

**Examples:**

Mark single task complete:
```python
result = await complete_task(session, user_id=1, task_id=1)
# Returns: {task_id: 1, status: "completed", ...}
```

**Use Cases:**
- User says: "Mark task 1 complete"
- User says: "I finished buying groceries"
- User says: "Complete task #2"
- User says: "Done with that task"
- User says: "Check off the first item"

---

### 5. delete_task

Remove a task from the system.

**Signature:**
```python
async def delete_task(
    session: Session,
    user_id: int,
    task_id: int
) -> Dict[str, Any]
```

**Parameters:**
- `session` (Session): Database session
- `user_id` (int): Owner user ID (must match task owner)
- `task_id` (int): Task ID to delete

**Returns:**
```python
{
    "task_id": 1,
    "status": "deleted",
    "message": "Task deleted successfully"
}
```

**Errors:**
- `ValueError`: Invalid user_id or task_id
- `PermissionError`: Task doesn't belong to user (ownership violation)
- `NotFoundError`: Task doesn't exist
- `DatabaseError`: Database connection failure

**Examples:**

Delete task:
```python
result = await delete_task(session, user_id=1, task_id=1)
# Returns: {task_id: 1, status: "deleted", ...}
```

**Use Cases:**
- User says: "Delete task 1"
- User says: "Remove that task"
- User says: "I don't need that todo anymore"
- User says: "Get rid of the first task"

---

## Tool Composition

Tools can be combined for complex operations:

### Example: Clear Pending Tasks

```python
# 1. List pending tasks
pending = await list_tasks(session, user_id=1, status="pending")

# 2. For each pending task that matches criteria, mark complete
for task in pending:
    if should_complete(task):
        await complete_task(session, user_id=1, task_id=task['task_id'])
```

### Example: Task Modification Workflow

```python
# 1. List tasks to find one
tasks = await list_tasks(session, user_id=1)
target_task = tasks[0]

# 2. Update its properties
updated = await update_task(
    session,
    user_id=1,
    task_id=target_task['task_id'],
    title="New title"
)

# 3. Later mark as complete
await complete_task(session, user_id=1, task_id=target_task['task_id'])
```

---

## Error Handling

### Error Classification

```python
class ErrorType(Enum):
    VALIDATION_ERROR = "validation_error"       # Invalid input
    PERMISSION_ERROR = "permission_error"       # Ownership violation
    NOT_FOUND = "not_found"                     # Resource doesn't exist
    DATABASE_ERROR = "database_error"           # DB connection/query failure
    UNKNOWN = "unknown"                         # Unexpected error
```

### Error Recovery

**Validation Error:**
```python
try:
    await add_task(session, user_id=1, title="")  # Empty title
except ValueError as e:
    # Recovery: Validate input before calling tool
    print(f"Invalid input: {e}")
```

**Permission Error:**
```python
try:
    await complete_task(session, user_id=2, task_id=1)  # Different user
except PermissionError as e:
    # Recovery: Verify user ownership first
    print(f"Not authorized: {e}")
```

**Not Found:**
```python
try:
    await complete_task(session, user_id=1, task_id=999)  # Doesn't exist
except NotFoundError as e:
    # Recovery: List tasks to find valid ID
    print(f"Task not found: {e}")
```

**Database Error:**
```python
try:
    await list_tasks(session, user_id=1)
except DatabaseError as e:
    # Recovery: Retry with exponential backoff
    print(f"Database error: {e}, retrying...")
```

---

## Performance Characteristics

### Latencies (typical)
- `add_task`: 10-50ms
- `list_tasks`: 20-100ms (depends on task count)
- `update_task`: 10-50ms
- `complete_task`: 10-50ms
- `delete_task`: 10-50ms

### Database Queries
- `add_task`: 1 INSERT
- `list_tasks`: 1 SELECT
- `update_task`: 1 SELECT + 1 UPDATE
- `complete_task`: 1 SELECT + 1 UPDATE
- `delete_task`: 1 SELECT + 1 DELETE

### Scalability
- **Small dataset** (< 1000 tasks): < 50ms
- **Medium dataset** (1000-10000 tasks): 50-200ms
- **Large dataset** (> 10000 tasks): Requires indexing

---

## Security

### User Isolation

All tools validate `user_id` on every call:
```python
# Ensures user can only access their own tasks
if task.user_id != user_id:
    raise PermissionError("Unauthorized")
```

### Input Validation

```python
# Title: 1-255 characters
if not title or len(title) > 255:
    raise ValueError("Invalid title length")

# Description: 0-2000 characters
if len(description) > 2000:
    raise ValueError("Invalid description length")
```

### SQL Injection Prevention

All queries use parameterized statements via SQLModel:
```python
# Safe: Parameters bound at execution time
query = select(Task).where(Task.id == task_id)
```

---

## Testing

### Unit Tests

```python
# Test task creation
def test_add_task():
    result = await add_task(session, user_id=1, title="Test")
    assert result['task_id'] is not None
    assert result['title'] == "Test"
```

### Integration Tests

```python
# Test tool composition
def test_workflow():
    # Add task
    created = await add_task(session, user_id=1, title="Test")

    # Update task
    updated = await update_task(
        session, user_id=1, task_id=created['task_id'],
        title="Updated"
    )

    # Complete task
    completed = await complete_task(session, user_id=1, task_id=created['task_id'])
    assert completed['status'] == 'completed'
```

Run tests:
```bash
pytest backend/tests/test_mcp_tools.py -v
```

---

## Monitoring

### Logging

All tool operations are logged:
```
[INFO] tool_call: add_task, user_id=1, params={title: "Test"}
[INFO] tool_result: add_task, user_id=1, task_id=1, status=success
[ERROR] tool_error: delete_task, user_id=1, task_id=999, error=NotFound
```

### Metrics

Recommended metrics to track:
- Tool execution time (ms)
- Error rate by tool
- User isolation violations (should be 0)
- Database connection errors

---

## Future Enhancements

### Phase-4 Improvements
- Batch operations (add multiple tasks)
- Advanced filtering (by date range, tags)
- Task priorities and due dates
- Subtasks support

### Phase-5 Features
- Real-time updates via WebSocket
- Task collaboration and sharing
- Recurring tasks
- Task templates and automation

---

## API Reference

### Tool Registration

```python
from mcp import MCPServer, register_tools

server = MCPServer()
register_tools(server)  # Registers all 5 tools

# Access tools
tools = server.list_tools()
# Returns: ["add_task", "list_tasks", "update_task", "complete_task", "delete_task"]
```

### Executing Tools

```python
result = await server.execute_tool(
    "add_task",
    {
        "session": session,
        "user_id": 1,
        "title": "Buy groceries",
        "description": ""
    }
)
```

---

## Troubleshooting

### Task Not Found

**Issue:** `NotFoundError: Task not found`

**Solutions:**
1. Verify task ID is correct
2. List tasks to see available IDs
3. Check if task was deleted by another session

### Permission Denied

**Issue:** `PermissionError: Unauthorized`

**Solutions:**
1. Verify user_id matches authenticated user
2. Check task owner in database
3. Ensure user is logged in

### Database Connection Failed

**Issue:** `DatabaseError: Connection refused`

**Solutions:**
1. Check DATABASE_URL is set correctly
2. Verify database server is running
3. Check database credentials
4. Review logs for connection details

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Maintained By:** Phase-3 Team
