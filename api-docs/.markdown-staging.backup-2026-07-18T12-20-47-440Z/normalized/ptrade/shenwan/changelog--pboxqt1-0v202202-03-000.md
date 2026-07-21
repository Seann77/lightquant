---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202202.03.000
section_path:
  - 更新日志
  - PBOXQT1.0V202202.03.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202202-03-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202202-03-000"></a>

## PBOXQT1.0V202202.03.000

1.  [get\_user\_name()](api-trade-ddb81b32.md#get_user_name) 新增支持 login\_account(返回当前交易类型对应账号)入参；
2.  [debt\_to\_stock\_order()](api-trade-74a4b542.md#debt_to_stock_order) 债转股委托新增支持在两融交易中调用；
3.  [get\_instruments()](api-future-c200885c.md#get_instruments) 新增返回 changepct\_limit (每日涨跌幅度)、littlest\_changeunit (最小变动价位)字段；
4.  [order\_market()](api-stock-291dd586.md#order_market) 和 [margin\_trade()](api-credit-0e338551.md#margin_trade) 做市价委托上证股票时，limit\_price(保护限价)为必传字段；
5.  [send\_email()](api-system-74e7aaca.md#send_email) 单个交易中每分钟调用次数做限制，一分钟最多发送一次；
6.  新增三方库：pykalman==0.9.5
7.  新增 [get\_all\_positions()](api-trade-247439a3.md#get_all_positions) 获取全部持仓；
8.  新增 [get\_lucky\_info()](api-trade-247439a3.md#get_lucky_info) 获取历史中签信息；
9.  新增 [get\_future\_main\_code()](api-data-776ee715.md#get_dominant_contract) 获取主力合约代码；
