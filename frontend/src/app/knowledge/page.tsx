import { DocumentLibrary } from "@/components/organisms/DocumentLibrary";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";

export default function KnowledgePage() {
  return (
    <DashboardTemplate title="Knowledge Base">
      <DocumentLibrary />
    </DashboardTemplate>
  );
}
