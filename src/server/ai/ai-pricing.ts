import type { AiTaskType } from "@/server/domain";
import { AI_TASK_CONFIGS } from "@/server/ai/ai-task-config";

export const AI_TASK_PRICES: Record<AiTaskType, number> = {
  strategy_generation: AI_TASK_CONFIGS.strategy_generation.costPoints,
  code_conversion: AI_TASK_CONFIGS.code_conversion.costPoints,
  code_analysis: AI_TASK_CONFIGS.code_analysis.costPoints
};

export function getAiTaskCost(type: AiTaskType) {
  return AI_TASK_PRICES[type];
}
