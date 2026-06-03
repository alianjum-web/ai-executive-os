import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Citation } from "@/lib/api";

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
  },
});

export const { addMessage, setStreaming, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
