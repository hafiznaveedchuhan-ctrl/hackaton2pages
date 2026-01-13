#!/usr/bin/env python
"""Start backend with .env loaded"""
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Start uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info"
    )
