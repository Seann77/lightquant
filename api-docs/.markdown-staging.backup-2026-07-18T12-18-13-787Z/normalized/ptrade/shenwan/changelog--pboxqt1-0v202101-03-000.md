---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202101.03.000
section_path:
  - 更新日志
  - PBOXQT1.0V202101.03.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202101-03-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202101-03-000"></a>

## PBOXQT1.0V202101.03.000

1.  [on\_order\_response()](help-engine-192b4919.md#on_order_response) 主推信息中新增 entrust\_type、entrust\_prop 字段；
2.  修复信用交易接口兼容问题；
3.  [get\_price()](api-data-550d561d.md#get_price)、[get\_history()](api-data-550d561d.md#get_history) 支持周频(1w)行情获取；
4.  由于行情源不再更新维护，[get\_fundamentals()](api-data-3929251f.md#get_fundamentals) 接口去除 share\_change 表；
