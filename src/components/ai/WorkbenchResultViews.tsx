"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { AiTaskData } from "@/lib/ai/workbench-types";

export type ReportItem = {
  title: string;
  value: string;
  lines?: string[];
  evidence?: string;
};

export type CodeAnalysisReport = {
  overview: ReportItem[];
  tradingLogic: ReportItem[];
  keyParameters: ReportItem[];
  risks: ReportItem[];
  suggestions: ReportItem[];
};

const REPORT_MISSING_VALUE = "代码中未明确给出";

const CODE_ANALYSIS_REPORT_TITLES = {
  overview: ["策略名称", "平台识别", "策略类型", "交易范围", "核心思路", "运行频率", "无信号处理"],
  tradingLogic: ["初始化", "盘前/记录", "调仓时间", "数据读取", "信号生成", "目标标的形成", "买入逻辑", "卖出逻辑", "下单限制"],
  keyParameters: ["观察周期", "目标持仓数", "持仓权重", "最小交易金额", "止损线", "滑点", "交易费用", "最低佣金", "现金处理", "其他关键阈值"],
  risks: ["主题集中风险", "单标的集中风险", "无信号处理风险", "交易可达性风险", "流动性风险", "参数敏感性", "回测与实盘差异"],
  suggestions: ["信号计算可解释性", "止损独立运行", "交易可达性检查", "单票集中度控制", "日志可读性", "参数显式化", "回测验证"]
} as const;

export function StrategyResultView({
  result,
  task
}: {
  result: NonNullable<AiTaskData["result"]>;
  task: AiTaskData["task"] | null;
}) {
  const outOfScope = result.scopeStatus === "out_of_scope";

  return (
    <div className="lq-assistant-answer">
      <div className="lq-answer-head">
        <h2>{outOfScope ? "模块范围提示" : "策略生成结果"}</h2>
        {task ? <span className="lq-cost-tag">已扣除 {task.costPoints} 积分</span> : null}
      </div>
      {result.explanation ? <RichTextWithCodeBlocks content={result.explanation} textClassName="lq-answer-text" /> : null}
      {result.generatedCode ? <CopyableCodeBlock code={result.generatedCode} /> : null}
      {result.migrationNotes ? <RichTextWithCodeBlocks content={result.migrationNotes} textClassName="lq-answer-note" /> : null}
      {!outOfScope ? <p className="lq-answer-footnote">结果仅供研究和回测参考，实盘前请自行验证。</p> : null}
    </div>
  );
}

export function StrategyResultCard({ data }: { data: AiTaskData }) {
  const result = data.result;

  if (!result) {
    return null;
  }

  const outOfScope = result.scopeStatus === "out_of_scope";

  return (
    <div className="lq-result-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2>{outOfScope ? "模块范围提示" : "策略生成结果"}</h2>
        <span className="lq-cost-tag">已扣除 {data.task.costPoints} 积分</span>
      </div>
      {result.explanation ? <RichTextWithCodeBlocks content={result.explanation} textClassName="m-0 text-sm leading-7 text-[#5b6472]" /> : null}
      {result.generatedCode ? <CopyableCodeBlock code={result.generatedCode} /> : null}
      <p className="lq-answer-footnote">结果仅供研究和回测参考，实盘前请自行验证。</p>
    </div>
  );
}

export function CodeConversionResultView({
  activeTab,
  result
}: {
  activeTab: string;
  result: AiTaskData["result"] | undefined;
}) {
  const content = getCodeConversionTabContent(activeTab, result);
  const isCodeTab = isCodeConversionCodeTab(activeTab);

  if (!content) {
    return (
      <div className="lq-conversion-empty">
        {getCodeConversionEmptyMessage(activeTab)}
      </div>
    );
  }

  return (
    <pre className={`lq-conversion-pre ${isCodeTab ? "is-code" : "is-text"}`}>
      <code>{content}</code>
    </pre>
  );
}

export function getCodeConversionTabContent(tab: string, result: AiTaskData["result"] | undefined) {
  if (!result) {
    return "";
  }

  if (isCodeConversionMigrationTab(tab)) {
    return result.migrationNotes?.trim() ?? "";
  }

  if (isCodeConversionCodeTab(tab)) {
    return normalizeConversionCodeText(result.generatedCode ?? "");
  }

  return "";
}

