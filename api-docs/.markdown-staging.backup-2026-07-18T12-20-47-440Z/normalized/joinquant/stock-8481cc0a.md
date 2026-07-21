---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 上市公司股东和股本信息
section_path:
  - 股票数据
  - 上市公司股东和股本信息
source_file: api-docs/raw/joinquant/Stock/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Stock
source_anchor: "#上市公司股东和股本信息"
source_sha256: 4f98d75f021aa61af93665d67a18decc90781d913d89bb880d603b6b48186e5b
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="上市公司股东和股本信息"></a>

## 上市公司股东和股本信息

<a id="十大股东"></a>

### 十大股东

```python
from jqdata import finance
finance.run_query(query(finance.STK_SHAREHOLDER_TOP10).filter(finance.STK_SHAREHOLDER_TOP10.code==code).limit(n))
```

获取上市公司前十大股东的持股情况，包括持股数量，所持股份性质，变动原因等。

**参数：**

-   **query(finance.STK\_SHAREHOLDER\_TOP10)**：表示从finance.STK\_SHAREHOLDER\_TOP10这张表中查询上市公司前十大股东的持股情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_SHAREHOLDER\_TOP10**：代表上市公司十大股东表，收录了上市公司前十大股东的持股情况，包括持股数量，所持股份性质，变动原因等。表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) | 在此是指上市公司的名称 |
    | code | 股票代码 | varchar(12) |  |
    | end\_date | 截止日期 | date | 公告中统计的十大股东截止到某一日期的更新情况。 |
    | pub\_date | 公告日期 | date | 公告中会提到十大股东的更新情况。 |
    | change\_reason\_id | 变动原因编码 | int |  |
    | change\_reason | 变动原因 | varchar(120) |  |
    | shareholder\_rank | 股东名次 | int |  |
    | shareholder\_name | 股东名称 | varchar(200) |  |
    | shareholder\_name\_en | 股东名称（英文） | varchar(200) |  |
    | shareholder\_id | 股东ID | int |  |
    | shareholder\_class\_id | 股东类别编码 | int |  |
    | shareholder\_class | 股东类别 | varchar(150) | 包括:券商、社保基金、证券投资基金、保险公司、QFII、其它机构、个人等 |
    | share\_number | 持股数量 | decimal(10,4) | 股 |
    | share\_ratio | 持股比例 | decimal(10,4) | % |
    | sharesnature\_id | 股份性质编码 | int |  |
    | sharesnature | 股份性质 | varchar(120) | 包括:国家股、法人股、个人股外资股、流通A股、流通B股、职工股、发起人股、转配股等 |
    | share\_pledge\_freeze | 股份质押冻结数量 | decimal(10,4) | 如果股份质押数量和股份冻结数量任意一个字段有值，则等于后两者之和 |
    | share\_pledge | 股份质押数量 | decimal(10,4) | 股 |
    | share\_freeze | 股份冻结数量 | decimal(10,4) | 股 |

