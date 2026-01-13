# FastAPI API Patterns

## RESTful API Design

### Standard CRUD Endpoints

```python
from fastapi import APIRouter, HTTPException, status
from typing import List

router = APIRouter(prefix="/items", tags=["items"])

# GET all items with pagination
@router.get("/", response_model=List[ItemResponse])
async def list_items(skip: int = 0, limit: int = 10):
    """List all items with pagination."""
    items = db.query(Item).offset(skip).limit(limit).all()
    return items

# GET single item
@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int):
    """Get item by ID."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

# POST create new item
@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate):
    """Create new item."""
    db_item = Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# PUT update entire item
@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(item_id: int, item: ItemUpdate):
    """Update entire item."""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in item.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

# PATCH partial update
@router.patch("/{item_id}", response_model=ItemResponse)
async def partial_update_item(item_id: int, item: ItemPartialUpdate):
    """Partially update item."""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    update_data = item.dict(exclude_unset=True)
    updated_item = db_item.copy(update={**update_data})
    return updated_item

# DELETE item
@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int):
    """Delete item."""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
```

## Query Parameters and Filtering

```python
from typing import Optional
from fastapi import Query

@router.get("/search/")
async def search_items(
    q: Optional[str] = Query(None, min_length=1, max_length=50),
    category: Optional[str] = None,
    price_min: float = Query(0, ge=0),
    price_max: float = Query(1000, ge=0),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = "created_at"
):
    """Search items with filters."""
    query = db.query(Item)

    if q:
        query = query.filter(Item.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(Item.category == category)
    if price_min:
        query = query.filter(Item.price >= price_min)
    if price_max:
        query = query.filter(Item.price <= price_max)

    items = query.offset(skip).limit(limit).all()
    return items
```

## Nested Resources

```python
# /users/{user_id}/items/{item_id}
@router.get("/users/{user_id}/items/{item_id}")
async def get_user_item(user_id: int, item_id: int):
    """Get specific item belonging to user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    item = db.query(Item).filter(
        Item.id == item_id,
        Item.user_id == user_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

## Bulk Operations

```python
@router.post("/bulk-create/")
async def bulk_create_items(items: List[ItemCreate]):
    """Create multiple items at once."""
    db_items = [Item(**item.dict()) for item in items]
    db.add_all(db_items)
    db.commit()
    return db_items

@router.delete("/bulk-delete/")
async def bulk_delete_items(item_ids: List[int]):
    """Delete multiple items."""
    db.query(Item).filter(Item.id.in_(item_ids)).delete()
    db.commit()
    return {"deleted": len(item_ids)}
```

## Response Wrapping

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    items: List[T]
    skip: int
    limit: int

@router.get("/paginated/", response_model=PaginatedResponse[ItemResponse])
async def get_paginated_items(skip: int = 0, limit: int = 10):
    """Get paginated items."""
    total = db.query(Item).count()
    items = db.query(Item).offset(skip).limit(limit).all()
    return PaginatedResponse(
        total=total,
        items=items,
        skip=skip,
        limit=limit
    )
```

## API Versioning

```python
# app/api/v1/endpoints/users.py
v1_router = APIRouter(prefix="/api/v1/users", tags=["v1-users"])

# app/api/v2/endpoints/users.py
v2_router = APIRouter(prefix="/api/v2/users", tags=["v2-users"])

# main.py
app.include_router(v1_router)
app.include_router(v2_router)
```

## Webhook Support

```python
@router.post("/webhooks/events/")
async def receive_webhook(event: WebhookEvent):
    """Receive and process webhook events."""
    # Store event in database
    db_event = WebhookLog(**event.dict())
    db.add(db_event)
    db.commit()

    # Process event asynchronously
    background_tasks.add_task(process_webhook_event, event)

    return {"status": "received"}
```
