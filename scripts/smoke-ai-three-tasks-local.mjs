const baseUrl = (process.env.SMOKE_AI_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const pollIntervalMs = Number(process.env.SMOKE_AI_POLL_INTERVAL_MS || "3000");
const pollTimeoutMs = Number(process.env.SMOKE_AI_POLL_TIMEOUT_MS || String(5 * 60 * 1000));

let cookie = "";

const tasks = [
  {
    type: "strategy_generation",
    expectedCost: 50,
    payload: {
      type: "strategy_generation",
      targetPlatform: "PTrade",
      prompt: "生成一个 PTrade 双均线策略：5 日均线上穿 20 日均线买入，下穿卖出，包含初始化、行情读取、下单和风控提示。"
    }
  },
  {
    type: "code_analysis",
    expectedCost: 100,
    payload: {
      type: "code_analysis",
      prompt: "请解析这段策略代码的结构、参数和风险点。",
      inputCode: [
        "def initialize(context):",
        "    g.stock = \"000001.XSHE\"",
        "",
        "def handle_data(context, data):",
        "    pass"
      ].join("\n")
    }
  },
  {
    type: "code_conversion",
    expectedCost: 200,
    payload: {
      type: "code_conversion",
      sourcePlatform: "JoinQuant",
      targetPlatform: "PTrade",
      prompt: "请转换为 PTrade 策略代码，并说明迁移注意事项。",
      inputCode: [
        "def initialize(context):",
        "    set_benchmark(\"000300.XSHG\")",
        "",
        "def handle_data(context, data):",
        "    order_value(\"000001.XSHE\", 10000)"
      ].join("\n")
    }
  }
];
const totalExpectedCost = tasks.reduce((total, task) => total + task.expectedCost, 0);

console.log("LightQuant local AI three-task smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      tasks: tasks.map((task) => ({ type: task.type, expectedCost: task.expectedCost })),
      note:
        "This test creates three AI tasks against the running local server. If the server uses a real provider, it may consume 350 credits."
    },
    null,
    2
  )
);

try {
  const phone = `1586857${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

  assertSuccess(
    "sms-code",
    await request("POST", "/api/v1/auth/sms-code", {
      phone,
      scene: "login"
    }),
    200
  );

  const login = await request("POST", "/api/v1/auth/login", {
    phone,
    code: "123456",
    acceptedLegal: true
  });
  assertSuccess("login", login, 200);

  const balanceBefore = login.json.data.creditAccount.balance;

  console.log(
    JSON.stringify(
      {
        step: "login",
        balanceBefore
      },
      null,
      2
    )
  );

  const results = [];

  for (const task of tasks) {
    const result = await createAndPollTask(task);
    results.push(result);
  }

  const me = await request("GET", "/api/v1/me");
  assertSuccess("me", me, 200);
  const balanceAfter = me.json.data.creditAccount.balance;

  if (balanceAfter !== balanceBefore - totalExpectedCost) {
    throw new Error(`AI credit deduction mismatch: before=${balanceBefore}, after=${balanceAfter}, expectedCost=${totalExpectedCost}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        balanceBefore,
        balanceAfter,
        totalExpectedCost,
        results
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}

