import type { AiTask, AiTaskResult, AiTaskType } from "@/server/domain";
import { getAiTaskConfig, getTotalInputChars } from "@/server/ai/ai-task-config";

export type AiTaskProgressPhase =
  | "queued"
  | "scanning"
  | "chunking"
  | "processing"
  | "merging"
  | "validating"
  | "completed"
  | "failed";

export type AiTaskProgressSnapshot = {
  phase: AiTaskProgressPhase;
  phaseLabel: string;
  progressPercent: number;
  estimatedSecondsMin: number;
  estimatedSecondsMax: number;
  statusMessage: string;
  inputChars: number;
  processingMode: "single" | "chunked";
  chunkCount: number | null;
  completedChunks: number;
  currentChunk: number | null;
  startedAt: string | null;
  updatedAt: string;
  failureStage?: string | null;
};

export type AiTaskProgressUpdate = Partial<Omit<AiTaskProgressSnapshot, "updatedAt">>;

declare global {
  var __lightquantAiTaskProgress: Map<string, AiTaskProgressSnapshot> | undefined;
}

const progressStore = globalThis.__lightquantAiTaskProgress ?? new Map<string, AiTaskProgressSnapshot>();
globalThis.__lightquantAiTaskProgress = progressStore;

export function setAiTaskProgress(task: AiTask, update: AiTaskProgressUpdate) {
  const current = progressStore.get(task.id);
  const now = new Date().toISOString();
  const next: AiTaskProgressSnapshot = normalizeProgress(task, {
    ...current,
    ...update,
    updatedAt: now
  });

  progressStore.set(task.id, next);
  return next;
}

export function getAiTaskProgress(task: AiTask, result?: AiTaskResult | null) {
  if (result) {
    return buildCompletedProgress(task, result);
  }

  const existing = progressStore.get(task.id);

  if (existing) {
    return normalizeProgress(task, existing);
  }

  if (task.status === "FAILED" || task.status === "CANCELLED") {
    return normalizeProgress(task, {
      phase: "failed",
      failureStage: inferFailureStage(task.errorCode),
      statusMessage: buildFailureStatusMessage(task.errorCode)
    });
  }

  if (task.status === "SUCCEEDED") {
    return normalizeProgress(task, {
      phase: "completed",
      progressPercent: 100,
      statusMessage: "任务已完成。"
    });
  }

  if (task.status === "RUNNING") {
    return normalizeProgress(task, {
      phase: task.type === "code_analysis" || task.type === "code_conversion" ? "scanning" : "processing",
      progressPercent: task.type === "code_analysis" || task.type === "code_conversion" ? 18 : 40
    });
  }

  return normalizeProgress(task, {
    phase: "queued",
    progressPercent: 2
  });
}

export function clearAiTaskProgress(taskId: string) {
  progressStore.delete(taskId);
}

function normalizeProgress(task: AiTask, input: Partial<AiTaskProgressSnapshot>): AiTaskProgressSnapshot {
  const phase = input.phase ?? "queued";
  const inputChars = input.inputChars ?? getTotalInputChars(task);
  const processingMode = input.processingMode ?? inferProcessingMode(task);
  const chunkCount = input.chunkCount ?? null;
  const completedChunks = Math.max(0, input.completedChunks ?? 0);
  const currentChunk = input.currentChunk ?? null;
  const estimates = estimateSeconds(task.type, {
    processingMode,
    chunkCount,
    completedChunks,
    phase
  });

  return {
    phase,
    phaseLabel: input.phaseLabel ?? phaseLabel(task.type, phase),
    progressPercent: clampPercent(input.progressPercent ?? estimatePercent(phase, processingMode, chunkCount, completedChunks)),
    estimatedSecondsMin: input.estimatedSecondsMin ?? estimates.min,
    estimatedSecondsMax: input.estimatedSecondsMax ?? estimates.max,
    statusMessage: input.statusMessage ?? statusMessage(task.type, phase, processingMode, chunkCount, completedChunks, currentChunk),
    inputChars,
    processingMode,
    chunkCount,
    completedChunks,
    currentChunk,
    startedAt: input.startedAt ?? task.startedAt,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    failureStage: input.failureStage ?? null
  };
}

function buildCompletedProgress(task: AiTask, result: AiTaskResult): AiTaskProgressSnapshot {
  const report = result.reportJson ?? {};
  const processingMode = report.processingMode === "chunked" ? "chunked" : "single";
  const chunkCount = typeof report.chunkCount === "number" ? report.chunkCount : null;
  const completedChunks = typeof report.completedChunks === "number" ? report.completedChunks : chunkCount ?? 0;

  return normalizeProgress(task, {
    phase: "completed",
    phaseLabel: "已完成",
    progressPercent: 100,
    estimatedSecondsMin: 0,
    estimatedSecondsMax: 0,
    statusMessage: "任务已完成，结果已生成。",
    processingMode,
    inputChars: typeof report.inputChars === "number" ? report.inputChars : getTotalInputChars(task),
    chunkCount,
    completedChunks,
    currentChunk: null,
    updatedAt: task.finishedAt ?? result.createdAt
  });
}

function inferProcessingMode(task: AiTask): "single" | "chunked" {
  if (task.type !== "code_conversion" && task.type !== "code_analysis") {
    return "single";
  }

  const config = getAiTaskConfig(task.type);
  return getTotalInputChars(task) > config.maxSingleCallInputChars ? "chunked" : "single";
}

