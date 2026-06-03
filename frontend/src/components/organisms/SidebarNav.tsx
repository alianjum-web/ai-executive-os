"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useSidebar } from "@/hooks/useSidebar";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/knowledge", label: "Knowledge", flag: "DOCUMENT_UPLOAD_ENABLED" as const },
  { href: "/chat", label: "Chat", flag: "KNOWLEDGE_AGENT_ENABLED" as const },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const documentUploadEnabled = useFeatureFlag("DOCUMENT_UPLOAD_ENABLED");
  const knowledgeEnabled = useFeatureFlag("KNOWLEDGE_AGENT_ENABLED");

  const flagEnabled = (flag?: (typeof links)[number]["flag"]) => {
    if (!flag) return true;
    if (flag === "DOCUMENT_UPLOAD_ENABLED") return documentUploadEnabled;
    if (flag === "KNOWLEDGE_AGENT_ENABLED") return knowledgeEnabled;
    return true;
  };

  if (!isOpen) return null;

  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white p-4">
      <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        SOP Automator
      </p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          if (!flagEnabled(link.flag)) return null;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm font-medium",
                pathname === link.href
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
