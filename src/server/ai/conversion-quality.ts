import type { AiTask } from "@/server/domain";
import { validateGeneratedCodeArtifact } from "@/server/ai/code-artifact";

export type ConversionQualityIssueSeverity = "block" | "warn";

export type ConversionQualityIssue = {
  id: string;
  severity: ConversionQualityIssueSeverity;
  message: string;
};

export type ConversionQualityReport = {
  status: "pass" | "warn" | "block";
  issues: ConversionQualityIssue[];
  checked: string[];
};

export type ConversionQualityInput = {
  sourcePlatform: string | null;
  targetPlatform: string | null;
  sourceCode: string;
  generatedCode: string | null | undefined;
  finalAnswerMarkdown?: string | null;
  prompt?: string | null;
};

const JOINQUANT_ONLY_API_PATTERNS = [
  ["joinquant_get_call_auction", /\bget_call_auction\s*\(/, "输出仍包含 JoinQuant get_call_auction，PTrade 没有直接等价接口。"],
  ["joinquant_get_current_data", /\bget_current_data\s*\(/, "输出仍包含 JoinQuant get_current_data，目标平台无法直接运行。"],
  ["joinquant_market_order_style", /\bMarketOrderStyle\s*\(/, "输出仍包含 JoinQuant MarketOrderStyle，下单语义未迁移。"],
  ["joinquant_get_valuation", /\bget_valuation\s*\(/, "输出仍包含 JoinQuant get_valuation，财务数据接口未迁移。"],
  ["joinquant_query_valuation", /\bquery\s*\(\s*valuation\b/, "输出仍包含 JoinQuant query(valuation...) 写法。"]
] as const;

const PTRADE_WRONG_API_PATTERNS = [
  ["ptrade_set_commission_joinquant_args", /\bset_commission\s*\([^)]*\b(?:per_trade|min_trade)\s*=/, "PTrade set_commission 疑似使用了 JoinQuant 风格参数。"],
  ["ptrade_fundamentals_joinquant_signature", /\bget_fundamentals\s*\(\s*query\s*\(/, "PTrade get_fundamentals 疑似直接使用了 JoinQuant query 对象签名。"],
  ["ptrade_joinquant_valuation_fields", /\bvaluation\.(?:market_cap|circulating_market_cap)\b|['\"](?:market_cap|circulating_market_cap)['\"]/, "PTrade valuation 字段仍直接使用 JoinQuant 字段名，应映射为目标平台字段。"]
] as const;

const AUCTION_SUBJECT_MARKER = /集合竞价|竞价|call auction|auction/i;
const APPROXIMATION_MARKER = /近似|替代|代理|保守|无直接(?:等价)?接口|no direct equivalent|approximation|proxy/i;
const QMT_BUILTIN_MARKER = /\bdef\s+(?:init|handlebar)\s*\(|\bContextInfo\b|\bC\.get_market_data_ex\s*\(|\bpassorder\s*\(/;
const QMT_XTQUANT_MARKER = /\bfrom\s+xtquant\b|\bimport\s+xtquant\b|\bxtdata\.|\bxttrader\.|\bXtQuantTrader\b/;
const QMT_XTQUANT_ENTRY_MARKER = /\bfrom\s+xtquant\b|\bimport\s+xtquant\b|\bXtQuantTrader\b/;
const EMPTY_ACCOUNT_ASSIGNMENT = /\b(?:account_?id|accountid|accid)\s*=\s*(?:[rubf]*['\"]\s*['\"]|None\b)/i;
const EMPTY_PASSORDER_ACCOUNT_ARGUMENT = /\bpassorder\s*\(\s*[^,]+,\s*[^,]+,\s*(?:[rubf]*['\"]\s*['\"]|None\b)\s*,/i;
const QMT_ORDER_PLACEHOLDER_MARKER = /TODO|待补充|待配置|占位/i;

const ARTIFACT_ERROR_ALLOWLIST = new Set([
  "code_fence_unclosed",
  "generated_code_missing",
  "truncation_marker",
  "placeholder_marker"
]);

export function inspectConversionQuality(input: ConversionQualityInput): ConversionQualityReport {
  const generatedCode = input.generatedCode ?? "";
  const sourcePlatform = normalizePlatform(input.sourcePlatform);
  const targetPlatform = normalizePlatform(input.targetPlatform);
  const issues: ConversionQualityIssue[] = [];
  const checked = new Set<string>();

  checked.add("generated code physical completeness");
  const validation = validateGeneratedCodeArtifact({
    task: {
      type: "code_conversion",
      sourcePlatform: input.sourcePlatform,
      targetPlatform: input.targetPlatform,
      prompt: input.prompt ?? "转换为目标平台完整策略代码。",
      inputCode: input.sourceCode
    } as Pick<AiTask, "type" | "targetPlatform" | "sourcePlatform" | "prompt" | "inputCode">,
    code: generatedCode,
    finalAnswerMarkdown: input.finalAnswerMarkdown
  });

  for (const error of validation.errors.filter(isPhysicalCompletenessError)) {
    issues.push({
      id: `artifact_${error}`,
      severity: "block",
      message: `代码交付完整性检查失败：${error}`
    });
  }

  if (sourcePlatform === "joinquant" && targetPlatform === "ptrade") {
    checked.add("JoinQuant-only API residuals for PTrade target");
    pushPatternIssues(issues, generatedCode, JOINQUANT_ONLY_API_PATTERNS, "block");

    checked.add("PTrade high-confidence API misuse patterns");
    pushPatternIssues(issues, generatedCode, PTRADE_WRONG_API_PATTERNS, "block");
    pushJoinQuantFundamentalsVariableIssue(issues, generatedCode);

    if (/\bget_call_auction\s*\(/.test(input.sourceCode)) {
      checked.add("auction approximation disclosure");
      const combinedOutput = `${input.finalAnswerMarkdown ?? ""}\n${generatedCode}`;
      if (!AUCTION_SUBJECT_MARKER.test(combinedOutput) || !APPROXIMATION_MARKER.test(combinedOutput)) {
        issues.push({
          id: "auction_approximation_missing",
          severity: "warn",
          message: "源代码使用集合竞价数据，输出未说明目标平台近似或替代口径。"
        });
      }
    }
  }

  if (targetPlatform === "qmt") {
    checked.add("QMT runtime mode boundary");
    const hasBuiltinRuntime = QMT_BUILTIN_MARKER.test(generatedCode);
    const hasXtQuantRuntime = QMT_XTQUANT_MARKER.test(generatedCode);
    const hasXtQuantEntry = QMT_XTQUANT_ENTRY_MARKER.test(generatedCode);

    if (hasBuiltinRuntime && hasXtQuantRuntime) {
      issues.push({
        id: "qmt_builtin_xtquant_mixed",
        severity: "block",
        message: "QMT 内置 Python 与 XtQuant 运行模式疑似混用。"
      });
    }

    const hasBuiltinLifecycle = /\bdef\s+init\s*\(\s*[A-Za-z_]\w*/.test(generatedCode) &&
      /\bdef\s+handlebar\s*\(\s*[A-Za-z_]\w*/.test(generatedCode);
    if (!hasBuiltinLifecycle && !hasXtQuantEntry) {
      issues.push({
        id: "qmt_runtime_entry_missing",
        severity: "block",
        message: "QMT 输出缺少明确的内置 Python 或 XtQuant 运行入口。"
      });
    }

    if (/\bpassorder\s*\(/.test(generatedCode)) {
      checked.add("QMT placeholder order scan");
      if (
        EMPTY_ACCOUNT_ASSIGNMENT.test(generatedCode) ||
        EMPTY_PASSORDER_ACCOUNT_ARGUMENT.test(generatedCode) ||
        QMT_ORDER_PLACEHOLDER_MARKER.test(generatedCode)
      ) {
        issues.push({
          id: "qmt_placeholder_order",
          severity: "block",
          message: "QMT passorder 仍包含占位或空账户路径，不能作为可运行输出。"
        });
      }
    }
  }

  const hasBlock = issues.some((issue) => issue.severity === "block");
  const hasWarn = issues.some((issue) => issue.severity === "warn");

  return {
    status: hasBlock ? "block" : hasWarn ? "warn" : "pass",
    issues,
    checked: Array.from(checked)
  };
}

function pushJoinQuantFundamentalsVariableIssue(issues: ConversionQualityIssue[], code: string) {
  const queryVariables = [...code.matchAll(/^\s*([A-Za-z_]\w*)\s*=\s*query\s*\(/gm)]
    .map((match) => match[1])
    .filter((name): name is string => Boolean(name));

  if (queryVariables.some((name) => new RegExp(`\\bget_fundamentals\\s*\\(\\s*${escapeRegExp(name)}\\b`).test(code))) {
    issues.push({
      id: "ptrade_fundamentals_joinquant_signature",
      severity: "block",
      message: "PTrade get_fundamentals 疑似使用了 JoinQuant query 对象签名。"
    });
  }
}

function isPhysicalCompletenessError(error: string) {
  return ARTIFACT_ERROR_ALLOWLIST.has(error) || error.startsWith("python_syntax_");
}

function normalizePlatform(platform: string | null | undefined) {
  const normalized = (platform ?? "").trim().toLowerCase();

  if (/joinquant|聚宽|jq/.test(normalized)) {
    return "joinquant";
  }

  if (/ptrade|p-trade|恒生/.test(normalized)) {
    return "ptrade";
  }

  if (/qmt|迅投|xtquant|mini/.test(normalized)) {
    return "qmt";
  }

  return normalized;
}

function pushPatternIssues(
  issues: ConversionQualityIssue[],
  code: string,
  patterns: readonly (readonly [string, RegExp, string])[],
  severity: ConversionQualityIssueSeverity
) {
  for (const [id, pattern, message] of patterns) {
    if (pattern.test(code) && !issues.some((issue) => issue.id === id)) {
      issues.push({
        id,
        severity,
        message
      });
    }
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
