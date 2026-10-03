from fastapi import FastAPI

from app.core.llm.chat import active_backend
from app.routers import agent, bugs, health

app = FastAPI(
    title="Tracora AI Service",
    description="Read-only AI layer for Tracora. Suggestion-only: it never writes to MongoDB.",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(bugs.router)
app.include_router(agent.router)


if __name__ == "__main__":
    import uvicorn

    from app.core.logging import log

    log("startup", "ai-service starting", backend=active_backend())
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
