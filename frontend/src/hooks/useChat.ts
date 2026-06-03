"use client";

import { useCallback } from "react";
import { useQueryStream } from "@/hooks/useQueryStream";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMessage,
  setStreaming,
  updateAssistantMessage,
  type ChatMessage,
} from "@/store/slices/chatSlice";

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
          dispatch(
            updateAssistantMessage({
              id: assistantId,
              content: accumulated,
            })
          );
        });
        dispatch(
          updateAssistantMessage({
            id: assistantId,
            content: result.answer,
            citations: result.citations,
          })
        );
      } catch (err) {
        dispatch(
          updateAssistantMessage({
            id: assistantId,
            content:
              err instanceof Error ? err.message : "Failed to get a response.",
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
