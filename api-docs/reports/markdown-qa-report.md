# Markdown QA 报告

## 结论

- 自动 QA：通过
- 人工抽样：完成并通过
- 36 个来源状态：split=28, converted=7, alias=1
- 是否可进入“API 索引建立”阶段：**是**

无阻塞问题。

## Raw 哈希与覆盖

- raw 基线文件：94
- raw 当前文件：94
- 哈希变化：0
- 来源清单：expected=36, handled=36, missing=0, unexpected=0

## Markdown 完整性

- 输出文件：197
- UTF-8 错误：0
- 替换字符：0
- 乱码标记：0
- 空正文：0
- 未闭合代码围栏：0
- Front Matter 错误：0
- slug 冲突：0
- 明显导航残留：0
- 完全重复正文：0

## 代码与表格

- 多行代码块：1219
- 保留缩进的代码块：1020
- GFM 表格：572
- GFM 列数错误：0
- 保留 HTML 表格：56
- HTML 表格结构错误：0

## 链接、图片与追溯

- 缺失相对图片：0
- 失效 Markdown 内部链接：0
- 来源追溯错误：0
- PTrade 国金/申万隔离：通过
- JoinQuant 类别：factor, faq, finance, market_data, research_data, strategy_api
- JoinQuant main/api：main=alias, canonical=api-docs/raw/joinquant/api/rendered.html

## 典型 API 搜索

| 平台 | 关键词 | 结果 |
|---|---|---|
| ptrade | get_history | 找到 |
| ptrade | get_fundamentals | 找到 |
| ptrade | order | 找到 |
| qmt | get_market_data_ex | 找到 |
| qmt | passorder | 找到 |
| joinquant | initialize | 找到 |
| joinquant | run_daily | 找到 |
| joinquant | get_price | 找到 |
| joinquant | order_target | 找到 |
| joinquant | get_fundamentals | 找到 |

## 人工可读性抽样

| 抽样项 | 结果 | 证据 |
|---|---|---|
| PTrade国金主API | 通过 | get_history：标题、签名、使用场景、限制、参数和来源锚点与 ptradeapi.html 对应。 |
| PTrade国金财务数据 | 通过 | valuation：get_fundamentals 签名、date 说明、限制和字段表保持原文。 |
| PTrade申万数据接口 | 通过 | get_history：独立保存在 shenwan 目录，签名和首个代码块逐字匹配。 |
| PTrade申万交易接口 | 通过 | order_tick：参数、默认值、返回值及示例代码与申万原文匹配。 |
| QMT行情API | 通过 | get_market_data_ex：运行限制、原型、参数表和原型代码逐字匹配。 |
| QMT下单API | 通过 | passorder：调用方法、参数说明、注意事项和代码块逐字匹配。 |
| JoinQuant策略API | 通过 | initialize：原 label 提升为 H3，签名、参数、注意、返回与示例保持原文。 |
| JoinQuant Stock | 通过 | get_fundamentals：保存在 Stock 来源章节，签名逐字匹配，参数与链接保留。 |
| JoinQuant JQData | 通过 | get_query_count：签名、返回字段、简单表格、图片和示例逐字对应。 |
| JoinQuant技术指标 | 通过 | MACD：函数签名、参数、返回类型及示例内容与原文一致。 |
| 简单表格 | 通过 | QMT 行情字段表保持 3 列：字段名、数据类型、解释。 |
| 复杂表格 | 通过 | JQData rowspan/colspan 表保留为 HTML；原文与输出均为 28 行、72 个单元格。 |
| 长Python代码示例 | 通过 | QMT 完整示例抽样 25023 字符、33 行，忽略围栏终止换行后逐字匹配，缩进保留。 |

人工抽样核对标题、参数、返回值、代码缩进、表格列对应、导航清理和来源 Front Matter。备注：所有抽样均检查标题、正文、参数/返回、代码、表格、导航残留和 Front Matter 来源追溯。；JQData 原文中一个带引号的畸形 Markdown 风格链接保持原样，并由 QA warning 登记。

## 疑似遗漏与人工确认

- 1 malformed Markdown-style links already present as source text were preserved
