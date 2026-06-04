from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "sop_automator",
    broker=settings.redis_url_for_celery,
    backend=settings.redis_url_for_celery,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
