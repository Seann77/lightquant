import type { AiTaskType } from "@/server/domain";
import { codeAnalysisSkill } from "@/server/ai/skills/code-analysis";
import { codeConversionSkill } from "@/server/ai/skills/code-conversion";
import { strategyGenerationSkill } from "@/server/ai/skills/strategy-generation";

export type AiSkill = typeof strategyGenerationSkill | typeof codeAnalysisSkill | typeof codeConversionSkill;

export const AI_SKILLS: Record<AiTaskType, AiSkill> = {
  strategy_generation: strategyGenerationSkill,
  code_analysis: codeAnalysisSkill,
  code_conversion: codeConversionSkill
};

export function getAiSkill(type: AiTaskType) {
  return AI_SKILLS[type];
}
