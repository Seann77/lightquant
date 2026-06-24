import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true, override: true });

const baseUrl = (process.env.SMOKE_ADMIN_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const adminPhones = String(process.env.ADMIN_PHONE_WHITELIST || "")
  .split(",")
  .map((phone) => phone.trim())
  .filter(Boolean);

console.log("LightQuant local admin permission smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      adminWhitelistConfigured: adminPhones.length > 0,
      note:
        "This test verifies admin API read-only access control with mock SMS login. It masks phone numbers and does not mutate business data."
    },
    null,
    2
  )
);

try {
  const unauthenticated = await createClient().requestJson("GET", "/api/v1/admin/overview");
  assertFailure("unauthenticated-admin-overview", unauthenticated, "UNAUTHORIZED");

  const nonAdminPhone = createNonAdminPhone(adminPhones);
  const nonAdminClient = createClient();
  await login(nonAdminClient, nonAdminPhone);
  const nonAdminOverview = await nonAdminClient.requestJson("GET", "/api/v1/admin/overview");
  assertFailure("non-admin-overview", nonAdminOverview, "NOT_FOUND");

  const result = {
    ok: true,
    unauthenticated: {
      status: unauthenticated.status,
      code: unauthenticated.json.error.code
    },
    nonAdmin: {
      phoneMasked: maskPhone(nonAdminPhone),
      status: nonAdminOverview.status,
      code: nonAdminOverview.json.error.code
    },
    admin: null
  };

  if (adminPhones.length > 0) {
    const adminPhone = adminPhones[0];
    const adminClient = createClient();
    await login(adminClient, adminPhone);

    const endpoints = [
      "/api/v1/admin/overview",
      "/api/v1/admin/users?page=1&pageSize=5",
      "/api/v1/admin/orders?page=1&pageSize=5",
      "/api/v1/admin/ai-tasks?page=1&pageSize=5",
      "/api/v1/admin/files?page=1&pageSize=5"
    ];
    const checks = [];

    for (const endpoint of endpoints) {
      const response = await adminClient.requestJson("GET", endpoint);
      assertSuccess(`admin-${endpoint}`, response, 200);
      checks.push({
        endpoint,
        status: response.status,
        success: response.json.success,
        shape: summarizeAdminResponse(endpoint, response.json.data)
      });
    }

    result.admin = {
      phoneMasked: maskPhone(adminPhone),
      checks
    };
  }

  console.log(JSON.stringify(result, null, 2));
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

function createClient() {
  let cookie = "";

  return {
    async requestJson(method, path, body) {
      const headers = {
        ...(body ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie } : {})
      };
      const response = await fetch(new URL(path, baseUrl), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      const setCookies = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")]
          : [];

      if (setCookies.length > 0) {
        cookie = setCookies.map((value) => value.split(";")[0]).join("; ");
      }

      const text = await response.text();
      let json = null;

      try {
        json = JSON.parse(text);
      } catch {
        // Keep raw text for assertion errors.
      }

      return {
        status: response.status,
        json,
        text
      };
    }
  };
}

async function login(client, phone) {
  assertSuccess(
    "sms-code",
    await client.requestJson("POST", "/api/v1/auth/sms-code", {
      phone,
      scene: "login"
    }),
    200
  );

  assertSuccess(
    "login",
    await client.requestJson("POST", "/api/v1/auth/login", {
      phone,
      code: "123456",
      acceptedLegal: true
    }),
    200
  );
}

function assertSuccess(step, response, expectedStatus) {
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  if (!expected.includes(response.status) || !response.json?.success) {
    throw new Error(`${step} failed: status=${response.status}, body=${response.text.slice(0, 240)}`);
  }
}

function assertFailure(step, response, code) {
  if (response.json?.success !== false || response.json.error?.code !== code) {
    throw new Error(`${step} expected ${code}, got status=${response.status}, body=${response.text.slice(0, 240)}`);
  }
}

function summarizeAdminResponse(endpoint, data) {
  if (endpoint.includes("/overview")) {
    return {
      keys: Object.keys(data).sort()
    };
  }

  return {
    itemsIsArray: Array.isArray(data.items),
    page: data.page,
    pageSize: data.pageSize,
    totalType: typeof data.total,
    totalPages: data.totalPages
  };
}

function createNonAdminPhone(adminWhitelist) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const phone = `1586861${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    if (!adminWhitelist.includes(phone)) {
      return phone;
    }
  }

  return "15868619999";
}

function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
