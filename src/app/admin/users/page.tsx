import { listAdminUsers } from "@/server/admin/admin-service";
import { AdminLoginRequired, AdminShell, AdminTable, formatDate, Pagination, StatusPill, Td, Th } from "@/app/admin/AdminShell";
import { getAdminPageContext, numberParam, readSearchParams, stringParam, type SearchParams } from "@/app/admin/admin-page";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const params = await readSearchParams(searchParams);
  const page = numberParam(params, "page", 1);
  const phone = stringParam(params, "phone");
  const data = await listAdminUsers({ page, pageSize: 20, phone });

  return (
    <AdminShell active="users" adminPhone={context.user.phone}>
      <form className="mb-md flex flex-wrap gap-sm" method="get">
        <input
          className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary"
          defaultValue={phone}
          name="phone"
          placeholder="搜索手机号"
        />
        <button className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary" type="submit">筛选</button>
      </form>

      <AdminTable>
        <thead>
          <tr>
            <Th>手机号</Th>
            <Th>昵称</Th>
            <Th>状态</Th>
            <Th>注册时间</Th>
            <Th>最近登录</Th>
            <Th>余额</Th>
            <Th>累计获得</Th>
            <Th>累计消耗</Th>
            <Th>最近流水</Th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((user) => (
            <tr key={user.id}>
              <Td>{user.phone}</Td>
              <Td>{user.displayName}</Td>
              <Td><StatusPill tone={user.status === "active" ? "good" : "bad"}>{user.status}</StatusPill></Td>
              <Td>{formatDate(user.createdAt)}</Td>
              <Td>{formatDate(user.lastLoginAt)}</Td>
              <Td>{user.creditBalance}</Td>
              <Td>{user.totalEarned}</Td>
              <Td>{user.totalSpent}</Td>
              <Td>{user.latestLedger ? `${user.latestLedger.direction === "in" ? "+" : "-"}${user.latestLedger.amount} ${user.latestLedger.remark}` : "-"}</Td>
            </tr>
          ))}
          {data.items.length === 0 ? <EmptyRow colSpan={9} /> : null}
        </tbody>
      </AdminTable>

      <Pagination page={data.page} totalPages={data.totalPages} href={(nextPage) => `/admin/users?page=${nextPage}${phone ? `&phone=${encodeURIComponent(phone)}` : ""}`} />
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
