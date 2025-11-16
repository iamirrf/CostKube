from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .api.routes import router as api_router
from .services.database import db_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    # Initialize database
    await db_service.initialize()
    print("✅ Database initialized")

    yield

    # Cleanup on shutdown
    print("🔒 Shutting down CostKube")


app = FastAPI(
    title="CostKube",
    description="Kubernetes Cost Analytics Platform for Red Hat",
    version="2.0.0",
    lifespan=lifespan,
)

# Mount the API routes
app.include_router(api_router)

# Serve static files
app.mount("/static", StaticFiles(directory="app/ui/static"), name="static")

# Set up templates
templates = Jinja2Templates(directory="app/ui/templates")


@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("app/ui/templates/index.html", "r") as f:
        return HTMLResponse(content=f.read())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
