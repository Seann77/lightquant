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
requireSnippet(servicePath, service, "default result lookup", "const result = options.result === undefined ? await getRepository().findAiTaskResult(task.id) : options.result;");

requireRouteSchedulingGuard(taskRoutePath, taskRoute, "create task route");
requireRouteSchedulingGuard(resultRoutePath, resultRoute, "result polling route");
requireProviderReturnGuard(servicePath, service);

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

function requireProviderReturnGuard(path, content) {
  const providerResultMatch = /const\s+providerResult\s*=\s*await\s+runAiProvider\s*\(/.exec(content);

  if (!providerResultMatch) {
    failures.push(`${path} missing provider result assignment before credit confirmation`);
    return;
  }

  const providerResultIndex = providerResultMatch.index;
  const confirmIndex = content.indexOf("confirmReservation(", providerResultIndex);

  if (confirmIndex === -1) {
    failures.push(`${path} missing credit confirmation after provider return`);
    return;
  }

  const afterProviderBeforeConfirm = content.slice(providerResultIndex, confirmIndex);
  const reloadMatch = /const\s+(\w+)\s*=\s*await\s+repository\.findAiTaskById\((?:task|runningTask|runningProviderTask)\.id\);/.exec(afterProviderBeforeConfirm);

  if (!reloadMatch) {
    failures.push(`${path} must reload latest task status after provider return and before confirming credits`);
    return;
  }

  const latestTaskVariable = reloadMatch[1];
  const reloadIndex = reloadMatch.index;
  const afterReloadBeforeConfirm = afterProviderBeforeConfirm.slice(reloadIndex);

  for (const status of ["SUCCEEDED", "FAILED", "CANCELLED"]) {
    if (!afterReloadBeforeConfirm.includes(`${latestTaskVariable}.status === "${status}"`)) {
      failures.push(`${path} must guard ${status} latest task status after provider return and before confirming credits`);
    }
  }

  if (!afterReloadBeforeConfirm.includes(`buildAiTaskResponse(${latestTaskVariable}`)) {
    failures.push(`${path} must return the latest task response when another runner already completed or stopped the task`);
  }
}
