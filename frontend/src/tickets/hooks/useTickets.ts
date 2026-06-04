"use client";

import { useCallback, useEffect, useState } from "react";
import { listTickets, type TicketRecord } from "@/common/services/api/client";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";

const POLL_MS = 5000;

export function useTickets() {
  const enabled = useFeatureFlag("PROJECT_AGENT_ENABLED");
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setTickets([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await listTickets();
      setTickets(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
    if (!enabled) return;
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh, enabled]);

  return { tickets, isLoading, error, refresh };
}
