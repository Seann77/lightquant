import type { AiTask, AiTaskType } from "@/server/domain";
import type { AiProviderResult } from "@/server/ai/providers/types";
import { formatProviderResultAsMarkdown } from "@/server/ai/streaming-markdown-result";
import {
  shouldExpectFullGeneratedCode,
  shouldUseStreamingMarkdownForTask,
  validateGeneratedCodeArtifact
} from "@/server/ai/code-artifact";

export type AiOutputIntegrityDecision = {
  partial: boolean;
  reason: string | null;
  category: "complete" | "physical_truncated";
  longCodeMode: boolean;
  requiresCompleteCode: boolean;
  report: Record<string, unknown>;
};

const BAD_FINISH_REASONS = new Set(["length", "timeout", "content_filter", "error"]);
const PHYSICAL_TRUNCATION_MARKER_PATTERN = /因篇幅所限|因篇幅限制|由于篇幅限制|篇幅限制|篇幅有限|受限于篇幅|请继续|继续输出|继续生成|完整代码请继续|后续同理|后续继续|未完待续|其余代码保持不变|此处省略|省略若干行|以下代码略|这里只展示部分|后续函数同理|TODO[:：]\s*后续补充|待补充/i;
const HARD_PYTHON_TRUNCATION_ERRORS = new Set([
  "python_syntax_unbalanced_pairs",
  "python_syntax_unclosed_string",
  "python_syntax_abrupt_tail"
]);

export function shouldUseLongCodeMode(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode">;
  conversationContext?: string | null;
}) {
  return shouldUseStreamingMarkdownForTask(input);
}

export function requiresCompleteCodeOutput(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode">;
  conversationContext?: string | null;
}) {
  return shouldExpectFullGeneratedCode(input);
}

export function buildLongCodeModeGuidance(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode">;
  conversationContext?: string | null;
}) {
  if (!shouldUseLongCodeMode(input)) {
    return "";
  }

  return [
    "当前任务可能产生较长代码。请优先保证完整 Python 代码本体，说明文字必须压缩。",
    "本次完整代码交付使用 Markdown-only；不要输出 JSON，不要手写 reportJson、scopeStatus 或 generatedCode 包裹最终答案。",
    "不要输出长表格、重复背景说明、营销式说明或与代码无关的内容。",
    "不要输出“篇幅限制”“后续继续”“如需我继续”等话术。",
    "完整代码必须放在一个主要 python fenced code block 中。",
    "不要把完整代码放进 JSON 字符串里；JSON/reportJson 只保留元信息。",
    input.task.type === "strategy_generation"
      ? "如果用户正在修改、修复或重新输出已有策略，请直接给出整理后的完整可运行策略代码。"
      : "代码转换结果必须完整覆盖用户输入范围：完整策略源码输出完整目标平台策略；函数、片段、报错代码或局部逻辑只转换对应范围。不要强行补不存在的初始化、调度、买卖模块。迁移说明和风险提示保持简短。"
  ].join("\n");
}

