import { createHash } from "node:crypto";
import type { AiTask, AiTaskType } from "@/server/domain";
import type { AiProviderResult } from "@/server/ai/providers/types";
import { looksLikeCompleteStrategyCode } from "@/lib/ai/strategy-result-format";

export type GeneratedCodeSource = "none" | "markdown_code_block" | "structured_generated_code";

export type GeneratedCodeValidationReport = {
  codeFenceClosed: boolean;
  generatedCodePresent: boolean;
  noTruncationMarker: boolean;
  noPlaceholder: boolean;
  pythonSyntaxOk: boolean;
  platformEntryOk: boolean;
  noDuplicateLargeSections: boolean;
  lineCount: number;
  contentSha256: string | null;
  status: "complete" | "invalid";
  errors: string[];
  repairable: boolean;
};

export type GeneratedCodeArtifactMetadata = {
  type: "strategy_code" | "converted_code";
  language: "python";
  platform: string | null;
  status: "complete" | "invalid";
  codeLineCount: number;
  contentSha256: string;
  source: GeneratedCodeSource;
};

export type GeneratedCodeExtraction = {
  code: string | null;
  source: GeneratedCodeSource;
  blockCount: number;
  candidateCount: number;
};

const LONG_INPUT_CHARS = 12000;
const COMPLETE_CODE_INTENT_PATTERN = /完整.*(?:代码|策略|文件|python)|重新输出|修正后完整代码|修复后完整代码|全部代码|可复制.*代码|可运行.*(?:代码|策略)|重新生成|从头输出|full\s+(?:code|strategy)/i;
const LONG_CODE_STRATEGY_INTENT_PATTERN = /修改已有策略|修复完整策略|修复.*策略|改完.*完整|已有策略|重写策略|完整.*(?:代码|策略|文件)|全部代码|重新输出|重新生成|修正后完整代码|修复后完整代码/i;
const TRUNCATION_MARKER_PATTERN = /后续补充|后续同理|由于篇幅限制|受限于篇幅|篇幅有限|请继续|继续输出|继续生成|未完待续|此处省略|省略若干行|其余代码保持不变|后续函数同理/i;
const PLACEHOLDER_PATTERN = /TODO|待补充|pass\s*#\s*placeholder|^\s*\.\.\.\s*$/im;
const CODE_FENCE_PATTERN = /```([\w+-]+)?\s*\r?\n([\s\S]*?)```/g;

export function shouldUseStreamingMarkdownForTask(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode">;
  conversationContext?: string | null;
}) {
  if (input.task.type === "code_conversion") {
    return true;
  }

  if (input.task.type !== "strategy_generation") {
    return false;
  }

  const prompt = input.task.prompt ?? "";
  const inputCode = input.task.inputCode ?? "";
  const context = input.conversationContext ?? "";

  return LONG_CODE_STRATEGY_INTENT_PATTERN.test(prompt) ||
    inputCode.length >= LONG_INPUT_CHARS ||
    hasCompleteCodeSignal(context);
}

export function shouldExpectFullGeneratedCode(input: {
  task: Pick<AiTask, "type" | "prompt" | "inputCode">;
  conversationContext?: string | null;
}) {
  if (input.task.type === "code_conversion") {
    return true;
  }

  if (input.task.type !== "strategy_generation") {
    return false;
  }

  return COMPLETE_CODE_INTENT_PATTERN.test(input.task.prompt ?? "") ||
    shouldUseStreamingMarkdownForTask(input);
}

