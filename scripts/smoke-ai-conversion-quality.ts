import assert from "node:assert/strict";
import { inspectConversionQuality } from "../src/server/ai/conversion-quality";

const joinQuantAuctionStrategy = [
  "def initialize(context):",
  "    run_daily(buy, time='09:26')",
  "    run_daily(sell, time='11:25')",
  "    run_daily(sell, time='14:50')",
  "",
  "def buy(context):",
  "    current_data = get_current_data()",
  "    auction = get_call_auction(g.buylist, start_date=context.current_dt, end_date=context.current_dt)",
  "    q = query(valuation.code, valuation.market_cap, valuation.circulating_market_cap)",
  "    fundamentals = get_fundamentals(q)",
  "    weak_ref_price = attribute_history('000001.XSHE', 2, '1d', ['close'])['close'][-1] / 1.1",
  "    order_value('000001.XSHE', 10000, style=MarketOrderStyle(0))",
  "",
  "def sell(context):",
  "    order_target('000001.XSHE', 0)"
].join("\n");

const badPTradeConversion = [
  "def initialize(context):",
  "    set_commission(per_trade=0.00025, min_trade=5)",
  "    run_daily(buy, time='09:31')",
  "",
  "def buy(context):",
  "    current_data = get_current_data()",
  "    auction = get_call_auction(['000001.SZ'])",
  "    fundamentals = get_fundamentals(query(valuation.code, valuation.market_cap, valuation.circulating_market_cap))",
  "    order_value('000001.SZ', 10000, style=MarketOrderStyle(0))",
  "",
  "def sell(context):",
  "    pass"
].join("\n");

const goodPTradeConversion = [
  "def initialize(context):",
  "    set_commission(commission_ratio=0.00025, min_commission=5.0)",
  "    run_daily(buy, time='09:31')",
  "    run_daily(sell_1125, time='11:25')",
  "    run_daily(sell_1450, time='14:50')",
  "",
  "def buy(context):",
  "    candidates = ['000001.SZ']",
  "    auction_map = get_auction_proxy_map(candidates, context)",
  "    caps = get_valuation_caps(candidates, context)",
  "    if auction_map and caps:",
  "        order_value(candidates[0], 10000)",
  "",
  "def sell_1125(context):",
  "    sell(context)",
  "",
  "def sell_1450(context):",
  "    sell(context)",
  "",
  "def sell(context):",
  "    order_target('000001.SZ', 0)",
  "",
  "def get_auction_proxy_map(stocks, context):",
  "    # PTrade has no direct JoinQuant auction API; use 09:30 minute open/volume as a conservative approximation.",
  "    result = {}",
  "    for stock in stocks:",
  "        data = get_price(stock, count=1, frequency='1m', fields=['open', 'volume'])",
  "        result[stock] = data",
  "    return result",
  "",
  "def get_valuation_caps(stocks, context):",
  "    result = {}",
  "    for stock in stocks:",
  "        data = get_fundamentals(stock, 'valuation', fields=['total_value', 'float_value'], date=context.current_dt.strftime('%Y%m%d'))",
  "        result[stock] = data",
  "    return result"
].join("\n");

const badReport = inspectConversionQuality({
  sourcePlatform: "JoinQuant",
  targetPlatform: "PTrade",
  sourceCode: joinQuantAuctionStrategy,
  generatedCode: badPTradeConversion,
  finalAnswerMarkdown: fenced(badPTradeConversion)
});

assert.equal(badReport.status, "block");
expectIssue(badReport.issues, "joinquant_get_call_auction");
expectIssue(badReport.issues, "joinquant_get_current_data");
expectIssue(badReport.issues, "joinquant_market_order_style");
expectIssue(badReport.issues, "joinquant_query_valuation");
expectIssue(badReport.issues, "ptrade_set_commission_joinquant_args");
expectIssue(badReport.issues, "ptrade_fundamentals_joinquant_signature");
expectIssue(badReport.issues, "ptrade_joinquant_valuation_fields");

const goodReport = inspectConversionQuality({
  sourcePlatform: "JoinQuant",
  targetPlatform: "PTrade",
  sourceCode: joinQuantAuctionStrategy,
  generatedCode: goodPTradeConversion,
  finalAnswerMarkdown: [
    "已转换为 PTrade。集合竞价数据按 09:30 分钟线保守近似。",
    "",
    fenced(goodPTradeConversion)
  ].join("\n")
});

assert.equal(goodReport.status, "pass");
assertFixedAuctionFixtureCoverage(goodPTradeConversion);

const undocumentedAuctionConversion = goodPTradeConversion
  .replaceAll("get_auction_proxy_map", "get_auction_data")
  .replace("# PTrade has no direct JoinQuant auction API; use 09:30 minute open/volume as a conservative approximation.", "# Read the 09:30 minute open and volume.");
const warnReport = inspectConversionQuality({
  sourcePlatform: "JoinQuant",
  targetPlatform: "PTrade",
  sourceCode: joinQuantAuctionStrategy,
  generatedCode: undocumentedAuctionConversion,
  finalAnswerMarkdown: fenced(undocumentedAuctionConversion)
});

assert.equal(warnReport.status, "warn");
expectIssue(warnReport.issues, "auction_approximation_missing");

const badMixedQmtConversion = [
  "from xtquant import xtdata",
  "",
  "def init(C):",
  "    C.set_universe(['000001.SZ'])",
  "",
  "def handlebar(C):",
  "    account_id = ''",
  "    quote = xtdata.get_full_tick(['000001.SZ'])",
  "    if quote:",
  "        passorder(23, 1101, account_id, '000001.SZ', 5, -1, 100, 'demo', 2, '', C)"
].join("\n");

