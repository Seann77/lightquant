---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202202.02.000
section_path:
  - 更新日志
  - PBOXQT1.0V202202.02.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202202-02-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202202-02-000"></a>

## PBOXQT1.0V202202.02.000

1.  [get\_price()](api-data-550d561d.md#get_price)、[get\_history()](api-data-550d561d.md#get_history) 新增支持获取期货数据；
2.  [get\_snapshot()](api-data-550d561d.md#get_snapshot) 新增返回 iopv(基金份额参考净值)字段；
3.  [handle\_data()](help-engine-192b4919.md#handle_data) 中 data 对象帮助描述由 SecurityUnitData 修改为 BarData，BarData 对象新增返回 dt(当前周期时间)、preclose(昨收盘价(仅日线返回))、high\_limit(涨停价(仅日线返回))、low\_limit(跌停价(仅日线返回))、unlimited(是否无涨跌停限制(仅日线返回))字段，字段描述详见接口说明；BarData 对象中 dt(当前周期时间)字段值由 UTC 时间修改为北京时间；
4.  [on\_trade\_response()](help-engine-192b4919.md#on_trade_response) 新增返回 withdraw\_no(撤单原委托号)、cancel\_info(废单原因)字段；返回字段值中 entrust\_no(委托编号)、withdraw\_no(撤单原委托号)统一转为 str 类型；
5.  [set\_parameters()](api-system-e3a203f0.md#set_parameters) 新增支持 individual\_data\_in\_dict([get\_individual\_entrust()](api-data-550d561d.md#get_individual_entrust)、[get\_individual\_transaction()](api-data-550d561d.md#get_individual_transaction) 获取逐笔数据 API 返回字典类型)、tick\_direction\_in\_dict([get\_tick\_direction()](api-data-550d561d.md#get_tick_direction) 获取分时成交数据 API 返回字典类型)参数；
6.  [set\_yesterday\_position()](api-system-e3a203f0.md#set_yesterday_position) 新增支持设置 ETF、LOF 类型的底仓；
7.  [margincash\_open()](api-credit-0e338551.md#margincash_open)、[marginsec\_open()](api-credit-0e338551.md#marginsec_open) 新增 cash\_group(两融头寸性质)入参；
8.  [order\_market()](api-stock-291dd586.md#order_market) 和 [margin\_trade()](api-credit-0e338551.md#margin_trade) 做市价委托上证股票时，limit\_price(保护限价)为必传字段。
9.  [get\_index\_stocks()](api-data-776ee715.md#get_index_stocks) 由支持多个指数查询修改为仅支持单个指数查询
10.  由于 Keras 库 2.3.1 版本与 TensorFlow 库不兼容，需要降版本：Keras==2.3.1-->Keras==2.2.4。
11.  新增 [get\_frequency()](api-system-74e7aaca.md#get_frequency) 获取当前业务代码的周期；
12.  新增 [get\_underlying\_code()](api-data-776ee715.md#get_underlying_code) 获取代码关联的代码；
13.  新增 get\_hks\_list() 获取港股通代码；
14.  新增 get\_hks\_price\_gap() 港股通价差查询；
15.  新增 get\_hks\_unit\_amount() 获取港股通标的委托单位数量；
16.  新增 hks\_order() 港股通买卖；
17.  新增 hks\_odd\_lot\_order() 港股通零股卖出；
