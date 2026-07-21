# API 事实索引构建报告

## 索引方案

使用 YAML Front Matter、Markdown 标题、围栏代码、GFM/HTML 表格与平台专用规则进行确定性提取。只有正式标题、签名、定义表或明确回调证据可生成 symbol。

## 输出文件

- index/documents.jsonl
- index/symbols.jsonl
- index/chunks.jsonl
- index/aliases.jsonl
- index/conflicts.jsonl
- index/platform-resolution.json
- index/schemas/*.schema.json

## 阶段统计

- 构建时间：2026-07-18T13:06:01.421Z
- 输入来源：36
- canonical 文档：197
- 符号：1168
- 文本块：1451
- 别名：391
- PTrade 差异记录：174
- 待人工复核符号：1

## 平台规则

- joinquant/web-help: 73 个文档
- ptrade/guojin: 23 个文档
- ptrade/shenwan: 87 个文档
- qmt/builtin-python: 14 个文档
- PTrade 国金 resolution_priority=100；申万=50，两版不合并。
- JoinQuant main 仅为 api 的文档别名。
- QMT 仅索引 builtin-python 正式定义，排除示例页偶然调用与 VBA。

## 可重复运行

相同输入使用稳定短哈希 ID；QA 会执行双 staging 构建并逐文件比较。

## 警告与失败

- 构建失败：0
- npm audit：离线工具依赖树有 2 个 moderate 提示，未强制改写锁定版本。
- 未生成 embedding，未接入应用，未建立跨平台映射。