const badQmtReport = inspectConversionQuality({
  sourcePlatform: "JoinQuant",
  targetPlatform: "QMT",
  sourceCode: joinQuantAuctionStrategy,
  generatedCode: badMixedQmtConversion,
  finalAnswerMarkdown: fenced(badMixedQmtConversion)
});

assert.equal(badQmtReport.status, "block");
expectIssue(badQmtReport.issues, "qmt_builtin_xtquant_mixed");
expectIssue(badQmtReport.issues, "qmt_placeholder_order");

const missingQmtEntryCode = [
  "def select_stocks(context):",
  "    return ['000001.SZ']"
].join("\n");
const missingQmtEntryReport = inspectConversionQuality({
  sourcePlatform: "JoinQuant",
  targetPlatform: "QMT",
  sourceCode: joinQuantAuctionStrategy,
  generatedCode: missingQmtEntryCode,
  finalAnswerMarkdown: fenced(missingQmtEntryCode)
});

assert.equal(missingQmtEntryReport.status, "block");
expectIssue(missingQmtEntryReport.issues, "qmt_runtime_entry_missing");

const goodQmtBuiltinCode = [
  "def init(C):",
  "    C.set_universe(['000001.SZ'])",
  "",
  "def handlebar(C):",
  "    return None"
].join("\n");
const goodQmtReport = inspectConversionQuality({
  sourcePlatform: "JoinQuant",
  targetPlatform: "QMT",
  sourceCode: "def initialize(context):\n    pass",
  generatedCode: goodQmtBuiltinCode,
  finalAnswerMarkdown: fenced(goodQmtBuiltinCode)
});

assert.equal(goodQmtReport.status, "pass");

const genericBadCases = [
  {
    name: "missing generated code",
    generatedCode: "",
    finalAnswerMarkdown: "转换完成。",
    issuePrefix: "artifact_generated_code_missing"
  },
  {
    name: "unclosed markdown code fence",
    generatedCode: goodPTradeConversion,
    finalAnswerMarkdown: `\`\`\`python\n${goodPTradeConversion}`,
    issuePrefix: "artifact_code_fence_unclosed"
  },
  {
    name: "abrupt Python tail",
    generatedCode: "def initialize(context):\n    if context:",
    finalAnswerMarkdown: fenced("def initialize(context):\n    if context:"),
    issuePrefix: "artifact_python_syntax_abrupt_tail"
  },
  {
    name: "placeholder output",
    generatedCode: "def initialize(context):\n    # TODO: 待补充\n    pass",
    finalAnswerMarkdown: fenced("def initialize(context):\n    # TODO: 待补充\n    pass"),
    issuePrefix: "artifact_placeholder_marker"
  },
  {
    name: "omitted output",
    generatedCode: "def initialize(context):\n    pass\n# 其余代码保持不变",
    finalAnswerMarkdown: fenced("def initialize(context):\n    pass\n# 其余代码保持不变"),
    issuePrefix: "artifact_truncation_marker"
  }
] as const;

for (const fixture of genericBadCases) {
  const report = inspectConversionQuality({
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    sourceCode: "def initialize(context):\n    pass",
    generatedCode: fixture.generatedCode,
    finalAnswerMarkdown: fixture.finalAnswerMarkdown
  });
  assert.equal(report.status, "block", fixture.name);
  expectIssue(report.issues, fixture.issuePrefix);
}

console.log(JSON.stringify({
  ok: true,
  checked: [
    "bad JoinQuant -> PTrade conversion is blocked by high-confidence API residual scans",
    "bad PTrade conversion is blocked by known wrong argument/signature patterns",
    "good JoinQuant -> PTrade conversion passes the lightweight conversion smoke service",
    "fixed auction conversion fixture keeps 11:25/14:50 sell timings",
    "fixed auction conversion fixture discloses auction approximation",
    "fixed auction conversion fixture maps valuation fields away from JoinQuant-only names",
    "otherwise runnable auction conversion without approximation disclosure warns",
    "mixed QMT built-in/XtQuant output and placeholder account are blocked",
    "QMT output without a built-in lifecycle or explicit XtQuant runtime is blocked",
    "complete QMT built-in init(C)/handlebar(C) output passes",
    "generic missing, unclosed, abrupt, placeholder, and omitted outputs are blocked"
  ],
  badIssueIds: badReport.issues.map((issue) => issue.id),
  goodChecked: goodReport.checked,
  badQmtIssueIds: badQmtReport.issues.map((issue) => issue.id)
}, null, 2));

function fenced(code: string) {
  return ["```python", code, "```"].join("\n");
}

function expectIssue(issues: Array<{ id: string }>, id: string) {
  assert.ok(issues.some((issue) => issue.id === id), `expected issue ${id}`);
}

function assertFixedAuctionFixtureCoverage(code: string) {
  assert.match(code, /11:25/);
  assert.match(code, /14:50/);
  assert.match(code, /09:30|auction_proxy|集合竞价|conservative approximation/i);
  assert.match(code, /total_value/);
  assert.match(code, /float_value/);
  assert.doesNotMatch(code, /\bget_call_auction\s*\(/);
  assert.doesNotMatch(code, /\bget_current_data\s*\(/);
  assert.doesNotMatch(code, /\bMarketOrderStyle\s*\(/);
  assert.doesNotMatch(code, /\bvaluation\.(?:market_cap|circulating_market_cap)\b/);
}
