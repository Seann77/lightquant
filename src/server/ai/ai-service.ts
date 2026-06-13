import type { AiTask, AiConversation, AiConversationMode, AiConversationStatus, AiMessage, AiMessageAttachmentSummary, AiTaskResult, AiTaskStatus, AiTaskType, Pagination, UploadedFile } from "@/server/domain";
import { getCreditAccountForUser, confirmReservation, refundConfirmedAiTaskCost, releaseReservation, reserveCredits } from "@/server/credits/credit-service";
import { ApiError } from "@/server/http/api-response";
import { getRepository, withRepositoryTransaction } from "@/server/repositories";
import { getAiTaskConfig, getTotalInputChars, parseAiTaskType } from "@/server/ai/ai-task-config";
import { runAiProvider } from "@/server/ai/ai-provider";
import { getAiTaskProgress, setAiTaskProgress } from "@/server/ai/ai-task-progress";
import { getAiModelName, getAiProviderMode, getAiTaskTimeoutMs } from "@/server/env";
import { getUploadedImageDataUrl, inferUploadedFileKind } from "@/server/files/file-service";
import type { AiProviderAttachment } from "@/server/ai/providers/types";

type CreateAiTaskRequest = {
  type: string;
  conversationId?: string;
  messageContent?: string;
  sourcePlatform?: string;
  targetPlatform?: string;
  prompt?: string;
  inputCode?: string;
  inputFileId?: string;
  clientRequestId: string;
};

type ListAiConversationsRequest = {
  page?: number;
  pageSize?: number;
  cursor?: string;
  limit?: number;
  mode?: string;
  status?: string;
};

type GetAiConversationMessagesOptions = {
  cursor?: string;
  direction?: string;
  limit?: number;
  taskLimit?: number;
  includeTaskResults?: string;
};

const MAX_CONTEXT_MESSAGES = 10;
const MAX_CONTEXT_CHARS = 24000;
const DEFAULT_CONVERSATION_CURSOR_LIMIT = 20;
const MAX_CONVERSATION_CURSOR_LIMIT = 50;
const DEFAULT_CONVERSATION_MESSAGE_LIMIT = 20;
const MAX_CONVERSATION_MESSAGE_LIMIT = 100;
const DEFAULT_CONVERSATION_TASK_LIMIT = 5;
const MAX_CONVERSATION_TASK_LIMIT = 30;

export async function createAiTask(userId: string, input: CreateAiTaskRequest, requestId: string) {
  const type = normalizeTaskType(input.type);
  const clientRequestId = normalizeNonEmpty(input.clientRequestId, "clientRequestId");
  const normalized = normalizeTaskInput(type, input);
  const config = getAiTaskConfig(type);
  const repository = getRepository();
  const existing = await repository.findAiTaskByClientRequestId(userId, clientRequestId);

  if (existing) {
    return buildAiTaskResponse(existing, {
      duplicated: true
    });
  }

  const resolvedInput = await resolveInputFile(userId, normalized);
  const conversationDraft = await prepareConversationForTask(userId, type, normalizeOptionalText(input.conversationId));

  assertInputWithinLimit(config, {
    ...resolvedInput,
    inputCode: appendContextForLimit(resolvedInput.inputCode, conversationDraft?.contextText)
  });

  try {
    const task = await withRepositoryTransaction(async () => {
      const transactionRepository = getRepository();
      const now = new Date().toISOString();
      let conversation = conversationDraft?.conversation ?? null;

      if (conversation) {
        conversation = await transactionRepository.updateAiConversation(conversation.id, {
          targetPlatform: resolvedInput.targetPlatform,
          sourcePlatform: resolvedInput.sourcePlatform,
          lastMessageAt: now,
          updatedAt: now
        });
      } else {
        conversation = await transactionRepository.createAiConversation({
          userId,
          mode: getConversationModeForTaskType(type),
          title: createConversationTitle(type, resolvedInput),
          targetPlatform: resolvedInput.targetPlatform,
          sourcePlatform: resolvedInput.sourcePlatform,
          status: "active",
          lastMessageAt: now,
          createdAt: now,
          updatedAt: now
        });
      }

      const createdTask = await transactionRepository.createAiTask({
        userId,
        conversationId: conversation?.id ?? null,
        type,
        status: "PENDING",
        scopeStatus: "in_scope",
        sourcePlatform: resolvedInput.sourcePlatform,
        targetPlatform: resolvedInput.targetPlatform,
        prompt: resolvedInput.prompt,
        inputCode: resolvedInput.inputCode,
        inputFileId: resolvedInput.inputFileId,
        costPoints: config.costPoints,
        clientRequestId,
        requestId,
        errorCode: null,
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
        createdAt: now,
        updatedAt: now
      });

      if (createdTask.requestId !== requestId) {
        return createdTask;
      }

      if (conversation) {
        const userMessage = await transactionRepository.createAiMessage({
          conversationId: conversation.id,
          userId,
          role: "user",
          taskId: null,
          content: getUserMessageContent(type, resolvedInput),
          contentJson: {
            taskType: type,
            targetPlatform: resolvedInput.targetPlatform,
            sourcePlatform: resolvedInput.sourcePlatform,
            prompt: resolvedInput.prompt,
            inputCodePreview: normalizePreview(resolvedInput.inputCode, 500),
            inputFileId: resolvedInput.inputFileId,
            inputFileName: resolvedInput.inputFileName,
            clientRequestId
          },
          createdAt: now
        });

        if (resolvedInput.inputFileId) {
          await transactionRepository.createAiMessageAttachment({
            messageId: userMessage.id,
            conversationId: conversation.id,
            userId,
            fileId: resolvedInput.inputFileId,
            role: "input",
            displayOrder: 0,
            caption: resolvedInput.inputFileName,
            createdAt: now
          });
        }
      }

      await reserveCredits({
        userId,
        taskId: createdTask.id,
        amount: createdTask.costPoints
      });

      return createdTask;
    });

    return buildAiTaskResponse(task, {
      duplicated: task.requestId !== requestId
    });
  } catch (error) {
    throw normalizeTaskError(error);
  }
}

