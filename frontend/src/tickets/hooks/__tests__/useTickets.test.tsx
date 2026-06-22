import { act, waitFor } from "@testing-library/react";
import { renderHookWithStore } from "@/common/store/test-utils";
import { useTickets } from "../useTickets";

jest.mock("@/common/api/client", () => ({
  listTickets: jest.fn(),
}));

import { listTickets } from "@/common/api/client";

const mockList = listTickets as jest.MockedFunction<typeof listTickets>;

describe("useTickets", () => {
  beforeEach(() => {
    mockList.mockReset();
  });

  it("finishes loading with empty tickets", async () => {
    mockList.mockResolvedValue([]);

    const { result } = renderHookWithStore(() => useTickets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tickets).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("surfaces API unreachable errors", async () => {
    mockList.mockRejectedValue(
      new Error(
        "Cannot reach the API. Start the backend (npm run dev or npm run prod in backend/)."
      )
    );

    const { result } = renderHookWithStore(() => useTickets());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.apiUnreachable).toBe(true);
    expect(result.current.error).toMatch(/cannot reach/i);
  });
});
