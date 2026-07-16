import type { AiTask, AiTaskType } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { getTotalInputChars } from "@/server/ai/ai-task-config";
import type { AiProviderInput, AiProviderResult } from "@/server/ai/providers/types";

type CodeProcessingTaskType = Extract<AiTaskType, "code_conversion" | "code_analysis">;

type CodeSymbol = {
  name: string;
  line: number;
  kind: "function" | "class";
  args?: string;
};

type CodeStructureScan = {
  inputChars: number;
  inputLines: number;
  detectedPlatform: string;
  platformConfidence: "high" | "medium" | "low";
  platformSignals: string[];
  entryFunctions: string[];
  schedulerFunctions: string[];
  dataApis: string[];
  orderApis: string[];
  globalVariables: string[];
  businessFunctions: string[];
  classes: string[];
  imports: string[];
  dependencies: string[];
  riskFlags: string[];
  manualReviewItems: string[];
};

type CodeChunk = {
  id: string;
  index: number;
  startLine: number;
  endLine: number;
  title: string;
  kind: "preamble" | "block" | "mixed" | "split";
  code: string;
  charCount: number;
  symbols: string[];
};

type ChunkResult = {
  chunk: CodeChunk;
  result: AiProviderResult;
};

type SingleProviderRunner = (input: AiProviderInput) => Promise<AiProviderResult>;

const ENTRY_FUNCTIONS = new Set([
  "initialize",
  "init",
  "after_init",
  "process_initialize",
  "before_trading_start",
  "handle_data",
  "handlebar",
  "after_trading_end",
  "on_bar",
  "on_tick"
]);

const SCHEDULER_APIS = [
  "run_daily",
  "run_weekly",
  "run_monthly",
  "schedule_function",
  "run_interval",
  "handlebar"
];

const DATA_APIS = [
  "get_price",
  "history",
  "attribute_history",
  "get_history",
  "get_market_data",
  "get_market_data_ex",
  "get_current_data",
  "get_fundamentals",
  "query",
  "valuation",
  "income",
  "balance",
  "indicator",
  "get_index_stocks",
  "get_all_securities",
  "get_extras",
  "xtdata"
];

const ORDER_APIS = [
  "order",
  "order_value",
  "order_target",
  "order_target_value",
  "order_target_percent",
  "passorder",
  "buy",
  "sell",
  "xttrader"
];