export async function runAiTask(taskId: string, requestId: string) {
  const repository = getRepository();
  let task = await repository.findAiTaskById(taskId);

  if (!task) {
    throw new ApiError("NOT_FOUND", "AI 任务不存在", 404);
  }

  if (task.status === "SUCCEEDED" || task.status === "FAILED" || task.status === "CANCELLED") {
    return buildAiTaskResponse(task, {
      duplicated: true
    });
  }

  const shouldRestartRunningTask = task.status === "RUNNING" && isStaleRunningTask(task);

  if (task.status === "RUNNING" && !shouldRestartRunningTask) {
    return buildAiTaskResponse(task, {
      duplicated: true
    });
  }

  try {
    const now = new Date().toISOString();

    task = await repository.updateAiTask(task.id, {
      status: "RUNNING",
      startedAt: shouldRestartRunningTask ? now : task.startedAt ?? now,
      errorCode: null,
      errorMessage: null,
      updatedAt: now
    });
    const runningProviderTask = task;

    logAiTaskStatus(runningProviderTask, "RUNNING", {
      requestId
    });
    setAiTaskProgress(runningProviderTask, {
      phase: runningProviderTask.type === "code_analysis" || runningProviderTask.type === "code_conversion" ? "scanning" : "processing",
      progressPercent: runningProviderTask.type === "code_analysis" || runningProviderTask.type === "code_conversion" ? 8 : 20,
      statusMessage: runningProviderTask.type === "code_analysis" || runningProviderTask.type === "code_conversion"
        ? "正在识别代码结构和平台依赖。"
        : "正在调用 AI 模型生成结果。"
    });

    const taskConfig = getAiTaskConfig(runningProviderTask.type);
    const conversationContext = await buildProviderConversationContext(runningProviderTask, taskConfig.maxTotalInputChars);
    const providerAttachments = await buildProviderAttachmentsForTask(runningProviderTask);
    const providerResult = await runAiProvider(
      runningProviderTask,
      conversationContext,
      (progress) => setAiTaskProgress(runningProviderTask, progress),
      providerAttachments
    );

    const latestTask = await repository.findAiTaskById(runningProviderTask.id);

    if (!latestTask) {
      throw new ApiError("NOT_FOUND", "AI 任务不存在", 404);
    }

    if (latestTask.status === "SUCCEEDED" || latestTask.status === "FAILED" || latestTask.status === "CANCELLED") {
      return buildAiTaskResponse(latestTask, {
        duplicated: true
      });
    }

    const runningTask = runningProviderTask;
    const completed = await withRepositoryTransaction(async () => {
      const transactionRepository = getRepository();
      const credit = await confirmReservation(runningTask, requestId);
      const finishedAt = new Date().toISOString();
      const result = await transactionRepository.createAiTaskResult({
        taskId: runningTask.id,
        resultType: runningTask.type,
        scopeStatus: providerResult.scopeStatus,
        generatedCode: providerResult.generatedCode,
        explanation: providerResult.explanation,
        migrationNotes: providerResult.migrationNotes,
        riskWarnings: providerResult.riskWarnings,
        reportJson: providerResult.reportJson,
        model: providerResult.model,
        tokenUsage: providerResult.tokenUsage,
        createdAt: finishedAt
      });
      const updatedTask = await transactionRepository.updateAiTask(runningTask.id, {
        status: "SUCCEEDED",
        scopeStatus: providerResult.scopeStatus,
        finishedAt,
        errorCode: null,
        errorMessage: null,
        updatedAt: finishedAt
      });

      await createAssistantMessageForTask(updatedTask, result, finishedAt);

      return {
        credit,
        result,
        task: updatedTask
      };
    });

    logAiTaskStatus(completed.task, "SUCCEEDED", {
      requestId,
      model: completed.result.model
    });
    setAiTaskProgress(completed.task, {
      phase: "completed",
      progressPercent: 100,
      statusMessage: "任务已完成，结果已生成。"
    });

    return buildAiTaskResponse(completed.task, {
      result: completed.result,
      creditAccount: completed.credit.account,
      duplicated: false
    });
  } catch (error) {
    const apiError = normalizeTaskError(error);

    const taskToFail = task;
    if (!taskToFail) {
      throw apiError;
    }

    const latestBeforeFail = await repository.findAiTaskById(taskToFail.id);

    if (latestBeforeFail?.status === "CANCELLED") {
      return buildAiTaskResponse(latestBeforeFail, {
        duplicated: true
      });
    }

    logAiTaskStatus(taskToFail, "FAILED", {
      requestId,
      errorCode: apiError.code,
      message: apiError.message
    });
    setAiTaskProgress(taskToFail, {
      phase: "failed",
      progressPercent: 100,
      failureStage: apiError.code === "AI_PROVIDER_BAD_RESPONSE" ? "validating" : "processing",
      statusMessage: apiError.code === "AI_PROVIDER_TIMEOUT"
        ? "比预计更久，AI 服务响应超时；请稍后重试或减少代码量。"
        : apiError.message
    });

    const latestTask = await withRepositoryTransaction(async () => {
      const transactionRepository = getRepository();
      const failedAt = new Date().toISOString();
      await releaseReservation(taskToFail.id);

      const failedTask = await transactionRepository.updateAiTask(taskToFail.id, {
        status: "FAILED",
        errorCode: apiError.code,
        errorMessage: apiError.message,
        finishedAt: failedAt,
        updatedAt: failedAt
      });

      await createAssistantErrorMessageForTask(failedTask, apiError, failedAt);

      return failedTask;
    });

    await refundConfirmedAiTaskCost(latestTask, requestId);
    throw apiError;
  }
}

