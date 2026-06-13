import { listAdminOrders } from "@/server/admin/admin-service";
import { AdminLoginRequired, AdminShell, AdminTable, formatDate, formatMoney, Pagination, StatusPill, Td, Th } from "@/app/admin/AdminShell";
import { getAdminPageContext, numberParam, readSearchParams, stringParam, type SearchParams } from "@/app/admin/admin-page";

export const dynamic = "force-dynamic";

const statuses = ["", "PENDING", "PAID", "CLOSED", "FAILED"];

export default async function AdminOrdersPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const params = await readSearchParams(searchParams);
  const page = numberParam(params, "page", 1);
  const status = stringParam(params, "status");
  const data = await listAdminOrders({ page, pageSize: 20, status });

  return (
    <AdminShell active="orders" adminPhone={context.user.phone}>
      <form className="mb-md flex flex-wrap gap-sm" method="get">
        <select className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary" defaultValue={status ?? ""} name="status">
          {statuses.map((item) => <option key={item} value={item}>{item || "全部状态"}</option>)}
        </select>
        <button className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary" type="submit">筛选</button>
      </form>

      <AdminTable>
        <thead>
          <tr>
            <Th>订单号</Th>
            <Th>手机号</Th>
            <Th>套餐</Th>
            <Th>金额</Th>
            <Th>积分快照</Th>
            <Th>渠道</Th>
            <Th>支付动作</Th>
            <Th>订单状态</Th>
            <Th>请求 ID</Th>
            <Th>过期</Th>
            <Th>最近交易</Th>
            <Th>渠道交易号</Th>
            <Th>失败原因</Th>
            <Th>创建时间</Th>
            <Th>支付时间</Th>
            <Th>关闭时间</Th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((order) => (
            <tr key={order.id}>
              <Td>{order.orderNo}</Td>
              <Td>{order.userPhone}</Td>
              <Td>{order.planName}</Td>
              <Td>{formatMoney(order.amountCents)}</Td>
              <Td>{order.totalPoints} ({order.points}+{order.bonusPoints})</Td>
              <Td>{order.payChannel}</Td>
              <Td>{order.paymentActionType}</Td>
              <Td><StatusPill tone={statusTone(order.status)}>{order.status}</StatusPill></Td>
              <Td>{shortText(order.clientRequestId)}</Td>
              <Td>
                <div>{order.expired ? "已过期" : "未过期"}</div>
                <div className="text-caption-sm text-outline">{formatDate(order.expiresAt)}</div>
              </Td>
              <Td>{order.latestPaymentStatus ? <StatusPill tone={transactionTone(order.latestPaymentStatus)}>{order.latestPaymentStatus}</StatusPill> : "-"}</Td>
              <Td>{order.latestPaymentProviderTradeNo ? shortText(order.latestPaymentProviderTradeNo, 22) : "-"}</Td>
              <Td>{order.latestPaymentFailedReason ? shortText(order.latestPaymentFailedReason, 32) : "-"}</Td>
              <Td>{formatDate(order.createdAt)}</Td>
              <Td>{formatDate(order.paidAt)}</Td>
              <Td>{formatDate(order.closedAt)}</Td>
            </tr>
          ))}
          {data.items.length === 0 ? <EmptyRow colSpan={16} /> : null}
        </tbody>
      </AdminTable>

      <Pagination page={data.page} totalPages={data.totalPages} href={(nextPage) => `/admin/orders?page=${nextPage}${status ? `&status=${encodeURIComponent(status)}` : ""}`} />
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

function statusTone(status: string) {
  if (status === "PAID") {
    return "good";
  }

  if (status === "FAILED" || status === "CLOSED") {
    return "bad";
  }

  return "neutral";
}

function transactionTone(status: string) {
  if (status === "VERIFIED") {
    return "good";
  }

  if (status === "FAILED") {
    return "bad";
  }

  return "neutral";
}

function shortText(value: string, length = 18) {
  return value.length > length ? `${value.slice(0, length)}...` : value;
}
