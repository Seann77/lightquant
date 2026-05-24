"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type RechargeModalProps = {
  onClose: () => void;
  onRechargeSuccess: () => Promise<void> | void;
  open: boolean;
  points: number;
};

type PayChannel = "mock" | "wechat" | "alipay";

type RechargePlan = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  price: string;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  enabled: boolean;
  sort: number;
};

type RechargeOrder = {
  id: string;
  orderNo: string;
  amountCents: number;
  price: string;
  totalPoints: number;
  payChannel: PayChannel;
  status: "PENDING" | "PAID" | "CLOSED" | "FAILED";
};

type CreateOrderData = {
  order: RechargeOrder;
  payment: {
    provider: string;
    payChannel: PayChannel;
    status: RechargeOrder["status"];
    qrCodeText: string;
    pollUrl: string;
  };
  duplicated: boolean;
};

type ApiResponse<T> =
  | {
      success: true;
      data: T;
      requestId: string;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
      requestId: string;
    };

type PaymentMethod = {
  id: PayChannel;
  icon: string;
  label: string;
};

const paymentMethods: PaymentMethod[] = [
  { id: "mock", icon: "payments", label: "模拟支付" },
  { id: "wechat", icon: "forum", label: "微信支付" },
  { id: "alipay", icon: "account_balance_wallet", label: "支付宝" }
];

