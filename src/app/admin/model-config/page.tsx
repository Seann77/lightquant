import { getAdminModelConfig } from "@/server/admin/model-config-service";
import { AdminLoginRequired, AdminShell } from "@/app/admin/AdminShell";
import { getAdminPageContext } from "@/app/admin/admin-page";
import { ModelConfigCenter } from "@/app/admin/model-config/ModelConfigCenter";

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
                实际运行来源：{data.current.source === "env" ? "环境变量" : "数据库 Profile"}
              </p>
            </div>
            <span className={`rounded-full px-xs py-[2px] text-caption-sm ${data.current.configValid ? "bg-emerald-50 text-emerald-700" : "bg-error-container/30 text-bloom-deep"}`}>
              {data.current.configValid ? "配置可用" : "配置异常"}
            </span>
          </div>

          <div className="mt-md grid gap-sm md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Profile" value={data.current.activeProfileName ?? "环境变量"} />
            <Metric label="Provider" value={data.current.provider} />
            <Metric label="Base URL" value={data.current.baseUrlHost} />
            <Metric label="Model" value={data.current.model} />
            <Metric label="Vision" value={data.current.supportsVision ? "支持" : "不支持"} />
            <Metric label="API Key" value={data.current.apiKeyConfigured ? "已配置" : "未配置"} />
            <Metric label="Key 来源" value={formatKeySource(data.current.apiKeySource)} />
            <Metric label="写开关" value={writeDisabled ? "未开启" : "已开启"} />
          </div>

          {data.current.errorHint ? (
            <div className="mt-sm rounded-md border border-amber-200 bg-amber-50 px-sm py-xs text-caption-md text-amber-900">
              {data.current.errorHint}
            </div>
          ) : null}
        </section>

        {writeDisabled ? (
          <div className="rounded-md border border-steel/40 bg-surface-container-low px-md py-sm text-caption-md text-secondary">
            模型配置写操作未开启。当前页面只读；新增、编辑、启用、停用、切换 Profile 和写入 API Key 都需要同时开启 ADMIN_WRITE_ENABLED 与 ADMIN_MODEL_CONFIG_WRITE_ENABLED。
          </div>
        ) : null}

        {!data.writeGuards.configEncryptionConfigured ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-md py-sm text-caption-md text-amber-900">
            未配置 CONFIG_ENCRYPTION_KEY 或 APP_CONFIG_ENCRYPTION_KEY。环境变量回退仍可用，但后台不能写入数据库模型 API Key。
          </div>
        ) : null}

        <ModelConfigCenter data={data} />
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

function formatKeySource(value: "database secret" | "env" | "none") {
  if (value === "database secret") {
    return "数据库加密 Key";
  }

  if (value === "env") {
    return "环境变量";
  }

  return "-";
}
