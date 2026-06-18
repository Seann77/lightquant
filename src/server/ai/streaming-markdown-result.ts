import type { AiTask, AiTaskScopeStatus } from "@/server/domain";
import type { AiProviderInput, AiProviderResult } from "@/server/ai/providers/types";

type MarkdownSectionKey = "summary" | "code" | "notes" | "risks" | "overview" | "tradingLogic" | "parameters" | "suggestions";

type ReportItem = {
  title: string;
  value: string;
  lines?: string[];
  evidence?: string;
};

type CodeAnalysisReport = {
  overview: ReportItem[];
  tradingLogic: ReportItem[];
  keyParameters: ReportItem[];
  risks: ReportItem[];
  suggestions: ReportItem[];
};

type MarkdownSection = {
  key: MarkdownSectionKey;
  title: string;
  content: string;
};

type MarkdownContract = {
  keys: MarkdownSectionKey[];
  titles: Partial<Record<MarkdownSectionKey, string>>;
};

const STRATEGY_CONTRACT: MarkdownContract = {
  keys: ["summary", "code"],
  titles: {
    summary: "结论摘要",
    code: "策略代码"
  }
};

const CONVERSION_CONTRACT: MarkdownContract = {
  keys: ["code", "notes"],
  titles: {
    code: "目标平台代码",
    notes: "迁移说明"
  }
};

const ANALYSIS_CONTRACT: MarkdownContract = {
  keys: ["overview", "tradingLogic", "parameters", "risks", "suggestions"],
  titles: {
    overview: "策略概览",
    tradingLogic: "交易逻辑",
    parameters: "关键参数",
    risks: "风险提醒",
    suggestions: "优化建议"
  }
};

const SECTION_ALIASES: Array<{ key: MarkdownSectionKey; pattern: RegExp }> = [
  { key: "overview", pattern: /策略概览|平台识别|策略类型|运行流程|初始化流程|盘前流程|盘中流程|收盘后流程|概览|概述|解析报告|分析报告|代码解读|代码解析/i },
  { key: "tradingLogic", pattern: /交易逻辑|交易范围|过滤条件|排序因子|信号生成|买入|卖出|调仓|止盈|止损|下单/i },
  { key: "parameters", pattern: /关键参数|参数|持仓|单票金额|投入上限|现金处理|滑点|交易费用|佣金|阈值|时间点|周期/i },
  { key: "suggestions", pattern: /优化建议|工程建议|可读性|显式化|回测验证|平台兼容|异常处理|日志/i },
  { key: "summary", pattern: /结论|摘要|范围提示/i },
  { key: "code", pattern: /代码块|目标平台代码|策略代码|生成代码/i },
  { key: "notes", pattern: /迁移说明|解析说明|说明|兼容|复核/i },
  { key: "risks", pattern: /风险提醒|风险|注意事项|提醒/i }
];

const REPORT_MISSING_VALUE = "代码中未明确给出";

const CODE_ANALYSIS_REPORT_TITLES = {
  overview: ["策略名称", "平台识别", "策略类型", "交易范围", "核心思路", "运行频率", "无信号处理"],
  tradingLogic: ["初始化", "盘前/记录", "调仓时间", "数据读取", "信号生成", "目标标的形成", "买入逻辑", "卖出逻辑", "下单限制"],
  keyParameters: ["观察周期", "目标持仓数", "持仓权重", "最小交易金额", "止损线", "滑点", "交易费用", "最低佣金", "现金处理", "其他关键阈值"],
  risks: ["主题集中风险", "单标的集中风险", "无信号处理风险", "交易可达性风险", "流动性风险", "参数敏感性", "回测与实盘差异"],
  suggestions: ["信号计算可解释性", "止损独立运行", "交易可达性检查", "单票集中度控制", "日志可读性", "参数显式化", "回测验证"]
} as const;

