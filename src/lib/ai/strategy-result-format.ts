export type StrategyResultMarkdownSource = {
  explanation?: string | null;
  generatedCode?: string | null;
  reportJson?: Record<string, unknown> | null;
  finalAnswerMarkdown?: string | null;
  [key: string]: unknown;
};

const CONCLUSION_KEYS = ["explanation", "summary", "conclusion", "overview", "description"];
const CODE_KEYS = ["generatedCode", "strategyCode", "code", "targetCode", "pythonCode", "sourceCode"];
const NESTED_KEYS = ["result", "data", "output", "payload", "response"];
const MARKDOWN_KEYS = ["finalAnswerMarkdown", "markdown", "content"];
const FULL_CODE_HEADING_PATTERN = /完整.*(?:策略|代码)|(?:策略|平台)代码|完整\s*(?:ptrade|joinquant|qmt).*策略|可运行.*(?:策略|代码)|full.*(?:strategy|code)/i;
const FULL_CODE_CONTEXT_PATTERN = /完整.*(?:策略|代码)|可运行.*(?:策略|代码)|以下是.*完整|下面是.*完整|完整\s*(?:ptrade|joinquant|qmt)/i;

export type StrategyCodeLevel = "none" | "snippet" | "full";

export type StrategyCodeExtraction = {
  code: string | null;
  codeLevel: StrategyCodeLevel;
  generatedCodeSource: "none" | "markdown_code_section" | "structured_generated_code";
};

export function formatStrategyResultAsMarkdown(result: StrategyResultMarkdownSource | null | undefined) {
  const reportJson = readRecord(result?.reportJson);
  const finalAnswerMarkdown = sanitizeFinalAnswerMarkdown(readFirstText([
    readRecordField(result, MARKDOWN_KEYS),
    readRecordField(reportJson, MARKDOWN_KEYS)
  ]));
  const code = readCompleteStrategyCodeFromSources(result, reportJson);

  if (finalAnswerMarkdown) {
    return appendGeneratedCodeIfMissing(finalAnswerMarkdown, code);
  }

  const explanation = sanitizeConclusionText(readFirstText([
    readRecordField(result, CONCLUSION_KEYS),
    readRecordField(reportJson, CONCLUSION_KEYS)
  ]));

  return buildStrategyMarkdown(explanation, code);
}

export function normalizeStrategyFinalAnswerMarkdown(input: {
  finalAnswerMarkdown?: string | null;
  result?: StrategyResultMarkdownSource | null;
}) {
  const rawMarkdown = input.finalAnswerMarkdown?.trim() ?? "";
  const fallbackMarkdown = input.result ? formatStrategyResultAsMarkdown(input.result) : "";

  if (!rawMarkdown) {
    return fallbackMarkdown;
  }

  const payload = parseStrategyPayload(rawMarkdown);

  if (payload) {
    const reportJson = readRecord(input.result?.reportJson);
    const payloadMarkdown = sanitizeFinalAnswerMarkdown(readFirstText([
      readRecordField(payload, MARKDOWN_KEYS)
    ]));
    const code = readCompleteStrategyCodeFromSources(payload, input.result, reportJson);

    if (payloadMarkdown) {
      return appendGeneratedCodeIfMissing(payloadMarkdown, code);
    }

    const explanation = sanitizeConclusionText(readFirstText([
      readRecordField(payload, CONCLUSION_KEYS),
      readRecordField(input.result, CONCLUSION_KEYS),
      readRecordField(reportJson, CONCLUSION_KEYS)
    ]));

    return buildStrategyMarkdown(explanation, code);
  }

  if (looksLikeStructuredStrategyPayload(rawMarkdown)) {
    return fallbackMarkdown || "模型未返回有效内容。";
  }

  return rawMarkdown;
}

