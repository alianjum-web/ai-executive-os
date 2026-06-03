"use client";

import { useCallback } from "react";
import { queryKnowledgeStream } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMessage,
  setStreaming,
  type ChatMessage,
} from "@/store/slices/chatSlice";

export function useChat() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.chat.messages);
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      dispatch(addMessage(userMsg));
      dispatch(setStreaming(true));

      const assistantId = crypto.randomUUID();
      let answer = "";

      try {
        const result = await queryKnowledgeStream(text, (chunk) => {
          answer = chunk;
        });
        dispatch(
          addMessage({
            id: assistantId,
            role: "assistant",
            content: result.answer || answer,
            citations: result.citations,
          })
        );
      } catch (err) {
        dispatch(
          addMessage({
            id: assistantId,
            role: "assistant",
            content:
              err instanceof Error ? err.message : "Failed to get a response.",
          })
        );
      } finally {
        dispatch(setStreaming(false));
      }
    },
    [dispatch]
  );

  return { messages, isStreaming, sendMessage };
}
