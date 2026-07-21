import { promises as fs } from "node:fs";
import path from "node:path";
import type { AiTask } from "@/server/domain";
import type { AiTaskConfig } from "@/server/ai/ai-task-config";
import type { AiSkill } from "@/server/ai/skills";

type Platform = "ptrade" | "qmt" | "joinquant";

type DocumentRecord = {
  id: string;
  platform: Platform;
  variant: string;
  source_role: "primary" | "supplementary";
  resolution_priority: number;
  document_type: string;
  title: string;
  section_path: string[];
  markdown_file: string;
  source_url: string | null;
  source_anchor: string | null;
  canonical: boolean;
};

type SymbolParameter = {
  name: string;
  type: string | null;
  default: string | null;
  required: boolean | null;
  description: string | null;
};

type SymbolReturn = {
  type: string | null;
  description: string | null;
  fields: Array<Record<string, unknown>>;
};

type SymbolRecord = {
  id: string;
  document_id: string;
  platform: Platform;
  variant: string;
  source_role: "primary" | "supplementary";
  resolution_priority: number;
  record_type: string;
  canonical_name: string;
  qualified_name: string;
  display_name: string;
  aliases: string[];
  summary: string | null;
  category_path: string[];
  signature: string | null;
  parameters: SymbolParameter[];
  returns: SymbolReturn[];
  environments: string[];
  availability_notes: string | null;
  version_notes: string[];
  source_anchor: string | null;
  source_url: string | null;
  markdown_file: string;
  evidence_excerpt: string;
};

type ChunkRecord = {
  id: string;
  document_id: string;
  platform: Platform;
  variant: string;
  source_role: "primary" | "supplementary";
  resolution_priority: number;
  document_type: string;
  title: string;
  heading_path: string[];
  symbol_ids: string[];
  content: string;
  markdown_file: string;
  source_url: string | null;
  source_anchor: string | null;
  contains_code: boolean;
  contains_table: boolean;
  contains_warning: boolean;
};

type AliasRecord = {
  id: string;
  platform: Platform;
  variant: string;
  alias?: string;
  target_id?: string;
  target_type?: "symbol" | "document";
};

type ConflictRecord = {
  id: string;
  platform: Platform;
  canonical_name: string;
  primary_symbol_id: string | null;
  supplementary_symbol_id: string | null;
  resolution: string;
};

type PlatformResolution = {
  cross_platform_aliases_allowed: boolean;
  purpose: string;
  ptrade: {
    default_resolution: string;
    supplementary_policy: string;
  };
  qmt: {
    source_mode: string;
  };
  joinquant: {
    canonical_strategy_source: string;
    alias_source: string;
    alias_body_indexed: boolean;
  };
};

type KnowledgeBase = {
  documents: DocumentRecord[];
  symbols: SymbolRecord[];
  chunks: ChunkRecord[];
  aliases: AliasRecord[];
  conflicts: ConflictRecord[];
  resolution: PlatformResolution;
  documentById: Map<string, DocumentRecord>;
  symbolById: Map<string, SymbolRecord>;
  chunksBySymbolId: Map<string, ChunkRecord[]>;
  aliasesByPlatform: Map<Platform, Map<string, AliasRecord[]>>;
  normalizedMarkdownByFile: Map<string, Promise<string>>;
};

type RetrievalRecord = {
  key: string;
  platform: Platform;
  variant: string;
  documentType: string;
  title: string;
  apiName: string | null;
  signature: string | null;
  parameters: string;
  returns: string;
  summary: string;
  source: string;
  detail: string | null;
  direct: boolean;
  capability: Capability | null;
  symbolId: string | null;
  chunkId: string | null;
  score: number;
};

type Capability = "lifecycle" | "data" | "scheduling" | "order" | "account" | "finance" | "risk";

export type ApiDocumentRetrievalMetadata = {
  taskId: string;
  taskType: AiTask["type"];
  sourcePlatform: string | null;
  targetPlatform: string | null;
  detectedApiNames: string[];
  matchedSymbolCount: number;
  matchedChunkCount: number;
  normalizedFallbackCount: number;
  includedApiNames: string[];
  documentContextCharacterCount: number;
  estimatedDocumentTokens: number;
  documentCompressionApplied: boolean;
  retrievalDurationMs: number;
  documentBudgetCharacters: number;
  outputTokenReserve: number;
};

export type ApiDocumentContext = {
  text: string;
  metadata: ApiDocumentRetrievalMetadata;
};

export type ApiDocumentRetrievalInput = {
  task: AiTask;
  skill: AiSkill;
  config: AiTaskConfig;
  conversationContext?: string;
  modelMaxOutputTokens: number;
};

const INDEX_FILES = [
  "documents.jsonl",
  "symbols.jsonl",
  "chunks.jsonl",
  "aliases.jsonl",
  "conflicts.jsonl",
  "platform-resolution.json"
] as const;

const BUILTIN_NAMES = new Set([
  "abs", "all", "any", "bool", "dict", "enumerate", "filter", "float", "format", "getattr", "hasattr", "int", "isinstance",
  "len", "list", "map", "max", "min", "next", "print", "range", "round", "set", "sorted", "str", "sum", "tuple", "type", "zip"
]);

