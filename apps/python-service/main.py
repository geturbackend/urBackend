import logging
import sys
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Configure root logger for console output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting urBackend Python AI Microservice...")
    yield
    logger.info("🛑 Shutting down urBackend Python AI Microservice...")

app = FastAPI(title="urBackend Python Service", lifespan=lifespan)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    client_ip = request.client.host if request.client else "unknown"
    logger.info("--> %s %s from %s", request.method, request.url.path, client_ip)
    try:
        response = await call_next(request)
        process_time_ms = (time.perf_counter() - start_time) * 1000
        logger.info("<-- %s %s [%d] in %.2fms", request.method, request.url.path, response.status_code, process_time_ms)
        return response
    except Exception as exc:
        process_time_ms = (time.perf_counter() - start_time) * 1000
        logger.error("<-- %s %s [500] in %.2fms with error: %s", request.method, request.url.path, process_time_ms, exc)
        raise exc

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

from routers import ai

app.include_router(ai.router)