async function createAndPollTask(task) {
  const clientRequestId = `smoke-${task.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const createStartedAt = Date.now();
  const created = await request("POST", "/api/v1/ai/tasks", {
    ...task.payload,
    clientRequestId
  });
  assertSuccess(`create-${task.type}`, created, [200, 202]);

  const taskId = created.json.data.task.id;

  console.log(
    JSON.stringify(
      {
        step: "created",
        type: task.type,
        statusCode: created.status,
        createMs: Date.now() - createStartedAt,
        taskId,
        taskStatus: created.json.data.task.status,
        hasResult: Boolean(created.json.data.result)
      },
      null,
      2
    )
  );

  const completed = created.json.data.result ? created.json.data : await pollTaskResult(taskId);
  const result = completed.result;

  if (completed.task.status !== "SUCCEEDED" || !result) {
    throw new Error(`AI task did not succeed: type=${task.type}, status=${completed.task.status}`);
  }

  const summary = {
    type: task.type,
    taskId,
    taskStatus: completed.task.status,
    expectedCost: task.expectedCost,
    actualCost: completed.task.costPoints,
    scopeStatus: result?.scopeStatus ?? null,
    model: result?.model ?? null,
    tokenUsage: result?.tokenUsage ?? null,
    outputLengths: {
      generatedCode: result?.generatedCode?.length ?? 0,
      explanation: result?.explanation?.length ?? 0,
      migrationNotes: result?.migrationNotes?.length ?? 0,
      riskWarnings: result?.riskWarnings?.length ?? 0,
      reportJson: result?.reportJson ? JSON.stringify(result.reportJson).length : 0
    }
  };

  validateTaskSummary(task, summary);

  console.log(
    JSON.stringify(
      {
        step: "completed",
        ...summary
      },
      null,
      2
    )
  );

  return summary;
}

function validateTaskSummary(task, summary) {
  if (summary.actualCost !== task.expectedCost) {
    throw new Error(`AI task cost mismatch: type=${task.type}, actual=${summary.actualCost}, expected=${task.expectedCost}`);
  }

  if (summary.scopeStatus !== "in_scope" && summary.scopeStatus !== "out_of_scope") {
    throw new Error(`AI task returned invalid scopeStatus: type=${task.type}, scopeStatus=${summary.scopeStatus}`);
  }

  if (!summary.model || typeof summary.model !== "string") {
    throw new Error(`AI task did not return a model name: type=${task.type}`);
  }

  if (!summary.tokenUsage || typeof summary.tokenUsage.totalTokens !== "number") {
    throw new Error(`AI task did not return tokenUsage.totalTokens: type=${task.type}`);
  }

  const outputLengthTotal = Object.values(summary.outputLengths).reduce((total, value) => total + (Number(value) || 0), 0);

  if (outputLengthTotal <= 0) {
    throw new Error(`AI task returned no visible output fields: type=${task.type}`);
  }
}

async function pollTaskResult(taskId) {
  const startedAt = Date.now();
  let pollCount = 0;

  while (Date.now() - startedAt < pollTimeoutMs) {
    pollCount += 1;
    await delay(pollIntervalMs);

    const response = await request("GET", `/api/v1/ai/tasks/${encodeURIComponent(taskId)}/result`);
    assertSuccess("poll-ai-task", response, 200);
    const data = response.json.data;

    console.log(
      JSON.stringify(
        {
          step: "poll",
          pollCount,
          taskId,
          taskStatus: data.task.status,
          hasResult: Boolean(data.result),
          errorCode: data.task.errorCode ?? null
        },
        null,
        2
      )
    );

    if (data.result || data.task.status === "SUCCEEDED") {
      return data;
    }

    if (data.task.status === "FAILED" || data.task.status === "CANCELLED") {
      throw new Error(`AI task ended with ${data.task.status}: ${data.task.errorCode ?? "UNKNOWN"}`);
    }
  }

  throw new Error("AI task did not complete before the smoke test timeout");
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = body ? Buffer.from(JSON.stringify(body)) : null;
    const transport = url.protocol === "https:" ? import("node:https") : import("node:http");

    transport
      .then((module) => {
        const req = module.request(
          url,
          {
            method,
            headers: {
              ...(payload
                ? {
                    "content-type": "application/json",
                    "content-length": payload.length
                  }
                : {}),
              ...(cookie ? { cookie } : {})
            }
          },
          (res) => {
            let text = "";

            res.on("data", (chunk) => {
              text += chunk;
            });
            res.on("end", () => {
              const setCookie = res.headers["set-cookie"];

              if (setCookie?.length) {
                cookie = setCookie.map((value) => value.split(";")[0]).join("; ");
              }

              let json = null;

              try {
                json = JSON.parse(text);
              } catch {
                // Keep the raw text for assertion errors.
              }

              resolve({
                status: res.statusCode ?? 0,
                json,
                text
              });
            });
          }
        );

        req.on("error", reject);

        if (payload) {
          req.write(payload);
        }

        req.end();
      })
      .catch(reject);
  });
}

function assertSuccess(step, response, expectedStatus) {
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  if (!expected.includes(response.status) || !response.json?.success) {
    throw new Error(`${step} failed: status=${response.status}, body=${response.text.slice(0, 240)}`);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
