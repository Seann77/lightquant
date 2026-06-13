"use client";

import { AlertTriangle, CheckCircle2, Clock3, Layers3, LoaderCircle } from "lucide-react";

export type AiTaskProgress = {
  phase?: string | null;
  phaseLabel?: string | null;
  progressPercent?: number | null;
  estimatedSecondsMin?: number | null;
  estimatedSecondsMax?: number | null;
  statusMessage?: string | null;
  inputChars?: number | null;
  processingMode?: string | null;
  chunkCount?: number | null;
  completedChunks?: number | null;
  currentChunk?: number | null;
  startedAt?: string | null;
  updatedAt?: string | null;
  failureStage?: string | null;
};

type AiTaskProgressPanelProps = {
  progress?: AiTaskProgress | null;
  taskType: "code_conversion" | "code_analysis";
  elapsedSeconds?: number;
  status?: string | null;
  errorCode?: string | null;
  inputChars?: number | null;
  tone?: "light" | "dark";
};

type AiTaskCompletionSummaryProps = {
  task: {
    status: string;
    startedAt?: string | null;
    finishedAt?: string | null;
    costPoints?: number | null;
  };
  progress?: AiTaskProgress | null;
};

const PHASE_ORDER = ["queued", "scanning", "chunking", "processing", "merging", "validating", "completed", "failed"];

