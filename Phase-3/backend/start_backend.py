#!/usr/bin/env python
"""Start backend with .env loaded"""
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Start uvicorn
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
