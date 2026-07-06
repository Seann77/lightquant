import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/server/admin/admin-auth";
import type { WechatGroupQrCode } from "@/server/domain";
import { getAdminAssetStorageRoot, getWechatGroupQrUploadMaxBytes, isAdminWriteEnabled } from "@/server/env";
import { ApiError } from "@/server/http/api-response";
import { getRepository, withRepositoryTransaction } from "@/server/repositories";

const WECHAT_GROUP_STORAGE_PREFIX = "wechat-group";
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export type PublicWechatGroupQrMetadata = {
  configured: boolean;
  imageUrl: string | null;
  updatedAt: string | null;
};

export type AdminWechatGroupQrResponse = {
  current: AdminWechatGroupQrItem | null;
  history: AdminWechatGroupQrItem[];
  writeEnabled: boolean;
};

export type AdminWechatGroupQrItem = {
  id: string;
  imageUrl: string;
  imageMimeType: string;
  imageSizeBytes: number;
  imageSha256Prefix: string;
  expiresAt: string;
  expired: boolean;
  status: WechatGroupQrCode["status"];
  uploadedByAdminPhone: string;
  createdAt: string;
  activatedAt: string;
};

export type StoredWechatGroupQrImage = {
  bytes: Buffer;
  mimeType: string;
  sizeBytes: number;
};

export async function getPublicWechatGroupQrMetadata(): Promise<PublicWechatGroupQrMetadata> {
  const active = await getRepository().getActiveWechatGroupQrCode();

  if (!active) {
    return {
      configured: false,
      imageUrl: null,
      updatedAt: null
    };
  }

  return {
    configured: true,
    imageUrl: getPublicImageUrl(active.id),
    updatedAt: active.activatedAt
  };
}

export async function getPublicWechatGroupQrImage(id: string): Promise<StoredWechatGroupQrImage> {
  const qrCode = await getRepository().findWechatGroupQrCodeById(normalizeId(id));

  if (!qrCode) {
    throw new ApiError("NOT_FOUND", "微信群二维码不存在", 404);
  }

  const absolutePath = resolveAdminAssetStorageKey(qrCode.storageKey);
  const bytes = await readFile(absolutePath);

  return {
    bytes,
    mimeType: qrCode.imageMimeType,
    sizeBytes: bytes.byteLength
  };
}

export async function getAdminWechatGroupQrCodes(): Promise<AdminWechatGroupQrResponse> {
  await requireAdmin();

  const repository = getRepository();
  const [current, history] = await Promise.all([
    repository.getActiveWechatGroupQrCode(),
    repository.listAdminWechatGroupQrCodes(20)
  ]);

  return {
    current: current ? toAdminWechatGroupQrItem(current) : null,
    history: history.map(toAdminWechatGroupQrItem),
    writeEnabled: isAdminWriteEnabled()
  };
}

export async function uploadAdminWechatGroupQrCode(input: {
  file: File;
  expiresAt: string;
  requestId: string;
  requestIp: string | null;
}) {
  const admin = await requireAdmin();

  if (!isAdminWriteEnabled()) {
    throw new ApiError("FORBIDDEN", "后台写操作未开启，无法上传新的微信群二维码", 403);
  }

  const expiresAt = normalizeExpiresAt(input.expiresAt);
  const prepared = await prepareWechatGroupQrFile(input.file);
  const id = randomUUID();
  const storageKey = `${WECHAT_GROUP_STORAGE_PREFIX}/wechat-group-${id}${prepared.ext}`;
  const absolutePath = resolveAdminAssetStorageKey(storageKey);
  const now = new Date().toISOString();

  await mkdir(path.dirname(absolutePath), {
    recursive: true
  });
  await writeFile(absolutePath, prepared.bytes);

  try {
    const qrCode = await withRepositoryTransaction(async () => {
      const repository = getRepository();
      const created = await repository.createAndActivateWechatGroupQrCode({
        id,
        storageKey,
        imageMimeType: prepared.mimeType,
        imageSizeBytes: prepared.sizeBytes,
        imageSha256: prepared.sha256,
        expiresAt,
        uploadedByAdminUserId: admin.user.id,
        uploadedByAdminPhone: admin.user.phone,
        createdAt: now,
        activatedAt: now
      });

      await repository.createAdminAuditLog({
        adminUserId: admin.user.id,
        adminPhone: admin.user.phone,
        action: "wechat_group_qr.upload",
        targetType: "wechat_group_qr_code",
        targetId: created.id,
        summary: "上传并激活新的微信群二维码",
        metadata: {
          imageSizeBytes: prepared.sizeBytes,
          imageMimeType: prepared.mimeType,
          imageSha256Prefix: prepared.sha256.slice(0, 12),
          expiresAt
        },
        requestId: input.requestId,
        requestIp: input.requestIp,
        createdAt: now
      });

      return created;
    });

    return {
      qrCode: toAdminWechatGroupQrItem(qrCode)
    };
  } catch (error) {
    await rm(absolutePath, {
      force: true
    });
    throw error;
  }
}

