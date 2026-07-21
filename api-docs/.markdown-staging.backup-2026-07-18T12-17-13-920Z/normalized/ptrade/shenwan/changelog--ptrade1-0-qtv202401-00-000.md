---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202401.00.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202401.00.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202401-00-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202401-00-000"></a>

## PTrade1.0-QTV202401.00.000

1.  [get\_margin\_contract()](api-credit-7fbe2e74.md#get_margin_contract) entrust\_no 委托编号字段返回类型改为 str 类型；
2.  [get\_margin\_contractreal()](api-credit-7fbe2e74.md#get_margin_contractreal) entrust\_no 委托编号字段返回类型改为 str 类型；
3.  [get\_deliver()](api-trade-247439a3.md#get_deliver) 返回字段 entrust\_no,report\_no 类型由 int 改为 str；
4.  [set\_benchmark()](api-system-e3a203f0.md#set_benchmark) 入参字段 security 改为 sids；
5.  option\_buy\_open() 期权权利仓开仓接口由 buy\_open 调整为 option\_buy\_open；
6.  option\_buy\_close() 期权权利仓平仓接口由 buy\_close 调整为 option\_buy\_close；
7.  option\_sell\_open() 期权义务仓开仓接口由 sell\_open 调整为 option\_sell\_open；
8.  option\_sell\_close() 期权义务仓平仓接口由 sell\_close 调整为 option\_sell\_close；
9.  新增 [check\_strategy()](api-system-74e7aaca.md#check_strategy) 检查策略内容；
10.  新增 [get\_dominant\_contract()](api-data-776ee715.md#get_dominant_contract) 获取期货主力合约(get\_future\_main\_code 已弃用,用 get\_dominant\_contract 替代)；
11.  Python3.5 新增三方库：flameprof==0.4，pypinyin==0.50.0
12.  Python3.11 新增三方库：pypinyin==0.50.0
