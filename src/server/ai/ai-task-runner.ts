import { runAiTask } from "@/server/ai/ai-service";
import { getAiTaskTimeoutMs } from "@/server/env";

declare global {
  // MVP in-process task runner. Future production deployments should replace this with a durable queue/Worker.
  var __lightquantAiTaskRuns: Map<string, ScheduledAiTaskRun> | undefined;
}

type ScheduledAiTaskRun = {
  startedAt: number;
  promise: Promise<void>;
};

const runningTasks = globalThis.__lightquantAiTaskRuns ?? new Map<string, ScheduledAiTaskRun>();
globalThis.__lightquantAiTaskRuns = runningTasks;

export function scheduleAiTaskRun(taskId: string, requestId: string) {
  const existing = runningTasks.get(taskId);
  const maxRunMs = getRunnerTimeoutMs();

  if (existing && Date.now() - existing.startedAt <= maxRunMs) {
    return;
  }

  if (existing) {
    runningTasks.delete(taskId);
  }

  const run = new Promise<void>((resolve) => {
    setTimeout(() => {
      withTimeout(runAiTask(taskId, requestId), maxRunMs)
        .catch((error) => {
          const code = error instanceof Error && "code" in error ? String(error.code) : "AI_TASK_FAILED";
          console.error(`[${requestId}] AI task ${taskId} failed: ${code}`);
        })
        .finally(resolve);
    }, 0);
  }).finally(() => {
    runningTasks.delete(taskId);
  });

  runningTasks.set(taskId, {
    startedAt: Date.now(),
    promise: run
  });
}

function getRunnerTimeoutMs() {
  return Math.max(getAiTaskTimeoutMs() + 30_000, 2 * 60 * 1000);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error("AI_TASK_RUNNER_TIMEOUT"));
      }, timeoutMs);
    })
  ]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}
