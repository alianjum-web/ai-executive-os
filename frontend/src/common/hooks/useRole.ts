"use client";

import { useUser } from "@/common/hooks/useUser";

export function useRole() {
  const { role } = useUser();
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isLeadership = isAdmin || isManager;
  const isEmployee = role === "employee" || (!isAdmin && !isManager && !role);

  return { role, isAdmin, isManager, isLeadership, isEmployee };
}
