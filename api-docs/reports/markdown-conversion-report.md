# Markdown 转换报告

## 汇总

- 输入来源：36
- 输出 Markdown：197
- 来源状态：converted=7, split=28, alias=1, skipped_with_reason=0, failed=0
- 简单 GFM 表格：572
- 保留复杂 HTML 表格：56
- 围栏代码块：2553
- Markdown 图片引用：154
- 本地归档图片：7

## 平台与版本

- joinquant/web-help: 73 个 Markdown
- ptrade/guojin: 23 个 Markdown
- ptrade/shenwan: 87 个 Markdown
- qmt/builtin-python: 14 个 Markdown

PTrade 国金保持 primary，申万保持 supplementary；两版本位于独立目录，未合并同名接口。QMT 仅使用现有结构化 HTML，未读取或 OCR PDF。JoinQuant 的 strategy、market_data、factor、research_data、finance、faq 按来源文档和章节独立转换。

## JoinQuant 主文档去重

- main/api 清洗正文相似度：1.000000
- 判定：实质等价；api/rendered.html 为 canonical，main/rendered.html 作为 alias，不生成重复正文。
- canonical：api-docs/raw/joinquant/api/rendered.html
- alias：api-docs/raw/joinquant/main/rendered.html

## 转换警告

- complex_table_preserved_as_html: 17
- empty_table_removed: 1
- semantic_duplicate_similarity_1.000000: 1
- source_anchor_not_mapped: 26

## 失败

无失败来源。
