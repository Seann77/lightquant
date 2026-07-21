---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 行业概念数据
section_path:
  - 行业概念数据
source_file: api-docs/raw/joinquant/plateData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=plateData
source_anchor: "#行业概念数据"
source_sha256: 4153c304ebeaccfba61ed5e5a681200a066c001bfcc37ec85d12f6511a6978de
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="行业概念数据"></a>

## 行业概念数据

提供行业板块信息，概念板块信息，包含行业代码、名称等。
(温馨提示：鉴于内容太多, 可使用`Ctrl + F`进行搜索)

**获取行业及概念数据的API**

-   获取行业类成份：get\_industry\_stocks(industry\_code, date=None), 详情[见这里](https://www.joinquant.com/api#get_industry_stocks).
-   获取概念类成分股：get\_concept\_stocks(concept\_code, date=None), 详情[见这里](https://www.joinquant.com/api#get_concept_stocks).
-   获取行业列表：get\_industries，详情[见这里](https://www.joinquant.com/api#get_industries)
-   获取概念列表：get\_concepts()，详情[见这里](https://www.joinquant.com/api#get_concepts)
-   获取股票所属概念板块 ：get\_concept，详情[见这里](https://www.joinquant.com/api#get_concept)
-   查询股票所属行业：get\_industry，详情[见这里](https://www.joinquant.com/api#get_industry)

**注意**

-   目前没有行业及概念的行情数据；