export function extractCompleteStrategyCodeFromMarkdown(markdown: string): StrategyCodeExtraction {
  const blocks = extractFencedCodeBlocks(markdown);
  let sawCodeLikeBlock = false;

  for (const block of blocks) {
    const code = sanitizeStrategyCode(block.code);
    const heading = findNearestHeadingBefore(markdown, block.index);
    const context = markdown.slice(Math.max(0, block.index - 180), block.index);
    const explicitFullCodeContext = FULL_CODE_HEADING_PATTERN.test(heading) || FULL_CODE_CONTEXT_PATTERN.test(context);

    sawCodeLikeBlock = sawCodeLikeBlock || isCodeFenceLanguage(block.language) || looksLikeCodeSnippet(code) || looksLikeDiffOrPatch(code);

    if (explicitFullCodeContext && looksLikeCompleteStrategyCode(code)) {
      return {
        code,
        codeLevel: "full",
        generatedCodeSource: "markdown_code_section"
      };
    }
  }

  if (looksLikeDiffOrPatch(markdown) || sawCodeLikeBlock) {
    return {
      code: null,
      codeLevel: "snippet",
      generatedCodeSource: "none"
    };
  }

  return {
    code: null,
    codeLevel: "none",
    generatedCodeSource: "none"
  };
}

export function normalizeCompleteStrategyCode(value: string | null | undefined) {
  const code = sanitizeStrategyCode(value);

  return looksLikeCompleteStrategyCode(code) ? code : null;
}

