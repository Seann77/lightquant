import type { AiTask, AiTaskResult } from "@/server/domain";
import type { AiTaskConfig } from "@/server/ai/ai-task-config";
import type { AiSkill } from "@/server/ai/skills";

export type AiProviderResult = Omit<AiTaskResult, "taskId" | "resultType" | "createdAt">;

export type AiProviderInput = {
  task: AiTask;
  skill: AiSkill;
  config: AiTaskConfig;
};
