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

    @property
    def PROJECT_AGENT_ENABLED(self) -> bool:
        return settings.feature_project_agent_enabled

    @property
    def SLACK_WEBHOOK_ENABLED(self) -> bool:
        return settings.feature_slack_webhook_enabled

    @property
    def JIRA_INTEGRATION_ENABLED(self) -> bool:
        return settings.feature_jira_integration_enabled

    @property
    def EMAIL_WEBHOOK_ENABLED(self) -> bool:
        return settings.feature_email_webhook_enabled

    @property
    def WORKLOAD_BALANCING_ENABLED(self) -> bool:
        return settings.feature_workload_balancing_enabled

    @property
    def AUDIT_LOG_ENABLED(self) -> bool:
        return settings.feature_audit_log_enabled

    @property
    def CUSTOM_LLM_PROVIDER_ENABLED(self) -> bool:
        return settings.feature_custom_llm_provider_enabled

    @property
    def RAG_CACHE_ENABLED(self) -> bool:
        return settings.feature_rag_cache_enabled


flags = FeatureFlags()
