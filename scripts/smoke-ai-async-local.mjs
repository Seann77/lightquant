const baseUrl = (process.env.SMOKE_AI_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const pollIntervalMs = Number(process.env.SMOKE_AI_POLL_INTERVAL_MS || "3000");
const pollTimeoutMs = Number(process.env.SMOKE_AI_POLL_TIMEOUT_MS || String(5 * 60 * 1000));
const expectedCost = 50;

let cookie = "";

console.log("LightQuant local AI async smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      taskType: "strategy_generation",
      note: "This test creates one AI task against the running local server. If the server uses a real provider, it may consume credits."
    },
    null,
    2
  )
);

const phone = `1586858${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
const clientRequestId = `smoke-ai-${Date.now()}-${Math.random().toString(16).slice(2)}`;

try {
  const sms = await request("POST", "/api/v1/auth/sms-code", {
    phone,
    scene: "login"
  });
  assertSuccess("sms-code", sms, 200);

  const login = await request("POST", "/api/v1/auth/login", {
    phone,
    code: "123456",
    acceptedLegal: true
  });
  assertSuccess("login", login, 200);

  const balanceBefore = login.json.data.creditAccount.balance;
  const createStartedAt = Date.now();
  const created = await request("POST", "/api/v1/ai/tasks", {
    type: "strategy_generation",
    targetPlatform: "PTrade",
    prompt: "请生成一个 PTrade 双均线量化交易策略：5 日均线上穿 20 日均线买入，下穿卖出，包含初始化、行情读取、下单和风控提示。",
    clientRequestId
  });
  assertSuccess("create-ai-task", created, [200, 202]);

  const taskId = created.json.data.task.id;

  console.log(
    JSON.stringify(
      {
        step: "created",
        statusCode: created.status,
        createMs: Date.now() - createStartedAt,
        taskId,
        taskStatus: created.json.data.task.status,
        hasResult: Boolean(created.json.data.result),
        balanceBefore
      },
      null,
      2
    )
  );

  const completed = created.json.data.result ? created.json.data : await pollTaskResult(taskId);
  const me = await request("GET", "/api/v1/me");
  assertSuccess("me", me, 200);
  const balanceAfter = me.json.data.creditAccount.balance;

  if (completed.task.status !== "SUCCEEDED" || !completed.result) {
    throw new Error(`AI task did not succeed: status=${completed.task.status}`);
  }

  if (balanceAfter !== balanceBefore - expectedCost) {
    throw new Error(`AI credit deduction mismatch: before=${balanceBefore}, after=${balanceAfter}, expectedCost=${expectedCost}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        taskId,
        taskStatus: completed.task.status,
        scopeStatus: completed.result?.scopeStatus ?? null,
        model: completed.result?.model ?? null,
        tokenUsage: completed.result?.tokenUsage ?? null,
        generatedCodeLength: completed.result?.generatedCode?.length ?? 0,
        expectedCost,
        balanceAfter
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
