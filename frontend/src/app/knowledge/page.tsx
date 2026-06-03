import { DocumentLibrary } from "@/components/organisms/DocumentLibrary";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";
import { RoleGuard } from "@/components/guards/RoleGuard";

export default function KnowledgePage() {
  return (
    <DashboardTemplate title="Knowledge Base">
      <RoleGuard allowedRoles={["admin"]}>
        <DocumentLibrary />
      </RoleGuard>
    </DashboardTemplate>
  );
}
