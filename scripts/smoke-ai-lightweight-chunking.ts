import assert from "node:assert/strict";
import { getAiTaskConfig } from "../src/server/ai/ai-task-config";
import { runChunkedCodeProcessing } from "../src/server/ai/code-chunking";
import { formatProviderResultAsMarkdown } from "../src/server/ai/streaming-markdown-result";
import { getAiSkill } from "../src/server/ai/skills";
import type { AiProviderInput, AiProviderResult } from "../src/server/ai/providers/types";
import type { AiTask } from "../src/server/domain";

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const task = createLongConversionTask();
  const baseConfig = getAiTaskConfig("code_conversion");
  const input: AiProviderInput = {
    task,
    skill: getAiSkill(task.type),
    config: {
      ...baseConfig,
      maxSingleCallInputChars: 9000
    },
    apiDocumentContext: {
      text: "API参考资料\nQMT 内置 Python：passorder 用于提交委托。",
      metadata: {
        taskId: task.id,
        taskType: task.type,
        sourcePlatform: task.sourcePlatform,
        targetPlatform: task.targetPlatform,
        detectedApiNames: ["initialize", "run_daily", "order_value", "passorder"],
        matchedSymbolCount: 4,
        matchedChunkCount: 4,
        normalizedFallbackCount: 0,
        includedApiNames: ["initialize", "run_daily", "order_value", "passorder"],
        documentContextCharacterCount: 36,
        estimatedDocumentTokens: 12,
        documentCompressionApplied: false,
        retrievalDurationMs: 0,
        documentBudgetCharacters: 4000,
        outputTokenReserve: 80000
      }
    }
  };
  let callCount = 0;
  const result = await runChunkedCodeProcessing(input, async (chunkInput) => {
    callCount += 1;
    const isFirstChunk = callCount === 1;

    return buildChunkResult(chunkInput.task.inputCode ?? "", isFirstChunk);
  });
  const report = result.reportJson ?? {};
  const markdown = formatProviderResultAsMarkdown(result, task);

  assert.ok(callCount >= 2, "long conversion should run through multiple chunks");
  assert.ok(result.generatedCode?.includes("def initialize"), "merged output should retain the complete source scope");
  assert.ok(result.generatedCode?.includes("def after_trading_end"), "merged output should include the final chunk");
  assert.ok(Array.isArray(report.internalDiagnostics), "cross-chunk diagnostics should stay in internalDiagnostics");
  assert.equal("manualReviewItems" in report, false, "merged report should not expose manualReviewItems");
  assert.ok(!result.migrationNotes?.includes("函数在后文定义"), "ordinary cross-chunk references must not become user notes");
  assert.match(result.migrationNotes ?? "", /passorder.*提交委托.*不等同成交/);
  assert.equal((result.migrationNotes ?? "").split("\n").filter(Boolean).length <= 3, true, "compatibility notes should remain concise");
  assert.equal((markdown.match(/```python/g) ?? []).length, 1, "fallback delivery should contain one main Python block");
  assert.ok(!/需要人工复核|保守近似|目标平台可能需要替换为实际接口/.test(markdown), "user Markdown should not contain generic review language");
  assert.ok(!markdown.includes("internalDiagnostics"), "internal diagnostics must not leak into user Markdown");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "long conversion is split and merged",
      "cross-chunk dependencies remain internal diagnostics",
      "one concrete compatibility note is retained",
      "fallback Markdown contains one copyable Python block",
      "generic manual-review language is absent"
    ],
    chunkCount: callCount
  }, null, 2));
}

function buildChunkResult(code: string, includeCompatibilityNote: boolean): AiProviderResult {
  return {
    scopeStatus: "in_scope",
    generatedCode: code,
    explanation: "已按当前分段保留策略语义。",
    migrationNotes: includeCompatibilityNote ? "QMT passorder 仅代表提交委托，不等同成交确认。" : null,
    riskWarnings: [],
    reportJson: {
      dependencies: ["later_helper"],
      manualReviewItems: ["函数在后文定义，当前分段暂未展开。"]
    },
    model: "smoke-stub",
    tokenUsage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30
    }
  };
}

function createLongConversionTask(): AiTask {
  const now = "2026-07-18T00:00:00.000Z";
  const blocks = ["initialize", "select_stocks", "trade", "after_trading_end"].map((name, blockIndex) => [
    `def ${name}(context):`,
    ...Array.from({ length: 90 }, (_, index) => `    value_${blockIndex}_${index} = ${index}  # 保留分段策略上下文 ${"x".repeat(30)}`),
    "    return None"
  ].join("\n"));

  return {
    id: "smoke-lightweight-chunking",
    userId: "smoke-user",
    conversationId: "smoke-conversation",
    type: "code_conversion",
    status: "RUNNING",
    scopeStatus: "in_scope",
    sourcePlatform: "JoinQuant",
    targetPlatform: "QMT 内置 Python",
    prompt: "将这份完整 JoinQuant 策略转换为 QMT 内置 Python。",
    inputCode: blocks.join("\n\n"),
    inputFileId: null,
    costPoints: getAiTaskConfig("code_conversion").costPoints,
    clientRequestId: "smoke-lightweight-chunking-client",
    requestId: "smoke-lightweight-chunking-request",
    errorCode: null,
    errorMessage: null,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now
  };
}
