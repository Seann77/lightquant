import type { AiTaskType } from "@/server/domain";
import { AI_TASK_CONFIGS } from "@/server/ai/ai-task-config";
import { loadSkillContent } from "@/server/ai/skills/skill-content";

const content = loadSkillContent("code-conversion.md");

export const codeConversionSkill = {
  id: "lightquant.code-conversion",
  version: AI_TASK_CONFIGS.code_conversion.skillVersion,
  taskType: "code_conversion" satisfies AiTaskType,
  ...content
} as const;