export async function createAndRunAiTask(userId: string, input: CreateAiTaskRequest, requestId: string) {
  const created = await createAiTask(userId, input, requestId);

  if (created.result || created.task.status === "SUCCEEDED" || created.task.status === "FAILED" || created.task.status === "CANCELLED") {
    return created;
  }

  return runAiTask(created.task.id, requestId);
}

export async function getAiTaskForUser(userId: string, taskId: string) {
  const task = await getOwnedTask(userId, taskId);

  return {
    task: toTaskResponse(task)
  };
}

export async function getAiTaskResultForUser(userId: string, taskId: string) {
  const task = await getOwnedTask(userId, taskId);

  if (task.status !== "SUCCEEDED") {
    return buildAiTaskResponse(task, {
      result: null
    });
  }

  const result = await getRepository().findAiTaskResult(taskId);

  if (!result) {
    throw new ApiError("NOT_FOUND", "任务结果不存在", 404);
  }

  return buildAiTaskResponse(task, {
    result
  });
}

export async function listAiTasksForUser(
  userId: string,
  pagination: Pagination,
  filters: { type?: string; status?: string }
) {
  const safePagination = normalizePagination(pagination);
  const type = filters.type ? normalizeTaskType(filters.type) : undefined;
  const status = filters.status ? normalizeTaskStatus(filters.status) : undefined;
  const page = await getRepository().listAiTasks(userId, safePagination, { type, status });

  return {
    items: page.items.map(toTaskListItemResponse),
    page: safePagination.page,
    pageSize: safePagination.pageSize,
    total: page.total,
    totalPages: Math.max(1, Math.ceil(page.total / safePagination.pageSize))
  };
}

export async function listAiConversationsForUser(
  userId: string,
  input: ListAiConversationsRequest
) {
  const mode = input.mode ? normalizeConversationMode(input.mode) : undefined;
  const status = input.status ? normalizeConversationStatus(input.status) : "active";
  const useCursor = Boolean(input.cursor || input.limit);

  if (useCursor) {
    const limit = normalizeLimit(input.limit ?? DEFAULT_CONVERSATION_CURSOR_LIMIT, MAX_CONVERSATION_CURSOR_LIMIT, "limit");
    const decodedCursor = input.cursor ? decodeCursor(input.cursor) : undefined;
    const page = await getRepository().listAiConversations(userId, {
      mode: "cursor",
      cursor: decodedCursor,
      limit: limit + 1
    }, { mode, status });
    const hasMore = page.items.length > limit;
    const items = hasMore ? page.items.slice(0, limit) : page.items;
    const lastItem = items.at(-1);

    return {
      items: items.map(toConversationResponse),
      limit,
      nextCursor: hasMore && lastItem ? encodeCursor(lastItem.id, lastItem.lastMessageAt) : null
    };
  }

  const safePagination = normalizePagination({
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 20
  });
  const page = await getRepository().listAiConversations(userId, {
    mode: "page",
    page: safePagination.page,
    pageSize: safePagination.pageSize
  }, { mode, status });

  return {
    items: page.items.map(toConversationResponse),
    page: safePagination.page,
    pageSize: safePagination.pageSize,
    total: page.total ?? 0,
    totalPages: Math.max(1, Math.ceil((page.total ?? 0) / safePagination.pageSize)),
    nextCursor: null
  };
}

export async function getAiConversationMessagesForUser(userId: string, conversationId: string, options: GetAiConversationMessagesOptions = {}) {
  const conversation = await getOwnedConversation(userId, conversationId);
  const repository = getRepository();
  const limit = normalizeLimit(options.limit ?? DEFAULT_CONVERSATION_MESSAGE_LIMIT, MAX_CONVERSATION_MESSAGE_LIMIT, "limit");
  const direction = normalizeMessageDirection(options.direction);
  const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;
  const fetchedMessages = await repository.listAiMessages(conversation.id, {
    limit: limit + 1,
    cursor,
    direction,
    ascending: true
  });
  const { items: messages, nextCursor } = sliceCursorMessages(fetchedMessages, limit, direction);
  const attachmentsByMessageId = await buildMessageAttachmentsByMessageId(userId, messages);
  const taskLimit = normalizeLimit(options.taskLimit ?? DEFAULT_CONVERSATION_TASK_LIMIT, MAX_CONVERSATION_TASK_LIMIT, "taskLimit");
  const recentTasks = await repository.listAiTasksForConversation(conversation.id, {
    limit: taskLimit,
    ascending: false
  });
  const tasks = [...recentTasks].reverse();
  const includeTaskResults = normalizeIncludeTaskResults(options.includeTaskResults);
  const latestTaskId = tasks.at(-1)?.id ?? null;
  const taskResponses = await Promise.all(tasks.map(async (task) => {
    const shouldLoadResult = includeTaskResults === "all" || (includeTaskResults === "latest" && task.id === latestTaskId);

    return toTaskResponse(task, shouldLoadResult ? await repository.findAiTaskResult(task.id) : null);
  }));

  return {
    conversation: toConversationResponse(conversation),
    messages: messages.map((message) => toMessageResponse(message, attachmentsByMessageId.get(message.id) ?? [])),
    tasks: taskResponses,
    nextCursor,
    limit,
    taskLimit
  };
}

