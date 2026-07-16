import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { getAiTaskConfig } from "../src/server/ai/ai-task-config";
import { shouldUseStreamingMarkdownForTask } from "../src/server/ai/code-artifact";
import { getAiSkill } from "../src/server/ai/skills";
import {
  runOpenAiCompatibleProvider,
  runOpenAiCompatibleProviderStream
} from "../src/server/ai/providers/openai-compatible-provider";
import type { AiProviderInput } from "../src/server/ai/providers/types";
import type { AiTask, AiTaskType } from "../src/server/domain";

const originalTimeout = process.env.AI_TASK_TIMEOUT_MS;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  if (originalTimeout === undefined) {
    delete process.env.AI_TASK_TIMEOUT_MS;
  } else {
    process.env.AI_TASK_TIMEOUT_MS = originalTimeout;
  }
});

async function main() {
  process.env.AI_TASK_TIMEOUT_MS = "1000";
  await testStrategyAnswerJsonContract();
  await testFullStrategyMarkdownContract();
  await testRepairFullStrategyMarkdownRouting();
  await testCodeConversionMarkdownContract();

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "strategy answer uses non-stream JSON-only contract",
      "full PTrade strategy uses streaming Markdown-only contract and extracts generatedCode",
      "repair/re-output full strategy routes to streaming Markdown without lazy placeholders",
    "code conversion uses Markdown contract, fenced target code, and parsed migrationNotes",
    "code conversion uncertain target APIs are migration notes rather than failure",
      "non-stream system prompt contains JSON-only rules",
      "streaming system prompt contains Markdown-only rules and no JSON-only sentence"
    ]
  }, null, 2));
}

async function testStrategyAnswerJsonContract() {
  let capturedPayload: Record<string, unknown> | null = null;
  const server = createServer((request, response) => {
    void readJsonBody(request).then((payload) => {
      capturedPayload = payload;
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        model: "mimo-v2.5-pro",
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                scopeStatus: "in_scope",
                generatedCode: null,
                explanation: "结论：这段策略说明的是止损规则，当前不需要输出完整代码。",
                migrationNotes: null,
                riskWarnings: [],
                reportJson: {
                  responseMode: "strategy_answer",
                  codeLevel: "none",
                  needsFullCode: false
                }
              })
            }
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      }));
    }).catch((error) => {
      response.statusCode = 500;
      response.end(String(error));
    });
  });
  const baseUrl = await listen(server);

  try {
    const result = await runOpenAiCompatibleProvider(createProviderInput("strategy_generation", {
      prompt: "解释一下这个策略的止损规则，不要输出完整代码。",
      inputCode: "def initialize(context):\n    g.stop_loss = 0.95\n"
    }), {
      runtimeConfig: createRuntimeConfig(baseUrl)
    });
    const systemMessage = readSystemMessage(capturedPayload);

    const payload = readRecord(capturedPayload) ?? {};

    expect("JSON response_format", readRecord(payload.response_format)?.type === "json_object");
    expect("JSON-only prompt contains schema", systemMessage.includes("必须返回一个 JSON 对象"));
    expect("JSON-only prompt excludes markdown contract", !systemMessage.includes("Markdown Output Requirement"));
    expect("JSON-only prompt excludes final markdown mandate", !systemMessage.includes("最终回答必须使用 Markdown"));
    expect("answer generatedCode null", result.generatedCode === null);
    expect("answer explanation available", typeof result.explanation === "string" && result.explanation.includes("止损"));
  } finally {
    server.close();
  }
}

async function testFullStrategyMarkdownContract() {
  const markdown = [
    "## 完整策略代码",
    "```python",
    "def initialize(context):",
    "    run_daily(handle_data, time='09:35')",
    "",
    "def handle_data(context):",
    "    order_value('000001.SZ', 10000)",
    "```",
    "",
    "说明：完整 PTrade 策略代码已给出。"
  ].join("\n");
  const result = await runStreamingScenario("strategy_generation", {
    prompt: "请生成一个完整 PTrade 策略代码。",
    targetPlatform: "PTrade"
  }, markdown, (payload) => {
    const systemMessage = readSystemMessage(payload);

    expect("stream no response_format", !("response_format" in payload));
    expect("stream markdown prompt contains contract", systemMessage.includes("Markdown Output Requirement"));
    expect("stream markdown final mandate", systemMessage.includes("最终回答必须使用 Markdown"));
    expect("stream markdown no JSON-only schema", !systemMessage.includes("必须返回一个 JSON 对象"));
    expect("stream markdown no only legal JSON sentence", !systemMessage.includes("只输出合法 JSON"));
  });

  expect("full strategy final is not JSON", !result.finalAnswerMarkdown.trim().startsWith("{"));
  expect("full strategy fenced code", /```python[\s\S]+def initialize[\s\S]+```/.test(result.finalAnswerMarkdown));
  expect("full strategy generatedCode extracted", Boolean(result.result.generatedCode?.includes("def initialize")));
}

async function testRepairFullStrategyMarkdownRouting() {
  const task = createTask("strategy_generation", {
    prompt: "请修复后重新输出完整策略代码。",
    targetPlatform: "PTrade",
    inputCode: "def initialize(context):\n    pass\n"
  });

  expect("repair full strategy streams", shouldUseStreamingMarkdownForTask({ task }));

  const markdown = [
    "## 修复后完整策略代码",
    "```python",
    "def initialize(context):",
    "    run_daily(trade, time='09:40')",
    "",
    "def trade(context):",
    "    return None",
    "```"
  ].join("\n");
  const result = await runStreamingScenario("strategy_generation", {
    prompt: task.prompt ?? "",
    targetPlatform: "PTrade",
    inputCode: task.inputCode ?? ""
  }, markdown);

  expect("repair final has no lazy placeholder", !/后续同理|请继续|其余代码保持不变/.test(result.finalAnswerMarkdown));
  expect("repair generatedCode extracted", Boolean(result.result.generatedCode?.includes("def trade")));
}

