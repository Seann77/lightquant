import type { AiTask, AiTaskScopeStatus } from "@/server/domain";
import type { AiProviderInput, AiProviderResult } from "@/server/ai/providers/types";

type MarkdownSectionKey = "summary" | "code" | "notes" | "risks";

type MarkdownSection = {
  key: MarkdownSectionKey;
  title: string;
  content: string;
};

const REQUIRED_SECTION_TITLES: Record<MarkdownSectionKey, string> = {
  summary: "结论摘要",
  code: "代码块 / 目标平台代码",
  notes: "迁移说明 / 解析说明",
  risks: "风险提醒"
};

const SECTION_ALIASES: Array<{ key: MarkdownSectionKey; pattern: RegExp }> = [
  { key: "summary", pattern: /结论|摘要|概述|范围提示/i },
  { key: "code", pattern: /代码块|目标平台代码|策略代码|生成代码|代码/i },
  { key: "notes", pattern: /迁移说明|解析说明|说明|兼容|复核/i },
  { key: "risks", pattern: /风险提醒|风险|注意事项|提醒/i }
];

export function parseStreamingMarkdownResult(input: AiProviderInput, markdown: string): AiProviderResult {
  const finalAnswerMarkdown = normalizeMarkdown(markdown, input.task);
  const sections = splitMarkdownSections(finalAnswerMarkdown);
  const summary = getSectionContent(sections, "summary") || stripMarkdownNoise(finalAnswerMarkdown);
  const codeSection = getSectionContent(sections, "code");
  const notes = getSectionContent(sections, "notes");
  const riskWarnings = parseRiskWarnings(getSectionContent(sections, "risks"));
  const scopeStatus = inferScopeStatus(summary, finalAnswerMarkdown);
  const generatedCode = input.task.type === "code_analysis" ? null : extractGeneratedCode(codeSection || finalAnswerMarkdown);
  const explanation = truncateResultText(summary, input.config.maxResultChars);
  const migrationNotes = truncateResultText(notes || null, input.config.maxResultChars);
  const risks = riskWarnings.length > 0 ? riskWarnings : ["请在回测和模拟盘中验证结果，不构成投资建议。"];

  if (scopeStatus === "out_of_scope") {
    return {
      scopeStatus,
      generatedCode: null,
      explanation: input.skill.outOfScopeResponse,
      migrationNotes: null,
      riskWarnings: risks,
      reportJson: buildReportJson(input, scopeStatus, finalAnswerMarkdown, sections, {
        explanation: input.skill.outOfScopeResponse,
        generatedCode: null,
        migrationNotes: null,
        riskWarnings: risks
      }),
      model: "unknown",
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  return {
    scopeStatus,
    generatedCode,
    explanation,
    migrationNotes,
    riskWarnings: risks,
    reportJson: buildReportJson(input, scopeStatus, finalAnswerMarkdown, sections, {
      explanation,
      generatedCode,
      migrationNotes,
      riskWarnings: risks
    }),
    model: "unknown",
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }
  };
}

export function normalizeMarkdown(markdown: string, task: Pick<AiTask, "type">) {
  const trimmed = markdown.trim();

  if (!trimmed) {
    return buildEmptyMarkdown(task);
  }

  const sections = splitMarkdownSections(trimmed);
  const hasRequiredSections = (["summary", "code", "notes", "risks"] as MarkdownSectionKey[])
    .every((key) => sections.some((section) => section.key === key));

  if (hasRequiredSections) {
    return trimmed;
  }

  const code = extractGeneratedCode(trimmed);
  const risks = parseRiskWarnings(trimmed).slice(0, 8);
  const summary = stripMarkdownNoise(removeCodeFences(trimmed)).slice(0, 4000) || "已生成结果，请查看下方内容。";

  return [
    `## ${REQUIRED_SECTION_TITLES.summary}`,
    summary,
    "",
    `## ${REQUIRED_SECTION_TITLES.code}`,
    task.type === "code_analysis" || !code ? "本次任务不需要生成目标平台代码。" : `\`\`\`python\n${code}\n\`\`\``,
    "",
    `## ${REQUIRED_SECTION_TITLES.notes}`,
    task.type === "code_conversion" ? "请按目标平台 API 逐项复核后再运行。" : "请结合输入代码和业务场景复核解析结论。",
    "",
    `## ${REQUIRED_SECTION_TITLES.risks}`,
    risks.length > 0 ? risks.map((item) => `- ${item}`).join("\n") : "- 请在回测和模拟盘中验证结果，不构成投资建议。"
  ].join("\n");
}

export function formatProviderResultAsMarkdown(result: Pick<AiProviderResult, "explanation" | "generatedCode" | "migrationNotes" | "riskWarnings">, task: Pick<AiTask, "type">) {
  return [
    `## ${REQUIRED_SECTION_TITLES.summary}`,
    result.explanation?.trim() || "已完成处理。",
    "",
    `## ${REQUIRED_SECTION_TITLES.code}`,
    result.generatedCode?.trim()
      ? `\`\`\`python\n${result.generatedCode.trim()}\n\`\`\``
      : task.type === "code_analysis" ? "本次任务不需要生成目标平台代码。" : "暂无可直接运行的目标平台代码。",
    "",
    `## ${REQUIRED_SECTION_TITLES.notes}`,
    result.migrationNotes?.trim() || (task.type === "code_conversion" ? "请按目标平台 API 逐项复核后再运行。" : "请结合输入代码和业务场景复核结论。"),
    "",
    `## ${REQUIRED_SECTION_TITLES.risks}`,
    result.riskWarnings.length > 0
      ? result.riskWarnings.map((warning) => `- ${warning}`).join("\n")
      : "- 请在回测和模拟盘中验证结果，不构成投资建议。"
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

  if (input.task.type !== "code_analysis") {
    return {
      ...base,
      overview: parsed.explanation,
      migrationNotes: parsed.migrationNotes,
      riskWarnings: parsed.riskWarnings
    };
  }

  return {
    ...base,
    overview: parsed.explanation || "已生成代码解析报告。",
    codeStructure: [],
    tradingLogic: [],
    parameters: [],
    platformDependencies: [],
    riskWarnings: parsed.riskWarnings,
    optimizationSuggestions: parsed.migrationNotes ? [parsed.migrationNotes] : []
  };
}

function buildEmptyMarkdown(task: Pick<AiTask, "type">) {
  return [
    `## ${REQUIRED_SECTION_TITLES.summary}`,
    "模型未返回有效内容。",
    "",
    `## ${REQUIRED_SECTION_TITLES.code}`,
    task.type === "code_analysis" ? "本次任务不需要生成目标平台代码。" : "",
    "",
    `## ${REQUIRED_SECTION_TITLES.notes}`,
    "请稍后重试，或补充更明确的输入。",
    "",
    `## ${REQUIRED_SECTION_TITLES.risks}`,
    "- 本次结果为空，不能直接用于回测或实盘。"
  ].join("\n");
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
