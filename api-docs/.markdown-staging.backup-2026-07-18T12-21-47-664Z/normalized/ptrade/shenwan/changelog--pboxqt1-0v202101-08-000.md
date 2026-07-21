---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202101.08.000
section_path:
  - 更新日志
  - PBOXQT1.0V202101.08.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202101-08-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202101-08-000"></a>

## PBOXQT1.0V202101.08.000

1.  [initialize](help-engine-192b4919.md#initialize) 对部分 API 接口调用进行限制，仅 [initialize](help-engine-192b4919.md#initialize) 可调用接口说明中的 API 可在 initialize 函数内使用；
2.  [before\_trading\_start](help-engine-192b4919.md#before_trading_start) 和 [after\_trading\_end](help-engine-192b4919.md#after_trading_end) 对两融委托 API 接口调用进行限制；
3.  修复仅单笔成交订单时调用 get\_trades() 返回格式有误问题；
4.  修复交易场景中获取当日 K 线 14:58、14:59 分价格为 0 问题；
5.  [send\_email()](api-system-74e7aaca.md#send_email) 发送邮件信息新增 path(附件路径)、subject(邮件主题)入参；
6.  新增 [get\_cb\_list()](api-data-776ee715.md#get_cb_list) 获取可转债列表；
7.  新增 [get\_deliver()](api-trade-247439a3.md#get_deliver) 获取历史交割单信息；
8.  新增 [get\_fundjour()](api-trade-247439a3.md#get_fundjour) 获取历史资金流水信息；
9.  新增 [get\_research\_path()](api-system-74e7aaca.md#get_research_path) 获取研究路径；
10.  [get\_market\_detail()](api-data-776ee715.md#get_market_detail) 新增支持在回测、交易场景中调用；
