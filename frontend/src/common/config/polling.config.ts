/**
 * Client-side polling policy — fast UX + low API cost.
 *
 * Macro: Slack/Celery writes tickets server-side; the browser only polls read APIs.
 * Intervals here balance freshness vs server load until SSE/WebSockets exist.
 *
 * Rules (use on every live list):
 * 1. useVisibilityPolling only (no raw setInterval)
 * 2. Pause when the browser tab is hidden (zero cost while away)
 * 3. Fingerprint responses — skip setState when data unchanged
 * 4. Fast interval only after mount or recent changes; steady when idle
 * 5. Refresh immediately after user actions (upload, etc.)
 *
 * Cost rough guide (one user, tab visible):
 * - Tickets steady: ~2 req/min | Tickets fast: ~12 req/min
 * - Analytics steady: ~1 req/min
 *
 * Future scale: SSE/WebSockets for push (fewer polls, same freshness).
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
  /** Keep polling fast briefly after the list last changed (Slack ingest) */
  RECENT_CHANGE_MS: 60_000,
  /** Analytics / dashboards — data changes slowly */
  ANALYTICS_STEADY_MS: 60_000,
  ANALYTICS_FAST_MS: 30_000,
  ANALYTICS_FAST_WINDOW_MS: 60_000,
} as const;

/**
 * Tasks / Slack tickets: 5s while waiting for new rows, 30s when idle.
 * useTickets passes getIntervalMs for post-change fast window.
 */
export const ticketsPolling = {
  intervalMs: POLL.STEADY_MS,
  fastIntervalMs: 5_000,
  fastDurationMs: POLL.FAST_WINDOW_MS,
  recentChangeMs: POLL.RECENT_CHANGE_MS,
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