export async function cancelAiTaskForUser(userId: string, taskId: string, requestId: string) {
  const task = await getOwnedTask(userId, taskId);

  if (task.status === "SUCCEEDED" || task.status === "FAILED" || task.status === "CANCELLED") {
    return buildAiTaskResponse(task, {
      duplicated: true
    });
  }

  const canceledAt = new Date().toISOString();
  await releaseReservation(task.id);

  const canceledTask = await getRepository().updateAiTask(task.id, {
    status: "CANCELLED",
    errorCode: "TASK_CANCELED",
    errorMessage: "任务已取消",
    finishedAt: canceledAt,
    updatedAt: canceledAt
  });

  setAiTaskProgress(canceledTask, {
    phase: "failed",
    progressPercent: 100,
    failureStage: "processing",
    statusMessage: "任务已取消。"
  });

  await createAssistantErrorMessageForTask(canceledTask, new ApiError("TASK_CANCELED", "任务已取消", 409), canceledAt);
  logAiTaskStatus(canceledTask, "CANCELLED", {
    requestId
  });

  return buildAiTaskResponse(canceledTask, {
    result: null
  });
}

export async function retryAiTaskForUser(userId: string, taskId: string, clientRequestId: string, requestId: string) {
  const task = await getOwnedTask(userId, taskId);

  if (task.status !== "FAILED" && task.status !== "CANCELLED") {
    throw new ApiError("VALIDATION_ERROR", "仅失败或已取消的任务支持重试", 400);
  }

  return createAiTask(
    userId,
    {
      type: task.type,
      conversationId: task.conversationId ?? undefined,
      sourcePlatform: task.sourcePlatform ?? undefined,
      targetPlatform: task.targetPlatform ?? undefined,
      prompt: task.prompt ?? undefined,
      inputCode: task.inputFileId ? undefined : task.inputCode ?? undefined,
      inputFileId: task.inputFileId ?? undefined,
      clientRequestId
    },
    requestId
  );
}

