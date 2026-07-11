import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getCachedClientRequestStartedAt,
  getCachedTaskStartedAt,
  getTaskElapsedSeconds,
  migrateTaskStartedAt,
  pickEarliestValidIso,
  rememberClientRequestStartedAt,
  rememberTaskStartedAt,
  resolveTaskStartedAt
} from "../src/lib/ai/workbench-client";
import { parseStreamingMarkdownBlocks } from "../src/components/ai/AssistantThinkingMessage";

const root = process.cwd();
const storage = new Map<string, string>();

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
  sessionStorage: {
    get length() {
      return storage.size;
    },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    }
  } as Storage
  }
});

async function main() {
  const submitStartedAt = "2026-07-12T09:59:58.000Z";
  const retrySubmitStartedAt = "2026-07-12T10:05:00.000Z";
  const serverStartedAt = "2026-07-12T10:00:00.000Z";
  const progressStartedAt = "2026-07-12T10:01:00.000Z";
  const createdAt = "2026-07-12T10:02:00.000Z";
  const cachedStartedAt = "2026-07-12T10:03:00.000Z";
  const localCreatedAt = "2026-07-12T10:04:00.000Z";

  rememberTaskStartedAt("cached-task", cachedStartedAt, { overwrite: true });
  rememberClientRequestStartedAt("client-request-1", submitStartedAt, { overwrite: true });

  expect("earliest valid timestamp wins", pickEarliestValidIso(localCreatedAt, serverStartedAt, submitStartedAt) === submitStartedAt);
  expect("request submit time wins over later server startedAt", resolveTaskStartedAt({
    task: {
      id: "cached-task",
      clientRequestId: "client-request-1",
      startedAt: serverStartedAt,
      progress: { startedAt: progressStartedAt },
      createdAt
    },
    requestStartedAt: submitStartedAt,
    localCreatedAt
  }) === submitStartedAt);
  expect("new retry request does not inherit old client cache", resolveTaskStartedAt({
    task: {
      id: "retry-task",
      clientRequestId: "retry-client",
      startedAt: "2026-07-12T10:05:02.000Z",
      createdAt: "2026-07-12T10:05:01.000Z"
    },
    clientRequestId: "retry-client",
    requestStartedAt: retrySubmitStartedAt,
    cachedStartedAt: submitStartedAt,
    localCreatedAt
  }) === retrySubmitStartedAt);
  expect("server startedAt wins when it is earliest", resolveTaskStartedAt({
    task: {
      id: "server-first-task",
      startedAt: serverStartedAt,
      progress: { startedAt: progressStartedAt },
      createdAt
    },
    localCreatedAt
  }) === serverStartedAt);
  expect("progress startedAt wins before createdAt when no earlier cache exists", resolveTaskStartedAt({
    task: {
      id: "progress-first-task",
      progress: { startedAt: progressStartedAt },
      createdAt
    },
    localCreatedAt
  }) === progressStartedAt);
  expect("cache wins before local createdAt", resolveTaskStartedAt({
    task: {
      id: "cached-task"
    },
    localCreatedAt
  }) === cachedStartedAt);

  rememberTaskStartedAt("client-request-1", localCreatedAt, { overwrite: true });
  migrateTaskStartedAt("client-request-1", "real-task", localCreatedAt, {
    clientRequestId: "client-request-1",
    localClientRequestId: "client-request-1",
    taskClientRequestId: "client-request-1",
    submitStartedAt
  });
  expect("client submit startedAt migrates to real task", getCachedTaskStartedAt("real-task") === submitStartedAt);
  expect("client request startedAt is cached", getCachedClientRequestStartedAt("client-request-1") === submitStartedAt);

  rememberTaskStartedAt("real-task", serverStartedAt, { overwrite: true });
  expect("task overwrite uses current task startedAt exactly", getCachedTaskStartedAt("real-task") === serverStartedAt);
  rememberTaskStartedAt("real-task", "2026-07-12T09:59:50.000Z", { overwrite: true });
  expect("task overwrite can replace cache with current confirmed start", getCachedTaskStartedAt("real-task") === "2026-07-12T09:59:50.000Z");
  rememberTaskStartedAt("mismatch-local", localCreatedAt, { overwrite: true });
  migrateTaskStartedAt("mismatch-local", "mismatch-real", localCreatedAt, {
    clientRequestId: "client-request-1",
    localClientRequestId: "mismatch-local",
    taskClientRequestId: "client-request-1",
    submitStartedAt
  });
  expect("mismatched local clientRequestId does not migrate startedAt", getCachedTaskStartedAt("mismatch-real") === null);
  expect("finished duration uses startedAt to finishedAt", getTaskElapsedSeconds({
    startedAt: "2026-07-12T10:00:00.000Z",
    finishedAt: "2026-07-12T10:02:05.000Z"
  }) === 125);

  const openFenceBlocks = parseStreamingMarkdownBlocks([
    "说明",
    "",
    "```python",
    "def initialize(context):",
    "    g.security = '000001.SZ'"
  ].join("\n"));
  const codeBlock = openFenceBlocks.find((block) => block.type === "code");
  expect("unclosed code fence is previewed", codeBlock?.type === "code" && codeBlock.code.includes("def initialize"));

  const chatClient = await readFile(path.join(root, "src", "app", "chat", "ChatClient.tsx"), "utf8");
  const analysisClient = await readFile(path.join(root, "src", "app", "code-analysis", "CodeAnalysisClient.tsx"), "utf8");
  const thinkingMessage = await readFile(path.join(root, "src", "components", "ai", "AssistantThinkingMessage.tsx"), "utf8");
  const resultViews = await readFile(path.join(root, "src", "components", "ai", "WorkbenchResultViews.tsx"), "utf8");
  const progressPanel = await readFile(path.join(root, "src", "components", "ai", "AiTaskProgressPanel.tsx"), "utf8");
  const globalsCss = await readFile(path.join(root, "src", "app", "globals.css"), "utf8");
  const aiService = await readFile(path.join(root, "src", "server", "ai", "ai-service.ts"), "utf8");
  const noContinuationSmoke = await readFile(path.join(root, "scripts", "smoke-ai-no-continuation-ui.ts"), "utf8");

  expect("chat client uses stable elapsed hook", /useStableElapsedSeconds/.test(chatClient));
  expect("strategy creates clientRequestId timer cache on submit", /rememberClientRequestStartedAt\(clientRequestId, submitStartedAt/.test(chatClient));
  expect("strategy local job carries submit startedAt", /createdAt:\s*submitStartedAt[\s\S]*startedAt:\s*submitStartedAt/.test(chatClient));
  expect("strategy elapsed hook receives clientRequestId", /clientRequestId:\s*activeJob\?\.clientRequestId/.test(chatClient));
  expect("task payload merge migrates clientRequestId startedAt", /migrateTaskStartedAt\([\s\S]*clientRequestId/.test(chatClient));
  expect("task payload migration checks local and task clientRequestId", /localClientRequestId:\s*previousClientRequestId/.test(chatClient) && /taskClientRequestId/.test(chatClient));
  expect("task payload running timer uses request startedAt priority", /requestStartedAt:\s*requestMatchesTask && requestClientRequestId === clientRequestId/.test(chatClient));
  expect("active task merge does not choose earliest historical startedAt", !/startedAt:\s*pickEarliestValidIso\(existing\?\.startedAt/.test(chatClient));
  expect("source conversation key stays active during real task switch", /next\[options\.sourceConversationKey\]\s*=\s*data\.task\.id/.test(chatClient));
  expect("code analysis uses stable elapsed hook", /useStableElapsedSeconds/.test(analysisClient));
  expect("old local elapsed hook removed from chat", !/function useElapsedSeconds/.test(chatClient));
  expect("old local elapsed hook removed from analysis", !/function useElapsedSeconds/.test(analysisClient));
  expect("strategy composer no longer renders processing label helper", !/getComposerSubmitLabel/.test(chatClient));
  expect("strategy active composer renders stop task button", /className="lq-stop-task-btn"/.test(chatClient) && /handleCancelJob\(activeJob\)/.test(chatClient));
  expect("strategy stop task button reuses cancel task flow", /async function handleCancelJob/.test(chatClient) && /cancelAiTask\(job\.id\)/.test(chatClient));
  expect("strategy task elapsed badge renders above assistant output", /function TaskElapsedBadge/.test(chatClient) && /<TaskElapsedBadge elapsedSeconds=/.test(chatClient));
  expect("strategy elapsed formatter supports minute display", /return `\$\{minutes\}m \$\{seconds\}s`;/.test(chatClient));
  expect("strategy stop task button uses restrained blue styling", /\.lq-stop-task-btn/.test(globalsCss) && /#0b4fc7/.test(globalsCss) && !/\.lq-stop-task-btn[\s\S]{0,900}(#b42318|217,\s*45,\s*32|248,\s*113,\s*113)/.test(globalsCss));
  expect("strategy job status has one-way merge", /function mergeJobStatus/.test(chatClient) && /getJobStatusRank\(nextStatus\) >= getJobStatusRank\(previousStatus\)/.test(chatClient));
  expect("pending no longer overrides running display branch", !/activeJob\?\.status === "queued"/.test(chatClient));
  expect("final delta maps strategy job to answering", /job\.status === "streaming" \|\| finalizingMessage \? "answering"/.test(chatClient));
  expect("strategy stream emits initial final deltas", /runningTask\.type === "strategy_generation" && delta\.type === "final_delta"/.test(aiService));
  expect("repair stream filters final deltas", /onDelta:\s*\(delta\) => delta\.type === "thinking_delta" \? input\.emit\(delta\) : undefined/.test(aiService));
  expect("repair emits neutral task snapshot", /perfLabel:\s*"stream_repairing"/.test(aiService));
  expect("strategy repair/finalizing suppresses draft answer", /suppressDraftFinalAnswer/.test(chatClient) && /shouldSuppressStrategyDraftFinalAnswer/.test(chatClient));
  expect("thinking collapse receives final-started state", /hasFinalStarted=\{hasFinalStarted\}/.test(thinkingMessage));
  expect("answering status shows final stream even before first text", /const hasFinalStarted = hasFinal \|\| status === "answering"/.test(thinkingMessage));
  expect("final answer uses neutral placeholder", /正在整理结果/.test(thinkingMessage));
  expect("final answer stream has no title row", !/lq-final-title/.test(thinkingMessage));
  expect("final answer stream removes writing/output labels", !/正在写回答|正在输出/.test(thinkingMessage));
  expect("streaming code preview keeps only primary in-progress label", /label=\{streaming \? "正在生成代码" : undefined\}/.test(thinkingMessage) && !/statusLabel|正在写入/.test(thinkingMessage));
  expect("unclosed code block tracks open preview state", /open:\s*true/.test(thinkingMessage));
  expect("full code panel only reads generatedCode", /const code = result\.generatedCode\?\.trim\(\) \?\? ""/.test(resultViews));
  expect("no continuation smoke still guards frontend entry", /frontend has no user-visible continuation entry strings/.test(noContinuationSmoke));

  for (const forbidden of ["继续输出", "继续补全", "免费重新整理", "canContinue"]) {
    expect(`AssistantThinkingMessage has no forbidden user copy: ${forbidden}`, !thinkingMessage.includes(forbidden));
  }

  for (const forbidden of ["排队中", "同步任务状态", "等待后台处理"]) {
    expect(`strategy user surfaces hide internal status copy: ${forbidden}`, !chatClient.includes(forbidden) && !progressPanel.includes(forbidden) && !thinkingMessage.includes(forbidden));
  }

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "stable task timer priority and cache migration",
      "clientRequestId startedAt cache and local-to-real task inheritance",
      "new submit and retry timers do not inherit old request starts",
      "mismatched clientRequestId cannot migrate startedAt",
      "completed duration calculation",
      "shared timer hook usage in strategy, conversion, and analysis surfaces",
      "strategy composer switches to restrained blue stop button while active",
      "strategy elapsed status renders above assistant output",
      "strategy elapsed status supports seconds and minute-second labels",
      "source conversation mapping stays active during local-to-real task switch",
      "pending task payload cannot downgrade running/streaming display state",
      "initial strategy stream emits final_delta while repair hides final_delta",
      "repair/finalizing hides partial draft previews",
      "answering status auto-splits thinking and final answer areas",
      "unclosed streaming code fence preview",
      "running code preview is separate from final generatedCode artifact",
      "continuation entry guard remains active"
    ]
  }, null, 2));
}

function expect(label: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exitCode = 1;
});
