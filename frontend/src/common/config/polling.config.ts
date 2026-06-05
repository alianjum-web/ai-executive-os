/**
 * Client-side polling policy (cost-aware).
 *
 * Recommended pattern for live lists:
 * - useVisibilityPolling + these intervals (no raw setInterval)
 * - Pause when the browser tab is hidden
 * - Skip React updates when fingerprint unchanged
 * - Refresh immediately after user actions (upload, etc.)
 *
 * Future scale: replace polling with SSE/WebSockets for push updates.
 */

export const POLL = {
  /** Default steady interval while a page is open and visible */
  STEADY_MS: 30_000,
  /** Shorter interval right after opening a page that expects fresh data */
  FAST_MS: 12_000,
  /** How long FAST_MS applies after mount */
  FAST_WINDOW_MS: 120_000,
  /** While background work is still running (e.g. document processing) */
  ACTIVE_MS: 10_000,
  /** Analytics / dashboards — data changes slowly */
  ANALYTICS_STEADY_MS: 60_000,
  ANALYTICS_FAST_MS: 30_000,
  ANALYTICS_FAST_WINDOW_MS: 60_000,
} as const;

/** Tasks / Slack ticket feed */
export const ticketsPolling = {
  intervalMs: POLL.STEADY_MS,
  fastIntervalMs: POLL.FAST_MS,
  fastDurationMs: POLL.FAST_WINDOW_MS,
} as const;

/** Knowledge documents (speeds up while pending/processing) */
export const documentsPolling = {
  intervalMs: POLL.STEADY_MS,
  fastIntervalMs: POLL.FAST_MS,
  fastDurationMs: POLL.FAST_WINDOW_MS,
  activeIntervalMs: POLL.ACTIVE_MS,
} as const;

/** Command center analytics cards */
export const analyticsPolling = {
  intervalMs: POLL.ANALYTICS_STEADY_MS,
  fastIntervalMs: POLL.ANALYTICS_FAST_MS,
  fastDurationMs: POLL.ANALYTICS_FAST_WINDOW_MS,
} as const;