async function prepareWechatGroupQrFile(file: File) {
  const originalName = normalizeOriginalName(file.name);
  const ext = path.extname(originalName).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ApiError("UNSUPPORTED_FILE_TYPE", "请上传 PNG、JPG、JPEG 或 WebP 图片", 400);
  }

  if (!file.type || !ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ApiError("UNSUPPORTED_FILE_TYPE", "文件 MIME 类型不支持，请上传 PNG、JPG 或 WebP 图片", 400);
  }

  if (file.size <= 0) {
    throw new ApiError("FILE_EMPTY", "二维码图片不能为空", 400);
  }

  const maxBytes = getWechatGroupQrUploadMaxBytes();

  if (file.size > maxBytes) {
    throw new ApiError("FILE_TOO_LARGE", `二维码图片过大，请上传不超过 ${maxBytes} 字节的图片`, 413);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = detectImageType(bytes);

  if (!detected) {
    throw new ApiError("FILE_PARSE_FAILED", "图片格式无法识别，请重新导出二维码后上传", 400);
  }

  if (detected.mimeType !== file.type) {
    throw new ApiError("FILE_PARSE_FAILED", "图片内容格式与 MIME 类型不一致，请重新导出后上传", 400);
  }

  if (!isExtensionCompatible(ext, detected.ext)) {
    throw new ApiError("FILE_PARSE_FAILED", "图片扩展名与实际格式不一致，请重新导出后上传", 400);
  }

  return {
    bytes,
    ext: detected.ext,
    mimeType: detected.mimeType,
    sizeBytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex")
  };
}

function normalizeExpiresAt(value: string) {
  const raw = value.trim();

  if (!raw) {
    throw new ApiError("VALIDATION_ERROR", "请设置二维码到期时间", 400);
  }

  const normalized = raw.includes("T") ? raw : `${raw}T23:59:59`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError("VALIDATION_ERROR", "二维码到期时间不正确", 400);
  }

  return parsed.toISOString();
}

function normalizeOriginalName(name: string) {
  const normalized = path.basename(name || "wechat-group.png");

  if (normalized.includes("\0")) {
    throw new ApiError("VALIDATION_ERROR", "文件名不正确", 400);
  }

  return normalized;
}

function normalizeId(value: string) {
  const id = value.trim();

  if (!/^[0-9a-fA-F-]{16,64}$/.test(id)) {
    throw new ApiError("NOT_FOUND", "微信群二维码不存在", 404);
  }

  return id;
}

function resolveAdminAssetStorageKey(storageKey: string) {
  if (!storageKey || path.isAbsolute(storageKey) || storageKey.includes("\0")) {
    throw new ApiError("NOT_FOUND", "二维码图片不存在", 404);
  }

  const root = path.resolve(process.cwd(), getAdminAssetStorageRoot());
  const absolutePath = path.resolve(root, storageKey);
  const relative = path.relative(root, absolutePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ApiError("NOT_FOUND", "二维码图片不存在", 404);
  }

  return absolutePath;
}

function detectImageType(bytes: Buffer) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return {
      mimeType: "image/png",
      ext: ".png"
    };
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return {
      mimeType: "image/jpeg",
      ext: ".jpg"
    };
  }

  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return {
      mimeType: "image/webp",
      ext: ".webp"
    };
  }

  return null;
}

function isExtensionCompatible(uploadedExt: string, detectedExt: string) {
  if (detectedExt === ".jpg") {
    return uploadedExt === ".jpg" || uploadedExt === ".jpeg";
  }

  return uploadedExt === detectedExt;
}

function toAdminWechatGroupQrItem(qrCode: WechatGroupQrCode): AdminWechatGroupQrItem {
  return {
    id: qrCode.id,
    imageUrl: getPublicImageUrl(qrCode.id),
    imageMimeType: qrCode.imageMimeType,
    imageSizeBytes: qrCode.imageSizeBytes,
    imageSha256Prefix: qrCode.imageSha256.slice(0, 12),
    expiresAt: qrCode.expiresAt,
    expired: new Date(qrCode.expiresAt).getTime() < Date.now(),
    status: qrCode.status,
    uploadedByAdminPhone: qrCode.uploadedByAdminPhone,
    createdAt: qrCode.createdAt,
    activatedAt: qrCode.activatedAt
  };
}

function getPublicImageUrl(id: string) {
  return `/api/v1/public/wechat-group-qr/image/${encodeURIComponent(id)}`;
}
