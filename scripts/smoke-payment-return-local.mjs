import { readFileSync } from "node:fs";

const baseUrl = (process.env.SMOKE_PAYMENT_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const payChannel = "alipay";

let cookie = "";

console.log("LightQuant local payment return_url smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      payChannel,
      note:
        "This smoke creates a pending Alipay order, visits the front-end return URL, and verifies return_url does not mark the order paid or grant credits. It does not open Alipay or call notify."
    },
    null,
    2
  )
);

try {
  assertCreditsClientReturnGuard();

  const phone = `1586891${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  const unauthorizedMe = await request("GET", "/api/v1/me");
  assertApiError("unauthorized-me", unauthorizedMe, "UNAUTHORIZED");

  const sms = await request("POST", "/api/v1/auth/sms-code", {
    phone,
    scene: "login"
  });
  assertSuccess("sms-code", sms, 200);

  const code = sms.json?.data?.mockCode || "123456";
  const login = await request("POST", "/api/v1/auth/login", {
    phone,
    code,
    acceptedLegal: true
  });
  assertSuccess("login", login, 200);

  const balanceBefore = login.json.data.creditAccount.balance;
  const plans = await request("GET", "/api/v1/recharge/plans");
  assertSuccess("recharge-plans", plans, 200);
  assertEqual("plans-default-pay-channel", plans.json.data.defaultPayChannel, payChannel);

  const plan = plans.json.data.items?.[0];

  if (!plan) {
    throw new Error("recharge-plans failed: no plan returned");
  }

  const clientRequestId = `smoke-return-url-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const created = await request("POST", "/api/v1/orders/recharge", {
    planId: plan.id,
    payChannel,
    clientRequestId
  });

  if (created.json?.success === false && created.json.error?.code === "PAYMENT_CONFIG_ERROR") {
    throw new Error(
      `create-alipay-order requires the running server to use LIGHTQUANT_PAYMENT_MODE=alipay. Server returned PAYMENT_CONFIG_ERROR: ${created.json.error.message}`
    );
  }

  assertSuccess("create-alipay-order", created, 200);

  const { order, paymentAction } = created.json.data;

  assertEqual("order-status", order.status, "PENDING");
  assertEqual("payment-action-type", paymentAction.type, "redirect");

  const redirectUrl = new URL(paymentAction.redirectUrl);
  const returnUrlValue = redirectUrl.searchParams.get("return_url");

  if (!returnUrlValue) {
    throw new Error("alipay-redirect-url missing return_url");
  }

  const returnUrl = new URL(returnUrlValue);
  assertEqual("return-url-path", returnUrl.pathname, "/credits");
  assertEqual("return-url-payment-return", returnUrl.searchParams.get("paymentReturn"), "1");
  assertEqual("return-url-order-id", returnUrl.searchParams.get("orderId"), order.id);

  const returnVisit = await requestRaw("GET", `${returnUrl.pathname}${returnUrl.search}`);

  assertStatus("credits-return-page", returnVisit, 200);
  assertIncludes("credits-return-page-html", returnVisit.text, "LightQuant");

  const statusAfterReturn = await request("GET", `/api/v1/payments/${encodeURIComponent(order.id)}/status`);
  assertSuccess("payment-status-after-return", statusAfterReturn, 200);
  assertEqual("return-does-not-pay-order", statusAfterReturn.json.data.order.status, "PENDING");
  assertEqual("return-does-not-grant-credit", statusAfterReturn.json.data.payment.creditGranted, false);
  assertEqual("return-payment-not-paid", statusAfterReturn.json.data.payment.paid, false);

  const accountAfter = await request("GET", "/api/v1/credits/account");
  assertSuccess("credits-account-after-return", accountAfter, 200);
  assertEqual("return-does-not-change-balance", accountAfter.json.data.account.balance, balanceBefore);

  console.log(
    JSON.stringify(
      {
        ok: true,
        phoneMasked: `${phone.slice(0, 3)}****${phone.slice(-4)}`,
        balanceBefore,
        balanceAfter: accountAfter.json.data.account.balance,
        order: {
          id: order.id,
          orderNo: order.orderNo,
          statusAfterReturn: statusAfterReturn.json.data.order.status,
          payChannel
        },
        returnPage: {
          status: returnVisit.status,
          parsedFromRedirectUrl: true,
          onlyQueriesStatus: true
        }
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

function assertCreditsClientReturnGuard() {
  const source = readFileSync("src/app/credits/CreditsClient.tsx", "utf8");

  assertIncludes("credits-client-status-endpoint", source, "/api/v1/payments/");
  assertIncludes("credits-client-status-route", source, "/status");
  assertIncludes("credits-client-login-required-message", source, "请登录后继续确认支付状态");
  assertIncludes("credits-client-open-login-event", source, "lightquant:open-login");
  assertIncludes("credits-client-auth-updated-event", source, "lightquant:auth-updated");
  assertIncludes("credits-client-return-order-preserved", source, "getPaymentReturnOrderId");
  assertNotIncludes("credits-client-no-mock-notify", source, "/api/v1/payments/mock/notify");
  assertNotIncludes("credits-client-no-order-create", source, "/api/v1/orders/recharge");
  assertNotIncludes("credits-client-no-direct-credit-write", source, "POST /api/v1/credits");
}

function request(method, path, body) {
  return requestRaw(method, path, body).then((response) => {
    let json = null;

    try {
      json = JSON.parse(response.text);
    } catch {
      // Keep raw text for assertion errors.
    }

    return {
      ...response,
      json
    };
  });
}

function requestRaw(method, path, body) {
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

              resolve({
                status: res.statusCode ?? 0,
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

function assertStatus(step, response, expectedStatus) {
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  if (!expected.includes(response.status)) {
    throw new Error(`${step} failed: status=${response.status}, body=${response.text.slice(0, 240)}`);
  }
}

function assertEqual(step, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}

function assertIncludes(step, value, expected) {
  if (!value.includes(expected)) {
    throw new Error(`${step} failed: expected source to include ${JSON.stringify(expected)}`);
  }
}

function assertNotIncludes(step, value, expected) {
  if (value.includes(expected)) {
    throw new Error(`${step} failed: source should not include ${JSON.stringify(expected)}`);
  }
}
