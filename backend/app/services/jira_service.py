from typing import Any

import httpx

from app.core.config import settings
from app.core.feature_flags import flags


class JiraService:
    """Jira REST API v3 client using OAuth 2.0 bearer token from org settings."""

    def __init__(self, jira_config: dict) -> None:
        self.site_url = (jira_config.get("jira_site_url") or "").rstrip("/")
        self.project_key = jira_config.get("jira_project_key") or "ENG"
        self.access_token = jira_config.get("jira_access_token") or ""
        self.client_id = jira_config.get("jira_client_id") or ""
        self.client_secret = jira_config.get("jira_client_secret") or ""

    @property
    def enabled(self) -> bool:
        return bool(flags.JIRA_INTEGRATION_ENABLED and self.site_url and self.access_token)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    async def create_issue(
        self,
        summary: str,
        description: str,
        priority_name: str = "Medium",
        issue_type: str = "Task",
    ) -> dict[str, Any]:
        if not self.enabled:
            return {"key": None, "mock": True}

        payload = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": summary[:255],
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": description[:32000]}],
                        }
                    ],
                },
                "issuetype": {"name": issue_type},
                "priority": {"name": priority_name},
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.site_url}/rest/api/3/issue",
                headers=self._headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            key = data.get("key")
            return {
                "key": key,
                "id": data.get("id"),
                "self": data.get("self"),
                "url": f"{self.site_url}/browse/{key}" if key else None,
            }

    async def update_issue(self, issue_key: str, fields: dict[str, Any]) -> dict[str, Any]:
        if not self.enabled:
            return {"key": issue_key, "mock": True}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.put(
                f"{self.site_url}/rest/api/3/issue/{issue_key}",
                headers=self._headers(),
                json={"fields": fields},
            )
            response.raise_for_status()
            return {"key": issue_key, "updated": True}

    async def get_user_workload(self, jira_account_id: str) -> int:
        """Count open issues assigned to a Jira account."""
        if not self.enabled or not jira_account_id:
            return 0

        jql = (
            f'assignee = "{jira_account_id}" AND project = {self.project_key} '
            f'AND statusCategory != Done'
        )
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.site_url}/rest/api/3/search/jql",
                headers=self._headers(),
                params={"jql": jql, "maxResults": 0},
            )
            if response.status_code == 404:
                response = await client.post(
                    f"{self.site_url}/rest/api/3/search",
                    headers=self._headers(),
                    json={"jql": jql, "maxResults": 0, "fields": ["key"]},
                )
            response.raise_for_status()
            data = response.json()
            return int(data.get("total", 0))

    def priority_label(self, priority: int) -> str:
        return {1: "Lowest", 2: "Low", 3: "Medium", 4: "High", 5: "Highest"}.get(
            priority, "Medium"
        )
