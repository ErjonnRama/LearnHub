from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.db.database import init_db
from app.db.nosql import close_connections
from app.api.v1.routes import include_all_routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown
    await close_connections()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## LearnHub API

Full-stack e-learning platform built with FastAPI + React.
Seeded with the [Udemy Kaggle Dataset](https://www.kaggle.com/datasets/yusufdelikkaya/udemy-online-education-courses).

### Features
- JWT Authentication (access + refresh tokens)
- Role-Based Access Control (Admin, Manager, Instructor, User)
- Advanced Course Search with 7 filters
- Real-Time Chat & Notifications (WebSocket)
- Data Export: CSV, Excel, JSON for 6 lists
- Kaggle Dataset Import
- Stripe Payment Integration
- Audit Logging
- MongoDB for analytics
    """,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# All routers
include_all_routers(app)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
