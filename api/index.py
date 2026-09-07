import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root, backend, and ecommerce backend directories are in sys.path
api_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(api_dir)
backend_dir = os.path.join(project_root, "backend")
ecommerce_backend_dir = os.path.join(project_root, "ecommerce", "backend")

for path in (project_root, backend_dir, ecommerce_backend_dir):
    if path not in sys.path:
        sys.path.insert(0, path)

# Enable Vercel environment flag
os.environ["VERCEL"] = "1"

# Import database initializers and routes
from app.database import init_db as init_recoverai_db
from ecommerce.backend.app.database import init_ecommerce_db
from ecommerce.backend.app.seed_products import seed_products

from app.routes.transactions import router as transactions_router
from app.routes.webhooks import router as webhooks_router
from app.routes.notifications import router as notifications_router
from app.routes.demo import router as demo_router

# Import ecommerce endpoints from ecommerce app
import ecommerce.backend.app.main as ecommerce_app_module


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize databases on serverless startup
    init_recoverai_db()
    init_ecommerce_db()
    try:
        seed_products()
    except Exception as err:
        print("Notice: Product seeding skipped or completed:", err)
    yield


app = FastAPI(
    title="RecoverAI & Aura Store Unified Serverless API",
    description="Vercel Serverless API combining RecoverAI Engine and Aura Store Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register RecoverAI routes
app.include_router(transactions_router)
app.include_router(webhooks_router)
app.include_router(notifications_router)
app.include_router(demo_router)

# Mount ecommerce backend routes under /api prefix
app.mount("/api", ecommerce_app_module.app)


@app.get("/")
@app.get("/api")
def root():
    return {
        "status": "ok",
        "service": "RecoverAI & Aura Store Unified Vercel Serverless API",
        "version": "1.0.0",
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Unified Serverless API",
        "message": "RecoverAI & Aura Store APIs active on Vercel Serverless",
    }
