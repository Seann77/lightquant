import { getAiModelName } from "@/server/env";
import type { AiTask, AiTaskScopeStatus } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { formatProviderResultAsMarkdown } from "@/server/ai/streaming-markdown-result";
import type { AiProviderInput, AiProviderResult, AiProviderStreamCallbacks, AiProviderStreamResult } from "@/server/ai/providers/types";

type MockProviderOptions = {
  model?: string;
};

export async function runMockAiProvider(input: AiProviderInput, options: MockProviderOptions = {}): Promise<AiProviderResult> {
  const { task } = input;

  if (containsFailureTrigger(task.prompt) || containsFailureTrigger(task.inputCode)) {
    throw new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请调整输入后重试", 500);
  }

  if (isClearlyOutOfScope(task, input.conversationContext)) {
    return applyMockImageContext(mockOutOfScopeResult(input, options), input);
  }

  if (task.type === "strategy_generation") {
    return applyMockImageContext(mockStrategyGeneration(input, options), input);
  }

  if (task.type === "code_conversion") {
    return applyMockImageContext(mockCodeConversion(input, options), input);
  }

  return applyMockImageContext(mockCodeAnalysis(input, options), input);
}

export async function runMockAiProviderStream(
  input: AiProviderInput,
  callbacks: AiProviderStreamCallbacks = {},
  options: MockProviderOptions = {}
): Promise<AiProviderStreamResult> {
  const result = await runMockAiProvider(input, options);
  const visibleThinking = "";
  const finalAnswerMarkdown = formatProviderResultAsMarkdown(result, input.task);

  for (const delta of chunkText(finalAnswerMarkdown, 18)) {
    await callbacks.onDelta?.({
      type: "final_delta",
      delta
    });
    await delay(8);
  }

  return {
    result,
    visibleThinking,
    finalAnswerMarkdown
  };
}