export function parseStreamingMarkdownResult(input: AiProviderInput, markdown: string): AiProviderResult {
  const rawMarkdown = markdown.trim();
  const finalAnswerMarkdown = normalizeMarkdown(markdown, input.task);
  const sections = splitMarkdownSections(finalAnswerMarkdown);
  const summary = getSectionContent(sections, "summary") || stripMarkdownNoise(finalAnswerMarkdown);
  const scopeStatus = inferScopeStatus(summary, `${rawMarkdown}\n${finalAnswerMarkdown}`);

  if (input.task.type === "strategy_generation") {
    const codeSection = getSectionContent(sections, "code");
    const generatedCode = extractGeneratedCode(codeSection || finalAnswerMarkdown);
    const explanation = truncateResultText(summary, input.config.maxResultChars);

    return buildProviderResult(input, scopeStatus, finalAnswerMarkdown, sections, {
      explanation: scopeStatus === "out_of_scope" ? input.skill.outOfScopeResponse : explanation,
      generatedCode: scopeStatus === "out_of_scope" ? null : generatedCode,
      migrationNotes: null,
      riskWarnings: []
    });
  }

  if (input.task.type === "code_analysis") {
    const analysisReport = buildCodeAnalysisReport(sections);
    const riskWarnings = getReportValues(analysisReport.risks).slice(0, 12);
    const explanation = truncateResultText(formatReportItemsForText(analysisReport.overview), input.config.maxResultChars);

    return buildProviderResult(input, scopeStatus, finalAnswerMarkdown, sections, {
      explanation: scopeStatus === "out_of_scope" ? input.skill.outOfScopeResponse : explanation,
      generatedCode: null,
      migrationNotes: null,
      riskWarnings: scopeStatus === "out_of_scope" ? [] : riskWarnings,
      analysisReport
    });
  }

  const codeSection = getSectionContent(sections, "code");
  const notes = getSectionContent(sections, "notes");
  const generatedCode = extractGeneratedCode(codeSection || finalAnswerMarkdown);
  const migrationNotes = truncateResultText(notes || null, input.config.maxResultChars);
  const explanation = truncateResultText(stripMarkdownNoise(removeCodeFences(codeSection || summary)), input.config.maxResultChars);

  return buildProviderResult(input, scopeStatus, finalAnswerMarkdown, sections, {
    explanation: scopeStatus === "out_of_scope" ? input.skill.outOfScopeResponse : explanation,
    generatedCode: scopeStatus === "out_of_scope" ? null : generatedCode,
    migrationNotes: scopeStatus === "out_of_scope" ? null : migrationNotes,
    riskWarnings: []
  });
}

export function normalizeMarkdown(markdown: string, task: Pick<AiTask, "type">) {
  const trimmed = markdown.trim();

  if (!trimmed) {
    return buildEmptyMarkdown(task);
  }

  const sections = splitMarkdownSections(trimmed);

  if (task.type === "strategy_generation") {
    return buildNormalizedMarkdown(trimmed, sections, STRATEGY_CONTRACT, task);
  }

  if (task.type === "code_analysis") {
    return buildNormalizedMarkdown(trimmed, sections, ANALYSIS_CONTRACT, task);
  }

  return buildNormalizedMarkdown(trimmed, sections, CONVERSION_CONTRACT, task);
}

