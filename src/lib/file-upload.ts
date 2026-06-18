import { getFileExtension, getFileUploadRule, isImageUploadExtension, type FileUploadPurpose } from "@/lib/file-upload-rules";

type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: { code: string; message: string }; requestId: string };

export type UploadedCodeFile = {
  fileId: string;
  kind?: "code" | "text" | "log" | "markdown" | "image";
  originalName: string;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  contentPreview: string;
  contentText?: string | null;
  scanStatus: "PASSED" | "BLOCKED" | "WARNING";
  riskFlags: string[];
  hasThumbnail?: boolean;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  createdAt: string;
};

export async function uploadCodeFile(file: File, purpose: FileUploadPurpose) {
  validateUploadFile(file, purpose);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);

  const response = await fetch("/api/v1/files", {
    method: "POST",
    body: formData
  });
  const payload = (await response.json()) as ApiResponse<UploadedCodeFile>;

  if (!payload.success) {
    throw new Error(`${payload.error.code}:${payload.error.message}`);
  }

  return payload.data;
}

export function getUploadAccept(purpose: FileUploadPurpose) {
  return getFileUploadRule(purpose).accept;
}

export function getUploadButtonLabel(purpose: FileUploadPurpose) {
  return getFileUploadRule(purpose).buttonLabel;
}

function validateUploadFile(file: File, purpose: FileUploadPurpose) {
  const rule = getFileUploadRule(purpose);
  const ext = getFileExtension(file.name);

  if (!rule.allowedExtensions.includes(ext)) {
    throw new Error(`UNSUPPORTED_FILE_TYPE:${rule.description}`);
  }

  if (file.type && !isMimeCompatibleWithExtension(file.type, ext)) {
    throw new Error(`UNSUPPORTED_FILE_TYPE:${rule.description}`);
  }
}

function isMimeCompatibleWithExtension(mimeType: string, ext: string) {
  const normalizedMime = mimeType.toLowerCase();

  if (isImageUploadExtension(ext)) {
    return normalizedMime === "image/png" || normalizedMime === "image/jpeg";
  }

  if (normalizedMime.startsWith("image/")) {
    return false;
  }

  return normalizedMime.startsWith("text/")
    || normalizedMime === "application/octet-stream"
    || normalizedMime === "application/x-python-code";
}

export function getFileUploadFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "文件上传失败";

  if (message.startsWith("UNAUTHORIZED:")) {
    return "请先登录后再上传文件。";
  }

  return message.includes(":") ? message.split(":").slice(1).join(":") : message;
}

export function getScanStatusText(file: UploadedCodeFile) {
  if (file.scanStatus === "BLOCKED") {
    return "已阻断，请脱敏后重新上传";
  }

  if (file.scanStatus === "WARNING") {
    return "发现风险提醒，可继续提交";
  }

  return "校验通过";
}
