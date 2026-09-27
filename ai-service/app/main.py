from fastapi import FastAPI

from app.routers import bugs, debug, health

app = FastAPI(
    title="Tracora AI Service",
    description="Read-only AI layer for Tracora. Suggestion-only: it never writes to MongoDB.",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(debug.router)
app.include_router(bugs.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
