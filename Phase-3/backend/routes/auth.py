"""
Authentication Routes

Handles user signup, signin, and logout.

Implements @specs/phase-3-overview.md - Authentication Flow

@author: Phase-3 System
@created: 2025-12-18
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import Session, select
from models.user import User, UserCreate, UserRead, UserLogin
from db import get_session
from ai_employ_phase_3.auth_agent import AuthAgent
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Get JWT secret from environment (used by AuthAgent.create_token)
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")


def get_token_from_header(authorization: str = Header(...)) -> str:
    """Extract JWT token from Authorization header"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    return authorization[7:]  # Remove "Bearer " prefix


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    """
    Register a new user

    - **name**: User's display name
    - **email**: User's email (must be unique)
    - **password**: User's password (min 8 chars)

    Returns the created user (without password)
    """
    # Validate input
    if not user_data.email or not user_data.name or not user_data.password:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Create new user with hashed password
    hashed_password = User.hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password
    )

    try:
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return new_user
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Failed to create user")


@router.post("/signin")
def signin(credentials: UserLogin, session: Session = Depends(get_session)):
    """
    Authenticate user and return JWT token

    - **email**: User's email
    - **password**: User's password

    Returns JWT token and user info
    """
    if not credentials.email or not credentials.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password required"
        )

    # Find user by email
    user = session.exec(select(User).where(User.email == credentials.email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Verify password
    if not user.verify_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Generate JWT token
    token = AuthAgent.create_token(user_id=user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "name": user.name
    }


@router.post("/logout")
async def logout():
    """
    Logout endpoint

    This is a stateless logout - the client should clear the JWT token from localStorage.
    """
    return {"message": "Logged out successfully. Please clear your token."}


@router.get("/me", response_model=UserRead)
def get_current_user(
    token: str = Depends(get_token_from_header),
    session: Session = Depends(get_session)
):
    """
    Get current authenticated user info

    Requires valid JWT token in Authorization header
    """
    # Validate token and get user_id
    auth_result = AuthAgent.validate_token(token)
    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user_id = auth_result.get("user_id")

    # Fetch user from database
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user
