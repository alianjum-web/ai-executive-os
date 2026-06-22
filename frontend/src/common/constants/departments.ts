export const DEPARTMENT_PRESETS = [
  { id: "hr", label: "Human Resources" },
  { id: "engineering", label: "Engineering" },
  { id: "it", label: "IT" },
  { id: "support", label: "Support" },
  { id: "billing", label: "Billing" },
  { id: "product", label: "Product" },
] as const;

export function parseDepartmentCsv(value: string): string[] {
  return value
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function formatDepartmentCsv(ids: string[]): string {
  return ids.join(", ");
}
