import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workbook = Workbook.create();
const outputDir = path.resolve("outputs/promotion-plan-excel-20260623");
const previewDir = path.resolve(".tmp/promotion-plan-excel/previews");

const colors = {
  ink: "#1F2937",
  muted: "#6B7280",
  header: "#155E75",
  headerDark: "#0F3F4F",
  lightHeader: "#E0F2FE",
  blueLight: "#DBEAFE",
  greenLight: "#DCFCE7",
  amberLight: "#FEF3C7",
  redLight: "#FEE2E2",
  grayLight: "#F3F4F6",
  border: "#CBD5E1",
  white: "#FFFFFF",
};

function addSheet(name) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  return sheet;
}

function styleTitle(sheet, range, title, subtitle = "") {
  sheet.getRange(range).merge();
  const topLeft = range.split(":")[0];
  const [leftCell, rightCell] = range.split(":");
  sheet.getRange(topLeft).values = [[title]];
  sheet.getRange(topLeft).format = {
    fill: colors.headerDark,
    font: { bold: true, color: colors.white, size: 15 },
    horizontalAlignment: "left",
    verticalAlignment: "middle",
  };
  sheet.getRange(topLeft).format.rowHeight = 34;

  if (subtitle) {
    const [leftCol, leftRow] = leftCell.match(/^([A-Z]+)(\d+)$/).slice(1);
    const [rightCol] = rightCell.match(/^([A-Z]+)(\d+)$/).slice(1);
    const subtitleRow = Number(leftRow) + 1;
    const subtitleCell = `${leftCol}${subtitleRow}`;
    sheet.getRange(`${leftCol}${subtitleRow}:${rightCol}${subtitleRow}`).merge();
    sheet.getRange(subtitleCell).values = [[subtitle]];
    sheet.getRange(subtitleCell).format = {
      fill: colors.lightHeader,
      font: { color: colors.ink, italic: true },
      wrapText: true,
      verticalAlignment: "middle",
    };
    sheet.getRange(subtitleCell).format.rowHeight = 30;
  }
}

function styleHeader(range) {
  range.format = {
    fill: colors.header,
    font: { bold: true, color: colors.white },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: colors.border },
  };
  range.format.rowHeight = 30;
}

function styleBody(range) {
  range.format = {
    font: { color: colors.ink },
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: colors.border },
  };
}

function setColumnWidths(sheet, widths) {
  widths.forEach((width, index) => {
    const col = String.fromCharCode(65 + index);
    sheet.getRange(`${col}1:${col}80`).format.columnWidth = width;
  });
}

function addStatusValidation(sheet, range) {
  sheet.getRange(range).dataValidation = {
    rule: { type: "list", values: ["待开始", "进行中", "已完成", "延期"] },
  };
}

function addPriorityValidation(sheet, range) {
  sheet.getRange(range).dataValidation = {
    rule: { type: "list", values: ["高", "中", "低"] },
  };
}

function addStatusLegend(sheet, startCell = "E4") {
  const legend = [
    ["状态", "含义"],
    ["待开始", "尚未执行"],
    ["进行中", "正在推进"],
    ["已完成", "已产出并可复盘"],
    ["延期", "未按本周计划完成"],
  ];
  sheet.getRange(startCell).write(legend);
  const startCol = startCell.match(/[A-Z]+/)[0];
  const startRow = Number(startCell.match(/\d+/)[0]);
  const endCol = String.fromCharCode(startCol.charCodeAt(0) + 1);
  styleHeader(sheet.getRange(`${startCol}${startRow}:${endCol}${startRow}`));
  styleBody(sheet.getRange(`${startCol}${startRow + 1}:${endCol}${startRow + 4}`));
  sheet.getRange(`${startCol}${startRow + 1}:${startCol}${startRow + 4}`).format = {
    font: { bold: true, color: colors.ink },
    horizontalAlignment: "center",
    borders: { preset: "all", style: "thin", color: colors.border },
  };
}

