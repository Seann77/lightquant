import { createHash } from "node:crypto";
import type { AiTask, AiTaskResult } from "@/server/domain";
import { normalizeCompleteStrategyCode } from "@/lib/ai/strategy-result-format";
import type { LightQuantRepository } from "@/server/repositories/types";

export type ConversationStrategyCodeSource =
  | "current_input"
  | "generated_code"
  | "historical_input";

export type ConversationStrategyCodeArtifact = {
  version: 1;
  code: string;
  source: ConversationStrategyCodeSource;
  taskId: string | null;
  conversationId: string | null;
  platform: string | null;
  contentSha256: string;
  codeLineCount: number;
  createdAt: string | null;
};

type StrategyCodeCandidateTask = Pick<
  AiTask,
  | "id"
  | "userId"
  | "conversationId"
  | "type"
  | "status"
  | "sourcePlatform"
  | "targetPlatform"
  | "inputCode"
  | "createdAt"
>;

const CONTEXTUAL_MODIFICATION_PATTERN =
  /(?:请|帮我|继续|再)?(?:修改|调整|改成|改为|改到|替换|新增|增加|加入|添加|加上|加个|加一个|再加|删除|移除|修复|恢复|改一下|改下)|(?:基于|按照|沿用)[\s\S]{0,100}(?:修改|调整|改|替换|新增|增加|加入|添加|加上|删除|移除|修复|恢复)|(?:把|将)[\s\S]{0,120}(?:改成|改为|改到|调整为|替换为|增加|加入|添加|加上|删除|移除|恢复)|(?:买入|卖出|止损|止盈|调仓|选股|仓位|持仓|下单|交易)[\s\S]{0,80}(?:时间|条件|规则|参数|比例|数量|阈值)[\s\S]{0,40}(?:从|由)[\s\S]{0,40}(?:到|改)|(?:止损|止盈|仓位|持仓|参数|阈值|比例)[\s\S]{0,50}(?:从|由)[\s\S]{0,40}(?:到|改为)/i;
const STRATEGY_MODIFICATION_SIGNAL_PATTERN =
  /策略|代码|函数|回调|日志|买入|卖出|止损|止盈|调仓|选股|仓位|持仓|下单|交易|时间|参数|阈值|比例|周期|PTrade|JoinQuant|聚宽|QMT/i;
const PARTIAL_OUTPUT_PATTERN =
  /只(?:给|输出|展示|返回|需要)(?:修改|改动|变更|相关|必要)?(?:处|部分|片段|代码片段)|(?:无需|不用|不要)(?:输出|给出)?完整(?:代码|策略)|(?:diff|patch|补丁|差异)(?:格式|输出)?/i;
const COMBINED_CALLBACK_TIME_CHANGE_PATTERN =
  /(?:买入|补仓|开仓)[\s\S]{0,100}(?:时间|时点|时刻|分钟|点)[\s\S]{0,100}(?:改成|改为|改到|调整为|从|由)|(?:把|将)[\s\S]{0,100}(?:买入|补仓|开仓)[\s\S]{0,100}(?:改成|改为|改到|调整为)/i;

export function isContextualStrategyModificationRequest(input: {
  type: AiTask["type"];
  prompt?: string | null;
}) {
  if (input.type !== "strategy_generation") {
    return false;
  }

  const prompt = input.prompt?.trim() ?? "";

  return Boolean(
    prompt &&
    CONTEXTUAL_MODIFICATION_PATTERN.test(prompt) &&
    STRATEGY_MODIFICATION_SIGNAL_PATTERN.test(prompt)
  );
}

export function shouldResolveConversationStrategyCodeReference(input: {
  type: AiTask["type"];
  prompt?: string | null;
  inputCode?: string | null;
}) {
  if (!isContextualStrategyModificationRequest(input)) {
    return false;
  }

  const inputCode = input.inputCode?.trim() ?? "";

  return !inputCode || Boolean(normalizeCompleteStrategyCode(inputCode));
}

export function requestsPartialStrategyModificationOutput(prompt?: string | null) {
  return PARTIAL_OUTPUT_PATTERN.test(prompt?.trim() ?? "");
}

export function needsSeparatedBuyCallbackGuidance(prompt?: string | null) {
  return COMBINED_CALLBACK_TIME_CHANGE_PATTERN.test(prompt?.trim() ?? "");
}

