"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/common/organisms/layout/AppSidebar";
import { AppHeader } from "@/common/organisms/layout/AppHeader";
import { useMobileNav } from "@/common/hooks/useMobileNav";
import { cn } from "@/common/lib/utils";

type AppShellProps = {
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({
  title,
  description,
  headerActions,
  children,
}: AppShellProps) {
  const { isOpen, close } = useMobileNav();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) close();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close navigation menu"
            onClick={close}
          />
          <div className="absolute left-0 top-0 h-full shadow-lg">
            <AppSidebar />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title={title}
          description={description}
          actions={headerActions}
        />
        <main
          className={cn(
            "flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8",
            "max-w-[1400px] w-full mx-auto"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
