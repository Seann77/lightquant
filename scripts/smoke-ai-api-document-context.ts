import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  assertApiDocumentKnowledgeBaseReady,
  calculateDocumentBudget,
  retrieveApiDocumentContext,
  type ApiDocumentContext
} from "../src/server/ai/api-document-retrieval";
import { getAiTaskConfig } from "../src/server/ai/ai-task-config";
import { getAiSkill } from "../src/server/ai/skills";
import type { AiTask, AiTaskType } from "../src/server/domain";
import type { AiProviderInput } from "../src/server/ai/providers/types";
import {
  buildChatCompletionPayload,
  buildStreamingChatCompletionPayload
} from "../src/server/ai/providers/openai-compatible-provider";

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
await assertApiDocumentKnowledgeBaseReady();

const guojin = await retrieve(createTask("strategy_generation", {
  targetPlatform: "PTrade",
  prompt: "请使用 get_price 获取行情并生成策略"
}));
expectIncludes("PTrade exact canonical match", guojin.metadata.includedApiNames, "get_price");
assert.match(guojin.text, /API或章节：get_price[^\n]*\n签名：/);
assert.ok(!guojin.text.includes("版本：shenwan"), "PTrade should prefer guojin when primary has the API");

const shenwanFallback = await retrieve(createTask("strategy_generation", {
  targetPlatform: "PTrade",
  prompt: "请使用 get_kline_by_range() 读取区间行情"
}));
expectIncludes("PTrade supplementary fallback API", shenwanFallback.metadata.includedApiNames, "get_kline_by_range");
assert.match(shenwanFallback.text, /版本：shenwan[\s\S]*API或章节：get_kline_by_range/);

const alias = await retrieve(createTask("strategy_generation", {
  targetPlatform: "PTrade",
  prompt: "请用获取历史行情接口完成均线计算"
}));
expectIncludes("platform-local alias match", alias.metadata.includedApiNames, "get_history");

const joinquant = await retrieve(createTask("strategy_generation", {
  targetPlatform: "JoinQuant",
  prompt: "用 initialize、run_daily、get_price 和 order_target 生成策略"
}));
assert.ok(!joinquant.text.includes("api-docs/raw/joinquant/main"), "JoinQuant main alias must not be injected");
assert.ok(joinquant.text.includes("版本：web-help"), "JoinQuant canonical web-help docs should be used");

const qmt = await retrieve(createTask("strategy_generation", {
  targetPlatform: "QMT",
  prompt: "用 get_market_data_ex 和 passorder 生成QMT内置Python策略"
}));
assert.ok(qmt.text.includes("版本：builtin-python"), "QMT should default to builtin-python");
assert.ok(!/XtQuant|VBA/i.test(qmt.text), "QMT builtin-python context must not mix XtQuant or VBA");

const explicitXtQuant = await retrieve(createTask("strategy_generation", {
  targetPlatform: "QMT XtQuant",
  prompt: "生成 XtQuant 策略"
}));
assert.ok(!explicitXtQuant.text.includes("版本：builtin-python"), "explicit XtQuant must not receive builtin-python docs");

const chunkAndNormalizedFallback = await retrieve(createTask("code_analysis", {
  sourcePlatform: "JoinQuant",
  prompt: "解释 DataFrame() 相关平台行为",
  inputCode: "result = DataFrame(data)"
}));
assert.ok(chunkAndNormalizedFallback.metadata.matchedChunkCount > 0, "related chunks should be searched after no symbol hit");
assert.ok(chunkAndNormalizedFallback.metadata.normalizedFallbackCount > 0, "normalized Markdown should be searched after no exact symbol hit");

const generationBase = await retrieve(createTask("strategy_generation", {
  targetPlatform: "JoinQuant",
  prompt: "生成一个简单轮动策略"
}));
for (const section of ["生命周期", "行情与数据", "调度", "下单与交易", "账户与持仓"]) {
  assert.ok(generationBase.text.includes(`### ${section}`), `strategy generation should include ${section} base documentation`);
}
assert.ok(generationBase.metadata.documentContextCharacterCount < 30000, "simple strategy should not inject a large unrelated document set");

