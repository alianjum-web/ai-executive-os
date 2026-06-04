import { DocumentLibrary } from "@/knowledge/organisms/DocumentLibrary";
import { DashboardTemplate } from "@/common/organisms/DashboardTemplate";
import { RoleGuard } from "@/common/organisms/RoleGuard";

export function KnowledgeScreen() {
  return (
    <DashboardTemplate title="Knowledge base">
      <RoleGuard allowedRoles={["admin"]}>
        <DocumentLibrary />
      </RoleGuard>
    </DashboardTemplate>
  );
}
