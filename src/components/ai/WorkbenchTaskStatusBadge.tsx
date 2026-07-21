import { formatElapsedDuration } from "@/lib/ai/workbench-client";

type WorkbenchTaskStatusBadgeProps = {
  dirty?: boolean;
  elapsedSeconds: number;
  status: "running" | "completed" | "cancelled" | "failed";
};

const labels: Record<WorkbenchTaskStatusBadgeProps["status"], string> = {
  running: "处理中",
  completed: "已处理",
  cancelled: "已停止",
  failed: "处理失败"
};

export function WorkbenchTaskStatusBadge({ dirty = false, elapsedSeconds, status }: WorkbenchTaskStatusBadgeProps) {
  return (
    <div
      aria-live={status === "running" ? "polite" : undefined}
      className={`lq-task-elapsed-badge is-${status} ${dirty ? "is-dirty" : ""}`.trim()}
    >
      {labels[status]} {formatElapsedDuration(elapsedSeconds)}
    </div>
  );
}
