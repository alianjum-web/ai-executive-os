from app.core.config import settings


class FeatureFlags:
    @property
    def KNOWLEDGE_AGENT_ENABLED(self) -> bool:
        return settings.feature_knowledge_agent_enabled

    @property
    def DOCUMENT_UPLOAD_ENABLED(self) -> bool:
        return settings.feature_document_upload_enabled


flags = FeatureFlags()
