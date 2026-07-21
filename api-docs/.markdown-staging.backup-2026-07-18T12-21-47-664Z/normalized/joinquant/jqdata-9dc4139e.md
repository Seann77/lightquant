---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 债券
section_path:
  - JQData使用说明
  - 债券
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#债券"
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - complex_table_preserved_as_html
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="期权列表"></a>

### 期权列表

**金融期权、商品期权**

[**金融期权**](https://www.joinquant.com/help/api/help?name=faq#Option%3A%E6%9C%9F%E6%9D%83%E5%88%97%E8%A1%A8)：1. 上海证券交易所:50ETF期权、 沪深300ETF 2.中国金融期货交易所: 沪深300股指期权、 **中证1000股指期权**

[**商品期权**](https://www.joinquant.com/help/api/help?name=faq#Option%3A%E6%9C%9F%E6%9D%83%E5%88%97%E8%A1%A8)：上海期货交易所、郑州商品交易所、大连商品交易所

<a id="债券"></a>

## 债券

<a id="债券概况"></a>

### 债券概况

-   **更新时间：上市至今，每日19：00、22:00更新**

<a id="债券使用说明"></a>

### 债券使用说明

**债券使用说明**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.BOND_BASIC_INFO).filter(bond.BOND_BASIC_INFO.code == '131801').limit(n))
```

获取债券基本信息数据、债券票面利率数据和国债逆回购日行情数据

**参数：**

-   **query(bond.BOND\_BASIC\_INFO)**：表示从bond.BOND\_BASIC\_INFO 这张表中查询债券基本信息数据，其中bond是库名，BOND\_BASIC\_INFO是表名。bond库中的表都可以使用run\_query方法调用，表名如下所示：

    | **表名** | **描述** |
    | --- | --- |
    | BOND\_BASIC\_INFO | 债券基本信息数据 |
    | BOND\_COUPON | 债券票面利率数据 |
    | REPO\_DAILY\_PRICE | 国债逆回购日行情数据 |

    在查询表数据时还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2，多个字段用逗号分隔进行提取；query函数的更多用法详见： **[query简易教程](https://www.joinquant.com/view/community/detail/16411)**

-   **filter(bond.BOND\_BASIC\_INFO.code == '131801')**：指定筛选条件，通过bond.BOND\_BASIC\_INFO.code == '131801' 可以指定债券代码来获取债券基本信息数据；除此之外，还可以对表中其他字段指定筛选条件，如filter(bond.BOND\_BASIC\_INFO.exchange=='上交所')，表示交易市场在上交所的所有债券基本信息数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

<a id="BOND_BASIC_INFO"></a>

### BOND\_BASIC\_INFO

**债券基本信息**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.BOND_BASIC_INFO ).limit(n))
```

**数据字典：**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| code | str | 债券代码(不加后缀） |
| short\_name | str | 债券简称 |
| short\_name\_spelling | str | 债券简称拼音 |
| full\_name | str | 债券全称 |
| list\_status\_id | int | 上市状态编码，见下表上市状态编码对照表 |
| list\_status | str | 上市状态 |
| issuer | str | 发行人 |
| company\_code | str | 发行人股票代码 |
| exchange\_code | int | 交易市场编码，见下表交易市场编码 |
| exchange | str | 交易市场 |
| currency\_id | str | 货币代码。CNY-人民币 |
| coupon\_type\_id | int | 计息方式编码，见下表计息方式编码 |
| coupon\_type | str | 计息方式 |
| coupon\_frequency | int | 付息频率，单位：月/次。按年付息是12月/次；半年付息是6月/次 |
| payment\_type\_id | int | 兑付方式编码，见下表兑付方式编码表 |
| payment\_type | str | 兑付方式 |
| par | float | 债券面值(元) |
| repayment\_period | int | 偿还期限(月） |
| bond\_type\_id | int | 债券分类编码。 |
| bond\_type | str | 债券分类 |
| bond\_form\_id | int | 债券形式编码，见下表债券形式编码表 |
| bond\_form | str | 债券形式 |
| list\_date | date | 上市日期 |
| delist\_Date | date | 退市日期 |
| interest\_begin\_date | date | 起息日 |
| maturity\_date | date | 到期日 |
| interest\_date | str | 付息日 |
| last\_cash\_date | date | 最终兑付日 |
| cash\_comment | str | 兑付说明 |

**编码对照表:**

| 上市状态编码 | 上市状态 |
| --- | --- |
| 301001 | 正常上市 |
| 301002 | ST |
| 301003 | \*ST |
| 301004 | 暂停上市 |
| 301006 | 终止上市 |
| 301007 | 已发行未上市 |
| 301008 | 预披露 |
| 301009 | 未过会 |
| 301010 | 发行失败 |
| 301011 | 暂缓发行 |
| 301099 | 其他 |

| **交易市场编码** | **交易市场** |
| --- | --- |
| 705001 | 上交所 |
| 705002 | 深交所主板 |
| 705003 | 深交所中小板 |
| 705004 | 深交所创业板 |
| 705005 | 上交所综合业务平台 |
| 705006 | 深交所综合协议交易平台 |
| 705007 | 银行间债券市场 |
| 705008 | 商业银行柜台市场 |
| 705009 | 港交所创业板 |
| 705010 | 新加坡证券交易所 |
| 705011 | 拟上市 |
| 705012 | 产权交易市场 |
| 705013 | 美国NASDAQ证券交易所 |
| 705014 | 港交所主板 |
| 705015 | 股份报价系统 |
| 705016 | 代办转让 |
| 705017 | 上交所CDR |
| 705018 | 深交所存托凭证 |
| 705099 | 其他 |

| 计息方式编码 | 计息方式 |
| --- | --- |
| 701001 | 利随本清 |
| 701002 | 固定利率附息 |
| 701003 | 递进利率 |
| 701004 | 浮动利率 |
| 701005 | 贴现 |
| 701006 | 未公布 |
| 701007 | 无利率 |
| 701008 | 累进利率 |

| 兑付方式编码 | 兑付方式 |
| --- | --- |
| 702001 | 到期一次付息 |
| 702002 | 按年付息 |
| 702003 | 按半年付息 |
| 702004 | 按季付息 |
| 702005 | 按月付息 |
| 702006 | 未公布 |
| 702099 | 其他 |

| 债券分类编码 | 债券分类 |
| --- | --- |
| 703001 | 短期融资券 |
| 703002 | 质押式回购 |
| 703003 | 私募债 |
| 703004 | 企业债 |
| 703005 | 次级债 |
| 703006 | 一般金融债 |
| 703007 | 中期票据 |
| 703008 | 资产支持证券 |
| 703009 | 小微企业扶持债 |
| 703010 | 地方政府债 |
| 703011 | 公司债 |
| 703012 | 可交换私募债 |
| 703013 | 可转债 |
| 703014 | 集合债券 |
| 703015 | 国际机构债券 |
| 703016 | 政府支持机构债券 |
| 703017 | 集合票据 |
| 703018 | 外国主权政府人民币债券 |
| 703019 | 央行票据 |
| 703020 | 政策性金融债 |
| 703021 | 国债 |
| 703022 | 非银行金融债 |
| 703023 | 可分离可转债 |
| 703024 | 国库定期存款 |
| 703025 | 可交换债 |
| 703026 | 特种金融债 |

| 债券形式编码 | 债券形式 |
| --- | --- |
| 704001 | 记账式 |
| 704002 | 实物式 |
| 704003 | 储蓄电子式 |
| 704004 | 凭证式 |
| 704005 | 未公布 |

**示例：**

```python
# 查询2019年4月14日的债券基本信息
from jqdatasdk import *

df = bond.run_query(query(bond.BOND_BASIC_INFO).filter(bond.BOND_BASIC_INFO.exchange == '上交所').limit(5))
print(df)

# 输出

   id    code short_name                            full_name  list_status_id  \
0   2  131800      16东莞次  中国中投证券-东莞证券融出资金债权1号资产支持专项计划次级资产支持证券          301006
1   3  131801     花呗01A1         德邦花呗第一期消费贷款资产支持专项计划优先级资产支持证券          301006
2   4  131802     花呗01A2        德邦花呗第一期消费贷款资产支持专项计划次优先级资产支持证券          301006
3   5  131803      花呗01B          德邦花呗第一期消费贷款资产支持专项计划次级资产支持证券          301006
4   6  131805       海尔优B             海尔保理一期资产支持专项计划优先B级资产支持证券          301006

  list_status           issuer company_code  exchange_code exchange  \
0        终止上市       东莞证券股份有限公司   S0001.XSHG         705001      上交所
1        终止上市  重庆市阿里小微小额贷款有限公司         None         705001      上交所
2        终止上市  重庆市阿里小微小额贷款有限公司         None         705001      上交所
3        终止上市  重庆市阿里小微小额贷款有限公司         None         705001      上交所
4        终止上市       东吴证券股份有限公司  601555.XSHG         705001      上交所

      ...      bond_type  bond_form_id bond_form   list_date  delist_Date  \
0     ...         资产支持证券        704001       记账式  2016-07-25   2019-06-18
1     ...         资产支持证券        704001       记账式  2016-07-12   2017-06-13
2     ...         资产支持证券        704001       记账式  2016-07-12   2017-06-13
3     ...         资产支持证券        704001       记账式  2016-07-12   2017-06-13
4     ...         资产支持证券        704001       记账式  2016-07-07   2016-12-02

  interest_begin_date  maturity_date  interest_date  last_cash_date  \
0          2016-06-17     2019-06-18           None      2019-06-18
1          2016-06-07     2017-06-15           None      2017-06-15
2          2016-06-07     2017-06-15           None      2017-06-15
3          2016-06-07     2017-06-15           None      2017-06-15
4          2016-06-08     2016-12-06           None      2016-12-06

  cash_comment
0         None
1         None
2         None
3         None
4         None

[5 rows x 29 columns]
```

<a id="BOND_COUPON"></a>

### BOND\_COUPON

**债券票面利率**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.BOND_COUPON).limit(n))
```

**数据字典：**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| code | str | 债券代码（不加后缀） |
| short\_name | str | 债券简称 |
| pub\_date | date | 信息发布日期 |
| coupon\_type\_id | int | 计息方式编码，见下表计息方式编码 |
| exchange\_code | int | 证券市场编码(新增字段) |
| exchange | str | 证券市场(新增字段) |
| coupon\_type | str | 计息方式 |
| coupon | float(5) | 票面年利率(%) |
| coupon\_start\_date | date | 票面利率起始适用日期 |
| coupon\_end\_date | date | 票面利率终止适用日期 |
| reference\_rate | float | 浮息债参考利率(%) |
| reference\_rate\_comment | str | 浮息债参考利率说明 |
| margin\_rate | float | 浮息债利差(%)-(等于票面利率减参考利率） |
| coupon\_upper\_limit | float | 利率上限 |
| coupon\_lower\_limit | float | 利率下限 |

**编码对照表：**

| 计息方式编码 | 计息方式 |
| --- | --- |
| 701001 | 利随本清 |
| 701002 | 固定利率附息 |
| 701003 | 递进利率 |
| 701004 | 浮动利率 |
| 701005 | 贴现 |
| 701006 | 未公布 |
| 701007 | 无利率 |

**示例**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.BOND_COUPON))
print(df[:4])

   id    code short_name    pub_date  exchange_code exchange  coupon_type_id  \
0   1  123082     15国君C1  2015-04-28         705001      上交所          701002
1   2  155788     19中航G2  2019-10-25         705001      上交所          701002
2   3  125496      14蓉家投  2015-02-12         705001      上交所          701002
3   4  125496      14蓉家投  2015-02-12         705001      上交所          701002

  coupon_type  coupon coupon_start_date coupon_end_date  reference_rate  \
0      固定利率附息    5.70        2015-04-28      2018-04-27             NaN
1      固定利率附息    4.19        2019-10-28      2022-10-27             NaN
2      固定利率附息   10.00        2017-02-12      2018-02-11             NaN
3      固定利率附息   10.00        2016-02-12      2017-02-11             NaN

  reference_rate_comment  margin_rate coupon_upper_limit coupon_lower_limit
0                   None          NaN               None               None
1                   None          NaN               None               None
2                   None          NaN               None               None
3                   None          NaN               None               None
```

