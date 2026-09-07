import os
import sys
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root and backend directory are in sys.path for app and agent module imports
app_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(app_dir)
project_root = os.path.dirname(backend_dir)

for path in (project_root, backend_dir):
    if path not in sys.path:
        sys.path.insert(0, path)

# Auto-load environment variables from project-root .env file if present
env_path = os.path.join(project_root, ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("'\""))

from app.database import init_db
from app.routes.demo import router as demo_router
from app.routes.notifications import router as notifications_router
from app.routes.transactions import router as transactions_router
from app.routes.webhooks import router as webhooks_router
import ecommerce.backend.app.main as ecommerce_app_module


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically initialize SQLite database tables & seed e-commerce products on startup
    init_db()
    try:
        ecommerce_app_module.init_ecommerce_db()
        ecommerce_app_module.seed_products()
    except Exception as err:
        print("Notice: E-commerce DB init/seeding status:", err)
    yield


app = FastAPI(
    title="RecoverAI Unified Backend",
    description="AI-powered revenue recovery system & Aura Store E-Commerce API",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for local development and merchant interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(transactions_router)
app.include_router(webhooks_router)
app.include_router(notifications_router)
app.include_router(demo_router)

# Include Aura Store E-Commerce API routes directly
app.include_router(ecommerce_app_module.app.router)


@app.get("/")
def root():
    """Root endpoint providing service summary and documentation links."""
    return {
        "status": "ok",
        "service": "RecoverAI Backend API",
        "version": "0.1.0",
        "docs_url": "http://127.0.0.1:8000/docs",
        "health_check": "http://127.0.0.1:8000/health",
        "merchant_dashboard": "http://localhost:5173",
        "aura_store": "http://localhost:5174",
    }


@app.get("/health")
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "ok",
        "message": "RecoverAI backend is running",
        "service": "RecoverAI API",
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