function applyMockImageContext(result: AiProviderResult, input: AiProviderInput): AiProviderResult {
  const imageAttachments = (input.attachments ?? []).filter((attachment) => attachment.kind === "image");

  if (imageAttachments.length === 0) {
    return result;
  }

  const imageSummary = `Mock vision: 已读取 ${imageAttachments.length} 个图片附件（${imageAttachments.map((attachment) => attachment.originalName).join("、")}），并将其作为回测图/截图辅助上下文。`;

  return {
    ...result,
    explanation: [imageSummary, result.explanation].filter(Boolean).join("\n\n"),
    riskWarnings: input.task.type === "code_conversion" ? [] : [...new Set([imageSummary, ...result.riskWarnings])].slice(0, 12),
    reportJson: {
      ...(result.reportJson ?? {}),
      imageContext: {
        mode: "mock_vision",
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

function mockOutOfScopeResult({ task, skill, config }: AiProviderInput, options: MockProviderOptions): AiProviderResult {
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
    model: getMockModelName(options),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockStrategyGeneration({ task, config, conversationContext }: AiProviderInput, options: MockProviderOptions): AiProviderResult {
  const targetPlatform = task.targetPlatform ?? "PTrade";
  const prompt = task.prompt ?? "双均线策略";
  const contextText = conversationContext ?? "";
  const needsStopLoss = `${prompt}\n${contextText}`.includes("止损");

  return {
    scopeStatus: "in_scope",
    generatedCode: `# ${targetPlatform} 策略示例：${prompt}

def initialize(context):
    g.security = "600036.SS"
    set_universe([g.security])
    g.short_window = 20
    g.long_window = 60
${needsStopLoss ? "    g.stop_loss_pct = 0.08\n    g.entry_price = None" : ""}

def handle_data(context, data):
    hist = get_history(g.security, "1d", g.long_window + 1, ["close"])
    close = hist["close"]
    ma_short = close.rolling(g.short_window).mean().iloc[-1]
    ma_long = close.rolling(g.long_window).mean().iloc[-1]
${needsStopLoss ? "\n    current_price = close.iloc[-1]\n    if g.entry_price and current_price <= g.entry_price * (1 - g.stop_loss_pct):\n        order_target_percent(g.security, 0.0)\n        g.entry_price = None\n        return" : ""}

    if ma_short > ma_long:
        order_target_percent(g.security, 1.0)
${needsStopLoss ? "        g.entry_price = close.iloc[-1]" : ""}
    elif ma_short < ma_long:
        order_target_percent(g.security, 0.0)
${needsStopLoss ? "        g.entry_price = None" : ""}
`,
    explanation: `已根据“${prompt}”${contextText ? "并结合上一轮会话" : ""}生成 ${targetPlatform} 风格的策略骨架，包含初始化、行情读取、均线计算、目标仓位调整${needsStopLoss ? "和 8% 止损控制" : ""}。`,
    migrationNotes: null,
    riskWarnings: ["示例代码仅用于学习和回测验证。", "实盘前请补充滑点、手续费、风控和异常行情处理。"],
    reportJson: baseReport(task, "in_scope", config, {
      overview: "双均线趋势跟随策略。",
      parameters: ["short_window=20", "long_window=60"],
      platform: targetPlatform
    }),
    model: getMockModelName(options),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockCodeConversion({ task, config }: AiProviderInput, options: MockProviderOptions): AiProviderResult {
  const sourcePlatform = task.sourcePlatform ?? "JoinQuant";
  const targetPlatform = task.targetPlatform ?? "PTrade";
  const input = task.inputCode?.trim() || "# 原始策略代码";

  return {
    scopeStatus: "in_scope",
    generatedCode: `# 已从 ${sourcePlatform} 转换到 ${targetPlatform}
${input}

# 复核提示：按 ${targetPlatform} API 复核数据读取、下单与账户字段。
`,
    explanation: `已生成 ${targetPlatform} 版本的代码草稿，并保留原策略核心结构。`,
    migrationNotes: `${sourcePlatform} 到 ${targetPlatform} 的迁移重点是行情接口、下单函数、账户对象和交易日调度语义。`,
    riskWarnings: [],
    reportJson: baseReport(task, "in_scope", config, {
      sourcePlatform,
      targetPlatform,
      targetCode: true,
      changedAreas: ["行情数据接口", "下单函数", "账户字段"]
    }),
    model: getMockModelName(options),
    tokenUsage: mockTokenUsage(task)
  };
}

function mockCodeAnalysis({ task, config }: AiProviderInput, options: MockProviderOptions): AiProviderResult {
  return {
    scopeStatus: "in_scope",
    generatedCode: null,
    explanation: "该策略包含初始化、行情读取、信号计算与调仓执行四个主要部分。",
    migrationNotes: null,
    riskWarnings: ["未看到完整异常处理。", "需要确认仓位上限和止损规则。", "历史数据窗口不足时应避免直接下单。"],
    reportJson: baseReport(task, "in_scope", config, {
      overview: [
        { title: "策略名称", value: "示例技术指标策略", lines: ["示例技术指标策略。"] },
        { title: "平台识别", value: task.sourcePlatform ?? "代码中未明确给出", lines: [task.sourcePlatform ?? "代码中未明确给出"] },
        { title: "策略类型", value: "技术指标择时策略", lines: ["通过价格指标判断持仓方向。"] },
        { title: "交易范围", value: "单一或少量标的", lines: ["围绕预设标的运行。", "没有展示全市场选股流程。"] },
        { title: "核心思路", value: "读取行情、计算信号并调整仓位", lines: ["策略读取历史行情。", "根据指标关系生成买卖信号。", "再把持仓调整到目标仓位。"] },
        { title: "运行频率", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "无信号处理", value: "代码中未明确给出", lines: ["代码中未明确给出"] }
      ],
      tradingLogic: [
        { title: "初始化", value: "设置标的和核心参数", lines: ["策略启动时设置标的。", "同时准备指标窗口和仓位参数。"] },
        { title: "盘前/记录", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "调仓时间", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "数据读取", value: "读取历史行情", lines: ["策略读取历史收盘价。", "数据用于后续指标计算。"] },
        { title: "信号生成", value: "根据指标关系生成买卖信号", lines: ["策略先读取观察周期内的价格。", "再计算短期和长期指标。", "短期指标强于长期指标时形成买入倾向。", "短期指标弱于长期指标时形成降低仓位倾向。"] },
        { title: "目标标的形成", value: "使用预设标的", lines: ["目标标的来自初始化设置。", "代码中未展示排序截取流程。"] },
        { title: "买入逻辑", value: "指标满足条件时提高仓位", lines: ["当买入信号成立时，策略尝试把标的调到目标仓位。"] },
        { title: "卖出逻辑", value: "指标转弱时降低仓位", lines: ["当信号转弱时，策略降低或清空对应持仓。"] },
        { title: "下单限制", value: "代码中未明确给出", lines: ["代码中未明确给出"] }
      ],
      keyParameters: [
        { title: "观察周期", value: "均线窗口和调仓周期需要从代码确认", lines: ["示例中包含指标观察窗口。", "具体周期需要以输入代码为准。"] },
        { title: "目标持仓数", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "持仓权重", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "最小交易金额", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "止损线", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "滑点", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "交易费用", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "最低佣金", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "现金处理", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "其他关键阈值", value: "标的代码、目标仓位等", lines: ["标的代码和目标仓位是主要运行参数。"] }
      ],
      risks: [
        { title: "主题集中风险", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "单标的集中风险", value: "需要确认仓位上限和止损规则", lines: ["示例围绕少量标的运行。", "需要确认单票仓位是否有上限。"] },
        { title: "无信号处理风险", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "交易可达性风险", value: "未看到停牌、涨跌停或成交失败处理", lines: ["代码中未看到停牌过滤。", "代码中未看到涨跌停和成交失败处理。"] },
        { title: "流动性风险", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "参数敏感性", value: "指标窗口可能影响信号稳定性", lines: ["观察窗口变化会影响买卖信号。", "需要在回测中单独验证。"] },
        { title: "回测与实盘差异", value: "历史数据窗口不足时应避免直接下单", lines: ["历史数据不足会影响指标计算。", "回测成交和真实成交可能不同。"] }
      ],
      suggestions: [
        { title: "信号计算可解释性", value: "将信号计算过程拆成独立说明", lines: ["把数据读取、指标计算和信号判断分开记录。", "便于回看每次交易的触发原因。"] },
        { title: "止损独立运行", value: "代码中未明确给出", lines: ["代码中未明确给出"] },
        { title: "交易可达性检查", value: "补充停牌、涨跌停和成交失败检查", lines: ["下单前检查标的是否可交易。", "记录被跳过的原因。"] },
        { title: "单票集中度控制", value: "补充单票仓位上限", lines: ["把单票最大仓位写成显式参数。"] },
        { title: "日志可读性", value: "记录信号、订单和异常分支", lines: ["记录信号值。", "记录目标仓位。", "记录下单结果。"] },
        { title: "参数显式化", value: "把窗口、仓位、标的等参数集中配置", lines: ["把观察周期集中到参数区。", "把目标仓位集中到参数区。"] },
        { title: "回测验证", value: "加入交易成本和滑点假设", lines: ["补充交易费用。", "补充滑点。", "补充异常行情场景。"] }
      ]
    }),
    model: getMockModelName(options),
    tokenUsage: mockTokenUsage(task)
  };
}

function baseReport(task: AiTask, scopeStatus: AiTaskScopeStatus, config: AiProviderInput["config"], extra: Record<string, unknown>) {
  return {
    processingMode: "single",
    scopeStatus,
    displayName: config.displayName,
    costPoints: config.costPoints,
    ...extra,
    taskType: task.type
  };
}

function getMockModelName(options: MockProviderOptions) {
  return options.model || getAiModelName("mock");
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

function isClearlyOutOfScope(task: AiTask, conversationContext = "") {
  const input = `${task.prompt ?? ""}\n${task.inputCode ?? ""}\n${conversationContext}`.toLowerCase();

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
function chunkText(value: string, size: number) {
  const chunks: string[] = [];

  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }

  return chunks;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
