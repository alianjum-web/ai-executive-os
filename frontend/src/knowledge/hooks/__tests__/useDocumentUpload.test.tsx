import { act } from "@testing-library/react";
import { renderHookWithStore } from "@/common/store/test-utils";
import { useDocumentUpload } from "../useDocumentUpload";

jest.mock("@/common/api/client", () => ({
  listDocuments: jest.fn(),
  uploadDocument: jest.fn(),
}));

import { listDocuments } from "@/common/api/client";

const mockList = listDocuments as jest.MockedFunction<typeof listDocuments>;

describe("useDocumentUpload", () => {
  beforeEach(() => {
    mockList.mockReset();
  });

  it("loads documents and clears loading", async () => {
    mockList.mockResolvedValue([
      {
        id: "1",
        filename: "a.pdf",
        status: "ready",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const { result } = renderHookWithStore(() => useDocumentUpload());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.documents).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.apiUnreachable).toBe(false);
  });

  it("marks api unreachable when backend is down", async () => {
    mockList.mockRejectedValue(
      new Error("Cannot reach the API. Start the backend (npm run dev or npm run prod in backend/).")
    );

    const { result } = renderHookWithStore(() => useDocumentUpload());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.apiUnreachable).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toMatch(/cannot reach/i);
  });
});