export function extractGeneratedCodeFromMarkdown(markdown: string, taskType: AiTaskType, platform?: string | null): GeneratedCodeExtraction {
  const blocks = extractFencedCodeBlocks(markdown);
  const candidates = blocks
    .map((block) => ({
      ...block,
      code: sanitizeCode(block.code),
      score: scoreCodeBlock(block.code, block.language, taskType, platform)
    }))
    .filter((block) => block.code && block.score > 0)
    .sort((left, right) => right.score - left.score || right.code.length - left.code.length);

  if (candidates[0]) {
    return {
      code: candidates[0].code,
      source: "markdown_code_block",
      blockCount: blocks.length,
      candidateCount: candidates.length
    };
  }

  const whole = sanitizeCode(stripMarkdownNoise(markdown));

  if (looksLikePythonCode(whole)) {
    return {
      code: whole,
      source: "markdown_code_block",
      blockCount: blocks.length,
      candidateCount: 1
    };
  }

  return {
    code: null,
    source: "none",
    blockCount: blocks.length,
    candidateCount: 0
  };
}

export function validateGeneratedCodeArtifact(input: {
  task: Pick<AiTask, "type" | "targetPlatform" | "sourcePlatform" | "prompt" | "inputCode">;
  code: string | null | undefined;
  finalAnswerMarkdown?: string | null;
  conversationContext?: string | null;
}) {
  const code = sanitizeCode(input.code ?? "");
  const expectFullCode = shouldExpectFullGeneratedCode({
    task: input.task,
    conversationContext: input.conversationContext
  });
  const codeFenceClosed = !input.finalAnswerMarkdown || hasClosedCodeFences(input.finalAnswerMarkdown);
  const generatedCodePresent = Boolean(code);
  const noTruncationMarker = !TRUNCATION_MARKER_PATTERN.test(code);
  const noPlaceholder = !PLACEHOLDER_PATTERN.test(code);
  const syntax = validatePythonCodeSyntax(code);
  const platform = input.task.targetPlatform ?? input.task.sourcePlatform ?? null;
  const platformEntry = detectPlatformEntryPoints(code, platform);
  const noDuplicateLargeSections = !detectDuplicateLargeSections(code);
  const lineCount = countCodeLines(code);
  const contentSha256 = code ? sha256(code) : null;
  const errors = [
    codeFenceClosed ? null : "code_fence_unclosed",
    generatedCodePresent ? null : "generated_code_missing",
    noTruncationMarker ? null : "truncation_marker",
    noPlaceholder ? null : "placeholder_marker",
    syntax.ok ? null : `python_syntax_${syntax.reason}`,
    platformEntry.ok ? null : "platform_entry_missing",
    noDuplicateLargeSections ? null : "duplicate_large_sections"
  ].filter((item): item is string => Boolean(item));
  const invalidByFullCode = expectFullCode && (
    !codeFenceClosed ||
    !generatedCodePresent ||
    !noTruncationMarker ||
    !noPlaceholder ||
    !syntax.ok ||
    !platformEntry.ok
  );
  const status = invalidByFullCode ? "invalid" : "complete";

  return {
    codeFenceClosed,
    generatedCodePresent,
    noTruncationMarker,
    noPlaceholder,
    pythonSyntaxOk: syntax.ok,
    platformEntryOk: platformEntry.ok,
    noDuplicateLargeSections,
    lineCount,
    contentSha256,
    status,
    errors,
    repairable: errors.some((error) => /unclosed|missing|truncation|placeholder|syntax/.test(error))
  } satisfies GeneratedCodeValidationReport;
}

export function validatePythonCodeSyntax(code: string) {
  const text = sanitizeCode(code);

  if (!text) {
    return {
      ok: false,
      reason: "empty"
    };
  }

  if (hasUnbalancedPairs(text)) {
    return {
      ok: false,
      reason: "unbalanced_pairs"
    };
  }

  if (hasUnclosedStringLiteral(text)) {
    return {
      ok: false,
      reason: "unclosed_string"
    };
  }

  if (looksLikeAbruptPythonTail(text)) {
    return {
      ok: false,
      reason: "abrupt_tail"
    };
  }

  return {
    ok: true,
    reason: null
  };
}

export function detectCodeTruncationMarkers(code: string) {
  return TRUNCATION_MARKER_PATTERN.test(code) || PLACEHOLDER_PATTERN.test(code);
}