export function inspectAiOutputIntegrity(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">;
  result: AiProviderResult;
  finalAnswerMarkdown?: string | null;
  conversationContext?: string | null;
}): AiOutputIntegrityDecision {
  const longCodeMode = shouldUseLongCodeMode(input);
  const requiresCompleteCode = requiresCompleteCodeOutput(input);
  const resultReport = readRecord(input.result.reportJson) ?? {};
  const finalAnswerMarkdown = input.finalAnswerMarkdown?.trim() ||
    readString(resultReport.finalAnswerMarkdown) ||
    formatProviderResultAsMarkdown(input.result, input.task);
  const validation = validateGeneratedCodeArtifact({
    task: input.task,
    code: input.result.generatedCode,
    finalAnswerMarkdown,
    conversationContext: input.conversationContext
  });
  const finishReason = readString(resultReport.finish_reason) || readString(resultReport.finishReason) || null;
  const streamCompleted = typeof resultReport.streamCompleted === "boolean" ? resultReport.streamCompleted : null;
  const shouldCheckMarkdownStructure = longCodeMode || requiresCompleteCode;
  const hasPhysicalTruncationMarker = PHYSICAL_TRUNCATION_MARKER_PATTERN.test(finalAnswerMarkdown) ||
    PHYSICAL_TRUNCATION_MARKER_PATTERN.test(input.result.generatedCode ?? "");
  const pythonTruncationError = shouldCheckMarkdownStructure
    ? validation.errors.find((error) => HARD_PYTHON_TRUNCATION_ERRORS.has(error)) ?? null
    : null;
  const physicalReason =
    getPhysicalTruncationReason(resultReport, finishReason, streamCompleted) ||
    (shouldCheckMarkdownStructure && !validation.codeFenceClosed ? "unclosed_code_fence" : null) ||
    (shouldCheckMarkdownStructure && hasPhysicalTruncationMarker ? "truncation_marker" : null) ||
    pythonTruncationError;
  const report = {
    integrityStatus: physicalReason ? "physical_truncated" : "complete",
    truncateReason: physicalReason,
    taskType: input.task.type,
    sourcePlatform: input.task.sourcePlatform ?? null,
    targetPlatform: input.task.targetPlatform ?? null,
    repairAttempted: false,
    repairSucceeded: false,
    refundApplied: false,
    physical: {
      truncated: Boolean(physicalReason),
      reason: physicalReason,
      finish_reason: finishReason,
      streamCompleted,
      codeFenceClosed: validation.codeFenceClosed,
      hasPhysicalTruncationMarker,
      pythonTruncationError
    }
  };

  return {
    partial: Boolean(physicalReason),
    reason: physicalReason,
    category: physicalReason ? "physical_truncated" : "complete",
    longCodeMode,
    requiresCompleteCode,
    report
  };
}

export function canAutoRepairAiOutput(type: AiTaskType) {
  return type === "strategy_generation" || type === "code_conversion";
}

export function buildAutoRepairPrompt(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">;
  partialDraft: string;
  reason: string;
  maxSingleCallInputChars: number;
  integrityReport?: Record<string, unknown>;
}) {
  const originalPrompt = input.task.prompt?.trim() || "用户未补充额外文字需求。";
  const inputCode = input.task.inputCode ?? "";
  const inputCodeForRepair = buildRepairSourceContext(inputCode, input.maxSingleCallInputChars);
  const partialDraft = truncateMiddle(input.partialDraft, Math.min(30000, Math.max(12000, input.maxSingleCallInputChars)));

  return [
    "上一次生成结果可能因为输出过长、连接中断或代码块结构不完整而不能作为最终交付。",
    "请基于原始用户需求、完整原始源码或结构化源码摘要、上一次草稿，重新整理并输出一份完整、连续、可复制的最终代码或片段。",
    "如果必须取舍，优先保证完整 Python 代码，压缩说明文字、风险提示和修改摘要。",
    "本次补救交付使用 Markdown-only；不要输出 JSON，不要手写 reportJson、scopeStatus 或 generatedCode 包裹最终答案。",
    "完整代码必须放在一个主要 python fenced code block 中。",
    "不要把完整代码放进 JSON 字符串里；不要输出多个相互冲突的完整代码块。",
    "不要输出重复代码，不要输出“后续同理”“篇幅限制”“请继续”“其余代码保持不变”等话术。",
    "",
    `原始任务类型：${input.task.type}`,
    `源平台：${input.task.sourcePlatform ?? "未明确"}`,
    `目标平台：${input.task.targetPlatform ?? "未明确"}`,
    `内部不完整原因：${input.reason}`,
    "",
    "原始用户需求：",
    "<original_prompt>",
    originalPrompt,
    "</original_prompt>",
    "",
    inputCode.length <= input.maxSingleCallInputChars ? "完整原始代码输入：" : "结构化原始代码摘要（原文超过单次输入上限，已按结构压缩）：",
    "<original_input_code>",
    inputCodeForRepair || "无直接代码输入。",
    "</original_input_code>",
    "",
    "上一次草稿（只能作为参考，禁止要求用户拼接）：",
    "<previous_partial_draft>",
    partialDraft || "上一次没有可用草稿。",
    "</previous_partial_draft>"
  ].join("\n");
}

