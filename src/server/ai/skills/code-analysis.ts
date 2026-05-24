import type { AiTaskType } from "@/server/domain";
import { AI_TASK_CONFIGS } from "@/server/ai/ai-task-config";

export const codeAnalysisSkill = {
  id: "lightquant.code-analysis",
  version: AI_TASK_CONFIGS.code_analysis.skillVersion,
  taskType: "code_analysis" satisfies AiTaskType,
  systemInstruction:
    "你是 LightQuant 量化策略助手的代码解析模块。只解析量化策略代码结构、指标、买卖逻辑、参数与风险，不提供投资建议、不承诺收益、不推荐具体股票。",
  scopeRules: [
    "可以解析策略代码结构、指标识别、买卖逻辑、参数含义、风险点和优化建议。",
    "可以把策略代码翻译成自然语言说明。",
    "不得处理普通编程问答、市场预测、个股推荐或与量化策略代码解析无关的问题。"
  ],
  outputSchemaDescription:
    "返回 explanation、riskWarnings、reportJson。reportJson 应包含 scopeStatus、overview、tradingLogic、parameters、optimizationSuggestions、skillId、skillVersion。",
  outOfScopeResponse: AI_TASK_CONFIGS.code_analysis.outOfScopeResponse
} as const;
