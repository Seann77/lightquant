import { listAdminFiles } from "@/server/admin/admin-service";
import { AdminLoginRequired, AdminShell, AdminTable, formatDate, Pagination, StatusPill, Td, Th } from "@/app/admin/AdminShell";
import { getAdminPageContext, numberParam, readSearchParams, stringParam, type SearchParams } from "@/app/admin/admin-page";

export const dynamic = "force-dynamic";

const scanStatuses = ["", "PASSED", "WARNING", "BLOCKED"];

export default async function AdminFilesPage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const params = await readSearchParams(searchParams);
  const page = numberParam(params, "page", 1);
  const scanStatus = stringParam(params, "scanStatus");
  const data = await listAdminFiles({ page, pageSize: 20, scanStatus });

  return (
    <AdminShell active="files" adminPhone={context.user.phone}>
      <form className="mb-md flex flex-wrap gap-sm" method="get">
        <select className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md outline-none focus:border-primary" defaultValue={scanStatus ?? ""} name="scanStatus">
          {scanStatuses.map((item) => <option key={item} value={item}>{item || "全部状态"}</option>)}
        </select>
        <button className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary" type="submit">筛选</button>
      </form>

      <AdminTable>
        <thead>
          <tr>
            <Th>文件名</Th>
            <Th>手机号</Th>
            <Th>扩展名</Th>
            <Th>大小</Th>
            <Th>sha256</Th>
            <Th>扫描</Th>
            <Th>风险标记</Th>
            <Th>上传时间</Th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((file) => (
            <tr key={file.id}>
              <Td>{file.originalName}</Td>
              <Td>{file.userPhone}</Td>
              <Td>{file.ext}</Td>
              <Td>{formatBytes(file.sizeBytes)}</Td>
              <Td>{file.sha256Prefix}</Td>
              <Td><StatusPill tone={file.scanStatus === "BLOCKED" ? "bad" : file.scanStatus === "WARNING" ? "warn" : "good"}>{file.scanStatus}</StatusPill></Td>
              <Td>{file.riskFlags.length > 0 ? file.riskFlags.join("、") : "-"}</Td>
              <Td>{formatDate(file.createdAt)}</Td>
            </tr>
          ))}
          {data.items.length === 0 ? <EmptyRow colSpan={8} /> : null}
        </tbody>
      </AdminTable>

      <Pagination page={data.page} totalPages={data.totalPages} href={(nextPage) => `/admin/files?page=${nextPage}${scanStatus ? `&scanStatus=${encodeURIComponent(scanStatus)}` : ""}`} />
    </AdminShell>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td className="px-sm py-md text-center text-caption-md text-secondary" colSpan={colSpan}>暂无数据</td>
    </tr>
  );
}
