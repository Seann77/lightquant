export const recentConversations = ["双均线策略修改", "PTrade 策略生成"];

export const sidebarUtilityItems = [
  { label: "帮助中心", href: "/more", icon: "help" },
  { label: "设置", href: "/more", icon: "settings" }
];

export const homeHero = {
  title: "轻量化",
  product: "LightQuant",
  subtitle: "AI 量化策略助手，自然语言——代码 相互转化。"
};

export const homeFeatures = [
  {
    title: "策略生成 / 修改",
    description: "用自然语言描述您的交易理念，AI为您编写底层策略代码。",
    href: "/chat?mode=strategy",
    icon: "auto_awesome"
  },
  {
    title: "平台代码转换",
    description: "在聚宽、PTrade、QMT等不同量化平台间快速迁移您的策略代码。",
    href: "/chat?mode=convert",
    icon: "translate"
  },
  {
    title: "代码翻译解析",
    description: "将晦涩的金融工程代码逐行解析为易懂的人类语言。",
    href: "/code-analysis",
    icon: "code"
  }
];

export const chatPlatformOptions = ["PTrade", "聚宽 (JoinQuant)", "QMT"];

export const convertPlatforms = {
  source: ["聚宽 (JoinQuant)", "PTrade", "QMT"],
  target: ["PTrade", "聚宽 (JoinQuant)", "QMT"]
};

export const chatMessages = [
  {
    id: 1,
    role: "user",
    text: "我想写一个基于 MA20 和 MA60 的金叉死叉策略，针对 PTrade 平台"
  },
  {
    id: 2,
    role: "assistant",
    text: "正在为您构思策略架构..."
  }
] as const;

export const codeAnalysisPlatforms = ["自动识别", "PTrade", "聚宽", "QMT"];

export const codeAnalysisTabs = ["策略概览", "交易逻辑", "关键参数", "风险提醒", "优化建议"];

export const creditSummary = [
  { label: "当前积分余额", value: "500", tone: "primary" },
  { label: "累计获得", value: "5,010", tone: "ink" },
  { label: "累计消耗", value: "20", tone: "ink" },
  { label: "本月变化", value: "+200", tone: "primary" }
] as const;

export const creditFilters = ["全部", "获取", "消耗", "退回"] as const;

export const creditTransactions = [
  {
    id: "signup-bonus",
    title: "新用户注册赠送",
    time: "2026-05-24 09:30",
    description: "注册成功后获得基础积分",
    category: "获取",
    amount: 500,
    balance: 500,
    status: "已完成"
  },
  {
    id: "standard-recharge",
    title: "标准包充值到账",
    time: "2026-05-24 10:12",
    description: "购买标准包，获得 3,500 积分",
    category: "获取",
    amount: 3500,
    balance: 4000,
    status: "已完成"
  },
  {
    id: "strategy-generate",
    title: "策略生成消耗",
    time: "2026-05-24 10:36",
    description: "生成双均线策略草稿",
    category: "消耗",
    amount: -10,
    balance: 3990,
    status: "已完成"
  },
  {
    id: "code-convert",
    title: "代码转换消耗",
    time: "2026-05-24 11:08",
    description: "平台代码转换：JoinQuant 至 PTrade",
    category: "消耗",
    amount: -5,
    balance: 3985,
    status: "已完成"
  },
  {
    id: "strategy-refund",
    title: "策略生成失败退回",
    time: "2026-05-24 11:20",
    description: "生成失败未扣费，积分自动退回",
    category: "退回",
    amount: 10,
    balance: 3995,
    status: "已退回"
  },
  {
    id: "code-analysis-cost",
    title: "代码解析消耗",
    time: "2026-05-24 11:42",
    description: "解析 PTrade 策略代码结构",
    category: "消耗",
    amount: -5,
    balance: 3990,
    status: "已完成"
  },
  {
    id: "starter-recharge",
    title: "入门包充值到账",
    time: "2026-05-24 12:10",
    description: "购买入门包，获得 1,000 积分",
    category: "获取",
    amount: 1000,
    balance: 4990,
    status: "已完成"
  },
  {
    id: "platform-convert",
    title: "平台代码转换消耗",
    time: "2026-05-24 12:36",
    description: "转换 PTrade 策略代码片段",
    category: "消耗",
    amount: -5,
    balance: 4985,
    status: "已完成"
  }
] as const;

export const moreItems = [
  {
    title: "策略案例",
    variant: "case",
    body: "观看下方演示，了解如何利用自然语言快速生成双均线策略并进行回测。"
  },
  {
    title: "积分规则",
    variant: "points",
    rules: [
      { icon: "add_circle", label: "新用户注册：", text: "赠送 500 基础积分。" },
      { icon: "remove_circle", label: "策略生成：", text: "每次成功生成消耗 10 积分。" },
      { icon: "remove_circle", label: "代码转换：", text: "每次语言转换（如 Python 至 C++）消耗 5 积分。" }
    ]
  },
  {
    title: "关于生成失败",
    variant: "failure",
    body:
      "如果由于系统原因或输入无法解析导致策略代码生成失败，系统将不会扣除您的积分。若因网络异常中断，扣除的积分将在 2 小时内自动原路退回。"
  },
  {
    title: "风险提示",
    variant: "danger",
    body:
      "LightQuant 提供的所有策略生成与代码转换结果仅供学习和参考，不构成任何投资建议。量化交易存在极高的市场风险。过往的回测数据不能保证未来的实际收益。用户在将任何策略应用于实盘交易前，需充分理解代码逻辑，并独立承担由此产生的全部投资风险。入市需谨慎。"
  }
] as const;