export function formatProviderResultAsMarkdown(
  result: Pick<AiProviderResult, "explanation" | "generatedCode" | "migrationNotes" | "riskWarnings" | "reportJson">,
  task: Pick<AiTask, "type">
) {
  if (task.type === "strategy_generation") {
    return [
      `## ${STRATEGY_CONTRACT.titles.summary}`,
      result.explanation?.trim() || "已完成策略处理。",
      "",
      `## ${STRATEGY_CONTRACT.titles.code}`,
      result.generatedCode?.trim()
        ? `\`\`\`python\n${result.generatedCode.trim()}\n\`\`\``
        : "暂无可直接运行的策略代码。"
    ].join("\n");
  }

  if (task.type === "code_analysis") {
    const report = normalizeCodeAnalysisReportFromUnknown(result.reportJson, {
      explanation: result.explanation,
      riskWarnings: result.riskWarnings
    });

    return [
      `## ${ANALYSIS_CONTRACT.titles.overview}`,
      formatReportItemsAsMarkdown(report.overview),
      "",
      `## ${ANALYSIS_CONTRACT.titles.tradingLogic}`,
      formatReportItemsAsMarkdown(report.tradingLogic),
      "",
      `## ${ANALYSIS_CONTRACT.titles.parameters}`,
      formatReportItemsAsMarkdown(report.keyParameters),
      "",
      `## ${ANALYSIS_CONTRACT.titles.risks}`,
      formatReportItemsAsMarkdown(report.risks),
      "",
      `## ${ANALYSIS_CONTRACT.titles.suggestions}`,
      formatReportItemsAsMarkdown(report.suggestions)
    ].join("\n");
  }

  return [
    `## ${CONVERSION_CONTRACT.titles.code}`,
    result.generatedCode?.trim()
      ? `\`\`\`python\n${result.generatedCode.trim()}\n\`\`\``
      : "暂无可直接运行的目标平台代码。",
    "",
    `## ${CONVERSION_CONTRACT.titles.notes}`,
    result.migrationNotes?.trim() || "请按目标平台 API 逐项复核后再运行。"
  ].join("\n");
}

export function truncateStreamingText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n\n[内容已截断]`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildProviderResult(
  input: AiProviderInput,
  scopeStatus: AiTaskScopeStatus,
  finalAnswerMarkdown: string,
  sections: MarkdownSection[],
  parsed: {
    explanation: string | null;
    generatedCode: string | null;
    migrationNotes: string | null;
    riskWarnings: string[];
    analysisReport?: CodeAnalysisReport;
  }
): AiProviderResult {
  return {
    scopeStatus,
    generatedCode: parsed.generatedCode,
    explanation: parsed.explanation,
    migrationNotes: parsed.migrationNotes,
    riskWarnings: parsed.riskWarnings,
    reportJson: buildReportJson(input, scopeStatus, finalAnswerMarkdown, sections, parsed),
    model: "unknown",
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }
  };
}

function buildNormalizedMarkdown(
  markdown: string,
  sections: MarkdownSection[],
  contract: MarkdownContract,
  task: Pick<AiTask, "type">
) {
  return contract.keys
    .flatMap((key) => [
      `## ${contract.titles[key]}`,
      getNormalizedSectionContent(key, markdown, sections, task),
      ""
    ])
    .slice(0, -1)
    .join("\n");
}

function getNormalizedSectionContent(
  key: MarkdownSectionKey,
  markdown: string,
  sections: MarkdownSection[],
  task: Pick<AiTask, "type">
) {
  const content = getSectionContent(sections, key);

  if (content) {
    return content;
  }

  if (key === "summary") {
    return buildFallbackSummary(markdown);
  }

  if (key === "code") {
    return buildFallbackCodeSection(markdown, task);
  }

  if (key === "overview" || key === "tradingLogic" || key === "parameters" || key === "risks" || key === "suggestions") {
    return formatMissingAnalysisSection(key);
  }

  if (key === "notes") {
    return task.type === "code_conversion"
      ? "请按目标平台 API 逐项复核后再运行。"
      : "请结合输入代码和业务场景复核解析结论。";
  }

  return formatRiskWarnings(parseRiskWarnings(markdown).slice(0, 8));
}

function splitMarkdownSections(markdown: string): MarkdownSection[] {
  const headingPattern = /^##\s+(.+?)\s*$/gm;
  const headings: Array<{ title: string; index: number; end: number; key: MarkdownSectionKey }> = [];
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(markdown)) !== null) {
    const key = normalizeHeadingKey(match[1]);

    if (!key) {
      continue;
    }

    headings.push({
      title: match[1].trim(),
      index: match.index,
      end: headingPattern.lastIndex,
      key
    });
  }

  return headings.map((heading, index) => {
    const next = headings[index + 1];

    return {
      key: heading.key,
      title: heading.title,
      content: markdown.slice(heading.end, next?.index ?? markdown.length).trim()
    };
  });
}

