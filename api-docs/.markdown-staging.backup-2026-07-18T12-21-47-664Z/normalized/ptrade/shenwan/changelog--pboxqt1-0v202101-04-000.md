---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202101.04.000
section_path:
  - 更新日志
  - PBOXQT1.0V202101.04.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202101-04-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202101-04-000"></a>

## PBOXQT1.0V202101.04.000

1.  修复 [get\_all\_orders()](api-trade-247439a3.md#get_all_orders) 获取特定委托状态报错问题，status 字段返回数据类型从 int 改为 str；
2.  [on\_order\_response()](help-engine-192b4919.md#on_order_response)、[on\_trade\_response()](help-engine-192b4919.md#on_trade_response) 支持获取非本策略交易的主推信息(需券商配置默认不推送)，且 on\_order\_response 推送非本策略交易的主推信息时不包含 order\_id 字段；
3.  相关功能优化；
