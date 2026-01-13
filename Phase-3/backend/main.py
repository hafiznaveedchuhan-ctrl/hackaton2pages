"""
Phase-3 FastAPI Application

AI-Powered Todo Chatbot with Multi-Agent Architecture

@specs/phase-3-overview.md - Complete Specification
@plan.md - Implementation Plan
"""

import logging
import os
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from db import create_db_and_tables, get_session, engine
from models import Conversation, Message, Task, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Phase-3 Todo Chatbot",
    description="AI-Powered Todo Chatbot with Multi-Agent Architecture",
    version="1.0.0"
)

# Add CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
def on_startup():
    """Initialize database on startup"""
    logger.info("Creating database tables...")
    create_db_and_tables()
    logger.info("Database initialized successfully")

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Import routes
try:
    from routes import chat, conversations, auth, tasks
    app.include_router(chat.router)
    app.include_router(conversations.router)
    app.include_router(auth.router)
    app.include_router(tasks.router)
    logger.info("Loaded all routes: chat, conversations, auth, tasks")
except ImportError as e:
    logger.warning(f"Could not load routes: {e}")

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
