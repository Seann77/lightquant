import type { UploadedCodeFile } from "@/lib/file-upload";
import { formatStrategyResultAsMarkdown } from "@/lib/ai/strategy-result-format";
import type {
  AiConversationData,
  AiConversationMessagesData,
  AiMessageData,
  AiRunEventData,
  AiTaskData,
  AiTaskStatusData,
  AiTaskStreamEventData,
  ApiResponse,
  MessageAttachmentData,
  RestoredUploadedFileSnapshot,
  RestoredWorkbenchSnapshot,
  WorkbenchConversationMode,
  WorkbenchTaskType
} from "@/lib/ai/workbench-types";

export const AI_TASK_POLL_INTERVAL_MS = 3000;
export const AI_TASK_POLL_TIMEOUT_MS = 5 * 60 * 1000;
export const WORKBENCH_SWITCH_COMPLETE_EVENT = "lightquant:workbench-switch-complete";

export type WorkbenchSwitchCompleteDetail = {
  conversationId: string;
  status: "rendered" | "error";
};

type WorkbenchSwitchPerfState = {
  conversationId: string;
  href?: string;
  clickedAt: number;
};

type RouterLike = {
  replace(href: string, options?: { scroll?: boolean }): void;
};

declare global {
  interface Window {
    __lightquantWorkbenchSwitchPerf?: WorkbenchSwitchPerfState;
  }
}

export function logWorkbenchPerf(event: string, details: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") {
    return;
  }

  console.debug("[workbench-perf]", JSON.stringify({
    event,
    ...details
  }));
}

export function beginWorkbenchSwitchPerf(input: { conversationId: string; href?: string }) {
  if (typeof window === "undefined") {
    return;
  }

  window.__lightquantWorkbenchSwitchPerf = {
    conversationId: input.conversationId,
    href: input.href,
    clickedAt: getPerfNow()
  };
}

export function getWorkbenchSwitchPerf(conversationId?: string | null) {
  if (typeof window === "undefined") {
    return null;
  }

  const state = window.__lightquantWorkbenchSwitchPerf ?? null;

  if (!state || (conversationId && state.conversationId !== conversationId)) {
    return null;
  }

  return state;
}

export function notifyWorkbenchSwitchComplete(detail: WorkbenchSwitchCompleteDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(WORKBENCH_SWITCH_COMPLETE_EVENT, {
    detail
  }));
}

