import { randomUUID } from "node:crypto";

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "smoke-file-upload-service-secret-32";
process.env.FILE_UPLOAD_MAX_BYTES = "4096";
process.env.FILE_ALLOWED_EXTENSIONS = ".py,.txt,.log,.png,.jpg";

async function main() {
  globalThis.__lightquantMockRepository = undefined;

  const { createAiTask } = await import("../src/server/ai/ai-service");
  const { ensureSignupBonus } = await import("../src/server/credits/credit-service");
  const { uploadCodeFileForUser } = await import("../src/server/files/file-service");
  const { getRepository } = await import("../src/server/repositories");
  const repository = getRepository();
  const now = new Date().toISOString();
  const user = await repository.createUser({
    phone: `159${Date.now().toString().slice(-8)}`,
    displayName: "文件上传服务 Smoke",
    inviteCode: `FU${randomUUID().replaceAll("-", "").slice(0, 10)}`.toUpperCase(),
    referredBy: null,
    createdAt: now,
    lastLoginAt: now
  });

  await ensureSignupBonus(user.id, `file-upload-service-${randomUUID()}`);

  const strategyContent = [
    "def initialize(context):",
    "    g.stock = '000001.XSHE'",
    `    g.note = '${"strategy-full-content-".repeat(48)}'`,
    "",
    "def handle_data(context, data):",
    "    return data[g.stock].close"
  ].join("\n");
  const strategyUpload = await uploadCodeFileForUser(
    user.id,
    new File([strategyContent], "strategy.PY", { type: "application/x-python" }),
    "strategy_generation"
  );

  expect("strategy .PY upload succeeds", strategyUpload.ext === ".py");
  expect("strategy .PY is code", strategyUpload.kind === "code");
  expect("strategy .PY passes safety scan", strategyUpload.scanStatus === "PASSED");
  expect("strategy .PY stores full contentText", strategyUpload.contentText === strategyContent);
  expect("strategy fixture exceeds preview", strategyUpload.contentPreview.length < strategyContent.length);

  const strategyClientRequestId = `strategy-file-${randomUUID()}`;
  await createAiTask(user.id, {
    type: "strategy_generation",
    targetPlatform: "PTrade",
    prompt: "根据上传文件生成策略。",
    inputFileId: strategyUpload.fileId,
    clientRequestId: strategyClientRequestId
  }, `request-${randomUUID()}`);
  const strategyTask = await repository.findAiTaskByClientRequestId(user.id, strategyClientRequestId);

  expect("strategy task is created from .PY", Boolean(strategyTask));
  expect("strategy task receives full file content", strategyTask?.inputCode === `# Uploaded file: strategy.PY\n${strategyContent}`);
  expect("strategy task input is longer than preview", (strategyTask?.inputCode.length ?? 0) > strategyUpload.contentPreview.length);

  const analysisContent = [
    "def initialize(context):",
    "    g.stock_num = 5",
    `    g.note = '${"analysis-full-content-".repeat(48)}'`,
    "",
    "def rebalance(context):",
    "    return g.stock_num"
  ].join("\n");
  const analysisUpload = await uploadCodeFileForUser(
    user.id,
    new File([analysisContent], "analysis.py", { type: "application/octet-stream" }),
    "code_analysis"
  );

  expect("analysis .py upload succeeds", analysisUpload.ext === ".py");
  expect("analysis .py is code", analysisUpload.kind === "code");
  expect("analysis .py stores full contentText", analysisUpload.contentText === analysisContent);

  const analysisClientRequestId = `analysis-file-${randomUUID()}`;
  await createAiTask(user.id, {
    type: "code_analysis",
    prompt: "分析这份策略的买入卖出逻辑。",
    inputFileId: analysisUpload.fileId,
    clientRequestId: analysisClientRequestId
  }, `request-${randomUUID()}`);
  const analysisTask = await repository.findAiTaskByClientRequestId(user.id, analysisClientRequestId);

  expect("analysis task is created from .py", Boolean(analysisTask));
  expect("analysis task receives full file content", analysisTask?.inputCode === `# Uploaded file: analysis.py\n${analysisContent}`);

  const pythonMimeTypes = [
    "",
    "text/plain",
    "text/x-python",
    "application/x-python-code",
    "application/x-python",
    "application/octet-stream"
  ];

  for (const [index, mimeType] of pythonMimeTypes.entries()) {
    const content = `def mime_case_${index}():\n    return ${JSON.stringify(mimeType || "empty")}`;
    const upload = await uploadCodeFileForUser(
      user.id,
      new File([content], `mime-${index}.py`, { type: mimeType }),
      index % 2 === 0 ? "strategy_generation" : "code_analysis"
    );

    expect(`python MIME ${mimeType || "(empty)"} is accepted`, upload.contentText === content && upload.kind === "code");
  }

  await expectApiError("unsupported analysis extension", "UNSUPPORTED_FILE_TYPE", () => uploadCodeFileForUser(
    user.id,
    new File(["a,b\n1,2"], "analysis.csv", { type: "text/plain" }),
    "code_analysis"
  ));
  await expectApiError("empty .py", "FILE_EMPTY", () => uploadCodeFileForUser(
    user.id,
    new File([], "empty.py", { type: "text/x-python" }),
    "code_analysis"
  ));
  await expectApiError("oversized .py", "FILE_TOO_LARGE", () => uploadCodeFileForUser(
    user.id,
    new File(["x".repeat(4097)], "oversized.py", { type: "application/x-python" }),
    "strategy_generation"
  ));
  await expectApiError("invalid UTF-8 .py", "FILE_PARSE_FAILED", () => uploadCodeFileForUser(
    user.id,
    new File([new Uint8Array([0xc3, 0x28])], "invalid.py", { type: "application/octet-stream" }),
    "code_analysis"
  ));

  const blockedUpload = await uploadCodeFileForUser(
    user.id,
    new File(["api_key = 'sk-test-1234567890'"], "secret.py", { type: "application/x-python-code" }),
    "strategy_generation"
  );
  expect("secret .py remains blocked", blockedUpload.scanStatus === "BLOCKED" && blockedUpload.riskFlags.includes("SECRET_ASSIGNMENT"));
  await expectApiError("blocked .py cannot create task", "FILE_BLOCKED", () => createAiTask(user.id, {
    type: "strategy_generation",
    targetPlatform: "PTrade",
    prompt: "读取上传策略。",
    inputFileId: blockedUpload.fileId,
    clientRequestId: `blocked-file-${randomUUID()}`
  }, `request-${randomUUID()}`));

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "strategy_generation accepts case-insensitive .py and stores full contentText",
      "code_analysis accepts .py and stores full contentText",
      "strategy_generation and code_analysis tasks receive full uploaded code rather than contentPreview",
      "all supported Python MIME variants are accepted",
      "unsupported, empty, oversized, and invalid UTF-8 .py files remain rejected",
      "secret scanning and FILE_BLOCKED task guard remain active"
    ]
  }, null, 2));
}

async function expectApiError(name: string, code: string, action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    const actualCode = readStringProperty(error, "code");

    if (actualCode === code) {
      return;
    }

    throw new Error(`${name}: expected ${code}, got ${actualCode || String(error)}`);
  }

  throw new Error(`${name}: expected ${code}, but action succeeded`);
}

function readStringProperty(value: unknown, property: string) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const candidate = (value as Record<string, unknown>)[property];
  return typeof candidate === "string" ? candidate : "";
}

function expect(name: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error(`Expectation failed: ${name}`);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
