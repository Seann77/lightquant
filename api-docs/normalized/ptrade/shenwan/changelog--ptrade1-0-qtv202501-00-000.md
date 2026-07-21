---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202501.00.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202501.00.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202501-00-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202501-00-000"></a>

## PTrade1.0-QTV202501.00.000

1.  [get\_etf\_list()](api-stock-19b8a1f5.md#get_etf_list) 增加 qry\_type 和 date 入参，支持查询可申赎或可交易 ETF 列表；
2.  新增 [monetary\_fund\_purchase\_redemption()](api-stock-291dd586.md#monetary_fund_purchase_redemption) 货币基金申赎接口；
3.  [get\_snapshot()](api-data-550d561d.md#get_snapshot) 返回删除 total\_bid\_turnover，total\_offer\_turnover 字段；
4.  [get\_price()](api-data-550d561d.md#get_price) 接口中的 fq 字段新增支持 dypre-动态前复权；
5.  [get\_price()](api-data-550d561d.md#get_price) 接口异常返回空字典改为返回值为 None；
6.  新增 [neeq\_ipo\_stocks\_order()](api-stock-291dd586.md#neeq_ipo_stocks_order) 北交所新股申购接口；
7.  [get\_ipo\_stocks()](api-stock-19b8a1f5.md#get_ipo_stocks) 增加北交所新股字段；
8.  [get\_snapshot()](api-data-550d561d.md#get_snapshot) 删除 issue\_date 字段说明；
9.  Python3.5 升级三方库：SQLAlchemy==1.0.8-->SQLAlchemy==1.3.0