export async function fetchAiConversationSummary(conversationId: string, options: { signal?: AbortSignal } = {}) {
  const response = await fetch(`/api/v1/ai/conversations/${encodeURIComponent(conversationId)}`, {
    cache: "no-store",
    signal: options.signal
  });
  const payload = (await response.json()) as ApiResponse<AiConversationData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

export async function fetchAiConversationMessages(conversationId: string, options: {
  cursor?: string;
  direction?: "before" | "after";
  limit?: number;
  taskLimit?: number;
  includeTaskResults?: "none" | "latest" | "all";
  signal?: AbortSignal;
} = {}) {
  const params = new URLSearchParams();

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.direction) {
    params.set("direction", options.direction);
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  if (options.taskLimit) {
    params.set("taskLimit", String(options.taskLimit));
  }

  if (options.includeTaskResults) {
    params.set("includeTaskResults", options.includeTaskResults);
  }

  const query = params.size > 0 ? `?${params.toString()}` : "";
  const response = await fetch(`/api/v1/ai/conversations/${encodeURIComponent(conversationId)}/messages${query}`, {
    cache: "no-store",
    signal: options.signal
  });
  const payload = (await response.json()) as ApiResponse<AiConversationMessagesData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

export async function fetchAiConversationSnapshot(conversationId: string, options: {
  cursor?: string;
  direction?: "before" | "after";
  limit?: number;
  taskLimit?: number;
  includeTaskResults?: "none" | "latest" | "all";
  signal?: AbortSignal;
} = {}) {
  const params = new URLSearchParams();

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.direction) {
    params.set("direction", options.direction);
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  if (options.taskLimit) {
    params.set("taskLimit", String(options.taskLimit));
  }

  if (options.includeTaskResults) {
    params.set("includeTaskResults", options.includeTaskResults);
  }

  const query = params.size > 0 ? `?${params.toString()}` : "";
  const startedAt = getPerfNow();
  const response = await fetch(`/api/v1/ai/conversations/${encodeURIComponent(conversationId)}/snapshot${query}`, {
    cache: "no-store",
    signal: options.signal
  });
  const payload = (await response.json()) as ApiResponse<AiConversationMessagesData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  logWorkbenchPerf("snapshot.response", {
    conversationId,
    durationMs: Math.round(getPerfNow() - startedAt),
    messages: payload.data.messages.length,
    tasks: payload.data.tasks?.length ?? 0,
    hasResult: Boolean(payload.data.latestResult ?? payload.data.result)
  });

  return payload.data;
}

export async function updateAiConversationUiState(conversationId: string, uiState: Record<string, unknown>) {
  const response = await fetch(`/api/v1/ai/conversations/${encodeURIComponent(conversationId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      uiState
    })
  });
  const payload = (await response.json()) as ApiResponse<AiConversationData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

export async function createWorkbenchAiTask(input: {
  type: WorkbenchTaskType;
  conversationId?: string;
  messageContent?: string;
  sourcePlatform?: string;
  targetPlatform?: string;
  prompt?: string;
  inputCode?: string;
  inputFileId?: string;
  clientRequestId: string;
}) {
  const response = await fetch("/api/v1/ai/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const payload = (await response.json()) as ApiResponse<AiTaskData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

export type StreamWorkbenchAiTaskHandlers = {
  signal?: AbortSignal;
  onTask?: (data: AiTaskData) => void;
  onThinkingDelta?: (delta: string) => void;
  onFinalDelta?: (delta: string) => void;
  onDone?: (data: AiTaskData, event: Extract<AiTaskStreamEventData, { type: "done" }>) => void;
  onEvent?: (event: AiTaskStreamEventData) => void;
};

export async function streamWorkbenchAiTask(input: Parameters<typeof createWorkbenchAiTask>[0], handlers: StreamWorkbenchAiTaskHandlers = {}) {
  const response = await fetch("/api/v1/ai/tasks/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input),
    signal: handlers.signal
  });

  if (!response.ok || !response.body) {
    const payload = await safeReadApiError(response);
    throw new Error(`${payload.code}:${payload.message}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed: AiTaskData | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\n\n/);
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseStreamEvent(part);

      if (!event) {
        continue;
      }

      completed = handleWorkbenchStreamEvent(event, handlers) ?? completed;
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    const event = parseStreamEvent(buffer);

    if (event) {
      completed = handleWorkbenchStreamEvent(event, handlers) ?? completed;
    }
  }

  if (!completed) {
    throw new Error("AI_TASK_FAILED:流式任务未返回完成事件");
  }

  return completed;
}

export async function fetchAiTaskResult(taskId: string) {
  const response = await fetch(`/api/v1/ai/tasks/${encodeURIComponent(taskId)}/result`, {
    cache: "no-store"
  });
  const payload = (await response.json()) as ApiResponse<AiTaskData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

export async function fetchAiTaskStatus(taskId: string, options: {
  afterSeq?: number;
  limit?: number;
  signal?: AbortSignal;
} = {}) {
  const params = new URLSearchParams();

  if (typeof options.afterSeq === "number") {
    params.set("afterSeq", String(options.afterSeq));
  }

  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }

  const query = params.size > 0 ? `?${params.toString()}` : "";
  const startedAt = getPerfNow();
  const response = await fetch(`/api/v1/ai/tasks/${encodeURIComponent(taskId)}/status${query}`, {
    cache: "no-store",
    signal: options.signal
  });
  const payload = (await response.json()) as ApiResponse<AiTaskStatusData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  logWorkbenchPerf("status.response", {
    taskId,
    status: payload.data.task.status,
    durationMs: Math.round(getPerfNow() - startedAt),
    events: payload.data.latestEvents?.length ?? 0,
    hasResult: Boolean(payload.data.result)
  });

  return normalizeAiTaskStatusData(payload.data);
}

export async function cancelAiTask(taskId: string) {
  const response = await fetch(`/api/v1/ai/tasks/${encodeURIComponent(taskId)}/cancel`, {
    method: "POST"
  });
  const payload = (await response.json()) as ApiResponse<AiTaskData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

export async function retryAiTask(taskId: string, clientRequestId: string) {
  const response = await fetch(`/api/v1/ai/tasks/${encodeURIComponent(taskId)}/retry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      clientRequestId
    })
  });
  const payload = (await response.json()) as ApiResponse<AiTaskData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

export async function waitForAiTaskResult(initialData: AiTaskData, onUpdate: (data: AiTaskData) => void, options: { signal?: AbortSignal } = {}) {
  if (initialData.result || initialData.task.status === "SUCCEEDED") {
    return initialData;
  }

  if (initialData.task.status === "FAILED" || initialData.task.status === "CANCELLED") {
    throwTaskStatusError(initialData.task);
  }

  const startedAt = Date.now();
  const pollStartedAt = getPerfNow();
  let latest = initialData;
  let afterSeq = getLatestEventSeq(initialData.events ?? initialData.task.events ?? []);
  let pollCount = 0;
  logWorkbenchPerf("status.poll.start", {
    taskId: initialData.task.id,
    status: initialData.task.status
  });

  try {
  while (Date.now() - startedAt < AI_TASK_POLL_TIMEOUT_MS) {
    await delay(AI_TASK_POLL_INTERVAL_MS, options.signal);
    if (options.signal?.aborted) {
      throw createAbortError();
    }

    const next = await fetchAiTaskStatus(initialData.task.id, {
      afterSeq,
      signal: options.signal
    });
    pollCount += 1;
    afterSeq = Math.max(afterSeq, next.latestEventSeq ?? 0, getLatestEventSeq(next.events ?? []));
    latest = mergeAiTaskData(latest, next);
    onUpdate(latest);

    if (latest.result || latest.task.status === "SUCCEEDED") {
      return latest;
    }

    if (latest.task.status === "FAILED" || latest.task.status === "CANCELLED") {
      throwTaskStatusError(latest.task);
    }
  }

  throw new Error("AI_TASK_FAILED:任务仍在处理中，请稍后刷新页面或到历史记录查看结果；系统不会因为刷新页面重复扣费。");
  } finally {
    logWorkbenchPerf("status.poll.stop", {
      taskId: initialData.task.id,
      status: latest.task.status,
      polls: pollCount,
      aborted: Boolean(options.signal?.aborted),
      durationMs: Math.round(getPerfNow() - pollStartedAt)
    });
  }
}

function normalizeAiTaskStatusData(data: AiTaskStatusData): AiTaskData {
  return {
    task: data.task,
    result: data.result ?? null,
    conversation: data.conversation
      ? {
          id: data.conversation.id,
          mode: data.conversation.mode,
          title: "",
          targetPlatform: data.task.targetPlatform ?? null,
          sourcePlatform: data.task.sourcePlatform ?? null,
          status: "active",
          uiState: null,
          lastMessageAt: data.task.updatedAt ?? data.task.createdAt ?? "",
          createdAt: data.task.createdAt ?? "",
          updatedAt: data.task.updatedAt ?? data.task.createdAt ?? ""
        }
      : null,
    events: data.latestEvents ?? [],
    latestEventSeq: data.latestEventSeq
  };
}

export function restoreWorkbenchConversation(data: AiConversationMessagesData, taskType: WorkbenchTaskType): RestoredWorkbenchSnapshot {
  const input = getLatestUserInputSnapshot(data.messages, taskType);
  const taskData = getLatestTaskDataFromSnapshot(data, taskType)
    ?? getLatestTaskDataFromMessages(data.messages, taskType)
    ?? getLatestTaskDataFromTasks(data.tasks ?? [], taskType, data.conversation);

  return {
    sourcePlatform: input.sourcePlatform ?? data.conversation.sourcePlatform,
    targetPlatform: input.targetPlatform ?? data.conversation.targetPlatform,
    prompt: input.prompt,
    inputCodePreview: input.inputCodePreview,
    inputFileId: input.inputFileId,
    inputFileName: input.inputFileName,
    inputAttachment: input.inputAttachment,
    taskData
  };
}

function getLatestTaskDataFromSnapshot(data: AiConversationMessagesData, taskType: WorkbenchTaskType): AiTaskData | null {
  const task = data.latestTask ?? null;

  if (!task || task.type !== taskType) {
    return null;
  }

  return {
    task,
    result: data.latestResult ?? data.result ?? null,
    conversation: data.conversation,
    messages: data.messages
  };
}

export function getConversationActiveTab<T extends string>(conversation: AiConversationData | null | undefined, allowedTabs: readonly T[], fallback: T): T {
  const activeTab = readNullableString(conversation?.uiState?.activeTab);

  return activeTab && (allowedTabs as readonly string[]).includes(activeTab) ? activeTab as T : fallback;
}

export function persistConversationActiveTab(conversationId: string | null | undefined, activeTab: string, module: WorkbenchConversationMode) {
  if (!conversationId) {
    return;
  }

  updateAiConversationUiState(conversationId, {
    activeTab,
    module
  }).catch(() => {
    // UI state persistence is best-effort and must not affect task workflows.
  });
}

export function getLatestUserInputSnapshot(messages: AiMessageData[], taskType: WorkbenchTaskType) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const contentJson = readRecord(message.contentJson);

    if (message.role !== "user" || !contentJson) {
      continue;
    }

    if (typeof contentJson.taskType === "string" && contentJson.taskType !== taskType) {
      continue;
    }

    return {
      sourcePlatform: readNullableString(contentJson.sourcePlatform),
      targetPlatform: readNullableString(contentJson.targetPlatform),
      prompt: readNullableString(contentJson.prompt),
      inputCodePreview: readNullableString(contentJson.inputCodePreview),
      inputFileId: readNullableString(contentJson.inputFileId),
      inputFileName: readNullableString(contentJson.inputFileName),
      inputAttachment: normalizeMessageAttachments(message)[0] ?? null
    };
  }

  return {
    sourcePlatform: null,
    targetPlatform: null,
    prompt: null,
    inputCodePreview: null,
    inputFileId: null,
    inputFileName: null,
    inputAttachment: null
  };
}

export function getLatestTaskDataFromMessages(messages: AiMessageData[], taskType: WorkbenchTaskType): AiTaskData | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const contentJson = readRecord(message.contentJson);
    const task = readTaskSnapshot(contentJson?.task);

    if (message.role !== "assistant" || task?.type !== taskType) {
      continue;
    }

    return {
      task,
      result: readAiTaskResult(contentJson?.result),
      visibleThinking: readNullableString(contentJson?.visibleThinking),
      finalAnswerMarkdown: readNullableString(contentJson?.finalAnswerMarkdown),
      parsedResult: readAiTaskResult(contentJson?.parsedResult),
      conversation: null,
      messages
    };
  }

  return null;
}

export function getLatestTaskDataFromTasks(tasks: AiTaskData["task"][], taskType: WorkbenchTaskType, conversation: AiConversationData): AiTaskData | null {
  for (let index = tasks.length - 1; index >= 0; index -= 1) {
    const task = tasks[index];

    if (task.type === taskType) {
      return {
        task,
        result: null,
        conversation,
        messages: []
      };
    }
  }

  return null;
}

export function getMessageAttachments(message: AiMessageData) {
  const attachments = normalizeMessageAttachments(message);

  if (attachments.length > 0) {
    return attachments;
  }

  const contentJson = readRecord(message.contentJson);
  const inputFileId = readNullableString(contentJson?.inputFileId);
  const inputFileName = readNullableString(contentJson?.inputFileName);

  if (!inputFileId || !inputFileName) {
    return [];
  }

  return [createLegacyMessageAttachment(message, inputFileId, inputFileName, readNullableString(contentJson?.inputCodePreview))];
}

export function normalizeMessageAttachments(message: AiMessageData): MessageAttachmentData[] {
  return Array.isArray(message.attachments) ? message.attachments : [];
}

export function createRestoredUploadedFile(snapshot: RestoredUploadedFileSnapshot): UploadedCodeFile | null {
  if (snapshot.inputAttachment) {
    return attachmentToUploadedFile(snapshot.inputAttachment);
  }

  if (!snapshot.inputFileId || !snapshot.inputFileName) {
    return null;
  }

  const ext = snapshot.inputFileName.includes(".") ? `.${snapshot.inputFileName.split(".").pop() ?? "txt"}` : ".txt";
  const isImage = isImageExtension(ext);

  return {
    fileId: snapshot.inputFileId,
    kind: isImage ? "image" : "text",
    originalName: snapshot.inputFileName,
    ext,
    mimeType: isImage ? `image/${ext === ".jpg" ? "jpeg" : ext.slice(1)}` : "text/plain",
    sizeBytes: 0,
    sha256: "",
    contentPreview: snapshot.inputCodePreview ?? "",
    scanStatus: "PASSED",
    riskFlags: [],
    hasThumbnail: isImage,
    thumbnailUrl: isImage ? `/api/v1/files/${encodeURIComponent(snapshot.inputFileId)}/thumbnail` : null,
    previewUrl: isImage ? `/api/v1/files/${encodeURIComponent(snapshot.inputFileId)}/preview` : null,
    createdAt: ""
  };
}

export function attachmentToUploadedFile(attachment: MessageAttachmentData): UploadedCodeFile {
  return {
    fileId: attachment.file.fileId,
    kind: attachment.kind ?? attachment.file.kind ?? (attachment.file.mimeType.startsWith("image/") ? "image" : undefined),
    originalName: attachment.file.originalName,
    ext: attachment.file.ext,
    mimeType: attachment.file.mimeType,
    sizeBytes: attachment.file.sizeBytes,
    sha256: "",
    contentPreview: attachment.file.contentPreview,
    scanStatus: attachment.file.scanStatus,
    riskFlags: attachment.file.riskFlags,
    hasThumbnail: attachment.hasThumbnail ?? attachment.file.hasThumbnail,
    thumbnailUrl: attachment.thumbnailUrl ?? attachment.file.thumbnailUrl ?? null,
    previewUrl: attachment.previewUrl ?? attachment.file.previewUrl ?? null,
    createdAt: attachment.file.createdAt
  };
}

export function uploadedFileToMessageAttachment(file: UploadedCodeFile, id: string): MessageAttachmentData {
  const now = file.createdAt || new Date().toISOString();

  return {
    id,
    messageId: id,
    conversationId: "",
    fileId: file.fileId,
    kind: file.kind,
    originalName: file.originalName,
    ext: file.ext,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    scanStatus: file.scanStatus,
    riskFlags: file.riskFlags,
    contentPreview: file.contentPreview,
    hasThumbnail: file.hasThumbnail,
    thumbnailUrl: file.thumbnailUrl,
    previewUrl: file.previewUrl,
    role: "input",
    displayOrder: 0,
    caption: file.originalName,
    createdAt: now,
    file: {
      fileId: file.fileId,
      kind: file.kind,
      originalName: file.originalName,
      ext: file.ext,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      scanStatus: file.scanStatus,
      riskFlags: file.riskFlags,
      contentPreview: file.contentPreview,
      hasThumbnail: file.hasThumbnail,
      thumbnailUrl: file.thumbnailUrl,
      previewUrl: file.previewUrl,
      createdAt: now
    }
  };
}

export function formatRestoredInputText(inputCodePreview: string | null, inputFileName: string | null) {
  if (inputCodePreview) {
    return `历史输入摘要：\n${inputCodePreview}`;
  }

  return inputFileName ? `历史文件：${inputFileName}` : "";
}

export function getAttachmentScanText(attachment: MessageAttachmentData) {
  if (attachment.file.scanStatus === "BLOCKED") {
    return "已阻断";
  }

  if (attachment.file.scanStatus === "WARNING") {
    return "风险提醒";
  }

  return "校验通过";
}

export function formatFileSize(sizeBytes: number) {
  if (!sizeBytes) {
    return "历史附件";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

export function isImageFile(file: Pick<UploadedCodeFile, "kind" | "mimeType" | "ext">) {
  return file.kind === "image" || file.mimeType.startsWith("image/") || isImageExtension(file.ext);
}

export function isImageExtension(ext: string) {
  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext.toLowerCase());
}

export function replaceWorkbenchConversationUrl(
  router: RouterLike,
  route: { type: "chat"; mode: "strategy" | "convert" } | { type: "analysis" },
  currentConversationId: string | null,
  nextConversationId: string | null
) {
  if (!nextConversationId || nextConversationId === currentConversationId) {
    return;
  }

  const href = route.type === "chat"
    ? `/chat?mode=${route.mode}&conversationId=${encodeURIComponent(nextConversationId)}`
    : `/code-analysis?conversationId=${encodeURIComponent(nextConversationId)}`;

  router.replace(href, {
    scroll: false
  });
}

export function getFriendlyAiError(error: unknown) {
  const message = error instanceof Error ? error.message : "AI 任务提交失败";

  if (message.startsWith("UNAUTHORIZED:")) {
    return "请先登录后再使用 AI 功能。";
  }

  if (message.startsWith("INSUFFICIENT_CREDITS:")) {
    return "积分余额不足，请先充值。";
  }

  if (message.startsWith("INPUT_TOO_LARGE:")) {
    return message.split(":").slice(1).join(":");
  }

  if (message.startsWith("AI_PROVIDER_TIMEOUT:")) {
    return "AI 服务响应超时，请稍后重试。";
  }

  if (message.startsWith("AI_PROVIDER_CONFIG_ERROR:")) {
    return "AI 服务配置不可用，请联系管理员检查模型配置。";
  }

  if (message.startsWith("AI_PROVIDER_BAD_RESPONSE:")) {
    return "AI 返回内容格式异常，请重试。若多次失败，可尝试减少非必要注释或拆分复杂策略。";
  }

  if (message.startsWith("AI_TASK_FAILED:")) {
    return "AI 任务执行失败，请稍后重试。若多次失败，可尝试补充平台信息或拆分复杂策略。";
  }

  return message.includes(":") ? message.split(":").slice(1).join(":") : message;
}

export function createWorkbenchClientRequestId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

export function readTaskSnapshot(value: unknown): AiTaskData["task"] | null {
  const task = readRecord(value);

  if (!task || typeof task.id !== "string") {
    return null;
  }

  return {
    id: task.id,
    type: readNullableString(task.type) ?? "",
    status: readNullableString(task.status) ?? "SUCCEEDED",
    conversationId: readNullableString(task.conversationId),
    sourcePlatform: readNullableString(task.sourcePlatform),
    targetPlatform: readNullableString(task.targetPlatform),
    costPoints: typeof task.costPoints === "number" ? task.costPoints : 0,
    title: readNullableString(task.title),
    promptPreview: readNullableString(task.promptPreview),
    errorCode: readNullableString(task.errorCode),
    errorMessage: readNullableString(task.errorMessage),
    inputFileId: readNullableString(task.inputFileId),
    startedAt: readNullableString(task.startedAt),
    finishedAt: readNullableString(task.finishedAt),
    createdAt: readNullableString(task.createdAt),
    updatedAt: readNullableString(task.updatedAt),
    progress: readRecord(task.progress)
  };
}

export function readAiTaskResult(value: unknown): AiTaskData["result"] | null {
  const result = readRecord(value);

  if (!result) {
    return null;
  }

  return {
    scopeStatus: result.scopeStatus === "out_of_scope" ? "out_of_scope" : "in_scope",
    generatedCode: readNullableString(result.generatedCode),
    explanation: readNullableString(result.explanation),
    migrationNotes: readNullableString(result.migrationNotes),
    riskWarnings: readStringArray(result.riskWarnings),
    reportJson: readRecord(result.reportJson)
  };
}

export function getAiTaskStreamingContent(data: AiTaskData | null | undefined, taskId?: string | null) {
  const directThinking = readNullableString(data?.visibleThinking);
  const directFinal = readNullableString(data?.finalAnswerMarkdown);
  const directParsed = data?.parsedResult ?? null;

  if (directThinking || directFinal || directParsed) {
    return {
      visibleThinking: directThinking ?? "",
      finalAnswerMarkdown: directFinal ?? "",
      parsedResult: directParsed
    };
  }

  const messages = data?.messages ?? [];
  const targetTaskId = taskId ?? data?.task.id ?? null;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role !== "assistant") {
      continue;
    }

    if (targetTaskId && message.taskId !== targetTaskId) {
      continue;
    }

    const contentJson = readRecord(message.contentJson);
    const finalAnswerMarkdown = readNullableString(contentJson?.finalAnswerMarkdown)
      ?? (message.content.includes("## ") ? message.content : "");
    const visibleThinking = readNullableString(contentJson?.visibleThinking) ?? "";
    const parsedResult = readAiTaskResult(contentJson?.parsedResult) ?? readAiTaskResult(contentJson?.result);

    if (finalAnswerMarkdown || visibleThinking || parsedResult) {
      return {
        visibleThinking,
        finalAnswerMarkdown,
        parsedResult
      };
    }
  }

  return {
    visibleThinking: "",
    finalAnswerMarkdown: data?.result ? formatAiTaskResultAsMarkdown(data.result, data.task.type as WorkbenchTaskType) : "",
    parsedResult: data?.result ?? null
  };
}

export function formatAiTaskResultAsMarkdown(result: NonNullable<AiTaskData["result"]>, taskType: WorkbenchTaskType | string | null | undefined) {
  if (taskType === "strategy_generation") {
    return formatStrategyResultAsMarkdown(result);
  }

  if (taskType === "code_analysis") {
    const report = readRecord(result.reportJson);
    const overview = hasReportMarkdownItems(report?.overview)
      ? report?.overview
      : hasReportMarkdownItems([report?.codeStructure, report?.platformDependencies])
        ? [report?.codeStructure, report?.platformDependencies]
        : result.explanation;
    const risks = hasReportMarkdownItems(report?.risks)
      ? report?.risks
      : hasReportMarkdownItems(report?.riskWarnings)
        ? report?.riskWarnings
        : result.riskWarnings;

    return [
      "## 策略概览",
      formatReportItemsAsMarkdown(overview),
      "",
      "## 交易逻辑",
      formatReportItemsAsMarkdown(report?.tradingLogic),
      "",
      "## 关键参数",
      formatReportItemsAsMarkdown(report?.keyParameters ?? report?.parameters),
      "",
      "## 风险提醒",
      formatReportItemsAsMarkdown(risks),
      "",
      "## 优化建议",
      formatReportItemsAsMarkdown(report?.suggestions ?? report?.optimizationSuggestions)
    ].join("\n");
  }

  return [
    "## 目标平台代码",
    result.generatedCode?.trim()
      ? `\`\`\`python\n${result.generatedCode.trim()}\n\`\`\``
      : "暂无可直接运行的目标平台代码。",
    "",
    "## 迁移说明",
    result.migrationNotes?.trim() || "请按目标平台 API 逐项复核后再运行。"
  ].join("\n");
}

function formatReportItemsAsMarkdown(value: unknown) {
  const items = normalizeReportItemsForMarkdown(value);

  if (items.length === 0) {
    return "- 代码中未明确给出";
  }

  return items.map((item) => {
    if (item.lines.length > 0) {
      return [
        `- ${item.title}：`,
        ...item.lines.map((line, index) => `  ${index + 1}. ${line}`)
      ].join("\n");
    }

    return `- ${item.title}：${item.value}`;
  }).join("\n");
}

function hasReportMarkdownItems(value: unknown) {
  return normalizeReportItemsForMarkdown(value).length > 0;
}

function normalizeReportItemsForMarkdown(value: unknown): Array<{ title: string; value: string; lines: string[] }> {
  if (value === null || typeof value === "undefined") {
    return [];
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value).trim();

    return text ? [{ title: "补充说明", value: sanitizeReportMarkdownValue(text), lines: splitReportMarkdownLines(text) }] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeReportItemsForMarkdown(item));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const itemValue = typeof record.value === "string" || typeof record.value === "number" || typeof record.value === "boolean"
      ? String(record.value).trim()
      : "";
    const lines = readReportMarkdownLines(record.lines ?? record.details);

    if (title || itemValue || lines.length) {
      return [{
        title: sanitizeReportMarkdownValue(title || "补充说明"),
        value: sanitizeReportMarkdownValue(itemValue || lines[0] || "代码中未明确给出"),
        lines: lines.length ? lines : splitReportMarkdownLines(itemValue)
      }];
    }
  }

  return [];
}

