import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Citation } from "@/common/api/client";
import type { RetrievalTrace } from "@/common/types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence_score?: number | null;
  escalated?: boolean;
  escalation_ticket_id?: string | null;
  query_log_id?: string | null;
  retrieval_trace?: RetrievalTrace | null;
};

type ChatState = {
  messages: ChatMessage[];
  isStreaming: boolean;
  input: string;
  selectedCitation: Citation | null;
  sourcesPanelOpen: boolean;
};

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  input: "",
  selectedCitation: null,
  sourcesPanelOpen: true,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    setStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
    },
    updateAssistantMessage(
      state,
      action: PayloadAction<{
        id: string;
        content: string;
        citations?: ChatMessage["citations"];
        confidence_score?: number | null;
        escalated?: boolean;
        escalation_ticket_id?: string | null;
        query_log_id?: string | null;
        retrieval_trace?: RetrievalTrace | null;
      }>
    ) {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        msg.content = action.payload.content;
        if (action.payload.citations) {
          msg.citations = action.payload.citations;
        }
        if (action.payload.confidence_score !== undefined) {
          msg.confidence_score = action.payload.confidence_score;
        }
        if (action.payload.escalated !== undefined) {
          msg.escalated = action.payload.escalated;
        }
        if (action.payload.escalation_ticket_id !== undefined) {
          msg.escalation_ticket_id = action.payload.escalation_ticket_id;
        }
        if (action.payload.query_log_id !== undefined) {
          msg.query_log_id = action.payload.query_log_id;
        }
        if (action.payload.retrieval_trace !== undefined) {
          msg.retrieval_trace = action.payload.retrieval_trace;
        }
      }
    },
    setChatInput(state, action: PayloadAction<string>) {
      state.input = action.payload;
    },
    setSelectedCitation(state, action: PayloadAction<Citation | null>) {
      state.selectedCitation = action.payload;
    },
    setSourcesPanelOpen(state, action: PayloadAction<boolean>) {
      state.sourcesPanelOpen = action.payload;
    },
    clearChatComposer(state) {
      state.input = "";
      state.selectedCitation = null;
    },
  },
});

export const {
  addMessage,
  setStreaming,
  clearMessages,
  updateAssistantMessage,
  setChatInput,
  setSelectedCitation,
  setSourcesPanelOpen,
  clearChatComposer,
} = chatSlice.actions;
export default chatSlice.reducer;