-   **filter(finance.STK\_SHAREHOLDER\_TOP10.code==code)**：指定筛选条件，通过finance.STK\_SHAREHOLDER\_TOP10.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHAREHOLDER\_TOP10.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为恒瑞医药（600276.XSHG)的十大股东情况，限定返回条数为10条
q=query(finance.STK_SHAREHOLDER_TOP10).filter(finance.STK_SHAREHOLDER_TOP10.code=='600276.XSHG',finance.STK_SHAREHOLDER_TOP10.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

       id  company_name           company_id         code    end_date    pub_date  \
0  753808  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
1  753809  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
2  753810  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
3  753811  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
4  753812  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
5  753813  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
6  753814  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
7  753815  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
8  753816  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31
9  753817  江苏恒瑞医药股份有限公司  420600276  600276.XSHG  2014-12-31  2015-03-31

  change_reason_id change_reason     shareholder_rank  \
0           306019          定期报告                4
1           306019          定期报告                9
2           306019          定期报告               10
3           306019          定期报告                2
4           306019          定期报告                3
5           306019          定期报告                5
6           306019          定期报告                6
7           306019          定期报告                7
8           306019          定期报告                8
9           306019          定期报告                1

                    shareholder_name     ...                   shareholder_id  \
0                         中国医药工业有限公司     ...                  100014895
1               交通银行-博时新兴成长股票型证券投资基金     ...           120050009
2   新华人寿保险股份有限公司-分红-团体分红-018L-FH001沪     ...           100000383
3                         西藏达远投资有限公司     ...                   100097529
4                      连云港恒创医药科技有限公司     ...                100008678
5                         江苏金海投资有限公司     ...                   100008257
6                         香港中央结算有限公司     ...                   100011907
7  中国农业银行股份有限公司-国泰国证医药卫生行业指数分级证券投资基金     ...   120160219
8         兴业银行股份有限公司-兴全趋势投资混合型证券投资基金     ...        120163402
9                       江苏恒瑞医药集团有限公司     ...                   100008682

  shareholder_class_id shareholder_class share_number share_ratio  \
0               307099              其他机构   73000000.0        4.85
1               307003            证券投资基金   10107880.0        0.67
2               307014            保险投资组合    9820232.0        0.65
3               307099              其他机构  240536692.0       15.99
4               307099              其他机构  112278458.0        7.47
5               307099              其他机构   53474244.0        3.56
6               307099              其他机构   30821240.0        2.05
7               307003            证券投资基金   12489920.0        0.83
8               307003            证券投资基金   11999901.0         0.8
9               307099              其他机构  365776169.0       24.32

  sharesnature_id    sharesnature    share_pledge_freeze   share_pledge  share_freeze
0          308007         流通A股                 NaN          NaN          NaN
1          308007         流通A股                 NaN          NaN          NaN
2          308007         流通A股                 NaN          NaN          NaN
3          308007         流通A股                 NaN          NaN          NaN
4          308007         流通A股                 NaN          NaN          NaN
5          308007         流通A股          53474244.0   53474244.0          NaN
6          308007         流通A股                 NaN          NaN          NaN
7          308007         流通A股                 NaN          NaN          NaN
8          308007         流通A股                 NaN          NaN          NaN
9          308007         流通A股                 NaN          NaN          NaN
```

<a id="十大流通股东"></a>

### 十大流通股东

```python
from jqdata import finance
finance.run_query(query(finance.STK_SHAREHOLDER_FLOATING_TOP10).filter(finance.STK_SHAREHOLDER_FLOATING_TOP10.code==code).limit(n))
```

获取上市公司前十大流通股东的持股情况，包括持股数量，所持股份性质，变动原因等。

**参数：**

-   **query(finance.STK\_SHAREHOLDER\_FLOATING\_TOP10)**：表示从finance.STK\_SHAREHOLDER\_FLOATING\_TOP10这张表中查询上市公司前十大流通股东的持股情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_SHAREHOLDER\_FLOATING\_TOP10**：代表上市公司十大流通股东表，收录了上市公司前十大流通股东的持股情况，包括持股数量，所持股份性质，变动原因等。表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | code | 股票代码 | varchar(12) |  |
    | end\_date | 截止日期 | date |  |
    | pub\_date | 公告日期 | date |  |
    | change\_reason\_id | 变动原因编码 | int |  |
    | change\_reason | 变动原因 | varchar(120) |  |
    | shareholder\_rank | 股东名次 | int |  |
    | shareholder\_id | 股东ID | int |  |
    | shareholder\_name | 股东名称 | varchar(200) |  |
    | shareholder\_name\_en | 股东名称（英文） | varchar(150) |  |
    | shareholder\_class\_id | 股东类别编码 | int |  |
    | shareholder\_class | 股东类别 | varchar(150) |  |
    | share\_number | 持股数量 | int | 股 |
    | share\_ratio | 持股比例 | decimal(10,4) | % |
    | sharesnature\_id | 股份性质编码 | int |  |
    | sharesnature | 股份性质 | varchar(120) |  |

-   **filter(finance.STK\_SHAREHOLDER\_FLOATING\_TOP10.code==code)**：指定筛选条件，通过finance.STK\_SHAREHOLDER\_FLOATING\_TOP10.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHAREHOLDER\_FLOATING\_TOP10.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为恒瑞医药（600276.XSHG)的十大流通股东情况，返回条数为10条
q=query(finance.STK_SHAREHOLDER_FLOATING_TOP10).filter(finance.STK_SHAREHOLDER_FLOATING_TOP10.code=='600276.XSHG',finance.STK_SHAREHOLDER_FLOATING_TOP10.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

       id company_id  company_name         code    end_date    pub_date  \
0  585806  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
1  585807  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
2  585808  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
3  585809  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
4  585810  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
5  585811  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
6  585812  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
7  585813  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
8  585814  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31
9  585815  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31

  change_reason_id change_reason shareholder_rank shareholder_id  \
0            15019          定期报告                1              0
1            15019          定期报告                2              0
2            15019          定期报告                3              0
3            15019          定期报告                4              0
4            15019          定期报告                5              0
5            15019          定期报告                6              0
6            15019          定期报告                7       77160219
7            15019          定期报告                8       77163402
8            15019          定期报告                9       77050009
9            15019          定期报告               10              0

                    shareholder_name              shareholder_name_en     shareholder_class_id  \
0                       江苏恒瑞医药集团有限公司                 NaN                 3999
1                         西藏达远投资有限公司                 NaN                 3999
2                      连云港恒创医药科技有限公司                 NaN                 3999
3                         中国医药工业有限公司                 NaN                 3999
4                         江苏金海投资有限公司                 NaN                 3999
5                         香港中央结算有限公司                 NaN                 3999
6  中国农业银行股份有限公司-国泰国证医药卫生行业指数分级证券投资基金  NaN                 3003
7         兴业银行股份有限公司-兴全趋势投资混合型证券投资基金        NaN                 3003
8               交通银行-博时新兴成长股票型证券投资基金                 NaN                 3003
9   新华人寿保险股份有限公司-分红-团体分红-018L-FH001沪                 NaN                 3017

  shareholder_class share_number share_ratio sharesnature_id sharesnature
0              其他机构  332523790.0      22.109           25007         流通A股
1              其他机构  229034683.0      15.228           25007         流通A股
2              其他机构  102094053.0       6.788           25007         流通A股
3              其他机构   70203316.0       4.668           25007         流通A股
4              其他机构   50367370.0       3.349           25007         流通A股
5              其他机构   17207872.0       1.144           25007         流通A股
6            证券投资基金   15161505.0       1.008           25007         流通A股
7            证券投资基金   10299800.0       0.685           25007         流通A股
8            证券投资基金    9929500.0        0.66           25007         流通A股
9            保险投资组合    9296487.0       0.618           25007         流通A股
```

<a id="股东股份质押"></a>

### 股东股份质押

```python
from jqdata import finance
finance.run_query(query(finance.STK_SHARES_PLEDGE).filter(finance.STK_SHARES_PLEDGE.code==code).limit(n))
```

获取上市公司股东股份的质押情况。

**参数：**

-   **query(finance.STK\_SHARES\_PLEDGE)**：表示从finance.STK\_SHARES\_PLEDGE这张表中查询上市公司股东股份的质押情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_SHARES\_PLEDGE**：代表上市公司股东股份质押表，收录了上市公司股东股份的质押情况。表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | code | 股票代码 | varchar(12) |  |
    | pub\_date | 公告日期 | date |  |
    | pledgor\_id | 出质人ID | int |  |
    | pledgor | 出质人 | varchar(100) | 将资产质押出去的人成为出质人 |
    | pledgee | 质权人 | varchar(100) |  |
    | pledge\_item | 质押事项 | varchar(500) | 质押原因，记录借款人、借款金额、币种等内容 |
    | pledge\_nature\_id | 质押股份性质编码 | int |  |
    | pledge\_nature | 质押股份性质 | varchar(120) |  |
    | pledge\_number | 质押数量 | int | 股 |
    | pledge\_total\_ratio | 占总股本比例 | decimal(10,4) | % |
    | start\_date | 质押起始日 | date |  |
    | end\_date | 质押终止日 | date |  |
    | unpledged\_date | 质押解除日 | date |  |
    | unpledged\_number | 质押解除数量 | int | 股 |
    | unpledged \_detail | 解除质押说明 | varchar(1000) |  |
    | is\_buy\_back | 是否质押式回购交易 | char(1) |  |

-   **filter(finance.STK\_SHARES\_PLEDGE.code==code)**：指定筛选条件，通过finance.STK\_SHARES\_PLEDGE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHARES\_PLEDGE.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为万科（000002.XSHE)的股东股份质押情况，返回条数为10条
q=query(finance.STK_SHARES_PLEDGE).filter(finance.STK_SHARES_PLEDGE.code=='000002.XSHE',finance.STK_SHARES_PLEDGE.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

      id company_id      company_name         code      pub_date     pledgor_id  \
0  30928  430000002   万科企业股份有限公司  000002.XSHE  2015-11-11        NaN
1  41070  430000002   万科企业股份有限公司  000002.XSHE  2016-07-14        NaN
2  52962  430000002   万科企业股份有限公司  000002.XSHE  2017-03-08        NaN
3  52963  430000002   万科企业股份有限公司  000002.XSHE  2017-03-08        NaN
4  53281  430000002   万科企业股份有限公司  000002.XSHE  2017-03-14        NaN
5  53430  430000002   万科企业股份有限公司  000002.XSHE  2017-03-17        NaN
6  53454  430000002   万科企业股份有限公司  000002.XSHE  2017-03-17        NaN
7  53455  430000002   万科企业股份有限公司  000002.XSHE  2017-03-17        NaN
8  53456  430000002   万科企业股份有限公司  000002.XSHE  2017-03-17        NaN
9  53504  430000002   万科企业股份有限公司  000002.XSHE  2017-03-17        NaN

         pledgor                   pledgee  \
0  深圳市钜盛华股份有限公司  鹏华资产管理（深圳）有限公司
1  深圳市钜盛华股份有限公司    中国银河证券股份有限公司
2  深圳市钜盛华股份有限公司  鹏华资产管理（深圳）有限公司
3  深圳市钜盛华股份有限公司  鹏华资产管理（深圳）有限公司
4  深圳市钜盛华股份有限公司      平安证券股份有限公司
5   广州市凯进投资有限公司      中信证券股份有限公司
6   广州市悦朗投资有限公司      中信证券股份有限公司
7   广州市广域实业有限公司      中信证券股份有限公司
8   广州市启通实业有限公司      中信证券股份有限公司
9   广州市昱博投资有限公司      中信证券股份有限公司

                                         pledge_item pledge_nature_id  \
0  本公司股东深圳市钜盛华股份有限公司将持有的公司728,000,000股无限售流通A股质押给鹏...              NaN
1  本公司股东深圳市钜盛华股份有限公司将持有的本公司37357300股股权质押给中国银河证券股份...         308007.0
2  本公司股东深圳市钜盛华股份有限公司将2015年10月28日质押给鹏华资产管理（深圳）有限公司...         308007.0
3  本公司股东深圳市钜盛华股份有限公司将2015年10月21日质押给鹏华资产管理（深圳）有限公司...         308007.0
4  本公司第一大股东深圳市钜盛华股份有限公司将持有的本公司182000000股流通A股股权质押给...         308007.0
5  本公司股东广州市凯进投资有限公司将持有的本公司50759970股股权质押给中信证券股份有限公...              NaN
6  本公司股东广州市悦朗投资有限公司将持有的本公司205731814股股权质押给中信证券股份有限...              NaN
7  本公司股东广州市广域实业有限公司将持有的本公司86701961股股权质押给中信证券股份有限公...              NaN
8  本公司股东广州市启通实业有限公司将持有的本公司68205047股股权质押给中信证券股份有限公...              NaN
9  本公司股东广州市昱博投资有限公司将持有的本公司210778555股股权质押给中信证券股份有限...              NaN

      pledge_nature pledge_number   pledge_total_ratio  start_date    end_date  \
0           NaN   728000000.0                7.0        2015-10-15         NaN
1          流通A股    37357300.0                NaN     2016-07-12         NaN
2          流通A股           NaN                NaN     2015-10-28  2017-03-03
3          流通A股           NaN                NaN     2015-10-21  2017-03-03
4          流通A股   182000000.0                NaN     2017-03-09         NaN
5           NaN    50759970.0                   NaN  2017-03-16  2018-03-16
6           NaN   205731814.0                   NaN  2017-03-16  2018-03-16
7           NaN    86701961.0                   NaN  2017-03-16  2018-03-16
8           NaN    68205047.0                   NaN  2017-03-16  2018-03-16
9           NaN   210778555.0                   NaN  2017-03-16  2018-03-16

  unpledged_date unpledged_number unpledged_detail is_buy_back
0            NaN              NaN              NaN         NaN
1            NaN              NaN              NaN           1
2     2017-03-03       91000000.0              NaN         NaN
3     2017-03-03       91000000.0              NaN         NaN
4            NaN              NaN              NaN           1
5            NaN              NaN              NaN           1
6            NaN              NaN              NaN           1
7            NaN              NaN              NaN           1
8            NaN              NaN              NaN           1
9            NaN              NaN              NaN           1
```

<a id="股东股份冻结"></a>

### 股东股份冻结

```python
from jqdata import finance
finance.run_query(query(finance.STK_SHARES_FROZEN).filter(finance.STK_SHARES_FROZEN.code==code).limit(n))
```

获取上市公司股东股份的冻结情况

**参数：**

-   **query(finance.STK\_SHARES\_FROZEN)**：表示从finance.STK\_SHARES\_FROZEN这张表中查询股东股份的冻结情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_SHARES\_FROZEN**：代表上市公司股东股份冻结表，收录了上市公司股东股份的冻结情况，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 含义 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | pub\_date | 公告日期 | date |  |
    | code | 股票代码 | varchar(12) |  |
    | frozen\_person\_id | 被冻结当事人ID | int |  |
    | frozen\_person | 被冻结当事人 | varchar(100) |  |
    | frozen\_reason | 冻结事项 | varchar(600) |  |
    | frozen\_share\_nature\_id | 被冻结股份性质编码 | int |  |
    | frozen\_share\_nature | 被冻结股份性质 | varchar(120) | 包括:国家股、法人股、个人股、外资股、流通A股、流通B股、职工股、发起人股、转配股 |
    | frozen\_number | 冻结数量 | int | 股 |
    | frozen\_total\_ratio | 占总股份比例 | decimal(10,4) | % |
    | freeze\_applicant | 冻结申请人 | varchar(100) |  |
    | freeze\_executor | 冻结执行人 | varchar(100) |  |
    | start\_date | 冻结起始日 | date |  |
    | end\_date | 冻结终止日 | date |  |
    | unfrozen\_date | 解冻日期 | date | 分批解冻的为最近一次解冻日期 |
    | unfrozen\_number | 累计解冻数量 | int | 原解冻数量(股) |
    | unfrozen\_detail | 解冻处理说明 | varchar(1000) | 冻结过程及结束后的处理结果 |

-   **filter(finance.STK\_SHARES\_FROZEN.code==code)**：指定筛选条件，通过finance.STK\_SHARES\_FROZEN.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHARES\_FROZEN.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为文一科技（600520.XSHG)的股东股份冻结情况，返回条数为10条
q=query(finance.STK_SHARES_FROZEN).filter(finance.STK_SHARES_FROZEN.code=='600520.XSHG',finance.STK_SHARES_FROZEN.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

     id company_id    company_name    pub_date         code frozen_person_id  \
0  4213  420600520  铜陵中发三佳科技股份有限公司  2015-07-11  600520.XSHG              NaN
1  4227  420600520  铜陵中发三佳科技股份有限公司  2015-08-13  600520.XSHG              NaN
2  4261  420600520  铜陵中发三佳科技股份有限公司  2015-09-22  600520.XSHG              NaN
3  4446  420600520  铜陵中发三佳科技股份有限公司  2016-03-24  600520.XSHG              NaN
4  4499  420600520  铜陵中发三佳科技股份有限公司  2016-04-30  600520.XSHG              NaN
5  4509  420600520  铜陵中发三佳科技股份有限公司  2016-05-07  600520.XSHG              NaN
6  4513  420600520  铜陵中发三佳科技股份有限公司  2016-05-21  600520.XSHG              NaN
7  4541  420600520  铜陵中发三佳科技股份有限公司  2016-06-25  600520.XSHG              NaN
8  4542  420600520  铜陵中发三佳科技股份有限公司  2016-06-25  600520.XSHG              NaN
9  4569  420600520  铜陵中发三佳科技股份有限公司  2016-07-09  600520.XSHG              NaN

       frozen_person frozen_reason frozen_share_nature_id frozen_share_nature  \
0  铜陵市三佳电子（集团）有限责任公司           NaN               308001.0               境内法人股
1  铜陵市三佳电子（集团）有限责任公司           NaN               308001.0               境内法人股
2  铜陵市三佳电子（集团）有限责任公司           NaN               308001.0               境内法人股
3  铜陵市三佳电子（集团）有限责任公司           NaN               308001.0               境内法人股
4  铜陵市三佳电子（集团）有限责任公司           NaN               308001.0               境内法人股
5  铜陵市三佳电子（集团）有限责任公司           NaN               308001.0               境内法人股
6  铜陵市三佳电子（集团）有限责任公司           NaN                    NaN                 NaN
7  铜陵市三佳电子（集团）有限责任公司           NaN                    NaN                 NaN
8  铜陵市三佳电子（集团）有限责任公司           NaN                    NaN                 NaN
9  铜陵市三佳电子（集团）有限责任公司           NaN                    NaN                 NaN

        ...       frozen_total_ratio freeze_applicant        freeze_executor  \
0       ...                    17.09              NaN             上海市金山区人民法院
1       ...                    17.09              NaN                    NaN
2       ...                    17.09   中信银行股份有限公司安庆分行                    NaN
3       ...                   17.089              NaN  安庆市宜秀区人民法院及安庆市迎江区人民法院
4       ...                   17.089              NaN            上海市浦东新区人民法院
5       ...                   17.089              NaN            上海市浦东新区人民法院
6       ...                   17.089              NaN          广东省深圳市宝安区人民法院
7       ...                      NaN     上海富汇融资租赁有限公司            上海市浦东新区人民法院
8       ...                   17.089              NaN              铜陵市中级人民法院
9       ...                      NaN              NaN          广东省深圳市宝安区人民法院

  change_reason_id change_reason  start_date    end_date unfrozen_date  \
0              NaN           NaN  2015-07-10         NaN           NaN
1              NaN           NaN         NaN  2015-08-11    2015-08-11
2              NaN           NaN         NaN         NaN           NaN
3              NaN           NaN         NaN  2016-03-16    2016-03-16
4              NaN           NaN  2016-04-27  2019-04-20           NaN
5              NaN           NaN  2016-05-04  2019-05-04           NaN
6              NaN           NaN         NaN         NaN           NaN
7              NaN           NaN         NaN  2016-06-23    2016-06-23
8              NaN           NaN         NaN  2016-06-23    2016-06-23
9              NaN           NaN         NaN  2016-07-07    2016-07-07

  unfrozen_number unfrozen_detail
0             NaN             NaN
1      27073333.0             NaN
2             NaN             NaN
3      27073333.0             NaN
4             NaN             NaN
5             NaN             NaN
6             NaN             NaN
7      27073333.0             NaN
8      27073333.0             NaN
9      27073333.0             NaN

[10 rows x 21 columns]
```

<a id="股东户数"></a>

### 股东户数

```python
from jqdata import finance
finance.run_query(query(finance.STK_HOLDER_NUM).filter(finance.STK_HOLDER_NUM.code==code).limit(n))
```

获取上市公司全部股东户数，A股股东、B股股东、H股股东的持股户数

**参数：**

-   **query(finance.STK\_HOLDER\_NUM)**：表示从finance.STK\_HOLDER\_NUM这张表中查询上市公司的股东户数，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_HOLDER\_NUM**：代表上市公司股东户数表，收录了上市公司全部股东户数，A股股东、B股股东、H股股东的持股户数情况，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | code | 股票代码 | varchar(12) |  |
    | pub\_date | 公告日期 | date |  |
    | end\_date | 截止日期 | date |  |
    | share\_holders | 股东总户数 | int |  |
    | a\_share\_holders | A股股东总户数 | int |  |
    | b\_share\_holders | B股股东总户数 | int |  |
    | h\_share\_holders | H股股东总户数 | int |  |

-   **filter(finance.STK\_HOLDER\_NUM.code==code)**：指定筛选条件，通过finance.STK\_HOLDER\_NUM.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_HOLDER\_NUM.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为万科（000002.XSHE)的股东户数情况，返回条数为10条
q=query(finance.STK_HOLDER_NUM).filter(finance.STK_HOLDER_NUM.code=='000002.XSHE',finance.STK_HOLDER_NUM.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

    id         code    end_date    pub_date share_holders a_share_holders  \
0  139  000002.XSHE  2014-12-31  2015-03-31        496922          496907
1  140  000002.XSHE  2015-03-24  2015-03-31        586390          586373
2  141  000002.XSHE  2015-03-31  2015-04-27        652130          652113
3  142  000002.XSHE  2015-06-30  2015-08-17        479264          479246
4  143  000002.XSHE  2015-09-30  2015-10-28        332360          332339
5  144  000002.XSHE  2015-12-31  2016-03-14        272370          272350
6  145  000002.XSHE  2016-02-29  2016-03-14        272167          272145
7  146  000002.XSHE  2016-03-31  2016-04-28        272085          272063
8  147  000002.XSHE  2016-06-30  2016-08-25        272027          272006
9  148  000002.XSHE  2016-07-31  2016-08-25        546713          546691

  b_share_holders h_share_holders
0             NaN              15
1             NaN              17
2             NaN              17
3             NaN              18
4             NaN              21
5             NaN              20
6             NaN              22
7             NaN              22
8             NaN              21
9             NaN              22
```

<a id="大股东增减持"></a>

### 大股东增减持

```python
from jqdata import finance
finance.run_query(query(finance.STK_SHAREHOLDERS_SHARE_CHANGE).filter(finance.STK_SHAREHOLDERS_SHARE_CHANGE.code==code).limit(n))
```

获取上市公司大股东的增减持情况。

**参数：**

-   **query(finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE)**：表示从finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE这张表中查询上市公司大股东的增减持情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE**：代表上市公司大股东增减持情况表，收录了大股东的增减持情况，表结构和字段信息如下：

    | 段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | code | 股票代码 | varchar(12) |  |
    | pub\_date | 公告日期 | date |  |
    | end\_date | 增（减）持截止日 | date | 变动截止日期 |
    | type | 增（减）持类型 | int | 0--增持;1--减持 |
    | shareholder\_id | 股东ID | int |  |
    | shareholder\_name | 股东名称 | varchar(100) |  |
    | change\_number | 变动数量 | int | 股 |
    | change\_ratio | 变动数量占总股本比例 | decimal(10,4) | 录入变动数量后，系统自动计算变动比例，持股比例可以用持股数量除以股本情况表中的总股本 |
    | price\_ceiling | 增（减）持价格上限 | varchar(100) | 公告里面一般会给一个增持或者减持的价格区间，上限就是增持价格或减持价格的最高价。如果公告中只披露了平均价，那price\_ceiling即为成交均价 |
    | after\_change\_ratio | 变动后占比 | decimal(10,4) | %，变动后持股数量占总股本比例 |

-   **filter(finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE.code==code)**：指定筛选条件，通过finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为万科（000002.XSHE)的大股东增减持情况，返回条数为10条
q=query(finance.STK_SHAREHOLDERS_SHARE_CHANGE).filter(finance.STK_SHAREHOLDERS_SHARE_CHANGE.code=='000002.XSHE',finance.STK_SHAREHOLDERS_SHARE_CHANGE.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

     id company_id company_name         code    pub_date    end_date type  \
0  1362  430000002   万科企业股份有限公司  000002.XSHE  2015-10-22  2015-10-20    0

  shareholder_id shareholder_name change_number change_ratio price_ceiling  \
0            NaN     深圳市矩盛华股份有限公司   369084217.0         3.34           NaN

  after_change_ratio
0                NaN
```

<a id="受限股份上市公告日期"></a>

### 受限股份上市公告日期

```python
from jqdata import finance
finance.run_query(query(finance.STK_LIMITED_SHARES_LIST).filter(finance.STK_LIMITED_SHARES_LIST.code==code).limit(n))
```

获取上市公司受限股份上市公告日期和预计解禁日期。

**参数：**

-   **query(finance.STK\_LIMITED\_SHARES\_LIST)**：表示从finance.STK\_LIMITED\_SHARES\_LIST这张表中查询上市公司受限股份上市公告和预计解禁的日期，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[query简单教程](https://www.joinquant.com/view/community/detail/433d0e9ed9fed11fc9f7772eab8d9376)

-   **finance.STK\_LIMITED\_SHARES\_LIST**：代表受限股份上市公告日期表，收录了上市公司受限股份上市公告和预计解禁的日期，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 含义 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | code | 股票代码 | varchar(12) |  |
    | pub\_date | 公告日期 | date | 上市流通方案公布日期 |
    | shareholder\_name | 股东名称 | varchar(100) |  |
    | expected\_unlimited\_date | 预计解除限售日期 | date |  |
    | expected\_unlimited\_number | 预计解除限售数量 | int | 单位：股 |
    | expected\_unlimited\_ratio | 预计解除限售比例 | decimal(10,4) | 单位：％；预计解除限售数量占总股本比例 |
    | actual\_unlimited\_date | 实际解除限售日期 | date |  |
    | actual\_unlimited\_number | 实际解除限售数量 | int | 单位：股 |
    | actual\_unlimited\_ratio | 实际解除限售比例 | decimal(10,4) | 单位：％；实际解除限售数量占总股本比例 |
    | limited\_reason\_id | 限售原因编码 | int | 如下 限售原因编码 |
    | limited\_reason | 限售原因 | varchar(60) | 用户选择：股改限售；发行限售 |
    | trade\_condition | 上市交易条件 | varchar(500) | 股份上市交易的条件限制 |

-   **filter(finance.STK\_LIMITED\_SHARES\_LIST.code==code)**：指定筛选条件，通过finance.STK\_LIMITED\_SHARES\_LIST.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_LIMITED\_SHARES\_LIST.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为华泰证券（600276.XSHG)的受限股份上市公告日期，返回条数为10条
q=query(finance.STK_LIMITED_SHARES_LIST).filter(finance.STK_LIMITED_SHARES_LIST.code=='601688.XSHG',finance.STK_LIMITED_SHARES_LIST.pub_date>'2018-01-01').limit(10)
df=finance.run_query(q)
print(df)

      id  company_id company_name         code    pub_date   shareholder_name  \
0  34395   460000161   华泰证券股份有限公司  601688.XSHG  2018-08-04  阿里巴巴（中国）网络技术有限公司等

  expected_unlimited_date  expected_unlimited_number expected_unlimited_ratio  \
0              2019-08-02               1.088731e+09                     None

  actual_unlimited_date actual_unlimited_number actual_unlimited_ratio  \
0                  None                    None                   None

   limited_reason_id limited_reason trade_condition
0             309008        非公开发行限售            None
```

<a id="受限股份实际解禁日期"></a>

### 受限股份实际解禁日期

```python
from jqdata import finance
finance.run_query(query(finance.STK_LIMITED_SHARES_UNLIMIT).filter(finance.STK_LIMITED_SHARES_UNLIMIT.code==code).limit(n))
```

获取公司已上市的受限股份实际解禁的日期。

**参数：**

-   **query(finance.STK\_LIMITED\_SHARES\_UNLIMIT)**：表示从finance.STK\_LIMITED\_SHARES\_UNLIMIT这张表中查询上市公司受限股份实际解禁的日期，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_LIMITED\_SHARES\_UNLIMIT**：代表上市公司受限股份实际解禁表，收录了上市公司受限股份实际解禁的日期信息，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 含义 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | code | 股票代码 | varchar(12) |  |
    | pub\_date | 公告日期 | date |  |
    | shareholder\_name | 股东名称 | varchar(100) |  |
    | actual\_unlimited\_date | 实际解除限售日期 | date |  |
    | actual\_unlimited\_number | 实际解除限售数量 | int | 股 |
    | actual\_unlimited\_ratio | 本次解禁实际可流通比例 | decimal(10,4) | 本次解禁实际可流通数量/总股本，单位% |
    | limited\_reason\_id | 限售原因编码 | int |  |
    | limited\_reason | 限售原因 | varchar(60) |  |
    | actual\_trade\_number | 实际可流通数量 | int | 股 |

-   **filter(finance.STK\_LIMITED\_SHARES\_UNLIMIT.code==code)**：指定筛选条件，通过finance.STK\_LIMITED\_SHARES\_UNLIMIT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_LIMITED\_SHARES\_UNLIMIT.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据，列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为恒瑞医药（600276.XSHG)的受限股份实际解禁日期，返回条数为10条
q=query(finance.STK_LIMITED_SHARES_UNLIMIT).filter(finance.STK_LIMITED_SHARES_UNLIMIT.code=='600276.XSHG',finance.STK_LIMITED_SHARES_UNLIMIT.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

      id company_id  company_name         code    pub_date shareholder_name  \
0  11252  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2015-07-14             蒋素梅等
1  11889  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2016-01-16             周云曙等
2  12613  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2016-07-14             蒋素梅等
3  13335  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-01-10             周云曙等
4  14162  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-07-20             蒋素梅等
5  15291  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2018-01-26             周云曙等

  actual_unlimited_date actual_unlimited_number actual_unlimited_ratio  \
0            2015-07-17               4021160.0                 0.1672
1            2016-01-21                531960.0                 0.0068
2            2016-07-19               3488285.0                 0.1486
3            2017-01-16                478764.0                 0.0051
4            2017-07-25               4024089.0                 0.1167
5            2018-01-31                574517.0                 0.0051

  limited_reason_id limited_reason actual_trade_number
0            309004           股权激励           3270410.0
1            309004           股权激励            132990.0
2            309004           股权激励           3488285.0
3            309004           股权激励            119691.0
4            309004           股权激励           3287409.0
5            309004           股权激励            143628.0
```

<a id="上市公司股本变动"></a>

### 上市公司股本变动

```python
from jqdata import finance
finance.run_query(query(finance.STK_CAPITAL_CHANGE).filter(finance.STK_CAPITAL_CHANGE.code==code).limit(n))
```

获取上市公司的股本变动情况

**参数：**

-   **query(finance.STK\_CAPITAL\_CHANGE)**：表示从finance.STK\_CAPITAL\_CHANGE这张表中查询股票简称的变更情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2)，多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_CAPITAL\_CHANGE**：代表上市公司的股本变动表，收录了上市公司发生上市、增发、配股，转增等时间带来的股本变动情况。表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 含义 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | code | 股票代码 | varchar(12) |  |
    | change\_date | 变动日期 | date |  |
    | pub\_date | 公告日期 | date |  |
    | change\_reason\_id | 变动原因编码 | int |  |
    | change\_reason | 变动原因 | varchar(120) |  |
    | share\_total | 总股本 | decimal(20,4) | 未流通股份+已流通股份，单位：万股 |
    | share\_non\_trade | 未流通股份 | decimal(20,4) | 发起人股份 + 募集法人股份 + 内部职工股 + 优先股+转配股+其他未流通股+配售法人股+已发行未上市股份 |
    | share\_start | 发起人股份 | decimal(20,4) | 国家持股 +国有法人持股+境内法人持股 + 境外法人持股 + 自然人持股 |
    | share\_nation | 国家持股 | decimal(20,4) | 单位：万股 |
    | share\_nation\_legal | 国有法人持股 | decimal(20,4) | 单位：万股 |
    | share\_instate\_legal | 境内法人持股 | decimal(20,4) | 单位：万股 |
    | share\_outstate\_legal | 境外法人持股 | decimal(20,4) | 单位：万股 |
    | share\_natural | 自然人持股 | decimal(20,4) | 单位：万股 |
    | share\_raised | 募集法人股 | decimal(20,4) | 单位：万股 |
    | share\_inside | 内部职工股 | decimal(20,4) | 单位：万股 |
    | share\_convert | 转配股 | decimal(20,4) | 单位：万股 |
    | share\_perferred | 优先股 | decimal(20,4) | 单位：万股 |
    | share\_other\_nontrade | 其他未流通股 | decimal(20,4) | 单位：万股 |
    | share\_limited | 流通受限股份 | decimal(20,4) | 单位：万股 |
    | share\_legal\_issue | 配售法人股 | decimal(20,4) | 战略投资配售股份+证券投资基金配售股份+一般法人配售股份(万股) |
    | share\_strategic\_investor | 战略投资者持股 | decimal(20,4) | 单位：万股 |
    | share\_fund | 证券投资基金持股 | decimal(20,4) | 单位：万股 |
    | share\_normal\_legal | 一般法人持股 | decimal(20,4) | 单位：万股 |
    | share\_other\_limited | 其他流通受限股份 | decimal(20,4) | 单位：万股 |
    | share\_nation\_limited | 国家持股（受限） | decimal(20,4) | 单位：万股 |
    | share\_nation\_legal\_limited | 国有法人持股（受限） | decimal(20,4) | 单位：万股 |
    | other\_instate\_limited | 其他内资持股（受限） | decimal(20,4) | 单位：万股 |
    | legal of other\_instate\_limited | 其他内资持股（受限）中的境内法人持股 | decimal(20,4) | 单位：万股 |
    | natural of other\_instate\_limited | 其他内资持股（受限）中的境内自然人持股 | decimal(20,4) | 单位：万股 |
    | outstate\_limited | 外资持股（受限） | decimal(20,4) | 单位：万股 |
    | legal of outstate\_limited | 外资持股（受限）中的境外法人持股 | decimal(20,4) | 单位：万股 |
    | natural of outstate\_limited | 外资持股（受限）境外自然人持股 | decimal(20,4) | 单位：万股 |
    | share\_trade\_total | 已流通股份 | decimal(20,4) | 人民币普通股 + 境内上市外资股（B股）+ 境外上市外资股（H股）+高管股+ 其他流通股 |
    | share\_rmb | 人民币普通股 | decimal(20,4) | 单位：万股 |
    | share\_b | 境内上市外资股（B股） | decimal(20,4) | 单位：万股 |
    | share\_b\_limited | 限售B股 | decimal（20,4） | 单位：万股 |
    | share\_h | 境外上市外资股（H股） | decimal(20,4) | 单位：万股 |
    | share\_h\_limited | 限售H股 | decimal(20,4) | 单位：万股 |
    | share\_management | 高管股 | decimal(20,4) | 单位：万股 |
    | share\_management\_limited | 限售高管股 | decimal(20,4) | 单位：万股 |
    | share\_other\_trade | 其他流通股 | decimal(20,4) | 单位：万股 |
    | control\_shareholder\_limited | 控股股东、实际控制人(受限) | decimal(20,4) | 单位：万股 |
    | core\_employee\_limited | 核心员工(受限) | decimal(20,4) | 单位：万股 |
    | individual\_fund\_limited | 个人或基金(受限) | decimal(20,4) | 单位：万股 |
    | other\_legal\_limited | 其他法人(受限) | decimal(20,4) | 单位：万股 |
    | other\_limited | 其他(受限) | decimal(20,4) | 单位：万股 |

