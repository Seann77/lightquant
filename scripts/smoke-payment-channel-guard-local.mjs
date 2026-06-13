const baseUrl = (process.env.SMOKE_PAYMENT_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");

let cookie = "";

console.log("LightQuant local payment channel guard smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      note:
        "This smoke logs in with mock SMS, reads server payment-channel availability, and verifies disabled payment channels cannot create recharge orders or grant credits."
    },
    null,
    2
  )
);

try {
  const phone = `1586871${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

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

  const plan = plans.json.data.items?.[0];
  const channels = plans.json.data.paymentChannels;
  const disabledChannels = Array.isArray(channels) ? channels.filter((channel) => !channel.enabled).map((channel) => channel.id) : [];

  if (!plan) {
    throw new Error("recharge-plans failed: no plan returned");
  }

  if (disabledChannels.length === 0) {
    throw new Error("payment-channel-guard skipped: no disabled payment channels returned by server");
  }

  const rejectedChannels = [];

  for (const payChannel of disabledChannels) {
    const response = await request("POST", "/api/v1/orders/recharge", {
      planId: plan.id,
      payChannel,
      clientRequestId: `smoke-payment-channel-guard-${payChannel}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    });

    assertApiError(`disabled-channel-${payChannel}`, response, "PAYMENT_CONFIG_ERROR");
    rejectedChannels.push(payChannel);
  }

  const accountAfter = await request("GET", "/api/v1/credits/account");
  assertSuccess("credits-account-after-disabled-channels", accountAfter, 200);
  assertEqual("disabled-channels-do-not-credit", accountAfter.json.data.account.balance, balanceBefore);

  console.log(
    JSON.stringify(
      {
        ok: true,
        phoneMasked: `${phone.slice(0, 3)}****${phone.slice(-4)}`,
        defaultPayChannel: plans.json.data.defaultPayChannel,
        rejectedChannels,
        balanceBefore,
        balanceAfter: accountAfter.json.data.account.balance
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
