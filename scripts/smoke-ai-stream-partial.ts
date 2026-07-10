import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { getAiTaskConfig } from "../src/server/ai/ai-task-config";
import { getAiSkill } from "../src/server/ai/skills";
import { runOpenAiCompatibleProviderStream } from "../src/server/ai/providers/openai-compatible-provider";
import type { AiTask } from "../src/server/domain";

const originalTimeout = process.env.AI_TASK_TIMEOUT_MS;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  try {
    await testLengthPartial();
    await testThinkingTruncationDoesNotMarkPartial();
    await testTimeoutPartial();
    await testDeepSeekThinkingEnabledAndVisibility();

    console.log(JSON.stringify({
      ok: true,
      checked: [
        "stream finish_reason length marks partial",
        "thinking truncation keeps specific marker",
        "thinking truncation does not mark final result partial",
        "stream timeout with content marks partial",
        "partial metadata includes continuation fields",
        "MiMo strategy generation thinking enabled",
        "MiMo code conversion thinking disabled",
        "DeepSeek strategy generation thinking enabled and visible",
        "DeepSeek code conversion thinking enabled but hidden",
        "DeepSeek code analysis thinking enabled but hidden"
      ]
    }, null, 2));
  } finally {
    if (originalTimeout === undefined) {
      delete process.env.AI_TASK_TIMEOUT_MS;
    } else {
      process.env.AI_TASK_TIMEOUT_MS = originalTimeout;
    }
  }
}

async function testLengthPartial() {
  process.env.AI_TASK_TIMEOUT_MS = "1000";
  const server = createServer((request, response) => {
    void handleSseRequest(request, response, "disabled", () => {
      response.write(streamChunk({
        model: "fake-mimo",
        choices: [
          {
            delta: {
              content: "## target code\n```python\nprint('partial')\n"
            }
          }
        ]
      }));
      response.write(streamChunk({
        choices: [
          {
            delta: {},
            finish_reason: "length"
          }
        ],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 34,
          total_tokens: 46
        }
      }));
      response.write("data: [DONE]\n\n");
      response.end();
    });
  });

  const baseUrl = await listen(server);

  try {
    const stream = await runOpenAiCompatibleProviderStream(createProviderInput("code_conversion"), {
      runtimeConfig: createRuntimeConfig(baseUrl)
    });
    const report = readRecord(stream.result.reportJson);

    expect("length partial", report?.partial === true);
    expect("length truncated", report?.truncated === true);
    expect("length reason", report?.truncateReason === "length");
    expect("length can continue", report?.canContinue === true);
    expect("length output token limit", report?.outputTokenLimit === 64000);
  } finally {
    server.close();
  }
}