const CAPABILITY_TERMS: Record<Capability, string[]> = {
  lifecycle: ["lifecycle", "callback", "initialize", "handle_data", "handlebar", "before_trading", "after_trading", "生命周期", "回调", "初始化"],
  data: ["market_data", "get_price", "get_history", "history", "行情", "历史数据", "数据获取", "数据接口"],
  scheduling: ["schedule", "run_daily", "run_weekly", "run_monthly", "调度", "定时", "周期调用"],
  order: ["order", "passorder", "trade", "下单", "委托", "交易接口", "交易类函数"],
  account: ["account", "portfolio", "position", "账户", "持仓", "资金", "账户信息"],
  finance: ["fundamental", "finance", "factor", "query", "财务", "财务数据", "因子"],
  risk: ["risk", "stop_loss", "风控", "止损", "涨跌停", "停牌"]
};

const BASE_CAPABILITIES: Capability[] = ["lifecycle", "data", "scheduling", "order", "account"];
const CONTEXT_INTRO = [
  "以下内容是根据当前任务，从目标平台和源平台API文档中检索到的相关参考资料。",
  "",
  "这些资料用于核对函数签名、参数、返回结构、运行方式和平台差异。",
  "",
  "请先理解完整策略行为，再结合现有LightQuant规则和以下API文档完成生成、修改、调试、解析或转换。",
  "",
  "不要机械地按同名函数替换，也不要把以下文档理解为固定的跨平台映射。",
  "",
  "API参考资料"
].join("\n");

const GLOBAL_CACHE_KEY = Symbol.for("lightquant.api-document-knowledge-base");
const globalCache = globalThis as typeof globalThis & { [GLOBAL_CACHE_KEY]?: Promise<KnowledgeBase> };

export class ApiDocumentKnowledgeBaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiDocumentKnowledgeBaseError";
  }
}

export async function assertApiDocumentKnowledgeBaseReady() {
  await loadKnowledgeBase();
}

export async function retrieveApiDocumentContext(input: ApiDocumentRetrievalInput): Promise<ApiDocumentContext> {
  const startedAt = performance.now();
  const kb = await loadKnowledgeBase();
  const taskText = [input.task.prompt, input.task.inputCode, input.conversationContext].filter(Boolean).join("\n");
  const platforms = resolveTaskPlatforms(input.task, taskText, kb);
  const detectedApiNames = detectApiNames(input.task, input.conversationContext, platforms, kb);
  const capabilities = detectCapabilities(input.task, taskText);
  const records: RetrievalRecord[] = [];
  let normalizedFallbackCount = 0;

  for (const platformSelection of platforms) {
    for (const apiName of detectedApiNames) {
      const exact = findSymbols(kb, platformSelection, apiName);

      if (exact.length > 0) {
        for (const symbol of exact) {
          records.push(recordFromSymbol(symbol, kb, true, inferCapability(symbol), 1000));
        }
        continue;
      }

      const chunkMatches = findRelevantChunks(kb, platformSelection, [apiName], true);
      if (chunkMatches.length > 0) {
        records.push(...chunkMatches.map((chunk) => recordFromChunk(chunk, true, inferCapability(chunk), 850, apiName)));
        const fallbacks = await searchNormalizedMarkdown(kb, platformSelection, apiName);
        normalizedFallbackCount += fallbacks.length;
        records.push(...fallbacks);
        continue;
      }

      const fallbacks = await searchNormalizedMarkdown(kb, platformSelection, apiName);
      normalizedFallbackCount += fallbacks.length;
      records.push(...fallbacks);
    }

    for (const capability of capabilities) {
      const capabilityRecord = findCapabilityRecord(kb, platformSelection, capability);
      if (capabilityRecord) {
        records.push(capabilityRecord);
      }
    }
  }

  const deduplicated = deduplicateRecords(records);
  const budget = calculateDocumentBudget(input);
  const effectiveDocumentBudget = calculateEffectiveDocumentBudget(
    budget.documentBudgetCharacters,
    input.config.maxTotalInputChars,
    detectedApiNames.length,
    capabilities.length,
    platforms.length,
    input.task.type
  );
  const formatted = formatRecords(deduplicated, effectiveDocumentBudget);
  const matchedSymbols = new Set(deduplicated.map((record) => record.symbolId).filter(Boolean));
  const matchedChunks = new Set(deduplicated.map((record) => record.chunkId).filter(Boolean));
  const includedApiNames = unique(deduplicated
    .filter((record) => record.direct && record.apiName)
    .map((record) => record.apiName as string));
  const text = `${CONTEXT_INTRO}\n\n${formatted.text || "未检索到可注入的相关文档摘录；不得因此推断平台不支持相关能力。"}`;
  const metadata: ApiDocumentRetrievalMetadata = {
    taskId: input.task.id,
    taskType: input.task.type,
    sourcePlatform: input.task.sourcePlatform,
    targetPlatform: input.task.targetPlatform,
    detectedApiNames,
    matchedSymbolCount: matchedSymbols.size,
    matchedChunkCount: matchedChunks.size,
    normalizedFallbackCount,
    includedApiNames,
    documentContextCharacterCount: text.length,
    estimatedDocumentTokens: Math.ceil(text.length / 4),
    documentCompressionApplied: formatted.compressed,
    retrievalDurationMs: Math.round((performance.now() - startedAt) * 10) / 10,
    documentBudgetCharacters: effectiveDocumentBudget,
    outputTokenReserve: budget.outputTokenReserve
  };

  logRetrieval(metadata);
  return { text, metadata };
}

