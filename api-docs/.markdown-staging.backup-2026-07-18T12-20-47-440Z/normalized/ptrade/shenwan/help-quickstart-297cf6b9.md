---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 关于限价交易的价格
section_path:
  - 开始写策略
  - 关于限价交易的价格
source_file: api-docs/raw/ptrade/shenwan/02_help_quickstart.html
source_url: http://101.71.132.53:9091/qthelp/help/quickstart.html
source_anchor: "#关于限价交易的价格"
source_sha256: 70a1d286729aeccd616c5423c93600bb9574a7a72b379b9313a5fffdbee5abb7
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="关于限价交易的价格"></a>

## 关于限价交易的价格

可转债、ETF、LOF的价格是小数点三位。

股票的价格是小数点两位。

股指期货的价格是小数点一位。

港股通的价格是小数点三位。

用户在使用限价单委托（如order()入参limit\_price）和市价委托保护限价（order\_market()入参limit\_price）的场景时务必要对入参价格的小数点位数进行处理，否则会导致委托失败。