```python
# 获取15建元2A3的债券票面利率
from jqdatasdk import *
df=bond.run_query(query(bond.BOND_COUPON).filter(bond.BOND_COUPON.code=='1589355'))
print(df[:4])

     id     code short_name    pub_date  exchange_code exchange  \
0  1954  1589355    15建元2A3  2015-12-23         705007  银行间债券市场
1  1953  1589355    15建元2A3  2016-01-19         705007  银行间债券市场
2  1952  1589355    15建元2A3  2016-02-19         705007  银行间债券市场
3  1951  1589355    15建元2A3  2016-03-18         705007  银行间债券市场

   coupon_type_id coupon_type  coupon coupon_start_date coupon_end_date  \
0          701004        浮动利率     4.6        2015-12-24      2016-01-25
1          701004        浮动利率     4.6        2016-01-26      2016-02-25
2          701004        浮动利率     4.6        2016-02-26      2016-03-25
3          701004        浮动利率     4.6        2016-03-26      2016-04-25

   reference_rate                             reference_rate_comment  \
0             4.9  票面利率：“优先档资产支持证券的票面利率”根据簿记建档结果确定。“受托机构”于“交割日”后次...
1             4.9  票面利率：“优先档资产支持证券的票面利率”根据簿记建档结果确定。“受托机构”于“交割日”后次...
2             4.9  票面利率：“优先档资产支持证券的票面利率”根据簿记建档结果确定。“受托机构”于“交割日”后次...
3             4.9  票面利率：“优先档资产支持证券的票面利率”根据簿记建档结果确定。“受托机构”于“交割日”后次...

   margin_rate coupon_upper_limit coupon_lower_limit
0         -0.3               None               None
1         -0.3               None               None
2         -0.3               None               None
3         -0.3               None               None
```

<a id="BOND_INTEREST_PAYMENT"></a>

### BOND\_INTEREST\_PAYMENT

**付息事件**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.BOND_INTEREST_PAYMENT ).limit(n))
```

**表结构：**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| code | str | 债券代码(不加后缀） |
| name | str | 债券简称 |
| pub\_date | date | 公告日期 |
| exchange\_code | int | 证券市场编码(新增字段) |
| exchange | str | 证券市场(新增字段) |
| event\_type | str | 事件类型 |
| interest\_start\_date | date | 年度计息起始日 |
| coupon | float | 票面利率（%） |
| interest\_end\_date | date | 年度计息终止日 |
| autual\_interest | float | 实际付息利率（%） |
| interest\_per\_unit | float | 每手付息数（单位：元，每1000元付息金额） |
| register\_date | date | 债权登记日 |
| dividend\_date | date | 除息日 |
| interest\_pay\_start\_date | date | 付息起始日（债务人实际付息开始日期） |
| interest\_pay\_end\_date | date | 付息终止日（债务人实际付息截止日期） |
| payment\_date | date | 兑付日（债券到期兑付） |
| payment\_per\_unit | float | 每百元面值的到期兑付资金（元） |
| tax\_rate | float | 代扣所得税率（%） |
| tax\_channel | str | 扣税渠道 |

```python
from jqdatasdk import *
df=bond.run_query(query(bond.BOND_INTEREST_PAYMENT ))
print(df[:4])

  id       code          name    pub_date  exchange_code exchange event_type  \
0   1  011698473   16粤广业SCP004  2017-06-09          12004  银行间债券市场         兑付
1   2  011698480  16海运集装SCP001  2016-12-13          12004  银行间债券市场         兑付
2   3  011698631    16重汽SCP008  2017-07-05          12004  银行间债券市场         兑付
3   4  011698478   16中电股SCP009  2016-11-11          12004  银行间债券市场         兑付

  interest_start_date  coupon interest_end_date  autual_interest  \
0                None    2.99              None         2.211781
1                None    3.00              None         0.737705
2                None    3.10              None         2.259178
3                None    2.30              None         0.377049

   interest_per_unit register_date dividend_date interest_pay_start_date  \
0           22.11781    2017-06-16          None                    None
1            7.37705    2016-12-20          None                    None
2           22.59178    2017-07-12          None                    None
3            3.77049    2016-11-18          None                    None

  interest_pay_end_date payment_date  payment_per_unit  tax_rate tax_channel
