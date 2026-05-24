import { getAiModelName, getAiProviderMode, ServerConfigError } from "@/server/env";
import type { AiTask, AiTaskResult, AiTaskScopeStatus } from "@/server/domain";
import { getAiTaskConfig } from "@/server/ai/ai-task-config";
import { getAiSkill } from "@/server/ai/skills";
import { ApiError } from "@/server/http/api-response";

export type AiProviderResult = Omit<AiTaskResult, "taskId" | "resultType" | "createdAt">;

export async function runAiProvider(task: AiTask): Promise<AiProviderResult> {
  assertMockAiAvailable();

  if (containsFailureTrigger(task.prompt) || containsFailureTrigger(task.inputCode)) {
    throw new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请调整输入后重试", 500);
  }

  if (isClearlyOutOfScope(task)) {
    return mockOutOfScopeResult(task);
  }

  if (task.type === "strategy_generation") {
    return mockStrategyGeneration(task);
  }

  if (task.type === "code_conversion") {
    return mockCodeConversion(task);
  }

  return mockCodeAnalysis(task);
}

function assertMockAiAvailable() {
  let provider: ReturnType<typeof getAiProviderMode>;

  try {
    provider = getAiProviderMode();
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("AI_PROVIDER_CONFIG_ERROR", "AI 服务配置不可用", 500);
    }

    throw error;
  }

  if (provider !== "mock" || process.env.NODE_ENV === "production") {
    throw new ApiError("AI_PROVIDER_CONFIG_ERROR", "当前环境未启用模拟 AI", 500);
  }
}

function mockOutOfScopeResult(task: AiTask): AiProviderResult {
  const skill = getAiSkill(task.type);

  return {
    scopeStatus: "out_of_scope",
    generatedCode: null,
    explanation: skill.outOfScopeResponse,
    migrationNotes: null,
    riskWarnings: ["本次请求已完成模块范围判断，未提供投资建议、收益承诺或个股推荐。"],
    reportJson: baseReport(task, "out_of_scope", {
      overview: skill.outOfScopeResponse,
      scopeRules: [...skill.scopeRules]
    }),
    model: getAiModelName(),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockStrategyGeneration(task: AiTask): AiProviderResult {
  const targetPlatform = task.targetPlatform ?? "PTrade";
  const prompt = task.prompt ?? "双均线策略";

  return {
    scopeStatus: "in_scope",
    generatedCode: `# ${targetPlatform} 策略示例：${prompt}\n\ndef initialize(context):\n    g.security = "600036.SS"\n    set_universe([g.security])\n    g.short_window = 20\n    g.long_window = 60\n\ndef handle_data(context, data):\n    hist = get_history(g.security, "1d", g.long_window + 1, ["close"])\n    close = hist["close"]\n    ma_short = close.rolling(g.short_window).mean().iloc[-1]\n    ma_long = close.rolling(g.long_window).mean().iloc[-1]\n\n    if ma_short > ma_long:\n        order_target_percent(g.security, 1.0)\n    elif ma_short < ma_long:\n        order_target_percent(g.security, 0.0)\n`,
    explanation: `已根据「${prompt}」生成 ${targetPlatform} 风格的策略骨架，包含初始化、行情读取、均线计算和目标仓位调整。`,
    migrationNotes: null,
    riskWarnings: ["示例代码仅用于学习和回测验证", "实盘前请补充滑点、手续费、风控和异常行情处理"],
    reportJson: baseReport(task, "in_scope", {
      overview: "双均线趋势跟随策略",
      parameters: ["short_window=20", "long_window=60"],
      platform: targetPlatform
    }),
    model: getAiModelName(),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockCodeConversion(task: AiTask): AiProviderResult {
  const sourcePlatform = task.sourcePlatform ?? "JoinQuant";
  const targetPlatform = task.targetPlatform ?? "PTrade";
  const input = task.inputCode?.trim() || "# 原始策略代码";

  return {
    scopeStatus: "in_scope",
    generatedCode: `# 已从 ${sourcePlatform} 转换到 ${targetPlatform}\n${input}\n\n# TODO: 按 ${targetPlatform} API 复核数据读取、下单与账户字段。\n`,
    explanation: `已生成 ${targetPlatform} 版本的代码草稿，并保留原策略核心结构。`,
    migrationNotes: `${sourcePlatform} 到 ${targetPlatform} 的迁移重点是行情接口、下单函数、账户对象和交易日调度语义。`,
    riskWarnings: ["不同平台回测撮合和复权规则可能不同", "转换后必须逐行复核接口兼容性"],
    reportJson: baseReport(task, "in_scope", {
      sourcePlatform,
      targetPlatform,
      changedAreas: ["行情数据接口", "下单函数", "账户字段"]
    }),
    model: getAiModelName(),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockCodeAnalysis(task: AiTask): AiProviderResult {
  return {
    scopeStatus: "in_scope",
    generatedCode: null,
    explanation: "该策略包含初始化、行情读取、信号计算与调仓执行四个主要部分。",
    migrationNotes: null,
    riskWarnings: ["未看到完整异常处理", "需要确认仓位上限和止损规则", "历史数据窗口不足时应避免直接下单"],
    reportJson: baseReport(task, "in_scope", {
      overview: "策略通过技术指标生成交易信号，并根据条件调整仓位。",
      tradingLogic: ["读取历史行情", "计算指标", "判断买卖信号", "执行目标仓位"],
      parameters: ["均线窗口", "标的代码", "目标仓位"],
      optimizationSuggestions: ["加入交易成本假设", "增加最大回撤控制", "处理停牌和涨跌停场景"]
    }),
    model: getAiModelName(),
    tokenUsage: mockTokenUsage(task)
  };
}

function baseReport(task: AiTask, scopeStatus: AiTaskScopeStatus, extra: Record<string, unknown>) {
  const skill = getAiSkill(task.type);
  const config = getAiTaskConfig(task.type);

  return {
    scopeStatus,
    skillId: skill.id,
    skillVersion: skill.version,
    displayName: config.displayName,
    costPoints: config.costPoints,
    ...extra
  };
}

function mockTokenUsage(task: AiTask) {
  const inputLength = `${task.prompt ?? ""}${task.inputCode ?? ""}`.length;
  const promptTokens = Math.max(20, Math.ceil(inputLength / 3));
  const completionTokens = task.type === "code_conversion" ? 260 : 180;

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens
  };
}

function isClearlyOutOfScope(task: AiTask) {
  const input = `${task.prompt ?? ""}\n${task.inputCode ?? ""}`.toLowerCase();

  if (!input.trim()) {
    return false;
  }

  if (hasTaskRelevantSignal(task, input)) {
    return false;
  }

  return [
    "天气",
    "旅游",
    "菜谱",
    "做饭",
    "情书",
    "小说",
    "诗",
    "翻译英文",
    "前端页面",
    "网页",
    "数学作业",
    "历史",
    "电影",
    "健身",
    "weather",
    "travel",
    "recipe",
    "cook",
    "love letter",
    "novel",
    "poem",
    "movie",
    "fitness"
  ].some((keyword) => input.includes(keyword));
}

function hasTaskRelevantSignal(task: AiTask, input: string) {
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
    "qmt"
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

  if (quantSignals.some((keyword) => input.includes(keyword))) {
    return true;
  }

  if (task.type === "strategy_generation") {
    return Boolean(task.inputCode && codeSignals.some((keyword) => input.includes(keyword)));
  }

  return codeSignals.some((keyword) => input.includes(keyword));
}

function containsFailureTrigger(value: string | null) {
  return Boolean(value?.includes("__FAIL__") || value?.includes("失败测试"));
}
