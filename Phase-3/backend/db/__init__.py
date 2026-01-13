"""Database initialization and setup"""
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool, QueuePool
import os
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./test.db"
)

# Determine connection parameters based on database type
is_sqlite = "sqlite" in DATABASE_URL

if is_sqlite:
    # SQLite configuration
    engine = create_engine(
        DATABASE_URL,
        echo=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    logger.info("Using SQLite database")
else:
    # PostgreSQL (Neon) configuration
    engine = create_engine(
        DATABASE_URL,
        echo=True,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,  # Enable connection health checks
    )
    logger.info("Using PostgreSQL (Neon) database")

# Create SessionLocal for direct use
SessionLocal = lambda: Session(engine)

def create_db_and_tables():
    """Create all database tables"""
    try:
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise

def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