const PLATFORM_SIGNALS: Array<{ platform: string; confidence: CodeStructureScan["platformConfidence"]; patterns: RegExp[]; labels: string[] }> = [
  {
    platform: "QMT",
    confidence: "high",
    patterns: [/\bhandlebar\s*\(/, /\bpassorder\s*\(/, /\bget_market_data_ex\s*\(/, /\bxtdata\b/, /\bxttrader\b/, /\bContextInfo\b/],
    labels: ["QMT lifecycle/order/data signal"]
  },
  {
    platform: "JoinQuant",
    confidence: "high",
    patterns: [/\binitialize\s*\(/, /\bhandle_data\s*\(/, /\brun_daily\s*\(/, /\bget_fundamentals\s*\(/, /\.XSHG\b|\.XSHE\b/],
    labels: ["JoinQuant lifecycle/scheduler/fundamental signal"]
  },
  {
    platform: "PTrade",
    confidence: "medium",
    patterns: [/\bget_history\s*\(/, /\bset_universe\s*\(/, /\border_target_percent\s*\(/, /\.SS\b|\.SZ\b|\.SH\b/],
    labels: ["PTrade history/universe/order signal"]
  }
];

export function shouldUseChunkedCodeProcessing(input: AiProviderInput) {
  const { task, config } = input;

  if (task.type !== "code_conversion" && task.type !== "code_analysis") {
    return false;
  }

  if (!task.inputCode) {
    return false;
  }

  return getTotalInputChars(task) > config.maxSingleCallInputChars;
}

export async function runChunkedCodeProcessing(input: AiProviderInput, runSingleProvider: SingleProviderRunner): Promise<AiProviderResult> {
  if (input.task.type !== "code_conversion" && input.task.type !== "code_analysis") {
    return runSingleProvider(input);
  }

  await input.progressReporter?.({
    phase: "scanning",
    processingMode: "chunked",
    progressPercent: 18,
    statusMessage: input.task.type === "code_analysis"
      ? "正在识别策略结构、平台依赖和关键函数。"
      : "正在识别代码结构、入口函数、调度函数、数据接口和下单接口。"
  });
  const scan = scanCodeStructure(input.task);
  await input.progressReporter?.({
    phase: "chunking",
    processingMode: "chunked",
    inputChars: scan.inputChars,
    progressPercent: 25,
    statusMessage: input.task.type === "code_analysis"
      ? "正在梳理策略结构，准备解析交易逻辑。"
      : "正在按函数边界拆分长代码。"
  });
  const chunks = buildCodeChunks(input.task, input.config.maxSingleCallInputChars);

  if (chunks.length === 0) {
    throw new ApiError("AI_TASK_FAILED", "分段处理失败（chunk）：未能拆分出可处理的代码段。", 500);
  }

  await input.progressReporter?.({
    phase: "chunking",
    processingMode: "chunked",
    inputChars: scan.inputChars,
    chunkCount: chunks.length,
    completedChunks: 0,
    progressPercent: 28,
    statusMessage: input.task.type === "code_analysis"
      ? "策略结构已识别，正在准备解析。"
      : `已拆分为 ${chunks.length} 段，准备逐段处理。`
  });

  const chunkResults: ChunkResult[] = [];

  for (const chunk of chunks) {
    try {
      await input.progressReporter?.({
        phase: "processing",
        processingMode: "chunked",
        inputChars: scan.inputChars,
        chunkCount: chunks.length,
        completedChunks: chunkResults.length,
        currentChunk: chunk.index + 1,
        statusMessage: input.task.type === "code_analysis"
          ? "正在解析策略结构、交易逻辑和关键参数。"
          : `正在转换第 ${chunk.index + 1} / ${chunks.length} 段。`
      });
      const chunkInput = buildChunkProviderInput(input, scan, chunk, chunks.length);
      const result = await runSingleProvider(chunkInput);

      chunkResults.push({
        chunk,
        result
      });
      await input.progressReporter?.({
        phase: "processing",
        processingMode: "chunked",
        inputChars: scan.inputChars,
        chunkCount: chunks.length,
        completedChunks: chunkResults.length,
        currentChunk: Math.min(chunk.index + 2, chunks.length),
        statusMessage: input.task.type === "code_analysis"
          ? "正在解析策略结构、交易逻辑和关键参数。"
          : `已完成 ${chunkResults.length} / ${chunks.length} 段。`
      });
    } catch (error) {
      throw chunkProcessingError(error, input.task.type, chunk, chunks.length);
    }
  }

  await input.progressReporter?.({
    phase: "merging",
    processingMode: "chunked",
    inputChars: scan.inputChars,
    chunkCount: chunks.length,
    completedChunks: chunkResults.length,
    currentChunk: null,
    statusMessage: input.task.type === "code_conversion" ? "正在合并转换代码、迁移说明和人工复核项。" : "正在汇总解析报告。"
  });
  return mergeChunkResults(input, scan, chunks, chunkResults);
}

function scanCodeStructure(task: Pick<AiTask, "inputCode" | "sourcePlatform" | "targetPlatform">): CodeStructureScan {
  const code = task.inputCode ?? "";
  const lines = splitLines(code);
  const symbols = findSymbols(lines, false);
  const imports = uniqueMatches(lines, /^\s*(?:import\s+.+|from\s+\S+\s+import\s+.+)$/);
  const globalVariables = findGlobalVariables(lines);
  const usedDataApis = findApiSignals(code, DATA_APIS);
  const usedOrderApis = findApiSignals(code, ORDER_APIS);
  const schedulerApis = findSchedulerSignals(code);
  const entryFunctions = unique(symbols.filter((symbol) => symbol.kind === "function" && ENTRY_FUNCTIONS.has(symbol.name)).map((symbol) => symbol.name));
  const classes = unique(symbols.filter((symbol) => symbol.kind === "class").map((symbol) => symbol.name));
  const businessFunctions = unique(symbols
    .filter((symbol) => symbol.kind === "function" && !ENTRY_FUNCTIONS.has(symbol.name))
    .map((symbol) => symbol.name)
    .slice(0, 40));
  const detected = detectPlatform(code, task.sourcePlatform);
  const riskFlags = buildRiskFlags(code, usedDataApis, usedOrderApis);
  const manualReviewItems = buildManualReviewItems(task, code, detected.platform, usedDataApis, usedOrderApis);

  return {
    inputChars: code.length,
    inputLines: lines.length,
    detectedPlatform: detected.platform,
    platformConfidence: detected.confidence,
    platformSignals: detected.signals,
    entryFunctions,
    schedulerFunctions: schedulerApis,
    dataApis: usedDataApis,
    orderApis: usedOrderApis,
    globalVariables,
    businessFunctions,
    classes,
    imports: imports.slice(0, 40),
    dependencies: buildDependencies(imports, usedDataApis, usedOrderApis),
    riskFlags,
    manualReviewItems
  };
}

function buildCodeChunks(task: Pick<AiTask, "type" | "inputCode">, singleCallLimit: number): CodeChunk[] {
  const code = task.inputCode ?? "";
  const lines = splitLines(code);
  const maxChunkChars = getChunkCharBudget(task.type, singleCallLimit);
  const symbols = findSymbols(lines, true);
  const ranges = buildCodeRanges(lines, symbols);
  const chunks: CodeChunk[] = [];
  let pending: Omit<CodeChunk, "id" | "index"> | null = null;

  for (const range of ranges) {
    for (const piece of splitRangeIfNeeded(lines, range, maxChunkChars)) {
      if (!pending) {
        pending = piece;
        continue;
      }

      if (pending.charCount + piece.charCount + 2 <= maxChunkChars) {
        pending = {
          startLine: pending.startLine,
          endLine: piece.endLine,
          title: mergeTitles(pending.title, piece.title),
          kind: pending.kind === piece.kind ? pending.kind : "mixed",
          code: `${pending.code}\n\n${piece.code}`,
          charCount: pending.charCount + piece.charCount + 2,
          symbols: unique([...pending.symbols, ...piece.symbols])
        };
        continue;
      }

      chunks.push(materializeChunk(pending, chunks.length));
      pending = piece;
    }
  }

  if (pending) {
    chunks.push(materializeChunk(pending, chunks.length));
  }

  if (chunks.length > 0) {
    return chunks;
  }

  return splitPlainCode(lines, maxChunkChars).map((chunk, index) => materializeChunk(chunk, index));
}

function buildChunkProviderInput(input: AiProviderInput, scan: CodeStructureScan, chunk: CodeChunk, chunkCount: number): AiProviderInput {
  return {
    ...input,
    task: {
      ...input.task,
      prompt: buildChunkPrompt(input, scan, chunk, chunkCount),
      inputCode: chunk.code
    },
    conversationContext: buildChunkConversationContext(input.conversationContext, scan)
  };
}

function buildChunkPrompt(input: AiProviderInput, scan: CodeStructureScan, chunk: CodeChunk, chunkCount: number) {
  const userPrompt = input.task.prompt?.trim();
  const action = input.task.type === "code_conversion" ? "转换" : "解析";

  return [
    userPrompt ? `用户补充要求：${truncateText(userPrompt, 1200)}` : "",
    `大型代码分段${action}任务：当前只处理第 ${chunk.index + 1} / ${chunkCount} 段。`,
    "不要展示模型私有推理链。只输出兼容既有 schema 的 JSON。",
    "本段结果会由服务端与其他分段合并；请保留本段代码的交易语义、参数、调度、数据依赖、下单动作和风控意图。",
    "如果本段引用了其他分段中的函数、全局变量或平台 API，请在 reportJson.dependencies 或 manualReviewItems 中标注，不要凭空补全未出现的逻辑。",
    input.task.type === "code_conversion"
      ? "转换要求：按行为语义迁移，不只做表面语法替换；PTrade、聚宽 JoinQuant、QMT 的不确定 API 必须标注“需要人工复核”。转换到 QMT 时必须保守区分 QMT 内置 Python 与 XtQuant，不确定时不要混用 API。"
      : "解析要求：只解释代码证据能支持的内容；识别入口、调度、数据、选股、信号、下单、持仓、风控和需要人工复核的缺口。",
    "结构扫描摘要：",
    JSON.stringify(toPublicScanSummary(scan), null, 2),
    "当前代码段：",
    JSON.stringify({
      chunkId: chunk.id,
      chunkIndex: chunk.index + 1,
      chunkCount,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      kind: chunk.kind,
      title: chunk.title,
      symbols: chunk.symbols
    }, null, 2),
    input.task.type === "code_analysis"
      ? "输出要求：reportJson 尽量按 overview、tradingLogic、keyParameters、risks、suggestions 五类报告字段组织；如果仍输出 codeStructure、parameters、platformDependencies、optimizationSuggestions，服务端会做兼容合并。"
      : "输出要求：reportJson 至少包含 processingMode='chunked'、phase='processing'、chunkId、chunkIndex、chunkCount、codeStructure、dependencies、manualReviewItems。"
  ].filter(Boolean).join("\n\n");
}

function buildChunkConversationContext(conversationContext: string | undefined, scan: CodeStructureScan) {
  const context = conversationContext ? truncateText(conversationContext, 4000) : "";

  return [
    context,
    "服务端本地结构扫描（公开摘要，不是模型思考链）：",
    JSON.stringify(toPublicScanSummary(scan), null, 2)
  ].filter(Boolean).join("\n\n");
}

async function mergeChunkResults(
  input: AiProviderInput,
  scan: CodeStructureScan,
  chunks: CodeChunk[],
  chunkResults: ChunkResult[]
): Promise<AiProviderResult> {
  const taskType: CodeProcessingTaskType = input.task.type === "code_conversion" ? "code_conversion" : "code_analysis";
  const scopeStatus = chunkResults.some((item) => item.result.scopeStatus === "in_scope") ? "in_scope" : "out_of_scope";
  const tokenUsage = sumTokenUsage(chunkResults.map((item) => item.result.tokenUsage));
  const model = unique(chunkResults.map((item) => item.result.model).filter(Boolean)).join(", ") || "unknown";
  const manualReviewItems = unique([
    ...scan.manualReviewItems,
    ...chunkResults.flatMap((item) => readStringArray(item.result.reportJson?.manualReviewItems))
  ]).slice(0, 30);
  const dependencies = unique([
    ...scan.dependencies,
    ...chunkResults.flatMap((item) => readStringArray(item.result.reportJson?.dependencies))
  ]).slice(0, 40);
  const riskWarnings = unique([
    ...scan.riskFlags,
    ...chunkResults.flatMap((item) => item.result.riskWarnings)
  ]).slice(0, 16);

  if (scopeStatus === "out_of_scope") {
    return {
      scopeStatus,
      generatedCode: null,
      explanation: input.skill.outOfScopeResponse,
      migrationNotes: null,
      riskWarnings: riskWarnings.length ? riskWarnings : ["本次请求超出当前模块范围。"],
      reportJson: buildMergedReportJson(input, scan, chunks, chunkResults, {
        manualReviewItems,
        dependencies,
        validation: {
          status: "skipped",
          reason: "out_of_scope"
        }
      }),
      model,
      tokenUsage
    };
  }

  const generatedCode = taskType === "code_conversion"
    ? buildMergedGeneratedCode(input.task, chunkResults)
    : null;
  const explanation = buildMergedExplanation(taskType, scan, chunkResults);
  const migrationNotes = taskType === "code_conversion"
    ? buildMergedMigrationNotes(scan, chunkResults, manualReviewItems)
    : buildAnalysisMigrationNotes(chunkResults, manualReviewItems);
  await input.progressReporter?.({
    phase: "validating",
    processingMode: "chunked",
    inputChars: scan.inputChars,
    chunkCount: chunks.length,
    completedChunks: chunkResults.length,
    currentChunk: null,
    statusMessage: taskType === "code_analysis"
      ? "正在整理解析报告。"
      : "正在检查输出是否完整传输。"
  });
  const validation = validateMergedResult(taskType, generatedCode, explanation, chunkResults);

  return {
    scopeStatus,
    generatedCode,
    explanation,
    migrationNotes,
    riskWarnings: riskWarnings.length ? riskWarnings : ["请在回测和模拟盘中验证结果，不构成投资建议。"],
    reportJson: buildMergedReportJson(input, scan, chunks, chunkResults, {
      manualReviewItems,
      dependencies,
      validation
    }),
    model,
    tokenUsage
  };
}

function buildMergedGeneratedCode(task: Pick<AiTask, "sourcePlatform" | "targetPlatform">, chunkResults: ChunkResult[]) {
  const blocks = chunkResults
    .map((item) => item.result.generatedCode?.trim())
    .filter((code): code is string => Boolean(code));
  const uniqueBlocks = dedupeAdjacentBlocks(blocks);
  const needsQmtEncoding = isQmtBuiltInTarget(task.targetPlatform);
  const header = [
    needsQmtEncoding ? "#coding:gbk" : "",
    "# LightQuant chunked conversion output",
    task.sourcePlatform ? `# Source platform: ${task.sourcePlatform}` : "",
    task.targetPlatform ? `# Target platform: ${task.targetPlatform}` : "",
    "# Review all items marked manual review before backtest or live trading."
  ].filter(Boolean).join("\n");

  return [header, ...uniqueBlocks].join("\n\n").trim();
}

function buildMergedExplanation(type: CodeProcessingTaskType, scan: CodeStructureScan, chunkResults: ChunkResult[]) {
  const chunkExplanations = chunkResults
    .map((item) => item.result.explanation?.trim())
    .filter((value): value is string => Boolean(value))
    .map((value, index) => `${index + 1}. ${value}`);
  const scanOverview = [
    type === "code_conversion" ? "处理模式：分段转换。" : "已完成策略结构与交易逻辑解析。",
    type === "code_conversion" ? `服务端先完成结构扫描，共 ${scan.inputLines} 行。` : "",
    `识别平台：${scan.detectedPlatform}（置信度 ${scan.platformConfidence}）。`,
    scan.entryFunctions.length ? `入口函数：${scan.entryFunctions.join(", ")}。` : "",
    scan.schedulerFunctions.length ? `调度信号：${scan.schedulerFunctions.join(", ")}。` : "",
    scan.businessFunctions.length ? `主要业务函数：${scan.businessFunctions.slice(0, 12).join(", ")}${scan.businessFunctions.length > 12 ? " 等" : ""}。` : ""
  ].filter(Boolean).join("\n");

  return truncateText([scanOverview, ...chunkExplanations].join("\n\n"), 60000);
}

function buildMergedMigrationNotes(scan: CodeStructureScan, chunkResults: ChunkResult[], manualReviewItems: string[]) {
  const notes = unique([
    ...chunkResults.map((item) => item.result.migrationNotes).filter((value): value is string => Boolean(value?.trim())),
    ...manualReviewItems.map((item) => `需要人工复核：${item}`)
  ]);
  const platformNotes = [
    scan.dataApis.length ? `数据接口涉及：${scan.dataApis.join(", ")}。` : "",
    scan.orderApis.length ? `下单接口涉及：${scan.orderApis.join(", ")}。` : ""
  ].filter(Boolean);

  return truncateText([...platformNotes, ...notes].join("\n\n"), 40000) || "已按分段结果合并迁移说明；请逐项复核目标平台 API 差异。";
}

function buildAnalysisMigrationNotes(chunkResults: ChunkResult[], manualReviewItems: string[]) {
  const notes = unique([
    ...chunkResults.map((item) => item.result.migrationNotes).filter((value): value is string => Boolean(value?.trim())),
    ...manualReviewItems.map((item) => `需要人工复核：${item}`)
  ]);

  return notes.length ? truncateText(notes.join("\n\n"), 24000) : null;
}

function validateMergedResult(
  type: CodeProcessingTaskType,
  generatedCode: string | null,
  explanation: string | null,
  chunkResults: ChunkResult[]
) {
  const truncatedChunks = chunkResults
    .filter((item) => isLikelyTruncated(item.result.generatedCode) || isLikelyTruncated(item.result.explanation))
    .map((item) => item.chunk.id);

  if (truncatedChunks.length > 0) {
    if (type === "code_analysis") {
      throw new ApiError("AI_TASK_FAILED", "解析结果疑似被截断，请重试。若多次失败，可尝试减少非必要注释或拆分复杂策略。", 502);
    }

    throw new ApiError("AI_TASK_FAILED", `分段处理失败（validate）：第 ${truncatedChunks.join(", ")} 段结果疑似被截断，请重试。若多次失败，可尝试减少非必要注释或拆分复杂策略。`, 502);
  }

  if (type === "code_conversion" && !generatedCode?.trim()) {
    throw new ApiError("AI_TASK_FAILED", "分段处理失败（validate）：转换结果为空。", 502);
  }

  if (type === "code_analysis" && !explanation?.trim()) {
    throw new ApiError("AI_TASK_FAILED", "解析说明为空，请重试。若多次失败，可尝试补充平台信息或拆分复杂策略。", 502);
  }

  return {
    status: "passed",
    checked: ["json_structure", "empty_result", "obvious_truncation", "duplicate_adjacent_blocks"],
    truncatedChunks: []
  };
}

function buildMergedReportJson(
  input: AiProviderInput,
  scan: CodeStructureScan,
  chunks: CodeChunk[],
  chunkResults: ChunkResult[],
  extra: {
    manualReviewItems: string[];
    dependencies: string[];
    validation: Record<string, unknown>;
  }
) {
  const analysisReport = input.task.type === "code_analysis"
    ? buildMergedAnalysisReportFields(scan, chunks, chunkResults, extra)
    : {};

  return {
    processingMode: "chunked",
    phase: "completed",
    scopeStatus: chunkResults.some((item) => item.result.scopeStatus === "in_scope") ? "in_scope" : "out_of_scope",
    inputChars: scan.inputChars,
    chunkCount: chunks.length,
    completedChunks: chunkResults.length,
    sourcePlatform: input.task.sourcePlatform ?? scan.detectedPlatform,
    targetPlatform: input.task.targetPlatform ?? null,
    scan: toPublicScanSummary(scan),
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      index: chunk.index + 1,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      kind: chunk.kind,
      title: chunk.title,
      charCount: chunk.charCount,
      symbols: chunk.symbols
    })),
    chunkSummaries: chunkResults.map((item) => ({
      chunkId: item.chunk.id,
      scopeStatus: item.result.scopeStatus,
      explanationPreview: truncateText(item.result.explanation ?? "", 500),
      riskWarnings: item.result.riskWarnings.slice(0, 6),
      manualReviewItems: readStringArray(item.result.reportJson?.manualReviewItems).slice(0, 8)
    })),
    ...analysisReport,
    manualReviewItems: extra.manualReviewItems,
    dependencies: extra.dependencies,
    validation: extra.validation,
    skillId: input.skill.id,
    skillVersion: input.skill.version,
    displayName: input.config.displayName,
    costPoints: input.config.costPoints
  };
}

function buildMergedAnalysisReportFields(
  scan: CodeStructureScan,
  chunks: CodeChunk[],
  chunkResults: ChunkResult[],
  extra: {
    manualReviewItems: string[];
    dependencies: string[];
    validation: Record<string, unknown>;
  }
) {
  const codeStructure = unique([
    scan.entryFunctions.length ? `入口函数：${scan.entryFunctions.join("、")}` : "",
    scan.schedulerFunctions.length ? `调度逻辑：${scan.schedulerFunctions.join("、")}` : "",
    scan.dataApis.length ? `数据接口：${scan.dataApis.join("、")}` : "",
    scan.orderApis.length ? `下单接口：${scan.orderApis.join("、")}` : "",
    scan.businessFunctions.length ? `主要业务函数：${scan.businessFunctions.slice(0, 18).join("、")}${scan.businessFunctions.length > 18 ? " 等" : ""}` : "",
    ...collectChunkReportField(chunkResults, "overview"),
    ...collectChunkReportField(chunkResults, "codeStructure")
  ].filter(Boolean)).slice(0, 40);
  const tradingLogic = collectChunkReportField(chunkResults, "tradingLogic").slice(0, 50);
  const parameters = unique([
    ...collectChunkReportField(chunkResults, "keyParameters"),
    ...collectChunkReportField(chunkResults, "parameters")
  ]).slice(0, 40);
  const platformDependencies = unique([
    ...extra.dependencies,
    ...collectChunkReportField(chunkResults, "platformDependencies")
  ]).slice(0, 40);
  const riskWarnings = unique([
    ...scan.riskFlags,
    ...chunkResults.flatMap((item) => item.result.riskWarnings),
    ...collectChunkReportField(chunkResults, "risks"),
    ...collectChunkReportField(chunkResults, "riskWarnings")
  ]).slice(0, 20);
  const optimizationSuggestions = unique([
    ...collectChunkReportField(chunkResults, "suggestions"),
    ...collectChunkReportField(chunkResults, "optimizationSuggestions"),
    ...extra.manualReviewItems.map((item) => `复核：${item}`)
  ]).slice(0, 30);

  return {
    overview: [
      reportItem("策略名称", "代码中未明确给出"),
      reportItem("平台识别", [`识别平台为 ${scan.detectedPlatform}。`, `识别置信度为 ${scan.platformConfidence}。`]),
      reportItem("策略类型", "代码中未明确给出"),
      reportItem("交易范围", scan.businessFunctions.length ? [`代码涉及 ${scan.businessFunctions.slice(0, 12).join("、")} 等业务逻辑。`] : "代码中未明确给出"),
      reportItem("核心思路", codeStructure.length ? codeStructure.slice(0, 4) : "代码中未明确给出"),
      reportItem("运行频率", scan.schedulerFunctions.length ? [`检测到调度或周期处理逻辑。`, scan.schedulerFunctions.join("、")] : "代码中未明确给出"),
      reportItem("无信号处理", "代码中未明确给出")
    ],
    tradingLogic: [
      reportItem("初始化", scan.entryFunctions.length ? [`策略启动时执行初始化入口。`, `检测到 ${scan.entryFunctions.join("、")}。`] : "代码中未明确给出"),
      reportItem("盘前/记录", scan.schedulerFunctions.length ? [`代码包含调度或记录类流程。`, scan.schedulerFunctions.join("、")] : "代码中未明确给出"),
      reportItem("调仓时间", scan.schedulerFunctions.length ? scan.schedulerFunctions.slice(0, 4) : "代码中未明确给出"),
      reportItem("数据读取", scan.dataApis.length ? [`代码读取行情或基础数据。`, scan.dataApis.join("、")] : "代码中未明确给出"),
      reportItem("信号生成", tradingLogic.length ? tradingLogic.slice(0, 8) : "代码中未明确给出"),
      reportItem("目标标的形成", tradingLogic.filter((item) => /目标|候选|选股|名单|排序|rank|sort/i.test(item)).slice(0, 5)),
      reportItem("买入逻辑", tradingLogic.filter((item) => /买入|开仓|加仓|order|passorder/.test(item)).slice(0, 5)),
      reportItem("卖出逻辑", tradingLogic.filter((item) => /卖出|平仓|减仓|调仓|止盈|止损/.test(item)).slice(0, 6)),
      reportItem("下单限制", scan.orderApis.length ? [`检测到下单相关动作。`, scan.orderApis.join("、")] : "代码中未明确给出")
    ],
    keyParameters: [
      reportItem("观察周期", parameters.filter((item) => /周期|window|period|days|日/i.test(item)).slice(0, 5)),
      reportItem("目标持仓数", parameters.filter((item) => /持仓|数量|stock_num|count/i.test(item)).slice(0, 5)),
      reportItem("持仓权重", parameters.filter((item) => /等权|加权|weight|percent|仓位/i.test(item)).slice(0, 5)),
      reportItem("最小交易金额", parameters.filter((item) => /最小|最低|金额|cash|value|min/i.test(item)).slice(0, 5)),
      reportItem("止损线", parameters.filter((item) => /止损|stop.?loss/i.test(item)).slice(0, 5)),
      reportItem("滑点", parameters.filter((item) => /滑点|slippage/i.test(item)).slice(0, 5)),
      reportItem("交易费用", parameters.filter((item) => /费用|commission|tax|cost/i.test(item)).slice(0, 5)),
      reportItem("最低佣金", parameters.filter((item) => /最低佣金|min/i.test(item)).slice(0, 5)),
      reportItem("现金处理", parameters.filter((item) => /现金|cash|剩余|空仓/i.test(item)).slice(0, 5)),
      reportItem("其他关键参数", parameters.length ? joinReportLines(parameters) : "代码中未明确给出")
    ],
    risks: [
      reportItem("主题集中风险", riskWarnings.filter((item) => /主题|行业|板块|指数/.test(item)).slice(0, 4)),
      reportItem("单标的集中风险", riskWarnings.filter((item) => /个股|单标的|单票|仓位|止损/.test(item)).slice(0, 4)),
      reportItem("无信号处理风险", riskWarnings.filter((item) => /空仓|无信号|候选|目标/.test(item)).slice(0, 4)),
      reportItem("交易可达性风险", riskWarnings.filter((item) => /停牌|涨跌停|ST|成交|流动/.test(item)).slice(0, 5)),
      reportItem("流动性风险", riskWarnings.filter((item) => /流动性|成交|volume/i.test(item)).slice(0, 4)),
      reportItem("参数敏感性", riskWarnings.filter((item) => /参数|阈值|窗口|周期/.test(item)).slice(0, 5)),
      reportItem("回测与实盘差异", riskWarnings.filter((item) => /回测|实盘|成交|滑点|费用/.test(item)).slice(0, 5))
    ],
    suggestions: [
      reportItem("信号计算可解释性", optimizationSuggestions.filter((item) => /信号|解释|结构|函数|可读/.test(item)).slice(0, 5)),
      reportItem("止损独立运行", optimizationSuggestions.filter((item) => /止损|风控/.test(item)).slice(0, 4)),
      reportItem("交易可达性检查", optimizationSuggestions.filter((item) => /停牌|涨跌停|成交|交易/.test(item)).slice(0, 5)),
      reportItem("单票集中度控制", optimizationSuggestions.filter((item) => /单票|仓位|集中/.test(item)).slice(0, 4)),
      reportItem("日志可读性", optimizationSuggestions.filter((item) => /日志|记录|可读/.test(item)).slice(0, 4)),
      reportItem("参数显式化", optimizationSuggestions.filter((item) => /参数|配置/.test(item)).slice(0, 5)),
      reportItem("回测验证", optimizationSuggestions.filter((item) => /回测|验证|滑点|费用/.test(item)).slice(0, 5))
    ],
    riskWarnings,
    optimizationSuggestions,
    validation: extra.validation
  };
}

function buildMergedAnalysisOverview(scan: CodeStructureScan) {
  return [
    "已完成策略结构、交易逻辑、关键参数和风险点解析。",
    `识别平台：${scan.detectedPlatform}（置信度 ${scan.platformConfidence}）。`,
    scan.entryFunctions.length ? `策略入口包括 ${scan.entryFunctions.join("、")}。` : "",
    scan.schedulerFunctions.length ? `检测到调度或周期处理逻辑：${scan.schedulerFunctions.join("、")}。` : "",
    scan.dataApis.length ? `行情/数据依赖包括 ${scan.dataApis.join("、")}。` : "",
    scan.orderApis.length ? `下单相关接口包括 ${scan.orderApis.join("、")}。` : ""
  ].filter(Boolean).join("\n");
}

function reportItem(title: string, value: string | string[], evidence?: string) {
  const lines = Array.isArray(value)
    ? unique(value.map((item) => item.trim()).filter(Boolean)).slice(0, 8)
    : value.trim() && value.trim() !== "代码中未明确给出"
      ? [value.trim()]
      : [];

  return {
    title,
    value: lines[0] || "代码中未明确给出",
    lines,
    ...(evidence?.trim() ? { evidence: evidence.trim() } : {})
  };
}

function joinReportLines(items: string[]) {
  return unique(items.map((item) => item.trim()).filter(Boolean)).slice(0, 8).join("；");
}

function collectChunkReportField(chunkResults: ChunkResult[], field: string) {
  return unique(chunkResults.flatMap((item) => readStringArray(item.result.reportJson?.[field])));
}

function buildCodeRanges(lines: string[], symbols: CodeSymbol[]) {
  const topLevelSymbols = symbols.filter((symbol) => symbol.line >= 1);

  if (topLevelSymbols.length === 0) {
    return [{
      startLine: 1,
      endLine: lines.length,
      title: "plain-code",
      kind: "mixed" as const,
      symbols: [] as string[]
    }];
  }

  const ranges: Array<{ startLine: number; endLine: number; title: string; kind: CodeChunk["kind"]; symbols: string[] }> = [];
  const firstSymbolLine = topLevelSymbols[0].line;

  if (firstSymbolLine > 1 && lines.slice(0, firstSymbolLine - 1).some((line) => line.trim())) {
    ranges.push({
      startLine: 1,
      endLine: firstSymbolLine - 1,
      title: "imports-globals",
      kind: "preamble",
      symbols: []
    });
  }

  topLevelSymbols.forEach((symbol, index) => {
    ranges.push({
      startLine: symbol.line,
      endLine: index + 1 < topLevelSymbols.length ? topLevelSymbols[index + 1].line - 1 : lines.length,
      title: `${symbol.kind}:${symbol.name}`,
      kind: "block",
      symbols: [symbol.name]
    });
  });

  return ranges;
}

function splitRangeIfNeeded(
  lines: string[],
  range: { startLine: number; endLine: number; title: string; kind: CodeChunk["kind"]; symbols: string[] },
  maxChunkChars: number
) {
  const code = lines.slice(range.startLine - 1, range.endLine).join("\n");

  if (code.length <= maxChunkChars) {
    return [{
      ...range,
      code,
      charCount: code.length
    }];
  }

  const chunks: Array<Omit<CodeChunk, "id" | "index">> = [];
  let cursor = range.startLine;
  let part = 1;

  while (cursor <= range.endLine) {
    let endLine = cursor;
    let charCount = 0;

    while (endLine <= range.endLine && charCount + lines[endLine - 1].length + 1 <= maxChunkChars) {
      charCount += lines[endLine - 1].length + 1;
      endLine += 1;
    }

    if (endLine === cursor) {
      endLine += 1;
    }

    const pieceCode = lines.slice(cursor - 1, endLine - 1).join("\n");
    chunks.push({
      startLine: cursor,
      endLine: endLine - 1,
      title: `${range.title}:part-${part}`,
      kind: "split",
      code: pieceCode,
      charCount: pieceCode.length,
      symbols: range.symbols
    });
    cursor = endLine;
    part += 1;
  }

  return chunks;
}

function splitPlainCode(lines: string[], maxChunkChars: number) {
  return splitRangeIfNeeded(lines, {
    startLine: 1,
    endLine: lines.length,
    title: "plain-code",
    kind: "mixed",
    symbols: []
  }, maxChunkChars);
}

function findSymbols(lines: string[], topLevelOnly: boolean): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  const pattern = /^([ \t]*)(?:async\s+def|def)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:|^([ \t]*)class\s+([A-Za-z_]\w*)\b/;

  lines.forEach((line, index) => {
    const match = line.match(pattern);

    if (!match) {
      return;
    }

    const indent = match[1] ?? match[4] ?? "";

    if (topLevelOnly && indent.length > 0) {
      return;
    }

    if (match[2]) {
      symbols.push({
        kind: "function",
        name: match[2],
        args: match[3] ?? "",
        line: index + 1
      });
      return;
    }

    if (match[5]) {
      symbols.push({
        kind: "class",
        name: match[5],
        line: index + 1
      });
    }
  });

  return symbols;
}

function findGlobalVariables(lines: string[]) {
  const variables = new Set<string>();

  for (const line of lines) {
    const topLevel = line.match(/^([A-Za-z_]\w*)\s*=/);
    const globalState = line.match(/\bg\.([A-Za-z_]\w*)\s*=/);

    if (topLevel) {
      variables.add(topLevel[1]);
    }

    if (globalState) {
      variables.add(`g.${globalState[1]}`);
    }
  }

  return [...variables].slice(0, 50);
}

function findApiSignals(code: string, apis: string[]) {
  return apis.filter((api) => new RegExp(`\\b${escapeRegExp(api)}\\b`).test(code)).slice(0, 40);
}

function findSchedulerSignals(code: string) {
  const apis = findApiSignals(code, SCHEDULER_APIS);
  const scheduledFunctions = [...code.matchAll(/\b(?:run_daily|run_weekly|run_monthly|schedule_function)\s*\(\s*([A-Za-z_]\w*)/g)]
    .map((match) => match[1]);

  return unique([...apis, ...scheduledFunctions]).slice(0, 40);
}

function detectPlatform(code: string, selectedPlatform: string | null | undefined) {
  if (selectedPlatform?.trim()) {
    return {
      platform: selectedPlatform.trim(),
      confidence: "high" as const,
      signals: ["user-selected sourcePlatform"]
    };
  }

  const matched = PLATFORM_SIGNALS
    .map((candidate) => {
      const hits = candidate.patterns.filter((pattern) => pattern.test(code)).length;

      return {
        ...candidate,
        hits
      };
    })
    .sort((left, right) => right.hits - left.hits)[0];

  if (!matched || matched.hits === 0) {
    return {
      platform: "unknown",
      confidence: "low" as const,
      signals: []
    };
  }

  return {
    platform: matched.platform,
    confidence: matched.hits >= 2 ? matched.confidence : "medium" as const,
    signals: matched.labels
  };
}

function buildRiskFlags(code: string, dataApis: string[], orderApis: string[]) {
  const flags: string[] = [];

  if (/api[_-]?key|secret|password|passwd|token\s*=|access[_-]?key/i.test(code)) {
    flags.push("输入可能包含敏感凭证，请脱敏后再用于生产或协作。");
  }

  if (dataApis.includes("get_fundamentals") || dataApis.includes("get_financial_data")) {
    flags.push("基本面/财务数据字段和可得日期需要复核，避免未来函数。");
  }

  if (orderApis.includes("passorder")) {
    flags.push("QMT passorder 仅代表提交委托，不等同成交确认。");
  }

  if (/\bget_full_tick\b/.test(code)) {
    flags.push("QMT 回测中不应使用实时 tick 作为历史决策依据。");
  }

  return flags;
}

function buildManualReviewItems(
  task: Pick<AiTask, "sourcePlatform" | "targetPlatform">,
  code: string,
  detectedPlatform: string,
  dataApis: string[],
  orderApis: string[]
) {
  const items: string[] = [];
  const target = `${task.targetPlatform ?? ""}`.toLowerCase();
  const source = `${task.sourcePlatform ?? detectedPlatform}`.toLowerCase();

  if (target.includes("qmt") && !target.includes("xtquant") && !target.includes("内置")) {
    items.push("目标平台包含 QMT 但未明确内置 Python 或 XtQuant，需人工复核目标运行环境。");
  }

  if ((source.includes("joinquant") || source.includes("聚宽")) && target.includes("qmt")) {
    items.push("JoinQuant 到 QMT 的生命周期、调度、代码格式和证券代码后缀需人工复核。");
  }

  if (dataApis.some((api) => ["get_fundamentals", "query", "valuation", "income", "balance", "indicator"].includes(api))) {
    items.push("基本面/财务字段、报告期和公告日期可得性需人工复核。");
  }

  if (orderApis.length > 0) {
    items.push("下单接口、成交回报、持仓字段和最小交易单位需人工复核。");
  }

  if (/\b(?:paused|is_st|high_limit|low_limit|limit_up|limit_down)\b/.test(code)) {
    items.push("停牌、ST、涨跌停等可交易性过滤在目标平台的数据字段需人工复核。");
  }

  return unique(items);
}

function buildDependencies(imports: string[], dataApis: string[], orderApis: string[]) {
  return unique([
    ...imports.map((item) => item.replace(/\s+/g, " ").trim()).slice(0, 20),
    ...dataApis.map((api) => `data:${api}`),
    ...orderApis.map((api) => `order:${api}`)
  ]);
}

function toPublicScanSummary(scan: CodeStructureScan) {
  return {
    inputChars: scan.inputChars,
    inputLines: scan.inputLines,
    detectedPlatform: scan.detectedPlatform,
    platformConfidence: scan.platformConfidence,
    platformSignals: scan.platformSignals,
    entryFunctions: scan.entryFunctions,
    schedulerFunctions: scan.schedulerFunctions,
    dataApis: scan.dataApis,
    orderApis: scan.orderApis,
    globalVariables: scan.globalVariables.slice(0, 30),
    businessFunctions: scan.businessFunctions.slice(0, 30),
    classes: scan.classes,
    dependencies: scan.dependencies.slice(0, 30),
    riskFlags: scan.riskFlags,
    manualReviewItems: scan.manualReviewItems
  };
}

function chunkProcessingError(error: unknown, type: CodeProcessingTaskType, chunk: CodeChunk, chunkCount: number) {
  const action = type === "code_conversion" ? "convert" : "analyze";

  if (error instanceof ApiError) {
    if (type === "code_analysis") {
      return new ApiError(
        error.code,
        `解析任务处理失败：${sanitizeAnalysisChunkErrorMessage(error.message)}`,
        error.status
      );
    }

    return new ApiError(
      error.code,
      `分段处理失败（${action} 第 ${chunk.index + 1}/${chunkCount} 段，行 ${chunk.startLine}-${chunk.endLine}）：${error.message}`,
      error.status
    );
  }

  if (type === "code_analysis") {
    return new ApiError(
      "AI_TASK_FAILED",
      "解析任务处理失败，请稍后重试。",
      500
    );
  }

  return new ApiError(
    "AI_TASK_FAILED",
    `分段处理失败（${action} 第 ${chunk.index + 1}/${chunkCount} 段，行 ${chunk.startLine}-${chunk.endLine}）：AI 任务执行失败，请稍后再试。`,
    500
  );
}

function sanitizeAnalysisChunkErrorMessage(message: string) {
  return message
    .replace(/分段处理失败（[^）]+）：/g, "")
    .replace(/第\s*\d+\s*\/\s*\d+\s*段[，,]?\s*/g, "")
    .replace(/行\s*\d+\s*-\s*\d+[：:，,]?\s*/g, "")
    .replace(/chunk/gi, "处理")
    .trim() || "请稍后重试。";
}

function getChunkCharBudget(type: AiTaskType, singleCallLimit: number) {
  const ratio = type === "code_conversion" ? 0.6 : 0.65;

  return Math.max(8000, Math.floor(singleCallLimit * ratio));
}

function materializeChunk(chunk: Omit<CodeChunk, "id" | "index">, index: number): CodeChunk {
  return {
    ...chunk,
    id: `chunk-${index + 1}`,
    index
  };
}

function mergeTitles(left: string, right: string) {
  if (left === right) {
    return left;
  }

  return `${left} + ${right}`;
}

function splitLines(code: string) {
  return code.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function uniqueMatches(lines: string[], pattern: RegExp) {
  return unique(lines.map((line) => line.match(pattern)?.[0]?.trim()).filter((value): value is string => Boolean(value)));
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function readStringArray(value: unknown): string[] {
  if (value === null || typeof value === "undefined") {
    return [];
  }

  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => readStringArray(item)).filter(Boolean);
  }

  if (typeof value === "object") {
    const text: string = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const itemText: string = readStringArray(item).join("、");

        return itemText ? `${key}：${itemText}` : "";
      })
      .filter(Boolean)
      .join("；");

    return text ? [text] : [];
  }

  return [];
}

function sumTokenUsage(items: AiProviderResult["tokenUsage"][]): AiProviderResult["tokenUsage"] {
  return {
    promptTokens: items.reduce((total, item) => total + item.promptTokens, 0),
    completionTokens: items.reduce((total, item) => total + item.completionTokens, 0),
    totalTokens: items.reduce((total, item) => total + item.totalTokens, 0)
  };
}

function dedupeAdjacentBlocks(blocks: string[]) {
  const deduped: string[] = [];

  for (const block of blocks) {
    if (deduped[deduped.length - 1]?.trim() !== block.trim()) {
      deduped.push(block);
    }
  }

  return deduped;
}

function isLikelyTruncated(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  return trimmed.endsWith("...") && trimmed.length > 1000;
}

function isQmtBuiltInTarget(targetPlatform: string | null | undefined) {
  const target = `${targetPlatform ?? ""}`.toLowerCase();

  return target.includes("qmt") && !target.includes("xtquant");
}

function truncateText(value: string, maxLength: number) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