export function calculateDocumentBudget(input: ApiDocumentRetrievalInput) {
  const skillCharacters = stableStringify(input.skill).length;
  const taskCharacters = [
    input.task.sourcePlatform,
    input.task.targetPlatform,
    input.task.prompt,
    input.task.inputCode,
    input.conversationContext
  ].reduce((total, value) => total + (value?.length ?? 0), 0);
  const outputTokenReserve = Math.min(input.config.maxOutputTokens, Math.max(1, input.modelMaxOutputTokens));
  const outputCharacterReserve = outputTokenReserve * 4;
  const modelEnvelopeCharacters = input.config.maxTotalInputChars + outputCharacterReserve;
  const fixedPromptReserve = 6000;
  const safetyReserve = Math.ceil(input.config.maxTotalInputChars * 0.08);
  const documentBudgetCharacters = Math.max(
    0,
    modelEnvelopeCharacters - outputCharacterReserve - skillCharacters - taskCharacters - fixedPromptReserve - safetyReserve
  );

  return {
    documentBudgetCharacters,
    outputTokenReserve,
    skillCharacters,
    taskCharacters,
    safetyReserve
  };
}

function calculateEffectiveDocumentBudget(
  remainingBudget: number,
  maxInputCharacters: number,
  detectedApiCount: number,
  capabilityCount: number,
  platformCount: number,
  taskType: AiTask["type"]
) {
  const taskFactor = taskType === "code_analysis" ? 0.08 : 0.1;
  const apiFactor = Math.min(0.18, detectedApiCount * 0.012);
  const capabilityFactor = Math.min(0.05, capabilityCount * 0.006);
  const platformFactor = Math.min(0.05, Math.max(0, platformCount - 1) * 0.05);
  const complexityBudget = Math.floor(maxInputCharacters * (taskFactor + apiFactor + capabilityFactor + platformFactor));
  return Math.max(0, Math.min(remainingBudget, complexityBudget));
}

async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  if (!globalCache[GLOBAL_CACHE_KEY]) {
    globalCache[GLOBAL_CACHE_KEY] = readKnowledgeBase().catch((error) => {
      delete globalCache[GLOBAL_CACHE_KEY];
      throw error;
    });
  }

  return globalCache[GLOBAL_CACHE_KEY];
}

async function readKnowledgeBase(): Promise<KnowledgeBase> {
  const root = getProjectRoot();
  const indexDirectory = path.join(root, "api-docs", "index");

  try {
    await Promise.all(INDEX_FILES.map((file) => fs.access(path.join(indexDirectory, file))));
    const [documents, symbols, chunks, aliases, conflicts, resolution] = await Promise.all([
      readJsonl<DocumentRecord>(path.join(indexDirectory, "documents.jsonl")),
      readJsonl<SymbolRecord>(path.join(indexDirectory, "symbols.jsonl")),
      readJsonl<ChunkRecord>(path.join(indexDirectory, "chunks.jsonl")),
      readJsonl<AliasRecord>(path.join(indexDirectory, "aliases.jsonl")),
      readJsonl<ConflictRecord>(path.join(indexDirectory, "conflicts.jsonl")),
      readJson<PlatformResolution>(path.join(indexDirectory, "platform-resolution.json"))
    ]);

    if (documents.length === 0 || symbols.length === 0 || chunks.length === 0) {
      throw new Error("required API document indexes are empty");
    }
    if (resolution.cross_platform_aliases_allowed !== false) {
      throw new Error("cross-platform aliases must remain disabled");
    }

    const documentById = new Map(documents.map((record) => [record.id, record]));
    const symbolById = new Map(symbols.map((record) => [record.id, record]));
    const chunksBySymbolId = new Map<string, ChunkRecord[]>();
    const aliasesByPlatform = new Map<Platform, Map<string, AliasRecord[]>>();

    for (const symbol of symbols) {
      if (!documentById.has(symbol.document_id)) {
        throw new Error(`symbol ${symbol.id} references a missing document`);
      }
    }
    for (const chunk of chunks) {
      if (!documentById.has(chunk.document_id)) {
        throw new Error(`chunk ${chunk.id} references a missing document`);
      }
      for (const symbolId of chunk.symbol_ids) {
        if (!symbolById.has(symbolId)) {
          throw new Error(`chunk ${chunk.id} references a missing symbol`);
        }
        const current = chunksBySymbolId.get(symbolId) ?? [];
        current.push(chunk);
        chunksBySymbolId.set(symbolId, current);
      }
    }
    for (const alias of aliases) {
      if (!alias.alias || !alias.target_id || !alias.target_type) {
        continue;
      }
      if (alias.target_type === "symbol" && !symbolById.has(alias.target_id)) {
        throw new Error(`alias ${alias.id} references a missing symbol`);
      }
      const platformAliases = aliasesByPlatform.get(alias.platform) ?? new Map<string, AliasRecord[]>();
      const key = normalizeSearchTerm(alias.alias);
      platformAliases.set(key, [...(platformAliases.get(key) ?? []), alias]);
      aliasesByPlatform.set(alias.platform, platformAliases);
    }

    return {
      documents,
      symbols,
      chunks,
      aliases,
      conflicts,
      resolution,
      documentById,
      symbolById,
      chunksBySymbolId,
      aliasesByPlatform,
      normalizedMarkdownByFile: new Map()
    };
  } catch (error) {
    throw new ApiDocumentKnowledgeBaseError("本地 API 文档知识库缺失或损坏", { cause: error });
  }
}

