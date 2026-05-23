import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { chatMessages, chatPlatformOptions, convertPlatforms } from "@/lib/mock-data";

type ChatPageProps = {
  searchParams: Promise<{
    mode?: string;
  }>;
};

type ChatMessage = (typeof chatMessages)[number];

export const metadata = {
  title: "对话页 - LightQuant 轻量化"
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { mode } = await searchParams;
  const activeMode = mode === "convert" ? "convert" : "strategy";

  if (activeMode === "convert") {
    return <ConvertModeContent />;
  }

  return <StrategyModeContent />;
}

function StrategyModeContent() {
  return (
    <section className="relative flex h-full min-h-full flex-col overflow-hidden bg-paper">
      <PlatformSelector />

      <div className="flex-1 overflow-y-auto bg-background p-xl pb-[150px] app-scrollbar">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-xl">
          <div className="h-md" />
          {chatMessages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <div className="h-xl" />
        </div>
      </div>

      <StrategyInputPanel />
    </section>
  );
}

function PlatformSelector() {
  return (
    <div className="flex flex-shrink-0 items-center gap-md overflow-x-auto border-b border-surface-container-highest bg-surface-bright px-xl py-sm">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-md">
        <span className="whitespace-nowrap text-caption-bold text-secondary">目标平台:</span>
        {chatPlatformOptions.map((platform, index) => {
          const active = index === 0;

          return (
            <button
              className={`flex whitespace-nowrap rounded-full border px-sm py-xs text-button-sm transition-colors ${
                active
                  ? "items-center gap-xxs border-primary bg-primary-container text-on-primary-container"
                  : "border-steel bg-paper text-secondary hover:bg-fog"
              }`}
              key={platform}
              type="button"
            >
              {active ? <MaterialIcon size={14}>check_circle</MaterialIcon> : null}
              {platform}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex w-full justify-end">
        <div className="flex max-w-[85%] flex-row-reverse items-end gap-sm">
          <div className="rounded-[16px] rounded-br-none bg-primary p-md text-on-primary shadow-sm">
            <p className="whitespace-pre-wrap text-body-md">{message.text}</p>
          </div>
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
          <div className="flex animate-pulse items-center gap-xs text-secondary">
            <MaterialIcon className="animate-spin" size={18}>
              hourglass_empty
            </MaterialIcon>
            <span className="text-body-md">{message.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyInputPanel() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center bg-gradient-to-t from-paper via-paper to-transparent px-xl pb-xl pt-xl">
      <div className="relative flex w-full max-w-4xl flex-col rounded-xl border border-steel bg-paper shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-colors focus-within:border-primary">
        <textarea
          className="max-h-[200px] min-h-20 w-full resize-none border-none bg-transparent p-md text-body-md text-ink outline-none placeholder:text-secondary-fixed-dim focus:ring-0"
          placeholder="输入策略需求，或粘贴代码片段..."
        />
        <div className="flex items-center justify-between rounded-b-xl border-t border-surface-container-highest bg-surface-bright p-sm">
          <button
            className="flex items-center gap-xs rounded px-sm py-xs text-button-sm text-secondary transition-colors hover:bg-surface-container hover:text-ink"
            type="button"
          >
            <MaterialIcon size={18}>attach_file</MaterialIcon>
            上传策略/日志 (.py, .txt)
          </button>
          <Button className="h-10 px-xl py-xs shadow-sm" size="sm" type="button">
            <MaterialIcon size={18}>send</MaterialIcon>
            发送
          </Button>
        </div>
      </div>
      <div className="mt-xs text-center text-caption-sm text-secondary-fixed-dim">AI 生成的策略代码需自行回测验证，投资有风险。</div>
    </div>
  );
}

function ConvertModeContent() {
  return (
    <section className="flex min-h-full flex-col p-md md:p-xxl">
      <section className="mx-auto mb-lg max-w-3xl space-y-sm text-center">
        <h1 className="text-display-lg font-bold tracking-tight text-ink">平台代码转换</h1>
        <p className="text-body-lg leading-relaxed text-secondary">将不同量化平台的策略代码转换为目标平台可读、可改、可验证的版本</p>
      </section>

      <section className="mx-auto mb-xl flex w-full max-w-5xl flex-col gap-lg rounded-16 border border-surface-container-high bg-paper p-lg shadow-soft-lift">
        <div className="flex flex-wrap items-center justify-between gap-md rounded-lg border border-surface-container-highest bg-surface-container-low p-md sm:flex-nowrap">
          <PlatformSelect label="源平台" options={convertPlatforms.source} tone="muted" />
          <div className="flex items-center justify-center px-md text-outline">
            <MaterialIcon size={24}>arrow_forward</MaterialIcon>
          </div>
          <PlatformSelect label="目标平台" options={convertPlatforms.target} tone="primary" />
        </div>

        <div className="grid h-[430px] min-h-0 grid-cols-1 gap-lg lg:grid-cols-2">
          <div className="flex h-full min-h-0 flex-col gap-sm">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-steel/50 bg-surface">
              <div className="flex items-center justify-between border-b border-steel/30 bg-surface-bright px-md py-sm">
                <div className="flex items-center gap-sm">
                  <MaterialIcon className="text-outline" size={18}>code</MaterialIcon>
                  <span className="text-caption-bold text-ink">源代码输入</span>
                </div>
                <button
                  className="flex items-center gap-xxs rounded border border-steel/40 bg-canvas px-sm py-xxs text-caption-sm text-secondary transition-colors hover:text-primary-bright"
                  type="button"
                >
                  <MaterialIcon size={16}>upload_file</MaterialIcon>
                  上传 .py / .txt
                </button>
              </div>
              <textarea
                className="min-h-[190px] flex-1 resize-none border-none bg-transparent p-md font-mono text-[14px] leading-relaxed text-charcoal outline-none placeholder:text-secondary-fixed-dim focus:ring-0"
                placeholder="请粘贴需要转换的策略代码..."
              />
            </div>

            <div className="space-y-sm rounded-xl border border-steel/50 bg-surface p-md">
              <label className="flex items-center gap-xs text-caption-bold text-ink">
                <MaterialIcon className="text-primary-bright" size={18}>chat_bubble_outline</MaterialIcon>
                转换要求 (可选)
              </label>
              <textarea
                className="h-16 w-full resize-none rounded-lg border border-steel/40 bg-canvas p-sm text-body-md text-ink outline-none placeholder:text-secondary-fixed-dim focus:border-primary-bright focus:ring-1 focus:ring-primary-bright"
                placeholder="例如：保留原策略的止损逻辑，优先使用目标平台的内置数据获取函数..."
              />
            </div>
          </div>

          <div className="flex h-full min-h-0 flex-col gap-sm">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-charcoal bg-ink shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="flex border-b border-charcoal/50 bg-ink-deep">
                {["目标平台代码", "迁移说明", "风险提醒"].map((tab, index) => (
                  <button
                    className={`flex-1 border-b-2 px-md py-sm text-center text-caption-bold transition-colors ${
                      index === 0
                        ? "border-primary-bright bg-ink-soft/50 text-canvas"
                        : "border-transparent text-outline hover:bg-ink-soft/30 hover:text-canvas"
                    }`}
                    key={tab}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col bg-[#1e1e1e]">
                <div className="absolute right-2 top-2 z-10">
                  <button
                    className="flex items-center gap-xs rounded bg-charcoal/80 px-sm py-xs text-caption-sm text-outline transition-colors hover:bg-charcoal hover:text-canvas"
                    type="button"
                  >
                    <MaterialIcon size={16}>content_copy</MaterialIcon>
                    复制代码
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-md app-scrollbar">
                  <ConvertCodePreview />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-surface-container-highest pt-md">
          <div className="flex items-center gap-md">
            <Button className="h-10 rounded-lg bg-primary-container px-xl py-sm shadow-[0_4px_12px_rgba(2,74,216,0.2)]" type="button">
              <MaterialIcon size={20}>auto_awesome</MaterialIcon>
              开始转换
            </Button>
            <button
              className="rounded-lg border border-transparent px-md py-sm text-button-md text-secondary transition-colors hover:border-steel/40 hover:text-ink"
              type="button"
            >
              清空内容
            </button>
          </div>
          <div className="flex items-center gap-xs rounded-full border border-steel/20 bg-surface-container px-sm py-xxs text-outline">
            <MaterialIcon className="text-bloom-coral" size={16}>generating_tokens</MaterialIcon>
            <span className="text-caption-sm">每次语言转换消耗 5 积分</span>
          </div>
        </div>
      </section>
    </section>
  );
}

function ConvertCodePreview() {
  return (
    <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-steel">
      <code>
        <span className="text-primary-soft">def</span> <span className="text-bloom-rose">initialize</span>(context):
        {"\n"}
        {"    "}
        <span className="text-outline"># 策略初始化，设置基准等</span>
        {"\n"}
        {"    "}g.security = <span className="text-storm-mist">'600036.SS'</span>
        {"\n"}
        {"    "}
        <span className="text-outline"># 已转换为 PTrade 兼容API</span>
        {"\n"}
        {"    "}set_universe([g.security])
        {"\n\n"}
        <span className="text-primary-soft">def</span> <span className="text-bloom-rose">handle_data</span>(context, data):
        {"\n"}
        {"    "}
        <span className="text-outline"># 获取历史数据 (PTrade格式)</span>
        {"\n"}
        {"    "}hist = get_history(g.security, <span className="text-storm-mist">'1d'</span>,{" "}
        <span className="text-primary-soft">10</span>, [<span className="text-storm-mist">'close'</span>])
        {"\n"}
        {"    "}
        <span className="text-primary-soft">if</span> <span className="text-primary-soft">not</span> hist.empty:
        {"\n"}
        {"        "}close_prices = hist[<span className="text-storm-mist">'close'</span>]
        {"\n"}
        {"        "}
        <span className="text-outline"># 计算均线</span>
        {"\n"}
        {"        "}ma5 = close_prices.rolling(<span className="text-primary-soft">5</span>).mean().iloc[-<span className="text-primary-soft">1</span>]
        {"\n"}
        {"        "}ma10 = close_prices.rolling(<span className="text-primary-soft">10</span>).mean().iloc[-<span className="text-primary-soft">1</span>]
        {"\n\n"}
        {"        "}
        <span className="text-primary-soft">if</span> ma5 &gt; ma10:
        {"\n"}
        {"            "}order_target_percent(g.security, <span className="text-primary-soft">1.0</span>)
        {"\n"}
        {"        "}
        <span className="text-primary-soft">elif</span> ma5 &lt; ma10:
        {"\n"}
        {"            "}order_target_percent(g.security, <span className="text-primary-soft">0.0</span>)
      </code>
    </pre>
  );
}

function PlatformSelect({ label, options, tone }: { label: string; options: string[]; tone: "muted" | "primary" }) {
  return (
    <div className="flex flex-1 flex-col gap-xxs">
      <label className={`text-caption-bold ${tone === "primary" ? "text-primary-bright" : "text-outline"}`}>{label}</label>
      <select
        className={`w-full cursor-pointer rounded-lg border-none bg-transparent px-0 py-xs text-body-md outline-none focus:ring-0 ${
          tone === "primary" ? "font-semibold text-primary-deep" : "text-ink"
        }`}
        defaultValue={options[0]}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
