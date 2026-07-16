"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  AlertTriangle,
  Bot,
  Code2,
  FileUp,
  Info,
  LoaderCircle,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  Square,
  Trash2
} from "lucide-react";
import { getFileUploadFriendlyError, getUploadAccept, getUploadButtonLabel, uploadCodeFile, type UploadedCodeFile } from "@/lib/file-upload";
import { normalizeStrategyFinalAnswerMarkdown } from "@/lib/ai/strategy-result-format";
import {
  buildAiTaskFingerprint,
  isAiTaskDataCompleteSuccess,
  isAiTaskDataPartial
} from "@/lib/ai/task-fingerprint";
import { chatPlatformOptions, convertPlatforms } from "@/lib/mock-data";
import { PlatformDropdown } from "@/components/ui/PlatformDropdown";
import { AssistantThinkingMessage, type AssistantThinkingStatus } from "@/components/ai/AssistantThinkingMessage";
import { MessageAttachmentList, WorkbenchFileUploadStatus } from "@/components/ai/AttachmentPreviewCard";
import { WorkbenchShell } from "@/components/ai/WorkbenchShell";
import {
  canCopyConversionTab,
  ConversionCodePreview,
  ConversionFailureState,
  ConversionNotesPreview,
  getConversionCopyContent,
  getConversionFailureInfo
} from "@/components/ai/ConversionResultPanel";
import {
  CopyCodeButton,
  FullCodeResultPanel,
  getCodeConversionTabContent,
  isCodeConversionCodeTab,
  parseCodeConversionMarkdown,
  stripGeneratedCodeFromMarkdown
} from "@/components/ai/WorkbenchResultViews";
import {
  createRestoredUploadedFile,
  createWorkbenchClientRequestId,
  cancelAiTask,
  fetchAiTaskStatus,
  formatRestoredInputText,
  getConversationActiveTab,
  getCachedClientRequestStartedAt,
  getCachedTaskStartedAt,
  getFriendlyAiError as getFriendlyError,
  getAiTaskStreamingContent,
  formatAiTaskResultAsMarkdown,
  getMessageAttachments,
  getTaskElapsedSeconds,
  logWorkbenchPerf,
  migrateTaskStartedAt,
  persistConversationActiveTab,
  readRecord,
  readNullableString,
  readStringArray,
  rememberClientRequestStartedAt,
  rememberTaskStartedAt,
  resolveTaskStartedAt,
  replaceWorkbenchConversationUrl,
  streamWorkbenchAiTask,
  uploadedFileToMessageAttachment,
  useStableElapsedSeconds,
  waitForAiTaskResult
} from "@/lib/ai/workbench-client";
import { useWorkbenchConversationRestore } from "@/lib/ai/use-workbench-conversation";
import type { AiConversationData, AiMessageData, AiRunEventData, AiTaskData, WorkbenchTaskType } from "@/lib/ai/workbench-types";

type StrategyChatMessage = AiMessageData & {
  localStatus?: "pending" | "error";
  startedAt?: number;
};

type ChatClientProps = {
  mode: "strategy" | "convert";
};

type JobStatus =
  | "pending"
  | "queued"
  | "running"
  | "streaming"
  | "completed"
  | "failed"
  | "canceled";

type StrategyJobRequest = {
  conversationKey: string;
  clientRequestId?: string;
  submitStartedAt?: string;
  prompt: string;
  messageContent: string;
  targetPlatform: string;
  inputFileId?: string;
  inputFileName?: string;
};

type StrategyJob = {
  id: string;
  conversationId: string;
  status: JobStatus;
  partialResult?: string;
  finalResult?: string;
  visibleThinking?: string;
  finalAnswerMarkdown?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  clientRequestId?: string;
  task?: AiTaskData["task"];
  result?: AiTaskData["result"];
  billing?: AiTaskData["billing"];
  request?: StrategyJobRequest;
  events?: AiRunEventData[];
};

type ThinkingMessageState = {
  status: AssistantThinkingStatus;
  visibleThinking: string;
  finalAnswerMarkdown: string;
  error?: string | null;
  taskId?: string | null;
};

const conversionTabs = ["目标平台代码", "迁移说明"] as const;
const AI_TASK_POLL_INTERVAL_MS = 3000;
const AI_TASK_POLL_TIMEOUT_MS = 5 * 60 * 1000;
const DRAFT_CONVERSATION_KEY = "__draft_strategy_conversation__";
const STRATEGY_THREAD_BOTTOM_THRESHOLD_PX = 100;
const CODE_CONVERSION_MAX_TOTAL_INPUT_CHARS = 150000;

export function ChatClient({ mode }: ChatClientProps) {
  if (mode === "convert") {
    return <ConvertModeContent />;
  }

  return <StrategyModeContent />;
}

function StrategyModeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [targetPlatform, setTargetPlatform] = useState(chatPlatformOptions[0]);
  const [conversation, setConversation] = useState<AiConversationData | null>(null);
  const [messages, setMessages] = useState<StrategyChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobsById, setJobsById] = useState<Record<string, StrategyJob>>({});
  const [activeJobByConversationId, setActiveJobByConversationId] = useState<Record<string, string>>({});
  const [uploadedFile, setUploadedFile] = useState<UploadedCodeFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [lastSuccessfulFingerprint, setLastSuccessfulFingerprint] = useState<string | null>(null);
  const [cancelingStrategyJobId, setCancelingStrategyJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compositionRef = useRef(false);
  const strategyThreadRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const forceScrollToBottomRef = useRef(false);
  const conversationIdFromUrl = searchParams.get("conversationId");
  const currentConversationKey = conversation?.id ?? conversationIdFromUrl ?? DRAFT_CONVERSATION_KEY;
  const activeConversationKeyRef = useRef(currentConversationKey);
  const pollingJobsRef = useRef(new Map<string, AbortController>());
  const canceledLocalJobIdsRef = useRef(new Set<string>());
  const streamAbortControllersRef = useRef(new Map<string, AbortController>());
  const activeJobId = activeJobByConversationId[currentConversationKey];
  const activeJob = activeJobId ? jobsById[activeJobId] ?? null : null;
  const activeJobRunning = getDisplayJobActive(activeJob);
  const elapsedSeconds = useStableElapsedSeconds(activeJobRunning, {
    task: activeJob?.task ?? null,
    taskId: activeJob?.id ?? null,
    clientRequestId: activeJob?.clientRequestId ?? activeJob?.request?.clientRequestId ?? activeJob?.task?.clientRequestId ?? null,
    localCreatedAt: activeJob?.createdAt ?? null,
    fallbackStartedAt: activeJob?.startedAt ?? null,
    finishedAt: activeJob?.finishedAt ?? activeJob?.task?.finishedAt ?? null
  });
  const strategyCurrentFingerprint = useMemo(() => buildAiTaskFingerprint({
    type: "strategy_generation",
    targetPlatform,
    prompt,
    messageContent: prompt,
    inputFile: uploadedFile
  }), [targetPlatform, prompt, uploadedFile]);
  const strategyHasInput = Boolean(prompt.trim() || uploadedFile);
  const strategyDuplicateCompleted = strategyHasInput && lastSuccessfulFingerprint === strategyCurrentFingerprint;
  const strategySendDisabled = uploading ||
    uploadedFile?.scanStatus === "BLOCKED" ||
    !strategyHasInput ||
    strategyDuplicateCompleted;
  const strategyCanceling = Boolean(activeJob && cancelingStrategyJobId === activeJob.id);

  useEffect(() => {
    activeConversationKeyRef.current = currentConversationKey;
  }, [currentConversationKey]);

  useEffect(() => {
    abortAllStrategyPolls();
  }, [conversationIdFromUrl]);

  useEffect(() => () => {
    abortAllStrategyPolls();
  }, []);

  const restoreState = useWorkbenchConversationRestore({
    conversationId: conversationIdFromUrl,
    expectedMode: "strategy",
    taskType: "strategy_generation",
    messages: {
      limit: 20,
      taskLimit: 5,
      includeTaskResults: "latest"
    },
    onSummary: (summary) => {
      setConversation(summary);

      if (summary.targetPlatform && chatPlatformOptions.includes(summary.targetPlatform)) {
        setTargetPlatform(summary.targetPlatform);
      }
    },
    onRestore: (data, restored) => {
      setConversation(data.conversation);
      setMessages(data.messages.map(toStrategyMessage));
      hydrateConversationJobs(data.conversation.id, data.tasks ?? [], data.messages);

      if (data.conversation.targetPlatform && chatPlatformOptions.includes(data.conversation.targetPlatform)) {
        setTargetPlatform(data.conversation.targetPlatform);
      }

      const restoredFingerprint = buildStrategyRestoredFingerprint(data.messages, restored.targetPlatform ?? data.conversation.targetPlatform);

      if (restoredFingerprint && isAiTaskDataCompleteSuccess(restored.taskData)) {
        setLastSuccessfulFingerprint(restoredFingerprint);
      } else if (restoredFingerprint && isAiTaskDataPartial(restored.taskData)) {
        setLastSuccessfulFingerprint(null);
      } else {
        setLastSuccessfulFingerprint(null);
      }
    },
    onError: (historyError) => {
      setError(getFriendlyError(historyError));
    }
  });

  useEffect(() => {
    if (!conversationIdFromUrl) {
      setConversation(null);
      setMessages([]);
    }
  }, [conversationIdFromUrl]);

  useEffect(() => {
    setHistoryLoading(restoreState.loading);

    if (restoreState.loading) {
      setError("");
    }
  }, [restoreState.loading]);

  useEffect(() => {
    const handleWindowScroll = () => {
      if (!getStrategyThreadScrollContainer()) {
        shouldStickToBottomRef.current = isStrategyThreadNearBottom();
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, []);

  useEffect(() => {
    const shouldForceScroll = forceScrollToBottomRef.current;

    if (!shouldForceScroll && !shouldStickToBottomRef.current) {
      return;
    }

    forceScrollToBottomRef.current = false;
    const frameId = window.requestAnimationFrame(() => {
      if (shouldForceScroll || shouldStickToBottomRef.current || isStrategyThreadNearBottom()) {
        scrollStrategyThreadToBottom();
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [messages.length, activeJob?.id, activeJob?.status, activeJob?.partialResult, activeJob?.events?.length, activeJobRunning, elapsedSeconds, error]);

  function abortAllStrategyPolls() {
    for (const controller of pollingJobsRef.current.values()) {
      controller.abort();
    }

    pollingJobsRef.current.clear();
  }

  function getStrategyThreadScrollContainer() {
    const thread = strategyThreadRef.current;

    if (!thread || thread.scrollHeight <= thread.clientHeight + 1) {
      return null;
    }

    return thread;
  }

  function isStrategyThreadNearBottom() {
    const container = getStrategyThreadScrollContainer();

    if (container) {
      return container.scrollHeight - container.scrollTop - container.clientHeight <= STRATEGY_THREAD_BOTTOM_THRESHOLD_PX;
    }

    const scrollingElement = document.scrollingElement ?? document.documentElement;
    return scrollingElement.scrollHeight - window.scrollY - window.innerHeight <= STRATEGY_THREAD_BOTTOM_THRESHOLD_PX;
  }

  function scrollStrategyThreadToBottom() {
    const container = getStrategyThreadScrollContainer();

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "auto"
      });
    } else {
      bottomRef.current?.scrollIntoView({
        block: "end",
        behavior: "auto"
      });
    }

    shouldStickToBottomRef.current = true;
  }

  function forceStrategyThreadToBottom() {
    forceScrollToBottomRef.current = true;
    shouldStickToBottomRef.current = true;
  }

  function handleStrategyThreadScroll() {
    shouldStickToBottomRef.current = isStrategyThreadNearBottom();
  }

  function hydrateConversationJobs(conversationId: string, tasks: AiTaskData["task"][], nextMessages: AiMessageData[]) {
    if (tasks.length === 0) {
      return;
    }

    const nextJobs = tasks.map((task) => createStrategyJobFromTask(task, {
      conversationId,
      previous: jobsById[task.id]
    }));
    const latestVisibleJob = [...nextJobs]
      .reverse()
      .find((job) => isJobActive(job) || ((job.status === "failed" || job.status === "canceled") && !hasAssistantMessageForTask(nextMessages, job.id)));

    setJobsById((current) => {
      const merged = { ...current };

      for (const job of nextJobs) {
        merged[job.id] = {
          ...merged[job.id],
          ...job,
          request: merged[job.id]?.request
        };
      }

      return merged;
    });

    setActiveJobByConversationId((current) => {
      const next = { ...current };

      if (latestVisibleJob) {
        next[conversationId] = latestVisibleJob.id;
      } else {
        delete next[conversationId];
      }

      return next;
    });

    for (const job of nextJobs) {
      if (isJobActive(job)) {
        startPollingJob(job.id, conversationId);
      }
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      setUploadedFile(await uploadCodeFile(file, "strategy_generation"));
    } catch (uploadErrorValue) {
      setUploadedFile(null);
      setUploadError(getFileUploadFriendlyError(uploadErrorValue));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (activeJobRunning || uploading) {
      return;
    }

    if (strategyDuplicateCompleted) {
      return;
    }

    const messageContent = prompt.trim();
    const submittedFingerprint = strategyCurrentFingerprint;

    if (!submittedFingerprint) {
      return;
    }

    if (!messageContent && !uploadedFile) {
      return;
    }

    if (uploadedFile?.scanStatus === "BLOCKED") {
      return;
    }

    const clientRequestId = createWorkbenchClientRequestId("strategy");
    const submitStartedAt = new Date().toISOString();
    rememberClientRequestStartedAt(clientRequestId, submitStartedAt, { overwrite: true });
    const optimisticUserContent = messageContent || (uploadedFile ? `已上传文件：${uploadedFile.originalName}` : "已上传文件输入");
    const currentConversationId = conversation?.id ?? conversationIdFromUrl ?? undefined;
    const conversationKeyAtSubmit = currentConversationId ?? DRAFT_CONVERSATION_KEY;
    const request: StrategyJobRequest = {
      conversationKey: conversationKeyAtSubmit,
      clientRequestId,
      submitStartedAt,
      prompt: optimisticUserContent,
      messageContent: optimisticUserContent,
      targetPlatform,
      inputFileId: uploadedFile?.fileId,
      inputFileName: uploadedFile?.originalName
    };
    const localJob = createLocalStrategyJob({
      id: clientRequestId,
      conversationId: conversationKeyAtSubmit,
      request,
      createdAt: submitStartedAt,
      startedAt: submitStartedAt
    });

    setError("");
    setJobsById((current) => ({
      ...current,
      [localJob.id]: localJob
    }));
    setActiveJobByConversationId((current) => ({
      ...current,
      [conversationKeyAtSubmit]: localJob.id
    }));
    setMessages((current) => [
      ...current,
      {
        id: `user-${clientRequestId}`,
        conversationId: currentConversationId ?? "",
        role: "user",
        taskId: null,
        content: optimisticUserContent,
        contentJson: {
          targetPlatform,
          inputFileId: uploadedFile?.fileId ?? null,
          inputFileName: uploadedFile?.originalName ?? null,
          continuation: null
        },
        attachments: uploadedFile ? [uploadedFileToMessageAttachment(uploadedFile, `local-attachment-${clientRequestId}`)] : [],
        createdAt: submitStartedAt
      }
    ]);
    setPrompt("");
    setUploadError("");
    forceStrategyThreadToBottom();

    const streamController = new AbortController();
    let streamJobId = localJob.id;
    streamAbortControllersRef.current.set(streamJobId, streamController);

    try {
      const completed = await streamWorkbenchAiTask({
        type: "strategy_generation",
        conversationId: currentConversationId,
        messageContent: optimisticUserContent,
        targetPlatform,
        prompt: optimisticUserContent,
        inputFileId: uploadedFile?.fileId,
        clientRequestId
      }, {
        signal: streamController.signal,
        onTask: (data) => {
          if (streamJobId !== data.task.id) {
            const controller = streamAbortControllersRef.current.get(streamJobId);
            streamAbortControllersRef.current.delete(streamJobId);
            if (controller) {
              streamAbortControllersRef.current.set(data.task.id, controller);
            }
            streamJobId = data.task.id;
          }

          applyConversationPayload(data, {
            localJobId: localJob.id,
            sourceConversationKey: conversationKeyAtSubmit,
            request
          });
          window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
        },
        onThinkingDelta: (delta) => {
          appendStrategyJobStreamDelta(streamJobId, "thinking", delta);
        },
        onFinalDelta: (delta) => {
          appendStrategyJobStreamDelta(streamJobId, "final", delta);
        },
        onDone: (data) => {
          applyConversationPayload(data, {
            localJobId: localJob.id,
            sourceConversationKey: conversationKeyAtSubmit,
            request
          });
        }
      });

      setUploadedFile(null);
      applyConversationPayload(completed, {
        localJobId: localJob.id,
        sourceConversationKey: conversationKeyAtSubmit,
        request
      });
      rememberTaskFingerprintOutcome(completed, submittedFingerprint, {
        setLastSuccessfulFingerprint
      });
      window.dispatchEvent(new Event("lightquant:credits-updated"));
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
    } catch (submitError) {
      if (streamController.signal.aborted) {
        return;
      }

      canceledLocalJobIdsRef.current.delete(localJob.id);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      const friendly = getFriendlyError(submitError);
      setError(friendly);
      setJobsById((current) => ({
        ...current,
        [streamJobId]: {
          ...(current[streamJobId] ?? current[localJob.id] ?? localJob),
          status: "failed",
          error: friendly,
          finalAnswerMarkdown: "",
          finishedAt: new Date().toISOString()
        }
      }));
    } finally {
      canceledLocalJobIdsRef.current.delete(localJob.id);
      streamAbortControllersRef.current.delete(streamJobId);
      streamAbortControllersRef.current.delete(localJob.id);
    }
  }

  function applyConversationPayload(
    data: AiTaskData,
    options: {
      localJobId?: string;
      sourceConversationKey: string;
      request?: StrategyJobRequest;
    }
  ) {
    const responseConversationId = data.conversation?.id ?? data.task.conversationId ?? options.sourceConversationKey;
    const localJob = options.localJobId ? jobsById[options.localJobId] : undefined;
    const previousJob = jobsById[data.task.id] ?? localJob;
    const request = options.request ?? previousJob?.request;
    const requestClientRequestId = request?.clientRequestId ?? null;
    const taskClientRequestId = data.task.clientRequestId ?? null;
    const previousClientRequestId = getStrategyJobClientRequestId(previousJob);
    const requestMatchesTask = !requestClientRequestId || !taskClientRequestId || requestClientRequestId === taskClientRequestId;
    const clientRequestId = requestMatchesTask
      ? requestClientRequestId ?? taskClientRequestId ?? (previousJob?.id === data.task.id ? previousClientRequestId : null)
      : taskClientRequestId ?? requestClientRequestId;
    const previousBelongsToCurrentRequest = Boolean(clientRequestId && previousClientRequestId === clientRequestId);
    const localBelongsToCurrentRequest = Boolean(
      requestClientRequestId &&
      options.localJobId === requestClientRequestId &&
      previousClientRequestId === requestClientRequestId &&
      taskClientRequestId === requestClientRequestId
    );

    if (options.localJobId && options.localJobId !== data.task.id) {
      migrateTaskStartedAt(options.localJobId, data.task.id, previousJob?.startedAt ?? previousJob?.createdAt, {
        clientRequestId,
        localClientRequestId: previousClientRequestId,
        taskClientRequestId,
        submitStartedAt: request?.submitStartedAt
      });
    }

    const stableStartedAt = resolveTaskStartedAt({
      task: data.task,
      clientRequestId,
      requestStartedAt: requestMatchesTask && requestClientRequestId === clientRequestId ? request?.submitStartedAt : undefined,
      cachedStartedAt: previousBelongsToCurrentRequest ? previousJob?.startedAt : undefined,
      localCreatedAt: localBelongsToCurrentRequest ? previousJob?.createdAt : undefined,
      fallback: data.task.createdAt
    });
    rememberTaskStartedAt(data.task.id, stableStartedAt, { overwrite: true });
    rememberClientRequestStartedAt(clientRequestId, stableStartedAt, { overwrite: true });

    const streamContent = getAiTaskStreamingContent(data, data.task.id);
    const suppressDraftFinalAnswer = shouldSuppressStrategyDraftFinalAnswer(data);
    const nextJob = createStrategyJobFromTask(data.task, {
      conversationId: responseConversationId,
      result: data.result,
      billing: data.billing,
      events: data.events,
      previous: previousJob,
      request,
      visibleThinking: streamContent.visibleThinking,
      finalAnswerMarkdown: streamContent.finalAnswerMarkdown,
      suppressDraftFinalAnswer
    });
    const shouldUpdateVisibleConversation = isSameConversationKey(activeConversationKeyRef.current, options.sourceConversationKey, responseConversationId);

    setJobsById((current) => {
      const next = { ...current };
      const existing = current[data.task.id] ?? (options.localJobId ? current[options.localJobId] : undefined);

      if (options.localJobId && options.localJobId !== data.task.id) {
        delete next[options.localJobId];
      }

      next[data.task.id] = {
        ...existing,
        ...nextJob,
        visibleThinking: preserveStreamBuffer(nextJob.visibleThinking, existing?.visibleThinking),
        finalAnswerMarkdown: suppressDraftFinalAnswer ? "" : preserveStreamBuffer(nextJob.finalAnswerMarkdown, existing?.finalAnswerMarkdown),
        startedAt: nextJob.startedAt,
        clientRequestId: nextJob.clientRequestId ?? existing?.clientRequestId ?? request?.clientRequestId,
        request: request ?? existing?.request
      };

      return next;
    });

    setActiveJobByConversationId((current) => {
      const next = { ...current };

      if (nextJob.status === "completed" && data.messages?.some((message) => message.taskId === data.task.id && message.role === "assistant")) {
        delete next[responseConversationId];
        delete next[options.sourceConversationKey];
      } else {
        next[responseConversationId] = data.task.id;

        if (options.localJobId && options.localJobId !== data.task.id && next[options.sourceConversationKey] === options.localJobId) {
          next[options.sourceConversationKey] = data.task.id;
        }
      }

      return next;
    });

    if (data.conversation && shouldUpdateVisibleConversation) {
      setConversation(data.conversation);

      if (data.conversation.id !== conversationIdFromUrl) {
        router.replace(`/chat?mode=strategy&conversationId=${encodeURIComponent(data.conversation.id)}`, {
          scroll: false
        });
      }
    }

    if (data.conversation?.targetPlatform && chatPlatformOptions.includes(data.conversation.targetPlatform) && shouldUpdateVisibleConversation) {
      setTargetPlatform(data.conversation.targetPlatform);
    }

    if (shouldUpdateVisibleConversation && data.messages?.length) {
      const serverMessages = data.messages
        .map(toStrategyMessage)
        .map((message) => withStrategyMessageBilling(message, data));
      setMessages(serverMessages);
      return;
    }

    const result = data.result;

    if (shouldUpdateVisibleConversation && result) {
      setMessages((current) => [
        ...current,
        toStrategyMessage({
            id: `assistant-${data.task.id}`,
            conversationId: data.task.conversationId ?? responseConversationId,
            role: "assistant",
            taskId: data.task.id,
            content: result.explanation || "已完成策略处理。",
            contentJson: {
              task: data.task,
              result,
              billing: data.billing
            },
            createdAt: data.task.finishedAt ?? new Date().toISOString()
          })
      ]);
    }
  }

  function appendStrategyJobStreamDelta(jobId: string, channel: "thinking" | "final", delta: string) {
    setJobsById((current) => {
      const job = current[jobId];

      if (!job) {
        return current;
      }

      return {
        ...current,
        [jobId]: {
          ...job,
          status: channel === "final" ? "streaming" : job.status === "pending" || job.status === "queued" ? "running" : job.status,
          visibleThinking: channel === "thinking" ? `${job.visibleThinking ?? ""}${delta}` : job.visibleThinking,
          finalAnswerMarkdown: channel === "final" ? `${job.finalAnswerMarkdown ?? ""}${delta}` : job.finalAnswerMarkdown
        }
      };
    });
  }

  function startPollingJob(jobId: string, sourceConversationKey: string) {
    if (pollingJobsRef.current.has(jobId)) {
      return;
    }

    const controller = new AbortController();
    let afterSeq = getLatestRunEventSeq(jobsById[jobId]?.events ?? jobsById[jobId]?.task?.events ?? []);
    const pollStartedAt = getClientPerfNow();
    let pollCount = 0;
    pollingJobsRef.current.set(jobId, controller);
    logWorkbenchPerf("status.poll.start", {
      taskId: jobId,
      source: "strategy"
    });

    void (async () => {
      const startedAt = Date.now();

      try {
        while (Date.now() - startedAt < AI_TASK_POLL_TIMEOUT_MS) {
          await delay(AI_TASK_POLL_INTERVAL_MS, controller.signal);
          const next = await fetchAiTaskStatus(jobId, {
            afterSeq,
            signal: controller.signal
          });

          if (controller.signal.aborted || pollingJobsRef.current.get(jobId) !== controller) {
            return;
          }

          pollCount += 1;
          afterSeq = Math.max(afterSeq, next.latestEventSeq ?? 0, getLatestRunEventSeq(next.events ?? next.task.events ?? []));
          applyConversationPayload(next, {
            sourceConversationKey
          });

          if (next.task.status === "SUCCEEDED") {
            window.dispatchEvent(new Event("lightquant:credits-updated"));
            window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
            return;
          }

          if (next.task.status === "FAILED" || next.task.status === "CANCELLED") {
            window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
            return;
          }
        }

        setJobsById((current) => {
          const job = current[jobId];

          if (!job || isJobTerminal(job)) {
            return current;
          }

          return {
            ...current,
            [jobId]: {
              ...job,
              status: "failed",
              error: "任务仍在服务端处理或状态暂时不可达，请稍后查看历史记录，或确认无结果后重试。",
              finishedAt: new Date().toISOString()
            }
          };
        });
      } catch (pollError) {
        if (isAbortError(pollError) || controller.signal.aborted || pollingJobsRef.current.get(jobId) !== controller) {
          return;
        }

        setJobsById((current) => {
          const job = current[jobId];

          if (!job || isJobTerminal(job)) {
            return current;
          }

          return {
            ...current,
            [jobId]: {
              ...job,
              status: "failed",
              error: "任务连接中断，未确认完成。请稍后查看历史记录，或点击重试。",
              finishedAt: new Date().toISOString()
            }
          };
        });
      } finally {
        logWorkbenchPerf("status.poll.stop", {
          taskId: jobId,
          source: "strategy",
          polls: pollCount,
          aborted: controller.signal.aborted,
          durationMs: Math.round(getClientPerfNow() - pollStartedAt)
        });

        if (pollingJobsRef.current.get(jobId) === controller) {
          pollingJobsRef.current.delete(jobId);
        }
      }
    })();
  }

  async function handleCancelJob(job: StrategyJob) {
    if (!isJobActive(job) || cancelingStrategyJobId === job.id) {
      return;
    }

    setCancelingStrategyJobId(job.id);
    streamAbortControllersRef.current.get(job.id)?.abort();
    pollingJobsRef.current.get(job.id)?.abort();
    pollingJobsRef.current.delete(job.id);

    if (!job.task) {
      canceledLocalJobIdsRef.current.add(job.id);
      setJobsById((current) => ({
        ...current,
        [job.id]: {
          ...job,
          status: "canceled",
          error: "任务已取消",
          finishedAt: new Date().toISOString()
        }
      }));
      setCancelingStrategyJobId(null);
      return;
    }

    try {
      const data = await cancelAiTask(job.id);
      applyConversationPayload(data, {
        sourceConversationKey: job.conversationId
      });
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
    } catch (cancelError) {
      setError(getFriendlyError(cancelError));
    } finally {
      setCancelingStrategyJobId(null);
    }
  }

  async function handleRetryJob(job: StrategyJob) {
    if (isJobActive(job)) {
      return;
    }

    const clientRequestId = createWorkbenchClientRequestId("strategy-retry");
    const submitStartedAt = new Date().toISOString();
    rememberClientRequestStartedAt(clientRequestId, submitStartedAt, { overwrite: true });
    const sourceConversationKey = job.conversationId || currentConversationKey;
    const retryRequest: StrategyJobRequest = {
      ...(job.request ?? {
      conversationKey: sourceConversationKey,
      prompt: job.task?.promptPreview ?? "重试策略生成任务",
      messageContent: job.task?.promptPreview ?? "重试策略生成任务",
      targetPlatform: job.task?.targetPlatform ?? targetPlatform,
      inputFileId: job.task?.inputFileId ?? undefined
      }),
      conversationKey: sourceConversationKey,
      clientRequestId,
      submitStartedAt
    };
    const localJob = createLocalStrategyJob({
      id: clientRequestId,
      conversationId: sourceConversationKey,
      request: retryRequest,
      createdAt: submitStartedAt,
      startedAt: submitStartedAt
    });

    setError("");
    setJobsById((current) => ({
      ...current,
      [localJob.id]: localJob
    }));
    setActiveJobByConversationId((current) => ({
      ...current,
      [sourceConversationKey]: localJob.id
    }));
    forceStrategyThreadToBottom();

    const streamController = new AbortController();
    let streamJobId = localJob.id;
    streamAbortControllersRef.current.set(streamJobId, streamController);

    try {
      const completed = await streamWorkbenchAiTask({
        type: "strategy_generation",
        conversationId: sourceConversationKey === DRAFT_CONVERSATION_KEY ? undefined : sourceConversationKey,
        messageContent: retryRequest.messageContent,
        targetPlatform: retryRequest.targetPlatform,
        prompt: retryRequest.prompt,
        inputFileId: retryRequest.inputFileId,
        clientRequestId
      }, {
        signal: streamController.signal,
        onTask: (data) => {
          if (streamJobId !== data.task.id) {
            const controller = streamAbortControllersRef.current.get(streamJobId);
            streamAbortControllersRef.current.delete(streamJobId);
            if (controller) {
              streamAbortControllersRef.current.set(data.task.id, controller);
            }
            streamJobId = data.task.id;
          }

          applyConversationPayload(data, {
            localJobId: localJob.id,
            sourceConversationKey,
            request: retryRequest
          });
          window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
        },
        onThinkingDelta: (delta) => {
          appendStrategyJobStreamDelta(streamJobId, "thinking", delta);
        },
        onFinalDelta: (delta) => {
          appendStrategyJobStreamDelta(streamJobId, "final", delta);
        },
        onDone: (data) => {
          applyConversationPayload(data, {
            localJobId: localJob.id,
            sourceConversationKey,
            request: retryRequest
          });
        }
      });

      applyConversationPayload(completed, {
        localJobId: localJob.id,
        sourceConversationKey,
        request: retryRequest
      });
      window.dispatchEvent(new Event("lightquant:credits-updated"));
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
    } catch (retryError) {
      if (streamController.signal.aborted) {
        return;
      }

      canceledLocalJobIdsRef.current.delete(localJob.id);
      const friendly = getFriendlyError(retryError);
      setError(friendly);
      setJobsById((current) => ({
        ...current,
        [streamJobId]: {
          ...(current[streamJobId] ?? current[localJob.id] ?? localJob),
          status: "failed",
          error: friendly,
          finalAnswerMarkdown: "",
          finishedAt: new Date().toISOString()
        }
      }));
    } finally {
      canceledLocalJobIdsRef.current.delete(localJob.id);
      streamAbortControllersRef.current.delete(streamJobId);
      streamAbortControllersRef.current.delete(localJob.id);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (compositionRef.current || event.nativeEvent.isComposing) {
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSubmit();
  }

  const hasInlineError = messages.some((message) => message.localStatus === "error" || Boolean(getMessageError(message)) || isFailedStrategyMessage(message));
  const shouldShowActiveJobPanel = Boolean(activeJob && shouldRenderStrategyJobPanel(activeJob, messages));
  const hasActiveJobFailurePanel = Boolean(shouldShowActiveJobPanel && activeJob && (activeJob.status === "failed" || activeJob.status === "canceled"));

  return (
    <WorkbenchShell className="lq-strategy-page">
      <section className="lq-platform-strip is-subtle">
        <div className="lq-platform-inner">
          <span className="lq-platform-label">目标平台：</span>
          {chatPlatformOptions.map((platform) => (
            <button
              className={`lq-pill ${platform === targetPlatform ? "is-active" : ""}`}
              key={platform}
              onClick={() => setTargetPlatform(platform)}
              type="button"
            >
              {platform}
            </button>
          ))}
        </div>
      </section>

      <section className="lq-workspace">
        <SignalRibbon />

        <div className="lq-strategy-thread" onScroll={handleStrategyThreadScroll} ref={strategyThreadRef}>
          <div className="lq-message-stack">
            {!conversation && messages.length === 0 ? (
              <ChatBubble role="assistant" text={historyLoading ? "正在载入会话..." : "请输入策略需求，我会保留上下文，后续可继续追问或修改上一轮策略。"} />
            ) : null}
            {messages.map((message) => (
              <StrategyMessageBubble key={message.id} message={message} />
            ))}
            {activeJob && shouldShowActiveJobPanel ? (
              <StrategyJobBubble
                elapsedSeconds={elapsedSeconds}
                job={activeJob}
                onRetry={() => void handleRetryJob(activeJob)}
              />
            ) : null}
            {error && !hasInlineError && !hasActiveJobFailurePanel ? (
              <div className="lq-assistant-row">
                <ErrorPanel message={error} />
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="lq-composer-wrap">
          <div className="lq-composer">
            <textarea
              className="lq-composer-textarea"
              onCompositionEnd={() => {
                compositionRef.current = false;
              }}
              onCompositionStart={() => {
                compositionRef.current = true;
              }}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="输入策略需求，或粘贴代码片段..."
              value={prompt}
            />
            <div className="lq-composer-bottom">
              <button className="lq-upload-chip" disabled={uploading} onClick={() => fileInputRef.current?.click()} type="button">
                <Paperclip aria-hidden="true" size={18} />
                {getUploadButtonLabel("strategy_generation")}
              </button>
              <input accept={getUploadAccept("strategy_generation")} className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
              <div className="lq-composer-actions">
                {activeJobRunning && activeJob ? (
                  <button
                    aria-label="停止当前任务"
                    className="lq-stop-task-btn"
                    disabled={strategyCanceling}
                    onClick={() => void handleCancelJob(activeJob)}
                    type="button"
                  >
                    {strategyCanceling ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <Square aria-hidden="true" size={15} />}
                    停止
                  </button>
                ) : (
                  <button
                    className="lq-primary-btn"
                    disabled={strategySendDisabled}
                    onClick={() => void handleSubmit()}
                    type="button"
                  >
                    <Send aria-hidden="true" size={18} />
                    发送
                  </button>
                )}
              </div>
            </div>
            <WorkbenchFileUploadStatus file={uploadedFile} message={uploadError} />
          </div>
        </div>
      </section>
    </WorkbenchShell>
  );
}

function ConvertModeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sourcePlatform, setSourcePlatform] = useState(convertPlatforms.source[0]);
  const [targetPlatform, setTargetPlatform] = useState(convertPlatforms.target[0]);
  const [inputCode, setInputCode] = useState("");
  const [prompt, setPrompt] = useState("");
  const [taskData, setTaskData] = useState<AiTaskData | null>(null);
  const [streamState, setStreamState] = useState<ThinkingMessageState>(() => createEmptyThinkingState());
  const [activeTab, setActiveTab] = useState<(typeof conversionTabs)[number]>(conversionTabs[0]);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedCodeFile | null>(null);
  const [inputSource, setInputSource] = useState<"manual" | "attachment" | "restored">("manual");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [lastSuccessfulFingerprint, setLastSuccessfulFingerprint] = useState<string | null>(null);
  const [pendingConversionClientRequestId, setPendingConversionClientRequestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversionPreviewRef = useRef<HTMLDivElement>(null);
  const conversionAutoFollowRef = useRef(true);
  const conversionTabChangedRef = useRef(false);
  const conversionMountedRef = useRef(false);
  const cancelRequestedRef = useRef(false);
  const pollingConversionTaskIdRef = useRef<string | null>(null);
  const streamingConversionTaskIdRef = useRef<string | null>(null);
  const conversationIdFromUrl = searchParams.get("conversationId");
  const activeConversionTaskStatus = taskData?.task.status ?? null;
  const activeConversionTaskRunning = activeConversionTaskStatus === "PENDING" || activeConversionTaskStatus === "RUNNING";
  const conversionLoading = loading || activeConversionTaskRunning;
  const elapsedSeconds = useStableElapsedSeconds(conversionLoading, {
    task: taskData?.task ?? null,
    taskId: taskData?.task.id ?? null,
    clientRequestId: taskData?.task.clientRequestId ?? pendingConversionClientRequestId,
    localCreatedAt: taskData?.task.createdAt ?? null,
    finishedAt: taskData?.task.finishedAt ?? null
  });

  const activeConversionConversationId = taskData?.conversation?.id ?? taskData?.task.conversationId ?? conversationIdFromUrl;
  const finalInputText = getFinalConversionInputText(inputCode);
  const finalPrompt = prompt.trim();
  const finalTotalInputChars = getConversionTotalInputChars(finalInputText, finalPrompt, sourcePlatform, targetPlatform);
  const conversionCurrentFingerprint = useMemo(() => buildAiTaskFingerprint({
    type: "code_conversion",
    sourcePlatform,
    targetPlatform,
    prompt: finalPrompt,
    inputCode: finalInputText,
    inputFile: uploadedFile
  }), [sourcePlatform, targetPlatform, finalPrompt, finalInputText, uploadedFile]);
  const conversionDuplicateCompleted = Boolean(finalInputText) && lastSuccessfulFingerprint === conversionCurrentFingerprint;

  useWorkbenchConversationRestore({
    conversationId: conversationIdFromUrl,
    expectedMode: "convert",
    taskType: "code_conversion",
    messages: {
      limit: 20,
      taskLimit: 1,
      includeTaskResults: "latest"
    },
    onSummary: (summary) => {
      setError("");

      if (summary.sourcePlatform && convertPlatforms.source.includes(summary.sourcePlatform)) {
        setSourcePlatform(summary.sourcePlatform);
      }

      if (summary.targetPlatform && convertPlatforms.target.includes(summary.targetPlatform)) {
        setTargetPlatform(summary.targetPlatform);
      }

      setActiveTab(getConversationActiveTab(summary, conversionTabs, conversionTabs[0]));
    },
    onRestore: (conversationData, restored) => {
      if (restored.sourcePlatform && convertPlatforms.source.includes(restored.sourcePlatform)) {
        setSourcePlatform(restored.sourcePlatform);
      }

      if (restored.targetPlatform && convertPlatforms.target.includes(restored.targetPlatform)) {
        setTargetPlatform(restored.targetPlatform);
      }

      const restoredPrompt = restored.prompt ?? "";
      const restoredInputCode = formatRestoredInputText(restored.inputCodePreview, restored.inputFileName);
      const restoredFile = createRestoredUploadedFile(restored);
      const restoredSourcePlatform = restored.sourcePlatform && convertPlatforms.source.includes(restored.sourcePlatform)
        ? restored.sourcePlatform
        : sourcePlatform;
      const restoredTargetPlatform = restored.targetPlatform && convertPlatforms.target.includes(restored.targetPlatform)
        ? restored.targetPlatform
        : targetPlatform;
      const restoredFingerprint = buildAiTaskFingerprint({
        type: "code_conversion",
        sourcePlatform: restoredSourcePlatform,
        targetPlatform: restoredTargetPlatform,
        prompt: restoredPrompt,
        inputCode: getFinalConversionInputText(restoredInputCode),
        inputFile: restoredFile
      });

      setPrompt(restoredPrompt);
      setInputCode(restoredInputCode);
      setInputSource("restored");
      setUploadedFile(restoredFile);
      setTaskData(restored.taskData);
      setStreamState(createThinkingStateFromTaskData(restored.taskData, "code_conversion"));
      setActiveTab(getConversationActiveTab(conversationData.conversation, conversionTabs, conversionTabs[0]));
      setLoading(false);
      setCanceling(false);
      cancelRequestedRef.current = false;
      pollingConversionTaskIdRef.current = null;
      streamingConversionTaskIdRef.current = null;
      setPendingConversionClientRequestId(null);

      if (isAiTaskDataCompleteSuccess(restored.taskData)) {
        setLastSuccessfulFingerprint(restoredFingerprint);
      } else if (isAiTaskDataPartial(restored.taskData)) {
        setLastSuccessfulFingerprint(null);
      } else {
        setLastSuccessfulFingerprint(null);
      }
    },
    onError: (historyError) => {
      setError(getFriendlyError(historyError));
    }
  });

  useEffect(() => {
    persistConversationActiveTab(activeConversionConversationId, activeTab, "convert");
  }, [activeConversionConversationId, activeTab]);

  useEffect(() => {
    if (conversationIdFromUrl) {
      return;
    }

    resetConversionLocalState();
  }, [conversationIdFromUrl]);

  useEffect(() => {
    const currentTaskData = taskData;
    const currentTask = currentTaskData?.task;
    const currentTaskConversationId = currentTaskData?.conversation?.id ?? currentTask?.conversationId ?? null;

    if (!currentTask || (currentTask.status !== "PENDING" && currentTask.status !== "RUNNING") || cancelRequestedRef.current) {
      return;
    }

    if (conversationIdFromUrl && currentTaskConversationId && currentTaskConversationId !== conversationIdFromUrl) {
      return;
    }

    if (streamingConversionTaskIdRef.current === currentTask.id) {
      return;
    }

    if (pollingConversionTaskIdRef.current === currentTask.id) {
      return;
    }

    let disposed = false;
    const pollController = new AbortController();
    pollingConversionTaskIdRef.current = currentTask.id;
    setLoading(true);

    void (async () => {
      try {
        const completed = await waitForAiTaskResult(currentTaskData, (nextData) => {
          if (disposed || cancelRequestedRef.current) {
            return;
          }

          setTaskData(nextData);
          setStreamState(createThinkingStateFromTaskData(nextData, "code_conversion"));
        }, {
          signal: pollController.signal
        });

        if (disposed || cancelRequestedRef.current) {
          return;
        }

        setTaskData(completed);
        setStreamState(createThinkingStateFromTaskData(completed, "code_conversion"));
        replaceWorkbenchConversationUrl(router, { type: "chat", mode: "convert" }, conversationIdFromUrl, completed.conversation?.id ?? completed.task.conversationId ?? null);
        window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));

        if (completed.result || completed.task.status === "SUCCEEDED") {
          window.dispatchEvent(new Event("lightquant:credits-updated"));
        }
      } catch (pollError) {
        window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));

        if (!disposed && !cancelRequestedRef.current && !isAbortError(pollError)) {
          setError(getFriendlyError(pollError));
        }
      } finally {
        if (pollingConversionTaskIdRef.current === currentTask.id) {
          pollingConversionTaskIdRef.current = null;
        }

        if (!disposed) {
          setLoading(false);
          setCanceling(false);
        }
      }
    })();

    return () => {
      disposed = true;
      pollController.abort();

      if (pollingConversionTaskIdRef.current === currentTask.id) {
        pollingConversionTaskIdRef.current = null;
      }
    };
  }, [conversationIdFromUrl, taskData?.task.id, taskData?.task.status]);

  function resetConversionLocalState() {
    setInputCode("");
    setInputSource("manual");
    setPrompt("");
    setTaskData(null);
    setStreamState(createEmptyThinkingState());
    setError("");
    setUploadedFile(null);
    setUploadError("");
    setLoading(false);
    setCanceling(false);
    setPendingConversionClientRequestId(null);
    pollingConversionTaskIdRef.current = null;
    streamingConversionTaskIdRef.current = null;
    conversionAutoFollowRef.current = true;
    conversionTabChangedRef.current = false;
    cancelRequestedRef.current = false;
    setActiveTab(conversionTabs[0]);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const nextFile = await uploadCodeFile(file, "code_conversion");
      const nextInputText = nextFile.contentText ?? "";
      setUploadedFile(nextFile);
      setInputCode(nextInputText);
      setInputSource("attachment");

      if (!nextInputText && !nextFile.mimeType.startsWith("image/")) {
        setUploadError("附件已上传，但没有解析出可转换文本，请重新上传文本文件。");
      }
    } catch (uploadErrorValue) {
      setUploadedFile(null);
      setInputCode("");
      setInputSource("manual");
      setUploadError(getFileUploadFriendlyError(uploadErrorValue));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    const submittedFingerprint = conversionCurrentFingerprint;

    if (conversionLoading || uploading) {
      return;
    }

    if (!submittedFingerprint) {
      return;
    }

    if (conversionDuplicateCompleted) {
      return;
    }

    if (!finalInputText) {
      return;
    }

    if (uploadedFile?.scanStatus === "BLOCKED") {
      return;
    }

    if (finalTotalInputChars > CODE_CONVERSION_MAX_TOTAL_INPUT_CHARS) {
      setError(getConversionInputTooLargeMessage(finalTotalInputChars, inputSource === "attachment" && Boolean(uploadedFile)));
      return;
    }

    const clientRequestId = createWorkbenchClientRequestId("convert");
    const submitStartedAt = new Date().toISOString();
    rememberClientRequestStartedAt(clientRequestId, submitStartedAt, { overwrite: true });
    setPendingConversionClientRequestId(clientRequestId);

    const currentConversationId = taskData?.conversation?.id ?? conversationIdFromUrl ?? undefined;
    setLoading(true);
    setCanceling(false);
    conversionAutoFollowRef.current = true;
    conversionTabChangedRef.current = false;
    cancelRequestedRef.current = false;
    setError("");
    setTaskData(null);
    setStreamState({
      status: "thinking",
      visibleThinking: "",
      finalAnswerMarkdown: ""
    });

    try {
      const completed = await streamWorkbenchAiTask({
        type: "code_conversion",
        conversationId: currentConversationId,
        sourcePlatform,
        targetPlatform,
        inputCode: finalInputText,
        prompt: finalPrompt,
        inputFileId: uploadedFile?.fileId,
        clientRequestId
      }, {
        onTask: (data) => {
          streamingConversionTaskIdRef.current = data.task.id;
          setTaskData(data);
          setStreamState((current) => ({
            ...current,
            status: current.finalAnswerMarkdown ? "answering" : "thinking",
            taskId: data.task.id
          }));
          replaceWorkbenchConversationUrl(router, { type: "chat", mode: "convert" }, conversationIdFromUrl, data.conversation?.id ?? data.task.conversationId ?? null);
          window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
        },
        onThinkingDelta: () => {
          setStreamState((current) => ({
            ...current,
            status: current.finalAnswerMarkdown ? "answering" : "thinking"
          }));
        },
        onFinalDelta: (delta) => {
          setStreamState((current) => ({
            ...current,
            status: "answering",
            finalAnswerMarkdown: `${current.finalAnswerMarkdown}${delta}`
          }));
        },
        onDone: (data) => {
          setTaskData(data);
          setStreamState((current) => createThinkingStateFromTaskData(data, "code_conversion", current));
        }
      });

      setTaskData(completed);
      setStreamState((current) => createThinkingStateFromTaskData(completed, "code_conversion", current));
      setActiveTab(conversionTabs[0]);
      replaceWorkbenchConversationUrl(router, { type: "chat", mode: "convert" }, conversationIdFromUrl, completed.conversation?.id ?? completed.task.conversationId ?? null);
      rememberTaskFingerprintOutcome(completed, submittedFingerprint, {
        setLastSuccessfulFingerprint
      });
      window.dispatchEvent(new Event("lightquant:credits-updated"));
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
    } catch (submitError) {
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      if (!cancelRequestedRef.current) {
        const friendly = getFriendlyError(submitError);
        setError(friendly);
        setStreamState((current) => ({
          ...current,
          status: "failed",
          error: friendly,
          finalAnswerMarkdown: ""
        }));
      }
    } finally {
      setLoading(false);
      setCanceling(false);
      setPendingConversionClientRequestId(null);
      streamingConversionTaskIdRef.current = null;
    }
  }

  async function handleCancelConversionTask() {
    const taskId = taskData?.task.id;

    if (!taskId || canceling) {
      return;
    }

    cancelRequestedRef.current = true;
    setCanceling(true);
    setError("");

    try {
      const data = await cancelAiTask(taskId);
      setTaskData(data);
      setStreamState((current) => ({
        ...current,
        status: "failed",
        error: "任务已取消"
      }));
      setLoading(false);
      setPendingConversionClientRequestId(null);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
    } catch (cancelError) {
      cancelRequestedRef.current = false;
      setError(getFriendlyError(cancelError));
    } finally {
      setCanceling(false);
    }
  }

  function handleConversionPreviewScroll() {
    const preview = conversionPreviewRef.current;

    if (!preview) {
      return;
    }

    const distanceToBottom = preview.scrollHeight - preview.scrollTop - preview.clientHeight;
    conversionAutoFollowRef.current = distanceToBottom < 80;
  }

  const result = taskData?.result;
  const conversionTaskStatus = taskData?.task.status ?? null;
  const streamErrorIsTerminal = Boolean(streamState.error && !conversionLoading && conversionTaskStatus !== "SUCCEEDED");
  const conversionFailureInfo = getConversionFailureInfo(taskData, streamErrorIsTerminal ? streamState.error : null);
  const canExposeConversionResult = !conversionFailureInfo.failed && (!conversionTaskStatus ||
    conversionTaskStatus === "PENDING" ||
    conversionTaskStatus === "RUNNING" ||
    conversionTaskStatus === "SUCCEEDED");
  const resultForDisplay = canExposeConversionResult ? result : undefined;
  const streamConversionResult = canExposeConversionResult
    ? parseCodeConversionMarkdown(streamState.finalAnswerMarkdown)
    : { targetCode: "", migrationNotes: "" };
  const restoredConversionMarkdown = !streamState.finalAnswerMarkdown && resultForDisplay ? formatAiTaskResultAsMarkdown(resultForDisplay, "code_conversion") : "";
  const restoredConversionResult = parseCodeConversionMarkdown(restoredConversionMarkdown);
  const targetCode = streamConversionResult.targetCode || restoredConversionResult.targetCode || getCodeConversionTabContent("目标平台代码", resultForDisplay);
  const migrationNotes = streamConversionResult.migrationNotes || restoredConversionResult.migrationNotes || getCodeConversionTabContent("迁移说明", resultForDisplay);
  const conversionPanelContent = isCodeConversionCodeTab(activeTab) ? targetCode : migrationNotes;
  const conversionCopyContent = getConversionCopyContent(activeTab, targetCode, migrationNotes, conversionFailureInfo.failed);
  const canCopyConversionContent = canCopyConversionTab(activeTab, targetCode, migrationNotes, conversionFailureInfo.failed);
  const inputTooLargeMessage = finalTotalInputChars > CODE_CONVERSION_MAX_TOTAL_INPUT_CHARS
    ? getConversionInputTooLargeMessage(finalTotalInputChars, inputSource === "attachment" && Boolean(uploadedFile))
    : "";
  const shownError = error || inputTooLargeMessage;
  const taskStatus = conversionTaskStatus ?? (conversionLoading ? "RUNNING" : null);
  const canCancelTask = Boolean(taskData?.task.id && (taskStatus === "PENDING" || taskStatus === "RUNNING"));
  const conversionSubmitDisabled = conversionLoading ||
    uploading ||
    Boolean(inputTooLargeMessage) ||
    !finalInputText ||
    uploadedFile?.scanStatus === "BLOCKED" ||
    conversionDuplicateCompleted;

  useEffect(() => {
    conversionTabChangedRef.current = conversionMountedRef.current;
    conversionMountedRef.current = true;
    conversionAutoFollowRef.current = true;

    const preview = conversionPreviewRef.current;

    if (!preview) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      preview.scrollTop = 0;
      preview.scrollLeft = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  useEffect(() => {
    const preview = conversionPreviewRef.current;

    if (!preview || !conversionPanelContent.trim()) {
      conversionTabChangedRef.current = false;
      return;
    }

    if (conversionTabChangedRef.current) {
      conversionTabChangedRef.current = false;
      return;
    }

    if (!conversionLoading) {
      return;
    }

    if (!conversionAutoFollowRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      preview.scrollTop = preview.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [conversionLoading, conversionPanelContent]);

  return (
    <WorkbenchShell className="min-h-full">
      <section className="lq-title-block">
        <h1>平台代码转换</h1>
        <p>将不同量化平台的策略代码转换为目标平台可读、可改、可验证的版本</p>
      </section>

      <section className="lq-workbench is-compact is-conversion">
        <div className="lq-platform-select-row">
          <div className="lq-platform-select-group">
            <PlatformSelectCard label="源平台" onChange={setSourcePlatform} options={convertPlatforms.source} value={sourcePlatform} />
            <button aria-label="转换方向" className="lq-platform-swap" type="button">
              <ArrowRight aria-hidden="true" size={17} />
            </button>
            <PlatformSelectCard isTarget label="目标平台" onChange={setTargetPlatform} options={convertPlatforms.target} value={targetPlatform} />
          </div>
        </div>

        <div className="lq-workspace-grid">
          <div className="lq-column">
            <div className="lq-editor-card">
              <div className="lq-card-head">
                <div className="lq-head-title">
                  <Code2 aria-hidden="true" />
                  <span>源代码输入</span>
                </div>
                <button className="lq-upload-chip" disabled={uploading} onClick={() => fileInputRef.current?.click()} type="button">
                  <FileUp aria-hidden="true" size={16} />
                  {getUploadButtonLabel("code_conversion")}
                </button>
                <input accept={getUploadAccept("code_conversion")} className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
              </div>
              <WorkbenchFileUploadStatus file={uploadedFile} message={uploadError} />
              <textarea
                className="lq-textarea lq-code-input"
                onChange={(event) => {
                  setInputCode(event.target.value);
                  setInputSource("manual");
                }}
                placeholder="请粘贴需要转换的策略代码..."
                value={inputCode}
              />
            </div>

            <div className="lq-requirement-card">
              <label className="lq-requirement-label" htmlFor="conversion-requirement">
                <MessageCircle aria-hidden="true" />
                <span>转换要求（可选）</span>
              </label>
              <textarea
                className="lq-textarea"
                id="conversion-requirement"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例如：保留原策略的止损逻辑，优先使用目标平台的内置数据获取函数..."
                value={prompt}
              />
            </div>
          </div>

          <div className="lq-column">
            <div className="lq-result-panel">
              <div className="lq-result-tabs-row">
                <div className="lq-tabs">
                  {conversionTabs.map((tab) => (
                    <button className={`lq-tab ${tab === activeTab ? "is-active" : ""}`} key={tab} onClick={() => setActiveTab(tab)} type="button">
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="lq-result-copy-slot">
                  <CopyCodeButton className="lq-result-copy-btn" code={conversionCopyContent} disabled={!canCopyConversionContent} failedLabel="复制失败，请手动选择内容" key={activeTab} />
                </div>
              </div>
              <div
                className="lq-conversion-note-card"
                title="代码转换后，实际运行效果可能因平台差异而有所不同。如遇问题，可使用策略生成功能进一步优化。"
              >
                <Info aria-hidden="true" className="lq-conversion-note-dot" size={16} strokeWidth={2} />
                <span className="lq-conversion-note-copy">代码转换后，实际运行效果可能因平台差异而有所不同。如遇问题，可使用策略生成功能进一步优化。</span>
              </div>
              <div
                className={`lq-code-preview app-scrollbar ${conversionFailureInfo.failed ? "is-failure" : isCodeConversionCodeTab(activeTab) ? "is-code-tab" : "is-text-tab"}`}
                onScroll={handleConversionPreviewScroll}
                ref={conversionPreviewRef}
              >
                {conversionFailureInfo.failed ? (
                  <ConversionFailureState
                    message={conversionFailureInfo.message}
                    refundApplied={conversionFailureInfo.refundApplied}
                    title={conversionFailureInfo.title}
                  />
                ) : isCodeConversionCodeTab(activeTab) ? (
                  <ConversionCodePreview code={targetCode} loading={conversionLoading} />
                ) : (
                  <ConversionNotesPreview loading={conversionLoading} notes={migrationNotes} />
                )}
              </div>
            </div>
            {shownError ? <ErrorPanel message={shownError} /> : null}
          </div>
        </div>

        <div className="lq-actions">
          <div className="lq-actions-left">
            <button
              className="lq-primary-btn"
              disabled={conversionSubmitDisabled}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {conversionLoading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
              {conversionLoading
                ? `转换中 ${elapsedSeconds}s`
                : conversionDuplicateCompleted
                    ? "已完成转换"
                    : "开始转换"}
            </button>
            <button
              className="lq-secondary-btn"
              onClick={resetConversionLocalState}
              type="button"
            >
              <Trash2 aria-hidden="true" size={17} />
              清空内容
            </button>
          </div>
        </div>
      </section>
    </WorkbenchShell>
  );
}

function SignalRibbon() {
  return (
    <svg className="lq-signal-ribbon" fill="none" viewBox="0 0 820 220">
      <path d="M26 168C120 132 185 148 268 168C354 189 438 180 514 122C598 58 682 54 790 84" stroke="rgba(11,99,255,0.18)" strokeWidth="1.5" />
      <path d="M34 184C152 116 227 220 345 151C445 92 509 112 604 68C684 31 733 44 796 34" stroke="rgba(23,195,178,0.2)" strokeWidth="1.5" />
      <path d="M72 74H176M112 34V114M594 144h96M642 104v84" stroke="rgba(11,99,255,0.08)" strokeWidth="1" />
      <circle cx="268" cy="168" fill="rgba(11,99,255,0.2)" r="4" />
      <circle cx="514" cy="122" fill="rgba(23,195,178,0.24)" r="4" />
      <circle cx="684" cy="31" fill="rgba(11,99,255,0.18)" r="4" />
    </svg>
  );
}

function ChatBubble({ loading = false, role, text }: { loading?: boolean; role: "user" | "assistant"; text: string }) {
  if (role === "user") {
    return (
      <div className="lq-user-row">
        <div className="lq-user-message-shell">
          <div className="lq-user-bubble">
            <p>{text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lq-assistant-row">
      <div className="lq-chat-bubble">
        <span className="lq-ai-mark">
          {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Bot aria-hidden="true" />}
        </span>
        <p>{text}</p>
      </div>
    </div>
  );
}

function StrategyMessageBubble({ message }: { message: StrategyChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="lq-user-row">
        <div className="lq-user-message-shell">
          <div className="lq-user-bubble">
            <p>{message.content}</p>
          </div>
          <MessageAttachmentList attachments={getMessageAttachments(message)} align="right" />
        </div>
      </div>
    );
  }

  const result = getMessageResult(message);
  const task = getMessageTask(message);
  const error = getMessageError(message);
  const failedByTask = task?.status === "FAILED" || task?.status === "CANCELLED";
  const status = message.localStatus === "pending" ? "running" : message.localStatus === "error" || error || failedByTask ? "failed" : result ? "succeeded" : "idle";
  const streamContent = getMessageStreamingContent(message, result, "strategy_generation");
  const thinkingStatus: AssistantThinkingStatus = status === "failed" ? "failed" : status === "succeeded" ? "completed" : message.localStatus === "pending" ? "thinking" : "idle";
  const failureMessage = error?.message ?? task?.errorMessage ?? message.content;
  const finalAnswerMarkdown = normalizeStrategyFinalAnswerMarkdown({
    finalAnswerMarkdown: streamContent.finalAnswerMarkdown,
    result
  }) || streamContent.finalAnswerMarkdown;
  const displayFinalAnswerMarkdown = result?.generatedCode
    ? stripGeneratedCodeFromMarkdown(finalAnswerMarkdown, result.generatedCode)
    : finalAnswerMarkdown;
  const billingTag = status === "succeeded" ? getBillingTag(getMessageBilling(message), task) : null;
  const completedElapsedSeconds = status === "succeeded"
    ? getDisplayedTaskElapsedSeconds({
      task,
      finishedAt: message.createdAt,
      fallbackFinishedAt: message.createdAt
    })
    : null;

  return (
    <div className="lq-assistant-row">
      <div className={`lq-assistant-message ${status === "failed" ? "is-error" : ""}`}>
        {status === "failed" ? (
          <StrategyFailureMessage message={failureMessage} title={task?.status === "CANCELLED" ? "任务已取消" : "生成失败"} />
        ) : finalAnswerMarkdown || streamContent.visibleThinking || result ? (
          <>
          {completedElapsedSeconds !== null ? (
            <TaskMetaBar billingTag={billingTag} elapsedSeconds={completedElapsedSeconds} elapsedTone="completed" />
          ) : null}
          <AssistantThinkingMessage
            error={null}
            finalAnswerMarkdown={displayFinalAnswerMarkdown}
            status={thinkingStatus}
            thinking={streamContent.visibleThinking}
          />
          {result?.generatedCode ? <FullCodeResultPanel result={result} title="完整策略代码" /> : null}
          </>
        ) : null}
        {!result && status === "idle" ? (
          <div className="lq-chat-bubble is-plain">
            <span className="lq-ai-mark">
              <Bot aria-hidden="true" />
            </span>
            <p>{message.content}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StrategyJobBubble({
  elapsedSeconds,
  job,
  onRetry
}: {
  elapsedSeconds: number;
  job: StrategyJob;
  onRetry: () => void;
}) {
  const failed = job.status === "failed";
  const canceled = job.status === "canceled";
  const completed = job.status === "completed";
  const finalizingMessage = getStrategyFinalizingMessage(job);
  const rawFinalAnswerMarkdown = job.finalAnswerMarkdown || (job.result ? formatAiTaskResultAsMarkdown(job.result, "strategy_generation") : "");
  const finalAnswerMarkdown = job.status === "streaming"
    ? rawFinalAnswerMarkdown
    : normalizeStrategyFinalAnswerMarkdown({
      finalAnswerMarkdown: rawFinalAnswerMarkdown,
      result: job.result
    }) || rawFinalAnswerMarkdown;
  const displayFinalAnswerMarkdown = job.result?.generatedCode
    ? stripGeneratedCodeFromMarkdown(finalAnswerMarkdown, job.result.generatedCode)
    : finalizingMessage
      ? ""
      : finalAnswerMarkdown;
  const thinkingStatus: AssistantThinkingStatus = failed || canceled ? "failed" : completed ? "completed" : job.status === "streaming" || finalizingMessage ? "answering" : "thinking";
  const visibleThinking = job.visibleThinking?.trim() ?? "";
  const visibleError = failed || canceled ? job.error ?? null : null;
  const runningFallback = getDisplayJobActive(job) && !visibleThinking && !displayFinalAnswerMarkdown.trim() && !visibleError ? finalizingMessage ?? "正在处理任务..." : "";
  const billingTag = completed ? getBillingTag(job.billing, job.task) : null;
  const badgeTone = completed ? "completed" : getDisplayJobActive(job) ? "running" : null;
  const badgeElapsedSeconds = getStrategyJobElapsedSeconds(job, elapsedSeconds);

  if (failed || canceled) {
    return (
      <div className="lq-assistant-row">
        <StrategyFailureMessage
          message={visibleError ?? (canceled ? "任务已取消，未生成策略结果。" : "AI 任务执行失败，请稍后重试。")}
          onRetry={onRetry}
          title={canceled ? "任务已取消" : "生成失败"}
        />
      </div>
    );
  }

  if (!visibleThinking && !finalAnswerMarkdown.trim() && !visibleError && !runningFallback) {
    return null;
  }

  return (
    <div className="lq-assistant-row">
      <div className="lq-assistant-message">
        {badgeTone ? (
          <TaskMetaBar billingTag={billingTag} elapsedSeconds={badgeElapsedSeconds} elapsedTone={badgeTone} />
        ) : null}
        <AssistantThinkingMessage
          error={null}
          finalAnswerMarkdown={displayFinalAnswerMarkdown}
          status={thinkingStatus}
          thinking={visibleThinking || runningFallback}
        />
        {job.result?.generatedCode ? <FullCodeResultPanel result={job.result} title="完整策略代码" /> : null}
      </div>
    </div>
  );
}

function TaskMetaBar({
  billingTag,
  elapsedSeconds,
  elapsedTone
}: {
  billingTag?: { label: string; waived: boolean } | null;
  elapsedSeconds: number;
  elapsedTone: "running" | "completed";
}) {
  return (
    <div className="lq-task-meta-bar">
      <TaskElapsedBadge elapsedSeconds={elapsedSeconds} tone={elapsedTone} />
      {billingTag ? <TaskBillingBadge label={billingTag.label} waived={billingTag.waived} /> : null}
    </div>
  );
}

function TaskElapsedBadge({ elapsedSeconds, tone }: { elapsedSeconds: number; tone: "running" | "completed" }) {
  return (
    <div aria-live={tone === "running" ? "polite" : undefined} className={`lq-task-elapsed-badge is-${tone}`}>
      {tone === "running" ? "处理中" : "已处理"} {formatElapsedDuration(elapsedSeconds)}
    </div>
  );
}

function TaskBillingBadge({ label, waived }: { label: string; waived: boolean }) {
  return (
    <div className={`lq-task-billing-badge ${waived ? "is-waived" : ""}`.trim()}>
      {label}
    </div>
  );
}

function formatElapsedDuration(elapsedSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(elapsedSeconds));

  if (safeSeconds < 60) {
    return `${safeSeconds}s`;
  }

  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function getStrategyJobElapsedSeconds(job: StrategyJob, activeElapsedSeconds: number) {
  if (getDisplayJobActive(job)) {
    return activeElapsedSeconds;
  }

  return getDisplayedTaskElapsedSeconds({
    task: job.task ?? null,
    request: job.request,
    startedAt: job.startedAt,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
    fallbackFinishedAt: job.finishedAt,
    minElapsedSeconds: activeElapsedSeconds
  }) ?? activeElapsedSeconds;
}

function getDisplayedTaskElapsedSeconds(input: {
  task?: AiTaskData["task"] | null;
  request?: StrategyJobRequest | null;
  startedAt?: string | null;
  createdAt?: string | null;
  finishedAt?: string | null;
  fallbackFinishedAt?: string | null;
  minElapsedSeconds?: number | null;
}) {
  const task = input.task;
  const clientRequestId = input.request?.clientRequestId ?? task?.clientRequestId ?? null;
  const startedAt = pickFirstValidIso(
    input.request?.submitStartedAt,
    input.startedAt,
    getCachedClientRequestStartedAt(clientRequestId),
    getCachedTaskStartedAt(task?.id),
    input.createdAt,
    task?.createdAt,
    task?.progress?.startedAt,
    task?.startedAt
  );
  const finishedAt = pickFirstValidIso(
    task?.finishedAt,
    input.finishedAt,
    input.fallbackFinishedAt
  );

  if (!startedAt || !finishedAt) {
    return null;
  }

  const elapsedSeconds = getTaskElapsedSeconds({
    startedAt,
    finishedAt
  });

  return Math.max(elapsedSeconds, input.minElapsedSeconds ?? 0);
}

function pickFirstValidIso(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value !== "string" || !value.trim()) {
      continue;
    }

    const timestamp = Date.parse(value);

    if (Number.isFinite(timestamp)) {
      return value;
    }
  }

  return null;
}

function StrategyFailureMessage({ message, onRetry, title = "生成失败" }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="lq-strategy-failure-card" role="status">
      <span className="lq-strategy-failure-icon">
        <AlertTriangle aria-hidden="true" size={18} />
      </span>
      <div className="lq-strategy-failure-body">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button className="lq-job-action is-primary lq-strategy-failure-retry" onClick={onRetry} type="button">
          <ArrowRight aria-hidden="true" size={15} />
          重试
        </button>
      ) : null}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return <div className="lq-error-panel">{message}</div>;
}

function PlatformSelectCard({ isTarget = false, label, onChange, options, value }: { isTarget?: boolean; label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return <PlatformDropdown label={label} onChange={onChange} options={options} tone={isTarget ? "target" : "default"} value={value} />;
}

function rememberTaskFingerprintOutcome(
  data: AiTaskData,
  fingerprint: string,
  setters: {
    setLastSuccessfulFingerprint: (value: string | null) => void;
  }
) {
  if (isAiTaskDataPartial(data)) {
    setters.setLastSuccessfulFingerprint(null);
    return;
  }

  if (isAiTaskDataCompleteSuccess(data)) {
    setters.setLastSuccessfulFingerprint(fingerprint);
  }
}

function buildStrategyRestoredFingerprint(messages: AiMessageData[], targetPlatform: string | null | undefined) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const contentJson = readRecord(message.contentJson);

    if (message.role !== "user") {
      continue;
    }

    if (contentJson?.continuation) {
      continue;
    }

    if (typeof contentJson?.taskType === "string" && contentJson.taskType !== "strategy_generation") {
      continue;
    }

    const inputFileId = readNullableString(contentJson?.inputFileId);
    const inputFileName = readNullableString(contentJson?.inputFileName);
    const inputCodePreview = readNullableString(contentJson?.inputCodePreview);
    const prompt = readNullableString(contentJson?.prompt) ?? (inputFileId ? null : message.content);

    return buildAiTaskFingerprint({
      type: "strategy_generation",
      targetPlatform: readNullableString(contentJson?.targetPlatform) ?? targetPlatform,
      prompt,
      messageContent: prompt,
      inputFile: inputFileId || inputFileName || inputCodePreview
        ? {
            fileId: inputFileId ?? undefined,
            originalName: inputFileName ?? undefined,
            contentPreview: inputCodePreview ?? undefined
          }
        : null
    });
  }

  return null;
}

function getAiWaitMessage(action: string, elapsedSeconds: number) {
  if (elapsedSeconds >= 120) {
    return `${action}，已等待 ${elapsedSeconds} 秒。任务仍在服务端执行，请继续等待；请不要重复提交。`;
  }

  if (elapsedSeconds >= 60) {
    return `${action}，已等待 ${elapsedSeconds} 秒。真实模型可能需要几分钟，请不要关闭页面或重复提交。`;
  }

  if (elapsedSeconds >= 15) {
    return `${action}，已等待 ${elapsedSeconds} 秒。MiMo Pro 正在生成结果，请继续等待。`;
  }

  return `${action}，已等待 ${elapsedSeconds} 秒...`;
}

function createLocalStrategyJob(input: {
  id: string;
  conversationId: string;
  request: StrategyJobRequest;
  createdAt: string;
  startedAt?: string;
}): StrategyJob {
  const startedAt = input.request.submitStartedAt ?? input.startedAt ?? input.createdAt;
  rememberTaskStartedAt(input.id, startedAt, { overwrite: true });
  rememberClientRequestStartedAt(input.request.clientRequestId ?? input.id, startedAt, { overwrite: true });

  return {
    id: input.id,
    conversationId: input.conversationId,
    status: "pending",
    createdAt: input.createdAt,
    startedAt,
    clientRequestId: input.request.clientRequestId ?? input.id,
    request: input.request
  };
}

function createStrategyJobFromTask(
  task: AiTaskData["task"],
  input: {
    conversationId: string;
    result?: AiTaskData["result"];
    billing?: AiTaskData["billing"];
    events?: AiRunEventData[];
    previous?: StrategyJob;
    request?: StrategyJobRequest;
    visibleThinking?: string;
    finalAnswerMarkdown?: string;
    suppressDraftFinalAnswer?: boolean;
  }
): StrategyJob {
  const status = mergeJobStatus(input.previous?.status, mapTaskStatusToJobStatus(task.status, input.result));
  const createdAt = task.createdAt ?? input.previous?.createdAt ?? new Date().toISOString();
  const requestClientRequestId = input.request?.clientRequestId ?? null;
  const taskClientRequestId = task.clientRequestId ?? null;
  const previousClientRequestId = getStrategyJobClientRequestId(input.previous);
  const requestMatchesTask = !requestClientRequestId || !taskClientRequestId || requestClientRequestId === taskClientRequestId;
  const clientRequestId = requestMatchesTask
    ? requestClientRequestId ?? taskClientRequestId ?? (input.previous?.id === task.id ? previousClientRequestId : null)
    : taskClientRequestId ?? requestClientRequestId;
  const previousBelongsToCurrentRequest = Boolean(clientRequestId && previousClientRequestId === clientRequestId);
  const localBelongsToCurrentRequest = Boolean(input.previous && input.previous.id === clientRequestId && previousBelongsToCurrentRequest);
  const startedAt = resolveTaskStartedAt({
    task: {
      ...task,
      clientRequestId
    },
    clientRequestId,
    requestStartedAt: requestMatchesTask && requestClientRequestId === clientRequestId ? input.request?.submitStartedAt : undefined,
    cachedStartedAt: previousBelongsToCurrentRequest ? input.previous?.startedAt : undefined,
    localCreatedAt: localBelongsToCurrentRequest ? input.previous?.createdAt : undefined,
    fallback: createdAt
  });
  const resultText = input.result ? [input.result.explanation, input.result.generatedCode, input.result.migrationNotes].filter(Boolean).join("\n\n") : undefined;
  const visibleThinking = preserveStreamBuffer(input.visibleThinking, input.previous?.visibleThinking);
  const preservedFinalAnswerMarkdown = input.suppressDraftFinalAnswer ? "" : preserveStreamBuffer(input.finalAnswerMarkdown, input.previous?.finalAnswerMarkdown);
  const finalAnswerMarkdown = status === "completed"
    ? normalizeStrategyFinalAnswerMarkdown({
      finalAnswerMarkdown: preservedFinalAnswerMarkdown,
      result: input.result ?? input.previous?.result
    }) || preservedFinalAnswerMarkdown
    : preservedFinalAnswerMarkdown;
  rememberTaskStartedAt(task.id, startedAt, {
    overwrite: true
  });
  rememberClientRequestStartedAt(clientRequestId, startedAt, { overwrite: true });

  return {
    id: task.id,
    conversationId: input.conversationId,
    status,
    partialResult: status === "streaming" ? resultText : input.previous?.partialResult,
    finalResult: status === "completed" ? resultText : input.previous?.finalResult,
    visibleThinking,
    finalAnswerMarkdown,
    error: status === "failed" || status === "canceled" ? task.errorMessage ?? input.previous?.error ?? "任务处理失败" : undefined,
    createdAt,
    startedAt,
    finishedAt: task.finishedAt ?? input.previous?.finishedAt ?? undefined,
    clientRequestId: clientRequestId ?? undefined,
    task,
    result: input.result ?? input.previous?.result,
    billing: input.billing ?? input.previous?.billing,
    request: input.request ?? input.previous?.request,
    events: input.events ?? task.events ?? input.previous?.events
  };
}

function preserveStreamBuffer(nextValue: string | undefined, previousValue: string | undefined) {
  return nextValue && nextValue.length > 0 ? nextValue : previousValue ?? nextValue;
}

function mapTaskStatusToJobStatus(status: string, result?: AiTaskData["result"]): JobStatus {
  if (status === "SUCCEEDED") {
    return "completed";
  }

  if (status === "FAILED") {
    return "failed";
  }

  if (status === "CANCELLED") {
    return "canceled";
  }

  if (status === "RUNNING") {
    return result ? "streaming" : "running";
  }

  return "queued";
}

function shouldSuppressStrategyDraftFinalAnswer(data: AiTaskData) {
  if (data.result) {
    return false;
  }

  const phase = data.task.progress?.phase;
  return phase === "merging" || phase === "validating";
}

function getStrategyFinalizingMessage(job: StrategyJob) {
  if (job.result || isTerminalJobStatus(job.status)) {
    return null;
  }

  const phase = job.task?.progress?.phase;

  if (phase === "validating") {
    return "正在检查输出是否完整传输";
  }

  if (phase === "merging") {
    return "正在整理最终结果";
  }

  return null;
}

function mergeJobStatus(previousStatus: JobStatus | undefined, nextStatus: JobStatus): JobStatus {
  if (isTerminalJobStatus(nextStatus)) {
    return nextStatus;
  }

  if (previousStatus && isTerminalJobStatus(previousStatus)) {
    return previousStatus;
  }

  if (!previousStatus) {
    return nextStatus;
  }

  return getJobStatusRank(nextStatus) >= getJobStatusRank(previousStatus) ? nextStatus : previousStatus;
}

function getJobStatusRank(status: JobStatus) {
  switch (status) {
    case "streaming":
      return 3;
    case "running":
      return 2;
    case "pending":
    case "queued":
      return 1;
    case "completed":
    case "failed":
    case "canceled":
      return 100;
    default:
      return 0;
  }
}

function isTerminalJobStatus(status: JobStatus) {
  return status === "completed" || status === "failed" || status === "canceled";
}

function getStrategyJobClientRequestId(job: StrategyJob | null | undefined) {
  return job?.request?.clientRequestId ?? job?.clientRequestId ?? job?.task?.clientRequestId ?? null;
}

function getDisplayJobActive(job: StrategyJob | null | undefined) {
  if (!job || isTerminalJobStatus(job.status)) {
    return false;
  }

  return Boolean(job && (
    job.status === "pending" ||
    job.status === "queued" ||
    job.status === "running" ||
    job.status === "streaming" ||
    job.task?.status === "PENDING" ||
    job.task?.status === "RUNNING"
  ));
}

function createEmptyThinkingState(): ThinkingMessageState {
  return {
    status: "idle",
    visibleThinking: "",
    finalAnswerMarkdown: ""
  };
}

function createThinkingStateFromTaskData(data: AiTaskData | null | undefined, taskType: WorkbenchTaskType, previous?: ThinkingMessageState): ThinkingMessageState {
  if (!data) {
    return createEmptyThinkingState();
  }

  const streamContent = getAiTaskStreamingContent(data, data.task.id);
  const visibleThinking = preserveStreamBuffer(streamContent.visibleThinking, previous?.visibleThinking) ?? "";
  const finalAnswerMarkdown = preserveStreamBuffer(
    streamContent.finalAnswerMarkdown || (data.result ? formatAiTaskResultAsMarkdown(data.result, taskType) : ""),
    previous?.finalAnswerMarkdown
  ) ?? "";

  if (data.task.status === "FAILED" || data.task.status === "CANCELLED") {
    return {
      status: "failed",
      visibleThinking,
      finalAnswerMarkdown: "",
      error: data.task.errorMessage ?? null,
      taskId: data.task.id
    };
  }

  if (data.task.status === "SUCCEEDED" || data.result || finalAnswerMarkdown) {
    return {
      status: "completed",
      visibleThinking,
      finalAnswerMarkdown,
      taskId: data.task.id
    };
  }

  return {
    status: "thinking",
    visibleThinking,
    finalAnswerMarkdown,
    taskId: data.task.id
  };
}

function getFinalConversionInputText(inputCode: string) {
  return inputCode.trim();
}

function getConversionTotalInputChars(inputCode: string, prompt: string, sourcePlatform: string, targetPlatform: string) {
  return inputCode.length + prompt.length + sourcePlatform.length + targetPlatform.length;
}

function getConversionInputTooLargeMessage(totalInputChars: number, fromAttachment: boolean) {
  if (fromAttachment) {
    return "附件已解析但内容过长。当前任务不支持这么长的输入，建议拆分文件后重试。";
  }

  return "当前任务不支持这么长的输入，请拆分代码或减少补充要求后重试。";
}

function isJobActive(job: StrategyJob) {
  return getDisplayJobActive(job);
}

function isJobTerminal(job: StrategyJob) {
  return isTerminalJobStatus(job.status);
}

function shouldRenderStrategyJobPanel(job: StrategyJob, messages: StrategyChatMessage[]) {
  if (isJobActive(job)) {
    return true;
  }

  if (job.status === "failed" || job.status === "canceled") {
    return !hasAssistantMessageForTask(messages, job.id);
  }

  if (job.status === "completed") {
    return !hasAssistantMessageForTask(messages, job.id);
  }

  return false;
}

function isFailedStrategyMessage(message: StrategyChatMessage) {
  if (message.role !== "assistant") {
    return false;
  }

  if (message.localStatus === "error" || getMessageError(message)) {
    return true;
  }

  const task = getMessageTask(message);

  return task?.status === "FAILED" || task?.status === "CANCELLED";
}

function hasAssistantMessageForTask(messages: Array<Pick<AiMessageData, "role" | "taskId">>, taskId: string) {
  return messages.some((message) => message.role === "assistant" && message.taskId === taskId);
}

function isSameConversationKey(current: string, source: string, response: string) {
  return current === source || current === response || (current === DRAFT_CONVERSATION_KEY && source === DRAFT_CONVERSATION_KEY);
}

function toStrategyMessage(message: AiMessageData): StrategyChatMessage {
  return {
    ...message
  };
}

function getMessageTask(message: StrategyChatMessage): AiTaskData["task"] | null {
  const task = readRecord(message.contentJson?.task);
  const progress = readRecord(task?.progress);

  if (!task || typeof task.id !== "string") {
    return null;
  }

  return {
    id: task.id,
    clientRequestId: typeof task.clientRequestId === "string" ? task.clientRequestId : null,
    type: String(task.type ?? "strategy_generation"),
    status: String(task.status ?? "SUCCEEDED"),
    conversationId: typeof task.conversationId === "string" ? task.conversationId : null,
    sourcePlatform: typeof task.sourcePlatform === "string" ? task.sourcePlatform : null,
    targetPlatform: typeof task.targetPlatform === "string" ? task.targetPlatform : null,
    inputFileId: typeof task.inputFileId === "string" ? task.inputFileId : null,
    costPoints: Number(task.costPoints ?? 50),
    errorCode: typeof task.errorCode === "string" ? task.errorCode : null,
    errorMessage: typeof task.errorMessage === "string" ? task.errorMessage : null,
    startedAt: typeof task.startedAt === "string" ? task.startedAt : null,
    finishedAt: typeof task.finishedAt === "string" ? task.finishedAt : null,
    createdAt: typeof task.createdAt === "string" ? task.createdAt : null,
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : null,
    progress,
    events: Array.isArray(task.events) ? task.events as AiRunEventData[] : null
  };
}

function getMessageResult(message: StrategyChatMessage): AiTaskData["result"] | null {
  const result = readRecord(message.contentJson?.result);

  if (!result) {
    return null;
  }

  return {
    scopeStatus: result.scopeStatus === "out_of_scope" ? "out_of_scope" : "in_scope",
    generatedCode: typeof result.generatedCode === "string" ? result.generatedCode : null,
    explanation: typeof result.explanation === "string" ? result.explanation : null,
    migrationNotes: typeof result.migrationNotes === "string" ? result.migrationNotes : null,
    riskWarnings: readStringArray(result.riskWarnings),
    reportJson: readRecord(result.reportJson),
  };
}

function withStrategyMessageBilling(message: StrategyChatMessage, data: AiTaskData): StrategyChatMessage {
  if (message.role !== "assistant" || message.taskId !== data.task.id) {
    return message;
  }

  const contentJson = readRecord(message.contentJson) ?? {};

  if (contentJson.billing) {
    return message;
  }

  return {
    ...message,
    contentJson: {
      ...contentJson,
      task: contentJson.task ?? data.task,
      result: contentJson.result ?? data.result,
      billing: data.billing
    }
  };
}

function getMessageBilling(message: StrategyChatMessage): AiTaskData["billing"] | null {
  const contentJson = readRecord(message.contentJson);
  const billing = readRecord(contentJson?.billing);
  const task = getMessageTask(message);

  if (!billing || !task) {
    return null;
  }

  const waivedByMembership = billing.waivedByMembership === true;
  const membershipType = billing.membershipType === "beta_vip" ? "beta_vip" : null;

  return {
    nominalCostPoints: typeof billing.nominalCostPoints === "number" ? billing.nominalCostPoints : task.costPoints,
    chargedPoints: typeof billing.chargedPoints === "number" ? billing.chargedPoints : waivedByMembership ? 0 : task.costPoints,
    waivedByMembership,
    membershipType,
    membershipLabel: null,
    membershipEndsAt: readNullableString(billing.membershipEndsAt)
  };
}

function getBillingTag(billing: AiTaskData["billing"] | null | undefined, task: AiTaskData["task"] | null | undefined) {
  if (!billing || !task) {
    return null;
  }

  const chargedPoints = billing.chargedPoints ?? task.costPoints;
  const zeroCharge = chargedPoints === 0;

  return {
    label: `已扣除 ${chargedPoints} 积分`,
    waived: zeroCharge
  };
}

function getMessageStreamingContent(message: AiMessageData, result: AiTaskData["result"] | null, taskType: WorkbenchTaskType) {
  const contentJson = readRecord(message.contentJson);
  const visibleThinking = readNullableString(contentJson?.visibleThinking) ?? "";
  const messageContent = message.content.trim();
  const finalAnswerMarkdown = readNullableString(contentJson?.finalAnswerMarkdown)
    ?? readNullableString(result?.reportJson?.finalAnswerMarkdown)
    ?? (result ? formatAiTaskResultAsMarkdown(result, taskType) : taskType === "strategy_generation" ? messageContent : message.content.includes("## ") ? message.content : "");

  return {
    visibleThinking,
    finalAnswerMarkdown
  };
}

function getMessageError(message: StrategyChatMessage) {
  const error = readRecord(message.contentJson?.error);

  if (!error) {
    return null;
  }

  return {
    code: typeof error.code === "string" ? error.code : "AI_TASK_FAILED",
    message: typeof error.message === "string" ? error.message : message.content
  };
}

function getLatestRunEventSeq(events: AiRunEventData[] | null | undefined) {
  return events?.reduce((latestSeq, event) => Math.max(latestSeq, event.seq), 0) ?? 0;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError() {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

function getClientPerfNow() {
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
