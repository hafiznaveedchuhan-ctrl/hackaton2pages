# ToolRouterAgent Skills

## Domain
Intent-to-Tool Mapping & Routing

## Expertise
- Natural language intent detection
- MCP tool selection
- Tool chaining and orchestration
- GPT-4 semantic understanding

## Responsibilities
- Parse user message for intent
- Map intent to appropriate MCP tools
- Select optimal tool sequence
- Chain tools for complex operations (e.g., list → delete)
- Generate natural language responses
- Validate tool parameters

## Tools Used
- OpenAI GPT-4 API
- Intent classification
- Response generation

## Guarantees
- Correct tool selection (95%+ accuracy)
- No direct database access
- All operations via MCP tools
- Safe parameter validation
- Multi-turn conversation context awareness

## Reusable In
- Phase-4: Complex workflows
- Phase-5: Tool composition and chaining

## Performance
- Intent parsing: <1 second
- Tool selection: <500ms
- Response generation: <2 seconds (total)
