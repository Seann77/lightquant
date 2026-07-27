export type FileUploadPurpose = "strategy_generation" | "code_conversion" | "code_analysis";

type FileUploadRule = {
  accept: string;
  allowedExtensions: readonly string[];
  buttonLabel: string;
  description: string;
};

const IMAGE_EXTENSIONS = [".png", ".jpg"] as const;
const TEXT_UPLOAD_MIME_TYPES = new Set([
  "text/plain",
  "text/x-python",
  "application/x-python-code",
  "application/x-python",
  "application/octet-stream"
]);

const FILE_UPLOAD_RULES: Record<FileUploadPurpose, FileUploadRule> = {
  strategy_generation: {
    accept: ".py,.txt,.log,.png,.jpg",
    allowedExtensions: [".py", ".txt", ".log", ...IMAGE_EXTENSIONS],
    buttonLabel: "上传 .py / .txt / .log / .png / .jpg",
    description: "仅支持上传 .py / .txt / .log / .png / .jpg 文件"
  },
  code_conversion: {
    accept: ".py,.txt",
    allowedExtensions: [".py", ".txt"],
    buttonLabel: "上传 .py / .txt",
    description: "仅支持上传 .py / .txt 文件"
  },
  code_analysis: {
    accept: ".py,.txt",
    allowedExtensions: [".py", ".txt"],
    buttonLabel: "上传 .py / .txt",
    description: "仅支持上传 .py / .txt 文件"
  }
};

export function getFileUploadRule(purpose: FileUploadPurpose) {
  return FILE_UPLOAD_RULES[purpose];
}

export function parseFileUploadPurpose(value: unknown): FileUploadPurpose | null {
  return value === "strategy_generation" || value === "code_conversion" || value === "code_analysis" ? value : null;
}

export function getFileExtension(name: string) {
  const match = /(\.[^./\\]+)$/.exec(name.trim());

  return match ? match[1].toLowerCase() : "";
}

export function isImageUploadExtension(ext: string) {
  return IMAGE_EXTENSIONS.includes(ext.toLowerCase() as (typeof IMAGE_EXTENSIONS)[number]);
}

export function isFileExtensionAllowedForPurpose(ext: string, purpose: FileUploadPurpose) {
  return FILE_UPLOAD_RULES[purpose].allowedExtensions.includes(ext.toLowerCase());
}

export function isMimeCompatibleWithUploadExtension(mimeType: string, ext: string) {
  const normalizedMime = mimeType.trim().toLowerCase().split(";", 1)[0] ?? "";
  const normalizedExt = ext.toLowerCase();

  if (!normalizedMime) {
    return true;
  }

  if (isImageUploadExtension(normalizedExt)) {
    return normalizedMime === "image/png" || normalizedMime === "image/jpeg";
  }

  if (normalizedMime.startsWith("image/")) {
    return false;
  }

  return normalizedMime.startsWith("text/") || TEXT_UPLOAD_MIME_TYPES.has(normalizedMime);
}
