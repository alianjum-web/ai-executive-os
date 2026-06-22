"use client";

import { useCallback, useEffect, useRef } from "react";
import { isApiUnreachableError } from "@/common/api/fetch";
import { listTickets, type TicketRecord } from "@/common/api/client";
import { ticketsPolling } from "@/common/config/polling.config";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";
import { useVisibilityPolling } from "@/common/hooks/useVisibilityPolling";
import { useAppDispatch, useAppSelector } from "@/common/store/hooks";
import {
  clearTicketsFetchError,
  finishTicketsLoading,
  setTickets,
  setTicketsFetchError,
  setTicketsLoading,
} from "@/tickets/state/ticketSlice";

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
  const dispatch = useAppDispatch();
  const enabled = useFeatureFlag("PROJECT_AGENT_ENABLED");
  const tickets = useAppSelector((s) => s.tickets.tickets);
  const isLoading = useAppSelector((s) => s.tickets.isLoading);
  const error = useAppSelector((s) => s.tickets.error);
  const apiUnreachable = useAppSelector((s) => s.tickets.apiUnreachable);
  const lastFingerprint = useRef("");
  const lastChangeAt = useRef(0);
  const mountedAt = useRef(0);
  const showLoadingOnNextRefresh = useRef(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (showLoadingOnNextRefresh.current) {
      showLoadingOnNextRefresh.current = false;
      dispatch(setTicketsLoading(true));
    }
    try {
      const data = await listTickets();
      const normalized = normalizeTickets(data);
      const fp = ticketsFingerprint(normalized);
      if (fp !== lastFingerprint.current) {
        lastFingerprint.current = fp;
        lastChangeAt.current = Date.now();
        dispatch(setTickets(normalized));
      } else {
        dispatch(clearTicketsFetchError());
        dispatch(finishTicketsLoading());
      }
    } catch (e) {
      dispatch(
        setTicketsFetchError({
          error: e instanceof Error ? e.message : "Failed to load tickets",
          apiUnreachable: isApiUnreachableError(e),
        })
      );
    } finally {
      dispatch(finishTicketsLoading());
    }
  }, [dispatch, enabled]);

  useEffect(() => {
    lastFingerprint.current = "";
    mountedAt.current = Date.now();
    if (enabled) {
      showLoadingOnNextRefresh.current = true;
      dispatch(setTicketsLoading(true));
    } else {
      showLoadingOnNextRefresh.current = false;
    }
  }, [dispatch, enabled]);

  const getIntervalMs = useCallback(() => {
    const now = Date.now();
    const onMountFast =
      now - mountedAt.current < ticketsPolling.fastDurationMs;
    const recentChange =
      lastChangeAt.current > 0 &&
      now - lastChangeAt.current < ticketsPolling.recentChangeMs;
    return onMountFast || recentChange
      ? ticketsPolling.fastIntervalMs
      : ticketsPolling.intervalMs;
  }, []);

  useVisibilityPolling({
    enabled: enabled && !apiUnreachable,
    onPoll: refresh,
    getIntervalMs,
  });

  return {
    tickets: enabled ? tickets : [],
    isLoading: enabled ? isLoading : false,
    error: enabled ? error : null,
    apiUnreachable,
    refresh,
  };
}
