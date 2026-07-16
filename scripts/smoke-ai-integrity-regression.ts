import { getAiTaskConfig } from "../src/server/ai/ai-task-config";
import {
  buildAutoRepairPrompt,
  canAutoRepairAiOutput,
  inspectAiOutputIntegrity
} from "../src/server/ai/output-integrity";
import { getAiModelMaxOutputTokens } from "../src/server/env";
import type { AiProviderResult } from "../src/server/ai/providers/types";
import type { AiTask, AiTaskType } from "../src/server/domain";

const now = "2026-07-13T00:00:00.000Z";

function main() {
  testEffectiveOutputLimits();
  testStrategyGreetingWithoutCodePasses();
  testSemanticPlaceholdersNoLongerFail();
  testCodeAnalysisWithoutGeneratedCodePasses();
  testConversionSnippetWithoutLifecyclePasses();
  testPhysicalTruncationStillFails();
  testStreamIncompleteStillFails();
  testUnclosedCodeFenceStillFailsForFullCode();
  testAbruptPythonTailFailsForFullCode();
  testExplicitOmissionMarkersOnlyFailFullCodeDelivery();
  testOriginalInputTodoDoesNotFail();
  testAutoRepairScope();
  testRepairPromptCarriesFullSource();

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "strategy_generation/code_conversion/code_analysis effectiveMaxOutputTokens are 80000 on MiMo and DeepSeek V4",
      "strategy_generation greeting/clarify without generatedCode is accepted",
      "semantic placeholders such as pass/return [] do not make output partial",
      "code_analysis without generatedCode is accepted",
      "code_conversion snippet without initialize/run_daily is accepted",
      "finish_reason stop with closed code fence does not fail on business-quality concerns",
      "finish_reason length / streamCompleted=false remain physical_truncated",
      "unclosed code fence remains repairable for full-code tasks",
      "abrupt Python tail remains hard-protected for full-code tasks",
      "explicit omission markers fail only full-code delivery, while ordinary continuation text does not",
      "TODO in original user input does not trigger hard protection",
      "auto repair scope is strategy_generation and code_conversion only",
      "repair prompt includes full source when under single-call input limit and is not old 12K truncateMiddle"
    ]
  }, null, 2));
}

function testEffectiveOutputLimits() {
  const models: Array<["openai_compatible" | "deepseek", string]> = [
    ["openai_compatible" as const, "mimo-v2.5-pro"],
    ["deepseek" as const, "deepseek-v4-flash"],
    ["deepseek" as const, "deepseek-v4-pro"]
  ];

  for (const type of ["strategy_generation", "code_conversion", "code_analysis"] as const) {
    const config = getAiTaskConfig(type);
    expect(`${type} module max`, config.maxOutputTokens === 80000);

    for (const [provider, model] of models) {
      const modelMax = getAiModelMaxOutputTokens(provider, model);
      const effective = Math.min(config.maxOutputTokens, Math.floor(modelMax * 0.75));
      expect(`${type} ${model} effective 80000`, effective === 80000);
    }
  }
}

function testStrategyGreetingWithoutCodePasses() {
  const task = createTask("strategy_generation", {
    sourcePlatform: null,
    targetPlatform: "PTrade",
    prompt: "你好",
    inputCode: null
  });
  const result = createResult("strategy_generation", null, {
    finish_reason: "stop",
    streamCompleted: true,
    explanation: "你好，我可以帮你生成、修改或解释 PTrade、JoinQuant、QMT 策略。"
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: result.explanation ?? ""
  });

  expect("strategy greeting without generatedCode accepted", !decision.partial);
}

function testSemanticPlaceholdersNoLongerFail() {
  const task = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    prompt: "请完整转换，保留竞价选股、市值过滤、连板和止损风控。",
    inputCode: sourceStrategyFixture()
  });
  const result = createResult("code_conversion", semanticBadOutput(), {
    finish_reason: "stop",
    streamCompleted: true
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: `## 目标平台代码\n\`\`\`python\n${semanticBadOutput()}\n\`\`\``
  });

  expect("semantic placeholders no longer partial", !decision.partial);
  expect("semantic placeholders complete category", decision.category === "complete");
  expect("semantic placeholders complete status", decision.report.integrityStatus === "complete");
}

function testCodeAnalysisWithoutGeneratedCodePasses() {
  const task = createTask("code_analysis", {
    sourcePlatform: "JoinQuant",
    targetPlatform: null,
    prompt: "解析这段策略。",
    inputCode: sourceStrategyFixture()
  });
  const result = createResult("code_analysis", null, {
    finish_reason: "stop",
    streamCompleted: true,
    explanation: "这段策略主要根据竞价、高开和风控条件进行交易。"
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: result.explanation ?? ""
  });

  expect("code analysis without generatedCode accepted", !decision.partial);
  expect("code analysis auto repair disabled", !canAutoRepairAiOutput("code_analysis"));
}

