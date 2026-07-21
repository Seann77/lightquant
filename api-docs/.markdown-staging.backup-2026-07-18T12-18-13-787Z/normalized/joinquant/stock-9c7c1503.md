---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 市场通（沪港通，深港通和港股通）
section_path:
  - 股票数据
  - 市场通（沪港通，深港通和港股通）
source_file: api-docs/raw/joinquant/Stock/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Stock
source_anchor: "#市场通（沪港通深港通和港股通）"
source_sha256: 4f98d75f021aa61af93665d67a18decc90781d913d89bb880d603b6b48186e5b
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="市场通（沪港通深港通和港股通）"></a>

## 市场通（沪港通，深港通和港股通）

<a id="合格证券变动记录"></a>

### 合格证券变动记录

```python
from jqdata import finance
finance.run_query(query(finance.STK_EL_CONST_CHANGE).filter(finance.STK_EL_CONST_CHANGE.code==code).limit(n))
```

记录沪港通、深港通和港股通的成分股的变动情况。

**参数：**

-   **query(finance.STK\_EL\_CONST\_CHANGE)**：表示从finance.STK\_EL\_CONST\_CHANGE这张表中查询沪港通、深港通和港股通成分股的变动记录，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](https://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_EL\_CONST\_CHANGE**：记录沪港通、深港通和港股通成分股的变动情况，包括交易类型，变更日期，变更方向等，表结构和字段信息如下：


| 字段 | 名称 | 类型 | 备注/示例 |
| --- | --- | --- | --- |
| link\_id | 交易类型编码 | int | 同市场通编码 |
| link\_name | 交易类型名称 | varchar(12) |  |
| code | 证券代码 | varchar(12) |  |
| name\_ch | 中文简称 | varchar(30) |  |
| name\_en | 英文简称 | varchar(120) |  |
| exchange | 该股票所在的交易所 | varchar(12) | 上海市场:XSHG/深圳市场:XSHE/香港市场:XHKG |
| change\_date | 变更日期 | date |  |
| direction | 变更方向 | varchar(6) | IN/OUT（分别为纳入和剔除） |

-   **filter(finance.STK\_EL\_CONST\_CHANGE.code==code)**：指定筛选条件，通过finance.STK\_EL\_CONST\_CHANGE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_EL\_CONST\_CHANGE.change\_date>='2015-01-01'，表示筛选变更日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。
-   **order\_by(finance.STK\_EL\_CONST\_CHANGE.change\_date)**: 将返回结果按变更日期排序
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**

2.  不能进行连表查询，即同时查询多张表的数据

    **示例：**


```python
q=query(finance.STK_EL_CONST_CHANGE).filter(finance.STK_EL_CONST_CHANGE.link_id==310001).order_by(finance.STK_EL_CONST_CHANGE.change_date).limit(10)
df=finance.run_query(q)
print(df)

id link_id link_name         code name_ch name_en exchange change_date  \
0  536  310001       沪股通  600000.XSHG    浦发银行     NaN     XSHG  2014-11-17
1  537  310001       沪股通  600004.XSHG    白云机场     NaN     XSHG  2014-11-17
2  539  310001       沪股通  600007.XSHG    中国国贸     NaN     XSHG  2014-11-17
3  540  310001       沪股通  600008.XSHG    首创股份     NaN     XSHG  2014-11-17
4  541  310001       沪股通  600009.XSHG    上海机场     NaN     XSHG  2014-11-17
5  542  310001       沪股通  600010.XSHG    包钢股份     NaN     XSHG  2014-11-17
6  543  310001       沪股通  600011.XSHG    华能国际     NaN     XSHG  2014-11-17
7  544  310001       沪股通  600012.XSHG    皖通高速     NaN     XSHG  2014-11-17
8  545  310001       沪股通  600015.XSHG    华夏银行     NaN     XSHG  2014-11-17
9  546  310001       沪股通  600016.XSHG    民生银行     NaN     XSHG  2014-11-17
```

<a id="市场通交易日历"></a>

### 市场通交易日历

```python
from jqdata import finance
finance.run_query(query(finance.STK_EXCHANGE_LINK_CALENDAR).filter(finance.STK_EXCHANGE_LINK_CALENDAR.day==day).limit(n))
```

记录沪港通、深港通和港股通每天是否开市。

**参数：**

-   **query(finance.STK\_EXCHANGE\_LINK\_CALENDAR)**：表示从finance.STK\_EXCHANGE\_LINK\_CALENDAR这张表中查询市场沪港通、深港通和港股通交易日历的信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](https://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_EXCHANGE\_LINK\_CALENDAR**：代表了市场通交易日历表，记录沪港通、深港通和港股通每天是否开市，包括交易日期，交易日类型等，表结构和字段信息如下：


| 字段 | 名称 | 类型 | 备注/示例 |
| --- | --- | --- | --- |
| day | 交易日期 | date |  |
| link\_id | 市场通编码 | int |  |
| link\_name | 市场通名称 | varchar(32) | 包括以下四个名称： 沪股通， 深股通， 港股通(沪)， 港股通(深) |
| type\_id | 交易日类型编码 | int | 如下 交易日类型编码 |
| type | 交易日类型 | varchar(32) |  |

**附注**

港股通（沪）和港股通（深）的交易日在深港通开展后是一致的。

**交易日类型编码**

| 交易日类型编码 | 交易日类型 |
| --- | --- |
| 312001 | 正常交易日 |
| 312003 | 休市 |

**市场通编码**

| 市场通编码 | 市场通名称 |
| --- | --- |
| 310001 | 沪股通 |
| 310002 | 深股通 |
| 310003 | 港股通（沪） |
| 310004 | 港股通（深） |

-   **filter(finance.STK\_EXCHANGE\_LINK\_CALENDAR.day==day)**：指定筛选条件，通过finance.STK\_EXCHANGE\_LINK\_CALENDAR.day==day可以指定你想要查询的日期；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_EXCHANGE\_LINK\_CALENDAR.type\_id=='312001'，表示筛选交易日类型为正常交易日的数据；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**

2.  不能进行连表查询，即同时查询多张表的数据

    **示例：**


```python
q=query(finance.STK_EXCHANGE_LINK_CALENDAR).filter(finance.STK_EXCHANGE_LINK_CALENDAR.day>='2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

        id       day   link_id    link_name type_id    type
0  1244830  2015-01-01  310001       沪股通  312003   全天休市
1      145  2015-01-01  310003    港股通(沪)  312003   全天休市
2  1244831  2015-01-02  310001       沪股通  312003   全天休市
3      146  2015-01-02  310003    港股通(沪)  312003   全天休市
4  1244832  2015-01-03  310001       沪股通  312003   全天休市
5      147  2015-01-03  310003    港股通(沪)  312003   全天休市
6  1244833  2015-01-04  310001       沪股通  312003   全天休市
7      148  2015-01-04  310003    港股通(沪)  312003   全天休市
8  1244834  2015-01-05  310001       沪股通  312001  正常交易日
9      149  2015-01-05  310003    港股通(沪)  312001  正常交易日
```

<a id="市场通十大成交活跃股"></a>

### 市场通十大成交活跃股

```python
from jqdata import finance
finance.run_query(query(finance.STK_EL_TOP_ACTIVATE).filter(finance.STK_EL_TOP_ACTIVATE.code==code).limit(n))
```

统计沪港通、深港通和港股通前十大交易活跃股的交易状况。

**参数：**

-   **query(finance.STK\_EL\_TOP\_ACTIVATE)**：表示从finance.STK\_EL\_TOP\_ACTIVATE这张表中查询沪港通、深港通和港股通前十大交易活跃股的交易状况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_EL\_TOP\_ACTIVATE**：代表了市场通十大成交活跃股表，统计沪港通、深港通和港股通前十大交易活跃股的交易状况，包括买入金额，卖出金额等，表结构和字段信息如下：


| 字段 | 名称 | 类型 | 备注/示例 |
| --- | --- | --- | --- |
| day | 日期 | date |  |
| link\_id | 市场通编码 | int |  |
| link\_name | 市场通名称 | varchar(32) | 包括以下四个名称： 沪股通， 深股通， 港股通(沪)， 港股通(深) |
| rank | 排名 | int |  |
| code | 股票代码 | varchar(12) |  |
| name | 股票名称 | varchar(100) |  |
| exchange | 交易所名称 | varchar(12) |  |
| buy | 买入金额(元) | decimal(20, 4) | (北向自2024-08-18之后不再披露) |
| sell | 卖出金额(元) | decimal(20, 4) | (北向自2024-08-18之后不再披露) |
| total | 买入及卖出金额(元) | decimal(20, 4) |  |

**市场通编码**

| 市场通编码 | 市场通名称 |
| --- | --- |
| 310001 | 沪股通 |
| 310002 | 深股通 |
| 310003 | 港股通（沪） |
| 310004 | 港股通（深） |

-   **filter(finance.STK\_EL\_TOP\_ACTIVATE.code==code)**：指定筛选条件，通过finance.STK\_EL\_TOP\_ACTIVATE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_EL\_TOP\_ACTIVATE.day>='2015-01-01'，表示筛选日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**

2.  不能进行连表查询，即同时查询多张表的数据

    **示例：**


```python
q=query(finance.STK_EL_TOP_ACTIVATE).filter(finance.STK_EL_TOP_ACTIVATE.code=='000002.XSHE').limit(10)
df=finance.run_query(q)
print(df)

       id         day link_id     link_name rank       code   name     exchange  \
0  323010  2018-01-15  310002       深股通    2  000002.XSHE  万科Ａ      深交所
1  323050  2018-01-16  310002       深股通    2  000002.XSHE  万科Ａ      深交所
2  323089  2018-01-17  310002       深股通    1  000002.XSHE  万科Ａ      深交所
3  323132  2018-01-18  310002       深股通    4  000002.XSHE  万科Ａ      深交所
4  323213  2018-01-23  310002       深股通    6  000002.XSHE  万科Ａ      深交所
5  323254  2018-01-24  310002       深股通    7  000002.XSHE  万科Ａ      深交所
6  341170  2018-01-25  310002       深股通    7  000002.XSHE  万科Ａ      深交所
7  341209  2018-01-26  310002       深股通    6  000002.XSHE  万科Ａ      深交所
8  341248  2018-01-29  310002       深股通    5  000002.XSHE  万科Ａ      深交所
9  341444  2018-01-30  310002       深股通    5  000002.XSHE  万科Ａ      深交所

           buy         sell        total
0  124497968.0  326656496.0  451154464.0
1  127460061.0  465933921.0  593393982.0
2  157676630.0  542617116.0  700293746.0
3  203996076.0  105819761.0  309815837.0
4  141515523.0  190282952.0  331798475.0
5  110052973.0  163321615.0  273374588.0
6  179785644.0  120157651.0  299943295.0
7  166750550.0   78471253.0  245221803.0
8  157899558.0  170790111.0  328689669.0
9  201547219.0  165714289.0  367261508.0
```

<a id="市场通成交与额度信息"></a>

### 市场通成交与额度信息

```python
from jqdata import finance
finance.run_query(query(finance.STK_ML_QUOTA).filter(finance.STK_ML_QUOTA.day==day).limit(n))
```

记录沪股通、深股通和港股通每个交易日的成交与额度的控制情况。

**参数：**

-   **query(finance.STK\_ML\_QUOTA)**：表示从finance.STK\_ML\_QUOTA这张表中查询沪港通、深港通和港股通的成交与额度信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.STK\_ML\_QUOTA**：代表了市场通成交与额度信息表，记录了沪港通、深港通和港股通成交与额度的信息，包括买入、卖出等，表结构和字段信息如下：

| 字段 | 名称 | 类型 | 备注/示例 |
| --- | --- | --- | --- |
| day | 交易日期 | date |  |
| link\_id | 市场通编码 | int |  |
| link\_name | 市场通名称 | varchar(32) | 包括以下四个名称： 沪股通，深股通，港股通(沪）,港股通(深）;其中沪股通和深股通属于北向资金，港股通（沪）和港股通（深）属于南向资金。 |
| currency\_id | 货币编码 | int |  |
| currency | 货币名称 | varchar(16) |  |
| buy\_amount | 买入成交额 | decimal(20,4) | 亿(自2024-08-18之后北向不再披露) |
| buy\_volume | 买入成交数 | decimal(20,4) | 笔(自2024-08-18之后北向不再披露) |
| sell\_amount | 卖出成交额 | decimal(20,4) | 亿(自2024-08-18之后北向不再披露) |
| sell\_volume | 卖出成交数 | decimal(20,4) | 笔(自2024-08-18之后北向不再披露) |
| sum\_amount | 累计成交额 | decimal(20,4) | 买入成交额+卖出成交额 |
| sum\_volume | 累计成交数目 | decimal(20,4) | 买入成交量+卖出成交量 |
| quota | 总额度 | decimal(20, 4) | 亿（2016-08-16号起，沪港通和深港通不再设总额度限制） |
| quota\_balance | 总额度余额 | decimal(20, 4) | 亿 |
| quota\_daily | 每日额度 | decimal(20, 4) | 亿 (自2024-08-18之后不再披露) |
| quota\_daily\_balance | 每日额度余额 | decimal(20, 4) | 亿 (自2024-08-18之后不再披露) |

**货币编码**

| 货币编码 | 货币名称 |
| --- | --- |
| 110001 | 人民币 |
| 110003 | 港元 |

**市场通编码**

| 市场通编码 | 市场通名称 |
| --- | --- |
| 310001 | 沪股通 |
| 310002 | 深股通 |
| 310003 | 港股通（沪） |
| 310004 | 港股通（深） |

-   **filter(finance.STK\_ML\_QUOTA.day==day)**：指定筛选条件，通过finance.STK\_ML\_QUOTA.day==day可以指定你想要查询的日期；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_ML\_QUOTA.link\_id==310001，表示筛选市场通编码为310001（沪股通）的数据；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**

2.  不能进行连表查询，即同时查询多张表的数据

    **示例：**


```python
q=query(finance.STK_ML_QUOTA).filter(finance.STK_ML_QUOTA.day>='2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

    id         day link_id    link_name     currency_id   currency_name  buy_amount  \
0  183  2015-01-05  310001       沪股通      110001           人民币      40.01
1  271  2015-01-05  310003    港股通(沪)      110003            港元      20.51
2  182  2015-01-06  310001       沪股通      110001           人民币       32.4
3  270  2015-01-06  310003    港股通(沪)      110003            港元      11.15
4  181  2015-01-07  310001       沪股通      110001           人民币      20.43
5  269  2015-01-07  310003    港股通(沪)      110003            港元      10.28
6  180  2015-01-08  310001       沪股通      110001           人民币      22.31
7  268  2015-01-08  310003    港股通(沪)      110003            港元       7.86
8  179  2015-01-09  310001       沪股通      110001           人民币       34.7
9  267  2015-01-09  310003    港股通(沪)      110003            港元      11.16

  buy_volume  sell_amount  sell_volume sum_amount sum_volume quota  \
0    96819.0       19.98     48515.0      59.99   145334.0   NaN
1    33888.0        5.22     12241.0      25.73    46129.0   NaN
2    67392.0       32.64     76188.0      65.04   143580.0   NaN
3    22180.0        2.88      6806.0      14.03    28986.0   NaN
4    62539.0       17.01     39833.0      37.44   102372.0   NaN
5    21663.0        2.85      6296.0      13.13    27959.0   NaN
6    53725.0       21.74     62294.0      44.05   116019.0   NaN
7    15741.0        2.95      7050.0      10.81    22791.0   NaN
8   128236.0       20.17     51436.0      54.87   179672.0   NaN
9    21465.0        4.47      8845.0      15.63    30310.0   NaN

  quota_balance  quota_daily    quota_daily_balance
0           NaN       130.0               83.11
1           NaN       105.0                87.7
2           NaN       130.0              109.09
3           NaN       105.0               95.32
4           NaN       130.0              112.47
5           NaN       105.0               95.91
6           NaN       130.0              119.22
7           NaN       105.0               98.63
8           NaN       130.0              113.83
9           NaN       105.0               96.98
```

<a id="市场通汇率"></a>

### 市场通汇率

```python
from jqdata import finance
finance.run_query(query(finance.STK_EXCHANGE_LINK_RATE).filter(finance.STK_EXCHANGE_LINK_RATE.day==day).limit(n))
```

包含2014年11月起人民币和港币之间的参考汇率/结算汇兑比率信息。

**参数：**

-   **query(finance.STK\_EXCHANGE\_LINK\_RATE)**：表示从finance.STK\_EXCHANGE\_LINK\_RATE这张表中查询汇率信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_EXCHANGE\_LINK\_RATE**：代表了市场通汇率表，记录参考汇率/结算汇兑比率信息，包括买入参考/结算汇率、卖出参考/结算汇率等，表结构和字段信息如下：


| 字段 | 名称 | 类型 | 备注/示例 |
| --- | --- | --- | --- |
| day | 日期 | Date |  |
| link\_id | 市场通编码 | int |  |
| link\_name | 市场通名称 | varchar(32) | 以“港股通(沪)”为代表 |
| domestic\_currency | 本币 | varchar(12) | RMB |
| foreign\_currency | 外币 | varchar(12) | HKD |
| refer\_bid\_rate | 买入参考汇率 | decimal(10, 5) |  |
| refer\_ask\_rate | 卖出参考汇率 | decimal(10, 5) |  |
| settle\_bid\_rate | 买入结算汇率 | decimal(10, 5) |  |
| settle\_ask\_rate | 卖出结算汇率 | decimal(10, 5) |  |

**市场通编码**

| 市场通编码 | 市场通名称 |
| --- | --- |
| 310003 | 港股通（沪） |
| 310004 | 港股通（深） |

-   **filter(finance.STK\_EXCHANGE\_LINK\_RATE.day==day)**：指定筛选条件，通过finance.STK\_EXCHANGE\_LINK\_RATE.day==day可以指定你想要查询的日期；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_EXCHANGE\_LINK\_RATE.link\_id==310001，表示筛选市场通编码为310001（沪股通）的数据；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**

2.  不能进行连表查询，即同时查询多张表的数据

    **示例：**


```python
q=query(finance.STK_EXCHANGE_LINK_RATE).filter(finance.STK_EXCHANGE_LINK_RATE.day>='2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

   id         day link_id    link_name        domestic_currency   foreign_currency  \
0  31  2015-01-05  310003    港股通(沪)               RMB              HKD
1  32  2015-01-06  310003    港股通(沪)               RMB              HKD
2  33  2015-01-07  310003    港股通(沪)               RMB              HKD
3  34  2015-01-08  310003    港股通(沪)               RMB              HKD
4  35  2015-01-09  310003    港股通(沪)               RMB              HKD
5  36  2015-01-12  310003    港股通(沪)               RMB              HKD
6  37  2015-01-13  310003    港股通(沪)               RMB              HKD
7  38  2015-01-14  310003    港股通(沪)               RMB              HKD
8  39  2015-01-15  310003    港股通(沪)               RMB              HKD
9  40  2015-01-16  310003    港股通(沪)               RMB              HKD

  refer_bid_rate   refer_ask_rate  settle_bid_rate   settle_ask_rate
0         0.7774         0.8254         0.80317         0.80283
1         0.7785         0.8267         0.80307         0.80213
2         0.7777         0.8259         0.80197         0.80163
3         0.7773         0.8253         0.80116         0.80144
4         0.7776         0.8258           0.802          0.8014
5         0.7771         0.8251         0.80176         0.80044
6         0.7758         0.8238          0.7999          0.7997
7         0.7755         0.8235         0.79973         0.79927
8         0.7752         0.8232         0.79983         0.79857
9         0.7744         0.8222         0.79597         0.80063
```

<a id="沪深港通持股数据"></a>

### 沪深港通持股数据

```sql
from jqdata import finance
df=finance.run_query(query(finance.STK_HK_HOLD_INFO).filter(finance.STK_HK_HOLD_INFO.link_id==310001))
print(df)
```

记录了北向资金（沪股通、深股通）和南向资金港股通的持股数量和持股比例，数据从2017年3月17号开始至今，一般在盘前6:30左右更新昨日数据。
北向数据自 2024-08-17 开始, 改为按季度披露

**参数：**

-   **query(finance.STK\_HK\_HOLD\_INFO)**：表示从finance.STK\_HK\_HOLD\_INFO这张表中查询沪深港通的持股数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号分隔进行提取；如query(finance.STK\_HK\_HOLD\_INFO.code)。query函数的更多用法详见：[query简易教程](https://www.joinquant.com/view/community/detail/16411)。
-   **finance.STK\_HK\_HOLD\_INFO**：收录了沪深港通每日的持股数量和持股比例数据，表结构和字段信息如下：

| 字段名称 | 中文名称 | 字段类型 | 能否为空 | 注释 |
| --- | --- | --- | --- | --- |
| day | 日期 | date | N | 北向自2024-08-18之后按照季度进行披露 |
| link\_id | 市场通编码 | int | N | 三种类型：310001-沪股通，310002-深股通，310005-港股通 |
| link\_name | 市场通名称 | varchar(32) | N | 三种类型：沪股通，深股通，港股通 |
| code | 股票代码 | varchar(12) | N |  |
| name | 股票名称 | varchar(100) | N |  |
| share\_number | 持股数量 | int |  | 单位：股，于中央结算系统的持股量 |
| share\_ratio | 持股比例 | decimal(10,4) |  | 单位：％，沪股通（占流通股百分比）：占于上交所上市及交易的A股总数的百分比；深股通（占总股本百分比）：占于深交所上市及交易的A股总数的百分比；港股通（占总股本百分比）：占已发行股份百分比 |

-   **filter(finance.STK\_HK\_HOLD\_INFO.link\_id==310001)**：指定筛选条件，通过finance.STK\_HK\_HOLD\_INFO.link\_id==310001可以指定查询沪股通的持股数据；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_HK\_HOLD\_INFO.day=='2019-03-01'，指定获取2019年3月1日的沪深港通持股数据。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  为了防止返回数据量过大, 我们每次最多返回4000行
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#获取北向资金沪股通的持股数据
from jqdata import finance
df=finance.run_query(query(finance.STK_HK_HOLD_INFO).filter(finance.STK_HK_HOLD_INFO.link_id==310001).order_by(finance.STK_HK_HOLD_INFO.day.desc()))
print(df)

    id      day        link_id  link_name   code     name    share_number   share_ratio
0    1319365 2019-03-01  310001  沪股通 603997.XSHG 继峰股份    2905091        0.46
1    1319364 2019-03-01  310001  沪股通 603993.XSHG 洛阳钼业    140398591      0.79
2    1319363 2019-03-01  310001  沪股通 603989.XSHG 艾华集团    6574106        1.68
3    1319362 2019-03-01  310001  沪股通 603986.XSHG 兆易创新    1851725        0.89
4    1319361 2019-03-01  310001  沪股通 603979.XSHG 金诚信      191590         0.03
5    1319360 2019-03-01  310001  沪股通 603959.XSHG 百利科技    81666          0.05
6    1319359 2019-03-01  310001  沪股通 603939.XSHG 益丰药房    21973169       6.05
7    1319358 2019-03-01  310001  沪股通 603929.XSHG 亚翔集成    156924         0.16
8    1319357 2019-03-01  310001  沪股通 603899.XSHG 晨光文具    4751149        0.51
9    1319356 2019-03-01  310001  沪股通 603898.XSHG 好莱客      1843470        0.59
10    1319355 2019-03-01  310001  沪股通 603897.XSHG 长城科技    168377          0.37
...
```
