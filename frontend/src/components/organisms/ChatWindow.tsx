"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { ChatBubble } from "@/components/molecules/ChatBubble";
import { useChat } from "@/hooks/useChat";

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
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Ask a question about your uploaded SOPs and policies.
          </p>
        ) : (
          messages.map((m) => (
            <ChatBubble
              key={m.id}
              role={m.role}
              content={m.content}
              citations={m.citations}
            />
          ))
        )}
      </div>
      <div className="flex gap-2 border-t border-zinc-200 p-4">
        <Input
          className="flex-1"
          placeholder="Ask about company policies..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend} isLoading={isStreaming}>
          Send
        </Button>
      </div>
    </div>
  );
}