function phaseLabel(taskType: AiTaskType, phase: AiTaskProgressPhase) {
  if (phase === "queued") {
    return "已接收任务";
  }

  if (phase === "scanning") {
    return taskType === "code_analysis" ? "结构识别" : "结构扫描";
  }

  if (phase === "chunking") {
    return taskType === "code_analysis" ? "结构识别" : "代码拆分";
  }

  if (phase === "processing") {
    return taskType === "code_conversion" ? "语义转换" : taskType === "code_analysis" ? "逻辑解析" : "模型处理";
  }

  if (phase === "merging") {
    return taskType === "code_analysis" ? "报告生成" : "结果合并";
  }

  if (phase === "validating") {
    return taskType === "code_analysis" ? "风险检查" : "传输检查";
  }

  if (phase === "completed") {
    return "已完成";
  }

  return "处理失败";
}

function statusMessage(
  taskType: AiTaskType,
  phase: AiTaskProgressPhase,
  processingMode: "single" | "chunked",
  chunkCount: number | null,
  completedChunks: number,
  currentChunk: number | null
) {
  if (phase === "queued") {
    return "已接收任务，正在准备。";
  }

  if (phase === "scanning") {
    return taskType === "code_analysis"
      ? "正在识别策略结构、平台依赖和关键函数。"
      : "正在识别入口函数、调度函数、数据接口、下单接口、全局变量和主要业务函数。";
  }

  if (phase === "chunking") {
    return taskType === "code_analysis"
      ? "正在梳理策略结构，准备解析交易逻辑。"
      : "正在按函数边界拆分长代码，过长函数会继续按安全行数切分。";
  }

  if (phase === "processing") {
    if (processingMode === "chunked" && chunkCount) {
      if (taskType === "code_analysis") {
        return "正在解析策略结构、交易逻辑和关键参数。";
      }

      return `正在${taskType === "code_conversion" ? "转换" : "解析"}第 ${currentChunk ?? Math.min(completedChunks + 1, chunkCount)} / ${chunkCount} 段。`;
    }

    return taskType === "code_conversion" ? "正在保留交易语义并生成目标平台代码。" : "正在解析策略结构、交易逻辑和关键参数。";
  }

  if (phase === "merging") {
    return taskType === "code_analysis" ? "正在汇总解析报告。" : "正在合并分段代码和必要的兼容说明。";
  }

  if (phase === "validating") {
    return taskType === "code_analysis" ? "正在整理解析报告。" : "正在检查输出是否完整传输。";
  }

  if (phase === "completed") {
    return "任务已完成，结果已生成。";
  }

  return "任务处理失败，请按错误提示调整后重试。";
}

function estimatePercent(
  phase: AiTaskProgressPhase,
  processingMode: "single" | "chunked",
  chunkCount: number | null,
  completedChunks: number
) {
  if (phase === "queued") {
    return 2;
  }

  if (phase === "scanning") {
    return 18;
  }

  if (phase === "chunking") {
    return 25;
  }

  if (phase === "processing") {
    if (processingMode === "chunked" && chunkCount) {
      return 42 + Math.round((Math.min(completedChunks, chunkCount) / chunkCount) * 30);
    }

    return 42;
  }

  if (phase === "merging") {
    return 86;
  }

  if (phase === "validating") {
    return 94;
  }

  if (phase === "completed") {
    return 100;
  }

  return 96;
}

function estimateSeconds(
  taskType: AiTaskType,
  input: {
    processingMode: "single" | "chunked";
    chunkCount: number | null;
    completedChunks: number;
    phase: AiTaskProgressPhase;
  }
) {
  if (input.phase === "completed" || input.phase === "failed") {
    return {
      min: 0,
      max: 0
    };
  }

  if (input.processingMode === "single") {
    return taskType === "code_analysis" || taskType === "code_conversion"
      ? { min: 20, max: 60 }
      : { min: 30, max: 90 };
  }

  const chunkCount = Math.max(1, input.chunkCount ?? 4);
  const totalMin = Math.max(120, Math.min(480, 60 + chunkCount * 25));
  const totalMax = Math.max(240, Math.min(480, 120 + chunkCount * 55));
  const remainingRatio = input.chunkCount ? Math.max(0.12, (chunkCount - input.completedChunks) / chunkCount) : 1;

  return {
    min: Math.max(30, Math.round(totalMin * remainingRatio)),
    max: Math.max(60, Math.round(totalMax * remainingRatio))
  };
}

function inferFailureStage(errorCode: string | null) {
  if (!errorCode) {
    return "processing";
  }

  if (errorCode === "AI_PROVIDER_TIMEOUT") {
    return "processing";
  }

  if (errorCode === "AI_PROVIDER_BAD_RESPONSE") {
    return "validating";
  }

  return "processing";
}

function buildFailureStatusMessage(errorCode: string | null) {
  if (errorCode === "AI_PROVIDER_TIMEOUT") {
    return "AI 服务响应超时，请稍后重试。";
  }

  if (errorCode === "AI_PROVIDER_BAD_RESPONSE") {
    return "AI 返回内容格式异常，未能完成结果校验。";
  }

  return "任务处理失败，请按错误提示调整后重试。";
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
