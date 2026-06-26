import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/common/atoms/ui/badge";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";

export function AgentContent() {
  const knowledge = useFeatureFlag("KNOWLEDGE_AGENT_ENABLED");
  const project = useFeatureFlag("PROJECT_AGENT_ENABLED");

  const agents = [
    {
      name: "Knowledge Agent",
      status: knowledge ? "ready" : "off",
      detail: knowledge
        ? "Ready to answer from your document index"
        : "Disabled by feature flag",
    },
    {
      name: "Project Agent",
      status: project ? "ready" : "off",
      detail: project
        ? "Monitoring Slack for routing tasks"
        : "Disabled by feature flag",
    },
  ];
  
  return (
    <div>
      {agents.map((agent) => (
        <div
          key={agent.name}
          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{agent.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {agent.detail}
            </p>
          </div>
          {agent.status === "ready" ? (
            <Badge variant="success" className="shrink-0 gap-1">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Ready
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              Off
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
