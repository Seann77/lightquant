import { listAdminAiTasks } from "@/server/admin/admin-service";
import { AdminLoginRequired, AdminShell, AdminTable, formatDate, Pagination, StatusPill, Td, Th } from "@/app/admin/AdminShell";
import { getAdminPageContext, numberParam, readSearchParams, stringParam, type SearchParams } from "@/app/admin/admin-page";

export const dynamic = "force-dynamic";

const taskTypes = ["", "strategy_generation", "code_analysis", "code_conversion"];
const statuses = ["", "PENDING", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"];

export default async function AdminAiTasksPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const params = await readSearchParams(searchParams);
  const page = numberParam(params, "page", 1);
  const type = stringParam(params, "type");
  const status = stringParam(params, "status");
  const data = await listAdminAiTasks({ page, pageSize: 20, type, status });

  return (
    <AdminShell active="ai-tasks" adminPhone={context.user.phone}>
      <form className="mb-md flex flex-wrap gap-sm" method="get">
        <select className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary" defaultValue={type ?? ""} name="type">
          {taskTypes.map((item) => <option key={item} value={item}>{item || "全部类型"}</option>)}
        </select>
        <select className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary" defaultValue={status ?? ""} name="status">
          {statuses.map((item) => <option key={item} value={item}>{item || "全部状态"}</option>)}
        </select>
        <button className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary" type="submit">筛选</button>
      </form>

      <AdminTable>
        <thead>
          <tr>
            <Th>任务 ID</Th>
            <Th>手机号</Th>
            <Th>类型</Th>
            <Th>状态</Th>
            <Th>范围</Th>
            <Th>积分</Th>
            <Th>模型</Th>
            <Th>token</Th>
            <Th>错误</Th>
            <Th>创建</Th>
            <Th>完成</Th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((task) => (
            <tr key={task.id}>
              <Td>{task.id.slice(0, 8)}</Td>
              <Td>{task.userPhone}</Td>
              <Td>{task.type}</Td>
              <Td><StatusPill tone={task.status === "SUCCEEDED" ? "good" : task.status === "FAILED" ? "bad" : "neutral"}>{task.status}</StatusPill></Td>
              <Td>{task.scopeStatus}</Td>
              <Td>{task.costPoints}</Td>
              <Td>{task.model ?? "-"}</Td>
              <Td>{task.tokenUsage?.totalTokens ?? "-"}</Td>
              <Td>{task.errorCode ? `${task.errorCode}: ${task.errorMessage ?? ""}` : "-"}</Td>
              <Td>{formatDate(task.createdAt)}</Td>
              <Td>{formatDate(task.finishedAt)}</Td>
            </tr>
          ))}
          {data.items.length === 0 ? <EmptyRow colSpan={11} /> : null}
        </tbody>
      </AdminTable>

      <Pagination page={data.page} totalPages={data.totalPages} href={(nextPage) => `/admin/ai-tasks?page=${nextPage}${type ? `&type=${encodeURIComponent(type)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}`} />
    </AdminShell>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td className="px-sm py-md text-center text-caption-md text-secondary" colSpan={colSpan}>暂无数据</td>
    </tr>
  );
}
