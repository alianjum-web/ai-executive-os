"use client";

import { useCallback } from "react";
import { parseAssistantContent } from "@/chat/lib/parseAssistantContent";
import { useQueryStream } from "@/chat/hooks/useQueryStream";
import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import {
  addMessage,
  setStreaming,
  updateAssistantMessage,
  type ChatMessage,
} from "@/chat/state/chatSlice";

export function useChat() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.chat.messages);
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);
  const { streamQuery } = useQueryStream();

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
      dispatch(
        addMessage({
          id: assistantId,
          role: "assistant",
          content: "",
          citations: [],
        })
      );

      try {
        const result = await streamQuery(text, (accumulated) => {
          const { displayText } = parseAssistantContent(accumulated);
          dispatch(
            updateAssistantMessage({
              id: assistantId,
              content: displayText,
            })
          );
        });
        const { displayText } = parseAssistantContent(result.answer);
        dispatch(
          updateAssistantMessage({
            id: assistantId,
            content: displayText,
            citations: result.citations,
          })
        );
      } catch (err) {
        const raw =
          err instanceof Error ? err.message : "Failed to get a response.";
        const content = raw.toLowerCase().includes("network")
          ? "Cannot reach the API. Start the backend: `cd backend && npm run prod` (port 8000), then retry."
          : raw;
        dispatch(
          updateAssistantMessage({
            id: assistantId,
            content,
          })
        );
      } finally {
        dispatch(setStreaming(false));
      }
    },
    [dispatch, streamQuery]
  );

  return { messages, isStreaming, sendMessage };
}