async function testThinkingTruncationDoesNotMarkPartial() {
  process.env.AI_TASK_TIMEOUT_MS = "1000";
  const server = createServer((request, response) => {
    void handleSseRequest(request, response, "enabled", () => {
      response.write(streamChunk({
        model: "fake-mimo",
        choices: [
          {
            delta: {
              reasoning_content: "thinking ".repeat(2200)
            }
          }
        ]
      }));
      response.write(streamChunk({
        choices: [
          {
            delta: {
              content: "## 完整策略代码\n```python\nprint('done')\n```"
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
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      }));
      response.write("data: [DONE]\n\n");
      response.end();
    });
  });

  const baseUrl = await listen(server);

  try {
    const stream = await runOpenAiCompatibleProviderStream(createProviderInput("strategy_generation"), {
      runtimeConfig: createRuntimeConfig(baseUrl)
    });
    const report = readRecord(stream.result.reportJson);

    expect("thinking-specific marker", stream.visibleThinking.includes("[思考过程已截断]"));
    expect("no generic content marker", !stream.visibleThinking.includes("[内容已截断]"));
    expect("thinking truncation not partial", report?.partial !== true);
    expect("thinking truncation not result-truncated", report?.truncated !== true);
    expect("final answer preserved", stream.finalAnswerMarkdown.includes("print('done')"));
  } finally {
    server.close();
  }
}

async function testTimeoutPartial() {
  process.env.AI_TASK_TIMEOUT_MS = "50";
  const server = createServer((request, response) => {
    void handleSseRequest(request, response, "enabled", () => {
      response.write(streamChunk({
        model: "fake-mimo",
        choices: [
          {
            delta: {
              content: "## target code\n```python\nprint('timeout partial')\n"
            }
          }
        ]
      }));
    });
  });

  const baseUrl = await listen(server);

  try {
    const stream = await runOpenAiCompatibleProviderStream(createProviderInput("strategy_generation"), {
      runtimeConfig: createRuntimeConfig(baseUrl)
    });
    const report = readRecord(stream.result.reportJson);

    expect("timeout partial", report?.partial === true);
    expect("timeout truncated", report?.truncated === true);
    expect("timeout reason", report?.truncateReason === "timeout");
    expect("timeout can continue", report?.canContinue === true);
    expect("timeout output token limit", report?.outputTokenLimit === 64000);
  } finally {
    server.close();
  }
}

async function testDeepSeekThinkingEnabledAndVisibility() {
  process.env.AI_TASK_TIMEOUT_MS = "1000";
  const taskTypes: Array<"strategy_generation" | "code_conversion" | "code_analysis"> = [
    "strategy_generation",
    "code_conversion",
    "code_analysis"
  ];

  for (const type of taskTypes) {
    const server = createServer((request, response) => {
      void handleSseRequest(request, response, "enabled", () => {
        response.write(streamChunk({
          model: "deepseek-reasoner",
          choices: [
            {
              delta: {
                reasoning_content: `deepseek thinking for ${type}`
              }
            }
          ]
        }));
        response.write(streamChunk({
          choices: [
            {
              delta: {
                content: createFinalMarkdownForTask(type)
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
      });
    });

    const baseUrl = await listen(server);

    try {
      const stream = await runOpenAiCompatibleProviderStream(createProviderInput(type), {
        runtimeConfig: createRuntimeConfig(baseUrl, "deepseek-reasoner")
      });

      if (type === "strategy_generation") {
        expect("DeepSeek strategy thinking visible", stream.visibleThinking.includes("deepseek thinking for strategy_generation"));
      } else {
        expect(`DeepSeek ${type} thinking hidden`, stream.visibleThinking === "");
      }
    } finally {
      server.close();
    }
  }
}

function createProviderInput(type: "strategy_generation" | "code_conversion" | "code_analysis") {
  const now = "2026-06-26T00:00:00.000Z";
  const task: AiTask = {
    id: `task-${type}`,
    userId: "user-test",
    conversationId: "conversation-test",
    type,
    status: "RUNNING",
    scopeStatus: "in_scope",
    sourcePlatform: "JoinQuant",
    targetPlatform: type === "code_analysis" ? null : "PTrade",
    prompt: type === "strategy_generation"
      ? "generate full strategy code"
      : type === "code_conversion" ? "convert to PTrade" : "analyze this strategy",
    inputCode: "def initialize(context):\n    pass\n",
    inputFileId: null,
    costPoints: 0,
    clientRequestId: `client-${type}`,
    requestId: `request-${type}`,
    errorCode: null,
    errorMessage: null,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now
  };

  return {
    task,
    skill: getAiSkill(type),
    config: getAiTaskConfig(type)
  };
}

function createRuntimeConfig(baseUrl: string, model = "mimo-v2.5-pro") {
  return {
    provider: "openai_compatible" as const,
    baseUrl,
    apiKey: "fake-key",
    model,
    supportsVision: false,
    source: "env" as const,
    activeProfileId: null,
    activeProfileName: null,
    apiKeyEnvName: "LIGHTQUANT_AI_API_KEY" as const,
    apiKeySecretId: null,
    apiKeySource: "env" as const
  };
}

function createFinalMarkdownForTask(type: "strategy_generation" | "code_conversion" | "code_analysis") {
  if (type === "strategy_generation") {
    return "## 完整策略代码\n```python\nprint('deepseek strategy')\n```";
  }

  if (type === "code_analysis") {
    return [
      "## 策略概览",
      "- 策略名称：",
      "  1. 代码中未明确给出",
      "## 交易逻辑",
      "- 初始化：",
      "  1. 代码中未明确给出",
      "## 关键参数",
      "- 观察周期：",
      "  1. 代码中未明确给出",
      "## 风险提醒",
      "- 交易可达性风险：",
      "  1. 代码中未明确给出",
      "## 优化建议",
      "- 回测验证：",
      "  1. 代码中未明确给出"
    ].join("\n");
  }

  return "## 目标平台代码\n```python\nprint('deepseek conversion')\n```\n\n## 迁移说明\n已完成最小转换。";
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

async function handleSseRequest(
  request: IncomingMessage,
  response: ServerResponse,
  expectedThinkingType: "enabled" | "disabled",
  writeBody: () => void
) {
  try {
    const payload = readRecord(JSON.parse(await readRequestBody(request)));
    const thinking = readRecord(payload?.thinking);

    expect(`thinking ${expectedThinkingType}`, thinking?.type === expectedThinkingType);
    writeSseHeaders(response);
    writeBody();
  } catch (error) {
    response.statusCode = 500;
    response.end(error instanceof Error ? error.message : String(error));
  }
}

function writeSseHeaders(response: ServerResponse) {
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache"
  });
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
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

function expect(label: string, condition: unknown) {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}
