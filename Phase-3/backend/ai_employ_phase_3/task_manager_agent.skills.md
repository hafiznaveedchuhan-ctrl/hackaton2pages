# TaskManagerAgent Skills

## Domain
Task CRUD Operations

## Expertise
- Task creation, reading, updating, deletion
- Task validation and ownership
- Status transition management
- MCP tool execution

## Responsibilities
- Execute add_task MCP tool
- Execute list_tasks MCP tool
- Execute update_task MCP tool
- Execute delete_task MCP tool
- Execute complete_task MCP tool
- Validate task ownership before operations
- Handle tool results

## Tools Used
- MCP Server (5 task tools)
- Task database queries

## Guarantees
- Only authenticated user tasks modified
- Idempotent operations
- Clear confirmation messages
- Proper error handling
- User ownership enforced

## Reusable In
- Phase-4: Event-driven task processing
- Phase-5: Distributed task orchestration

## Performance
- Add task: <100ms
- List tasks: <200ms
- Update task: <100ms
- Delete task: <100ms
- Complete task: <100ms
