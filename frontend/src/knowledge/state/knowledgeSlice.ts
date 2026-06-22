import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DocumentRecord } from "@/common/types";
import {
  applyFetchError,
  applyFetchSuccess,
  initialAsyncFetch,
} from "@/common/state/asyncResource";

export type KnowledgeState = {
  documents: DocumentRecord[];
  isUploading: boolean;
} & typeof initialAsyncFetch;

const initialState: KnowledgeState = {
  documents: [],
  isUploading: false,
  ...initialAsyncFetch,
  isLoading: true,
};

const knowledgeSlice = createSlice({
  name: "knowledge",
  initialState,
  reducers: {
    setDocumentsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setDocuments(state, action: PayloadAction<DocumentRecord[]>) {
      state.documents = action.payload;
      applyFetchSuccess(state);
    },
    clearDocumentsFetchError(state) {
      state.error = null;
      state.apiUnreachable = false;
    },
    setDocumentsFetchError(
      state,
      action: PayloadAction<{ error: string; apiUnreachable?: boolean }>
    ) {
      applyFetchError(
        state,
        action.payload.error,
        action.payload.apiUnreachable ?? false
      );
    },
    finishDocumentsLoading(state) {
      state.isLoading = false;
    },
    setUploading(state, action: PayloadAction<boolean>) {
      state.isUploading = action.payload;
    },
    setUploadError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    resetKnowledge() {
      return initialState;
    },
  },
});

export const {
  setDocumentsLoading,
  setDocuments,
  clearDocumentsFetchError,
  setDocumentsFetchError,
  finishDocumentsLoading,
  setUploading,
  setUploadError,
  resetKnowledge,
} = knowledgeSlice.actions;
export default knowledgeSlice.reducer;
