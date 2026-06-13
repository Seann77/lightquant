import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { ApiError } from "@/server/http/api-response";
import { getFileAllowedExtensions, getFileStorageRoot, getFileUploadMaxBytes, getImageUploadMaxBytes } from "@/server/env";
import { getRepository } from "@/server/repositories";
import { scanCodeSafety } from "@/server/files/code-safety";
import type { UploadedFile, UploadedFileKind, UploadedFileScanStatus } from "@/server/domain";

export type UploadedFileResponse = {
  fileId: string;
  kind: UploadedFileKind;
  originalName: string;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  contentPreview: string;
  scanStatus: UploadedFileScanStatus;
  riskFlags: string[];
  hasThumbnail: boolean;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  createdAt: string;
};

export type StoredFilePayload = {
  bytes: Buffer;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  sha256: string;
};

const CONTENT_PREVIEW_LENGTH = 800;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export async function uploadCodeFileForUser(userId: string, file: File): Promise<UploadedFileResponse> {
  const originalName = normalizeOriginalName(file.name);
  const ext = getExtension(originalName);
  const allowedExtensions = getFileAllowedExtensions();

  if (!allowedExtensions.includes(ext)) {
    throw new ApiError("UNSUPPORTED_FILE_TYPE", `仅支持 ${allowedExtensions.join(" / ")} 文件`, 400);
  }

  if (file.size <= 0) {
    throw new ApiError("FILE_EMPTY", "文件内容为空，请重新上传", 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  return isImageExtension(ext)
    ? uploadImageFileForUser(userId, file, originalName, ext, bytes)
    : uploadTextFileForUser(userId, file, originalName, ext, bytes);
}

export async function getStoredImageForUser(userId: string, fileId: string, preferThumbnail: boolean): Promise<StoredFilePayload> {
  const file = await getRepository().findUploadedFileById(fileId);

  if (!file) {
    throw new ApiError("NOT_FOUND", "文件不存在", 404);
  }

  if (file.userId !== userId) {
    throw new ApiError("FORBIDDEN", "无权访问该文件", 403);
  }

  if (inferUploadedFileKind(file) !== "image") {
    throw new ApiError("UNSUPPORTED_FILE_TYPE", "该文件不是图片附件", 400);
  }

  const storageKey = preferThumbnail ? file.thumbnailKey ?? file.storageKey : file.storageKey ?? file.thumbnailKey;

  if (!storageKey) {
    throw new ApiError("NOT_FOUND", "图片预览不存在", 404);
  }

  const bytes = await readFile(resolveStorageKey(storageKey));

  return {
    bytes,
    mimeType: file.mimeType,
    originalName: file.originalName,
    sizeBytes: file.sizeBytes,
    sha256: file.sha256
  };
}

export async function getUploadedImageDataUrl(file: UploadedFile): Promise<string | null> {
  if (inferUploadedFileKind(file) !== "image" || !file.storageKey) {
    return null;
  }

  const bytes = await readFile(resolveStorageKey(file.storageKey));

  return `data:${file.mimeType};base64,${bytes.toString("base64")}`;
}

export function toUploadedFileResponse(file: UploadedFile): UploadedFileResponse {
  const kind = inferUploadedFileKind(file);
  const isImage = kind === "image";

  return {
    fileId: file.id,
    kind,
    originalName: file.originalName,
    ext: file.ext,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    sha256: file.sha256,
    contentPreview: createPreview(file),
    scanStatus: file.scanStatus,
    riskFlags: file.riskFlags,
    hasThumbnail: isImage && Boolean(file.thumbnailKey ?? file.storageKey),
    thumbnailUrl: isImage ? `/api/v1/files/${encodeURIComponent(file.id)}/thumbnail` : null,
    previewUrl: isImage ? `/api/v1/files/${encodeURIComponent(file.id)}/preview` : null,
    createdAt: file.createdAt
  };
}

export function inferUploadedFileKind(file: Pick<UploadedFile, "kind" | "ext" | "mimeType">): UploadedFileKind {
  if (file.kind) {
    return file.kind;
  }

  const ext = file.ext.toLowerCase();
  const mimeType = file.mimeType.toLowerCase();

  if (mimeType.startsWith("image/") || isImageExtension(ext)) {
    return "image";
  }

  if (ext === ".py") {
    return "code";
  }

  if (ext === ".log") {
    return "log";
  }

  if (ext === ".md") {
    return "markdown";
  }

  return "text";
}

async function uploadTextFileForUser(userId: string, file: File, originalName: string, ext: string, bytes: Buffer) {
  const maxBytes = getFileUploadMaxBytes();

  if (file.size > maxBytes) {
    throw new ApiError("FILE_TOO_LARGE", `文件过大，请上传不超过 ${maxBytes} 字节的文件`, 413);
  }

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
    kind: inferKindFromExtension(ext),
    ext,
    mimeType: file.type || "text/plain",
    sizeBytes: bytes.byteLength,
    sha256,
    storageKey: null,
    thumbnailKey: null,
    contentText: text,
    contentJson: null,
    parseStatus: "SUCCEEDED",
    scanStatus: scan.scanStatus,
    riskFlags: scan.riskFlags,
    createdAt: now,
    updatedAt: now
  });

  return toUploadedFileResponse(uploadedFile);
}