export async function resolveConversationStrategyCodeArtifact(input: {
  repository: LightQuantRepository;
  userId: string;
  conversationId?: string | null;
  currentTask?: StrategyCodeCandidateTask | null;
  currentInputCode?: string | null;
  sourcePlatform?: string | null;
  targetPlatform?: string | null;
}) {
  const currentCode = normalizeCompleteStrategyCode(input.currentInputCode);

  if (currentCode) {
    return buildArtifact({
      code: currentCode,
      source: "current_input",
      taskId: input.currentTask?.id ?? null,
      conversationId: input.conversationId ?? null,
      platform: input.targetPlatform ?? input.sourcePlatform ?? null,
      createdAt: input.currentTask?.createdAt ?? null
    });
  }

  if (!input.conversationId) {
    return null;
  }

  const conversation = await input.repository.findAiConversationById(input.conversationId);

  if (!conversation || conversation.userId !== input.userId) {
    return null;
  }

  const listedTasks = await input.repository.listAiTasksForConversation(input.conversationId, {
    ascending: false
  });
  const tasks = getEarlierOwnedStrategyTasks(listedTasks, {
    userId: input.userId,
    conversationId: input.conversationId,
    currentTask: input.currentTask
  });

  for (const task of tasks) {
    if (task.status !== "SUCCEEDED") {
      continue;
    }

    const result = await input.repository.findAiTaskResult(task.id);
    const generatedArtifact = getValidGeneratedStrategyCode(
      task,
      result,
      input.currentTask?.createdAt ?? null
    );

    if (generatedArtifact) {
      return buildArtifact({
        code: generatedArtifact.code,
        source: "generated_code",
        taskId: task.id,
        conversationId: input.conversationId,
        platform: task.targetPlatform ?? task.sourcePlatform,
        createdAt: generatedArtifact.createdAt
      });
    }
  }

  for (const task of tasks) {
    const historicalInput = normalizeCompleteStrategyCode(task.inputCode);

    if (historicalInput) {
      return buildArtifact({
        code: historicalInput,
        source: "historical_input",
        taskId: task.id,
        conversationId: input.conversationId,
        platform: task.targetPlatform ?? task.sourcePlatform,
        createdAt: task.createdAt
      });
    }
  }

  return null;
}

export function withConversationStrategyCodeMetadata<T extends {
  reportJson: Record<string, unknown> | null;
}>(result: T, artifact?: ConversationStrategyCodeArtifact | null): T {
  if (!artifact) {
    return result;
  }

  return {
    ...result,
    reportJson: {
      ...(result.reportJson ?? {}),
      conversationStrategyCode: toConversationStrategyCodeMetadata(artifact)
    }
  };
}

export function toConversationStrategyCodeMetadata(artifact: ConversationStrategyCodeArtifact) {
  return {
    version: artifact.version,
    source: artifact.source,
    taskId: artifact.taskId,
    conversationId: artifact.conversationId,
    platform: artifact.platform,
    contentSha256: artifact.contentSha256,
    codeLineCount: artifact.codeLineCount,
    createdAt: artifact.createdAt
  };
}

function getEarlierOwnedStrategyTasks(
  tasks: AiTask[],
  input: {
    userId: string;
    conversationId: string;
    currentTask?: StrategyCodeCandidateTask | null;
  }
) {
  const owned = tasks.filter((task) =>
    task.userId === input.userId &&
    task.conversationId === input.conversationId &&
    task.type === "strategy_generation"
  );

  if (!input.currentTask) {
    return owned;
  }

  const currentIndex = owned.findIndex((task) => task.id === input.currentTask?.id);

  if (currentIndex >= 0) {
    return owned.slice(currentIndex + 1);
  }

  return owned.filter((task) =>
    task.createdAt < input.currentTask!.createdAt ||
    (task.createdAt === input.currentTask!.createdAt && task.id < input.currentTask!.id)
  );
}

function getValidGeneratedStrategyCode(
  task: StrategyCodeCandidateTask,
  result: AiTaskResult | null,
  currentTaskCreatedAt: string | null
) {
  if (
    !result ||
    result.resultType !== "strategy_generation" ||
    result.scopeStatus !== "in_scope"
  ) {
    return null;
  }

  if (currentTaskCreatedAt && result.createdAt > currentTaskCreatedAt) {
    return null;
  }

  const code = normalizeCompleteStrategyCode(result.generatedCode);

  if (!code || hasInvalidResultMetadata(result.reportJson)) {
    return null;
  }

  const report = readRecord(result.reportJson);
  const artifact = readRecord(report?.artifact);
  const recordedHash = readString(artifact?.contentSha256);

  if (recordedHash && recordedHash !== sha256(code)) {
    return null;
  }

  const recordedPlatform = readString(artifact?.platform);
  const taskPlatform = task.targetPlatform ?? task.sourcePlatform;

  if (recordedPlatform && taskPlatform && recordedPlatform !== taskPlatform) {
    return null;
  }

  return {
    code,
    createdAt: result.createdAt
  };
}

function hasInvalidResultMetadata(value: Record<string, unknown> | null) {
  const report = readRecord(value);
  const artifact = readRecord(report?.artifact);
  const validation = readRecord(report?.validation);

  return report?.partial === true ||
    report?.truncated === true ||
    report?.streamCompleted === false ||
    report?.completionStatus === "invalid" ||
    report?.integrityStatus === "physical_truncated" ||
    artifact?.status === "invalid" ||
    validation?.status === "invalid";
}

function buildArtifact(input: {
  code: string;
  source: ConversationStrategyCodeSource;
  taskId: string | null;
  conversationId: string | null;
  platform: string | null;
  createdAt: string | null;
}): ConversationStrategyCodeArtifact {
  return {
    version: 1,
    ...input,
    contentSha256: sha256(input.code),
    codeLineCount: input.code.split(/\r?\n/).filter((line) => line.trim()).length
  };
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