export function parseCodeConversionMarkdown(markdown: string) {
  const source = markdown.trim();

  if (!source) {
    return {
      targetCode: "",
      migrationNotes: ""
    };
  }

  const jsonTargetCode = readJsonResultField(source, ["targetCode", "generatedCode", "code"]);
  const jsonMigrationNotes = readJsonResultField(source, ["migrationNotes", "notes"]);

  if (jsonTargetCode || jsonMigrationNotes) {
    return {
      targetCode: normalizeConversionCodeText(jsonTargetCode),
      migrationNotes: normalizeMigrationNotesText(jsonMigrationNotes)
    };
  }

  const sections = splitMarkdownSections(source);
  const codeSection = sections.find((section) => isCodeConversionCodeTab(section.title))?.content ?? "";
  const migrationSection = sections.find((section) => isCodeConversionMigrationTab(section.title))?.content ?? "";

  return {
    targetCode: normalizeConversionCodeText(sections.length > 0 ? codeSection : source),
    migrationNotes: normalizeMigrationNotesText(migrationSection)
  };
}

export function isCodeConversionCodeTab(tab: string) {
  return tab === "目标平台代码" || tab.includes("代码");
}

function isCodeConversionMigrationTab(tab: string) {
  return tab === "迁移说明" || tab.includes("迁移");
}

function getCodeConversionEmptyMessage(tab: string) {
  if (isCodeConversionCodeTab(tab)) {
    return "暂无目标平台代码。";
  }

  if (isCodeConversionMigrationTab(tab)) {
    return "暂无迁移说明。";
  }

  return "暂无内容。";
}

function splitMarkdownSections(markdown: string) {
  const headingPattern = /^##\s+(.+?)\s*$/gm;
  const headings: Array<{ title: string; index: number; end: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(markdown)) !== null) {
    headings.push({
      title: match[1].trim(),
      index: match.index,
      end: headingPattern.lastIndex
    });
  }

  if (headings.length === 0) {
    return [];
  }

  return headings.map((heading, index) => {
    const next = headings[index + 1];

    return {
      title: heading.title,
      content: markdown.slice(heading.end, next?.index ?? markdown.length).trim()
    };
  });
}

