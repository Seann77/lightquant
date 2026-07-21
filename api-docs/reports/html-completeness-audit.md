# HTML 完整性复查报告

- audited_at: 2026-07-18T11:50:36.742796+00:00
- suspicious_count: 1

## 总结

- PTrade 国金：3/3 个保存 HTML 与原始 HTML 字节一致。
- PTrade 申万：17/17 个保存 HTML 与对应 PDF 做了文本覆盖比对；最低 identifier 覆盖率 0.4545，最低 PDF 行级短语覆盖率 0.0852。
- QMT：保存 HTML 与原始 innerapi-combined.html 字节一致=True；PDF 页数 202；PDF->HTML identifier 覆盖率 0.9862，行级短语覆盖率 0.9694。
- JoinQuant：15/15 个 rendered HTML 已检查；最短 rendered 正文长度 7543。

## 可疑项

- PTrade 申万 接口列表 PDF->HTML 覆盖率偏低 (identifier=0.7117, line=0.2995)

## PTrade 申万 PDF 对 HTML 覆盖

| title | pdf_pages | identifier_coverage | line_coverage | text_window_coverage | pdf_text | html_text | saved_html |
|---|---:|---:|---:|---:|---:|---:|---|
| 使用说明 | 6 | 0.4545 | 0.6 | 0.2126 | 2017 | 1778 | raw/ptrade/shenwan/01_help_introduce.html |
| 开始写策略 | 7 | 0.9189 | 0.3169 | 0.1758 | 4280 | 3996 | raw/ptrade/shenwan/02_help_quickstart.html |
| 策略引擎简介 | 45 | 0.9712 | 0.5033 | 0.3347 | 24752 | 21523 | raw/ptrade/shenwan/03_help_engine.html |
| 支持的三方库 | 81 | 0.5304 | 0.615 | 0.0214 | 58935 | 51461 | raw/ptrade/shenwan/04_help_third.html |
| 策略绩效评价说明 | 9 | 0.9077 | 0.7188 | 0.187 | 3779 | 3283 | raw/ptrade/shenwan/05_help_backtest_results.html |
| 接口列表 | 20 | 0.7117 | 0.2995 | 0.3172 | 15127 | 13683 | raw/ptrade/shenwan/06_api_list.html |
| 系统接口 | 42 | 0.9696 | 0.5078 | 0.2249 | 22316 | 19602 | raw/ptrade/shenwan/07_api_system.html |
| 数据接口 | 78 | 0.9851 | 0.5229 | 0.1507 | 54468 | 49375 | raw/ptrade/shenwan/08_api_data.html |
| 业务公共接口 | 36 | 0.976 | 0.2834 | 0.1874 | 21293 | 18969 | raw/ptrade/shenwan/09_api_trade.html |
| 现货专用接口 | 32 | 0.9565 | 0.3952 | 0.1756 | 18895 | 16831 | raw/ptrade/shenwan/10_api_stock.html |
| 融资融券专用接口 | 34 | 0.952 | 0.5331 | 0.3046 | 17443 | 15175 | raw/ptrade/shenwan/11_api_credit.html |
| 期货专用接口 | 14 | 0.8868 | 0.609 | 0.2765 | 6395 | 5650 | raw/ptrade/shenwan/12_api_future.html |
| 港股通专用接口 | 18 | 0.9368 | 0.5727 | 0.1608 | 11724 | 10699 | raw/ptrade/shenwan/13_api_hks.html |
| 技术指标接口 | 10 | 0.8909 | 0.5867 | 0.1727 | 4012 | 3551 | raw/ptrade/shenwan/14_api_factor.html |
| 策略示例 | 6 | 0.9474 | 0.0852 | 0.0859 | 5418 | 5284 | raw/ptrade/shenwan/15_demo.html |
| 常见问题 | 14 | 0.8269 | 0.8373 | 0.2835 | 5739 | 5112 | raw/ptrade/shenwan/16_qa.html |
| 更新日志 | 12 | 0.9831 | 0.2049 | 0.2436 | 12857 | 11775 | raw/ptrade/shenwan/17_changelog.html |

## JoinQuant raw/rendered 对比

| slug | title | raw_text | rendered_text | ratio | headings | code | tables | images |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| main | API新 - JoinQuant | 0 | 151050 | 151050.0 | 101 | 594 | 22 | 29 |
| api | API新 - JoinQuant | 0 | 151050 | 151050.0 | 101 | 594 | 22 | 29 |
| Stock | 股票数据 - JoinQuant | 0 | 188630 | 188630.0 | 77 | 233 | 72 | 1 |
| fund | 场内基金数据 - JoinQuant | 0 | 15496 | 15496.0 | 10 | 28 | 6 | 1 |
| Future | 期货数据 - JoinQuant | 0 | 27104 | 27104.0 | 34 | 48 | 24 | 1 |
| index | 指数数据 - JoinQuant | 0 | 7543 | 7543.0 | 11 | 40 | 4 | 1 |
| plateData | 行业概念数据 - JoinQuant | 0 | 35410 | 35410.0 | 12 | 3 | 7 | 1 |
| factor | 因子分析 - JoinQuant | 0 | 30351 | 30351.0 | 89 | 157 | 7 | 1 |
| factor_values | 因子库 - JoinQuant | 0 | 19038 | 19038.0 | 22 | 11 | 10 | 1 |
| technicalanalysis | 技术分析指标 - JoinQuant | 0 | 121187 | 121187.0 | 113 | 398 | 0 | 1 |
| Alpha101 | Alpha101 - JoinQuant | 0 | 27620 | 27620.0 | 108 | 171 | 0 | 1 |
| Alpha191 | Alpha191 - JoinQuant | 0 | 48747 | 48747.0 | 197 | 391 | 0 | 1 |
| JQData | JQData使用说明 - JoinQuant | 0 | 400945 | 400945.0 | 100 | 849 | 169 | 15 |
| macroData | 宏观经济数据 - JoinQuant | 0 | 97108 | 97108.0 | 132 | 6 | 115 | 1 |
| faq | 常见问题 - JoinQuant | 0 | 18017 | 18017.0 | 73 | 43 | 1 | 22 |

## 资源链接说明

- PTrade 国金本地 HTML 的配套 `*_files` 目录已随 raw 目录复制，本地图片/CSS/JS 可在归档内找到。
- PTrade 申万、QMT、JoinQuant 的 HTML 保留原页面资源引用；远程 CDN/站点资源未镜像为本地文件，避免越过本阶段抓取边界。
- 资源链接疑点的逐页明细见 `html-completeness-audit.json`。

