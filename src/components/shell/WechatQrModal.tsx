"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type WechatQrModalProps = {
  open: boolean;
  onClose: () => void;
};

type QrState =
  | { status: "idle" | "loading" }
  | { status: "success"; configured: boolean; imageUrl: string | null }
  | { status: "error" };

export function WechatQrModal({ onClose, open }: WechatQrModalProps) {
  const [qrState, setQrState] = useState<QrState>({ status: "idle" });

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    setQrState({ status: "loading" });
    fetch("/api/v1/public/wechat-group-qr", {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message ?? "二维码加载失败");
        }

        setQrState({
          status: "success",
          configured: Boolean(payload.data.configured),
          imageUrl: typeof payload.data.imageUrl === "string" ? payload.data.imageUrl : null
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setQrState({ status: "error" });
      });

    return () => controller.abort();
  }, [open]);

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

        <div className="mx-auto flex min-h-[264px] w-full max-w-[264px] items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low p-sm">
          {qrState.status === "loading" || qrState.status === "idle" ? (
            <div className="px-sm text-center text-caption-md text-secondary">二维码加载中...</div>
          ) : null}
          {qrState.status === "error" ? (
            <div className="px-sm text-center text-caption-md text-secondary">二维码加载失败，请稍后再试。</div>
          ) : null}
          {qrState.status === "success" && !qrState.configured ? (
            <div className="px-sm text-center text-caption-md text-secondary">微信群二维码暂未配置，请稍后再试。</div>
          ) : null}
          {qrState.status === "success" && qrState.configured && qrState.imageUrl ? (
            <Image
              alt="LightQuant 微信群二维码"
              className="h-auto w-full max-w-[240px] rounded-lg bg-paper"
              height={669}
              sizes="(max-width: 420px) 68vw, 240px"
              src={qrState.imageUrl}
              unoptimized
              width={669}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
