import { AppShell } from "@/common/organisms/layout/AppShell";

const pageMeta: Record<
  string,
  { title: string; description: string }
> = {
  "/dashboard": {
    title: "Command Center",
    description: "What needs attention · What AI is doing · What to do next",
  },
  "/chat": {
    title: "AI Assistant",
    description: "Grounded answers from your company knowledge",
  },
  "/knowledge": {
    title: "Knowledge Base",
    description: "Upload and manage SOPs and policy documents",
  },
  "/tickets": {
    title: "Task Routing",
    description: "Automated classification and assignment from Slack",
  },
};

export function DashboardTemplate({
  title,
  description,
  children,
  pathname = "/dashboard",
  headerActions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  pathname?: string;
  headerActions?: React.ReactNode;
}) {
  const meta = pageMeta[pathname];
  return (
    <AppShell
      title={title ?? meta?.title ?? title}
      description={description ?? meta?.description}
      headerActions={headerActions}
    >
      {children}
    </AppShell>
  );
}