const overview = addSheet("总览");
styleTitle(
  overview,
  "A1:H1",
  "LightQuant 第 1 周推广执行总览",
  "周期：2026-06-23 至 2026-06-28。定位：AI 量化策略代码助手，内容仅供学习、研究和回测参考。"
);
overview.getRange("A4:C4").values = [["指标", "数值", "说明"]];
overview.getRange("A5:C14").values = [
  ["本周动作总数", null, "来自“本周执行表”的任务数量"],
  ["高优先级任务", null, "本周必须优先完成的动作"],
  ["已完成任务", null, "在“本周执行表”状态列更新"],
  ["进行中任务", null, "当前正在推进的动作"],
  ["待开始任务", null, "尚未执行的动作"],
  ["最低交付项", null, "来自“最低目标”的检查项"],
  ["已完成最低交付", null, "最低目标中状态为已完成的数量"],
  ["本周主题", "PTrade 入门", "用 PTrade 策略代码结构作为第一批内容切入口"],
  ["本周主线", "基础建设 + 首批内容", "先搭账号、SEO、资料、私域，再开始发布"],
  ["完整计划文档", "docs/lightquant-promotion-plan.md", "后续 90 天推广计划来源"],
];
overview.getRange("B5:B11").formulas = [
  ["=COUNTA('本周执行表'!A5:A14)"],
  ["=COUNTIF('本周执行表'!G5:G14,\"高\")"],
  ["=COUNTIF('本周执行表'!H5:H14,\"已完成\")"],
  ["=COUNTIF('本周执行表'!H5:H14,\"进行中\")"],
  ["=COUNTIF('本周执行表'!H5:H14,\"待开始\")"],
  ["=COUNTA('最低目标'!A5:A12)"],
  ["=COUNTIF('最低目标'!D5:D12,\"已完成\")"],
];
styleHeader(overview.getRange("A4:C4"));
styleBody(overview.getRange("A5:C14"));
overview.getRange("A5:A14").format = { font: { bold: true, color: colors.ink } };
overview.getRange("B5:B11").format = {
  fill: colors.blueLight,
  font: { bold: true, color: colors.headerDark },
  horizontalAlignment: "center",
  borders: { preset: "all", style: "thin", color: colors.border },
};
addStatusLegend(overview, "E4");
overview.getRange("E11:H14").merge(true);
overview.getRange("E11").values = [["固定合规声明"]];
overview.getRange("E12").values = [["LightQuant 输出内容仅用于量化策略学习、研究和回测参考，不构成任何投资建议或实盘交易依据。量化交易存在风险，策略代码在实盘前必须由用户自行理解、验证和复核。"]];
overview.getRange("E11:H11").format = {
  fill: colors.amberLight,
  font: { bold: true, color: colors.ink },
  horizontalAlignment: "center",
  borders: { preset: "all", style: "thin", color: colors.border },
};
overview.getRange("E12:H14").format = {
  fill: "#FFFBEB",
  font: { color: colors.ink },
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: colors.border },
};
overview.freezePanes.freezeRows(4);
setColumnWidths(overview, [20, 18, 48, 4, 16, 28, 18, 18]);