export function RechargeModal({ onClose, onRechargeSuccess, open, points }: RechargeModalProps) {
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState<PayChannel>("mock");
  const [orderData, setOrderData] = useState<CreateOrderData | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadPlans() {
      setLoadingPlans(true);
      setError("");

      try {
        const response = await fetch("/api/v1/recharge/plans", {
          cache: "no-store"
        });
        const payload = (await response.json()) as ApiResponse<{ items: RechargePlan[] }>;

        if (!payload.success) {
          throw new Error(payload.error.message);
        }

        if (!cancelled) {
          setPlans(payload.data.items);
          setSelectedPlanId((current) => payload.data.items.find((plan) => plan.id === current)?.id ?? payload.data.items[0]?.id ?? "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "充值套餐加载失败");
        }
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0],
    [plans, selectedPlanId]
  );
  const activePayment = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0];

  if (!open) {
    return null;
  }

  async function handleCreateOrder() {
    if (!activePlan) {
      setError("请选择充值套餐");
      return;
    }

    setCreatingOrder(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/v1/orders/recharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planId: activePlan.id,
          payChannel: paymentMethod,
          clientRequestId: createClientRequestId()
        })
      });
      const payload = (await response.json()) as ApiResponse<CreateOrderData>;

      if (!payload.success) {
        throw new Error(payload.error.message);
      }

      setOrderData(payload.data);
      setMessage("订单已创建，当前为模拟支付环境，请点击模拟支付确认。");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "订单创建失败");
    } finally {
      setCreatingOrder(false);
    }
  }

  async function handleMockNotify() {
    if (!orderData) {
      setError("请先创建充值订单");
      return;
    }

    setConfirmingPayment(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/v1/payments/mock/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: orderData.order.id,
          mockTradeNo: `MOCK-${orderData.order.orderNo}`,
          amountCents: orderData.order.amountCents
        })
      });
      const payload = (await response.json()) as ApiResponse<CreateOrderData>;

      if (!payload.success) {
        throw new Error(payload.error.message);
      }

      setOrderData((current) =>
        current
          ? {
              ...current,
              order: payload.data.order,
              payment: {
                ...current.payment,
                status: payload.data.order.status
              }
            }
          : current
      );
      setMessage("模拟支付成功，积分已由服务端入账。");
      await onRechargeSuccess();
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (notifyError) {
      setError(notifyError instanceof Error ? notifyError.message : "支付确认失败");
    } finally {
      setConfirmingPayment(false);
    }
  }

  function handlePlanChange(planId: string) {
    setSelectedPlanId(planId);
    setOrderData(null);
    setMessage("");
    setError("");
  }

  function handlePaymentChange(method: PayChannel) {
    setPaymentMethod(method);
    setOrderData(null);
    setMessage("");
    setError("");
  }

  const paid = orderData?.order.status === "PAID";

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
          {loadingPlans ? (
            <div className="col-span-full rounded-xl border border-dashed border-steel/60 p-md text-caption-md text-secondary">正在加载充值套餐...</div>
          ) : (
            plans.map((plan) => {
              const active = plan.id === selectedPlanId;
              const recommended = plan.id === "standard";

              return (
                <button
                  aria-pressed={active}
                  className={`relative rounded-xl border p-md text-left transition-all ${
                    active
                      ? "border-primary-bright bg-primary-fixed shadow-soft-lift"
                      : "border-steel/60 bg-paper hover:border-primary-soft hover:bg-surface-container-low"
                  }`}
                  key={plan.id}
                  onClick={() => handlePlanChange(plan.id)}
                  type="button"
                >
                  {recommended ? (
                    <span className="absolute right-sm top-sm rounded-full bg-primary-bright px-xs py-xxs text-caption-sm font-bold text-on-primary">
                      推荐
                    </span>
                  ) : null}
                  <span className="mb-sm block text-body-emphasis text-ink">{plan.name}</span>
                  <span className="mb-xs block text-price-md text-primary-bright">¥{trimPrice(plan.price)}</span>
                  <span className="text-caption-md text-on-surface-variant">获得 {plan.totalPoints.toLocaleString("zh-CN")} 积分</span>
                  {plan.bonusPoints > 0 ? (
                    <span className="mt-xxs block text-caption-sm text-primary-bright">含赠送 {plan.bonusPoints.toLocaleString("zh-CN")} 积分</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="mb-lg">
          <h3 className="mb-sm text-caption-bold text-ink">支付方式</h3>
          <div className="grid grid-cols-3 gap-sm">
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
                  onClick={() => handlePaymentChange(method.id)}
                  type="button"
                >
                  <MaterialIcon size={18}>{method.icon}</MaterialIcon>
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>

        {orderData ? (
          <div className="mb-md rounded-lg border border-steel/50 bg-surface-container-low px-sm py-sm text-caption-md text-secondary">
            <p>
              订单号 <span className="font-mono text-ink">{orderData.order.orderNo}</span>
            </p>
            <p>
              状态 <span className="font-semibold text-primary-bright">{orderData.order.status}</span>
            </p>
            <p className="truncate">模拟码 {orderData.payment.qrCodeText}</p>
          </div>
        ) : null}

        {message ? (
          <div className="mb-md flex items-start gap-xs rounded-lg border border-primary-soft bg-surface-container-low px-sm py-sm text-caption-md text-primary">
            <MaterialIcon className="mt-[1px]" size={16}>
              info
            </MaterialIcon>
            <span>{message}</span>
          </div>
        ) : null}

        {error ? (
          <div className="mb-md flex items-start gap-xs rounded-lg border border-error-container bg-error-container/20 px-sm py-sm text-caption-md text-bloom-deep">
            <MaterialIcon className="mt-[1px]" size={16}>
              error
            </MaterialIcon>
            <span>{error}</span>
          </div>
        ) : null}

        {orderData && !paid ? (
          <Button className="w-full" disabled={confirmingPayment} onClick={handleMockNotify} type="button">
            <MaterialIcon size={18}>verified</MaterialIcon>
            {confirmingPayment ? "确认中..." : "模拟支付确认"}
          </Button>
        ) : (
          <Button className="w-full" disabled={loadingPlans || creatingOrder || !activePlan || paid} onClick={handleCreateOrder} type="button">
            <MaterialIcon size={18}>payments</MaterialIcon>
            {paid ? "支付已完成" : creatingOrder ? "创建中..." : `${activePayment.label} ¥${activePlan ? trimPrice(activePlan.price) : "--"}`}
          </Button>
        )}
      </div>
    </div>
  );
}

function createClientRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function trimPrice(price: string) {
  return price.endsWith(".00") ? price.slice(0, -3) : price.replace(/0$/, "");
}