export function AiTaskProgressPanel({
  progress,
  taskType,
  elapsedSeconds = 0,
  status,
  errorCode,
  inputChars,
  tone = "light"
}: AiTaskProgressPanelProps) {
  const phase = normalizePhase(progress?.phase, status);
  const failed = status === "FAILED" || phase === "failed";
  const completed = status === "SUCCEEDED" || phase === "completed";
  const percent = completed ? 100 : clampPercent(progress?.progressPercent ?? fallbackPercent(phase, progress));
  const effectiveInputChars = progress?.inputChars ?? inputChars ?? 0;
  const chunkCount = progress?.chunkCount ?? null;
  const completedChunks = progress?.completedChunks ?? 0;
  const currentChunk = progress?.currentChunk ?? (chunkCount ? Math.min(completedChunks + 1, chunkCount) : null);
  const isChunked = progress?.processingMode === "chunked" || Boolean(chunkCount);
  const etaLabel = formatEta({
    elapsedSeconds,
    errorCode,
    failed,
    completed,
    min: progress?.estimatedSecondsMin,
    max: progress?.estimatedSecondsMax
  });
  const steps = getVisibleSteps(taskType, isChunked);
  const activeIndex = getActiveStepIndex(steps, phase, progress?.failureStage);
  const StatusIcon = failed ? AlertTriangle : completed ? CheckCircle2 : LoaderCircle;
  const phaseLabel = progress?.phaseLabel || getFallbackPhaseLabel(taskType, phase);
  const statusMessage = progress?.statusMessage || getFallbackStatusMessage(taskType, phase, isChunked, chunkCount, completedChunks, currentChunk);

  return (
    <div aria-live="polite" className={`lq-task-progress is-${tone} ${failed ? "is-failed" : ""}`}>
      <div className="lq-task-progress-head">
        <div className="lq-task-progress-icon">
          <StatusIcon aria-hidden="true" className={failed || completed ? undefined : "animate-spin"} size={19} />
        </div>
        <div className="lq-task-progress-main">
          <div className="lq-task-phase-row">
            <span className="lq-task-phase-label">{phaseLabel}</span>
            <span className="lq-task-percent">{percent}%</span>
          </div>
          <div className="lq-task-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <span className="lq-task-progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <p className="lq-task-status">{statusMessage}</p>

      <div className="lq-task-meta">
        <span>
          <Clock3 aria-hidden="true" size={15} />
          已耗时 {formatDuration(elapsedSeconds)}
        </span>
        <span>
          <Clock3 aria-hidden="true" size={15} />
          {etaLabel}
        </span>
        {effectiveInputChars > 0 ? (
          <span>
            <Layers3 aria-hidden="true" size={15} />
            {formatNumber(effectiveInputChars)} 字符
          </span>
        ) : null}
      </div>

      {isChunked && chunkCount ? (
        <div className="lq-task-chunks">
          <Layers3 aria-hidden="true" size={16} />
          <span>{completed || failed ? `已处理 ${Math.min(completedChunks, chunkCount)} / ${chunkCount} 段` : `正在处理第 ${currentChunk ?? 1} / ${chunkCount} 段`}</span>
        </div>
      ) : null}

      <div className="lq-task-steps">
        {steps.map((step, index) => (
          <div className={`lq-task-step ${index < activeIndex ? "is-done" : ""} ${index === activeIndex ? "is-active" : ""}`} key={step.phase}>
            <span className="lq-task-step-dot" />
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {failed ? <p className="lq-task-advice">{getFailureAdvice(errorCode)}</p> : null}
    </div>
  );
}

export function AiTaskCompletionSummary({ task, progress }: AiTaskCompletionSummaryProps) {
  if (task.status !== "SUCCEEDED") {
    return null;
  }

  const duration = getTaskDuration(task.startedAt, task.finishedAt);
  const chunkCount = progress?.chunkCount ?? null;
  const processingMode = progress?.processingMode === "chunked" ? "分段处理" : "单次处理";

  return (
    <div className="lq-completion-summary">
      <CheckCircle2 aria-hidden="true" size={17} />
      <span>已完成</span>
      {duration ? <span>用时 {duration}</span> : null}
      <span>{processingMode}</span>
      {chunkCount ? <span>{progress?.completedChunks ?? chunkCount} / {chunkCount} 段</span> : null}
    </div>
  );
}

function normalizePhase(phase?: string | null, status?: string | null) {
  if (status === "FAILED" || status === "CANCELLED") {
    return "failed";
  }

  if (status === "SUCCEEDED") {
    return "completed";
  }

  return PHASE_ORDER.includes(phase ?? "") ? phase ?? "queued" : "queued";
}

function getVisibleSteps(taskType: "code_conversion" | "code_analysis", isChunked: boolean) {
  if (taskType === "code_analysis") {
    return [
      { phase: "scanning", label: "结构扫描" },
      ...(isChunked ? [{ phase: "chunking", label: "代码拆分" }] : []),
      { phase: "processing", label: "逻辑解析" },
      { phase: "validating", label: "风险检查" },
      { phase: "merging", label: "报告生成" }
    ];
  }

  return [
    { phase: "scanning", label: "结构扫描" },
    ...(isChunked ? [{ phase: "chunking", label: "代码拆分" }] : []),
    { phase: "processing", label: "语义转换" },
    { phase: "merging", label: "结果合并" },
    { phase: "validating", label: "完整性检查" }
  ];
}

function getActiveStepIndex(steps: Array<{ phase: string; label: string }>, phase: string, failureStage?: string | null) {
  if (phase === "completed") {
    return steps.length;
  }

  const effectivePhase = phase === "failed" ? failureStage || "processing" : phase;
  const index = steps.findIndex((step) => step.phase === effectivePhase);
  return index >= 0 ? index : 0;
}

function fallbackPercent(phase: string, progress?: AiTaskProgress | null) {
  if (phase === "scanning") {
    return 8;
  }

  if (phase === "chunking") {
    return 16;
  }

  if (phase === "processing" && progress?.chunkCount) {
    return 20 + Math.round(((progress.completedChunks ?? 0) / progress.chunkCount) * 58);
  }

  if (phase === "processing") {
    return 42;
  }

  if (phase === "merging") {
    return 82;
  }

  if (phase === "validating") {
    return 92;
  }

  return 2;
}

function getFallbackPhaseLabel(taskType: "code_conversion" | "code_analysis", phase: string) {
  if (phase === "scanning") {
    return "结构扫描";
  }

  if (phase === "chunking") {
    return "代码拆分";
  }

  if (phase === "processing") {
    return taskType === "code_conversion" ? "语义转换" : "逻辑解析";
  }

  if (phase === "merging") {
    return taskType === "code_analysis" ? "报告生成" : "结果合并";
  }

  if (phase === "validating") {
    return taskType === "code_analysis" ? "风险检查" : "完整性检查";
  }

  if (phase === "completed") {
    return "已完成";
  }

  if (phase === "failed") {
    return "处理失败";
  }

  return "已接收任务";
}

function getFallbackStatusMessage(
  taskType: "code_conversion" | "code_analysis",
  phase: string,
  isChunked: boolean,
  chunkCount: number | null,
  completedChunks: number,
  currentChunk: number | null
) {
  if (phase === "scanning") {
    return "正在识别入口函数、调度函数、数据接口、下单接口、全局变量和主要业务函数。";
  }

  if (phase === "chunking") {
    return "正在按函数边界拆分长代码，过长函数会继续按安全行数切分。";
  }

  if (phase === "processing" && isChunked && chunkCount) {
    return `正在${taskType === "code_conversion" ? "转换" : "解析"}第 ${currentChunk ?? Math.min(completedChunks + 1, chunkCount)} / ${chunkCount} 段。`;
  }

  if (phase === "processing") {
    return taskType === "code_conversion" ? "正在保留交易语义并生成目标平台代码。" : "正在解析策略结构、交易逻辑和关键参数。";
  }

  if (phase === "merging") {
    return taskType === "code_analysis" ? "正在汇总分段摘要并生成解析报告。" : "正在合并分段代码、迁移说明和人工复核项。";
  }

  if (phase === "validating") {
    return "正在检查输出完整性、空结果、明显截断和重复片段。";
  }

  if (phase === "completed") {
    return "任务已完成，结果已生成。";
  }

  if (phase === "failed") {
    return "任务处理失败，请按错误提示调整后重试。";
  }

  return "已接收任务，正在准备。";
}

function formatEta({
  elapsedSeconds,
  errorCode,
  failed,
  completed,
  min,
  max
}: {
  elapsedSeconds: number;
  errorCode?: string | null;
  failed: boolean;
  completed: boolean;
  min?: number | null;
  max?: number | null;
}) {
  if (completed) {
    return "已完成";
  }

  if (failed) {
    return errorCode === "AI_PROVIDER_TIMEOUT" ? "比预计更久，已停止" : "已停止";
  }

  const estimatedMin = Math.max(0, min ?? 20);
  const estimatedMax = Math.max(estimatedMin, max ?? 60);

  if (errorCode === "AI_PROVIDER_TIMEOUT" || (elapsedSeconds > 0 && estimatedMax > 0 && elapsedSeconds > estimatedMax + 30)) {
    return "比预计更久，仍在重试/处理中";
  }

  if (estimatedMin === 0 && estimatedMax === 0) {
    return "正在收尾";
  }

  return `预计还需 ${formatEtaUnit(estimatedMin)}-${formatEtaUnit(estimatedMax)}`;
}

function formatEtaUnit(seconds: number) {
  if (seconds <= 90) {
    return `${Math.max(1, Math.round(seconds))} 秒`;
  }

  return `${Math.max(1, Math.round(seconds / 60))} 分钟`;
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return "0 秒";
  }

  if (seconds < 60) {
    return `${seconds} 秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes} 分 ${remainder} 秒` : `${minutes} 分钟`;
}

function getTaskDuration(startedAt?: string | null, finishedAt?: string | null) {
  if (!startedAt || !finishedAt) {
    return null;
  }

  const started = Date.parse(startedAt);
  const finished = Date.parse(finishedAt);

  if (!Number.isFinite(started) || !Number.isFinite(finished) || finished <= started) {
    return null;
  }

  return formatDuration(Math.round((finished - started) / 1000));
}

function getFailureAdvice(errorCode?: string | null) {
  if (errorCode === "AI_PROVIDER_TIMEOUT") {
    return "建议稍后重试，或减少代码量后重新提交。";
  }

  if (errorCode === "AI_PROVIDER_BAD_RESPONSE") {
    return "建议减少单次代码量，保留平台信息后重试。";
  }

  if (errorCode === "AI_PROVIDER_CONFIG_ERROR") {
    return "请联系管理员检查模型配置。";
  }

  if (errorCode === "INPUT_TOO_LARGE") {
    return "请拆分提交，或等待更大的分段处理额度。";
  }

  return "请稍后重试；如代码很长，可拆分后再次提交。";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
