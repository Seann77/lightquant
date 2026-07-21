import { getSingleTaskConversationConflict } from "../src/server/ai/single-task-conversation";
import { restoreWorkbenchConversation } from "../src/lib/ai/workbench-client";
import type { AiTaskStatus, AiTaskType } from "../src/server/domain";

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

console.log(JSON.stringify({
  ok: true,
  checked: [
    "conversion and analysis active-task exclusion",
    "completed conversation lock",
    "failed and cancelled retry allowance",
    "strategy generation exemption",
    "full task input history restore"
  ]
}, null, 2));

function expect(label: string, condition: boolean) {
  if (!condition) {
    throw new Error(`Smoke failed: ${label}`);
  }
}
