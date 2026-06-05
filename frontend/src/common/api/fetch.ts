/** Shared fetch helpers — timeouts so loading UI cannot hang indefinitely. */

export const API_TIMEOUT_MS = 15_000;

export function isApiUnreachableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("cannot reach the api") ||
    msg.includes("timed out") ||
    msg.includes("failed to fetch") ||
    msg.includes("network")
  );
}

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const parent = init?.signal;
  if (parent) {
    if (parent.aborted) {
      controller.abort();
    } else {
      parent.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        `Request timed out (${timeoutMs / 1000}s). Check that the API is running and NEXT_PUBLIC_API_URL is correct.`
      );
    }
    if (e instanceof TypeError) {
      throw new Error(
        "Cannot reach the API. Start the backend (npm run dev or npm run prod in backend/)."
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
