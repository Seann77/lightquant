import type { AiTask, AiTaskResult } from "@/server/domain";
import type { AiTaskConfig } from "@/server/ai/ai-task-config";
import type { AiSkill } from "@/server/ai/skills";
import type { AiTaskProgressUpdate } from "@/server/ai/ai-task-progress";

export type AiProviderResult = Omit<AiTaskResult, "taskId" | "resultType" | "createdAt">;

export type AiProviderAttachment = {
  fileId: string;
  kind: "image";
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
};

export type AiProviderInput = {
  task: AiTask;
  skill: AiSkill;
  config: AiTaskConfig;
  conversationContext?: string;
  attachments?: AiProviderAttachment[];
  progressReporter?: (update: AiTaskProgressUpdate) => void | Promise<void>;
};