const conversion = await retrieve(createTask("code_conversion", {
  sourcePlatform: "JoinQuant",
  targetPlatform: "PTrade",
  prompt: "转换这个策略",
  inputCode: "def initialize(context):\n    run_daily(trade, time='10:00')\n\ndef trade(context):\n    data = get_price('000001.XSHE')\n    order_target('000001.XSHE', 100)"
}));
assert.ok(conversion.text.includes("平台：JoinQuant") && conversion.text.includes("平台：PTrade"), "conversion should retrieve source and target platform docs");

const modification = await retrieve(createTask("strategy_generation", {
  targetPlatform: "PTrade",
  prompt: "修改现有下单逻辑",
  inputCode: "def handle_data(context, data):\n    get_history('600000.SS', '1d', 20, ['close'])\n    order('600000.SS', 100)"
}));
expectIncludes("strategy modification existing get_history", modification.metadata.includedApiNames, "get_history");
expectIncludes("strategy modification existing order", modification.metadata.includedApiNames, "order");

const debugging = await retrieve(createTask("strategy_generation", {
  targetPlatform: "JoinQuant",
  prompt: "get_fundamentals 报错：返回列不存在，请调试"
}));
expectIncludes("debug error API", debugging.metadata.includedApiNames, "get_fundamentals");

const analysis = await retrieve(createTask("code_analysis", {
  sourcePlatform: "QMT",
  prompt: "解析这段行情读取逻辑",
  inputCode: "data = get_market_data_ex(['close'], ['000001.SZ'], period='1d')"
}));
expectIncludes("analysis API", analysis.metadata.includedApiNames, "get_market_data_ex");
assert.ok(!analysis.text.includes("### 财务与因子"), "analysis should not inject unrelated finance docs");

const explicitApis = [
  "initialize",
  "before_trading_start",
  "get_price",
  "get_history",
  "get_fundamentals",
  "get_index_stocks",
  "get_industry_stocks",
  "get_stock_status",
  "get_positions",
  "order",
  "order_value",
  "order_target",
  "cancel_order"
];
const complexCode = [
  "def initialize(context):",
  "    before_trading_start(context, None)",
  ...explicitApis.slice(2).map((name) => `    ${name}()`)
].join("\n");
const complex = await retrieve(createTask("strategy_generation", {
  targetPlatform: "PTrade",
  prompt: "修改这个复杂策略",
  inputCode: complexCode
}));
for (const apiName of explicitApis) {
  expectIncludes(`complex explicit API ${apiName}`, complex.metadata.includedApiNames, apiName);
}
assert.ok(complex.metadata.includedApiNames.length > 8, "explicit APIs must not be cut by a fixed eight-symbol limit");

const longCode = `${complexCode}\n# ${"long strategy context ".repeat(7200)}`;
const longTask = createTask("code_conversion", {
  sourcePlatform: "PTrade",
  targetPlatform: "JoinQuant",
  prompt: "转换完整长策略",
  inputCode: longCode
});
const longContext = await retrieve(longTask);
assert.equal(longContext.metadata.documentCompressionApplied, true, "long strategy should compress document detail");
for (const apiName of explicitApis) {
  expectIncludes(`long strategy explicit API ${apiName}`, longContext.metadata.includedApiNames, apiName);
}
const longBudget = calculateDocumentBudget({
  task: longTask,
  skill: getAiSkill(longTask.type),
  config: getAiTaskConfig(longTask.type),
  modelMaxOutputTokens: 80000
});
assert.equal(longBudget.outputTokenReserve, 80000, "output token reserve should be preserved");
assert.equal(longTask.inputCode, longCode, "document retrieval must not mutate or truncate user code");

const duplicate = await retrieve(createTask("strategy_generation", {
  targetPlatform: "JoinQuant",
  prompt: "get_price get_price get_price",
  inputCode: "get_price('000001.XSHE')\nget_price('000002.XSHE')"
}));
assert.equal(duplicate.metadata.includedApiNames.filter((name) => name === "get_price").length, 1, "duplicate API facts should be deduplicated");

