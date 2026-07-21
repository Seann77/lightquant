---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 获取融资融券汇总数据
section_path:
  - 股票数据
  - 获取融资融券汇总数据
source_file: api-docs/raw/joinquant/Stock/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Stock
source_anchor: "#获取融资融券汇总数据"
source_sha256: 4f98d75f021aa61af93665d67a18decc90781d913d89bb880d603b6b48186e5b
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="获取融资融券汇总数据"></a>

## 获取融资融券汇总数据

```python
from jqdata import *
finance.run_query(query(finance.STK_MT_TOTAL).filter(finance.STK_MT_TOTAL.date=='2019-05-23').limit(n))
```

描述：记录上海交易所和深圳交易所的融资融券汇总数据

**参数：**

-   **query(finance.STK\_MT\_TOTAL)**：表示从finance.STK\_MT\_TOTAL这张表中查询融资融券汇总数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[query简易教程](https://www.joinquant.com/view/community/detail/16411)
-   **finance.STK\_MT\_TOTAL**：收录了融资融券汇总数据，表结构和字段信息如下：

**字段设计**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| date | date | 交易日期 |
| exchange\_code | varchar(12) | 交易市场。例如，XSHG-上海证券交易所；XSHE-深圳证券交易所。对应DataAPI.SysCodeGet.codeTypeID=10002。 |
| fin\_value | decimal(20,2) | 融资余额（元） |
| fin\_buy\_value | decimal(20,2) | 融资买入额（元） |
| sec\_volume | int | 融券余量（股） |
| sec\_value | decimal(20,2) | 融券余量金额（元） |
| sec\_sell\_volume | int | 融券卖出量（股） |
| fin\_sec\_value | decimal(20,2) | 融资融券余额（元） |

-   **filter(finance.STK\_MT\_TOTAL.date==date)**：指定筛选条件，通过finance.STK\_MT\_TOTAL.date==date可以指定你想要查询的日期；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询2019-05-23的融资融券汇总数据。
from jqdata import *
df=finance.run_query(query(finance.STK_MT_TOTAL).filter(finance.STK_MT_TOTAL.date=='2019-05-23').limit(10))
df

     id        date exchange_code      ...           sec_value  sec_sell_volume  fin_sec_value
0  4445  2019-05-23          XSHE      ...        1.465000e+09         26000000   3.615940e+11
1  4446  2019-05-23          XSHG      ...        6.018287e+09        144633497   5.665458e+11
```
