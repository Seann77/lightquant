import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { moreItems } from "@/lib/mock-data";

export const metadata = {
  title: "更多信息与支持 - LightQuant 轻量化"
};

type MoreItem = (typeof moreItems)[number];

function MoreItemContent({ item }: { item: MoreItem }) {
  if (item.variant === "points") {
    return (
      <ul className="space-y-sm text-body-md text-on-surface-variant">
        {item.rules.map((rule) => (
          <li className="flex items-start gap-sm" key={rule.label}>
            <MaterialIcon className="mt-[2px] text-primary-bright" size={20}>
              {rule.icon}
            </MaterialIcon>
            <span>
              <strong>{rule.label}</strong>
              {rule.text}
            </span>
          </li>
        ))}
        <li className="flex items-start gap-sm pt-xs">
          <button className="flex items-center gap-xxs text-link-md font-medium text-primary-bright hover:underline" type="button">
            前往充值中心
            <MaterialIcon size={16}>arrow_forward</MaterialIcon>
          </button>
        </li>
      </ul>
    );
  }

  if (item.variant === "failure") {
    return (
      <div>
        <p className="mb-sm text-body-md text-on-surface-variant">
          如果由于系统原因或输入无法解析导致策略代码生成失败，系统将<strong>不会扣除</strong>您的积分。
        </p>
        <div className="rounded-lg border border-outline-variant/50 bg-surface-container p-md">
          <p className="text-caption-md text-secondary">
            注：若因网络异常中断，扣除的积分将在 2 小时内自动原路退回至您的账户。
          </p>
        </div>
      </div>
    );
  }

  if (item.variant === "danger") {
    return (
      <div className="flex items-start gap-md">
        <MaterialIcon className="text-bloom-coral" size={24}>
          warning
        </MaterialIcon>
        <p className="text-body-md leading-relaxed text-on-surface-variant">
          LightQuant 提供的所有策略生成与代码转换结果仅供学习和参考，不构成任何投资建议。
          <br />
          <br />
          <strong>量化交易存在极高的市场风险。</strong>
          过往的回测数据不能保证未来的实际收益。用户在将任何策略应用于实盘交易前，需充分理解代码逻辑，并独立承担由此产生的全部投资风险。入市需谨慎。
        </p>
      </div>
    );
  }

  return <p className="text-body-md text-on-surface-variant">{item.body}</p>;
}

export default function MorePage() {
  return (
    <section className="min-h-full px-md py-xl md:px-xxl md:py-xxl">
      <div className="mx-auto max-w-4xl">
        <header className="mb-section">
          <h1 className="mb-sm text-display-lg font-bold tracking-tight text-ink">更多信息与支持</h1>
          <p className="text-body-lg text-secondary">了解 LightQuant (轻量化) 的详细使用规则与常见问题。</p>
        </header>

        <div className="mb-section flex flex-col gap-md">
          {moreItems.map((item) => (
            <details
              className="group overflow-hidden rounded-xl border border-steel/40 bg-paper shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              key={item.title}
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between bg-paper p-xl text-left transition-colors hover:bg-surface-container-low [&::-webkit-details-marker]:hidden">
                <span className={`text-display-xs font-semibold ${item.variant === "danger" ? "text-bloom-deep" : "text-ink"}`}>
                  {item.title}
                </span>
                <MaterialIcon className="text-secondary transition-transform duration-300 group-open:rotate-180">expand_more</MaterialIcon>
              </summary>
              <div
                className={`border-t px-xl py-lg ${
                  item.variant === "danger" ? "border-error-container bg-error-container/20" : "border-steel/20 bg-cloud"
                }`}
              >
                <MoreItemContent item={item} />
              </div>
            </details>
          ))}
        </div>

        <section className="flex flex-col items-center justify-between gap-md overflow-hidden rounded-2xl bg-ink p-lg text-paper md:flex-row">
          <div className="flex-1">
            <h2 className="mb-xxs text-display-sm font-bold">需要人工帮助？</h2>
            <p className="text-body-md text-steel">联系我们的技术支持团队，获取定制化的策略协助。</p>
          </div>
          <div className="flex w-full gap-sm md:w-auto">
            <Button
              className="flex-1 md:flex-none"
              size="sm"
              type="button"
              variant="paper"
            >
              联系我们
            </Button>
            <Button
              className="flex-1 md:flex-none"
              size="sm"
              type="button"
              variant="light-outline"
            >
              加入微信群
            </Button>
          </div>
        </section>
      </div>
    </section>
  );
}
