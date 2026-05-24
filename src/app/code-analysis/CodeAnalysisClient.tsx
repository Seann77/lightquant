"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { codeAnalysisPlatforms, codeAnalysisTabs } from "@/lib/mock-data";

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
    <section className="mx-auto mt-xl flex w-full max-w-[1280px] flex-col items-center px-md pb-xxl md:px-xxl">
      <header className="mb-lg w-full max-w-3xl text-center">
        <h1 className="mb-sm text-display-lg font-bold tracking-tight text-ink">代码翻译解析</h1>
        <p className="mb-xs text-body-lg text-secondary">将策略代码翻译成清晰的自然语言说明，并识别逻辑结构与潜在风险</p>
        <p className="inline-block rounded-full bg-primary-soft/50 px-sm py-xxs text-caption-md text-primary-bright">
          支持 PTrade、聚宽、QMT 策略代码
        </p>
        <p className="mt-xs text-caption-md text-secondary">每次代码解析消耗 100 积分</p>
      </header>

      <section className="mb-xl w-full max-w-4xl rounded-xl border border-surface-container bg-paper p-lg shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="mb-sm flex flex-wrap items-center gap-md">
          <label className="flex items-center gap-xs text-caption-bold text-ink">
            代码平台:
            <select
              className="rounded-md border border-steel bg-surface-container-low px-2 py-1 text-body-md text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              onChange={(event) => setPlatform(event.target.value)}
              value={platform}
            >
              {codeAnalysisPlatforms.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <button
            className="ml-auto flex items-center gap-xs rounded-md px-sm py-1 text-button-md text-primary transition-colors hover:bg-primary-soft/50"
            type="button"
          >
            <MaterialIcon size={18}>upload_file</MaterialIcon>
            上传 .py / .txt
          </button>
        </div>

        <div className="relative mb-sm h-52 w-full overflow-hidden rounded-lg border border-outline-variant bg-[#fafafa] transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <div className="absolute bottom-0 left-0 top-0 flex w-10 select-none flex-col items-center border-r border-outline-variant bg-surface-container-lowest pt-sm font-mono text-caption-sm text-outline">
            {[1, 2, 3, 4, 5].map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <textarea
            className="h-full w-full resize-none border-none bg-transparent py-sm pl-12 pr-md font-mono text-body-md text-ink outline-none placeholder:text-outline focus:ring-0"
            onChange={(event) => setInputCode(event.target.value)}
            placeholder="请粘贴需要解析的策略代码..."
            value={inputCode}
          />
        </div>

        <div className="flex items-center justify-between gap-md">
          <span className="flex items-center gap-xxs text-caption-md text-secondary">
            <MaterialIcon className="text-primary-bright" size={16}>verified_user</MaterialIcon>
            解析结果仅供学习参考，请自行复核代码逻辑
          </span>
          <div className="flex gap-sm">
            <button
              className="rounded-md border border-steel px-md py-2 text-button-md text-secondary transition-colors hover:bg-surface-container-low hover:text-ink"
              onClick={() => {
                setInputCode("");
                setData(null);
                setError("");
              }}
              type="button"
            >
              清空内容
            </button>
            <Button className="px-xl py-2 shadow-sm" disabled={loading || !inputCode.trim()} onClick={handleSubmit} type="button">
              <MaterialIcon size={18}>play_arrow</MaterialIcon>
              {loading ? "解析中..." : "开始解析"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-md rounded-lg border border-error-container bg-error-container/20 px-sm py-sm text-caption-md text-bloom-deep">
            {error}
          </div>
        ) : null}
      </section>

      <section className="w-full max-w-4xl">
        <div className="mb-md flex overflow-x-auto border-b border-steel app-scrollbar">
          {codeAnalysisTabs.map((tab) => (
            <button
              className={`whitespace-nowrap border-b-2 px-md py-sm text-button-md transition-colors ${
                tab === activeTab ? "border-primary text-primary" : "border-transparent text-secondary hover:text-ink"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {data?.result ? (
          <AnalysisResult activeTab={activeTab} costPoints={data.task.costPoints} report={report} result={data.result} />
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-steel bg-paper p-xxl text-center">
            <div className="mb-md flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
              <MaterialIcon className="text-outline" size={32}>analytics</MaterialIcon>
            </div>
            <h2 className="mb-xs text-body-emphasis text-ink">解析结果将在这里显示</h2>
            <p className="max-w-sm text-caption-md text-secondary">粘贴您的策略代码并点击“开始解析”，系统将自动生成详细的说明报告。</p>
          </div>
        )}
      </section>
    </section>
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
    <div className="rounded-xl border border-surface-container bg-paper p-xl shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="mb-md flex items-center justify-between gap-sm">
        <h2 className="text-body-emphasis text-ink">{activeTab}</h2>
        <span className="rounded-full bg-primary-soft px-sm py-xxs text-caption-sm text-primary-bright">已扣除 {costPoints} 积分</span>
      </div>
      <div className="space-y-sm text-body-md text-on-surface-variant">
        {content.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
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
