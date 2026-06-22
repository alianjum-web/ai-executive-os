"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Badge } from "@/common/atoms/Badge";
import { FileUploadCard } from "@/knowledge/molecules/FileUploadCard";
import { Button } from "@/common/atoms/ui/button";
import { Card } from "@/common/atoms/ui/card";
import { deleteDocument } from "@/common/api/client";
import { useDocumentUpload } from "@/knowledge/hooks/useDocumentUpload";
import { useRole } from "@/common/hooks/useRole";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { ErrorState } from "@/common/molecules/ErrorState";
import { EmptyState } from "@/common/molecules/EmptyState";
import { LoadingBlock } from "@/common/molecules/LoadingBlock";
import { DocumentAccessEditor } from "@/knowledge/molecules/DocumentAccessEditor";

export function DocumentLibrary() {
  const uploadEnabled = useFeatureFlag("DOCUMENT_UPLOAD_ENABLED");
  const rbacEnabled = useFeatureFlag("DOCUMENT_RBAC_ENABLED");
  const { isAdmin } = useRole();
  const [editingAccessId, setEditingAccessId] = useState<string | null>(null);
  const { documents, isUploading, error, apiUnreachable, upload, refresh, isLoading } =
    useDocumentUpload();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      if (!message.toLowerCase().includes("not found")) {
        console.warn("deleteDocument:", message);
      }
    } finally {
      setDeletingId(null);
      await refresh({ background: true });
    }
  };

  if (!uploadEnabled) return null;

  return (
    <div className="space-y-6">
      <FileUploadCard onUpload={upload} isUploading={isUploading} />
      {error ? <ErrorState message={error} onRetry={() => refresh()} /> : null}

      {isLoading && documents.length === 0 ? (
        <LoadingBlock rows={4} label="Loading documents" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload your first SOP or policy document to power the knowledge agent."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5 font-medium" scope="col">
                    Filename
                  </th>
                  <th className="px-4 py-3.5 font-medium" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3.5 font-medium" scope="col">
                    Uploaded
                  </th>
                  {rbacEnabled ? (
                    <th className="px-4 py-3.5 font-medium" scope="col">
                      Access
                    </th>
                  ) : null}
                  {isAdmin ? (
                    <th className="px-4 py-3.5 font-medium" scope="col">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-t border-border-subtle transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {doc.filename}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={doc.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                    {rbacEnabled ? (
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <div>
                          {doc.source_connector ? `${doc.source_connector} · ` : ""}
                          {doc.allowed_departments?.length
                            ? `dept: ${doc.allowed_departments.join(", ")}`
                            : "all depts"}
                          {" · "}
                          {doc.allowed_roles?.length
                            ? `roles: ${doc.allowed_roles.join(", ")}`
                            : "all roles"}
                        </div>
                        {isAdmin ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-7 px-2"
                              onClick={() =>
                                setEditingAccessId(
                                  editingAccessId === doc.id ? null : doc.id
                                )
                              }
                            >
                              {editingAccessId === doc.id ? "Close" : "Edit"}
                            </Button>
                            {editingAccessId === doc.id ? (
                              <DocumentAccessEditor
                                document={doc}
                                onSaved={() => {
                                  setEditingAccessId(null);
                                  void refresh({ background: true });
                                }}
                              />
                            ) : null}
                          </>
                        ) : null}
                      </td>
                    ) : null}
                    {isAdmin ? (
                      <td className="px-4 py-3.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === doc.id}
                          onClick={() => void handleDelete(doc.id)}
                        >
                          {deletingId === doc.id ? "Deleting…" : "Delete"}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
