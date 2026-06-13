import {
  getAiApiKey,
  getAiBaseUrl,
  getAiMaxRetries,
  getAiModelName,
  getAiSupportsVision,
  getAiTaskTimeoutMs,
  type AiProviderMode,
  ServerConfigError
} from "@/server/env";
import type { AiTaskScopeStatus } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { loadTextContent } from "@/server/ai/skills/skill-content";
import type { AiProviderInput, AiProviderResult } from "@/server/ai/providers/types";

type ProviderOptions = {
  provider: Exclude<AiProviderMode, "mock">;
};

type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  supportsVision: boolean;
};

type ChatCompletionResponse = {
  model?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | null;
    } | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
};

const COMMON_PROVIDER_PROMPT = loadTextContent("common-provider.md");
const COMMON_SAFETY_PROMPT = loadTextContent("common-safety.md");
const JSON_OUTPUT_PROMPT = loadTextContent("provider-json-output.md");

export async function runOpenAiCompatibleProvider(input: AiProviderInput, options: ProviderOptions): Promise<AiProviderResult> {
  const providerConfig = readProviderConfig(options.provider);
  const payload = buildChatCompletionPayload(input, providerConfig);
  let completion = await requestChatCompletion(providerConfig, payload);
  let parsed = parseCompletionContent(completion);

  if (parsed.scopeStatus === "out_of_scope" && hasTaskRelevantSignal(input)) {
    completion = await requestChatCompletion(providerConfig, buildChatCompletionPayload(input, providerConfig, true));
    parsed = parseCompletionContent(completion);
  }

  return applyVisionFallback(normalizeProviderResult(input, parsed, {
    model: completion.model || providerConfig.model,
    tokenUsage: {
      promptTokens: numberOrZero(completion.usage?.prompt_tokens),
      completionTokens: numberOrZero(completion.usage?.completion_tokens),
      totalTokens: numberOrZero(completion.usage?.total_tokens)
    }
  }), input, providerConfig.supportsVision);
}

function readProviderConfig(provider: Exclude<AiProviderMode, "mock">): ProviderConfig {
  try {
    return {
      baseUrl: getAiBaseUrl(provider),
      apiKey: getAiApiKey(provider),
      model: getAiModelName(provider),
      timeoutMs: getAiTaskTimeoutMs(),
      maxRetries: getAiMaxRetries(),
      supportsVision: getAiSupportsVision(provider)
    };
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("AI_PROVIDER_CONFIG_ERROR", "AI 服务配置不可用", 500);
    }

    throw error;
  }
}

function buildChatCompletionPayload(input: AiProviderInput, providerConfig: ProviderConfig, forceInScope = false) {
  const usesMimoParams = shouldUseMimoCompatibleParams(providerConfig);
  const outputTokenField = usesMimoParams ? "max_completion_tokens" : "max_tokens";

  return {
    model: providerConfig.model,
    messages: [
      {
        role: "system",
        content: buildSystemMessage(input, forceInScope)
      },
      {
        role: "user",
        content: buildUserContent(input, providerConfig)
      }
    ],
    response_format: {
      type: "json_object"
    },
    [outputTokenField]: input.config.maxOutputTokens,
    temperature: 0.2,
    stream: false,
    ...(usesMimoParams ? { thinking: { type: "disabled" } } : {})
  };
}

function shouldUseMimoCompatibleParams(config: Pick<ProviderConfig, "baseUrl" | "model">) {
  return config.model.toLowerCase().startsWith("mimo-") || config.baseUrl.toLowerCase().includes("xiaomimimo.com");
}

function buildSystemMessage(input: AiProviderInput, forceInScope: boolean) {
  const { skill, config, task } = input;
  const serverScopeHint = hasTaskRelevantSignal(input) ? "in_scope" : "unknown";

  return [
    forceInScope || serverScopeHint === "in_scope"
      ? "重要：上一轮可能把明显属于量化策略或策略代码任务的输入误判为范围外。请重新判断；如果输入涉及量化策略、策略代码、交易逻辑、指标、回测、调仓、风控或平台迁移，本轮必须按 in_scope 输出完整 JSON 结果。"
      : "",
    serverScopeHint === "in_scope"
      ? "服务端范围预判：in_scope。用户输入已包含量化策略、平台、指标、买卖规则、代码解析或平台迁移信号。除非用户要求个股推荐、收益承诺、市场预测或明显无关内容，否则不要返回 out_of_scope，也不要使用范围外固定回复。"
      : "",
    skill.systemInstruction,
    "",
    COMMON_PROVIDER_PROMPT,
    "",
    COMMON_SAFETY_PROMPT,
    "",
    taskSpecificGuidance(task.type),
    "",
    `任务名称：${config.displayName}`,
    `任务范围：${config.scopeDescription}`,
    `范围外固定回复：${skill.outOfScopeResponse}`,
    "",
    "Scope rules:",
    ...skill.scopeRules.map((rule) => `- ${rule}`),
    "",
    "Output schema:",
    skill.outputSchemaDescription,
    "",
    JSON_OUTPUT_PROMPT
  ].filter(Boolean).join("\n");
}

