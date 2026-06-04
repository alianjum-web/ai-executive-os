"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/common/atoms/ui/button";
import { Input } from "@/common/atoms/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { ChatBubble } from "@/chat/molecules/ChatBubble";
import { useChat } from "@/chat/hooks/useChat";
import { AIProcessingBanner } from "@/common/molecules/AIProcessingBanner";
import { EmptyState } from "@/common/molecules/EmptyState";

export function ChatWindow() {
  const { messages, isStreaming, sendMessage } = useChat();
  const [input, setInput] = useState("");

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
  };

  return (
    <Card className="flex min-h-[min(640px,calc(100vh-12rem))] flex-col overflow-hidden">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-accent-blue" aria-hidden />
          Knowledge assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Grounded answers from your uploaded SOPs and policies
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
  );
}
