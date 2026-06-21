import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true, override: true });

const baseUrl = (process.env.SMOKE_AI_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
let cookie = "";

console.log("LightQuant AI RunEvent local smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      note: "Creates a code analysis task with a text attachment, verifies persistent run events, and cancels the task to verify a terminal event."
    },
    null,
    2
  )
);

try {
  const phone = `1586871${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

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

  const upload = await uploadFile(
    "run-events-strategy.txt",
    [
      "def initialize(context):",
      "    g.stock = '000001.XSHE'",
      "",
      "def handle_data(context, data):",
      "    pass"
    ].join("\n")
  );
  assertSuccess("upload", upload, 200);

  const created = await requestJson("POST", "/api/v1/ai/tasks", {
    type: "code_analysis",
    sourcePlatform: "JoinQuant",
    inputFileId: upload.json.data.fileId,
    clientRequestId: `run-events-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  assertSuccess("create-task", created, [200, 202]);

  const taskId = created.json.data.task.id;
  const initialEvents = await requestJson("GET", `/api/v1/ai/tasks/${encodeURIComponent(taskId)}/events?limit=100`);
  assertSuccess("initial-events", initialEvents, 200);
  assertEventTypes("initial-events", initialEvents.json.data.events, ["queued", "upload_received", "read_attachment", "parse_text"]);

  const latestSeq = initialEvents.json.data.nextAfterSeq;
  const cancel = await requestJson("POST", `/api/v1/ai/tasks/${encodeURIComponent(taskId)}/cancel`);
  assertSuccess("cancel-task", cancel, 200);

  const incremental = await requestJson("GET", `/api/v1/ai/tasks/${encodeURIComponent(taskId)}/events?afterSeq=${latestSeq}&limit=20`);
  assertSuccess("incremental-events", incremental, 200);
  assertEventTypes("incremental-events", incremental.json.data.events, ["cancelled"]);

  const allEvents = await requestJson("GET", `/api/v1/ai/tasks/${encodeURIComponent(taskId)}/events?limit=100`);
  assertSuccess("all-events", allEvents, 200);
  assertOrdered("all-events", allEvents.json.data.events);

  console.log(
    JSON.stringify(
      {
        ok: true,
        taskId,
        initialEventTypes: initialEvents.json.data.events.map((event) => event.type),
        incrementalEventTypes: incremental.json.data.events.map((event) => event.type),
        totalEvents: allEvents.json.data.events.length,
        nextAfterSeq: allEvents.json.data.nextAfterSeq
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

async function uploadFile(name, content) {
  const formData = new FormData();
  formData.append("file", new Blob([content], { type: "text/plain;charset=utf-8" }), name);
  formData.append("purpose", "code_analysis");

  return request("POST", "/api/v1/files", formData);
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

function assertEventTypes(step, events, expectedTypes) {
  const types = new Set((events ?? []).map((event) => event.type));

  for (const expectedType of expectedTypes) {
    if (!types.has(expectedType)) {
      throw new Error(`${step} missing event type ${expectedType}; got ${JSON.stringify([...types])}`);
    }
  }

  for (const event of events ?? []) {
    if (typeof event.seq !== "number" || !event.title || event.visibility !== "public") {
      throw new Error(`${step} invalid event shape: ${JSON.stringify(event)}`);
    }

    if (JSON.stringify(event.detailJson ?? {}).length > 2000) {
      throw new Error(`${step} detailJson is unexpectedly large for seq=${event.seq}`);
    }
  }
}

function assertOrdered(step, events) {
  let previous = 0;

  for (const event of events ?? []) {
    if (event.seq <= previous) {
      throw new Error(`${step} events not ordered by seq`);
    }

    previous = event.seq;
  }
}
