import { DocumentLibrary } from "@/knowledge/organisms/DocumentLibrary";
import { IntegrationsPanel } from "@/knowledge/organisms/IntegrationsPanel";
import { DashboardTemplate } from "@/common/organisms/DashboardTemplate";
import { RoleGuard } from "@/common/organisms/RoleGuard";

export function KnowledgeScreen() {
  return (
    <DashboardTemplate title="Knowledge base">
      <RoleGuard allowedRoles={["admin"]}>
        <div className="space-y-8">
          <IntegrationsPanel />
          <DocumentLibrary />
        </div>
      </RoleGuard>
    </DashboardTemplate>
  );
}
