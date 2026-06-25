import type { AiMessage, AiTaskType } from "@/server/domain";

export type AiContinuationDraft = {
  prompt: string;
  previousTail: string;
  previousMessageId: string;
};

const CONTINUATION_TAIL_CHARS = 6000;
const CONTINUATION_INTENT_PATTERN =
  /^(?:请|麻烦|帮我)?\s*(?:继续(?:输出|写|生成|补全)?|接着(?:写|输出|生成)?|续写|补全(?:下面|剩下|后面)?|从(?:刚才|上次|断点|截断处).*继续|接上(?:文|面)|不要停)\s*[。.!！,，\s]*(?:谢谢)?$/i;
const CONTINUATION_INTENT_KEYWORDS = [
  "继续输出",
  "继续写",
  "继续生成",
  "接着写",
  "接着输出",
  "补全下面",
  "补全剩下",
  "从刚才断的地方继续",
  "从断点继续",
  "从截断处继续",
  "接上文",
  "续写"
];

export function isContinuationIntent(value: string | null | undefined) {
  const text = normalizeContinuationText(value);

  if (!text) {
    return false;
  }

  if (CONTINUATION_INTENT_PATTERN.test(text)) {
    return true;
  }

  return text.length <= 80 && CONTINUATION_INTENT_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function findLatestPartialAssistantMessage(messages: AiMessage[]): AiMessage | null {
  for (const message of [...messages].reverse()) {
    if (message.role !== "assistant") {
      continue;
    }

    return isPartialAssistantMessage(message) ? message : null;
  }

  return null;
}

export function buildContinuationDraft(input: {
  messages: AiMessage[];
  taskType: AiTaskType;
  userPrompt: string | null | undefined;
}): AiContinuationDraft | null {
  if (input.taskType !== "strategy_generation" && input.taskType !== "code_conversion") {
    return null;
  }

  if (!isContinuationIntent(input.userPrompt)) {
    return null;
  }

  const previous = findLatestPartialAssistantMessage(input.messages);
  const previousTail = getContinuationTail(readAssistantOutput(previous));

  if (!previous || !previousTail) {
    return null;
  }

  return {
    prompt: buildContinuationPrompt({
      taskType: input.taskType,
      userPrompt: input.userPrompt,
      previousTail
    }),
    previousTail,
    previousMessageId: previous.id
  };
}

export function buildContinuationPrompt(input: {
  taskType: AiTaskType;
  userPrompt: string | null | undefined;
  previousTail: string;
}) {
  const taskName = input.taskType === "code_conversion" ? "代码转换" : "完整策略生成";

  return [
    "你正在补全上一条被截断的代码输出。",
    "不要从头重新输出。",
    "不要重复上一条已经输出过的内容。",
    "只从上一条内容的截断点之后继续。",
    "如果上一条停在半句代码、半个括号、半个字符串或半个代码块中，请先补齐该语法结构。",
    "输出应延续原始任务的平台、策略意图和代码风格。",
    "完成后正常收尾。",
    "",
    `原始任务类型：${taskName}`,
    `当前用户续写请求：${normalizeContinuationText(input.userPrompt) || "继续输出"}`,
    "",
    "上一条 assistant 输出末尾片段（仅用于定位截断点，禁止重复输出）：",
    "<previous_assistant_tail>",
    input.previousTail,
    "</previous_assistant_tail>"
  ].join("\n");
}

export function isPartialReportJson(value: unknown) {
  const report = readRecord(value);

  return report?.truncated === true || report?.partial === true;
}

function isPartialAssistantMessage(message: AiMessage) {
  const contentJson = readRecord(message.contentJson);
  const result = readRecord(contentJson?.result);
  const parsedResult = readRecord(contentJson?.parsedResult);

  return isPartialReportJson(result?.reportJson) ||
    isPartialReportJson(parsedResult?.reportJson) ||
    isPartialReportJson(contentJson?.reportJson);
}

function readAssistantOutput(message: AiMessage | null) {
  if (!message) {
    return "";
  }

  const contentJson = readRecord(message.contentJson);
  const finalAnswerMarkdown = contentJson?.finalAnswerMarkdown;

  return typeof finalAnswerMarkdown === "string" && finalAnswerMarkdown.trim()
    ? finalAnswerMarkdown
    : message.content;
}

function getContinuationTail(value: string) {
  const text = value.trim();

  if (!text) {
    return "";
  }

  return text.length > CONTINUATION_TAIL_CHARS ? text.slice(-CONTINUATION_TAIL_CHARS) : text;
}

function normalizeContinuationText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
    ? value as Record<string, unknown>
    : null;
}
