---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202101.05.000
section_path:
  - 更新日志
  - PBOXQT1.0V202101.05.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202101-05-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202101-05-000"></a>

## PBOXQT1.0V202101.05.000

1.  信用账户支持 [ipo\_stocks\_order()](api-stock-291dd586.md#ipo_stocks_order) 接口调用；
2.  由于行情源返回信息不包含，[get\_fundamentals()](api-data-3929251f.md#get_fundamentals) 获取 growth\_ability、profit\_ability、eps、operating\_ability、debt\_paying\_ability 表不再返回 company\_type 字段；
3.  由于上交所债券业务规则变更，调用 [debt\_to\_stock\_order()](api-trade-74a4b542.md#debt_to_stock_order) 接口对上海市场可转债进行转股操作时需传入可转债代码，不再传入转股代码；
