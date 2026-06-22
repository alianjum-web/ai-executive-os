"use client";

import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import type { Citation } from "@/common/api/client";
import {
  buildCitedPassages,
  citationKey,
  hasInlineCitationMarkers,
  parseAssistantContent,
  splitAnswerLines,
  splitBoldSpans,
  stripInlineCitationMarkers,
  type CitedPassage,
} from "@/chat/lib/parseAssistantContent";
import { cn } from "@/common/lib/utils";

function CitationMarker({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center gap-0.5 rounded-full px-1.5 align-baseline text-[10px] font-bold leading-none transition-colors",
        isActive
          ? "bg-accent-ai text-white"
          : "bg-accent-ai/20 text-accent-ai hover:bg-accent-ai/35",
        onClick && "cursor-pointer"
      )}
      title="View source"
      aria-label={`Source ${label}`}
    >
      <FileText className="h-2.5 w-2.5" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

/** Only the key term is bold + underlined + clickable — body text stays plain. */
function ClickableKeyTerm({
  term,
  citation,
  isActive,
  onSelectCitation,
}: {
  term: string;
  citation: Citation;
  isActive: boolean;
  onSelectCitation?: (citation: Citation) => void;
}) {
  const label = term.endsWith(":") ? term : term;
  return (
    <button
      type="button"
      onClick={() => onSelectCitation?.(citation)}
      className={cn(
        "inline cursor-pointer align-baseline font-bold text-foreground",
        "underline decoration-accent-ai decoration-2 underline-offset-[3px]",
        "hover:bg-accent-ai/10",
        isActive && "rounded-sm bg-accent-ai/15 ring-1 ring-accent-ai/40"
      )}
      title={`${citation.document_name}${
        citation.page_number != null ? ` · page ${citation.page_number}` : ""
      }`}
    >
      {label}
    </button>
  );
}

function PlainLineText({ text }: { text: string }) {
  return (
    <>
      {splitBoldSpans(text).map((span, i) =>
        span.bold ? (
          <strong key={i} className="font-bold text-foreground">
            {span.value}
          </strong>
        ) : (
          <span key={i}>{span.value}</span>
        )
      )}
    </>
  );
}

function CitedLineBody({
  text,
  citation,
  markerLabel,
  selectedKey,
  onSelectCitation,
}: {
  text: string;
  citation?: Citation;
  markerLabel?: string;
  selectedKey?: string | null;
  onSelectCitation?: (citation: Citation) => void;
}) {
  const displayText = stripInlineCitationMarkers(text);
  const isActive = citation && selectedKey === citationKey(citation);

  const spans = splitBoldSpans(displayText);
  const hasBold = spans.some((s) => s.bold);

  if (citation && hasBold) {
    return (
      <span className="inline">
        {spans.map((span, i) =>
          span.bold ? (
            <ClickableKeyTerm
              key={i}
              term={span.value}
              citation={citation}
              isActive={Boolean(isActive)}
              onSelectCitation={onSelectCitation}
            />
          ) : (
            <span key={i}>{span.value}</span>
          )
        )}
        {markerLabel ? (
          <CitationMarker
            label={markerLabel}
            isActive={Boolean(isActive)}
            onClick={() => onSelectCitation?.(citation)}
          />
        ) : null}
      </span>
    );
  }

  if (citation) {
    const colonMatch = displayText.match(/^([^:]{2,80}):\s*([\s\S]*)$/);
    if (colonMatch) {
      return (
        <span className="inline">
          <ClickableKeyTerm
            term={`${colonMatch[1]}:`}
            citation={citation}
            isActive={Boolean(isActive)}
            onSelectCitation={onSelectCitation}
          />
          <span>{colonMatch[2]}</span>
          {markerLabel ? (
            <CitationMarker
              label={markerLabel}
              isActive={Boolean(isActive)}
              onClick={() => onSelectCitation?.(citation)}
            />
          ) : null}
        </span>
      );
    }
  }

  return (
    <span className="inline">
      <PlainLineText text={displayText} />
      {citation && markerLabel ? (
        <CitationMarker
          label={markerLabel}
          isActive={Boolean(isActive)}
          onClick={() => onSelectCitation?.(citation)}
        />
      ) : null}
    </span>
  );
}

function CitedLineContent({
  text,
  citations,
  lineCitation,
  selectedKey,
  onSelectCitation,
}: {
  text: string;
  citations: Citation[];
  lineCitation?: Citation;
  selectedKey?: string | null;
  onSelectCitation?: (citation: Citation) => void;
}) {
  if (lineCitation && !hasInlineCitationMarkers(text)) {
    const label = String(
      lineCitation.citation_index ?? citations.indexOf(lineCitation) + 1
    );
    return (
      <CitedLineBody
        text={text}
        citation={lineCitation}
        markerLabel={label}
        selectedKey={selectedKey}
        onSelectCitation={onSelectCitation}
      />
    );
  }

  const passages = buildCitedPassages(text, citations);

  return (
    <>
      {passages.map((block, i) => {
        if ("type" in block && block.type === "plain") {
          return <PlainLineText key={i} text={block.text} />;
        }

        const passage = block as CitedPassage;
        if (!passage.text && passage.citation) {
          return (
            <CitationMarker
              key={i}
              label={passage.markerLabel}
              isActive={selectedKey === citationKey(passage.citation)}
              onClick={() => onSelectCitation?.(passage.citation!)}
            />
          );
        }

        return (
          <CitedLineBody
            key={i}
            text={passage.text}
            citation={passage.citation}
            markerLabel={passage.citation ? passage.markerLabel : undefined}
            selectedKey={selectedKey}
            onSelectCitation={onSelectCitation}
          />
        );
      })}
    </>
  );
}

export function AnswerWithCitations({
  content,
  citations = [],
  selectedKey,
  onSelectCitation,
}: {
  content: string;
  citations?: Citation[];
  selectedKey?: string | null;
  onSelectCitation?: (citation: Citation) => void;
}) {
  const { displayText } = parseAssistantContent(content);
  const lines = splitAnswerLines(displayText);

  const nodes: ReactNode[] = [];
  let bulletGroup: ReactNode[] = [];
  let bulletIndex = 0;

  const flushBullets = () => {
    if (bulletGroup.length) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="list-disc space-y-2.5 pl-5">
          {bulletGroup}
        </ul>
      );
      bulletGroup = [];
    }
  };

  for (const line of lines) {
    if (line.kind === "blank") {
      flushBullets();
      continue;
    }

    const lineCitation =
      line.kind === "bullet" ? citations[bulletIndex] : undefined;

    const body = (
      <CitedLineContent
        text={line.text}
        citations={citations}
        lineCitation={lineCitation}
        selectedKey={selectedKey}
        onSelectCitation={onSelectCitation}
      />
    );

    if (line.kind === "bullet") {
      bulletGroup.push(
        <li key={`li-${bulletIndex}`} className="leading-relaxed">
          {body}
        </li>
      );
      bulletIndex += 1;
      continue;
    }

    flushBullets();
    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-relaxed">
        {body}
      </p>
    );
  }
  flushBullets();

  return (
    <div className="space-y-2.5 text-sm text-card-foreground">{nodes}</div>
  );
}
