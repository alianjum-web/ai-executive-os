import { SidebarNav } from "@/components/organisms/SidebarNav";

export function DashboardTemplate({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <SidebarNav />
      <main className="flex flex-1 flex-col p-8">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