export function looksLikeCompleteStrategyCode(value: string | null | undefined) {
  const code = sanitizeStrategyCode(value);

  if (!code || code.length < 80 || looksLikeDiffOrPatch(code) || looksLikePseudoOrPlaceholder(code)) {
    return false;
  }

  const lines = code.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 5 || !looksLikeCodeSnippet(code)) {
    return false;
  }

  const hasInitialize = /\bdef\s+initialize\s*\(\s*context\b/.test(code);
  const hasHandleData = /\bdef\s+handle_data\s*\(\s*context\s*,\s*data\b/.test(code);
  const hasBeforeOrAfterTrading = /\bdef\s+(?:before_trading_start|after_trading_end)\s*\(/.test(code);
  const hasScheduler = /\b(?:run_daily|run_weekly|run_monthly|schedule_function)\s*\(/.test(code);
  const hasQmtInit = /\bdef\s+init\s*\(\s*(?:C|ContextInfo)\b/.test(code);
  const hasQmtHandlebar = /\bdef\s+handlebar\s*\(\s*(?:C|ContextInfo)\b/.test(code);
  const hasXtQuantRuntime = /\bxtdata\b|\bxttrader\b|\bXtQuantTrader\b/.test(code);
  const hasExecution = /\b(?:order|order_value|order_target|order_target_value|order_target_percent|passorder)\s*\(/.test(code)
    || /\bXtQuantTrader\b/.test(code);
  const hasMarketData = /\b(?:get_price|get_history|history|attribute_history|get_fundamentals|get_market_data_ex|get_history_data|get_trade_detail_data)\s*\(/.test(code)
    || /\b(?:C|ContextInfo)\.get_(?:market_data_ex|history_data|full_tick)\s*\(/.test(code)
    || /\bxtdata\./.test(code);
  const hasStateOrParams = /\bg\.|context\.|class\s+G\b|set_(?:benchmark|option|universe)\s*\(|C\.|account_id|stock_pool|security|g\./.test(code);
  const hasMultipleFunctions = (code.match(/\bdef\s+\w+\s*\(/g) ?? []).length >= 2;
  const ptradeOrJoinQuantComplete = hasInitialize && (hasHandleData || hasScheduler || hasBeforeOrAfterTrading || hasMultipleFunctions)
    && (hasExecution || hasMarketData)
    && hasStateOrParams;
  const qmtBuiltInComplete = hasQmtInit && hasQmtHandlebar && (hasExecution || hasMarketData);
  const xtQuantComplete = hasXtQuantRuntime && /\b(?:connect|start|subscribe|order|buy|sell|xt_trader)\b/i.test(code)
    && (hasExecution || hasMarketData);

  return ptradeOrJoinQuantComplete || qmtBuiltInComplete || xtQuantComplete;
}

export function inferStrategyCodeLevelFromMarkdown(markdown: string, generatedCode?: string | null): StrategyCodeLevel {
  if (normalizeCompleteStrategyCode(generatedCode)) {
    return "full";
  }

  return extractCompleteStrategyCodeFromMarkdown(markdown).codeLevel;
}

function buildStrategyMarkdown(explanation: string | null | undefined, code: string | null | undefined) {
  const parts = [
    explanation?.trim() ?? "",
    code?.trim()
      ? [
          explanation?.trim() ? "" : null,
          "## 完整策略代码",
          "```python",
          code.trim(),
          "```"
        ].filter((item): item is string => item !== null).join("\n")
      : ""
  ].filter(Boolean);

  return parts.join("\n").trim();
}

function parseStrategyPayload(value: string, depth = 0): Record<string, unknown> | null {
  if (depth > 2) {
    return null;
  }

  const candidate = unwrapMarkdownFence(value);
  const direct = parseJsonRecord(candidate);

  if (direct) {
    return expandStrategyRecord(direct, depth);
  }

  const extracted = extractJsonObject(candidate);
  const extractedRecord = extracted ? parseJsonRecord(extracted) : null;

  return extractedRecord ? expandStrategyRecord(extractedRecord, depth) : null;
}

function expandStrategyRecord(record: Record<string, unknown>, depth: number) {
  const nested = NESTED_KEYS
    .map((key) => readRecordField(record, [key]))
    .map(readRecord)
    .find(Boolean);
  const markdownPayload = MARKDOWN_KEYS
    .map((key) => readRecordField(record, [key]))
    .map(readText)
    .find((item): item is string => Boolean(item));
  const parsedMarkdown = markdownPayload ? parseStrategyPayload(markdownPayload, depth + 1) : null;

  return {
    ...record,
    ...(nested ?? {}),
    ...(parsedMarkdown ?? {})
  };
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.map(readRecord).find(Boolean) ?? null;
    }

    return readRecord(parsed);
  } catch {
    return null;
  }
}

function extractJsonObject(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  return value.slice(start, end + 1);
}

function looksLikeStructuredStrategyPayload(value: string) {
  const candidate = unwrapMarkdownFence(value);

  return /^\s*[{[]/.test(candidate)
    || /^```(?:json)?\s*[\r\n]/i.test(value.trim())
    || /"(?:scopeStatus|generatedCode|strategyCode|explanation|summary|conclusion|overview)"\s*:/.test(candidate);
}

function appendGeneratedCodeIfMissing(markdown: string, code: string | null) {
  const trimmed = markdown.trim();

  if (!code) {
    return trimmed;
  }

  const extracted = extractCompleteStrategyCodeFromMarkdown(trimmed);

  if (extracted.code || trimmed.includes(code.trim())) {
    return trimmed;
  }

  return [
    trimmed,
    "",
    "## 完整策略代码",
    "```python",
    code.trim(),
    "```"
  ].join("\n");
}

function readCompleteStrategyCodeFromSources(...sources: Array<unknown>) {
  for (const source of sources) {
    const sourceRecord = readRecord(source);
    const code = normalizeCompleteStrategyCode(readFirstText([
      readRecordField(sourceRecord, CODE_KEYS)
    ]));

    if (code) {
      return code;
    }
  }

  return null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readRecordField(record: unknown, keys: string[]) {
  const source = readRecord(record);

  if (!source) {
    return null;
  }

  const normalizedKeys = new Set(keys.map(normalizeKey));
  const entry = Object.entries(source).find(([key]) => normalizedKeys.has(normalizeKey(key)));

  return entry?.[1] ?? null;
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[\s_-]/g, "");
}

function readFirstText(values: unknown[]) {
  for (const value of values) {
    const text = readText(value);

    if (text) {
      return text;
    }
  }

  return null;
}

function sanitizeFinalAnswerMarkdown(value: string | null | undefined) {
  const text = decodeEscapedText(stripStringShell(value ?? "")).trim();

  if (!text || looksLikeStructuredStrategyPayload(text)) {
    return null;
  }

  return text;
}

function readText(value: unknown): string | null {
  if (typeof value === "string") {
    return decodeEscapedText(stripStringShell(value)).trim() || null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(readText).filter(Boolean).join("\n").trim() || null;
  }

  const record = readRecord(value);

  if (!record) {
    return null;
  }

  return readFirstText([
    readRecordField(record, ["text", "content", "value", "summary", "description"]),
    readRecordField(record, CONCLUSION_KEYS),
    readRecordField(record, CODE_KEYS)
  ]);
}

function stripStringShell(value: string) {
  let text = value.trim();

  for (let index = 0; index < 2; index += 1) {
    const quote = text[0];

    if ((quote !== "\"" && quote !== "'") || text[text.length - 1] !== quote) {
      break;
    }

    if (quote === "\"") {
      try {
        const parsed = JSON.parse(text);

        if (typeof parsed === "string") {
          text = parsed.trim();
          continue;
        }
      } catch {
        // Fall through to the simple shell strip below.
      }
    }

    text = text.slice(1, -1).trim();
  }

  return text;
}

function decodeEscapedText(value: string) {
  if (!/\\[nrt"]/.test(value)) {
    return value;
  }

  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, "\"");
}

function sanitizeConclusionText(value: string | null | undefined) {
  const text = decodeEscapedText(stripStringShell(value ?? "")).trim();

  if (!text || looksLikeStructuredStrategyPayload(text)) {
    return null;
  }

  return text;
}

function sanitizeStrategyCode(value: string | null | undefined) {
  const text = stripMarkdownFence(value ?? "")
    .replace(/^#{1,6}\s*(?:完整策略代码|策略代码|完整代码|代码|code)\s*$/gim, "")
    .trim();

  return text || null;
}

function extractFencedCodeBlocks(value: string) {
  return [...value.matchAll(/```([\w+-]+)?\s*\r?\n([\s\S]*?)```/g)]
    .map((match) => ({
      index: match.index ?? 0,
      language: match[1]?.trim().toLowerCase() ?? "",
      code: match[2]?.trim() ?? ""
    }))
    .filter((block) => block.code);
}

function findNearestHeadingBefore(markdown: string, index: number) {
  const before = markdown.slice(0, index);
  const headings = [...before.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)];
  const heading = headings[headings.length - 1]?.[1]?.trim() ?? "";

  return heading;
}

function looksLikeCodeSnippet(value: string | null | undefined) {
  const code = value?.trim() ?? "";

  return /\b(def|class|import|from|return|if|for|while)\b|order_|get_|set_universe|handle_data|initialize|passorder|xtdata|xttrader/.test(code)
    || /^\s*(?:g|context|C|ContextInfo)\.[A-Za-z_]\w*\s*=/m.test(code)
    || /^\s*[A-Za-z_]\w*\s*=/m.test(code);
}

function looksLikeDiffOrPatch(value: string | null | undefined) {
  const code = value?.trim() ?? "";

  return /^diff --git\b/m.test(code)
    || /^@@\s/m.test(code)
    || /^(?:---|\+\+\+)\s+\S+/m.test(code)
    || code.split(/\r?\n/).filter((line) => /^[+-](?![+-])/.test(line)).length >= 3;
}

function looksLikePseudoOrPlaceholder(value: string | null | undefined) {
  const code = value?.trim() ?? "";

  return /伪代码|pseudo\s*code|仅示例|示例片段|替换片段|局部函数|此处省略|省略其余|TODO/i.test(code)
    || /^\s*(?:\.\.\.|…)\s*$/m.test(code);
}

function isCodeFenceLanguage(value: string | null | undefined) {
  return /^(?:py|python|diff|patch|qmt|ptrade|joinquant)$/i.test(value ?? "");
}

function unwrapMarkdownFence(value: string) {
  return stripMarkdownFence(value).trim();
}

function stripMarkdownFence(value: string) {
  const text = value.trim();
  const fence = text.match(/^```(?:[\w+-]+)?\s*\r?\n([\s\S]*?)\r?\n?```\s*$/);

  return fence?.[1]?.trim() ?? text;
}
