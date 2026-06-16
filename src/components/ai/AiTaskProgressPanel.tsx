"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock3, Layers3, LoaderCircle, Trash2 } from "lucide-react";
import type { AiRunEventData, AiTaskProgress } from "@/lib/ai/workbench-types";

export type { AiRunEventData, AiTaskProgress } from "@/lib/ai/workbench-types";

type AiTaskProgressPanelProps = {
  taskId?: string | null;
  progress?: AiTaskProgress | null;
  events?: AiRunEventData[] | null;
  taskType: "code_conversion" | "code_analysis";
  elapsedSeconds?: number;
  status?: string | null;
  errorCode?: string | null;
  inputChars?: number | null;
  tone?: "light" | "dark";
  showEta?: boolean;
  showInputChars?: boolean;
  onCancel?: () => void;
  canceling?: boolean;
};

type AiTaskCompletionSummaryProps = {
  task: {
    id?: string | null;
    status: string;
    startedAt?: string | null;
    finishedAt?: string | null;
    costPoints?: number | null;
  };
  progress?: AiTaskProgress | null;
  events?: AiRunEventData[] | null;
};

const PHASE_ORDER = ["queued", "scanning", "chunking", "processing", "merging", "validating", "completed", "failed"];

export function AiTaskProgressPanel({
  taskId,
  progress,
  events,
  taskType,
  elapsedSeconds = 0,
  status,
  errorCode,
  inputChars,
  tone = "light",
  showEta = true,
  showInputChars = true,
  onCancel,
  canceling = false
}: AiTaskProgressPanelProps) {
  const normalizedEvents = normalizeRunEvents(events);
  const displayEvents = getDisplayRunEvents(normalizedEvents, taskType);
  const phase = normalizePhase(progress?.phase, status);
  const cancelled = status === "CANCELLED";
  const failed = status === "FAILED" || cancelled || phase === "failed";
  const completed = status === "SUCCEEDED" || phase === "completed";
  const running = status === "PENDING" || status === "RUNNING";
  const displayEta = taskType === "code_analysis" ? false : showEta;
  const displayInputChars = taskType === "code_analysis" ? false : showInputChars;
  const percent = getDisplayPercent({
    elapsedSeconds,
    events: displayEvents,
    failed,
    completed,
    phase,
    progress
  });
  const effectiveInputChars = progress?.inputChars ?? inputChars ?? 0;
  const chunkCount = progress?.chunkCount ?? null;
  const completedChunks = progress?.completedChunks ?? 0;
  const currentChunk = progress?.currentChunk ?? (chunkCount ? Math.min(completedChunks + 1, chunkCount) : null);
  const isChunked = progress?.processingMode === "chunked" || Boolean(chunkCount);
  const showChunkProgress = taskType === "code_conversion" && isChunked && Boolean(chunkCount);
  const etaLabel = displayEta
    ? formatEta({
      elapsedSeconds,
      errorCode,
      failed,
      completed,
      min: progress?.estimatedSecondsMin,
      max: progress?.estimatedSecondsMax
    })
    : null;
  const steps = getVisibleSteps(taskType, isChunked);
  const activeIndex = getActiveStepIndex(steps, phase, progress?.failureStage, normalizedEvents, status);
  const StatusIcon = failed ? AlertTriangle : completed ? CheckCircle2 : LoaderCircle;
  const phaseLabel = getDisplayPhaseLabel(taskType, phase, displayEvents, status, progress?.phaseLabel);
  const statusMessage = getDisplayStatusMessage({
    cancelled,
    completed,
    failed,
    phase,
    progress,
    events: normalizedEvents,
    taskType,
    isChunked,
    chunkCount,
    completedChunks,
    currentChunk
  });
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const latestEvent = displayEvents.at(-1);

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
        {running && onCancel ? (
          <button className="lq-task-cancel" disabled={canceling} onClick={onCancel} type="button">
            {canceling ? <LoaderCircle aria-hidden="true" className="animate-spin" size={14} /> : <Trash2 aria-hidden="true" size={14} />}
            <span>{canceling ? "取消中..." : "取消任务"}</span>
          </button>
        ) : null}
      </div>

      <p className="lq-task-status">{statusMessage}</p>

      <div className="lq-task-meta">
        <span>
          <Clock3 aria-hidden="true" size={15} />
          已耗时 {formatDuration(elapsedSeconds)}
        </span>
        {etaLabel ? (
          <span>
            <Clock3 aria-hidden="true" size={15} />
            {etaLabel}
          </span>
        ) : null}
        {displayInputChars && effectiveInputChars > 0 ? (
          <span>
            <Layers3 aria-hidden="true" size={15} />
            {formatNumber(effectiveInputChars)} 字符
          </span>
        ) : null}
      </div>

      {showChunkProgress && chunkCount ? (
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

      <div className="lq-task-details">
        <button className="lq-task-details-toggle" onClick={() => setDetailsExpanded((value) => !value)} type="button">
          {detailsExpanded ? <ChevronDown aria-hidden="true" size={15} /> : <ChevronRight aria-hidden="true" size={15} />}
          <span>处理明细</span>
          <em>{normalizedEvents.length > 0 ? `${normalizedEvents.length} 条事件` : "暂无事件"}</em>
        </button>
        {!detailsExpanded && latestEvent ? <p className="lq-task-details-hint">最近：{latestEvent.title}</p> : null}
        {detailsExpanded ? (
          <RunEventTimeline collapsible={false} emptyMessage="暂无处理明细事件" events={normalizedEvents} status={status} taskId={taskId} taskType={taskType} tone={tone} />
        ) : null}
      </div>

      {failed && !cancelled ? <p className="lq-task-advice">{getFailureAdvice(errorCode)}</p> : null}
    </div>
  );
}

export function AiTaskCompletionSummary({ task, progress, events }: AiTaskCompletionSummaryProps) {
  if (task.status !== "SUCCEEDED") {
    return null;
  }

  const duration = getTaskDuration(task.startedAt, task.finishedAt);
  const chunkCount = progress?.chunkCount ?? null;
  const processingMode = progress?.processingMode === "chunked" ? "分段处理" : "单次处理";

  return (
    <>
      <div className="lq-completion-summary">
        <CheckCircle2 aria-hidden="true" size={17} />
        <span>已完成</span>
        {duration ? <span>用时 {duration}</span> : null}
        <span>{processingMode}</span>
        {chunkCount ? <span>{progress?.completedChunks ?? chunkCount} / {chunkCount} 段</span> : null}
      </div>
      <RunEventTimeline events={events} status={task.status} taskId={task.id} />
    </>
  );
}

type RunEventTimelineProps = {
  taskId?: string | null;
  events?: AiRunEventData[] | null;
  status?: string | null;
  tone?: "light" | "dark";
  emptyMessage?: string | null;
  collapsible?: boolean;
  taskType?: "code_conversion" | "code_analysis" | "strategy_generation";
};

export function RunEventTimeline({ taskId, events, status, tone = "light", emptyMessage, collapsible = true, taskType }: RunEventTimelineProps) {
  const mergedEvents = useRunEvents(taskId, events, status);
  const displayEvents = getDisplayRunEvents(mergedEvents, taskType);
  const running = status === "PENDING" || status === "RUNNING";
  const failed = status === "FAILED" || status === "CANCELLED" || mergedEvents.some((event) => event.status === "failed");
  const [expanded, setExpanded] = useState(running || failed);

  useEffect(() => {
    if (running || failed) {
      setExpanded(true);
    }
  }, [failed, running, taskId]);

  if (displayEvents.length === 0) {
    if (!emptyMessage) {
      return null;
    }

    return (
      <div className={`lq-run-events is-${tone} ${running ? "is-running" : ""} ${failed ? "is-failed" : ""} ${!collapsible ? "is-embedded" : ""}`}>
        <div className={collapsible ? "lq-run-events-summary" : "lq-run-events-empty"}>
          {running ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : null}
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  const latest = displayEvents.at(-1);
  const summary = running
    ? `LightQuant 正在处理 · ${displayEvents.length} 个过程事件`
    : failed
      ? `处理未完成 · ${displayEvents.length} 个过程事件`
      : `已完成 · ${displayEvents.length} 个过程事件`;
  const eventDisplayClasses = getRunEventDisplayClasses(mergedEvents, status);
  const eventList = (
    <ol className="lq-run-event-list">
      {displayEvents.map((event) => (
        <li className={eventDisplayClasses.get(event.seq) ?? ""} key={`${event.taskId}-${event.seq}`}>
          <span>{event.seq}</span>
          <p>
            <strong>{event.title}</strong>
            {event.summary ? <em>{event.summary}</em> : null}
          </p>
        </li>
      ))}
    </ol>
  );

  return (
    <div className={`lq-run-events is-${tone} ${running ? "is-running" : ""} ${failed ? "is-failed" : ""} ${!collapsible ? "is-embedded" : ""}`}>
      {collapsible ? (
        <button className="lq-run-events-summary" onClick={() => setExpanded((value) => !value)} type="button">
          {expanded ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
          <span>{summary}{latest?.title ? ` · ${latest.title}` : ""}</span>
        </button>
      ) : null}
      {expanded || !collapsible ? eventList : null}
    </div>
  );
}

function getRunEventDisplayClasses(events: AiRunEventData[], taskStatus: string | null | undefined) {
  const classes = new Map<number, string>();
  const running = taskStatus === "PENDING" || taskStatus === "RUNNING";
  const succeeded = taskStatus === "SUCCEEDED";
  const failed = taskStatus === "FAILED" || taskStatus === "CANCELLED" || events.some(isFailureRunEvent);
  const firstFailureSeq = failed ? events.find(isFailureRunEvent)?.seq ?? getLatestEffectiveSeq(events) : null;
  const latestRunningSeq = running ? [...events].reverse().find((event) => event.status === "running")?.seq ?? null : null;

  for (const event of events) {
    if (event.status === "skipped") {
      classes.set(event.seq, "is-skipped");
      continue;
    }

    if (isFailureRunEvent(event)) {
      classes.set(event.seq, "is-failed");
      continue;
    }

    if (succeeded) {
      classes.set(event.seq, "is-done");
      continue;
    }

    if (firstFailureSeq !== null) {
      classes.set(event.seq, event.seq < firstFailureSeq ? "is-done" : event.seq === firstFailureSeq ? "is-failed" : "");
      continue;
    }

    if (latestRunningSeq !== null) {
      classes.set(event.seq, event.seq === latestRunningSeq ? "is-active" : event.seq < latestRunningSeq ? "is-done" : "");
      continue;
    }

    classes.set(event.seq, event.status === "completed" ? "is-done" : "");
  }

  return classes;
}

function isFailureRunEvent(event: AiRunEventData) {
  return event.status === "failed" || event.type === "cancelled" || event.type === "canceled";
}

function getLatestEffectiveSeq(events: AiRunEventData[]) {
  return [...events].reverse().find((event) => event.status !== "skipped")?.seq ?? null;
}

function useRunEvents(taskId: string | null | undefined, seedEvents: AiRunEventData[] | null | undefined, status: string | null | undefined) {
  const [events, setEvents] = useState<AiRunEventData[]>(() => normalizeRunEvents(seedEvents));
  const latestSeqRef = useRef(0);
  const polling = status === "PENDING" || status === "RUNNING";

  useEffect(() => {
    const normalized = normalizeRunEvents(seedEvents);
    latestSeqRef.current = getLatestSeq(normalized);
    setEvents(normalized);
  }, [seedEvents, taskId]);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    let cancelled = false;
    const currentTaskId = taskId;

    async function load(afterSeq?: number) {
      const params = new URLSearchParams({
        limit: "100"
      });

      if (afterSeq && afterSeq > 0) {
        params.set("afterSeq", String(afterSeq));
      }

      const response = await fetch(`/api/v1/ai/tasks/${encodeURIComponent(currentTaskId)}/events?${params.toString()}`, {
        cache: "no-store"
      });
      const payload = await response.json() as {
        success?: boolean;
        data?: {
          events?: AiRunEventData[];
          nextAfterSeq?: number;
        };
      };

      if (cancelled || !payload.success) {
        return;
      }

      setEvents((current) => {
        const merged = mergeRunEvents(current, payload.data?.events ?? []);
        latestSeqRef.current = Math.max(getLatestSeq(merged), payload.data?.nextAfterSeq ?? 0);
        return merged;
      });
    }

    void load();

    if (!polling) {
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setInterval(() => {
      void load(latestSeqRef.current);
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [polling, taskId]);

  return events;
}

function normalizeRunEvents(events: AiRunEventData[] | null | undefined) {
  return mergeRunEvents([], events ?? []);
}

function mergeRunEvents(current: AiRunEventData[], incoming: AiRunEventData[]) {
  const bySeq = new Map<number, AiRunEventData>();

  for (const event of current) {
    bySeq.set(event.seq, event);
  }

  for (const event of incoming) {
    bySeq.set(event.seq, event);
  }

  return [...bySeq.values()].sort((left, right) => left.seq - right.seq);
}

function getDisplayRunEvents(events: AiRunEventData[], taskType?: "code_conversion" | "code_analysis" | "strategy_generation") {
  if (taskType !== "code_analysis") {
    return events;
  }

  return events.map((event) => ({
    ...event,
    title: sanitizeAnalysisEventTitle(event),
    summary: sanitizeAnalysisProcessText(event.summary, event.detailJson?.phase)
  }));
}

function sanitizeProcessText(taskType: "code_conversion" | "code_analysis", value: string | null | undefined, phase?: string | null) {
  return taskType === "code_analysis" ? sanitizeAnalysisProcessText(value, phase) : value ?? "";
}

function sanitizeAnalysisEventTitle(event: AiRunEventData) {
  const phase = event.detailJson?.phase;

  if (event.type === "analyze_code" || hasChunkProcessText(event.title)) {
    return getAnalysisBusinessTitle(phase);
  }

  if (event.type === "detect_platform") {
    return "识别代码结构";
  }

  if (event.type === "generate_plan") {
    return "整理解析计划";
  }

  if (event.type === "call_model") {
    return "解析策略逻辑";
  }

  if (event.type === "stream_output") {
    return "整理解析结果";
  }

  if (event.type === "validate_result") {
    return "检查风险与完整性";
  }

  return event.title;
}

function sanitizeAnalysisProcessText(value: string | null | undefined, phase?: unknown) {
  if (!value) {
    return "";
  }

  const text = value.trim();

  if (!hasChunkProcessText(text)) {
    return text;
  }

  return getAnalysisBusinessMessage(typeof phase === "string" ? phase : null);
}

function hasChunkProcessText(value: string) {
  return /(?:第\s*\d+\s*\/\s*\d+\s*段|\d+\s*\/\s*\d+\s*段|已完成\s*\d+\s*\/\s*\d+\s*段|(?:解析|处理)[一二两三四五六七八九十\d]+\s*段|已拆分为|正在处理第|正在解析第|正在转换第|分段|拆分长代码|代码拆分|chunk)/i.test(value);
}

function getAnalysisBusinessTitle(phase: unknown) {
  if (phase === "chunking" || phase === "scanning") {
    return "识别策略结构";
  }

  if (phase === "merging") {
    return "汇总解析报告";
  }

  if (phase === "validating") {
    return "检查风险与完整性";
  }

  return "解析策略逻辑";
}

function getAnalysisBusinessMessage(phase: string | null) {
  if (phase === "chunking" || phase === "scanning") {
    return "正在识别策略结构、平台依赖和关键函数。";
  }

  if (phase === "merging") {
    return "正在汇总解析报告。";
  }

  if (phase === "validating") {
    return "正在检查潜在风险和输出完整性。";
  }

  if (phase === "failed") {
    return "解析任务处理失败，请按提示调整后重试。";
  }

  return "正在解析策略结构、交易逻辑和关键参数。";
}

function getLatestSeq(events: AiRunEventData[]) {
  return events.reduce((max, event) => Math.max(max, event.seq), 0);
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
      { phase: "input", label: "输入解析" },
      { phase: "scanning", label: "结构识别" },
      { phase: "processing", label: "逻辑解析" },
      { phase: "validating", label: "风险检查" },
      { phase: "merging", label: "报告生成" }
    ];
  }

  return [
    { phase: "input", label: "输入解析" },
    { phase: "planning", label: "转换计划" },
    { phase: "processing", label: "AI 转换" },
    { phase: "validating", label: "结果校验" }
  ];
}

function getActiveStepIndex(
  steps: Array<{ phase: string; label: string }>,
  phase: string,
  failureStage?: string | null,
  events: AiRunEventData[] = [],
  status?: string | null
) {
  if (phase === "completed" || status === "SUCCEEDED") {
    return steps.length;
  }

  const taskType = steps.some((step) => step.phase === "scanning") ? "code_analysis" : "code_conversion";
  const effectivePhase = phase === "failed"
    ? failureStage ? mapProgressPhaseToStage(failureStage, taskType) : "processing"
    : getStagePhaseFromEvents(events, taskType) ?? mapProgressPhaseToStage(phase, taskType);
  const index = steps.findIndex((step) => step.phase === effectivePhase);
  return index >= 0 ? index : 0;
}

function getDisplayPercent({
  elapsedSeconds,
  events,
  failed,
  completed,
  phase,
  progress
}: {
  elapsedSeconds: number;
  events: AiRunEventData[];
  failed: boolean;
  completed: boolean;
  phase: string;
  progress?: AiTaskProgress | null;
}) {
  if (completed) {
    return 100;
  }

  const backendPercent = typeof progress?.progressPercent === "number" ? progress.progressPercent : 0;
  const phasePercent = fallbackPercent(phase, progress);
  const eventPercent = getEventPercentFloor(events, elapsedSeconds);
  const percent = clampPercent(Math.max(backendPercent, phasePercent, eventPercent));

  if (failed) {
    return Math.min(96, Math.max(12, percent));
  }

  return Math.min(96, percent);
}

function getEventPercentFloor(events: AiRunEventData[], elapsedSeconds: number) {
  return events.reduce((max, event) => Math.max(max, getSingleEventPercentFloor(event, elapsedSeconds)), 0);
}

function getSingleEventPercentFloor(event: AiRunEventData, elapsedSeconds: number) {
  if (event.type === "queued") {
    return 2;
  }

  if (event.type === "upload_received") {
    return 4;
  }

  if (event.type === "read_attachment") {
    return 6;
  }

  if (event.type === "parse_text" || event.type === "parse_image") {
    return 10;
  }

  if (event.type === "detect_platform") {
    return event.status === "completed" ? 18 : 12;
  }

  if (event.type === "generate_plan") {
    return event.status === "completed" ? 30 : 20;
  }

  if (event.type === "call_model") {
    const runningPercent = 35 + Math.min(35, Math.floor(elapsedSeconds * 1.2));
    return event.status === "completed" ? 70 : runningPercent;
  }

  if (event.type === "analyze_code") {
    return Math.max(35, event.progressPercent ?? 35);
  }

  if (event.type === "stream_output") {
    return 84;
  }

  if (event.type === "validate_result") {
    return 94;
  }

  if (event.type === "create_artifact") {
    return 96;
  }

  if (event.type === "completed") {
    return 100;
  }

  if (event.type === "failed" || event.type === "cancelled" || event.type === "canceled") {
    return 96;
  }

  return event.progressPercent ?? 0;
}

function fallbackPercent(phase: string, progress?: AiTaskProgress | null) {
  if (phase === "queued") {
    return 2;
  }

  if (phase === "scanning") {
    return 14;
  }

  if (phase === "chunking") {
    return 24;
  }

  if (phase === "processing" && progress?.chunkCount) {
    return 35 + Math.round(((progress.completedChunks ?? 0) / progress.chunkCount) * 35);
  }

  if (phase === "processing") {
    return 42;
  }

  if (phase === "merging") {
    return 84;
  }

  if (phase === "validating") {
    return 94;
  }

  if (phase === "failed") {
    return 96;
  }

  return 2;
}

function getDisplayPhaseLabel(
  taskType: "code_conversion" | "code_analysis",
  phase: string,
  events: AiRunEventData[],
  status?: string | null,
  backendLabel?: string | null
) {
  const cleanBackendLabel = taskType === "code_analysis" ? sanitizeAnalysisProcessText(backendLabel, phase) : backendLabel;

  if (status === "CANCELLED") {
    return "已取消";
  }

  if (status === "FAILED") {
    return "执行失败";
  }

  if (status === "SUCCEEDED" || phase === "completed") {
    return "已完成";
  }

  const latest = events.at(-1);

  if (latest?.type === "generate_plan") {
    return taskType === "code_conversion" ? "整理转换计划" : "结构识别";
  }

  if (latest?.type === "call_model") {
    return taskType === "code_analysis" ? "逻辑解析" : "调用 AI 模型";
  }

  if (latest?.type === "stream_output") {
    return taskType === "code_analysis" ? "风险检查" : "结果合并";
  }

  if (latest?.type === "validate_result") {
    return taskType === "code_conversion" ? "完整性检查" : "风险检查";
  }

  return cleanBackendLabel || getFallbackPhaseLabel(taskType, phase);
}

function getFallbackPhaseLabel(taskType: "code_conversion" | "code_analysis", phase: string) {
  if (phase === "scanning") {
    return taskType === "code_analysis" ? "结构识别" : "结构扫描";
  }

  if (phase === "chunking") {
    return taskType === "code_analysis" ? "结构识别" : "代码拆分";
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
    return taskType === "code_analysis"
      ? "正在识别策略结构、平台依赖和关键函数。"
      : "正在识别入口函数、调度函数、数据接口、下单接口、全局变量和主要业务函数。";
  }

  if (phase === "chunking") {
    return taskType === "code_analysis"
      ? "正在梳理策略结构，准备解析交易逻辑。"
      : "正在按函数边界拆分长代码，过长函数会继续按安全行数切分。";
  }

  if (phase === "processing" && isChunked && chunkCount) {
    if (taskType === "code_analysis") {
      return "正在解析策略结构、交易逻辑和关键参数。";
    }

    return `正在${taskType === "code_conversion" ? "转换" : "解析"}第 ${currentChunk ?? Math.min(completedChunks + 1, chunkCount)} / ${chunkCount} 段。`;
  }

  if (phase === "processing") {
    return taskType === "code_conversion" ? "正在保留交易语义并生成目标平台代码。" : "正在解析策略结构、交易逻辑和关键参数。";
  }

  if (phase === "merging") {
    return taskType === "code_analysis" ? "正在汇总解析报告。" : "正在合并分段代码、迁移说明和人工复核项。";
  }

  if (phase === "validating") {
    return taskType === "code_analysis" ? "正在检查潜在风险和输出完整性。" : "正在检查输出完整性、空结果、明显截断和重复片段。";
  }

  if (phase === "completed") {
    return "任务已完成，结果已生成。";
  }

  if (phase === "failed") {
    return "任务处理失败，请按错误提示调整后重试。";
  }

  return "已接收任务，正在准备。";
}

function getDisplayStatusMessage({
  cancelled,
  completed,
  failed,
  phase,
  progress,
  events,
  taskType,
  isChunked,
  chunkCount,
  completedChunks,
  currentChunk
}: {
  cancelled: boolean;
  completed: boolean;
  failed: boolean;
  phase: string;
  progress?: AiTaskProgress | null;
  events: AiRunEventData[];
  taskType: "code_conversion" | "code_analysis";
  isChunked: boolean;
  chunkCount: number | null;
  completedChunks: number;
  currentChunk: number | null;
}) {
  if (cancelled) {
    return "任务已取消。";
  }

  if (failed) {
    return sanitizeProcessText(taskType, progress?.statusMessage, phase) || "执行失败，请按错误提示调整后重试。";
  }

  if (completed) {
    return "任务已完成，结果已生成。";
  }

  const latest = events.at(-1);

  if (latest?.summary) {
    return latest.summary;
  }

  return sanitizeProcessText(taskType, progress?.statusMessage, phase) || getFallbackStatusMessage(taskType, phase, isChunked, chunkCount, completedChunks, currentChunk);
}

function getStagePhaseFromEvents(events: AiRunEventData[], taskType: "code_conversion" | "code_analysis") {
  const latest = events.at(-1);

  if (!latest) {
    return null;
  }

  if (latest.type === "upload_received" || latest.type === "read_attachment" || latest.type === "parse_text" || latest.type === "parse_image" || latest.type === "detect_platform") {
    return latest.type === "detect_platform" && taskType === "code_analysis" ? "scanning" : "input";
  }

  if (latest.type === "generate_plan") {
    return taskType === "code_analysis" ? "scanning" : "planning";
  }

  if (latest.type === "call_model" || latest.type === "analyze_code") {
    return "processing";
  }

  if (latest.type === "stream_output" || latest.type === "validate_result") {
    return "validating";
  }

  if (latest.type === "create_artifact" || latest.type === "completed") {
    return taskType === "code_analysis" ? "merging" : "validating";
  }

  return null;
}

function mapProgressPhaseToStage(phase: string, taskType: "code_conversion" | "code_analysis") {
  if (phase === "queued" || phase === "scanning") {
    return phase === "scanning" && taskType === "code_analysis" ? "scanning" : "input";
  }

  if (phase === "chunking") {
    return taskType === "code_analysis" ? "scanning" : "processing";
  }

  if (phase === "processing") {
    return "processing";
  }

  if (phase === "validating") {
    return "validating";
  }

  if (phase === "merging") {
    return taskType === "code_analysis" ? "merging" : "validating";
  }

  return phase;
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
    return "AI 服务响应超时，请稍后重试。";
  }

  if (errorCode === "AI_PROVIDER_BAD_RESPONSE") {
    return "AI 返回内容格式异常，请重试。若多次失败，可尝试减少非必要注释或拆分复杂策略。";
  }

  if (errorCode === "AI_PROVIDER_CONFIG_ERROR") {
    return "请联系管理员检查模型配置。";
  }

  if (errorCode === "INPUT_TOO_LARGE") {
    return "请拆分提交，或等待更大的分段处理额度。";
  }

  return "请稍后重试；若多次失败，可补充平台信息或拆分复杂策略。";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
