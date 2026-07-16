import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.LIGHTQUANT_AI_PROVIDER = "openai_compatible";
process.env.LIGHTQUANT_AI_API_KEY = "smoke-key";
process.env.LIGHTQUANT_AI_MODEL = "mimo-v2.5-pro";
process.env.LIGHTQUANT_AI_MODEL_MAX_OUTPUT_TOKENS = "100000";
process.env.AI_TASK_TIMEOUT_MS = "3000";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "smoke-auto-repair-secret-with-at-least-32-chars";

type Scenario = "repair-success" | "repair-failure";

async function main() {
  const success = await runScenario("repair-success");
  const failure = await runScenario("repair-failure");

  console.log(JSON.stringify({
      ok: true,
      checked: [
        "strategy_generation truncated result is repaired before final success",
        "code_conversion truncated result fails after one repair attempt",
        "strategy_generation initial stream emits final_delta preview",
        "auto repair does not emit repair-stage final_delta drafts",
        "auto repair confirms the original reservation only on success",
        "auto repair may throw after persisting a failed/refunded task",
        "auto repair releases the original reservation, stores refund diagnostics, and does not expose partial success results on failure",
      "auto repair runs at most once"
    ],
    success,
    failure
  }, null, 2));
}

async function runScenario(scenario: Scenario) {
  globalThis.__lightquantMockRepository = undefined;

  const server = createServer((request, response) => {
    void handleSseRequest(request, response, scenario);
  });
  const baseUrl = await listen(server);

  try {
    process.env.LIGHTQUANT_AI_BASE_URL = baseUrl;

    const { getRepository } = await import("../src/server/repositories");
    const { ensureSignupBonus } = await import("../src/server/credits/credit-service");
    const { createAndStreamAiTask } = await import("../src/server/ai/ai-service");
    const repository = getRepository();
    const user = await repository.createUser({
      phone: `159${Date.now().toString().slice(-8)}`,
      displayName: `Smoke ${scenario}`,
      inviteCode: `AR${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32),
      referredBy: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
    await ensureSignupBonus(user.id, `signup-${scenario}`);
    const accountBefore = await repository.ensureCreditAccount(user.id, new Date().toISOString());
    const events: Array<{ type: string; data?: unknown }> = [];
    let response: Awaited<ReturnType<typeof createAndStreamAiTask>> | null = null;
    let thrown: unknown = null;

    try {
      response = await createAndStreamAiTask(user.id, {
        type: scenario === "repair-success" ? "strategy_generation" : "code_conversion",
        sourcePlatform: scenario === "repair-success" ? undefined : "JoinQuant",
        targetPlatform: "PTrade",
        prompt: scenario === "repair-success"
          ? "请生成一份完整 PTrade 双均线策略，输出完整代码。"
          : "请将下面 JoinQuant 策略转换为完整 PTrade 代码。",
        inputCode: scenario === "repair-success"
          ? undefined
          : [
              "def initialize(context):",
              "    set_benchmark('000300.XSHG')",
              "def handle_data(context, data):",
              "    order_value('000001.XSHE', 10000)"
            ].join("\n"),
        clientRequestId: `auto-repair-${scenario}-${Date.now()}`
      }, `request-${scenario}`, (event) => {
        events.push(event);
      });
    } catch (error) {
      thrown = error;
    }

    const requestCount = getScenarioRequestCount(scenario);
    expect(`${scenario} runs original plus one repair`, requestCount === 2);
    const finalDeltaDraft = events
      .filter((event): event is { type: "final_delta"; delta?: unknown } => event.type === "final_delta")
      .map((event) => event.delta)
      .filter((delta): delta is string => typeof delta === "string")
      .join("");

    if (scenario === "repair-success") {
      expect("strategy initial stream emits final delta preview", finalDeltaDraft.includes("if True:"));
      expect("repair stream hides final delta content", !finalDeltaDraft.includes("order_value"));
      expect("success does not throw", !thrown);
      expect("success response exists", response);
      expect("success task succeeded", response?.task.status === "SUCCEEDED");
      expect("success result exists", response?.result);
      expect("success result is repaired", response?.result?.reportJson?.repairAttempt === 1);
      expect("success result is not partial", response?.result?.reportJson?.partial === false);
      expect("success result is not truncated", response?.result?.reportJson?.truncated === false);
      const reservation = await repository.findCreditReservationByTaskId(response!.task.id);
      const accountAfter = await repository.ensureCreditAccount(user.id, new Date().toISOString());
      expect("success confirms reservation", reservation?.status === "CONFIRMED");
      expect("success deducts once", accountAfter.balance === accountBefore.balance - response!.task.costPoints);

      return {
        taskStatus: response!.task.status,
        reservationStatus: reservation?.status,
        requestCount,
        balanceBefore: accountBefore.balance,
        balanceAfter: accountAfter.balance
      };
    }

    expect("code conversion repair failure hides final delta drafts", !finalDeltaDraft);
    const latestTask = response?.task ?? await findOnlyTask(repository, user.id);
    expect("failure may throw after persisted failure", Boolean(latestTask));
    expect("failure task recorded", latestTask);
    const failedTask = await repository.findAiTaskById(latestTask!.id);
    const result = await repository.findAiTaskResult(latestTask!.id);
    const reservation = await repository.findCreditReservationByTaskId(latestTask!.id);
    const accountAfter = await repository.ensureCreditAccount(user.id, new Date().toISOString());
    expect("failure task failed", failedTask?.status === "FAILED");
    expect("failure stores diagnostic result", result);
    expect("failure result is not exposed as success", !response?.result);
    expect("failure error message mentions refund", failedTask?.errorMessage?.includes("积分已退回"));
    expect("failure result refund metadata", result?.reportJson?.refundApplied === true);
    expect("failure result repair attempted", result?.reportJson?.repairAttempted === true);
    expect("failure result repair not succeeded", result?.reportJson?.repairSucceeded === false);
    expect("failure result physical truncated", result?.reportJson?.integrityStatus === "physical_truncated");
    expect("failure releases reservation", reservation?.status === "RELEASED");
    expect("failure keeps balance", accountAfter.balance === accountBefore.balance);

    return {
      taskStatus: failedTask?.status,
      reservationStatus: reservation?.status,
      hasDiagnosticResult: Boolean(result),
      threwAfterPersistedFailure: Boolean(thrown),
      requestCount,
      balanceBefore: accountBefore.balance,
      balanceAfter: accountAfter.balance
    };
  } finally {
    server.close();
  }
}

const scenarioRequestCounts = new Map<Scenario, number>();

async function handleSseRequest(request: IncomingMessage, response: ServerResponse, scenario: Scenario) {
  await readRequestBody(request);
  const count = getScenarioRequestCount(scenario) + 1;
  scenarioRequestCounts.set(scenario, count);

  writeSseHeaders(response);

  if (count === 1 || scenario === "repair-failure") {
    response.write(streamChunk({
      choices: [
        {
          delta: {
            content: "处理过程：\n1. 识别平台：PTrade。\n\n```python\ndef initialize(context):\n    g.security = '000001.SZ'\n\ndef handle_data(context, data):\n    if True:"
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
        prompt_tokens: 11,
        completion_tokens: 22,
        total_tokens: 33
      }
    }));
    response.write("data: [DONE]\n\n");
    response.end();
    return;
  }

  response.write(streamChunk({
    choices: [
      {
        delta: {
          content: [
            "处理过程：",
            "1. 识别平台：PTrade。",
            "2. 判断任务：完整策略生成。",
            "",
            "```python",
            "def initialize(context):",
            "    g.security = '000001.SZ'",
            "    g.amount = 10000",
            "",
            "def handle_data(context, data):",
            "    price = data[g.security].price",
            "    if price > 0:",
            "        order_value(g.security, g.amount)",
            "```"
          ].join("\n")
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
      prompt_tokens: 21,
      completion_tokens: 42,
      total_tokens: 63
    }
  }));
  response.write("data: [DONE]\n\n");
  response.end();
}

function getScenarioRequestCount(scenario: Scenario) {
  return scenarioRequestCounts.get(scenario) ?? 0;
}

async function findOnlyTask(repository: Awaited<ReturnType<typeof import("../src/server/repositories").getRepository>>, userId: string) {
  const page = await repository.listAiTasks(userId, { page: 1, pageSize: 5 }, {});

  return page.items[0] ?? null;
}

function listen(server: ReturnType<typeof createServer>) {
  return new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("SSE server did not return a TCP address"));
        return;
      }

      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
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

function expect(label: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exitCode = 1;
});
