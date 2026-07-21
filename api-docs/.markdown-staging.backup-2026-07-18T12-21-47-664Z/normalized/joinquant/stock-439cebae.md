---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 获取股票数据
section_path:
  - 股票数据
  - 获取股票数据
source_file: api-docs/raw/joinquant/Stock/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Stock
source_anchor: "#获取股票数据"
source_sha256: 4f98d75f021aa61af93665d67a18decc90781d913d89bb880d603b6b48186e5b
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="获取股票数据"></a>

## 获取股票数据

**注意**

-   run\_query函数为了防止返回数据量过大, 我们每次最多返回条数为4000行（之前是3000行）
-   query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](https://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   [Query的简单教程](https://www.joinquant.com/view/community/detail/433d0e9ed9fed11fc9f7772eab8d9376)
-   [数据常见疑问汇总](https://www.joinquant.com/view/community/detail/fcb3baa6f926259c4caac3bce7c12b1c?type=2)

<a id="获取股票概况"></a>

### 获取股票概况

包含股票的上市时间、退市时间、代码、名称、是否是ST等。

更多API的可参考[官方API文档](https://www.joinquant.com/api)

<a id="获取单支股票数据"></a>

#### 获取单支股票数据

获取单支股票的信息

**调用方法**

```python
get_security_info(code)
```

**参数**

-   code: 证券代码

**返回值**

-   一个对象, 有如下属性:

1.  display\_name # 中文名称
2.  name # 缩写简称
3.  start\_date # 上市日期, \[datetime.date\] 类型
4.  end\_date # 退市日期， \[datetime.date\] 类型, 如果没有退市则为2200-01-01
5.  type # 类型，stock(股票)，index(指数)，etf(ETF基金)，fja（分级A），fjb（分级B）
6.  parent # 分级基金的母基金代码

**示例**

```python
# 输出平安银行信息的中文名称
get_security_info('000001.XSHE').display_name
```

<a id="获取所有股票数据"></a>

#### 获取所有股票数据

获取平台支持的所有股票数据

**调用方法**

```python
get_all_securities(types=['stock'], date=None)
```

**参数**

-   types：默认为stock，这里请在使用时注意防止未来函数。
-   date: 日期, 一个字符串或者 \[datetime.datetime\]/\[datetime.date\] 对象, 用于获取某日期还在上市的股票信息. 默认值为 None, 表示获取所有日期的股票信息

**返回**

-   display\_name # 中文名称
-   name # 缩写简称
-   start\_date # 上市日期
-   end\_date # 退市日期，如果没有退市则为2200-01-01
-   type # 类型，stock(股票)

\[pandas.DataFrame\], 比如:`get_all_securities()[:2]`返回:

```python
               display_name name   start_date   end_date   type
000001.XSHE         平安银行  PAYH  1991-04-03  2200-01-01  stock
000002.XSHE          万科Ａ   WKA   1991-01-29  2200-01-01  stock
```

**示例**

```python
 #将所有股票列表转换成数组
    stocks = list(get_all_securities(['stock']).index)
 #获得2015年10月10日还在上市的所有股票列表
    get_all_securities(date='2015-10-10')
```

<a id="判断股票是否是ST"></a>

#### 判断股票是否是ST

得到多只股票在一段时间是否是ST

**调用方法**

```python
get_extras(info, security_list, start_date='2015-01-01', end_date='2015-12-31', df=True)
```

**参数**

-   info: ‘is\_st’，是否股改, st,\*st和退市整理期标的
-   security\_list: 股票列表
-   start\_date/end\_date: 开始结束日期, 同\[get\_price\]
-   df: 返回\[pandas.DataFrame\]对象还是一个dict

**返回值**

-   df=True: \[pandas.DataFrame\]对象, 列索引是股票代号, 行索引是\[datetime.datetime\], 比如

    `get_extras('is_st', ['000001.XSHE', '000018.XSHE'], start_date='2013-12-01', end_date='2013-12-03')`返回:


```python
            000001.XSHE  000018.XSHE
2013-12-02        False         True
2013-12-03        False         True
```

-   df=False:
    一个dict, key是股票代号, value是\[numpy.ndarray\], 比如`get_extras('is_st', ['000001.XSHE', '000018.XSHE'], start_date='2015-12-01', end_date='2015-12-03', df=False)` 返回:

    ```python
    {
       '000001.XSHE': array([False, False, False], dtype=bool),
       '000018.XSHE': array([False, False, False], dtype=bool)
    }
    ```


<a id="获取股票的融资融券信息"></a>

#### 获取股票的融资融券信息

获取一只或者多只股票在一个时间段内的融资融券信息

**调用方法**

```python
get_mtss(security_list, start_date, end_date, fields=None)
```

**参数**

-   security\_list: 一只股票代码或者一个股票代码的 list
-   start\_date: 开始日期, 一个字符串或者 [datetime.datetime](https://docs.python.org/2/library/datetime.html#datetime.datetime)/[datetime.date](https://docs.python.org/2/library/datetime.html#datetime.date) 对象
-   end\_date: 结束日期, 一个字符串或者 [datetime.date](https://docs.python.org/2/library/datetime.html#datetime.date)/[datetime.datetime](https://docs.python.org/2/library/datetime.html#datetime.datetime)对象
-   fields: 字段名或者 list, 可选. 默认为 None, 表示取全部字段, 各字段含义如下：

| 字段名 | 含义 |
| --- | --- |
| date | 日期 |
| sec\_code | 股票代码 |
| fin\_value | 融资余额(元） |
| fin\_buy\_value | 融资买入额（元） |
| fin\_refund\_value | 融资偿还额（元） |
| sec\_value | 融券余量（股） |
| sec\_sell\_value | 融券卖出量（股） |
| sec\_refund\_value | 融券偿还股（股） |
| fin\_sec\_value | 融资融券余额（元） |

**返回值**
返回一个 [pandas.DataFrame](http://pandas.pydata.org/pandas-docs/version/0.16.2/generated/pandas.DataFrame.html#pandas.DataFrame) 对象，默认的列索引为取得的全部字段. 如果给定了 fields 参数, 则列索引与给定的 fields 对应.

**示例**

```python
from jqdata import *
# 获取一只股票的融资融券信息
get_mtss('000001.XSHE', '2016-01-01', '2016-04-01')
get_mtss('000001.XSHE', '2016-01-01', '2016-04-01', fields=["date", "sec_code", "fin_value", "fin_buy_value"])
get_mtss('000001.XSHE', '2016-01-01', '2016-04-01', fields="sec_sell_value")

# 获取多只股票的融资融券信息
get_mtss(['000001.XSHE', '000002.XSHE', '000099.XSHE'], '2015-03-25', '2016-01-25')
get_mtss(['000001.XSHE', '000002.XSHE', '000099.XSHE'], '2015-03-25', '2016-01-25', fields=["date", "sec_code", "sec_value", "fin_buy_value", "sec_sell_value"])
```

<a id="股票分类信息"></a>

### 股票分类信息

获取指数成份股，或者行业成份股。

<a id="获取指数成份股"></a>

#### 获取指数成份股

获取一个指数给定日期在平台可交易的成分股列表，我们支持近600种股票指数数据，包括指数的行情数据以及成分股数据。为了避免未来函数，我们支持获取历史任意时刻的指数成分股信息。请点击[指数列表](index-7492c80d.md#沪深指数列表)查看指数信息.

**调用方法**

```python
get_index_stocks(index_symbol, date=None)
```

**参数**

-   index\_symbol, 指数代码
-   date: 查询日期, 一个字符串(格式类似’2015-10-15’)或者\[datetime.date\]/\[datetime.datetime\]对象, 可以是None, 使用默认日期. 这个默认日期在回测和研究模块上有点差别:

1.  回测模块: 默认值会随着回测日期变化而变化, 等于context.current\_dt
2.  研究模块: 默认是今天

**返回**

-   返回股票代码的list

**示例**

```python
# 获取所有沪深300的股票, 设为股票池
stocks = get_index_stocks('000300.XSHG')
set_universe(stocks)
```

<a id="获取行业、概念成份股"></a>

#### 获取行业、概念成份股

获取在给定日期一个行业或概念板块的所有股票，行业分类、概念分类列表见数据页面-[行业概念数据](https://www.joinquant.com/help/api/help?name=plateData)。

**调用方法**

```python
# 获取行业板块成分股
get_industry_stocks(industry_code, date=None)

# 获取概念板块成分股
get_concept_stocks(concept_code, date=None)
```

**参数**

-   industry\_code: 行业编码

-   date: 查询日期, 一个字符串(格式类似’2015-10-15’)或者\[datetime.date\]/\[datetime.datetime\]对象, 可以是None, 使用默认日期. 这个默认日期在回测和研究模块上有点差别:


1.  回测模块: 默认值会随着回测日期变化而变化, 等于context.current\_dt
2.  研究模块: 默认是今天

**返回**

-   返回股票代码的list

**示例**

```python
# 获取计算机/互联网行业的成分股
stocks = get_industry_stocks('I64')

# 获取风力发电概念板块的成分股
stocks = get_concept_stocks('GN036')
```

<a id="查询股票所属行业"></a>

#### 查询股票所属行业

```python
get_industry(security, date=None)
```

**参数**

-   security：标的代码，类型为字符串，形式如"000001.XSHE"；或为包含标的代码字符串的列表，形如\["000001.XSHE", "000002.XSHE"\]
-   date：查询的日期。类型为字符串，形如"2018-06-01"或"2018-06-01 09:00:00"；或为datetime.datetime对象和datetime.date。注意传入对象的时分秒将被忽略。

**返回**

返回结果是一个dict，key是传入的股票代码

**示例**

```python
#获取贵州茅台("600519.XSHG")的所属行业数据
d = get_industry("600519.XSHG",date="2018-06-01")
print(d)

{'600519.XSHG': {'sw_l1': {'industry_code': '801120', 'industry_name': '食品饮料I'}, 'sw_l2': {'industry_code': '801123', 'industry_name': '饮料制造II'}, 'sw_l3': {'industry_code': '851231', 'industry_name': '白酒III'}, 'zjw': {'industry_code': 'C15', 'industry_name': '酒、饮料和精制茶制造业'}, 'jq_l2': {'industry_code': 'HY478', 'industry_name': '白酒与葡萄酒指数'}, 'jq_l1': {'industry_code': 'HY005', 'industry_name': '日常消费指数'}}}


#同时获取多只股票的所属行业信息
stock_list = ['000001.XSHE','000002.XSHE']
d = get_industry(security=stock_list, date="2018-06-01")
print(d)

{'000001.XSHE': {'sw_l1': {'industry_code': '801780', 'industry_name': '银行I'}, 'sw_l2': {'industry_code': '801192', 'industry_name': '银行II'}, 'sw_l3': {'industry_code': '851911', 'industry_name': '银行III'}, 'zjw': {'industry_code': 'J66', 'industry_name': '货币金融服务'}, 'jq_l2': {'industry_code': 'HY493', 'industry_name': '多元化银行指数'}, 'jq_l1': {'industry_code': 'HY007', 'industry_name': '金融指数'}}, '000002.XSHE': {'sw_l1': {'industry_code': '801180', 'industry_name': '房地产I'}, 'sw_l2': {'industry_code': '801181', 'industry_name': '房地产开发II'}, 'sw_l3': {'industry_code': '851811', 'industry_name': '房地产开发III'}, 'zjw': {'industry_code': 'K70', 'industry_name': '房地产业'}, 'jq_l2': {'industry_code': 'HY509', 'industry_name': '房地产开发指数'}, 'jq_l1': {'industry_code': 'HY011', 'industry_name': '房地产指数'}}}
```

<a id="获取行情数据"></a>

### 获取行情数据

交易类数据提供股票的交易行情数据，通过API接口调用即可获取相应的数据。 具体请查看API,数据获取部分行情相关接口 **[数据获取函数](https://www.joinquant.com/help/api/help?name=faq#api%3A%E6%95%B0%E6%8D%AE%E8%8E%B7%E5%8F%96%E5%87%BD%E6%95%B0)**。

| 名称 | 描述 |
| --- | --- |
| get\_price | 获取历史数据，可查询多个标的多个数据字段，返回数据格式为 DataFrame |
| history | 获取历史数据，可查询多个标的单个数据字段，返回数据格式为 DataFrame 或 Dict(字典) |
| attribute\_history | 获取历史数据，可查询单个标的多个数据字段，返回数据格式为 DataFrame 或 Dict(字典) |
| get\_bars | 获取历史数据(包含快照数据)，可查询单个或多个标的多个数据字段，返回数据格式为 numpy.ndarray或DataFrame |
| get\_current\_data ♠ | 获取当前逻辑时间数据(策略专用) |
| get\_current\_tick♠ | 获取当前逻辑时间最新的 tick 数据(策略专用) |
| get\_ticks | 获取股票、期货、50ETF期权、股票指数及场内基金的tick 数据 |
| get\_call\_auction | 获取指定时间区间内集合竞价时的 tick 数据 |
