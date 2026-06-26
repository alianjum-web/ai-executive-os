"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { AgentContent } from "@/dashboard/atoms/AgentContent";

export function AIStatusPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-ai" aria-hidden />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            What is AI doing?
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AgentContent />
      </CardContent>
    </Card>
  );
}
