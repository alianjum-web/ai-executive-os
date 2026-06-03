"use client";

import { useEffect } from "react";
import { Badge } from "@/components/atoms/Badge";
import { FileUploadCard } from "@/components/molecules/FileUploadCard";
import { Button } from "@/components/atoms/Button";
import { deleteDocument } from "@/lib/api";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { useRole } from "@/hooks/useRole";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export function DocumentLibrary() {
  const uploadEnabled = useFeatureFlag("DOCUMENT_UPLOAD_ENABLED");
  const { isAdmin } = useRole();
  const { documents, isUploading, error, upload, refresh } = useDocumentUpload();

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    await refresh();
  };

  useEffect(() => {
    refresh().catch(() => undefined);
    const interval = setInterval(() => refresh().catch(() => undefined), 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!uploadEnabled) return null;

  return (
    <div className="space-y-6">
      <FileUploadCard onUpload={upload} isUploading={isUploading} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Filename</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              {isAdmin ? <th className="px-4 py-3 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-zinc-500">
                  No documents yet. Upload your first SOP.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3">{doc.filename}</td>
                  <td className="px-4 py-3">
                    <Badge status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(doc.created_at).toLocaleString()}
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(doc.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
