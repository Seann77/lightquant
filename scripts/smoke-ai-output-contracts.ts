import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { createHash } from "node:crypto";
import { getAiTaskConfig } from "../src/server/ai/ai-task-config";
import { shouldUseStreamingMarkdownForTask } from "../src/server/ai/code-artifact";
import { getAiSkill } from "../src/server/ai/skills";
import {
  runOpenAiCompatibleProvider,
  runOpenAiCompatibleProviderStream
} from "../src/server/ai/providers/openai-compatible-provider";
import { getStrategyExplanationMode } from "../src/server/ai/strategy-explanation-intent";
import type { AiProviderInput } from "../src/server/ai/providers/types";
import type { AiTask, AiTaskType } from "../src/server/domain";

const originalTimeout = process.env.AI_TASK_TIMEOUT_MS;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  if (originalTimeout === undefined) {
    delete process.env.AI_TASK_TIMEOUT_MS;
  } else {
    process.env.AI_TASK_TIMEOUT_MS = originalTimeout;
  }
});

async function main() {
  process.env.AI_TASK_TIMEOUT_MS = "1000";
  await testFocusedExplanationIntent();
  await testStrategyAnswerJsonContract();
  await testFocusedStrategyExplanationMarkdownContract();
  await testFocusedCodeAnalysisMarkdownContract();
  await testFullCodeAnalysisMarkdownContract();
  await testFullStrategyMarkdownContract();
  await testContextualModificationMarkdownContract();
  await testRepairFullStrategyMarkdownRouting();
  await testCodeConversionMarkdownContract();

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "current question classifies focused explanation independently of full code length while modification remains unchanged",
      "strategy answer uses non-stream JSON-only contract",
      "focused strategy explanation uses one streaming call without full dossier",
      "focused code analysis preserves natural scoped Markdown",
      "explicit full code analysis keeps the detailed report contract",
      "full PTrade strategy uses streaming Markdown-only contract and extracts generatedCode",
      "contextual strategy modification receives the complete reference and returns one complete code artifact",
      "repair/re-output full strategy routes to streaming Markdown without lazy placeholders",
      "code conversion uses natural Markdown, one fenced target code block, and parsed compatibility notes",
      "code conversion prompt has no generic manual-review disclaimer",
      "non-stream system prompt contains JSON-only rules",
      "streaming system prompt contains Markdown-only rules and no JSON-only sentence"
    ]
  }, null, 2));
}

async function testFocusedExplanationIntent() {
  const rawCodeAndQuestion = [
    "def initialize(context):",
    "    g.stock_num = 5",
    "    run_daily(rebalance, time='14:50')",
    "",
    "def rebalance(context):",
    "    order_target_value('000001.XSHE', context.portfolio.total_value / g.stock_num)",
    "",
    "分析一下这个策略的买入卖出逻辑。"
  ].join("\n");

  expect("raw full code plus local question is focused", getStrategyExplanationMode(createTask("strategy_generation", {
    prompt: rawCodeAndQuestion
  })) === "focused_explanation");
  expect("explicit full analysis is full", getStrategyExplanationMode(createTask("strategy_generation", {
    prompt: "请逐模块完整解析这份策略。"
  })) === "full_explanation");
  expect("strategy modification is not explanation", getStrategyExplanationMode(createTask("strategy_generation", {
    prompt: "请把止损线从 5% 修改为 8%。"
  })) === "other");
}

async function testStrategyAnswerJsonContract() {
  let capturedPayload: Record<string, unknown> | null = null;
  const server = createServer((request, response) => {
    void readJsonBody(request).then((payload) => {
      capturedPayload = payload;
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        model: "mimo-v2.5-pro",
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                scopeStatus: "in_scope",
                generatedCode: null,
                explanation: "结论：这段策略说明的是止损规则，当前不需要输出完整代码。",
                migrationNotes: null,
                riskWarnings: [],
                reportJson: {
                  responseMode: "strategy_answer",
                  codeLevel: "none",
                  needsFullCode: false
                }
              })
            }
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      }));
    }).catch((error) => {
      response.statusCode = 500;
      response.end(String(error));
    });
  });
  const baseUrl = await listen(server);

  try {
    const result = await runOpenAiCompatibleProvider(createProviderInput("strategy_generation", {
      prompt: "解释一下这个策略的止损规则，不要输出完整代码。",
      inputCode: "def initialize(context):\n    g.stop_loss = 0.95\n"
    }), {
      runtimeConfig: createRuntimeConfig(baseUrl)
    });
    const systemMessage = readSystemMessage(capturedPayload);

    const payload = readRecord(capturedPayload) ?? {};

    expect("JSON response_format", readRecord(payload.response_format)?.type === "json_object");
    expect("JSON-only prompt contains schema", systemMessage.includes("必须返回一个 JSON 对象"));
    expect("JSON-only prompt excludes markdown contract", !systemMessage.includes("Markdown Output Requirement"));
    expect("JSON-only prompt excludes final markdown mandate", !systemMessage.includes("最终回答必须使用 Markdown"));
    expect("answer generatedCode null", result.generatedCode === null);
    expect("answer explanation available", typeof result.explanation === "string" && result.explanation.includes("止损"));
  } finally {
    server.close();
  }
}

