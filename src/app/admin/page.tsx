import Link from "next/link";
import { getAdminOverview } from "@/server/admin/admin-service";
import { AdminLoginRequired, AdminShell, AdminTable, formatDate, StatusPill, Td, Th } from "@/app/admin/AdminShell";
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
      <section className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="总用户数" value={overview.totals.users.toLocaleString("zh-CN")} />
        <Metric label="总积分余额" value={overview.totals.creditBalance.toLocaleString("zh-CN")} />
        <Metric label="今日 AI 任务" value={overview.totals.todayAiTasks.toLocaleString("zh-CN")} />
        <Metric label="今日 token" value={overview.totals.todayAiTokens.toLocaleString("zh-CN")} />
        <Metric label="累计发放" value={overview.totals.creditEarned.toLocaleString("zh-CN")} />
        <Metric label="累计消耗" value={overview.totals.creditSpent.toLocaleString("zh-CN")} />
        <Metric label="今日订单" value={overview.totals.todayOrders.toLocaleString("zh-CN")} />
        <Metric label="今日风险文件" value={overview.totals.todayRiskFiles.toLocaleString("zh-CN")} />
      </section>

      <section className="mt-lg grid gap-lg xl:grid-cols-2">
        <div>
          <div className="mb-sm flex items-center justify-between">
            <h2 className="text-body-emphasis text-ink">最近失败 AI 任务</h2>
            <Link className="text-caption-bold text-primary" href="/admin/ai-tasks?status=FAILED">查看全部</Link>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <Th>任务</Th>
                <Th>用户</Th>
                <Th>错误</Th>
                <Th>时间</Th>
              </tr>
            </thead>
            <tbody>
              {overview.recentFailedAiTasks.map((task) => (
                <tr key={task.id}>
                  <Td>{task.type}</Td>
                  <Td>{task.userPhone}</Td>
                  <Td>{task.errorCode ?? "-"}</Td>
                  <Td>{formatDate(task.createdAt)}</Td>
                </tr>
              ))}
              {overview.recentFailedAiTasks.length === 0 ? <EmptyRow colSpan={4} /> : null}
            </tbody>
          </AdminTable>
        </div>

        <div>
          <div className="mb-sm flex items-center justify-between">
            <h2 className="text-body-emphasis text-ink">最近风险文件</h2>
            <Link className="text-caption-bold text-primary" href="/admin/files?scanStatus=WARNING">查看文件</Link>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <Th>文件</Th>
                <Th>用户</Th>
                <Th>状态</Th>
                <Th>时间</Th>
              </tr>
            </thead>
            <tbody>
              {overview.recentRiskFiles.map((file) => (
                <tr key={file.id}>
                  <Td>{file.originalName}</Td>
                  <Td>{file.userPhone}</Td>
                  <Td><StatusPill tone={file.scanStatus === "BLOCKED" ? "bad" : "warn"}>{file.scanStatus}</StatusPill></Td>
                  <Td>{formatDate(file.createdAt)}</Td>
                </tr>
              ))}
              {overview.recentRiskFiles.length === 0 ? <EmptyRow colSpan={4} /> : null}
            </tbody>
          </AdminTable>
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

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td className="px-sm py-md text-center text-caption-md text-secondary" colSpan={colSpan}>暂无数据</td>
    </tr>
  );
}
