"use client";

import { useCallback, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/common/atoms/ui/button";
import { Input } from "@/common/atoms/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { ChatBubble } from "@/chat/molecules/ChatBubble";
import { citationKey } from "@/chat/lib/parseAssistantContent";
import { SourcesPanel } from "@/chat/organisms/SourcesPanel";
import { useChat } from "@/chat/hooks/useChat";
import type { Citation } from "@/common/api/client";
import { AIProcessingBanner } from "@/common/molecules/AIProcessingBanner";
import { EmptyState } from "@/common/molecules/EmptyState";
import { cn } from "@/common/lib/utils";

export function ChatWindow() {
  const { messages, isStreaming, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const activeCitations = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.citations && m.citations.length > 0) {
        return m.citations;
      }
    }
    return [];
  }, [messages]);

  const handleSelectCitation = useCallback((c: Citation) => {
    setSelectedCitation(c);
    setPanelOpen(true);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setSelectedCitation(null);
    await sendMessage(text);
  };

  const showPanel = panelOpen && activeCitations.length > 0;

  return (
    <div
      className={cn(
        "flex min-h-[min(640px,calc(100vh-12rem))] flex-col overflow-hidden rounded-xl border border-border bg-card lg:flex-row"
      )}
    >
      <Card className="flex min-h-0 min-w-0 flex-1 flex-col rounded-none border-0 shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-accent-blue" aria-hidden />
            Knowledge assistant
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Grounded answers with inline sources — open the panel to preview PDFs
          </p>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
          {isStreaming ? (
            <AIProcessingBanner message="Generating a grounded response…" />
          ) : null}

          {messages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Start a conversation"
              description="Ask about onboarding, policies, or any topic covered in your knowledge base."
              className="flex-1"
            />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  citations={m.citations}
                  selectedCitationKey={
                    selectedCitation ? citationKey(selectedCitation) : null
                  }
                  onSelectCitation={
                    m.role === "assistant" ? handleSelectCitation : undefined
                  }
                />
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 border-t border-border bg-muted/30 p-4">
          <Input
            className="flex-1"
            placeholder="Ask about company policies…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            aria-label="Message"
          />
          <Button onClick={handleSend} isLoading={isStreaming}>
            Send
          </Button>
        </CardFooter>
      </Card>

      {showPanel ? (
        <SourcesPanel
          citations={activeCitations}
          selected={selectedCitation}
          onSelect={handleSelectCitation}
          onClose={() => setPanelOpen(false)}
          className="w-full lg:w-[min(420px,38vw)]"
        />
      ) : activeCitations.length > 0 ? (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="border-t border-border px-4 py-2 text-xs font-medium text-accent-ai hover:bg-muted/50 lg:border-l lg:border-t-0 lg:writing-mode-vertical"
        >
          Show {activeCitations.length} sources
        </button>
      ) : null}
    </div>
  );
}
