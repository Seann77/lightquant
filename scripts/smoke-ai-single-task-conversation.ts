import { getSingleTaskConversationConflict } from "../src/server/ai/single-task-conversation";
import { restoreWorkbenchConversation } from "../src/lib/ai/workbench-client";
import type { AiTaskStatus, AiTaskType } from "../src/server/domain";
import type { AiTask, AiTaskResult } from "../src/server/domain";
import type { LightQuantRepository } from "../src/server/repositories/types";
import {
  isContextualStrategyModificationRequest,
  resolveConversationStrategyCodeArtifact
} from "../src/server/ai/conversation-strategy-code";

async function main() {
function conflict(statuses: AiTaskStatus[], type: AiTaskType = "code_conversion") {
  return getSingleTaskConversationConflict(statuses.map((status) => ({ type, status })), type);
}

expect("pending blocks duplicate submit", conflict(["PENDING"]) === "in_progress");
expect("running blocks duplicate submit", conflict(["RUNNING"]) === "in_progress");
expect("completed permanently blocks submit", conflict(["SUCCEEDED"]) === "completed");
expect("cancelled allows a new request", conflict(["CANCELLED"]) === null);
expect("failed allows a new request", conflict(["FAILED"]) === null);
expect("successful task wins over a later legacy failure", conflict(["FAILED", "SUCCEEDED"]) === "completed");
expect("analysis follows the same rule", conflict(["CANCELLED"], "code_analysis") === null);
expect("strategy generation remains multi-task", conflict(["RUNNING", "SUCCEEDED"], "strategy_generation") === null);

const restored = restoreWorkbenchConversation({
  conversation: {
    id: "conversation-1",
    mode: "analysis",
    title: "analysis",
    sourcePlatform: "PTrade",
    targetPlatform: null,
    status: "active",
    lastMessageAt: "2026-07-21T00:00:00.000Z",
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T00:00:01.000Z"
  },
  messages: [{
    id: "message-1",
    conversationId: "conversation-1",
    role: "user",
    taskId: null,
    content: "legacy",
    contentJson: {
      taskType: "code_analysis",
      inputCodePreview: "legacy preview"
    },
    createdAt: "2026-07-21T00:00:00.000Z"
  }],
  latestTask: {
    id: "task-1",
    type: "code_analysis",
    status: "FAILED",
    sourcePlatform: "QMT",
    prompt: "full prompt",
    inputCode: "print('full input')",
    inputFileId: null,
    costPoints: 0,
    startedAt: "2026-07-21T00:00:00.000Z",
    finishedAt: "2026-07-21T00:00:12.000Z"
  },
  latestResult: null
}, "code_analysis");

expect("history prefers task full input over message preview", restored.inputCode === "print('full input')");
expect("history restores task platform and prompt", restored.sourcePlatform === "QMT" && restored.prompt === "full prompt");
expect("history retains latest failed state", restored.taskData?.task.status === "FAILED");

const longStrategyCode = [
  "def initialize(context):",
  "    g.security = '000001.SZ'",
  "    g.target_list = []",
  "    run_daily(rebalance, time='14:50')",
  "",
  "def rebalance(context):",
  "    prices = get_history(g.security, '1d', 20, ['close'])",
  "    if len(prices) > 0:",
  "        order_target_percent(g.security, 1.0)",
  "",
  ...Array.from({ length: 240 }, (_, index) => [
    `def helper_${index}(context):`,
    `    value_${index} = ${index}`,
    `    return value_${index}`
  ].join("\n"))
].join("\n");
expect("fixture exceeds 5000 chars", longStrategyCode.length > 5000);

const generatedAt1452 = longStrategyCode.replace("time='14:50'", "time='14:52'");
const generatedAt1453 = longStrategyCode.replace("time='14:50'", "time='14:53'");
const otherConversationCode = longStrategyCode.replace("time='14:50'", "time='13:30'");
const otherConversationTask = {
  ...taskFixture("task-other-conversation", "2026-07-23T10:02:30.000Z", "SUCCEEDED", otherConversationCode),
  conversationId: "conversation-2"
};
const tasks: AiTask[] = [
  taskFixture("task-future-result", "2026-07-23T10:05:30.000Z", "SUCCEEDED", null),
  taskFixture("task-invalid", "2026-07-23T10:05:00.000Z", "SUCCEEDED", null),
  taskFixture("task-failed", "2026-07-23T10:04:00.000Z", "FAILED", null),
  taskFixture("task-explanation", "2026-07-23T10:03:00.000Z", "SUCCEEDED", null),
  taskFixture("task-generated", "2026-07-23T10:02:00.000Z", "SUCCEEDED", null),
  taskFixture("task-first-explanation", "2026-07-23T10:01:00.000Z", "SUCCEEDED", longStrategyCode),
  otherConversationTask
];
const results = new Map<string, AiTaskResult>([
  ["task-future-result", resultFixture("task-future-result", generatedAt1453, {
    completionStatus: "complete",
    artifact: {
      status: "complete"
    }
  }, "2026-07-23T10:07:00.000Z")],
  ["task-invalid", resultFixture("task-invalid", generatedAt1453, {
    completionStatus: "invalid",
    artifact: {
      status: "invalid"
    }
  }, "2026-07-23T10:05:30.000Z")],
  ["task-failed", resultFixture("task-failed", generatedAt1453, {}, "2026-07-23T10:04:30.000Z")],
  ["task-explanation", resultFixture("task-explanation", null, {
    responseMode: "focused_explanation"
  }, "2026-07-23T10:03:30.000Z")],
  ["task-generated", resultFixture("task-generated", generatedAt1452, {
    completionStatus: "complete",
    artifact: {
      status: "complete"
    }
  }, "2026-07-23T10:02:30.000Z")],
  ["task-first-explanation", resultFixture("task-first-explanation", null, {
    responseMode: "focused_explanation"
  }, "2026-07-23T10:01:30.000Z")]
]);
const repository = conversationRepositoryFixture(tasks, results);
const firstModifyTask = taskFixture("task-first-modify", "2026-07-23T10:01:30.000Z", "PENDING", null);
const firstBaseline = await resolveConversationStrategyCodeArtifact({
  repository,
  userId: "user-1",
  conversationId: "conversation-1",
  currentTask: firstModifyTask
});
expect("focused explanation preserves complete historical input", firstBaseline?.source === "historical_input");
expect("focused explanation preserves more than 5000 chars", firstBaseline?.code === longStrategyCode);

const currentModifyTask = taskFixture("task-current", "2026-07-23T10:06:00.000Z", "PENDING", null);
const continuousBaseline = await resolveConversationStrategyCodeArtifact({
  repository,
  userId: "user-1",
  conversationId: "conversation-1",
  currentTask: currentModifyTask
});
expect("continuous modification uses latest valid generated code", continuousBaseline?.taskId === "task-generated");
expect("explanation-only result does not overwrite generated code", continuousBaseline?.code === generatedAt1452);
expect("failed invalid and future output do not overwrite generated code", continuousBaseline?.code !== generatedAt1453);

const explicitBaseline = await resolveConversationStrategyCodeArtifact({
  repository,
  userId: "user-1",
  conversationId: "conversation-1",
  currentTask: currentModifyTask,
  currentInputCode: generatedAt1453,
  sourcePlatform: "PTrade"
});
expect("current complete input has highest priority", explicitBaseline?.source === "current_input");
expect("current complete input remains intact", explicitBaseline?.code === generatedAt1453);

const isolatedBaseline = await resolveConversationStrategyCodeArtifact({
  repository,
  userId: "user-2",
  conversationId: "conversation-1",
  currentTask: currentModifyTask
});
expect("conversation code is isolated by user", isolatedBaseline === null);
const otherConversationBaseline = await resolveConversationStrategyCodeArtifact({
  repository,
  userId: "user-1",
  conversationId: "conversation-2",
  currentTask: {
    ...currentModifyTask,
    id: "task-current-other",
    conversationId: "conversation-2"
  }
});
expect("conversation code is isolated by conversation id", otherConversationBaseline?.code === otherConversationCode);
expect("other conversation never reads first conversation code", otherConversationBaseline?.code !== generatedAt1452);
expect("buy-time follow-up is contextual modification", isContextualStrategyModificationRequest({
  type: "strategy_generation",
  prompt: "把买入时间从 14:50 改成 14:52，其他逻辑不变"
}));
for (const prompt of [
  "修改一下这个策略",
  "将刚才代码中的止损比例改成 6%",
  "在这个策略上增加涨停过滤",
  "上一版代码里再加一个日志",
  "刚才的修改不对，恢复原来的卖出时间",
  "继续修改这份代码"
]) {
  expect(`contextual modification phrase: ${prompt}`, isContextualStrategyModificationRequest({
    type: "strategy_generation",
    prompt
  }));
}
expect("explanation question is not contextual modification", !isContextualStrategyModificationRequest({
  type: "strategy_generation",
  prompt: "这个策略什么时候买入？"
}));
expect("holding explanation with preserve wording is not modification", !isContextualStrategyModificationRequest({
  type: "strategy_generation",
  prompt: "解释一下这个策略会保留哪些持仓？"
}));

console.log(JSON.stringify({
  ok: true,
  checked: [
    "conversion and analysis active-task exclusion",
    "completed conversation lock",
    "failed and cancelled retry allowance",
    "strategy generation exemption",
    "full task input history restore",
    "focused explanation followed by modification with more than 5000 chars",
    "continuous modification uses latest valid generated code",
    "explanation, failed, and invalid results do not overwrite the baseline",
    "current complete input priority",
    "user and conversation isolation",
    "contextual modification intent detection"
  ]
}, null, 2));

function expect(label: string, condition: boolean) {
  if (!condition) {
    throw new Error(`Smoke failed: ${label}`);
  }
}

function taskFixture(
  id: string,
  createdAt: string,
  status: AiTaskStatus,
  inputCode: string | null
): AiTask {
  return {
    id,
    userId: "user-1",
    conversationId: "conversation-1",
    type: "strategy_generation",
    status,
    scopeStatus: "in_scope",
    sourcePlatform: "PTrade",
    targetPlatform: null,
    prompt: "测试",
    inputCode,
    inputFileId: null,
    costPoints: 50,
    clientRequestId: `client-${id}`,
    requestId: `request-${id}`,
    errorCode: null,
    errorMessage: null,
    startedAt: createdAt,
    finishedAt: status === "PENDING" ? null : createdAt,
    createdAt,
    updatedAt: createdAt
  };
}

function resultFixture(
  taskId: string,
  generatedCode: string | null,
  reportJson: Record<string, unknown> = {},
  createdAt = "2026-07-23T10:10:00.000Z"
): AiTaskResult {
  return {
    taskId,
    resultType: "strategy_generation",
    scopeStatus: "in_scope",
    generatedCode,
    explanation: generatedCode ? "已修改。" : "仅解释。",
    migrationNotes: null,
    riskWarnings: [],
    reportJson,
    model: "mock",
    tokenUsage: {
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2
    },
    createdAt
  };
}

function conversationRepositoryFixture(tasks: AiTask[], results: Map<string, AiTaskResult>) {
  return {
    findAiConversationById: async (conversationId: string) => conversationId === "conversation-1" || conversationId === "conversation-2"
      ? {
          id: conversationId,
          userId: "user-1",
          mode: "strategy" as const,
          title: "策略修改",
          targetPlatform: null,
          sourcePlatform: "PTrade",
          status: "active" as const,
          uiState: null,
          lastMessageAt: "2026-07-23T10:06:00.000Z",
          createdAt: "2026-07-23T10:00:00.000Z",
          updatedAt: "2026-07-23T10:06:00.000Z"
        }
      : null,
    listAiTasksForConversation: async (conversationId: string) =>
      tasks.filter((task) => task.conversationId === conversationId),
    findAiTaskResult: async (taskId: string) => results.get(taskId) ?? null
  } as LightQuantRepository;
}
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
