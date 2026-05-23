import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { codeAnalysisPlatforms, codeAnalysisTabs } from "@/lib/mock-data";

export const metadata = {
  title: "代码翻译解析 - LightQuant 轻量化"
};

export default function CodeAnalysisPage() {
  return (
    <section className="mx-auto mt-xl flex w-full max-w-[1280px] flex-col items-center px-md pb-xxl md:px-xxl">
      <header className="mb-lg w-full max-w-3xl text-center">
        <h1 className="mb-sm text-display-lg font-bold tracking-tight text-ink">代码翻译解析</h1>
        <p className="mb-xs text-body-lg text-secondary">将策略代码翻译成清晰的自然语言说明，并识别逻辑结构与潜在风险</p>
        <p className="inline-block rounded-full bg-primary-soft/50 px-sm py-xxs text-caption-md text-primary-bright">
          支持 PTrade、聚宽、QMT 策略代码
        </p>
      </header>

      <section className="mb-xl w-full max-w-4xl rounded-xl border border-surface-container bg-paper p-lg shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="mb-sm flex flex-wrap items-center gap-md">
          <label className="flex items-center gap-xs text-caption-bold text-ink">
            代码平台:
            <select className="rounded-md border border-steel bg-surface-container-low px-2 py-1 text-body-md text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              {codeAnalysisPlatforms.map((platform) => (
                <option key={platform}>{platform}</option>
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
            placeholder="请粘贴需要解析的策略代码..."
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
              type="button"
            >
              清空内容
            </button>
            <Button className="px-xl py-2 shadow-sm" type="button">
              <MaterialIcon size={18}>play_arrow</MaterialIcon>
              开始解析
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full max-w-4xl">
        <div className="mb-md flex overflow-x-auto border-b border-steel app-scrollbar">
          {codeAnalysisTabs.map((tab, index) => (
            <button
              className={`whitespace-nowrap border-b-2 px-md py-sm text-button-md transition-colors ${
                index === 0 ? "border-primary text-primary" : "border-transparent text-secondary hover:text-ink"
              }`}
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-steel bg-paper p-xxl text-center">
          <div className="mb-md flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
            <MaterialIcon className="text-outline" size={32}>analytics</MaterialIcon>
          </div>
          <h2 className="mb-xs text-body-emphasis text-ink">解析结果将在这里显示</h2>
          <p className="max-w-sm text-caption-md text-secondary">粘贴您的策略代码并点击“开始解析”，系统将自动生成详细的说明报告。</p>
        </div>
      </section>
    </section>
  );
}