function normalizeHeadingKey(title: string): MarkdownSectionKey | null {
  const normalized = title.replace(/\s+/g, "");

  for (const alias of SECTION_ALIASES) {
    if (alias.pattern.test(normalized)) {
      return alias.key;
    }
  }

  return null;
}

function getSectionContent(sections: MarkdownSection[], key: MarkdownSectionKey) {
  return sections.find((section) => section.key === key)?.content.trim() ?? "";
}

function extractGeneratedCode(value: string) {
  const fenced = [...value.matchAll(/```(?:[\w+-]+)?\s*\n([\s\S]*?)```/g)]
    .map((match) => match[1]?.trim())
    .filter((item): item is string => Boolean(item));

  if (fenced.length > 0) {
    return fenced.join("\n\n").trim();
  }

  const stripped = value
    .split(/\r?\n/)
    .filter((line) => !/^[-*]\s*(暂无|无|不需要|没有)/.test(line.trim()))
    .join("\n")
    .trim();

  return looksLikeCode(stripped) ? stripped : null;
}

function parseRiskWarnings(value: string) {
  const source = value.trim();

  if (!source) {
    return [];
  }

  return source
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*(?:[-*+]|\d+[.)]|[一二三四五六七八九十]+[、.])\s*/, "").trim())
    .filter((line) => line && !/^暂无|^无$/.test(line))
    .slice(0, 12);
}

function inferScopeStatus(summary: string, markdown: string): AiTaskScopeStatus {
  const text = `${summary}\n${markdown}`.toLowerCase();

  if (text.includes("out_of_scope") || /超出.*模块|范围外|不属于.*量化|无法处理/.test(text)) {
    return "out_of_scope";
  }

  return "in_scope";
}

function buildReportJson(
  input: AiProviderInput,
  scopeStatus: AiTaskScopeStatus,
  finalAnswerMarkdown: string,
  sections: MarkdownSection[],
  parsed: {
    explanation: string | null;
    generatedCode: string | null;
    migrationNotes: string | null;
    riskWarnings: string[];
    analysisReport?: CodeAnalysisReport;
  }
) {
  const base = {
    processingMode: "streaming",
    scopeStatus,
    skillId: input.skill.id,
    skillVersion: input.skill.version,
    displayName: input.config.displayName,
    costPoints: input.config.costPoints,
    finalAnswerMarkdown,
    sections: Object.fromEntries(sections.map((section) => [section.key, section.content])),
    deterministicParser: true
  };

  if (input.task.type === "strategy_generation") {
    return {
      ...base,
      overview: parsed.explanation,
      generatedCode: parsed.generatedCode
    };
  }

  if (input.task.type === "code_conversion") {
    return {
      ...base,
      targetCode: parsed.generatedCode,
      migrationNotes: parsed.migrationNotes
    };
  }

  if (input.task.type !== "code_analysis") {
    return {
      ...base,
      overview: parsed.explanation,
      migrationNotes: parsed.migrationNotes,
      riskWarnings: parsed.riskWarnings
    };
  }

  const analysisReport = parsed.analysisReport ?? buildCodeAnalysisReport(sections);

  return {
    ...base,
    overview: analysisReport.overview,
    tradingLogic: analysisReport.tradingLogic,
    keyParameters: analysisReport.keyParameters,
    risks: analysisReport.risks,
    suggestions: analysisReport.suggestions,
    riskWarnings: parsed.riskWarnings,
    optimizationSuggestions: analysisReport.suggestions
  };
}

