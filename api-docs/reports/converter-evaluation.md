# 转换器评估报告

## 候选方案

- 主候选：Cheerio 1.1.2 + Turndown 7.2.1 + turndown-plugin-gfm 1.0.2。
- 对照候选：Pandoc（仅在本机已安装时执行）。
- 备用候选：rehype-remark；本次样本未出现必须引入第二套主流程的结构，因此未启用。

## 四个样本结果

| 样本 | 输出文件 | 代码块 | GFM表格 | 保留HTML表格 | 结果 |
|---|---:|---:|---:|---:|---|
| ptrade/guojin/ptradeapi | 10 | 394 | 7 | 10 | 通过 |
| qmt/builtin-python/innerapi-combined | 14 | 305 | 173 | 0 | 通过 |
| joinquant/web-help/api | 8 | 257 | 20 | 0 | 通过 |
| joinquant/web-help/JQData | 18 | 416 | 99 | 45 | 通过 |

样本检查覆盖正文提取、导航清除、标题、代码围栏与缩进、表格、中文、链接和非空输出。全部自动样本检查通过。

## Turndown 方案评估

优点：转换行为稳定、ATX 标题和 CommonMark 列表可控，GFM 插件能处理简单二维表格，适合通过自定义规则保护代码和复杂表格。缺点：默认规则不了解平台正文边界、Shiki/VitePress 代码包装、跨文件锚点和 rowspan/colspan，需要项目适配层。

## Pandoc 对照

本机未安装 Pandoc，未执行 Pandoc 对照；按任务要求不安装系统级工具，此项不阻塞主流程。

## 最终选型与自定义规则

最终选用 Cheerio + Turndown + turndown-plugin-gfm。适配层负责平台正文选择器、交互噪声清理、稳定标题拆分、代码原文保护和语言识别、复杂表格 HTML 回退、链接与图片重写、Front Matter、稳定 slug、JoinQuant 去重和 QA。

已知缺陷：原始页面中无法映射到归档章节的锚点会回退到原始来源 URL 并记 warning；远程图片保留完整 URL，不伪造本地资源；疑似源代码错误保持原文。

## 批量执行结论

批量执行结论：**通过**。样本输出适合按相同规则批量执行，并适合作为后续 API 索引的 Markdown 输入。