const tasks = addSheet("本周执行表");
styleTitle(tasks, "A1:K1", "第 1 周每日执行表", "执行时主要更新：状态、负责人、完成日期、链接或备注。");
const taskRows = [
  ["日期", "星期", "阶段目标", "你要执行的动作", "产出物", "完成标准", "优先级", "状态", "负责人", "完成日期", "备注"],
  [new Date("2026-06-23"), "周二", "搭基础入口", "提交 sitemap 到百度、Google、Bing；整理官网入口；建立推广数据表", "搜索平台提交记录、推广数据表", "3 个搜索平台完成提交；表格可记录曝光/点击/注册/进群", "高", "待开始", "", null, ""],
  [new Date("2026-06-23"), "周二", "统一账号定位", "统一账号昵称、头像、简介；开通/整理公众号、视频号、知乎、B站、小红书、CSDN、掘金", "账号矩阵清单", "至少 5 个账号完成基础信息", "高", "待开始", "", null, ""],
  [new Date("2026-06-24"), "周三", "准备引流资料", "制作《PTrade/聚宽/QMT API 差异表》《回测前检查清单》《双均线策略模板》", "3 份资料初版", "可以发给用户领取", "高", "待开始", "", null, ""],
  [new Date("2026-06-24"), "周三", "建私域入口", "建微信群/QQ群；写欢迎语、群规、免责声明；设置公众号关键词回复", "社群入口、关键词回复", "用户能通过关键词领取资料或进群", "高", "待开始", "", null, ""],
  [new Date("2026-06-25"), "周四", "准备首批内容", "写 3 篇文章大纲：PTrade 入门、AI 策略生成、聚宽转 PTrade", "3 篇内容大纲", "每篇有标题、结构、CTA、风险声明", "高", "待开始", "", null, ""],
  [new Date("2026-06-26"), "周五", "首批发布", "发布 1 篇公众号文章；同步到 CSDN/掘金；发 1 个知乎回答", "2-3 条公开内容", "至少 2 个平台有内容上线", "高", "待开始", "", null, ""],
  [new Date("2026-06-26"), "周五", "准备视频", "写 B站视频脚本：《5 分钟用 AI 生成 PTrade 双均线策略》", "1 个视频脚本", "可直接录屏", "中", "待开始", "", null, ""],
  [new Date("2026-06-27"), "周六", "视频和图文", "录制 1 条 B站视频；剪 2 条短视频；发 1 篇小红书图文", "视频、短视频、小红书笔记", "至少发布 1 条视频或 1 篇图文", "中", "待开始", "", null, ""],
  [new Date("2026-06-27"), "周六", "社区互动", "去聚宽、BigQuant、vn.py、掘金量化等社区回答问题", "社区回复记录", "至少回复 2-5 个问题", "中", "待开始", "", null, ""],
  [new Date("2026-06-28"), "周日", "周复盘", "统计曝光、点击、注册、进群、首任务；整理下周主题", "周复盘表", "明确下周要发什么、哪里有效", "高", "待开始", "", null, ""],
];
tasks.getRange("A4:K14").write(taskRows);
styleHeader(tasks.getRange("A4:K4"));
styleBody(tasks.getRange("A5:K14"));
tasks.getRange("A5:A14").setNumberFormat("yyyy-mm-dd");
tasks.getRange("J5:J14").setNumberFormat("yyyy-mm-dd");
tasks.getRange("G5:G14").format = { fill: colors.amberLight, font: { bold: true, color: colors.ink }, horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.border } };
tasks.getRange("H5:H14").format = { fill: colors.grayLight, font: { bold: true, color: colors.ink }, horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.border } };
addPriorityValidation(tasks, "G5:G14");
addStatusValidation(tasks, "H5:H14");
tasks.tables.add("A4:K14", true, "WeeklyExecutionTable");
tasks.freezePanes.freezeRows(4);
setColumnWidths(tasks, [13, 9, 16, 42, 28, 38, 10, 12, 14, 13, 24]);

const minimum = addSheet("最低目标");
styleTitle(minimum, "A1:F1", "本周最低完成目标", "把每一项变成可检查的交付物，完成后更新状态。");
const minimumRows = [
  ["类型", "最低目标", "交付物", "状态", "负责人", "备注"],
  ["搜索收录", "百度、Google、Bing 提交 sitemap", "提交截图或后台记录", "待开始", "", ""],
  ["账号矩阵", "至少完成 5 个平台账号基础信息", "账号矩阵清单", "待开始", "", ""],
  ["私域入口", "建好 1 个微信群或QQ群", "群二维码、欢迎语、群规", "待开始", "", ""],
  ["引流资料", "完成 3 份资料初版", "API 差异表、回测检查清单、双均线模板", "待开始", "", ""],
  ["内容发布", "至少发布 2 篇内容", "发布链接", "待开始", "", ""],
  ["视频准备", "完成 1 个 B站脚本、3 条短视频脚本", "脚本文档", "待开始", "", ""],
  ["社区动作", "至少回答 5 个问题", "回复链接或截图", "待开始", "", ""],
  ["数据记录", "建好推广数据表并开始记录", "数据表链接/文件", "待开始", "", ""],
];
minimum.getRange("A4:F12").write(minimumRows);
styleHeader(minimum.getRange("A4:F4"));
styleBody(minimum.getRange("A5:F12"));
minimum.getRange("D5:D12").format = { fill: colors.grayLight, font: { bold: true, color: colors.ink }, horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.border } };
addStatusValidation(minimum, "D5:D12");
minimum.tables.add("A4:F12", true, "MinimumGoalsTable");
minimum.freezePanes.freezeRows(4);
setColumnWidths(minimum, [16, 38, 34, 12, 14, 28]);

