import { createHash } from "crypto";
import { ApiError } from "@/server/http/api-response";
import { getFileAllowedExtensions, getFileUploadMaxBytes } from "@/server/env";
import { getRepository } from "@/server/repositories";
import { scanCodeSafety } from "@/server/files/code-safety";

export type UploadedFileResponse = {
  fileId: string;
  originalName: string;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  contentPreview: string;
  scanStatus: "PASSED" | "BLOCKED" | "WARNING";
  riskFlags: string[];
  createdAt: string;
};

const CONTENT_PREVIEW_LENGTH = 800;

export async function uploadCodeFileForUser(userId: string, file: File): Promise<UploadedFileResponse> {
  const originalName = normalizeOriginalName(file.name);
  const ext = getExtension(originalName);
  const allowedExtensions = getFileAllowedExtensions();
  const maxBytes = getFileUploadMaxBytes();

  if (!allowedExtensions.includes(ext)) {
    throw new ApiError("UNSUPPORTED_FILE_TYPE", `仅支持 ${allowedExtensions.join(" / ")} 文件`, 400);
  }

  if (file.size > maxBytes) {
    throw new ApiError("FILE_TOO_LARGE", `文件过大，请上传不超过 ${maxBytes} 字节的文件`, 413);
  }

  if (file.size <= 0) {
    throw new ApiError("FILE_EMPTY", "文件内容为空，请重新上传", 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const text = decodeUtf8(bytes);

  if (!text.trim()) {
    throw new ApiError("FILE_EMPTY", "文件内容为空，请重新上传", 400);
  }

  if (text.includes("\u0000")) {
    throw new ApiError("FILE_PARSE_FAILED", "文件包含不可解析字符，请保存为 UTF-8 文本后重试", 400);
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const scan = scanCodeSafety(text);
  const now = new Date().toISOString();
  const uploadedFile = await getRepository().createUploadedFile({
    userId,
    originalName,
    ext,
    mimeType: file.type || "text/plain",
    sizeBytes: bytes.byteLength,
    sha256,
    contentText: text,
    parseStatus: "SUCCEEDED",
    scanStatus: scan.scanStatus,
    riskFlags: scan.riskFlags,
    createdAt: now
  });

  return toUploadedFileResponse(uploadedFile);
}

export function toUploadedFileResponse(file: {
  id: string;
  originalName: string;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  contentText: string;
  scanStatus: "PASSED" | "BLOCKED" | "WARNING";
  riskFlags: string[];
  createdAt: string;
}): UploadedFileResponse {
  return {
    fileId: file.id,
    originalName: file.originalName,
    ext: file.ext,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    sha256: file.sha256,
    contentPreview: createPreview(file.contentText),
    scanStatus: file.scanStatus,
    riskFlags: file.riskFlags,
    createdAt: file.createdAt
  };
}

function decodeUtf8(bytes: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ApiError("FILE_PARSE_FAILED", "文件解析失败，请上传 UTF-8 编码的 .py 或 .txt 文件", 400);
  }
}

function normalizeOriginalName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new ApiError("VALIDATION_ERROR", "文件名不正确", 400);
  }

  return trimmed.slice(0, 255);
}

function getExtension(name: string) {
  const match = /(\.[^./\\]+)$/.exec(name);

  return match ? match[1].toLowerCase() : "";
}

function createPreview(text: string) {
  return text.length > CONTENT_PREVIEW_LENGTH ? `${text.slice(0, CONTENT_PREVIEW_LENGTH)}...` : text;
}
