"use client";

import { useState, type FormEvent } from "react";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function WechatGroupQrUploadForm({ disabled }: { disabled: boolean }) {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || submitting) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setState({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/v1/admin/wechat-group-qr", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "微信群二维码上传失败");
      }

      setState({ status: "success", message: "微信群二维码已上传并设为当前生效" });
      form.reset();
      window.location.reload();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "微信群二维码上传失败"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm" onSubmit={onSubmit}>
      <div className="grid gap-sm md:grid-cols-2">
        <label className="grid gap-xxs text-caption-bold text-secondary">
          二维码图片
          <input
            accept="image/png,image/jpeg,image/webp"
            className="h-10 rounded-md border border-steel/50 bg-paper px-sm py-2 text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
            disabled={disabled || submitting}
            name="file"
            required
            type="file"
          />
        </label>
        <label className="grid gap-xxs text-caption-bold text-secondary">
          到期时间
          <input
            className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
            disabled={disabled || submitting}
            name="expiresAt"
            required
            type="datetime-local"
          />
        </label>
      </div>
      <div className="mt-md flex flex-wrap items-center gap-sm">
        <button
          className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary disabled:bg-outline disabled:text-paper"
          disabled={disabled || submitting}
          type="submit"
        >
          {submitting ? "上传中" : "上传并设为生效"}
        </button>
        {state.message ? (
          <span className={state.status === "success" ? "text-caption-md text-emerald-700" : "text-caption-md text-bloom-deep"}>
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