function taskSpecificGuidance(type: AiProviderInput["task"]["type"]) {
  if (type === "strategy_generation") {
    return "当前任务是 strategy_generation：只要用户描述了 PTrade、聚宽 JoinQuant、QMT 的均线、指标、买入、卖出、调仓、止盈止损、风控或策略代码，就应判断为 in_scope，并给出策略代码、伪代码或策略逻辑说明。";
  }

  if (type === "code_analysis") {
    return "当前任务是 code_analysis：只要用户提供了 PTrade、聚宽 JoinQuant、QMT 策略代码、策略片段或交易逻辑，就应判断为 in_scope，并给出自然语言结构化解析。";
  }

  return "当前任务是 code_conversion：只要用户提供了 PTrade、聚宽 JoinQuant、QMT 策略代码和平台转换需求，就应判断为 in_scope，并给出转换代码、迁移说明和兼容性风险。";
}

function buildUserContent(input: AiProviderInput, providerConfig: ProviderConfig) {
  const text = buildUserMessage(input, providerConfig);
  const imageAttachments = getImageAttachments(input);

  if (!providerConfig.supportsVision || imageAttachments.length === 0) {
    return text;
  }

  return [
    {
      type: "text",
      text
    },
    ...imageAttachments.map((attachment) => ({
      type: "image_url",
      image_url: {
        url: attachment.dataUrl,
        detail: "auto"
      }
    }))
  ];
}

function buildUserMessage(input: AiProviderInput, providerConfig: ProviderConfig) {
  const { task } = input;
  const imageAttachments = getImageAttachments(input);
  const imageNote = imageAttachments.length === 0
    ? ""
    : providerConfig.supportsVision
      ? `图片附件：${imageAttachments.map((attachment) => `${attachment.originalName} (${attachment.mimeType}, ${attachment.sizeBytes} bytes)`).join("；")}。请结合图片内容，但不要输出隐私思维链。`
      : `图片附件未参与模型理解：${imageAttachments.map((attachment) => attachment.originalName).join("、")}。当前模型未配置 vision 能力，请仅基于文字输入处理，并提示用户可补充文字说明或切换支持图片的模型。`;

  return [
    `taskType: ${task.type}`,
    `sourcePlatform: ${task.sourcePlatform ?? ""}`,
    `targetPlatform: ${task.targetPlatform ?? ""}`,
    `serverScopeHint: ${hasTaskRelevantSignal(input) ? "in_scope" : "unknown"}`,
    "",
    input.conversationContext
      ? [
          "最近对话记忆（服务端已截断，仅用于理解追问和延续修改；不要逐字复述）：",
          input.conversationContext
        ].join("\n")
      : "最近对话记忆：无",
    "",
    "用户需求：",
    task.prompt ?? "",
    imageNote,
    "",
    "输入代码：",
    task.inputCode ?? ""
  ].join("\n");
}

function getImageAttachments(input: AiProviderInput) {
  return (input.attachments ?? []).filter((attachment) => attachment.kind === "image");
}

async function requestChatCompletion(config: ProviderConfig, payload: Record<string, unknown>): Promise<ChatCompletionResponse> {
  let lastError: unknown = null;
  const attempts = Math.max(1, config.maxRetries + 1);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(createChatCompletionUrl(config.baseUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw apiErrorForProviderStatus(response.status);
      }

      const json = await parseProviderJson(response);

      if (!isObject(json)) {
        throw new ApiError("AI_PROVIDER_BAD_RESPONSE", "AI 服务返回格式异常，请稍后重试", 502);
      }

      return json as ChatCompletionResponse;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (!shouldRetryProviderError(error, attempt, attempts)) {
        throw normalizeProviderError(error);
      }
    }
  }

  throw normalizeProviderError(lastError);
}

function createChatCompletionUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");

  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

function apiErrorForProviderStatus(status: number) {
  if (status === 401 || status === 403) {
    return new ApiError("AI_PROVIDER_CONFIG_ERROR", "AI 服务配置不可用", 500);
  }

  if (status === 408 || status === 504) {
    return new ApiError("AI_PROVIDER_TIMEOUT", "AI 服务响应超时，请稍后重试或减少代码量", 504);
  }

  if (status === 409 || status === 429 || status >= 500) {
    return new ApiError("AI_TASK_FAILED", "AI 服务暂时不可用，请稍后再试", 502);
  }

  return new ApiError("AI_PROVIDER_BAD_RESPONSE", "AI 服务返回异常，请稍后重试", 502);
}

function parseCompletionContent(completion: ChatCompletionResponse) {
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new ApiError("AI_PROVIDER_BAD_RESPONSE", "AI 服务返回内容为空，请稍后重试", 502);
  }

  return parseModelJson(content);
}