function toTaskListItemResponse(task: AiTask) {
  return {
    id: task.id,
    type: task.type,
    status: task.status,
    scopeStatus: task.scopeStatus,
    conversationId: task.conversationId,
    sourcePlatform: task.sourcePlatform,
    targetPlatform: task.targetPlatform,
    title: getTaskListTitle(task),
    promptPreview: normalizePreview(task.prompt),
    hasInputCode: Boolean(task.inputCode),
    hasInputFile: Boolean(task.inputFileId),
    costPoints: task.costPoints,
    errorCode: task.errorCode,
    errorMessage: normalizePreview(task.errorMessage, 80),
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

export function toTaskResponse(task: AiTask, result?: AiTaskResult | null) {
  return {
    id: task.id,
    type: task.type,
    status: task.status,
    scopeStatus: task.scopeStatus,
    sourcePlatform: task.sourcePlatform,
    targetPlatform: task.targetPlatform,
    title: getTaskListTitle(task),
    promptPreview: normalizePreview(task.prompt),
    hasInputCode: Boolean(task.inputCode),
    hasInputFile: Boolean(task.inputFileId),
    inputFileId: task.inputFileId,
    costPoints: task.costPoints,
    clientRequestId: task.clientRequestId,
    errorCode: task.errorCode,
    errorMessage: normalizePreview(task.errorMessage, 160),
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    progress: getAiTaskProgress(task, result)
  };
}

export function toResultResponse(result: AiTaskResult) {
  return {
    taskId: result.taskId,
    resultType: result.resultType,
    scopeStatus: result.scopeStatus,
    generatedCode: result.generatedCode,
    explanation: result.explanation,
    migrationNotes: result.migrationNotes,
    riskWarnings: result.riskWarnings,
    reportJson: result.reportJson,
    model: result.model,
    tokenUsage: result.tokenUsage,
    createdAt: result.createdAt
  };
}

function toConversationResponse(conversation: AiConversation) {
  return {
    id: conversation.id,
    mode: conversation.mode,
    title: conversation.title,
    targetPlatform: conversation.targetPlatform,
    sourcePlatform: conversation.sourcePlatform,
    status: conversation.status,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
}

function toMessageResponse(message: AiMessage, attachments: AiMessageAttachmentSummary[] = []) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    taskId: message.taskId,
    content: message.content,
    contentJson: message.contentJson,
    attachments: attachments.map(toAttachmentResponse),
    createdAt: message.createdAt
  };
}

function toAttachmentResponse(attachment: AiMessageAttachmentSummary) {
  const thumbnailUrl = attachment.file.kind === "image" ? `/api/v1/files/${encodeURIComponent(attachment.file.fileId)}/thumbnail` : null;
  const previewUrl = attachment.file.kind === "image" ? `/api/v1/files/${encodeURIComponent(attachment.file.fileId)}/preview` : null;

  return {
    id: attachment.id,
    messageId: attachment.messageId,
    conversationId: attachment.conversationId,
    fileId: attachment.fileId,
    kind: attachment.file.kind,
    originalName: attachment.file.originalName,
    ext: attachment.file.ext,
    mimeType: attachment.file.mimeType,
    sizeBytes: attachment.file.sizeBytes,
    scanStatus: attachment.file.scanStatus,
    riskFlags: attachment.file.riskFlags,
    contentPreview: attachment.file.contentPreview,
    hasThumbnail: attachment.file.hasThumbnail,
    thumbnailUrl,
    previewUrl,
    role: attachment.role,
    displayOrder: attachment.displayOrder,
    caption: attachment.caption,
    createdAt: attachment.createdAt,
    file: {
      ...attachment.file,
      thumbnailUrl,
      previewUrl
    }
  };
}

async function buildAiTaskResponse(
  task: AiTask,
  options: {
    result?: AiTaskResult | null;
    creditAccount?: Awaited<ReturnType<typeof getCreditAccountForUser>>;
    duplicated?: boolean;
  } = {}
) {
  const result = options.result === undefined ? await getRepository().findAiTaskResult(task.id) : options.result;
  const conversation = task.conversationId ? await getRepository().findAiConversationById(task.conversationId) : null;
  const messages = conversation
    ? await getRepository().listAiMessages(conversation.id, {
        ascending: true
      })
    : [];
  const attachmentsByMessageId = conversation ? await buildMessageAttachmentsByMessageId(task.userId, messages) : new Map<string, AiMessageAttachmentSummary[]>();

  return {
    task: toTaskResponse(task, result),
    result: result ? toResultResponse(result) : null,
    creditAccount: options.creditAccount ?? await getCreditAccountForUser(task.userId),
    duplicated: options.duplicated ?? false,
    conversation: conversation ? toConversationResponse(conversation) : null,
    messages: messages.map((message) => toMessageResponse(message, attachmentsByMessageId.get(message.id) ?? []))
  };
}

async function buildMessageAttachmentsByMessageId(userId: string, messages: AiMessage[]) {
  const repository = getRepository();
  const attachments = await repository.listAiMessageAttachmentsForMessages(userId, messages.map((message) => message.id));
  const byMessageId = new Map<string, AiMessageAttachmentSummary[]>();

  for (const attachment of attachments) {
    const list = byMessageId.get(attachment.messageId) ?? [];
    list.push(attachment);
    byMessageId.set(attachment.messageId, list);
  }

  for (const message of messages) {
    if ((byMessageId.get(message.id)?.length ?? 0) > 0) {
      continue;
    }

    const fallback = await createLegacyAttachmentSummaryForMessage(userId, message);

    if (fallback) {
      byMessageId.set(message.id, [fallback]);
    }
  }

  return byMessageId;
}

async function createLegacyAttachmentSummaryForMessage(userId: string, message: AiMessage): Promise<AiMessageAttachmentSummary | null> {
  const contentJson = readRecord(message.contentJson);
  const inputFileId = typeof contentJson?.inputFileId === "string" ? contentJson.inputFileId : null;

  if (!inputFileId) {
    return null;
  }

  const file = await getRepository().findUploadedFileById(inputFileId);

  if (!file || file.userId !== userId) {
    return null;
  }

  return toLegacyAttachmentSummary(message, file);
}

function toLegacyAttachmentSummary(message: AiMessage, file: UploadedFile): AiMessageAttachmentSummary {
  return {
    id: `legacy-${message.id}-${file.id}`,
    messageId: message.id,
    conversationId: message.conversationId,
    userId: message.userId,
    fileId: file.id,
    role: "input",
    displayOrder: 0,
    caption: file.originalName,
    createdAt: message.createdAt,
    file: {
      fileId: file.id,
      kind: inferUploadedFileKind(file),
      originalName: file.originalName,
      ext: file.ext,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      scanStatus: file.scanStatus,
      riskFlags: file.riskFlags,
      contentPreview: createContentPreview(file.contentText, file),
      hasThumbnail: inferUploadedFileKind(file) === "image" && Boolean(file.thumbnailKey ?? file.storageKey),
      createdAt: file.createdAt
    }
  };
}

async function getOwnedTask(userId: string, taskId: string) {
  const task = await getRepository().findAiTaskById(taskId);

  if (!task) {
    throw new ApiError("NOT_FOUND", "AI 任务不存在", 404);
  }

  if (task.userId !== userId) {
    throw new ApiError("FORBIDDEN", "无权查看该任务", 403);
  }

  return task;
}

async function getOwnedConversation(userId: string, conversationId: string) {
  const conversation = await getRepository().findAiConversationById(conversationId);

  if (!conversation) {
    throw new ApiError("NOT_FOUND", "会话不存在", 404);
  }

  if (conversation.userId !== userId) {
    throw new ApiError("FORBIDDEN", "无权查看该会话", 403);
  }

  return conversation;
}

function normalizeTaskType(value: string): AiTaskType {
  return parseAiTaskType(value);
}

function normalizeTaskStatus(value: string): AiTaskStatus {
  if (value === "PENDING" || value === "RUNNING" || value === "SUCCEEDED" || value === "FAILED" || value === "CANCELLED") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "status 参数不正确", 400);
}

function normalizeConversationMode(value: string): AiConversationMode {
  if (value === "strategy" || value === "convert" || value === "analysis") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "mode 参数不正确", 400);
}

function normalizeConversationStatus(value: string): AiConversationStatus {
  if (value === "active" || value === "archived") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "status 参数不正确", 400);
}

