"""
Sentio - AI-Powered Chat Application
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .routes import auth, chat, ai
from .database import engine, Base

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sentio API",
    description="AI-Powered Chat Application Backend",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])


@app.get("/")
async def root():
    return {"message": "Welcome to Sentio API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Sentio API"}
