"use client";

import { useState } from "react";
import { Check, CheckCircle2, Copy } from "lucide-react";
import type { AiTaskData } from "@/lib/ai/workbench-types";

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

  if (isCodeConversionRiskTab(tab)) {
    return result.riskWarnings.length > 0 ? result.riskWarnings.map((warning) => `- ${warning}`).join("\n") : "暂未识别到明显风险。";
  }

  if (isCodeConversionCodeTab(tab)) {
    return result.generatedCode?.trim() ?? "";
  }

  return "";
}

export function isCodeConversionCodeTab(tab: string) {
  return tab === "目标平台代码" || tab.includes("代码");
}

function isCodeConversionMigrationTab(tab: string) {
  return tab === "迁移说明" || tab.includes("迁移");
}

function isCodeConversionRiskTab(tab: string) {
  return tab === "风险提醒" || tab.includes("风险");
}

function getCodeConversionEmptyMessage(tab: string) {
  if (isCodeConversionCodeTab(tab)) {
    return "暂无目标平台代码。";
  }

  if (isCodeConversionMigrationTab(tab)) {
    return "暂无迁移说明。";
  }

  if (isCodeConversionRiskTab(tab)) {
    return "暂无风险提醒。";
  }

  return "暂无内容。";
}

export function CodeAnalysisResultView({
  activeTab,
  costPoints,
  report,
  result,
  task
}: {
  activeTab: string;
  costPoints: number;
  report: Record<string, unknown> | null | undefined;
  result: NonNullable<AiTaskData["result"]>;
  task: AiTaskData["task"];
}) {
  const content = getCodeAnalysisTabContent(activeTab, report, result);

  return (
    <div className="lq-analysis-output">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-[#111827]">{activeTab}</h2>
          <AnalysisCompletionMeta task={task} />
        </div>
        <span className="lq-cost-tag">已扣除 {costPoints} 积分</span>
      </div>
      <div className="grid gap-3">
        {content.map((item, index) => (
          <p className="m-0" key={`${activeTab}-${index}`}>{item}</p>
        ))}
      </div>
    </div>
  );
}

export function getCodeAnalysisTabContent(activeTab: string, report: Record<string, unknown> | null | undefined, result: NonNullable<AiTaskData["result"]>) {
  const reportRiskWarnings = toDisplayLines(report?.riskWarnings);
  const riskWarnings = [...reportRiskWarnings, ...result.riskWarnings].filter(Boolean);

  if (activeTab === "风险提醒" || activeTab.includes("风险")) {
    return riskWarnings.length > 0 ? uniqueContentLines(riskWarnings) : ["暂未识别到明显风险。"];
  }

  if (activeTab === "交易逻辑" || activeTab.includes("交易")) {
    return withContentFallback(toDisplayLines(report?.tradingLogic), "暂未识别到明确交易逻辑。");
  }

  if (activeTab === "关键参数" || activeTab.includes("参数")) {
    return withContentFallback(toDisplayLines(report?.parameters), "暂未识别到明确参数。");
  }

  if (activeTab === "优化建议" || activeTab.includes("优化")) {
    return withContentFallback(toDisplayLines(report?.optimizationSuggestions), "暂无额外优化建议。");
  }

  return withContentFallback([
    ...toDisplayLines(report?.overview),
    ...prefixContentLines("代码结构", report?.codeStructure),
    ...prefixContentLines("平台依赖", report?.platformDependencies),
    ...toDisplayLines(result.explanation)
  ], "已生成代码解析报告。");
}

function AnalysisCompletionMeta({ task }: { task: AiTaskData["task"] }) {
  const parts = ["已完成"];
  const duration = formatTaskDuration(task.startedAt, task.finishedAt);

  if (duration) {
    parts.push(`用时 ${duration}`);
  }

  return (
    <div className="lq-analysis-completion">
      <CheckCircle2 aria-hidden="true" size={15} />
      <span>{parts.join(" · ")}</span>
    </div>
  );
}

function formatTaskDuration(startedAt: string | null | undefined, finishedAt: string | null | undefined) {
  if (!startedAt || !finishedAt) {
    return "";
  }

  const started = Date.parse(startedAt);
  const finished = Date.parse(finishedAt);

  if (!Number.isFinite(started) || !Number.isFinite(finished) || finished <= started) {
    return "";
  }

  const totalSeconds = Math.max(1, Math.round((finished - started) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds} 秒`;
  }

  return seconds > 0 ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分钟`;
}

function withContentFallback(lines: string[], fallback: string) {
  const normalized = uniqueContentLines(lines.map((line) => line.trim()).filter(Boolean));

  return normalized.length > 0 ? normalized : [fallback];
}

function prefixContentLines(label: string, value: unknown) {
  return toDisplayLines(value).map((line) => `${label}：${line}`);
}

function toDisplayLines(value: unknown): string[] {
  if (value === null || typeof value === "undefined") {
    return [];
  }

  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => toDisplayLines(item)).filter(Boolean);
  }

  if (typeof value === "object") {
    return [formatDisplayObject(value as Record<string, unknown>)].filter(Boolean);
  }

  return [];
}

function formatDisplayObject(value: Record<string, unknown>) {
  const entries = Object.entries(value)
    .map(([key, item]) => {
      const text = formatDisplayValue(item);

      return text ? `${key}：${text}` : "";
    })
    .filter(Boolean);

  return entries.join("；");
}

function formatDisplayValue(value: unknown): string {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatDisplayValue(item)).filter(Boolean).join("、");
  }

  if (typeof value === "object") {
    return formatDisplayObject(value as Record<string, unknown>);
  }

  return "";
}

function uniqueContentLines(lines: string[]) {
  return [...new Set(lines)];
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
  failedLabel = "复制失败"
}: {
  className?: string;
  code: string;
  failedLabel?: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    const ok = await copyTextToClipboard(code);

    setCopyState(ok ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <button aria-label="复制代码" className={`lq-copy-code ${copyState === "failed" ? "is-error" : ""} ${className}`.trim()} onClick={handleCopy} type="button">
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
