"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  DollarSign,
  FileUp,
  LoaderCircle,
  Sparkles,
  Trash2
} from "lucide-react";
import { getFileUploadFriendlyError, uploadCodeFile, type UploadedCodeFile } from "@/lib/file-upload";
import { codeAnalysisPlatforms, codeAnalysisTabs } from "@/lib/mock-data";
import { PlatformDropdown } from "@/components/ui/PlatformDropdown";
import { AssistantThinkingMessage, type AssistantThinkingStatus } from "@/components/ai/AssistantThinkingMessage";
import { WorkbenchFileUploadStatus } from "@/components/ai/AttachmentPreviewCard";
import { WorkbenchShell } from "@/components/ai/WorkbenchShell";
import {
  createRestoredUploadedFile,
  createWorkbenchClientRequestId,
  formatAiTaskResultAsMarkdown,
  formatRestoredInputText,
  getAiTaskStreamingContent,
  getConversationActiveTab,
  getFriendlyAiError as getFriendlyError,
  persistConversationActiveTab,
  replaceWorkbenchConversationUrl,
  streamWorkbenchAiTask
} from "@/lib/ai/workbench-client";
import { useWorkbenchConversationRestore } from "@/lib/ai/use-workbench-conversation";
import type { AiTaskData } from "@/lib/ai/workbench-types";

type AnalysisInputSource = "manual" | "attachment" | "restored";

type ThinkingMessageState = {
  status: AssistantThinkingStatus;
  visibleThinking: string;
  finalAnswerMarkdown: string;
  error?: string | null;
  taskId?: string | null;
};

