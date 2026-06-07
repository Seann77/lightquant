"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Bot,
  CheckCircle2,
  Code2,
  DollarSign,
  FileUp,
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

type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: { code: string; message: string }; requestId: string };

type AiTaskData = {
  task: {
    id: string;
    type: string;
    status: string;
    costPoints: number;
  };
  result: {
    scopeStatus: "in_scope" | "out_of_scope";
    generatedCode: string | null;
    explanation: string | null;
    migrationNotes: string | null;
    riskWarnings: string[];
    reportJson: Record<string, unknown> | null;
  } | null;
  creditAccount: {
    balance: number;
  };
  duplicated: boolean;
};

type ChatClientProps = {
  mode: "strategy" | "convert";
};

const conversionTabs = ["目标平台代码", "迁移说明", "风险提醒"] as const;

export function ChatClient({ mode }: ChatClientProps) {
  if (mode === "convert") {
    return <ConvertModeContent />;
  }

  return <StrategyModeContent />;
}

function StrategyModeContent() {
  const [targetPlatform, setTargetPlatform] = useState(chatPlatformOptions[0]);
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [taskData, setTaskData] = useState<AiTaskData | null>(null);
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
    setSubmittedPrompt(prompt.trim() || (uploadedFile ? `已上传文件：${uploadedFile.originalName}` : ""));

    try {
      const data = await createAiTask({
        type: "strategy_generation",
        targetPlatform,
        prompt,
        inputFileId: uploadedFile?.fileId,
        clientRequestId: createClientRequestId("strategy")
      });

      setTaskData(data);
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (submitError) {
      setError(getFriendlyError(submitError));
    } finally {
      setLoading(false);
    }
  }

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
            <ChatBubble role="assistant" text="请输入策略需求，我会在服务端创建 AI 任务，成功后再扣除 50 积分。" />
            {submittedPrompt ? <ChatBubble role="user" text={submittedPrompt} /> : null}
            {loading ? <ChatBubble loading role="assistant" text="正在生成策略..." /> : null}
            {taskData?.result ? (
              <div className="lq-assistant-row">
                <StrategyResult data={taskData} />
              </div>
            ) : null}
            {error ? (
              <div className="lq-assistant-row">
                <ErrorPanel message={error} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="lq-composer-wrap">
          <div className="lq-composer">
            <textarea
              className="lq-composer-textarea"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="输入策略需求，或粘贴代码片段..."
              value={prompt}
            />
            <div className="lq-composer-bottom">
              <button className="lq-upload-chip" disabled={uploading} onClick={() => fileInputRef.current?.click()} type="button">
                <Paperclip aria-hidden="true" size={18} />
                上传策略/日志 (.py, .txt)
              </button>
              <input accept=".py,.txt" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
              <div className="lq-composer-actions">
                <div className="lq-cost-pill">
                  <DollarSign aria-hidden="true" />
                  <span>每次策略生成消耗 50 积分</span>
                </div>
                <button
                  className="lq-primary-btn"
                  disabled={loading || (!prompt.trim() && !uploadedFile) || uploadedFile?.scanStatus === "BLOCKED"}
                  onClick={handleSubmit}
                  type="button"
                >
                  {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Send aria-hidden="true" size={18} />}
                  {loading ? "生成中" : "发送"}
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
      const data = await createAiTask({
        type: "code_conversion",
        sourcePlatform,
        targetPlatform,
        inputCode,
        prompt,
        inputFileId: uploadedFile?.fileId,
        clientRequestId: createClientRequestId("convert")
      });

      setTaskData(data);
      setActiveTab(conversionTabs[0]);
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (submitError) {
      setError(getFriendlyError(submitError));
    } finally {
      setLoading(false);
    }
  }

  const result = taskData?.result;
  const panelContent = getConversionTabContent(activeTab, result);

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
                  上传 .py/.txt
                </button>
                <input accept=".py,.txt" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
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
                ) : (
                  <div className="lq-result-placeholder">
                    <BotIcon />
                    <span>{loading ? "正在转换策略代码..." : "转换结果将在这里显示"}</span>
                  </div>
                )}
              </div>
            </div>
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
              {loading ? "转换中..." : "开始转换"}
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
      {result.explanation ? <p className="m-0 text-sm leading-7 text-[#5b6472]">{result.explanation}</p> : null}
      {result.generatedCode ? (
        <pre className="lq-code-block app-scrollbar">
          <code>{result.generatedCode}</code>
        </pre>
      ) : null}
      <ResultNotes riskWarnings={result.riskWarnings} />
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

  return (
    <div className={`lq-file-status ${blocked ? "is-blocked" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusIcon aria-hidden="true" size={16} />
        <span>{file.originalName}</span>
        <span>{getScanStatusText(file)}</span>
      </div>
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

async function createAiTask(input: {
  type: "strategy_generation" | "code_conversion";
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

function createClientRequestId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}