0                  None   2017-06-19        102.211781       NaN        None
1                  None   2016-12-21        100.737705       NaN        None
2                  None   2017-07-13        102.259178       NaN        None
3                  None   2016-11-21        100.377049       NaN        None
```

```python
from jqdatasdk import *
df=bond.run_query(query(bond.BOND_INTEREST_PAYMENT ).filter(bond.BOND_INTEREST_PAYMENT.pub_date=='2019-11-13'))
print(df[:5])
     id       code        name    pub_date  exchange_code exchange event_type  \
0  7684  101574010  15京粮MTN001  2019-11-13          12004  银行间债券市场         付息
1  8635    1555048     15福建债48  2019-11-13          12004  银行间债券市场         付息
2  8668    1555047     15福建债47  2019-11-13          12004  银行间债券市场         付息
3  8684    1555046     15福建债46  2019-11-13          12004  银行间债券市场         付息
4  8726    1555044     15福建债44  2019-11-13          12004  银行间债券市场         付息

  interest_start_date  coupon interest_end_date  autual_interest  \
0          2018-12-14    4.38        2019-12-13             4.38
1          2019-06-04    3.30        2019-12-03             1.65
2          2018-12-04    3.32        2019-12-03             3.32
3          2018-12-04    3.15        2019-12-03             3.15
4          2019-06-04    3.30        2019-12-03             1.65

   interest_per_unit register_date dividend_date interest_pay_start_date  \
0               43.8    2019-12-13          None              2019-12-16
1               16.5    2019-12-03          None              2019-12-04
2               33.2    2019-12-03          None              2019-12-04
3               31.5    2019-12-03          None              2019-12-04
4               16.5    2019-12-03          None              2019-12-04

  interest_pay_end_date payment_date  payment_per_unit  tax_rate tax_channel
0                  None         None               NaN       NaN        None
1                  None         None               NaN       NaN        None
2                  None         None               NaN       NaN        None
3                  None         None               NaN       NaN        None
4                  None         None               NaN       NaN        None
```

<a id="国债逆回购日行情"></a>

### 国债逆回购日行情

<a id="REPO_DAILY_PRICE"></a>

### REPO\_DAILY\_PRICE

**国债逆回购日行情 / 上市至今，每日19：00、22:00更新**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.REPO_DAILY_PRICE).limit(n))
```

**数据字典：**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| date | date | 交易日期 |
| code | varchar(12) | 回购代码，如 '204001.XSHG' |
| name | varchar(20) | 回购简称，如 'GC001' |
| exchange\_code | varchar(12) | 证券市场编码。XSHG-上海证券交易所；XSHE-深圳证券交易所 |
| pre\_close | decimal(10,4) | 前收盘利率(%) |
| open | decimal(10,4) | 开盘利率(%) |
| high | decimal(10,4) | 最高利率(%) |
| low | decimal(10,4) | 最低利率(%) |
| close | decimal(10,4) | 收盘利率(%) |
| volume | bigint | 成交量（手） |
| money | decimal（20,2） | 成交额（元） |
| deal\_number | int | 成交笔数（笔） |

**示例**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.REPO_DAILY_PRICE))
print(df.sort_values(by='deal_number',ascending=False)[:5])

        id        date         code   name exchange_code  pre_close  open  \
2842  2843  2018-04-24  204001.XSHG  GC001          XSHG       8.87   9.5
2709  2710  2017-10-09  204001.XSHG  GC001          XSHG      16.63   5.0
2769  2770  2018-01-02  204001.XSHG  GC001          XSHG      14.53   3.9
2843  2844  2018-04-25  204001.XSHG  GC001          XSHG       8.93   6.0
2767  2768  2017-12-28  204001.XSHG  GC001          XSHG      12.57  13.0

       high     low   close     volume         money  deal_number
2842  12.20   6.500   8.930  915840200  9.158402e+11     728989.0
2709  12.00   5.000   8.745  961308900  9.613089e+11     723141.0
2769  10.10   3.900   6.010  828761600  8.287616e+11     703459.0
2843  10.01   5.555   8.795  875500800  8.755008e+11     696009.0
2767  24.00  13.000  17.695  703348000  7.033480e+11     669847.0
```

<a id="可转债概况"></a>

### 可转债概况

-   **更新时间：2019至今，8:00更新**

<a id="normalize_code"></a>

### normalize\_code

**将可转债代码转化成聚宽标准格式**

```python
normalize_code(code)
```

将其他形式的可转债代码转换为jqdatasdk函数可用的可转债代码形式。 **适用可转债代码,支持传入单只可转债或一个可转债list**

**以可转债为例**

```python
#输入
normalize_code(['110043', 'SH110043', '110043SH', '110043.sh', '110043.XSHG'])
#输出
['110043.XSHG', '110043.XSHG', '110043.XSHG', '110043.XSHG', '110043.XSHG']
```

<a id="get_security_info"></a>

### get\_security\_info

**获取单支可转债信息**

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
5.  type # 类型，conbond

**示例**

```python
# 获取110043.XSHG的中文名称
display_name = get_security_info('110043.XSHG').display_name
print(display_name)
>>>无锡转债

# 获取128145.XSHE的上市时间
start_date = get_security_info('128145.XSHE').start_date
print(start_date)
>>>2021-04-16
```

<a id="get_all_securities"></a>

### get\_all\_securities

**获取所有可转债信息**

```python
get_all_securities(types=[], date=None)
```

获取平台支持的所有股票、基金、指数、期货、期权、可转债信息

**参数**

-   types: list: 用来过滤securities的类型, list元素可选: 'stock', 'fund', 'index', 'futures', 'options', 'etf', 'lof', 'fja', 'fjb', 'open\_fund', 'bond\_fund', 'stock\_fund', 'QDII\_fund', 'money\_market\_fund', 'mixture\_fund'。**types为空时返回所有股票, 不包括基金,指数和期货**
-   date: 日期, 一个字符串或者 \[datetime.datetime\]/\[datetime.date\] 对象, 用于获取某日期还在上市的可转债信息. 默认值为 None, 表示获取所有日期的可转债信息

**返回**

-   \[pandas.DataFrame\]
-   display\_name: 中文名称
-   name: 缩写简称
-   start\_date: 上市日期
-   end\_date: 退市日期，如果没有退市则为2200-01-01
-   type: 类型 : stock(股票)，index(指数)，etf(ETF基金)，options(期权)，conbond(可转债)，fja（分级A），fjb（分级B），fjm（分级母基金），mmf（场内交易的货币基金）open\_fund（开放式基金）, bond\_fund（债券基金）, stock\_fund（股票型基金）, QDII\_fund（QDII 基金）, money\_market\_fund（场外交易的货币基金）, mixture\_fund（混合型基金）, options(期权)

**示例**

```python
#获得所有可转债列表
df=get_all_securities("conbond")
print(df[:5])

            display_name  name start_date   end_date     type
110001.XSHG         邯钢转债  HGZZ 2003-12-11 2007-03-16  conbond
110002.XSHG         南山转债  NSZZ 2008-05-13 2009-09-24  conbond
110003.XSHG         新钢转债  XGZZ 2008-09-05 2013-08-27  conbond
110004.XSHG         厦工转债  SGZZ 2009-09-11 2010-09-30  conbond
110005.XSHG         西洋转债  XYZZ 2009-09-21 2010-05-19  conbond
```

```python
#获得2023年02月01日还在上市的所有股票列表
df=get_all_securities("conbond",date='2023-02-01')
print(df.tail(5))

            display_name  name start_date   end_date     type
128141.XSHE         旺能转债  WNZZ 2021-01-18 2026-12-17  conbond
128142.XSHE         新乳转债  XRZZ 2021-01-19 2026-12-18  conbond
128143.XSHE         锋龙转债  FLZZ 2021-01-29 2027-01-08  conbond
128144.XSHE         利民转债  LMZZ 2021-03-24 2027-03-01  conbond
128145.XSHE         日丰转债  RFZZ 2021-04-16 2023-03-02  conbond
```

```python
#将所有可转债列表转换成数组
conbond= list(get_all_securities(['conbond']).index)
conbond[:5]
>>>['110001.XSHG', '110002.XSHG', '110003.XSHG', '110004.XSHG', '110005.XSHG']
```

<a id="可转债统计数据"></a>

### 可转债统计数据

<a id="CONBOND_BASIC_INFO"></a>

### CONBOND\_BASIC\_INFO

**可转债基本资料 / 上市至今，每日19：00、22:00更新**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_BASIC_INFO).limit(n))
```