export function withRepairReportMetadata<T extends AiProviderResult>(result: T, metadata: {
  repairAttempt: number;
  repairedFromReason: string;
  integrityReport?: Record<string, unknown>;
}) {
  const report = readRecord(result.reportJson) ?? {};

  return {
    ...result,
    reportJson: {
      ...report,
      partial: false,
      truncated: false,
      truncateReason: null,
      canContinue: false,
      repairAttempt: metadata.repairAttempt,
      repairedFromReason: metadata.repairedFromReason,
      integrityStatus: "complete",
      repairAttempted: true,
      repairSucceeded: true,
      refundApplied: false,
      integrityReport: metadata.integrityReport ?? report.integrityReport
    }
  };
}

function getPhysicalTruncationReason(report: Record<string, unknown>, finishReason: string | null, streamCompleted: boolean | null) {
  const truncateReason = readString(report.truncateReason);

  if (truncateReason) {
    return truncateReason;
  }

  if (finishReason && BAD_FINISH_REASONS.has(finishReason)) {
    return finishReason;
  }

  if (streamCompleted === false) {
    return "stream_error";
  }

  if (report.wasTruncated === true || report.truncated === true || report.partial === true) {
    return finishReason || "unknown";
  }

  return null;
}

function buildRepairSourceContext(inputCode: string, maxSingleCallInputChars: number) {
  const source = inputCode.trim();

  if (!source) {
    return "";
  }

  if (source.length <= maxSingleCallInputChars) {
    return source;
  }

  return buildStructuredSourceSummary(source, maxSingleCallInputChars);
}

function buildStructuredSourceSummary(source: string, maxLength: number) {
  const functions = parsePythonFunctions(source)
    .map((fn) => {
      const meaningful = fn.bodyLines.map((line) => line.trim()).filter(Boolean).slice(0, 12);

      return [`def ${fn.name}(...):`, ...meaningful.map((line) => `  ${line}`)].join("\n");
    })
    .join("\n\n");
  const imports = source.split(/\r?\n/).filter((line) => /^\s*(?:import|from)\s+/.test(line)).slice(0, 80).join("\n");
  const globals = source.split(/\r?\n/).filter((line) => /^[A-Za-z_]\w*\s*=/.test(line)).slice(0, 120).join("\n");
  const summary = [
    `[结构化压缩摘要：原始源码 ${source.length} 字符，超过单次输入上限 ${maxLength} 字符]`,
    imports ? `导入：\n${imports}` : "",
    globals ? `全局参数/变量：\n${globals}` : "",
    functions ? `函数骨架与关键语句：\n${functions}` : "",
    "源码首尾保真片段：",
    truncateMiddle(source, Math.max(4000, Math.min(maxLength, 24000)))
  ].filter(Boolean).join("\n\n");

  return summary.length > maxLength * 1.2 ? truncateMiddle(summary, Math.floor(maxLength * 1.2)) : summary;
}

function parsePythonFunctions(code: string) {
  const lines = code.split(/\r?\n/);
  const functions: Array<{ name: string; bodyLines: string[] }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = /^def\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*:/.exec(lines[index] ?? "");

    if (!match) {
      continue;
    }

    const bodyLines: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor] ?? "";

      if (/^(?:def|class)\s+/.test(line)) {
        break;
      }

      bodyLines.push(line);
    }

    functions.push({
      name: match[1],
      bodyLines
    });
  }

  return functions;
}

function truncateMiddle(value: string, maxLength: number) {
  const text = value.trim();

  if (text.length <= maxLength) {
    return text;
  }

  const head = Math.floor(maxLength * 0.65);
  const tail = maxLength - head;

  return `${text.slice(0, head)}\n\n[中间内容已按结构压缩]\n\n${text.slice(-tail)}`;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
    ? value as Record<string, unknown>
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}