function resolveTaskPlatforms(task: AiTask, taskText: string, kb: KnowledgeBase) {
  const selections: PlatformSelection[] = [];
  const explicitSource = normalizePlatform(task.sourcePlatform);
  const explicitTarget = normalizePlatform(task.targetPlatform);

  if (task.type === "code_conversion") {
    if (explicitSource) selections.push(buildPlatformSelection(explicitSource, taskText));
    if (explicitTarget) selections.push(buildPlatformSelection(explicitTarget, taskText));
  } else if (task.type === "strategy_generation") {
    const platform = explicitTarget ?? explicitSource ?? detectPlatformFromText(taskText, kb);
    if (platform) selections.push(buildPlatformSelection(platform, taskText));
  } else {
    const platform = explicitSource ?? explicitTarget ?? detectPlatformFromText(taskText, kb);
    if (platform) selections.push(buildPlatformSelection(platform, taskText));
  }

  if (selections.length === 0) {
    selections.push(buildPlatformSelection("ptrade", taskText));
  }

  return deduplicatePlatformSelections(selections);
}

type PlatformSelection = {
  platform: Platform;
  variants: string[];
  ptradeVariantExplicit: boolean;
  qmtModeUnavailable: boolean;
};

function buildPlatformSelection(platform: Platform, text: string): PlatformSelection {
  const normalized = text.toLowerCase();
  if (platform === "ptrade") {
    if (normalized.includes("申万") || normalized.includes("shenwan")) {
      return { platform, variants: ["shenwan"], ptradeVariantExplicit: true, qmtModeUnavailable: false };
    }
    if (normalized.includes("国金") || normalized.includes("guojin")) {
      return { platform, variants: ["guojin"], ptradeVariantExplicit: true, qmtModeUnavailable: false };
    }
    return { platform, variants: ["guojin", "shenwan"], ptradeVariantExplicit: false, qmtModeUnavailable: false };
  }
  if (platform === "qmt") {
    const explicitUnavailableMode = /\b(?:xtquant|miniqmt|vba)\b/i.test(text);
    return {
      platform,
      variants: explicitUnavailableMode ? [] : ["builtin-python"],
      ptradeVariantExplicit: false,
      qmtModeUnavailable: explicitUnavailableMode
    };
  }
  return { platform, variants: ["web-help"], ptradeVariantExplicit: false, qmtModeUnavailable: false };
}

function detectApiNames(task: AiTask, conversationContext: string | undefined, selections: PlatformSelection[], kb: KnowledgeBase) {
  const codeAndPrompt = [task.prompt, task.inputCode, conversationContext].filter(Boolean).join("\n");
  const code = task.inputCode ?? "";
  const localNames = new Set(findLocalDefinitions(code));
  const callCandidates = findCallCandidates(codeAndPrompt)
    .filter((name) => !BUILTIN_NAMES.has(name.toLowerCase()) && !localNames.has(name));
  const promptCandidates = findMentionedIndexedNames([task.prompt, conversationContext].filter(Boolean).join("\n"), selections, kb);
  const callbackCandidates = findLocalDefinitions(code).filter((name) => selections.some((selection) => findSymbols(kb, selection, name).length > 0));
  return unique([...callCandidates, ...promptCandidates, ...callbackCandidates]).sort((a, b) => a.localeCompare(b, "en"));
}