**表结构：**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| code | str | 债券代码 |
| short\_name | str | 债券简称 |
| full\_name | str | 债券全称 |
| list\_status\_id | int | 上市状态编码，见下表上市状态编码对照表 |
| list\_status | str | 上市状态 |
| issuer | str | 发行人 |
| company\_code | str | 发行人股票代码（带后缀）；正股代码 |
| issue\_start\_date | date | 发行起始日 |
| issue\_end\_date | date | 发行终止日 |
| plan\_raise\_fund | decimal(20,4) | 计划发行总量（万元） |
| actual\_raise\_fund | decimal(20,4) | 实际发行总量（万元） |
| issue\_par | int | 发行面值 |
| issue\_price | decimal(10,3) | 发行价格 |
| is\_guarantee | int | 是否有担保(1-是，0-否） |
| fund\_raising\_purposes | varchar(200) | 募资用途说明 |
| list\_date list\_declare\_date | date | 上市公告日期 |
| convert\_price\_reason | varchar(300) | 初始转股价确定方式 |
| convert\_price | decimal(10,3) | 初始转股价格 |
| convert\_start\_date | start\_date | 转股开始日期 |
| convert\_end\_date | end\_date | 转股终止日期 |
| convert\_code | varchar(10) | 转股代码（不带后缀） |
| coupon | decimal(10,3) | 初始票面利率 |
| exchange\_code | int | 交易市场编码，见下表交易市场编码 |
| exchange | str | 交易市场 |
| currency\_id | str | 货币代码。CNY-人民币 |
| coupon\_type\_id | int | 计息方式编码，见下表计息方式编码 |
| coupon\_type | str | 计息方式 |
| coupon\_frequency | int | 付息频率，单位：月/次。按年付息是12月/次；半年付息是6月/次 |
| payment\_type\_id | int | 兑付方式编码，见下表兑付方式编码表 |
| payment\_type | str | 兑付方式 |
| par | float | 债券面值(元) |
| repayment\_period | int | 偿还期限(月） |
| bond\_type\_id | int | 债券分类编码，见下表债券分类编码 |
| bond\_type | str | 债券分类 |
| bond\_form\_id | int | 债券形式编码，见下表债券形式编码表 |
| bond\_form | str | 债券形式 |
| list\_date | date | 上市日期 |
| delist\_Date | date | 退市日期 |
| interest\_begin\_date | date | 起息日 |
| maturity\_date | date | 到期日 |
| interest\_date | str | 付息日 |
| last\_cash\_date | date | 最终兑付日 |
| cash\_comment | str | 兑付说明 |

**编码对照表：**

| 上市状态编码 | 上市状态 |
| --- | --- |
| 301001 | 正常上市 |
| 301006 | 终止上市 |
| 301099 | 其他 |

| **交易市场编码** | **交易市场** |
| --- | --- |
| 705001 | 上交所 |
| 705002 | 深交所主板 |
| 705003 | 深交所中小板 |
| 705004 | 深交所创业板 |
| 705005 | 上交所综合业务平台 |
| 705006 | 深交所综合协议交易平台 |
| 705007 | 银行间债券市场 |
| 705008 | 商业银行柜台市场 |
| 705009 | 港交所创业板 |
| 705010 | 新加坡证券交易所 |
| 705011 | 拟上市 |
| 705012 | 产权交易市场 |
| 705013 | 美国NASDAQ证券交易所 |
| 705014 | 港交所主板 |
| 705015 | 股份报价系统 |
| 705016 | 代办转让 |
| 705017 | 上交所CDR |
| 705018 | 深交所存托凭证 |
| 705099 | 其他 |

| 计息方式编码 | 计息方式 |
| --- | --- |
| 701001 | 利随本清 |
| 701002 | 固定利率附息 |
| 701003 | 递进利率 |
| 701004 | 浮动利率 |
| 701005 | 贴现 |
| 701006 | 未公布 |
| 701007 | 无利率 |
| 701008 | 累进利率 |

| 兑付方式编码 | 兑付方式 |
| --- | --- |
| 702001 | 到期一次付息 |
| 702002 | 按年付息 |
| 702003 | 按半年付息 |
| 702004 | 按季付息 |
| 702005 | 按月付息 |
| 702006 | 未公布 |
| 702099 | 其他 |

| 债券分类编码 | 债券分类 |
| --- | --- |
| 703001 | 短期融资券 |
| 703002 | 质押式回购 |
| 703003 | 私募债 |
| 703004 | 企业债 |
| 703005 | 次级债 |
| 703006 | 一般金融债 |
| 703007 | 中期票据 |
| 703008 | 资产支持证券 |
| 703009 | 小微企业扶持债 |
| 703010 | 地方政府债 |
| 703011 | 公司债 |
| 703012 | 可交换私募债 |
| 703013 | 可转债 |
| 703014 | 集合债券 |
| 703015 | 国际机构债券 |
| 703016 | 政府支持机构债券 |
| 703017 | 集合票据 |
| 703018 | 外国主权政府人民币债券 |
| 703019 | 央行票据 |
| 703020 | 政策性金融债 |
| 703021 | 国债 |
| 703022 | 非银行金融债 |
| 703023 | 可分离可转债 |
| 703024 | 国库定期存款 |
| 703025 | 可交换债 |
| 703026 | 特种金融债 |

| 债券形式编码 | 债券形式 |
| --- | --- |
| 704001 | 记账式 |
| 704002 | 实物式 |
| 704003 | 储蓄电子式 |
| 704004 | 凭证式 |
| 704005 | 未公布 |

**示例**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_BASIC_INFO)
```

```python
# 获得鞍钢转债的基本资料
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_BASIC_INFO).filter(bond.CONBOND_BASIC_INFO.company_code=='000898.XSHE'))
print(df)

# 输出
   id    code short_name           full_name  list_status_id list_status  \
0   3  125898       鞍钢转债  鞍钢新轧钢股份有限公司可转换公司债券          301006        终止上市

     issuer company_code issue_start_date issue_end_date     ...       \
0  鞍钢股份有限公司  000898.XSHE       2000-03-14     2000-03-22     ...

   bond_type  bond_form_id  bond_form   list_date  delist_Date  \
0        可转债        704001        记账式  2000-04-17   2005-03-14

  interest_begin_date maturity_date interest_date  last_cash_date cash_comment
0          2000-03-14    2005-03-14   存续期内每年3月14日      2005-03-14         None

[1 rows x 44 columns]
```

<a id="CONBOND_CONVERT_PRICE_ADJUST"></a>

### CONBOND\_CONVERT\_PRICE\_ADJUST

**可转债转股价格调整 / 上市至今，每日19：00、22:00更新**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_CONVERT_PRICE_ADJUST).limit(n))
```

**表结构：**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| code | str | 债券代码 |
| name | str | 债券名称 |
| pub\_date | date | 公告日期 |
| adjust\_date | date | 调整生效日期 |
| new\_convert\_price | float | 调整后转股价格 |
| adjust\_reason | str | 调整原因 |

**示例**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_CONVERT_PRICE_ADJUST))
```

```python
#获得公告日期2019-11-07可转债的价格调整信息
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_CONVERT_PRICE_ADJUST).filter(bond.CONBOND_CONVERT_PRICE_ADJUST.pub_date=='2019-11-07'))
print(df)

# 输出
  id    code                            name    pub_date adjust_date  \
0   1  117135  2019年海亮集团有限公司非公开发行可交换公司债券(第二期)  2019-11-07  2019-11-12

   new_convert_price adjust_reason
0              10.08         修正转股价
```

<a id="CONBOND_DAILY_CONVERT"></a>

### CONBOND\_DAILY\_CONVERT

**可转债每日转股统计 / 2000-7-12至今，下一交易日 8:30、12：30更新**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_DAILY_CONVERT).limit(n))
```

**表结构：**

**表结构：**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| date | date | 交易日期（以YYYY-MM-DD表示） |
| code | str | 债券代码 |
| name | str | 债券简称 |
| exchange\_code | str | 证券市场编码（XSHG-上海证券交易所；XSHE-深圳证券交易所） |
| issue\_number | int | 发行总量（单位：张） |
| convert\_price | float | 转股价格 |
| daily\_convert\_number | int | 当日转股数量（深交所披露为债券转换量 单位：张，上交所披露为股票转换量 单位 :股） |
| acc\_convert\_number | int | 累计转股数量（深交所披露为债券转换量 单位：张，上交所披露为股票转换量 单位 :股） |
| acc\_convert\_ratio | float | 累计转股比例（单位：% ， 因上交所只披露转股股数，因此计算剩余转股张数时公式应为 : 发行总量 \*(1 -累计转股比例) ） |
| convert\_premium | float | 转股溢价，从2018-09-13开始计算（每张可转债转股后可以获得的收益，单位：元。**转股溢价=可转债收盘价-（100/转股价格）\*正股收盘价**） |
| convert\_premium\_rate | float | 转股溢价率 |

