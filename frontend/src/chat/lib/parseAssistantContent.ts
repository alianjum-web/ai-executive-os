import type { Citation } from "@/common/types";

const METADATA_BLOCK = /```json-metadata\s*([\s\S]*?)\s*```\s*$/i;

export type ParsedMetadataCitation = {
  id?: number;
  document_name: string;
  page_number: number | null;
  chunk_id?: string;
  exact_quote_highlight?: string;
};

export function parseAssistantContent(raw: string): {
  displayText: string;
  metadataCitations: ParsedMetadataCitation[];
} {
  const trimmed = raw.trim();
  const match = METADATA_BLOCK.exec(trimmed);
  if (!match) {
    return { displayText: trimmed, metadataCitations: [] };
  }
  const displayText = trimmed.slice(0, match.index).trimEnd();
  try {
    const payload = JSON.parse(match[1].trim()) as {
      citations?: ParsedMetadataCitation[];
    };
    return {
      displayText,
      metadataCitations: payload.citations ?? [],
    };
  } catch {
    return { displayText, metadataCitations: [] };
  }
}

/** Matches [Source: file.pdf, Page: 4] or [Source: file.pdf, Page: ?] */
export const SOURCE_INLINE_RE =
  /\[Source:\s*([^,\]]+?)\s*,\s*Page:\s*(\d+|\?)\]/gi;

/** Matches numeric chunk markers [1], [2], … */
export const NUMERIC_INLINE_RE = /\[(\d+)\]/g;

export type ContentSegment =
  | { type: "text"; value: string }
  | { type: "source"; documentName: string; pageNumber: number | null; raw: string }
  | { type: "numeric"; index: number; raw: string };

export function segmentAnswerText(text: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const combined =
    /\[Source:\s*([^,\]]+?)\s*,\s*Page:\s*(\d+|\?)\]|\[(\d+)\]/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (match[1] !== undefined) {
      const page = match[2] === "?" ? null : Number.parseInt(match[2], 10);
      segments.push({
        type: "source",
        documentName: match[1].trim(),
        pageNumber: page,
        raw,
      });
    } else if (match[3] !== undefined) {
      segments.push({
        type: "numeric",
        index: Number.parseInt(match[3], 10),
        raw,
      });
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments.length ? segments : [{ type: "text", value: text }];
}

export function citationKey(c: Pick<
  Citation,
  "document_id" | "document_name" | "page_number" | "citation_index" | "chunk_id"
>): string {
  return [
    c.chunk_id ?? "",
    c.document_id ?? "",
    c.document_name,
    c.page_number ?? "?",
    c.citation_index ?? "",
  ].join("|");
}

export function findCitationForSegment(
  citations: Citation[],
  segment: Extract<ContentSegment, { type: "source" } | { type: "numeric" }>
): Citation | undefined {
  if (segment.type === "numeric") {
    return citations.find((c) => c.citation_index === segment.index);
  }
  return citations.find(
    (c) =>
      c.document_name === segment.documentName &&
      (segment.pageNumber == null
        ? c.page_number == null
        : c.page_number === segment.pageNumber)
  );
}
