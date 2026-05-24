import type { AiTaskType } from "@/server/domain";

export const AI_TASK_PRICES: Record<AiTaskType, number> = {
  strategy_generation: 10,
  code_conversion: 5,
  code_analysis: 5
};

export function getAiTaskCost(type: AiTaskType) {
  return AI_TASK_PRICES[type];
}