function normalizeTaskInput(type: AiTaskType, input: CreateAiTaskRequest) {
  const prompt = normalizeOptionalText(input.messageContent) ?? normalizeOptionalText(input.prompt);
  const inputCode = normalizeOptionalText(input.inputCode);
  const inputFileId = normalizeOptionalText(input.inputFileId);
  const sourcePlatform = normalizeOptionalText(input.sourcePlatform);
  const targetPlatform = normalizeOptionalText(input.targetPlatform);

  if (type === "strategy_generation" && !prompt && !inputCode && !inputFileId) {
    throw new ApiError("VALIDATION_ERROR", "请输入策略需求", 400);
  }

  if (type === "code_conversion" && !inputCode && !inputFileId) {
    throw new ApiError("VALIDATION_ERROR", "请输入需要转换的代码", 400);
  }

  if (type === "code_analysis" && !inputCode && !inputFileId) {
    throw new ApiError("VALIDATION_ERROR", "请输入需要解析的代码", 400);
  }

  return {
    prompt,
    inputCode,
    inputFileId,
    sourcePlatform,
    targetPlatform
  };
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();

  return normalized || null;
}

async function resolveInputFile(
  userId: string,
  input: {
    sourcePlatform: string | null;
    targetPlatform: string | null;
    prompt: string | null;
    inputCode: string | null;
    inputFileId: string | null;
    inputFileName?: string | null;
  }
) {
  if (!input.inputFileId) {
    return {
      ...input,
      inputFileName: null
    };
  }

  const uploadedFile = await getRepository().findUploadedFileById(input.inputFileId);

  if (!uploadedFile) {
    throw new ApiError("NOT_FOUND", "上传文件不存在", 404);
  }

  if (uploadedFile.userId !== userId) {
    throw new ApiError("FORBIDDEN", "无权使用该上传文件", 403);
  }

  if (uploadedFile.parseStatus !== "SUCCEEDED") {
    throw new ApiError("FILE_PARSE_FAILED", "上传文件解析失败，请重新上传", 400);
  }

  if (uploadedFile.scanStatus === "BLOCKED") {
    throw new ApiError("FILE_BLOCKED", "文件包含疑似密钥或私钥，请脱敏后重新上传", 400);
  }

  if (inferUploadedFileKind(uploadedFile) === "image") {
    return {
      ...input,
      inputFileName: uploadedFile.originalName
    };
  }

  if (!uploadedFile.contentText) {
    throw new ApiError("FILE_PARSE_FAILED", "上传文件没有可用文本内容，请重新上传", 400);
  }

  return {
    ...input,
    inputCode: mergeInputCode(input.inputCode, uploadedFile.contentText, uploadedFile.originalName),
    inputFileName: uploadedFile.originalName
  };
}

async function prepareConversationForTask(
  userId: string,
  type: AiTaskType,
  conversationId: string | null | undefined
) {
  if (!conversationId) {
    return {
      conversation: null,
      contextText: ""
    };
  }

  const conversation = await getOwnedConversation(userId, conversationId);
  const expectedMode = getConversationModeForTaskType(type);

  if (conversation.mode !== expectedMode) {
    throw new ApiError("VALIDATION_ERROR", "当前会话不属于该 AI 模块", 400);
  }

  const messages = await getRepository().listAiMessages(conversation.id, {
    limit: MAX_CONTEXT_MESSAGES,
    ascending: true
  });
  const contextText = trimToMaxChars(buildConversationContextText(messages), MAX_CONTEXT_CHARS);

  return {
    conversation,
    contextText
  };
}

async function buildProviderConversationContext(task: AiTask, maxTotalInputChars: number) {
  if (!task.conversationId) {
    return undefined;
  }

  const messages = await getRepository().listAiMessages(task.conversationId, {
    limit: MAX_CONTEXT_MESSAGES,
    ascending: true
  });
  const baseChars = getTotalInputChars(task);
  const maxContextChars = Math.max(0, Math.min(MAX_CONTEXT_CHARS, maxTotalInputChars - baseChars));

  if (maxContextChars === 0) {
    return undefined;
  }

  return trimToMaxChars(buildConversationContextText(messages), maxContextChars);
}

async function buildProviderAttachmentsForTask(task: AiTask): Promise<AiProviderAttachment[]> {
  if (!task.inputFileId) {
    return [];
  }

  const file = await getRepository().findUploadedFileById(task.inputFileId);

  if (!file || file.userId !== task.userId || inferUploadedFileKind(file) !== "image") {
    return [];
  }

  const dataUrl = await getUploadedImageDataUrl(file);

  if (!dataUrl) {
    return [];
  }

  return [
    {
      fileId: file.id,
      kind: "image",
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      dataUrl
    }
  ];
}

function buildConversationContextText(messages: AiMessage[]) {
  return messages
    .map((message) => {
      const label = message.role === "user" ? "用户" : message.role === "assistant" ? "助手" : "系统";
      const parts = [`${label}：${truncateForContext(message.content, 2000)}`];
      const result = readRecord(message.contentJson?.result);
      const error = readRecord(message.contentJson?.error);
      const generatedCode = typeof result?.generatedCode === "string" ? result.generatedCode : "";
      const explanation = typeof result?.explanation === "string" ? result.explanation : "";

      if (explanation) {
        parts.push(`说明摘要：${truncateForContext(explanation, 1200)}`);
      }

      if (generatedCode) {
        parts.push(`生成/修改代码：\n${truncateForContext(generatedCode, 8000)}`);
      }

      if (error?.message) {
        parts.push(`上一轮错误：${truncateForContext(String(error.message), 800)}`);
      }

      return parts.join("\n");
    })
    .join("\n\n");
}

function appendContextForLimit(inputCode: string | null, contextText: string | null | undefined) {
  if (!contextText) {
    return inputCode;
  }

  return [inputCode, contextText].filter(Boolean).join("\n\n");
}

function getConversationModeForTaskType(type: AiTaskType): AiConversationMode {
  if (type === "code_conversion") {
    return "convert";
  }

  if (type === "code_analysis") {
    return "analysis";
  }

  return "strategy";
}

