#!/usr/bin/env python3
"""
FastAPI App Scaffolder
Creates a production-ready FastAPI project structure
"""

import os
import sys
from pathlib import Path

def create_directory_structure(base_path: str):
    """Create the basic directory structure."""
    dirs = [
        "app/api/endpoints",
        "app/core",
        "app/models",
        "app/schemas",
        "tests",
    ]

    base = Path(base_path)
    base.mkdir(exist_ok=True)

    for directory in dirs:
        (base / directory).mkdir(parents=True, exist_ok=True)
        # Create __init__.py files
        (base / directory / "__init__.py").touch()

    print(f"✓ Directory structure created at {base_path}")


def create_main_file(base_path: str):
    """Create main.py entry point."""
    main_content = '''"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="API for your application",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Include routers here
# from app.api.endpoints import users
# app.include_router(users.router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
'''

    with open(Path(base_path) / "main.py", "w") as f:
        f.write(main_content)
    print("✓ main.py created")


def create_config_file(base_path: str):
    """Create configuration file."""
    config_content = '''"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings."""

    # App settings
    APP_NAME: str = "FastAPI App"
    DEBUG: bool = False
    VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = "sqlite:///./test.db"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:8000"]

    # API
    API_V1_STR: str = "/api/v1"

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get settings instance."""
    return Settings()
'''

    with open(Path(base_path) / "app/core/config.py", "w") as f:
        f.write(config_content)
    print("✓ config.py created")


def create_security_file(base_path: str):
    """Create security utilities."""
    security_content = '''"""
Security utilities for authentication and authorization
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SecurityConfig:
    SECRET_KEY = "your-secret-key-change-in-production"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    """Hash password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=SecurityConfig.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        SecurityConfig.SECRET_KEY,
        algorithm=SecurityConfig.ALGORITHM
    )
    return encoded_jwt
'''

    with open(Path(base_path) / "app/core/security.py", "w") as f:
        f.write(security_content)
    print("✓ security.py created")


def create_example_endpoint(base_path: str):
    """Create example endpoint."""
    endpoint_content = '''"""
Example endpoints
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(
    prefix="/items",
    tags=["items"]
)

class Item(BaseModel):
    id: int
    name: str
    description: str = None

# Example data
items_db = []

@router.get("/", response_model=list)
async def list_items():
    """Get all items."""
    return items_db

@router.get("/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get item by ID."""
    for item in items_db:
        if item["id"] == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(item: Item):
    """Create new item."""
    items_db.append(item.dict())
    return item

@router.put("/{item_id}", response_model=Item)
async def update_item(item_id: int, item: Item):
    """Update item."""
    for i, existing_item in enumerate(items_db):
        if existing_item["id"] == item_id:
            items_db[i] = item.dict()
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int):
    """Delete item."""
    for i, item in enumerate(items_db):
        if item["id"] == item_id:
            del items_db[i]
            return
    raise HTTPException(status_code=404, detail="Item not found")
'''

    with open(Path(base_path) / "app/api/endpoints/items.py", "w") as f:
        f.write(endpoint_content)
    print("✓ example endpoint created")


def create_env_file(base_path: str):
    """Create .env template."""
    env_content = '''# Application Settings
APP_NAME="My FastAPI App"
DEBUG=false
VERSION="1.0.0"

# Database
DATABASE_URL="sqlite:///./test.db"

# Security - Change this in production!
SECRET_KEY="your-super-secret-key-min-32-characters-long"

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:8000"]
'''

    with open(Path(base_path) / ".env", "w") as f:
        f.write(env_content)
    print("✓ .env template created")


def create_pyproject_file(base_path: str):
    """Create pyproject.toml."""
    pyproject_content = '''[project]
name = "fastapi-app"
version = "0.1.0"
description = "A FastAPI application"
requires-python = ">=3.10"
dependencies = [
    "fastapi[standard]>=0.128.0",
    "uvicorn[standard]>=0.40.0",
    "pydantic-settings>=2.0.0",
    "sqlalchemy>=2.0.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-dotenv>=1.0.0",
]

[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"
'''

    with open(Path(base_path) / "pyproject.toml", "w") as f:
        f.write(pyproject_content)
    print("✓ pyproject.toml created")


def main():
    """Main scaffold function."""
    if len(sys.argv) > 1:
        app_name = sys.argv[1]
    else:
        app_name = "fastapi_app"

    app_path = Path(app_name)

    if app_path.exists():
        print(f"✗ Directory {app_name} already exists")
        sys.exit(1)

    print(f"Scaffolding FastAPI app: {app_name}")
    print("-" * 50)

    try:
        create_directory_structure(str(app_path))
        create_main_file(str(app_path))
        create_config_file(str(app_path))
        create_security_file(str(app_path))
        create_example_endpoint(str(app_path))
        create_env_file(str(app_path))
        create_pyproject_file(str(app_path))

        print("-" * 50)
        print(f"✓ FastAPI app scaffolded successfully!")
        print(f"\nNext steps:")
        print(f"  cd {app_name}")
        print(f"  uv sync")
        print(f"  fastapi dev main.py")

    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
