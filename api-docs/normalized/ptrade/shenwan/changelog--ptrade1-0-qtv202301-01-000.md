---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202301.01.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202301.01.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202301-01-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202301-01-000"></a>

## PTrade1.0-QTV202301.01.000

1.  委托流程调整，交易模式中非交易时间段内调用两融、盘后固定价等 API 产生的委托直接发送柜台进行处理；
2.  [Order对象](help-engine-19502d4e.md#Order) 对象展示字段新增 cancel\_entrust\_no(撤单委托编号)；
3.  期货 [Position](help-engine-19502d4e.md#Position) 对象去除 margin\_rate(保证金比例)字段，增加 margin(持仓保证金)字段；
4.  [run\_interval()](api-system-392b21bd.md#run_interval) 入参 seconds(最小执行周期)由最小 3s 修改为最小 0.1s 限制；
5.  [get\_trades()](api-trade-247439a3.md#get_trades) 返回数据中的委托编号字段数据类型统一由 int 修改为 str，成交时间字段格式统一为 YYYY-mm-dd HH:MM:SS；
6.  [order\_market()](api-stock-291dd586.md#order_market) 新增返回 order\_id(Order 订单编号)字段；
7.  [margincash\_close()](api-credit-0e338551.md#margincash_close)、[marginsec\_close()](api-credit-0e338551.md#marginsec_close) 新增支持 market\_type(市价委托类型)入参；
8.  [get\_price()](api-data-550d561d.md#get_price)、[get\_history()](api-data-550d561d.md#get_history) 新增支持 is\_dict(是否返回字典类型数据入参)；
9.  新增 [get\_margin\_asset()](api-credit-7fbe2e74.md#get_margin_asset) 信用资产查询，后续版本将弃用 get\_margin\_assert()；
10.  新增 [get\_individual\_transaction()](api-data-550d561d.md#get_individual_transaction) 获取逐笔成交行情，后续版本将弃用 get\_individual\_transcation()；
11.  新增 [get\_reits\_list()](api-data-776ee715.md#get_reits_list) 获取基础设施公募 REITs 基金代码列表；