function splitReportMarkdownLines(value: string) {
  const text = sanitizeReportMarkdownValue(value);

  if (!text || text === "代码中未明确给出") {
    return [];
  }

  return text
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*(?:[-*+]|(?:\d+|[A-Za-z])[\.)\u3001:]|[\(（]?[A-Za-z][\)）]|[一二三四五六七八九十]+[\u3001.])\s*/, "").trim())
    .filter(Boolean);
}

function readReportMarkdownLines(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitReportMarkdownLines(String(item))).filter((item) => item && item !== "代码中未明确给出");
  }

  if (typeof value === "string") {
    return splitReportMarkdownLines(value);
  }

  return [];
}

function sanitizeReportMarkdownValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed || /^\s*[{[]/.test(trimmed) || /\b(scopeStatus|analysisType|reportJson|generatedCode)\b/.test(trimmed)) {
    return "代码中未明确给出";
  }

  return trimmed
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^`{3,}[\w+-]*\s*$/gm, "")
    .replace(/^`{3,}\s*$/gm, "")
    .trim() || "代码中未明确给出";
}

export function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

export function readNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mergeAiTaskData(previous: AiTaskData, next: AiTaskData): AiTaskData {
  return {
    ...previous,
    ...next,
    task: {
      ...previous.task,
      ...next.task,
      events: next.task.events ?? previous.task.events
    },
    events: next.events ?? previous.events
  };
}

