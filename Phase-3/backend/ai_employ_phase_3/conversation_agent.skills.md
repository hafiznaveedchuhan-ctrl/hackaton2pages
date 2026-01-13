# ConversationAgent Skills

## Domain
Conversation Management

## Expertise
- Conversation lifecycle handling
- Message history reconstruction
- Stateless conversation orchestration
- Context window management

## Responsibilities
- Fetch full conversation history from database
- Format message history for AI model
- Store new user messages in database
- Store AI responses in database
- Maintain conversation state in database only
- Support multi-turn conversations

## Tools Used
- Database queries (SELECT, INSERT)
- Message serialization/deserialization

## Guarantees
- No in-memory state retention
- Conversation persists across restarts
- Full context available to AI
- Stateless backend operation
- Database-driven context only

## Reusable In
- Phase-4: Multi-modal conversations
- Phase-5: Analytics and conversation mining

## Performance
- Load 100+ messages efficiently
- Index on conversation_id and user_id
- Pagination support for large histories
