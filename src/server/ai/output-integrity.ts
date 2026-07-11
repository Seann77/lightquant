import type { AiTask, AiTaskResult, AiTaskType } from "@/server/domain";
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
  longCodeMode: boolean;
  requiresCompleteCode: boolean;
};

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
    "不要输出长表格、重复背景说明、营销式说明或与代码无关的内容。",
    "不要输出“篇幅限制”“后续继续”“如需我继续”等话术。",
    "完整代码必须放在一个主要 python fenced code block 中。",
    "不要把完整代码放进 JSON 字符串里；JSON/reportJson 只保留元信息。",
    input.task.type === "strategy_generation"
      ? "如果用户正在修改、修复或重新输出已有策略，请直接给出整理后的完整可运行策略代码。"
      : "代码转换结果必须优先保证目标平台完整 Python 代码，迁移说明和风险提示保持简短。"
  ].join("\n");
}

export function inspectAiOutputIntegrity(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">;
  result: AiProviderResult | AiTaskResult;
  finalAnswerMarkdown?: string | null;
  conversationContext?: string | null;
}): AiOutputIntegrityDecision {
  const longCodeMode = shouldUseLongCodeMode(input);
  const requiresCompleteCode = requiresCompleteCodeOutput(input);
  const report = readRecord(input.result.reportJson);
  const finalAnswerMarkdown = input.finalAnswerMarkdown?.trim() ||
    readString(report?.finalAnswerMarkdown) ||
    formatProviderResultAsMarkdown(input.result, input.task);
  const generatedCode = input.result.generatedCode?.trim() ?? "";
  const validation = validateGeneratedCodeArtifact({
    task: input.task,
    code: generatedCode,
    finalAnswerMarkdown,
    conversationContext: input.conversationContext
  });

  const reason =
    report?.partial === true ? "report_partial" :
    report?.truncated === true ? "report_truncated" :
    requiresCompleteCode && !validation.codeFenceClosed ? "unclosed_code_fence" :
    requiresCompleteCode && (!validation.noPlaceholder || !validation.noTruncationMarker) ? "placeholder_or_truncation_text" :
    requiresCompleteCode && !validation.generatedCodePresent ? "missing_generated_code" :
    requiresCompleteCode && !validation.platformEntryOk ? "missing_platform_entry" :
    requiresCompleteCode && !validation.pythonSyntaxOk ? "truncated_python_syntax" :
    requiresCompleteCode && validation.status === "invalid" ? "generated_code_validation_invalid" :
    null;

  return {
    partial: Boolean(reason),
    reason,
    longCodeMode,
    requiresCompleteCode
  };
}

export function canAutoRepairAiOutput(type: AiTaskType) {
  return type === "strategy_generation" || type === "code_conversion";
}

export function buildAutoRepairPrompt(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">;
  partialDraft: string;
  reason: string;
}) {
  const originalPrompt = input.task.prompt?.trim() || "用户未补充额外文字需求。";
  const inputCodePreview = truncateMiddle(input.task.inputCode ?? "", 12000);
  const partialDraft = truncateMiddle(input.partialDraft, 12000);

  return [
    "上一次生成结果可能因为输出过长、连接中断或结构不完整而不能作为最终交付。",
    "请不要从上一次断点继续写，也不要要求用户拼接多段代码。",
    "请基于原始用户需求、原始代码和上一次草稿，重新整理并输出一份完整、连续、可复制的最终代码。",
    "如果必须取舍，优先保证完整 Python 代码，压缩说明文字、风险提示和修改摘要。",
    "完整代码必须放在一个主要 python fenced code block 中。",
    "不要把完整代码放进 JSON 字符串里；不要输出多个相互冲突的完整代码块。",
    "不要输出重复代码，不要输出 TODO 占位，不要输出“后续同理”“篇幅限制”“请继续”“其余代码保持不变”等话术。",
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
    "原始代码输入：",
    "<original_input_code>",
    inputCodePreview || "无直接代码输入。",
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
      repairedFromReason: metadata.repairedFromReason
    }
  };
}

function truncateMiddle(value: string, maxLength: number) {
  const text = value.trim();

  if (text.length <= maxLength) {
    return text;
  }

  const head = Math.floor(maxLength * 0.65);
  const tail = maxLength - head;

  return `${text.slice(0, head)}\n\n[中间内容已省略，仅供后台补救参考]\n\n${text.slice(-tail)}`;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
    ? value as Record<string, unknown>
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}
