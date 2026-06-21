export type StrategyResultMarkdownSource = {
  explanation?: string | null;
  generatedCode?: string | null;
  reportJson?: Record<string, unknown> | null;
  [key: string]: unknown;
};

const CONCLUSION_HEADING = "结论概述";
const CODE_HEADING = "策略代码";
const DEFAULT_CONCLUSION = "已完成策略处理，请查看下方代码。";
const DEFAULT_CODE_COMMENT = "# 暂无可直接运行的策略代码。";

const CONCLUSION_KEYS = ["explanation", "summary", "conclusion", "overview", "description"];
const CODE_KEYS = ["generatedCode", "strategyCode", "code", "targetCode", "pythonCode", "sourceCode"];
const NESTED_KEYS = ["result", "data", "output", "payload", "response"];
const MARKDOWN_KEYS = ["finalAnswerMarkdown", "markdown", "content"];

export function formatStrategyResultAsMarkdown(result: StrategyResultMarkdownSource | null | undefined) {
  const reportJson = readRecord(result?.reportJson);
  const explanation = sanitizeConclusionText(readFirstText([
    readRecordField(result, CONCLUSION_KEYS),
    readRecordField(reportJson, CONCLUSION_KEYS)
  ]));
  const code = sanitizeStrategyCode(readFirstText([
    readRecordField(result, CODE_KEYS),
    readRecordField(reportJson, CODE_KEYS)
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
    const explanation = sanitizeConclusionText(readFirstText([
      readRecordField(payload, CONCLUSION_KEYS),
      readRecordField(input.result, CONCLUSION_KEYS),
      readRecordField(reportJson, CONCLUSION_KEYS)
    ]));
    const code = sanitizeStrategyCode(readFirstText([
      readRecordField(payload, CODE_KEYS),
      readRecordField(input.result, CODE_KEYS),
      readRecordField(reportJson, CODE_KEYS)
    ]));

    return buildStrategyMarkdown(explanation, code);
  }

  if (looksLikeStructuredStrategyPayload(rawMarkdown)) {
    return fallbackMarkdown || buildStrategyMarkdown(null, null);
  }

  return rawMarkdown;
}

function buildStrategyMarkdown(explanation: string | null | undefined, code: string | null | undefined) {
  return [
    `## ${CONCLUSION_HEADING}`,
    explanation?.trim() || DEFAULT_CONCLUSION,
    "",
    `## ${CODE_HEADING}`,
    "```python",
    code?.trim() || DEFAULT_CODE_COMMENT,
    "```"
  ].join("\n");
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
  const text = stripMarkdownFence(value ?? "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();

  if (!text || looksLikeStructuredStrategyPayload(text)) {
    return null;
  }

  return text;
}

function sanitizeStrategyCode(value: string | null | undefined) {
  const text = stripMarkdownFence(value ?? "")
    .replace(/^#{1,6}\s*(?:策略代码|代码|code)\s*$/gim, "")
    .trim();

  return text || null;
}

function unwrapMarkdownFence(value: string) {
  return stripMarkdownFence(value).trim();
}

function stripMarkdownFence(value: string) {
  const text = value.trim();
  const fence = text.match(/^```(?:[\w+-]+)?\s*\r?\n([\s\S]*?)\r?\n?```\s*$/);

  return fence?.[1]?.trim() ?? text;
}
