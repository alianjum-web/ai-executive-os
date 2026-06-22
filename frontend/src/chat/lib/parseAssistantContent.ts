import type { Citation } from "@/common/types";

const METADATA_BLOCK = /```json-metadata\s*([\s\S]*?)\s*```\s*$/i;
const CHUNK_HEADER_LEAK =
  /\[Chunk\s+\d+\]\s*document_name:[\s\S]*?(?:\n---\n|$)/gi;
const FALLBACK_PREFIX = /^Based on the available documents:\s*/i;

export type ParsedMetadataCitation = {
  id?: number;
  document_name: string;
  page_number: number | null;
  chunk_id?: string;
  exact_quote_highlight?: string;
};

export function sanitizeDisplayText(text: string): string {
  let cleaned = text.replace(FALLBACK_PREFIX, "").trim();
  cleaned = cleaned.replace(CHUNK_HEADER_LEAK, "");
  cleaned = cleaned.replace(
    /document_name:\s*[^\n]+\n(?:(?:document_id|page_number|chunk_id):\s*[^\n]+\n)*/gi,
    ""
  );
  cleaned = cleaned.replace(/\.{3,}(?=\s|\[|$)/g, ".");
  cleaned = cleaned.replace(/…/g, "");
  return cleaned.trim();
}

export function parseAssistantContent(raw: string): {
  displayText: string;
  metadataCitations: ParsedMetadataCitation[];
} {
  const trimmed = raw.trim();
  const match = METADATA_BLOCK.exec(trimmed);
  if (!match) {
    return { displayText: sanitizeDisplayText(trimmed), metadataCitations: [] };
  }
  const displayText = sanitizeDisplayText(trimmed.slice(0, match.index).trimEnd());
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

export type CitedPassage = {
  text: string;
  citation?: Citation;
  markerLabel: string;
};

/** Groups text before each inline marker into a clickable cited passage. */
export function buildCitedPassages(
  text: string,
  citations: Citation[]
): Array<CitedPassage | { type: "plain"; text: string }> {
  const segments = segmentAnswerText(text);
  const result: Array<CitedPassage | { type: "plain"; text: string }> = [];
  let pendingText = "";

  const flushPlain = () => {
    if (pendingText) {
      result.push({ type: "plain", text: pendingText });
      pendingText = "";
    }
  };

  for (const seg of segments) {
    if (seg.type === "text") {
      pendingText += seg.value;
      continue;
    }

    const matched = findCitationForSegment(citations, seg);
    const citedText = pendingText.replace(/\s+$/, "");
    pendingText = "";

    if (!citedText) {
      if (matched) {
        result.push({
          text: "",
          citation: matched,
          markerLabel:
            seg.type === "numeric"
              ? String(seg.index)
              : String(matched.citation_index ?? seg.pageNumber ?? "?"),
        });
      }
      continue;
    }

    const markerLabel =
      seg.type === "numeric"
        ? String(seg.index)
        : String(
            matched?.citation_index ??
              (matched ? citations.indexOf(matched) + 1 : null) ??
              seg.pageNumber ??
              "?"
          );

    result.push({
      text: citedText,
      citation: matched,
      markerLabel,
    });
  }

  flushPlain();
  return result.length ? result : [{ type: "plain", text }];
}

export type AnswerLine = {
  kind: "bullet" | "paragraph" | "blank";
  text: string;
};

/** Split answer into renderable lines (bullets vs paragraphs). */
export function splitAnswerLines(text: string): AnswerLine[] {
  const lines = text.split("\n");
  const result: AnswerLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push({ kind: "blank", text: "" });
      continue;
    }
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      result.push({ kind: "bullet", text: bulletMatch[1] });
      continue;
    }
    result.push({ kind: "paragraph", text: trimmed });
  }
  return result;
}

const BOLD_RE = /\*\*([^*]+)\*\*/g;

/** Split a string into plain and **bold** spans. */
export function splitBoldSpans(
  text: string
): Array<{ bold: boolean; value: string }> {
  const spans: Array<{ bold: boolean; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  BOLD_RE.lastIndex = 0;

  while ((match = BOLD_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ bold: false, value: text.slice(lastIndex, match.index) });
    }
    spans.push({ bold: true, value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    spans.push({ bold: false, value: text.slice(lastIndex) });
  }
  return spans.length ? spans : [{ bold: false, value: text }];
}

const INLINE_CITATION_RE =
  /\[Source:\s*[^,\]]+?\s*,\s*Page:\s*(\d+|\?)\]|\[\d+\]/gi;

export function hasInlineCitationMarkers(text: string): boolean {
  return /\[Source:\s*[^,\]]+?\s*,\s*Page:\s*(\d+|\?)\]|\[\d+\]/i.test(text);
}

export function stripInlineCitationMarkers(text: string): string {
  return text.replace(INLINE_CITATION_RE, "").replace(/\s{2,}/g, " ").trim();
}