function createConversationTitle(type: AiTaskType, input: {
  sourcePlatform: string | null;
  targetPlatform: string | null;
  prompt: string | null;
  inputFileName?: string | null;
}) {
  if (type === "code_conversion") {
    const platformPair = input.sourcePlatform && input.targetPlatform
      ? `${input.sourcePlatform} 转 ${input.targetPlatform}`
      : "平台代码转换";
    return normalizePreview(input.prompt || platformPair, 36) ?? platformPair;
  }

  if (type === "code_analysis") {
    const base = input.sourcePlatform ? `${input.sourcePlatform} 代码解析` : "代码解析";
    return normalizePreview(input.prompt || input.inputFileName || base, 36) ?? base;
  }

  const base = input.prompt || (input.inputFileName ? `文件：${input.inputFileName}` : "策略生成会话");

  return normalizePreview(base, 36) ?? "策略生成会话";
}

function getUserMessageContent(type: AiTaskType, input: {
  sourcePlatform: string | null;
  targetPlatform: string | null;
  prompt: string | null;
  inputCode: string | null;
  inputFileName?: string | null;
}) {
  if (type === "code_conversion") {
    const platformText = input.sourcePlatform && input.targetPlatform ? `${input.sourcePlatform} → ${input.targetPlatform}` : "平台代码转换";
    const sourceText = input.inputFileName
      ? `文件：${input.inputFileName}`
      : normalizePreview(input.inputCode, 120) ?? "代码输入";
    const requirement = input.prompt ? `；要求：${normalizePreview(input.prompt, 120)}` : "";

    return `${platformText}；${sourceText}${requirement}`;
  }

  if (type === "code_analysis") {
    const platformText = input.sourcePlatform ? `${input.sourcePlatform} 代码解析` : "代码解析";
    const sourceText = input.inputFileName
      ? `文件：${input.inputFileName}`
      : normalizePreview(input.inputCode, 120) ?? "代码输入";

    return `${platformText}；${sourceText}`;
  }

  return input.prompt || (input.inputFileName ? `已上传文件：${input.inputFileName}` : "已上传文件输入");
}

async function createAssistantMessageForTask(task: AiTask, result: AiTaskResult, createdAt: string) {
  if (!task.conversationId) {
    return;
  }

  const repository = getRepository();

  await repository.createAiMessage({
    conversationId: task.conversationId,
    userId: task.userId,
    role: "assistant",
    taskId: task.id,
    content: getAssistantMessageContent(result),
    contentJson: {
      task: toTaskResponse(task),
      result: toResultResponse(result),
      visibleSteps: buildVisibleStepsForTask(task, "succeeded")
    },
    createdAt
  });
  await repository.updateAiConversation(task.conversationId, {
    targetPlatform: task.targetPlatform,
    sourcePlatform: task.sourcePlatform,
    lastMessageAt: createdAt,
    updatedAt: createdAt
  });
}

async function createAssistantErrorMessageForTask(task: AiTask, error: ApiError, createdAt: string) {
  if (!task.conversationId) {
    return;
  }

  const repository = getRepository();

  await repository.createAiMessage({
    conversationId: task.conversationId,
    userId: task.userId,
    role: "assistant",
    taskId: task.id,
    content: error.message,
    contentJson: {
      task: toTaskResponse(task),
      error: {
        code: error.code,
        message: error.message
      },
      visibleSteps: buildVisibleStepsForTask(task, "failed")
    },
    createdAt
  });
  await repository.updateAiConversation(task.conversationId, {
    targetPlatform: task.targetPlatform,
    sourcePlatform: task.sourcePlatform,
    lastMessageAt: createdAt,
    updatedAt: createdAt
  });
}

function getAssistantMessageContent(result: AiTaskResult) {
  if (result.scopeStatus === "out_of_scope") {
    return result.explanation || "当前请求超出该 AI 模块范围。";
  }

  if (result.resultType === "code_conversion") {
    return result.explanation || (result.generatedCode ? "已完成平台代码转换，请查看目标平台代码。" : "已完成平台代码转换。");
  }

  if (result.resultType === "code_analysis") {
    return result.explanation || "已完成代码解析报告。";
  }

  return result.explanation || (result.generatedCode ? "已完成策略生成，请查看下方代码。" : "已完成处理。");
}

function buildVisibleStepsForTask(task: AiTask, status: "succeeded" | "failed") {
  const action = task.type === "code_conversion" ? "转换方案" : task.type === "code_analysis" ? "解析报告" : "策略修改方案";

  return [
    "读取本轮需求",
    task.conversationId ? "载入上一轮对话记忆" : "",
    task.targetPlatform ? `识别目标平台：${task.targetPlatform}` : "识别目标平台",
    task.inputFileId ? "检查上传代码与错误信息" : "",
    "匹配平台兼容规则",
    status === "failed" ? "记录失败原因" : `生成${action}`,
    status === "failed" ? "整理可继续追问的错误信息" : "整理最终结果"
  ].filter(Boolean);
}

