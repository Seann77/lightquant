import type { AiTask, AiTaskResult, AiTaskStatus, AiTaskType, Pagination } from "@/server/domain";
import { getCreditAccountForUser, confirmReservation, refundConfirmedAiTaskCost, releaseReservation, reserveCredits } from "@/server/credits/credit-service";
import { ApiError } from "@/server/http/api-response";
import { getRepository } from "@/server/repositories";
import { getAiTaskCost } from "@/server/ai/ai-pricing";
import { runAiProvider } from "@/server/ai/ai-provider";

type CreateAiTaskRequest = {
  type: string;
  sourcePlatform?: string;
  targetPlatform?: string;
  prompt?: string;
  inputCode?: string;
  clientRequestId: string;
};

export async function createAndRunAiTask(userId: string, input: CreateAiTaskRequest, requestId: string) {
  const type = normalizeTaskType(input.type);
  const clientRequestId = normalizeNonEmpty(input.clientRequestId, "clientRequestId");
  const normalized = normalizeTaskInput(type, input);
  const repository = getRepository();
  const existing = await repository.findAiTaskByClientRequestId(userId, clientRequestId);

  if (existing) {
    const result = await repository.findAiTaskResult(existing.id);

    return {
      task: toTaskResponse(existing),
      result: result ? toResultResponse(result) : null,
      creditAccount: await getCreditAccountForUser(userId),
      duplicated: true
    };
  }

  const now = new Date().toISOString();
  let task = await repository.createAiTask({
    userId,
    type,
    status: "PENDING",
    sourcePlatform: normalized.sourcePlatform,
    targetPlatform: normalized.targetPlatform,
    prompt: normalized.prompt,
    inputCode: normalized.inputCode,
    costPoints: getAiTaskCost(type),
    clientRequestId,
    requestId,
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: now,
    updatedAt: now
  });

  try {
    await reserveCredits({
      userId,
      taskId: task.id,
      amount: task.costPoints
    });

    task = await repository.updateAiTask(task.id, {
      status: "RUNNING",
      startedAt: new Date().toISOString(),
      errorCode: null,
      errorMessage: null,
      updatedAt: new Date().toISOString()
    });

    const providerResult = await runAiProvider(task);
    const result = await repository.createAiTaskResult({
      taskId: task.id,
      resultType: task.type,
      generatedCode: providerResult.generatedCode,
      explanation: providerResult.explanation,
      migrationNotes: providerResult.migrationNotes,
      riskWarnings: providerResult.riskWarnings,
      reportJson: providerResult.reportJson,
      model: providerResult.model,
      tokenUsage: providerResult.tokenUsage,
      createdAt: new Date().toISOString()
    });
    task = await repository.updateAiTask(task.id, {
      status: "SUCCEEDED",
      finishedAt: new Date().toISOString(),
      errorCode: null,
      errorMessage: null,
      updatedAt: new Date().toISOString()
    });
    const credit = await confirmReservation(task, requestId);

    return {
      task: toTaskResponse(task),
      result: toResultResponse(result),
      creditAccount: credit.account,
      duplicated: false
    };
  } catch (error) {
    const apiError = normalizeTaskError(error);
    await releaseReservation(task.id);

    const latestTask = await repository.updateAiTask(task.id, {
      status: "FAILED",
      errorCode: apiError.code,
      errorMessage: apiError.message,
      finishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await refundConfirmedAiTaskCost(latestTask, requestId);
    throw apiError;
  }
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
    return {
      task: toTaskResponse(task),
      result: null
    };
  }

  const result = await getRepository().findAiTaskResult(taskId);

  if (!result) {
    throw new ApiError("NOT_FOUND", "任务结果不存在", 404);
  }

  return {
    task: toTaskResponse(task),
    result: toResultResponse(result)
  };
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
    items: page.items.map(toTaskResponse),
    page: safePagination.page,
    pageSize: safePagination.pageSize,
    total: page.total,
    totalPages: Math.max(1, Math.ceil(page.total / safePagination.pageSize))
  };
}

export function toTaskResponse(task: AiTask) {
  return {
    id: task.id,
    type: task.type,
    status: task.status,
    sourcePlatform: task.sourcePlatform,
    targetPlatform: task.targetPlatform,
    prompt: task.prompt,
    inputCode: task.inputCode,
    costPoints: task.costPoints,
    clientRequestId: task.clientRequestId,
    errorCode: task.errorCode,
    errorMessage: task.errorMessage,
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

export function toResultResponse(result: AiTaskResult) {
  return {
    taskId: result.taskId,
    resultType: result.resultType,
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

function normalizeTaskType(value: string): AiTaskType {
  if (value === "strategy_generation" || value === "code_conversion" || value === "code_analysis") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "type 参数不正确", 400);
}

function normalizeTaskStatus(value: string): AiTaskStatus {
  if (value === "PENDING" || value === "RUNNING" || value === "SUCCEEDED" || value === "FAILED" || value === "CANCELLED") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "status 参数不正确", 400);
}

function normalizeTaskInput(type: AiTaskType, input: CreateAiTaskRequest) {
  const prompt = normalizeOptionalText(input.prompt);
  const inputCode = normalizeOptionalText(input.inputCode);
  const sourcePlatform = normalizeOptionalText(input.sourcePlatform);
  const targetPlatform = normalizeOptionalText(input.targetPlatform);

  if (type === "strategy_generation" && !prompt && !inputCode) {
    throw new ApiError("VALIDATION_ERROR", "请输入策略需求", 400);
  }

  if (type === "code_conversion" && !inputCode) {
    throw new ApiError("VALIDATION_ERROR", "请输入需要转换的代码", 400);
  }

  if (type === "code_analysis" && !inputCode) {
    throw new ApiError("VALIDATION_ERROR", "请输入需要解析的代码", 400);
  }

  return {
    prompt,
    inputCode,
    sourcePlatform,
    targetPlatform
  };
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized.slice(0, 20000) : null;
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

function normalizeTaskError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError("AI_TASK_FAILED", "AI 任务执行失败，请稍后再试", 500);
}

