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
    if (!enabled) return;
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
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      try {
        const data = await listTickets();
        if (!cancelled) {
          setTickets(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load tickets");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    const interval = setInterval(() => void refresh(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh, enabled]);

  return {
    tickets: enabled ? tickets : [],
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
    refresh,
  };
}
