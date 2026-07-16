import { buildContinuationDraft, isContinuationIntent } from "../src/server/ai/continuation";
import type { AiMessage } from "../src/server/domain";

const longAssistantOutput = `${"x".repeat(7200)}
def handle_data(context, data):
    lianban = 3
    if lianban >= g.li`;

const partialAssistant = createMessage({
  id: "assistant-partial",
  role: "assistant",
  content: longAssistantOutput,
  contentJson: {
    finalAnswerMarkdown: longAssistantOutput,
    result: {
      reportJson: {
        partial: true,
        truncated: true,
        truncateReason: "length",
        canContinue: true,
        outputTokenLimit: 80000
      }
    }
  }
});

const messages: AiMessage[] = [
  createMessage({
    id: "user-original",
    role: "user",
    content: "请生成完整 PTrade 策略代码。"
  }),
  partialAssistant
];

const strategyDraft = buildContinuationDraft({
  messages,
  taskType: "strategy_generation",
  userPrompt: "继续输出"
});

expect("continuation intent exact", isContinuationIntent("继续输出"));
expect("continuation intent phrase", isContinuationIntent("从刚才断的地方继续"));
expect("non-continuation text rejected", !isContinuationIntent("继续使用原来的参数，但改成双均线"));
expect("strategy draft exists", Boolean(strategyDraft));
expectIncludes("no restart instruction", strategyDraft?.prompt, "不要从头重新输出。");
expectIncludes("no duplicate instruction", strategyDraft?.prompt, "不要重复上一条已经输出过的内容。");
expectIncludes("continue after truncation", strategyDraft?.prompt, "只从上一条内容的截断点之后继续。");
expectIncludes("tail marker", strategyDraft?.prompt, "<previous_assistant_tail>");
expectIncludes("tail content", strategyDraft?.prompt, "if lianban >= g.li");
expect("tail is bounded", (strategyDraft?.previousTail.length ?? 0) <= 6000);
expect("tail keeps useful context", (strategyDraft?.previousTail.length ?? 0) >= 3000);

const conversionDraft = buildContinuationDraft({
  messages,
  taskType: "code_conversion",
  userPrompt: "接着写"
});

expect("conversion draft exists", Boolean(conversionDraft));
expectIncludes("conversion task label", conversionDraft?.prompt, "原始任务类型：代码转换");

const analysisDraft = buildContinuationDraft({
  messages,
  taskType: "code_analysis",
  userPrompt: "继续输出"
});

expect("analysis draft exists", Boolean(analysisDraft));
expectIncludes("analysis task label", analysisDraft?.prompt, "代码翻译解析");

const nonPartialDraft = buildContinuationDraft({
  messages: [
    createMessage({
      id: "assistant-complete",
      role: "assistant",
      content: "完整输出",
      contentJson: {
        result: {
          reportJson: {
            truncated: false,
            partial: false
          }
        }
      }
    })
  ],
  taskType: "strategy_generation",
  userPrompt: "继续输出"
});

expect("non-partial assistant is ignored", nonPartialDraft === null);

const olderPartialDraft = buildContinuationDraft({
  messages: [
    partialAssistant,
    createMessage({
      id: "assistant-complete-latest",
      role: "assistant",
      content: "后一条完整输出",
      contentJson: {
        result: {
          reportJson: {
            truncated: false,
            partial: false
          }
        }
      }
    })
  ],
  taskType: "strategy_generation",
  userPrompt: "继续输出"
});

expect("only latest assistant can trigger continuation", olderPartialDraft === null);

console.log(JSON.stringify({
  ok: true,
  checked: [
    "continuation intent",
    "partial assistant detection",
    "bounded previous output tail",
    "strategy/code conversion/code analysis prompt constraints"
  ]
}, null, 2));

function createMessage(input: Partial<AiMessage> & Pick<AiMessage, "id" | "role" | "content">): AiMessage {
  return {
    conversationId: "conversation-test",
    userId: "user-test",
    taskId: null,
    contentJson: null,
    createdAt: "2026-06-26T00:00:00.000Z",
    ...input
  };
}

function expect(label: string, condition: unknown) {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}

function expectIncludes(label: string, value: string | null | undefined, expected: string) {
  expect(label, typeof value === "string" && value.includes(expected));
}
