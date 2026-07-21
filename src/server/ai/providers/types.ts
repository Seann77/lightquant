import type { AiTask, AiTaskResult } from "@/server/domain";
import type { AiTaskConfig } from "@/server/ai/ai-task-config";
import type { AiSkill } from "@/server/ai/skills";
import type { AiTaskProgressUpdate } from "@/server/ai/ai-task-progress";
import type { ApiDocumentContext } from "@/server/ai/api-document-retrieval";

export type AiProviderResult = Omit<AiTaskResult, "taskId" | "resultType" | "createdAt">;

export type AiProviderStreamDelta = {
  type: "thinking_delta" | "final_delta";
  delta: string;
};

export type AiProviderStreamCallbacks = {
  onDelta?: (delta: AiProviderStreamDelta) => void | Promise<void>;
};

export type AiProviderStreamResult = {
  result: AiProviderResult;
  visibleThinking: string;
  finalAnswerMarkdown: string;
};

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
  apiDocumentContext: ApiDocumentContext;
  progressReporter?: (update: AiTaskProgressUpdate) => void | Promise<void>;
};
