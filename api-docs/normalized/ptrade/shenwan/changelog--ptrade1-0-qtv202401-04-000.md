---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202401.04.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202401.04.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202401-04-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202401-04-000"></a>

## PTrade1.0-QTV202401.04.000

1.  新增 [fund\_transfer()](api-trade-ddb81b32.md#fund_transfer) 资金调拨；
2.  新增 [market\_fund\_transfer()](api-trade-ddb81b32.md#market_fund_transfer) 市场间资金调拨；
3.  新增 [set\_email\_info()](api-system-e3a203f0.md#set_email_info) 设置邮件信息；
4.  [on\_trade\_response()](help-engine-192b4919.md#on_trade_response) 新增返回 real\_type: 成交类型、real\_status: 成交状态两个字段；
5.  [run\_interval()](api-system-392b21bd.md#run_interval) seconds 最小运行间隔时间的设置规则修改为期货最小 1 秒，股票等其他业务最小 3 秒；
6.  [create\_dir()](api-system-74e7aaca.md#create_dir) 出参 None 修改为是否创建成功(True/False)；
7.  Python3.5 新增三方库：walrus==0.9.3
