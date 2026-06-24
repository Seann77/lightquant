import { listAdminContactRequests } from "@/server/admin/admin-service";
import { AdminLoginRequired, AdminShell, AdminTable, formatDate, Pagination, Td, Th } from "@/app/admin/AdminShell";
import { getAdminPageContext, numberParam, readSearchParams, stringParam, type SearchParams } from "@/app/admin/admin-page";

export const dynamic = "force-dynamic";

const contactMethods = ["", "邮箱", "微信号", "手机号"];
const contactCategories = ["", "使用问题", "策略生成", "代码转换", "积分/充值", "其他"];

export default async function AdminContactRequestsPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const params = await readSearchParams(searchParams);
  const page = numberParam(params, "page", 1);
  const keyword = stringParam(params, "keyword");
  const contactMethod = stringParam(params, "contactMethod");
  const category = stringParam(params, "category");
  const source = stringParam(params, "source");
  const createdFrom = stringParam(params, "createdFrom");
  const createdTo = stringParam(params, "createdTo");
  const data = await listAdminContactRequests({ page, pageSize: 20, keyword, contactMethod, category, source, createdFrom, createdTo });
  const query = buildContactRequestsQuery({ keyword, contactMethod, category, source, createdFrom, createdTo });

  return (
    <AdminShell active="contact-requests" adminPhone={context.user.phone}>
      <form className="mb-md flex flex-wrap gap-sm" method="get">
        <input
          className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary"
          defaultValue={keyword}
          name="keyword"
          placeholder="手机号 / 联系方式 / 称呼"
        />
        <select className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary" defaultValue={contactMethod ?? ""} name="contactMethod">
          {contactMethods.map((item) => <option key={item} value={item}>{item || "全部联系方式"}</option>)}
        </select>
        <select className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary" defaultValue={category ?? ""} name="category">
          {contactCategories.map((item) => <option key={item} value={item}>{item || "全部问题类型"}</option>)}
        </select>
        <input
          className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary"
          defaultValue={source}
          name="source"
          placeholder="来源路径"
        />
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
            <Th>创建时间</Th>
            <Th>用户手机号</Th>
            <Th>称呼</Th>
            <Th>联系方式类型</Th>
            <Th>联系方式内容</Th>
            <Th>问题类型</Th>
            <Th>来源</Th>
            <Th>留言内容</Th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <Td>{formatDate(item.createdAt)}</Td>
              <Td>{item.userPhone ?? "-"}</Td>
              <Td>{shortText(item.name, 18)}</Td>
              <Td>{item.contactMethod}</Td>
              <Td>{shortText(item.contactValue, 28)}</Td>
              <Td>{item.category}</Td>
              <Td>{shortText(item.source, 32)}</Td>
              <Td>{shortText(item.message, 120)}</Td>
            </tr>
          ))}
          {data.items.length === 0 ? <EmptyRow colSpan={8} /> : null}
        </tbody>
      </AdminTable>

      <Pagination page={data.page} totalPages={data.totalPages} href={(nextPage) => `/admin/contact-requests?page=${nextPage}${query}`} />
    </AdminShell>
  );
}

function buildContactRequestsQuery(input: { keyword?: string; contactMethod?: string; category?: string; source?: string; createdFrom?: string; createdTo?: string }) {
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

function shortText(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length)}...` : value;
}
