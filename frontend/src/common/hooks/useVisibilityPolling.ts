"use client";

import { useEffect, useRef } from "react";

type UseVisibilityPollingOptions = {
  /** When false, no polling runs. */
  enabled: boolean;
  onPoll: () => void | Promise<void>;
  /** Steady-state interval while the tab is visible (default 30s). */
  intervalMs?: number;
  /** Shorter interval right after mount (default 12s). */
  fastIntervalMs?: number;
  /** How long to use fastIntervalMs after mount (default 2 min). */
  fastDurationMs?: number;
  /** Stop polling when the browser tab is hidden (default true). */
  pauseWhenHidden?: boolean;
  /** Dynamic interval; overrides fast/steady when provided. */
  getIntervalMs?: () => number;
};

/**
 * Polls an API only while the tab is visible, with a slower steady interval
 * to reduce server load vs fixed 5s polling.
 *
 * Intervals: @/common/config/polling.config (ticketsPolling, documentsPolling, …)
 */
export function useVisibilityPolling({
  enabled,
  onPoll,
  intervalMs = 30_000,
  fastIntervalMs = 12_000,
  fastDurationMs = 120_000,
  pauseWhenHidden = true,
  getIntervalMs,
}: UseVisibilityPollingOptions) {
  const mountedAt = useRef(Date.now());
  const onPollRef = useRef(onPoll);
  const getIntervalMsRef = useRef(getIntervalMs);
  onPollRef.current = onPoll;
  getIntervalMsRef.current = getIntervalMs;

  useEffect(() => {
    if (!enabled) return;

    mountedAt.current = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const resolveInterval = () => {
      const dynamic = getIntervalMsRef.current;
      if (dynamic) return dynamic();
      const elapsed = Date.now() - mountedAt.current;
      return elapsed < fastDurationMs ? fastIntervalMs : intervalMs;
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      if (pauseWhenHidden && typeof document !== "undefined" && document.hidden) {
        return;
      }
      timer = setTimeout(() => {
        void Promise.resolve(onPollRef.current()).finally(schedule);
      }, resolveInterval());
    };

    const onVisible = () => {
      void Promise.resolve(onPollRef.current());
      schedule();
    };

    void Promise.resolve(onPollRef.current());
    schedule();

    if (pauseWhenHidden && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisible);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (pauseWhenHidden && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisible);
      }
    };
  }, [enabled, intervalMs, fastIntervalMs, fastDurationMs, pauseWhenHidden]);
}
