---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202201.01.000
section_path:
  - 更新日志
  - PBOXQT1.0V202201.01.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202201-01-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202201-01-000"></a>

## PBOXQT1.0V202201.01.000

1.  修复委托状态类型不一致问题，[get\_orders()](api-trade-247439a3.md#get_orders)、[get\_all\_orders()](api-trade-247439a3.md#get_all_orders) 以及 [Order对象](help-engine-19502d4e.md#Order) 对象中的委托状态字段数据类型从 int 统一为 str；
2.  新增 [get\_trade\_name()](api-system-74e7aaca.md#get_trade_name) 获取交易名称；
3.  [tick\_data](help-engine-192b4919.md#tick_data) 中可调用接口完善；
4.  研究中 [get\_stock\_name()](api-data-776ee715.md#get_stock_name)、[get\_stock\_info()](api-data-776ee715.md#get_stock_info) 新增支持获取可转债、ETF、LOF 品种；
5.  [get\_history()](api-data-550d561d.md#get_history) 新增 fill(填充类型)入参；
6.  [get\_price()](api-data-550d561d.md#get_price)、[get\_history()](api-data-550d561d.md#get_history) 新增支持：5 分钟(5m)、15 分钟(15m)、30 分钟(30m)、60 分钟(60m)、120 分钟(120m)频率行情获取；
