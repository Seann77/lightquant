---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202202.00.000
section_path:
  - 更新日志
  - PBOXQT1.0V202202.00.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202202-00-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202202-00-000"></a>

## PBOXQT1.0V202202.00.000

1.  [log](api-system-74e7aaca.md#log) 新增支持 DEBUG 级别日志记录；
2.  [get\_price()](api-data-550d561d.md#get_price) 、[get\_history()](api-data-550d561d.md#get_history) 新增返回 preclose(昨收盘价)、high\_limit(涨停价)、low\_limit(跌停价)、unlimited(是否无涨跌停限制)字段；
3.  [get\_snapshot()](api-data-550d561d.md#get_snapshot) 新增返回 total\_bidqty(委买量)、total\_offerqty(委卖量)、total\_bid\_turnover(委买金额)、total\_offer\_turnover(委卖金额)字段；
4.  [on\_trade\_response()](help-engine-192b4919.md#on_trade_response) 新增返回 order\_id(Order 订单编号)字段；
5.  当接到策略外交易产生的主推时(需券商配置默认不推送)，由于没有对应的 Order 对象，[on\_order\_response()](help-engine-192b4919.md#on_order_response)、[on\_trade\_response()](help-engine-192b4919.md#on_trade_response) 中 order\_id 字段赋值为""；
6.  [tick\_data](help-engine-192b4919.md#tick_data) 中可调用接口完善；
7.  弃用 set\_close\_position\_type()(设置期货平仓方式)、get\_close\_position\_type()(获取期货平仓方式)API 接口；
8.  期货 [Position](help-engine-19502d4e.md#Position) 对象中删除 close\_position\_type(平仓方式)字段；
9.  [sell\_close()](api-future-3ec5570e.md#sell_close)、[buy\_close()](api-future-3ec5570e.md#buy_close) 新增 close\_today(平仓方式)入参；
10.  新增 [get\_MACD()](api-factor-0f53ef96.md#get_MACD) 异同移动平均线；
11.  新增 [get\_KDJ()](api-factor-0f53ef96.md#get_KDJ) 随机指标；
12.  新增 [get\_RSI()](api-factor-0f53ef96.md#get_RSI) 相对强弱指标；
13.  新增 [get\_CCI()](api-factor-0f53ef96.md#get_CCI) 顺势指标；
14.  新增 [create\_dir()](api-system-74e7aaca.md#create_dir) 创建文件目录路径；