export function CodeAnalysisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [platform, setPlatform] = useState(codeAnalysisPlatforms[0]);
  const [inputCode, setInputCode] = useState("");
  const [inputSource, setInputSource] = useState<AnalysisInputSource>("manual");
  const [data, setData] = useState<AiTaskData | null>(null);
  const [streamState, setStreamState] = useState<ThinkingMessageState>(() => createEmptyThinkingState());
  const [activeTab, setActiveTab] = useState(codeAnalysisTabs[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedCodeFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationIdFromUrl = searchParams.get("conversationId");
  const elapsedSeconds = useElapsedSeconds(loading);

  const activeAnalysisConversationId = data?.conversation?.id ?? data?.task.conversationId ?? conversationIdFromUrl;

  useWorkbenchConversationRestore({
    conversationId: conversationIdFromUrl,
    expectedMode: "analysis",
    taskType: "code_analysis",
    messages: {
      limit: 20,
      taskLimit: 1,
      includeTaskResults: "latest"
    },
    onSummary: (summary) => {
      setError("");

      if (summary.sourcePlatform && codeAnalysisPlatforms.includes(summary.sourcePlatform)) {
        setPlatform(summary.sourcePlatform);
      }

      setActiveTab(getConversationActiveTab(summary, codeAnalysisTabs, codeAnalysisTabs[0]));
    },
    onRestore: (conversationData, restored) => {
      if (restored.sourcePlatform && codeAnalysisPlatforms.includes(restored.sourcePlatform)) {
        setPlatform(restored.sourcePlatform);
      }

      setInputCode(formatRestoredInputText(restored.inputCodePreview, restored.inputFileName));
      setInputSource("restored");
      setUploadedFile(createRestoredUploadedFile(restored));
      setData(restored.taskData);
      setStreamState(createThinkingStateFromTaskData(restored.taskData));
      setActiveTab(getConversationActiveTab(conversationData.conversation, codeAnalysisTabs, codeAnalysisTabs[0]));
    },
    onError: (historyError) => {
      setError(getFriendlyError(historyError));
    }
  });

  useEffect(() => {
    persistConversationActiveTab(activeAnalysisConversationId, activeTab, "analysis");
  }, [activeAnalysisConversationId, activeTab]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const nextFile = await uploadCodeFile(file);
      const nextInputCode = nextFile.contentText ?? "";

      setUploadedFile(nextFile);
      setData(null);
      setStreamState(createEmptyThinkingState());
      setError("");

      if (!nextInputCode.trim()) {
        setInputCode("");
        setInputSource("manual");
        setUploadError("附件已上传，但没有解析出可分析文本，请重新上传文本文件。");
        return;
      }

      setInputCode(nextInputCode);
      setInputSource("attachment");
    } catch (uploadErrorValue) {
      setUploadedFile(null);
      setInputCode("");
      setInputSource("manual");
      setStreamState(createEmptyThinkingState());
      setUploadError(getFileUploadFriendlyError(uploadErrorValue));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    const finalInputText = getFinalInputText(inputCode, inputSource);

    if (!finalInputText) {
      setError(inputSource === "restored"
        ? "历史输入仅为摘要，请粘贴完整代码或重新上传附件后再解析。"
        : "请粘贴需要解析的策略代码，或上传可解析的文本文件。");
      return;
    }

    setLoading(true);
    setError("");
    setStreamState({
      status: "thinking",
      visibleThinking: "",
      finalAnswerMarkdown: ""
    });

    try {
      const currentConversationId = data?.conversation?.id ?? conversationIdFromUrl ?? undefined;
      const completed = await streamWorkbenchAiTask({
        type: "code_analysis",
        conversationId: currentConversationId,
        sourcePlatform: platform,
        inputCode: finalInputText,
        inputFileId: uploadedFile?.contentText ? uploadedFile.fileId : undefined,
        clientRequestId: createWorkbenchClientRequestId("analysis")
      }, {
        onTask: (payload) => {
          setData(payload);
          setStreamState((current) => ({
            ...current,
            status: current.finalAnswerMarkdown ? "answering" : "thinking",
            taskId: payload.task.id
          }));
          replaceWorkbenchConversationUrl(router, { type: "analysis" }, conversationIdFromUrl, payload.conversation?.id ?? payload.task.conversationId ?? null);
          window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
        },
        onThinkingDelta: (delta) => {
          setStreamState((current) => ({
            ...current,
            status: current.finalAnswerMarkdown ? "answering" : "thinking",
            visibleThinking: `${current.visibleThinking}${delta}`
          }));
        },
        onFinalDelta: (delta) => {
          setStreamState((current) => ({
            ...current,
            status: "answering",
            finalAnswerMarkdown: `${current.finalAnswerMarkdown}${delta}`
          }));
        },
        onDone: (payload) => {
          setData(payload);
          setStreamState(createThinkingStateFromTaskData(payload));
        }
      });

      setData(completed);
      setStreamState(createThinkingStateFromTaskData(completed));
      replaceWorkbenchConversationUrl(router, { type: "analysis" }, conversationIdFromUrl, completed.conversation?.id ?? completed.task.conversationId ?? null);
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (submitError) {
      window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
      const friendly = getFriendlyError(submitError);
      setError(friendly);
      setStreamState((current) => ({
        ...current,
        status: "failed",
        error: friendly
      }));
    } finally {
      setLoading(false);
    }
  }

  const finalAnswerMarkdown = streamState.finalAnswerMarkdown || (data?.result ? formatAiTaskResultAsMarkdown(data.result, "code_analysis") : "");
  const shouldShowThinkingResult = Boolean(streamState.visibleThinking || finalAnswerMarkdown || loading || data?.result);
  const finalInputText = getFinalInputText(inputCode, inputSource);
  const analysisInputChars = finalInputText.length;
  const canSubmit = Boolean(finalInputText) && !loading && uploadedFile?.scanStatus !== "BLOCKED";

  return (
    <WorkbenchShell className="lq-analysis-page min-h-full">
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

        <WorkbenchFileUploadStatus className="mx-[18px]" file={uploadedFile} message={uploadError} />

        <div className="lq-analysis-editor">
          <div className="lq-line-numbers">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <textarea
            className="lq-textarea lq-analysis-textarea"
            onChange={(event) => {
              setInputCode(event.target.value);
              setInputSource("manual");
            }}
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
                setInputSource("manual");
                setData(null);
                setStreamState(createEmptyThinkingState());
                setError("");
                setUploadedFile(null);
                setUploadError("");
                setLoading(false);
              }}
              type="button"
            >
              <Trash2 aria-hidden="true" size={17} />
              清空内容
            </button>
            <button
              className="lq-primary-btn"
              disabled={!canSubmit}
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

        {shouldShowThinkingResult ? (
          <AssistantThinkingMessage
            error={streamState.error}
            finalAnswerMarkdown={finalAnswerMarkdown}
            status={streamState.status}
            thinking={streamState.visibleThinking}
          />
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
    </WorkbenchShell>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return <div className="lq-error-panel">{message}</div>;
}

function createEmptyThinkingState(): ThinkingMessageState {
  return {
    status: "idle",
    visibleThinking: "",
    finalAnswerMarkdown: ""
  };
}

function createThinkingStateFromTaskData(data: AiTaskData | null | undefined): ThinkingMessageState {
  if (!data) {
    return createEmptyThinkingState();
  }

  const streamContent = getAiTaskStreamingContent(data, data.task.id);
  const finalAnswerMarkdown = streamContent.finalAnswerMarkdown || (data.result ? formatAiTaskResultAsMarkdown(data.result, "code_analysis") : "");

  if (data.task.status === "FAILED" || data.task.status === "CANCELLED") {
    return {
      status: "failed",
      visibleThinking: streamContent.visibleThinking,
      finalAnswerMarkdown,
      error: data.task.errorMessage ?? null,
      taskId: data.task.id
    };
  }

  if (data.task.status === "SUCCEEDED" || data.result || finalAnswerMarkdown) {
    return {
      status: "completed",
      visibleThinking: streamContent.visibleThinking,
      finalAnswerMarkdown,
      taskId: data.task.id
    };
  }

  return {
    status: "thinking",
    visibleThinking: streamContent.visibleThinking,
    finalAnswerMarkdown,
    taskId: data.task.id
  };
}

function getFinalInputText(inputCode: string, inputSource: AnalysisInputSource) {
  if (inputSource === "restored") {
    return "";
  }

  return inputCode.trim() ? inputCode : "";
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
