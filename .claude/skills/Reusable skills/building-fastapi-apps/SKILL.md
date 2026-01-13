---
name: building-fastapi-apps
description: |
  Use when creating FastAPI web applications, REST APIs, microservices, or backend services in Python.
  Also use for implementing FastAPI features like authentication, validation, async endpoints, dependency injection, middleware, or error handling.
  NOT when working with other web frameworks (Django, Flask) or frontend frameworks.
---

# Building FastAPI Applications

FastAPI is a modern, fast Python web framework for building APIs with automatic interactive documentation and built-in validation via Pydantic. This skill covers best practices for building production-grade FastAPI applications.

## Quick Start: Project Structure

```
myapp/
├── main.py                 # Application entry point
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py        # Shared dependencies
│   │   └── endpoints/
│   │       ├── __init__.py
│   │       ├── users.py
│   │       ├── items.py
│   │       └── admin.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py      # Configuration & settings
│   │   └── security.py    # Auth & security
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   └── schemas/
│       ├── __init__.py
│       ├── user.py        # Pydantic schemas
│       └── item.py
├── tests/
│   ├── __init__.py
│   ├── test_api.py
│   └── conftest.py
├── .env                    # Environment variables
├── pyproject.toml
└── uv.lock
```

## Core Patterns

### 1. Application Setup

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="API Description",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(endpoints.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 2. Configuration Management

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI App"
    DEBUG: bool = False
    DATABASE_URL: str
    SECRET_KEY: str
    ALLOWED_ORIGINS: list = ["http://localhost:3000"]
    API_V1_STR: str = "/api/v1"

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()
```

### 3. Dependency Injection

```python
# app/api/deps.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.security import verify_token

def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get authenticated user from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = verify_token(token)
    if user is None:
        raise credentials_exception
    return user

def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get admin user - requires get_current_user."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
```

### 4. Request/Response Models with Pydantic

```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Works with ORM models
```

### 5. API Endpoints with Router

```python
# app/api/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas import user as schemas
from app.api import deps

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=schemas.User)
async def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(deps.get_db)
):
    """Create a new user."""
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return create_user_in_db(db, user_in)

@router.get("/{user_id}", response_model=schemas.User)
async def get_user(
    user_id: int,
    db: Session = Depends(deps.get_db)
):
    """Get user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: schemas.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """Update user (auth required)."""
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return update_user_in_db(db, user, user_in)
```

### 6. Error Handling

```python
# app/core/exceptions.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

class APIException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.body
        }
    )
```

### 7. Async Patterns

```python
# Always use async for I/O-bound operations
@app.get("/items/{item_id}")
async def read_item(item_id: int, db: Session = Depends(get_db)):
    # Database query
    item = db.query(Item).filter(Item.id == item_id).first()

    # External API call
    additional_data = await fetch_from_external_api(item_id)

    return {"item": item, "additional_data": additional_data}

# For CPU-bound work, use run_in_threadpool
from fastapi.concurrency import run_in_threadpool

@app.post("/process")
async def process_data(data: dict):
    result = await run_in_threadpool(expensive_computation, data)
    return result
```

### 8. Authentication with JWT

```python
# app/core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials

bearer_scheme = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    return encoded_jwt

async def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        return payload
    except JWTError:
        return None
```

### 9. Background Tasks

```python
from fastapi import BackgroundTasks

@app.post("/send-notification/")
async def send_notification(
    user_id: int,
    background_tasks: BackgroundTasks
):
    """Send notification in background."""
    background_tasks.add_task(send_email, user_id, "notification")
    return {"message": "Notification queued"}

def send_email(user_id: int, message_type: str):
    # This runs in background
    user = db.query(User).filter(User.id == user_id).first()
    # Send email logic
```

### 10. Testing with TestClient

```python
# tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/api/v1/users/",
        json={"email": "user@example.com", "password": "secure123"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"

def test_get_user():
    response = client.get("/api/v1/users/1")
    assert response.status_code == 200

def test_unauthorized():
    response = client.get("/api/v1/users/protected")
    assert response.status_code == 401
```

## Key Best Practices

1. **Use Async Everywhere**: Leverage async/await for I/O operations
2. **Type Hints**: Use Python type hints for clarity and IDE support
3. **Pydantic Validation**: Let Pydantic handle request validation
4. **Dependency Injection**: Use `Depends()` for reusable logic
5. **Router Organization**: Group endpoints by resource in separate files
6. **Error Handling**: Use appropriate HTTP status codes and exceptions
7. **Configuration**: Use environment variables for configuration
8. **Security**: Implement authentication, validation, and CORS properly
9. **Documentation**: FastAPI auto-generates interactive docs via Swagger UI
10. **Testing**: Use `TestClient` for integration tests

## Running the Application

```bash
# Development (with auto-reload)
fastapi dev main.py

# Production (with uvicorn)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Environment Setup

Create `.env` file:
```
APP_NAME="My FastAPI App"
DEBUG=false
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key-here-min-32-chars
ALLOWED_ORIGINS=["http://localhost:3000","https://example.com"]
```

## References

- [FastAPI Official Docs](https://fastapi.tiangolo.com/)
- [Pydantic Docs](https://docs.pydantic.dev/)
- [Starlette Docs](https://www.starlette.io/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
