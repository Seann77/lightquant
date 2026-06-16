"use client";

import { AlertTriangle, Ban, CheckCircle2, ImageIcon, Paperclip, type LucideIcon } from "lucide-react";
import { getScanStatusText, type UploadedCodeFile } from "@/lib/file-upload";
import {
  formatFileSize,
  getAttachmentScanText,
  isImageFile
} from "@/lib/ai/workbench-client";
import type { MessageAttachmentData } from "@/lib/ai/workbench-types";

export function WorkbenchFileUploadStatus({
  className = "",
  file,
  message
}: {
  className?: string;
  file: UploadedCodeFile | null;
  message: string;
}) {
  if (!file && !message) {
    return null;
  }

  if (message) {
    return <div className={`lq-file-status is-error ${className}`.trim()}>{message}</div>;
  }

  if (!file) {
    return null;
  }

  const blocked = file.scanStatus === "BLOCKED";
  const isImage = isImageFile(file);
  const StatusIcon: LucideIcon = blocked ? Ban : file.scanStatus === "WARNING" ? AlertTriangle : isImage ? ImageIcon : CheckCircle2;
  return (
    <div className={`lq-file-status ${blocked ? "is-blocked" : ""} ${className}`.trim()}>
      {isImage && file.thumbnailUrl ? (
        <img alt={file.originalName} className="mb-2 h-20 w-full max-w-[220px] rounded-[8px] border border-[#e5e7eb] object-cover" src={file.thumbnailUrl} />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <StatusIcon aria-hidden="true" size={16} />
        <span>{file.originalName}</span>
        <span>{formatFileSize(file.sizeBytes)}</span>
        <span>{getScanStatusText(file)}</span>
      </div>
      {file.riskFlags.length > 0 ? <div className="mt-1 break-words">风险标记：{file.riskFlags.join("、")}</div> : null}
    </div>
  );
}

export function MessageAttachmentList({ align = "left", attachments }: { align?: "left" | "right"; attachments: MessageAttachmentData[] }) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={`mt-2 grid gap-2 ${align === "right" ? "justify-items-end" : ""}`}>
      {attachments.map((attachment) => (
        <AttachmentPreviewCard attachment={attachment} key={attachment.id} />
      ))}
    </div>
  );
}

export function AttachmentPreviewCard({ attachment }: { attachment: MessageAttachmentData }) {
  const file = attachment.file;
  const kind = attachment.kind ?? file.kind ?? (file.mimeType.startsWith("image/") ? "image" : null);
  const thumbnailUrl = attachment.thumbnailUrl ?? file.thumbnailUrl ?? null;
  const blocked = file.scanStatus === "BLOCKED";
  const StatusIcon: LucideIcon = blocked ? Ban : file.scanStatus === "WARNING" ? AlertTriangle : kind === "image" ? ImageIcon : Paperclip;

  return (
    <div className={`lq-file-status max-w-[360px] ${blocked ? "is-blocked" : ""}`}>
      {kind === "image" && thumbnailUrl ? (
        <img alt={file.originalName} className="mb-2 h-24 w-full rounded-[8px] border border-[#e5e7eb] object-cover" src={thumbnailUrl} />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <StatusIcon aria-hidden="true" size={16} />
        <span>{file.originalName}</span>
        <span>{formatFileSize(file.sizeBytes)}</span>
        <span>{getAttachmentScanText(attachment)}</span>
      </div>
      {file.riskFlags.length > 0 ? <div className="mt-1 break-words">风险标记：{file.riskFlags.join("、")}</div> : null}
    </div>
  );
}
