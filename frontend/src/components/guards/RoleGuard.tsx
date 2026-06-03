"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: ("admin" | "employee")[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { role } = useRole();
  const effectiveRole = (role ?? "employee") as "admin" | "employee";
  const allowed = allowedRoles.includes(effectiveRole);

  useEffect(() => {
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, router]);

  if (!allowed) {
    return (
      <p className="text-sm text-zinc-500">
        You do not have permission to view this page.
      </p>
    );
  }

  return children;
}
