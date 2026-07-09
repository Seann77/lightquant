"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type RechargeModalProps = {
  onClose: () => void;
  onRechargeSuccess: () => Promise<void> | void;
  open: boolean;
  points: number;
};

type PayChannel = "mock" | "wechat" | "alipay";
type OrderStatus = "PENDING" | "PAID" | "CLOSED" | "FAILED";
type PaymentActionType = "mock" | "redirect" | "qr_code";

type RechargePlan = {
  id: string;
  name: string;
  description: string;
  planType: "permanent" | "monthly";
  validityDays: number | null;
  purchaseLimit: number | null;
  alreadyPurchased: boolean;
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
  planId: string;
  amountCents: number;
  price: string;
  totalPoints: number;
  payChannel: PayChannel;
  status: OrderStatus;
  expiresAt?: string;
  expired?: boolean;
};

type PaymentAction = {
  type: PaymentActionType;
  provider: PayChannel;
  payChannel: PayChannel;
  status: OrderStatus;
  orderId: string;
  orderNo: string;
  expiresAt: string;
  pollUrl: string;
  redirectUrl?: string;
  formHtml?: string;
  qrCodeText?: string;
  mockPaymentUrl?: string;
};

type CreateOrderData = {
  order: RechargeOrder;
  paymentAction?: PaymentAction;
  payment?: PaymentAction;
  duplicated: boolean;
};

type PaymentStatusData = {
  order: RechargeOrder;
  payment: {
    paid: boolean;
    channel: PayChannel;
    amountCents: number;
    creditGranted: boolean;
    expired: boolean;
    expiresAt: string;
    latestTransactionStatus?: string | null;
    failedReason?: string | null;
  };
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
  enabled: boolean;
  current?: boolean;
};

type RechargePlansData = {
  items: RechargePlan[];
  paymentChannels?: Array<{
    id: PayChannel;
    label: string;
    enabled: boolean;
    current: boolean;
  }>;
  defaultPayChannel?: PayChannel | null;
};

const paymentMethodMeta: Record<PayChannel, { icon: string; label: string }> = {
  mock: { icon: "payments", label: "模拟支付" },
  wechat: { icon: "forum", label: "微信支付" },
  alipay: { icon: "account_balance_wallet", label: "支付宝" }
};

const fallbackPaymentMethods: PaymentMethod[] = [
  { id: "alipay", icon: paymentMethodMeta.alipay.icon, label: paymentMethodMeta.alipay.label, enabled: true },
  { id: "wechat", icon: paymentMethodMeta.wechat.icon, label: paymentMethodMeta.wechat.label, enabled: false }
];

