import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Citation } from "@/common/services/api/client";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

type ChatState = {
  messages: ChatMessage[];
  isStreaming: boolean;
};

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
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
      }>
    ) {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        msg.content = action.payload.content;
        if (action.payload.citations) {
          msg.citations = action.payload.citations;
        }
      }
    },
  },
});

export const { addMessage, setStreaming, clearMessages, updateAssistantMessage } =
  chatSlice.actions;
export default chatSlice.reducer;