const content = addSheet("首批内容");
styleTitle(content, "A1:H1", "首批内容发布表", "先围绕 PTrade 入门打第一波内容，后续可以复制结构做聚宽转 PTrade、QMT 解析。");
const contentRows = [
  ["内容标题", "发布平台", "目的", "CTA", "推荐发布时间", "当前状态", "链接", "备注"],
  ["PTrade 策略代码入门：生命周期、context、下单函数", "官网、公众号、CSDN、掘金", "吸引 PTrade 新手", "上传代码解析", new Date("2026-06-26"), "待开始", "", ""],
  ["AI 量化策略生成工具怎么用：从自然语言到 PTrade 代码", "官网、公众号、知乎", "解释产品价值", "立即生成策略", new Date("2026-06-26"), "待开始", "", ""],
  ["聚宽 JoinQuant 策略转 PTrade：API 差异清单", "官网、知乎、社区", "抢迁移需求", "上传代码转换", new Date("2026-06-27"), "待开始", "", ""],
  ["5 分钟用 AI 生成一个 PTrade 双均线策略骨架", "B站、视频号、抖音", "做可视化演示", "领取模板/进群", new Date("2026-06-27"), "待开始", "", ""],
  ["量化策略代码看不懂？先看这 5 个模块", "小红书、公众号", "新手收藏传播", "领取检查清单", new Date("2026-06-27"), "待开始", "", ""],
];
content.getRange("A4:H9").write(contentRows);
styleHeader(content.getRange("A4:H4"));
styleBody(content.getRange("A5:H9"));
content.getRange("E5:E9").setNumberFormat("yyyy-mm-dd");
content.getRange("F5:F9").format = { fill: colors.grayLight, font: { bold: true, color: colors.ink }, horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.border } };
addStatusValidation(content, "F5:F9");
content.tables.add("A4:H9", true, "FirstContentTable");
content.freezePanes.freezeRows(4);
setColumnWidths(content, [42, 28, 22, 18, 14, 12, 30, 24]);

const review = addSheet("复盘指标");
styleTitle(review, "A1:E1", "每周复盘指标", "周日更新本周数值，用于判断哪个平台、哪个主题值得继续加码。");
const reviewRows = [
  ["指标", "记录方式", "本周数值", "数据来源/链接", "备注"],
  ["内容数量", "本周发布了几篇/几条", null, "", ""],
  ["曝光量", "各平台后台数据", null, "", ""],
  ["点击量", "官网访问、UTM 链接点击", null, "", ""],
  ["注册数", "官网注册用户", null, "", ""],
  ["首任务数", "完成策略生成/转换/解析的人数", null, "", ""],
  ["进群数", "微信群/QQ群新增人数", null, "", ""],
  ["高潜内容", "哪篇内容带来最多点击或咨询", null, "", ""],
  ["下周调整", "继续加码哪个主题，暂停哪个平台", null, "", ""],
];
review.getRange("A4:E12").write(reviewRows);
styleHeader(review.getRange("A4:E4"));
styleBody(review.getRange("A5:E12"));
review.getRange("C5:C12").format = { fill: "#FEFCE8", horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.border } };
review.tables.add("A4:E12", true, "WeeklyReviewTable");
review.freezePanes.freezeRows(4);
setColumnWidths(review, [18, 34, 14, 30, 32]);

