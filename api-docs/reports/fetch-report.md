# API 文档抓取报告

- captured_at: 2026-07-18T11:37:23.247Z
- output_root: /Users/a1-6/Documents/Codex-Restored-Projects/量化平台策略生成/api-docs
- success_pages: 36
- failed_pages: 0
- incomplete_pages: 0

## 在线入口状态

- PTrade 国金在线入口: {"ok":false,"status":502,"final_url":"http://180.169.107.9:7766/hub/help/api?weworkcfmcode","note":"502 按规则记录但不阻塞"}
- PTrade 申万入口: {"ok":true,"status":200,"final_url":"http://101.71.132.53:9091/qthelp/help/introduce.html","redirects":[{"url":"http://101.71.132.53:9091/hub/help/api","status":302,"location":"http://101.71.132.53:9091/qthelp/help/introduce.html"},{"url":"http://101.71.132.53:9091/qthelp/help/introduce.html","status":200,"location":null}],"note":""}

## 失败页面

无。

## 已保存页面统计

| platform | variant | document_type | title | method | status | headings | code | tables | images | complete | file |
|---|---|---|---|---|---:|---:|---:|---:|---:|---|---|
| ptrade | guojin | strategy_api | 帮助 | static |  | 1050 | 400 | 17 | 7 | yes | raw/ptrade/guojin/ptradeapi.html |
| ptrade | guojin | finance | 财务数据 | static |  | 37 | 27 | 9 | 0 | yes | raw/ptrade/guojin/财务数据api.html |
| ptrade | guojin | market_data | 行业概念分类 | static |  | 7 | 1 | 4 | 0 | yes | raw/ptrade/guojin/行业概念分类.html |
| qmt | builtin-python | strategy_api | 迅投知识库 - 内置Python API文档全集 | static |  | 366 | 2578 | 173 | 71 | yes | raw/qmt/innerapi-combined.html |
| ptrade | shenwan | guide | 使用说明 | static | 200 | 12 | 0 | 0 | 6 | yes | raw/ptrade/shenwan/01_help_introduce.html |
| ptrade | shenwan | guide | 开始写策略 | static | 200 | 18 | 9 | 1 | 1 | yes | raw/ptrade/shenwan/02_help_quickstart.html |
| ptrade | shenwan | guide | 策略引擎简介 | static | 200 | 94 | 590 | 41 | 2 | yes | raw/ptrade/shenwan/03_help_engine.html |
| ptrade | shenwan | guide | 支持的三方库 | static | 200 | 6 | 398 | 3 | 1 | yes | raw/ptrade/shenwan/04_help_third.html |
| ptrade | shenwan | guide | 策略绩效评价说明 | static | 200 | 23 | 18 | 0 | 1 | yes | raw/ptrade/shenwan/05_help_backtest_results.html |
| ptrade | shenwan | api_index | 接口列表 | static | 200 | 3 | 0 | 1 | 1 | yes | raw/ptrade/shenwan/06_api_list.html |
| ptrade | shenwan | strategy_api | 系统接口 | static | 200 | 216 | 243 | 0 | 1 | yes | raw/ptrade/shenwan/07_api_system.html |
| ptrade | shenwan | market_data | 数据接口 | static | 200 | 252 | 393 | 3 | 2 | yes | raw/ptrade/shenwan/08_api_data.html |
| ptrade | shenwan | strategy_api | 业务公共接口 | static | 200 | 148 | 152 | 0 | 1 | yes | raw/ptrade/shenwan/09_api_trade.html |
| ptrade | shenwan | strategy_api | 现货专用接口 | static | 200 | 140 | 195 | 0 | 1 | yes | raw/ptrade/shenwan/10_api_stock.html |
| ptrade | shenwan | strategy_api | 融资融券专用接口 | static | 200 | 160 | 342 | 5 | 1 | yes | raw/ptrade/shenwan/11_api_credit.html |
| ptrade | shenwan | strategy_api | 期货专用接口 | static | 200 | 76 | 133 | 0 | 1 | yes | raw/ptrade/shenwan/12_api_future.html |
| ptrade | shenwan | strategy_api | 港股通专用接口 | static | 200 | 75 | 118 | 2 | 1 | yes | raw/ptrade/shenwan/13_api_hks.html |
| ptrade | shenwan | factor | 技术指标接口 | static | 200 | 52 | 80 | 0 | 1 | yes | raw/ptrade/shenwan/14_api_factor.html |
| ptrade | shenwan | guide | 策略示例 | static | 200 | 10 | 5 | 0 | 1 | yes | raw/ptrade/shenwan/15_demo.html |
| ptrade | shenwan | faq | 常见问题 | static | 200 | 66 | 2 | 0 | 7 | yes | raw/ptrade/shenwan/16_qa.html |
| ptrade | shenwan | changelog | 更新日志 | static | 200 | 34 | 0 | 0 | 1 | yes | raw/ptrade/shenwan/17_changelog.html |
| joinquant | web-help | strategy_api | API新 - JoinQuant | rendered | 200 | 101 | 320 | 22 | 29 | yes | raw/joinquant/main/rendered.html |
| joinquant | web-help | strategy_api | API新 - JoinQuant | rendered | 200 | 101 | 320 | 22 | 29 | yes | raw/joinquant/api/rendered.html |
| joinquant | web-help | market_data | 股票数据 - JoinQuant | rendered | 200 | 77 | 118 | 72 | 1 | yes | raw/joinquant/Stock/rendered.html |
| joinquant | web-help | market_data | 场内基金数据 - JoinQuant | rendered | 200 | 10 | 16 | 6 | 1 | yes | raw/joinquant/fund/rendered.html |
| joinquant | web-help | market_data | 期货数据 - JoinQuant | rendered | 200 | 34 | 27 | 24 | 1 | yes | raw/joinquant/Future/rendered.html |
| joinquant | web-help | market_data | 指数数据 - JoinQuant | rendered | 200 | 11 | 25 | 4 | 1 | yes | raw/joinquant/index/rendered.html |
| joinquant | web-help | market_data | 行业概念数据 - JoinQuant | rendered | 200 | 12 | 2 | 7 | 1 | yes | raw/joinquant/plateData/rendered.html |
| joinquant | web-help | factor | 因子分析 - JoinQuant | rendered | 200 | 89 | 81 | 7 | 1 | yes | raw/joinquant/factor/rendered.html |
| joinquant | web-help | factor | 因子库 - JoinQuant | rendered | 200 | 22 | 6 | 10 | 1 | yes | raw/joinquant/factor_values/rendered.html |
| joinquant | web-help | factor | 技术分析指标 - JoinQuant | rendered | 200 | 113 | 199 | 0 | 1 | yes | raw/joinquant/technicalanalysis/rendered.html |
| joinquant | web-help | factor | Alpha101 - JoinQuant | rendered | 200 | 108 | 87 | 0 | 1 | yes | raw/joinquant/Alpha101/rendered.html |
| joinquant | web-help | factor | Alpha191 - JoinQuant | rendered | 200 | 197 | 197 | 0 | 1 | yes | raw/joinquant/Alpha191/rendered.html |
| joinquant | web-help | research_data | JQData使用说明 - JoinQuant | rendered | 200 | 100 | 426 | 169 | 15 | yes | raw/joinquant/JQData/rendered.html |
| joinquant | web-help | finance | 宏观经济数据 - JoinQuant | rendered | 200 | 132 | 3 | 115 | 1 | yes | raw/joinquant/macroData/rendered.html |
| joinquant | web-help | faq | 常见问题 - JoinQuant | rendered | 200 | 73 | 30 | 1 | 22 | yes | raw/joinquant/faq/rendered.html |

## 疑似不完整页面

无。

## 重复页面

未发现 SHA-256 完全重复页面。

## JoinQuant 主页面发现的独立文档页

- https://www.joinquant.com/help/api/help?name=Alpha101
- https://www.joinquant.com/help/api/help?name=Alpha191
- https://www.joinquant.com/help/api/help?name=Future
- https://www.joinquant.com/help/api/help?name=JQData
- https://www.joinquant.com/help/api/help?name=Stock
- https://www.joinquant.com/help/api/help?name=api
- https://www.joinquant.com/help/api/help?name=factor
- https://www.joinquant.com/help/api/help?name=factor_values
- https://www.joinquant.com/help/api/help?name=faq
- https://www.joinquant.com/help/api/help?name=fund
- https://www.joinquant.com/help/api/help?name=index
- https://www.joinquant.com/help/api/help?name=macroData
- https://www.joinquant.com/help/api/help?name=plateData
- https://www.joinquant.com/help/api/help?name=technicalanalysis

## JoinQuant 清单外独立文档页

未发现清单外同路径文档链接。

