"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isApiUnreachableError } from "@/common/api/fetch";
import { listTickets, type TicketRecord } from "@/common/api/client";
import { ticketsPolling } from "@/common/config/polling.config";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { useVisibilityPolling } from "@/common/hooks/useVisibilityPolling";

function normalizeTickets(data: TicketRecord[]): TicketRecord[] {
  const byId = new Map<string, TicketRecord>();
  for (const ticket of data) {
    byId.set(ticket.id, ticket);
  }
  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function ticketsFingerprint(data: TicketRecord[]): string {
  return data
    .map((t) => `${t.id}:${t.status}:${t.created_at}`)
    .join("|");
}

export function useTickets() {
  const enabled = useFeatureFlag("PROJECT_AGENT_ENABLED");
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const lastFingerprint = useRef("");
  const showLoadingOnNextRefresh = useRef(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (showLoadingOnNextRefresh.current) {
      showLoadingOnNextRefresh.current = false;
      setIsLoading(true);
    }
    try {
      const data = await listTickets();
      const normalized = normalizeTickets(data);
      const fp = ticketsFingerprint(normalized);
      if (fp !== lastFingerprint.current) {
        lastFingerprint.current = fp;
        setTickets(normalized);
      }
      setError(null);
      setApiUnreachable(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
      if (isApiUnreachableError(e)) setApiUnreachable(true);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    lastFingerprint.current = "";
    if (enabled) {
      showLoadingOnNextRefresh.current = true;
    } else {
      showLoadingOnNextRefresh.current = false;
    }
  }, [enabled]);

  useVisibilityPolling({
    enabled: enabled && !apiUnreachable,
    onPoll: refresh,
    ...ticketsPolling,
  });

  return {
    tickets: enabled ? tickets : [],
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
    apiUnreachable,
    refresh,
  };
}
