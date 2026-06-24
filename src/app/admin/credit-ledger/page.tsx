import { listAdminCreditLedger } from "@/server/admin/admin-service";
import { AdminLoginRequired, AdminShell, AdminTable, formatDate, Pagination, StatusPill, Td, Th } from "@/app/admin/AdminShell";
import { getAdminPageContext, numberParam, readSearchParams, stringParam, type SearchParams } from "@/app/admin/admin-page";

export const dynamic = "force-dynamic";

const ledgerTypes = ["", "bonus", "recharge", "consume", "refund"];
const directions = ["", "in", "out"];

export default async function AdminCreditLedgerPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const params = await readSearchParams(searchParams);
  const page = numberParam(params, "page", 1);
  const phone = stringParam(params, "phone");
  const type = stringParam(params, "type");
  const direction = stringParam(params, "direction");
  const createdFrom = stringParam(params, "createdFrom");
  const createdTo = stringParam(params, "createdTo");
  const data = await listAdminCreditLedger({ page, pageSize: 20, phone, type, direction, createdFrom, createdTo });
  const query = buildLedgerQuery({ phone, type, direction, createdFrom, createdTo });

  return (
    <AdminShell active="credit-ledger" adminPhone={context.user.phone}>
      <form className="mb-md flex flex-wrap gap-sm" method="get">
        <input
          className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary"
          defaultValue={phone}
          name="phone"
          placeholder="搜索手机号"
        />
        <select className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary" defaultValue={type ?? ""} name="type">
          {ledgerTypes.map((item) => <option key={item} value={item}>{item || "全部类型"}</option>)}
        </select>
        <select className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary" defaultValue={direction ?? ""} name="direction">
          {directions.map((item) => <option key={item} value={item}>{item || "全部方向"}</option>)}
        </select>
        <input
          className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary"
          defaultValue={createdFrom}
          name="createdFrom"
          type="date"
        />
        <input
          className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary"
          defaultValue={createdTo}
          name="createdTo"
          type="date"
        />
        <button className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary" type="submit">筛选</button>
      </form>

      <AdminTable>
        <thead>
          <tr>
            <Th>手机号</Th>
            <Th>方向</Th>
            <Th>类型</Th>
            <Th>金额</Th>
            <Th>余额快照</Th>
            <Th>来源类型</Th>
            <Th>来源 ID</Th>
            <Th>备注</Th>
            <Th>创建时间</Th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <Td>{item.userPhone}</Td>
              <Td><StatusPill tone={item.direction === "in" ? "good" : "warn"}>{item.direction}</StatusPill></Td>
              <Td>{item.type}</Td>
              <Td>{item.direction === "in" ? "+" : "-"}{item.amount}</Td>
              <Td>{item.balanceAfter}</Td>
              <Td>{item.sourceType}</Td>
              <Td>{shortText(item.sourceId)}</Td>
              <Td>{item.remark}</Td>
              <Td>{formatDate(item.createdAt)}</Td>
            </tr>
          ))}
          {data.items.length === 0 ? <EmptyRow colSpan={9} /> : null}
        </tbody>
      </AdminTable>

      <Pagination page={data.page} totalPages={data.totalPages} href={(nextPage) => `/admin/credit-ledger?page=${nextPage}${query}`} />
    </AdminShell>
  );
}

function buildLedgerQuery(input: { phone?: string; type?: string; direction?: string; createdFrom?: string; createdTo?: string }) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `&${query}` : "";
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td className="px-sm py-md text-center text-caption-md text-secondary" colSpan={colSpan}>暂无数据</td>
    </tr>
  );
}

function shortText(value: string, length = 24) {
  return value.length > length ? `${value.slice(0, length)}...` : value;
}
