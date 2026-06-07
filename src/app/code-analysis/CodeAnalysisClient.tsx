"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  CheckCircle2,
  DollarSign,
  FileUp,
  LoaderCircle,
  Sparkles,
  Trash2,
  type LucideIcon
} from "lucide-react";
import { getFileUploadFriendlyError, getScanStatusText, uploadCodeFile, type UploadedCodeFile } from "@/lib/file-upload";
import { codeAnalysisPlatforms, codeAnalysisTabs } from "@/lib/mock-data";
import { PlatformDropdown } from "@/components/ui/PlatformDropdown";

type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: { code: string; message: string }; requestId: string };

type AiTaskData = {
  task: {
    id: string;
    status: string;
    costPoints: number;
  };
  result: {
    scopeStatus: "in_scope" | "out_of_scope";
    explanation: string | null;
    riskWarnings: string[];
    reportJson: Record<string, unknown> | null;
  } | null;
};

export function CodeAnalysisClient() {
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
      const response = await fetch("/api/v1/ai/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "code_analysis",
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
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (submitError) {
      setError(getFriendlyError(submitError));
    } finally {
      setLoading(false);
    }
  }

  const report = data?.result?.reportJson;

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
            上传 .py / .txt
          </button>
          <input accept=".py,.txt" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
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
              {loading ? "解析中..." : "开始解析"}
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
          <AnalysisResult activeTab={activeTab} costPoints={data.task.costPoints} report={report} result={data.result} />
        ) : (
          <div className="lq-empty-result">
            <div className="lq-empty-icon">
              <BarChart3 aria-hidden="true" size={25} />
            </div>
            <h2>{loading ? "正在生成解析报告" : "解析结果将在这里显示"}</h2>
            <p>粘贴您的策略代码并点击“开始解析”，系统将自动生成详细的说明报告。</p>
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
  const StatusIcon: LucideIcon = blocked ? Ban : file.scanStatus === "WARNING" ? AlertTriangle : CheckCircle2;

  return (
    <div className={`lq-file-status mx-[18px] ${blocked ? "is-blocked" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusIcon aria-hidden="true" size={16} />
        <span>{file.originalName}</span>
        <span>{getScanStatusText(file)}</span>
      </div>
      {file.riskFlags.length > 0 ? <div className="mt-1 break-words">风险标记：{file.riskFlags.join("、")}</div> : null}
    </div>
  );
}

function AnalysisResult({
  activeTab,
  costPoints,
  report,
  result
}: {
  activeTab: string;
  costPoints: number;
  report: Record<string, unknown> | null | undefined;
  result: NonNullable<AiTaskData["result"]>;
}) {
  const content = getTabContent(activeTab, report, result);

  return (
    <div className="lq-analysis-output">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-extrabold text-[#111827]">{activeTab}</h2>
        <span className="lq-cost-tag">已扣除 {costPoints} 积分</span>
      </div>
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

  return message.includes(":") ? message.split(":").slice(1).join(":") : message;
}

function createClientRequestId() {
  return `analysis-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}