function trimToMaxChars(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(Math.max(0, value.length - maxLength))}`;
}

function truncateForContext(value: string, maxLength: number) {
  const normalized = value.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function assertInputWithinLimit(
  config: ReturnType<typeof getAiTaskConfig>,
  input: {
    sourcePlatform: string | null;
    targetPlatform: string | null;
    prompt: string | null;
    inputCode: string | null;
    inputFileId?: string | null;
  }
) {
  const totalInputChars = getTotalInputChars(input);

  if (totalInputChars > config.maxTotalInputChars) {
    throw new ApiError(
      "INPUT_TOO_LARGE",
      `${config.displayName}内容过长，请拆分提交，或等待分段处理版本。当前 ${totalInputChars.toLocaleString("zh-CN")} 字符，上限 ${config.maxTotalInputChars.toLocaleString("zh-CN")} 字符。`,
      413
    );
  }
}

function mergeInputCode(inputCode: string | null, fileText: string, originalName: string) {
  const fileBlock = `# Uploaded file: ${originalName}\n${fileText}`;

  return inputCode ? `${inputCode}\n\n${fileBlock}` : fileBlock;
}

function normalizeNonEmpty(value: string, field: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new ApiError("VALIDATION_ERROR", `${field} 参数不正确`, 400);
  }

  return normalized;
}

function normalizePagination(pagination: Pagination): Pagination {
  if (!Number.isInteger(pagination.page) || pagination.page < 1) {
    throw new ApiError("VALIDATION_ERROR", "分页页码不正确", 400);
  }

  if (!Number.isInteger(pagination.pageSize) || pagination.pageSize < 1 || pagination.pageSize > 50) {
    throw new ApiError("VALIDATION_ERROR", "分页大小不正确", 400);
  }

  return pagination;
}

function normalizeLimit(value: number, max: number, field: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new ApiError("VALIDATION_ERROR", `${field} 参数不正确`, 400);
  }

  return Math.min(value, max);
}

function normalizeMessageDirection(value: string | undefined): "before" | "after" {
  if (!value || value === "before") {
    return "before";
  }

  if (value === "after") {
    return "after";
  }

  throw new ApiError("VALIDATION_ERROR", "direction 参数不正确", 400);
}

function normalizeIncludeTaskResults(value: string | undefined): "none" | "latest" | "all" {
  if (!value || value === "latest") {
    return "latest";
  }

  if (value === "none" || value === "all") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "includeTaskResults 参数不正确", 400);
}

function sliceCursorMessages(messages: AiMessage[], limit: number, direction: "before" | "after") {
  if (messages.length <= limit) {
    return {
      items: messages,
      nextCursor: null
    };
  }

  if (direction === "after") {
    const items = messages.slice(0, limit);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor: lastItem ? encodeCursor(lastItem.id, lastItem.createdAt) : null
    };
  }

  const items = messages.slice(1);
  const firstItem = items[0];

  return {
    items,
    nextCursor: firstItem ? encodeCursor(firstItem.id, firstItem.createdAt) : null
  };
}

function encodeCursor(id: string, createdAt: string) {
  return Buffer.from(JSON.stringify({ id, createdAt }), "utf8").toString("base64url");
}

function decodeCursor(cursor: string) {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      id?: unknown;
      createdAt?: unknown;
    };

    if (typeof decoded.id !== "string" || typeof decoded.createdAt !== "string" || Number.isNaN(Date.parse(decoded.createdAt))) {
      throw new Error("Invalid cursor shape");
    }

    return {
      id: decoded.id,
      createdAt: decoded.createdAt
    };
  } catch {
    throw new ApiError("VALIDATION_ERROR", "cursor 参数不正确", 400);
  }
}

function normalizeTaskError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  console.error("[ai-task] unexpected failure", error);

  return new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请稍后再试", 500);
}

function logAiTaskStatus(
  task: AiTask,
  status: AiTaskStatus,
  details: {
    requestId: string;
    errorCode?: string | null;
    message?: string | null;
    model?: string | null;
  }
) {
  const providerDiagnostics = getAiProviderDiagnostics();
  const payload = {
    requestId: details.requestId,
    taskId: task.id,
    taskType: task.type,
    inputChars: getTotalInputChars(task),
    provider: providerDiagnostics.provider,
    model: details.model ?? providerDiagnostics.model,
    errorCode: details.errorCode ?? null,
    status,
    message: normalizePreview(details.message ?? null, 180)
  };

  if (status === "FAILED") {
    console.error("[ai-task] status", payload);
    return;
  }

  console.info("[ai-task] status", payload);
}

function getAiProviderDiagnostics() {
  try {
    const provider = getAiProviderMode();

    return {
      provider,
      model: getAiModelName(provider)
    };
  } catch {
    return {
      provider: "unavailable",
      model: "unavailable"
    };
  }
}

function getTaskListTitle(task: AiTask) {
  const promptPreview = normalizePreview(task.prompt, 24);

  if (promptPreview) {
    return promptPreview;
  }

  const label: Record<AiTaskType, string> = {
    strategy_generation: "策略生成",
    code_conversion: "代码转换",
    code_analysis: "代码解析"
  };

  return task.inputFileId ? `${label[task.type]} · 文件输入` : label[task.type];
}

function normalizePreview(value: string | null, maxLength = 60) {
  const normalized = value?.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function createContentPreview(text: string | null, file?: Pick<UploadedFile, "originalName" | "ext" | "mimeType" | "kind">) {
  if (text) {
    return text.length > 800 ? `${text.slice(0, 800)}...` : text;
  }

  if (file && inferUploadedFileKind(file) === "image") {
    return `图片附件：${file.originalName}`;
  }

  return "";
}

function isStaleRunningTask(task: AiTask) {
  if (!task.startedAt) {
    return true;
  }

  const startedAt = new Date(task.startedAt).getTime();

  if (!Number.isFinite(startedAt)) {
    return true;
  }

  const staleAfterMs = Math.max(getAiTaskTimeoutMs() * 2, 2 * 60 * 1000);

  return Date.now() - startedAt > staleAfterMs;
}
