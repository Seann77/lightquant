import type { AiTaskType } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";

export type AiTaskConfig = {
  taskType: AiTaskType;
  costPoints: number;
  maxTotalInputChars: number;
  maxSingleCallInputChars: number;
  displayName: string;
  scopeDescription: string;
  outOfScopeResponse: string;
  maxOutputTokens: number;
  maxResultChars: number;
  skillVersion: string;
};

export const AI_TASK_CONFIGS: Record<AiTaskType, AiTaskConfig> = {
  strategy_generation: {
    taskType: "strategy_generation",
    costPoints: 50,
    maxTotalInputChars: 100000,
    maxSingleCallInputChars: 100000,
    displayName: "策略生成/修改",
    scopeDescription: "PTrade、聚宽 JoinQuant、QMT 的量化策略生成、策略修改、指标添加、调仓规则、买卖条件、止盈止损与风控规则。",
    outOfScopeResponse:
      "当前模块仅支持 PTrade、聚宽 JoinQuant、QMT 的量化策略生成与策略修改。请描述交易逻辑、选股条件、调仓规则，或粘贴已有策略代码并说明希望修改什么。",
    maxOutputTokens: 6000,
    maxResultChars: 60000,
    skillVersion: "strategy-generation-v2"
  },
  code_analysis: {
    taskType: "code_analysis",
    costPoints: 100,
    maxTotalInputChars: 150000,
    maxSingleCallInputChars: 40000,
    displayName: "代码翻译/解析",
    scopeDescription: "PTrade、聚宽 JoinQuant、QMT 策略代码的自然语言翻译、结构解析、指标识别、买卖逻辑识别、参数解释、风险点与优化建议。",
    outOfScopeResponse:
      "当前模块仅支持 PTrade、聚宽 JoinQuant、QMT 的量化策略代码翻译与解析。请粘贴策略代码，或补充需要分析的交易逻辑、指标和风控规则。",
    maxOutputTokens: 2200,
    maxResultChars: 24000,
    skillVersion: "code-analysis-v2"
  },
  code_conversion: {
    taskType: "code_conversion",
    costPoints: 200,
    maxTotalInputChars: 150000,
    maxSingleCallInputChars: 30000,
    displayName: "平台代码转换",
    scopeDescription: "PTrade、聚宽 JoinQuant、QMT 之间任意方向的策略代码转换、API 差异说明、迁移说明与兼容性风险提示。",
    outOfScopeResponse:
      "当前模块仅支持 PTrade、聚宽 JoinQuant、QMT 之间的量化策略平台代码转换。请选择源平台和目标平台，并提交需要转换的策略代码。",
    maxOutputTokens: 2600,
    maxResultChars: 30000,
    skillVersion: "code-conversion-v2"
  }
};

export function getAiTaskConfig(type: AiTaskType) {
  return AI_TASK_CONFIGS[type];
}

export function parseAiTaskType(value: string): AiTaskType {
  if (value === "strategy_generation" || value === "code_conversion" || value === "code_analysis") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "type 参数不正确", 400);
}

export function getTotalInputChars(input: {
  sourcePlatform?: string | null;
  targetPlatform?: string | null;
  prompt?: string | null;
  inputCode?: string | null;
}) {
  return [
    input.sourcePlatform,
    input.targetPlatform,
    input.prompt,
    input.inputCode
  ].reduce((total, value) => total + (value?.length ?? 0), 0);
}
