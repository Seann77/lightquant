import Image from "next/image";
import { AdminLoginRequired, AdminShell, AdminTable, formatDate, StatusPill, Td, Th } from "@/app/admin/AdminShell";
import { getAdminPageContext } from "@/app/admin/admin-page";
import { WechatGroupQrUploadForm } from "@/app/admin/wechat-group-qr/WechatGroupQrUploadForm";
import { getAdminWechatGroupQrCodes } from "@/server/admin/wechat-group-qr-service";

export const dynamic = "force-dynamic";

export default async function AdminWechatGroupQrPage() {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const data = await getAdminWechatGroupQrCodes();

  return (
    <AdminShell active="wechat-group-qr" adminPhone={context.user.phone}>
      <div className="space-y-md">
        {!data.writeEnabled ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-md py-sm text-caption-md text-amber-800">
            后台写操作未开启，无法上传新的微信群二维码。
          </div>
        ) : null}

        <section className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm">
          <h2 className="text-body-emphasis text-ink">当前生效二维码</h2>
          {data.current ? (
            <div className="mt-md grid gap-md lg:grid-cols-[220px_1fr]">
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low p-xs">
                <Image
                  alt="LightQuant 微信群二维码"
                  className="h-auto w-full rounded-md"
                  height={220}
                  src={data.current.imageUrl}
                  unoptimized
                  width={220}
                />
              </div>
              <div className="grid gap-sm sm:grid-cols-2 xl:grid-cols-3">
                <Info label="上传时间" value={formatDate(data.current.createdAt)} />
                <Info label="到期时间" value={formatDate(data.current.expiresAt)} />
                <Info label="是否过期" value={data.current.expired ? "已过期" : "未过期"} />
                <Info label="上传管理员" value={data.current.uploadedByAdminPhone} />
                <Info label="状态" value={data.current.status} />
                <Info label="文件大小" value={formatBytes(data.current.imageSizeBytes)} />
              </div>
            </div>
          ) : (
            <div className="mt-sm rounded-md border border-steel/30 bg-surface-container-low px-sm py-sm text-caption-md text-secondary">
              当前还没有配置微信群二维码。
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-sm text-body-emphasis text-ink">上传新二维码</h2>
          <WechatGroupQrUploadForm disabled={!data.writeEnabled} />
        </section>

        <section>
          <h2 className="mb-sm text-body-emphasis text-ink">历史记录</h2>
          <AdminTable>
            <thead>
              <tr>
                <Th>预览</Th>
                <Th>创建时间</Th>
                <Th>到期时间</Th>
                <Th>状态</Th>
                <Th>管理员</Th>
                <Th>文件大小</Th>
                <Th>sha256</Th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <Image
                      alt="LightQuant 微信群二维码"
                      className="rounded-md border border-steel/30"
                      height={56}
                      src={item.imageUrl}
                      unoptimized
                      width={56}
                    />
                  </Td>
                  <Td>{formatDate(item.createdAt)}</Td>
                  <Td>{formatDate(item.expiresAt)}</Td>
                  <Td><StatusPill tone={item.status === "active" ? "good" : "neutral"}>{item.status}</StatusPill></Td>
                  <Td>{item.uploadedByAdminPhone}</Td>
                  <Td>{formatBytes(item.imageSizeBytes)}</Td>
                  <Td>{item.imageSha256Prefix}</Td>
                </tr>
              ))}
              {data.history.length === 0 ? (
                <tr>
                  <td className="px-sm py-md text-center text-caption-md text-secondary" colSpan={7}>暂无历史记录</td>
                </tr>
              ) : null}
            </tbody>
          </AdminTable>
        </section>
      </div>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-steel/30 bg-surface-container-low px-sm py-xs">
      <div className="text-caption-sm text-secondary">{label}</div>
      <div className="mt-xxs truncate text-body-md font-semibold text-ink">{value}</div>
    </div>
  );
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
}
