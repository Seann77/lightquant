"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  CheckCircle2,
  DollarSign,
  FileUp,
  ImageIcon,
  LoaderCircle,
  Sparkles,
  Trash2,
  type LucideIcon
} from "lucide-react";
import { getFileUploadFriendlyError, getScanStatusText, uploadCodeFile, type UploadedCodeFile } from "@/lib/file-upload";
import { codeAnalysisPlatforms, codeAnalysisTabs } from "@/lib/mock-data";
import { PlatformDropdown } from "@/components/ui/PlatformDropdown";
import { AiTaskCompletionSummary, AiTaskProgressPanel, type AiTaskProgress } from "@/components/ai/AiTaskProgressPanel";

type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: { code: string; message: string }; requestId: string };

type AiTaskData = {
  task: {
    id: string;
    type?: string;
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
    generatedCode?: string | null;
    explanation: string | null;
    migrationNotes?: string | null;
    riskWarnings: string[];
    reportJson: Record<string, unknown> | null;
  } | null;
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

type AiConversationMessagesData = {
  conversation: AiConversationData;
  messages: AiMessageData[];
  tasks?: AiTaskData["task"][];
};

const AI_TASK_POLL_INTERVAL_MS = 3000;
const AI_TASK_POLL_TIMEOUT_MS = 5 * 60 * 1000;

export function CodeAnalysisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [platform, setPlatform] = useState(codeAnalysisPlatforms[0]);
  const [inputCode, setInputCode] = useState("");
  const [data, setData] = useState<AiTaskData | null>(null);
  const [activeTab, setActiveTab] = useState(codeAnalysisTabs[0]);
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

        if (conversationData.conversation.mode !== "analysis") {
          throw new Error("VALIDATION_ERROR:当前会话不属于代码解析模块");
        }

        const restored = restoreAnalysisConversation(conversationData);

        if (restored.sourcePlatform && codeAnalysisPlatforms.includes(restored.sourcePlatform)) {
          setPlatform(restored.sourcePlatform);
        }

        setInputCode(formatRestoredInputText(restored.inputCodePreview, restored.inputFileName));
        setUploadedFile(createRestoredUploadedFile(restored));
        setData(restored.taskData);
        setActiveTab(codeAnalysisTabs[0]);
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
      const currentConversationId = data?.conversation?.id ?? conversationIdFromUrl ?? undefined;
      const response = await fetch("/api/v1/ai/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "code_analysis",
          conversationId: currentConversationId,
          sourcePlatform: platform,
          inputCode,
          inputFileId: uploadedFile?.fileId,
          clientRequestId: createClientRequestId()
        })
      });
      const payload = (await response.json()) as ApiResponse<AiTaskData>;

      if (!payload.success) {
        throw new Error(`${payload.error.code}:${payload.error.message}`);
      }

      setData(payload.data);
      replaceWithAnalysisConversationUrl(router, conversationIdFromUrl, payload.data.conversation?.id ?? payload.data.task.conversationId ?? null);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      const completed = await waitForAiTaskResult(payload.data, setData);
      setData(completed);
      replaceWithAnalysisConversationUrl(router, conversationIdFromUrl, completed.conversation?.id ?? completed.task.conversationId ?? null);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (submitError) {
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      setError(getFriendlyError(submitError));
    } finally {
      setLoading(false);
    }
  }

  const report = data?.result?.reportJson;
  const shouldShowTaskProgress = !data?.result && (loading || Boolean(data && data.task.status !== "SUCCEEDED"));
  const analysisInputChars = inputCode.length;

  return (
    <section className="lq-analysis-page min-h-full">
      <section className="lq-title-block">
        <h1>代码翻译解析</h1>
        <p>将策略代码翻译成清晰的自然语言说明，并识别逻辑结构与潜在风险</p>
      </section>

      <section className="lq-analysis-card">
        <div className="lq-analysis-toolbar">
          <PlatformDropdown className="lq-analysis-platform-select" label="代码平台" onChange={setPlatform} options={codeAnalysisPlatforms} value={platform} />
          <button className="lq-upload-chip" disabled={uploading} onClick={() => fileInputRef.current?.click()} type="button">
            <FileUp aria-hidden="true" size={17} />
            上传 .py / .txt / .log / .md / 图片
          </button>
          <input accept=".py,.txt,.log,.md,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
        </div>

        <FileUploadStatus file={uploadedFile} message={uploadError} />

        <div className="lq-analysis-editor">
          <div className="lq-line-numbers">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <textarea
            className="lq-textarea lq-analysis-textarea"
            onChange={(event) => setInputCode(event.target.value)}
            placeholder="请粘贴需要解析的策略代码..."
            value={inputCode}
          />
        </div>

        <div className="lq-analysis-footer">
          <div className="lq-analysis-actions">
            <button
              className="lq-secondary-btn"
              onClick={() => {
                setInputCode("");
                setData(null);
                setError("");
                setUploadedFile(null);
                setUploadError("");
              }}
              type="button"
            >
              <Trash2 aria-hidden="true" size={17} />
              清空内容
            </button>
            <button
              className="lq-primary-btn"
              disabled={loading || (!inputCode.trim() && !uploadedFile) || uploadedFile?.scanStatus === "BLOCKED"}
              onClick={handleSubmit}
              type="button"
            >
              {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
              {loading ? `解析中 ${elapsedSeconds}s` : "开始解析"}
            </button>
            <div className="lq-cost-pill">
              <DollarSign aria-hidden="true" />
              <span>每次代码解析消耗 100 积分</span>
            </div>
          </div>
        </div>

        {error ? <div className="mx-[18px] mb-4"><ErrorPanel message={error} /></div> : null}
      </section>

      <section className="lq-analysis-results">
        <div className="lq-result-tabs">
          {codeAnalysisTabs.map((tab) => (
            <button className={`lq-result-tab ${tab === activeTab ? "is-active" : ""}`} key={tab} onClick={() => setActiveTab(tab)} type="button">
              {tab}
            </button>
          ))}
        </div>

        {data?.result ? (
          <AnalysisResult activeTab={activeTab} costPoints={data.task.costPoints} report={report} result={data.result} task={data.task} />
        ) : shouldShowTaskProgress ? (
          <div className="lq-empty-result is-progress">
            <AiTaskProgressPanel
              elapsedSeconds={elapsedSeconds}
              errorCode={data?.task.errorCode}
              inputChars={analysisInputChars}
              progress={data?.task.progress}
              status={data?.task.status ?? (loading ? "RUNNING" : "PENDING")}
              taskType="code_analysis"
            />
          </div>
        ) : (
          <div className="lq-empty-result">
            <div className="lq-empty-icon">
              <BarChart3 aria-hidden="true" size={25} />
            </div>
            <h2>{loading ? getAiWaitMessage("正在生成解析报告", elapsedSeconds) : "解析结果将在这里显示"}</h2>
            <p>{loading ? "真实模型调用可能需要几十秒，请不要关闭页面或重复提交。" : "粘贴您的策略代码并点击“开始解析”，系统将自动生成详细的说明报告。"}</p>
          </div>
        )}
      </section>
    </section>
  );
}

