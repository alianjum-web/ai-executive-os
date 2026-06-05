import { API_TIMEOUT_MS, fetchWithTimeout, isApiUnreachableError } from "../fetch";

describe("fetchWithTimeout", () => {
  it("rejects with timeout message when request aborts", async () => {
    const fetchMock = jest.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
    global.fetch = fetchMock as typeof fetch;

    await expect(
      fetchWithTimeout("http://127.0.0.1:8000/api/v1/health", {}, 50)
    ).rejects.toThrow(/timed out/i);
  });
});

describe("isApiUnreachableError", () => {
  it("detects cannot reach API message", () => {
    expect(
      isApiUnreachableError(new Error("Cannot reach the API. Start the backend."))
    ).toBe(true);
  });

  it("detects timeout message", () => {
    expect(
      isApiUnreachableError(new Error(`Request timed out (${API_TIMEOUT_MS / 1000}s)`))
    ).toBe(true);
  });
});
