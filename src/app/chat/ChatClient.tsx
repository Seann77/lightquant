"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronRight,
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
import { getFileUploadFriendlyError, uploadCodeFile, type UploadedCodeFile } from "@/lib/file-upload";
import { chatPlatformOptions, convertPlatforms } from "@/lib/mock-data";
import { PlatformDropdown } from "@/components/ui/PlatformDropdown";
import { AiTaskCompletionSummary, AiTaskProgressPanel, RunEventTimeline } from "@/components/ai/AiTaskProgressPanel";
import { MessageAttachmentList, WorkbenchFileUploadStatus } from "@/components/ai/AttachmentPreviewCard";
import { WorkbenchShell } from "@/components/ai/WorkbenchShell";
import {
  CodeConversionResultView,
  StrategyResultView,
  getCodeConversionTabContent
} from "@/components/ai/WorkbenchResultViews";
import {
  createRestoredUploadedFile,
  createWorkbenchAiTask,
  createWorkbenchClientRequestId,
  cancelAiTask,
  fetchAiTaskResult,
  formatRestoredInputText,
  getConversationActiveTab,
  getFriendlyAiError as getFriendlyError,
  getMessageAttachments,
  persistConversationActiveTab,
  readRecord,
  readStringArray,
  replaceWorkbenchConversationUrl,
  retryAiTask,
  uploadedFileToMessageAttachment,
  waitForAiTaskResult
} from "@/lib/ai/workbench-client";
import { useWorkbenchConversationRestore } from "@/lib/ai/use-workbench-conversation";
import type { AiConversationData, AiMessageData, AiRunEventData, AiTaskData, AiTaskProgress } from "@/lib/ai/workbench-types";

type StrategyChatMessage = AiMessageData & {
  localStatus?: "pending" | "error";
  visibleSteps?: string[];
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
  events?: AiRunEventData[];
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
    onRestore: (data) => {
      setConversation(data.conversation);
      setMessages(data.messages.map(toStrategyMessage));
      hydrateConversationJobs(data.conversation.id, data.tasks ?? [], data.messages);

      if (data.conversation.targetPlatform && chatPlatformOptions.includes(data.conversation.targetPlatform)) {
        setTargetPlatform(data.conversation.targetPlatform);
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

    const clientRequestId = createWorkbenchClientRequestId("strategy");
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
      const data = await createWorkbenchAiTask({
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
      events: data.events,
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

    try {
      const data = job.task
        ? await retryAiTask(job.id, clientRequestId)
        : await createWorkbenchAiTask({
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
            <WorkbenchFileUploadStatus file={uploadedFile} message={uploadError} />
          </div>
          <p className="lq-risk">AI 生成策略需自行回测验证，投资有风险，请谨慎使用。</p>
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
  const [activeTab, setActiveTab] = useState<(typeof conversionTabs)[number]>(conversionTabs[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedCodeFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationIdFromUrl = searchParams.get("conversationId");
  const elapsedSeconds = useElapsedSeconds(loading);

  const activeConversionConversationId = taskData?.conversation?.id ?? taskData?.task.conversationId ?? conversationIdFromUrl;

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

      setPrompt(restored.prompt ?? "");
      setInputCode(formatRestoredInputText(restored.inputCodePreview, restored.inputFileName));
      setUploadedFile(createRestoredUploadedFile(restored));
      setTaskData(restored.taskData);
      setActiveTab(getConversationActiveTab(conversationData.conversation, conversionTabs, conversionTabs[0]));
    },
    onError: (historyError) => {
      setError(getFriendlyError(historyError));
    }
  });

  useEffect(() => {
    persistConversationActiveTab(activeConversionConversationId, activeTab, "convert");
  }, [activeConversionConversationId, activeTab]);

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
      const data = await createWorkbenchAiTask({
        type: "code_conversion",
        conversationId: currentConversationId,
        sourcePlatform,
        targetPlatform,
        inputCode,
        prompt,
        inputFileId: uploadedFile?.fileId,
        clientRequestId: createWorkbenchClientRequestId("convert")
      });

      setTaskData(data);
      setActiveTab(conversionTabs[0]);
      replaceWorkbenchConversationUrl(router, { type: "chat", mode: "convert" }, conversationIdFromUrl, data.conversation?.id ?? data.task.conversationId ?? null);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      const completed = await waitForAiTaskResult(data, setTaskData);
      setTaskData(completed);
      replaceWorkbenchConversationUrl(router, { type: "chat", mode: "convert" }, conversationIdFromUrl, completed.conversation?.id ?? completed.task.conversationId ?? null);
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
  const panelContent = getCodeConversionTabContent(activeTab, result);
  const shouldShowTaskProgress = !panelContent && (loading || Boolean(taskData && taskData.task.status !== "SUCCEEDED"));
  const conversionInputChars = inputCode.length + prompt.length;

  return (
    <WorkbenchShell className="min-h-full">
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
              <WorkbenchFileUploadStatus file={uploadedFile} message={uploadError} />
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
                  <CodeConversionResultView activeTab={activeTab} result={result} />
                ) : shouldShowTaskProgress ? (
                  <AiTaskProgressPanel
                    events={taskData?.events ?? taskData?.task.events}
                    elapsedSeconds={elapsedSeconds}
                    errorCode={taskData?.task.errorCode}
                    inputChars={conversionInputChars}
                    progress={taskData?.task.progress}
                    status={taskData?.task.status ?? (loading ? "RUNNING" : "PENDING")}
                    taskId={taskData?.task.id}
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
            {result && taskData?.task ? <AiTaskCompletionSummary events={taskData.events ?? taskData.task.events} progress={taskData.task.progress} task={taskData.task} /> : null}
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
        {result ? <StrategyResultView result={result} task={task} /> : null}
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
          <RunEventTimeline events={job.events} status={job.task?.status ?? (running ? "RUNNING" : completed ? "SUCCEEDED" : failed || canceled ? "FAILED" : null)} taskId={job.task?.id} />
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
        {completed && job.result ? <StrategyResultView result={job.result} task={job.task ?? null} /> : null}
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
      <RunEventTimeline status={task?.status ?? (status === "running" ? "RUNNING" : status === "failed" ? "FAILED" : status === "succeeded" ? "SUCCEEDED" : null)} taskId={task?.id} />
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
    events?: AiRunEventData[];
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
    request: input.request ?? input.previous?.request,
    events: input.events ?? task.events ?? input.previous?.events
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

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