async function uploadImageFileForUser(userId: string, file: File, originalName: string, ext: string, bytes: Buffer) {
  const maxBytes = getImageUploadMaxBytes();

  if (file.size > maxBytes) {
    throw new ApiError("FILE_TOO_LARGE", `图片过大，请上传不超过 ${maxBytes} 字节的图片`, 413);
  }

  const detected = detectImageType(bytes);

  if (!detected) {
    throw new ApiError("FILE_PARSE_FAILED", "图片格式无法识别，请上传 PNG、JPG、JPEG 或 WebP 图片", 400);
  }

  if (!isCompatibleImageExtension(ext, detected.ext)) {
    throw new ApiError("FILE_PARSE_FAILED", "图片扩展名与实际格式不一致，请重新导出后上传", 400);
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const now = new Date().toISOString();
  const storageKey = buildStorageKey(userId, detected.ext);
  const absolutePath = resolveStorageKey(storageKey);

  await mkdir(path.dirname(absolutePath), {
    recursive: true
  });
  await writeFile(absolutePath, bytes);

  try {
    const uploadedFile = await getRepository().createUploadedFile({
      userId,
      originalName,
      kind: "image",
      ext,
      mimeType: detected.mimeType,
      sizeBytes: bytes.byteLength,
      sha256,
      storageKey,
      thumbnailKey: storageKey,
      contentText: null,
      contentJson: {
        detectedMimeType: detected.mimeType,
        storage: "local-private"
      },
      parseStatus: "SUCCEEDED",
      scanStatus: "PASSED",
      riskFlags: [],
      createdAt: now,
      updatedAt: now
    });

    return toUploadedFileResponse(uploadedFile);
  } catch (error) {
    await rm(absolutePath, {
      force: true
    });
    throw error;
  }
}

function decodeUtf8(bytes: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ApiError("FILE_PARSE_FAILED", "文件解析失败，请上传 UTF-8 编码的 .py、.txt、.log 或 .md 文件", 400);
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

function createPreview(file: UploadedFile) {
  if (file.contentText) {
    return file.contentText.length > CONTENT_PREVIEW_LENGTH ? `${file.contentText.slice(0, CONTENT_PREVIEW_LENGTH)}...` : file.contentText;
  }

  if (inferUploadedFileKind(file) === "image") {
    return `图片附件：${file.originalName}`;
  }

  return "";
}

function inferKindFromExtension(ext: string): UploadedFileKind {
  if (ext === ".py") {
    return "code";
  }

  if (ext === ".log") {
    return "log";
  }

  if (ext === ".md") {
    return "markdown";
  }

  return "text";
}

function detectImageType(bytes: Buffer) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return {
      ext: ".png",
      mimeType: "image/png"
    };
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return {
      ext: ".jpg",
      mimeType: "image/jpeg"
    };
  }

  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return {
      ext: ".webp",
      mimeType: "image/webp"
    };
  }

  return null;
}

function isCompatibleImageExtension(uploadedExt: string, detectedExt: string) {
  if (detectedExt === ".jpg") {
    return uploadedExt === ".jpg" || uploadedExt === ".jpeg";
  }

  return uploadedExt === detectedExt;
}

function isImageExtension(ext: string) {
  return IMAGE_EXTENSIONS.has(ext);
}

function buildStorageKey(userId: string, ext: string) {
  return `images/${userId}/${randomUUID()}${ext}`;
}

function resolveStorageKey(storageKey: string) {
  const root = path.resolve(getFileStorageRoot());
  const target = path.resolve(root, ...storageKey.split("/"));
  const relative = path.relative(root, target);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ApiError("VALIDATION_ERROR", "文件路径不正确", 400);
  }

  return target;
}