function buildEmptyMarkdown(task: Pick<AiTask, "type">) {
  if (task.type === "strategy_generation") {
    return [
      `## ${STRATEGY_CONTRACT.titles.summary}`,
      "模型未返回有效内容。",
      "",
      `## ${STRATEGY_CONTRACT.titles.code}`,
      ""
    ].join("\n");
  }

  if (task.type === "code_analysis") {
    return [
      `## ${ANALYSIS_CONTRACT.titles.overview}`,
      formatMissingAnalysisSection("overview"),
      "",
      `## ${ANALYSIS_CONTRACT.titles.tradingLogic}`,
      formatMissingAnalysisSection("tradingLogic"),
      "",
      `## ${ANALYSIS_CONTRACT.titles.parameters}`,
      formatMissingAnalysisSection("parameters"),
      "",
      `## ${ANALYSIS_CONTRACT.titles.risks}`,
      formatMissingAnalysisSection("risks"),
      "",
      `## ${ANALYSIS_CONTRACT.titles.suggestions}`,
      formatMissingAnalysisSection("suggestions")
    ].join("\n");
  }

  return [
    `## ${CONVERSION_CONTRACT.titles.code}`,
    "",
    "",
    `## ${CONVERSION_CONTRACT.titles.notes}`,
    "请稍后重试，或补充更明确的输入。"
  ].join("\n");
}

function buildCodeAnalysisReport(sections: MarkdownSection[]): CodeAnalysisReport {
  return {
    overview: normalizeReportSection(getSectionContent(sections, "overview"), CODE_ANALYSIS_REPORT_TITLES.overview),
    tradingLogic: normalizeReportSection(getSectionContent(sections, "tradingLogic"), CODE_ANALYSIS_REPORT_TITLES.tradingLogic),
    keyParameters: normalizeReportSection(getSectionContent(sections, "parameters"), CODE_ANALYSIS_REPORT_TITLES.keyParameters),
    risks: normalizeReportSection(getSectionContent(sections, "risks"), CODE_ANALYSIS_REPORT_TITLES.risks),
    suggestions: normalizeReportSection(getSectionContent(sections, "suggestions"), CODE_ANALYSIS_REPORT_TITLES.suggestions)
  };
}

function normalizeCodeAnalysisReportFromUnknown(value: unknown, fallback: { explanation?: string | null; riskWarnings?: string[] }): CodeAnalysisReport {
  const report = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const overviewSource = pickReportSectionValue(
    [
      report.overview,
      [report.codeStructure, report.platformDependencies],
      fallback.explanation
    ],
    CODE_ANALYSIS_REPORT_TITLES.overview
  );
  const riskSource = pickReportSectionValue(
    [report.risks, report.riskWarnings, fallback.riskWarnings],
    CODE_ANALYSIS_REPORT_TITLES.risks
  );

  return {
    overview: normalizeReportSection(overviewSource, CODE_ANALYSIS_REPORT_TITLES.overview),
    tradingLogic: normalizeReportSection(report.tradingLogic, CODE_ANALYSIS_REPORT_TITLES.tradingLogic),
    keyParameters: normalizeReportSection(report.keyParameters ?? report.parameters, CODE_ANALYSIS_REPORT_TITLES.keyParameters),
    risks: normalizeReportSection(riskSource, CODE_ANALYSIS_REPORT_TITLES.risks),
    suggestions: normalizeReportSection(report.suggestions ?? report.optimizationSuggestions, CODE_ANALYSIS_REPORT_TITLES.suggestions)
  };
}

