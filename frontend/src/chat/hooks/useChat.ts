"use client";

import { useCallback } from "react";
import { parseAssistantContent } from "@/chat/lib/parseAssistantContent";
import { useQueryStream } from "@/chat/hooks/useQueryStream";
import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import {
  addMessage,
  clearChatComposer,
  setChatInput,
  setSelectedCitation,
  setSourcesPanelOpen,
  setStreaming,
  updateAssistantMessage,
  type ChatMessage,
} from "@/chat/state/chatSlice";
import { escalateQueryToHuman, type Citation } from "@/common/api/client";

export function useChat() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.chat.messages);
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);
  const input = useAppSelector((s) => s.chat.input);
  const selectedCitation = useAppSelector((s) => s.chat.selectedCitation);
  const sourcesPanelOpen = useAppSelector((s) => s.chat.sourcesPanelOpen);
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
            confidence_score: result.confidence_score ?? null,
            escalated: result.escalated ?? false,
            escalation_ticket_id: result.escalation_ticket_id ?? null,
            query_log_id: result.query_log_id ?? null,
            retrieval_trace: result.retrieval_trace ?? null,
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

  const escalateMessage = useCallback(
    async (
      assistantId: string,
      userQuery: string,
      confidenceScore?: number | null
    ) => {
      const msg = messages.find((m) => m.id === assistantId);
      try {
        const result = await escalateQueryToHuman({
          query: userQuery,
          queryLogId: msg?.query_log_id ?? null,
          confidenceScore: confidenceScore ?? msg?.confidence_score ?? null,
          answerPreview: msg?.content ?? null,
        });
        dispatch(
          updateAssistantMessage({
            id: assistantId,
            content:
              msg?.content ??
              "Your question has been escalated to human support.",
            escalated: true,
            escalation_ticket_id: result.escalation_ticket_id,
          })
        );
      } catch (err) {
        dispatch(
          updateAssistantMessage({
            id: assistantId,
            content:
              (msg?.content ?? "") +
              "\n\n(Could not escalate: " +
              (err instanceof Error ? err.message : "unknown error") +
              ")",
          })
        );
      }
    },
    [dispatch, messages]
  );

  return {
    messages,
    isStreaming,
    input,
    selectedCitation,
    sourcesPanelOpen,
    setInput: (value: string) => dispatch(setChatInput(value)),
    setSelectedCitation: (citation: Citation | null) =>
      dispatch(setSelectedCitation(citation)),
    setSourcesPanelOpen: (open: boolean) => dispatch(setSourcesPanelOpen(open)),
    clearComposer: () => dispatch(clearChatComposer()),
    sendMessage,
    escalateMessage,
  };
}
