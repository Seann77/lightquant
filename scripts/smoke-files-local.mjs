import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true, override: true });

const baseUrl = (process.env.SMOKE_FILES_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const maxBytes = Number(process.env.FILE_UPLOAD_MAX_BYTES || "1048576");
let cookie = "";

console.log("LightQuant local file upload smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      note:
        "This test logs in with mock SMS, uploads safe/warning/blocked files, checks validation failures, and verifies BLOCKED fileId is rejected before AI execution. It does not call a real model or print secrets."
    },
    null,
    2
  )
);

try {
  const unauthorized = await uploadFile("unauthorized.py", "print('hi')", {
    purpose: "code_conversion",
    useCookie: false
  });
  assertFailure("unauthorized-upload", unauthorized, "UNAUTHORIZED");

  const phone = `1586860${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

  assertSuccess(
    "sms-code",
    await requestJson("POST", "/api/v1/auth/sms-code", {
      phone,
      scene: "login"
    }),
    200
  );

  const login = await requestJson("POST", "/api/v1/auth/login", {
    phone,
    code: "123456",
    acceptedLegal: true
  });
  assertSuccess("login", login, 200);

  const balanceBefore = login.json.data.creditAccount.balance;
  const safePy = await uploadFile(
    "strategy.py",
    [
      "def initialize(context):",
      "    g.stock = '000001.XSHE'",
      "",
      "def handle_data(context, data):",
      "    pass"
    ].join("\n"),
    {
      purpose: "code_conversion"
    }
  );
  assertUpload("safe-py", safePy, {
    ext: ".py",
    scanStatus: "PASSED"
  });

  const safeTxt = await uploadFile("notes.txt", "PTrade strategy notes\nbuy when ma5 crosses ma20", {
    purpose: "code_analysis"
  });
  assertUpload("safe-txt", safeTxt, {
    ext: ".txt",
    scanStatus: "PASSED"
  });

  const safeLog = await uploadFile("strategy.log", "strategy generated\nrisk checked", {
    purpose: "strategy_generation"
  });
  assertUpload("safe-log", safeLog, {
    ext: ".log",
    scanStatus: "PASSED"
  });

  const warning = await uploadFile("danger.py", "import os\nos.system('echo hello')", {
    purpose: "code_conversion"
  });
  assertUpload("warning-file", warning, {
    ext: ".py",
    scanStatus: "WARNING",
    riskFlag: "OS_SYSTEM"
  });

  const blocked = await uploadFile("secret.py", "api_key = 'sk-test-1234567890'\nprint('redacted')", {
    purpose: "code_conversion"
  });
  assertUpload("blocked-file", blocked, {
    ext: ".py",
    scanStatus: "BLOCKED",
    riskFlag: "SECRET_ASSIGNMENT"
  });

  const unsupported = await uploadFile("strategy.csv", "a,b,c\n1,2,3", {
    purpose: "code_conversion"
  });
  assertFailure("unsupported-file", unsupported, "UNSUPPORTED_FILE_TYPE");

  const disallowedAnalysisPy = await uploadFile("analysis.py", "print('analysis')", {
    purpose: "code_analysis"
  });
  assertFailure("analysis-py-file", disallowedAnalysisPy, "UNSUPPORTED_FILE_TYPE");

  const empty = await uploadFile("empty.py", "", {
    purpose: "code_conversion"
  });
  assertFailure("empty-file", empty, "FILE_EMPTY");

  const oversizedContent = "x".repeat(Math.max(1, maxBytes) + 1);
  const oversized = await uploadFile("oversized.txt", oversizedContent, {
    purpose: "code_analysis"
  });
  assertFailure("oversized-file", oversized, "FILE_TOO_LARGE");

  const blockedTask = await requestJson("POST", "/api/v1/ai/tasks", {
    type: "code_conversion",
    inputFileId: blocked.json.data.fileId,
    clientRequestId: `blocked-file-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  assertFailure("blocked-file-ai-task", blockedTask, "FILE_BLOCKED");

  const me = await requestJson("GET", "/api/v1/me");
  assertSuccess("me", me, 200);

  if (me.json.data.creditAccount.balance !== balanceBefore) {
    throw new Error(`Blocked file task changed balance: before=${balanceBefore}, after=${me.json.data.creditAccount.balance}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        phoneMasked: maskPhone(phone),
        balanceBefore,
        balanceAfter: me.json.data.creditAccount.balance,
        uploads: {
          safePy: summarizeUpload(safePy),
          safeTxt: summarizeUpload(safeTxt),
          safeLog: summarizeUpload(safeLog),
          warning: summarizeUpload(warning),
          blocked: summarizeUpload(blocked)
        },
        validationErrors: {
          unauthorized: unauthorized.json.error.code,
          unsupported: unsupported.json.error.code,
          disallowedAnalysisPy: disallowedAnalysisPy.json.error.code,
          empty: empty.json.error.code,
          oversized: oversized.json.error.code,
          blockedTask: blockedTask.json.error.code
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

async function uploadFile(name, content, options = {}) {
  const formData = new FormData();
  formData.append("file", new Blob([content], { type: "text/plain;charset=utf-8" }), name);
  formData.append("purpose", options.purpose ?? "code_conversion");

  return request("POST", "/api/v1/files", formData, {
    useCookie: options.useCookie !== false
  });
}

async function requestJson(method, path, body) {
  return request(method, path, body ? JSON.stringify(body) : null, {
    contentType: body ? "application/json" : undefined
  });
}

async function request(method, path, body, options = {}) {
  const headers = new Headers();

  if (options.contentType) {
    headers.set("content-type", options.contentType);
  }

  if (options.useCookie !== false && cookie) {
    headers.set("cookie", cookie);
  }

  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers,
    body
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

function assertUpload(step, response, expected) {
  assertSuccess(step, response, 200);
  const data = response.json.data;

  if (!data.fileId || data.ext !== expected.ext || data.scanStatus !== expected.scanStatus) {
    throw new Error(`${step} upload assertion failed: ${JSON.stringify({ fileId: Boolean(data.fileId), ext: data.ext, scanStatus: data.scanStatus })}`);
  }

  if (expected.riskFlag && !data.riskFlags.includes(expected.riskFlag)) {
    throw new Error(`${step} missing risk flag ${expected.riskFlag}: ${JSON.stringify(data.riskFlags)}`);
  }

  if (typeof data.contentPreview !== "string" || data.contentPreview.length > 803) {
    throw new Error(`${step} invalid contentPreview length`);
  }
}

function summarizeUpload(response) {
  const data = response.json.data;

  return {
    fileId: data.fileId,
    originalName: data.originalName,
    ext: data.ext,
    sizeBytes: data.sizeBytes,
    sha256Prefix: data.sha256.slice(0, 12),
    scanStatus: data.scanStatus,
    riskFlags: data.riskFlags
  };
}

function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
