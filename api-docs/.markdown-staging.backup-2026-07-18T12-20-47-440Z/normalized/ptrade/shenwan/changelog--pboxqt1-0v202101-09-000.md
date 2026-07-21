---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202101.09.000
section_path:
  - 更新日志
  - PBOXQT1.0V202101.09.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202101-09-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202101-09-000"></a>

## PBOXQT1.0V202101.09.000

1.  [get\_market\_detail()](api-data-776ee715.md#get_market_detail) 限制仅 [before\_trading\_start](help-engine-192b4919.md#before_trading_start) 和 [after\_trading\_end](help-engine-192b4919.md#after_trading_end) 中使用；
2.  [get\_snapshot()](api-data-550d561d.md#get_snapshot) 新增返回 hsTimeStamp(快照时间戳)字段；对接 L2 行情买卖一档新增返回委托队列；
3.  [ipo\_stocks\_order()](api-stock-291dd586.md#ipo_stocks_order) 新增 black\_stocks(新股/债黑名单)入参；
4.  [on\_order\_response()](help-engine-192b4919.md#on_order_response) 新增返回 error\_info(错误信息)字段；
