import { getAiModelName } from "@/server/env";
import type { AiTask, AiTaskScopeStatus } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import type { AiProviderInput, AiProviderResult } from "@/server/ai/providers/types";

export async function runMockAiProvider(input: AiProviderInput): Promise<AiProviderResult> {
  const { task } = input;

  if (containsFailureTrigger(task.prompt) || containsFailureTrigger(task.inputCode)) {
    throw new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请调整输入后重试", 500);
  }

  if (isClearlyOutOfScope(task)) {
    return mockOutOfScopeResult(input);
  }

  if (task.type === "strategy_generation") {
    return mockStrategyGeneration(input);
  }

  if (task.type === "code_conversion") {
    return mockCodeConversion(input);
  }

  return mockCodeAnalysis(input);
}

function mockOutOfScopeResult({ task, skill, config }: AiProviderInput): AiProviderResult {
  return {
    scopeStatus: "out_of_scope",
    generatedCode: null,
    explanation: skill.outOfScopeResponse,
    migrationNotes: null,
    riskWarnings: ["本次请求已完成模块范围判断，未提供投资建议、收益承诺或个股推荐。"],
    reportJson: baseReport(task, "out_of_scope", config, {
      overview: skill.outOfScopeResponse,
      scopeRules: [...skill.scopeRules]
    }),
    model: getAiModelName("mock"),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockStrategyGeneration({ task, config }: AiProviderInput): AiProviderResult {
  const targetPlatform = task.targetPlatform ?? "PTrade";
  const prompt = task.prompt ?? "双均线策略";

  return {
    scopeStatus: "in_scope",
    generatedCode: `# ${targetPlatform} 策略示例：${prompt}

def initialize(context):
    g.security = "600036.SS"
    set_universe([g.security])
    g.short_window = 20
    g.long_window = 60

def handle_data(context, data):
    hist = get_history(g.security, "1d", g.long_window + 1, ["close"])
    close = hist["close"]
    ma_short = close.rolling(g.short_window).mean().iloc[-1]
    ma_long = close.rolling(g.long_window).mean().iloc[-1]

    if ma_short > ma_long:
        order_target_percent(g.security, 1.0)
    elif ma_short < ma_long:
        order_target_percent(g.security, 0.0)
`,
    explanation: `已根据「${prompt}」生成 ${targetPlatform} 风格的策略骨架，包含初始化、行情读取、均线计算和目标仓位调整。`,
    migrationNotes: null,
    riskWarnings: ["示例代码仅用于学习和回测验证", "实盘前请补充滑点、手续费、风控和异常行情处理"],
    reportJson: baseReport(task, "in_scope", config, {
      overview: "双均线趋势跟随策略",
      parameters: ["short_window=20", "long_window=60"],
      platform: targetPlatform
    }),
    model: getAiModelName("mock"),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockCodeConversion({ task, config }: AiProviderInput): AiProviderResult {
  const sourcePlatform = task.sourcePlatform ?? "JoinQuant";
  const targetPlatform = task.targetPlatform ?? "PTrade";
  const input = task.inputCode?.trim() || "# 原始策略代码";

  return {
    scopeStatus: "in_scope",
    generatedCode: `# 已从 ${sourcePlatform} 转换到 ${targetPlatform}
${input}

# TODO: 按 ${targetPlatform} API 复核数据读取、下单与账户字段。
`,
    explanation: `已生成 ${targetPlatform} 版本的代码草稿，并保留原策略核心结构。`,
    migrationNotes: `${sourcePlatform} 到 ${targetPlatform} 的迁移重点是行情接口、下单函数、账户对象和交易日调度语义。`,
    riskWarnings: ["不同平台回测撮合和复权规则可能不同", "转换后必须逐行复核接口兼容性"],
    reportJson: baseReport(task, "in_scope", config, {
      sourcePlatform,
      targetPlatform,
      changedAreas: ["行情数据接口", "下单函数", "账户字段"]
    }),
    model: getAiModelName("mock"),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockCodeAnalysis({ task, config }: AiProviderInput): AiProviderResult {
  return {
    scopeStatus: "in_scope",
    generatedCode: null,
    explanation: "该策略包含初始化、行情读取、信号计算与调仓执行四个主要部分。",
    migrationNotes: null,
    riskWarnings: ["未看到完整异常处理", "需要确认仓位上限和止损规则", "历史数据窗口不足时应避免直接下单"],
    reportJson: baseReport(task, "in_scope", config, {
      overview: "策略通过技术指标生成交易信号，并根据条件调整仓位。",
      tradingLogic: ["读取历史行情", "计算指标", "判断买卖信号", "执行目标仓位"],
      parameters: ["均线窗口", "标的代码", "目标仓位"],
      optimizationSuggestions: ["加入交易成本假设", "增加最大回撤控制", "处理停牌和涨跌停场景"]
    }),
    model: getAiModelName("mock"),
    tokenUsage: mockTokenUsage(task)
  };
}

function baseReport(task: AiTask, scopeStatus: AiTaskScopeStatus, config: AiProviderInput["config"], extra: Record<string, unknown>) {
  return {
    scopeStatus,
    displayName: config.displayName,
    costPoints: config.costPoints,
    ...extra,
    taskType: task.type
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

  if (!input.trim() || hasTaskRelevantSignal(task, input)) {
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
