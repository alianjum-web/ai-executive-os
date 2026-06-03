from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/sop_automator",
        validation_alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    cohere_api_key: str = Field(default="", validation_alias="COHERE_API_KEY")
    supabase_jwt_secret: str = Field(default="", validation_alias="SUPABASE_JWT_SECRET")
    openai_chat_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    max_chunk_tokens: int = 800
    retrieval_top_k: int = 10
    rerank_top_k: int = 5
    min_relevance_grade: int = 3
    upload_dir: str = Field(default="/tmp/uploads", validation_alias="UPLOAD_DIR")
    cors_origins: str = Field(default="http://localhost:3000", validation_alias="CORS_ORIGINS")

    feature_knowledge_agent_enabled: bool = True
    feature_document_upload_enabled: bool = True
    feature_multi_tenant_enabled: bool = True
    feature_analytics_dashboard_enabled: bool = True
    feature_project_agent_enabled: bool = Field(default=True, validation_alias="FEATURE_PROJECT_AGENT_ENABLED")
    feature_slack_webhook_enabled: bool = Field(default=True, validation_alias="FEATURE_SLACK_WEBHOOK_ENABLED")

    slack_signing_secret: str = Field(default="", validation_alias="SLACK_SIGNING_SECRET")
    slack_bot_token: str = Field(default="", validation_alias="SLACK_BOT_TOKEN")
    default_org_id: str = Field(default="", validation_alias="DEFAULT_ORG_ID")
    slack_webhook_max_age_seconds: int = 60 * 5

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
