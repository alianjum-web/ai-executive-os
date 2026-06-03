import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.database import User
from app.services.jira_service import JiraService
from app.services.workload_service import WorkloadService


def _user(uid: str, jira_id: str) -> User:
    return User(
        id=uuid.UUID(uid),
        email=f"{uid}@test.com",
        jira_account_id=jira_id,
        org_id=uuid.uuid4(),
    )


@pytest.mark.asyncio
@patch("app.services.workload_service.flags")
async def test_picks_user_with_minimum_open_issues(mock_flags):
    mock_flags.WORKLOAD_BALANCING_ENABLED = True

    org_id = uuid.uuid4()
    users = [
        _user("00000000-0000-0000-0000-000000000001", "alice"),
        _user("00000000-0000-0000-0000-000000000002", "bob"),
        _user("00000000-0000-0000-0000-000000000003", "carol"),
    ]

    jira = MagicMock(spec=JiraService)
    jira.enabled = True
    jira.get_user_workload = AsyncMock(side_effect=[5, 2, 8])

    service = WorkloadService()
    with patch.object(
        service, "_department_candidates", AsyncMock(return_value=users)
    ):
        chosen = await service.pick_assignee_lowest_workload(
            AsyncMock(), org_id, "engineering", jira
        )

    assert chosen is not None
    assert chosen.jira_account_id == "bob"
    assert jira.get_user_workload.await_count == 3