const stableTask = createTask("code_analysis", {
  sourcePlatform: "PTrade",
  prompt: "解析 order 和 get_history",
  inputCode: "get_history('600000.SS', '1d', 5, ['close'])\norder('600000.SS', 100)"
});
const stableA = await retrieve(stableTask);
const stableB = await retrieve(stableTask);
assert.equal(stableA.text, stableB.text, "same input should produce stable document context");
assert.deepEqual(stableA.metadata.includedApiNames, stableB.metadata.includedApiNames, "same input should produce stable API order");

const providerInput = buildProviderInput(stableTask, stableA);
const providerConfig = {
  provider: "openai_compatible" as const,
  baseUrl: "https://example.invalid",
  apiKey: "test-only",
  model: "test-model",
  modelMaxOutputTokens: 80000,
  timeoutMs: 1000,
  maxRetries: 0,
  supportsVision: false
};
const nonStreamPayload = buildChatCompletionPayload(providerInput, providerConfig);
const streamPayload = buildStreamingChatCompletionPayload(providerInput, providerConfig);
const nonStreamUser = readUserText(nonStreamPayload.messages[1]?.content);
const streamUser = readUserText(streamPayload.messages[1]?.content);
for (const prompt of [nonStreamUser, streamUser]) {
  assert.ok(prompt.includes(stableA.text), "stream and non-stream prompts must include API document context");
  assert.ok(prompt.indexOf(stableA.text) < prompt.indexOf("用户需求："), "API docs must precede the user task");
  assert.ok(prompt.includes(stableTask.inputCode ?? ""), "API docs must not replace user code");
}

const providerSource = await readFile("src/server/ai/providers/index.ts", "utf8");
const retrievalSource = await readFile("src/server/ai/api-document-retrieval.ts", "utf8");
assert.equal((providerSource.match(/retrieveApiDocumentContext/g) ?? []).length >= 3, true, "both provider entry paths should call the shared retriever");
for (const forbidden of ["source_api", "target_api", "unsupported", "needs_manual_review", "unverified", "API_WHITELIST"]) {
  assert.ok(!retrievalSource.includes(forbidden), `retriever must not create forbidden mapping/status construct: ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  checked: 26,
  complexExplicitApiCount: complex.metadata.includedApiNames.length,
  longDocumentCharacters: longContext.metadata.documentContextCharacterCount,
  longDocumentBudgetCharacters: longContext.metadata.documentBudgetCharacters,
  longCompressionApplied: longContext.metadata.documentCompressionApplied
}, null, 2));
}

async function retrieve(task: AiTask) {
  return retrieveApiDocumentContext({
    task,
    skill: getAiSkill(task.type),
    config: getAiTaskConfig(task.type),
    modelMaxOutputTokens: 80000
  });
}

function createTask(type: AiTaskType, overrides: Partial<Pick<AiTask, "sourcePlatform" | "targetPlatform" | "prompt" | "inputCode">>): AiTask {
  const now = "2026-07-18T00:00:00.000Z";
  return {
    id: `api-doc-test-${type}-${Math.abs(stableHash(JSON.stringify(overrides)))}`,
    userId: "test-user",
    conversationId: "test-conversation",
    type,
    status: "RUNNING",
    scopeStatus: "in_scope",
    sourcePlatform: overrides.sourcePlatform ?? null,
    targetPlatform: overrides.targetPlatform ?? null,
    prompt: overrides.prompt ?? null,
    inputCode: overrides.inputCode ?? null,
    inputFileId: null,
    costPoints: getAiTaskConfig(type).costPoints,
    clientRequestId: "test-client-request",
    requestId: "test-request",
    errorCode: null,
    errorMessage: null,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

function buildProviderInput(task: AiTask, apiDocumentContext: ApiDocumentContext): AiProviderInput {
  return {
    task,
    skill: getAiSkill(task.type),
    config: getAiTaskConfig(task.type),
    conversationContext: "上一轮要求保留交易逻辑。",
    apiDocumentContext
  };
}

function readUserText(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const first = content[0];
    if (first && typeof first === "object" && "text" in first && typeof first.text === "string") return first.text;
  }
  throw new Error("Expected a text user prompt");
}

function expectIncludes(label: string, values: string[], expected: string) {
  assert.ok(values.includes(expected), `${label}: expected ${expected}, got ${values.join(", ")}`);
}

function stableHash(value: string) {
  let hash = 0;
  for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return hash;
}