export function detectPlatformEntryPoints(code: string, platform?: string | null) {
  const normalizedPlatform = (platform ?? "").toLowerCase();

  if (!code.trim()) {
    return {
      ok: false,
      matched: []
    };
  }

  if (/qmt|xtquant|迅投/.test(normalizedPlatform)) {
    const matched = [
      /\bdef\s+init\s*\(/.test(code) ? "init" : null,
      /\bdef\s+handlebar\s*\(/.test(code) ? "handlebar" : null,
      /\bxtdata\b/.test(code) ? "xtdata" : null,
      /\bpassorder\s*\(/.test(code) ? "passorder" : null
    ].filter((item): item is string => Boolean(item));

    return {
      ok: matched.length > 0,
      matched
    };
  }

  if (/ptrade|joinquant|聚宽|掘金/.test(normalizedPlatform)) {
    const matched = [
      /\bdef\s+initialize\s*\(/.test(code) ? "initialize" : null,
      /\bdef\s+handle_data\s*\(/.test(code) ? "handle_data" : null,
      /\bdef\s+before_trading_start\s*\(/.test(code) ? "before_trading_start" : null,
      /\bdef\s+after_trading_end\s*\(/.test(code) ? "after_trading_end" : null,
      /\brun_(?:daily|weekly|monthly)\s*\(/.test(code) ? "scheduler" : null
    ].filter((item): item is string => Boolean(item));

    return {
      ok: matched.length > 0,
      matched
    };
  }

  return {
    ok: looksLikePythonCode(code),
    matched: []
  };
}

export function detectDuplicateLargeSections(code: string) {
  const lines = sanitizeCode(code)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const windowSize = 12;

  if (lines.length < windowSize * 2) {
    return false;
  }

  const seen = new Set<string>();

  for (let index = 0; index <= lines.length - windowSize; index += 1) {
    const chunk = lines.slice(index, index + windowSize).join("\n");
    const digest = sha256(chunk);

    if (seen.has(digest)) {
      return true;
    }

    seen.add(digest);
  }

  return false;
}

export function buildGeneratedCodeValidationReport(input: Parameters<typeof validateGeneratedCodeArtifact>[0]) {
  return validateGeneratedCodeArtifact(input);
}

export function applyGeneratedCodeArtifact<T extends AiProviderResult>(result: T, input: {
  task: Pick<AiTask, "type" | "targetPlatform" | "sourcePlatform" | "prompt" | "inputCode">;
  finalAnswerMarkdown?: string | null;
  conversationContext?: string | null;
}): T {
  if (input.task.type !== "strategy_generation" && input.task.type !== "code_conversion") {
    return result;
  }

  const report = readRecord(result.reportJson) ?? {};
  const markdown = input.finalAnswerMarkdown?.trim() || readString(report.finalAnswerMarkdown);
  const extracted = markdown
    ? extractGeneratedCodeFromMarkdown(markdown, input.task.type, input.task.targetPlatform ?? input.task.sourcePlatform)
    : {
        code: null,
        source: "none" as const,
        blockCount: 0,
        candidateCount: 0
      };
  const source = extracted.code ? extracted.source : result.generatedCode ? "structured_generated_code" : "none";
  const generatedCode = extracted.code ?? result.generatedCode?.trim() ?? null;
  const validation = validateGeneratedCodeArtifact({
    task: input.task,
    code: generatedCode,
    finalAnswerMarkdown: markdown,
    conversationContext: input.conversationContext
  });
  const artifact = generatedCode && validation.contentSha256
    ? {
        type: input.task.type === "code_conversion" ? "converted_code" : "strategy_code",
        language: "python",
        platform: input.task.targetPlatform ?? input.task.sourcePlatform ?? null,
        status: validation.status,
        codeLineCount: validation.lineCount,
        contentSha256: validation.contentSha256,
        source
      } satisfies GeneratedCodeArtifactMetadata
    : null;

  return {
    ...result,
    generatedCode,
    reportJson: {
      ...report,
      responseMode: report.responseMode,
      outputMode: shouldExpectFullGeneratedCode({
        task: input.task,
        conversationContext: input.conversationContext
      }) ? "full_artifact" : report.outputMode,
      language: generatedCode ? "python" : report.language,
      platform: input.task.targetPlatform ?? input.task.sourcePlatform ?? report.platform ?? null,
      generatedCodeSource: source,
      completionStatus: validation.status,
      validation,
      artifact
    }
  };
}

function extractFencedCodeBlocks(markdown: string) {
  return [...markdown.matchAll(CODE_FENCE_PATTERN)]
    .map((match) => ({
      index: match.index ?? 0,
      language: match[1]?.trim().toLowerCase() ?? "",
      code: match[2]?.trim() ?? ""
    }))
    .filter((block) => block.code);
}

function scoreCodeBlock(code: string, language: string, taskType: AiTaskType, platform?: string | null) {
  const clean = sanitizeCode(code);
  let score = 0;

  if (!clean || detectCodeTruncationMarkers(clean)) {
    return 0;
  }

  if (/^(py|python|ptrade|joinquant|qmt)$/i.test(language)) {
    score += 20;
  }

  if (looksLikePythonCode(clean)) {
    score += 20;
  }

  if (taskType === "strategy_generation" && looksLikeCompleteStrategyCode(clean)) {
    score += 40;
  }

  const entry = detectPlatformEntryPoints(clean, platform);
  if (entry.ok) {
    score += 20;
  }

  score += Math.min(20, Math.floor(clean.length / 500));

  return score;
}

function hasCompleteCodeSignal(value: string) {
  return /\bdef\s+initialize\s*\(|\bdef\s+handle_data\s*\(|\bdef\s+init\s*\(|\bdef\s+handlebar\s*\(/.test(value) &&
    value.length >= 2000;
}

function hasClosedCodeFences(value: string) {
  const matches = value.match(/```/g);

  return !matches || matches.length % 2 === 0;
}

function countCodeLines(code: string) {
  return sanitizeCode(code).split(/\r?\n/).filter((line) => line.trim()).length;
}

function looksLikePythonCode(value: string) {
  return /\b(def|class|import|from|return|if|for|while|try|except|with)\b|order_|get_|set_universe|handle_data|initialize|passorder|xtdata|xttrader/.test(value);
}

function looksLikeAbruptPythonTail(value: string) {
  const tail = value.trim().slice(-240);

  return /[([{]\s*$|[:,\\]\s*$|\b(?:return|if|elif|else|for|while|try|except|with|def|class)\b\s*$/.test(tail);
}

function hasUnbalancedPairs(value: string) {
  const pairs: Array<[string, string]> = [["(", ")"], ["[", "]"], ["{", "}"]];

  return pairs.some(([left, right]) => {
    const leftCount = countChar(value, left);
    const rightCount = countChar(value, right);

    return leftCount > rightCount + 2;
  });
}

function hasUnclosedStringLiteral(value: string) {
  const withoutTriple = value.replace(/'''[\s\S]*?'''|"""[\s\S]*?"""/g, "");
  const lines = withoutTriple.split(/\r?\n/);

  return lines.some((line) => {
    const stripped = line.replace(/\\['"]/g, "");
    const single = (stripped.match(/'/g) ?? []).length;
    const double = (stripped.match(/"/g) ?? []).length;

    return single % 2 === 1 || double % 2 === 1;
  });
}

function countChar(value: string, char: string) {
  return [...value].filter((item) => item === char).length;
}

function stripMarkdownNoise(value: string) {
  return value
    .replace(/^#{1,6}\s+.+$/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .trim();
}

function sanitizeCode(value: string) {
  return value
    .replace(/^```[\w+-]*\s*/gm, "")
    .replace(/^```\s*$/gm, "")
    .trim();
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
