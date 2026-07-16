"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useRef, useState } from "react";

type DraftAdjustment = {
  phone: string;
  amount: string;
  reason: string;
  note: string;
};

type PreviewAdjustment = {
  targetUserId: string;
  phone: string;
  isCurrentAdmin: boolean;
  currentBalance: number;
  amount: number;
  estimatedBalance: number;
  reason: string;
  note: string;
};

type PendingAdjustment = PreviewAdjustment & {
  clientRequestId: string;
};

type AdjustmentResult = {
  phone: string;
  amount: number;
  balance: number;
  ledgerId: string;
  duplicated: boolean;
};

type Feedback =
  | { status: "idle"; message: "" }
  | { status: "error"; message: string }
  | { status: "success"; message: string; result: AdjustmentResult };

const EMPTY_DRAFT: DraftAdjustment = {
  phone: "",
  amount: "",
  reason: "",
  note: ""
};

export function CreditAdjustmentForm({ adminPhone, disabled }: { adminPhone: string; disabled: boolean }) {
  const [draft, setDraft] = useState<DraftAdjustment>(EMPTY_DRAFT);
  const [feedback, setFeedback] = useState<Feedback>({ status: "idle", message: "" });
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);
  const [busy, setBusy] = useState<"preview" | "submit" | null>(null);
  const requestIdentity = useRef<{ fingerprint: string; clientRequestId: string } | null>(null);

  async function previewAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || busy) {
      return;
    }

    setBusy("preview");
    setFeedback({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/v1/admin/credit-adjustments/preview", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          phone: draft.phone.trim(),
          amount: Number(draft.amount),
          reason: draft.reason.trim(),
          note: draft.note.trim()
        })
      });
      const payload = await readApiPayload(response);

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "无法预览补积分信息");
      }

      const preview = payload.data as PreviewAdjustment;
      const fingerprint = JSON.stringify({
        phone: preview.phone,
        amount: preview.amount,
        reason: preview.reason,
        note: preview.note
      });
      const clientRequestId = requestIdentity.current?.fingerprint === fingerprint
        ? requestIdentity.current.clientRequestId
        : createClientRequestId();

      requestIdentity.current = { fingerprint, clientRequestId };
      setPendingAdjustment({
        ...preview,
        clientRequestId
      });
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "无法预览补积分信息"
      });
    } finally {
      setBusy(null);
    }
  }

  async function submitAdjustment() {
    if (!pendingAdjustment || disabled || busy) {
      return;
    }

    setBusy("submit");
    setFeedback({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/v1/admin/credit-adjustments", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          phone: pendingAdjustment.phone,
          amount: pendingAdjustment.amount,
          reason: pendingAdjustment.reason,
          note: pendingAdjustment.note,
          clientRequestId: pendingAdjustment.clientRequestId
        })
      });
      const payload = await readApiPayload(response);

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "补积分失败");
      }

      const result: AdjustmentResult = {
        phone: payload.data.phone,
        amount: payload.data.amount,
        balance: payload.data.account.balance,
        ledgerId: payload.data.ledger.id,
        duplicated: payload.data.duplicated === true
      };

      setFeedback({
        status: "success",
        message: result.duplicated ? "该笔补积分已处理，本次未重复入账。" : "补积分成功",
        result
      });
      setPendingAdjustment(null);
      setDraft(EMPTY_DRAFT);
      requestIdentity.current = null;
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "补积分失败"
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <form className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm" onSubmit={previewAdjustment}>
        {pendingAdjustment ? (
          <div>
            <div className="text-body-emphasis text-ink">确认补积分信息</div>
            <div className="mt-sm grid gap-xs rounded-md border border-primary-soft bg-surface-container-low p-md text-caption-md text-secondary md:grid-cols-2">
              <ConfirmItem label="目标用户" value={`${pendingAdjustment.phone}${pendingAdjustment.isCurrentAdmin ? "（当前管理员本人）" : ""}`} />
              <ConfirmItem label="当前积分余额" value={formatPoints(pendingAdjustment.currentBalance)} />
              <ConfirmItem label="补积分数量" value={`+${formatPoints(pendingAdjustment.amount)}`} />
              <ConfirmItem label="补充后预计余额" value={formatPoints(pendingAdjustment.estimatedBalance)} />
              <ConfirmItem label="补积分原因" value={pendingAdjustment.reason} />
              <ConfirmItem label="备注" value={pendingAdjustment.note || "-"} />
            </div>
            <div className="mt-md flex flex-wrap items-center gap-sm">
              <button
                className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary hover:bg-primary-deep disabled:bg-outline disabled:text-paper"
                disabled={disabled || busy !== null}
                onClick={submitAdjustment}
                type="button"
              >
                {busy === "submit" ? "正在补积分" : "确认补积分"}
              </button>
              <button
                className="h-10 rounded-md border border-steel/60 bg-paper px-md text-button-md text-secondary hover:border-primary hover:text-primary disabled:text-outline"
                disabled={busy !== null}
                onClick={() => {
                  setPendingAdjustment(null);
                  setFeedback({ status: "idle", message: "" });
                }}
                type="button"
              >
                返回修改
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-sm md:grid-cols-2">
              <label className="grid gap-xxs text-caption-bold text-secondary">
                手机号
                <div className="flex gap-xs">
                  <input
                    className="h-10 min-w-0 flex-1 rounded-md border border-steel/50 bg-paper px-sm text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
                    disabled={disabled || busy !== null}
                    inputMode="numeric"
                    maxLength={11}
                    name="phone"
                    onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="请输入手机号"
                    required
                    value={draft.phone}
                  />
                  <button
                    className="h-10 shrink-0 rounded-md border border-steel/60 bg-paper px-sm text-button-md text-secondary hover:border-primary hover:text-primary disabled:text-outline"
                    disabled={disabled || busy !== null}
                    onClick={() => setDraft((current) => ({ ...current, phone: adminPhone }))}
                    type="button"
                  >
                    填入本人
                  </button>
                </div>
              </label>
              <label className="grid gap-xxs text-caption-bold text-secondary">
                补积分数量
                <input
                  className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
                  disabled={disabled || busy !== null}
                  max={1_000_000}
                  min={1}
                  name="amount"
                  onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                  required
                  step={1}
                  type="number"
                  value={draft.amount}
                />
              </label>
            </div>
            <label className="mt-sm grid gap-xxs text-caption-bold text-secondary">
              补积分原因
              <input
                className="h-10 rounded-md border border-steel/50 bg-paper px-sm text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
                disabled={disabled || busy !== null}
                maxLength={200}
                minLength={5}
                name="reason"
                onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}
                placeholder="例如：运营活动奖励"
                required
                value={draft.reason}
              />
            </label>
            <label className="mt-sm grid gap-xxs text-caption-bold text-secondary">
              备注
              <textarea
                className="min-h-24 rounded-md border border-steel/50 bg-paper px-sm py-xs text-body-md font-normal text-ink outline-none focus:border-primary disabled:bg-surface-container"
                disabled={disabled || busy !== null}
                maxLength={200}
                name="note"
                onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                placeholder="可选"
                value={draft.note}
              />
            </label>
            <div className="mt-md">
              <button
                className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary hover:bg-primary-deep disabled:bg-outline disabled:text-paper"
                disabled={disabled || busy !== null}
                type="submit"
              >
                {busy === "preview" ? "正在校验" : "下一步：确认信息"}
              </button>
            </div>
          </>
        )}

        {feedback.status === "error" ? (
          <div aria-live="polite" className="mt-md rounded-md border border-error-container bg-error-container px-md py-sm text-caption-md text-bloom-deep">
            {feedback.message}
          </div>
        ) : null}
      </form>

      {feedback.status === "success" ? (
        <div aria-live="polite" className="mt-md rounded-lg border border-emerald-200 bg-emerald-50 p-md text-caption-md text-emerald-900 shadow-sm">
          <div className="text-body-emphasis">{feedback.message}</div>
          <div className="mt-xs grid gap-xxs">
            <div>目标手机号：{feedback.result.phone}</div>
            <div>本次补积分：+{formatPoints(feedback.result.amount)}</div>
            <div>最新积分余额：{formatPoints(feedback.result.balance)}</div>
            <div className="break-all">流水 ID：{feedback.result.ledgerId}</div>
            <div>重复请求：{feedback.result.duplicated ? "是" : "否"}</div>
          </div>
          <Link className="mt-sm inline-flex text-link-md text-primary hover:underline" href={`/admin/credit-ledger?phone=${encodeURIComponent(feedback.result.phone)}`}>
            查看该用户积分流水
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ConfirmItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-caption-sm text-outline">{label}</div>
      <div className="mt-xxs break-words text-caption-bold text-ink">{value}</div>
    </div>
  );
}

async function readApiPayload(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("服务返回异常，请稍后再试");
  }
}

function formatPoints(value: number) {
  return `${value.toLocaleString("zh-CN")} 积分`;
}

function createClientRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
