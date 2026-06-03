"use client";

import { useCallback, useState } from "react";
import { listDocuments, uploadDocument, type DocumentRecord } from "@/lib/api";

export function useDocumentUpload() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const docs = await listDocuments();
    setDocuments(docs);
  }, []);

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        await uploadDocument(file);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [refresh]
  );

  return { documents, isUploading, error, upload, refresh };
}
