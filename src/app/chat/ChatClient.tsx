"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  DollarSign,
  FileUp,
  ImageIcon,
  LoaderCircle,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  type LucideIcon
} from "lucide-react";
import { getFileUploadFriendlyError, getScanStatusText, uploadCodeFile, type UploadedCodeFile } from "@/lib/file-upload";
import { chatPlatformOptions, convertPlatforms } from "@/lib/mock-data";
import { PlatformDropdown } from "@/components/ui/PlatformDropdown";
import { AiTaskCompletionSummary, AiTaskProgressPanel, type AiTaskProgress } from "@/components/ai/AiTaskProgressPanel";

type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: { code: string; message: string }; requestId: string };

type AiTaskData = {
  task: {
    id: string;
    type: string;
    status: string;
    conversationId?: string | null;
    sourcePlatform?: string | null;
    targetPlatform?: string | null;
    costPoints: number;
    title?: string | null;
    promptPreview?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    inputFileId?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    progress?: AiTaskProgress | null;
  };
  result: {
    scopeStatus: "in_scope" | "out_of_scope";
    generatedCode: string | null;
    explanation: string | null;
    migrationNotes: string | null;
    riskWarnings: string[];
    reportJson: Record<string, unknown> | null;
  } | null;
  creditAccount?: {
    balance: number;
  };
  duplicated?: boolean;
  conversation?: AiConversationData | null;
  messages?: AiMessageData[];
};

type AiConversationData = {
  id: string;
  mode: "strategy" | "convert" | "analysis";
  title: string;
  targetPlatform: string | null;
  sourcePlatform: string | null;
  status: "active" | "archived";
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

type AiMessageData = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  taskId: string | null;
  content: string;
  contentJson: Record<string, unknown> | null;
  attachments?: MessageAttachmentData[];
  createdAt: string;
};

type MessageAttachmentData = {
  id: string;
  messageId: string;
  conversationId: string;
  fileId: string;
  kind?: "code" | "text" | "log" | "markdown" | "image" | null;
  originalName?: string;
  ext?: string;
  mimeType?: string;
  sizeBytes?: number;
  scanStatus?: "PASSED" | "BLOCKED" | "WARNING";
  riskFlags?: string[];
  contentPreview?: string;
  hasThumbnail?: boolean;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  role: "input" | "reference" | "generated";
  displayOrder: number;
  caption: string | null;
  createdAt: string;
  file: {
    fileId: string;
    kind?: "code" | "text" | "log" | "markdown" | "image" | null;
    originalName: string;
    ext: string;
    mimeType: string;
    sizeBytes: number;
    scanStatus: "PASSED" | "BLOCKED" | "WARNING";
    riskFlags: string[];
    contentPreview: string;
    hasThumbnail?: boolean;
    thumbnailUrl?: string | null;
    previewUrl?: string | null;
    createdAt: string;
  };
};

type StrategyChatMessage = AiMessageData & {
  localStatus?: "pending" | "error";
  visibleSteps?: string[];
  startedAt?: number;
};

type AiConversationMessagesData = {
  conversation: AiConversationData;
  messages: AiMessageData[];
  tasks?: AiTaskData["task"][];
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

type StrategyJobStep = {
  id: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
  updatedAt?: string;
};

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
  steps: StrategyJobStep[];
  partialResult?: string;
  finalResult?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  task?: AiTaskData["task"];
  result?: AiTaskData["result"];
  request?: StrategyJobRequest;
};

