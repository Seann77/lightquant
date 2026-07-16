"use client";

import { CreditCard, FileText, Gift, LogOut } from "lucide-react";

type CreditActionPopoverProps = {
  monthlyExpiresAt?: string | null;
  monthlyPlanName?: string | null;
  onClose: () => void;
  onOpenInvite: () => void;
  onOpenRecharge: () => void;
  onOpenStatement: () => void;
  onLogout: () => void;
  open: boolean;
  paymentFeatureEnabled?: boolean;
};

export function CreditActionPopover({
  monthlyExpiresAt = null,
  monthlyPlanName = null,
  onClose,
  onLogout,
  onOpenInvite,
  onOpenRecharge,
  onOpenStatement,
  open,
  paymentFeatureEnabled = false
}: CreditActionPopoverProps) {
  if (!open) {
    return null;
  }

  const monthlyDate = monthlyExpiresAt ? formatDateOnly(monthlyExpiresAt) : "";
  const monthlyTone = monthlyPlanName === "月卡 Pro" ? "blue" : "green";

  return (
    <>
      <button
        aria-label="关闭积分操作菜单"
        className="fixed inset-0 z-30 cursor-default bg-transparent"
        onClick={onClose}
        type="button"
      />
      <div
        className="absolute bottom-[calc(100%+12px)] left-0 z-40 w-full overflow-hidden rounded-xl border border-outline-variant bg-paper p-xs shadow-modal"
        role="menu"
      >
        {monthlyPlanName && monthlyDate ? (
          <div className={`mb-xs rounded-lg px-sm py-xs text-caption-md ${monthlyTone === "blue" ? "bg-[#eef5ff]" : "bg-[#ecfff7]"}`} role="status">
            <p className={`m-0 font-bold ${monthlyTone === "blue" ? "text-[#0b63ff]" : "text-[#047857]"}`}>{monthlyPlanName}</p>
            <p className="m-0 text-secondary">{monthlyDate}</p>
          </div>
        ) : null}
        {paymentFeatureEnabled ? (
          <button
            className="flex w-full items-center gap-sm rounded-lg px-sm py-sm text-left text-body-emphasis text-primary transition-colors hover:bg-primary-soft"
            onClick={onOpenRecharge}
            role="menuitem"
            type="button"
          >
            <CreditCard aria-hidden="true" size={20} strokeWidth={1.8} />
            充值积分
          </button>
        ) : null}
        <button
          className="flex w-full items-center gap-sm rounded-lg px-sm py-sm text-left text-body-emphasis text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
          onClick={onOpenInvite}
          role="menuitem"
          type="button"
        >
          <Gift aria-hidden="true" size={20} strokeWidth={1.8} />
          邀请好友
        </button>
        <button
          className="flex w-full items-center gap-sm rounded-lg px-sm py-sm text-left text-body-emphasis text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
          onClick={onOpenStatement}
          role="menuitem"
          type="button"
        >
          <FileText aria-hidden="true" size={20} strokeWidth={1.8} />
          积分流水
        </button>
        <div className="lq-credit-menu-divider" aria-hidden="true" />
        <button
          className="flex w-full items-center gap-sm rounded-lg px-sm py-sm text-left text-body-emphasis text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
          onClick={onLogout}
          role="menuitem"
          type="button"
        >
          <LogOut aria-hidden="true" size={20} strokeWidth={1.8} />
          退出登录
        </button>
      </div>
    </>
  );
}

function formatDateOnly(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(date)
    .replace(/\//g, "-");
}
