import type { AiTask, AiTaskType } from "@/server/domain";

export type SingleTaskConversationConflict = "completed" | "in_progress" | null;

export function getSingleTaskConversationConflict(
  tasks: Array<Pick<AiTask, "type" | "status">>,
  type: AiTaskType
): SingleTaskConversationConflict {
  if (type === "strategy_generation") {
    return null;
  }

  if (tasks.some((task) => task.type === type && task.status === "SUCCEEDED")) {
    return "completed";
  }

  if (tasks.some((task) => task.type === type && (task.status === "PENDING" || task.status === "RUNNING"))) {
    return "in_progress";
  }

  return null;
}
