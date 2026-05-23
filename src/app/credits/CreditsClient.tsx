"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Panel } from "@/components/ui/Panel";
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

function amountClass(amount: number) {
  return amount > 0 ? "text-primary-bright" : "text-bloom-deep";
}

function statusClass(status: string) {
  if (status === "已退回") {
    return "bg-primary-fixed text-primary";
  }

  return "bg-surface-container-low text-primary";
}

function formatAmount(amount: number) {
  return `${amount > 0 ? "+" : ""}${amount.toLocaleString("zh-CN")}`;
}

function EmptyCreditState({ message = "当前暂无积分变动记录。" }: { message?: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-steel bg-paper p-xxl text-center">
      <div className="mb-md flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
        <MaterialIcon className="text-outline" size={32}>
          receipt_long
        </MaterialIcon>
      </div>
      <h2 className="mb-xs text-body-emphasis text-ink">暂无积分流水</h2>
      <p className="max-w-sm text-caption-md text-secondary">{message}</p>
    </div>
  );
}

export function CreditsClient() {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);

  const summary = useMemo(() => {
    const monthlyChange = ledger?.items.reduce((total, item) => total + item.amount, 0) ?? 0;

    return [
      { label: "当前积分余额", value: account?.balance.toLocaleString("zh-CN") ?? "-", tone: "primary" },
      { label: "累计获得", value: account?.totalEarned.toLocaleString("zh-CN") ?? "-", tone: "ink" },
      { label: "累计消耗", value: account?.totalSpent.toLocaleString("zh-CN") ?? "-", tone: "ink" },
      { label: "本页变化", value: `${monthlyChange > 0 ? "+" : ""}${monthlyChange.toLocaleString("zh-CN")}`, tone: "primary" }
    ];
  }, [account, ledger]);
  const records = ledger?.items ?? [];
  const hasTransactions = records.length > 0;

  return (
    <section className="mx-auto min-h-full w-full max-w-[1080px] px-md py-lg md:px-xl md:py-xl">
      <header className="mb-lg">
        <h1 className="mb-sm text-display-lg font-bold tracking-tight text-ink">积分流水</h1>
        <p className="text-body-lg text-secondary">查看积分获取、消耗和退回记录。</p>
      </header>

      <section className="mb-lg grid grid-cols-1 gap-md md:grid-cols-4">
        {summary.map((item) => (
          <Panel className="min-h-[92px] p-md" key={item.label}>
            <p className="mb-xs text-caption-md text-secondary">{item.label}</p>
            <p className={`text-price-md ${item.tone === "primary" ? "text-primary-bright" : "text-ink"}`}>{item.value}</p>
          </Panel>
        ))}
      </section>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-md border-b border-surface-container-high px-md py-sm">
          <div className="flex flex-wrap gap-xs">
            {creditFilters.map((filter, index) => (
              <button
                className={`h-8 rounded-md border px-sm text-button-sm transition-colors ${
                  index === 0
                    ? "border-primary bg-primary text-on-primary"
                    : "border-steel/60 bg-paper text-secondary hover:bg-surface-container-low hover:text-primary"
                }`}
                key={filter}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-sm">
            <button className="flex h-8 items-center gap-xs rounded-md border border-steel/60 bg-paper px-sm text-caption-md text-secondary" type="button">
              <MaterialIcon size={16}>calendar_month</MaterialIcon>
              时间范围
            </button>
            <button className="flex h-8 items-center gap-xs rounded-md border border-steel/60 bg-paper px-sm text-caption-md text-secondary" type="button">
              来源类型
              <MaterialIcon size={16}>expand_more</MaterialIcon>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-lg">
            <EmptyCreditState message="正在加载积分流水..." />
          </div>
        ) : error ? (
          <div className="p-lg">
            <EmptyCreditState message={error} />
          </div>
        ) : hasTransactions ? (
          <>
            <div className="overflow-x-auto app-scrollbar">
              <table className="min-w-[880px] w-full border-collapse text-left">
                <thead className="bg-cloud text-caption-bold text-secondary">
                  <tr>
                    <th className="px-md py-sm font-bold">时间</th>
                    <th className="px-sm py-sm font-bold">类型</th>
                    <th className="px-sm py-sm font-bold">事项 / 描述</th>
                    <th className="px-sm py-sm text-right font-bold">积分变化</th>
                    <th className="px-sm py-sm text-right font-bold">余额</th>
                    <th className="px-md py-sm text-right font-bold">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-caption-md text-on-surface-variant">
                  {records.map((record) => (
                    <tr className="bg-paper transition-colors hover:bg-surface-container-low" key={record.id}>
                      <td className="whitespace-nowrap px-md py-xs text-secondary">{record.time}</td>
                      <td className="px-sm py-xs">
                        <span className="rounded bg-surface-container px-xs py-xxs text-caption-sm text-primary">{record.category}</span>
                      </td>
                      <td className="px-sm py-xs">
                        <p className="text-caption-bold leading-tight text-ink">{record.title}</p>
                        <p className="text-caption-sm leading-tight text-secondary">{record.description}</p>
                      </td>
                      <td className={`whitespace-nowrap px-sm py-xs text-right text-caption-bold ${amountClass(record.amount)}`}>
                        {formatAmount(record.amount)}
                      </td>
                      <td className="whitespace-nowrap px-sm py-xs text-right text-secondary">
                        {record.balanceAfter.toLocaleString("zh-CN")}
                      </td>
                      <td className="whitespace-nowrap px-md py-xs text-right">
                        <span className={`rounded-full px-xs py-xxs text-caption-sm ${statusClass(record.status)}`}>{record.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-surface-container-high px-md py-sm text-caption-md text-secondary">
              <span>
                第 {ledger?.page ?? 1} 页 / 共 {ledger?.totalPages ?? 1} 页
              </span>
              <div className="flex gap-xs">
                <Button disabled size="sm" type="button" variant="ghost">
                  上一页
                </Button>
                <Button disabled size="sm" type="button" variant="outline">
                  下一页
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-lg">
            <EmptyCreditState />
          </div>
        )}
      </Panel>
    </section>
  );
}