**示例**

获得所有转债的每日转股统计数据

```python
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_DAILY_CONVERT))
print(df[:4])

   id        date    code  name exchange_code  issue_number  convert_price  \
0   1  2000-07-12  100001  南化转债          XSHG       1500000           4.56
1   2  2000-07-13  100001  南化转债          XSHG       1500000           4.56
2   3  2000-07-14  100001  南化转债          XSHG       1500000           4.56
3   4  2000-07-17  100001  南化转债          XSHG       1500000           4.56

   daily_convert_number  acc_convert_number  acc_convert_ratio  \
0            13805949.0          13805949.0              41.97
1             2939919.0          16745868.0              50.91
2             2161867.0          18907735.0              57.48
3             4074006.0          22981741.0              69.86

   convert_premium  convert_premium_rate
0              NaN                   NaN
1              NaN                   NaN
2              NaN                   NaN
3              NaN                   NaN
```

获得某只转债的每日转股统计数据

```python
#获得招行转债的每日转股统计数据
df=bond.run_query(query(bond.CONBOND_DAILY_CONVERT).filter(bond.CONBOND_DAILY_CONVERT.code=="110036"))
print(df[:5])

     id        date    code  name exchange_code  issue_number  convert_price  \
0  2990  2005-05-10  110036  招行转债          XSHG      65000000           9.34
1  2994  2005-05-11  110036  招行转债          XSHG      65000000           9.34
2  3000  2005-05-13  110036  招行转债          XSHG      65000000           9.34
3  3012  2005-05-18  110036  招行转债          XSHG      65000000           9.34
4  3017  2005-05-23  110036  招行转债          XSHG      65000000           9.34

   daily_convert_number  acc_convert_number  acc_convert_ratio  \
0                1498.0              1498.0                0.0
1                2996.0              4494.0                0.0
2                 214.0              4708.0                0.0
3                 428.0              5136.0                0.0
4                 321.0              5457.0                0.0

   convert_premium convert_premium_rate
0           5.8107                 None
1           6.9325                 None
2           9.4599                 None
3           9.4957                 None
4          12.3748                 None
```

<a id="get_price"></a>

### get\_price

**可转债（1天/分钟）行情数据 / 2019年至今，盘后15点更新**

-   获取一支或者多只可转债
-   frequency为非一天或者一分钟，请使用get\_bars;
-   取多支标的的数据时，不要获取交易时段不同的标的（例如：不同交易时间的可转账标的），否则会报错；
-   这里在使用时注意 end\_date 的设置，不要引入未来的数据；
-   标识时间为09:32:00的1分钟k线，其数据时间为09:31:00至09:31:59；
-   **end\_date:当天 09:00 ~ 15:00 的行情在 15:00 之后可以获取 。**注意：当end\_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间
-   get\_price指定frequency为 非1m/1d时，fields选择'high\_limit','low\_limit'会报错

```python
get_price(security, start_date=None, end_date=None, frequency='daily', fields=None, skip_paused=False, fq='pre', count=None)
```

**参数**

<table><tbody><tr><td><strong>参数名称</strong></td><td><strong>参数说明</strong></td><td><strong>注释</strong></td></tr><tr><td>security</td><td>标的</td><td>可获取种类：股票、期货、基金、指数、期权、可转债</td></tr><tr><td>start_date</td><td>开始时间，不可与count同时使用。当'count'和'start_date'为None时, 默认值是 '2015-01-01 00:00:00'</td><td>当指定frequency为minute时，如果只传入日期，则日内时间为当日的 00:00:00</td></tr><tr><td>end_date</td><td>结束时间，如无指定，默认为'2015-12-31 00:00:00'。当end_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间</td><td><p>当指定frequency为minute时, 如果只传入日期, 则日内时间为当日的 00:00:00，</p><p>所以返回的数据不包括 end_date这天。</p></td></tr><tr><td>count</td><td>表示获取 end_date 之前几个 frequency 的数据，与start_date不可同时使用。</td><td>返回的结果集的行数, 即表示获取 end_date 之前count个 frequency 的数据</td></tr><tr><td>frequency</td><td>单位时间长度，即指定获取的时间频级为分钟级（minute）或日级（daily）,也可以指定为 '3m','10d' 等</td><td><p>daily'(同'1d')， 'minute'(同'1m')，</p><p><a href="https://www.joinquant.com/view/community/detail/cea095760a0583ce965964912580077e?type=1">点击查看get_price和get_bars的合成逻辑。</a>如需5分钟,1小时等标准bar请使用get_bars</p></td></tr><tr><td>fields</td><td>所获取数据的字段名称，即表头。默认是None(返回标准字段['open','close','high','low','volume','money'])</td><td><p>可选择填入以下字段，字段说明可查阅下面fields表</p><p>['open','close','low','high','volume','money','factor',</p><p>'high_limit','low_limit','avg','pre_close'],</p></td></tr><tr><td>panel</td><td>指定返回的数据格式为panel</td><td><p>默认为True；指定panel=False时返回dataframe格式；</p><p>如果您的环境pandas大于0.25 ，将强制返回dataframe详见案例</p></td></tr></tbody></table>

fields内各字段属性

<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>注释</strong></td></tr><tr><td>open</td><td>时间段开始时价格</td><td></td></tr><tr><td>close</td><td>时间段结束时价格</td><td></td></tr><tr><td>low</td><td>时间段中的最低价</td><td></td></tr><tr><td>high</td><td>时间段中的最高价</td><td></td></tr><tr><td>volume</td><td>时间段中的成交的可转债数量</td><td>单位股</td></tr><tr><td>money</td><td>时间段中的成交的金额</td><td></td></tr><tr><td>high_limit</td><td>时间段中的涨停价</td><td></td></tr><tr><td>low_limit</td><td>时间段中的跌停价</td><td></td></tr><tr><td>avg</td><td>时间段中的平均价</td><td><p>(1)天级别：可转债是成交额除以成交量；期货是直接从CTP行情获取的，计算方法为成交额除以成交量再除以合约乘数；</p><p>（2）分钟级别：用该分钟所有tick的现价乘以该tick的成交量加起来之后，再除以该分钟的成交量。</p></td></tr></tbody></table>

**返回**

-   请注意, 为了方便比较一只可转债的多个属性, 同时也满足对比多只可转债的一个属性的需求, 我们在security参数是**一只可转债和多只可转债时返回的结构完全不一样 (默认panel=True时)**

**代码示例**

```python
df=get_price('110043.XSHG',count=5,end_date='2023-01-31 10:56:00',frequency='1m',
                   fields=['open', 'close', 'high', 'low','high_limit','low_limit', 'volume', 'money'],panel = False)
print(df)
                        open    close     high      low  high_limit  \
2023-01-31 10:52:00  118.566  118.600  118.600  118.566     141.676
2023-01-31 10:53:00  118.580  118.580  118.600  118.580     141.676
2023-01-31 10:54:00  118.560  118.530  118.560  118.518     141.676
2023-01-31 10:55:00  118.502  118.461  118.502  118.436     141.676
2023-01-31 10:56:00  118.440  118.438  118.440  118.369     141.676

                     low_limit    volume     money
2023-01-31 10:52:00      94.45  840000.0  996206.0
2023-01-31 10:53:00      94.45  393000.0  466096.0
2023-01-31 10:54:00      94.45   43000.0   50981.0
2023-01-31 10:55:00      94.45   30000.0   35534.0
2023-01-31 10:56:00      94.45  141000.0  166987.0
```

<a id="get_bars"></a>

### get\_bars

**时间周期的行情数据（支持时间周期：'1m','5m', '15m', '30m', '60m', '120m', '1w', '1M'）**

```python
get_bars(security, count, unit='1d',
         fields=['date','open','high','low','close'],
         include_now=False, end_dt=None, fq_ref_date=None,df=True)
```

获取各种时间周期的bar数据，bar的分割方式与主流行情软件相同， 同时还支持返回当前时刻所在 bar 的数据。

