import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true, override: true });

const baseUrl = (process.env.SMOKE_FILES_BASE_URL || "http://127.0.0.1:3010").replace(/\/+$/, "");
const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

let cookie = "";

console.log("LightQuant local image file smoke test");
console.log(JSON.stringify({ baseUrl, note: "Uploads a PNG, checks thumbnail auth, creates an attached task, verifies messages attachment summary, then cancels the task." }, null, 2));

try {
  const ownerPhone = `1586863${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  await login(ownerPhone);
  const ownerCookie = cookie;

  const formData = new FormData();
  formData.append("file", new Blob([pngBytes], { type: "image/png" }), "backtest.png");
  formData.append("purpose", "strategy_generation");
  const upload = await request("POST", "/api/v1/files", formData);
  assertSuccess("upload-image", upload, 200);
  const file = upload.json.data;

  if (file.kind !== "image" || file.ext !== ".png" || file.mimeType !== "image/png" || !file.thumbnailUrl || !file.hasThumbnail) {
    throw new Error(`unexpected image upload response: ${JSON.stringify(file)}`);
  }

  const thumbnail = await request("GET", file.thumbnailUrl);
  if (thumbnail.status !== 200 || thumbnail.headers.get("content-type") !== "image/png") {
    throw new Error(`thumbnail failed: status=${thumbnail.status}, contentType=${thumbnail.headers.get("content-type")}, body=${thumbnail.text.slice(0, 120)}`);
  }

  const otherPhone = `1586864${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  await login(otherPhone);
  const forbidden = await request("GET", file.thumbnailUrl);
  if (forbidden.status !== 403) {
    throw new Error(`thumbnail ownership guard failed: status=${forbidden.status}, body=${forbidden.text.slice(0, 160)}`);
  }

  cookie = ownerCookie;
  const created = await requestJson("POST", "/api/v1/ai/tasks", {
    type: "strategy_generation",
    targetPlatform: "PTrade",
    prompt: "请结合上传的回测截图，说明策略需要关注的风险点。",
    inputFileId: file.fileId,
    clientRequestId: `image-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  assertSuccess("create-image-task", created, [200, 202]);
  const conversationId = created.json.data.conversation?.id;
  const taskId = created.json.data.task?.id;

  if (!conversationId || !taskId) {
    throw new Error(`created task missing ids: ${JSON.stringify(created.json.data)}`);
  }

  const messages = await requestJson("GET", `/api/v1/ai/conversations/${encodeURIComponent(conversationId)}/messages?limit=5&taskLimit=1&includeTaskResults=none`);
  assertSuccess("messages", messages, 200);
  const userMessage = [...messages.json.data.messages].reverse().find((message) => message.role === "user");
  const attachment = userMessage?.attachments?.[0];

  if (!attachment || attachment.kind !== "image" || attachment.fileId !== file.fileId || !attachment.thumbnailUrl || attachment.contentText) {
    throw new Error(`image attachment summary invalid: ${JSON.stringify(attachment)}`);
  }

  const cancel = await requestJson("POST", `/api/v1/ai/tasks/${encodeURIComponent(taskId)}/cancel`);

  console.log(JSON.stringify({
    ok: true,
    ownerMasked: maskPhone(ownerPhone),
    file: {
      fileId: file.fileId,
      kind: file.kind,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      hasThumbnail: file.hasThumbnail
    },
    thumbnail: {
      status: thumbnail.status,
      contentType: thumbnail.headers.get("content-type"),
      ownershipGuardStatus: forbidden.status
    },
    attachment: {
      fileId: attachment.fileId,
      kind: attachment.kind,
      hasThumbnail: attachment.hasThumbnail,
      hasContentText: Object.prototype.hasOwnProperty.call(attachment, "contentText")
    },
    cancelStatus: cancel.status,
    cancelSuccess: Boolean(cancel.json?.success)
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
}

async function login(phone) {
  assertSuccess("sms-code", await requestJson("POST", "/api/v1/auth/sms-code", { phone, scene: "login" }), 200);
  assertSuccess("login", await requestJson("POST", "/api/v1/auth/login", { phone, code: "123456", acceptedLegal: true }), 200);
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

  const arrayBuffer = await response.arrayBuffer();
  const text = Buffer.from(arrayBuffer).toString("utf8");
  let json = null;

  try {
    json = JSON.parse(text);
  } catch {
    // Binary responses are expected for thumbnails.
  }

  return {
    status: response.status,
    headers: response.headers,
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

function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
