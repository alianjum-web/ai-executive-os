import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feature_flags import flags
from app.models.database import AssigneeMapping, User
from app.services.assignee_service import AssigneeService
from app.services.jira_service import JiraService


class WorkloadService:
    async def pick_assignee_lowest_workload(
        self,
        db: AsyncSession,
        org_id: uuid.UUID,
        department: str,
        jira: JiraService,
    ) -> User | None:
        if not flags.WORKLOAD_BALANCING_ENABLED or not jira.enabled:
            return await AssigneeService().assign_round_robin(db, org_id, department)

        candidates = await self._department_candidates(db, org_id, department)
        if not candidates:
            return None

        best_user = candidates[0]
        best_count = await self._workload_for_user(jira, best_user)

        for user in candidates[1:]:
            count = await self._workload_for_user(jira, user)
            if count < best_count:
                best_count = count
                best_user = user

        return best_user

    async def _workload_for_user(self, jira: JiraService, user: User) -> int:
        if user.jira_account_id:
            return await jira.get_user_workload(user.jira_account_id)
        return 9999

    async def _department_candidates(
        self, db: AsyncSession, org_id: uuid.UUID, department: str
    ) -> list[User]:
        dept = department.lower()
        mapping_result = await db.execute(
            select(AssigneeMapping).where(
                AssigneeMapping.org_id == org_id,
                AssigneeMapping.department == dept,
            )
        )
        mapping = mapping_result.scalar_one_or_none()
        if mapping and mapping.user_ids:
            ids = [uuid.UUID(str(uid)) for uid in mapping.user_ids]
            result = await db.execute(select(User).where(User.id.in_(ids)))
            return list(result.scalars().all())

        result = await db.execute(
            select(User).where(User.org_id == org_id, User.department == dept)
        )
        users = list(result.scalars().all())
        if users:
            return users
        result = await db.execute(select(User).where(User.org_id == org_id).limit(5))
        return list(result.scalars().all())
