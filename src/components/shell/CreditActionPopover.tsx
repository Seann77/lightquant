"use client";

import { CreditCard, FileText, Gift, LogOut } from "lucide-react";

type CreditActionPopoverProps = {
  betaVipActive?: boolean;
  betaVipExpiryLabel?: string;
  onClose: () => void;
  onOpenInvite: () => void;
  onOpenRecharge: () => void;
  onOpenStatement: () => void;
  onLogout: () => void;
  open: boolean;
  paymentFeatureEnabled?: boolean;
};

export function CreditActionPopover({
  betaVipActive = false,
  betaVipExpiryLabel = "",
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

  const vipExpiryText = betaVipExpiryLabel ? `会员${betaVipExpiryLabel}到期` : "会员6月28日到期";

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
        {betaVipActive ? (
          <div className="lq-credit-vip-panel" role="status">
            <p className="lq-credit-vip-title">内测VIP生效中</p>
            <p>{vipExpiryText}</p>
            <p>会员期内使用不消耗积分</p>
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
