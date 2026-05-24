"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { chatPlatformOptions, convertPlatforms } from "@/lib/mock-data";

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

export function ChatClient({ mode }: ChatClientProps) {
  if (mode === "convert") {
    return <ConvertModeContent />;
  }

  return <StrategyModeContent />;
}

function StrategyModeContent() {
  const [targetPlatform, setTargetPlatform] = useState(chatPlatformOptions[0]);
  const [prompt, setPrompt] = useState("");
  const [taskData, setTaskData] = useState<AiTaskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const data = await createAiTask({
        type: "strategy_generation",
        targetPlatform,
        prompt,
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
    <section className="relative flex h-full min-h-full flex-col overflow-hidden bg-paper">
      <div className="flex flex-shrink-0 items-center gap-md overflow-x-auto border-b border-surface-container-highest bg-surface-bright px-xl py-sm">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-md">
          <span className="whitespace-nowrap text-caption-bold text-secondary">目标平台:</span>
          {chatPlatformOptions.map((platform) => {
            const active = platform === targetPlatform;

            return (
              <button
                className={`flex whitespace-nowrap rounded-full border px-sm py-xs text-button-sm transition-colors ${
                  active
                    ? "items-center gap-xxs border-primary bg-primary-container text-on-primary-container"
                    : "border-steel bg-paper text-secondary hover:bg-fog"
                }`}
                key={platform}
                onClick={() => setTargetPlatform(platform)}
                type="button"
              >
                {active ? <MaterialIcon size={14}>check_circle</MaterialIcon> : null}
                {platform}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background p-xl pb-[180px] app-scrollbar">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-xl">
          <ChatBubble role="assistant" text="请输入策略需求，我会在服务端创建 AI 任务，成功后再扣除 50 积分。" />
          {prompt && taskData ? <ChatBubble role="user" text={prompt} /> : null}
          {loading ? <ChatBubble role="assistant" text="正在生成策略..." loading /> : null}
          {taskData?.result ? <StrategyResult data={taskData} /> : null}
          {error ? <ErrorPanel message={error} /> : null}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center bg-gradient-to-t from-paper via-paper to-transparent px-xl pb-xl pt-xl">
        <div className="relative flex w-full max-w-4xl flex-col rounded-xl border border-steel bg-paper shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-colors focus-within:border-primary">
          <textarea
            className="max-h-[200px] min-h-20 w-full resize-none border-none bg-transparent p-md text-body-md text-ink outline-none placeholder:text-secondary-fixed-dim focus:ring-0"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="输入策略需求，或粘贴代码片段..."
            value={prompt}
          />
          <div className="flex items-center justify-between rounded-b-xl border-t border-surface-container-highest bg-surface-bright p-sm">
            <button
              className="flex items-center gap-xs rounded px-sm py-xs text-button-sm text-secondary transition-colors hover:bg-surface-container hover:text-ink"
              type="button"
            >
              <MaterialIcon size={18}>attach_file</MaterialIcon>
              上传策略/日志 (.py, .txt)
            </button>
            <Button className="h-10 px-xl py-xs shadow-sm" disabled={loading || !prompt.trim()} onClick={handleSubmit} size="sm" type="button">
              <MaterialIcon size={18}>send</MaterialIcon>
              {loading ? "生成中" : "发送"}
            </Button>
          </div>
        </div>
        <div className="mt-xs text-center text-caption-sm text-secondary-fixed-dim">AI 生成的策略代码需自行回测验证，投资有风险。</div>
      </div>
    </section>
  );
}

function ConvertModeContent() {
  const [sourcePlatform, setSourcePlatform] = useState(convertPlatforms.source[0]);
  const [targetPlatform, setTargetPlatform] = useState(convertPlatforms.target[0]);
  const [inputCode, setInputCode] = useState("");
  const [prompt, setPrompt] = useState("");
  const [taskData, setTaskData] = useState<AiTaskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        clientRequestId: createClientRequestId("convert")
      });

      setTaskData(data);
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (submitError) {
      setError(getFriendlyError(submitError));
    } finally {
      setLoading(false);
    }
  }

  const result = taskData?.result;

  return (
    <section className="flex min-h-full flex-col p-md md:p-xxl">
      <section className="mx-auto mb-lg max-w-3xl space-y-sm text-center">
        <h1 className="text-display-lg font-bold tracking-tight text-ink">平台代码转换</h1>
        <p className="text-body-lg leading-relaxed text-secondary">将不同量化平台的策略代码转换为目标平台可读、可改、可验证的版本</p>
      </section>

      <section className="mx-auto mb-xl flex w-full max-w-5xl flex-col gap-lg rounded-16 border border-surface-container-high bg-paper p-lg shadow-soft-lift">
        <div className="flex flex-wrap items-center justify-between gap-md rounded-lg border border-surface-container-highest bg-surface-container-low p-md sm:flex-nowrap">
          <PlatformSelect label="源平台" onChange={setSourcePlatform} options={convertPlatforms.source} tone="muted" value={sourcePlatform} />
          <div className="flex items-center justify-center px-md text-outline">
            <MaterialIcon size={24}>arrow_forward</MaterialIcon>
          </div>
          <PlatformSelect label="目标平台" onChange={setTargetPlatform} options={convertPlatforms.target} tone="primary" value={targetPlatform} />
        </div>

        <div className="grid min-h-[430px] grid-cols-1 gap-lg lg:grid-cols-2">
          <div className="flex min-h-0 flex-col gap-sm">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-steel/50 bg-surface">
              <div className="flex items-center justify-between border-b border-steel/30 bg-surface-bright px-md py-sm">
                <div className="flex items-center gap-sm">
                  <MaterialIcon className="text-outline" size={18}>code</MaterialIcon>
                  <span className="text-caption-bold text-ink">源代码输入</span>
                </div>
                <button className="flex items-center gap-xxs rounded border border-steel/40 bg-canvas px-sm py-xxs text-caption-sm text-secondary transition-colors hover:text-primary-bright" type="button">
                  <MaterialIcon size={16}>upload_file</MaterialIcon>
                  上传 .py / .txt
                </button>
              </div>
              <textarea
                className="min-h-[260px] flex-1 resize-none border-none bg-transparent p-md font-mono text-[14px] leading-relaxed text-charcoal outline-none placeholder:text-secondary-fixed-dim focus:ring-0"
                onChange={(event) => setInputCode(event.target.value)}
                placeholder="请粘贴需要转换的策略代码..."
                value={inputCode}
              />
            </div>

            <div className="space-y-sm rounded-xl border border-steel/50 bg-surface p-md">
              <label className="flex items-center gap-xs text-caption-bold text-ink">
                <MaterialIcon className="text-primary-bright" size={18}>chat_bubble_outline</MaterialIcon>
                转换要求 (可选)
              </label>
              <textarea
                className="h-16 w-full resize-none rounded-lg border border-steel/40 bg-canvas p-sm text-body-md text-ink outline-none placeholder:text-secondary-fixed-dim focus:border-primary-bright focus:ring-1 focus:ring-primary-bright"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例如：保留原策略的止损逻辑，优先使用目标平台的内置数据获取函数..."
                value={prompt}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-sm">
            <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-charcoal bg-ink shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="flex border-b border-charcoal/50 bg-ink-deep">
                {["目标平台代码", "迁移说明", "风险提醒"].map((tab, index) => (
                  <button
                    className={`flex-1 border-b-2 px-md py-sm text-center text-caption-bold transition-colors ${
                      index === 0 ? "border-primary-bright bg-ink-soft/50 text-canvas" : "border-transparent text-outline"
                    }`}
                    key={tab}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto bg-[#1e1e1e] p-md app-scrollbar">
                <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-steel">
                  <code>{result?.generatedCode ?? result?.explanation ?? "转换结果将在这里显示"}</code>
                </pre>
              </div>
            </div>
            {result ? <ResultNotes migrationNotes={result.migrationNotes} riskWarnings={result.riskWarnings} /> : null}
            {error ? <ErrorPanel message={error} /> : null}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-surface-container-highest pt-md">
          <div className="flex items-center gap-md">
            <Button className="h-10 rounded-lg bg-primary-container px-xl py-sm shadow-[0_4px_12px_rgba(2,74,216,0.2)]" disabled={loading || !inputCode.trim()} onClick={handleSubmit} type="button">
              <MaterialIcon size={20}>auto_awesome</MaterialIcon>
              {loading ? "转换中..." : "开始转换"}
            </Button>
            <button
              className="rounded-lg border border-transparent px-md py-sm text-button-md text-secondary transition-colors hover:border-steel/40 hover:text-ink"
              onClick={() => {
                setInputCode("");
                setPrompt("");
                setTaskData(null);
                setError("");
              }}
              type="button"
            >
              清空内容
            </button>
          </div>
          <div className="flex items-center gap-xs rounded-full border border-steel/20 bg-surface-container px-sm py-xxs text-outline">
            <MaterialIcon className="text-bloom-coral" size={16}>generating_tokens</MaterialIcon>
            <span className="text-caption-sm">每次平台转换消耗 200 积分</span>
          </div>
        </div>
      </section>
    </section>
  );
}

function ChatBubble({ loading = false, role, text }: { loading?: boolean; role: "user" | "assistant"; text: string }) {
  if (role === "user") {
    return (
      <div className="flex w-full justify-end">
        <div className="rounded-[16px] rounded-br-none bg-primary p-md text-on-primary shadow-sm">
          <p className="whitespace-pre-wrap text-body-md">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-[85%] items-end gap-sm">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary-fixed bg-primary-container text-on-primary-container">
          <MaterialIcon size={18}>smart_toy</MaterialIcon>
        </div>
        <div className="rounded-[16px] rounded-bl-none border border-surface-container-highest bg-paper p-md text-on-surface shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className={`flex items-center gap-xs text-secondary ${loading ? "animate-pulse" : ""}`}>
            {loading ? <MaterialIcon className="animate-spin" size={18}>hourglass_empty</MaterialIcon> : null}
            <span className="text-body-md">{text}</span>
          </div>
        </div>
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
    <div className="rounded-xl border border-surface-container-highest bg-paper p-md shadow-sm">
      <div className="mb-sm flex items-center justify-between gap-sm">
        <h2 className="text-body-emphasis text-ink">{outOfScope ? "模块范围提示" : "策略生成结果"}</h2>
        <span className="rounded-full bg-primary-soft px-sm py-xxs text-caption-sm text-primary-bright">已扣除 {data.task.costPoints} 积分</span>
      </div>
      <p className="mb-md text-body-md text-secondary">{result.explanation}</p>
      {result.generatedCode ? (
        <pre className="max-h-[360px] overflow-auto rounded-lg bg-[#1e1e1e] p-md font-mono text-[13px] leading-relaxed text-steel app-scrollbar">
          <code>{result.generatedCode}</code>
        </pre>
      ) : null}
      <ResultNotes riskWarnings={result.riskWarnings} />
    </div>
  );
}

function ResultNotes({ migrationNotes, riskWarnings }: { migrationNotes?: string | null; riskWarnings: string[] }) {
  return (
    <div className="rounded-xl border border-steel/40 bg-surface p-md text-caption-md text-secondary">
      {migrationNotes ? <p className="mb-xs text-ink">{migrationNotes}</p> : null}
      {riskWarnings.length > 0 ? (
        <ul className="space-y-xxs">
          {riskWarnings.map((warning) => (
            <li className="flex gap-xs" key={warning}>
              <MaterialIcon className="text-bloom-coral" size={16}>warning</MaterialIcon>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-error-container bg-error-container/20 px-sm py-sm text-caption-md text-bloom-deep">
      {message}
    </div>
  );
}

function PlatformSelect({ label, onChange, options, tone, value }: { label: string; onChange: (value: string) => void; options: string[]; tone: "muted" | "primary"; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-xxs">
      <label className={`text-caption-bold ${tone === "primary" ? "text-primary-bright" : "text-outline"}`}>{label}</label>
      <select
        className={`w-full cursor-pointer rounded-lg border-none bg-transparent px-0 py-xs text-body-md outline-none focus:ring-0 ${
          tone === "primary" ? "font-semibold text-primary-deep" : "text-ink"
        }`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

async function createAiTask(input: {
  type: "strategy_generation" | "code_conversion";
  sourcePlatform?: string;
  targetPlatform?: string;
  prompt?: string;
  inputCode?: string;
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
