---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202301.03.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202301.03.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202301-03-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202301-03-000"></a>

## PTrade1.0-QTV202301.03.000

1.  弃用 get\_individual\_transcation()；
2.  弃用 get\_margin\_assert()；
3.  [check\_limit()](http://101.71.132.53:9091/qthelp/api/system.html#check_limit) 新增支持在研究和回测模块使用；
4.  [ipo\_stocks\_order()](api-stock-291dd586.md#ipo_stocks_order) 入参 market\_type 修改为 submarket\_type；
5.  [get\_enslo\_security\_info()](api-credit-7fbe2e74.md#get_enslo_security_info) 出参 market\_type 修改为 exchange\_type；
6.  [get\_etf\_info()](api-stock-19b8a1f5.md#get_etf_info) 返回参数 pre\_cash\_componet 修改为 pre\_cash\_component；
7.  [get\_fundamentals()](api-data-3929251f.md#get_fundamentals) 入参 date(查询日期) 新增支持 datetime.date 类型、新增支持 is\_dataframe(是否返回 DataFrame 类型) 入参、弃用 date\_type 入参；
8.  get\_hks\_unit\_amount() 入参 entrust\_type 修改为 trade\_type；
9.  [set\_parameters()](api-system-e3a203f0.md#set_parameters) 不再支持 individual\_data\_in\_dict、tick\_direction\_in\_dict 入参；
10.  [get\_individual\_entrust()](api-data-550d561d.md#get_individual_entrust)、[get\_individual\_transaction()](api-data-550d561d.md#get_individual_transaction) 和 [get\_tick\_direction()](api-data-550d561d.md#get_tick_direction) 新增支持 is\_dict(是否返回字典类型数据)入参；
11.  [get\_margin\_contractreal()](api-credit-7fbe2e74.md#get_margin_contractreal) 出参 market\_type 修改为 exchange\_type；
12.  [get\_gear\_price()](api-data-550d561d.md#get_gear_price) 不再支持在回测中调用；
13.  [get\_stock\_status()](api-data-776ee715.md#get_stock_status) 入参 query\_type(查询类型) 新增支持查询 DELISTING\_SORTING(是否退市整理期)类型；
14.  [get\_trades()](api-trade-247439a3.md#get_trades) 在期货回测场景下新增返回开平仓类型字段；
15.  新增 [filter\_stock\_by\_status()](api-system-74e7aaca.md#filter_stock_by_status) 过滤指定状态的股票代码；
16.  新增 [get\_current\_kline\_count()](api-system-74e7aaca.md#get_current_kline_count) 获取股票业务当前时间的分钟 bar 数量；
17.  新增 [get\_trading\_day\_by\_date()](api-data-44c9a18f.md#get_trading_day_by_date) 按日期获取指定交易日；
18.  股票 [Position](help-engine-19502d4e.md#Position) 对象展示字段新增 today\_amount(今日开仓数量)；
19.  新增三方库：walrus==0.9.3，gqdata==0.1.5，mplfinance==0.12.10b0
20.  新增支持 Python3.11 版本，可通过终端右上角选择 Python 版本；
21.  由于 Pandas 库 0.25.0 版本后不再支持 Panel 类型，在 Python3.11 版本环境中 [get\_fundamentals()](api-data-3929251f.md#get_fundamentals) 按年份查询模式、[get\_history()](api-data-550d561d.md#get_history)、[get\_individual\_entrust()](api-data-550d561d.md#get_individual_entrust)、[get\_individual\_transaction()](api-data-550d561d.md#get_individual_transaction) 和 [get\_price()](api-data-550d561d.md#get_price) 默认返回 DataFrame 类型；
