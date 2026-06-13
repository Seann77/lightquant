import { readFileSync } from "node:fs";

const runnerPath = "src/server/ai/ai-task-runner.ts";
const servicePath = "src/server/ai/ai-service.ts";
const taskRoutePath = "src/app/api/v1/ai/tasks/route.ts";
const resultRoutePath = "src/app/api/v1/ai/tasks/[taskId]/result/route.ts";
const runner = readFileSync(runnerPath, "utf8");
const service = readFileSync(servicePath, "utf8");
const taskRoute = readFileSync(taskRoutePath, "utf8");
const resultRoute = readFileSync(resultRoutePath, "utf8");
const failures = [];

requireSnippet(runnerPath, runner, "runner timeout config", 'import { getAiTaskTimeoutMs } from "@/server/env";');
requireSnippet(runnerPath, runner, "tracked scheduled run metadata", "type ScheduledAiTaskRun");
requireSnippet(runnerPath, runner, "run started timestamp", "startedAt: number;");
requireSnippet(runnerPath, runner, "stale in-memory run replacement", "runningTasks.delete(taskId);");
requireSnippet(runnerPath, runner, "provider run timeout wrapper", "withTimeout(runAiTask(taskId, requestId), maxRunMs)");
requireSnippet(runnerPath, runner, "runner timeout error code", "AI_TASK_RUNNER_TIMEOUT");
requireSnippet(runnerPath, runner, "runner timeout floor", "Math.max(getAiTaskTimeoutMs() + 30_000, 2 * 60 * 1000)");

requireSnippet(servicePath, service, "stale database RUNNING detection", 'task.status === "RUNNING" && isStaleRunningTask(task)');
requireSnippet(servicePath, service, "fresh RUNNING task no-op", 'task.status === "RUNNING" && !shouldRestartRunningTask');
requireSnippet(servicePath, service, "stale task helper", "function isStaleRunningTask(task: AiTask)");
requireSnippet(servicePath, service, "database stale timeout", "Math.max(getAiTaskTimeoutMs() * 2, 2 * 60 * 1000)");
requireSnippet(servicePath, service, "latest status reload", "const latestTask = await repository.findAiTaskById(task.id);");
requireSnippet(servicePath, service, "latest status succeeded guard", 'latestTask.status === "SUCCEEDED"');
requireSnippet(servicePath, service, "latest status failed guard", 'latestTask.status === "FAILED"');
requireSnippet(servicePath, service, "latest status cancelled guard", 'latestTask.status === "CANCELLED"');
requireSnippet(servicePath, service, "confirmed result lookup", "await getAiTaskResultResponse(latestTask.id)");

requireRouteSchedulingGuard(taskRoutePath, taskRoute, "create task route");
requireRouteSchedulingGuard(resultRoutePath, resultRoute, "result polling route");

const providerResultIndex = service.indexOf("const providerResult = await runAiProvider(task);");
const latestTaskIndex = service.indexOf("const latestTask = await repository.findAiTaskById(task.id);", providerResultIndex);
const confirmIndex = service.indexOf("confirmReservation(task as AiTask, requestId)", providerResultIndex);

if (providerResultIndex === -1 || latestTaskIndex === -1 || confirmIndex === -1 || !(providerResultIndex < latestTaskIndex && latestTaskIndex < confirmIndex)) {
  failures.push(`${servicePath} must reload and check latest task status after provider return and before confirming credits`);
}

if (failures.length > 0) {
  console.error("AI runner guard check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("AI runner guard check passed.");

function requireSnippet(path, content, name, snippet) {
  if (!content.includes(snippet)) {
    failures.push(`${path} missing ${name}: ${snippet}`);
  }
}

function requireRouteSchedulingGuard(path, content, name) {
  requireSnippet(path, content, `${name} imports scheduler`, 'import { scheduleAiTaskRun } from "@/server/ai/ai-task-runner";');
  requireSnippet(path, content, `${name} schedules pending tasks`, 'data.task.status === "PENDING"');
  requireSnippet(path, content, `${name} schedules running tasks`, 'data.task.status === "RUNNING"');
  requireSnippet(path, content, `${name} skips completed result`, "!data.result");
  requireSnippet(path, content, `${name} calls scheduler`, "scheduleAiTaskRun(data.task.id, requestId);");

  const resultIndex = content.indexOf("const data = await");
  const guardIndex = content.indexOf('!data.result && (data.task.status === "PENDING" || data.task.status === "RUNNING")', resultIndex);
  const scheduleIndex = content.indexOf("scheduleAiTaskRun(data.task.id, requestId);", guardIndex);
  const okIndex = content.indexOf("return ok(data", scheduleIndex);

  if (resultIndex === -1 || guardIndex === -1 || scheduleIndex === -1 || okIndex === -1 || !(resultIndex < guardIndex && guardIndex < scheduleIndex && scheduleIndex < okIndex)) {
    failures.push(`${path} must schedule pending/running AI tasks after loading data and before returning the API response`);
  }
}
