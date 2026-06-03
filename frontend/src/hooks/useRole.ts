"use client";

import { useUser } from "@/hooks/useUser";

export function useRole() {
  const { role } = useUser();
  const isAdmin = role === "admin";
  const isEmployee = role === "employee" || !role;

  return { role, isAdmin, isEmployee };
}
