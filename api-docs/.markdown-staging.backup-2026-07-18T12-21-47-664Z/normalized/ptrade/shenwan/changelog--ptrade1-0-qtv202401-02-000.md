---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202401.02.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202401.02.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202401-02-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202401-02-000"></a>

## PTrade1.0-QTV202401.02.000

1.  [margincash\_open()](api-credit-0e338551.md#margincash_open) 字段 cash\_group 不入参修改为默认表示普通头寸；
2.  [margincash\_close()](api-credit-0e338551.md#margincash_close) 增加 cash\_group 字段入参；
3.  [margincash\_direct\_refund()](api-credit-0e338551.md#margincash_direct_refund) 增加 cash\_group 字段入参；
4.  [marginsec\_open()](api-credit-0e338551.md#marginsec_open) 字段 cash\_group 不入参修改为默认表示普通头寸；
5.  [marginsec\_direct\_refund()](api-credit-0e338551.md#marginsec_direct_refund) 增加 cash\_group 字段入参；
6.  [get\_margincash\_open\_amount()](api-credit-7fbe2e74.md#get_margincash_open_amount) 字段 cash\_group 不入参修改为默认表示普通头寸；
7.  [get\_margincash\_close\_amount()](api-credit-7fbe2e74.md#get_margincash_close_amount) 增加 cash\_group 字段入参；
8.  [get\_marginsec\_open\_amount()](api-credit-7fbe2e74.md#get_marginsec_open_amount) 字段 cash\_group 不入参修改为默认表示普通头寸；
9.  [get\_marginsec\_close\_amount()](api-credit-7fbe2e74.md#get_marginsec_close_amount) 增加 cash\_group 字段入参；
10.  [get\_margin\_entrans\_amount()](api-credit-7fbe2e74.md#get_margin_entrans_amount) 增加 cash\_group 字段入参；
11.  [get\_enslo\_security\_info()](api-credit-7fbe2e74.md#get_enslo_security_info) 增加 cash\_group 字段入参；
12.  [get\_crdt\_fund()](api-credit-7fbe2e74.md#get_crdt_fund) 增加 get\_crdt\_fund 接口；
13.  [get\_margin\_contract()](api-credit-7fbe2e74.md#get_margin_contract) 新增 compact\_source 合约来源字段入参和返回；
14.  Python3.5 新增三方库：memory-profiler==0.61.0，psutil==5.9.5
