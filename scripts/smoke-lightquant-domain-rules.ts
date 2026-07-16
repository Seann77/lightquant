import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "src", "server", "ai", "skills", "content");
const domainRules = read("lightquant-domain-rules.md");
const strategyPrompt = read("strategy-generation.md");
const conversionPrompt = read("code-conversion.md");
const analysisPrompt = read("code-analysis.md");
const manifest = JSON.parse(read("lightquant-skill-sync-manifest.json")) as {
  sources?: Array<{ path?: string; sha256?: string; includedRuleCategories?: string[] }>;
  syncedTo?: string[];
  explicitlyExcludedLocalExecutionRuleCategories?: string[];
};

testDomainRuleSource();
testStrategyGenerationPrompt();
testCodeConversionPrompt();
testCodeAnalysisPrompt();
testManifest();
testLocalExecutionRulesExcludedFromBusinessPrompts();

console.log(JSON.stringify({
  ok: true,
  checked: [
    "PTrade complete strategy generation domain rules",
    "existing strategy modification and error repair priorities",
    "JoinQuant -> QMT conversion and QMT mode boundary",
    "code conversion uncertain APIs are migration notes, not failure/refund/frontend warnings",
    "QMT built-in Python / XtQuant / VBA are not mixed",
    "code analysis ordinary-user explanation style",
    "missing fields use 代码中未明确给出",
    "investment advice / return promise / stock recommendation forbidden",
    "local Codex execution workflow excluded from website business prompts",
    "skill sync manifest includes source hashes and synced target files"
  ]
}, null, 2));

function testDomainRuleSource() {
  expectIncludes("domain rules source marker", domainRules, "本机 LightQuant Skill 的网站清洗版");
  expectIncludes("domain keeps PTrade boundary", domainRules, "PTrade");
  expectIncludes("domain keeps JoinQuant boundary", domainRules, "JoinQuant");
  expectIncludes("domain keeps QMT boundary", domainRules, "QMT 内置 Python、QMT XtQuant/MiniQMT、QMT VBA");
  expectIncludes("domain hard errors", domainRules, "语法错误、运行时错误");
  expectIncludes("domain soft issues", domainRules, "停牌、涨跌停、现金不足一手");
  expectIncludes("domain missing phrase", domainRules, "代码中未明确给出");
}

function testStrategyGenerationPrompt() {
  expectIncludes("strategy has domain heading", strategyPrompt, "LightQuant Domain Rules");
  expectIncludes("PTrade full strategy native boundary", strategyPrompt, "PTrade 代码必须使用 PTrade 原生生命周期");
  expectIncludes("existing strategy intent preserved", strategyPrompt, "始终保留用户策略意图");
  expectIncludes("existing strategy modification hard failures", strategyPrompt, "修改或修复已有策略时，优先处理硬错误");
  expectIncludes("error repair includes runtime/API/data/state/order", strategyPrompt, "平台 API 不匹配");
  expectIncludes("error repair includes future data", strategyPrompt, "未来函数");
  expectIncludes("soft platform constraints", strategyPrompt, "普通平台限制属于软问题");
  expectIncludes("no investment recommendation", strategyPrompt, "不推荐具体股票");
  expectIncludes("no return promise", strategyPrompt, "不承诺收益");
}

