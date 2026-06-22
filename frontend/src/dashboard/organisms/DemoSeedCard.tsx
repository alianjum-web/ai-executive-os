"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/common/atoms/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { seedDemoTenant } from "@/common/api/client";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { useRole } from "@/common/hooks/useRole";

export function DemoSeedCard({ onSeeded }: { onSeeded?: () => void }) {
  const enabled = useFeatureFlag("DEMO_TENANT_ENABLED");
  const { isAdmin } = useRole();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!enabled || !isAdmin) return null;

  const runSeed = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await seedDemoTenant();
      setMessage(result.message);
      onSeeded?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Demo seed failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-accent-ai/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-ai" aria-hidden />
          <CardTitle className="text-base">One-click demo tenant</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Load sample SOPs, queries, and tickets for an instant client demo
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button disabled={busy} onClick={() => void runSeed()}>
          {busy ? "Seeding…" : "Seed demo data"}
        </Button>
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
