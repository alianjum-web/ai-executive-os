"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/common/lib/utils";
import { primaryNav, secondaryNav, type NavItem } from "@/common/lib/navigation";
import { Logo } from "@/common/atoms/Logo";
import { Separator } from "@/common/atoms/ui/separator";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { useRole } from "@/common/hooks/useRole";
import { useMobileNav } from "@/common/hooks/useMobileNav";

function useNavVisibility() {
  const { isAdmin } = useRole();
  const documentUpload = useFeatureFlag("DOCUMENT_UPLOAD_ENABLED");
  const knowledge = useFeatureFlag("KNOWLEDGE_AGENT_ENABLED");
  const project = useFeatureFlag("PROJECT_AGENT_ENABLED");
  const analytics = useFeatureFlag("ANALYTICS_DASHBOARD_ENABLED");

  const flagEnabled = (flag?: NavItem["flag"]) => {
    if (!flag) return true;
    if (flag === "DOCUMENT_UPLOAD_ENABLED") return documentUpload;
    if (flag === "KNOWLEDGE_AGENT_ENABLED") return knowledge;
    if (flag === "PROJECT_AGENT_ENABLED") return project;
    if (flag === "ANALYTICS_DASHBOARD_ENABLED") return analytics;
    return true;
  };

  const visible = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!flagEnabled(item.flag)) return false;
    return true;
  };

  return { visible };
}

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? "bg-[linear-gradient(135deg,rgba(79,140,255,0.2)_0%,rgba(139,92,246,0.15)_100%)] text-foreground shadow-sm ring-1 ring-accent-blue/30"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active ? "text-accent-blue" : "text-muted-foreground group-hover:text-accent-blue"
        )}
        aria-hidden
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{item.label}</span>
        <span className="truncate text-[11px] text-muted-foreground group-hover:text-muted-foreground">
          {item.description}
        </span>
      </span>
    </Link>
  );
}

export function AppSidebar({ className }: { className?: string }) {
  const { visible } = useNavVisibility();
  const { close } = useMobileNav();

  const primary = primaryNav.filter(visible);
  const secondary = secondaryNav.filter(visible);

  return (
    <aside
      className={cn(
        "flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-surface-elevated",
        className
      )}
    >
      <div className="flex h-[var(--header-height)] items-center border-b border-border px-4">
        <Logo href="/dashboard" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Main">
        {primary.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={close} />
        ))}
      </nav>

      {secondary.length > 0 ? (
        <>
          <Separator className="mx-3" />
          <nav className="p-3 pt-2" aria-label="Secondary">
            {secondary.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={close} />
            ))}
          </nav>
        </>
      ) : null}

      <div className="border-t border-border p-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Calm, focused workflows powered by your company knowledge.
        </p>
      </div>
    </aside>
  );
}
