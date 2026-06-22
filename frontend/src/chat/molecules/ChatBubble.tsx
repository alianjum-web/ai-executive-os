"use client";

import { useState } from "react";
import { AlertCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Citation } from "@/common/api/client";
import type { RetrievalTrace } from "@/common/types";
import { submitQueryFeedback } from "@/common/api/client";
import { AnswerWithCitations } from "@/chat/molecules/AnswerWithCitations";
import { RetrievalTracePanel } from "@/chat/molecules/RetrievalTracePanel";
import { Button } from "@/common/atoms/ui/button";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { cn } from "@/common/lib/utils";

export function ChatBubble({
  role,
  content,
  citations,
  confidenceScore,
  escalated,
  queryLogId,
  userQuery,
  selectedCitationKey,
  onSelectCitation,
  onEscalate,
  retrievalTrace,
}: {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidenceScore?: number | null;
  escalated?: boolean;
  queryLogId?: string | null;
  userQuery?: string;
  selectedCitationKey?: string | null;
  onSelectCitation?: (citation: Citation) => void;
  onEscalate?: () => void;
  retrievalTrace?: RetrievalTrace | null;
}) {
  const evaluationEnabled = useFeatureFlag("EVALUATION_DASHBOARD_ENABLED");
  const escalationEnabled = useFeatureFlag("CONFIDENCE_ESCALATION_ENABLED");
  const traceEnabled = useFeatureFlag("RETRIEVAL_TRACE_ENABLED");
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(
    null
  );
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [escalateBusy, setEscalateBusy] = useState(false);
  const isUser = role === "user";
  const lowConfidence =
    confidenceScore != null && confidenceScore < 0.45 && !escalated;

  const sendFeedback = async (value: "positive" | "negative") => {
    if (!queryLogId || feedbackBusy || feedback) return;
    setFeedbackBusy(true);
    try {
      await submitQueryFeedback(queryLogId, value);
      setFeedback(value);
    } finally {
      setFeedbackBusy(false);
    }
  };

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-[linear-gradient(135deg,var(--accent-blue)_0%,var(--accent-ai)_100%)] text-white shadow-md"
            : "border border-border bg-card text-card-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content || "…"}</p>
        ) : (
          <AnswerWithCitations
            content={content}
            citations={citations}
            selectedKey={selectedCitationKey}
            onSelectCitation={onSelectCitation}
          />
        )}
        {!isUser && confidenceScore != null ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Confidence</span>
              <span
                className={
                  lowConfidence || escalated
                    ? "font-medium text-warning"
                    : "font-medium text-foreground"
                }
              >
                {Math.round(confidenceScore * 100)}%
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(confidenceScore * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  lowConfidence || escalated
                    ? "bg-warning"
                    : "bg-accent-blue"
                )}
                style={{ width: `${Math.round(confidenceScore * 100)}%` }}
              />
            </div>
            {escalated ? (
              <p className="flex items-center gap-1 text-[11px] font-medium text-warning">
                <AlertCircle className="h-3 w-3" aria-hidden />
                Escalated to human support
              </p>
            ) : null}
            {escalationEnabled && lowConfidence && onEscalate && userQuery ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 text-xs"
                disabled={escalateBusy}
                onClick={() => {
                  setEscalateBusy(true);
                  onEscalate();
                  setEscalateBusy(false);
                }}
              >
                Request human help
              </Button>
            ) : null}
          </div>
        ) : null}
        {!isUser && evaluationEnabled && queryLogId ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Helpful?</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={feedbackBusy || !!feedback}
              aria-label="Thumbs up"
              onClick={() => void sendFeedback("positive")}
            >
              <ThumbsUp
                className={cn(
                  "h-3.5 w-3.5",
                  feedback === "positive" && "text-accent-blue"
                )}
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={feedbackBusy || !!feedback}
              aria-label="Thumbs down"
              onClick={() => void sendFeedback("negative")}
            >
              <ThumbsDown
                className={cn(
                  "h-3.5 w-3.5",
                  feedback === "negative" && "text-warning"
                )}
              />
            </Button>
            {feedback ? (
              <span className="text-[11px] text-muted-foreground">Thanks</span>
            ) : null}
          </div>
        ) : null}
        {!isUser && traceEnabled && retrievalTrace ? (
          <RetrievalTracePanel trace={retrievalTrace} />
        ) : null}
        {!isUser && citations && citations.length > 0 ? (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Click a <span className="font-bold underline">bold key term</span> or
            source icon to open references — use{" "}
            <span className="font-medium text-foreground">✕</span> to close
          </p>
        ) : null}
      </div>
    </div>
  );
}
