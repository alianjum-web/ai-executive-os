from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers import health, ingest, query
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="SOP Automator API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api/v1"
app.include_router(health.router, prefix=api_prefix, tags=["health"])
app.include_router(ingest.router, prefix=api_prefix, tags=["ingest"])
app.include_router(query.router, prefix=api_prefix, tags=["query"])
