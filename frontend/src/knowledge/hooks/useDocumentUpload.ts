"use client";

import { useCallback, useRef } from "react";
import { documentsPolling } from "@/common/config/polling.config";
import { useVisibilityPolling } from "@/common/hooks/useVisibilityPolling";
import { isApiUnreachableError } from "@/common/api/fetch";
import { listDocuments, uploadDocument } from "@/common/api/client";
import { isDocumentProcessing, type DocumentRecord } from "@/common/types";
import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import {
  clearDocumentsFetchError,
  finishDocumentsLoading,
  setDocuments,
  setDocumentsFetchError,
  setDocumentsLoading,
  setUploadError,
  setUploading,
} from "@/knowledge/state/knowledgeSlice";

function documentsFingerprint(docs: DocumentRecord[]): string {
  return docs.map((d) => `${d.id}:${d.status}`).join("|");
}

export function useDocumentUpload() {
  const dispatch = useAppDispatch();
  const documents = useAppSelector((s) => s.knowledge.documents);
  const isUploading = useAppSelector((s) => s.knowledge.isUploading);
  const isLoading = useAppSelector((s) => s.knowledge.isLoading);
  const error = useAppSelector((s) => s.knowledge.error);
  const apiUnreachable = useAppSelector((s) => s.knowledge.apiUnreachable);
  const lastFingerprint = useRef("");
  const showLoadingOnNextRefresh = useRef(true);

  const refresh = useCallback(
    async (options?: { background?: boolean }) => {
      const background = options?.background ?? false;
      if (!background && showLoadingOnNextRefresh.current) {
        showLoadingOnNextRefresh.current = false;
        dispatch(setDocumentsLoading(true));
      }
      try {
        const docs = await listDocuments();
        const fp = documentsFingerprint(docs);
        if (fp !== lastFingerprint.current) {
          lastFingerprint.current = fp;
          dispatch(setDocuments(docs));
        } else {
          dispatch(clearDocumentsFetchError());
          dispatch(finishDocumentsLoading());
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load documents";
        dispatch(
          setDocumentsFetchError({
            error: message,
            apiUnreachable: isApiUnreachableError(e),
          })
        );
      } finally {
        dispatch(finishDocumentsLoading());
      }
    },
    [dispatch]
  );

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
    async (
      file: File,
      options?: { allowedDepartments?: string; allowedRoles?: string }
    ) => {
      dispatch(setUploading(true));
      dispatch(clearDocumentsFetchError());
      try {
        await uploadDocument(file, options);
        await refresh({ background: true });
      } catch (e) {
        dispatch(
          setUploadError(e instanceof Error ? e.message : "Upload failed")
        );
      } finally {
        dispatch(setUploading(false));
      }
    },
    [dispatch, refresh]
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