**参数**

-   security: 可转债代码，支持单个及多个标的
-   count: 大于0的整数，表示获取bar的个数。如果行情数据的bar不足count个，返回的长度则小于count个数。
-   unit: bar的时间单位
    当unit为'1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w'(一周), '1M'（一月）标准bar时，bar的分割方式与主流行情软件划分相似 当unit为非上述标准bar时('xm', 例如'3m')，只支持分钟级别的,x需要小于240，以每天的开盘为起始点，每x分钟为一条bar；
-   fields: 获取数据的字段， 支持如下值：'date', 'open', 'close', 'high', 'low', 'volume', 'money',
-   include\_now: 取值True 或者False。 表示是否包含end\_dt所在的bar, 比如end\_dt指定为9:38:00，unit参数为5m， 如果 include\_now=True,则返回的最后一条bar为9:35:00-9:38:00这个 bar，否则返回的最后一条bar为09:30:00-09:35:00的bar。
-   end\_dt：查询的截止时间，默认最新的时间。注意:当end\_dt指定为当天尚未结束的交易时间时，会自动填充为上一个交易日收盘的时间
-   df：默认为True，指定返回数据为dataframe结构；当df=False的时候，传入单个标的时，返回一个np.ndarray，多个标的返回一个字典，key是code，value是np.array

**返回**

返回一个pandas.dataframe对象，可以按任意周期返回股票的开盘价、收盘价、最高价、最低价，同时也可以利用date数据查看所返回的数据是什么时刻的。

**示例**

-   获取一只可转债

    ```python
    df = get_bars('110043.XSHG', 5, unit='120m',fields=['date', 'open', 'close', 'high', 'low', 'volume', 'money'],include_now=False,
                  end_dt='2019-12-05')
    print(df)

                     date    open   close    high     low     volume      money
    0 2019-12-02 15:00:00  103.80  103.87  103.96  103.75  1175000.0  1220479.0
    1 2019-12-03 11:30:00  103.76  103.63  103.80  103.60  1072000.0  1111412.0
    2 2019-12-03 15:00:00  103.60  103.88  103.89  103.56  8357000.0  8672659.0
    3 2019-12-04 11:30:00  103.88  103.74  103.89  103.68  1714000.0  1778679.0
    4 2019-12-04 15:00:00  103.74  103.61  103.74  103.48  9007000.0  9333398.0
    ```

-   获取多只可转债

    ```python
    df=get_bars(['110043.XSHG', '110044.XSHG'],2,'5m',
                fields=['date', 'open', 'close', 'high', 'low', 'volume', 'money'],end_dt='2019-12-21 15:00:00')
    print(df)

                                 date    open   close    high     low    volume  \
    110043.XSHG 0 2019-12-20 14:55:00  106.98  106.95  107.06  106.95   29000.0
                1 2019-12-20 15:00:00  106.93  106.94  106.95  106.92  397000.0
    110044.XSHG 0 2019-12-20 14:55:00  147.02  146.67  147.07  146.67  555000.0
                1 2019-12-20 15:00:00  146.71  147.30  147.32  146.71  100000.0

                      money
    110043.XSHG 0   31018.0
                1  424483.0
    110044.XSHG 0  815715.0
                1  147199.0
    ```


<a id="get_call_auction"></a>

### get\_call\_auction

**获取集合竞价数据 / 2010年至今**

```python
get_call_auction(security, start_date, end_date, fields=None)
```

支持股票（2010年至今）、场内基金（2019年至今）、指数（2017年至今）和上证ETF期权（2017年至今）的集合竞价数据。当日的集合竞价数据下午15点更新。为了防止返回数据量过大, 我们每次最多返回5000行。

**参数**：

-   security: **股票（2010年至今）**
-   start\_date: 开始日期，YYYY-MM-DD格式
-   end\_date: 结束日期，YYYY-MM-DD格式
-   fields: 选择要获取的行情数据字段，参数为list格式，默认为None，返回全部字段。

**返回值：**

返回指定时间区间标的集合竞价tick数据，返回字段结果如下：

| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价（不复权） | float |
| volume | 累计成交量（股） | float |
| money | 累计成交额（元） | float |
| a1\_v~a5\_v | 五档卖量 | float |
| a1\_p~a5\_p | 五档卖价 | float |
| b1\_v~b5\_v | 五档买量 | float |
| b1\_p~b5\_p | 五档买价 | float |

**示例:**

```python
# start_dt和count只能有一个不为None值
d = get_ticks("110043.XSHG",start_dt=None, end_dt="2023-02-03 10:43:00", count=5)
print(d)

#输出
                     time  current     high     low   volume      money  \
0 2023-02-03 10:42:30.408  116.680  117.687  116.43  66290.0  7740472.0
1 2023-02-03 10:42:36.412  116.680  117.687  116.43  66330.0  7745139.0
2 2023-02-03 10:42:39.416  116.695  117.687  116.43  66340.0  7746306.0
3 2023-02-03 10:42:45.408  116.696  117.687  116.43  66500.0  7764977.0
4 2023-02-03 10:42:48.408  116.705  117.687  116.43  66510.0  7766144.0

      a1_p  a1_v     a2_p  a2_v     a3_p  a3_v     a4_p    a4_v     a5_p  \
0  116.680  30.0  116.695  10.0  116.705  10.0  116.739    20.0  116.740
1  116.705  10.0  116.739  20.0  116.740  10.0  116.744  1960.0  116.750
2  116.696  60.0  116.705  10.0  116.739  20.0  116.740    10.0  116.744
3  116.705  10.0  116.739  20.0  116.740  10.0  116.744  1960.0  116.750
4  116.706  10.0  116.739  20.0  116.740  10.0  116.744  1960.0  116.750

     a5_v     b1_p   b1_v     b2_p   b2_v     b3_p  b3_v    b4_p  b4_v  \
0    10.0  116.662  110.0  116.658   10.0  116.640  10.0  116.61  10.0
1    10.0  116.695  160.0  116.662  260.0  116.658  10.0  116.64  10.0
2  1960.0  116.695  300.0  116.662  110.0  116.658  10.0  116.64  10.0
3    10.0  116.695  200.0  116.662  110.0  116.658  10.0  116.64  10.0
4    10.0  116.695  200.0  116.662  110.0  116.658  10.0  116.64  10.0

     b5_p   b5_v
0  116.60  310.0
1  116.61   10.0
2  116.61   10.0
3  116.61   10.0
4  116.61   10.0
```

<a id="get_ticks (机构)"></a>

### get\_ticks (机构)

**可转债tick数据/2019年起**

```python
get_ticks(security, start_dt, end_dt, count, fields, skip=True,df=True)
```

**可转债部分， 支持 2019-01-01 至今的tick数据，提供买五卖五数据。（每3秒一次快照）**

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 可转债,不支持传入多个标的

-   start\_dt: 开始日期

-   end\_dt: 结束日期

-   count: 取出指定时间区间内前多少条的tick数据。

-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下：

-   skip:默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据。

-   df:指定返回的数据格式，默认为True，返回dataframe；df=False时返回一个np.ndarray

-   **股票tick返回结果**


| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价 | float |
| high | 当日最高价 | float |
| low | 当日最低价 | float |
| volume | 累计成交量（股） | float |
| money | 累计成交额 | float |
| a1\_v~a5\_v | 五档卖量 | float |
| a1\_p~a5\_p | 五档卖价 | float |
| b1\_v~b5\_v | 五档买量 | float |
| b1\_p~b5\_p | 五档买价 | float |

**可转债tick数据示例**：

<a id="start_dtcountnone"></a>

# start\_dt和count只能有一个不为None值

d = get\_ticks("110043.XSHG",start\_dt=None, end\_dt="2023-02-03 10:43:00", count=5) print(d)

# 输出

```
                 time  current     high     low   volume      money  \
```

0 2023-02-03 10:42:30.408 116.680 117.687 116.43 66290.0 7740472.0
1 2023-02-03 10:42:36.412 116.680 117.687 116.43 66330.0 7745139.0
2 2023-02-03 10:42:39.416 116.695 117.687 116.43 66340.0 7746306.0
3 2023-02-03 10:42:45.408 116.696 117.687 116.43 66500.0 7764977.0
4 2023-02-03 10:42:48.408 116.705 117.687 116.43 66510.0 7766144.0

