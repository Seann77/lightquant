"use client";

import { AlertTriangle } from "lucide-react";
import type { AiTaskData } from "@/lib/ai/workbench-types";

export type ConversionFailureInfo = {
  failed: boolean;
  title: string;
  message: string;
  refundApplied: boolean;
  reason: "none" | "cancelled" | "task_failed" | "stream_error" | "integrity_failed" | "repair_failed" | "refunded";
};

const COMPLETE_INTEGRITY_STATUSES = new Set(["", "complete", "unchecked"]);
const BLOCKING_INTEGRITY_STATUSES = new Set(["failed", "error", "incomplete", "partial_failed", "repair_failed"]);

export function getConversionFailureInfo(data: AiTaskData | null | undefined, streamError?: string | null): ConversionFailureInfo {
  const task = data?.task;
  const report = readRecord(data?.result?.reportJson);
  const status = task?.status ?? "";
  const refundApplied = isRefundApplied(report) || Boolean(task?.errorMessage?.includes("积分已退回"));

  if (status === "CANCELLED") {
    return {
      failed: true,
      title: "转换未完成",
      message: task?.errorMessage?.trim() || "任务已取消，本次转换未完成。你可以重新提交或调整输入后再试。",
      refundApplied,
      reason: "cancelled"
    };
  }

  if (status === "FAILED") {
    return {
      failed: true,
      title: "转换未完成",
      message: task?.errorMessage?.trim() || getDefaultFailureMessage(refundApplied),
      refundApplied,
      reason: "task_failed"
    };
  }

  if (isRepairFailed(report)) {
    return {
      failed: true,
      title: "转换未完成",
      message: task?.errorMessage?.trim() || getDefaultFailureMessage(refundApplied),
      refundApplied,
      reason: "repair_failed"
    };
  }

  if (isIntegrityFailed(report)) {
    return {
      failed: true,
      title: "转换未完成",
      message: task?.errorMessage?.trim() || getDefaultFailureMessage(refundApplied),
      refundApplied,
      reason: "integrity_failed"
    };
  }

  if (refundApplied) {
    return {
      failed: true,
      title: "转换未完成",
      message: task?.errorMessage?.trim() || getDefaultFailureMessage(true),
      refundApplied: true,
      reason: "refunded"
    };
  }

  if (streamError?.trim()) {
    return {
      failed: true,
      title: "转换未完成",
      message: streamError.trim(),
      refundApplied,
      reason: "stream_error"
    };
  }

  return {
    failed: false,
    title: "",
    message: "",
    refundApplied,
    reason: "none"
  };
}

export function countConversionCodeLines(code: string | null | undefined) {
  const value = code ?? "";

  if (!value.trim()) {
    return 0;
  }

  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").length;
}

export function getConversionCopyContent(activeTab: string, targetCode: string, migrationNotes: string, failed: boolean) {
  if (failed) {
    return "";
  }

  return isConversionCodeTab(activeTab) ? targetCode : migrationNotes;
}

export function canCopyConversionTab(activeTab: string, targetCode: string, migrationNotes: string, failed: boolean) {
  return Boolean(getConversionCopyContent(activeTab, targetCode, migrationNotes, failed).trim());
}

export function ConversionCodePreview({
  code,
  failed = false,
  loading = false
}: {
  code: string;
  failed?: boolean;
  loading?: boolean;
}) {
  if (failed) {
    return null;
  }

  const lineCount = countConversionCodeLines(code);

  if (lineCount === 0) {
    return (
      <div className="lq-conversion-empty" data-testid="conversion-code-empty">
        {loading ? "转换中..." : "暂无目标平台代码。"}
      </div>
    );
  }

  return (
    <>
      <div aria-hidden="true" className="lq-code-lines" data-line-count={lineCount} data-testid="conversion-code-lines">
        {Array.from({ length: lineCount }, (_, index) => <div key={index}>{index + 1}</div>)}
      </div>
      <pre className="lq-conversion-pre is-code" data-testid="conversion-code-preview">
        <code>{code}</code>
      </pre>
    </>
  );
}

export function ConversionNotesPreview({
  loading = false,
  notes
}: {
  loading?: boolean;
  notes: string;
}) {
  if (!notes.trim()) {
    return (
      <div className="lq-conversion-empty" data-testid="conversion-notes-empty">
        {loading ? "转换中..." : "暂无迁移说明。"}
      </div>
    );
  }

  return (
    <div className="lq-conversion-notes-preview" data-testid="conversion-notes-preview">
      {notes}
    </div>
  );
}

export function ConversionFailureState({
  message,
  refundApplied,
  title = "转换未完成"
}: {
  message: string;
  refundApplied?: boolean;
  title?: string;
}) {
  return (
    <div className="lq-conversion-failure-card" data-testid="conversion-failure-state" role="status">
      <span className="lq-conversion-failure-icon">
        <AlertTriangle aria-hidden="true" size={18} />
      </span>
      <div className="lq-conversion-failure-body">
        <strong>{title}</strong>
        <p>{message || getDefaultFailureMessage(Boolean(refundApplied))}</p>
        {refundApplied ? <span className="lq-conversion-refund-badge">积分已退回</span> : null}
      </div>
    </div>
  );
}

function isConversionCodeTab(tab: string) {
  return tab === "目标平台代码" || tab.includes("代码");
}

function isRepairFailed(report: Record<string, unknown> | null) {
  return report?.repairAttempted === true && report?.repairSucceeded === false;
}

function isIntegrityFailed(report: Record<string, unknown> | null) {
  if (!report) {
    return false;
  }

  const integrityStatus = typeof report.integrityStatus === "string" ? report.integrityStatus : "";
  const canContinue = report.canContinue === true;

  // 兼容历史任务：新任务不再由语义质量检查产生 semantic_incomplete，也不再因 pass/return []/缺少业务结构失败。
  if (integrityStatus === "semantic_incomplete") {
    return true;
  }

  if (BLOCKING_INTEGRITY_STATUSES.has(integrityStatus)) {
    return true;
  }

  if (integrityStatus === "physical_truncated") {
    return !canContinue;
  }

  if (!COMPLETE_INTEGRITY_STATUSES.has(integrityStatus)) {
    return report.partial === true || report.truncated === true || report.wasTruncated === true;
  }

  return (report.partial === true || report.truncated === true || report.wasTruncated === true) && !canContinue;
}

function isRefundApplied(report: Record<string, unknown> | null) {
  if (!report) {
    return false;
  }

  const billing = readRecord(report.billing);
  const refund = readRecord(report.refund);

  return report.refundApplied === true || billing?.refundApplied === true || refund?.applied === true;
}

function getDefaultFailureMessage(refundApplied: boolean) {
  return refundApplied
    ? "本次生成没有完成，积分已退回。你可以重新提交或调整输入后再试。"
    : "本次生成没有完成。你可以重新提交或调整输入后再试。";
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
    ? value as Record<string, unknown>
    : null;
}