async function testFocusedStrategyExplanationMarkdownContract() {
  const markdown = [
    "直接结论：",
    "这个策略每天 14:50 调仓，先卖出不再属于目标列表的持仓，再按等权目标补足新标的。",
    "",
    "卖出逻辑：",
    "1. 当前持仓掉出目标列表时清仓。",
    "2. 停牌或当天没有可卖数量时跳过。",
    "",
    "买入逻辑：",
    "1. 从目标列表中选择尚未持有的股票。",
    "2. 每只股票目标市值为总资产的五分之一。"
  ].join("\n");
  const result = await runStreamingScenario("strategy_generation", {
    prompt: "分析一下这个策略的买入卖出逻辑。",
    inputCode: createCompleteAnalysisFixture()
  }, markdown, (payload) => {
    const systemMessage = readSystemMessage(payload);

    expect("strategy focused mode prompt", systemMessage.includes("服务端解释模式：focused_explanation"));
    expect("strategy focused prompt forbids tables", systemMessage.includes("不要输出完整策略档案") && systemMessage.includes("Markdown 表格"));
    expect("strategy focused prompt prioritizes current question", systemMessage.includes("当前用户问题的范围高于输入代码长度"));
  });
  const report = readRecord(result.result.reportJson);

  expect("focused strategy markdown preserved", result.finalAnswerMarkdown === markdown);
  expect("focused strategy remains answer mode", report?.responseMode === "strategy_answer");
  expect("focused strategy has no full dossier", !result.finalAnswerMarkdown.includes("策略概览") && !result.finalAnswerMarkdown.includes("关键参数"));
  expect("focused strategy generatedCode null", result.result.generatedCode === null);
}

async function testFocusedCodeAnalysisMarkdownContract() {
  const markdown = [
    "直接结论：",
    "策略每天 14:45 检查止损，价格跌至持仓成本的 95% 以下时清仓。",
    "",
    "卖出逻辑：",
    "1. 14:45 先检查成本止损。",
    "2. 14:50 调仓时卖出掉出目标列表的持仓。",
    "3. 停牌或没有可卖数量时，本次卖出会跳过。"
  ].join("\n");
  const result = await runStreamingScenario("code_analysis", {
    prompt: "这个策略什么时候卖出？",
    inputCode: createCompleteAnalysisFixture()
  }, markdown, (payload) => {
    const systemMessage = readSystemMessage(payload);

    expect("analysis focused mode prompt", systemMessage.includes("服务端解释模式：focused_explanation"));
    expect("analysis focused prompt avoids mandatory full report", !systemMessage.includes("最终回答必须包含且只使用这些二级标题"));
    expect("analysis focused prompt forbids table and nested headings", systemMessage.includes("Markdown 表格") && systemMessage.includes("多层 Markdown 标题"));
  });
  const report = readRecord(result.result.reportJson);

  expect("focused analysis markdown preserved", result.finalAnswerMarkdown === markdown);
  expect("focused analysis response mode", report?.responseMode === "focused_explanation");
  expect("focused analysis has no normalized overview", !Array.isArray(report?.overview));
  expect("focused analysis answers only sell scope", !result.finalAnswerMarkdown.includes("选股算法") && !result.finalAnswerMarkdown.includes("参数速查"));
}

