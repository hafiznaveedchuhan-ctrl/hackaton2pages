"""
AuthAgent - Authentication & Authorization

Domain: Authentication & Authorization
Responsibility: Validate JWT tokens, enforce user isolation
Skills: Token verification, user boundary enforcement

@specs/phase-3-overview.md - AuthAgent
"""

import logging
import jwt
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-min-32-chars")
JWT_ALGORITHM = "HS256"


class AuthAgent:
    """
    Validates JWT tokens and enforces user isolation.
    First agent in pipeline - validates every request.
    """

    @staticmethod
    def validate_token(token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token and extract user info"""
        try:
            # Allow demo tokens for development
            if token.startswith("demo-"):
                # Demo token format: demo-{user_id}
                try:
                    user_id = int(token.split("-")[1])
                    return {"user_id": user_id, "token": {"sub": str(user_id)}}
                except (IndexError, ValueError):
                    pass

            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                logger.warning("Token missing user ID (sub)")
                return None
            return {"user_id": int(user_id), "token": payload}
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            return None

    @staticmethod
    def verify_user_ownership(user_id: int, requested_user_id: int) -> bool:
        """Verify user is accessing their own resources"""
        if user_id != requested_user_id:
            logger.warning(f"User {user_id} attempted access to user {requested_user_id} resources")
            return False
        return True

    @staticmethod
    def create_token(user_id: int, expires_in_days: int = 7) -> str:
        """Create JWT token for user"""
        expires = datetime.utcnow() + timedelta(days=expires_in_days)
        payload = {
            "sub": str(user_id),
            "exp": expires,
            "iat": datetime.utcnow()
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token
