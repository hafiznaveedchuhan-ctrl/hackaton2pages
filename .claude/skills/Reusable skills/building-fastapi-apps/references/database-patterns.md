# FastAPI Database Patterns

## SQLAlchemy Integration

### Database Configuration

```python
# app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,  # Verify connections before use
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Base Model with Timestamps

```python
# app/models/base.py
from sqlalchemy import Column, DateTime, func
from datetime import datetime
from app.core.database import Base

class BaseModel(Base):
    __abstract__ = True

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

# Usage
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
```

### Relationships

```python
from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)

    # One-to-many relationship
    items = relationship("Item", back_populates="owner")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Back reference
    owner = relationship("User", back_populates="items")
```

### Cascading Deletes

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    # Cascade delete items when user is deleted
    items = relationship(
        "Item",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
```

## Query Patterns

### Efficient Querying with Joins

```python
from sqlalchemy.orm import joinedload, selectinload

@router.get("/users/{user_id}/items/")
async def get_user_items(user_id: int, db: Session = Depends(get_db)):
    """Get user with items efficiently."""
    # Use joinedload to avoid N+1 queries
    user = db.query(User).options(
        joinedload(User.items)
    ).filter(User.id == user_id).first()
    return user
```

### Filtering with Multiple Conditions

```python
@router.get("/items/")
async def search_items(
    title: Optional[str] = None,
    min_price: float = 0,
    max_price: float = 10000,
    db: Session = Depends(get_db)
):
    """Search items with filters."""
    query = db.query(Item)

    if title:
        query = query.filter(Item.title.ilike(f"%{title}%"))

    query = query.filter(Item.price.between(min_price, max_price))

    return query.all()
```

### Aggregation

```python
from sqlalchemy import func

@router.get("/stats/")
async def get_stats(db: Session = Depends(get_db)):
    """Get database statistics."""
    total_items = db.query(func.count(Item.id)).scalar()
    avg_price = db.query(func.avg(Item.price)).scalar()
    max_price = db.query(func.max(Item.price)).scalar()

    return {
        "total_items": total_items,
        "avg_price": avg_price,
        "max_price": max_price
    }
```

### Pagination Helper

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar('T')

class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 10

def paginate(query, skip: int = 0, limit: int = 10):
    """Generic pagination helper."""
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.get("/items/")
async def list_items(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """List items with pagination."""
    query = db.query(Item)
    return paginate(query, skip, limit)
```

## Transaction Management

### Atomic Operations

```python
from sqlalchemy.exc import SQLAlchemyError

@router.post("/transfer/")
async def transfer_funds(
    from_account_id: int,
    to_account_id: int,
    amount: float,
    db: Session = Depends(get_db)
):
    """Transfer funds between accounts (atomic)."""
    try:
        from_account = db.query(Account).filter(
            Account.id == from_account_id
        ).with_for_update().first()  # Lock for update

        to_account = db.query(Account).filter(
            Account.id == to_account_id
        ).first()

        if from_account.balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")

        from_account.balance -= amount
        to_account.balance += amount

        db.commit()
        return {"status": "success"}

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Transaction failed")
```

### Savepoints

```python
@router.post("/batch-process/")
async def batch_process(items: List[ItemData], db: Session = Depends(get_db)):
    """Process items with savepoints for partial rollback."""
    results = []

    for item in items:
        savepoint = db.begin_nested()  # Create savepoint
        try:
            db_item = Item(**item.dict())
            db.add(db_item)
            db.flush()
            savepoint.commit()
            results.append({"status": "success", "id": db_item.id})
        except Exception as e:
            savepoint.rollback()
            results.append({"status": "failed", "error": str(e)})

    db.commit()
    return results
```

## Async Database Access

### Using AsyncIO with Databases

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Create async engine
engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=False
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_async_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/items/")
async def list_items(db: AsyncSession = Depends(get_async_db)):
    """List items asynchronously."""
    result = await db.execute(select(Item))
    items = result.scalars().all()
    return items
```

## Database Migrations with Alembic

### Initialize Alembic

```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### Migration Files

```python
# alembic/versions/001_initial.py
def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

def downgrade():
    op.drop_table('users')
```
