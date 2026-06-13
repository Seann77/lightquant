import { readFileSync } from "fs";
import path from "path";
import type { ReactNode } from "react";

type LegalDocumentPageProps = {
  fileName: string;
};

type MarkdownBlock =
  | {
      type: "h1" | "h2" | "p";
      text: string;
    }
  | {
      type: "ul";
      items: string[];
    };

export function LegalDocumentPage({ fileName }: LegalDocumentPageProps) {
  const markdown = readFileSync(path.join(process.cwd(), "docs", "legal", fileName), "utf8");

  return (
    <article className="lq-legal-page">
      <div className="lq-legal-doc">{renderMarkdown(markdown)}</div>
    </article>
  );
}

function renderMarkdown(markdown: string) {
  return parseMarkdown(markdown).map((block, index) => {
    if (block.type === "h1") {
      return <h1 key={index}>{renderInline(block.text)}</h1>;
    }

    if (block.type === "h2") {
      return <h2 key={index}>{renderInline(block.text)}</h2>;
    }

    if (block.type === "ul") {
      return (
        <ul key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }

    return <p key={index}>{renderInline(block.text)}</p>;
  });
}

function parseMarkdown(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({
        type: "p",
        text: paragraphLines.join(" ")
      });
      paragraphLines.length = 0;
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({
        type: "ul",
        items: [...listItems]
      });
      listItems.length = 0;
    }
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "h1",
        text: line.slice(2).trim()
      });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "h2",
        text: line.slice(3).trim()
      });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g).filter(Boolean);
  const nodes: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(<code key={index}>{part.slice(1, -1)}</code>);
      return;
    }

    nodes.push(part);
  });

  return nodes;
}
