const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const includeAi = process.env.SMOKE_DB_INCLUDE_AI === "true";
const pollIntervalMs = Number(process.env.SMOKE_AI_POLL_INTERVAL_MS || "3000");
const pollTimeoutMs = Number(process.env.SMOKE_AI_POLL_TIMEOUT_MS || String(5 * 60 * 1000));

let cookie = "";

console.log("LightQuant database-mode MVP smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      includeAi,
      note:
        "Run this against a server started with npm run dev:database:mock:3010 after db:migrate and db:seed. If includeAi=true and the server uses a real AI provider, it may consume credits."
    },
    null,
    2
  )
);

try {
  const phone = `1586860${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

  const unauthorizedMe = await request("GET", "/api/v1/me");
  assertStatus("unauthorized-me", unauthorizedMe, [401]);

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

  const userId = login.json.data.user.id;
  const signupBalance = login.json.data.creditAccount.balance;
  assertEqual("signup-bonus-balance", signupBalance, 500);

  assertSuccess(
    "repeat-sms-code",
    await request("POST", "/api/v1/auth/sms-code", {
      phone,
      scene: "login"
    }),
    200
  );

  const repeatedLogin = await request("POST", "/api/v1/auth/login", {
    phone,
    code: "123456",
    acceptedLegal: true
  });
  assertSuccess("repeat-login", repeatedLogin, 200);
  assertEqual("repeat-login-no-extra-bonus", repeatedLogin.json.data.creditAccount.balance, 500);

  const plans = await request("GET", "/api/v1/recharge/plans");
  assertSuccess("recharge-plans", plans, 200);
  const plan = plans.json.data.items?.[0];

  if (!plan) {
    throw new Error("recharge-plans failed: no seed plan returned");
  }

  const unavailableRealChannel = await request("POST", "/api/v1/orders/recharge", {
    planId: plan.id,
    payChannel: "alipay",
    clientRequestId: `smoke-alipay-unavailable-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  assertApiError("real-channel-disabled", unavailableRealChannel, "PAYMENT_CONFIG_ERROR");

  const mismatchOrderResponse = await request("POST", "/api/v1/orders/recharge", {
    planId: plan.id,
    payChannel: "mock",
    clientRequestId: `smoke-recharge-mismatch-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  assertSuccess("create-mismatch-order", mismatchOrderResponse, 200);
  const mismatchOrder = mismatchOrderResponse.json.data.order;
  const mismatchNotify = await request("POST", "/api/v1/payments/mock/notify", {
    orderId: mismatchOrder.id,
    mockTradeNo: `SMOKE-MISMATCH-${mismatchOrder.orderNo}`,
    amountCents: mismatchOrder.amountCents + 1
  });
  assertApiError("mock-notify-amount-mismatch", mismatchNotify, "PAYMENT_AMOUNT_MISMATCH");

  const accountAfterMismatch = await request("GET", "/api/v1/credits/account");
  assertSuccess("credits-account-after-mismatch", accountAfterMismatch, 200);
  assertEqual("mismatch-does-not-credit", accountAfterMismatch.json.data.account.balance, 500);

  const clientRequestId = `smoke-recharge-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const orderResponse = await request("POST", "/api/v1/orders/recharge", {
    planId: plan.id,
    payChannel: "mock",
    clientRequestId
  });
  assertSuccess("create-recharge-order", orderResponse, 200);
  const order = orderResponse.json.data.order;
  assertEqual("order-status", order.status, "PENDING");

  const duplicateOrder = await request("POST", "/api/v1/orders/recharge", {
    planId: plan.id,
    payChannel: "mock",
    clientRequestId
  });
  assertSuccess("duplicate-recharge-order", duplicateOrder, 200);
  assertEqual("duplicate-order-id", duplicateOrder.json.data.order.id, order.id);

  const tradeNo = `SMOKE-${order.orderNo}`;
  const notify = await request("POST", "/api/v1/payments/mock/notify", {
    orderId: order.id,
    mockTradeNo: tradeNo,
    amountCents: order.amountCents
  });
  assertSuccess("mock-notify", notify, 200);
  assertEqual("paid-order-status", notify.json.data.order.status, "PAID");

  const paidStatus = await request("GET", `/api/v1/payments/${encodeURIComponent(order.id)}/status`);
  assertSuccess("paid-payment-status", paidStatus, 200);
  assertEqual("payment-status-paid", paidStatus.json.data.payment.paid, true);
  assertEqual("payment-status-credit-granted", paidStatus.json.data.payment.creditGranted, true);
  assertEqual("payment-status-channel", paidStatus.json.data.payment.channel, "mock");
  assertEqual("payment-status-amount", paidStatus.json.data.payment.amountCents, order.amountCents);

  if (!paidStatus.json.data.payment.expiresAt || typeof paidStatus.json.data.payment.expired !== "boolean") {
    throw new Error("paid-payment-status failed: missing expiresAt or expired fields");
  }

  const duplicateNotify = await request("POST", "/api/v1/payments/mock/notify", {
    orderId: order.id,
    mockTradeNo: tradeNo,
    amountCents: order.amountCents
  });
  assertSuccess("duplicate-mock-notify", duplicateNotify, 200);
  assertEqual("duplicate-notify-credit", duplicateNotify.json.data.credit.duplicated, true);

  const accountAfterRecharge = await request("GET", "/api/v1/credits/account");
  assertSuccess("credits-account-after-recharge", accountAfterRecharge, 200);
  const expectedRechargeBalance = 500 + order.totalPoints;
  assertEqual("recharge-balance", accountAfterRecharge.json.data.account.balance, expectedRechargeBalance);

  const ledgerAfterRecharge = await request("GET", "/api/v1/credits/ledger?page=1&pageSize=20");
  assertSuccess("credits-ledger-after-recharge", ledgerAfterRecharge, 200);
  assertLedgerHas("signup-ledger", ledgerAfterRecharge.json.data.items, "signup_bonus");
  assertLedgerHas("recharge-ledger", ledgerAfterRecharge.json.data.items, "recharge");

  let aiSummary = null;

  if (includeAi) {
    aiSummary = await runAiSmoke(expectedRechargeBalance);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId,
        phoneMasked: `${phone.slice(0, 3)}****${phone.slice(-4)}`,
        signupBalance,
        recharge: {
          planId: plan.id,
          orderId: order.id,
          orderNo: order.orderNo,
          totalPoints: order.totalPoints,
          balanceAfter: accountAfterRecharge.json.data.account.balance
        },
        ai: aiSummary
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

async function runAiSmoke(balanceBefore) {
  const clientRequestId = `smoke-ai-db-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const created = await request("POST", "/api/v1/ai/tasks", {
    type: "strategy_generation",
    targetPlatform: "PTrade",
    prompt: "Generate a simple PTrade moving average strategy with risk controls.",
    clientRequestId
  });
  assertSuccess("create-ai-task", created, [200, 202]);

  const completed = created.json.data.result ? created.json.data : await pollTaskResult(created.json.data.task.id);
  const accountAfterAi = await request("GET", "/api/v1/credits/account");
  assertSuccess("credits-account-after-ai", accountAfterAi, 200);
  assertEqual("ai-balance", accountAfterAi.json.data.account.balance, balanceBefore - 50);

  return {
    taskId: completed.task.id,
    status: completed.task.status,
    model: completed.result?.model ?? null,
    tokenUsage: completed.result?.tokenUsage ?? null,
    balanceAfter: accountAfterAi.json.data.account.balance
  };
}

async function pollTaskResult(taskId) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < pollTimeoutMs) {
    await delay(pollIntervalMs);

    const response = await request("GET", `/api/v1/ai/tasks/${encodeURIComponent(taskId)}/result`);
    assertSuccess("poll-ai-task", response, 200);
    const data = response.json.data;

    if (data.result || data.task.status === "SUCCEEDED") {
      return data;
    }

    if (data.task.status === "FAILED" || data.task.status === "CANCELLED") {
      throw new Error(`AI task ended with ${data.task.status}: ${data.task.errorCode ?? "UNKNOWN"}`);
    }
  }

  throw new Error("AI task did not complete before timeout");
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
                // Keep raw text for assertion errors.
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

function assertStatus(step, response, expectedStatus) {
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  if (!expected.includes(response.status)) {
    throw new Error(`${step} failed: status=${response.status}, body=${response.text.slice(0, 240)}`);
  }
}

function assertSuccess(step, response, expectedStatus) {
  assertStatus(step, response, expectedStatus);

  if (!response.json?.success) {
    throw new Error(`${step} failed: body=${response.text.slice(0, 240)}`);
  }
}

function assertApiError(step, response, expectedCode) {
  if (response.json?.success !== false || response.json?.error?.code !== expectedCode) {
    throw new Error(`${step} failed: expected error ${expectedCode}, status=${response.status}, body=${response.text.slice(0, 240)}`);
  }
}

function assertEqual(step, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}

function assertLedgerHas(step, items, scene) {
  if (!Array.isArray(items) || !items.some((item) => item.scene === scene)) {
    throw new Error(`${step} failed: missing ledger scene ${scene}`);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
