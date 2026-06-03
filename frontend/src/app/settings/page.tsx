import { IntegrationSettingsForm } from "@/components/organisms/IntegrationSettingsForm";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";

export default function SettingsPage() {
  return (
    <DashboardTemplate title="Integration settings">
      <RoleGuard allowedRoles={["admin"]}>
        <p className="mb-6 text-sm text-zinc-600">
          Configure Jira OAuth credentials and SendGrid keys. Secrets are encrypted at rest and
          never returned in plaintext after save.
        </p>
        <IntegrationSettingsForm />
      </RoleGuard>
    </DashboardTemplate>
  );
}
