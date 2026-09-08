import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend_dir is prioritized in sys.path for RecoverAI app imports
api_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(api_dir)
backend_dir = os.path.join(project_root, "backend")

for path in (backend_dir, project_root):
    if path in sys.path:
        sys.path.remove(path)
    sys.path.insert(0, path)

# Enable Vercel environment flag
os.environ["VERCEL"] = "1"

# Import RecoverAI backend components
from app.database import init_db as init_recoverai_db
from app.routes.transactions import router as transactions_router
from app.routes.webhooks import router as webhooks_router
from app.routes.notifications import router as notifications_router
from app.routes.demo import router as demo_router

# Import Aura Store e-commerce backend components
import ecommerce.backend.app.main as ecommerce_app_module

# Run initializers on top-level for Vercel serverless cold starts
try:
    init_recoverai_db()
    ecommerce_app_module.init_ecommerce_db()
    ecommerce_app_module.seed_products()
except Exception as err:
    print("Notice: Vercel cold-start initialization status:", err)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_recoverai_db()
    try:
        ecommerce_app_module.init_ecommerce_db()
        ecommerce_app_module.seed_products()
    except Exception as err:
        print("Notice: Product seeding status:", err)
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

# Include ecommerce backend routes directly (supports both /api/products and /products)
app.include_router(ecommerce_app_module.app.router)


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
    from app.database import check_db_connection, IS_POSTGRES
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "service": "Unified Serverless API",
        "message": "RecoverAI & Aura Store APIs active on Vercel Serverless",
        "database": "connected" if db_ok else "unreachable",
        "database_type": "postgresql" if IS_POSTGRES else "sqlite",
    }
