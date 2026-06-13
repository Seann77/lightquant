import { existsSync, readFileSync } from "node:fs";
import { parse as parseDotenv } from "dotenv";

loadEnvFile(".env");
loadEnvFile(".env.local");

const baseUrl = (process.env.SMOKE_PAYMENT_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const maintenanceSecret = normalize(process.env.SMOKE_MAINTENANCE_SECRET) || normalize(process.env.MAINTENANCE_SECRET);

console.log("LightQuant local payment maintenance smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      maintenanceSecretConfigured: Boolean(maintenanceSecret),
      note:
        "This smoke verifies close-expired maintenance access control. It does not print secrets. With a configured maintenance secret it may close already-expired PENDING orders."
    },
    null,
    2
  )
);

try {
  const unauthorized = await request("POST", "/api/v1/payments/maintenance/close-expired", null, {});
  assertApiError("close-expired-unauthorized", unauthorized, "MAINTENANCE_UNAUTHORIZED");

  let authorizedSummary = null;

  if (maintenanceSecret) {
    const authorized = await request("POST", "/api/v1/payments/maintenance/close-expired", null, {
      "x-maintenance-secret": maintenanceSecret
    });
    assertSuccess("close-expired-authorized", authorized, 200);

    authorizedSummary = {
      closedCount: authorized.json.data.closedCount,
      expireMinutes: authorized.json.data.expireMinutes,
      hasCutoff: typeof authorized.json.data.cutoff === "string",
      hasClosedAt: typeof authorized.json.data.closedAt === "string"
    };
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: {
          unauthorizedWithoutSecretRejected: true,
          authorizedWithSecretChecked: Boolean(maintenanceSecret)
        },
        authorized: authorizedSummary
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

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  Object.assign(process.env, parseDotenv(readFileSync(path)));
}

function request(method, path, body, headers) {
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
              ...headers,
              ...(payload
                ? {
                    "content-type": "application/json",
                    "content-length": payload.length
                  }
                : {})
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

function normalize(value) {
  return String(value || "").trim();
}
