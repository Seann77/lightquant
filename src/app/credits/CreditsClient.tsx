"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, DollarSign, FileText, Filter, LineChart } from "lucide-react";
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

type ReturnedPaymentStatus = {
  order: {
    id: string;
    orderNo: string;
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

function EmptyCreditState({ message = "请先登录" }: { message?: string }) {
  return (
    <div className="lq-empty-ledger">
      <div className="lq-empty-ledger-icon">
        <FileText aria-hidden="true" size={27} />
      </div>
      <h2>暂无积分流水</h2>
      <p>{message}</p>
    </div>
  );
}

export function CreditsClient() {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentReturnNotice, setPaymentReturnNotice] = useState<PaymentReturnNotice | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCredits() {
      setLoading(true);
      setError("");

      try {
        const [accountResponse, ledgerResponse] = await Promise.all([
          fetch("/api/v1/credits/account", { cache: "no-store" }),
          fetch("/api/v1/credits/ledger?page=1&pageSize=20", { cache: "no-store" })
        ]);
        const accountPayload = (await accountResponse.json()) as ApiResponse<{ account: CreditAccount }>;
        const ledgerPayload = (await ledgerResponse.json()) as ApiResponse<LedgerData>;

        if (!accountPayload.success) {
          throw new Error(accountPayload.error.message);
        }

        if (!ledgerPayload.success) {
          throw new Error(ledgerPayload.error.message);
        }

        if (!cancelled) {
          setAccount(accountPayload.data.account);
          setLedger(ledgerPayload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setAccount(null);
          setLedger(null);
          setError(loadError instanceof Error ? loadError.message : "积分数据加载失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCredits();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

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

  async function refreshReturnedPaymentStatus(orderId: string, manual: boolean) {
    setPaymentReturnNotice((current) => ({
      kind: current?.kind ?? "info",
      orderId,
      message: manual ? "正在刷新支付状态，请稍候。" : current?.message ?? "正在查询服务端支付确认状态。",
      checking: true
    }));

    try {
      const response = await fetch(`/api/v1/payments/${encodeURIComponent(orderId)}/status`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as ApiResponse<ReturnedPaymentStatus>;

      if (!payload.success) {
        throw new Error(payload.error.message);
      }

      if (payload.data.payment.paid && payload.data.payment.creditGranted) {
        setPaymentReturnNotice({
          kind: "success",
          orderId,
          message: "支付成功，积分已到账。",
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
    const monthlyChange = ledger?.items.reduce((total, item) => total + item.amount, 0) ?? 0;

    return [
      { icon: DollarSign, label: "当前积分余额", value: account?.balance.toLocaleString("zh-CN") ?? "-", primary: true },
      { icon: ArrowUp, label: "累计获得", value: account?.totalEarned.toLocaleString("zh-CN") ?? "0", primary: false },
      { icon: ArrowDown, label: "累计消耗", value: account?.totalSpent.toLocaleString("zh-CN") ?? "0", primary: false },
      { icon: LineChart, label: "本页变化", value: `${monthlyChange > 0 ? "+" : ""}${monthlyChange.toLocaleString("zh-CN")}`, primary: false }
    ];
  }, [account, ledger]);
  const records = ledger?.items ?? [];
  const hasTransactions = records.length > 0;

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
              onClick={() => void refreshReturnedPaymentStatus(paymentReturnNotice.orderId, true)}
              type="button"
            >
              {paymentReturnNotice.checking ? "查询中..." : "刷新支付状态"}
            </button>
          </div>
        </section>
      ) : null}

      <section aria-label="积分统计" className="lq-stat-grid">
        {summary.map((item) => {
          const Icon = item.icon;

          return (
            <article className={`lq-stat-card ${item.primary ? "is-primary" : ""}`} key={item.label}>
              <p className="lq-stat-label">
                <span className="lq-stat-icon">
                  <Icon aria-hidden="true" size={16} />
                </span>
                {item.label}
              </p>
              <p className="lq-stat-value">{item.value}</p>
            </article>
          );
        })}
      </section>

      <section className="lq-ledger-panel">
        <div className="lq-ledger-tools">
          <div className="lq-filter-tabs">
            {creditFilters.map((filter, index) => (
              <button className={`lq-filter-tab ${index === 0 ? "is-active" : ""}`} key={filter} type="button">
                {filter}
              </button>
            ))}
          </div>

          <div className="lq-filter-buttons">
            <button className="lq-filter-btn" type="button">
              <CalendarDays aria-hidden="true" size={16} />
              时间范围
            </button>
            <button className="lq-filter-btn" type="button">
              <Filter aria-hidden="true" size={16} />
              来源类型
            </button>
          </div>
        </div>

        {hasTransactions ? (
          <div className="lq-ledger-scroll app-scrollbar">
            <div className="lq-ledger-table-body">
              <table className="lq-ledger-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>类型</th>
                    <th>事项 / 描述</th>
                    <th className="text-right">积分变化</th>
                    <th className="text-right">余额</th>
                    <th className="text-right">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap">{record.time}</td>
                      <td>
                        <span className="rounded bg-[#eaf2ff] px-2 py-1 text-xs font-bold text-[#0b63ff]">{record.category}</span>
                      </td>
                      <td>
                        <p className="m-0 font-extrabold text-[#111827]">{record.title}</p>
                        <p className="m-0 text-xs text-[#5b6472]">{record.description}</p>
                      </td>
                      <td className={`whitespace-nowrap text-right font-extrabold ${amountClass(record.amount)}`}>{formatAmount(record.amount)}</td>
                      <td className="whitespace-nowrap text-right">{record.balanceAfter.toLocaleString("zh-CN")}</td>
                      <td className="whitespace-nowrap text-right">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClass(record.status)}`}>{record.status}</span>
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
            <EmptyCreditState message={loading ? "正在加载积分流水..." : error || "请先登录"} />
          </>
        )}
      </section>
    </section>
  );
}