const conversionTabs = ["目标平台代码", "迁移说明", "风险提醒"] as const;
const AI_TASK_POLL_INTERVAL_MS = 3000;
const AI_TASK_POLL_TIMEOUT_MS = 5 * 60 * 1000;
const DRAFT_CONVERSATION_KEY = "__draft_strategy_conversation__";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compositionRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversationIdFromUrl = searchParams.get("conversationId");
  const currentConversationKey = conversation?.id ?? conversationIdFromUrl ?? DRAFT_CONVERSATION_KEY;
  const activeConversationKeyRef = useRef(currentConversationKey);
  const pollingJobsRef = useRef(new Set<string>());
  const canceledLocalJobIdsRef = useRef(new Set<string>());
  const activeJobId = activeJobByConversationId[currentConversationKey];
  const activeJob = activeJobId ? jobsById[activeJobId] ?? null : null;
  const activeJobRunning = Boolean(activeJob && isJobActive(activeJob));
  const elapsedSeconds = useElapsedSeconds(activeJobRunning, activeJob?.startedAt ?? activeJob?.createdAt);

  useEffect(() => {
    activeConversationKeyRef.current = currentConversationKey;
  }, [currentConversationKey]);

  useEffect(() => {
    if (!conversationIdFromUrl) {
      setConversation(null);
      setMessages([]);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setError("");

    fetchAiConversationMessages(conversationIdFromUrl, {
      limit: 20,
      taskLimit: 5,
      includeTaskResults: "latest"
    })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setConversation(data.conversation);
        setMessages(data.messages.map(toStrategyMessage));
        hydrateConversationJobs(data.conversation.id, data.tasks ?? [], data.messages);

        if (data.conversation.targetPlatform && chatPlatformOptions.includes(data.conversation.targetPlatform)) {
          setTargetPlatform(data.conversation.targetPlatform);
        }
      })
      .catch((historyError) => {
        if (!cancelled) {
          setError(getFriendlyError(historyError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationIdFromUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      block: "end"
    });
  }, [messages.length, activeJob?.id, activeJob?.status, activeJob?.partialResult, activeJobRunning, elapsedSeconds]);

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
          request: merged[job.id]?.request,
          steps: mergeJobSteps(merged[job.id]?.steps, job.steps)
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
      setUploadedFile(await uploadCodeFile(file));
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

    const messageContent = prompt.trim();

    if (!messageContent && !uploadedFile) {
      return;
    }

    if (uploadedFile?.scanStatus === "BLOCKED") {
      return;
    }

    const clientRequestId = createClientRequestId("strategy");
    const optimisticUserContent = messageContent || (uploadedFile ? `已上传文件：${uploadedFile.originalName}` : "已上传文件输入");
    const currentConversationId = conversation?.id ?? conversationIdFromUrl ?? undefined;
    const conversationKeyAtSubmit = currentConversationId ?? DRAFT_CONVERSATION_KEY;
    const request: StrategyJobRequest = {
      conversationKey: conversationKeyAtSubmit,
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
          inputFileId: uploadedFile?.fileId ?? null,
          inputFileName: uploadedFile?.originalName ?? null
        },
        attachments: uploadedFile ? [uploadedFileToMessageAttachment(uploadedFile, `local-attachment-${clientRequestId}`)] : [],
        createdAt: new Date().toISOString()
      }
    ]);
    setPrompt("");
    setUploadError("");

    try {
      const data = await createAiTask({
        type: "strategy_generation",
        conversationId: currentConversationId,
        messageContent: optimisticUserContent,
        targetPlatform,
        prompt: optimisticUserContent,
        inputFileId: uploadedFile?.fileId,
        clientRequestId
      });
      setUploadedFile(null);

      if (canceledLocalJobIdsRef.current.has(localJob.id)) {
        canceledLocalJobIdsRef.current.delete(localJob.id);

        try {
          const canceledData = await cancelAiTask(data.task.id);
          applyConversationPayload(canceledData, {
            localJobId: localJob.id,
            sourceConversationKey: conversationKeyAtSubmit,
            request
          });
        } catch (cancelError) {
          applyConversationPayload(data, {
            localJobId: localJob.id,
            sourceConversationKey: conversationKeyAtSubmit,
            request
          });
          startPollingJob(data.task.id, data.conversation?.id ?? data.task.conversationId ?? conversationKeyAtSubmit);
          setError(getFriendlyError(cancelError));
        }

        window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
        return;
      }

      applyConversationPayload(data, {
        localJobId: localJob.id,
        sourceConversationKey: conversationKeyAtSubmit,
        request
      });
      startPollingJob(data.task.id, data.conversation?.id ?? data.task.conversationId ?? conversationKeyAtSubmit);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
    } catch (submitError) {
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
          finishedAt: new Date().toISOString(),
          steps: markJobSteps(localJob.steps, "failed")
        }
      }));
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
    const nextJob = createStrategyJobFromTask(data.task, {
      conversationId: responseConversationId,
      result: data.result,
      previous: previousJob,
      request: options.request ?? previousJob?.request
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
        request: options.request ?? existing?.request,
        steps: mergeJobSteps(existing?.steps, nextJob.steps)
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
      const serverMessages = data.messages.map(toStrategyMessage);
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
            content: result.explanation || "已完成策略生成。",
            contentJson: {
              task: data.task,
              result,
              visibleSteps: buildClientVisibleSteps({
                targetPlatform: data.task.targetPlatform ?? targetPlatform,
                hasConversation: Boolean(data.task.conversationId),
                hasFile: Boolean(data.task.inputFileId)
              })
            },
            createdAt: data.task.finishedAt ?? new Date().toISOString()
          })
      ]);
    }
  }

  function startPollingJob(jobId: string, sourceConversationKey: string) {
    if (pollingJobsRef.current.has(jobId)) {
      return;
    }

    pollingJobsRef.current.add(jobId);

    void (async () => {
      const startedAt = Date.now();

      try {
        while (Date.now() - startedAt < AI_TASK_POLL_TIMEOUT_MS) {
          await delay(AI_TASK_POLL_INTERVAL_MS);
          const next = await fetchAiTaskResult(jobId);
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
              finishedAt: new Date().toISOString(),
              steps: markJobSteps(job.steps, "failed")
            }
          };
        });
      } catch {
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
              finishedAt: new Date().toISOString(),
              steps: markJobSteps(job.steps, "failed")
            }
          };
        });
      } finally {
        pollingJobsRef.current.delete(jobId);
      }
    })();
  }

  async function handleCancelJob(job: StrategyJob) {
    if (!isJobActive(job)) {
      return;
    }

    if (!job.task) {
      canceledLocalJobIdsRef.current.add(job.id);
      setJobsById((current) => ({
        ...current,
        [job.id]: {
          ...job,
          status: "canceled",
          error: "任务已取消",
          finishedAt: new Date().toISOString(),
          steps: markJobSteps(job.steps, "canceled")
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

    const clientRequestId = createClientRequestId("strategy-retry");
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

    try {
      const data = job.task
        ? await retryAiTask(job.id, clientRequestId)
        : await createAiTask({
            type: "strategy_generation",
            conversationId: sourceConversationKey === DRAFT_CONVERSATION_KEY ? undefined : sourceConversationKey,
            messageContent: retryRequest.messageContent,
            targetPlatform: retryRequest.targetPlatform,
            prompt: retryRequest.prompt,
            inputFileId: retryRequest.inputFileId,
            clientRequestId
          });

      if (canceledLocalJobIdsRef.current.has(localJob.id)) {
        canceledLocalJobIdsRef.current.delete(localJob.id);

        try {
          const canceledData = await cancelAiTask(data.task.id);
          applyConversationPayload(canceledData, {
            localJobId: localJob.id,
            sourceConversationKey,
            request: retryRequest
          });
        } catch (cancelError) {
          applyConversationPayload(data, {
            localJobId: localJob.id,
            sourceConversationKey,
            request: retryRequest
          });
          startPollingJob(data.task.id, data.conversation?.id ?? data.task.conversationId ?? sourceConversationKey);
          setError(getFriendlyError(cancelError));
        }

        window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
        return;
      }

      applyConversationPayload(data, {
        localJobId: localJob.id,
        sourceConversationKey,
        request: retryRequest
      });
      startPollingJob(data.task.id, data.conversation?.id ?? data.task.conversationId ?? sourceConversationKey);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
    } catch (retryError) {
      canceledLocalJobIdsRef.current.delete(localJob.id);
      const friendly = getFriendlyError(retryError);
      setError(friendly);
      setJobsById((current) => ({
        ...current,
        [localJob.id]: {
          ...localJob,
          status: "failed",
          error: friendly,
          finishedAt: new Date().toISOString(),
          steps: markJobSteps(localJob.steps, "failed")
        }
      }));
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

  const hasInlineError = messages.some((message) => message.localStatus === "error" || Boolean(getMessageError(message)));

  return (
    <section className="lq-strategy-page">
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

        <div className="lq-strategy-thread">
          <div className="lq-message-stack">
            {!conversation && messages.length === 0 ? (
              <ChatBubble role="assistant" text={historyLoading ? "正在载入会话..." : "请输入策略需求，我会保留上下文，后续可继续追问或修改上一轮策略。"} />
            ) : null}
            {messages.map((message) => (
              <StrategyMessageBubble elapsedSeconds={message.localStatus === "pending" ? elapsedSeconds : undefined} key={message.id} message={message} />
            ))}
            {activeJob && shouldRenderStrategyJobPanel(activeJob, messages) ? (
              <StrategyJobBubble
                elapsedSeconds={elapsedSeconds}
                job={activeJob}
                onCancel={() => void handleCancelJob(activeJob)}
                onRetry={() => void handleRetryJob(activeJob)}
              />
            ) : null}
            {error && !hasInlineError ? (
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
                上传策略/日志/图片
              </button>
              <input accept=".py,.txt,.log,.md,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
              <div className="lq-composer-actions">
                <div className="lq-cost-pill">
                  <DollarSign aria-hidden="true" />
                  <span>每次策略生成消耗 50 积分</span>
                </div>
                <button
                  className="lq-primary-btn"
                  disabled={activeJobRunning || (!prompt.trim() && !uploadedFile) || uploadedFile?.scanStatus === "BLOCKED"}
                  onClick={handleSubmit}
                  type="button"
                >
                  {activeJobRunning ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Send aria-hidden="true" size={18} />}
                  {activeJobRunning ? `${activeJob?.status === "queued" ? "排队中" : "处理中"} ${elapsedSeconds}s` : "发送"}
                </button>
              </div>
            </div>
            <FileUploadStatus file={uploadedFile} message={uploadError} />
          </div>
          <p className="lq-risk">AI 生成策略需自行回测验证，投资有风险，请谨慎使用。</p>
        </div>
      </section>
    </section>
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
  const [activeTab, setActiveTab] = useState<(typeof conversionTabs)[number]>(conversionTabs[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedCodeFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationIdFromUrl = searchParams.get("conversationId");
  const elapsedSeconds = useElapsedSeconds(loading);

  useEffect(() => {
    if (!conversationIdFromUrl) {
      return;
    }

    let cancelled = false;
    setError("");

    fetchAiConversationMessages(conversationIdFromUrl, {
      limit: 20,
      taskLimit: 1,
      includeTaskResults: "latest"
    })
      .then((conversationData) => {
        if (cancelled) {
          return;
        }

        if (conversationData.conversation.mode !== "convert") {
          throw new Error("VALIDATION_ERROR:当前会话不属于代码转换模块");
        }

        const restored = restoreConversionConversation(conversationData);

        if (restored.sourcePlatform && convertPlatforms.source.includes(restored.sourcePlatform)) {
          setSourcePlatform(restored.sourcePlatform);
        }

        if (restored.targetPlatform && convertPlatforms.target.includes(restored.targetPlatform)) {
          setTargetPlatform(restored.targetPlatform);
        }

        setPrompt(restored.prompt ?? "");
        setInputCode(formatRestoredInputText(restored.inputCodePreview, restored.inputFileName));
        setUploadedFile(createRestoredUploadedFile(restored));
        setTaskData(restored.taskData);
        setActiveTab(conversionTabs[0]);
      })
      .catch((historyError) => {
        if (!cancelled) {
          setError(getFriendlyError(historyError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationIdFromUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      setUploadedFile(await uploadCodeFile(file));
    } catch (uploadErrorValue) {
      setUploadedFile(null);
      setUploadError(getFileUploadFriendlyError(uploadErrorValue));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const currentConversationId = taskData?.conversation?.id ?? conversationIdFromUrl ?? undefined;
      const data = await createAiTask({
        type: "code_conversion",
        conversationId: currentConversationId,
        sourcePlatform,
        targetPlatform,
        inputCode,
        prompt,
        inputFileId: uploadedFile?.fileId,
        clientRequestId: createClientRequestId("convert")
      });

      setTaskData(data);
      setActiveTab(conversionTabs[0]);
      replaceWithConversationUrl(router, "convert", conversationIdFromUrl, data.conversation?.id ?? data.task.conversationId ?? null);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      const completed = await waitForAiTaskResult(data, setTaskData);
      setTaskData(completed);
      replaceWithConversationUrl(router, "convert", conversationIdFromUrl, completed.conversation?.id ?? completed.task.conversationId ?? null);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (submitError) {
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      setError(getFriendlyError(submitError));
    } finally {
      setLoading(false);
    }
  }

  const result = taskData?.result;
  const panelContent = getConversionTabContent(activeTab, result);
  const shouldShowTaskProgress = !panelContent && (loading || Boolean(taskData && taskData.task.status !== "SUCCEEDED"));
  const conversionInputChars = inputCode.length + prompt.length;

  return (
    <section className="min-h-full">
      <section className="lq-title-block">
        <h1>平台代码转换</h1>
        <p>将不同量化平台的策略代码转换为目标平台可读、可改、可验证的版本</p>
      </section>

      <section className="lq-workbench is-compact">
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
                  上传 .py/.txt/.log/.md/图片
                </button>
                <input accept=".py,.txt,.log,.md,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
              </div>
              <FileUploadStatus file={uploadedFile} message={uploadError} />
              <textarea
                className="lq-textarea lq-code-input"
                onChange={(event) => setInputCode(event.target.value)}
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
              <div className="lq-tabs">
                {conversionTabs.map((tab) => (
                  <button className={`lq-tab ${tab === activeTab ? "is-active" : ""}`} key={tab} onClick={() => setActiveTab(tab)} type="button">
                    {tab}
                  </button>
                ))}
              </div>
              <div className="lq-code-preview app-scrollbar">
                <div className="lq-code-lines">{Array.from({ length: 10 }, (_, index) => <div key={index}>{index + 1}</div>)}</div>
                {panelContent ? (
                  <pre className="m-0 whitespace-pre-wrap text-[#c8d5ea]">
                    <code>{panelContent}</code>
                  </pre>
                ) : shouldShowTaskProgress ? (
                  <AiTaskProgressPanel
                    elapsedSeconds={elapsedSeconds}
                    errorCode={taskData?.task.errorCode}
                    inputChars={conversionInputChars}
                    progress={taskData?.task.progress}
                    status={taskData?.task.status ?? (loading ? "RUNNING" : "PENDING")}
                    taskType="code_conversion"
                    tone="dark"
                  />
                ) : (
                  <div className="lq-result-placeholder">
                    <BotIcon />
                    <span>{loading ? getAiWaitMessage("正在转换策略代码", elapsedSeconds) : "转换结果将在这里显示"}</span>
                  </div>
                )}
              </div>
            </div>
            {result && taskData?.task ? <AiTaskCompletionSummary progress={taskData.task.progress} task={taskData.task} /> : null}
            {result ? <ResultNotes migrationNotes={result.migrationNotes} riskWarnings={result.riskWarnings} /> : null}
            {error ? <ErrorPanel message={error} /> : null}
          </div>
        </div>

        <div className="lq-actions">
          <div className="lq-actions-left">
            <button
              className="lq-primary-btn"
              disabled={loading || (!inputCode.trim() && !uploadedFile) || uploadedFile?.scanStatus === "BLOCKED"}
              onClick={handleSubmit}
              type="button"
            >
              {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
              {loading ? `转换中 ${elapsedSeconds}s` : "开始转换"}
            </button>
            <button
              className="lq-secondary-btn"
              onClick={() => {
                setInputCode("");
                setPrompt("");
                setTaskData(null);
                setError("");
                setUploadedFile(null);
                setUploadError("");
                setActiveTab(conversionTabs[0]);
              }}
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
    </section>
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
        <div className="lq-user-bubble">
          <p>{text}</p>
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
        <div>
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
  const visibleSteps = getMessageVisibleSteps(message, task);
  const status = message.localStatus === "pending" ? "running" : message.localStatus === "error" || error ? "failed" : result ? "succeeded" : "idle";

  return (
    <div className="lq-assistant-row">
      <div className={`lq-assistant-message ${status === "failed" ? "is-error" : ""}`}>
        {status !== "idle" ? <AgentWorkLog elapsedSeconds={elapsedSeconds} status={status} steps={visibleSteps} task={task} /> : null}
        {status === "failed" ? <ErrorPanel message={error?.message ?? message.content} /> : null}
        {result ? <StrategyAssistantResult result={result} task={task} /> : null}
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
  const [expanded, setExpanded] = useState(isJobActive(job));
  const running = isJobActive(job);
  const failed = job.status === "failed";
  const canceled = job.status === "canceled";
  const completed = job.status === "completed";
  const summary = getStrategyJobSummary(job, elapsedSeconds);

  useEffect(() => {
    if (running) {
      setExpanded(true);
    }
  }, [running, job.id]);

  return (
    <div className="lq-assistant-row">
      <div className={`lq-assistant-message ${failed || canceled ? "is-error" : ""}`}>
        <div className={`lq-agent-log ${running ? "is-running" : ""}`}>
          <button className="lq-agent-log-summary" onClick={() => setExpanded((value) => !value)} type="button">
            {expanded ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
            <span>{summary}</span>
          </button>
          {expanded ? (
            <ol className="lq-agent-steps">
              {job.steps.map((step, index) => (
                <li className={step.status === "running" ? "is-active" : step.status === "failed" ? "is-failed" : ""} key={step.id}>
                  <span>{index + 1}</span>
                  <p>{step.title}{step.detail ? ` · ${step.detail}` : ""}</p>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="lq-job-actions">
            {running ? (
              <button className="lq-job-action" onClick={onCancel} type="button">
                <Trash2 aria-hidden="true" size={15} />
                取消任务
              </button>
            ) : null}
            {failed || canceled ? (
              <button className="lq-job-action is-primary" onClick={onRetry} type="button">
                <ArrowRight aria-hidden="true" size={15} />
                重试
              </button>
            ) : null}
          </div>
        </div>

        {job.error ? <ErrorPanel message={job.error} /> : null}
        {completed && job.result ? <StrategyAssistantResult result={job.result} task={job.task ?? null} /> : null}
      </div>
    </div>
  );
}

function AgentWorkLog({
  elapsedSeconds,
  status,
  steps,
  task
}: {
  elapsedSeconds?: number;
  status: "running" | "succeeded" | "failed" | "idle";
  steps: string[];
  task: AiTaskData["task"] | null;
}) {
  const [expanded, setExpanded] = useState(status === "running");
  const runningElapsed = Math.max(1, elapsedSeconds ?? 0);
  const displaySteps = status === "running" ? steps.slice(0, Math.min(steps.length, Math.max(1, Math.floor(runningElapsed / 2) + 1))) : steps;
  const duration = status === "running" ? formatElapsed(runningElapsed) : formatTaskDuration(task, elapsedSeconds);
  const summary = status === "running"
    ? `LightQuant 正在处理 · ${duration}`
    : status === "failed"
      ? `处理失败 · 用时 ${duration}`
      : `已完成 · 用时 ${duration} · 查看处理过程`;

  return (
    <div className={`lq-agent-log ${status === "running" ? "is-running" : ""}`}>
      <button className="lq-agent-log-summary" onClick={() => setExpanded((value) => !value)} type="button">
        {expanded ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
        <span>{summary}</span>
      </button>
      {expanded ? (
        <ol className="lq-agent-steps">
          {displaySteps.map((step, index) => (
            <li className={index === displaySteps.length - 1 && status === "running" ? "is-active" : ""} key={`${step}-${index}`}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function StrategyAssistantResult({ result, task }: { result: NonNullable<AiTaskData["result"]>; task: AiTaskData["task"] | null }) {
  const outOfScope = result.scopeStatus === "out_of_scope";

  return (
    <div className="lq-assistant-answer">
      <div className="lq-answer-head">
        <h2>{outOfScope ? "模块范围提示" : "策略生成结果"}</h2>
        {task ? <span className="lq-cost-tag">已扣除 {task.costPoints} 积分</span> : null}
      </div>
      {result.explanation ? <RichTextWithCodeBlocks content={result.explanation} textClassName="lq-answer-text" /> : null}
      {result.generatedCode ? <CopyableCodeBlock code={result.generatedCode} /> : null}
      {result.migrationNotes ? <RichTextWithCodeBlocks content={result.migrationNotes} textClassName="lq-answer-note" /> : null}
      {!outOfScope ? <p className="lq-answer-footnote">结果仅供研究和回测参考，实盘前请自行验证。</p> : null}
    </div>
  );
}

function StrategyResult({ data }: { data: AiTaskData }) {
  const result = data.result;

  if (!result) {
    return null;
  }

  const outOfScope = result.scopeStatus === "out_of_scope";

  return (
    <div className="lq-result-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2>{outOfScope ? "模块范围提示" : "策略生成结果"}</h2>
        <span className="lq-cost-tag">已扣除 {data.task.costPoints} 积分</span>
      </div>
      {result.explanation ? <RichTextWithCodeBlocks content={result.explanation} textClassName="m-0 text-sm leading-7 text-[#5b6472]" /> : null}
      {result.generatedCode ? <CopyableCodeBlock code={result.generatedCode} /> : null}
      <p className="lq-answer-footnote">结果仅供研究和回测参考，实盘前请自行验证。</p>
    </div>
  );
}

function RichTextWithCodeBlocks({ content, textClassName }: { content: string; textClassName: string }) {
  const parts = parseMarkdownCodeBlocks(content);

  return (
    <>
      {parts.map((part, index) => part.type === "code"
        ? <CopyableCodeBlock code={part.code} key={`code-${index}`} language={part.language} />
        : <p className={textClassName} key={`text-${index}`}>{part.text}</p>)}
    </>
  );
}

function CopyableCodeBlock({ code, language }: { code: string; language?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    const ok = await copyTextToClipboard(code);

    setCopyState(ok ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div className="lq-code-block-shell">
      <div className="lq-code-block-toolbar">
        {language ? <span className="lq-code-language">{language}</span> : null}
        <button aria-label="复制代码" className={`lq-copy-code ${copyState === "failed" ? "is-error" : ""}`} onClick={handleCopy} type="button">
          {copyState === "copied" ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
          <span>{copyState === "copied" ? "已复制" : copyState === "failed" ? "复制失败" : "复制"}</span>
        </button>
      </div>
      <pre className="lq-code-block app-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ResultNotes({ migrationNotes, riskWarnings }: { migrationNotes?: string | null; riskWarnings: string[] }) {
  if (!migrationNotes && riskWarnings.length === 0) {
    return null;
  }

  return (
    <div className="lq-notes-card">
      {migrationNotes ? <p className="mb-2 mt-0 text-[#111827]">{migrationNotes}</p> : null}
      {riskWarnings.length > 0 ? (
        <ul className="m-0 grid gap-2 p-0">
          {riskWarnings.map((warning) => (
            <li className="flex gap-2" key={warning}>
              <AlertTriangle aria-hidden="true" className="mt-[2px] flex-shrink-0 text-[#d92d20]" size={16} />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FileUploadStatus({ file, message }: { file: UploadedCodeFile | null; message: string }) {
  if (!file && !message) {
    return null;
  }

  if (message) {
    return <div className="lq-file-status is-error">{message}</div>;
  }

  if (!file) {
    return null;
  }

  const blocked = file.scanStatus === "BLOCKED";
  const StatusIcon: LucideIcon = blocked ? Ban : file.scanStatus === "WARNING" ? AlertTriangle : CheckCircle2;
  const isImage = isImageFile(file);

  return (
    <div className={`lq-file-status ${blocked ? "is-blocked" : ""}`}>
      {isImage && file.thumbnailUrl ? (
        <img alt={file.originalName} className="mb-2 h-20 w-full max-w-[220px] rounded-[8px] border border-[#e5e7eb] object-cover" src={file.thumbnailUrl} />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <StatusIcon aria-hidden="true" size={16} />
        <span>{file.originalName}</span>
        <span>{getScanStatusText(file)}</span>
      </div>
      {file.contentPreview ? <div className="mt-1 line-clamp-2 break-words text-xs">{file.contentPreview}</div> : null}
      {file.riskFlags.length > 0 ? <div className="mt-1 break-words">风险标记：{file.riskFlags.join("、")}</div> : null}
    </div>
  );
}

function MessageAttachmentList({ align = "left", attachments }: { align?: "left" | "right"; attachments: MessageAttachmentData[] }) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={`mt-2 grid gap-2 ${align === "right" ? "justify-items-end" : ""}`}>
      {attachments.map((attachment) => (
        <AttachmentPreviewCard attachment={attachment} key={attachment.id} />
      ))}
    </div>
  );
}

function AttachmentPreviewCard({ attachment }: { attachment: MessageAttachmentData }) {
  const file = attachment.file;
  const kind = attachment.kind ?? file.kind ?? (file.mimeType.startsWith("image/") ? "image" : null);
  const thumbnailUrl = attachment.thumbnailUrl ?? file.thumbnailUrl ?? null;
  const blocked = file.scanStatus === "BLOCKED";
  const StatusIcon: LucideIcon = blocked ? Ban : file.scanStatus === "WARNING" ? AlertTriangle : kind === "image" ? ImageIcon : Paperclip;

  return (
    <div className={`lq-file-status max-w-[360px] ${blocked ? "is-blocked" : ""}`}>
      {kind === "image" && thumbnailUrl ? (
        <img alt={file.originalName} className="mb-2 h-24 w-full rounded-[8px] border border-[#e5e7eb] object-cover" src={thumbnailUrl} />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <StatusIcon aria-hidden="true" size={16} />
        <span>{file.originalName}</span>
        <span>{formatFileSize(file.sizeBytes)}</span>
        <span>{getAttachmentScanText(attachment)}</span>
      </div>
      {file.contentPreview ? <div className="mt-1 line-clamp-2 break-words text-xs">{file.contentPreview}</div> : null}
      {file.riskFlags.length > 0 ? <div className="mt-1 break-words">风险标记：{file.riskFlags.join("、")}</div> : null}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return <div className="lq-error-panel">{message}</div>;
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

function getConversionTabContent(tab: (typeof conversionTabs)[number], result: AiTaskData["result"] | undefined) {
  if (!result) {
    return "";
  }

  if (tab === "迁移说明") {
    return result.migrationNotes ?? result.explanation ?? "";
  }

  if (tab === "风险提醒") {
    return result.riskWarnings.length > 0 ? result.riskWarnings.map((warning) => `- ${warning}`).join("\n") : "暂未识别到明显风险。";
  }

  return result.generatedCode ?? result.explanation ?? "";
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
    steps: createStrategyJobSteps({
      hasConversation: input.conversationId !== DRAFT_CONVERSATION_KEY,
      hasFile: Boolean(input.request.inputFileId),
      targetPlatform: input.request.targetPlatform,
      status: "pending",
      updatedAt: input.createdAt
    }),
    createdAt: input.createdAt,
    request: input.request
  };
}

function createStrategyJobFromTask(
  task: AiTaskData["task"],
  input: {
    conversationId: string;
    result?: AiTaskData["result"];
    previous?: StrategyJob;
    request?: StrategyJobRequest;
  }
): StrategyJob {
  const status = mapTaskStatusToJobStatus(task.status, input.result);
  const createdAt = task.createdAt ?? input.previous?.createdAt ?? new Date().toISOString();
  const resultText = input.result ? [input.result.explanation, input.result.generatedCode, input.result.migrationNotes].filter(Boolean).join("\n\n") : undefined;

  return {
    id: task.id,
    conversationId: input.conversationId,
    status,
    steps: createStrategyJobSteps({
      hasConversation: Boolean(task.conversationId),
      hasFile: Boolean(task.inputFileId),
      targetPlatform: task.targetPlatform ?? input.request?.targetPlatform ?? "",
      status,
      progress: task.progress,
      error: task.errorMessage ?? undefined,
      updatedAt: task.updatedAt ?? new Date().toISOString()
    }),
    partialResult: status === "streaming" ? resultText : input.previous?.partialResult,
    finalResult: status === "completed" ? resultText : input.previous?.finalResult,
    error: status === "failed" || status === "canceled" ? task.errorMessage ?? input.previous?.error ?? "任务处理失败" : undefined,
    createdAt,
    startedAt: task.startedAt ?? input.previous?.startedAt ?? undefined,
    finishedAt: task.finishedAt ?? input.previous?.finishedAt ?? undefined,
    task,
    result: input.result ?? input.previous?.result,
    request: input.request ?? input.previous?.request
  };
}

function createStrategyJobSteps(input: {
  hasConversation: boolean;
  hasFile: boolean;
  targetPlatform: string;
  status: JobStatus;
  progress?: AiTaskProgress | null;
  error?: string;
  updatedAt?: string;
}) {
  const steps: Array<Omit<StrategyJobStep, "status">> = [
    {
      id: "read_input",
      title: input.hasFile ? "读取上传策略文件" : "读取本轮策略需求"
    },
    ...(input.hasConversation
      ? [{
          id: "load_context",
          title: "载入当前会话上下文"
        }]
      : []),
    {
      id: "detect_platform",
      title: input.targetPlatform ? `识别目标平台：${input.targetPlatform}` : "识别目标平台"
    },
    ...(input.hasFile
      ? [{
          id: "check_code",
          title: "检查上传代码与错误信息"
        }]
      : []),
    {
      id: "match_rules",
      title: "匹配平台兼容规则"
    },
    {
      id: "generate_plan",
      title: "生成策略修改方案"
    },
    {
      id: "finalize",
      title: "整理最终结果"
    }
  ];
  const activeIndex = getStrategyJobActiveStepIndex(input.status, input.progress, steps.length);

  return steps.map((step, index) => ({
    ...step,
    detail: input.status === "failed" && index === activeIndex ? input.error : undefined,
    status: getStrategyStepStatus(index, activeIndex, input.status),
    updatedAt: input.updatedAt
  }));
}

function getStrategyJobActiveStepIndex(status: JobStatus, progress: AiTaskProgress | null | undefined, stepCount: number) {
  if (status === "completed") {
    return stepCount;
  }

  if (status === "failed" || status === "canceled") {
    return Math.min(stepCount - 1, Math.max(0, Math.floor(((progress?.progressPercent ?? 55) / 100) * stepCount)));
  }

  if (status === "pending" || status === "queued") {
    return 0;
  }

  const percent = progress?.progressPercent ?? 42;
  return Math.min(stepCount - 1, Math.max(1, Math.floor((percent / 100) * stepCount)));
}

function getStrategyStepStatus(index: number, activeIndex: number, jobStatus: JobStatus): StrategyJobStep["status"] {
  if (jobStatus === "completed" || index < activeIndex) {
    return "completed";
  }

  if ((jobStatus === "failed" || jobStatus === "canceled") && index === activeIndex) {
    return "failed";
  }

  if ((jobStatus === "pending" || jobStatus === "queued" || jobStatus === "running" || jobStatus === "streaming") && index === activeIndex) {
    return "running";
  }

  return "pending";
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

function mergeJobSteps(previous: StrategyJobStep[] | undefined, next: StrategyJobStep[]) {
  if (!previous?.length) {
    return next;
  }

  return next.map((step) => {
    const oldStep = previous.find((item) => item.id === step.id);

    if (!oldStep) {
      return step;
    }

    if (oldStep.status === "completed" && step.status === "pending") {
      return {
        ...step,
        status: "completed" as const,
        updatedAt: oldStep.updatedAt
      };
    }

    return step;
  });
}

function markJobSteps(steps: StrategyJobStep[], status: "failed" | "canceled") {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.status === "running"));
  const failedIndex = activeIndex >= 0 ? activeIndex : 0;

  return steps.map((step, index) => ({
    ...step,
    status: index < failedIndex ? "completed" as const : index === failedIndex ? "failed" as const : "pending" as const,
    detail: index === failedIndex ? (status === "canceled" ? "任务已取消" : step.detail) : step.detail,
    updatedAt: new Date().toISOString()
  }));
}

function isJobActive(job: StrategyJob) {
  return job.status === "pending" || job.status === "queued" || job.status === "running" || job.status === "streaming";
}

function isJobTerminal(job: StrategyJob) {
  return job.status === "completed" || job.status === "failed" || job.status === "canceled";
}

function shouldRenderStrategyJobPanel(job: StrategyJob, messages: StrategyChatMessage[]) {
  if (isJobActive(job) || job.status === "failed" || job.status === "canceled") {
    return true;
  }

  return job.status === "completed" && !hasAssistantMessageForTask(messages, job.id);
}

function hasAssistantMessageForTask(messages: Array<Pick<AiMessageData, "role" | "taskId">>, taskId: string) {
  return messages.some((message) => message.role === "assistant" && message.taskId === taskId);
}

function isSameConversationKey(current: string, source: string, response: string) {
  return current === source || current === response || (current === DRAFT_CONVERSATION_KEY && source === DRAFT_CONVERSATION_KEY);
}

function getStrategyJobSummary(job: StrategyJob, elapsedSeconds: number) {
  if (job.status === "completed") {
    return `已完成 · 用时 ${formatTaskDuration(job.task ?? null, elapsedSeconds)} · 查看处理过程`;
  }

  if (job.status === "failed") {
    return `处理失败 · 用时 ${formatTaskDuration(job.task ?? null, elapsedSeconds)}`;
  }

  if (job.status === "canceled") {
    return `已取消 · 用时 ${formatTaskDuration(job.task ?? null, elapsedSeconds)}`;
  }

  if (job.status === "queued" || job.status === "pending") {
    return `任务排队中 · ${formatElapsed(elapsedSeconds)}`;
  }

  return `LightQuant 正在处理 · ${formatElapsed(elapsedSeconds)}`;
}

function toStrategyMessage(message: AiMessageData): StrategyChatMessage {
  return {
    ...message
  };
}

function getMessageTask(message: StrategyChatMessage): AiTaskData["task"] | null {
  const task = readRecord(message.contentJson?.task);

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
    finishedAt: typeof task.finishedAt === "string" ? task.finishedAt : null
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

function getMessageVisibleSteps(message: StrategyChatMessage, task: AiTaskData["task"] | null) {
  const fromMessage = readStringArray(message.contentJson?.visibleSteps);

  if (message.visibleSteps?.length) {
    return message.visibleSteps;
  }

  if (fromMessage.length) {
    return fromMessage;
  }

  return buildClientVisibleSteps({
    targetPlatform: task?.targetPlatform ?? "",
    hasConversation: Boolean(task?.conversationId || message.conversationId),
    hasFile: Boolean(task?.inputFileId)
  });
}

function buildClientVisibleSteps(input: { targetPlatform: string; hasConversation: boolean; hasFile: boolean }) {
  return [
    "读取本轮需求",
    input.hasConversation ? "载入上一轮对话记忆" : "",
    input.targetPlatform ? `识别目标平台：${input.targetPlatform}` : "识别目标平台",
    input.hasFile ? "检查上传代码与错误信息" : "",
    "匹配平台兼容规则",
    "生成策略修改方案",
    "整理最终结果"
  ].filter(Boolean);
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function formatTaskDuration(task: AiTaskData["task"] | null, fallbackSeconds?: number) {
  if (task?.startedAt && task.finishedAt) {
    const startedAt = new Date(task.startedAt).getTime();
    const finishedAt = new Date(task.finishedAt).getTime();

    if (Number.isFinite(startedAt) && Number.isFinite(finishedAt) && finishedAt >= startedAt) {
      return `${Math.max(1, Math.round((finishedAt - startedAt) / 1000))} 秒`;
    }
  }

  return `${Math.max(1, Math.round(fallbackSeconds ?? 1))} 秒`;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

type RestoredTaskSnapshot = {
  sourcePlatform: string | null;
  targetPlatform: string | null;
  prompt: string | null;
  inputCodePreview: string | null;
  inputFileId: string | null;
  inputFileName: string | null;
  inputAttachment: MessageAttachmentData | null;
  taskData: AiTaskData | null;
};

function restoreConversionConversation(data: AiConversationMessagesData): RestoredTaskSnapshot {
  const input = getLatestUserInputSnapshot(data.messages, "code_conversion");
  const taskData = getLatestTaskDataFromMessages(data.messages, "code_conversion")
    ?? getLatestTaskDataFromTasks(data.tasks ?? [], "code_conversion", data.conversation);

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

function getLatestUserInputSnapshot(messages: AiMessageData[], taskType: string) {
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

function getLatestTaskDataFromMessages(messages: AiMessageData[], taskType: string): AiTaskData | null {
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
      conversation: null,
      messages
    };
  }

  return null;
}

function getLatestTaskDataFromTasks(tasks: AiTaskData["task"][], taskType: string, conversation: AiConversationData): AiTaskData | null {
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

function readTaskSnapshot(value: unknown): AiTaskData["task"] | null {
  const task = readRecord(value);

  if (!task || typeof task.id !== "string") {
    return null;
  }

  return {
    id: task.id,
    type: typeof task.type === "string" ? task.type : "",
    status: typeof task.status === "string" ? task.status : "SUCCEEDED",
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
    progress: readRecord(task.progress) as AiTaskProgress | null
  };
}

function readAiTaskResult(value: unknown): AiTaskData["result"] | null {
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

function getMessageAttachments(message: AiMessageData) {
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

function normalizeMessageAttachments(message: AiMessageData): MessageAttachmentData[] {
  return Array.isArray(message.attachments) ? message.attachments : [];
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

function getAttachmentScanText(attachment: MessageAttachmentData) {
  if (attachment.file.scanStatus === "BLOCKED") {
    return "已阻断";
  }

  if (attachment.file.scanStatus === "WARNING") {
    return "风险提醒";
  }

  return "校验通过";
}

function formatFileSize(sizeBytes: number) {
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

function isImageFile(file: Pick<UploadedCodeFile, "kind" | "mimeType" | "ext">) {
  return file.kind === "image" || file.mimeType.startsWith("image/") || isImageExtension(file.ext);
}

function isImageExtension(ext: string) {
  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext.toLowerCase());
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function createRestoredUploadedFile(snapshot: Pick<RestoredTaskSnapshot, "inputFileId" | "inputFileName" | "inputCodePreview" | "inputAttachment">): UploadedCodeFile | null {
  if (snapshot.inputAttachment) {
    return attachmentToUploadedFile(snapshot.inputAttachment);
  }

  if (!snapshot.inputFileId || !snapshot.inputFileName) {
    return null;
  }

  const ext = snapshot.inputFileName.includes(".") ? `.${snapshot.inputFileName.split(".").pop() ?? "txt"}` : ".txt";

  return {
    fileId: snapshot.inputFileId,
    kind: isImageExtension(ext) ? "image" : "text",
    originalName: snapshot.inputFileName,
    ext,
    mimeType: isImageExtension(ext) ? `image/${ext === ".jpg" ? "jpeg" : ext.slice(1)}` : "text/plain",
    sizeBytes: 0,
    sha256: "",
    contentPreview: snapshot.inputCodePreview ?? "",
    scanStatus: "PASSED",
    riskFlags: [],
    hasThumbnail: isImageExtension(ext),
    thumbnailUrl: isImageExtension(ext) ? `/api/v1/files/${encodeURIComponent(snapshot.inputFileId)}/thumbnail` : null,
    previewUrl: isImageExtension(ext) ? `/api/v1/files/${encodeURIComponent(snapshot.inputFileId)}/preview` : null,
    createdAt: ""
  };
}

function attachmentToUploadedFile(attachment: MessageAttachmentData): UploadedCodeFile {
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

function uploadedFileToMessageAttachment(file: UploadedCodeFile, id: string): MessageAttachmentData {
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

function formatRestoredInputText(inputCodePreview: string | null, inputFileName: string | null) {
  if (inputCodePreview) {
    return `历史输入摘要：\n${inputCodePreview}`;
  }

  return inputFileName ? `历史文件：${inputFileName}` : "";
}

function replaceWithConversationUrl(
  router: ReturnType<typeof useRouter>,
  mode: "strategy" | "convert",
  currentConversationId: string | null,
  nextConversationId: string | null
) {
  if (!nextConversationId || nextConversationId === currentConversationId) {
    return;
  }

  router.replace(`/chat?mode=${mode}&conversationId=${encodeURIComponent(nextConversationId)}`, {
    scroll: false
  });
}

async function fetchAiConversationMessages(conversationId: string, options: {
  limit?: number;
  taskLimit?: number;
  includeTaskResults?: "none" | "latest" | "all";
} = {}) {
  const params = new URLSearchParams();

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
    cache: "no-store"
  });
  const payload = (await response.json()) as ApiResponse<AiConversationMessagesData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

async function createAiTask(input: {
  type: "strategy_generation" | "code_conversion";
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

async function fetchAiTaskResult(taskId: string) {
  const response = await fetch(`/api/v1/ai/tasks/${encodeURIComponent(taskId)}/result`, {
    cache: "no-store"
  });
  const payload = (await response.json()) as ApiResponse<AiTaskData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

async function cancelAiTask(taskId: string) {
  const response = await fetch(`/api/v1/ai/tasks/${encodeURIComponent(taskId)}/cancel`, {
    method: "POST"
  });
  const payload = (await response.json()) as ApiResponse<AiTaskData>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

async function retryAiTask(taskId: string, clientRequestId: string) {
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

async function waitForAiTaskResult(initialData: AiTaskData, onUpdate: (data: AiTaskData) => void) {
  if (initialData.result || initialData.task.status === "SUCCEEDED") {
    return initialData;
  }

  if (initialData.task.status === "FAILED" || initialData.task.status === "CANCELLED") {
    throwTaskStatusError(initialData.task);
  }

  const startedAt = Date.now();
  let latest = initialData;

  while (Date.now() - startedAt < AI_TASK_POLL_TIMEOUT_MS) {
    await delay(AI_TASK_POLL_INTERVAL_MS);
    const next = await fetchAiTaskResult(initialData.task.id);
    latest = {
      ...latest,
      task: next.task,
      result: next.result,
      creditAccount: next.creditAccount ?? latest.creditAccount,
      conversation: next.conversation ?? latest.conversation,
      messages: next.messages ?? latest.messages
    };
    onUpdate(latest);

    if (latest.result || latest.task.status === "SUCCEEDED") {
      return latest;
    }

    if (latest.task.status === "FAILED" || latest.task.status === "CANCELLED") {
      throwTaskStatusError(latest.task);
    }
  }

  throw new Error("AI_TASK_FAILED:任务仍在处理中，请稍后刷新页面或到历史记录查看结果；系统不会因为刷新页面重复扣费。");
}

function throwTaskStatusError(task: AiTaskData["task"]): never {
  throw new Error(`${task.errorCode ?? "AI_TASK_FAILED"}:${task.errorMessage ?? "AI 任务执行失败，请稍后再试"}`);
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getFriendlyError(error: unknown) {
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
    return "AI 服务响应超时，请稍后重试或减少代码量。";
  }

  if (message.startsWith("AI_PROVIDER_CONFIG_ERROR:")) {
    return "AI 服务配置不可用，请联系管理员检查模型配置。";
  }

  if (message.startsWith("AI_PROVIDER_BAD_RESPONSE:")) {
    return "AI 服务返回内容格式异常，请稍后重试；如果代码较长，请减少代码量后再试。";
  }

  if (message.startsWith("AI_TASK_FAILED:")) {
    return "AI 任务执行失败，请稍后重试或减少代码量。";
  }

  return message.includes(":") ? message.split(":").slice(1).join(":") : message;
}

function parseMarkdownCodeBlocks(content: string) {
  const parts: Array<{ type: "text"; text: string } | { type: "code"; code: string; language?: string }> = [];
  const pattern = /```([a-zA-Z0-9_+.-]*)?\s*\n?([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const text = content.slice(cursor, match.index).trim();

    if (text) {
      parts.push({ type: "text", text });
    }

    parts.push({
      type: "code",
      language: match[1]?.trim() || undefined,
      code: match[2]?.replace(/\s+$/, "") ?? ""
    });
    cursor = match.index + match[0].length;
  }

  const trailingText = content.slice(cursor).trim();

  if (trailingText) {
    parts.push({ type: "text", text: trailingText });
  }

  return parts.length ? parts : [{ type: "text" as const, text: content }];
}

async function copyTextToClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall back below for browsers that expose clipboard but reject the call.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    return copied;
  } catch {
    return false;
  }
}

function createClientRequestId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}
