const baseUrl = (process.env.SMOKE_PAYMENT_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const payChannel = "alipay";

let cookie = "";

console.log("LightQuant local Alipay pending-order smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      payChannel,
      note:
        "This smoke logs in with mock SMS, creates one pending Alipay recharge order, verifies paymentAction/status, and does not open the cashier, call notify, or grant credits."
    },
    null,
    2
  )
);

try {
  const phone = `1586870${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
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
  assertPaymentChannelEnabled("plans-alipay-enabled", plans.json.data.paymentChannels, payChannel);

  const plan = plans.json.data.items?.[0];

  if (!plan) {
    throw new Error("recharge-plans failed: no plan returned");
  }

  const clientRequestId = `smoke-alipay-order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  assertEqual("order-channel", order.payChannel, payChannel);
  assertEqual("order-amount-snapshot", order.amountCents, plan.priceCents);
  assertEqual("order-points-snapshot", order.totalPoints, plan.totalPoints);
  assertEqual("payment-action-type", paymentAction.type, "redirect");
  assertEqual("payment-action-channel", paymentAction.payChannel, payChannel);
  assertEqual("payment-action-order-id", paymentAction.orderId, order.id);
  assertEqual("payment-action-order-no", paymentAction.orderNo, order.orderNo);

  const redirect = describeAlipayRedirect(paymentAction.redirectUrl);

  if (!redirect.valid || redirect.method !== "alipay.trade.page.pay" || !redirect.hasSign || !redirect.hasNotifyUrl) {
    throw new Error(`payment-action-redirect failed: ${JSON.stringify(redirect)}`);
  }

  const status = await request("GET", `/api/v1/payments/${encodeURIComponent(order.id)}/status`);
  assertSuccess("payment-status", status, 200);
  assertEqual("status-order", status.json.data.order.status, "PENDING");
  assertEqual("status-channel", status.json.data.payment.channel, payChannel);
  assertEqual("status-provider", status.json.data.payment.provider, payChannel);
  assertEqual("status-paid", status.json.data.payment.paid, false);
  assertEqual("status-credit", status.json.data.payment.creditGranted, false);
  assertEqual("status-amount", status.json.data.payment.amountCents, order.amountCents);
  assertMissing("status-provider-trade-no-hidden", status.json.data.payment, "providerTradeNo");
  assertMissing("status-notify-id-hidden", status.json.data.payment, "notifyId");

  const duplicate = await request("POST", "/api/v1/orders/recharge", {
    planId: plan.id,
    payChannel,
    clientRequestId
  });
  assertSuccess("duplicate-alipay-order", duplicate, 200);
  assertEqual("duplicate-order-id", duplicate.json.data.order.id, order.id);
  assertEqual("duplicate-flag", duplicate.json.data.duplicated, true);

  const accountAfter = await request("GET", "/api/v1/credits/account");
  assertSuccess("credits-account-after-pending-order", accountAfter, 200);
  assertEqual("pending-order-does-not-credit", accountAfter.json.data.account.balance, balanceBefore);

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
          status: order.status,
          amountCents: order.amountCents,
          totalPoints: order.totalPoints,
          expiresAt: order.expiresAt
        },
        paymentAction: {
          type: paymentAction.type,
          channel: paymentAction.payChannel,
          redirectHostType: redirect.hostType,
          notifyPath: redirect.notifyPath,
          returnPath: redirect.returnPath
        },
        rechargePlans: {
          defaultPayChannel: plans.json.data.defaultPayChannel,
          enabledChannel: payChannel
        },
        duplicatedOrderReturnedSameId: true,
        noCreditsGrantedBeforeNotify: true
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

function describeAlipayRedirect(value) {
  if (!value || typeof value !== "string") {
    return {
      valid: false
    };
  }

  try {
    const url = new URL(value);

    return {
      valid: true,
      hostType: url.hostname.endsWith(".alipay.com") ? "alipay" : "other",
      protocol: url.protocol,
      method: url.searchParams.get("method"),
      signType: url.searchParams.get("sign_type"),
      hasSign: Boolean(url.searchParams.get("sign")),
      hasNotifyUrl: Boolean(url.searchParams.get("notify_url")),
      hasReturnUrl: Boolean(url.searchParams.get("return_url")),
      notifyPath: getPath(url.searchParams.get("notify_url")),
      returnPath: getPath(url.searchParams.get("return_url"))
    };
  } catch {
    return {
      valid: false
    };
  }
}

function getPath(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).pathname;
  } catch {
    return null;
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

function assertMissing(step, object, field) {
  if (object && Object.prototype.hasOwnProperty.call(object, field)) {
    throw new Error(`${step} failed: field ${field} should not be returned to ordinary payment status responses`);
  }
}

function assertPaymentChannelEnabled(step, channels, channel) {
  const item = Array.isArray(channels) ? channels.find((entry) => entry.id === channel) : null;

  if (!item?.enabled) {
    throw new Error(`${step} failed: channel=${channel}, channels=${JSON.stringify(channels)}`);
  }
}
