"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  AlertTriangle,
  Bot,
  Code2,
  DollarSign,
  FileUp,
  LoaderCircle,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  Trash2
} from "lucide-react";
import { getFileUploadFriendlyError, getUploadAccept, getUploadButtonLabel, uploadCodeFile, type UploadedCodeFile } from "@/lib/file-upload";
import { normalizeStrategyFinalAnswerMarkdown } from "@/lib/ai/strategy-result-format";
import {
  buildAiTaskFingerprint,
  canContinueAiTaskData,
  isAiTaskDataCompleteSuccess,
  isAiTaskDataPartial
} from "@/lib/ai/task-fingerprint";
import { chatPlatformOptions, convertPlatforms } from "@/lib/mock-data";
import { PlatformDropdown } from "@/components/ui/PlatformDropdown";
import { AssistantThinkingMessage, type AssistantThinkingStatus } from "@/components/ai/AssistantThinkingMessage";
import { MessageAttachmentList, WorkbenchFileUploadStatus } from "@/components/ai/AttachmentPreviewCard";
import { WorkbenchShell } from "@/components/ai/WorkbenchShell";
import {
  CopyCodeButton,
  getCodeConversionTabContent,
  isCodeConversionCodeTab,
  getStrategyResponseTitle,
  parseCodeConversionMarkdown
} from "@/components/ai/WorkbenchResultViews";
import {
  createRestoredUploadedFile,
  createWorkbenchClientRequestId,
  cancelAiTask,
  fetchAiTaskStatus,
  formatRestoredInputText,
  getConversationActiveTab,
  getFriendlyAiError as getFriendlyError,
  getAiTaskStreamingContent,
  formatAiTaskResultAsMarkdown,
  getMessageAttachments,
  logWorkbenchPerf,
  persistConversationActiveTab,
  readRecord,
  readNullableString,
  readStringArray,
  replaceWorkbenchConversationUrl,
  streamWorkbenchAiTask,
  uploadedFileToMessageAttachment,
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
  const [lastPartialFingerprint, setLastPartialFingerprint] = useState<string | null>(null);
  const [lastPartialCanContinue, setLastPartialCanContinue] = useState(false);
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
  const activeJobRunning = Boolean(activeJob && isJobActive(activeJob));
  const elapsedSeconds = useElapsedSeconds(activeJobRunning, activeJob?.startedAt ?? activeJob?.createdAt);
  const strategyCurrentFingerprint = useMemo(() => buildAiTaskFingerprint({
    type: "strategy_generation",
    targetPlatform,
    prompt,
    messageContent: prompt,
    inputFile: uploadedFile
  }), [targetPlatform, prompt, uploadedFile]);
  const strategyHasInput = Boolean(prompt.trim() || uploadedFile);
  const strategyDuplicateCompleted = strategyHasInput && lastSuccessfulFingerprint === strategyCurrentFingerprint;
  const strategyContinuationAvailable = !strategyHasInput && lastPartialCanContinue && Boolean(lastPartialFingerprint);
  const strategySubmitDisabled = activeJobRunning ||
    uploading ||
    uploadedFile?.scanStatus === "BLOCKED" ||
    (!strategyContinuationAvailable && (!strategyHasInput || strategyDuplicateCompleted));

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
        setLastPartialFingerprint(null);
        setLastPartialCanContinue(false);
      } else if (restoredFingerprint && isAiTaskDataPartial(restored.taskData)) {
        setLastSuccessfulFingerprint(null);
        setLastPartialFingerprint(restoredFingerprint);
        setLastPartialCanContinue(canContinueAiTaskData(restored.taskData));
      } else {
        setLastSuccessfulFingerprint(null);
        setLastPartialFingerprint(null);
        setLastPartialCanContinue(false);
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

  async function handleSubmit(options: { continuation?: boolean } = {}) {
    const continueOutput = options.continuation === true;

    if (activeJobRunning || uploading) {
      return;
    }

    if (continueOutput && !strategyContinuationAvailable) {
      return;
    }

    if (!continueOutput && strategyDuplicateCompleted) {
      return;
    }

    const messageContent = continueOutput ? "继续输出" : prompt.trim();
    const submittedFingerprint = continueOutput ? lastPartialFingerprint : strategyCurrentFingerprint;

    if (!submittedFingerprint) {
      return;
    }

    if (!continueOutput && !messageContent && !uploadedFile) {
      return;
    }

    if (!continueOutput && uploadedFile?.scanStatus === "BLOCKED") {
      return;
    }

    const clientRequestId = createWorkbenchClientRequestId("strategy");
    const optimisticUserContent = messageContent || (uploadedFile ? `已上传文件：${uploadedFile.originalName}` : "已上传文件输入");
    const currentConversationId = conversation?.id ?? conversationIdFromUrl ?? undefined;
    const conversationKeyAtSubmit = currentConversationId ?? DRAFT_CONVERSATION_KEY;
    const request: StrategyJobRequest = {
      conversationKey: conversationKeyAtSubmit,
      prompt: optimisticUserContent,
      messageContent: optimisticUserContent,
      targetPlatform,
      inputFileId: continueOutput ? undefined : uploadedFile?.fileId,
      inputFileName: continueOutput ? undefined : uploadedFile?.originalName
    };
    const localJob = createLocalStrategyJob({
      id: clientRequestId,
      conversationId: conversationKeyAtSubmit,
      request,
      createdAt: new Date().toISOString()
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
          inputFileId: continueOutput ? null : uploadedFile?.fileId ?? null,
          inputFileName: continueOutput ? null : uploadedFile?.originalName ?? null,
          continuation: continueOutput
        },
        attachments: !continueOutput && uploadedFile ? [uploadedFileToMessageAttachment(uploadedFile, `local-attachment-${clientRequestId}`)] : [],
        createdAt: new Date().toISOString()
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
        inputFileId: continueOutput ? undefined : uploadedFile?.fileId,
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
        setLastSuccessfulFingerprint,
        setLastPartialFingerprint,
        setLastPartialCanContinue
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
        [localJob.id]: {
          ...localJob,
          status: "failed",
          error: friendly,
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
    const previousJob = jobsById[data.task.id] ?? (options.localJobId ? jobsById[options.localJobId] : undefined);
    const streamContent = getAiTaskStreamingContent(data, data.task.id);
    const nextJob = createStrategyJobFromTask(data.task, {
      conversationId: responseConversationId,
      result: data.result,
      billing: data.billing,
      events: data.events,
      previous: previousJob,
      request: options.request ?? previousJob?.request,
      visibleThinking: streamContent.visibleThinking,
      finalAnswerMarkdown: streamContent.finalAnswerMarkdown
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
        finalAnswerMarkdown: preserveStreamBuffer(nextJob.finalAnswerMarkdown, existing?.finalAnswerMarkdown),
        request: options.request ?? existing?.request
      };

      return next;
    });

    setActiveJobByConversationId((current) => {
      const next = { ...current };

      if (options.localJobId && options.localJobId !== data.task.id && next[options.sourceConversationKey] === options.localJobId) {
        delete next[options.sourceConversationKey];
      }

      if (nextJob.status === "completed" && data.messages?.some((message) => message.taskId === data.task.id && message.role === "assistant")) {
        delete next[responseConversationId];
      } else {
        next[responseConversationId] = data.task.id;
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
    if (!isJobActive(job)) {
      return;
    }

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
    }
  }

  async function handleRetryJob(job: StrategyJob) {
    if (isJobActive(job)) {
      return;
    }

    const clientRequestId = createWorkbenchClientRequestId("strategy-retry");
    const sourceConversationKey = job.conversationId || currentConversationKey;
    const retryRequest = job.request ?? {
      conversationKey: sourceConversationKey,
      prompt: job.task?.promptPreview ?? "重试策略生成任务",
      messageContent: job.task?.promptPreview ?? "重试策略生成任务",
      targetPlatform: job.task?.targetPlatform ?? targetPlatform,
      inputFileId: job.task?.inputFileId ?? undefined
    };
    const localJob = createLocalStrategyJob({
      id: clientRequestId,
      conversationId: sourceConversationKey,
      request: retryRequest,
      createdAt: new Date().toISOString()
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
        [localJob.id]: {
          ...localJob,
          status: "failed",
          error: friendly,
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
              <StrategyMessageBubble elapsedSeconds={message.localStatus === "pending" ? elapsedSeconds : undefined} key={message.id} message={message} />
            ))}
            {activeJob && shouldShowActiveJobPanel ? (
              <StrategyJobBubble
                elapsedSeconds={elapsedSeconds}
                job={activeJob}
                onCancel={() => void handleCancelJob(activeJob)}
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
                <div className="lq-cost-pill">
                  <DollarSign aria-hidden="true" />
                  <span>每次策略生成消耗 50 积分</span>
                </div>
                <button
                  className="lq-primary-btn"
                  disabled={strategySubmitDisabled}
                  onClick={() => void handleSubmit({ continuation: strategyContinuationAvailable })}
                  type="button"
                >
                  {activeJobRunning ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Send aria-hidden="true" size={18} />}
                  {activeJobRunning
                    ? `${activeJob?.status === "queued" ? "排队中" : "处理中"} ${elapsedSeconds}s`
                    : strategyContinuationAvailable
                      ? "继续输出"
                      : strategyDuplicateCompleted
                        ? "已完成生成"
                        : "发送"}
                </button>
              </div>
            </div>
            <WorkbenchFileUploadStatus file={uploadedFile} message={uploadError} />
          </div>
          <p className="lq-risk lq-bottom-risk">AI 生成策略需自行回测验证，投资有风险，请谨慎使用。</p>
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
  const [lastPartialFingerprint, setLastPartialFingerprint] = useState<string | null>(null);
  const [lastPartialCanContinue, setLastPartialCanContinue] = useState(false);
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
  const elapsedSeconds = useElapsedSeconds(conversionLoading, taskData?.task.startedAt ?? taskData?.task.createdAt ?? undefined);

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
  const conversionContinuationAvailable = Boolean(finalInputText) &&
    lastPartialCanContinue &&
    lastPartialFingerprint === conversionCurrentFingerprint;

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

      if (isAiTaskDataCompleteSuccess(restored.taskData)) {
        setLastSuccessfulFingerprint(restoredFingerprint);
        setLastPartialFingerprint(null);
        setLastPartialCanContinue(false);
      } else if (isAiTaskDataPartial(restored.taskData)) {
        setLastSuccessfulFingerprint(null);
        setLastPartialFingerprint(restoredFingerprint);
        setLastPartialCanContinue(canContinueAiTaskData(restored.taskData));
      } else {
        setLastSuccessfulFingerprint(null);
        setLastPartialFingerprint(null);
        setLastPartialCanContinue(false);
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

  async function handleSubmit(options: { continuation?: boolean } = {}) {
    const continueOutput = options.continuation === true;
    const submittedFingerprint = continueOutput ? lastPartialFingerprint : conversionCurrentFingerprint;

    if (conversionLoading || uploading) {
      return;
    }

    if (!submittedFingerprint) {
      return;
    }

    if (continueOutput && !conversionContinuationAvailable) {
      return;
    }

    if (!continueOutput && conversionDuplicateCompleted) {
      return;
    }

    if (!continueOutput && !finalInputText) {
      return;
    }

    if (!continueOutput && uploadedFile?.scanStatus === "BLOCKED") {
      return;
    }

    if (!continueOutput && finalTotalInputChars > CODE_CONVERSION_MAX_TOTAL_INPUT_CHARS) {
      setError(getConversionInputTooLargeMessage(finalTotalInputChars, inputSource === "attachment" && Boolean(uploadedFile)));
      return;
    }

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
        inputCode: continueOutput ? undefined : finalInputText,
        prompt: continueOutput ? "继续输出" : finalPrompt,
        inputFileId: continueOutput ? undefined : uploadedFile?.fileId,
        clientRequestId: createWorkbenchClientRequestId("convert")
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
        setLastSuccessfulFingerprint,
        setLastPartialFingerprint,
        setLastPartialCanContinue
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
          error: friendly
        }));
      }
    } finally {
      setLoading(false);
      setCanceling(false);
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
  const streamConversionResult = parseCodeConversionMarkdown(streamState.finalAnswerMarkdown);
  const restoredConversionMarkdown = !streamState.finalAnswerMarkdown && result ? formatAiTaskResultAsMarkdown(result, "code_conversion") : "";
  const restoredConversionResult = parseCodeConversionMarkdown(restoredConversionMarkdown);
  const targetCode = streamConversionResult.targetCode || restoredConversionResult.targetCode || getCodeConversionTabContent("目标平台代码", result);
  const migrationNotes = streamConversionResult.migrationNotes || restoredConversionResult.migrationNotes || getCodeConversionTabContent("迁移说明", result);
  const conversionPanelContent = isCodeConversionCodeTab(activeTab) ? targetCode : migrationNotes;
  const conversionCopyContent = isCodeConversionCodeTab(activeTab) ? targetCode : migrationNotes;
  const conversionLineCount = Math.max(10, conversionPanelContent ? conversionPanelContent.split(/\r\n|\r|\n/).length : 10);
  const canCopyConversionContent = Boolean(conversionCopyContent.trim());
  const inputTooLargeMessage = finalTotalInputChars > CODE_CONVERSION_MAX_TOTAL_INPUT_CHARS
    ? getConversionInputTooLargeMessage(finalTotalInputChars, inputSource === "attachment" && Boolean(uploadedFile))
    : "";
  const shownError = error || (conversionContinuationAvailable ? "" : inputTooLargeMessage);
  const hasConversionOutput = Boolean(targetCode.trim() || migrationNotes.trim());
  const taskStatus = taskData?.task.status ?? (conversionLoading ? "RUNNING" : null);
  const canCancelTask = Boolean(taskData?.task.id && (taskStatus === "PENDING" || taskStatus === "RUNNING"));
  const conversionSubmitDisabled = conversionLoading ||
    uploading ||
    (!conversionContinuationAvailable && (Boolean(inputTooLargeMessage) || !finalInputText || uploadedFile?.scanStatus === "BLOCKED" || conversionDuplicateCompleted));

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

    if (!conversionAutoFollowRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      preview.scrollTop = preview.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [conversionPanelContent]);

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
              <div className="lq-code-preview app-scrollbar" onScroll={handleConversionPreviewScroll} ref={conversionPreviewRef}>
                <div className="lq-code-lines">{Array.from({ length: conversionLineCount }, (_, index) => <div key={index}>{index + 1}</div>)}</div>
                {hasConversionOutput ? (
                  <CodeConversionToolOutput activeTab={activeTab} content={conversionPanelContent} loading={conversionLoading} />
                ) : streamState.error ? (
                  <div className="lq-result-placeholder is-error">
                    <BotIcon />
                    <span>{streamState.error}</span>
                  </div>
                ) : (
                  <div className="lq-result-placeholder">
                    <BotIcon />
                    <span>{conversionLoading ? "转换中..." : "转换结果将在这里显示"}</span>
                  </div>
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
              onClick={() => void handleSubmit({ continuation: conversionContinuationAvailable })}
              type="button"
            >
              {conversionLoading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
              {conversionLoading
                ? `转换中 ${elapsedSeconds}s`
                : conversionContinuationAvailable
                  ? "继续输出"
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
          <div className="lq-cost-pill">
            <DollarSign aria-hidden="true" />
            <span>每次平台转换消耗 200 积分</span>
          </div>
        </div>
      </section>
      <p className="lq-risk lq-bottom-risk lq-workbench-risk">AI 生成策略需自行回测验证，投资有风险，请谨慎使用。</p>
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

function StrategyMessageBubble({ elapsedSeconds, message }: { elapsedSeconds?: number; message: StrategyChatMessage }) {
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
  const billingTag = getBillingTag(getMessageBilling(message), task);

  return (
    <div className="lq-assistant-row">
      <div className={`lq-assistant-message ${status === "failed" ? "is-error" : ""}`}>
        {status === "failed" ? (
          <StrategyFailureMessage message={failureMessage} title={task?.status === "CANCELLED" ? "任务已取消" : "生成失败"} />
        ) : finalAnswerMarkdown || streamContent.visibleThinking || result ? (
          <AssistantThinkingMessage
            billingLabel={billingTag?.label}
            billingWaived={billingTag?.waived}
            error={null}
            finalTitle={getStrategyResponseTitle(result)}
            finalAnswerMarkdown={finalAnswerMarkdown}
            status={thinkingStatus}
            thinking={streamContent.visibleThinking}
          />
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
  onCancel,
  onRetry
}: {
  elapsedSeconds: number;
  job: StrategyJob;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const failed = job.status === "failed";
  const canceled = job.status === "canceled";
  const completed = job.status === "completed";
  const rawFinalAnswerMarkdown = job.finalAnswerMarkdown || (job.result ? formatAiTaskResultAsMarkdown(job.result, "strategy_generation") : "");
  const finalAnswerMarkdown = job.status === "streaming"
    ? rawFinalAnswerMarkdown
    : normalizeStrategyFinalAnswerMarkdown({
      finalAnswerMarkdown: rawFinalAnswerMarkdown,
      result: job.result
    }) || rawFinalAnswerMarkdown;
  const thinkingStatus: AssistantThinkingStatus = failed || canceled ? "failed" : completed ? "completed" : job.status === "streaming" ? "answering" : "thinking";
  const visibleThinking = job.visibleThinking?.trim() ?? "";
  const visibleError = failed || canceled ? job.error ?? null : null;
  const runningFallback = isJobActive(job) && !visibleThinking && !finalAnswerMarkdown.trim() && !visibleError ? "正在同步任务状态..." : "";
  const billingTag = getBillingTag(job.billing, job.task);

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
        <AssistantThinkingMessage
          billingLabel={billingTag?.label}
          billingWaived={billingTag?.waived}
          error={null}
          finalTitle={getStrategyResponseTitle(job.result ?? null)}
          finalAnswerMarkdown={finalAnswerMarkdown}
          status={thinkingStatus}
          thinking={visibleThinking || runningFallback}
        />
      </div>
    </div>
  );
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

function CodeConversionToolOutput({ activeTab, content, loading }: { activeTab: string; content: string; loading: boolean }) {
  if (!content.trim()) {
    return (
      <div className="lq-conversion-empty">
        {loading ? "转换中..." : isCodeConversionCodeTab(activeTab) ? "暂无目标平台代码。" : "暂无迁移说明。"}
      </div>
    );
  }

  return (
    <pre className={`lq-conversion-pre ${isCodeConversionCodeTab(activeTab) ? "is-code" : "is-text"}`}>
      <code>{content}</code>
    </pre>
  );
}

function PlatformSelectCard({ isTarget = false, label, onChange, options, value }: { isTarget?: boolean; label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return <PlatformDropdown label={label} onChange={onChange} options={options} tone={isTarget ? "target" : "default"} value={value} />;
}

function BotIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path d="M12 3v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <rect height="10" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="8" />
      <path d="M9 13h.01M15 13h.01M10 18v3h4v-3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function useElapsedSeconds(active: boolean, startedAt?: string) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedSeconds(0);
      return;
    }

    const startedAtMs = startedAt ? new Date(startedAt).getTime() : Date.now();
    const safeStartedAt = Number.isFinite(startedAtMs) ? startedAtMs : Date.now();
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - safeStartedAt) / 1000)));
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - safeStartedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, startedAt]);

  return elapsedSeconds;
}

function rememberTaskFingerprintOutcome(
  data: AiTaskData,
  fingerprint: string,
  setters: {
    setLastSuccessfulFingerprint: (value: string | null) => void;
    setLastPartialFingerprint: (value: string | null) => void;
    setLastPartialCanContinue: (value: boolean) => void;
  }
) {
  if (isAiTaskDataPartial(data)) {
    setters.setLastSuccessfulFingerprint(null);
    setters.setLastPartialFingerprint(fingerprint);
    setters.setLastPartialCanContinue(canContinueAiTaskData(data));
    return;
  }

  if (isAiTaskDataCompleteSuccess(data)) {
    setters.setLastSuccessfulFingerprint(fingerprint);
    setters.setLastPartialFingerprint(null);
    setters.setLastPartialCanContinue(false);
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
}): StrategyJob {
  return {
    id: input.id,
    conversationId: input.conversationId,
    status: "pending",
    createdAt: input.createdAt,
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
  }
): StrategyJob {
  const status = mapTaskStatusToJobStatus(task.status, input.result);
  const createdAt = task.createdAt ?? input.previous?.createdAt ?? new Date().toISOString();
  const resultText = input.result ? [input.result.explanation, input.result.generatedCode, input.result.migrationNotes].filter(Boolean).join("\n\n") : undefined;
  const visibleThinking = preserveStreamBuffer(input.visibleThinking, input.previous?.visibleThinking);
  const preservedFinalAnswerMarkdown = preserveStreamBuffer(input.finalAnswerMarkdown, input.previous?.finalAnswerMarkdown);
  const finalAnswerMarkdown = status === "completed"
    ? normalizeStrategyFinalAnswerMarkdown({
      finalAnswerMarkdown: preservedFinalAnswerMarkdown,
      result: input.result ?? input.previous?.result
    }) || preservedFinalAnswerMarkdown
    : preservedFinalAnswerMarkdown;

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
    startedAt: task.startedAt ?? input.previous?.startedAt ?? undefined,
    finishedAt: task.finishedAt ?? input.previous?.finishedAt ?? undefined,
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
      finalAnswerMarkdown,
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
  return job.status === "pending" || job.status === "queued" || job.status === "running" || job.status === "streaming";
}

function isJobTerminal(job: StrategyJob) {
  return job.status === "completed" || job.status === "failed" || job.status === "canceled";
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
    membershipLabel: membershipType ? "内测VIP" : null,
    membershipEndsAt: readNullableString(billing.membershipEndsAt)
  };
}

function getBillingTag(billing: AiTaskData["billing"] | null | undefined, task: AiTaskData["task"] | null | undefined) {
  if (!billing || !task) {
    return null;
  }

  const nominalCostPoints = billing.nominalCostPoints ?? task.costPoints;
  const chargedPoints = billing.chargedPoints ?? task.costPoints;
  const waived = billing.waivedByMembership === true;

  return {
    label: waived ? `内测VIP免扣 ${nominalCostPoints} 积分` : `已扣除 ${chargedPoints} 积分`,
    waived
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