function normalizeReportSection(value: unknown, fixedTitles: readonly string[]) {
  const incomingItems = normalizeReportItems(value, fixedTitles);
  const fixedItems = fixedTitles.map((title) => ({
    title,
    value: REPORT_MISSING_VALUE,
    lines: [] as string[],
    evidence: ""
  }));
  const orphanLines: string[] = [];
  let lastMatchedIndex = -1;
  let hasMatchedItem = false;

  for (const item of incomingItems) {
    const matchIndex = fixedTitles.findIndex((title) => isSameReportTitle(item.title, title));
    const lines = normalizeReportLines(item);
    const evidence = sanitizeReportText(item.evidence ?? "");

    if (matchIndex >= 0) {
      const current = fixedItems[matchIndex];
      const mergedLines = mergeReportLines(current.lines, lines);

      fixedItems[matchIndex] = {
        title: fixedTitles[matchIndex],
        value: mergedLines[0] || sanitizeReportText(item.value) || REPORT_MISSING_VALUE,
        lines: mergedLines,
        evidence: mergeReportEvidence(current.evidence, evidence)
      };
      lastMatchedIndex = matchIndex;
      hasMatchedItem = true;
      continue;
    }

    const inlineLines = formatReportSubItemLines(item);

    if (lastMatchedIndex >= 0) {
      const current = fixedItems[lastMatchedIndex];
      const mergedLines = mergeReportLines(current.lines, inlineLines);

      fixedItems[lastMatchedIndex] = {
        ...current,
        value: mergedLines[0] || current.value,
        lines: mergedLines,
        evidence: mergeReportEvidence(current.evidence, evidence)
      };
    } else {
      orphanLines.push(...inlineLines);
    }
  }

  if (!hasMatchedItem && orphanLines.length > 0) {
    return [
      ...fixedItems,
      {
        title: "补充说明",
        value: orphanLines[0] || REPORT_MISSING_VALUE,
        lines: uniqueReportLines(orphanLines),
        evidence: ""
      }
    ];
  }

  return fixedItems;
}

function normalizeReportItems(value: unknown, fixedTitles: readonly string[]): ReportItem[] {
  if (value === null || typeof value === "undefined") {
    return [];
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return splitReportText(String(value), fixedTitles);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeReportItems(item, fixedTitles));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const title = sanitizeReportText(readReportString(record.title));
    const itemValue = sanitizeReportText(readReportString(record.value));
    const lines = readReportLines(record.lines ?? record.details);
    const evidence = sanitizeReportText(readReportString(record.evidence));

    if (title || itemValue || lines.length || evidence) {
      return [{
        title: title || "补充说明",
        value: itemValue || lines[0] || REPORT_MISSING_VALUE,
        lines: lines.length ? lines : itemValue ? splitReportValueLines(itemValue) : [],
        evidence
      }];
    }
  }

  return [];
}

function pickReportSectionValue(candidates: unknown[], fixedTitles: readonly string[]) {
  return candidates.find((candidate) => normalizeReportItems(candidate, fixedTitles).length > 0);
}

function splitReportText(value: string, fixedTitles: readonly string[]): ReportItem[] {
  const text = sanitizeReportText(value);

  if (!text) {
    return [];
  }

  const items: ReportItem[] = [];
  let current: ReportItem | null = null;
  const lines = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const fieldMatch = line.match(/^(?:[-*+]\s*)?(.{2,32}?)[\uFF1A:]\s*(.*)$/);
    const stepMatch = line.match(/^(?:(?:\d+|[A-Za-z])[\.)\u3001:]|[\(（]?[A-Za-z][\)）]|[一二三四五六七八九十]+[\u3001.])\s*(.+)$/);

    if (fieldMatch && !/^\d+[.)\u3001]/.test(fieldMatch[1])) {
      const title = sanitizeReportText(fieldMatch[1]);
      const evidenceMatch = fieldMatch[2].match(/^(.*?)(?:证据|代码证据)[\uFF1A:]\s*(.+)$/);
      const firstLine = sanitizeReportText(evidenceMatch?.[1] ?? fieldMatch[2]);
      const evidence = sanitizeReportText(evidenceMatch?.[2] ?? "");

      if (isKnownReportTitle(title, fixedTitles)) {
        if (current) {
          items.push(current);
        }

        current = {
          title,
          value: firstLine || REPORT_MISSING_VALUE,
          lines: firstLine ? splitReportValueLines(firstLine) : [],
          evidence
        };

        continue;
      }

      const inlineTitle = stripReportStepPrefix(title);
      const inlineLine = sanitizeReportText(firstLine ? `${inlineTitle}：${firstLine}` : inlineTitle);

      if (!inlineLine) {
        continue;
      }

      if (!current) {
        current = {
          title: "补充说明",
          value: inlineLine,
          lines: [inlineLine],
          evidence
        };
        continue;
      }

      current.lines = mergeReportLines(current.lines ?? [], [inlineLine]);
      current.value = current.value === REPORT_MISSING_VALUE ? inlineLine : current.value;
      current.evidence = mergeReportEvidence(current.evidence ?? "", evidence);

      continue;
    }

    const content = sanitizeReportText(stepMatch?.[1] ?? line.replace(/^\s*[-*+]\s*/, ""));

    if (!content) {
      continue;
    }

    if (!current) {
      current = {
        title: "补充说明",
        value: content,
        lines: [content]
      };
      continue;
    }

    current.lines = [...(current.lines ?? []), content];
    current.value = current.value === REPORT_MISSING_VALUE ? content : current.value;
  }

  if (current) {
    items.push(current);
  }

  return items;
}

