"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

type WechatQrModalProps = {
  open: boolean;
  onClose: () => void;
};

export function WechatQrModal({ onClose, open }: WechatQrModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-md backdrop-blur-[2px]" role="presentation">
      <div
        aria-labelledby="wechat-modal-title"
        aria-modal="true"
        className="relative w-full max-w-[360px] rounded-xl bg-paper p-xl shadow-modal"
        role="dialog"
      >
        <button
          aria-label="关闭微信群弹窗"
          className="absolute right-md top-md text-secondary transition-colors hover:text-primary"
          onClick={onClose}
          type="button"
        >
          <MaterialIcon size={20}>close</MaterialIcon>
        </button>

        <div className="mb-lg">
          <h2 className="text-display-md font-semibold text-on-background" id="wechat-modal-title">
            加入微信群
          </h2>
          <p className="mt-xs text-caption-md text-secondary">扫码加入 LightQuant 量化学习交流群，获取功能更新与使用支持。</p>
        </div>

        <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low p-md">
          <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-1 rounded bg-paper p-2">
            {Array.from({ length: 25 }).map((_, index) => {
              const filled = [0, 1, 2, 4, 5, 7, 10, 11, 12, 14, 16, 18, 19, 20, 22, 24].includes(index);

              return (
                <span
                  className={`rounded-sm ${filled ? "bg-ink" : "bg-surface-container"}`}
                  key={index}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-lg rounded bg-cloud px-sm py-sm text-caption-sm text-graphite">
          当前为前端静态占位二维码，后续替换为真实微信群二维码图片。
        </div>
      </div>
    </div>
  );
}
