"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { AiTaskCompletionSummary, type AiRunEventData } from "@/components/ai/AiTaskProgressPanel";
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

  if (!content) {
    return null;
  }

  return (
    <pre className="m-0 whitespace-pre-wrap text-[#c8d5ea]">
      <code>{content}</code>
    </pre>
  );
}

export function getCodeConversionTabContent(tab: string, result: AiTaskData["result"] | undefined) {
  if (!result) {
    return "";
  }

  if (tab === "迁移说明" || tab.includes("迁移")) {
    return result.migrationNotes ?? result.explanation ?? "";
  }

  if (tab === "风险提醒" || tab.includes("风险")) {
    return result.riskWarnings.length > 0 ? result.riskWarnings.map((warning) => `- ${warning}`).join("\n") : "暂未识别到明显风险。";
  }

  return result.generatedCode ?? result.explanation ?? "";
}

export function CodeAnalysisResultView({
  activeTab,
  costPoints,
  events,
  report,
  result,
  task
}: {
  activeTab: string;
  costPoints: number;
  events?: AiRunEventData[] | null;
  report: Record<string, unknown> | null | undefined;
  result: NonNullable<AiTaskData["result"]>;
  task: AiTaskData["task"];
}) {
  const content = getCodeAnalysisTabContent(activeTab, report, result);

  return (
    <div className="lq-analysis-output">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-extrabold text-[#111827]">{activeTab}</h2>
        <span className="lq-cost-tag">已扣除 {costPoints} 积分</span>
      </div>
      <AiTaskCompletionSummary events={events ?? task.events} progress={task.progress} task={task} />
      <div className="grid gap-3">
        {content.map((item) => (
          <p className="m-0" key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

export function getCodeAnalysisTabContent(activeTab: string, report: Record<string, unknown> | null | undefined, result: NonNullable<AiTaskData["result"]>) {
  if (activeTab === "风险提醒" || activeTab.includes("风险")) {
    return result.riskWarnings.length > 0 ? result.riskWarnings : ["暂未识别到明显风险。"];
  }

  if (activeTab === "交易逻辑" || activeTab.includes("交易")) {
    return toStringArray(report?.tradingLogic) ?? ["读取行情、计算信号并执行调仓。"];
  }

  if (activeTab === "关键参数" || activeTab.includes("参数")) {
    return toStringArray(report?.parameters) ?? ["未识别到明确参数。"];
  }

  if (activeTab === "优化建议" || activeTab.includes("优化")) {
    return toStringArray(report?.optimizationSuggestions) ?? ["建议补充回测、风控和异常行情处理。"];
  }

  return [String(report?.overview ?? result.explanation ?? "已生成代码解析报告。")];
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
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    const ok = await copyTextToClipboard(code);

    setCopyState(ok ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div className="lq-code-block-shell">
      <div className="lq-code-block-toolbar">
        {language ? <span className="lq-code-language">{language}</span> : null}
        <button aria-label="复制代码" className={`lq-copy-code ${copyState === "failed" ? "is-error" : ""}`} onClick={handleCopy} type="button">
          {copyState === "copied" ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
          <span>{copyState === "copied" ? "已复制" : copyState === "failed" ? "复制失败" : "复制"}</span>
        </button>
      </div>
      <pre className="lq-code-block app-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
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

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : null;
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
