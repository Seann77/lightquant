import {
  getAiApiKey,
  getAiBaseUrl,
  getAiMaxRetries,
  getAiModelName,
  getAiTaskTimeoutMs,
  type AiProviderMode,
  ServerConfigError
} from "@/server/env";
import type { AiTaskScopeStatus } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
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

export async function runOpenAiCompatibleProvider(input: AiProviderInput, options: ProviderOptions): Promise<AiProviderResult> {
  const providerConfig = readProviderConfig(options.provider);
  const payload = buildChatCompletionPayload(input, providerConfig);
  let completion = await requestChatCompletion(providerConfig, payload);
  let parsed = parseCompletionContent(completion);

  if (parsed.scopeStatus === "out_of_scope" && hasTaskRelevantSignal(input)) {
    completion = await requestChatCompletion(providerConfig, buildChatCompletionPayload(input, providerConfig, true));
    parsed = parseCompletionContent(completion);
  }

  return normalizeProviderResult(input, parsed, {
    model: completion.model || providerConfig.model,
    tokenUsage: {
      promptTokens: numberOrZero(completion.usage?.prompt_tokens),
      completionTokens: numberOrZero(completion.usage?.completion_tokens),
      totalTokens: numberOrZero(completion.usage?.total_tokens)
    }
  });
}

function readProviderConfig(provider: Exclude<AiProviderMode, "mock">) {
  try {
    return {
      baseUrl: getAiBaseUrl(provider),
      apiKey: getAiApiKey(provider),
      model: getAiModelName(provider),
      timeoutMs: getAiTaskTimeoutMs(),
      maxRetries: getAiMaxRetries()
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
        content: buildUserMessage(input)
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

function buildSystemMessage({ skill, config, task }: AiProviderInput, forceInScope: boolean) {
  return [
    forceInScope
      ? "重要：上一轮把一个明显属于量化策略/代码任务的输入误判为范围外。请纠正判断，本轮必须按 in_scope 输出完整结果。"
      : "",
    skill.systemInstruction,
    "",
    "你是 LightQuant 量化策略助手的服务端 AI 模块。",
    "你不提供投资建议，不承诺收益，不推荐具体股票，不输出任何诱导实盘交易的保证性话术。",
    "如果用户要求“不要推荐具体股票”“不要承诺收益”“仅用于回测学习”，这是合规约束，不是范围外请求。",
    "只要用户请求包含量化策略、交易逻辑、指标、回测、调仓、风控、策略代码解析或平台代码转换，应优先判定为 in_scope。",
    "你必须遵守当前模块的 scopeRules；如果用户请求超出范围，返回 scopeStatus=out_of_scope，并使用指定的 outOfScopeResponse。",
    "你必须只输出合法 JSON，不要使用 Markdown 代码围栏，不要输出 JSON 之外的文字。",
    task.type === "strategy_generation"
      ? "当前任务是 strategy_generation：只要用户描述了 PTrade、聚宽 JoinQuant、QMT 的均线、指标、买入、卖出、调仓、止盈止损、风控或策略代码，就必须判定为 in_scope，并给出策略代码或伪代码。"
      : "",
    task.type === "code_analysis"
      ? "当前任务是 code_analysis：只要用户提供了 PTrade、聚宽 JoinQuant、QMT 策略代码或交易逻辑，就必须判定为 in_scope，并给出自然语言结构化解析。"
      : "",
    task.type === "code_conversion"
      ? "当前任务是 code_conversion：只要用户提供了 PTrade、聚宽 JoinQuant、QMT 策略代码和平台转换需求，就必须判定为 in_scope，并给出转换代码和迁移说明。"
      : "",
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
    "必须返回如下 JSON 字段：",
    JSON.stringify({
      scopeStatus: "in_scope | out_of_scope",
      generatedCode: "string | null",
      explanation: "string | null",
      migrationNotes: "string | null",
      riskWarnings: ["string"],
      reportJson: {}
    })
  ].join("\n");
}

function buildUserMessage({ task }: AiProviderInput) {
  return [
    `taskType: ${task.type}`,
    `sourcePlatform: ${task.sourcePlatform ?? ""}`,
    `targetPlatform: ${task.targetPlatform ?? ""}`,
    "",
    "用户需求：",
    task.prompt ?? "",
    "",
    "输入代码：",
    task.inputCode ?? ""
  ].join("\n");
}

async function requestChatCompletion(
  config: {
    baseUrl: string;
    apiKey: string;
    timeoutMs: number;
    maxRetries: number;
  },
  payload: Record<string, unknown>
): Promise<ChatCompletionResponse> {
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

      const json = await response.json();

      if (!isObject(json)) {
        throw new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请稍后再试", 500);
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

  if (status === 408 || status === 409 || status === 429 || status >= 500) {
    return new ApiError("AI_TASK_FAILED", "AI 服务暂时不可用，请稍后再试", 502);
  }

  return new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请稍后再试", 500);
}

function parseCompletionContent(completion: ChatCompletionResponse) {
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请稍后再试", 500);
  }

  return parseModelJson(content);
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
    return new ApiError("AI_TASK_FAILED", "AI 服务响应超时，请稍后再试", 504);
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
    throw new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请稍后再试", 500);
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

function buildReportJson(input: AiProviderInput, scopeStatus: AiTaskScopeStatus, value: unknown) {
  return {
    ...(isObject(value) ? value : {}),
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

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasTaskRelevantSignal({ task }: AiProviderInput) {
  const input = `${task.prompt ?? ""}\n${task.inputCode ?? ""}`.toLowerCase();
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
