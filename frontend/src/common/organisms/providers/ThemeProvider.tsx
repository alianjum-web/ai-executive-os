"use client";

import { useTheme } from "@/common/hooks/useTheme";

/** Syncs Redux theme state to `data-theme` on `<html>`. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return children;
}