function normalizeConversionCodeText(value: string) {
  const jsonCode = readJsonResultField(value, ["targetCode", "generatedCode", "code"]);
  if (jsonCode) {
    return normalizeConversionCodeText(jsonCode);
  }

  const withoutJsonShell = stripJsonStringShell(value.trim());
  const decoded = decodeEscapedStringShell(withoutJsonShell);
  const fenced = extractFirstFencedCode(decoded);
  const code = fenced ? decodeEscapedStringShell(fenced) : decoded;

  return code
    .replace(/^##\s+.+$/gm, "")
    .replace(/^`{3,}[\w+-]*\s*$/gm, "")
    .replace(/^`{3,}\s*$/gm, "")
    .trim();
}

function normalizeMigrationNotesText(value: string) {
  const jsonNotes = readJsonResultField(value, ["migrationNotes", "notes"]);
  if (jsonNotes) {
    return normalizeMigrationNotesText(jsonNotes);
  }

  return decodeEscapedStringShell(stripJsonStringShell(value.trim()))
    .replace(/^##\s+.+$/gm, "")
    .replace(/^`{3,}[\w+-]*\s*$/gm, "")
    .replace(/^`{3,}\s*$/gm, "")
    .trim();
}

function extractFirstFencedCode(value: string) {
  const match = value.match(/```(?:[\w+-]+)?\s*\n([\s\S]*?)(?:\n```|$)/);

  return match?.[1]?.trim() ?? "";
}

function stripJsonStringShell(value: string) {
  const trimmed = value.trim();

  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      const parsed = JSON.parse(trimmed);

      if (typeof parsed === "string") {
        return parsed;
      }
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  return trimmed;
}

function decodeEscapedStringShell(value: string) {
  if (!/\\[nrti"']/.test(value)) {
    return value;
  }

  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, "\"")
    .replace(/\\'/g, "'");
}

function readJsonResultField(value: string, fieldNames: string[]) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    for (const fieldName of fieldNames) {
      const fieldValue = parsed[fieldName];

      if (typeof fieldValue === "string") {
        return fieldValue;
      }

      if (Array.isArray(fieldValue)) {
        return fieldValue.map((item) => String(item)).filter(Boolean).join("\n");
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function CodeAnalysisResultView({
  activeTab,
  report,
  result
}: {
  activeTab: string;
  report: Record<string, unknown> | null | undefined;
  result: NonNullable<AiTaskData["result"]>;
}) {
  const content = getCodeAnalysisTabContent(activeTab, report, result);

  return (
    <div className="lq-analysis-output app-scrollbar">
      <div className="lq-analysis-report-list">
        {content.map((item) => (
          <article className="lq-analysis-report-item" key={`${activeTab}-${item.title}`}>
            <h3>{item.title}</h3>
            <ReportItemBody item={item} />
            {item.evidence ? <small>{item.evidence}</small> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function ReportItemBody({ item }: { item: ReportItem }) {
  const lines = getReportItemLines(item);

  if (lines.length <= 1) {
    return <p>{lines[0] ?? REPORT_MISSING_VALUE}</p>;
  }

  return (
    <div className="lq-analysis-report-steps">
      {lines.map((line, index) => (
        <div className="lq-analysis-report-step" key={`${item.title}-${index}`}>
          <span aria-hidden="true">{index + 1}.</span>
          <p>{line}</p>
        </div>
      ))}
    </div>
  );
}

export function getCodeAnalysisTabContent(activeTab: string, report: Record<string, unknown> | null | undefined, result: NonNullable<AiTaskData["result"]>): ReportItem[] {
  const normalizedReport = normalizeCodeAnalysisReport(report, result);

  if (activeTab === "风险提醒" || activeTab.includes("风险")) {
    return normalizedReport.risks;
  }

  if (activeTab === "交易逻辑" || activeTab.includes("交易")) {
    return normalizedReport.tradingLogic;
  }

  if (activeTab === "关键参数" || activeTab.includes("参数")) {
    return normalizedReport.keyParameters;
  }

  if (activeTab === "优化建议" || activeTab.includes("优化")) {
    return normalizedReport.suggestions;
  }

  return normalizedReport.overview;
}

export function normalizeCodeAnalysisReport(report: Record<string, unknown> | null | undefined, result?: AiTaskData["result"] | null): CodeAnalysisReport {
  const overviewSource = pickReportSectionValue(
    [
      report?.overview,
      [report?.codeStructure, report?.platformDependencies],
      result?.explanation
    ],
    CODE_ANALYSIS_REPORT_TITLES.overview
  );
  const riskSource = pickReportSectionValue(
    [report?.risks, report?.riskWarnings, result?.riskWarnings],
    CODE_ANALYSIS_REPORT_TITLES.risks
  );

  return {
    overview: normalizeReportSection(overviewSource, CODE_ANALYSIS_REPORT_TITLES.overview),
    tradingLogic: normalizeReportSection(report?.tradingLogic, CODE_ANALYSIS_REPORT_TITLES.tradingLogic),
    keyParameters: normalizeReportSection(report?.keyParameters ?? report?.parameters, CODE_ANALYSIS_REPORT_TITLES.keyParameters),
    risks: normalizeReportSection(riskSource, CODE_ANALYSIS_REPORT_TITLES.risks),
    suggestions: normalizeReportSection(report?.suggestions ?? report?.optimizationSuggestions, CODE_ANALYSIS_REPORT_TITLES.suggestions)
  };
}

function normalizeReportSection(value: unknown, fixedTitles: readonly string[]) {
  const incomingItems = normalizeReportItems(value, fixedTitles);
  const fixedItems = fixedTitles.map((title) => ({
    title,
    value: REPORT_MISSING_VALUE,
    lines: [] as string[],
    evidence: ""
  }));
  const orphanLines: string[] = [];
  let lastMatchedIndex = -1;
  let hasMatchedItem = false;

  for (const item of incomingItems) {
    const matchIndex = fixedTitles.findIndex((title) => isSameReportTitle(item.title, title));
    const lines = getReportItemLines(item);
    const evidence = sanitizeReportText(item.evidence ?? "");

    if (matchIndex >= 0) {
      const current = fixedItems[matchIndex];
      const mergedLines = mergeReportLines(current.lines, lines);

      fixedItems[matchIndex] = {
        title: fixedTitles[matchIndex],
        value: mergedLines[0] || sanitizeReportText(item.value) || REPORT_MISSING_VALUE,
        lines: mergedLines,
        evidence: mergeReportEvidence(current.evidence, evidence)
      };
      lastMatchedIndex = matchIndex;
      hasMatchedItem = true;
      continue;
    }

    const inlineLines = formatReportSubItemLines(item);

    if (lastMatchedIndex >= 0) {
      const current = fixedItems[lastMatchedIndex];
      const mergedLines = mergeReportLines(current.lines, inlineLines);

      fixedItems[lastMatchedIndex] = {
        ...current,
        value: mergedLines[0] || current.value,
        lines: mergedLines,
        evidence: mergeReportEvidence(current.evidence, evidence)
      };
    } else {
      orphanLines.push(...inlineLines);
    }
  }

  if (!hasMatchedItem && orphanLines.length > 0) {
    return [
      ...fixedItems,
      {
        title: "补充说明",
        value: orphanLines[0] || REPORT_MISSING_VALUE,
        lines: uniqueReportLines(orphanLines),
        evidence: ""
      }
    ];
  }

  return fixedItems;
}

function normalizeReportItems(value: unknown, fixedTitles: readonly string[]): ReportItem[] {
  if (value === null || typeof value === "undefined") {
    return [];
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return splitReportText(String(value), fixedTitles);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeReportItems(item, fixedTitles));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const title = sanitizeReportText(readReportString(record.title));
    const itemValue = sanitizeReportText(readReportString(record.value));
    const lines = readReportLines(record.lines ?? record.details);
    const evidence = sanitizeReportText(readReportString(record.evidence));

    if (title || itemValue || lines.length || evidence) {
      return [{
        title: title || "补充说明",
        value: itemValue || lines[0] || REPORT_MISSING_VALUE,
        lines: lines.length ? lines : splitReportValueLines(itemValue),
        evidence
      }];
    }
  }

  return [];
}

function pickReportSectionValue(candidates: unknown[], fixedTitles: readonly string[]) {
  return candidates.find((candidate) => normalizeReportItems(candidate, fixedTitles).length > 0);
}

function splitReportText(value: string, fixedTitles: readonly string[]): ReportItem[] {
  const text = sanitizeReportText(value);

  if (!text) {
    return [];
  }

  const items: ReportItem[] = [];
  let current: ReportItem | null = null;
  const lines = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const fieldMatch = line.match(/^(?:[-*+]\s*)?(.{2,32}?)[\uFF1A:]\s*(.*)$/);
    const stepMatch = line.match(/^(?:(?:\d+|[A-Za-z])[\.)\u3001:]|[\(（]?[A-Za-z][\)）]|[一二三四五六七八九十]+[\u3001.])\s*(.+)$/);

    if (fieldMatch && !/^\d+[.)\u3001]/.test(fieldMatch[1])) {
      const title = sanitizeReportText(fieldMatch[1]);
      const firstLine = sanitizeReportText(fieldMatch[2]);

      if (isKnownReportTitle(title, fixedTitles)) {
        if (current) {
          items.push(current);
        }

        current = {
          title,
          value: firstLine || REPORT_MISSING_VALUE,
          lines: firstLine ? splitReportValueLines(firstLine) : []
        };

        continue;
      }

      const inlineTitle = stripReportStepPrefix(title);
      const inlineLine = sanitizeReportText(firstLine ? `${inlineTitle}：${firstLine}` : inlineTitle);

      if (!inlineLine) {
        continue;
      }

      if (!current) {
        current = {
          title: "补充说明",
          value: inlineLine,
          lines: [inlineLine]
        };
        continue;
      }

      current.lines = mergeReportLines(current.lines ?? [], [inlineLine]);
      current.value = current.value === REPORT_MISSING_VALUE ? inlineLine : current.value;

      continue;
    }

    const content = sanitizeReportText(stepMatch?.[1] ?? line.replace(/^\s*[-*+]\s*/, ""));

    if (!content) {
      continue;
    }

    if (!current) {
      current = {
        title: "补充说明",
        value: content,
        lines: [content]
      };
      continue;
    }

    current.lines = [...(current.lines ?? []), content];
    current.value = current.value === REPORT_MISSING_VALUE ? content : current.value;
  }

  if (current) {
    items.push(current);
  }

  return items;
}

function formatReportSubItemLines(item: ReportItem) {
  const title = sanitizeReportText(item.title);
  const lines = getReportItemLines(item).filter((line) => line !== REPORT_MISSING_VALUE);

  if (title && title !== "补充说明" && lines.length > 0) {
    return lines.map((line, index) => index === 0 ? `${title}：${line}` : line);
  }

  if (title && title !== "补充说明") {
    return [title];
  }

  return lines;
}

function mergeReportLines(left: string[], right: string[]) {
  return uniqueReportLines([...left, ...right].map((line) => sanitizeReportText(line)).filter(Boolean));
}

function uniqueReportLines(lines: string[]) {
  return [...new Set(lines)];
}

function mergeReportEvidence(left: string, right: string) {
  return uniqueReportLines([left, right].map((item) => sanitizeReportText(item)).filter(Boolean)).join("；");
}

function isKnownReportTitle(title: string, fixedTitles: readonly string[]) {
  return fixedTitles.some((fixedTitle) => isSameReportTitle(title, fixedTitle));
}

function isSameReportTitle(left: string, right: string) {
  const normalize = (value: string) => value.replace(/\s+/g, "").replace(/[\/／]/g, "");

  return normalize(left) === normalize(right) || normalize(left).includes(normalize(right)) || normalize(right).includes(normalize(left));
}

function readReportString(value: unknown) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";
}

function getReportItemLines(item: ReportItem) {
  const lines = (item.lines?.length ? item.lines : splitReportValueLines(item.value))
    .map((line) => sanitizeReportText(line))
    .filter(Boolean);

  return lines.length > 0 ? lines : [sanitizeReportText(item.value) || REPORT_MISSING_VALUE];
}

function splitReportValueLines(value: string) {
  const text = sanitizeReportText(value);

  if (!text || text === REPORT_MISSING_VALUE) {
    return [];
  }

  return text
    .split(/\r?\n+/)
    .map((line) => stripReportStepPrefix(line))
    .filter(Boolean);
}

function stripReportStepPrefix(value: string) {
  return value
    .replace(/^\s*(?:[-*+]|(?:\d+|[A-Za-z])[\.)\u3001:]|[\(（]?[A-Za-z][\)）]|[一二三四五六七八九十]+[\u3001.])\s*/, "")
    .trim();
}

function readReportLines(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitReportValueLines(readReportString(item))).filter(Boolean);
  }

  if (typeof value === "string") {
    return splitReportValueLines(value);
  }

  return [];
}

function sanitizeReportText(value: string) {
  const trimmed = value.trim();

  if (!trimmed || looksLikeRawStructuredValue(trimmed)) {
    return "";
  }

  return trimmed
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^`{3,}[\w+-]*\s*$/gm, "")
    .replace(/^`{3,}\s*$/gm, "")
    .trim();
}

function looksLikeRawStructuredValue(value: string) {
  return /^\s*[{[]/.test(value) || /\b(scopeStatus|analysisType|reportJson|generatedCode)\b/.test(value);
}

export function RichTextWithCodeBlocks({ content, textClassName }: { content: string; textClassName: string }) {
  const parts = parseMarkdownCodeBlocks(content);

  return (
    <>
      {parts.map((part, index) => part.type === "code"
        ? <CopyableCodeBlock code={part.code} key={`code-${index}`} language={part.language} />
        : <p className={textClassName} key={`text-${index}`}>{part.text}</p>)}
    </>
  );
}

export function CopyableCodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="lq-code-block-shell">
      <div className="lq-code-block-toolbar">
        {language ? <span className="lq-code-language">{language}</span> : null}
        <CopyCodeButton code={code} />
      </div>
      <pre className="lq-code-block app-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function CopyCodeButton({
  className = "",
  code,
  disabled = false,
  failedLabel = "复制失败"
}: {
  className?: string;
  code: string;
  disabled?: boolean;
  failedLabel?: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    if (disabled) {
      return;
    }

    const ok = await copyTextToClipboard(code);

    setCopyState(ok ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <button aria-label="复制内容" className={`lq-copy-code ${copyState === "failed" ? "is-error" : ""} ${className}`.trim()} disabled={disabled} onClick={handleCopy} type="button">
      {copyState === "copied" ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
      <span>{copyState === "copied" ? "已复制" : copyState === "failed" ? failedLabel : "复制"}</span>
    </button>
  );
}

export function parseMarkdownCodeBlocks(content: string) {
  const parts: Array<{ type: "text"; text: string } | { type: "code"; code: string; language?: string }> = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();

      if (text) {
        parts.push({
          type: "text",
          text
        });
      }
    }

    parts.push({
      type: "code",
      code: match[2].trim(),
      language: match[1]
    });
    lastIndex = regex.lastIndex;
  }

  const tail = content.slice(lastIndex).trim();

  if (tail) {
    parts.push({
      type: "text",
      text: tail
    });
  }

  return parts.length > 0 ? parts : [{
    type: "text" as const,
    text: content
  }];
}

async function copyTextToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