function testCodeConversionPrompt() {
  expectIncludes("conversion has domain heading", conversionPrompt, "LightQuant Domain Rules");
  expectIncludes("conversion preserves behavior", conversionPrompt, "转换行为语义，不做表面语法替换");
  expectIncludes("JoinQuant to QMT conversion", conversionPrompt, "JoinQuant/PTrade 转 QMT");
  expectIncludes("QMT mode default", conversionPrompt, "默认转换为 QMT 内置 Python");
  expectIncludes("QMT modes not mixed", conversionPrompt, "QMT 内置 Python、QMT XtQuant/MiniQMT、QMT VBA 是不同目标");
  expectIncludes("QMT built-in lifecycle", conversionPrompt, "init(C)");
  expectIncludes("XtQuant boundary", conversionPrompt, "xtdata/xttrader/XtQuantTrader");
  expectIncludes("order semantic mapping", conversionPrompt, "不要机械地把 `order_value`");
  expectIncludes("uncertain API not failure", conversionPrompt, "不要把它当成任务失败");
  expectIncludes("uncertain API normal code output", conversionPrompt, "正常输出目标平台代码");
  expectIncludes("uncertain API manual review", conversionPrompt, "需要人工复核");
  expectIncludes("uncertain API conservative approximation", conversionPrompt, "保守近似");
  expectIncludes("uncertain API actual interface", conversionPrompt, "目标平台可能需要替换为实际接口");
  expectIncludes("uncertain API no refund", conversionPrompt, "不触发退款");
  expectIncludes("uncertain API no copy block", conversionPrompt, "不阻止复制");
  expectIncludes("uncertain API no frontend warning", conversionPrompt, "不需要前端额外弹出通用质量警告");
  expectIncludes("Markdown code delivery preserved", conversionPrompt, "流式最终回答使用 Markdown-only");
  expect("conversion JSON schema is scoped to non-stream", /JSON schema 仅适用于非流式结构化调用/.test(conversionPrompt));
}

function testCodeAnalysisPrompt() {
  expectIncludes("analysis has domain heading", analysisPrompt, "LightQuant Domain Rules");
  expectIncludes("analysis ordinary user", analysisPrompt, "主阅读路径面向普通用户");
  expectIncludes("analysis no API names as main path", analysisPrompt, "不要把函数名、变量名、API 名作为主说明主体");
  expectIncludes("analysis missing phrase", analysisPrompt, "代码中未明确给出");
  expectIncludes("analysis no invented logic", analysisPrompt, "解析只说明代码真实表达的内容");
  expectIncludes("analysis no return prediction", analysisPrompt, "不预测收益");
  expectIncludes("analysis no stock recommendation", analysisPrompt, "不推荐证券");
  expectIncludes("analysis report schema still JSON", analysisPrompt, "必须只返回合法 JSON 对象");
}

function testManifest() {
  expect("manifest has eight sources", manifest.sources?.length === 8);
  expect("manifest hashes are sha256", Boolean(manifest.sources?.every((source) => /^[a-f0-9]{64}$/.test(source.sha256 ?? ""))));
  expect("manifest has target domain rules", Boolean(manifest.syncedTo?.includes("src/server/ai/skills/content/lightquant-domain-rules.md")));
  expect("manifest has prompt targets", Boolean(manifest.syncedTo?.includes("src/server/ai/skills/content/strategy-generation.md") &&
    manifest.syncedTo?.includes("src/server/ai/skills/content/code-conversion.md") &&
    manifest.syncedTo?.includes("src/server/ai/skills/content/code-analysis.md")));
  expect("manifest excludes local execution categories", Boolean(manifest.explicitlyExcludedLocalExecutionRuleCategories?.includes("py_compile_or_fake_contextinfo_smoke_commands")));
}

function testLocalExecutionRulesExcludedFromBusinessPrompts() {
  const businessPrompts = [
    ["strategy-generation.md", strategyPrompt],
    ["code-conversion.md", conversionPrompt],
    ["code-analysis.md", analysisPrompt]
  ] as const;
  const forbiddenPatterns = [
    /Read the matching shared platform reference/i,
    /Apply\s+\.\.\//i,
    /Generate or patch/i,
    /Before considering a patch ready/i,
    /py_compile/i,
    /fake\s+ContextInfo/i,
    /D:\\我的策略/,
    /运行命令/,
    /读取本机文件/
  ];

  for (const [name, prompt] of businessPrompts) {
    for (const pattern of forbiddenPatterns) {
      expect(`${name} excludes ${pattern}`, !pattern.test(prompt));
    }
  }
}

function read(fileName: string) {
  return readFileSync(path.join(contentRoot, fileName), "utf8");
}

function expectIncludes(label: string, value: string, snippet: string) {
  expect(label, value.includes(snippet));
}

function expect(label: string, condition: boolean) {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
}