function formatReportSubItemLines(item: ReportItem) {
  const title = sanitizeReportText(item.title);
  const lines = normalizeReportLines(item).filter((line) => line !== REPORT_MISSING_VALUE);

  if (title && title !== "补充说明" && lines.length > 0) {
    return lines.map((line, index) => index === 0 ? `${title}：${line}` : line);
  }

  if (title && title !== "补充说明") {
    return [title];
  }

  return lines;
}

function mergeReportLines(left: string[], right: string[]) {
  return uniqueReportLines([...left, ...right].map((line) => sanitizeReportText(line)).filter(Boolean));
}

function uniqueReportLines(lines: string[]) {
  return [...new Set(lines)];
}

function mergeReportEvidence(left: string, right: string) {
  return uniqueReportLines([left, right].map((item) => sanitizeReportText(item)).filter(Boolean)).join("；");
}

function formatMissingAnalysisSection(key: MarkdownSectionKey) {
  return formatReportItemsAsMarkdown(
    getAnalysisTitlesForSection(key).map((title) => ({
      title,
      value: REPORT_MISSING_VALUE
    }))
  );
}

function formatReportItemsAsMarkdown(items: ReportItem[]) {
  return items
    .map((item) => {
      const lines = normalizeReportLines(item);
      const value = lines.length > 0 ? "" : sanitizeReportText(item.value) || REPORT_MISSING_VALUE;
      const evidence = sanitizeReportText(item.evidence ?? "");

      if (lines.length > 0) {
        const body = lines.map((line, index) => `  ${index + 1}. ${line}`).join("\n");
        const evidenceLine = evidence ? `\n  ${lines.length + 1}. 代码证据：${evidence}` : "";

        return `- ${item.title}：\n${body}${evidenceLine}`;
      }

      return evidence ? `- ${item.title}：${value}（证据：${evidence}）` : `- ${item.title}：${value}`;
    })
    .join("\n");
}

function formatReportItemsForText(items: ReportItem[]) {
  return items
    .map((item) => ({
      title: item.title,
      text: normalizeReportLines(item).join("；") || sanitizeReportText(item.value)
    }))
    .filter((item) => item.text && item.text !== REPORT_MISSING_VALUE)
    .map((item) => `${item.title}：${item.text}`)
    .join("\n") || null;
}

function getReportValues(items: ReportItem[]) {
  return items
    .map((item) => normalizeReportLines(item).join("；") || sanitizeReportText(item.value))
    .filter((value) => value && value !== REPORT_MISSING_VALUE);
}

function normalizeReportLines(item: ReportItem) {
  const lines = (item.lines?.length ? item.lines : splitReportValueLines(item.value))
    .map((line) => sanitizeReportText(line))
    .filter(Boolean);

  return lines.length > 0 ? lines : [];
}

