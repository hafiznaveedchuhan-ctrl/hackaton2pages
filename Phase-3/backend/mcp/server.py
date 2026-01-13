"""
MCP Server Implementation

Official MCP Reference Implementation for Phase-3.
Exposes 5 MCP tools for task management.

@specs/phase-3-overview.md - MCP Tools Specification
"""

import logging
from typing import Any, Callable, Dict, List
import json

logger = logging.getLogger(__name__)


class MCPServer:
    """
    MCP Server for exposing tools to AI agents.

    Provides 5 tools:
    - add_task
    - list_tasks
    - update_task
    - delete_task
    - complete_task
    """

    def __init__(self):
        self.tools: Dict[str, Callable] = {}
        self.logger = logger

    def register_tool(self, name: str, tool_func: Callable) -> None:
        """Register a tool with the MCP server"""
        self.tools[name] = tool_func
        self.logger.info(f"Registered MCP tool: {name}")

    def list_tools(self) -> List[Dict[str, Any]]:
        """List all available tools"""
        return [
            {
                "name": name,
                "description": tool_func.__doc__ or "No description"
            }
            for name, tool_func in self.tools.items()
        ]

    async def execute_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool with given parameters"""
        if tool_name not in self.tools:
            raise ValueError(f"Tool {tool_name} not found")

        tool_func = self.tools[tool_name]
        try:
            result = await tool_func(**params)
            return {
                "status": "success",
                "result": result
            }
        except Exception as e:
            self.logger.error(f"Tool {tool_name} failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }

    def __repr__(self) -> str:
        return f"<MCPServer with {len(self.tools)} tools>"


# Global MCP server instance
mcp_server = MCPServer()
