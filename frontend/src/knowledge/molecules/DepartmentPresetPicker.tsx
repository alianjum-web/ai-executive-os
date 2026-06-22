"use client";

import {
  DEPARTMENT_PRESETS,
  formatDepartmentCsv,
  parseDepartmentCsv,
} from "@/common/constants/departments";
import { cn } from "@/common/lib/utils";

export function DepartmentPresetPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const selected = new Set(parseDepartmentCsv(value));

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(formatDepartmentCsv([...next]));
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {DEPARTMENT_PRESETS.map((dept) => {
        const active = selected.has(dept.id);
        return (
          <button
            key={dept.id}
            type="button"
            onClick={() => toggle(dept.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-accent-blue bg-accent-blue/15 text-accent-blue"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
            )}
          >
            {dept.label}
          </button>
        );
      })}
    </div>
  );
}
