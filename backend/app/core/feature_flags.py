from app.core.config import settings


class FeatureFlags:
    @property
    def KNOWLEDGE_AGENT_ENABLED(self) -> bool:
        return settings.feature_knowledge_agent_enabled

    @property
    def DOCUMENT_UPLOAD_ENABLED(self) -> bool:
        return settings.feature_document_upload_enabled

    @property
    def MULTI_TENANT_ENABLED(self) -> bool:
        return settings.feature_multi_tenant_enabled

    @property
    def ANALYTICS_DASHBOARD_ENABLED(self) -> bool:
        return settings.feature_analytics_dashboard_enabled


flags = FeatureFlags()
