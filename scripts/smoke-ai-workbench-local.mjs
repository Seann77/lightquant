import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true, override: true });

const baseUrl = (process.env.SMOKE_AI_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
let cookie = "";

console.log("LightQuant AI Workbench local smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      note: "Creates one conversion task, verifies conversation summary/messages restore uiState, then cancels the task."
    },
    null,
    2
  )
);

try {
  const phone = `1586872${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

  assertSuccess(
    "sms-code",
    await requestJson("POST", "/api/v1/auth/sms-code", {
      phone,
      scene: "login"
    }),
    200
  );

  assertSuccess(
    "login",
    await requestJson("POST", "/api/v1/auth/login", {
      phone,
      code: "123456",
      acceptedLegal: true
    }),
    200
  );

  const created = await requestJson("POST", "/api/v1/ai/tasks", {
    type: "code_conversion",
    sourcePlatform: "JoinQuant",
    targetPlatform: "PTrade",
    inputCode: [
      "def initialize(context):",
      "    set_benchmark('000300.XSHG')",
      "",
      "def handle_data(context, data):",
      "    order_value('000001.XSHE', 10000)"
    ].join("\n"),
    clientRequestId: `workbench-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  assertSuccess("create-task", created, [200, 202]);

  const taskId = created.json.data.task.id;
  const conversationId = created.json.data.conversation?.id ?? created.json.data.task.conversationId;

  if (!conversationId) {
    throw new Error("created task did not return a conversationId");
  }

  const summary = await requestJson("GET", `/api/v1/ai/conversations/${encodeURIComponent(conversationId)}`);
  assertSuccess("conversation-summary", summary, 200);

  if (summary.json.data.mode !== "convert") {
    throw new Error(`conversation summary mode mismatch: ${summary.json.data.mode}`);
  }

  const patch = await requestJson("PATCH", `/api/v1/ai/conversations/${encodeURIComponent(conversationId)}`, {
    uiState: {
      activeTab: "迁移说明",
      module: "convert"
    }
  });
  assertSuccess("conversation-patch", patch, 200);
  assertUiState("patched-summary", patch.json.data.uiState);

  const messages = await requestJson("GET", `/api/v1/ai/conversations/${encodeURIComponent(conversationId)}/messages?limit=5&taskLimit=1&includeTaskResults=none`);
  assertSuccess("conversation-messages", messages, 200);
  assertUiState("messages-conversation", messages.json.data.conversation.uiState);

  const cancel = await requestJson("POST", `/api/v1/ai/tasks/${encodeURIComponent(taskId)}/cancel`);
  assertSuccess("cancel-task", cancel, 200);

  console.log(
    JSON.stringify(
      {
        ok: true,
        taskId,
        conversationId,
        mode: summary.json.data.mode,
        uiState: messages.json.data.conversation.uiState
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

  if (cookie) {
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

function assertUiState(step, uiState) {
  if (!uiState || uiState.activeTab !== "迁移说明" || uiState.module !== "convert") {
    throw new Error(`${step} invalid uiState: ${JSON.stringify(uiState)}`);
  }
}
