import { readFileSync } from "node:fs";
import path from "node:path";
import {
  extractGeneratedCodeFromMarkdown,
  shouldExpectFullGeneratedCode,
  shouldUseStreamingMarkdownForTask,
  validateGeneratedCodeArtifact
} from "../src/server/ai/code-artifact";
import { parseStreamingMarkdownResult } from "../src/server/ai/streaming-markdown-result";
import { stripGeneratedCodeFromMarkdown } from "../src/components/ai/WorkbenchResultViews";
import { getAiTaskConfig } from "../src/server/ai/ai-task-config";
import { getAiSkill } from "../src/server/ai/skills";
import type { AiProviderInput } from "../src/server/ai/providers/types";

const completeCode = [
  "def initialize(context):",
  "    g.security = '000001.SZ'",
  "    g.amount = 10000",
  "",
  "def handle_data(context, data):",
  "    price = data[g.security].price",
  "    if price > 0:",
  "        order_value(g.security, g.amount)"
].join("\n");

const markdown = [
  "处理过程：",
  "1. 识别平台：PTrade。",
  "2. 判断任务：完整策略生成。",
  "",
  "```python",
  completeCode,
  "```",
  "",
  "风险提醒：请先回测。"
].join("\n");

const input = createProviderInput("strategy_generation", "请生成完整 PTrade 策略代码。");
const parsed = parseStreamingMarkdownResult(input, markdown);
const report = readRecord(parsed.reportJson);
const artifact = readRecord(report?.artifact);
const validation = readRecord(report?.validation);

expect("strategy generation uses streaming markdown for full code", shouldUseStreamingMarkdownForTask({
  task: input.task
}));
expect("strategy generation expects full generated code", shouldExpectFullGeneratedCode({
  task: input.task
}));
expect("generatedCode extracted from fenced block", parsed.generatedCode === completeCode);
expect("artifact output mode", report?.outputMode === "full_artifact");
expect("artifact language", artifact?.language === "python");
expect("artifact platform", artifact?.platform === "PTrade");
expect("artifact complete", artifact?.status === "complete");
expect("artifact line count", artifact?.codeLineCount === 7);
expect("artifact sha exists", typeof artifact?.contentSha256 === "string" && artifact.contentSha256.length === 64);
expect("validation complete", validation?.status === "complete");

const stripped = stripGeneratedCodeFromMarkdown(markdown, completeCode);
expect("frontend strips duplicate full code block", !stripped.includes("order_value(g.security, g.amount)") && stripped.includes("风险提醒"));

const conversionInput = createProviderInput("code_conversion", "请转换为完整 PTrade 代码。");
expect("code conversion uses streaming markdown", shouldUseStreamingMarkdownForTask({
  task: conversionInput.task
}));

const extraction = extractGeneratedCodeFromMarkdown(markdown, "strategy_generation", "PTrade");
expect("extractGeneratedCodeFromMarkdown returns code", extraction.code === completeCode);
expect("extractGeneratedCodeFromMarkdown source", extraction.source === "markdown_code_block");

expect("unclosed code fence invalid", validateGeneratedCodeArtifact({
  task: input.task,
  code: completeCode,
  finalAnswerMarkdown: "```python\n" + completeCode
}).status === "invalid");
expect("placeholder invalid", validateGeneratedCodeArtifact({
  task: input.task,
  code: `${completeCode}\n# TODO: 后续补充`,
  finalAnswerMarkdown: markdown
}).status === "invalid");
expect("abrupt syntax invalid", validateGeneratedCodeArtifact({
  task: input.task,
  code: `${completeCode}\nif True:`,
  finalAnswerMarkdown: markdown
}).status === "invalid");
expect("missing platform entry invalid", validateGeneratedCodeArtifact({
  task: input.task,
  code: "import math\nvalue = math.sqrt(4)\nprint(value)",
  finalAnswerMarkdown: "```python\nimport math\nvalue = math.sqrt(4)\nprint(value)\n```"
}).status === "invalid");

const aiService = readFileSync(path.join(process.cwd(), "src/server/ai/ai-service.ts"), "utf8");
expect("runner checks streaming markdown mode", aiService.includes("shouldUseStreamingMarkdownForTask"));
expect("runner calls streaming provider for long code", /shouldUseStreamingMarkdownForTask[\s\S]+runAiProviderStream/.test(aiService));

console.log(JSON.stringify({
  ok: true,
  checked: [
    "strategy_generation long code uses streaming Markdown",
    "code_conversion long code uses streaming Markdown",
    "python fenced code extracts to generatedCode",
    "reportJson artifact stores language/platform/status/lineCount/contentSha256",
    "frontend duplicate Markdown code block is stripped when generatedCode exists",
    "unclosed fence, placeholder, abrupt syntax, and missing platform entry are invalid",
    "runner uses streaming provider path for long code tasks"
  ]
}, null, 2));

function createProviderInput(type: "strategy_generation" | "code_conversion", prompt: string): AiProviderInput {
  return {
    task: {
      id: `task-${type}`,
      userId: "user-1",
      conversationId: "conversation-1",
      type,
      status: "RUNNING",
      scopeStatus: "in_scope",
      sourcePlatform: type === "code_conversion" ? "JoinQuant" : null,
      targetPlatform: "PTrade",
      prompt,
      inputCode: type === "code_conversion" ? completeCode : null,
      inputFileId: null,
      costPoints: 50,
      clientRequestId: `client-${type}`,
      requestId: `request-${type}`,
      errorCode: null,
      errorMessage: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    skill: getAiSkill(type),
    config: getAiTaskConfig(type),
    apiDocumentContext: {
      text: "API参考资料\n测试文档上下文",
      metadata: {
        taskId: `task-${type}`,
        taskType: type,
        sourcePlatform: type === "code_conversion" ? "JoinQuant" : null,
        targetPlatform: "PTrade",
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
    }
  };
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function expect(label: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}
