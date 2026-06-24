import { getAdminModelConfig } from "@/server/admin/model-config-service";
import { AdminLoginRequired, AdminShell, AdminTable, Td, Th } from "@/app/admin/AdminShell";
import { getAdminPageContext } from "@/app/admin/admin-page";
import { ModelProfileSwitcher } from "@/app/admin/model-config/ModelProfileSwitcher";

export const dynamic = "force-dynamic";

export default async function AdminModelConfigPage() {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const data = await getAdminModelConfig();
  const writeDisabled = !data.writeGuards.adminWriteEnabled || !data.writeGuards.modelConfigWriteEnabled;

  return (
    <AdminShell active="model-config" adminPhone={context.user.phone}>
      <div className="space-y-md">
        <section className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-sm">
            <div>
              <h2 className="text-body-emphasis text-ink">当前生效配置</h2>
              <p className="mt-xxs text-caption-md text-secondary">
                来源：{data.current.source === "env" ? "环境变量" : "数据库覆盖"}
              </p>
            </div>
            <span className={`rounded-full px-xs py-[2px] text-caption-sm ${data.current.configValid ? "bg-emerald-50 text-emerald-700" : "bg-error-container/30 text-bloom-deep"}`}>
              {data.current.configValid ? "配置可用" : "配置异常"}
            </span>
          </div>
          <div className="mt-md grid gap-sm md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Provider" value={data.current.provider} />
            <Metric label="Base URL" value={data.current.baseUrlHost} />
            <Metric label="Model" value={data.current.model} />
            <Metric label="Vision" value={data.current.supportsVision ? "支持" : "不支持"} />
            <Metric label="AI API Key" value={data.current.apiKeyConfigured ? "已配置" : "未配置"} />
            <Metric label="写操作开关" value={data.writeGuards.modelConfigWriteEnabled ? "已开启" : "未开启"} />
            <Metric label="Active Profile" value={data.current.activeProfileName ?? "来自环境变量"} />
          </div>
          {data.current.errorHint ? (
            <div className="mt-sm rounded-md border border-amber-200 bg-amber-50 px-sm py-xs text-caption-md text-amber-900">
              {data.current.errorHint}
            </div>
          ) : null}
        </section>

        {writeDisabled ? (
          <div className="rounded-md border border-steel/40 bg-surface-container-low px-md py-sm text-caption-md text-secondary">
            模型配置写操作未开启。只读查看可用，切换 active profile 需要同时开启 ADMIN_WRITE_ENABLED 和 ADMIN_MODEL_CONFIG_WRITE_ENABLED。
          </div>
        ) : null}

        <section>
          <h2 className="mb-sm text-body-emphasis text-ink">模型配置</h2>
          <ModelProfileSwitcher disabled={writeDisabled} profiles={data.profiles} />
        </section>

        <section>
          <h2 className="mb-sm text-body-emphasis text-ink">密钥状态</h2>
          <AdminTable>
            <thead>
              <tr>
                <Th>配置项</Th>
                <Th>是否配置</Th>
                <Th>格式状态</Th>
                <Th>来源</Th>
                <Th>提示</Th>
              </tr>
            </thead>
            <tbody>
              {data.keyStatuses.map((item) => (
                <tr key={item.name}>
                  <Td>{item.name}</Td>
                  <Td>{item.configured ? "是" : "否"}</Td>
                  <Td>{formatSecretFormat(item.formatValid)}</Td>
                  <Td>{item.source}</Td>
                  <Td>{item.hint}</Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </section>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-steel/30 bg-surface-container-low px-sm py-xs">
      <div className="text-caption-sm text-secondary">{label}</div>
      <div className="mt-xxs truncate text-body-md font-semibold text-ink">{value}</div>
    </div>
  );
}

function formatSecretFormat(value: boolean | "unknown") {
  if (value === "unknown") {
    return "未知";
  }

  return value ? "通过" : "未通过";
}
