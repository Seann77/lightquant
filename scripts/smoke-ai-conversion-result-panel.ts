import { readFileSync } from "node:fs";
import path from "node:path";
import {
  canCopyConversionTab,
  countConversionCodeLines,
  getConversionCopyContent,
  getConversionFailureInfo
} from "../src/components/ai/ConversionResultPanel";
import type { AiTaskData } from "../src/lib/ai/workbench-types";

const root = process.cwd();
const chatClientSource = readFileSync(path.join(root, "src", "app", "chat", "ChatClient.tsx"), "utf8");
const conversionPanelSource = readFileSync(path.join(root, "src", "components", "ai", "ConversionResultPanel.tsx"), "utf8");
const resultViewsSource = readFileSync(path.join(root, "src", "components", "ai", "WorkbenchResultViews.tsx"), "utf8");
const globalsSource = readFileSync(path.join(root, "src", "app", "globals.css"), "utf8");

const code = [
  "def initialize(context):",
  "    g.stock = '000001.SZ'",
  "    run_daily(trade, time='09:35')",
  "",
  "def trade(context):",
  "    order_value(g.stock, 10000)"
].join("\n");
const notes = "已将 JoinQuant 的 run_daily 调度映射为目标平台定时执行。\n请复核行情字段。";

testSuccessfulCodeResult();
testMigrationNotesResult();
testFailedResultHidesResiduals();
testFailedRefundMessageWithoutReport();
testCancelledResultHidesResiduals();
testLegacySemanticIncompleteHidesResiduals();
testExplicitIntegrityFailure();
testPhysicalTruncatedWithoutContinuation();
testRepairFailureAndRefund();
testVisualAndScrollStructure();

console.log(JSON.stringify({
  ok: true,
  checked: [
    "SUCCEEDED + generatedCode exposes code and exact line numbers",
    "migration notes copy without code line numbers",
    "FAILED/CANCELLED/physical_truncated_without_continuation/repair_failed hide partial generatedCode and migrationNotes",
    "FAILED refund message shows refund state even when failed result metadata is hidden",
    "legacy semantic_incomplete task data remains hidden for historical compatibility",
    "stream residual cannot be copied after terminal failure",
    "300/1000 line counting remains exact",
    "conversion page does not embed FullCodeResultPanel for target code",
    "single outer scroll + no wrapping code + notes text preview CSS"
  ]
}, null, 2));

function testSuccessfulCodeResult() {
  const data = createTaskData("SUCCEEDED", {
    generatedCode: code,
    migrationNotes: notes,
    reportJson: {
      integrityStatus: "complete",
      partial: false,
      truncated: false,
      refundApplied: false
    }
  });
  const failure = getConversionFailureInfo(data);

  expect("success is not failed", !failure.failed);
  expect("success code line count", countConversionCodeLines(code) === 6);
  expect("success can copy code", canCopyConversionTab("目标平台代码", code, notes, failure.failed));
  expect("success copy code content", getConversionCopyContent("目标平台代码", code, notes, failure.failed) === code);
}

function testMigrationNotesResult() {
  const data = createTaskData("SUCCEEDED", {
    generatedCode: code,
    migrationNotes: notes,
    reportJson: {
      integrityStatus: "complete"
    }
  });
  const failure = getConversionFailureInfo(data);

  expect("notes result is not failed", !failure.failed);
  expect("notes copy enabled", canCopyConversionTab("迁移说明", code, notes, failure.failed));
  expect("notes copy content", getConversionCopyContent("迁移说明", code, notes, failure.failed) === notes);
  expect("notes component has no line numbers", !/function ConversionNotesPreview[\s\S]*lq-code-lines[\s\S]*function ConversionFailureState/.test(conversionPanelSource));
}

function testFailedResultHidesResiduals() {
  const data = createTaskData("FAILED", {
    generatedCode: "print('partial leaked code')",
    migrationNotes: "半成品迁移说明",
    reportJson: {
      integrityStatus: "semantic_incomplete",
      repairAttempted: true,
      repairSucceeded: false,
      refundApplied: true
    },
    errorMessage: "后端明确失败：完整性检测未通过"
  });
  const failure = getConversionFailureInfo(data);

  expect("failed status blocks result", failure.failed);
  expect("failed message prefers backend", failure.message.includes("完整性检测未通过"));
  expect("failed refund detected", failure.refundApplied);
  expect("failed code copy disabled", !canCopyConversionTab("目标平台代码", data.result?.generatedCode ?? "", data.result?.migrationNotes ?? "", failure.failed));
  expect("failed notes copy hidden", getConversionCopyContent("迁移说明", data.result?.generatedCode ?? "", data.result?.migrationNotes ?? "", failure.failed) === "");
}

function testFailedRefundMessageWithoutReport() {
  const data = createTaskData("FAILED", {
    generatedCode: null,
    migrationNotes: null,
    reportJson: null,
    errorMessage: "本次生成没有完成，积分已退回。你可以重新提交或调整输入后再试。"
  });
  const failure = getConversionFailureInfo(data);

  expect("failed refund message blocks result", failure.failed);
  expect("failed refund message detected", failure.refundApplied);
  expect("failed refund message copy disabled", !canCopyConversionTab("目标平台代码", "", "", failure.failed));
}

function testCancelledResultHidesResiduals() {
  const data = createTaskData("CANCELLED", {
    generatedCode: "print('cancelled partial')",
    migrationNotes: "取消后的半成品说明",
    reportJson: {
      integrityStatus: "unchecked"
    }
  });
  const failure = getConversionFailureInfo(data);

  expect("cancelled status blocks result", failure.failed);
  expect("cancelled copy disabled", !canCopyConversionTab("目标平台代码", data.result?.generatedCode ?? "", data.result?.migrationNotes ?? "", failure.failed));
}