async function parseProviderJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new ApiError("AI_PROVIDER_BAD_RESPONSE", "AI 服务返回格式异常，请稍后重试", 502);
  }
}

function shouldRetryProviderError(error: unknown, attempt: number, attempts: number) {
  if (attempt >= attempts - 1) {
    return false;
  }

  if (error instanceof ApiError) {
    return error.code === "AI_TASK_FAILED";
  }

  return true;
}

function normalizeProviderError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new ApiError("AI_PROVIDER_TIMEOUT", "AI 服务响应超时，请稍后重试或减少代码量", 504);
  }

  return new ApiError("AI_TASK_FAILED", "AI 服务暂时不可用，请稍后再试", 502);
}

function parseModelJson(content: string) {
  const trimmed = content.trim();
  const direct = safeJsonParse(trimmed);

  if (direct) {
    return direct;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  const repaired = match ? safeJsonParse(match[0]) : null;

  if (!repaired) {
    throw new ApiError("AI_PROVIDER_BAD_RESPONSE", "模型返回内容无法解析，请稍后重试", 502);
  }

  return repaired;
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);

    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeProviderResult(
  input: AiProviderInput,
  parsed: Record<string, unknown>,
  meta: {
    model: string;
    tokenUsage: AiProviderResult["tokenUsage"];
  }
): AiProviderResult {
  const scopeStatus = parsed.scopeStatus === "out_of_scope" ? "out_of_scope" : "in_scope";

  if (scopeStatus === "out_of_scope") {
    return {
      scopeStatus,
      generatedCode: null,
      explanation: input.skill.outOfScopeResponse,
      migrationNotes: null,
      riskWarnings: normalizeStringArray(parsed.riskWarnings, ["本次请求超出当前模块范围。"]),
      reportJson: buildReportJson(input, scopeStatus, parsed.reportJson),
      model: meta.model,
      tokenUsage: meta.tokenUsage
    };
  }

  return {
    scopeStatus,
    generatedCode: normalizeNullableString(parsed.generatedCode, input.config.maxResultChars),
    explanation: normalizeNullableString(parsed.explanation, input.config.maxResultChars),
    migrationNotes: normalizeNullableString(parsed.migrationNotes, input.config.maxResultChars),
    riskWarnings: normalizeStringArray(parsed.riskWarnings, ["请在回测和模拟盘中验证结果，不构成投资建议。"]),
    reportJson: buildReportJson(input, scopeStatus, parsed.reportJson),
    model: meta.model,
    tokenUsage: meta.tokenUsage
  };
}

function applyVisionFallback(result: AiProviderResult, input: AiProviderInput, supportsVision: boolean): AiProviderResult {
  const imageAttachments = getImageAttachments(input);

  if (supportsVision || imageAttachments.length === 0) {
    return result;
  }

  const message = `图片附件未参与模型理解：${imageAttachments.map((attachment) => attachment.originalName).join("、")}。当前模型未配置 vision 能力，本次结果仅基于文字输入生成。`;

  return {
    ...result,
    explanation: [message, result.explanation].filter(Boolean).join("\n\n"),
    riskWarnings: uniqueStrings([message, ...result.riskWarnings]).slice(0, 12),
    reportJson: {
      ...(result.reportJson ?? {}),
      imageFallback: {
        reason: "provider_without_vision",
        attachments: imageAttachments.map((attachment) => ({
          fileId: attachment.fileId,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes
        }))
      }
    }
  };
}

function buildReportJson(input: AiProviderInput, scopeStatus: AiTaskScopeStatus, value: unknown) {
  const report = isObject(value) ? value : {};

  return {
    ...report,
    processingMode: typeof report.processingMode === "string" ? report.processingMode : "single",
    scopeStatus,
    skillId: input.skill.id,
    skillVersion: input.skill.version,
    displayName: input.config.displayName,
    costPoints: input.config.costPoints
  };
}

function normalizeNullableString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12);

  return items.length ? items : fallback;
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasTaskRelevantSignal({ task, conversationContext }: AiProviderInput) {
  const input = `${task.prompt ?? ""}\n${task.inputCode ?? ""}\n${conversationContext ?? ""}`.toLowerCase();
  const quantSignals = [
    "策略",
    "量化",
    "交易",
    "回测",
    "买入",
    "卖出",
    "调仓",
    "仓位",
    "选股",
    "止盈",
    "止损",
    "风控",
    "均线",
    "指标",
    "ptrade",
    "joinquant",
    "聚宽",
    "qmt",
    "xtquant",
    "xtdata",
    "xttrader",
    "passorder"
  ];
  const codeSignals = [
    "def ",
    "import ",
    "initialize",
    "handle_data",
    "order_",
    "context",
    "get_price",
    "get_history",
    "set_universe",
    "data.",
    "g."
  ];

  return quantSignals.some((keyword) => input.includes(keyword)) || codeSignals.some((keyword) => input.includes(keyword));
}
