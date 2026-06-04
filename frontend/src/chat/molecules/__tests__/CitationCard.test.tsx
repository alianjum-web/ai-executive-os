import { render, screen } from "@testing-library/react";
import { CitationCard } from "../CitationCard";

test("renders document name, page, and chunk text", () => {
  render(
    <CitationCard
      citation={{
        document_name: "handbook.pdf",
        page_number: 3,
        chunk_text: "Employees receive 20 days of paid time off.",
        chunk_id: "abc",
      }}
    />
  );
  expect(screen.getByText("handbook.pdf")).toBeInTheDocument();
  expect(screen.getByText("Page 3")).toBeInTheDocument();
  expect(
    screen.getByText("Employees receive 20 days of paid time off.")
  ).toBeInTheDocument();
});