const mainline = addSheet("本周主线");
styleTitle(mainline, "A1:D1", "本周主线", "本周不用追求全平台爆发，先把 PTrade 入门这条线跑通。");
const mainlineRows = [
  ["本周主题", "重点", "执行动作", "输出检查"],
  ["PTrade 入门", "用 PTrade 策略代码结构作为第一批内容切入口", "围绕 context、生命周期、行情数据、下单函数写内容", "用户能理解 LightQuant 可做策略生成和代码解析"],
  ["产品认知", "让用户知道 LightQuant 是 AI 量化策略代码助手", "所有账号简介和文章开头统一定位", "不把产品讲成荐股或收益工具"],
  ["私域承接", "用资料和交流群承接第一批用户", "设置资料领取、群欢迎语、关键词回复", "用户看完内容后有下一步动作"],
  ["合规表达", "不荐股、不承诺收益、不展示收益神话", "所有内容放风险声明，案例只讲代码和复核", "不使用稳赚、高胜率、自动赚钱等表达"],
];
mainline.getRange("A4:D8").write(mainlineRows);
styleHeader(mainline.getRange("A4:D4"));
styleBody(mainline.getRange("A5:D8"));
mainline.tables.add("A4:D8", true, "WeeklyMainlineTable");
mainline.freezePanes.freezeRows(4);
setColumnWidths(mainline, [18, 34, 42, 38]);

const compliance = addSheet("合规话术");
styleTitle(compliance, "A1:D1", "合规话术与禁用表达", "推广时围绕代码生成、代码解析、平台迁移，不围绕投资建议或收益承诺。");
const complianceRows = [
  ["类别", "禁用/可用", "内容/替代表达", "使用场景"],
  ["固定声明", "可用", "LightQuant 输出内容仅用于量化策略学习、研究和回测参考，不构成任何投资建议或实盘交易依据。量化交易存在风险，策略代码在实盘前必须由用户自行理解、验证和复核。", "官网、文章、视频简介、社群欢迎语"],
  ["收益承诺", "禁用", "AI 帮你赚钱、稳赚、高胜率策略、稳定收益、自动荐股、跟着买", "标题、封面、口播、评论区都不要用"],
  ["产品定位", "可用", "AI 帮你生成策略代码初稿；便于回测验证的策略框架；结构清晰、可复核的代码结果；代码解析、平台转换、研究辅助", "账号简介、文章 CTA、视频结尾"],
  ["社区互动", "可用", "这类代码迁移建议先核对平台 API、字段含义、下单函数和回测假设。可以用工具生成初稿，但实盘前需要人工复核。", "量化社区回答问题"],
  ["案例表达", "可用", "案例只展示策略结构、平台差异、代码复核点，不展示夸张收益截图。", "公众号、B站、小红书"],
];
compliance.getRange("A4:D9").write(complianceRows);
styleHeader(compliance.getRange("A4:D4"));
styleBody(compliance.getRange("A5:D9"));
compliance.getRange("B5:B9").format = {
  fill: colors.amberLight,
  font: { bold: true, color: colors.ink },
  horizontalAlignment: "center",
  borders: { preset: "all", style: "thin", color: colors.border },
};
compliance.tables.add("A4:D9", true, "ComplianceCopyTable");
compliance.freezePanes.freezeRows(4);
setColumnWidths(compliance, [16, 12, 70, 32]);

for (const sheetName of ["总览", "本周执行表", "最低目标", "首批内容", "复盘指标", "本周主线", "合规话术"]) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const used = sheet.getUsedRange();
  used.format.font.name = "Microsoft YaHei";
  used.format.font.size = 10;
  used.format.autofitRows();
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const inspectOverview = await workbook.inspect({
  kind: "table",
  range: "总览!A1:H14",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 12,
});
console.log("INSPECT_OVERVIEW");
console.log(inspectOverview.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log("FORMULA_ERRORS");
console.log(errors.ndjson);

for (const sheetName of ["总览", "本周执行表", "最低目标", "首批内容", "复盘指标", "本周主线", "合规话术"]) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const bytes = new Uint8Array(await preview.arrayBuffer());
  await fs.writeFile(path.join(previewDir, `${sheetName}.png`), bytes);
}

const output = await SpreadsheetFile.exportXlsx(workbook);
const outputPath = path.join(outputDir, "LightQuant-第1周推广执行表.xlsx");
await output.save(outputPath);
console.log(`OUTPUT=${outputPath}`);
console.log(`PREVIEWS=${previewDir}`);
