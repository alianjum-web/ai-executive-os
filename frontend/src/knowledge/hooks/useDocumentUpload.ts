"use client";

import { useCallback, useRef, useState } from "react";
import { documentsPolling } from "@/common/config/polling.config";
import { useVisibilityPolling } from "@/common/hooks/useVisibilityPolling";
import { isApiUnreachableError } from "@/common/api/fetch";
import { listDocuments, uploadDocument } from "@/common/api/client";
import { isDocumentProcessing, type DocumentRecord } from "@/common/types";

function documentsFingerprint(docs: DocumentRecord[]): string {
  return docs.map((d) => `${d.id}:${d.status}`).join("|");
}

export function useDocumentUpload() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const lastFingerprint = useRef("");
  const showLoadingOnNextRefresh = useRef(true);

  const refresh = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;
    if (!background && showLoadingOnNextRefresh.current) {
      showLoadingOnNextRefresh.current = false;
      setIsLoading(true);
    }
    try {
      const docs = await listDocuments();
      const fp = documentsFingerprint(docs);
      if (fp !== lastFingerprint.current) {
        lastFingerprint.current = fp;
        setDocuments(docs);
      }
      setError(null);
      setApiUnreachable(false);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load documents";
      setError(message);
      if (isApiUnreachableError(e)) setApiUnreachable(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasProcessing = documents.some((d) => isDocumentProcessing(d.status));

  useVisibilityPolling({
    enabled: !apiUnreachable,
    onPoll: () => {
      void refresh({
        background: !showLoadingOnNextRefresh.current,
      });
    },
    intervalMs: documentsPolling.intervalMs,
    fastIntervalMs: documentsPolling.fastIntervalMs,
    fastDurationMs: documentsPolling.fastDurationMs,
    getIntervalMs: () =>
      hasProcessing
        ? documentsPolling.activeIntervalMs
        : documentsPolling.intervalMs,
  });

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        await uploadDocument(file);
        await refresh({ background: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [refresh]
  );

  return {
    documents,
    isUploading,
    isLoading,
    error,
    apiUnreachable,
    upload,
    refresh,
  };
}