function testLegacySemanticIncompleteHidesResiduals() {
  // 兼容历史任务：新任务不再由语义质量检查产生 semantic_incomplete。
  const data = createTaskData("SUCCEEDED", {
    generatedCode: "def select_stock(context):\n    return []",
    migrationNotes: "因篇幅所限，未完整展开。",
    reportJson: {
      integrityStatus: "semantic_incomplete",
      partial: true,
      truncated: false,
      refundApplied: false
    }
  });
  const failure = getConversionFailureInfo(data);
  const residualStreamCode = "```python\nprint('residual stream code')\n```";

  expect("legacy semantic incomplete blocks succeeded result", failure.failed);
  expect("legacy semantic incomplete disables residual stream copy", getConversionCopyContent("目标平台代码", residualStreamCode, "残留说明", failure.failed) === "");
}

function testExplicitIntegrityFailure() {
  const data = createTaskData("SUCCEEDED", {
    generatedCode: "print('should not be exposed')",
    migrationNotes: "完整性检测失败后的残留说明",
    reportJson: {
      integrityStatus: "failed",
      partial: false,
      truncated: false
    }
  });
  const failure = getConversionFailureInfo(data);

  expect("explicit integrity failure blocks result", failure.failed);
  expect("explicit integrity failure copy disabled", getConversionCopyContent("目标平台代码", data.result?.generatedCode ?? "", data.result?.migrationNotes ?? "", failure.failed) === "");
}

function testPhysicalTruncatedWithoutContinuation() {
  const data = createTaskData("SUCCEEDED", {
    generatedCode: "def initialize(context):\n    g.x = 1\n\ndef trade(context):",
    migrationNotes: "模型到达上限，且不能继续输出。",
    reportJson: {
      integrityStatus: "physical_truncated",
      partial: true,
      truncated: true,
      canContinue: false,
      refundApplied: true
    }
  });
  const failure = getConversionFailureInfo(data);

  expect("physical truncated without continuation blocks result", failure.failed);
  expect("physical truncated refund detected", failure.refundApplied);
  expect("physical truncated copy disabled", !canCopyConversionTab("目标平台代码", data.result?.generatedCode ?? "", data.result?.migrationNotes ?? "", failure.failed));
}

function testRepairFailureAndRefund() {
  const data = createTaskData("SUCCEEDED", {
    generatedCode: "def handle_data(context, data):\n    pass",
    migrationNotes: "补救失败后的说明",
    reportJson: {
      integrityStatus: "complete",
      repairAttempted: true,
      repairSucceeded: false,
      refundApplied: true
    }
  });
  const failure = getConversionFailureInfo(data);

  expect("repair failure blocks result", failure.failed);
  expect("repair failure reason", failure.reason === "repair_failed");
  expect("repair failure refund badge", failure.refundApplied);
}

function testVisualAndScrollStructure() {
  const threeHundredLines = Array.from({ length: 300 }, (_, index) => `print(${index})`).join("\n");
  const thousandLines = Array.from({ length: 1000 }, (_, index) => `value_${index} = ${index}`).join("\n");
  const codeConversionResultView = resultViewsSource.match(/export function CodeConversionResultView[\s\S]*?export function FullCodeResultPanel/)?.[0] ?? "";

  expect("300 line count exact", countConversionCodeLines(threeHundredLines) === 300);
  expect("1000 line count exact", countConversionCodeLines(thousandLines) === 1000);
  expect("Chat uses lightweight code preview", chatClientSource.includes("ConversionCodePreview"));
  expect("Chat removed local CodeConversionToolOutput", !chatClientSource.includes("function CodeConversionToolOutput"));
  expect("conversion result view does not nest FullCodeResultPanel", !/return\s+<FullCodeResultPanel/.test(codeConversionResultView));
  expect("code preview has one outer scrollbar", /\.lq-workbench\.is-conversion \.lq-code-preview[\s\S]*overflow:\s*auto/.test(globalsSource));
  expect("code keeps long lines horizontal", /\.lq-conversion-pre\.is-code[\s\S]*white-space:\s*pre/.test(globalsSource));
  expect("notes preview is text, not code lines", globalsSource.includes(".lq-conversion-notes-preview") && /white-space:\s*pre-wrap/.test(globalsSource));
  expect("empty code does not render fake line numbers", conversionPanelSource.includes("countConversionCodeLines(code)") && conversionPanelSource.includes("lineCount === 0"));
}

function createTaskData(status: string, options: {
  generatedCode?: string | null;
  migrationNotes?: string | null;
  reportJson?: Record<string, unknown> | null;
  errorMessage?: string | null;
}): AiTaskData {
  return {
    task: {
      id: `task-${status.toLowerCase()}`,
      status,
      type: "code_conversion",
      costPoints: 80,
      errorMessage: options.errorMessage ?? null,
      errorCode: status === "FAILED" ? "AI_TASK_FAILED" : null
    },
    result: {
      scopeStatus: "in_scope",
      generatedCode: options.generatedCode ?? null,
      explanation: null,
      migrationNotes: options.migrationNotes ?? null,
      riskWarnings: [],
      reportJson: options.reportJson ?? null
    },
    billing: {
      nominalCostPoints: 80,
      chargedPoints: 80,
      waivedByMembership: false,
      membershipType: null,
      membershipLabel: null,
      membershipEndsAt: null
    }
  };
}

function expect(label: string, condition: boolean) {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
}
