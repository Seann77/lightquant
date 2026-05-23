"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type RechargeModalProps = {
  onClose: () => void;
  open: boolean;
  points: number;
};

type PlanId = "starter" | "standard" | "pro";
type PaymentMethod = "wechat" | "alipay";

const rechargePlans: Array<{
  id: PlanId;
  name: string;
  price: string;
  points: string;
  recommended?: boolean;
}> = [
  { id: "starter", name: "入门包", price: "9.9", points: "1,000" },
  { id: "standard", name: "标准包", price: "29.9", points: "3,500", recommended: true },
  { id: "pro", name: "专业包", price: "59.9", points: "8,000" }
];

const paymentMethods: Array<{ id: PaymentMethod; icon: string; label: string }> = [
  { id: "wechat", icon: "forum", label: "微信支付" },
  { id: "alipay", icon: "account_balance_wallet", label: "支付宝" }
];

export function RechargeModal({ onClose, open, points }: RechargeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wechat");
  const [demoMessage, setDemoMessage] = useState(false);

  if (!open) {
    return null;
  }

  const activePlan = rechargePlans.find((plan) => plan.id === selectedPlan) ?? rechargePlans[1];
  const activePayment = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-md backdrop-blur-[2px]" role="presentation">
      <div
        aria-labelledby="recharge-modal-title"
        aria-modal="true"
        className="relative w-full max-w-[560px] rounded-xl border border-outline-variant/60 bg-paper p-xl shadow-modal"
        role="dialog"
      >
        <button
          aria-label="关闭充值弹窗"
          className="absolute right-md top-md text-secondary transition-colors hover:text-primary"
          onClick={onClose}
          type="button"
        >
          <MaterialIcon size={20}>close</MaterialIcon>
        </button>

        <div className="mb-lg">
          <h2 className="text-display-md font-semibold text-on-background" id="recharge-modal-title">
            积分充值
          </h2>
          <p className="mt-xs text-caption-md text-secondary">
            当前可用积分 <span className="font-bold text-primary-bright">{points}</span>
          </p>
        </div>

        <div className="mb-lg grid grid-cols-1 gap-sm md:grid-cols-3">
          {rechargePlans.map((plan) => {
            const active = plan.id === selectedPlan;

            return (
              <button
                aria-pressed={active}
                className={`relative rounded-xl border p-md text-left transition-all ${
                  active
                    ? "border-primary-bright bg-primary-fixed shadow-soft-lift"
                    : "border-steel/60 bg-paper hover:border-primary-soft hover:bg-surface-container-low"
                }`}
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setDemoMessage(false);
                }}
                type="button"
              >
                {plan.recommended ? (
                  <span className="absolute right-sm top-sm rounded-full bg-primary-bright px-xs py-xxs text-caption-sm font-bold text-on-primary">
                    推荐
                  </span>
                ) : null}
                <span className="mb-sm block text-body-emphasis text-ink">{plan.name}</span>
                <span className="mb-xs block text-price-md text-primary-bright">¥{plan.price}</span>
                <span className="text-caption-md text-on-surface-variant">获得 {plan.points} 积分</span>
              </button>
            );
          })}
        </div>

        <div className="mb-lg">
          <h3 className="mb-sm text-caption-bold text-ink">支付方式</h3>
          <div className="grid grid-cols-2 gap-sm">
            {paymentMethods.map((method) => {
              const active = method.id === paymentMethod;

              return (
                <button
                  aria-pressed={active}
                  className={`flex h-11 items-center justify-center gap-xs rounded-lg border text-button-md transition-colors ${
                    active
                      ? "border-primary-bright bg-primary-soft text-primary"
                      : "border-steel/60 bg-paper text-secondary hover:bg-surface-container-low hover:text-primary"
                  }`}
                  key={method.id}
                  onClick={() => {
                    setPaymentMethod(method.id);
                    setDemoMessage(false);
                  }}
                  type="button"
                >
                  <MaterialIcon size={18}>{method.icon}</MaterialIcon>
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>

        {demoMessage ? (
          <div className="mb-md flex items-start gap-xs rounded-lg border border-primary-soft bg-surface-container-low px-sm py-sm text-caption-md text-primary">
            <MaterialIcon className="mt-[1px]" size={16}>
              info
            </MaterialIcon>
            <span>支付功能暂未接入，当前为前端演示。</span>
          </div>
        ) : null}

        <Button className="w-full" onClick={() => setDemoMessage(true)} type="button">
          <MaterialIcon size={18}>payments</MaterialIcon>
          {activePayment.label} ¥{activePlan.price}
        </Button>
      </div>
    </div>
  );
}
