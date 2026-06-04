"use client";

import { useCallback, useState } from "react";
import { listDocuments, uploadDocument, type DocumentRecord } from "@/common/services/api/client";

export function useDocumentUpload() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
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

  return { documents, isUploading, isLoading, error, upload, refresh };
}
