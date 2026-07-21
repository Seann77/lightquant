---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202201.00.000
section_path:
  - 更新日志
  - PBOXQT1.0V202201.00.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202201-00-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202201-00-000"></a>

## PBOXQT1.0V202201.00.000

1.  [get\_individual\_transaction()](api-data-550d561d.md#get_individual_transaction) 新增返回 buy\_no(叫买方编号)、sell\_no(叫卖方编号)、trans\_flag(成交标记)、trans\_identify\_am(盘后逐笔成交序号标识)、channel\_num(成交通道信息)字段；
2.  [get\_margin\_contract()](api-credit-7fbe2e74.md#get_margin_contract) 新增返回 compact\_interest(合约利息金额)、real\_compact\_interest(日间实时利息金额)、real\_compact\_balance(日间实时合约金额)、real\_compact\_amount(日间实时合约数量)字段；
3.  [get\_price()](api-data-550d561d.md#get_price)、[get\_history()](api-data-550d561d.md#get_history) 新增支持：1 月(mo)、1 季度(1q)、1 年(1y)频率行情获取；
4.  [set\_commission()](api-system-e3a203f0.md#set_commission) 中 type 字段新增支持传入 "LOF" 类型；
5.  [get\_individual\_entrust()](api-data-550d561d.md#get_individual_entrust) 和 [get\_individual\_transaction()](api-data-550d561d.md#get_individual_transaction) 返回内容中 hq\_px 字段值缩小 1000 倍，返回为真实价格；
6.  新增支持期货日盘回测功能、期货日盘交易功能(对接 UFT 柜台)，期货 API 接口详见量化帮助文档 [期货专用函数](api-future-3ec5570e.md#buy_open) 模块；
7.  新增 [get\_tick\_direction()](api-data-550d561d.md#get_tick_direction) 获取分时成交行情；
8.  新增 [get\_sort\_msg()](api-data-550d561d.md#get_sort_msg) 获取版块、行业的涨幅排名；
9.  新增 [permission\_test()](api-system-74e7aaca.md#permission_test) 权限校验；