async function testFullCodeAnalysisMarkdownContract() {
  const markdown = [
    "## 策略概览",
    "- 核心思路：用目标列表管理持仓，并在尾盘调仓。",
    "",
    "## 交易逻辑",
    "- 买入逻辑：14:50 按等权目标补足持仓。",
    "- 卖出逻辑：14:45 检查止损，14:50 卖出掉出目标列表的持仓。",
    "",
    "## 关键参数",
    "- 目标持仓数：5 只。",
    "",
    "## 风险提醒",
    "- 交易可达性风险：停牌时无法下单。",
    "",
    "## 优化建议",
    "- 回测验证：检查不可交易场景。"
  ].join("\n");
  const result = await runStreamingScenario("code_analysis", {
    prompt: "请逐模块完整解析这份策略。",
    inputCode: createCompleteAnalysisFixture()
  }, markdown, (payload) => {
    const systemMessage = readSystemMessage(payload);

    expect("analysis full mode prompt", systemMessage.includes("服务端解释模式：full_explanation"));
    expect("analysis full prompt keeps detailed headings", systemMessage.includes("## 策略概览") && systemMessage.includes("## 交易逻辑"));
  });
  const report = readRecord(result.result.reportJson);

  expect("full analysis response mode", report?.responseMode === "full_explanation");
  expect("full analysis keeps overview report", Array.isArray(report?.overview));
  expect("full analysis keeps detailed markdown", result.finalAnswerMarkdown.includes("## 策略概览") && result.finalAnswerMarkdown.includes("## 优化建议"));
}

async function testFullStrategyMarkdownContract() {
  const markdown = [
    "## 完整策略代码",
    "```python",
    "def initialize(context):",
    "    run_daily(handle_data, time='09:35')",
    "",
    "def handle_data(context):",
    "    order_value('000001.SZ', 10000)",
    "```",
    "",
    "说明：完整 PTrade 策略代码已给出。"
  ].join("\n");
  const result = await runStreamingScenario("strategy_generation", {
    prompt: "请生成一个完整 PTrade 策略代码。",
    targetPlatform: "PTrade"
  }, markdown, (payload) => {
    const systemMessage = readSystemMessage(payload);

    expect("stream no response_format", !("response_format" in payload));
    expect("stream markdown prompt contains contract", systemMessage.includes("Markdown Output Requirement"));
    expect("stream markdown final mandate", systemMessage.includes("最终回答必须使用 Markdown"));
    expect("stream markdown no JSON-only schema", !systemMessage.includes("必须返回一个 JSON 对象"));
    expect("stream markdown no only legal JSON sentence", !systemMessage.includes("只输出合法 JSON"));
  });

  expect("full strategy final is not JSON", !result.finalAnswerMarkdown.trim().startsWith("{"));
  expect("full strategy fenced code", /```python[\s\S]+def initialize[\s\S]+```/.test(result.finalAnswerMarkdown));
  expect("full strategy generatedCode extracted", Boolean(result.result.generatedCode?.includes("def initialize")));
}

