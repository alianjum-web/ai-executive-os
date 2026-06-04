import { Sparkles } from "lucide-react";
import { cn } from "@/common/lib/utils";

type AIProcessingBannerProps = {
  message?: string;
  className?: string;
};

export function AIProcessingBanner({
  message = "AI is working on your request…",
  className,
}: AIProcessingBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-accent-ai/25 bg-accent-ai/10 px-4 py-3 text-sm text-foreground",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Sparkles
        className="h-4 w-4 shrink-0 animate-pulse text-accent-ai"
        aria-hidden
      />
      <span>{message}</span>
    </div>
  );
}