function splitReportValueLines(value: string) {
  const text = sanitizeReportText(value);

  if (!text || text === REPORT_MISSING_VALUE) {
    return [];
  }

  return text
    .split(/\r?\n+/)
    .map((line) => stripReportStepPrefix(line))
    .filter(Boolean);
}

function stripReportStepPrefix(value: string) {
  return value
    .replace(/^\s*(?:[-*+]|(?:\d+|[A-Za-z])[\.)\u3001:]|[\(（]?[A-Za-z][\)）]|[一二三四五六七八九十]+[\u3001.])\s*/, "")
    .trim();
}

function readReportLines(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitReportValueLines(readReportString(item))).filter(Boolean);
  }

  if (typeof value === "string") {
    return splitReportValueLines(value);
  }

  return [];
}

function getAnalysisTitlesForSection(key: MarkdownSectionKey): readonly string[] {
  if (key === "tradingLogic") {
    return CODE_ANALYSIS_REPORT_TITLES.tradingLogic;
  }

  if (key === "parameters") {
    return CODE_ANALYSIS_REPORT_TITLES.keyParameters;
  }

  if (key === "risks") {
    return CODE_ANALYSIS_REPORT_TITLES.risks;
  }

  if (key === "suggestions") {
    return CODE_ANALYSIS_REPORT_TITLES.suggestions;
  }

  return CODE_ANALYSIS_REPORT_TITLES.overview;
}

function isSameReportTitle(left: string, right: string) {
  const normalize = (value: string) => value.replace(/\s+/g, "").replace(/[\/／]/g, "");

  return normalize(left) === normalize(right) || normalize(left).includes(normalize(right)) || normalize(right).includes(normalize(left));
}

function isKnownReportTitle(title: string, fixedTitles: readonly string[]) {
  return fixedTitles.some((fixedTitle) => isSameReportTitle(title, fixedTitle));
}

function readReportString(value: unknown) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";
}

function sanitizeReportText(value: string) {
  const trimmed = value.trim();

  if (!trimmed || looksLikeRawStructuredValue(trimmed)) {
    return "";
  }

  return stripMarkdownNoise(trimmed)
    .replace(/^`{3,}[\w+-]*\s*$/gm, "")
    .replace(/^`{3,}\s*$/gm, "")
    .trim();
}

function looksLikeRawStructuredValue(value: string) {
  return /^\s*[{[]/.test(value) || /\b(scopeStatus|analysisType|reportJson|generatedCode)\b/.test(value);
}

function buildFallbackSummary(value: string) {
  return stripMarkdownNoise(removeCodeFences(value)).slice(0, 4000) || "已生成结果，请查看下方内容。";
}

function buildFallbackCodeSection(value: string, task: Pick<AiTask, "type">) {
  const code = extractGeneratedCode(value);

  if (code) {
    return `\`\`\`python\n${code}\n\`\`\``;
  }

  return task.type === "strategy_generation"
    ? "暂无可直接运行的策略代码。"
    : "暂无可直接运行的目标平台代码。";
}

function formatRiskWarnings(warnings: string[]) {
  const riskWarnings = warnings.length > 0 ? warnings : getDefaultRiskWarnings();

  return riskWarnings.map((warning) => `- ${warning}`).join("\n");
}

function getDefaultRiskWarnings() {
  return ["请在回测和模拟盘中验证结果，不构成投资建议。"];
}

function removeCodeFences(value: string) {
  return value.replace(/```[\s\S]*?```/g, "").trim();
}

function stripMarkdownNoise(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateResultText(value: string | null, maxLength: number) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
}

function looksLikeCode(value: string) {
  if (!value) {
    return false;
  }

  return /\b(def|class|import|from|return|if|for|while)\b|order_|get_|set_universe|handle_data|initialize|passorder/.test(value);
}
