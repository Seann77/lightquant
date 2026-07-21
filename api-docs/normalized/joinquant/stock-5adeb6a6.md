---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 获取股票资金流向数据
section_path:
  - 股票数据
  - 获取股票资金流向数据
source_file: api-docs/raw/joinquant/Stock/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Stock
source_anchor: "#获取股票资金流向数据"
source_sha256: 4f98d75f021aa61af93665d67a18decc90781d913d89bb880d603b6b48186e5b
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="获取股票资金流向数据"></a>

## 获取股票资金流向数据

获取一只或者多只股票在一个时间段内的资金流向数据

**调用方法**

```python
from jqdata import *
get_money_flow(security_list, start_date=None, end_date=None, fields=None, count=None)
```

**参数**

-   security\_list: 一只股票代码或者一个股票代码的 list
-   start\_date: 开始日期, 一个字符串或者 \[datetime.datetime\]/\[datetime.date\] 对象
-   end\_date: 结束日期, 一个字符串或者 \[datetime.date\]/\[datetime.datetime\] 对象
-   count: 数量, 与 start\_date 二选一，不可同时使用, 必须大于 0. 表示返回 end\_date 之前 count 个交易日的数据, 包含 end\_date
-   fields: 字段名或者 list, 可选. 默认为 None, 表示取全部字段, 各字段含义如下：

| 字段名 | 含义 | 备注 |
| --- | --- | --- |
| date | 日期 |  |
| sec\_code | 股票代码 |  |
| change\_pct | 涨跌幅(%) |  |
| net\_amount\_main | 主力净额(万) | 主力净额 = 超大单净额 + 大单净额 |
| net\_pct\_main | 主力净占比(%) | 主力净占比 = 主力净额 / 成交额 |
| net\_amount\_xl | 超大单净额(万) | 超大单：大于等于50万股或者100万元的成交单 |
| net\_pct\_xl | 超大单净占比(%) | 超大单净占比 = 超大单净额 / 成交额 |
| net\_amount\_l | 大单净额(万) | 大单：大于等于10万股或者20万元且小于50万股和100万元的成交单 |
| net\_pct\_l | 大单净占比(%) | 大单净占比 = 大单净额 / 成交额 |
| net\_amount\_m | 中单净额(万) | 中单：大于等于2万股或者4万元且小于10万股和20万元的成交单 |
| net\_pct\_m | 中单净占比(%) | 中单净占比 = 中单净额 / 成交额 |
| net\_amount\_s | 小单净额(万) | 小单：小于2万股和4万元的成交单 |
| net\_pct\_s | 小单净占比(%) | 小单净占比 = 小单净额 / 成交额 |

**返回**

返回一个 \[pandas.DataFrame\] 对象，默认的列索引为取得的全部字段. 如果给定了 fields 参数, 则列索引与给定的 fields 对应.

**示例**

```python
# 获取一只股票在一个时间段内的资金流量数据
get_money_flow('000001.XSHE', '2016-02-01', '2016-02-04')
get_money_flow('000001.XSHE', '2015-10-01', '2015-12-30', fields="change_pct")
get_money_flow(['000001.XSHE'], '2010-01-01', '2010-01-30', ["date", "sec_code", "change_pct", "net_amount_main", "net_pct_l", "net_amount_m"])

# 获取多只股票在一个时间段内的资金流向数据
get_money_flow(['000001.XSHE', '000040.XSHE', '000099.XSHE'], '2010-01-01', '2010-01-30')
# 获取多只股票在某一天的资金流向数据
get_money_flow(['000001.XSHE', '000040.XSHE', '000099.XSHE'], '2016-04-01', '2016-04-01')
```
