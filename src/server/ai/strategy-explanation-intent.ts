import type { AiTask } from "@/server/domain";

export type StrategyExplanationMode = "focused_explanation" | "full_explanation" | "other";

const FULL_EXPLANATION_PATTERN =
  /(?:完整|全面|系统(?:性)?)(?:地)?(?:分析|解析|解释|解读)(?:一下)?(?:这|该|整)?(?:份|个)?(?:策略|代码)|(?:逐模块|逐段|逐行|逐函数)(?:地)?(?:分析|解析|解释|解读)|(?:完整|详细)(?:策略)?(?:档案|报告|说明书)|(?:全部|所有)(?:模块|交易逻辑|代码逻辑)|42\s*项/i;
const EXPLANATION_REQUEST_PATTERN =
  /分析|解析|解释|解读|说明|看懂|看一下|做什么|怎么|如何|何时|什么时候|哪些|什么条件|什么规则|为什么|逻辑|条件|规则|触发|执行/i;
const FOCUSED_TOPIC_PATTERN =
  /买入|卖出|止损|止盈|调仓|选股|择时|信号|仓位|持仓|资金分配|下单|成交|清仓|风控|过滤|排序|没有买|未买入|跳过交易/i;
const NON_EXPLANATION_ACTION_PATTERN =
  /(?:生成|编写|写一个|创建|修改|改成|调整|增加|新增|添加|删除|替换|修复|调试|排查报错|转换|迁移|移植|优化收益|调参)/i;
const CODE_LINE_PATTERN =
  /^\s*(?:```|def\s+|class\s+|from\s+|import\s+|return\b|if\s+|elif\s+|else\s*:|for\s+|while\s+|try\s*:|except\b|with\s+|@\w+|#|(?:g|context|C|ContextInfo)\.|[A-Za-z_]\w*\s*=)/;

export function getStrategyExplanationMode(
  task: Pick<AiTask, "type" | "prompt">
): StrategyExplanationMode {
  if (task.type !== "strategy_generation" && task.type !== "code_analysis") {
    return "other";
  }

  const requestText = extractCurrentRequestText(task.prompt);

  if (!requestText) {
    return task.type === "code_analysis" ? "full_explanation" : "other";
  }

  if (FULL_EXPLANATION_PATTERN.test(requestText)) {
    return "full_explanation";
  }

  if (task.type === "code_analysis") {
    return "focused_explanation";
  }

  if (NON_EXPLANATION_ACTION_PATTERN.test(requestText)) {
    return "other";
  }

  if (
    EXPLANATION_REQUEST_PATTERN.test(requestText) &&
    (FOCUSED_TOPIC_PATTERN.test(requestText) || /策略|代码/.test(requestText))
  ) {
    return "focused_explanation";
  }

  return "other";
}

export function buildStrategyExplanationModeGuidance(
  task: Pick<AiTask, "type" | "prompt">
) {
  const mode = getStrategyExplanationMode(task);

  if (mode === "focused_explanation") {
    return [
      "服务端解释模式：focused_explanation（局部逻辑问答）。",
      "当前用户问题的范围高于输入代码长度、历史模板和完整代码外观；即使用户粘贴了完整策略，也只回答当前问到的买入、卖出、止损、止盈、调仓、选股、信号或仓位模块。",
      "先用 1-3 句话直接概括结论，再按问题需要使用“普通短标题 + 中文冒号”和简短数字列表，说明触发时间、触发条件、操作对象、信号来源、资金或仓位动作，以及会跳过交易的明确限制。",
      "只保留代码中真实存在的关键时间、比例、持仓数量和阈值；代码无法确认的内容写“代码中未明确给出”，不得按平台习惯补全。",
      "默认不要输出完整策略档案、固定 42 项报告、完整调度表、参数速查表、Markdown 表格、多层 Markdown 标题、装饰性分隔线、大段代码块、伪代码块或用户未询问的扩展建议。",
      "不要输出 ###、####、---、表格分隔符、TEXT、复制等渲染残留。普通解释不需要代码；确需代码依据时只给最小片段，并先解释交易含义。",
      "内容长度必须与当前问题范围匹配，不要为了显得完整重复结论。"
    ].join("\n");
  }

  if (mode === "full_explanation") {
    return [
      "服务端解释模式：full_explanation（完整策略解析）。",
      "用户明确要求完整、全面或逐模块解析，可以覆盖运行流程、选标的、信号、买卖、仓位、风控和必要风险，但仍须先讲交易含义，再给必要代码证据。",
      "使用自然、可渲染的 Markdown；不要暴露原始 Markdown 表格分隔符、装饰线、TEXT、复制等渲染噪音。",
      "只解释代码真实存在的逻辑；缺失内容写“代码中未明确给出”。"
    ].join("\n");
  }

  return "";
}

function extractCurrentRequestText(prompt: string | null | undefined) {
  const withoutFencedCode = (prompt ?? "").replace(/```[\s\S]*?```/g, "\n");
  const proseLines = withoutFencedCode
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !CODE_LINE_PATTERN.test(line));

  return proseLines.join("\n").slice(-2400).trim();
}
