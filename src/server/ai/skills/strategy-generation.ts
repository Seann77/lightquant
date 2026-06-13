import type { AiTaskType } from "@/server/domain";
import { AI_TASK_CONFIGS } from "@/server/ai/ai-task-config";
import { loadSkillContent } from "@/server/ai/skills/skill-content";

const content = loadSkillContent("strategy-generation.md");

export const strategyGenerationSkill = {
  id: "lightquant.strategy-generation",
  version: AI_TASK_CONFIGS.strategy_generation.skillVersion,
  taskType: "strategy_generation" satisfies AiTaskType,
  ...content
} as const;
