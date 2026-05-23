"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

type CreditActionPopoverProps = {
  onClose: () => void;
  onOpenRecharge: () => void;
  onOpenStatement: () => void;
  onLogout: () => void;
  open: boolean;
};

export function CreditActionPopover({ onClose, onLogout, onOpenRecharge, onOpenStatement, open }: CreditActionPopoverProps) {
  if (!open) {
    return null;
  }

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
        <button
          className="flex w-full items-center gap-sm rounded-lg px-sm py-sm text-left text-body-emphasis text-primary transition-colors hover:bg-primary-soft"
          onClick={onOpenRecharge}
          role="menuitem"
          type="button"
        >
          <MaterialIcon size={20}>add_card</MaterialIcon>
          充值积分
        </button>
        <button
          className="flex w-full items-center gap-sm rounded-lg px-sm py-sm text-left text-body-emphasis text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
          onClick={onOpenStatement}
          role="menuitem"
          type="button"
        >
          <MaterialIcon size={20}>receipt_long</MaterialIcon>
          积分流水
        </button>
        <button
          className="flex w-full items-center gap-sm rounded-lg px-sm py-sm text-left text-body-emphasis text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
          onClick={onLogout}
          role="menuitem"
          type="button"
        >
          <MaterialIcon size={20}>logout</MaterialIcon>
          退出登录
        </button>
      </div>
    </>
  );
}
