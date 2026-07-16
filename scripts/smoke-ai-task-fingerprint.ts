import {
  buildAiTaskFingerprint,
  canContinueAiTaskResult,
  isAiTaskResultPartial
} from "../src/lib/ai/task-fingerprint";

const base = buildAiTaskFingerprint({
  type: "code_conversion",
  sourcePlatform: " JoinQuant ",
  targetPlatform: " PTrade ",
  prompt: " keep risk controls ",
  inputCode: " def initialize(context):\n    pass\n ",
  inputFile: {
    fileId: "file-stable",
    originalName: "old.py",
    sizeBytes: 12,
    contentText: "old"
  }
});

const normalizedSame = buildAiTaskFingerprint({
  type: "code_conversion",
  sourcePlatform: "JoinQuant",
  targetPlatform: "PTrade",
  prompt: "keep risk controls",
  inputCode: "def initialize(context):\n    pass",
  inputFile: {
    fileId: "file-stable",
    originalName: "new-name.py",
    sizeBytes: 999,
    contentText: "different"
  }
});

const changedPrompt = buildAiTaskFingerprint({
  type: "code_conversion",
  sourcePlatform: "JoinQuant",
  targetPlatform: "PTrade",
  prompt: "change position sizing",
  inputCode: "def initialize(context):\n    pass",
  inputFile: {
    fileId: "file-stable"
  }
});

const changedPlatform = buildAiTaskFingerprint({
  type: "code_conversion",
  sourcePlatform: "PTrade",
  targetPlatform: "JoinQuant",
  prompt: "keep risk controls",
  inputCode: "def initialize(context):\n    pass",
  inputFile: {
    fileId: "file-stable"
  }
});

const fallbackFileA = buildAiTaskFingerprint({
  type: "strategy_generation",
  targetPlatform: "PTrade",
  prompt: "generate full strategy",
  inputFile: {
    originalName: "strategy.txt",
    sizeBytes: 20,
    contentText: "alpha"
  }
});

const fallbackFileB = buildAiTaskFingerprint({
  type: "strategy_generation",
  targetPlatform: "PTrade",
  prompt: "generate full strategy",
  inputFile: {
    originalName: "strategy.txt",
    sizeBytes: 20,
    contentText: "beta"
  }
});

expect("trimmed equivalent inputs share fingerprint", base === normalizedSame);
expect("prompt changes fingerprint", base !== changedPrompt);
expect("platform changes fingerprint", base !== changedPlatform);
expect("fallback file content changes fingerprint", fallbackFileA !== fallbackFileB);
expect("partial result detected", isAiTaskResultPartial({
  scopeStatus: "in_scope",
  explanation: null,
  riskWarnings: [],
  reportJson: {
    partial: true,
    truncated: true,
    canContinue: true
  }
}));
// 兼容历史任务：新任务不再产生 semantic_incomplete，仅确认旧数据不会被当成“继续输出”入口。
expect("legacy semantic partial result is not user-continuable", !canContinueAiTaskResult({
  scopeStatus: "in_scope",
  explanation: null,
  riskWarnings: [],
  reportJson: {
    partial: true,
    truncated: true,
    canContinue: true,
    integrityStatus: "semantic_incomplete"
  }
}));
expect("physical partial result is user-continuable", canContinueAiTaskResult({
  scopeStatus: "in_scope",
  explanation: null,
  riskWarnings: [],
  reportJson: {
    partial: true,
    truncated: true,
    canContinue: true,
    integrityStatus: "physical_truncated",
    truncateReason: "length"
  }
}));

console.log(JSON.stringify({
  ok: true,
  checked: [
    "normalized text fingerprint",
    "platform and prompt sensitivity",
    "stable file id preference",
    "fallback file content hash",
    "legacy semantic partial compatibility without user continuation",
    "physical truncation continuation eligibility"
  ]
}, null, 2));

function expect(label: string, condition: unknown) {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}
