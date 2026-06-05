import {
  parseAssistantContent,
  segmentAnswerText,
  findCitationForSegment,
} from "../parseAssistantContent";

test("strips json-metadata block from display text", () => {
  const raw =
    'Answer line [Source: a.pdf, Page: 1].\n\n```json-metadata\n{"citations":[]}\n```';
  const { displayText, metadataCitations } = parseAssistantContent(raw);
  expect(displayText).not.toContain("json-metadata");
  expect(displayText).toContain("[Source: a.pdf, Page: 1]");
  expect(metadataCitations).toEqual([]);
});

test("segments inline source markers", () => {
  const segments = segmentAnswerText("Growth was strong [Source: x.pdf, Page: 2] overall.");
  expect(segments.some((s) => s.type === "source")).toBe(true);
});

test("findCitationForSegment matches document and page", () => {
  const citations = [
    {
      document_name: "x.pdf",
      page_number: 2,
      chunk_text: "Growth was strong",
    },
  ];
  const seg = { type: "source" as const, documentName: "x.pdf", pageNumber: 2, raw: "" };
  expect(findCitationForSegment(citations, seg)?.document_name).toBe("x.pdf");
});
