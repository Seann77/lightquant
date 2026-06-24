import { config as loadEnv } from "dotenv";
import type { LightQuantRepository } from "@/server/repositories/types";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true, override: true });

const baseUrl = (process.env.SMOKE_CONTACT_BASE_URL || process.env.SMOKE_ADMIN_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const adminPhones = String(process.env.ADMIN_PHONE_WHITELIST || "")
  .split(",")
  .map((phone) => phone.trim())
  .filter(Boolean);
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const source = `/smoke/contact/${runId}`;
const requestIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

console.log("LightQuant local contact request smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      adminWhitelistConfigured: adminPhones.length > 0,
      source,
      note: "This test creates local/database contact request rows only and masks phone numbers."
    },
    null,
    2
  )
);

main().catch((error) => {
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
});

async function main() {
  const { createSessionToken } = await import("@/server/auth/session");
  const { getRepository } = await import("@/server/repositories");

  if (adminPhones.length === 0) {
    throw new Error("ADMIN_PHONE_WHITELIST is required for admin contact request verification");
  }

  const repository = getRepository();
  const adminUser = await repository.findUserByPhone(adminPhones[0]);

  if (!adminUser || adminUser.status !== "active") {
    throw new Error("Configured admin phone must have an active local user before running this smoke");
  }

  const contactPhone = createNonAdminPhone(adminPhones);
  const contactUser = await ensureSmokeUser(repository, contactPhone);
  const anonymousClient = createClient();
  const anonymousSubmit = await anonymousClient.requestJson("POST", "/api/v1/contact-requests", createContactPayload(contactPhone, 0), {
    "x-forwarded-for": requestIp
  });

  assertFailure("anonymous-contact-submit", anonymousSubmit, "UNAUTHORIZED");

  const userClient = createClient(createSessionToken(contactUser.id));
  const firstSubmit = await userClient.requestJson("POST", "/api/v1/contact-requests", createContactPayload(contactPhone, 1), {
    "x-forwarded-for": requestIp
  });
  assertSuccess("authenticated-contact-submit", firstSubmit, 200);

  for (let index = 2; index <= 10; index += 1) {
    assertSuccess(
      `authenticated-contact-submit-${index}`,
      await userClient.requestJson("POST", "/api/v1/contact-requests", createContactPayload(contactPhone, index), {
        "x-forwarded-for": requestIp
      }),
      200
    );
  }

  const rateLimitedSubmit = await userClient.requestJson("POST", "/api/v1/contact-requests", createContactPayload(contactPhone, 11), {
    "x-forwarded-for": requestIp
  });
  assertFailure("contact-submit-rate-limited", rateLimitedSubmit, "RATE_LIMITED");

  const adminClient = createClient(createSessionToken(adminUser.id));
  const adminList = await adminClient.requestJson(
    "GET",
    `/api/v1/admin/contact-requests?page=1&pageSize=20&keyword=${encodeURIComponent(contactPhone)}&source=${encodeURIComponent(source)}`
  );
  assertSuccess("admin-contact-request-list", adminList, 200);
  assertAdminListContainsContact(adminList.json.data, contactPhone);

  console.log(
    JSON.stringify(
      {
        ok: true,
        contactPhoneMasked: maskPhone(contactPhone),
        adminPhoneMasked: maskPhone(adminPhones[0]),
        submittedRows: 10,
        rateLimitCode: rateLimitedSubmit.json.error.code
      },
      null,
      2
    )
  );
}

async function ensureSmokeUser(repository: LightQuantRepository, phone: string) {
  const existing = await repository.findUserByPhone(phone);

  if (existing) {
    if (existing.status !== "active") {
      throw new Error("Generated smoke user already exists but is not active");
    }

    return existing;
  }

  const now = new Date().toISOString();

  return repository.createUser({
    phone,
    displayName: `Smoke ${phone.slice(-4)}`,
    inviteCode: `SM${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32),
    referredBy: null,
    createdAt: now,
    lastLoginAt: now
  });
}

function createClient(sessionToken?: string) {
  let cookie = sessionToken ? `lightquant_session=${sessionToken}` : "";

  return {
    async requestJson(method: string, path: string, body?: Record<string, unknown>, extraHeaders: Record<string, string> = {}) {
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
          ? [response.headers.get("set-cookie") as string]
          : [];

      if (setCookies.length > 0) {
        cookie = setCookies.map((value) => value.split(";")[0]).join("; ");
      }

      const text = await response.text();
      let json: any = null;

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

function createContactPayload(phone: string, index: number) {
  return {
    name: "Smoke Test",
    contactMethod: "手机号",
    contactValue: phone,
    category: "使用问题",
    message: `本地留言 smoke 测试 ${runId} #${index}`,
    source
  };
}

function assertSuccess(step: string, response: Awaited<ReturnType<ReturnType<typeof createClient>["requestJson"]>>, expectedStatus: number | number[]) {
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  if (!expected.includes(response.status) || !response.json?.success) {
    throw new Error(`${step} failed: status=${response.status}, body=${response.text.slice(0, 240)}`);
  }
}

function assertFailure(step: string, response: Awaited<ReturnType<ReturnType<typeof createClient>["requestJson"]>>, code: string) {
  if (response.json?.success !== false || response.json.error?.code !== code) {
    throw new Error(`${step} expected ${code}, got status=${response.status}, body=${response.text.slice(0, 240)}`);
  }
}

function assertAdminListContainsContact(data: any, phone: string) {
  if (!data || !Array.isArray(data.items)) {
    throw new Error("admin contact request list expected items array");
  }

  const found = data.items.some((item: any) => item.userPhone === phone && item.source === source);

  if (!found) {
    throw new Error("admin contact request list did not include the submitted contact request");
  }
}

function createNonAdminPhone(adminWhitelist: string[]) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const phone = `1586862${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    if (!adminWhitelist.includes(phone)) {
      return phone;
    }
  }

  return "15868629999";
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
