---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202301.00.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202301.00.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202301-00-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202301-00-000"></a>

## PTrade1.0-QTV202301.00.000

1.  [get\_margincash\_open\_amount()](api-credit-7fbe2e74.md#get_margincash_open_amount) 新增支持 cash\_group(两融头寸性质)入参；
2.  [get\_all\_orders()](api-trade-247439a3.md#get_all_orders) 新增返回 entrust\_time(委托时间)字段；
3.  [get\_open\_orders()](api-trade-247439a3.md#get_open_orders) 改成引擎每天收盘后清空对应的未完成订单列表；
4.  新增 [get\_cb\_info()](api-data-776ee715.md#get_cb_info) 获取可转债基础信息；
5.  新增 [get\_enslo\_security\_info()](api-credit-7fbe2e74.md#get_enslo_security_info) 融券信息查询；
6.  新增 [get\_trend\_data()](api-data-550d561d.md#get_trend_data) 获取集中竞价期间的代码数据；
