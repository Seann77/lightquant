"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type PendingAdjustment = {
  phone: string;
  amount: number;
  reason: string;
  note: string;
};

export function CreditAdjustmentForm({ disabled }: { disabled: boolean }) {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || submitting) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));
    const nextAdjustment = {
      phone: String(form.get("phone") ?? "").trim(),
      amount,
      reason: String(form.get("reason") ?? "").trim(),
      note: String(form.get("note") ?? "").trim()
    };

    setPendingAdjustment(nextAdjustment);
    setState({ status: "idle", message: "" });
  }

  async function submitAdjustment(adjustment: PendingAdjustment) {
    setSubmitting(true);
    setState({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/v1/admin/credit-adjustments", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          phone: adjustment.phone,
          amount: adjustment.amount,
          reason: adjustment.reason,
          note: adjustment.note,
          clientRequestId: createClientRequestId()
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "补积分失败");
      }

      setState({
        status: "success",
        message: `补积分成功，流水 ID：${payload.data.ledger.id.slice(0, 8)}`
      });
      setPendingAdjustment(null);
      document.querySelector<HTMLFormElement>("[data-credit-adjustment-form]")?.reset();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "补积分失败"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="max-w-2xl rounded-lg border border-steel/40 bg-paper p-md shadow-sm" data-credit-adjustment-form onSubmit={onSubmit}>
      <div className="grid gap-sm md:grid-cols-2">
        <label className="grid gap-xxs text-caption-bold text-secondary">
          手机号
          <input
            className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
            disabled={disabled || submitting}
            name="phone"
            placeholder="请输入手机号"
            required
          />
        </label>
        <label className="grid gap-xxs text-caption-bold text-secondary">
          补积分数量
          <input
            className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
            disabled={disabled || submitting}
            min={1}
            name="amount"
            required
            step={1}
            type="number"
          />
        </label>
      </div>
      <label className="mt-sm grid gap-xxs text-caption-bold text-secondary">
        补积分原因
        <input
          className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
          disabled={disabled || submitting}
          maxLength={200}
          minLength={5}
          name="reason"
          placeholder="例如：运营活动奖励"
          required
        />
      </label>
      <label className="mt-sm grid gap-xxs text-caption-bold text-secondary">
        备注
        <textarea
          className="min-h-24 rounded-md border border-steel/50 bg-paper px-sm py-xs text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
          disabled={disabled || submitting}
          maxLength={200}
          name="note"
          placeholder="可选"
        />
      </label>
      {pendingAdjustment ? (
        <div className="mt-sm rounded-md border border-amber-200 bg-amber-50 px-md py-sm text-caption-md text-amber-900">
          <div className="text-caption-bold">请再次确认补积分信息</div>
          <div className="mt-xs grid gap-xxs">
            <div>手机号：{pendingAdjustment.phone}</div>
            <div>补积分数量：{pendingAdjustment.amount}</div>
            <div>补积分原因：{pendingAdjustment.reason}</div>
          </div>
        </div>
      ) : null}
      <div className="mt-md flex flex-wrap items-center gap-sm">
        <button
          className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary disabled:bg-outline disabled:text-paper"
          disabled={disabled || submitting}
          type="submit"
        >
          {submitting ? "提交中" : "预览补积分"}
        </button>
        {pendingAdjustment ? (
          <>
            <button
              className="h-10 rounded-md bg-bloom px-md text-button-md text-on-primary disabled:bg-outline disabled:text-paper"
              disabled={disabled || submitting}
              onClick={() => submitAdjustment(pendingAdjustment)}
              type="button"
            >
              确认提交
            </button>
            <button
              className="h-10 rounded-md border border-steel/50 bg-paper px-md text-button-md text-secondary disabled:text-outline"
              disabled={submitting}
              onClick={() => setPendingAdjustment(null)}
              type="button"
            >
              取消确认
            </button>
          </>
        ) : null}
        {state.message ? (
          <span className={state.status === "success" ? "text-caption-md text-emerald-700" : "text-caption-md text-bloom-deep"}>
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function createClientRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