function findCallCandidates(text: string) {
  const names: string[] = [];
  const matcher = /(?<!\bdef\s)(?<!\bclass\s)\b([A-Za-z_][A-Za-z0-9_.]*)\s*\(/g;
  for (const match of text.matchAll(matcher)) {
    const qualified = match[1];
    if (!qualified) continue;
    names.push(qualified);
    const shortName = qualified.split(".").at(-1);
    if (shortName && shortName !== qualified) names.push(shortName);
  }
  return names;
}

function findLocalDefinitions(text: string) {
  const names: string[] = [];
  for (const match of text.matchAll(/^\s*(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm)) {
    if (match[1]) names.push(match[1]);
  }
  for (const match of text.matchAll(/^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\b/gm)) {
    if (match[1]) names.push(match[1]);
  }
  return names;
}

function findMentionedIndexedNames(text: string, selections: PlatformSelection[], kb: KnowledgeBase) {
  const result: string[] = [];
  const lowerText = text.toLowerCase();
  for (const selection of selections) {
    for (const symbol of kb.symbols) {
      if (!matchesSelection(symbol, selection)) continue;
      for (const candidate of [symbol.canonical_name, symbol.qualified_name, ...symbol.aliases]) {
        if (candidate.length < 3) continue;
        const normalized = candidate.toLowerCase();
        const pattern = /^[a-z_][a-z0-9_.]*$/.test(normalized)
          ? new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(candidate)}([^A-Za-z0-9_]|$)`)
          : null;
        if ((pattern && pattern.test(text)) || (!pattern && lowerText.includes(normalized))) {
          result.push(candidate);
        }
      }
    }
  }
  return result;
}

function findSymbols(kb: KnowledgeBase, selection: PlatformSelection, name: string) {
  if (selection.qmtModeUnavailable) return [];
  let matches = kb.symbols.filter((symbol) => matchesSelection(symbol, selection) && (
    symbol.canonical_name === name || symbol.qualified_name === name
  ));

  if (matches.length === 0) {
    const normalizedName = normalizeSearchTerm(name);
    const aliasTargets = kb.aliasesByPlatform.get(selection.platform)?.get(normalizedName) ?? [];
    matches = aliasTargets
      .map((alias) => alias.target_id ? kb.symbolById.get(alias.target_id) : undefined)
      .filter((symbol): symbol is SymbolRecord => Boolean(symbol && matchesSelection(symbol, selection)));
  }

  return resolvePlatformDuplicates(matches, selection);
}

function resolvePlatformDuplicates(symbols: SymbolRecord[], selection: PlatformSelection) {
  const sorted = [...symbols].sort(compareAuthority);
  if (selection.platform !== "ptrade" || selection.ptradeVariantExplicit || !sorted.some((symbol) => symbol.variant === "guojin")) {
    return uniqueBy(sorted, (symbol) => symbol.id);
  }
  return uniqueBy(sorted.filter((symbol) => symbol.variant === "guojin"), (symbol) => symbol.id);
}

function findRelevantChunks(kb: KnowledgeBase, selection: PlatformSelection, terms: string[], direct: boolean) {
  if (selection.qmtModeUnavailable) return [];
  const scored = kb.chunks
    .filter((chunk) => matchesSelection(chunk, selection))
    .map((chunk) => ({ chunk, score: scoreText([chunk.title, ...chunk.heading_path, chunk.content].join("\n"), terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || compareAuthority(a.chunk, b.chunk));
  const preferred = selection.platform === "ptrade" && !selection.ptradeVariantExplicit && scored.some((item) => item.chunk.variant === "guojin")
    ? scored.filter((item) => item.chunk.variant === "guojin")
    : scored;
  if (direct) {
    const highestScore = preferred[0]?.score ?? 0;
    return preferred.filter((item) => item.score === highestScore).map((item) => item.chunk);
  }
  return preferred.map((item) => item.chunk);
}

function findCapabilityRecord(kb: KnowledgeBase, selection: PlatformSelection, capability: Capability) {
  if (selection.qmtModeUnavailable) return null;
  const terms = CAPABILITY_TERMS[capability];
  const symbolCandidates = kb.symbols
    .filter((symbol) => matchesSelection(symbol, selection))
    .map((symbol) => ({
      symbol,
      score: scoreText([symbol.canonical_name, symbol.display_name, ...symbol.category_path, symbol.summary ?? ""].join("\n"), terms)
        + authorityScore(symbol)
    }))
    .filter((item) => item.score > authorityScore(item.symbol))
    .sort((a, b) => b.score - a.score || compareAuthority(a.symbol, b.symbol));
  const selectedSymbol = selectPreferredPTradeCandidate(symbolCandidates.map((item) => item.symbol), selection)[0];
  if (selectedSymbol) {
    return recordFromSymbol(selectedSymbol, kb, false, capability, 400 + (symbolCandidates[0]?.score ?? 0));
  }

  const chunk = findRelevantChunks(kb, selection, terms, false)[0];
  return chunk ? recordFromChunk(chunk, false, capability, 300) : null;
}

function selectPreferredPTradeCandidate<T extends { variant: string }>(records: T[], selection: PlatformSelection) {
  if (selection.platform !== "ptrade" || selection.ptradeVariantExplicit) return records;
  const guojin = records.filter((record) => record.variant === "guojin");
  return guojin.length > 0 ? guojin : records.filter((record) => record.variant === "shenwan");
}

async function searchNormalizedMarkdown(kb: KnowledgeBase, selection: PlatformSelection, term: string) {
  if (selection.qmtModeUnavailable) return [];
  const root = getProjectRoot();
  const normalizedRoot = path.join(root, "api-docs", "normalized");
  const records: RetrievalRecord[] = [];
  const documents = selectPreferredPTradeCandidate(
    kb.documents.filter((document) => matchesSelection(document, selection)),
    selection
  );

  for (const document of documents) {
    const absolutePath = path.resolve(root, document.markdown_file);
    if (!isPathWithin(absolutePath, normalizedRoot)) {
      throw new ApiDocumentKnowledgeBaseError("知识库文档路径超出 normalized 目录");
    }
    const markdown = await readNormalizedMarkdown(kb, absolutePath);
    const section = extractMarkdownSection(markdown, term);
    if (!section) continue;
    records.push({
      key: `normalized:${document.id}:${normalizeSearchTerm(term)}`,
      platform: document.platform,
      variant: document.variant,
      documentType: document.document_type,
      title: section.title || document.title,
      apiName: term,
      signature: null,
      parameters: "见正文摘录",
      returns: "见正文摘录",
      summary: "symbols/chunks 未精确命中，已回退到 normalized Markdown 相关章节。",
      source: formatSource(document.source_url, document.source_anchor, document.markdown_file),
      detail: section.content,
      direct: true,
      capability: null,
      symbolId: null,
      chunkId: null,
      score: 700
    });
  }
  return records;
}

function recordFromSymbol(symbol: SymbolRecord, kb: KnowledgeBase, direct: boolean, capability: Capability | null, score: number): RetrievalRecord {
  const document = kb.documentById.get(symbol.document_id);
  const chunk = (kb.chunksBySymbolId.get(symbol.id) ?? []).sort((a, b) => b.content.length - a.content.length)[0];
  return {
    key: `symbol:${symbol.id}`,
    platform: symbol.platform,
    variant: symbol.variant,
    documentType: document?.document_type ?? symbol.record_type,
    title: symbol.display_name,
    apiName: symbol.canonical_name,
    signature: symbol.signature,
    parameters: formatParameters(symbol.parameters),
    returns: formatReturns(symbol.returns),
    summary: formatSymbolSummary(symbol, direct),
    source: formatSource(symbol.source_url, symbol.source_anchor, symbol.markdown_file),
    detail: chunk?.content ?? symbol.evidence_excerpt,
    direct,
    capability,
    symbolId: symbol.id,
    chunkId: chunk?.id ?? null,
    score: score + authorityScore(symbol)
  };
}

function recordFromChunk(chunk: ChunkRecord, direct: boolean, capability: Capability | null, score: number, queriedApiName: string | null = null): RetrievalRecord {
  return {
    key: `chunk:${chunk.id}`,
    platform: chunk.platform,
    variant: chunk.variant,
    documentType: chunk.document_type,
    title: chunk.title,
    apiName: direct ? queriedApiName ?? extractLikelyApiName(chunk.title) : null,
    signature: null,
    parameters: "见正文摘录",
    returns: "见正文摘录",
    summary: normalizeWhitespace(chunk.content.replace(/```[\s\S]*?```/g, " ")).slice(0, 600),
    source: formatSource(chunk.source_url, chunk.source_anchor, chunk.markdown_file),
    detail: chunk.content,
    direct,
    capability,
    symbolId: null,
    chunkId: chunk.id,
    score: score + authorityScore(chunk)
  };
}

function formatRecords(records: RetrievalRecord[], budget: number) {
  const sorted = [...records].sort((a, b) => Number(b.direct) - Number(a.direct) || b.score - a.score || a.key.localeCompare(b.key));
  const minimumBlocks = sorted.map(formatMinimumRecord);
  const directMinimumLength = sorted.reduce((total, record, index) => total + (record.direct ? minimumBlocks[index].length + 2 : 0), 0);
  const sections = new Map<string, string[]>();
  let remaining = Math.max(0, budget - CONTEXT_INTRO.length - directMinimumLength);
  let compressed = directMinimumLength + CONTEXT_INTRO.length > budget;

  for (let index = 0; index < sorted.length; index += 1) {
    const record = sorted[index];
    let block = minimumBlocks[index];
    if (!record.direct) {
      if (block.length + 2 > remaining) {
        compressed = true;
        continue;
      }
      remaining -= block.length + 2;
    }
    if (record.detail) {
      const detail = `\n正文摘录：\n${record.detail.trim()}`;
      if (detail.length <= remaining) {
        block += detail;
        remaining -= detail.length;
      } else {
        compressed = true;
      }
    }
    const category = record.capability ? capabilityLabel(record.capability) : record.direct ? "直接涉及的API" : "相关章节";
    sections.set(category, [...(sections.get(category) ?? []), block]);
  }

  return {
    text: [...sections.entries()].map(([title, blocks]) => `### ${title}\n\n${blocks.join("\n\n")}`).join("\n\n"),
    compressed
  };
}

function formatMinimumRecord(record: RetrievalRecord) {
  return [
    `平台：${platformLabel(record.platform)}`,
    `版本：${record.variant}`,
    `文档类型：${record.documentType}`,
    `API或章节：${record.title}`,
    `签名：${record.signature ?? "未在索引中记录"}`,
    `关键参数：${record.parameters}`,
    `返回值：${record.returns}`,
    `关键说明：${record.summary || "见来源章节"}`,
    `来源：${record.source}`
  ].join("\n");
}

function detectCapabilities(task: AiTask, text: string): Capability[] {
  const capabilities = new Set<Capability>(BASE_CAPABILITIES);
  for (const capability of ["finance", "risk"] as const) {
    if (scoreText(text, CAPABILITY_TERMS[capability]) > 0) capabilities.add(capability);
  }
  if (task.type === "code_analysis") {
    const necessary = [...capabilities].filter((capability) => scoreText(text, CAPABILITY_TERMS[capability]) > 0);
    return necessary.length > 0 ? necessary : ["lifecycle", "data"];
  }
  return [...capabilities];
}

function detectPlatformFromText(text: string, kb: KnowledgeBase): Platform | null {
  const direct = normalizePlatform(text);
  if (direct) return direct;
  const counts = new Map<Platform, number>([["ptrade", 0], ["qmt", 0], ["joinquant", 0]]);
  const candidates = findCallCandidates(text);
  for (const symbol of kb.symbols) {
    if (candidates.some((candidate) => normalizeSearchTerm(candidate) === normalizeSearchTerm(symbol.canonical_name))) {
      counts.set(symbol.platform, (counts.get(symbol.platform) ?? 0) + symbol.resolution_priority);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[1] ? [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
}

function normalizePlatform(value: string | null | undefined): Platform | null {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("ptrade") || normalized.includes("p-trade")) return "ptrade";
  if (normalized.includes("joinquant") || normalized.includes("聚宽") || /\bjq\b/.test(normalized)) return "joinquant";
  if (normalized.includes("qmt") || normalized.includes("xtquant") || normalized.includes("迅投")) return "qmt";
  return null;
}

function matchesSelection(record: { platform: Platform; variant: string }, selection: PlatformSelection) {
  return record.platform === selection.platform && selection.variants.includes(record.variant);
}

function deduplicatePlatformSelections(selections: PlatformSelection[]) {
  return uniqueBy(selections, (selection) => `${selection.platform}:${selection.variants.join(",")}`);
}

function deduplicateRecords(records: RetrievalRecord[]) {
  const seenSymbols = new Set<string>();
  const seenChunks = new Set<string>();
  const seenFacts = new Set<string>();
  const result: RetrievalRecord[] = [];
  for (const record of [...records].sort((a, b) => Number(b.direct) - Number(a.direct) || b.score - a.score || a.key.localeCompare(b.key))) {
    if (record.symbolId && seenSymbols.has(record.symbolId)) continue;
    if (record.chunkId && seenChunks.has(record.chunkId) && !record.symbolId) continue;
    const factKey = [record.platform, record.variant, record.documentType, normalizeSearchTerm(record.title), record.signature ?? ""].join(":");
    if (seenFacts.has(factKey)) continue;
    if (record.symbolId) seenSymbols.add(record.symbolId);
    if (record.chunkId) seenChunks.add(record.chunkId);
    seenFacts.add(factKey);
    result.push(record);
  }
  return result;
}

function inferCapability(record: Pick<SymbolRecord, "canonical_name" | "display_name" | "category_path" | "summary"> | Pick<ChunkRecord, "title" | "heading_path" | "content">): Capability | null {
  const text = "canonical_name" in record
    ? [record.canonical_name, record.display_name, ...record.category_path, record.summary ?? ""].join("\n")
    : [record.title, ...record.heading_path, record.content].join("\n");
  return (Object.entries(CAPABILITY_TERMS) as Array<[Capability, string[]]>)
    .map(([capability, terms]) => ({ capability, score: scoreText(text, terms) }))
    .sort((a, b) => b.score - a.score)[0]?.score ? (Object.entries(CAPABILITY_TERMS) as Array<[Capability, string[]]>)
      .map(([capability, terms]) => ({ capability, score: scoreText(text, terms) }))
      .sort((a, b) => b.score - a.score)[0].capability : null;
}

function scoreText(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.reduce((score, term) => {
    const needle = term.toLowerCase();
    if (!normalized.includes(needle)) return score;
    const occurrences = normalized.split(needle).length - 1;
    return score + Math.min(occurrences, 5) * (needle.includes("_") ? 8 : 3);
  }, 0);
}

function authorityScore(record: { source_role: string; resolution_priority: number; variant: string }) {
  return record.resolution_priority + (record.source_role === "primary" ? 30 : 0) + (record.variant === "guojin" ? 10 : 0);
}

function compareAuthority(a: { source_role: string; resolution_priority: number; variant: string }, b: { source_role: string; resolution_priority: number; variant: string }) {
  return authorityScore(b) - authorityScore(a);
}

function formatParameters(parameters: SymbolParameter[]) {
  if (parameters.length === 0) return "无明确参数记录";
  return parameters.map((parameter) => {
    const attributes = [parameter.type, parameter.default !== null ? `默认=${parameter.default}` : null, parameter.required === true ? "必填" : null].filter(Boolean);
    return attributes.length > 0 ? `${parameter.name} (${attributes.join(", ")})` : parameter.name;
  }).join("；");
}

function formatReturns(returns: SymbolReturn[]) {
  const values = returns.map((item) => [item.type, item.description].filter(Boolean).join("：")).filter(Boolean);
  return values.length > 0 ? compactFact(values.join("；"), 500) : "索引未提取到明确返回值摘要";
}

function formatSymbolSummary(symbol: SymbolRecord, direct: boolean) {
  const notes = [symbol.summary, symbol.availability_notes, ...symbol.version_notes].filter(Boolean).map((value) => normalizeWhitespace(String(value)));
  return compactFact(notes.join("；") || symbol.evidence_excerpt, direct ? 700 : 360);
}

async function readNormalizedMarkdown(kb: KnowledgeBase, absolutePath: string) {
  let pending = kb.normalizedMarkdownByFile.get(absolutePath);
  if (!pending) {
    pending = fs.readFile(absolutePath, "utf8");
    kb.normalizedMarkdownByFile.set(absolutePath, pending);
  }
  return pending;
}

function compactFact(value: string, limit: number) {
  if (value.length <= limit) return value;
  const candidate = value.slice(0, limit);
  const boundary = Math.max(candidate.lastIndexOf("。"), candidate.lastIndexOf("；"), candidate.lastIndexOf(";"), candidate.lastIndexOf(". "));
  return `${candidate.slice(0, boundary >= Math.floor(limit * 0.55) ? boundary + 1 : limit).trim()}…`;
}

function extractLikelyApiName(title: string) {
  return /^([A-Za-z_][A-Za-z0-9_.]*)\b/.exec(title)?.[1] ?? null;
}

function formatSource(sourceUrl: string | null, sourceAnchor: string | null, markdownFile: string) {
  const publicUrl = sourceUrl && !sourceUrl.startsWith("file:") ? sourceUrl : null;
  return [publicUrl, sourceAnchor, markdownFile].filter(Boolean).join(" | ");
}

function extractMarkdownSection(markdown: string, term: string) {
  const lines = markdown.split(/\r?\n/);
  const normalizedTerm = normalizeSearchTerm(term);
  const index = lines.findIndex((line) => normalizeSearchTerm(line).includes(normalizedTerm));
  if (index < 0) return null;
  let start = index;
  while (start > 0 && !/^#{1,6}\s+/.test(lines[start])) start -= 1;
  if (!/^#{1,6}\s+/.test(lines[start])) start = Math.max(0, index - 8);
  const level = /^((?:#{1,6}))\s+/.exec(lines[start])?.[1]?.length ?? 7;
  let end = lines.length;
  for (let cursor = start + 1; cursor < lines.length; cursor += 1) {
    const headingLevel = /^(#{1,6})\s+/.exec(lines[cursor])?.[1]?.length;
    if (headingLevel && headingLevel <= level) {
      end = cursor;
      break;
    }
  }
  const content = lines.slice(start, end).join("\n").trim();
  return content ? { title: lines[start].replace(/^#{1,6}\s+/, "").trim(), content } : null;
}

function getProjectRoot() {
  return path.resolve(process.cwd());
}

function isPathWithin(candidate: string, parent: string) {
  const relative = path.relative(parent, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  const content = await fs.readFile(filePath, "utf8");
  return content.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line) as T;
    } catch (error) {
      throw new Error(`invalid JSONL at ${path.basename(filePath)}:${index + 1}`, { cause: error });
    }
  });
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function logRetrieval(metadata: ApiDocumentRetrievalMetadata) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[api-document-retrieval]", JSON.stringify({
    task_id: metadata.taskId,
    task_type: metadata.taskType,
    source_platform: metadata.sourcePlatform,
    target_platform: metadata.targetPlatform,
    detected_api_names: metadata.detectedApiNames,
    matched_symbol_count: metadata.matchedSymbolCount,
    matched_chunk_count: metadata.matchedChunkCount,
    normalized_fallback_count: metadata.normalizedFallbackCount,
    included_api_names: metadata.includedApiNames,
    document_context_character_count: metadata.documentContextCharacterCount,
    estimated_document_tokens: metadata.estimatedDocumentTokens,
    document_compression_applied: metadata.documentCompressionApplied,
    retrieval_duration_ms: metadata.retrievalDurationMs
  }));
}

function platformLabel(platform: Platform) {
  if (platform === "joinquant") return "JoinQuant";
  if (platform === "qmt") return "QMT";
  return "PTrade";
}

function capabilityLabel(capability: Capability) {
  return ({
    lifecycle: "生命周期",
    data: "行情与数据",
    scheduling: "调度",
    order: "下单与交易",
    account: "账户与持仓",
    finance: "财务与因子",
    risk: "风控"
  } satisfies Record<Capability, string>)[capability];
}

function normalizeSearchTerm(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\\_/g, "_").replace(/\s+/g, " ").trim();
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function uniqueBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const candidate = key(value);
    if (seen.has(candidate)) return false;
    seen.add(candidate);
    return true;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "";
}
