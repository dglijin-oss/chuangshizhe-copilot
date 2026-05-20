import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from app.config import settings
from app.database import init_db
from app.routers import accounts, keywords, content, rewrite, dashboard

BASE_DIR = Path(__file__).parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "app" / "templates"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database initialized")

    try:
        from app.services.scheduler import start_scheduler
        start_scheduler()
        logger.info("Scheduler started")
    except Exception as e:
        logger.warning(f"Scheduler failed to start: {e}")

    yield

    try:
        from app.services.scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=True)
templates = Jinja2Templates(env=jinja_env)

# Routers
app.include_router(accounts.router)
app.include_router(keywords.router)
app.include_router(content.router)
app.include_router(rewrite.router)
app.include_router(dashboard.router)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "dashboard.html")


@app.get("/accounts", response_class=HTMLResponse)
async def accounts_page(request: Request):
    return templates.TemplateResponse(request, "accounts.html")


@app.get("/keywords", response_class=HTMLResponse)
async def keywords_page(request: Request):
    return templates.TemplateResponse(request, "keywords.html")


@app.get("/content", response_class=HTMLResponse)
async def content_page(request: Request):
    return templates.TemplateResponse(request, "content.html")


@app.get("/rewrites", response_class=HTMLResponse)
async def rewrites_page(request: Request):
    return templates.TemplateResponse(request, "rewrites.html")
