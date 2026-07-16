"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  FileUp,
  LoaderCircle,
  Sparkles,
  Trash2
} from "lucide-react";
import { getFileUploadFriendlyError, getUploadAccept, getUploadButtonLabel, uploadCodeFile, type UploadedCodeFile } from "@/lib/file-upload";
import { codeAnalysisPlatforms, codeAnalysisTabs } from "@/lib/mock-data";
import { PlatformDropdown } from "@/components/ui/PlatformDropdown";
import { WorkbenchFileUploadStatus } from "@/components/ai/AttachmentPreviewCard";
import { WorkbenchShell } from "@/components/ai/WorkbenchShell";
import { CodeAnalysisResultView } from "@/components/ai/WorkbenchResultViews";
import {
  createRestoredUploadedFile,
  createWorkbenchClientRequestId,
  formatRestoredInputText,
  getConversationActiveTab,
  getFriendlyAiError as getFriendlyError,
  persistConversationActiveTab,
  rememberClientRequestStartedAt,
  replaceWorkbenchConversationUrl,
  streamWorkbenchAiTask,
  useStableElapsedSeconds,
  waitForAiTaskResult
} from "@/lib/ai/workbench-client";
import {
  buildAiTaskFingerprint,
  isAiTaskDataCompleteSuccess,
  isAiTaskDataPartial
} from "@/lib/ai/task-fingerprint";
import { useWorkbenchConversationRestore } from "@/lib/ai/use-workbench-conversation";
import type { AiTaskData } from "@/lib/ai/workbench-types";

type AnalysisInputSource = "manual" | "attachment" | "restored";

