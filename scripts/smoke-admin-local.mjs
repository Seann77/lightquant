import { createHmac, randomUUID } from "crypto";
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true, override: true });

const baseUrl = (process.env.SMOKE_ADMIN_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const adminPhones = String(process.env.ADMIN_PHONE_WHITELIST || "")
  .split(",")
  .map((phone) => phone.trim())
  .filter(Boolean);
const adminWriteEnabled = process.env.ADMIN_WRITE_ENABLED === "true";
const adminModelConfigWriteEnabled = process.env.ADMIN_MODEL_CONFIG_WRITE_ENABLED === "true";
const isLocalBaseUrl = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/|$)/.test(baseUrl);
const authMode = process.env.SMOKE_ADMIN_AUTH_MODE || (isLocalBaseUrl ? "direct-session" : "none");
let dbPool = null;

console.log("LightQuant local admin permission smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      adminWhitelistConfigured: adminPhones.length > 0,
      authMode,
      note:
        "This test verifies admin API access control and read/admin-write guards. It masks phone numbers, avoids real SMS unless explicitly enabled, and does not run writes when admin write switches are on."
    },
    null,
    2
  )
);

try {
  const unauthenticated = await createClient().requestJson("GET", "/api/v1/admin/overview");
  assertFailure("unauthenticated-admin-overview", unauthenticated, "UNAUTHORIZED");

  const result = {
    ok: true,
    unauthenticated: {
      status: unauthenticated.status,
      code: unauthenticated.json.error.code
    },
    nonAdmin: null,
    admin: null
  };

  if (isLocalBaseUrl || process.env.SMOKE_INCLUDE_NON_ADMIN === "true") {
    const nonAdminPhone = createNonAdminPhone(adminPhones);
    const nonAdminClient = createClient();
    await authenticate(nonAdminClient, nonAdminPhone, {
      allowCreate: isLocalBaseUrl,
      requestIp: createSmokeIp("198.51.100")
    });
    const nonAdminOverview = await nonAdminClient.requestJson("GET", "/api/v1/admin/overview");
    assertFailure("non-admin-overview", nonAdminOverview, "NOT_FOUND");

    result.nonAdmin = {
      phoneMasked: maskPhone(nonAdminPhone),
      status: nonAdminOverview.status,
      code: nonAdminOverview.json.error.code
    };
  } else {
    result.nonAdmin = {
      skipped: true,
      reason: "Skipped outside local base URL to avoid real SMS or test-user creation."
    };
  }

  if (adminPhones.length > 0) {
    const adminPhone = adminPhones[0];
    const orderPhoneFilter = adminPhone.slice(0, 3);
    const adminClient = createClient();
    await authenticate(adminClient, adminPhone, {
      allowCreate: false,
      requestIp: createSmokeIp("203.0.113")
    });

    const endpoints = [
      "/api/v1/admin/overview",
      "/api/v1/admin/users?page=1&pageSize=5",
      "/api/v1/admin/users?page=1&pageSize=5&createdFrom=2020-01-01&createdTo=2035-01-01",
      "/api/v1/admin/credit-ledger?page=1&pageSize=5",
      "/api/v1/admin/credit-ledger?page=1&pageSize=5&type=bonus&direction=in",
      "/api/v1/admin/orders?page=1&pageSize=5",
      `/api/v1/admin/orders?page=1&pageSize=5&phone=${encodeURIComponent(orderPhoneFilter)}&status=PAID&createdFrom=2020-01-01&createdTo=2035-01-01`,
      "/api/v1/admin/contact-requests?page=1&pageSize=5",
      "/api/v1/admin/model-config",
      "/api/v1/admin/ai-tasks?page=1&pageSize=5",
      "/api/v1/admin/files?page=1&pageSize=5"
    ];
    const checks = [];

    for (const endpoint of endpoints) {
      const response = await adminClient.requestJson("GET", endpoint);
      assertSuccess(`admin-${endpoint}`, response, 200);

      if (endpoint === "/api/v1/admin/overview") {
        assertAdminOverviewShape(response.json.data);
      }

      if (endpoint.includes("/api/v1/admin/credit-ledger")) {
        assertAdminCreditLedgerShape(response.json.data);
      }

      if (endpoint.includes("/api/v1/admin/orders")) {
        assertAdminOrdersShape(response.json.data);
      }

      if (endpoint.includes("/api/v1/admin/contact-requests")) {
        assertAdminContactRequestsShape(response.json.data);
      }

      if (endpoint === "/api/v1/admin/model-config") {
        assertAdminModelConfigShape(response.json.data);
      }

      checks.push({
        endpoint,
        status: response.status,
        success: response.json.success,
        shape: summarizeAdminResponse(endpoint, response.json.data)
      });
    }

    if (adminWriteEnabled) {
      throw new Error("smoke-admin-local requires ADMIN_WRITE_ENABLED=false to avoid mutating shared data");
    }

    if (adminModelConfigWriteEnabled) {
      throw new Error("smoke-admin-local requires ADMIN_MODEL_CONFIG_WRITE_ENABLED=false to avoid mutating model config");
    }

    const blockedAdjustment = await adminClient.requestJson("POST", "/api/v1/admin/credit-adjustments", {
      phone: adminPhone,
      amount: 1,
      reason: "smoke blocked adjustment",
      note: "ADMIN_WRITE_ENABLED=false guard"
    });

    assertFailure("admin-credit-adjustment-write-disabled", blockedAdjustment, "FORBIDDEN");

    checks.push({
      endpoint: "/api/v1/admin/credit-adjustments",
      status: blockedAdjustment.status,
      success: blockedAdjustment.json.success,
      shape: {
        writeGuard: blockedAdjustment.json.error.code
      }
    });

    const blockedModelSwitch = await adminClient.requestJson("POST", "/api/v1/admin/model-config/active-profile", {
      profileId: "00000000-0000-0000-0000-000000000000"
    });

    assertFailure("admin-model-config-write-disabled", blockedModelSwitch, "FORBIDDEN");

    checks.push({
      endpoint: "/api/v1/admin/model-config/active-profile",
      status: blockedModelSwitch.status,
      success: blockedModelSwitch.json.success,
      shape: {
        writeGuard: blockedModelSwitch.json.error.code
      }
    });

    const blockedProfileCreate = await adminClient.requestJson("POST", "/api/v1/admin/model-config/profiles", {
      name: "smoke blocked profile",
      provider: "openai_compatible",
      baseUrl: "https://example.com/v1",
      model: "smoke-model",
      supportsVision: false,
      enabled: false,
      apiKeyEnvName: "LIGHTQUANT_AI_API_KEY",
      apiKeySecretId: null
    });

    assertFailure("admin-model-profile-create-write-disabled", blockedProfileCreate, "FORBIDDEN");

    checks.push({
      endpoint: "/api/v1/admin/model-config/profiles",
      status: blockedProfileCreate.status,
      success: blockedProfileCreate.json.success,
      shape: {
        writeGuard: blockedProfileCreate.json.error.code
      }
    });

    const blockedSecretWrite = await adminClient.requestJson("POST", "/api/v1/admin/model-config/secrets", {
      name: "smoke blocked key",
      provider: "openai_compatible",
      apiKey: "blocked-smoke-key"
    });

    assertFailure("admin-model-secret-write-disabled", blockedSecretWrite, "FORBIDDEN");

    checks.push({
      endpoint: "/api/v1/admin/model-config/secrets",
      status: blockedSecretWrite.status,
      success: blockedSecretWrite.json.success,
      shape: {
        writeGuard: blockedSecretWrite.json.error.code
      }
    });

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
} finally {
  await closeDbPool();
}

function createClient(sessionToken) {
  let cookie = "";

  if (sessionToken) {
    cookie = `lightquant_session=${sessionToken}`;
  }

  return {
    setSessionToken(sessionToken) {
      cookie = `lightquant_session=${sessionToken}`;
    },
    async requestJson(method, path, body, extraHeaders = {}) {
      const headers = {
        ...(body ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
        ...extraHeaders
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

async function authenticate(client, phone, { allowCreate, requestIp }) {
  if (process.env.SMOKE_ADMIN_SESSION_TOKEN && phone === adminPhones[0]) {
    client.setSessionToken(process.env.SMOKE_ADMIN_SESSION_TOKEN.trim());
    return;
  }

  if (authMode === "direct-session") {
    const user = await ensureSmokeUser(phone, allowCreate);

    client.setSessionToken(createSessionToken(user.id));
    return;
  }

  if (authMode === "sms") {
    if (!isLocalBaseUrl && process.env.SMOKE_ALLOW_REAL_SMS !== "true") {
      throw new Error("Refusing to send real SMS for admin smoke. Set SMOKE_ALLOW_REAL_SMS=true only when this is intended.");
    }

    await loginBySms(client, phone, requestIp);
    return;
  }

  throw new Error("Authenticated admin smoke skipped because SMOKE_ADMIN_AUTH_MODE is not configured for this base URL.");
}

async function loginBySms(client, phone, requestIp) {
  const headers = requestIp ? { "x-forwarded-for": requestIp } : {};

  assertSuccess(
    "sms-code",
    await client.requestJson("POST", "/api/v1/auth/sms-code", {
      phone,
      scene: "login"
    }, headers),
    200
  );

  assertSuccess(
    "login",
    await client.requestJson("POST", "/api/v1/auth/login", {
      phone,
      code: "123456",
      acceptedLegal: true
    }, headers),
    200
  );
}

async function ensureSmokeUser(phone, allowCreate) {
  const existing = await findUserByPhone(phone);

  if (existing) {
    if (existing.status !== "active") {
      throw new Error("Smoke user exists but is not active");
    }

    return existing;
  }

  if (!allowCreate) {
    throw new Error(`Admin smoke user ${maskPhone(phone)} does not exist locally`);
  }

  return createSmokeUser(phone);
}

async function findUserByPhone(phone) {
  const result = await getDbPool().query(
    'select id, phone, status from "users" where "phone" = $1 limit 1',
    [phone]
  );

  return result.rows[0] ?? null;
}

async function createSmokeUser(phone) {
  const now = new Date();
  const result = await getDbPool().query(
    `insert into "users" ("id", "phone", "display_name", "invite_code", "referred_by", "status", "created_at", "last_login_at")
     values ($1, $2, $3, $4, null, 'active', $5, $5)
     returning id, phone, status`,
    [randomUUID(), phone, `Smoke ${phone.slice(-4)}`, createInviteCode(), now]
  );

  return result.rows[0];
}

function getDbPool() {
  if (!dbPool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for direct-session admin smoke");
    }

    dbPool = new Pool(getPgPoolConfig(databaseUrl));
  }

  return dbPool;
}

function getPgPoolConfig(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const sslmode = parsed.searchParams.get("sslmode");
    const isSupabaseHost = parsed.hostname.includes("supabase.com");
    const shouldUseSsl = sslmode !== "disable" && (Boolean(sslmode) || isSupabaseHost);

    if (!shouldUseSsl) {
      return {
        connectionString: databaseUrl
      };
    }

    parsed.searchParams.delete("sslmode");

    return {
      connectionString: parsed.toString(),
      ssl: {
        rejectUnauthorized: false
      }
    };
  } catch {
    return {
      connectionString: databaseUrl
    };
  }
}

async function closeDbPool() {
  if (dbPool) {
    await dbPool.end();
    dbPool = null;
  }
}

function createSessionToken(userId) {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured for direct-session admin smoke");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId,
    issuedAt: now,
    expiresAt: now + 60 * 60 * 24 * 30
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${createHmac("sha256", secret).update(encodedPayload).digest("base64url")}`;
}

function createInviteCode() {
  return `SM${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 32);
}

function createSmokeIp(prefix) {
  return `${prefix}.${Math.floor(Math.random() * 200) + 1}`;
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
      keys: Object.keys(data).sort(),
      totals: {
        users: typeof data.totals?.users,
        paidUsers: typeof data.totals?.paidUsers,
        paidConversionRate: typeof data.totals?.paidConversionRate,
        todayPaidOrders: typeof data.totals?.todayPaidOrders,
        todayPaidOrderAmountCents: typeof data.totals?.todayPaidOrderAmountCents,
        paidOrders: typeof data.totals?.paidOrders,
        paidOrderAmountCents: typeof data.totals?.paidOrderAmountCents
      }
    };
  }

  if (endpoint.includes("/model-config")) {
    return {
      currentKeys: Object.keys(data.current ?? {}).sort(),
      profilesIsArray: Array.isArray(data.profiles),
      secretsIsArray: Array.isArray(data.secrets),
      keyStatusesIsArray: Array.isArray(data.keyStatuses),
      writeGuards: {
        adminWriteEnabled: typeof data.writeGuards?.adminWriteEnabled,
        modelConfigWriteEnabled: typeof data.writeGuards?.modelConfigWriteEnabled,
        configEncryptionConfigured: typeof data.writeGuards?.configEncryptionConfigured
      }
    };
  }

  return {
    itemsIsArray: Array.isArray(data.items),
    firstItemKeys: Array.isArray(data.items) && data.items[0] ? Object.keys(data.items[0]).sort() : [],
    page: data.page,
    pageSize: data.pageSize,
    totalType: typeof data.total,
    totalPages: data.totalPages,
    ...(endpoint.includes("/api/v1/admin/orders")
      ? {
          summary: {
            filteredOrders: typeof data.summary?.filteredOrders,
            filteredOrderAmountCents: typeof data.summary?.filteredOrderAmountCents,
            filteredPaidOrders: typeof data.summary?.filteredPaidOrders,
            filteredPaidOrderAmountCents: typeof data.summary?.filteredPaidOrderAmountCents
          }
        }
      : {})
  };
}

function assertAdminOverviewShape(data) {
  const totals = data?.totals;

  if (!totals || typeof totals !== "object") {
    throw new Error("admin-overview expected totals object");
  }

  for (const field of [
    "users",
    "paidUsers",
    "paidConversionRate",
    "todayPaidOrders",
    "todayPaidOrderAmountCents",
    "paidOrders",
    "paidOrderAmountCents"
  ]) {
    if (typeof totals[field] !== "number") {
      throw new Error(`admin-overview expected totals.${field} to be number`);
    }
  }
}

function assertAdminCreditLedgerShape(data) {
  if (!data || !Array.isArray(data.items) || typeof data.total !== "number") {
    throw new Error("admin-credit-ledger expected paginated items");
  }

  const [item] = data.items;

  if (!item) {
    return;
  }

  for (const field of ["userPhone", "direction", "type", "amount", "balanceAfter", "sourceType", "sourceId", "remark", "createdAt"]) {
    if (!(field in item)) {
      throw new Error(`admin-credit-ledger expected item.${field}`);
    }
  }
}

function assertAdminOrdersShape(data) {
  if (!data || !Array.isArray(data.items) || typeof data.total !== "number") {
    throw new Error("admin-orders expected paginated items");
  }

  if (!data.summary || typeof data.summary !== "object") {
    throw new Error("admin-orders expected summary object");
  }

  for (const field of ["filteredOrders", "filteredOrderAmountCents", "filteredPaidOrders", "filteredPaidOrderAmountCents"]) {
    if (typeof data.summary[field] !== "number") {
      throw new Error(`admin-orders expected summary.${field} to be number`);
    }
  }
}

function assertAdminContactRequestsShape(data) {
  if (!data || !Array.isArray(data.items) || typeof data.total !== "number") {
    throw new Error("admin-contact-requests expected paginated items");
  }

  const [item] = data.items;

  if (!item) {
    return;
  }

  for (const field of ["userPhone", "name", "contactMethod", "contactValue", "category", "message", "source", "createdAt"]) {
    if (!(field in item)) {
      throw new Error(`admin-contact-requests expected item.${field}`);
    }
  }
}

function assertAdminModelConfigShape(data) {
  if (!data || typeof data !== "object") {
    throw new Error("admin-model-config expected object");
  }

  for (const field of ["current", "profiles", "secrets", "keyStatuses", "writeGuards"]) {
    if (!(field in data)) {
      throw new Error(`admin-model-config expected ${field}`);
    }
  }

  if (!data.current || typeof data.current.provider !== "string" || typeof data.current.model !== "string") {
    throw new Error("admin-model-config expected current provider/model");
  }

  if (typeof data.current.apiKeyConfigured !== "boolean" || typeof data.current.configValid !== "boolean") {
    throw new Error("admin-model-config expected current safe booleans");
  }

  if (!Array.isArray(data.profiles) || !Array.isArray(data.secrets) || !Array.isArray(data.keyStatuses)) {
    throw new Error("admin-model-config expected profiles/secrets/keyStatuses arrays");
  }

  if (
    typeof data.writeGuards.adminWriteEnabled !== "boolean" ||
    typeof data.writeGuards.modelConfigWriteEnabled !== "boolean" ||
    typeof data.writeGuards.configEncryptionConfigured !== "boolean"
  ) {
    throw new Error("admin-model-config expected write guard booleans");
  }
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