async function testContextualModificationMarkdownContract() {
  const baseline = [
    createCompleteAnalysisFixture(),
    ...Array.from({ length: 220 }, (_, index) => [
      `def audit_helper_${index}(context):`,
      `    audit_value_${index} = ${index}`,
      `    return audit_value_${index}`
    ].join("\n"))
  ].join("\n\n");
  expect("context modification fixture exceeds 5000 chars", baseline.length > 5000);
  const modified = baseline.replace("time='14:50'", "time='14:52'");
  const markdown = [
    "已将买入调仓时间从 14:50 调整为 14:52，其余策略逻辑保持不变。",
    "",
    "```python",
    modified,
    "```"
  ].join("\n");
  const result = await runStreamingScenario("strategy_generation", {
    prompt: "把买入时间从 14:50 改成 14:52，其他逻辑不变。",
    sourcePlatform: "PTrade"
  }, markdown, (payload) => {
    const systemMessage = readSystemMessage(payload);
    const userMessage = readUserMessage(payload);

    expect("context modification prompt preserves strategy semantics", systemMessage.includes("只修改用户当前轮明确要求的行为"));
    expect("context modification prompt requires complete output", systemMessage.includes("一个完整连续且闭合的 python 代码块"));
    expect("context modification prompt forbids omitted remainder", systemMessage.includes("不能用“其余不变”"));
    expect("context modification receives full reference code", userMessage.includes(baseline));
    expect("context modification receives reference tail beyond old summaries", userMessage.includes("def audit_helper_219"));
    expect("context modification reference is separate from memory", userMessage.includes("会话参考策略完整代码") && userMessage.includes("最近对话记忆"));
  }, (input) => {
    input.referenceStrategyCode = {
      version: 1,
      code: baseline,
      source: "historical_input",
      taskId: "baseline-task",
      conversationId: "contract-conversation",
      platform: "PTrade",
      contentSha256: createHash("sha256").update(baseline, "utf8").digest("hex"),
      codeLineCount: baseline.split(/\r?\n/).filter((line) => line.trim()).length,
      createdAt: "2026-07-14T00:00:00.000Z"
    };
  });

  expect("context modification returns complete generated code", result.result.generatedCode === modified);
  expect("context modification keeps one closed python block", (result.finalAnswerMarkdown.match(/```/g) ?? []).length === 2);
}

function createCompleteAnalysisFixture() {
  return [
    "def initialize(context):",
    "    g.stock_num = 5",
    "    g.stop_loss = 0.95",
    "    run_daily(check_stop, time='14:45')",
    "    run_daily(rebalance, time='14:50')",
    "",
    "def check_stop(context):",
    "    for stock, position in context.portfolio.positions.items():",
    "        if position.price <= position.avg_cost * g.stop_loss:",
    "            order_target(stock, 0)",
    "",
    "def rebalance(context):",
    "    target = ['000001.XSHE']",
    "    for stock in list(context.portfolio.positions):",
    "        if stock not in target:",
    "            order_target(stock, 0)",
    "    order_target_value(target[0], context.portfolio.total_value / g.stock_num)"
  ].join("\n");
}

async function testRepairFullStrategyMarkdownRouting() {
  const task = createTask("strategy_generation", {
    prompt: "请修复后重新输出完整策略代码。",
    targetPlatform: "PTrade",
    inputCode: "def initialize(context):\n    pass\n"
  });

  expect("repair full strategy streams", shouldUseStreamingMarkdownForTask({ task }));

  const markdown = [
    "## 修复后完整策略代码",
    "```python",
    "def initialize(context):",
    "    run_daily(trade, time='09:40')",
    "",
    "def trade(context):",
    "    return None",
    "```"
  ].join("\n");
  const result = await runStreamingScenario("strategy_generation", {
    prompt: task.prompt ?? "",
    targetPlatform: "PTrade",
    inputCode: task.inputCode ?? ""
  }, markdown);

  expect("repair final has no lazy placeholder", !/后续同理|请继续|其余代码保持不变/.test(result.finalAnswerMarkdown));
  expect("repair generatedCode extracted", Boolean(result.result.generatedCode?.includes("def trade")));
}

async function testCodeConversionMarkdownContract() {
  const markdown = [
    "已按 PTrade 生命周期转换，代码如下：",
    "",
    "```python",
    "def initialize(context):",
    "    run_daily(trade, time='09:35')",
    "",
    "def trade(context):",
    "    order_value('000001.SZ', 10000)",
    "```",
    "",
    "兼容说明：",
    "- 已将源平台定时调度映射到 PTrade run_daily。",
    "- 下单逻辑保留为按金额委托。"
  ].join("\n");
  const result = await runStreamingScenario("code_conversion", {
    prompt: "转换为 PTrade 完整代码。",
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    inputCode: "def initialize(context):\n    run_daily(trade)\n"
  }, markdown, (payload) => {
    const systemMessage = readSystemMessage(payload);

    expect("conversion markdown prompt", systemMessage.includes("最终回答必须使用 Markdown"));
    expect("conversion no JSON-only prompt", !systemMessage.includes("必须返回一个 JSON 对象"));
    expect("conversion docs are lightweight evidence", systemMessage.includes("事实索引是参考工具，不是白名单或硬阻断器"));
    expect("conversion missing docs do not block", systemMessage.includes("文档未命中时不要拒绝转换"));
    expect("conversion prompt has no generic manual review", !systemMessage.includes("需要人工复核"));
    expect("conversion prompt has no conservative approximation", !systemMessage.includes("保守近似"));
    expect("conversion prompt avoids product fields", systemMessage.includes("不要输出产品内部字段"));
  });

  expect("conversion natural markdown preserved", result.finalAnswerMarkdown === markdown);
  expect("conversion fenced target code", /```python[\s\S]+def initialize[\s\S]+```/.test(result.finalAnswerMarkdown));
  expect("conversion generatedCode extracted", Boolean(result.result.generatedCode?.includes("order_value")));
  expect("conversion migration notes parsed", Boolean(result.result.migrationNotes?.includes("run_daily")));
}

async function runStreamingScenario(
  type: AiTaskType,
  overrides: Partial<Pick<AiTask, "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">>,
  markdown: string,
  inspectPayload?: (payload: Record<string, unknown>) => void,
  configureInput?: (input: AiProviderInput) => void
) {
  const server = createServer((request, response) => {
    void readJsonBody(request).then((payload) => {
      inspectPayload?.(payload);
      writeSseHeaders(response);
      response.write(streamChunk({
        model: "mimo-v2.5-pro",
        choices: [
          {
            delta: {
              content: markdown
            }
          }
        ]
      }));
      response.write(streamChunk({
        choices: [
          {
            delta: {},
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 11,
          completion_tokens: 22,
          total_tokens: 33
        }
      }));
      response.write("data: [DONE]\n\n");
      response.end();
    }).catch((error) => {
      response.statusCode = 500;
      response.end(String(error));
    });
  });
  const baseUrl = await listen(server);

  try {
    const providerInput = createProviderInput(type, overrides);
    configureInput?.(providerInput);

    return await runOpenAiCompatibleProviderStream(providerInput, {
      runtimeConfig: createRuntimeConfig(baseUrl)
    });
  } finally {
    server.close();
  }
}

function createProviderInput(
  type: AiTaskType,
  overrides: Partial<Pick<AiTask, "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">> = {}
): AiProviderInput {
  const task = createTask(type, overrides);

  return {
    task,
    skill: getAiSkill(type),
    config: getAiTaskConfig(type),
    apiDocumentContext: createTestApiDocumentContext(task)
  };
}

function createTestApiDocumentContext(task: AiTask) {
  return {
    text: "API参考资料\n测试文档上下文",
    metadata: {
      taskId: task.id,
      taskType: task.type,
      sourcePlatform: task.sourcePlatform,
      targetPlatform: task.targetPlatform,
      detectedApiNames: [],
      matchedSymbolCount: 0,
      matchedChunkCount: 0,
      normalizedFallbackCount: 0,
      includedApiNames: [],
      documentContextCharacterCount: 13,
      estimatedDocumentTokens: 4,
      documentCompressionApplied: false,
      retrievalDurationMs: 0,
      documentBudgetCharacters: 1000,
      outputTokenReserve: 1000
    }
  };
}

function createTask(
  type: AiTaskType,
  overrides: Partial<Pick<AiTask, "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">> = {}
): AiTask {
  const now = "2026-07-14T00:00:00.000Z";

  return {
    id: `contract-${type}`,
    userId: "contract-user",
    conversationId: "contract-conversation",
    type,
    status: "RUNNING",
    scopeStatus: "in_scope",
    sourcePlatform: overrides.sourcePlatform ?? null,
    targetPlatform: overrides.targetPlatform ?? null,
    prompt: overrides.prompt ?? "",
    inputCode: overrides.inputCode ?? null,
    inputFileId: null,
    costPoints: getAiTaskConfig(type).costPoints,
    clientRequestId: `contract-client-${type}`,
    requestId: `contract-request-${type}`,
    errorCode: null,
    errorMessage: null,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

function createRuntimeConfig(baseUrl: string) {
  return {
    provider: "openai_compatible" as const,
    baseUrl,
    apiKey: "fake-key",
    model: "mimo-v2.5-pro",
    modelMaxOutputTokens: 131072,
    supportsVision: false,
    source: "env" as const,
    activeProfileId: null,
    activeProfileName: null,
    apiKeyEnvName: "LIGHTQUANT_AI_API_KEY" as const,
    apiKeySecretId: null,
    apiKeySource: "env" as const
  };
}

async function listen(server: ReturnType<typeof createServer>) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected TCP server address");
  }

  return `http://127.0.0.1:${address.port}`;
}

function readJsonBody(request: IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(readRecord(JSON.parse(body)) ?? {}));
    request.on("error", reject);
  });
}

function readSystemMessage(payload: Record<string, unknown> | null) {
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const system = messages.find((message) => readRecord(message)?.role === "system");

  return typeof readRecord(system)?.content === "string" ? readRecord(system)?.content as string : "";
}

function readUserMessage(payload: Record<string, unknown> | null) {
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const user = messages.find((message) => readRecord(message)?.role === "user");

  return typeof readRecord(user)?.content === "string" ? readRecord(user)?.content as string : "";
}

function writeSseHeaders(response: ServerResponse) {
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache"
  });
}

function streamChunk(value: unknown) {
  return `data: ${JSON.stringify(value)}\n\n`;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
    ? value as Record<string, unknown>
    : null;
}

function expect(label: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}