function FileUploadStatus({ file, message }: { file: UploadedCodeFile | null; message: string }) {
  if (!file && !message) {
    return null;
  }

  if (message) {
    return <div className="lq-file-status is-error mx-[18px]">{message}</div>;
  }

  if (!file) {
    return null;
  }

  const blocked = file.scanStatus === "BLOCKED";
  const isImage = isImageFile(file);
  const StatusIcon: LucideIcon = blocked ? Ban : file.scanStatus === "WARNING" ? AlertTriangle : isImage ? ImageIcon : CheckCircle2;

  return (
    <div className={`lq-file-status mx-[18px] ${blocked ? "is-blocked" : ""}`}>
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

function AnalysisResult({
  activeTab,
  costPoints,
  report,
  result,
  task
}: {
  activeTab: string;
  costPoints: number;
  report: Record<string, unknown> | null | undefined;
  result: NonNullable<AiTaskData["result"]>;
  task: AiTaskData["task"];
}) {
  const content = getTabContent(activeTab, report, result);

  return (
    <div className="lq-analysis-output">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-extrabold text-[#111827]">{activeTab}</h2>
        <span className="lq-cost-tag">已扣除 {costPoints} 积分</span>
      </div>
      <AiTaskCompletionSummary progress={task.progress} task={task} />
      <div className="grid gap-3">
        {content.map((item) => (
          <p className="m-0" key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return <div className="lq-error-panel">{message}</div>;
}

function getTabContent(activeTab: string, report: Record<string, unknown> | null | undefined, result: NonNullable<AiTaskData["result"]>) {
  if (activeTab === "风险提醒") {
    return result.riskWarnings.length > 0 ? result.riskWarnings : ["暂未识别到明显风险。"];
  }

  if (activeTab === "交易逻辑") {
    return toStringArray(report?.tradingLogic) ?? ["读取行情、计算信号并执行调仓。"];
  }

  if (activeTab === "关键参数") {
    return toStringArray(report?.parameters) ?? ["未识别到明确参数。"];
  }

  if (activeTab === "优化建议") {
    return toStringArray(report?.optimizationSuggestions) ?? ["建议补充回测、风控和异常行情处理。"];
  }

  return [String(report?.overview ?? result.explanation ?? "已生成代码解析报告。")];
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : null;
}

function useElapsedSeconds(active: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(0);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active]);

  return elapsedSeconds;
}

function getAiWaitMessage(action: string, elapsedSeconds: number) {
  if (elapsedSeconds >= 120) {
    return `${action}，已等待 ${elapsedSeconds} 秒。任务仍在服务端执行，请继续等待。`;
  }

  if (elapsedSeconds >= 60) {
    return `${action}，已等待 ${elapsedSeconds} 秒。真实模型可能需要几分钟，请继续等待。`;
  }

  if (elapsedSeconds >= 15) {
    return `${action}，已等待 ${elapsedSeconds} 秒。MiMo Pro 正在生成结果。`;
  }

  return `${action}，已等待 ${elapsedSeconds} 秒...`;
}

type RestoredAnalysisSnapshot = {
  sourcePlatform: string | null;
  inputCodePreview: string | null;
  inputFileId: string | null;
  inputFileName: string | null;
  inputAttachment: MessageAttachmentData | null;
  taskData: AiTaskData | null;
};

function restoreAnalysisConversation(data: AiConversationMessagesData): RestoredAnalysisSnapshot {
  const input = getLatestUserInputSnapshot(data.messages, "code_analysis");
  const taskData = getLatestTaskDataFromMessages(data.messages, "code_analysis")
    ?? getLatestTaskDataFromTasks(data.tasks ?? [], "code_analysis", data.conversation);

  return {
    sourcePlatform: input.sourcePlatform ?? data.conversation.sourcePlatform,
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
      inputCodePreview: readNullableString(contentJson.inputCodePreview),
      inputFileId: readNullableString(contentJson.inputFileId),
      inputFileName: readNullableString(contentJson.inputFileName),
      inputAttachment: normalizeMessageAttachments(message)[0] ?? null
    };
  }

  return {
    sourcePlatform: null,
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
    type: readNullableString(task.type) ?? "",
    status: readNullableString(task.status) ?? "SUCCEEDED",
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

function normalizeMessageAttachments(message: AiMessageData): MessageAttachmentData[] {
  return Array.isArray(message.attachments) ? message.attachments : [];
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isImageFile(file: Pick<UploadedCodeFile, "kind" | "mimeType" | "ext">) {
  return file.kind === "image" || file.mimeType.startsWith("image/") || isImageExtension(file.ext);
}

function isImageExtension(ext: string) {
  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext.toLowerCase());
}

function createRestoredUploadedFile(snapshot: Pick<RestoredAnalysisSnapshot, "inputFileId" | "inputFileName" | "inputCodePreview" | "inputAttachment">): UploadedCodeFile | null {
  if (snapshot.inputAttachment) {
    return attachmentToUploadedFile(snapshot.inputAttachment);
  }

  if (!snapshot.inputFileId || !snapshot.inputFileName) {
    return null;
  }

  const ext = snapshot.inputFileName.includes(".") ? `.${snapshot.inputFileName.split(".").pop() ?? "txt"}` : ".txt";
  const isImage = isImageExtension(ext);

  return {
    fileId: snapshot.inputFileId,
    kind: isImage ? "image" : "text",
    originalName: snapshot.inputFileName,
    ext,
    mimeType: isImage ? `image/${ext === ".jpg" ? "jpeg" : ext.slice(1)}` : "text/plain",
    sizeBytes: 0,
    sha256: "",
    contentPreview: snapshot.inputCodePreview ?? "",
    scanStatus: "PASSED",
    riskFlags: [],
    hasThumbnail: isImage,
    thumbnailUrl: isImage ? `/api/v1/files/${encodeURIComponent(snapshot.inputFileId)}/thumbnail` : null,
    previewUrl: isImage ? `/api/v1/files/${encodeURIComponent(snapshot.inputFileId)}/preview` : null,
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

function formatRestoredInputText(inputCodePreview: string | null, inputFileName: string | null) {
  if (inputCodePreview) {
    return `历史输入摘要：\n${inputCodePreview}`;
  }

  return inputFileName ? `历史文件：${inputFileName}` : "";
}

function replaceWithAnalysisConversationUrl(router: ReturnType<typeof useRouter>, currentConversationId: string | null, nextConversationId: string | null) {
  if (!nextConversationId || nextConversationId === currentConversationId) {
    return;
  }

  router.replace(`/code-analysis?conversationId=${encodeURIComponent(nextConversationId)}`, {
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
    latest = await fetchAiTaskResult(initialData.task.id);
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

function createClientRequestId() {
  return `analysis-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}
