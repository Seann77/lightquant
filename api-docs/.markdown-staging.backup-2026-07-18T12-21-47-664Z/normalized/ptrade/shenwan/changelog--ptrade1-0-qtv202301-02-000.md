---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202301.02.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202301.02.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202301-02-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202301-02-000"></a>

## PTrade1.0-QTV202301.02.000

1.  [get\_snapshot()](api-data-550d561d.md#get_snapshot) 不再返回 close\_px(今日收盘)、avg\_px(均价)字段；
2.  [get\_price()](api-data-550d561d.md#get_price)、[get\_history()](api-data-550d561d.md#get_history) 获取日 K 线新增返回 is\_open 字段；
3.  删除三方库：arch==3.2，cvxopt==1.1.8
4.  新增三方库：PuLP==2.7.0
5.  研究新增支持 [get\_history()](api-data-550d561d.md#get_history) 获取历史行情；
6.  新增 [get\_business\_type()](api-system-74e7aaca.md#get_business_type) 获取当前策略的业务类型；
7.  新增 [get\_ipo\_stocks()](api-stock-19b8a1f5.md#get_ipo_stocks) 获取当日 IPO 申购标的；
