from fastapi import FastAPI
app = FastAPI(title="urBackend Python Service")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

import logging
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

from routers import ai

app.include_router(ai.router)