type ThinkingMessageState = {
  status: "idle" | "running" | "completed" | "failed";
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
  const [lastSuccessfulFingerprint, setLastSuccessfulFingerprint] = useState<string | null>(null);
  const [pendingAnalysisClientRequestId, setPendingAnalysisClientRequestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingAnalysisTaskIdRef = useRef<string | null>(null);
  const streamingAnalysisTaskIdRef = useRef<string | null>(null);
  const conversationIdFromUrl = searchParams.get("conversationId");
  const activeAnalysisTaskStatus = data?.task.status ?? null;
  const activeAnalysisTaskRunning = activeAnalysisTaskStatus === "PENDING" || activeAnalysisTaskStatus === "RUNNING";
  const analysisBusy = loading || activeAnalysisTaskRunning;
  const elapsedSeconds = useStableElapsedSeconds(analysisBusy, {
    task: data?.task ?? null,
    taskId: data?.task.id ?? null,
    clientRequestId: data?.task.clientRequestId ?? pendingAnalysisClientRequestId,
    localCreatedAt: data?.task.createdAt ?? null,
    finishedAt: data?.task.finishedAt ?? null
  });

  const activeAnalysisConversationId = data?.conversation?.id ?? data?.task.conversationId ?? conversationIdFromUrl;
  const finalInputText = getFinalInputText(inputCode, inputSource);
  const analysisCurrentFingerprint = useMemo(() => buildAiTaskFingerprint({
    type: "code_analysis",
    sourcePlatform: platform,
    inputCode: finalInputText,
    inputFile: uploadedFile
  }), [platform, finalInputText, uploadedFile]);
  const analysisDuplicateCompleted = Boolean(lastSuccessfulFingerprint && lastSuccessfulFingerprint === analysisCurrentFingerprint);

  const resetAnalysisLocalState = useCallback(() => {
    setInputCode("");
    setInputSource("manual");
    setData(null);
    setStreamState(createEmptyThinkingState());
    setActiveTab(codeAnalysisTabs[0]);
    setLoading(false);
    setError("");
    setUploadedFile(null);
    setUploading(false);
    setUploadError("");
    setPendingAnalysisClientRequestId(null);
    pollingAnalysisTaskIdRef.current = null;
    streamingAnalysisTaskIdRef.current = null;
  }, []);

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

      const restoredInputCode = formatRestoredInputText(restored.inputCodePreview, restored.inputFileName);
      const restoredFile = createRestoredUploadedFile(restored);
      const restoredPlatform = restored.sourcePlatform && codeAnalysisPlatforms.includes(restored.sourcePlatform)
        ? restored.sourcePlatform
        : platform;
      const restoredFingerprint = buildAiTaskFingerprint({
        type: "code_analysis",
        sourcePlatform: restoredPlatform,
        inputCode: getFinalInputText(restoredInputCode, "restored"),
        inputFile: restoredFile
      });

      setInputCode(restoredInputCode);
      setInputSource("restored");
      setUploadedFile(restoredFile);
      setData(restored.taskData);
      setStreamState(createThinkingStateFromTaskData(restored.taskData));
      setActiveTab(getConversationActiveTab(conversationData.conversation, codeAnalysisTabs, codeAnalysisTabs[0]));
      setLoading(false);
      setPendingAnalysisClientRequestId(null);
      pollingAnalysisTaskIdRef.current = null;
      streamingAnalysisTaskIdRef.current = null;

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
    if (conversationIdFromUrl) {
      return;
    }

    resetAnalysisLocalState();
  }, [conversationIdFromUrl, resetAnalysisLocalState]);

  useEffect(() => {
    persistConversationActiveTab(activeAnalysisConversationId, activeTab, "analysis");
  }, [activeAnalysisConversationId, activeTab]);

  useEffect(() => {
    const currentTaskData = data;
    const currentTask = currentTaskData?.task;
    const currentTaskConversationId = currentTaskData?.conversation?.id ?? currentTask?.conversationId ?? null;

    if (!currentTask || (currentTask.status !== "PENDING" && currentTask.status !== "RUNNING")) {
      return;
    }

    if (conversationIdFromUrl && currentTaskConversationId && currentTaskConversationId !== conversationIdFromUrl) {
      return;
    }

    if (streamingAnalysisTaskIdRef.current === currentTask.id) {
      return;
    }

    if (pollingAnalysisTaskIdRef.current === currentTask.id) {
      return;
    }

    let disposed = false;
    const pollController = new AbortController();
    pollingAnalysisTaskIdRef.current = currentTask.id;
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const completed = await waitForAiTaskResult(currentTaskData, (nextData) => {
          if (disposed) {
            return;
          }

          setData(nextData);
          setStreamState((current) => createThinkingStateFromTaskData(nextData, current));
        }, {
          signal: pollController.signal
        });

        if (disposed) {
          return;
        }

        setData(completed);
        setStreamState((current) => createThinkingStateFromTaskData(completed, current));
        replaceWorkbenchConversationUrl(router, { type: "analysis" }, conversationIdFromUrl, completed.conversation?.id ?? completed.task.conversationId ?? null);
        window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));

        if (completed.result || completed.task.status === "SUCCEEDED") {
          window.dispatchEvent(new Event("lightquant:credits-updated"));
        }
      } catch (pollError) {
        window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));

        if (!disposed && !isAbortError(pollError)) {
          const friendly = getFriendlyError(pollError);
          setError(friendly);
          setStreamState((current) => ({
            ...current,
            status: "failed",
            error: friendly
          }));
        }
      } finally {
        if (pollingAnalysisTaskIdRef.current === currentTask.id) {
          pollingAnalysisTaskIdRef.current = null;
        }

        if (!disposed) {
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
      pollController.abort();

      if (pollingAnalysisTaskIdRef.current === currentTask.id) {
        pollingAnalysisTaskIdRef.current = null;
      }
    };
  }, [data?.task.id, data?.task.status, conversationIdFromUrl, router]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const nextFile = await uploadCodeFile(file, "code_analysis");
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
    const submittedFingerprint = analysisCurrentFingerprint;

    if (analysisBusy || uploading) {
      return;
    }

    if (!submittedFingerprint) {
      return;
    }

    if (analysisDuplicateCompleted) {
      return;
    }

    if (!finalInputText) {
      setError(inputSource === "restored"
        ? "历史输入仅为摘要，请粘贴完整代码或重新上传附件后再解析。"
        : "请粘贴需要解析的策略代码，或上传可解析的文本文件。");
      return;
    }

    if (uploadedFile?.scanStatus === "BLOCKED") {
      return;
    }

    const clientRequestId = createWorkbenchClientRequestId("analysis");
    const submitStartedAt = new Date().toISOString();
    rememberClientRequestStartedAt(clientRequestId, submitStartedAt, { overwrite: true });
    setPendingAnalysisClientRequestId(clientRequestId);

    const currentConversationId = data?.conversation?.id ?? conversationIdFromUrl ?? undefined;

    setLoading(true);
    setError("");
    setData(null);
    setStreamState({
      status: "running",
      finalAnswerMarkdown: ""
    });

    try {
      const completed = await streamWorkbenchAiTask({
        type: "code_analysis",
        conversationId: currentConversationId,
        sourcePlatform: platform,
        messageContent: undefined,
        prompt: undefined,
        inputCode: finalInputText,
        inputFileId: uploadedFile?.contentText ? uploadedFile.fileId : undefined,
        clientRequestId
      }, {
        onTask: (payload) => {
          streamingAnalysisTaskIdRef.current = payload.task.id;
          setData(payload);
          setStreamState((current) => ({
            ...current,
            status: "running",
            taskId: payload.task.id
          }));
          replaceWorkbenchConversationUrl(router, { type: "analysis" }, conversationIdFromUrl, payload.conversation?.id ?? payload.task.conversationId ?? null);
          window.dispatchEvent(new Event("lightquant:ai-tasks-updated"));
        },
        onThinkingDelta: () => {
          setStreamState((current) => ({
            ...current,
            status: current.finalAnswerMarkdown ? "completed" : "running"
          }));
        },
        onFinalDelta: (delta) => {
          setStreamState((current) => ({
            ...current,
            status: "running",
            finalAnswerMarkdown: `${current.finalAnswerMarkdown}${delta}`
          }));
        },
        onDone: (payload) => {
          setData(payload);
          setStreamState((current) => createThinkingStateFromTaskData(payload, current));
        }
      });

      setData(completed);
      setStreamState((current) => createThinkingStateFromTaskData(completed, current));
      replaceWorkbenchConversationUrl(router, { type: "analysis" }, conversationIdFromUrl, completed.conversation?.id ?? completed.task.conversationId ?? null);
      rememberAnalysisTaskFingerprintOutcome(completed, submittedFingerprint, {
        setLastSuccessfulFingerprint
      });
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
      setPendingAnalysisClientRequestId(null);
      streamingAnalysisTaskIdRef.current = null;
    }
  }

  const result = data?.result ?? null;
  const reportJson = result?.reportJson;
  const reportRecord = reportJson && typeof reportJson === "object" && !Array.isArray(reportJson) ? reportJson as Record<string, unknown> : null;
  const parseFailed = Boolean(reportRecord?.providerFallback || (data?.task.status === "SUCCEEDED" && !result));
  const analysisInputChars = finalInputText.length;
  const canSubmit = !analysisBusy &&
    !uploading &&
    Boolean(finalInputText) &&
    !analysisDuplicateCompleted &&
    uploadedFile?.scanStatus !== "BLOCKED";

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
            {getUploadButtonLabel("code_analysis")}
          </button>
          <input accept={getUploadAccept("code_analysis")} className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
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
              onClick={resetAnalysisLocalState}
              type="button"
            >
              <Trash2 aria-hidden="true" size={17} />
              清空内容
            </button>
            <button
              className="lq-primary-btn"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {analysisBusy ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
              {analysisBusy
                ? `解析中 ${elapsedSeconds}s`
                : analysisDuplicateCompleted
                    ? "已完成解析"
                    : "开始解析"}
            </button>
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

        {result && !parseFailed ? (
          <CodeAnalysisResultView activeTab={activeTab} report={reportRecord} result={result} />
        ) : analysisBusy ? (
          <div className="lq-empty-result">
            <div className="lq-empty-icon">
              <BarChart3 aria-hidden="true" size={25} />
            </div>
            <h2>{loading ? "解析中..." : "正在处理任务..."}</h2>
          </div>
        ) : parseFailed ? (
          <div className="lq-empty-result">
            <div className="lq-empty-icon">
              <BarChart3 aria-hidden="true" size={25} />
            </div>
            <h2>解析失败，请重新提交或检查代码内容。</h2>
          </div>
        ) : (
          <div className="lq-empty-result">
            <div className="lq-empty-icon">
              <BarChart3 aria-hidden="true" size={25} />
            </div>
            <h2>解析结果将在这里显示</h2>
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
    finalAnswerMarkdown: ""
  };
}

function createThinkingStateFromTaskData(data: AiTaskData | null | undefined, previous?: ThinkingMessageState): ThinkingMessageState {
  if (!data) {
    return createEmptyThinkingState();
  }

  const finalAnswerMarkdown = previous?.finalAnswerMarkdown ?? data.finalAnswerMarkdown ?? "";

  if (data.task.status === "FAILED" || data.task.status === "CANCELLED") {
    return {
      status: "failed",
      finalAnswerMarkdown,
      error: data.task.errorMessage ?? null,
      taskId: data.task.id
    };
  }

  if (data.task.status === "SUCCEEDED" || data.result || finalAnswerMarkdown) {
    return {
      status: "completed",
      finalAnswerMarkdown,
      taskId: data.task.id
    };
  }

  return {
    status: "running",
    finalAnswerMarkdown,
    taskId: data.task.id
  };
}

function rememberAnalysisTaskFingerprintOutcome(
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

function getFinalInputText(inputCode: string, inputSource: AnalysisInputSource) {
  if (inputSource === "restored") {
    return "";
  }

  return inputCode.trim() ? inputCode : "";
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
