from fastapi import FastAPI
app = FastAPI(title="urBackend Python Service")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

from routers import ai

app.include_router(ai.router)
