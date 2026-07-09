"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, CalendarDays, DollarSign, FileText } from "lucide-react";
import { creditFilters } from "@/lib/mock-data";

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

type CreditAccount = {
  balance: number;
  monthlyBalance: number;
  permanentBalance: number;
  monthlyPlanId: string | null;
  monthlyPlanName: string | null;
  monthlyExpiresAt: string | null;
  totalEarned: number;
  totalSpent: number;
  version: number;
  updatedAt: string;
};

type CreditLedgerItem = {
  id: string;
  time: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  balanceAfter: number;
  status: string;
};

type LedgerData = {
  items: CreditLedgerItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type CurrentUserProfile = {
  membership?: {
    betaVip?: {
      active: boolean;
      startsAt: string | null;
      endsAt: string | null;
      label: string;
    };
  } | null;
};

type ReturnedPaymentStatus = {
  order: {
    id: string;
    orderNo: string;
    planId: string;
    status: string;
    expiresAt?: string;
  };
  payment: {
    paid: boolean;
    creditGranted: boolean;
    expired: boolean;
    channel: string;
    latestTransactionStatus?: string | null;
    failedReason?: string | null;
  };
};

type PaymentReturnNotice = {
  kind: "info" | "success" | "warning" | "error";
  orderId: string;
  message: string;
  checking: boolean;
  requiresLogin?: boolean;
};

type CreditFilter = (typeof creditFilters)[number];
type TimeRangePreset = "all" | "today" | "7d" | "30d" | "custom";

type AppliedTimeRange = {
  preset: TimeRangePreset;
  startDate: string;
  endDate: string;
};

function amountClass(amount: number) {
  return amount > 0 ? "text-[#0b63ff]" : "text-[#d92d20]";
}

function statusClass(status: string) {
  if (status === "已退回") {
    return "bg-[#eaf2ff] text-[#0b63ff]";
  }

  return "bg-[#eff6ff] text-[#0b63ff]";
}

function formatAmount(amount: number) {
  return `${amount > 0 ? "+" : ""}${amount.toLocaleString("zh-CN")}`;
}

function EmptyCreditState({ title = "暂无积分流水", message = "请先登录" }: { title?: string; message?: string }) {
  return (
    <div className="lq-empty-ledger">
      <div className="lq-empty-ledger-icon">
        <FileText aria-hidden="true" size={27} />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

export function CreditsClient() {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [activeFilter, setActiveFilter] = useState<CreditFilter>("全部");
  const [timeRange, setTimeRange] = useState<AppliedTimeRange>({ preset: "all", startDate: "", endDate: "" });
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [betaVipActive, setBetaVipActive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentReturnNotice, setPaymentReturnNotice] = useState<PaymentReturnNotice | null>(null);
  const loadCreditsRequestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const currentRequestId = loadCreditsRequestIdRef.current + 1;
    loadCreditsRequestIdRef.current = currentRequestId;

    async function loadCredits() {
      setLoading(true);
      setError("");

      try {
        const ledgerQuery = buildLedgerQuery(activeFilter, timeRange);
        const [accountResponse, ledgerResponse] = await Promise.all([
          fetch("/api/v1/credits/account", { cache: "no-store" }),
          fetch(`/api/v1/credits/ledger?${ledgerQuery}`, { cache: "no-store" })
        ]);
        const profileResponse = await fetch("/api/v1/me", { cache: "no-store" }).catch(() => null);
        const accountPayload = (await accountResponse.json()) as ApiResponse<{ account: CreditAccount }>;
        const ledgerPayload = (await ledgerResponse.json()) as ApiResponse<LedgerData>;
        const profilePayload = profileResponse ? ((await profileResponse.json().catch(() => null)) as ApiResponse<CurrentUserProfile> | null) : null;

        if (!accountPayload.success) {
          if (accountPayload.error.code === "UNAUTHORIZED" && getPaymentReturnOrderId()) {
            throw new Error("请登录后继续确认支付状态");
          }

          throw new Error(accountPayload.error.message);
        }

        if (!ledgerPayload.success) {
          throw new Error(ledgerPayload.error.message);
        }

        if (!cancelled && currentRequestId === loadCreditsRequestIdRef.current) {
          setAccount(accountPayload.data.account);
          setLedger(ledgerPayload.data);
          setBetaVipActive(profilePayload?.success === true && profilePayload.data.membership?.betaVip?.active === true);
        }
      } catch (loadError) {
        if (!cancelled && currentRequestId === loadCreditsRequestIdRef.current) {
          setAccount(null);
          setLedger(null);
          setBetaVipActive(false);
          setError(loadError instanceof Error ? loadError.message : "积分数据加载失败");
        }
      } finally {
        if (!cancelled && currentRequestId === loadCreditsRequestIdRef.current) {
          setLoading(false);
        }
      }
    }

    void loadCredits();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, activeFilter, timeRange]);

  useEffect(() => {
    function handleCreditsUpdated() {
      setRefreshKey((value) => value + 1);
    }

    window.addEventListener("lightquant:credits-updated", handleCreditsUpdated);

    return () => {
      window.removeEventListener("lightquant:credits-updated", handleCreditsUpdated);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentReturn = params.get("paymentReturn");
    const orderId = params.get("orderId");

    if (paymentReturn !== "1" || !orderId) {
      return;
    }

    setPaymentReturnNotice({
      kind: "info",
      orderId,
      message: "已从支付页面返回，正在查询服务端支付确认状态。",
      checking: true
    });
    void refreshReturnedPaymentStatus(orderId, false);
  }, []);

  useEffect(() => {
    function handleAuthUpdated() {
      setRefreshKey((value) => value + 1);

      const orderId = getPaymentReturnOrderId();
      if (orderId) {
        void refreshReturnedPaymentStatus(orderId, false);
      }
    }

    window.addEventListener("lightquant:auth-updated", handleAuthUpdated);

    return () => {
      window.removeEventListener("lightquant:auth-updated", handleAuthUpdated);
    };
  }, []);

  async function refreshReturnedPaymentStatus(orderId: string, manual: boolean) {
    setPaymentReturnNotice((current) => ({
      kind: current?.kind ?? "info",
      orderId,
      message: manual ? "正在刷新支付状态，请稍候。" : current?.message ?? "正在查询服务端支付确认状态。",
      checking: true,
      requiresLogin: false
    }));

    try {
      const response = await fetch(`/api/v1/payments/${encodeURIComponent(orderId)}/status`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as ApiResponse<ReturnedPaymentStatus>;

      if (!payload.success) {
        if (payload.error.code === "UNAUTHORIZED") {
          setPaymentReturnNotice({
            kind: "info",
            orderId,
            message: "请登录后继续确认支付状态",
            checking: false,
            requiresLogin: true
          });
          return;
        }

        throw new Error(payload.error.message);
      }

      if (payload.data.payment.paid && payload.data.payment.creditGranted) {
        setPaymentReturnNotice({
          kind: "success",
          orderId,
          message: getPaymentSuccessMessage(payload.data.order.planId),
          checking: false
        });
        setRefreshKey((value) => value + 1);
        window.dispatchEvent(new Event("lightquant:credits-updated"));
        return;
      }

      if (payload.data.order.status === "CLOSED" || payload.data.payment.expired) {
        setPaymentReturnNotice({
          kind: "warning",
          orderId,
          message: "订单已过期或关闭，请重新下单。",
          checking: false
        });
        return;
      }

      setPaymentReturnNotice({
        kind: "info",
        orderId,
        message: "支付仍未确认。到账只以服务端回调验签结果为准，请稍后刷新。",
        checking: false
      });
    } catch (statusError) {
      setPaymentReturnNotice({
        kind: "error",
        orderId,
        message: statusError instanceof Error ? statusError.message : "支付状态查询失败",
        checking: false
      });
    }
  }

  const summary = useMemo(() => {
    const monthlyExpiresAt = account?.monthlyExpiresAt ?? null;
    const hasMonthlyCard = Boolean(account?.monthlyPlanName && monthlyExpiresAt);

    return [
      { icon: BadgeCheck, label: "基础积分", value: account?.permanentBalance.toLocaleString("zh-CN") ?? "0", dueText: "", tag: null, primary: false },
      {
        icon: CalendarDays,
        label: "月卡积分",
        value: account?.monthlyBalance.toLocaleString("zh-CN") ?? "0",
        dueText: hasMonthlyCard && monthlyExpiresAt ? `到期时间 ${formatDateOnly(monthlyExpiresAt)}` : "",
        tag: hasMonthlyCard && account?.monthlyPlanName ? account.monthlyPlanName : null,
        primary: false
      },
      { icon: DollarSign, label: "总可用积分", value: account?.balance.toLocaleString("zh-CN") ?? "-", dueText: "", tag: null, primary: true }
    ];
  }, [account]);
  const records = ledger?.items ?? [];
  const hasTransactions = records.length > 0;
  const hasActiveLedgerFilter = activeFilter !== "全部" || timeRange.preset !== "all";
  const timeRangeLabel = getTimeRangeLabel(timeRange);

  function applyPreset(preset: Exclude<TimeRangePreset, "custom">) {
    setTimeRange({ preset, startDate: "", endDate: "" });
    setTimeRangeOpen(false);
    setCustomDateOpen(false);
    setDateError("");
  }

  function openCustomDate() {
    setCustomDateOpen(true);
    setDraftStartDate(timeRange.preset === "custom" ? timeRange.startDate : "");
    setDraftEndDate(timeRange.preset === "custom" ? timeRange.endDate : "");
    setDateError("");
  }

  function applyCustomDate() {
    if (draftStartDate && draftEndDate && draftStartDate > draftEndDate) {
      setDateError("开始日期不能晚于结束日期");
      return;
    }

    setTimeRange({
      preset: "custom",
      startDate: draftStartDate,
      endDate: draftEndDate
    });
    setTimeRangeOpen(false);
    setCustomDateOpen(false);
    setDateError("");
  }

  function resetTimeRange() {
    setTimeRange({ preset: "all", startDate: "", endDate: "" });
    setDraftStartDate("");
    setDraftEndDate("");
    setDateError("");
    setTimeRangeOpen(false);
    setCustomDateOpen(false);
  }

  return (
    <section className="lq-ledger-page">
      <header className="lq-ledger-header">
        <h1>积分流水</h1>
        <p>查看积分获取、消耗和退回记录。</p>
      </header>

      {paymentReturnNotice ? (
        <section
          aria-live="polite"
          className={`mb-lg rounded-lg border px-md py-sm text-caption-md ${
            paymentReturnNotice.kind === "success"
              ? "border-[#9ee6d8] bg-[#e8fff8] text-[#04705f]"
              : paymentReturnNotice.kind === "warning"
                ? "border-[#fde68a] bg-[#fffbeb] text-[#92400e]"
                : paymentReturnNotice.kind === "error"
                  ? "border-[#fecaca] bg-[#fff1f2] text-[#b42318]"
                  : "border-[#bfdbfe] bg-[#eff6ff] text-[#0b63ff]"
          }`}
        >
          <div className="flex flex-col gap-xs md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 font-bold">支付返回状态</p>
              <p className="m-0">{paymentReturnNotice.message}</p>
            </div>
            <button
              className="rounded-md border border-current px-sm py-xs text-caption-bold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={paymentReturnNotice.checking}
              onClick={() => {
                if (paymentReturnNotice.requiresLogin) {
                  window.dispatchEvent(new Event("lightquant:open-login"));
                  return;
                }

                void refreshReturnedPaymentStatus(paymentReturnNotice.orderId, true);
              }}
              type="button"
            >
              {paymentReturnNotice.checking ? "查询中..." : paymentReturnNotice.requiresLogin ? "登录后继续" : "刷新支付状态"}
            </button>
          </div>
        </section>
      ) : null}

      <section aria-label="积分统计" className="lq-stat-grid">
        {summary.map((item) => {
          const Icon = item.icon;

          return (
            <article className={`lq-stat-card ${item.primary ? "is-primary" : ""}`} key={item.label}>
              <div className="flex items-start justify-between gap-sm">
                <p className="lq-stat-label">
                  <span className="lq-stat-icon">
                    <Icon aria-hidden="true" size={16} />
                  </span>
                  {item.label}
                </p>
                {item.tag ? (
                  <span className={`shrink-0 rounded-full px-xs py-[2px] text-caption-sm font-bold ${item.tag === "月卡 Pro" ? "bg-[#eef5ff] text-[#0b63ff]" : "bg-[#ecfff7] text-[#047857]"}`}>
                    {item.tag}
                  </span>
                ) : null}
              </div>
              <div className="lq-stat-value-row">
                <p className="lq-stat-value">{item.value}</p>
                {item.dueText ? (
                  <p className="lq-stat-due">{item.dueText}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {betaVipActive ? (
        <div className="lq-vip-inline-notice" role="status">
          <BadgeCheck aria-hidden="true" size={16} />
          内测VIP期内使用不消耗积分
        </div>
      ) : null}

      <section className="lq-ledger-panel">
        <div className="lq-ledger-tools">
          <div className="lq-filter-tabs">
            {creditFilters.map((filter) => (
              <button className={`lq-filter-tab ${filter === activeFilter ? "is-active" : ""}`} key={filter} onClick={() => setActiveFilter(filter)} type="button">
                {filter}
              </button>
            ))}
          </div>

          <div className="lq-filter-buttons">
            <div className="relative">
              {timeRangeOpen ? (
                <button
                  aria-label="关闭时间范围筛选"
                  className="fixed inset-0 z-30 cursor-default bg-transparent"
                  onClick={() => setTimeRangeOpen(false)}
                  type="button"
                />
              ) : null}
              <button
                aria-expanded={timeRangeOpen}
                className={`lq-filter-btn ${timeRangeOpen || timeRange.preset !== "all" ? "is-active-soft" : ""}`}
                onClick={() => setTimeRangeOpen((open) => !open)}
                type="button"
              >
                <CalendarDays aria-hidden="true" size={16} />
                {timeRangeLabel}
              </button>
              {timeRangeOpen ? (
                <div className="lq-time-filter-popover">
                  <div className="lq-time-filter-options">
                    <button className={`lq-time-filter-option ${timeRange.preset === "all" ? "is-active" : ""}`} onClick={() => applyPreset("all")} type="button">
                      全部时间
                    </button>
                    <button className={`lq-time-filter-option ${timeRange.preset === "today" ? "is-active" : ""}`} onClick={() => applyPreset("today")} type="button">
                      今天
                    </button>
                    <button className={`lq-time-filter-option ${timeRange.preset === "7d" ? "is-active" : ""}`} onClick={() => applyPreset("7d")} type="button">
                      最近 7 天
                    </button>
                    <button className={`lq-time-filter-option ${timeRange.preset === "30d" ? "is-active" : ""}`} onClick={() => applyPreset("30d")} type="button">
                      最近 30 天
                    </button>
                    <button className={`lq-time-filter-option ${timeRange.preset === "custom" ? "is-active" : ""}`} onClick={openCustomDate} type="button">
                      自定义日期
                    </button>
                  </div>

                  {customDateOpen ? (
                    <div className="lq-time-filter-custom">
                      <label>
                        <span>开始日期</span>
                        <input onChange={(event) => setDraftStartDate(event.target.value)} type="date" value={draftStartDate} />
                      </label>
                      <label>
                        <span>结束日期</span>
                        <input onChange={(event) => setDraftEndDate(event.target.value)} type="date" value={draftEndDate} />
                      </label>
                      {dateError ? <p className="lq-time-filter-error">{dateError}</p> : null}
                      <div className="lq-time-filter-actions">
                        <button onClick={resetTimeRange} type="button">
                          重置
                        </button>
                        <button className="is-primary" onClick={applyCustomDate} type="button">
                          应用
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {hasTransactions ? (
          <div className="lq-ledger-scroll app-scrollbar">
            <div className="lq-ledger-table-body">
              <table className="lq-ledger-table">
                <colgroup>
                  <col className="lq-ledger-col-time" />
                  <col className="lq-ledger-col-category" />
                  <col className="lq-ledger-col-detail" />
                  <col className="lq-ledger-col-amount" />
                  <col className="lq-ledger-col-balance" />
                  <col className="lq-ledger-col-status" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="lq-ledger-cell-time">时间</th>
                    <th className="lq-ledger-cell-category">类型</th>
                    <th className="lq-ledger-cell-detail">事项 / 描述</th>
                    <th className="lq-ledger-cell-amount">积分变化</th>
                    <th className="lq-ledger-cell-balance">余额</th>
                    <th className="lq-ledger-cell-status">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="lq-ledger-cell-time">{record.time}</td>
                      <td className="lq-ledger-cell-category">
                        <span className="lq-ledger-category-badge">{record.category}</span>
                      </td>
                      <td className="lq-ledger-cell-detail">
                        <p className="m-0 font-extrabold text-[#111827]">{record.title}</p>
                        <p className="m-0 text-xs text-[#5b6472]">{record.description}</p>
                      </td>
                      <td className={`lq-ledger-cell-amount font-extrabold ${amountClass(record.amount)}`}>{formatAmount(record.amount)}</td>
                      <td className="lq-ledger-cell-balance">{record.balanceAfter.toLocaleString("zh-CN")}</td>
                      <td className="lq-ledger-cell-status">
                        <span className={`lq-ledger-status-badge ${statusClass(record.status)}`}>{record.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lq-ledger-footer">
              <span>
                第 {ledger?.page ?? 1} 页 / 共 {ledger?.totalPages ?? 1} 页
              </span>
              <span>共 {ledger?.total ?? records.length} 条</span>
            </div>
          </div>
        ) : (
          <>
            <div className="lq-table-head">
              <span>时间</span>
              <span>类型</span>
              <span>事项 / 描述</span>
              <span className="text-right">积分变化</span>
              <span className="text-right">余额</span>
              <span className="text-right">状态</span>
            </div>
            <EmptyCreditState
              message={loading ? "正在加载积分流水..." : error || (hasActiveLedgerFilter ? "请调整时间范围后再试。" : "暂无积分流水记录")}
              title={hasActiveLedgerFilter && !loading && !error ? "暂无符合条件的积分流水" : "暂无积分流水"}
            />
          </>
        )}
      </section>
    </section>
  );
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(new Date(value))
    .replace(/\//g, "-");
}

function buildLedgerQuery(activeFilter: CreditFilter, timeRange: AppliedTimeRange) {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "20",
    category: categoryParamForFilter(activeFilter)
  });
  const range = getDateRangeParams(timeRange);

  if (range.createdFrom) {
    params.set("createdFrom", range.createdFrom);
  }

  if (range.createdTo) {
    params.set("createdTo", range.createdTo);
  }

  return params.toString();
}

function categoryParamForFilter(filter: CreditFilter) {
  const categoryByFilter: Record<CreditFilter, "all" | "income" | "consume" | "refund"> = {
    全部: "all",
    获取: "income",
    消耗: "consume",
    退回: "refund"
  };

  return categoryByFilter[filter];
}

function getDateRangeParams(timeRange: AppliedTimeRange) {
  if (timeRange.preset === "today") {
    return {
      createdFrom: formatDateInput(new Date()),
      createdTo: ""
    };
  }

  if (timeRange.preset === "7d") {
    return {
      createdFrom: formatDateInput(addLocalDays(new Date(), -6)),
      createdTo: ""
    };
  }

  if (timeRange.preset === "30d") {
    return {
      createdFrom: formatDateInput(addLocalDays(new Date(), -29)),
      createdTo: ""
    };
  }

  if (timeRange.preset === "custom") {
    return {
      createdFrom: timeRange.startDate,
      createdTo: timeRange.endDate
    };
  }

  return {
    createdFrom: "",
    createdTo: ""
  };
}

function getTimeRangeLabel(timeRange: AppliedTimeRange) {
  if (timeRange.preset === "today") {
    return "今天";
  }

  if (timeRange.preset === "7d") {
    return "最近 7 天";
  }

  if (timeRange.preset === "30d") {
    return "最近 30 天";
  }

  if (timeRange.preset === "custom") {
    if (timeRange.startDate && timeRange.endDate) {
      return `${timeRange.startDate} 至 ${timeRange.endDate}`;
    }

    if (timeRange.startDate) {
      return `${timeRange.startDate} 至今`;
    }

    if (timeRange.endDate) {
      return `截至 ${timeRange.endDate}`;
    }

    return "自定义日期";
  }

  return "时间范围";
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addLocalDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function getPaymentReturnOrderId() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);

  return params.get("paymentReturn") === "1" ? params.get("orderId") : null;
}

function getPaymentSuccessMessage(planId: string) {
  return planId === "monthly_plus" || planId === "monthly_pro"
    ? "月卡已开通，积分已到账。"
    : "支付成功，积分已到账。";
}