```
  a1_p  a1_v     a2_p  a2_v     a3_p  a3_v     a4_p    a4_v     a5_p  \
```

0 116.680 30.0 116.695 10.0 116.705 10.0 116.739 20.0 116.740
1 116.705 10.0 116.739 20.0 116.740 10.0 116.744 1960.0 116.750
2 116.696 60.0 116.705 10.0 116.739 20.0 116.740 10.0 116.744
3 116.705 10.0 116.739 20.0 116.740 10.0 116.744 1960.0 116.750
4 116.706 10.0 116.739 20.0 116.740 10.0 116.744 1960.0 116.750

```
 a5_v     b1_p   b1_v     b2_p   b2_v     b3_p  b3_v    b4_p  b4_v  \
```

0 10.0 116.662 110.0 116.658 10.0 116.640 10.0 116.61 10.0
1 10.0 116.695 160.0 116.662 260.0 116.658 10.0 116.64 10.0
2 1960.0 116.695 300.0 116.662 110.0 116.658 10.0 116.64 10.0
3 10.0 116.695 200.0 116.662 110.0 116.658 10.0 116.64 10.0
4 10.0 116.695 200.0 116.662 110.0 116.658 10.0 116.64 10.0

```
 b5_p   b5_v
```

0 116.60 310.0
1 116.61 10.0
2 116.61 10.0
3 116.61 10.0
4 116.61 10.0

\`\`\`

<a id="可转债行情数据"></a>

### 可转债行情数据

-   **更新时间：2019至今，盘后15：00更新**

<a id="CONBOND_DAILY_PRICE"></a>

### CONBOND\_DAILY\_PRICE

**可转债日行情（查表） / 2018-09-13至今，每日19：00、22:00更新**

```python
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_DAILY_PRICE).limit(n))
```

**表结构：**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| date | date | 交易日期（以YYYY-MM-DD表示） |
| code | str | 债券代码 |
| name | str | 债券简称 |
| exchange\_code | str | 证券市场编码（XSHG-上交所；XSHE-深交所） |
| pre\_close | float | 昨收价 |
| open | float | 开盘价，以人民币计 |
| high | float | 最高价，以人民币计 |
| low | float | 最低价，以人民币计 |
| close | float | 收盘价，以人民币计 |
| volume | float | 成交量（手），1手为10张债券 |
| money | float | 成交额，以人民币计 |
| deal\_number | int | 成交笔数 |
| change\_pct | float | 涨跌幅，单位：% |

**示例**

获取所有在债券的转债日行情

```python
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_DAILY_PRICE))
print(df[:4])

   id        date    code  name exchange_code  pre_close    open    high  \
0   1  2018-09-13  110030  格力转债          XSHG     101.94  101.92  101.98
1   2  2018-09-14  110030  格力转债          XSHG     101.90  101.89  101.91
2   3  2018-09-17  110030  格力转债          XSHG     101.90  101.91  101.93
3   4  2018-09-18  110030  格力转债          XSHG     101.92  101.91  101.94

      low   close  volume      money  deal_number  change_pct
0  101.90  101.90    5146  5244323.0         90.0     -0.0392
1  101.88  101.90    4348  4430498.0         58.0      0.0000
2  101.89  101.92    2087  2126837.0         71.0      0.0196
3  101.89  101.91    1736  1769120.0         70.0     -0.0098
```

获取转债的日行情

```python
# 获取格力转债的日行情
from jqdatasdk import *
df=bond.run_query(query(bond.CONBOND_DAILY_PRICE).filter(bond.CONBOND_DAILY_PRICE.code=="110030"))
print(df[:5])

      id        date    code  name exchange_code  pre_close    open    high  \
0  66071  2015-01-13  110030  N格力转          XSHG     100.00  138.00  142.80
1  66072  2015-01-14  110030  格力转债          XSHG     138.26  138.58  142.03
2  66073  2015-01-15  110030  格力转债          XSHG     139.81  139.20  141.20
3  66074  2015-01-16  110030  格力转债          XSHG     139.84  139.99  145.60
4  66075  2015-01-19  110030  格力转债          XSHG     143.35  141.04  141.05

      low   close  volume        money  deal_number  change_pct
0  137.00  138.26  119222  165203875.0       1199.0     38.2600
1  137.11  139.81  274244  384512317.0       5109.0      1.1211
2  138.81  139.84   77315  108056549.0       2334.0      0.0215
3  139.99  143.35   88171  125987816.0       2276.0      2.5100
4  139.00  139.46   73077  102210898.0       1044.0     -2.7136
```

<a id="get_price"></a>

### get\_price

**可转债（1天/分钟）行情数据 / 2019年至今，盘后15点更新**

-   获取一支或者多只可转债
-   frequency为非一天或者一分钟，请使用get\_bars;
-   取多支标的的数据时，不要获取交易时段不同的标的（例如：不同交易时间的可转账标的），否则会报错；
-   这里在使用时注意 end\_date 的设置，不要引入未来的数据；
-   标识时间为09:32:00的1分钟k线，其数据时间为09:31:00至09:31:59；
-   **end\_date:当天 09:00 ~ 15:00 的行情在 15:00 之后可以获取 。**注意：当end\_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间
-   get\_price指定frequency为 非1m/1d时，fields选择'high\_limit','low\_limit'会报错

```python
get_price(security, start_date=None, end_date=None, frequency='daily', fields=None, skip_paused=False, fq='pre', count=None)
```

**参数**

<table><tbody><tr><td><strong>参数名称</strong></td><td><strong>参数说明</strong></td><td><strong>注释</strong></td></tr><tr><td>security</td><td>标的</td><td>可获取种类：股票、期货、基金、指数、期权、可转债</td></tr><tr><td>start_date</td><td>开始时间，不可与count同时使用。当'count'和'start_date'为None时, 默认值是 '2015-01-01 00:00:00'</td><td>当指定frequency为minute时，如果只传入日期，则日内时间为当日的 00:00:00</td></tr><tr><td>end_date</td><td>结束时间，如无指定，默认为'2015-12-31 00:00:00'。当end_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间</td><td><p>当指定frequency为minute时, 如果只传入日期, 则日内时间为当日的 00:00:00，</p><p>所以返回的数据不包括 end_date这天。</p></td></tr><tr><td>count</td><td>表示获取 end_date 之前几个 frequency 的数据，与start_date不可同时使用。</td><td>返回的结果集的行数, 即表示获取 end_date 之前count个 frequency 的数据</td></tr><tr><td>frequency</td><td>单位时间长度，即指定获取的时间频级为分钟级（minute）或日级（daily）,也可以指定为 '3m','10d' 等</td><td><p>daily'(同'1d')， 'minute'(同'1m')，</p><p><a href="https://www.joinquant.com/view/community/detail/cea095760a0583ce965964912580077e?type=1">点击查看get_price和get_bars的合成逻辑。</a>如需5分钟,1小时等标准bar请使用get_bars</p></td></tr><tr><td>fields</td><td>所获取数据的字段名称，即表头。默认是None(返回标准字段['open','close','high','low','volume','money'])</td><td><p>可选择填入以下字段，字段说明可查阅下面fields表</p><p>['open','close','low','high','volume','money','factor',</p><p>'high_limit','low_limit','avg','pre_close'],</p></td></tr><tr><td>panel</td><td>指定返回的数据格式为panel</td><td><p>默认为True；指定panel=False时返回dataframe格式；</p><p>如果您的环境pandas大于0.25 ，将强制返回dataframe详见案例</p></td></tr></tbody></table>

fields内各字段属性

<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>注释</strong></td></tr><tr><td>open</td><td>时间段开始时价格</td><td></td></tr><tr><td>close</td><td>时间段结束时价格</td><td></td></tr><tr><td>low</td><td>时间段中的最低价</td><td></td></tr><tr><td>high</td><td>时间段中的最高价</td><td></td></tr><tr><td>volume</td><td>时间段中的成交的可转债数量</td><td>单位股</td></tr><tr><td>money</td><td>时间段中的成交的金额</td><td></td></tr><tr><td>high_limit</td><td>时间段中的涨停价</td><td></td></tr><tr><td>low_limit</td><td>时间段中的跌停价</td><td></td></tr><tr><td>avg</td><td>时间段中的平均价</td><td><p>(1)天级别：可转债是成交额除以成交量；期货是直接从CTP行情获取的，计算方法为成交额除以成交量再除以合约乘数；</p><p>（2）分钟级别：用该分钟所有tick的现价乘以该tick的成交量加起来之后，再除以该分钟的成交量。</p></td></tr></tbody></table>

**返回**

-   请注意, 为了方便比较一只可转债的多个属性, 同时也满足对比多只可转债的一个属性的需求, 我们在security参数是**一只可转债和多只可转债时返回的结构完全不一样 (默认panel=True时)**

**代码示例**

```python
df=get_price('110043.XSHG',count=5,end_date='2023-01-31 10:56:00',frequency='1m',
                   fields=['open', 'close', 'high', 'low','high_limit','low_limit', 'volume', 'money'],panel = False)