async function safeReadApiError(response: Response) {
  try {
    const payload = await response.json() as ApiResponse<unknown>;

    if (!payload.success) {
      return payload.error;
    }
  } catch {
    // Fall through to a generic transport error.
  }

  return {
    code: "AI_TASK_FAILED",
    message: "AI 任务连接失败，请稍后重试"
  };
}

function parseStreamEvent(block: string): AiTaskStreamEventData | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();

  if (!data) {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as AiTaskStreamEventData;

    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function handleWorkbenchStreamEvent(event: AiTaskStreamEventData, handlers: StreamWorkbenchAiTaskHandlers) {
  handlers.onEvent?.(event);

  if (event.type === "task") {
    handlers.onTask?.(event.data);
    return null;
  }

  if (event.type === "thinking_delta") {
    handlers.onThinkingDelta?.(event.delta);
    return null;
  }

  if (event.type === "final_delta") {
    handlers.onFinalDelta?.(event.delta);
    return null;
  }

  if (event.type === "done") {
    const data = {
      ...event.data,
      visibleThinking: event.visibleThinking ?? event.data.visibleThinking,
      finalAnswerMarkdown: event.finalAnswerMarkdown ?? event.data.finalAnswerMarkdown,
      parsedResult: event.parsedResult ?? event.data.parsedResult
    };
    handlers.onDone?.(data, event);
    return data;
  }

  if (event.type === "error") {
    throw new Error(`${event.error.code}:${event.error.message}`);
  }

  return null;
}

function createLegacyMessageAttachment(message: AiMessageData, fileId: string, originalName: string, contentPreview: string | null): MessageAttachmentData {
  const ext = originalName.includes(".") ? `.${originalName.split(".").pop() ?? "txt"}` : ".txt";
  const kind = isImageExtension(ext) ? "image" : "text";

  return {
    id: `legacy-${message.id}-${fileId}`,
    messageId: message.id,
    conversationId: message.conversationId,
    fileId,
    kind,
    role: "input",
    displayOrder: 0,
    caption: originalName,
    createdAt: message.createdAt,
    file: {
      fileId,
      kind,
      originalName,
      ext,
      mimeType: kind === "image" ? `image/${ext === ".jpg" ? "jpeg" : ext.slice(1)}` : "text/plain",
      sizeBytes: 0,
      scanStatus: "PASSED",
      riskFlags: [],
      contentPreview: contentPreview ?? "",
      hasThumbnail: kind === "image",
      thumbnailUrl: kind === "image" ? `/api/v1/files/${encodeURIComponent(fileId)}/thumbnail` : null,
      previewUrl: kind === "image" ? `/api/v1/files/${encodeURIComponent(fileId)}/preview` : null,
      createdAt: message.createdAt
    }
  };
}

function throwTaskStatusError(task: AiTaskData["task"]): never {
  throw new Error(`${task.errorCode ?? "AI_TASK_FAILED"}:${task.errorMessage ?? "AI 任务执行失败，请稍后再试"}`);
}

function getLatestEventSeq(events: AiRunEventData[] | null | undefined) {
  return events?.reduce((latestSeq, event) => Math.max(latestSeq, event.seq), 0) ?? 0;
}

function createAbortError() {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

function getPerfNow() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);

    signal?.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(createAbortError());
    }, { once: true });
  });
}
