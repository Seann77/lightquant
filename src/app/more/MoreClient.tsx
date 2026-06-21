"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, BarChart3, ChevronDown, CircleDollarSign, HelpCircle, MessageCircle } from "lucide-react";
import { ContactModal } from "@/components/shell/ContactModal";
import { moreItems } from "@/lib/mock-data";

type MoreItem = (typeof moreItems)[number];

function openRecharge() {
  window.dispatchEvent(new Event("lightquant:open-recharge"));
}

function openWechat() {
  window.dispatchEvent(new Event("lightquant:open-wechat"));
}

function MoreItemContent({ item, paymentFeatureEnabled = false }: { item: MoreItem; paymentFeatureEnabled?: boolean }) {
  if (item.variant === "points") {
    return (
      <div>
        <ul className="m-0 grid gap-3 p-0">
          {item.rules.map((rule) => (
            <li className="flex items-start gap-2" key={rule.label}>
              <span className="mt-[2px] text-[#0b63ff]">{rule.icon === "add_circle" ? "+" : "-"}</span>
              <span>
                <strong>{rule.label}</strong>
                {rule.text}
              </span>
            </li>
          ))}
        </ul>
        {paymentFeatureEnabled ? (
          <button className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#0b63ff]" onClick={openRecharge} type="button">
            前往充值中心
            <ArrowRight aria-hidden="true" size={15} />
          </button>
        ) : null}
      </div>
    );
  }

  if (item.variant === "failure") {
    return (
      <div>
        <p className="m-0">
          如果由于系统原因或输入无法解析导致策略代码生成失败，系统将<strong>不会扣除</strong>您的积分。
        </p>
        <p className="mb-0 mt-3 rounded-lg border border-[#d9e4f5] bg-white/65 p-3 text-xs text-[#5b6472]">
          注：若因网络异常中断，扣除的积分将在 2 小时内自动原路退回至您的账户。
        </p>
      </div>
    );
  }

  if (item.variant === "danger") {
    return (
      <p className="m-0">
        LightQuant 提供的所有策略生成与代码转换结果仅供学习和参考，不构成任何投资建议。
        <br />
        <br />
        <strong>量化交易存在极高的市场风险。</strong>
        过往的回测数据不能保证未来的实际收益。用户在将任何策略应用于实盘交易前，需充分理解代码逻辑，并独立承担由此产生的全部投资风险。入市需谨慎。
      </p>
    );
  }

  return <p className="m-0">{item.body}</p>;
}

function getIcon(item: MoreItem) {
  if (item.variant === "points") {
    return <CircleDollarSign aria-hidden="true" size={19} />;
  }

  if (item.variant === "failure") {
    return <HelpCircle aria-hidden="true" size={19} />;
  }

  if (item.variant === "danger") {
    return <AlertTriangle aria-hidden="true" size={19} />;
  }

  return <BarChart3 aria-hidden="true" size={19} />;
}

export function MoreClient({ paymentFeatureEnabled = false }: { paymentFeatureEnabled?: boolean }) {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <section className="lq-support-page">
        <header className="lq-support-header">
          <h1>更多信息与支持</h1>
          <p>了解 LightQuant（轻量化）的详细使用规则与常见问题。</p>
        </header>

        <section aria-label="常见问题" className="lq-faq-stack">
          {moreItems.map((item) => (
            <details className="lq-faq-card" key={item.title}>
              <summary>
                <div className="lq-faq-row">
                  <div className={`lq-faq-title ${item.variant === "danger" ? "is-danger" : ""}`}>
                    <span className="lq-faq-icon">{getIcon(item)}</span>
                    {item.title}
                  </div>
                  <span className="lq-faq-arrow">
                    <ChevronDown aria-hidden="true" size={18} />
                  </span>
                </div>
              </summary>
              <div className={`lq-faq-content ${item.variant === "danger" ? "is-danger" : ""}`}>
                <MoreItemContent item={item} paymentFeatureEnabled={paymentFeatureEnabled} />
              </div>
            </details>
          ))}
        </section>

        <section className="lq-support-cta">
          <div>
            <h2>需要人工帮助？</h2>
            <p>联系我们的技术支持团队，获取定制化的策略协助。</p>
          </div>
          <div className="lq-cta-actions">
            <button className="lq-cta-btn is-secondary" data-testid="contact-open" onClick={() => setContactOpen(true)} type="button">
              <MessageCircle aria-hidden="true" size={17} />
              联系我们
            </button>
            <button className="lq-cta-btn is-primary" onClick={openWechat} type="button">
              <MessageCircle aria-hidden="true" size={17} />
              加入微信群
            </button>
          </div>
        </section>
      </section>

      <ContactModal onClose={() => setContactOpen(false)} open={contactOpen} />
    </>
  );
}
