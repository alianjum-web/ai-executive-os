import {
  buildCitedPassages,
  parseAssistantContent,
  sanitizeDisplayText,
  segmentAnswerText,
  findCitationForSegment,
  splitAnswerLines,
  splitBoldSpans,
  hasInlineCitationMarkers,
  stripInlineCitationMarkers,
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

test("sanitizeDisplayText strips leaked chunk headers", () => {
  const raw =
    "Based on the available documents: [Chunk 1]\ndocument_name: a.pdf\ndocument_id: x\npage_number: 2\nchunk_id: y\n---\nSecret body text.";
  expect(sanitizeDisplayText(raw)).toBe("Secret body text.");
});

test("buildCitedPassages groups text before markers", () => {
  const citations = [
    {
      document_name: "x.pdf",
      page_number: 2,
      citation_index: 1,
      chunk_text: "Growth was strong",
    },
  ];
  const passages = buildCitedPassages(
    "Growth was strong [Source: x.pdf, Page: 2] overall.",
    citations
  );
  expect(passages.some((p) => "text" in p && p.text === "Growth was strong")).toBe(
    true
  );
});

test("splitAnswerLines detects markdown bullets", () => {
  const lines = splitAnswerLines("- **Project:** Intake bot [Source: a.pdf, Page: 1]");
  expect(lines[0]).toEqual({
    kind: "bullet",
    text: "**Project:** Intake bot [Source: a.pdf, Page: 1]",
  });
});

test("splitBoldSpans parses bold markers", () => {
  expect(splitBoldSpans("**Project:** details")).toEqual([
    { bold: true, value: "Project:" },
    { bold: false, value: " details" },
  ]);
});

test("stripInlineCitationMarkers removes source tokens", () => {
  expect(
    stripInlineCitationMarkers(
      "**Project:** Intake bot [Source: a.pdf, Page: 1]"
    )
  ).toBe("**Project:** Intake bot");
});

test("hasInlineCitationMarkers detects markers", () => {
  expect(hasInlineCitationMarkers("text [1]")).toBe(true);
  expect(hasInlineCitationMarkers("**Project:** Intake bot")).toBe(false);
});
