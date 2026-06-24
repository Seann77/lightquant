import { isAdminWriteEnabled } from "@/server/env";
import { AdminLoginRequired, AdminShell } from "@/app/admin/AdminShell";
import { getAdminPageContext } from "@/app/admin/admin-page";
import { CreditAdjustmentForm } from "@/app/admin/credit-adjustments/CreditAdjustmentForm";

export const dynamic = "force-dynamic";

export default async function AdminCreditAdjustmentsPage() {
  const context = await getAdminPageContext();

  if (!context) {
    return <AdminLoginRequired />;
  }

  const writeEnabled = isAdminWriteEnabled();

  return (
    <AdminShell active="credit-adjustments" adminPhone={context.user.phone}>
      {!writeEnabled ? (
        <div className="mb-md rounded-md border border-amber-200 bg-amber-50 px-md py-sm text-caption-md text-amber-800">
          后台写操作未开启。需要显式配置 ADMIN_WRITE_ENABLED=true 后，补积分 API 才会接受写入。
        </div>
      ) : null}
      <CreditAdjustmentForm disabled={!writeEnabled} />
    </AdminShell>
  );
}