async function testCodeConversionMarkdownContract() {
  const markdown = [
    "## 目标平台代码",
    "```python",
    "def initialize(context):",
    "    run_daily(trade, time='09:35')",
    "",
    "def trade(context):",
    "    order_value('000001.SZ', 10000)",
    "```",
    "",
    "## 迁移说明",
    "- 已将源平台定时调度映射到 PTrade run_daily。",
    "- 下单逻辑使用 order_value，需要按实盘账户复核。"
  ].join("\n");
  const result = await runStreamingScenario("code_conversion", {
    prompt: "转换为 PTrade 完整代码。",
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    inputCode: "def initialize(context):\n    run_daily(trade)\n"
  }, markdown, (payload) => {
    const systemMessage = readSystemMessage(payload);

    expect("conversion markdown prompt", systemMessage.includes("最终回答必须使用 Markdown"));
    expect("conversion no JSON-only prompt", !systemMessage.includes("必须返回一个 JSON 对象"));
    expect("conversion uncertain API is not failure", systemMessage.includes("不要当成任务失败"));
    expect("conversion uncertain API manual review", systemMessage.includes("需要人工复核"));
    expect("conversion uncertain API conservative approximation", systemMessage.includes("保守近似"));
  });

  expect("conversion fenced target code", /## 目标平台代码[\s\S]+```python[\s\S]+def initialize[\s\S]+```/.test(result.finalAnswerMarkdown));
  expect("conversion generatedCode extracted", Boolean(result.result.generatedCode?.includes("order_value")));
  expect("conversion migration notes parsed", Boolean(result.result.migrationNotes?.includes("run_daily")));
}

async function runStreamingScenario(
  type: AiTaskType,
  overrides: Partial<Pick<AiTask, "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">>,
  markdown: string,
  inspectPayload?: (payload: Record<string, unknown>) => void
) {
  const server = createServer((request, response) => {
    void readJsonBody(request).then((payload) => {
      inspectPayload?.(payload);
      writeSseHeaders(response);
      response.write(streamChunk({
        model: "mimo-v2.5-pro",
        choices: [
          {
            delta: {
              content: markdown
            }
          }
        ]
      }));
      response.write(streamChunk({
        choices: [
          {
            delta: {},
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 11,
          completion_tokens: 22,
          total_tokens: 33
        }
      }));
      response.write("data: [DONE]\n\n");
      response.end();
    }).catch((error) => {
      response.statusCode = 500;
      response.end(String(error));
    });
  });
  const baseUrl = await listen(server);

  try {
    return await runOpenAiCompatibleProviderStream(createProviderInput(type, overrides), {
      runtimeConfig: createRuntimeConfig(baseUrl)
    });
  } finally {
    server.close();
  }
}

function createProviderInput(
  type: AiTaskType,
  overrides: Partial<Pick<AiTask, "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">> = {}
): AiProviderInput {
  const task = createTask(type, overrides);

  return {
    task,
    skill: getAiSkill(type),
    config: getAiTaskConfig(type)
  };
}

function createTask(
  type: AiTaskType,
  overrides: Partial<Pick<AiTask, "prompt" | "inputCode" | "sourcePlatform" | "targetPlatform">> = {}
): AiTask {
  const now = "2026-07-14T00:00:00.000Z";

  return {
    id: `contract-${type}`,
    userId: "contract-user",
    conversationId: "contract-conversation",
    type,
    status: "RUNNING",
    scopeStatus: "in_scope",
    sourcePlatform: overrides.sourcePlatform ?? null,
    targetPlatform: overrides.targetPlatform ?? null,
    prompt: overrides.prompt ?? "",
    inputCode: overrides.inputCode ?? null,
    inputFileId: null,
    costPoints: getAiTaskConfig(type).costPoints,
    clientRequestId: `contract-client-${type}`,
    requestId: `contract-request-${type}`,
    errorCode: null,
    errorMessage: null,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

function createRuntimeConfig(baseUrl: string) {
  return {
    provider: "openai_compatible" as const,
    baseUrl,
    apiKey: "fake-key",
    model: "mimo-v2.5-pro",
    modelMaxOutputTokens: 131072,
    supportsVision: false,
    source: "env" as const,
    activeProfileId: null,
    activeProfileName: null,
    apiKeyEnvName: "LIGHTQUANT_AI_API_KEY" as const,
    apiKeySecretId: null,
    apiKeySource: "env" as const
  };
}

async function listen(server: ReturnType<typeof createServer>) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected TCP server address");
  }

  return `http://127.0.0.1:${address.port}`;
}

function readJsonBody(request: IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(readRecord(JSON.parse(body)) ?? {}));
    request.on("error", reject);
  });
}

function readSystemMessage(payload: Record<string, unknown> | null) {
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const system = messages.find((message) => readRecord(message)?.role === "system");

  return typeof readRecord(system)?.content === "string" ? readRecord(system)?.content as string : "";
}

function writeSseHeaders(response: ServerResponse) {
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache"
  });
}

function streamChunk(value: unknown) {
  return `data: ${JSON.stringify(value)}\n\n`;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
    ? value as Record<string, unknown>
    : null;
}

function expect(label: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}