function testConversionSnippetWithoutLifecyclePasses() {
  const snippet = [
    "def pick_candidates(data):",
    "    # 片段输入里没有 initialize/run_daily，这是允许的",
    "    return []"
  ].join("\n");
  const task = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "QMT",
    prompt: "把这个选股函数片段转换为 QMT 内置 Python。",
    inputCode: snippet
  });
  const convertedSnippet = [
    "def pick_candidates(C, data):",
    "    return []"
  ].join("\n");
  const result = createResult("code_conversion", convertedSnippet, {
    finish_reason: "stop",
    streamCompleted: true
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: `## 目标平台代码\n\`\`\`python\n${convertedSnippet}\n\`\`\`\n\n## 迁移说明\n仅转换输入函数片段。`
  });

  expect("conversion snippet without lifecycle accepted", !decision.partial);
  expect("conversion snippet remains complete", decision.category === "complete");
}

function testPhysicalTruncationStillFails() {
  const task = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    prompt: "请完整转换。",
    inputCode: sourceStrategyFixture()
  });
  const result = createResult("code_conversion", semanticBadOutput(), {
    finish_reason: "length",
    streamCompleted: true
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: `\`\`\`python\n${semanticBadOutput()}\n\`\`\``
  });

  expect("length finish reason partial", decision.partial);
  expect("length is physical", decision.category === "physical_truncated");
  expect("length reason", decision.reason === "length");
}

function testStreamIncompleteStillFails() {
  const task = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    prompt: "请完整转换。",
    inputCode: sourceStrategyFixture()
  });
  const result = createResult("code_conversion", semanticBadOutput(), {
    finish_reason: "stop",
    streamCompleted: false
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: `\`\`\`python\n${semanticBadOutput()}\n\`\`\``
  });

  expect("streamCompleted false partial", decision.partial);
  expect("streamCompleted false is physical", decision.category === "physical_truncated");
  expect("streamCompleted false reason", decision.reason === "stream_error");
}

function testUnclosedCodeFenceStillFailsForFullCode() {
  const task = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    prompt: "请完整转换。",
    inputCode: sourceStrategyFixture()
  });
  const result = createResult("code_conversion", semanticBadOutput(), {
    finish_reason: "stop",
    streamCompleted: true
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: `\`\`\`python\n${semanticBadOutput()}`
  });

  expect("unclosed code fence partial", decision.partial);
  expect("unclosed code fence physical", decision.category === "physical_truncated");
  expect("unclosed code fence reason", decision.reason === "unclosed_code_fence");
}

function testAbruptPythonTailFailsForFullCode() {
  const task = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    prompt: "请完整转换。",
    inputCode: sourceStrategyFixture()
  });
  const code = [
    "def initialize(context):",
    "    g.stock = '000001.SZ'",
    "",
    "def handle_data(context, data):",
    "    if data[g.stock].price > 0:"
  ].join("\n");
  const result = createResult("code_conversion", code, {
    finish_reason: "stop",
    streamCompleted: true
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: `\`\`\`python\n${code}\n\`\`\``
  });

  expect("abrupt python tail partial", decision.partial);
  expect("abrupt python tail physical", decision.category === "physical_truncated");
  expect("abrupt python tail reason", decision.reason === "python_syntax_abrupt_tail");
}

function testExplicitOmissionMarkersOnlyFailFullCodeDelivery() {
  const fullTask = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    prompt: "请完整转换。",
    inputCode: sourceStrategyFixture()
  });
  const fullResult = createResult("code_conversion", "def initialize(context):\n    pass\n# 其余代码保持不变", {
    finish_reason: "stop",
    streamCompleted: true
  });
  const fullDecision = inspectAiOutputIntegrity({
    task: fullTask,
    result: fullResult,
    finalAnswerMarkdown: "## 目标平台代码\n```python\ndef initialize(context):\n    pass\n# 其余代码保持不变\n```"
  });

  expect("full code omission marker partial", fullDecision.partial);
  expect("full code omission marker reason", fullDecision.reason === "truncation_marker");

  const answerTask = createTask("strategy_generation", {
    sourcePlatform: null,
    targetPlatform: "PTrade",
    prompt: "你好",
    inputCode: null
  });
  const answerResult = createResult("strategy_generation", null, {
    finish_reason: "stop",
    streamCompleted: true,
    explanation: "这个策略可以继续优化参数，但当前只是普通答疑。"
  });
  const answerDecision = inspectAiOutputIntegrity({
    task: answerTask,
    result: answerResult,
    finalAnswerMarkdown: answerResult.explanation ?? ""
  });

  expect("ordinary continuation text does not fail", !answerDecision.partial);
}