export function RechargeModal({ onClose, onRechargeSuccess, open, points }: RechargeModalProps) {
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(fallbackPaymentMethods);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PayChannel>("alipay");
  const [orderData, setOrderData] = useState<CreateOrderData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [completingPayment, setCompletingPayment] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [redirectOpenBlocked, setRedirectOpenBlocked] = useState(false);
  const [paidCreditGrantedOrderId, setPaidCreditGrantedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const settledOrderRef = useRef<string | null>(null);

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
        const payload = (await response.json()) as ApiResponse<RechargePlansData>;

        if (!payload.success) {
          throw new Error(payload.error.message);
        }

        if (!cancelled) {
          const nextPaymentMethods = normalizePaymentMethods(payload.data.paymentChannels);
          const defaultPayChannel = payload.data.defaultPayChannel ?? nextPaymentMethods.find((method) => method.enabled)?.id;
          const firstAvailablePlan = payload.data.items.find((plan) => !isPlanDisabled(plan)) ?? payload.data.items[0];

          setPlans(payload.data.items);
          setSelectedPlanId((current) =>
            payload.data.items.find((plan) => plan.id === current && !isPlanDisabled(plan))?.id ?? firstAvailablePlan?.id ?? ""
          );
          setPaymentMethods(nextPaymentMethods);
          setPaymentMethod((current) => nextPaymentMethods.find((method) => method.id === current && method.enabled)?.id ?? defaultPayChannel ?? "alipay");
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

  useEffect(() => {
    const paymentAction = getPaymentAction(orderData);

    if (!open || !orderData || !paymentAction || paymentAction.type === "mock" || orderData.order.status !== "PENDING") {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshPaymentStatus(false);
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [open, orderData?.order.id, orderData?.order.status, orderData?.paymentAction?.type, orderData?.payment?.type]);

  const permanentPlans = useMemo(() => plans.filter((plan) => plan.planType === "permanent"), [plans]);
  const monthlyPlans = useMemo(() => plans.filter((plan) => plan.planType === "monthly"), [plans]);
  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans.find((plan) => !isPlanDisabled(plan)) ?? plans[0],
    [plans, selectedPlanId]
  );
  const activePayment = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0];
  const activePaymentEnabled = activePayment?.enabled ?? false;
  const activePlanDisabled = activePlan ? isPlanDisabled(activePlan) : true;
  const paid = orderData?.order.status === "PAID";
  const paidCreditGranted = Boolean(orderData && paid && paidCreditGrantedOrderId === orderData.order.id);
  const paymentAction = getPaymentAction(orderData);
  const pendingOrder = orderData?.order.status === "PENDING";
  const canCompletePaidPayment = Boolean(paidCreditGranted && paymentAction?.type !== "mock");
  const canMockConfirm = Boolean(orderData && pendingOrder && paymentAction?.type === "mock");
  const canRefreshPayment = Boolean(orderData && pendingOrder && paymentAction && paymentAction.type !== "mock");

  if (!open) {
    return null;
  }

  async function handleCreateOrder() {
    if (!activePlan) {
      setError("请选择充值套餐");
      return;
    }

    if (isPlanDisabled(activePlan)) {
      setError("特惠包每个账号仅可购买一次");
      return;
    }

    if (!activePaymentEnabled) {
      setError("当前支付方式暂不可用，请选择可用的支付方式。");
      return;
    }

    const pendingPaymentWindow = paymentMethod === "alipay" ? openPendingPaymentWindow() : null;
    setCreatingOrder(true);
    setQrCodeDataUrl("");
    setRedirectOpenBlocked(false);
    setError("");
    setMessage("");
    setPaidCreditGrantedOrderId(null);
    settledOrderRef.current = null;

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
        pendingPaymentWindow?.close();
        throw new Error(formatCreateOrderError(payload.error.code, payload.error.message, paymentMethod));
      }

      const action = getPaymentAction(payload.data);
      setOrderData(payload.data);

      if (action?.type === "redirect") {
        const opened = openRedirectPayment(action, pendingPaymentWindow);
        setRedirectOpenBlocked(!opened);
        setMessage(opened ? "请在新打开的支付宝页面完成支付。" : "浏览器可能阻止了支付宝页面，请点击重新打开。");
      } else if (action?.type === "qr_code" && action.qrCodeText) {
        setQrCodeDataUrl(await QRCode.toDataURL(action.qrCodeText, { margin: 1, width: 192 }));
        setMessage("请使用微信扫码支付。");
      } else if (action?.type === "mock") {
        pendingPaymentWindow?.close();
        setMessage("订单已创建，当前为模拟支付环境，请点击模拟支付确认。");
      } else {
        pendingPaymentWindow?.close();
        setMessage(getTerminalOrderMessage(payload.data.order));
      }
    } catch (createError) {
      pendingPaymentWindow?.close();
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
              paymentAction: current.paymentAction
                ? {
                    ...current.paymentAction,
                    status: payload.data.order.status
                  }
                : current.paymentAction,
              payment: current.payment
                ? {
                    ...current.payment,
                    status: payload.data.order.status
                  }
                : current.payment
            }
          : current
      );
      setMessage(getPaymentSuccessMessage(payload.data.order));
      await onRechargeSuccess();
      window.dispatchEvent(new Event("lightquant:credits-updated"));
    } catch (notifyError) {
      setError(notifyError instanceof Error ? notifyError.message : "支付确认失败");
    } finally {
      setConfirmingPayment(false);
    }
  }

  async function handleCompletePaidPayment() {
    if (!orderData || !paidCreditGranted) {
      return;
    }

    setCompletingPayment(true);
    setError("");

    try {
      await onRechargeSuccess();
      window.dispatchEvent(new Event("lightquant:credits-updated"));
      onClose();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "支付完成处理失败");
    } finally {
      setCompletingPayment(false);
    }
  }

  function handleReopenRedirectPayment() {
    const action = getPaymentAction(orderData);

    if (!action || action.type !== "redirect") {
      return;
    }

    const opened = openRedirectPayment(action, null);
    setRedirectOpenBlocked(!opened);
    setMessage(opened ? "请在新打开的支付宝页面完成支付。" : "浏览器仍然阻止了支付页面，请允许弹窗后重试。");
  }

  async function refreshPaymentStatus(manual: boolean) {
    if (!orderData) {
      return;
    }

    setCheckingStatus(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/payments/${orderData.order.id}/status`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as ApiResponse<PaymentStatusData>;

      if (!payload.success) {
        throw new Error(payload.error.message);
      }

      setOrderData((current) => current ? { ...current, order: payload.data.order } : current);

      if (payload.data.payment.paid && payload.data.payment.creditGranted) {
        setPaidCreditGrantedOrderId(payload.data.order.id);

        if (settledOrderRef.current !== payload.data.order.id) {
          settledOrderRef.current = payload.data.order.id;
          setMessage(getPaymentSuccessMessage(payload.data.order));
        }
        return;
      }

      if (payload.data.order.status === "CLOSED" || payload.data.payment.expired) {
        setMessage("订单已过期，请重新下单。");
        return;
      }

      if (payload.data.order.status === "FAILED") {
        setMessage("支付初始化失败，请重新下单。");
        return;
      }

      if (manual) {
        setMessage("正在确认支付，请稍后刷新。");
      }
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "支付状态刷新失败");
    } finally {
      setCheckingStatus(false);
    }
  }

  function handlePlanChange(planId: string) {
    const plan = plans.find((item) => item.id === planId);

    if (plan && isPlanDisabled(plan)) {
      return;
    }

    setSelectedPlanId(planId);
    resetOrderState();
  }

  function handlePaymentChange(method: PayChannel) {
    const nextMethod = paymentMethods.find((item) => item.id === method);

    if (!nextMethod?.enabled) {
      return;
    }

    setPaymentMethod(method);
    resetOrderState();
  }

  function resetOrderState() {
    setOrderData(null);
    setQrCodeDataUrl("");
    setRedirectOpenBlocked(false);
    setPaidCreditGrantedOrderId(null);
    setMessage("");
    setError("");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-md backdrop-blur-[2px]" role="presentation">
      <div
        aria-labelledby="recharge-modal-title"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-xl border border-outline-variant/60 bg-paper p-xl shadow-modal"
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
            当前可用积分 <span className="font-bold text-primary-bright">{points.toLocaleString("zh-CN")}</span>
          </p>
        </div>

        {loadingPlans ? (
          <div className="mb-lg rounded-xl border border-dashed border-steel/60 p-md text-caption-md text-secondary">正在加载充值套餐...</div>
        ) : (
          <div className="mb-lg space-y-md">
            <PlanGroup
              onSelect={handlePlanChange}
              plans={permanentPlans}
              note="基础积分长期有效"
              selectedPlanId={activePlan?.id ?? ""}
              title="基础积分包"
            />
            <PlanGroup
              onSelect={handlePlanChange}
              plans={monthlyPlans}
              note="月卡积分 30 天内有效"
              selectedPlanId={activePlan?.id ?? ""}
              title="月卡"
            />
          </div>
        )}

        <div className="mb-lg">
          <h3 className="mb-sm text-caption-bold text-ink">支付方式</h3>
          <div className="grid w-full grid-cols-2 gap-sm">
            {paymentMethods.map((method) => {
              const active = method.id === paymentMethod;

              return (
                <button
                  aria-pressed={active}
                  className={`flex h-11 items-center justify-center gap-xs rounded-lg border text-button-md transition-colors ${
                    active
                      ? "border-primary-bright bg-primary-soft text-primary"
                      : method.enabled
                        ? "border-steel/60 bg-paper text-secondary hover:bg-surface-container-low hover:text-primary"
                        : "cursor-not-allowed border-steel/40 bg-surface-container-low text-outline"
                  }`}
                  disabled={!method.enabled}
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

        <p className="mb-md rounded-lg bg-surface-container-low px-sm py-sm text-caption-md text-secondary">
          月卡积分优先消耗，基础积分长期有效。
        </p>

        {orderData ? (
          <div className="mb-md rounded-lg border border-steel/50 bg-surface-container-low px-sm py-sm text-caption-md text-secondary">
            <p>
              订单号 <span className="font-mono text-ink">{orderData.order.orderNo}</span>
            </p>
            <p>
              状态 <span className="font-semibold text-primary-bright">{orderData.order.status}</span>
            </p>
            {orderData.order.expiresAt ? (
              <p>
                过期时间 <span className="text-ink">{formatShortDate(orderData.order.expiresAt)}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {pendingOrder && paymentAction?.type === "qr_code" ? (
          <div className="mb-md flex flex-col items-center rounded-lg border border-steel/50 bg-paper p-md">
            {qrCodeDataUrl ? <img alt="微信支付二维码" className="h-48 w-48" src={qrCodeDataUrl} /> : <div className="h-48 w-48 animate-pulse rounded-md bg-surface-container" />}
            <p className="mt-sm text-caption-md text-secondary">请使用微信扫码支付</p>
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

        {orderData && pendingOrder && paymentAction?.type === "redirect" && redirectOpenBlocked ? (
          <Button className="mb-sm w-full" onClick={handleReopenRedirectPayment} type="button">
            <MaterialIcon size={18}>open_in_new</MaterialIcon>
            重新打开支付宝页面
          </Button>
        ) : null}

        {canCompletePaidPayment ? (
          <Button className="w-full" disabled={completingPayment} onClick={() => void handleCompletePaidPayment()} type="button">
            <MaterialIcon size={18}>check_circle</MaterialIcon>
            {completingPayment ? "完成中..." : "支付完成"}
          </Button>
        ) : canMockConfirm ? (
          <Button className="w-full" disabled={confirmingPayment} onClick={handleMockNotify} type="button">
            <MaterialIcon size={18}>verified</MaterialIcon>
            {confirmingPayment ? "确认中..." : "模拟支付确认"}
          </Button>
        ) : canRefreshPayment ? (
          <Button className="w-full" disabled={checkingStatus} onClick={() => void refreshPaymentStatus(true)} type="button">
            <MaterialIcon size={18}>refresh</MaterialIcon>
            {checkingStatus ? "刷新中..." : "我已完成支付 / 刷新支付状态"}
          </Button>
        ) : (
          <Button className="w-full" disabled={loadingPlans || creatingOrder || !activePlan || !activePaymentEnabled || activePlanDisabled || paid} onClick={handleCreateOrder} type="button">
            <MaterialIcon size={18}>payments</MaterialIcon>
            {paid
              ? "支付已完成"
              : creatingOrder
                ? "创建中..."
                : activePlanDisabled
                  ? "已购买"
                  : activePaymentEnabled
                    ? `${activePayment.label} ¥${activePlan ? trimPrice(activePlan.price) : "--"}`
                    : "当前支付方式不可用"}
          </Button>
        )}
      </div>
    </div>
  );
}

function PlanGroup(props: {
  note: string;
  onSelect: (planId: string) => void;
  plans: RechargePlan[];
  selectedPlanId: string;
  title: string;
}) {
  if (props.plans.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-sm flex items-baseline justify-between gap-sm">
        <h3 className="text-caption-bold text-ink">{props.title}</h3>
        <span className="text-caption-sm text-secondary">{props.note}</span>
      </div>
      <div className={`grid grid-cols-1 gap-sm ${props.title === "月卡" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {props.plans.map((plan) => (
          <PlanCard
            active={plan.id === props.selectedPlanId}
            disabled={isPlanDisabled(plan)}
            key={plan.id}
            onSelect={() => props.onSelect(plan.id)}
            plan={plan}
          />
        ))}
      </div>
    </section>
  );
}

function PlanCard(props: {
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
  plan: RechargePlan;
}) {
  const badge = getPlanBadge(props.plan);

  return (
    <button
      aria-pressed={props.active}
      className={`relative flex h-[116px] flex-col rounded-xl border p-sm text-left transition-all ${
        props.disabled
          ? "cursor-not-allowed border-steel/40 bg-surface-container-low text-outline opacity-70"
          : props.active
            ? "border-primary-bright bg-primary-fixed shadow-soft-lift"
            : "border-steel/60 bg-paper hover:border-primary-soft hover:bg-surface-container-low"
      }`}
      disabled={props.disabled}
      onClick={props.onSelect}
      type="button"
    >
      {badge ? (
        <span className="absolute right-sm top-sm rounded-full bg-primary-bright px-xs py-xxs text-caption-sm font-bold text-on-primary">
          {badge}
        </span>
      ) : null}
      <span className="mb-xs block pr-16 text-body-emphasis text-ink">{props.plan.name}</span>
      <span className="mb-xxs block text-price-md text-primary-bright">¥{trimPrice(props.plan.price)}</span>
      <div className="flex items-center justify-between gap-xs">
        <span className="min-w-0 text-caption-md text-on-surface-variant">获得 {props.plan.totalPoints.toLocaleString("zh-CN")} 积分</span>
        {props.plan.planType === "monthly" ? (
          <span className="inline-flex shrink-0 rounded-full bg-surface-container px-xs py-[1px] text-caption-sm leading-4 text-secondary">30 天内有效</span>
        ) : null}
      </div>
    </button>
  );
}

function getPaymentAction(data: CreateOrderData | null) {
  return data?.paymentAction ?? data?.payment ?? null;
}

function getTerminalOrderMessage(order: RechargeOrder) {
  if (order.status === "PAID") {
    return getPaymentSuccessMessage(order);
  }

  if (order.status === "CLOSED") {
    return "订单已过期，请重新下单。";
  }

  if (order.status === "FAILED") {
    return "支付初始化失败，请重新下单。";
  }

  return "订单暂未生成支付动作，请稍后刷新或重新下单。";
}

function normalizePaymentMethods(channels?: RechargePlansData["paymentChannels"]): PaymentMethod[] {
  if (!channels || channels.length === 0) {
    return fallbackPaymentMethods;
  }

  return channels.map((channel) => ({
    id: channel.id,
    icon: paymentMethodMeta[channel.id].icon,
    label: channel.label || paymentMethodMeta[channel.id].label,
    enabled: channel.enabled,
    current: channel.current
  }));
}

function formatCreateOrderError(code: string, message: string, payChannel: PayChannel) {
  if (code === "PROMO_PLAN_ALREADY_PURCHASED") {
    return "特惠包每个账号仅可购买一次";
  }

  if (code === "ACTIVE_MONTHLY_CARD_EXISTS") {
    return "当前已有有效月卡，到期后可重新购买。";
  }

  if (code === "PAYMENT_CONFIG_ERROR") {
    return `${getPayChannelLabel(payChannel)}当前未启用或配置不完整，请选择已启用的支付方式。`;
  }

  return message;
}

function getPaymentSuccessMessage(order: Pick<RechargeOrder, "planId">) {
  return order.planId === "monthly_plus" || order.planId === "monthly_pro"
    ? "月卡已开通，积分已到账。"
    : "支付成功，积分已到账。";
}

function getPayChannelLabel(payChannel: PayChannel) {
  return paymentMethodMeta[payChannel]?.label ?? "当前支付方式";
}

function getPlanBadge(plan: RechargePlan) {
  if (plan.id === "promo") {
    return plan.alreadyPurchased ? "已购买" : "限购一次";
  }

  if (plan.id === "monthly_plus") {
    return "推荐";
  }

  return null;
}

function isPlanDisabled(plan: RechargePlan) {
  return !plan.enabled || (plan.id === "promo" && plan.alreadyPurchased);
}

function openRedirectPayment(action: PaymentAction, paymentWindow: Window | null) {
  if (action.redirectUrl) {
    if (paymentWindow) {
      paymentWindow.location.href = action.redirectUrl;
      return true;
    }

    return Boolean(window.open(action.redirectUrl, "_blank", "noopener,noreferrer"));
  }

  if (action.formHtml) {
    const targetWindow = paymentWindow ?? openPendingPaymentWindow();

    if (targetWindow) {
      targetWindow.document.open();
      targetWindow.document.write(action.formHtml);
      targetWindow.document.close();
      return true;
    }
  }

  return false;
}

function openPendingPaymentWindow() {
  const paymentWindow = window.open("about:blank", "_blank");

  if (paymentWindow) {
    paymentWindow.opener = null;
  }

  return paymentWindow;
}

function createClientRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function trimPrice(price: string) {
  return price.endsWith(".00") ? price.slice(0, -3) : price.replace(/0$/, "");
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
