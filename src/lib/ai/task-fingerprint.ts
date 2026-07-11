import type { UploadedCodeFile } from "@/lib/file-upload";
import type { AiTaskData, WorkbenchTaskType } from "@/lib/ai/workbench-types";

export type AiTaskFingerprintFile = Partial<Pick<
  UploadedCodeFile,
  "fileId" | "originalName" | "sizeBytes" | "sha256" | "contentText" | "contentPreview"
>> & {
  name?: string | null;
  size?: number | null;
};

export type AiTaskFingerprintInput = {
  type: WorkbenchTaskType;
  sourcePlatform?: string | null;
  targetPlatform?: string | null;
  prompt?: string | null;
  messageContent?: string | null;
  inputCode?: string | null;
  inputFile?: AiTaskFingerprintFile | null;
};

export function buildAiTaskFingerprint(input: AiTaskFingerprintInput) {
  return stableStringify({
    type: input.type,
    sourcePlatform: normalizeText(input.sourcePlatform),
    targetPlatform: normalizeText(input.targetPlatform),
    prompt: normalizeText(input.prompt),
    messageContent: normalizeText(input.messageContent),
    inputCodeHash: hashText(normalizeText(input.inputCode)),
    inputFile: normalizeFile(input.inputFile)
  });
}

export function isAiTaskResultPartial(result: AiTaskData["result"] | null | undefined) {
  const report = readRecord(result?.reportJson);

  return report?.partial === true || report?.truncated === true;
}

export function canContinueAiTaskResult(result: AiTaskData["result"] | null | undefined) {
  void result;
  return false;
}

export function isAiTaskDataPartial(data: AiTaskData | null | undefined) {
  return isAiTaskResultPartial(data?.result);
}

export function canContinueAiTaskData(data: AiTaskData | null | undefined) {
  return canContinueAiTaskResult(data?.result);
}

export function isAiTaskDataCompleteSuccess(data: AiTaskData | null | undefined) {
  return Boolean(data?.task.status === "SUCCEEDED" && data.result && !isAiTaskDataPartial(data));
}

function normalizeFile(file: AiTaskFingerprintFile | null | undefined) {
  if (!file) {
    return null;
  }

  const fileId = normalizeText(file.fileId);

  if (fileId) {
    return {
      fileId
    };
  }

  const content = normalizeText(file.contentText) ?? normalizeText(file.contentPreview);

  return {
    name: normalizeText(file.originalName) ?? normalizeText(file.name),
    sizeBytes: normalizeNumber(file.sizeBytes ?? file.size),
    sha256: normalizeText(file.sha256),
    contentHash: hashText(content)
  };
}

function normalizeText(value: string | null | undefined) {
  const normalized = typeof value === "string" ? value.trim() : "";

  return normalized || null;
}

function normalizeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hashText(value: string | null) {
  if (!value) {
    return null;
  }

  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);

  return `{${entries.join(",")}}`;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
    ? value as Record<string, unknown>
    : null;
}