-   **filter(finance.STK\_CAPITAL\_CHANGE.code==code)**：指定筛选条件，通过finance.STK\_CAPITAL\_CHANGE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_CAPITAL\_CHANGE.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为恒瑞医药（600276.XSHG)的股本变动情况，返回条数为10条
q=query(finance.STK_CAPITAL_CHANGE).filter(finance.STK_CAPITAL_CHANGE.code=='600276.XSHG',finance.STK_CAPITAL_CHANGE.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

      id company_id  company_name         code change_date    pub_date  \
0    107  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-01-16  2017-01-10
1   3506  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-05-31  2017-05-22
2   4130  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-06-29  2017-06-29
3   4417  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-07-25  2017-07-20
4   7659  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-06-30  2017-08-30
5   8432  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-09-22  2017-09-22
6   9839  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2018-01-18  2018-01-20
7   9911  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2018-01-31  2018-01-26
8  12261  420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-12-31  2018-04-16

  change_reason_id change_reason  share_total share_non_trade      ...       \
0           306037        激励股份上市  234745.9674             0.0      ...
1           306010            送股  281695.1609             0.0      ...
2           306016          股份回购  281688.9833             0.0      ...
3           306037        激励股份上市  281688.9833             0.0      ...
4           306019          定期报告  281688.9833             0.0      ...
5           306016          股份回购  281688.3038             0.0      ...
6           306004        增发新股上市  283264.8038             0.0      ...
7           306037        激励股份上市  283264.8038             0.0      ...
8           306019          定期报告  281688.3038             0.0      ...

  share_h share_h_limited share_management share_management_limited  \
0     0.0             NaN              0.0                      NaN
1     0.0             NaN              0.0                      NaN
2     0.0             NaN              0.0                      NaN
3     0.0             NaN              0.0                      NaN
4     0.0             NaN              0.0                      NaN
5     0.0             NaN              0.0                      NaN
6     0.0             NaN              0.0                      NaN
7     0.0             NaN              0.0                      NaN
8     0.0             NaN              0.0                      NaN

  share_other_trade control_shareholder_limited core_employee_limited  \
0               0.0                         NaN                   NaN
1               0.0                         NaN                   NaN
2               0.0                         NaN                   NaN
3               0.0                         NaN                   NaN
4               0.0                         NaN                   NaN
5               0.0                         NaN                   NaN
6               0.0                         NaN                   NaN
7               0.0                         NaN                   NaN
8               0.0                         NaN                   NaN

  individual_fund_limited other_legal_limited other_limited
0                     NaN                 NaN           NaN
1                     NaN                 NaN           NaN
2                     NaN                 NaN           NaN
3                     NaN                 NaN           NaN
4                     NaN                 NaN           NaN
5                     NaN                 NaN           NaN
6                     NaN                 NaN           NaN
7                     NaN                 NaN           NaN
8                     NaN                 NaN           NaN

[9 rows x 49 columns]
```
