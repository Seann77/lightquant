"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, ChevronDown, ChevronRight, LoaderCircle } from "lucide-react";
import { CopyableCodeBlock, InlineMarkdownText, isStrategyAnswerShortHeading } from "@/components/ai/WorkbenchResultViews";

export type AssistantThinkingStatus = "idle" | "thinking" | "answering" | "completed" | "failed";

type AssistantThinkingMessageProps = {
  thinking: string;
  finalAnswerMarkdown: string;
  status: AssistantThinkingStatus;
  error?: string | null;
  className?: string;
  tone?: "light" | "dark";
  defaultThinkingExpanded?: boolean;
  billingLabel?: string | null;
  billingWaived?: boolean;
  finalTitle?: string;
};

type ThinkingCollapseProps = {
  thinking: string;
  status: AssistantThinkingStatus;
  defaultExpanded?: boolean;
};

type StreamProps = {
  text: string;
  streaming?: boolean;
  billingLabel?: string | null;
  billingWaived?: boolean;
  title?: string;
};

type MarkdownBlock =
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "shortHeading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; code: string; language?: string };

export function AssistantThinkingMessage({
  thinking,
  finalAnswerMarkdown,
  status,
  error,
  className = "",
  tone = "light",
  defaultThinkingExpanded,
  billingLabel,
  billingWaived = false,
  finalTitle = "最终结果"
}: AssistantThinkingMessageProps) {
  const displayThinking = thinking.trim();
  const hasFinal = Boolean(finalAnswerMarkdown.trim());
  const hasError = Boolean(error);

  if (!displayThinking && !hasFinal && !hasError) {
    return null;
  }

  const messageClassName = [
    "lq-thinking-message",
    `is-${tone}`,
    `is-${status}`,
    displayThinking ? "has-thinking" : "has-no-thinking",
    hasFinal ? "has-final" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={messageClassName} aria-live="polite">
      {displayThinking ? (
        <>
          <div className="lq-thinking-message-mark">
            {status === "thinking" || status === "answering" ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Bot aria-hidden="true" />}
          </div>
          <div className="lq-thinking-message-body">
            <ThinkingCollapse defaultExpanded={defaultThinkingExpanded} status={status} thinking={displayThinking} />
          </div>
        </>
      ) : null}
      {hasFinal ? (
        <FinalAnswerStream billingLabel={billingLabel} billingWaived={billingWaived} streaming={status === "answering"} text={finalAnswerMarkdown} title={finalTitle} />
      ) : null}
      {error ? <div className="lq-thinking-error">{error}</div> : null}
    </div>
  );
}

export function ThinkingCollapse({ thinking, status, defaultExpanded }: ThinkingCollapseProps) {
  const completed = status === "completed" || status === "failed";
  const [expanded, setExpanded] = useState(defaultExpanded ?? !completed);
  const displayThinking = thinking.trim();
  const preview = getThinkingPreview(displayThinking);

  useEffect(() => {
    if (defaultExpanded !== undefined) {
      setExpanded(defaultExpanded);
      return;
    }

    setExpanded(!completed);
  }, [completed, defaultExpanded]);

  if (!displayThinking) {
    return null;
  }

  if (!completed) {
    return (
      <section className="lq-thinking-section">
        <ThinkingStream text={displayThinking} />
      </section>
    );
  }

  return (
    <section className="lq-thinking-section">
      <button className="lq-thinking-collapse-toggle" onClick={() => setExpanded((value) => !value)} type="button">
        {expanded ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
        <span>思考过程</span>
        <em>{expanded ? "收起" : "展开"}</em>
      </button>
      {expanded ? <ThinkingStream text={displayThinking} /> : <p className="lq-thinking-preview">{preview}</p>}
    </section>
  );
}

export function ThinkingStream({ text }: StreamProps) {
  if (!text) {
    return null;
  }

  return <pre className="lq-thinking-stream">{text}</pre>;
}

export function FinalAnswerStream({ text, streaming = false, billingLabel, billingWaived = false, title = "最终结果" }: StreamProps) {
  return (
    <section className="lq-final-section">
      <div className="lq-final-title">
        <span>{title}：</span>
        {streaming ? <em>正在输出</em> : null}
        {billingLabel ? (
          <span className={`lq-cost-tag ${billingWaived ? "is-waived" : ""}`.trim()}>{billingLabel}</span>
        ) : null}
      </div>
      {text.trim() ? <StreamingMarkdownResult markdown={text} /> : <div className="lq-final-placeholder">等待最终答案...</div>}
    </section>
  );
}

export function StreamingMarkdownResult({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(markdown), [markdown]);

  return (
    <div className="lq-streaming-markdown">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 2 ? "h2" : "h3";
          return <Heading key={`heading-${index}`}><InlineMarkdownText text={block.text} /></Heading>;
        }

        if (block.type === "shortHeading") {
          return <p className="lq-answer-short-heading" key={`short-heading-${index}`}><InlineMarkdownText text={block.text} /></p>;
        }

        if (block.type === "code") {
          return <CopyableCodeBlock code={block.code} key={`code-${index}`} language={block.language} />;
        }

        if (block.type === "list") {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}><InlineMarkdownText text={item} /></li>)}
            </ul>
          );
        }

        return <p key={`paragraph-${index}`}><InlineMarkdownText text={block.text} /></p>;
      })}
    </div>
  );
}

function getThinkingPreview(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.slice(0, 160) ?? "";
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: { language?: string; lines: string[] } | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: paragraph.join("\n").trim()
    });
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) {
      return;
    }

    blocks.push({
      type: "list",
      items: list
    });
    list = [];
  }

  for (const line of lines) {
    const fence = line.match(/^```([\w+-]*)\s*$/);

    if (fence) {
      if (code) {
        blocks.push({
          type: "code",
          code: code.lines.join("\n").trim(),
          language: code.language
        });
        code = null;
      } else {
        flushParagraph();
        flushList();
        code = {
          language: fence[1] || undefined,
          lines: []
        };
      }
      continue;
    }

    if (code) {
      code.lines.push(line);
      continue;
    }

    const heading = line.match(/^(##|###)\s+(.+?)\s*$/);

    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1] === "##" ? 2 : 3,
        text: heading[2]
      });
      continue;
    }

    if (isStrategyAnswerShortHeading(line)) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "shortHeading",
        text: line.trim()
      });
      continue;
    }

    const bullet = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+?)\s*$/);

    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  if (code) {
    blocks.push({
      type: "code",
      code: code.lines.join("\n").trim(),
      language: code.language
    });
  }

  flushParagraph();
  flushList();

  return blocks.length > 0 ? blocks : [{
    type: "paragraph",
    text: markdown
  }];
}
