"""
ErrorHandlingAgent - Failure Management & Recovery

Domain: Failure Management
Responsibility: Graceful error handling, user-friendly messaging
Skills: Exception handling, recovery strategies, clear feedback

@specs/phase-3-overview.md - ErrorHandlingAgent
"""

import logging
import traceback
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class ErrorType(str, Enum):
    """Error classifications"""
    AUTHENTICATION = "authentication_error"
    AUTHORIZATION = "authorization_error"
    NOT_FOUND = "not_found"
    INVALID_INPUT = "invalid_input"
    DATABASE_ERROR = "database_error"
    AI_ERROR = "ai_error"
    UNKNOWN = "unknown_error"


class ErrorHandlingAgent:
    """
    Handles exceptions and provides recovery strategies.
    Ensures no unhandled errors escape to user.
    """

    ERROR_MESSAGES = {
        ErrorType.AUTHENTICATION: "Please log in to continue.",
        ErrorType.AUTHORIZATION: "You don't have permission to perform this action.",
        ErrorType.NOT_FOUND: "The requested resource was not found.",
        ErrorType.INVALID_INPUT: "Please check your input and try again.",
        ErrorType.DATABASE_ERROR: "A database error occurred. Please try again later.",
        ErrorType.AI_ERROR: "AI processing failed. Please try again.",
        ErrorType.UNKNOWN: "An unexpected error occurred. Please try again.",
    }

    @staticmethod
    def classify_error(exception: Exception) -> ErrorType:
        """Classify error type for handling"""
        error_str = str(exception).lower()

        if "unauthorized" in error_str or "invalid token" in error_str:
            return ErrorType.AUTHENTICATION
        elif "forbidden" in error_str or "unauthorized access" in error_str:
            return ErrorType.AUTHORIZATION
        elif "not found" in error_str:
            return ErrorType.NOT_FOUND
        elif "invalid" in error_str or "validation" in error_str:
            return ErrorType.INVALID_INPUT
        elif "database" in error_str or "sqlalchemy" in error_str:
            return ErrorType.DATABASE_ERROR
        elif "openai" in error_str or "gpt" in error_str:
            return ErrorType.AI_ERROR
        else:
            return ErrorType.UNKNOWN

    @staticmethod
    def handle_error(exception: Exception) -> Dict[str, Any]:
        """Handle exception and return user-friendly response"""
        error_type = ErrorHandlingAgent.classify_error(exception)

        # Log full exception for debugging
        logger.error(
            f"Exception: {error_type}\n{traceback.format_exc()}"
        )

        return {
            "status": "error",
            "error_type": error_type,
            "message": ErrorHandlingAgent.ERROR_MESSAGES.get(
                error_type,
                ErrorHandlingAgent.ERROR_MESSAGES[ErrorType.UNKNOWN]
            ),
            "details": str(exception) if error_type != ErrorType.UNKNOWN else None
        }

    @staticmethod
    def recovery_strategy(error_type: ErrorType) -> str:
        """Suggest recovery action"""
        strategies = {
            ErrorType.AUTHENTICATION: "Try logging in again.",
            ErrorType.AUTHORIZATION: "Contact support if you believe you should have access.",
            ErrorType.NOT_FOUND: "Verify the resource exists and try again.",
            ErrorType.INVALID_INPUT: "Review the input format and constraints.",
            ErrorType.DATABASE_ERROR: "Wait a moment and try again.",
            ErrorType.AI_ERROR: "Try rephrasing your request.",
            ErrorType.UNKNOWN: "Contact support if the problem persists.",
        }
        return strategies.get(error_type, "Try again.")

    @staticmethod
    async def safe_execute(async_func, *args, **kwargs) -> Dict[str, Any]:
        """Execute function with error handling"""
        try:
            result = await async_func(*args, **kwargs)
            return {"status": "success", "result": result}
        except Exception as e:
            return ErrorHandlingAgent.handle_error(e)
