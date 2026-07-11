"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock3, LoaderCircle, Trash2 } from "lucide-react";
import type { AiRunEventData, AiTaskProgress, WorkbenchTaskType } from "@/lib/ai/workbench-types";

export type { AiRunEventData, AiTaskProgress } from "@/lib/ai/workbench-types";

type AiTaskProgressPanelProps = {
  taskId?: string | null;
  progress?: AiTaskProgress | null;
  events?: AiRunEventData[] | null;
  taskType: WorkbenchTaskType;
  elapsedSeconds?: number;
  status?: string | null;
  errorCode?: string | null;
  inputChars?: number | null;
  tone?: "light" | "dark";
  showEta?: boolean;
  showInputChars?: boolean;
  hasAttachment?: boolean;
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

type RunEventTimelineProps = {
  taskId?: string | null;
  events?: AiRunEventData[] | null;
  status?: string | null;
  tone?: "light" | "dark";
  emptyMessage?: string | null;
  collapsible?: boolean;
  taskType?: WorkbenchTaskType;
  progress?: AiTaskProgress | null;
  hasAttachment?: boolean;
};

type RunStage =
  | "queued"
  | "input"
  | "scanning"
  | "planning"
  | "processing"
  | "merging"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled";

const STAGE_ORDER: RunStage[] = [
  "queued",
  "input",
  "scanning",
  "planning",
  "processing",
  "merging",
  "validating",
  "completed",
  "failed",
  "cancelled"
];

export function AiTaskProgressPanel({
  taskId,
  progress,
  events,
  taskType,
  elapsedSeconds = 0,
  status,
  errorCode,
  tone = "light",
  hasAttachment = false,
  onCancel,
  canceling = false
}: AiTaskProgressPanelProps) {
  const running = isRunningStatus(status);
  const cancelled = status === "CANCELLED";
  const completed = status === "SUCCEEDED" || progress?.phase === "completed";
  const failed = status === "FAILED" || cancelled || progress?.phase === "failed";
  const liveEvents = useRunEvents({
    events,
    hasAttachment,
    progress,
    status,
    taskId,
    taskType
  });
  const displayEvents = getDisplayRunEvents(liveEvents, taskType);
  const phase = normalizePhase(progress?.phase, status, displayEvents);
  const percent = getDisplayPercent({
    completed,
    events: displayEvents,
    failed,
    phase,
    progress
  });
  const steps = getVisibleSteps(taskType);
  const activeIndex = getActiveStepIndex(steps, phase, displayEvents, status, progress?.failureStage);
  const StatusIcon = failed ? AlertTriangle : completed ? CheckCircle2 : LoaderCircle;
  const phaseLabel = getDisplayPhaseLabel(taskType, phase, displayEvents, status, progress?.phaseLabel);
  const statusMessage = getDisplayStatusMessage({
    cancelled,
    completed,
    errorCode,
    failed,
    phase,
    progress,
    events: displayEvents,
    taskType
  });
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const latestEvent = getLatestEffectiveEvent(displayEvents);

  useEffect(() => {
    if (failed && !completed) {
      setDetailsExpanded(true);
    }
  }, [completed, failed, taskId]);

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
      </div>

      <div className="lq-task-steps">
        {steps.map((step, index) => (
          <div className={`lq-task-step ${index < activeIndex ? "is-done" : ""} ${index === activeIndex ? "is-active" : ""}`} key={step.stage}>
            <span className="lq-task-step-dot" />
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {!completed || failed ? (
        <div className="lq-task-details">
          <button className="lq-task-details-toggle" onClick={() => setDetailsExpanded((value) => !value)} type="button">
            {detailsExpanded ? <ChevronDown aria-hidden="true" size={15} /> : <ChevronRight aria-hidden="true" size={15} />}
            <span>处理明细</span>
            <em>{displayEvents.length > 0 ? `${displayEvents.length} 条事件` : "正在准备"}</em>
          </button>
          {!detailsExpanded && latestEvent ? <p className="lq-task-details-hint">最近：{latestEvent.title}</p> : null}
          {detailsExpanded ? (
            <RunEventTimeline
              collapsible={false}
              emptyMessage={running ? "正在准备任务" : null}
              events={displayEvents}
              status={status}
              taskType={taskType}
              tone={tone}
            />
          ) : null}
        </div>
      ) : null}

      {failed && !cancelled ? <p className="lq-task-advice">{getFailureAdvice(errorCode)}</p> : null}
    </div>
  );
}

export function AiTaskCompletionSummary({ task }: AiTaskCompletionSummaryProps) {
  if (task.status !== "SUCCEEDED") {
    return null;
  }

  const duration = getTaskDuration(task.startedAt, task.finishedAt);

  return (
    <div className="lq-completion-summary">
      <CheckCircle2 aria-hidden="true" size={17} />
      <span>已完成</span>
      {duration ? <span>用时 {duration}</span> : null}
    </div>
  );
}

export function RunEventTimeline({
  taskId,
  events,
  status,
  tone = "light",
  emptyMessage,
  collapsible = true,
  taskType = "code_conversion",
  progress,
  hasAttachment = false
}: RunEventTimelineProps) {
  const mergedEvents = useRunEvents({
    events,
    hasAttachment,
    progress,
    status,
    taskId,
    taskType
  });
  const displayEvents = getDisplayRunEvents(mergedEvents, taskType);
  const running = isRunningStatus(status);
  const failed = isFailedStatus(status) || displayEvents.some(isFailureRunEvent);
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

  const latest = getLatestEffectiveEvent(displayEvents);
  const summary = running
    ? `LightQuant 正在处理 · ${displayEvents.length} 条过程事件`
    : failed
      ? `处理未完成 · ${displayEvents.length} 条过程事件`
      : `已完成 · ${displayEvents.length} 条过程事件`;
  const eventDisplayClasses = getRunEventDisplayClasses(displayEvents, status);
  const eventList = (
    <ol className="lq-run-event-list">
      {displayEvents.map((event) => (
        <li className={eventDisplayClasses.get(getRunEventIdentity(event)) ?? ""} key={getRunEventIdentity(event)}>
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

function useRunEvents({
  events,
  hasAttachment,
  progress,
  status,
  taskId,
  taskType
}: {
  taskId?: string | null;
  events?: AiRunEventData[] | null;
  status?: string | null;
  taskType: WorkbenchTaskType;
  progress?: AiTaskProgress | null;
  hasAttachment?: boolean;
}) {
  const [mergedEvents, setMergedEvents] = useState<AiRunEventData[]>(() => prepareRunEvents({
    events,
    hasAttachment,
    progress,
    status,
    taskId,
    taskType
  }));
  const latestServerSeqRef = useRef(getLatestServerSeq(mergedEvents));
  const polling = isRunningStatus(status);

  useEffect(() => {
    const prepared = prepareRunEvents({
      events,
      hasAttachment,
      progress,
      status,
      taskId,
      taskType
    });
    latestServerSeqRef.current = getLatestServerSeq(prepared);
    setMergedEvents(prepared);
  }, [
    events,
    hasAttachment,
    progress?.failureStage,
    progress?.phase,
    progress?.phaseLabel,
    progress?.progressPercent,
    progress?.statusMessage,
    status,
    taskId,
    taskType
  ]);

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

      setMergedEvents((current) => {
        const merged = mergeRunEvents(current, payload.data?.events ?? []);
        latestServerSeqRef.current = Math.max(getLatestServerSeq(merged), payload.data?.nextAfterSeq ?? 0);
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
      void load(latestServerSeqRef.current);
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [polling, taskId]);

  return mergedEvents;
}

function prepareRunEvents({
  events,
  hasAttachment,
  progress,
  status,
  taskId,
  taskType
}: {
  events?: AiRunEventData[] | null;
  hasAttachment?: boolean;
  progress?: AiTaskProgress | null;
  status?: string | null;
  taskId?: string | null;
  taskType: WorkbenchTaskType;
}) {
  const normalized = normalizeRunEvents(events);
  const synthetic: AiRunEventData[] = [];
  const running = isRunningStatus(status);
  const terminalWithoutEvents = normalized.length === 0 && (isFailedStatus(status) || status === "SUCCEEDED");

  if (normalized.length === 0 && (running || terminalWithoutEvents)) {
    synthetic.push(...createSeedRunEvents({
      hasAttachment,
      progress,
      status,
      taskId,
      taskType
    }));
  }

  const fallback = createProgressFallbackRunEvent({
    baseSeq: getLatestSeq([...normalized, ...synthetic]) + 1,
    progress,
    status,
    taskId,
    taskType
  });

  if (fallback && shouldUseProgressFallback([...normalized, ...synthetic], fallback)) {
    synthetic.push(fallback);
  }

  return mergeRunEvents(synthetic, normalized);
}

function createSeedRunEvents({
  hasAttachment,
  progress,
  status,
  taskId,
  taskType
}: {
  hasAttachment?: boolean;
  progress?: AiTaskProgress | null;
  status?: string | null;
  taskId?: string | null;
  taskType: WorkbenchTaskType;
}) {
  const createdAt = progress?.startedAt ?? progress?.updatedAt ?? new Date(0).toISOString();
  const localTaskId = taskId ?? `local-${taskType}`;
  const events: AiRunEventData[] = [
    createLocalRunEvent({
      createdAt,
      progressPercent: 2,
      seq: 1,
      status: "completed",
      summary: "已接收请求，正在创建后台任务。",
      taskId: localTaskId,
      title: "任务已提交",
      type: "task_created"
    })
  ];

  if (hasAttachment) {
    events.push(createLocalRunEvent({
      createdAt,
      progressPercent: 5,
      seq: events.length + 1,
      status: "completed",
      summary: "附件已进入本次任务输入，等待后台读取。",
      taskId: localTaskId,
      title: "已接收附件",
      type: "upload_received"
    }));
  }

  if (status === "SUCCEEDED") {
    events.push(createLocalRunEvent({
      createdAt,
      progressPercent: 100,
      seq: events.length + 1,
      status: "completed",
      summary: "最终结果已生成。",
      taskId: localTaskId,
      title: "任务已完成",
      type: "completed"
    }));
    return events;
  }

  if (isFailedStatus(status)) {
    events.push(createLocalRunEvent({
      createdAt,
      progressPercent: 96,
      seq: events.length + 1,
      status: "failed",
      summary: status === "CANCELLED" ? "任务已取消。" : "任务处理失败。",
      taskId: localTaskId,
      title: status === "CANCELLED" ? "任务已取消" : "任务执行失败",
      type: status === "CANCELLED" ? "cancelled" : "failed"
    }));
    return events;
  }

  events.push(createLocalRunEvent({
    createdAt,
    progressPercent: hasAttachment ? 6 : 3,
    seq: events.length + 1,
    status: "running",
    summary: "正在处理任务...",
    taskId: localTaskId,
    title: "正在处理任务",
    type: "prepare_task"
  }));

  return events;
}

function createProgressFallbackRunEvent({
  baseSeq,
  progress,
  status,
  taskId,
  taskType
}: {
  baseSeq: number;
  progress?: AiTaskProgress | null;
  status?: string | null;
  taskId?: string | null;
  taskType: WorkbenchTaskType;
}) {
  if (!progress && !isFailedStatus(status) && status !== "SUCCEEDED") {
    return null;
  }

  const rawPhase = progress?.phase ?? null;
  const phase = normalizePhase(rawPhase, status, []);
  const taskLabel = getTaskActionLabel(taskType);
  const base = {
    createdAt: progress?.updatedAt ?? progress?.startedAt ?? new Date(0).toISOString(),
    seq: baseSeq,
    taskId: taskId ?? `local-${taskType}`
  };

  if (status === "SUCCEEDED" || phase === "completed") {
    return createLocalRunEvent({
      ...base,
      progressPercent: 100,
      status: "completed",
      summary: "最终结果已生成。",
      title: "任务已完成",
      type: "completed"
    });
  }

  if (status === "CANCELLED") {
    return createLocalRunEvent({
      ...base,
      progressPercent: Math.min(96, progress?.progressPercent ?? 72),
      status: "failed",
      summary: "任务已取消。",
      title: "任务已取消",
      type: "cancelled"
    });
  }

  if (status === "FAILED" || phase === "failed") {
    return createLocalRunEvent({
      ...base,
      progressPercent: Math.min(96, progress?.progressPercent ?? 72),
      status: "failed",
      summary: progress?.statusMessage ?? "任务处理失败。",
      title: "任务执行失败",
      type: "failed"
    });
  }

  if (phase === "scanning") {
    return createLocalRunEvent({
      ...base,
      progressPercent: progress?.progressPercent ?? 18,
      status: "running",
      summary: sanitizeProcessText(taskType, progress?.statusMessage, rawPhase) || "正在读取输入并识别任务结构。",
      title: taskType === "code_analysis" ? "识别代码结构" : "输入已解析",
      type: rawPhase === "chunking" ? "analyze_code" : "detect_platform"
    });
  }

  if (phase === "processing") {
    return createLocalRunEvent({
      ...base,
      progressPercent: progress?.progressPercent ?? 42,
      status: "running",
      summary: sanitizeProcessText(taskType, progress?.statusMessage, rawPhase) || `${taskLabel}正在生成。`,
      title: `${taskLabel}正在生成`,
      type: "call_model"
    });
  }

  if (phase === "merging") {
    return createLocalRunEvent({
      ...base,
      progressPercent: progress?.progressPercent ?? 86,
      status: "running",
      summary: sanitizeProcessText(taskType, progress?.statusMessage, rawPhase) || "正在整理模型输出。",
      title: "结果整理",
      type: "stream_output"
    });
  }

  if (phase === "validating") {
    return createLocalRunEvent({
      ...base,
      progressPercent: progress?.progressPercent ?? 94,
      status: "running",
      summary: sanitizeProcessText(taskType, progress?.statusMessage, rawPhase) || "正在校验结果完整性。",
      title: "结果整理/校验",
      type: "validate_result"
    });
  }

  return null;
}

function createLocalRunEvent(input: {
  createdAt: string;
  progressPercent: number;
  seq: number;
  status: AiRunEventData["status"];
  summary: string;
  taskId: string;
  title: string;
  type: string;
}): AiRunEventData {
  return {
    id: `local-${input.taskId}-${input.type}-${input.seq}`,
    taskId: input.taskId,
    seq: input.seq,
    type: input.type,
    status: input.status,
    title: input.title,
    summary: input.summary,
    detailJson: {
      localSeed: true
    },
    progressPercent: input.progressPercent,
    visibility: "public",
    createdAt: input.createdAt
  };
}

function shouldUseProgressFallback(events: AiRunEventData[], fallback: AiRunEventData) {
  if (events.length === 0) {
    return true;
  }

  const fallbackStageOrder = getStageOrder(normalizeEventStage(fallback));
  const latestStageOrder = Math.max(...events.map((event) => getStageOrder(normalizeEventStage(event))));

  if (fallbackStageOrder > latestStageOrder) {
    return true;
  }

  return !events.some((event) => getRunEventMergeKey(event) === getRunEventMergeKey(fallback));
}

function normalizeRunEvents(events: AiRunEventData[] | null | undefined) {
  return mergeRunEvents([], events ?? []);
}

function mergeRunEvents(current: AiRunEventData[], incoming: AiRunEventData[]) {
  const byKey = new Map<string, AiRunEventData>();

  for (const event of [...current, ...incoming]) {
    if (!event || !Number.isFinite(event.seq)) {
      continue;
    }

    const normalized = normalizeRunEvent(event);
    const key = getRunEventMergeKey(normalized);
    const existing = byKey.get(key);

    if (!existing || shouldReplaceRunEvent(existing, normalized)) {
      byKey.set(key, normalized);
    }
  }

  const values = [...byKey.values()];
  const hasServerProgress = values.some((event) => !isLocalRunEvent(event) && getStageOrder(normalizeEventStage(event)) > getStageOrder("queued"));
  const filtered = hasServerProgress ? values.filter((event) => !(isLocalRunEvent(event) && event.type === "prepare_task")) : values;

  return filtered.sort(compareRunEvents);
}

function normalizeRunEvent(event: AiRunEventData): AiRunEventData {
  return {
    ...event,
    summary: event.summary ?? null,
    detailJson: event.detailJson ?? null,
    progressPercent: typeof event.progressPercent === "number" ? event.progressPercent : null,
    visibility: event.visibility ?? "public"
  };
}

function getRunEventMergeKey(event: AiRunEventData) {
  if (event.type === "queued" || event.type === "task_created") {
    return "task_created";
  }

  if (event.type === "prepare_task") {
    return "prepare_task";
  }

  if (event.type === "failed" || event.type === "cancelled" || event.type === "canceled") {
    return `${event.type}:${event.seq}`;
  }

  const phase = readDetailPhase(event);

  if (event.type === "analyze_code" || event.type === "call_model" || event.type === "detect_platform") {
    return `${event.type}:${phase ?? normalizeEventStage(event)}`;
  }

  return event.type;
}

function shouldReplaceRunEvent(existing: AiRunEventData, incoming: AiRunEventData) {
  if (isLocalRunEvent(existing) && !isLocalRunEvent(incoming)) {
    return true;
  }

  if (!isLocalRunEvent(existing) && isLocalRunEvent(incoming)) {
    return false;
  }

  if (incoming.seq !== existing.seq) {
    return incoming.seq > existing.seq;
  }

  if (incoming.status === "completed" && existing.status !== "completed") {
    return true;
  }

  return (incoming.progressPercent ?? 0) >= (existing.progressPercent ?? 0);
}

function compareRunEvents(left: AiRunEventData, right: AiRunEventData) {
  if (!isLocalRunEvent(left) && !isLocalRunEvent(right) && left.seq !== right.seq) {
    return left.seq - right.seq;
  }

  const stageDiff = getStageOrder(normalizeEventStage(left)) - getStageOrder(normalizeEventStage(right));

  if (stageDiff !== 0) {
    return stageDiff;
  }

  if (left.seq !== right.seq) {
    return left.seq - right.seq;
  }

  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function getDisplayRunEvents(events: AiRunEventData[], taskType?: WorkbenchTaskType) {
  if (taskType !== "code_analysis") {
    return events;
  }

  return events.map((event) => ({
    ...event,
    title: sanitizeAnalysisEventTitle(event),
    summary: sanitizeAnalysisProcessText(event.summary, readDetailPhase(event))
  }));
}

function getRunEventDisplayClasses(events: AiRunEventData[], taskStatus: string | null | undefined) {
  const classes = new Map<string, string>();
  const running = isRunningStatus(taskStatus);
  const succeeded = taskStatus === "SUCCEEDED";
  const failed = isFailedStatus(taskStatus) || events.some(isFailureRunEvent);
  const firstFailureIndex = failed ? events.findIndex(isFailureRunEvent) : -1;
  const latestRunningIndex = running ? findLatestIndex(events, (event) => event.status === "running" && !isFailureRunEvent(event)) : -1;
  const latestEffectiveIndex = running ? findLatestIndex(events, (event) => event.status !== "skipped" && !isFailureRunEvent(event)) : -1;
  const activeIndex = latestRunningIndex >= 0 ? latestRunningIndex : latestEffectiveIndex;

  events.forEach((event, index) => {
    const identity = getRunEventIdentity(event);

    if (event.status === "skipped") {
      classes.set(identity, "is-skipped");
      return;
    }

    if (isFailureRunEvent(event)) {
      classes.set(identity, "is-failed");
      return;
    }

    if (succeeded) {
      classes.set(identity, "is-done");
      return;
    }

    if (firstFailureIndex >= 0) {
      classes.set(identity, index < firstFailureIndex ? "is-done" : index === firstFailureIndex ? "is-failed" : "");
      return;
    }

    if (activeIndex >= 0) {
      classes.set(identity, index < activeIndex ? "is-done" : index === activeIndex ? "is-active" : "");
      return;
    }

    classes.set(identity, event.status === "completed" ? "is-done" : "");
  });

  return classes;
}

function getDisplayPercent({
  completed,
  events,
  failed,
  phase,
  progress
}: {
  events: AiRunEventData[];
  failed: boolean;
  completed: boolean;
  phase: RunStage;
  progress?: AiTaskProgress | null;
}) {
  if (completed) {
    return 100;
  }

  const backendPercent = typeof progress?.progressPercent === "number" ? progress.progressPercent : 0;
  const phasePercent = getPhasePercentFloor(phase, progress);
  const eventPercent = getEventPercentFloor(events);
  const percent = clampPercent(Math.max(backendPercent, phasePercent, eventPercent));

  if (failed) {
    return Math.min(96, Math.max(8, percent));
  }

  return Math.min(96, Math.max(2, percent));
}

function getEventPercentFloor(events: AiRunEventData[]) {
  return events.reduce((max, event) => Math.max(max, getSingleEventPercentFloor(event)), 0);
}

function getSingleEventPercentFloor(event: AiRunEventData) {
  if (typeof event.progressPercent === "number") {
    return event.progressPercent;
  }

  return getPhasePercentFloor(normalizeEventStage(event));
}

function getPhasePercentFloor(phase: RunStage, progress?: AiTaskProgress | null) {
  if (phase === "queued") {
    return 2;
  }

  if (phase === "input") {
    return 12;
  }

  if (phase === "scanning") {
    return 18;
  }

  if (phase === "planning") {
    return 32;
  }

  if (phase === "processing") {
    if (progress?.chunkCount) {
      return 42 + Math.round(((progress.completedChunks ?? 0) / progress.chunkCount) * 30);
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

function normalizePhase(phase: string | null | undefined, status: string | null | undefined, events: AiRunEventData[]): RunStage {
  if (status === "CANCELLED") {
    return "cancelled";
  }

  if (status === "FAILED") {
    return "failed";
  }

  if (status === "SUCCEEDED") {
    return "completed";
  }

  const latestStage = getLatestEffectiveEvent(events);

  if (latestStage) {
    return normalizeEventStage(latestStage);
  }

  if (phase === "queued") {
    return "queued";
  }

  if (phase === "scanning" || phase === "chunking") {
    return "scanning";
  }

  if (phase === "processing") {
    return "processing";
  }

  if (phase === "merging") {
    return "merging";
  }

  if (phase === "validating") {
    return "validating";
  }

  if (phase === "completed") {
    return "completed";
  }

  if (phase === "failed") {
    return "failed";
  }

  return "queued";
}

function normalizeEventStage(event: AiRunEventData): RunStage {
  const phase = readDetailPhase(event);

  if (event.type === "completed") {
    return "completed";
  }

  if (event.type === "failed") {
    return "failed";
  }

  if (event.type === "cancelled" || event.type === "canceled") {
    return "cancelled";
  }

  if (phase === "completed") {
    return "completed";
  }

  if (phase === "failed") {
    return "failed";
  }

  if (phase === "validating") {
    return "validating";
  }

  if (phase === "merging") {
    return "merging";
  }

  if (phase === "processing") {
    return "processing";
  }

  if (phase === "scanning" || phase === "chunking") {
    return "scanning";
  }

  if (event.type === "queued" || event.type === "task_created" || event.type === "prepare_task") {
    return "queued";
  }

  if (event.type === "upload_received" || event.type === "read_attachment" || event.type === "parse_text" || event.type === "parse_image") {
    return "input";
  }

  if (event.type === "detect_platform" || event.type === "scanning") {
    return "scanning";
  }

  if (event.type === "generate_plan") {
    return "planning";
  }

  if (event.type === "call_model" || event.type === "analyze_code" || event.type === "processing") {
    return "processing";
  }

  if (event.type === "stream_output" || event.type === "merging") {
    return "merging";
  }

  if (event.type === "validate_result" || event.type === "create_artifact" || event.type === "validating") {
    return "validating";
  }

  return "queued";
}

function getVisibleSteps(taskType: WorkbenchTaskType) {
  if (taskType === "strategy_generation") {
    return [
      { stage: "input" as const, label: "需求提交" },
      { stage: "planning" as const, label: "处理计划" },
      { stage: "processing" as const, label: "AI 生成" },
      { stage: "validating" as const, label: "结果整理" }
    ];
  }

  if (taskType === "code_analysis") {
    return [
      { stage: "input" as const, label: "输入解析" },
      { stage: "planning" as const, label: "解析计划" },
      { stage: "processing" as const, label: "逻辑解析" },
      { stage: "validating" as const, label: "风险检查" }
    ];
  }

  return [
    { stage: "input" as const, label: "输入解析" },
    { stage: "planning" as const, label: "转换计划" },
    { stage: "processing" as const, label: "AI 转换" },
    { stage: "validating" as const, label: "结果校验" }
  ];
}

function getActiveStepIndex(
  steps: Array<{ stage: RunStage; label: string }>,
  phase: RunStage,
  events: AiRunEventData[],
  status?: string | null,
  failureStage?: string | null
) {
  if (status === "SUCCEEDED" || phase === "completed") {
    return steps.length;
  }

  const failurePhase = failureStage ? mapProgressPhaseToStage(failureStage) : null;
  const latestStage = phase === "failed" || phase === "cancelled"
    ? failurePhase ?? normalizeEventStage(getLatestEffectiveEvent(events) ?? events.at(-1) ?? createStagePlaceholder("processing"))
    : normalizeEventStage(getLatestEffectiveEvent(events) ?? createStagePlaceholder(phase));
  const index = steps.findIndex((step) => step.stage === mapRunStageToStepStage(latestStage));

  return index >= 0 ? index : 0;
}

function getDisplayPhaseLabel(
  taskType: WorkbenchTaskType,
  phase: RunStage,
  events: AiRunEventData[],
  status?: string | null,
  backendLabel?: string | null
) {
  if (status === "CANCELLED") {
    return "已取消";
  }

  if (status === "FAILED") {
    return "执行失败";
  }

  if (status === "SUCCEEDED" || phase === "completed") {
    return "已完成";
  }

  const latest = getLatestEffectiveEvent(events);

  if (latest) {
    return latest.title;
  }

  const cleanBackendLabel = sanitizeProcessText(taskType, backendLabel, phase);

  return cleanBackendLabel || getFallbackPhaseLabel(taskType, phase);
}

function getDisplayStatusMessage({
  cancelled,
  completed,
  errorCode,
  failed,
  phase,
  progress,
  events,
  taskType
}: {
  cancelled: boolean;
  completed: boolean;
  errorCode?: string | null;
  failed: boolean;
  phase: RunStage;
  progress?: AiTaskProgress | null;
  events: AiRunEventData[];
  taskType: WorkbenchTaskType;
}) {
  if (cancelled) {
    return "任务已取消。";
  }

  if (failed) {
    return sanitizeProcessText(taskType, progress?.statusMessage, phase) || getFailureStatusMessage(errorCode);
  }

  if (completed) {
    return "任务已完成，结果已生成。";
  }

  const latest = getLatestEffectiveEvent(events);

  if (latest?.summary) {
    return latest.summary;
  }

  return sanitizeProcessText(taskType, progress?.statusMessage, phase) || getFallbackStatusMessage(taskType, phase);
}

function getFallbackPhaseLabel(taskType: WorkbenchTaskType, phase: RunStage) {
  if (phase === "input") {
    return "输入已解析";
  }

  if (phase === "scanning" || phase === "planning") {
    return taskType === "code_conversion" ? "整理转换计划" : taskType === "code_analysis" ? "整理解析计划" : "整理策略生成计划";
  }

  if (phase === "processing") {
    return taskType === "code_conversion" ? "AI 正在转换" : taskType === "code_analysis" ? "AI 正在解析" : "AI 正在生成";
  }

  if (phase === "merging" || phase === "validating") {
    return "结果整理/校验";
  }

  if (phase === "failed" || phase === "cancelled") {
    return "处理未完成";
  }

  return "正在处理任务";
}

function getFallbackStatusMessage(taskType: WorkbenchTaskType, phase: RunStage) {
  if (phase === "queued") {
    return "正在处理任务...";
  }

  if (phase === "input") {
    return "正在读取附件和解析输入内容。";
  }

  if (phase === "scanning" || phase === "planning") {
    return "正在整理处理计划和关键输入信息。";
  }

  if (phase === "processing") {
    return taskType === "code_conversion"
      ? "AI 正在按目标平台要求生成转换结果。"
      : taskType === "code_analysis"
        ? "AI 正在解析策略结构、交易逻辑和风险点。"
        : "AI 正在生成策略结果。";
  }

  if (phase === "merging" || phase === "validating") {
    return "正在整理输出并检查结果完整性。";
  }

  return "任务处理中。";
}

function sanitizeProcessText(taskType: WorkbenchTaskType, value: string | null | undefined, phase?: string | null) {
  return taskType === "code_analysis" ? sanitizeAnalysisProcessText(value, phase) : value?.trim() ?? "";
}

function sanitizeAnalysisEventTitle(event: AiRunEventData) {
  const phase = readDetailPhase(event);

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
  return /第\s*\d+\s*\/\s*\d+\s*段|已拆分为|正在处理第|正在解析第|正在转换第|分段|拆分长代码|chunk/i.test(value);
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

function mapProgressPhaseToStage(phase: string): RunStage {
  if (phase === "queued") {
    return "queued";
  }

  if (phase === "scanning" || phase === "chunking") {
    return "planning";
  }

  if (phase === "processing") {
    return "processing";
  }

  if (phase === "merging" || phase === "validating") {
    return "validating";
  }

  if (phase === "completed") {
    return "completed";
  }

  if (phase === "failed") {
    return "failed";
  }

  return "processing";
}

function mapRunStageToStepStage(stage: RunStage): RunStage {
  if (stage === "queued") {
    return "input";
  }

  if (stage === "scanning") {
    return "planning";
  }

  if (stage === "merging") {
    return "validating";
  }

  if (stage === "failed" || stage === "cancelled" || stage === "completed") {
    return "validating";
  }

  return stage;
}

function createStagePlaceholder(stage: RunStage): AiRunEventData {
  return {
    id: `placeholder-${stage}`,
    taskId: "placeholder",
    seq: 0,
    type: stage,
    status: "running",
    title: stage,
    summary: null,
    detailJson: null,
    progressPercent: null,
    visibility: "public",
    createdAt: new Date(0).toISOString()
  };
}

function getLatestEffectiveEvent(events: AiRunEventData[]) {
  return [...events].reverse().find((event) => event.status !== "skipped") ?? null;
}

function isFailureRunEvent(event: AiRunEventData) {
  return event.status === "failed" || event.type === "failed" || event.type === "cancelled" || event.type === "canceled";
}

function isRunningStatus(status: string | null | undefined) {
  return status === "PENDING" || status === "RUNNING";
}

function isFailedStatus(status: string | null | undefined) {
  return status === "FAILED" || status === "CANCELLED";
}

function getLatestSeq(events: AiRunEventData[]) {
  return events.reduce((max, event) => Math.max(max, event.seq), 0);
}

function getLatestServerSeq(events: AiRunEventData[]) {
  return events.filter((event) => !isLocalRunEvent(event)).reduce((max, event) => Math.max(max, event.seq), 0);
}

function getRunEventIdentity(event: AiRunEventData) {
  return event.id || `${event.taskId}-${event.seq}-${event.type}`;
}

function isLocalRunEvent(event: AiRunEventData) {
  return event.id.startsWith("local-") || event.detailJson?.localSeed === true;
}

function readDetailPhase(event: AiRunEventData) {
  const phase = event.detailJson?.phase;

  return typeof phase === "string" ? phase : null;
}

function getStageOrder(stage: RunStage) {
  return STAGE_ORDER.indexOf(stage);
}

function findLatestIndex<T>(items: T[], predicate: (item: T) => boolean) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) {
      return index;
    }
  }

  return -1;
}

function getTaskActionLabel(taskType: WorkbenchTaskType) {
  if (taskType === "code_conversion") {
    return "AI 转换";
  }

  if (taskType === "code_analysis") {
    return "AI 解析";
  }

  return "AI";
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

  return formatDuration(Math.max(1, Math.round((finished - started) / 1000)));
}

function getFailureStatusMessage(errorCode?: string | null) {
  if (errorCode === "AI_PROVIDER_TIMEOUT") {
    return "AI 服务响应超时，请稍后重试。";
  }

  if (errorCode === "AI_PROVIDER_BAD_RESPONSE") {
    return "AI 返回内容格式异常，未能完成结果校验。";
  }

  return "任务处理失败，请按错误提示调整后重试。";
}

function getFailureAdvice(errorCode?: string | null) {
  if (errorCode === "AI_PROVIDER_TIMEOUT") {
    return "AI 服务响应超时，请稍后重试。";
  }

  if (errorCode === "AI_PROVIDER_BAD_RESPONSE") {
    return "AI 返回内容格式异常，请重试；若多次失败，可减少非必要注释或拆分复杂策略。";
  }

  if (errorCode === "AI_PROVIDER_CONFIG_ERROR") {
    return "请联系管理员检查模型配置。";
  }

  if (errorCode === "INPUT_TOO_LARGE") {
    return "请拆分提交，或等待更大的分段处理额度。";
  }

  return "请稍后重试；若多次失败，可补充平台信息或拆分复杂策略。";
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