print(df)
                        open    close     high      low  high_limit  \
2023-01-31 10:52:00  118.566  118.600  118.600  118.566     141.676
2023-01-31 10:53:00  118.580  118.580  118.600  118.580     141.676
2023-01-31 10:54:00  118.560  118.530  118.560  118.518     141.676
2023-01-31 10:55:00  118.502  118.461  118.502  118.436     141.676
2023-01-31 10:56:00  118.440  118.438  118.440  118.369     141.676

                     low_limit    volume     money
2023-01-31 10:52:00      94.45  840000.0  996206.0
2023-01-31 10:53:00      94.45  393000.0  466096.0
2023-01-31 10:54:00      94.45   43000.0   50981.0
2023-01-31 10:55:00      94.45   30000.0   35534.0
2023-01-31 10:56:00      94.45  141000.0  166987.0
```

<a id="get_bars"></a>

### get\_bars

**时间周期的行情数据（支持时间周期：'1m','5m', '15m', '30m', '60m', '120m', '1w', '1M'）**

```python
get_bars(security, count, unit='1d',
         fields=['date','open','high','low','close'],
         include_now=False, end_dt=None, fq_ref_date=None,df=True)
```

获取各种时间周期的bar数据，bar的分割方式与主流行情软件相同， 同时还支持返回当前时刻所在 bar 的数据。

**参数**

-   security: 可转债代码，支持单个及多个标的
-   count: 大于0的整数，表示获取bar的个数。如果行情数据的bar不足count个，返回的长度则小于count个数。
-   unit: bar的时间单位
    当unit为'1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w'(一周), '1M'（一月）标准bar时，bar的分割方式与主流行情软件划分相似 当unit为非上述标准bar时('xm', 例如'3m')，只支持分钟级别的,x需要小于240，以每天的开盘为起始点，每x分钟为一条bar；
-   fields: 获取数据的字段， 支持如下值：'date', 'open', 'close', 'high', 'low', 'volume', 'money',
-   include\_now: 取值True 或者False。 表示是否包含end\_dt所在的bar, 比如end\_dt指定为9:38:00，unit参数为5m， 如果 include\_now=True,则返回的最后一条bar为9:35:00-9:38:00这个 bar，否则返回的最后一条bar为09:30:00-09:35:00的bar。
-   end\_dt：查询的截止时间，默认最新的时间。注意:当end\_dt指定为当天尚未结束的交易时间时，会自动填充为上一个交易日收盘的时间
-   df：默认为True，指定返回数据为dataframe结构；当df=False的时候，传入单个标的时，返回一个np.ndarray，多个标的返回一个字典，key是code，value是np.array

**返回**

返回一个pandas.dataframe对象，可以按任意周期返回股票的开盘价、收盘价、最高价、最低价，同时也可以利用date数据查看所返回的数据是什么时刻的。

**示例**

-   获取一只可转债

    ```python
    df = get_bars('110043.XSHG', 5, unit='120m',fields=['date', 'open', 'close', 'high', 'low', 'volume', 'money'],include_now=False,
                  end_dt='2019-12-05')
    print(df)

                     date    open   close    high     low     volume      money
    0 2019-12-02 15:00:00  103.80  103.87  103.96  103.75  1175000.0  1220479.0
    1 2019-12-03 11:30:00  103.76  103.63  103.80  103.60  1072000.0  1111412.0
    2 2019-12-03 15:00:00  103.60  103.88  103.89  103.56  8357000.0  8672659.0
    3 2019-12-04 11:30:00  103.88  103.74  103.89  103.68  1714000.0  1778679.0
    4 2019-12-04 15:00:00  103.74  103.61  103.74  103.48  9007000.0  9333398.0
    ```

-   获取多只可转债

    ```python
    df=get_bars(['110043.XSHG', '110044.XSHG'],2,'5m',
                fields=['date', 'open', 'close', 'high', 'low', 'volume', 'money'],end_dt='2019-12-21 15:00:00')
    print(df)

                                 date    open   close    high     low    volume  \
    110043.XSHG 0 2019-12-20 14:55:00  106.98  106.95  107.06  106.95   29000.0
                1 2019-12-20 15:00:00  106.93  106.94  106.95  106.92  397000.0
    110044.XSHG 0 2019-12-20 14:55:00  147.02  146.67  147.07  146.67  555000.0
                1 2019-12-20 15:00:00  146.71  147.30  147.32  146.71  100000.0

                      money
    110043.XSHG 0   31018.0
                1  424483.0
    110044.XSHG 0  815715.0
                1  147199.0
    ```


<a id="get_ticks (机构)"></a>

### get\_ticks (机构)

**可转债tick数据/2019年起**

```python
get_ticks(security, start_dt, end_dt, count, fields, skip=True,df=True)
```

**可转债部分， 支持 2019-01-01 至今的tick数据，提供买五卖五数据。（每3秒一次快照）**

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 可转债,不支持传入多个标的

-   start\_dt: 开始日期

-   end\_dt: 结束日期

-   count: 取出指定时间区间内前多少条的tick数据。

-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下：

-   skip:默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据。

-   df:指定返回的数据格式，默认为True，返回dataframe；df=False时返回一个np.ndarray

-   **股票tick返回结果**


| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价 | float |
| high | 当日最高价 | float |
| low | 当日最低价 | float |
| volume | 累计成交量（股） | float |
| money | 累计成交额 | float |
| a1\_v~a5\_v | 五档卖量 | float |
| a1\_p~a5\_p | 五档卖价 | float |
| b1\_v~b5\_v | 五档买量 | float |
| b1\_p~b5\_p | 五档买价 | float |

**可转债tick数据示例**：

<a id="start_dtcountnone"></a>

# start\_dt和count只能有一个不为None值

d = get\_ticks("110043.XSHG",start\_dt=None, end\_dt="2023-02-03 10:43:00", count=5) print(d)

# 输出

```
                 time  current     high     low   volume      money  \
```

0 2023-02-03 10:42:30.408 116.680 117.687 116.43 66290.0 7740472.0
1 2023-02-03 10:42:36.412 116.680 117.687 116.43 66330.0 7745139.0
2 2023-02-03 10:42:39.416 116.695 117.687 116.43 66340.0 7746306.0
3 2023-02-03 10:42:45.408 116.696 117.687 116.43 66500.0 7764977.0
4 2023-02-03 10:42:48.408 116.705 117.687 116.43 66510.0 7766144.0

```
  a1_p  a1_v     a2_p  a2_v     a3_p  a3_v     a4_p    a4_v     a5_p  \
```

0 116.680 30.0 116.695 10.0 116.705 10.0 116.739 20.0 116.740
1 116.705 10.0 116.739 20.0 116.740 10.0 116.744 1960.0 116.750
2 116.696 60.0 116.705 10.0 116.739 20.0 116.740 10.0 116.744
3 116.705 10.0 116.739 20.0 116.740 10.0 116.744 1960.0 116.750
4 116.706 10.0 116.739 20.0 116.740 10.0 116.744 1960.0 116.750

```
 a5_v     b1_p   b1_v     b2_p   b2_v     b3_p  b3_v    b4_p  b4_v  \
```

0 10.0 116.662 110.0 116.658 10.0 116.640 10.0 116.61 10.0
1 10.0 116.695 160.0 116.662 260.0 116.658 10.0 116.64 10.0
2 1960.0 116.695 300.0 116.662 110.0 116.658 10.0 116.64 10.0
3 10.0 116.695 200.0 116.662 110.0 116.658 10.0 116.64 10.0
4 10.0 116.695 200.0 116.662 110.0 116.658 10.0 116.64 10.0

```
 b5_p   b5_v
```

0 116.60 310.0
1 116.61 10.0
2 116.61 10.0
3 116.61 10.0
4 116.61 10.0

\`\`\`
