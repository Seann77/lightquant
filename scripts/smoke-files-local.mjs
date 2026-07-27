import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";

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
  const aiServiceSource = await readFile(new URL("../src/server/ai/ai-service.ts", import.meta.url), "utf8");

  if (!/inputCode:\s*input\.inputCode\s*\?\?\s*mergeInputCode\(null,\s*uploadedFile\.contentText/.test(aiServiceSource)) {
    throw new Error("AI task input no longer resolves the full uploadedFile.contentText");
  }

  const strategyPyContent = [
    "def initialize(context):",
    "    g.stock = '000001.XSHE'",
    "    g.note = '" + "strategy-upload-full-content-".repeat(48) + "'",
    "",
    "def handle_data(context, data):",
    "    if g.stock in data:",
    "        return data[g.stock].close"
  ].join("\n");
  const strategyPy = await uploadFile("strategy.PY", strategyPyContent, {
    purpose: "strategy_generation",
    mimeType: "application/x-python"
  });
  assertUpload("strategy-generation-py", strategyPy, {
    ext: ".py",
    kind: "code",
    scanStatus: "PASSED",
    contentText: strategyPyContent,
    previewMustBeShorter: true
  });

  const analysisPyContent = [
    "def initialize(context):",
    "    g.stock_num = 5",
    "    g.note = '" + "analysis-upload-full-content-".repeat(48) + "'",
    "",
    "def rebalance(context):",
    "    return g.stock_num"
  ].join("\n");
  const analysisPy = await uploadFile("analysis.py", analysisPyContent, {
    purpose: "code_analysis",
    mimeType: "application/octet-stream"
  });
  assertUpload("code-analysis-py", analysisPy, {
    ext: ".py",
    kind: "code",
    scanStatus: "PASSED",
    contentText: analysisPyContent,
    previewMustBeShorter: true
  });

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
      purpose: "code_conversion",
      mimeType: "text/x-python"
    }
  );
  assertUpload("safe-py", safePy, {
    ext: ".py",
    kind: "code",
    scanStatus: "PASSED"
  });

  const safeTxt = await uploadFile("notes.txt", "PTrade strategy notes\nbuy when ma5 crosses ma20", {
    purpose: "code_analysis"
  });
  assertUpload("safe-txt", safeTxt, {
    ext: ".txt",
    kind: "text",
    scanStatus: "PASSED"
  });

  const safeLog = await uploadFile("strategy.log", "strategy generated\nrisk checked", {
    purpose: "strategy_generation"
  });
  assertUpload("safe-log", safeLog, {
    ext: ".log",
    kind: "log",
    scanStatus: "PASSED"
  });

  const additionalPythonMimes = [
    ["empty-mime.py", "", "code_analysis"],
    ["plain-mime.py", "text/plain", "strategy_generation"],
    ["python-code-mime.py", "application/x-python-code", "code_analysis"]
  ];
  const mimeUploads = [];

  for (const [name, mimeType, purpose] of additionalPythonMimes) {
    const content = `def mime_case():\n    return ${JSON.stringify(mimeType || "empty")}`;
    const response = await uploadFile(name, content, {
      purpose,
      mimeType
    });
    assertUpload(`python-mime-${mimeType || "empty"}`, response, {
      ext: ".py",
      kind: "code",
      scanStatus: "PASSED",
      contentText: content
    });
    mimeUploads.push(response);
  }

  const warning = await uploadFile("danger.py", "import os\nos.system('echo hello')", {
    purpose: "code_analysis",
    mimeType: "application/x-python-code"
  });
  assertUpload("warning-file", warning, {
    ext: ".py",
    kind: "code",
    scanStatus: "WARNING",
    riskFlag: "OS_SYSTEM"
  });

  const blocked = await uploadFile("secret.py", "api_key = 'sk-test-1234567890'\nprint('redacted')", {
    purpose: "strategy_generation",
    mimeType: "application/x-python"
  });
  assertUpload("blocked-file", blocked, {
    ext: ".py",
    kind: "code",
    scanStatus: "BLOCKED",
    riskFlag: "SECRET_ASSIGNMENT"
  });

  const unsupported = await uploadFile("strategy.csv", "a,b,c\n1,2,3", {
    purpose: "strategy_generation"
  });
  assertFailure("unsupported-file", unsupported, "UNSUPPORTED_FILE_TYPE");
  assertErrorMessage("unsupported-file-formats", unsupported, "仅支持上传 .py / .txt / .log / .png / .jpg 文件");
  const unsupportedAnalysis = await uploadFile("analysis.csv", "a,b\n1,2", {
    purpose: "code_analysis"
  });
  assertFailure("unsupported-analysis-file", unsupportedAnalysis, "UNSUPPORTED_FILE_TYPE");
  assertErrorMessage("unsupported-analysis-formats", unsupportedAnalysis, "仅支持上传 .py / .txt 文件");

  const empty = await uploadFile("empty.py", "", {
    purpose: "code_analysis",
    mimeType: "application/x-python"
  });
  assertFailure("empty-file", empty, "FILE_EMPTY");

  const oversizedContent = "x".repeat(Math.max(1, maxBytes) + 1);
  const oversized = await uploadFile("oversized.py", oversizedContent, {
    purpose: "strategy_generation",
    mimeType: "text/x-python"
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
          strategyPy: summarizeUpload(strategyPy),
          analysisPy: summarizeUpload(analysisPy),
          safePy: summarizeUpload(safePy),
          safeTxt: summarizeUpload(safeTxt),
          safeLog: summarizeUpload(safeLog),
          warning: summarizeUpload(warning),
          blocked: summarizeUpload(blocked),
          pythonMimeCases: mimeUploads.map(summarizeUpload)
        },
        validationErrors: {
          unauthorized: unauthorized.json.error.code,
          unsupported: unsupported.json.error.code,
          unsupportedAnalysis: unsupportedAnalysis.json.error.code,
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
  formData.append("file", new Blob([content], { type: options.mimeType ?? "text/plain;charset=utf-8" }), name);
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

function assertErrorMessage(step, response, message) {
  if (response.json?.error?.message !== message) {
    throw new Error(`${step} expected message ${JSON.stringify(message)}, got ${JSON.stringify(response.json?.error?.message)}`);
  }
}

function assertUpload(step, response, expected) {
  assertSuccess(step, response, 200);
  const data = response.json.data;

  if (!data.fileId || data.ext !== expected.ext || data.scanStatus !== expected.scanStatus || (expected.kind && data.kind !== expected.kind)) {
    throw new Error(`${step} upload assertion failed: ${JSON.stringify({ fileId: Boolean(data.fileId), ext: data.ext, kind: data.kind, scanStatus: data.scanStatus })}`);
  }

  if (expected.riskFlag && !data.riskFlags.includes(expected.riskFlag)) {
    throw new Error(`${step} missing risk flag ${expected.riskFlag}: ${JSON.stringify(data.riskFlags)}`);
  }

  if (typeof data.contentPreview !== "string" || data.contentPreview.length > 803) {
    throw new Error(`${step} invalid contentPreview length`);
  }

  if (expected.contentText !== undefined && data.contentText !== expected.contentText) {
    throw new Error(`${step} contentText was not preserved in full`);
  }

  if (expected.previewMustBeShorter && data.contentPreview.length >= data.contentText.length) {
    throw new Error(`${step} fixture did not prove contentText is fuller than contentPreview`);
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
