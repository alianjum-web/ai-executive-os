"use client";

import { useState } from "react";
import { Button } from "@/common/atoms/ui/button";
import { Input } from "@/common/atoms/ui/input";
import { DepartmentPresetPicker } from "@/knowledge/molecules/DepartmentPresetPicker";
import { updateDocumentAccess } from "@/common/api/client";
import type { DocumentRecord } from "@/common/types";

function formatScope(values: string[] | null | undefined): string {
  return values?.length ? values.join(", ") : "";
}

export function DocumentAccessEditor({
  document,
  onSaved,
}: {
  document: DocumentRecord;
  onSaved?: () => void;
}) {
  const [depts, setDepts] = useState(formatScope(document.allowed_departments));
  const [roles, setRoles] = useState(formatScope(document.allowed_roles));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const allowedDepartments = depts
        ? depts.split(",").map((d) => d.trim()).filter(Boolean)
        : null;
      const allowedRoles = roles
        ? roles.split(",").map((r) => r.trim()).filter(Boolean)
        : null;
      await updateDocumentAccess(document.id, {
        allowedDepartments: allowedDepartments?.length ? allowedDepartments : null,
        allowedRoles: allowedRoles?.length ? allowedRoles : null,
      });
      onSaved?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Department presets
        </p>
        <DepartmentPresetPicker value={depts} onChange={setDepts} />
      </div>
      <Input
        label="Departments"
        value={depts}
        onChange={(e) => setDepts(e.target.value)}
        placeholder="Leave empty for all departments"
      />
      <Input
        label="Roles"
        value={roles}
        onChange={(e) => setRoles(e.target.value)}
        placeholder="Leave empty for all roles"
      />
      <Button size="sm" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save access"}
      </Button>
    </div>
  );
}
