import type { AiTaskType } from "@/server/domain";
import { AI_TASK_CONFIGS } from "@/server/ai/ai-task-config";
import { loadSkillContent } from "@/server/ai/skills/skill-content";

const content = loadSkillContent("code-analysis.md");

export const codeAnalysisSkill = {
  id: "lightquant.code-analysis",
  version: AI_TASK_CONFIGS.code_analysis.skillVersion,
  taskType: "code_analysis" satisfies AiTaskType,
  ...content
} as const;
