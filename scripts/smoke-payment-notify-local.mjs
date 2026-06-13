const baseUrl = (process.env.SMOKE_PAYMENT_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");

console.log("LightQuant local payment notify smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      note:
        "This smoke sends intentionally invalid local payment notifications. It does not log in, create orders, call payment providers, or grant credits."
    },
    null,
    2
  )
);

try {
  const me = await request("GET", "/api/v1/me");

  if (me.status !== 401 || me.json?.error?.code !== "UNAUTHORIZED") {
    throw new Error(`server-health failed: expected unauthenticated /me, status=${me.status}, body=${me.text.slice(0, 240)}`);
  }

  const unique = `${Date.now()}${Math.random().toString(16).slice(2)}`;
  const alipay = await requestForm("/api/v1/payments/alipay/notify", {
    app_id: "invalid-app-id",
    out_trade_no: `LQINVALID${unique}`,
    trade_no: `ALIINVALID${unique}`,
    notify_id: `ALI_NOTIFY_INVALID_${unique}`,
    trade_status: "TRADE_SUCCESS",
    total_amount: "0.01",
    sign_type: "RSA2",
    sign: "invalid-signature"
  });

  if (alipay.status !== 200 || alipay.text.trim() !== "failure") {
    throw new Error(`alipay-invalid-notify failed: status=${alipay.status}, body=${alipay.text.slice(0, 240)}`);
  }

  const wechat = await requestRaw("POST", "/api/v1/payments/wechat/notify", "{}", {
    "content-type": "application/json"
  });

  if (wechat.status !== 200 || wechat.json?.code !== "FAIL") {
    throw new Error(`wechat-invalid-notify failed: status=${wechat.status}, body=${wechat.text.slice(0, 240)}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: {
          serverUnauthorizedMe: true,
          alipayInvalidNotifyReturnsFailure: true,
          wechatInvalidNotifyReturnsFail: true
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

function request(method, path) {
  return requestRaw(method, path, null, {});
}

function requestForm(path, fields) {
  const body = new URLSearchParams(fields).toString();

  return requestRaw("POST", path, body, {
    "content-type": "application/x-www-form-urlencoded",
    "content-length": Buffer.byteLength(body)
  });
}

function requestRaw(method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = typeof body === "string" ? Buffer.from(body) : null;
    const transport = url.protocol === "https:" ? import("node:https") : import("node:http");

    transport
      .then((module) => {
        const req = module.request(
          url,
          {
            method,
            headers: {
              ...headers,
              ...(payload && !headers["content-length"] ? { "content-length": payload.length } : {})
            }
          },
          (res) => {
            let text = "";

            res.on("data", (chunk) => {
              text += chunk;
            });
            res.on("end", () => {
              let json = null;

              try {
                json = JSON.parse(text);
              } catch {
                // Some payment callbacks intentionally return plain text.
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
