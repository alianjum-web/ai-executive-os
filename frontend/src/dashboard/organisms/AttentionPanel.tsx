"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { Button } from "@/common/atoms/ui/button";
import { LoadingBlock } from "@/common/molecules/LoadingBlock";
import { useTickets } from "@/tickets/hooks/useTickets";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";

export function AttentionPanel() {
  const ticketsEnabled = useFeatureFlag("PROJECT_AGENT_ENABLED");
  const { tickets, isLoading, error } = useTickets();

  const approvalEnabled = useFeatureFlag("TICKET_APPROVAL_ENABLED");

  const openTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  ).length;

  const pendingApprovals = tickets.filter(
    (t) =>
      t.requires_approval &&
      (t.approval_status === "pending" ||
        t.approval_status === "pending_approval" ||
        t.status === "pending_approval")
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-accent-blue" aria-hidden />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            What needs attention?
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!ticketsEnabled ? (
          <p className="text-sm text-muted-foreground">
            Task routing is disabled. Enable PROJECT_AGENT to see incoming work.
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : isLoading ? (
          <LoadingBlock rows={2} label="Loading attention items" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                  <Inbox className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {openTickets}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active routing items
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tickets">
                  View
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {approvalEnabled && pendingApprovals > 0 ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {pendingApprovals} ticket{pendingApprovals === 1 ? "" : "s"}{" "}
                  awaiting approval
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review before Jira sync and assignee notification
                </p>
                <Button variant="secondary" size="sm" className="mt-3" asChild>
                  <Link href="/tickets">Review queue</Link>
                </Button>
              </div>
            ) : null}
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tickets yet — you&apos;re all caught up.
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
