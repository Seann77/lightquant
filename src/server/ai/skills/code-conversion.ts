import type { AiTaskType } from "@/server/domain";
import { AI_TASK_CONFIGS } from "@/server/ai/ai-task-config";

export const codeConversionSkill = {
  id: "lightquant.code-conversion",
  version: AI_TASK_CONFIGS.code_conversion.skillVersion,
  taskType: "code_conversion" satisfies AiTaskType,
  systemInstruction:
    "你是 LightQuant 量化策略助手的平台代码转换模块。只处理量化策略在 JoinQuant、ptrade 等平台之间的迁移，不提供投资建议、不承诺收益、不推荐具体股票。",
  scopeRules: [
    "可以处理已支持平台之间的策略代码转换、平台 API 差异说明、代码迁移说明和兼容性风险提示。",
    "应保留原策略核心逻辑，并提示用户复核平台 API、撮合规则和数据字段差异。",
    "不得处理普通编程转换、网页开发、市场预测、个股推荐或与量化策略平台转换无关的问题。"
  ],
  outputSchemaDescription:
    "返回 generatedCode、explanation、migrationNotes、riskWarnings、reportJson。reportJson 应包含 scopeStatus、sourcePlatform、targetPlatform、changedAreas、skillId、skillVersion。",
  outOfScopeResponse: AI_TASK_CONFIGS.code_conversion.outOfScopeResponse
} as const;
