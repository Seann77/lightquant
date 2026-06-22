"use client";

import Image from "next/image";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const WECHAT_GROUP_QR_SRC = "/lightquant/lightquant-wechat-group-20260628.png";

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

        <div className="mx-auto flex w-full max-w-[264px] items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low p-sm">
          <Image
            alt="LightQuant 微信群二维码"
            className="h-auto w-full max-w-[240px] rounded-lg bg-paper"
            height={669}
            sizes="(max-width: 420px) 68vw, 240px"
            src={WECHAT_GROUP_QR_SRC}
            width={669}
          />
        </div>

        <div className="mt-lg rounded bg-cloud px-sm py-sm text-caption-sm text-graphite">
          微信群二维码有效期至 2026-06-28，过期后我们会更新。
        </div>
      </div>
    </div>
  );
}
