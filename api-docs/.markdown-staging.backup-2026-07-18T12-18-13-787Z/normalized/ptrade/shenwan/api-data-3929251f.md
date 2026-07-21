---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: market_data
title: 财务数据接口
section_path:
  - 数据接口
  - 财务数据接口
source_file: api-docs/raw/ptrade/shenwan/08_api_data.html
source_url: http://101.71.132.53:9091/qthelp/api/data.html
source_anchor: "#财务数据接口"
source_sha256: f3ab9ba25e36fa781998eb70f34588f59350edf1682aa3d8402bc435e3042b1e
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="财务数据接口"></a>

## 财务数据接口

<a id="get_fundamentals"></a>

### `get_fundamentals`

<a id="中文名-30"></a>

#### 中文名

财务数据查询

<a id="接口说明-30"></a>

#### 接口说明

获取上市公司财务数据，包括资产负债表、利润表、现金流量表、估值数据及各项财务指标。

<a id="接口定义-30"></a>

#### 接口定义

python

```python
get_fundamentals(security, table, fields=None, date=None, start_year=None, end_year=None, report_types=None, merge_type=None, is_dataframe=False)
```

<a id="使用场景-30"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

1.  科创板存托凭证(九号公司:689009.SS)没有财务报表披露信息。
2.  为保持各表接口统一，输入字段略有不同，具体可参见[财务数据的API接口说明](http://101.71.132.53:9091/qthelp/api/other/finance.html)。
3.  date字段与start\_year/end\_year不能同时输入，否则按日期查询模式(date参数模式)。
4.  当date和start\_year/end\_year相关数据都不传入时，默认为按日期查询模式(date参数模式)，研究和回测中date取值有所不同：在研究中，date取的是当前日期；回测中取回测日期的上一个交易日数据。
5.  fields不传入的情况下，date必须传入，否则会报错。正确调用示例：get\_fundamentals('600570.XSHG', 'balance\_statement', date='2018-06-01')。

<a id="参数-27"></a>

#### 参数

**`security`**

-   类型：`list[str]/str`

一支股票代码或者多只股票代码组成的list，必填字段

**`table`**

-   类型：`str`

财务数据表名，输入具体表名可查询对应表中信息，必填字段

| 表名 | 包含内容 |
| --- | --- |
| `valuation` | 估值数据 |
| `balance_statement` | 资产负债表 |
| `income_statement` | 利润表 |
| `cashflow_statement` | 现金流量表 |
| `growth_ability` | 成长能力指标 |
| `profit_ability` | 盈利能力指标 |
| `eps` | 每股指标 |
| `operating_ability` | 营运能力指标 |
| `debt_paying_ability` | 偿债能力指标 |

**`fields`**

-   类型：`list[str]/str`
-   默认：`None`

指明数据结果集中所需输出业务字段，支持多个业务字段输出(list类型)，如fields=\['settlement\_provi', 'client\_provi'\]；输出具体字段请参考[财务数据的API接口说明](http://101.71.132.53:9091/qthelp/api/other/finance.html)，选填字段

**`date`**

-   类型：`str/datetime.date`
-   默认：`None`

查询日期，按日期查询模式，返回查询日期之前对应的财务数据，输入形式如'20170620'；支持datetime.date时间格式输入，不能与start\_year与end\_year同时作用；支持按日期查询模式，不传入date时默认取回测日期的上一个交易日数据，选填字段

**`start_year`**

-   类型：`str`
-   默认：`None`

查询开始年份，按年份查询模式，返回输入年份范围内对应的财务数据，如'2015'，start\_year与end\_year必须同时输入，且不能与date同时作用，选填字段

**`end_year`**

-   类型：`str`
-   默认：`None`

查询截止年份，按年份查询模式，返回输入年份范围内对应的财务数据，如'2015'，start\_year与end\_year必须同时输入，且不能与date同时作用，选填字段

**`report_types`**

-   类型：`str`
-   默认：`None`

财报类型；如果为年份查询模式(start\_year/end\_year)，不输入report\_types返回当年可查询到的全部类型财报；如果为日期查询模式(date)，不输入report\_types返回距离指定日期最近一份财报，选填字段

-   包括：
    -   '1':表示获取一季度财报
    -   '2':表示获取半年报
    -   '3':表示获取截止到三季度财报
    -   '4':表示获取年度财报

**`merge_type`**

-   类型：`int`
-   默认：`None`

数据更新设置；相关财务数据信息会不断进行修正更新，为了避免未来数据影响，可以通过参数获取原始发布或最新发布数据信息；只有部分表包含此字段，选填字段

-   包括：
    -   merge\_type不传或传入merge\_type = None，获取首次发布的数据，即使实际数据发生变化，也只返回原样数据信息；回测场景为避免未来数据建议使用此模式
    -   merge\_type传入1，获取已发布财报数据的更新数据，更新数据范围包括但不限于相关日期数据，研究场景或交易场景建议使用此模式，但需要指定报告期，否则会获取到历史最近一期有过更新情况的财报数据

**`is_dataframe`**

-   类型：`bool`
-   默认：`False`

True-返回DataFrame格式;False-返回pandas.Panel格式(默认,仅python3.5的按年份查询模式有效)，选填字段

<a id="返回-30"></a>

#### 返回

`pandas.DataFrame | pandas.Panel`:

1.(python3.11、python3.5版本均支持)按日期查询模式(date参数模式)返回数据类型为pandas.DataFrame类型，索引为股票代码，如

python

```python
get_fundamentals('600000.SS','balance_statement',date='20161201')
```

将返回：

md

```md
	secu_abbr	end_date	publ_date	total_assets	……	total_liability
600000.SS	浦发银行	2016-09-30	2016-10-29	5.56e+12	......	5.20e+12
```

1.  (python3.11版本支持)按年份查询模式(start\_year/end\_year参数模式)返回数据类型为pandas.DataFrame类型，索引为股票代码(secu\_code)和对应会计日期(end\_date).

2.  (python3.5版本支持)按年份查询模式(start\_year/end\_year参数模式)返回数据类型为pandas.Panel类型，索引为股票代码，其中包含的DataFrame索引为返回股票对应会计日期(end\_date)，如


python

```python
get_fundamentals(['600000.SS', '600570.SS', '000002.SZ'], 'balance_statement', start_year='2016', end_year='2016')
```

将返回：

![](http://101.71.132.53:9091/qthelp/static/images/help/get_fundamentals_1.png)

<a id="示例-30"></a>

#### 示例

python

```python
import time
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def before_trading_start(context, data):
     # 假设取4000股*10年一季报数据为4万条，之后再取中报又是4万条，因为规则要求每秒不得调用超过100次(单次最大调用量是500条数据)，调用过程就需要sleep1秒，防止流控触发。
     funda_data = get_fundamentals(g.security, 'balance_statement', fields = 'total_assets', start_year='2011', end_year='2020', report_types = '1')
     time.sleep(1)
     funda_data = get_fundamentals(g.security, 'balance_statement', fields = 'total_assets', start_year='2010', end_year='2020', report_types = '2')
def handle_data(context, data):
     # 获取股票池
     stocks = get_index_stocks('000906.XBHS')
     # 指定股票池
     stocks = ['600000.SS','600570.SS']

     # 获取数据的两种模式
     # 1. 按日期查询模式(默认以发布日期为参考时间)：返回输入日期之前对应的财务数据
     # 在回测中获取单一股票中对应回测日期资产负债表中资产总计(total_assets)数据
     #(回测中date默认获取回测日期，无需传入date，除非在回测中获取指定某个日期的数据，日期格式如”20160628”)
     get_fundamentals('600000.SS', 'balance_statement', 'total_assets')

     # 获取股票池中对应上市公司在2016年6月28日之前发布的最近季度(即2016年一季度)
     # 的资产负债表中资产总计(total_assets)数据，如果到查询日期为止一季度数据还,未发布则所有数据用Nan填充
     get_fundamentals(stocks, 'balance_statement', 'total_assets','20160628')

     # 获取股票池中对应上市公司在2016年6月28日最近会计周期(即20160331)的资产负
     # 债表中资产总计(total_assets)数据，如果未查到相关数据则用Nan填充
     get_fundamentals(stocks, 'balance_statement', 'total_assets','20160628', date_type=1)

     # 获取股票池中对应上市公司发布日期在2016年6月28日之前，年度(即2015年年报)
     # 资产负债表中资产总计(total_assets)数据，如果到查询日期为止还未发布则所有数据用Nan填充
     get_fundamentals(stocks, 'balance_statement', 'total_assets', '20160628', report_types='4')

     # 获取股票池中对应上市公司2016年6月28日最近季度资产负债表中对应fields字段数据
     fields =['sold_buyback_secu_proceeds','specific_account_payable']
     get_fundamentals(stocks, 'balance_statement', fields,'20160628',)

     # 获取股票池中对应上市公司2016年6月28日最近季度资产负债表中对应fields字段最新数据，
     # 如果最近更新日期(发布日期)在2016年6月28日之后则无法获取对应数据
     fields =['sold_buyback_secu_proceeds','specific_account_payable']
     get_fundamentals(stocks, 'balance_statement', fields,'20160628',merge_type=1)

     # 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
     # 获取公司浦发银行(600000.SS)从2013年至2015年第一季度资产负债表中资产总计(total_assets)数据
     get_fundamentals('600000.SS','balance_statement','total_assets',start_year='2013',end_year='2015', report_types='1')

     # 获取股票池中对应上市公司从2013年至2015年年度资产负债表中对应fields字段数据
     fields =['sold_buyback_secu_proceeds','specific_account_payable']
     get_fundamentals(stocks,'balance_statement',fields,start_year='2013',end_year='2015', report_types='4')
```

* * *

说明

接口支持的业务范围以及支持在引擎的哪些流程函数中调用，详见 [接口列表](http://101.71.132.53:9091/qthelp/api/list.html)