function testOriginalInputTodoDoesNotFail() {
  const task = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "QMT",
    prompt: "转换这个函数片段。",
    inputCode: "def user_func(context):\n    # TODO: 用户原始代码里以后补充\n    return []"
  });
  const code = "def user_func(C):\n    return []";
  const result = createResult("code_conversion", code, {
    finish_reason: "stop",
    streamCompleted: true
  });
  const decision = inspectAiOutputIntegrity({
    task,
    result,
    finalAnswerMarkdown: `\`\`\`python\n${code}\n\`\`\``
  });

  expect("original input TODO does not fail", !decision.partial);
}

function testAutoRepairScope() {
  expect("strategy_generation can repair", canAutoRepairAiOutput("strategy_generation"));
  expect("code_conversion can repair", canAutoRepairAiOutput("code_conversion"));
  expect("code_analysis cannot repair", !canAutoRepairAiOutput("code_analysis"));
}

function testRepairPromptCarriesFullSource() {
  const source = `${sourceStrategyFixture()}\n${"# filler keeps this above old 12K context\n".repeat(500)}`;
  expect("fixture source exceeds 12K", source.length > 12000);
  expect("fixture source below conversion single-call limit", source.length < getAiTaskConfig("code_conversion").maxSingleCallInputChars);

  const task = createTask("code_conversion", {
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    prompt: "完整转换这份策略。",
    inputCode: source
  });
  const prompt = buildAutoRepairPrompt({
    task,
    partialDraft: semanticBadOutput(),
    reason: "unclosed_code_fence",
    maxSingleCallInputChars: getAiTaskConfig("code_conversion").maxSingleCallInputChars
  });

  expect("repair prompt includes original full source marker", prompt.includes("完整原始代码输入"));
  expect("repair prompt includes full source tail", prompt.includes("# filler keeps this above old 12K context"));
  expect("repair prompt is not old 12K truncation text", !prompt.includes("[中间内容已省略，仅供后台补救参考]"));
}

function createTask(type: AiTaskType, overrides: Partial<AiTask>): AiTask {
  return {
    id: `fixture-${type}`,
    userId: "fixture-user-redacted",
    conversationId: "fixture-conversation",
    type,
    status: "RUNNING",
    scopeStatus: "in_scope",
    sourcePlatform: overrides.sourcePlatform ?? null,
    targetPlatform: overrides.targetPlatform ?? null,
    prompt: overrides.prompt ?? null,
    inputCode: overrides.inputCode ?? null,
    inputFileId: null,
    costPoints: getAiTaskConfig(type).costPoints,
    clientRequestId: `fixture-client-${type}`,
    requestId: `fixture-request-${type}`,
    errorCode: null,
    errorMessage: null,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

function createResult(type: AiTaskType, generatedCode: string | null, options: {
  finish_reason: string;
  streamCompleted: boolean;
  explanation?: string;
}): AiProviderResult {
  return {
    scopeStatus: "in_scope",
    generatedCode,
    explanation: options.explanation ?? "已完成。",
    migrationNotes: null,
    riskWarnings: [],
    reportJson: {
      provider: "openai_compatible",
      requestModel: "mimo-v2.5-pro",
      responseModel: "mimo-v2.5-pro",
      modelMaxOutputTokens: 131072,
      moduleMaxOutputTokens: getAiTaskConfig(type).maxOutputTokens,
      effectiveMaxOutputTokens: 80000,
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
      finish_reason: options.finish_reason,
      streamCompleted: options.streamCompleted,
      timeoutMs: 300000,
      wasTruncated: false,
      integrityStatus: "unchecked",
      repairAttempted: false,
      repairSucceeded: false,
      refundApplied: false
    },
    model: "mimo-v2.5-pro",
    tokenUsage: {
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300
    }
  };
}

function sourceStrategyFixture() {
  return `
def initialize(context):
    g.max_hold_count = 5
    g.stop_loss = 0.92
    run_daily(before_market_open, time='09:25')
    run_daily(buy, time='09:31')
    run_daily(sell, time='14:50')

def before_market_open(context):
    g.high_open_list = []
    stocks = get_all_securities(['stock']).index.tolist()
    for stock in stocks:
        if is_st(stock) or is_paused(stock):
            continue
        cap = get_valuation(stock, fields=['market_cap']).market_cap[0]
        if cap > 80:
            continue
        if is_limit_up(stock) and has_lianban(stock):
            g.high_open_list.append(stock)
        if has_auction_high_open(stock) and has_left_pressure(stock):
            g.high_open_list.append(stock)

def buy(context):
    for stock in g.high_open_list:
        order_value(stock, context.portfolio.cash / g.max_hold_count)

def sell(context):
    for stock in list(context.portfolio.positions.keys()):
        if current_price(stock) < context.portfolio.positions[stock].avg_cost * g.stop_loss:
            order_target(stock, 0)
`;
}

function semanticBadOutput() {
  return `
def initialize(context):
    run_daily(buy, time='09:35')

def select_stocks(context):
    target_list = []
    return target_list

def buy(context):
    target_list = select_stocks(context)
    for stock in target_list:
        order_value(stock, context.portfolio.cash / 5)

def sell(context):
    pass
`;
}

function expect(label: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}

main();
