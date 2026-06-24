import { getAdminOverview } from "@/server/admin/admin-service";
import { AdminLoginRequired, AdminShell, formatMoney } from "@/app/admin/AdminShell";
import { getAdminPageContext } from "@/app/admin/admin-page";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const overview = await getAdminOverview();

  return (
    <AdminShell active="overview" adminPhone={context.user.phone}>
      <section>
        <div className="mb-sm">
          <h2 className="text-body-emphasis text-ink">付费转化</h2>
        </div>
        <div className="grid gap-md md:grid-cols-3">
          <Metric label="用户数" value={formatInteger(overview.totals.users)} />
          <Metric label="付费用户数" value={formatInteger(overview.totals.paidUsers)} />
          <Metric label="付费转化率" value={formatPercent(overview.totals.paidConversionRate)} />
        </div>
        <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${toPercentWidth(overview.totals.paidConversionRate)}%` }}
          />
        </div>
      </section>

      <section className="mt-lg">
        <div className="mb-sm">
          <h2 className="text-body-emphasis text-ink">订单概览</h2>
        </div>
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="今日订单数" value={formatInteger(overview.totals.todayPaidOrders)} />
          <Metric label="今日订单金额" value={formatMoney(overview.totals.todayPaidOrderAmountCents)} />
          <Metric label="总订单数" value={formatInteger(overview.totals.paidOrders)} />
          <Metric label="总订单金额" value={formatMoney(overview.totals.paidOrderAmountCents)} />
        </div>
      </section>

      <section className="mt-lg">
        <div className="mb-sm">
          <h2 className="text-body-emphasis text-ink">积分与 AI</h2>
        </div>
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="总积分余额" value={formatInteger(overview.totals.creditBalance)} />
          <Metric label="累计发放" value={formatInteger(overview.totals.creditEarned)} />
          <Metric label="累计消耗" value={formatInteger(overview.totals.creditSpent)} />
          <Metric label="今日 AI 任务" value={formatInteger(overview.totals.todayAiTasks)} />
          <Metric label="今日 token" value={formatInteger(overview.totals.todayAiTokens)} />
        </div>
      </section>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm">
      <div className="text-caption-sm text-secondary">{label}</div>
      <div className="mt-xs text-display-xs font-semibold text-ink">{value}</div>
    </div>
  );
}

function formatInteger(value: number) {
  return value.toLocaleString("zh-CN");
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("zh-CN", { maximumFractionDigits: 1 })}%`;
}

function toPercentWidth(value: number) {
  return Math.min(100, Math.max(0, value * 100));
}
