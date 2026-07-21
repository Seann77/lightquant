---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 上市公司基础信息
section_path:
  - JQData使用说明
  - 上市公司基础信息
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#上市公司基础信息"
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - complex_table_preserved_as_html
canonical: true
alias_of: null
---

<a id="上市公司基础信息"></a>

## 上市公司基础信息

<a id="上市公司相关信息"></a>

### 上市公司相关信息

<a id="上市公司概况"></a>

#### 上市公司概况

<a id="STK_STATUS_CHANGE"></a>

### STK\_STATUS\_CHANGE

**公司状态变动 / 2005年至今，交易日24:00更新**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_STATUS_CHANGE).filter(finance.STK_STATUS_CHANGE.code==code).limit(n))
```

获取上市公司已发行未上市、正常上市、实行ST、\*ST、暂停上市、终止上市的变动情况等

**参数：**

-   **query(finance.STK\_STATUS\_CHANGE)**：表示从finance.STK\_STATUS\_CHANGE这张表中查询上市公司的状态变动信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_STATUS\_CHANGE**：代表上市公司状态变动表，收录了上市公司已发行未上市、正常上市、实行ST、\*ST、暂停上市、终止上市的变动情况等，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | company\_id | 机构ID | int |  |
    | code | 股票代码 | varchar(12) |  |
    | name | 股票名称 | varchar(40) |  |
    | pub\_date | 公告日期 | date |  |
    | change\_date | 变更日期(实际变动日期) | date |  |
    | public\_status\_id | 上市状态编码 | int | 如下上市状态编码 |
    | public\_status | 上市状态 | varchar(32) |  |
    | change\_reason | 变更原因 | varchar(500) |  |
    | change\_type\_id | 变更类型编码 | int | 如下变更类型编码 |
    | change\_type | 变更类型 | varchar(60) |  |
    | comments | 备注 | varchar(255) |  |

    上市状态编码

    | **上市状态编码** | **上市状态** |
    | --- | --- |
    | 301001 | 正常上市 |
    | 301002 | ST |
    | 301003 | \*ST |
    | 301004 | 暂停上市 |
    | 301005 | 进入退市整理期 |
    | 301006 | 终止上市 |
    | 301007 | 已发行未上市 |
    | 301008 | 预披露 |
    | 301009 | 未过会 |
    | 301010 | 发行失败 |
    | 301011 | 暂缓发行 |
    | 301012 | 暂缓上市 |
    | 301013 | 停止转让 |
    | 301014 | 正常转让 |
    | 301015 | 实行投资者适当性管理表示 |
    | 301099 | 其他 |

    | **变更类型编码** | **变更类型** |
    | --- | --- |
    | 303001 | 恢复上市 |
    | 303002 | 摘星 |
    | 303003 | 摘帽 |
    | 303004 | 摘星摘帽 |
    | 303005 | 披星 |
    | 303006 | 戴帽 |
    | 303007 | 戴帽披星 |
    | 303008 | 拟上市 |
    | 303009 | 新股上市 |
    | 303010 | 发行失败 |
    | 303011 | 暂停上市 |
    | 303012 | 终止上市 |
    | 303013 | 退市整理 |
    | 303014 | 暂缓发行 |
    | 303015 | 暂缓上市 |
    | 303016 | 实行投资者适当性管理标识 |
    | 303017 | 未过会 |
    | 303018 | 预披露 |
    | 303019 | 正常转让 |
    | 303020 | 停止转让 |
    | 303021 | 重新上市 |
    | 303099 | 其他 |

-   **filter(finance.STK\_STATUS\_CHANGE.code==code)**：指定筛选条件，通过finance.STK\_STATUS\_CHANGE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_STATUS\_CHANGE.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  为了防止返回数据量过大, 我们每次最多返回5000行
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为恒瑞医药（600276.XSHG)的上市公司状态变动
q=query(finance.STK_STATUS_CHANGE).filter(finance.STK_STATUS_CHANGE.code=='600276.XSHG').limit(10)
df=finance.run_query(q)
print(df)

     id   company_id         code     name   pub_date    public_status_id  \
0  2840    420600276  600276.XSHG  恒瑞医药  2000-10-18             301001

  public_status   change_date  change_reason  change_type_id   change_type  comments
0       正常上市    2000-10-18            NaN           303009      新股上市      NaN
```

<a id="STK_COMPANY_INFO"></a>

### STK\_COMPANY\_INFO

**上市公司基本信息 / 2005年至今，交易日24:00更新**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_COMPANY_INFO).filter(finance.STK_COMPANY_INFO.code==code).limit(n))
```

获取上市公司最新公布的基本信息，包含注册资本，主营业务，行业分类等。

**参数：**

-   **query(finance.STK\_COMPANY\_INFO)**：表示从finance.STK\_COMPANY\_INFO这张表中查询上市公司最新公布的基本信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_COMPANY\_INFO**：代表上市公司基本信息表，收录了上市公司最新公布的基本信息，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | code | 证券代码 | varchar(12) | 多证券代码的优先级：A股>B股 |
    | full\_name | 公司名称 | varchar(100) |  |
    | short\_name | 公司简称 | varchar(40) |  |
    | a\_code | A股股票代码 | varchar(12) |  |
    | b\_code | B股股票代码 | varchar(12) |  |
    | h\_code | H股股票代码 | varchar(12) |  |
    | fullname\_en | 英文名称 | varchar(100) |  |
    | shortname\_en | 英文简称 | varchar(40) |  |
    | legal\_representative | 法人代表 | varchar(40) |  |
    | register\_location | 注册地址 | varchar(100) |  |
    | office\_address | 办公地址 | varchar(150) |  |
    | zipcode | 邮政编码 | varchar(10) |  |
    | register\_capital | 注册资金 | decimal(20,4) | 单位：万元 |
    | currency\_id | 货币编码 | int |  |
    | currency | 货币名称 | varchar(32) |  |
    | establish\_date | 成立日期 | date |  |
    | website | 机构网址 | varchar(80) |  |
    | email | 电子信箱 | varchar(80) |  |
    | contact\_number | 联系电话 | varchar(60) |  |
    | fax\_number | 联系传真 | varchar(60) |  |
    | main\_business | 主营业务 | varchar(500) |  |
    | business\_scope | 经营范围 | varchar(4000) |  |
    | description | 机构简介 | varchar(4000) |  |
    | tax\_number | 税务登记号 | varchar(50) |  |
    | license\_number | 法人营业执照号 | varchar(40) |  |
    | pub\_newspaper | 指定信息披露报刊 | varchar(120) |  |
    | pub\_website | 指定信息披露网站 | varchar(120) |  |
    | secretary | 董事会秘书 | varchar(40) |  |
    | secretary\_number | 董秘联系电话 | varchar(60) |  |
    | secretary\_fax | 董秘联系传真 | varchar(60) |  |
    | secretary\_email | 董秘电子邮箱 | varchar(80) |  |
    | security\_representative | 证券事务代表 | varchar(40) |  |
    | province\_id | 所属省份编码 | varchar(12) |  |
    | province | 所属省份 | varchar(60) |  |
    | city\_id | 所属城市编码 | varchar(12) |  |
    | city | 所属城市 | varchar(60) |  |
    | industry\_id | 行业编码 | varchar(12) | 证监会行业分类 |
    | industry\_1 | 行业一级分类 | varchar(60) |  |
    | industry\_2 | 行业二级分类 | varchar(60) |  |
    | cpafirm | 会计师事务所 | varchar(200) |  |
    | lawfirm | 律师事务所 | varchar(200) |  |
    | ceo | 总经理 | varchar(100) |  |
    | comments | 备注 | varchar(300) |  |

-   **filter(finance.STK\_COMPANY\_INFO.code==code)**：指定筛选条件，通过finance.STK\_COMPANY\_INFO.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_COMPANY\_INFO.city=='北京市'，表示所属城市为北京市；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为恒瑞医药（600276.XSHG)的上市公司基本信息，限定返回条数为10
q=query(finance.STK_COMPANY_INFO).filter(finance.STK_COMPANY_INFO.code=='600276.XSHG').limit(10)
df=finance.run_query(q)
print(df)

     id company_id         code            full_name     short_name  a_code b_code  \
0  2474  420600276  600276.XSHG  江苏恒瑞医药股份有限公司       恒瑞医药  600276    NaN   

  h_code                        fullname_en       shortname_en  \
0    NaN  Jiangsu Hengrui Medicine Co., Ltd.  Hengrui Medicine   

                         ...                             province city_id  city  \
0                        ...                               江苏  320700  连云港市   

  industry_id   industry_1    industry_2                          cpafirm    \
0         C27        制造业      医药制造业  江苏苏亚金诚会计师事务所(特殊普通合伙)  

       lawfirm     ceo                                            comments  
0  浩天律师事务所  周云曙   公司是国内少有的在研发方面投入较大的企业，现有多个品种在研，不仅在国内建                           立了研究机构，投入较...  

[1 rows x 45 columns]
```

<a id="STK_LIST"></a>

### STK\_LIST

**上市信息 / 2005年至今，交易日24:00更新**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_LIST).filter(finance.STK_LIST.code==code).limit(n))
```

获取沪深A股的上市信息，包含上市日期、交易所、发行价格、初始上市数量等

**参数：**

-   **query(finance.STK\_LIST)**：表示从STK\_LIST这张表中查询沪深A股的上市信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_LIST**：代表股票上市信息表，收录了沪深A股的上市信息，包含上市日期、交易所、发行价格、初始上市数量等，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | code | 证券代码 | varchar(12) |  |
    | name | 证券简称 | varchar(40) |  |
    | short\_name | 拼音简称 | varchar(20) |  |
    | category | 证券类别 | varchar(4) | A/B |
    | exchange | 交易所 | varchar(12) | XSHG/XSHE |
    | start\_date | 上市日期 | date |  |
    | end\_date | 终止上市日期 | date |  |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | ipo\_shares | 初始上市数量 | decimal(20,2) | 股 |
    | book\_price | 发行价格 | decimal(20,4) | 元 |
    | par\_value | 面值 | decimal(20,4) | 元 |
    | state\_id | 上市状态编码 | int |  |
    | state | 上市状态 | varchar(32) |  |

-   **filter(finance.STK\_LIST.code==code)**：指定筛选条件，通过finance.STK\_LIST.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_LIST.start\_date>='2015-01-01'，表示筛选上市日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为格力电器（000651.XSHG)的上市信息
q=query(finance.STK_LIST).filter(finance.STK_LIST.code=='000651.XSHE')
df=finance.run_query(q)
print(df)

     id         code  name short_name category exchange  start_date end_date  \
0  1789  000651.XSHE  格力电器       GLDQ        A     XSHE  1996-11-18     None   

   company_id  company_name  ipo_shares  book_price  par_value  state_id state  
0   430000651  珠海格力电器股份有限公司  21000000.0         2.5        1.0    301001  正常上市  
```

<a id="STK_NAME_HISTORY"></a>

### STK\_NAME\_HISTORY

**简称变更情况 / 2005年至今，交易日24:00更新**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_NAME_HISTORY).filter(finance.STK_NAME_HISTORY.code==code).limit(n))
```

获取在A股市场和B股市场上市的股票简称的变更情况

**参数：**

-   **query(finance.STK\_NAME\_HISTORY)**：表示从finance.STK\_NAME\_HISTORY这张表中查询股票简称的变更情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_NAME\_HISTORY**：代表股票简称变更表，收录了在A股市场和B股市场上市的股票简称的变更情况，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | code | 股票代码 | varchar(12) |  |
    | company\_id | 公司ID | int |  |
    | new\_name | 新股票简称 | varchar(40) |  |
    | new\_spelling | 新英文简称 | varchar(40) |  |
    | org\_name | 原证券简称 | varchar(40) |  |
    | org\_spelling | 原证券英文简称 | varchar(40) |  |
    | start\_date | 开始日期 | date |  |
    | pub\_date | 公告日期 | date |  |
    | reason | 变更原因 | varchar(255) |  |

-   **filter(finance.STK\_NAME\_HISTORY.code==code)**：指定筛选条件，通过finance.STK\_NAME\_HISTORY.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_NAME\_HISTORY.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为恒瑞医药（600276.XSHG)的股票简称变更信息
q=query(finance.STK_NAME_HISTORY).filter(finance.STK_NAME_HISTORY.code=='600276.XSHG')
df=finance.run_query(q)
print(df)

     id         code company_id     new_name   new_spelling org_name org_spelling  \
0  1459  600276.XSHG  420600276     恒瑞医药         HRYY      NaN          NaN
1  3588  600276.XSHG  420600276      Ｇ恒瑞          ＧHR      NaN          NaN
2  4007  600276.XSHG  420600276     恒瑞医药         HRYY      NaN          NaN

   start_date    pub_date  reason
0  2000-10-18  2000-10-18    NaN
1  2006-06-20  2006-06-15    NaN
2  2006-10-09  2006-09-28    NaN
```

<a id="STK_EMPLOYEE_INFO"></a>

### STK\_EMPLOYEE\_INFO

**员工情况 / 2005年至今，交易日24:00更新**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_EMPLOYEE_INFO).filter(finance.STK_EMPLOYEE_INFO.code==code).limit(n))
```

获取上市公司在公告中公布的员工情况，包括员工人数、学历等信息

**参数：**

-   **query(finance.STK\_EMPLOYEE\_INFO)**：表示从finance.STK\_EMPLOYEE\_INFO这张表中查询上市公司员工情况的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_EMPLOYEE\_INFO**：代表上市公司员工情况表，收录了上市公司在公告中公布的员工情况，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | code | 证券代码 | varchar(12) | '600276.XSHG'，'000001.XSHE' |
    | name | 证券名称 | varchar(64) |  |
    | end\_date | 报告期截止日 | date | 统计截止该报告期的员工信息 |
    | pub\_date | 公告日期 | date |  |
    | employee | 在职员工总数 | int | 人 |
    | retirement | 离退休人员 | int | 人 |
    | graduate\_rate | 研究生以上人员比例 | decimal(10,4) | % |
    | college\_rate | 大学专科以上人员比例 | decimal(10,4) | % |
    | middle\_rate | 中专及以下人员比例 | decimal(10,4) | % |

-   **filter(finance.STK\_EMPLOYEE\_INFO.code==code)**：指定筛选条件，通过finance.STK\_EMPLOYEE\_INFO.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_EMPLOYEE\_INFO.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日上市公司公布的员工信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为恒瑞医药（600276.XSHG)的员工信息且公告日期大于2015年1月1日，限定返回条数为4
q=query(finance.STK_EMPLOYEE_INFO).filter(finance.STK_EMPLOYEE_INFO.code=='600276.XSHG',finance.STK_EMPLOYEE_INFO.pub_date>='2015-01-01').limit(4)
df=finance.run_query(q)
print(df)

      id  company_id         code  name    end_date    pub_date  employee  \
0  21542   420600276  600276.XSHG  恒瑞医药  2014-12-31  2015-03-31      8770   
1  21543   420600276  600276.XSHG  恒瑞医药  2015-12-31  2016-04-13     10191   
2  21544   420600276  600276.XSHG  恒瑞医药  2016-12-31  2017-03-11     12653   
3  34881   420600276  600276.XSHG  恒瑞医药  2017-12-31  2018-04-16     14864   

  retirement  graduate_rate college_rate  middle_rate  
0       None         7.4344         None      55.1083  
1       None        10.0677         None      50.5937  
2       None        10.8907         None      45.9338  
3       None        11.3294         None      41.9806  
```

<a id="STK_MANAGEMENT_INFO"></a>

### STK\_MANAGEMENT\_INFO

**公司管理人员任职情况 / 2005年至今，交易日24:00更新**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_MANAGEMENT_INFO).filter(finance.STK_MANAGEMENT_INFO.code==code).order_by(finance.STK_MANAGEMENT_INFO.pub_date).limit(n)
```

记录上市公司管理人员的任职情况。

**参数：**

-   **query(finance.STK\_MANAGEMENT\_INFO)**：表示从finance.STK\_MANAGEMENT\_INFO这张表中查询上市公司管理人员任职情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_MANAGEMENT\_INFO**：代表了公司管理人员任职情况表，收录了上市公司管理人员的任职情况，表结构和字段信息如下：


<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>字段类型</strong></td><td><strong>备注/示例</strong></td></tr><tr><td>company_id</td><td>公司ID</td><td>int</td><td></td></tr><tr><td>company_name</td><td>公司名称</td><td>varchar(100)</td><td></td></tr><tr><td>code</td><td>股票代码</td><td>varchar(12)</td><td></td></tr><tr><td>pub_date</td><td>公告日期</td><td>date</td><td></td></tr><tr><td>person_id</td><td>个人ID</td><td>int</td><td></td></tr><tr><td>name</td><td>姓名</td><td>varchar(40)</td><td></td></tr><tr><td>title_class_id</td><td>职务类别编码</td><td>int</td><td></td></tr><tr><td>title_class</td><td>职务类别</td><td>varchar(60)</td><td></td></tr><tr><td>title</td><td>职务名称</td><td>varchar(60)</td><td></td></tr><tr><td>start_date</td><td>任职日期</td><td>date</td><td></td></tr><tr><td>leave_date</td><td>离职日期</td><td>date</td><td></td></tr><tr><td>leave_reason</td><td>离职原因</td><td>varchar(255)</td><td></td></tr><tr><td>on_job</td><td>是否在职</td><td>char(1)</td><td>0-否，1-是</td></tr><tr><td>gender</td><td>性别</td><td>char(1)</td><td>F-女；M-男</td></tr><tr><td>birth_year</td><td>出生年份</td><td>varchar(8)</td><td></td></tr><tr><td>highest_degree_id</td><td>最高学历编码</td><td>int</td><td></td></tr><tr><td>highest_degree</td><td>最高学历</td><td>varchar(60)</td><td></td></tr><tr><td>title_level_id</td><td>职级编码</td><td>int</td><td></td></tr><tr><td>titile_level</td><td>职级</td><td>varchar(120)</td><td><p>职级代表工作的难易程度、责任轻重以及所需的资格条件相同</p><p>或充分相似的职系的集合。如初级、中级、高级。</p></td></tr><tr><td>profession_certificate</td><td>专业技术资格</td><td>varchar(120)</td><td></td></tr><tr><td>profession_certificate</td><td>专业技术资格</td><td>varchar(120)</td><td></td></tr><tr><td>nationality</td><td>国籍</td><td>varchar(60)</td><td></td></tr><tr><td>security_career_start_year</td><td>从事证券业开始年份</td><td>varchar(8)</td><td></td></tr><tr><td>resume</td><td>个人简历</td><td>varchar(3000)</td><td></td></tr></tbody></table>

-   **filter(finance.STK\_MANAGEMENT\_INFO.code==code)**：指定筛选条件，通过finance.STK\_MANAGEMENT\_INFO.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_MANAGEMENT\_INFO.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。
-   **order\_by(finance.STK\_MANAGEMENT\_INFO.pub\_date)**: 将返回结果按公告日期排序
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  \*\*为了防止返回数据量过大, 我们每次最多返回5000行 \*\*

2.  不能进行连表查询，即同时查询多张表的数据

    **示例：**


```
q=query(finance.STK_MANAGEMENT_INFO).filter(finance.STK_MANAGEMENT_INFO.code=='000001.XSHE').order_by(finance.STK_MANAGEMENT_INFO.pub_date).limit(5)
df=finance.run_query(q)
print(df)

# 输出
       id  company_id company_name         code    pub_date  person_id  \
0  138262   430000001   平安银行股份有限公司  000001.XSHE  2014-10-10  201309346   
1  138263   430000001   平安银行股份有限公司  000001.XSHE  2014-10-10  201309346   
2  138264   430000001   平安银行股份有限公司  000001.XSHE  2014-10-10  201309346   
3  138265   430000001   平安银行股份有限公司  000001.XSHE  2014-10-10  201313341   
4  138266   430000001   平安银行股份有限公司  000001.XSHE  2014-10-10  201313342   

      name  title_class_id title_class title  \
0      肖遂宁          314001       董事会成员    董事   
1      肖遂宁          314003        高管成员    行长   
2      肖遂宁          314001       董事会成员   董事长   
3  罗伯特·巴内姆          314001       董事会成员  独立董事   
4      孙昌基          314001       董事会成员  独立董事   

                         ...                         highest_degree_id  \
0                        ...                                  316004.0   
1                        ...                                  316004.0   
2                        ...                                  316004.0   
3                        ...                                  316002.0   
4                        ...                                       NaN   

  highest_degree title_level_id title_level profession_certificate_id  \
0          大专及其他       317003.0          高级                      None   
1          大专及其他       317003.0          高级                      None   
2          大专及其他       317003.0          高级                      None   
3          硕士研究生            NaN        None                      None   
4           None       317003.0          高级                      None   

  profession_certificate  nationality_id nationality  \
0                   None            None        None   
1                   None            None        None   
2                   None            None        None   
3                   None            None        None   
4                   None            None        None   

   security_career_start_year  \
0                        None   
1                        None   
2                        None   
3                        None   
4                        None   

                                              resume  
0  肖遂宁先生：出生于1948年2月，高级经济师。曾任深圳发展银行总行行长、董事长，平安银行股份...  
1  肖遂宁先生：出生于1948年2月，高级经济师。曾任深圳发展银行总行行长、董事长，平安银行股份...  
2  肖遂宁先生：出生于1948年2月，高级经济师。曾任深圳发展银行总行行长、董事长，平安银行股份...  
3  罗伯特巴内姆先生（RobertT.Barnum）自1997年至今在美国加州的PokerFla...  
4  孙昌基，男，研究员级高级工程师。1942年8月20日出生于上海，1966年9月毕业于清华大学...  

[5 rows x 26 columns]
```

<a id="STK_XR_XD"></a>

### STK\_XR\_XD

**上市公司分红送股（除权除息）数据 / 2005至今，8:00更新**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_XR_XD).filter(finance.STK_XR_XD.code==code).order_by(finance.STK_XR_XD.report_date).limit(n)
```

记录由上市公司年报、中报、一季报、三季报统计出的分红转增情况。

**参数：**

-   **query(finance.STK\_XR\_XD)**：表示从finance.STK\_XR\_XD这张表中查询上市公司除权除息的数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_XR\_XD**：代表除权除息数据表，记录由上市公司年报、中报、一季报、三季报统计出的分红转增情况。表结构和字段信息如下：


<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>字段类型</strong></td><td><strong>能否为空</strong></td><td><strong>含义</strong></td></tr><tr><td>code</td><td>股票代码</td><td>varchar(12)</td><td>N</td><td>加后缀</td></tr><tr><td>company_id</td><td>机构ID</td><td>int</td><td>N</td><td></td></tr><tr><td>company_name</td><td>机构名称</td><td>varchar(100)</td><td></td><td></td></tr><tr><td>report_date</td><td>分红报告期</td><td>date</td><td>N</td><td>一般为：一季报:YYYY-03-31;中报:YYYY-06-30;三季报:YYYY-09-30;年报:YYYY-12-31同时也可能存在其他日期</td></tr><tr><td>bonus_type</td><td>分红类型</td><td>varchar(60)</td><td></td><td>201102新增,类型如下：年度分红 中期分红 季度分红 特别分红 向公众股东赠送 股改分红</td></tr><tr><td>board_plan_pub_date</td><td>董事会预案公告日期</td><td>date</td><td></td><td></td></tr><tr><td>board_plan_bonusnote</td><td>董事会预案分红说明</td><td>varchar(500)</td><td></td><td>每10股送XX转增XX派XX元</td></tr><tr><td>distributed_share_base_board</td><td>分配股本基数（董事会）</td><td>decimal(20,4)</td><td></td><td>单位:万股</td></tr><tr><td>shareholders_plan_pub_date</td><td>股东大会预案公告日期</td><td>date</td><td></td><td></td></tr><tr><td>shareholders_plan_bonusnote</td><td>股东大会预案分红说明</td><td>varchar(200)</td><td></td><td></td></tr><tr><td>distributed_share_base_shareholders</td><td>分配股本基数（股东大会）</td><td>decimal(20,4)</td><td></td><td>单位:万股</td></tr><tr><td>implementation_pub_date</td><td>实施方案公告日期</td><td>date</td><td></td><td></td></tr><tr><td>implementation_bonusnote</td><td>实施方案分红说明</td><td>varchar(200)</td><td></td><td>维护规则: 每10股送XX转增XX派XX元 或:不分配不转赠</td></tr><tr><td>distributed_share_base_implement</td><td>分配股本基数（实施）</td><td></td><td></td><td>单位:万股</td></tr><tr><td>dividend_ratio</td><td>送股比例</td><td>decimal(20,4)</td><td></td><td>每10股送XX股</td></tr><tr><td>transfer_ratio</td><td>转增比例</td><td>decimal(20,4)</td><td></td><td>每10股转增 XX股 ；</td></tr><tr><td>bonus_ratio_rmb</td><td>派息比例(人民币)</td><td>decimal(20,4)</td><td></td><td>每10股派 XX。说明：这里的比例为最新的分配比例，预案公布的时候，预案的分配基数在此维护，如果股东大会或实施方案发生变化，再次进行修改，保证此处为最新的分配基数</td></tr><tr><td>bonus_ratio_usd</td><td>派息比例（美元）</td><td>decimal(20,4)</td><td></td><td>每10股派 XX。说明：这里的比例为最新的分配比例，预案公布的时候，预案的分配基数在此维护，如果股东大会或实施方案发生变化，再次进行修改，保证此处为最新的分配基数 如果这里只告诉了汇率，没有公布具体的外币派息，则要计算出；</td></tr><tr><td>bonus_ratio_hkd</td><td>派息比例（港币）</td><td>decimal(20,4)</td><td></td><td>每10股派 XX。说明：这里的比例为最新的分配比例，预案公布的时候，预案的分配基数在此维护，如果股东大会或实施方案发生变化，再次进行修改，保证此处为最新的分配基数 如果这里只告诉了汇率，没有公布具体的外币派息，则要计算出；</td></tr><tr><td>at_bonus_ratio_rmb</td><td>税后派息比例（人民币）</td><td>decimal(20,4)</td><td></td><td></td></tr><tr><td>exchange_rate</td><td>汇率</td><td>decimal(20,4)</td><td></td><td>当日以外币（美元或港币）计价的B股价格兑换成人民币的汇率</td></tr><tr><td>dividend_number</td><td>送股数量</td><td>decimal(20,4)</td><td></td><td>单位：万股</td></tr><tr><td>transfer_number</td><td>转增数量</td><td>decimal(20,4)</td><td></td><td>单位：万股</td></tr><tr><td>bonus_amount_rmb</td><td>派息金额(人民币)</td><td>decimal(20,4)</td><td></td><td>单位：万元</td></tr><tr><td>a_registration_date</td><td>A股股权登记日</td><td>date</td><td></td><td></td></tr><tr><td>b_registration_date</td><td>B股股权登记日</td><td>date</td><td></td><td>B股股权登记存在最后交易日，除权基准日以及股权登记日三个日期，由于B股实行T+3制度，最后交易日持有的股份需要在3个交易日之后确定股东身份，然后在除权基准日进行除权。</td></tr><tr><td>a_xr_date</td><td>A股除权日</td><td>date</td><td></td><td></td></tr><tr><td>b_xr_baseday</td><td>B股除权基准日</td><td>date</td><td></td><td>根据B股实行T＋3交收制度,则B股的“股权登记日”是“最后交易日”后的第 三个交易日,直至“股权登记日”这一日为止,B股投资者的股权登记才告完成,也 就意味着B股股份至股权登记日为止,才真正划入B股投资者的名下。</td></tr><tr><td>b_final_trade_date</td><td>B股最后交易日</td><td>date</td><td></td><td></td></tr><tr><td>a_bonus_date</td><td>派息日(A)</td><td>date</td><td></td><td></td></tr><tr><td>b_bonus_date</td><td>派息日(B)</td><td>date</td><td></td><td></td></tr><tr><td>dividend_arrival_date</td><td>红股到帐日</td><td>date</td><td></td><td></td></tr><tr><td>a_increment_listing_date</td><td>A股新增股份上市日</td><td>date</td><td></td><td></td></tr><tr><td>b_increment_listing_date</td><td>B股新增股份上市日</td><td>date</td><td></td><td></td></tr><tr><td>total_capital_before_transfer</td><td>送转前总股本</td><td>decimal(20,4)</td><td></td><td>单位：万股</td></tr><tr><td>total_capital_after_transfer</td><td>送转后总股本</td><td>decimal(20,4)</td><td></td><td>单位：万股</td></tr><tr><td>float_capital_before_transfer</td><td>送转前流通股本</td><td>decimal(20,4)</td><td></td><td>单位：万股</td></tr><tr><td>float_capital_after_transfer</td><td>送转后流通股本</td><td>decimal(20,4)</td><td></td><td>单位：万股</td></tr><tr><td>note</td><td>备注</td><td>varchar(500)</td><td></td><td></td></tr><tr><td>a_transfer_arrival_date</td><td>A股转增股份到帐日</td><td>date</td><td></td><td></td></tr><tr><td>b_transfer_arrival_date</td><td>B股转增股份到帐日</td><td>date</td><td></td><td></td></tr><tr><td>b_dividend_arrival_date</td><td>B股送红股到帐日</td><td>date</td><td></td><td>20080801新增</td></tr><tr><td>note_of_no_dividend</td><td>有关不分配的说明</td><td>varchar(1000)</td><td></td><td></td></tr><tr><td>plan_progress_code</td><td>方案进度编码</td><td>int</td><td></td><td></td></tr><tr><td>plan_progress</td><td>方案进度</td><td>varchar(60)</td><td></td><td>董事会预案 实施方案 股东大会预案 取消分红 公司预案</td></tr><tr><td>bonus_cancel_pub_date</td><td>取消分红公告日期</td><td>date</td><td></td><td></td></tr></tbody></table>

-   **filter(finance.STK\_XR\_XD.report\_date==report\_date)**：指定筛选条件，通过finance.STK\_XR\_XD.report\_date==report\_date可以指定你想要查询的分红报告期；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_XR\_XD.code=='000001.XSHE'，表示筛选股票编码为000001.XSHE的数据； 多个筛选条件用英文逗号分隔。

-   **order\_by(finance.STK\_XR\_XD.report\_date)**: 将返回结果按分红报告期排序

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个dataframe，每一行对应数据表中的一条数据，列索引是你所查询的字段名称。

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**

2.  不能进行连表查询，即同时查询多张表的数据

    **示例：**


```python
q=query(finance.STK_XR_XD).filter(finance.STK_XR_XD.report_date>='2015-01-01').limit(5)
df = finance.run_query(q)
print(df)

      id  company_id      company_name         code report_date bonus_type  \
0  19   300000062  广东德美精细化工集团股份有限公司  002054.XSHE  2015-06-30       中期分红   
1  20   300000062  广东德美精细化工集团股份有限公司  002054.XSHE  2015-12-31       年度分红   
2  21   300000062  广东德美精细化工集团股份有限公司  002054.XSHE  2016-06-30       中期分红   
3  22   300000062  广东德美精细化工集团股份有限公司  002054.XSHE  2016-12-31       年度分红   
4  23   300000062  广东德美精细化工集团股份有限公司  002054.XSHE  2017-06-30       中期分红   

  board_plan_pub_date board_plan_bonusnote  distributed_share_base_board  \
0          2015-08-29               不分配不转增                           NaN   
1          2016-04-27          10派1.2元(含税)                    41923.0828   
2          2016-08-27               不分配不转增                           NaN   
3          2017-04-25          10派1.2元(含税)                    41923.0828   
4          2017-08-29               不分配不转增                           NaN   

  shareholders_plan_pub_date          ...           \
0                       None          ...            
1                 2016-05-18          ...            
2                       None          ...            
3                 2017-05-17          ...            
4                       None          ...            

  float_capital_before_transfer  float_capital_after_transfer  note  \
0                          None                          None  None   
1                          None                          None  None   
2                          None                          None  None   
3                          None                          None  None   
4                          None                          None  None   

  a_transfer_arrival_date  b_transfer_arrival_date b_dividend_arrival_date  \
0                    None                     None                    None   
1                    None                     None                    None   
2                    None                     None                    None   
3                    None                     None                    None   
4                    None                     None                    None   

  note_of_no_dividend  plan_progress_code plan_progress bonus_cancel_pub_date  
0                None              313001         董事会预案                  None  
1                None              313002          实施方案                  None  
2                None              313001         董事会预案                  None  
3                None              313002          实施方案                  None  
4                None              313001         董事会预案                  None  

[5 rows x 47 columns]
```

<a id="上市公司股东和股本信息"></a>

#### 上市公司股东和股本信息

-   **更新时间：2005年至今，交易日24:00更新**

<a id="STK_SHAREHOLDER_TOP10"></a>

### STK\_SHAREHOLDER\_TOP10

**十大股东**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_SHAREHOLDER_TOP10).filter(finance.STK_SHAREHOLDER_TOP10.code==code).limit(n))
```

获取上市公司前十大股东的持股情况，包括持股数量，所持股份性质，变动原因等。

**参数：**

-   **query(finance.STK\_SHAREHOLDER\_TOP10)**：表示从finance.STK\_SHAREHOLDER\_TOP10这张表中查询上市公司前十大股东的持股情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_SHAREHOLDER\_TOP10**：代表上市公司十大股东表，收录了上市公司前十大股东的持股情况，包括持股数量，所持股份性质，变动原因等。表结构和字段信息如下：

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
    | share\_pledge | 股份质押数量 | decimal(10,4) |  |
    | share\_freeze | 股份冻结数量 | decimal(10,4) |  |

-   **filter(finance.STK\_SHAREHOLDER\_TOP10.code==code)**：指定筛选条件，通过finance.STK\_SHAREHOLDER\_TOP10.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHAREHOLDER\_TOP10.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
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

<a id="STK_SHAREHOLDER_FLOATING_TOP10"></a>

### STK\_SHAREHOLDER\_FLOATING\_TOP10

**十大流通股东**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_SHAREHOLDER_FLOATING_TOP10).filter(finance.STK_SHAREHOLDER_FLOATING_TOP10.code==code).limit(n))
```

获取上市公司前十大流通股东的持股情况，包括持股数量，所持股份性质，变动原因等。

**参数：**

-   **query(finance.STK\_SHAREHOLDER\_FLOATING\_TOP10)**：表示从finance.STK\_SHAREHOLDER\_FLOATING\_TOP10这张表中查询上市公司前十大流通股东的持股情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_SHAREHOLDER\_FLOATING\_TOP10**：代表上市公司十大流通股东表，收录了上市公司前十大流通股东的持股情况，包括持股数量，所持股份性质，变动原因等。表结构和字段信息如下：

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

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为恒瑞医药（600276.XSHG)的十大流通股东情况，返回条数为10条
q=query(finance.STK_SHAREHOLDER_FLOATING_TOP10).filter(finance.STK_SHAREHOLDER_FLOATING_TOP10.code=='600276.XSHG',finance.STK_SHAREHOLDER_FLOATING_TOP10.pub_date>'2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

       id  company_id  company_name         code    end_date    pub_date  \
0  585806   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
1  585807   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
2  585808   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
3  585809   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
4  585810   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
5  585811   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
6  585812   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
7  585813   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
8  585814   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   
9  585815   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2014-12-31  2015-03-31   

   change_reason_id change_reason  shareholder_rank  shareholder_id  \
0            306019          定期报告                 1       100008682   
1            306019          定期报告                 2       100097529   
2            306019          定期报告                 3       100008678   
3            306019          定期报告                 4       100014895   
4            306019          定期报告                 5       100008257   
5            306019          定期报告                 6       100011907   
6            306019          定期报告                 7       120160219   
7            306019          定期报告                 8       120163402   
8            306019          定期报告                 9       120050009   
9            306019          定期报告                10       100000383   

                    shareholder_name shareholder_name_en  \
0                       江苏恒瑞医药集团有限公司                None   
1                         西藏达远投资有限公司                None   
2                      连云港恒创医药科技有限公司                None   
3                         中国医药工业有限公司                None   
4                         江苏金海投资有限公司                None   
5                         香港中央结算有限公司                None   
6  中国农业银行股份有限公司-国泰国证医药卫生行业指数分级证券投资基金                None   
7         兴业银行股份有限公司-兴全趋势投资混合型证券投资基金                None   
8               交通银行-博时新兴成长股票型证券投资基金                None   
9   新华人寿保险股份有限公司-分红-团体分红-018L-FH001沪                None   

   shareholder_class_id shareholder_class  share_number  share_ratio  \
0                307099              其他机构   332523790.0       22.109   
1                307099              其他机构   229034683.0       15.228   
2                307099              其他机构   102094053.0        6.788   
3                307099              其他机构    70203316.0        4.668   
4                307099              其他机构    50367370.0        3.349   
5                307099              其他机构    17207872.0        1.144   
6                307003            证券投资基金    15161505.0        1.008   
7                307003            证券投资基金    10299800.0        0.685   
8                307003            证券投资基金     9929500.0        0.660   
9                307014            保险投资组合     9296487.0        0.618   

   sharesnature_id sharesnature  
0           308007         流通A股  
1           308007         流通A股  
2           308007         流通A股  
3           308007         流通A股  
4           308007         流通A股  
5           308007         流通A股  
6           308007         流通A股  
7           308007         流通A股  
8           308007         流通A股  
9           308007         流通A股  
```

<a id="STK_SHARES_PLEDGE"></a>

### STK\_SHARES\_PLEDGE

**股东股份质押**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_SHARES_PLEDGE).filter(finance.STK_SHARES_PLEDGE.code==code).limit(n))
```

获取上市公司股东股份的质押情况。

**参数：**

-   **query(finance.STK\_SHARES\_PLEDGE)**：表示从finance.STK\_SHARES\_PLEDGE这张表中查询上市公司股东股份的质押情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_SHARES\_PLEDGE**：代表上市公司股东股份质押表，收录了上市公司股东股份的质押情况。表结构和字段信息如下：

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
    | unpledged\_number | 质押解除数量 | int |  |
    | unpledged \_detail | 解除质押说明 | varchar(1000) |  |
    | is\_buy\_back | 是否质押式回购交易 | char(1) |  |

-   **filter(finance.STK\_SHARES\_PLEDGE.code==code)**：指定筛选条件，通过finance.STK\_SHARES\_PLEDGE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHARES\_PLEDGE.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为万科（000002.XSHE)的股东股份质押情况，返回条数为5条
q=query(finance.STK_SHARES_PLEDGE).filter(finance.STK_SHARES_PLEDGE.code=='000002.XSHE',finance.STK_SHARES_PLEDGE.pub_date>'2015-01-01').limit(5)
df=finance.run_query(q)
print(df)

      id  company_id company_name         code    pub_date pledgor_id  \
0  82514   430000002   万科企业股份有限公司  000002.XSHE  2015-11-11       None   
1  82515   430000002   万科企业股份有限公司  000002.XSHE  2016-07-14       None   
2  82516   430000002   万科企业股份有限公司  000002.XSHE  2017-03-08       None   
3  82517   430000002   万科企业股份有限公司  000002.XSHE  2017-03-08       None   
4  82518   430000002   万科企业股份有限公司  000002.XSHE  2017-03-14       None   

        pledgor         pledgee  \
0  深圳市钜盛华股份有限公司  鹏华资产管理（深圳）有限公司   
1  深圳市钜盛华股份有限公司    中国银河证券股份有限公司   
2  深圳市钜盛华股份有限公司  鹏华资产管理（深圳）有限公司   
3  深圳市钜盛华股份有限公司  鹏华资产管理（深圳）有限公司   
4  深圳市钜盛华股份有限公司      平安证券股份有限公司   

                                         pledge_item  pledge_nature_id  \
0  本公司股东深圳市钜盛华股份有限公司将持有的公司728,000,000股无限售流通A股质押给鹏...               NaN   
1  本公司股东深圳市钜盛华股份有限公司将持有的本公司37357300股股权质押给中国银河证券股份...          308007.0   
2  本公司股东深圳市钜盛华股份有限公司将2015年10月21日质押给鹏华资产管理（深圳）有限公司...          308007.0   
3  本公司股东深圳市钜盛华股份有限公司将2015年10月28日质押给鹏华资产管理（深圳）有限公司...          308007.0   
4  本公司第一大股东深圳市钜盛华股份有限公司将持有的本公司182000000股流通A股股权质押给...          308007.0   

  pledge_nature  pledge_number  pledge_total_ratio  start_date    end_date  \
0          None    728000000.0                6.59  2015-10-15        None   
1          流通A股     37357300.0                 NaN  2016-07-12        None   
2          流通A股            NaN                 NaN  2015-10-21  2017-03-03   
3          流通A股            NaN                 NaN  2015-10-28  2017-03-03   
4          流通A股    182000000.0                 NaN  2017-03-09        None   

  unpledged_date  unpledged_number unpledged_detail is_buy_back  
0           None               NaN             None        None  
1           None               NaN             None           1  
2     2017-03-03        91000000.0             None        None  
3     2017-03-03        91000000.0             None        None  
4           None               NaN             None           1 
```

<a id="STK_SHARES_FROZEN"></a>

### STK\_SHARES\_FROZEN

**股东股份冻结**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_SHARES_FROZEN).filter(finance.STK_SHARES_FROZEN.code==code).limit(n))
```

获取上市公司股东股份的冻结情况

**参数：**

-   **query(finance.STK\_SHARES\_FROZEN)**：表示从finance.STK\_SHARES\_FROZEN这张表中查询股东股份的冻结情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_SHARES\_FROZEN**：代表上市公司股东股份冻结表，收录了上市公司股东股份的冻结情况，表结构和字段信息如下：


<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>字段类型</strong></td><td><strong>含义</strong></td></tr><tr><td>company_id</td><td>公司ID</td><td>int</td><td></td></tr><tr><td>company_name</td><td>公司名称</td><td>varchar(100)</td><td></td></tr><tr><td>pub_date</td><td>公告日期</td><td>date</td><td></td></tr><tr><td>code</td><td>股票代码</td><td>varchar(12)</td><td></td></tr><tr><td>frozen_person_id</td><td>被冻结当事人ID</td><td>int</td><td></td></tr><tr><td>frozen_person</td><td>被冻结当事人</td><td>varchar(100)</td><td></td></tr><tr><td>frozen_reason</td><td>冻结事项</td><td>varchar(600)</td><td></td></tr><tr><td>frozen_share_nature_id</td><td>被冻结股份性质编码</td><td>int</td><td></td></tr><tr><td>frozen_share_nature</td><td>被冻结股份性质</td><td>varchar(120)</td><td><p>包括:国家股、法人股、个人股、外资股、</p><p>流通A股、流通B股、职工股、发起人股、转配股</p></td></tr><tr><td>frozen_number</td><td>冻结数量</td><td>int</td><td>股</td></tr><tr><td>frozen_total_ratio</td><td>占总股份比例</td><td>decimal(10,4)</td><td>%</td></tr><tr><td>freeze_applicant</td><td>冻结申请人</td><td>varchar(100)</td><td></td></tr><tr><td>freeze_executor</td><td>冻结执行人</td><td>varchar(100)</td><td></td></tr><tr><td>start_date</td><td>冻结起始日</td><td>date</td><td></td></tr><tr><td>end_date</td><td>冻结终止日</td><td>date</td><td></td></tr><tr><td>unfrozen_date</td><td>解冻日期</td><td>date</td><td>分批解冻的为最近一次解冻日期</td></tr><tr><td>unfrozen_number</td><td>累计解冻数量</td><td>int</td><td>原解冻数量</td></tr><tr><td>unfrozen_detail</td><td>解冻处理说明</td><td>varchar(1000)</td><td>冻结过程及结束后的处理结果</td></tr></tbody></table>

-   **filter(finance.STK\_SHARES\_FROZEN.code==code)**：指定筛选条件，通过finance.STK\_SHARES\_FROZEN.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHARES\_FROZEN.pub\_date>='2015-01-01'，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为文一科技（600520.XSHG)的股东股份冻结情况，返回条数为5条
q=query(finance.STK_SHARES_FROZEN).filter(finance.STK_SHARES_FROZEN.code=='600520.XSHG',finance.STK_SHARES_FROZEN.pub_date>'2015-01-01').limit(5)
df=finance.run_query(q)
print(df)

     id  company_id    company_name    pub_date         code frozen_person_id  \
0  2360   420600520  铜陵中发三佳科技股份有限公司  2015-07-11  600520.XSHG             None   
1  2361   420600520  铜陵中发三佳科技股份有限公司  2015-08-13  600520.XSHG             None   
2  2362   420600520  铜陵中发三佳科技股份有限公司  2015-09-22  600520.XSHG             None   
3  2363   420600520  铜陵中发三佳科技股份有限公司  2016-03-24  600520.XSHG             None   
4  2364   420600520  铜陵中发三佳科技股份有限公司  2016-04-30  600520.XSHG             None   

       frozen_person                                      frozen_reason  \
0  铜陵市三佳电子（集团）有限责任公司  本公司控股股东铜陵市三佳电子（集团）有限责任公司持有的本公司27073333股股份因上海隆灵...   
1  铜陵市三佳电子（集团）有限责任公司  本公司控股股东铜陵市三佳电子（集团）有限责任公司起持有本公司的27,073,333股于201...   
2  铜陵市三佳电子（集团）有限责任公司  铜陵市三佳电子（集团）有限责任公司与中信银行股份有限公司安庆分行发生金融借款纠纷，涉案金额为...   
3  铜陵市三佳电子（集团）有限责任公司  本公司股东铜陵市三佳电子（集团）有限责任公司持有的被安庆市宜秀区人民法院及安庆市迎江区人民法...   
4  铜陵市三佳电子（集团）有限责任公司  本公司控股股东铜陵市三佳电子（集团）有限责任公司持有的本公司27073333股股权被司法冻结...   

   frozen_share_nature_id frozen_share_nature  frozen_number  \
0                  308001               境内法人股     27073333.0   
1                  308001               境内法人股            NaN   
2                  308001               境内法人股     27073333.0   
3                  308001               境内法人股            NaN   
4                  308001               境内法人股     27073333.0   

   frozen_total_ratio freeze_applicant        freeze_executor  start_date  \
0              17.090             None             上海市金山区人民法院  2015-07-10   
1              17.090             None                   None        None   
2              17.090   中信银行股份有限公司安庆分行                   None        None   
3              17.089             None  安庆市宜秀区人民法院及安庆市迎江区人民法院        None   
4              17.089             None            上海市浦东新区人民法院  2016-04-27   

     end_date unfrozen_date  unfrozen_number unfrozen_detail  
0        None          None              NaN            None  
1  2015-08-11    2015-08-11       27073333.0            None  
2        None          None              NaN            None  
3  2016-03-16    2016-03-16       27073333.0            None  
4  2019-04-20          None              NaN            None  
```

<a id="STK_HOLDER_NUM"></a>

### STK\_HOLDER\_NUM

**股东户数**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_HOLDER_NUM).filter(finance.STK_HOLDER_NUM.code==code).limit(n))
```

获取上市公司全部股东户数，A股股东、B股股东、H股股东的持股户数

**参数：**

-   **query(finance.STK\_HOLDER\_NUM)**：表示从finance.STK\_HOLDER\_NUM这张表中查询上市公司的股东户数，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_HOLDER\_NUM**：代表上市公司股东户数表，收录了上市公司全部股东户数，A股股东、B股股东、H股股东的持股户数情况，表结构和字段信息如下：

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

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为万科（000002.XSHE)的股东户数情况，返回条数为5条
q=query(finance.STK_HOLDER_NUM).filter(finance.STK_HOLDER_NUM.code=='000002.XSHE',finance.STK_HOLDER_NUM.pub_date>'2015-01-01').limit(5)
df=finance.run_query(q)
print(df)

    id         code    end_date    pub_date  share_holders  a_share_holders  \
0  139  000002.XSHE  2014-12-31  2015-03-31         496922           496907   
1  140  000002.XSHE  2015-03-24  2015-03-31         586390           586373   
2  141  000002.XSHE  2015-03-31  2015-04-27         652130           652113   
3  142  000002.XSHE  2015-06-30  2015-08-17         479264           479246   
4  143  000002.XSHE  2015-09-30  2015-10-28         332360           332339   

  b_share_holders  h_share_holders  
0            None               15  
1            None               17  
2            None               17  
3            None               18  
4            None               21  
```

<a id="STK_SHAREHOLDERS_SHARE_CHANGE"></a>

### STK\_SHAREHOLDERS\_SHARE\_CHANGE

**大股东增减持**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_SHAREHOLDERS_SHARE_CHANGE).filter(finance.STK_SHAREHOLDERS_SHARE_CHANGE.code==code).limit(n))
```

获取上市公司大股东的增减持情况。

**参数：**

-   **query(finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE)**：表示从finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE这张表中查询上市公司大股东的增减持情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE**：代表上市公司大股东增减持情况表，收录了大股东的增减持情况，表结构和字段信息如下：


<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>字段类型</strong></td><td><strong>备注/示例</strong></td></tr><tr><td>company_id</td><td>公司ID</td><td>int</td><td></td></tr><tr><td>company_name</td><td>公司名称</td><td>varchar(100)</td><td></td></tr><tr><td>code</td><td>股票代码</td><td>varchar(12)</td><td></td></tr><tr><td>pub_date</td><td>公告日期</td><td>date</td><td></td></tr><tr><td>end_date</td><td>增（减）持截止日</td><td>date</td><td>变动截止日期</td></tr><tr><td>type</td><td>增（减）持类型</td><td>int</td><td>0--增持;1--减持</td></tr><tr><td>shareholder_id</td><td>股东ID</td><td>int</td><td></td></tr><tr><td>shareholder_name</td><td>股东名称</td><td>varchar(100)</td><td></td></tr><tr><td>change_number</td><td>变动数量</td><td>int</td><td>股</td></tr><tr><td>change_ratio</td><td>变动数量占总股本比例</td><td>decimal(10,4)</td><td><p>录入变动数量后，系统自动计算变动比例，</p><p>持股比例可以用持股数量除以股本情况表中的总股本</p></td></tr><tr><td>price_ceiling</td><td>增（减）持价格上限</td><td>varchar(100)</td><td><p>公告里面一般会给一个增持或者减持的价格区间，上限就是增持价格或减持价格的最高价。</p><p>如果公告中只披露了平均价，那price_ceiling即为成交均价</p></td></tr><tr><td>after_change_ratio</td><td>变动后占比</td><td>decimal(10,4)</td><td>%，变动后持股数量占总股本比例</td></tr></tbody></table>

-   **filter(finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE.code==code)**：指定筛选条件，通过finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_SHAREHOLDERS\_SHARE\_CHANGE.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为万科（000002.XSHE)的大股东增减持情况,返回5条
q=query(finance.STK_SHAREHOLDERS_SHARE_CHANGE).filter(finance.STK_SHAREHOLDERS_SHARE_CHANGE.code=='000002.XSHE',finance.STK_SHAREHOLDERS_SHARE_CHANGE.pub_date>'2015-01-01')
df=finance.run_query(q)
print(df)

      id  company_id company_name         code    pub_date    end_date  type  \
0   1362   430000002   万科企业股份有限公司  000002.XSHE  2015-10-22  2015-10-20     0   
1  25094   430000002   万科企业股份有限公司  000002.XSHE  2015-01-24  2015-01-23     0   
2  25138   430000002   万科企业股份有限公司  000002.XSHE  2015-01-28  2015-01-27     0   
3  29854   430000002   万科企业股份有限公司  000002.XSHE  2015-07-11  2015-07-10     0   
4  29883   430000002   万科企业股份有限公司  000002.XSHE  2015-07-11  2015-01-31     0   

   shareholder_id            shareholder_name  change_number  change_ratio  \
0             NaN                深圳市矩盛华股份有限公司     37357310.0         0.338   
1     100097568.0  国信证券-工商银行-国信金鹏分级1号集合资产管理计划    101187211.0         0.920   
2     100097568.0  国信证券-工商银行-国信金鹏分级1号集合资产管理计划     34054269.0         0.310   
3     100116740.0                前海人寿保险股份有限公司    552727926.0         5.000   
4     100116740.0                前海人寿保险股份有限公司      1360161.0         0.012   

  price_ceiling after_change_ratio  
0          None               None  
1         12.79               None  
2         13.26               None  
3   13.28-15.47               None  
4   13.13-13.60               None  
```

<a id="STK_CAPITAL_CHANGE"></a>

### STK\_CAPITAL\_CHANGE

**上市公司股本变动**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_CAPITAL_CHANGE).filter(finance.STK_CAPITAL_CHANGE.code==code).limit(n))
```

获取上市公司的股本变动情况

**参数：**

-   **query(finance.STK\_CAPITAL\_CHANGE)**：表示从finance.STK\_CAPITAL\_CHANGE这张表中查询股票简称的变更情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_CAPITAL\_CHANGE**：代表上市公司的股本变动表，收录了上市公司发生上市、增发、配股，转增等时间带来的股本变动情况。表结构和字段信息如下：


<table><tbody><tr><td>字段名称</td><td>中文名称</td><td>字段类型</td><td>含义</td></tr><tr><td>company_id</td><td>公司ID</td><td>int</td><td></td></tr><tr><td>company_name</td><td>公司名称</td><td>varchar(100)</td><td></td></tr><tr><td>code</td><td>股票代码</td><td>varchar(12)</td><td></td></tr><tr><td>change_date</td><td>变动日期</td><td>date</td><td></td></tr><tr><td>pub_date</td><td>公告日期</td><td>date</td><td></td></tr><tr><td>change_reason_id</td><td>变动原因编码</td><td>int</td><td></td></tr><tr><td>change_reason</td><td>变动原因</td><td>varchar(120)</td><td></td></tr><tr><td>share_total</td><td>总股本</td><td>decimal(20,4)</td><td>未流通股份+已流通股份，单位：万股</td></tr><tr><td>share_non_trade</td><td>未流通股份</td><td>decimal(20,4)</td><td><p>发起人股份 + 募集法人股份 + 内部职工股 + 优先股 +</p><p>转配股+其他未流通股+配售法人股+已发行未上市股份</p></td></tr><tr><td>share_start</td><td>发起人股份</td><td>decimal(20,4)</td><td><p>国家持股 +国有法人持股+</p><p>境内法人持股 + 境外法人持股 + 自然人持股</p></td></tr><tr><td>share_nation</td><td>国家持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_nation_legal</td><td>国有法人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_instate_legal</td><td>境内法人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_outstate_legal</td><td>境外法人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_natural</td><td>自然人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_raised</td><td>募集法人股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_inside</td><td>内部职工股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_convert</td><td>转配股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_perferred</td><td>优先股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_other_nontrade</td><td>其他未流通股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_limited</td><td>流通受限股份</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_legal_issue</td><td>配售法人股</td><td>decimal(20,4)</td><td>战略投资配售股份+证券投资基金配售股份+一般法人配售股份</td></tr><tr><td>share_strategic_investor</td><td>战略投资者持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_fund</td><td>证券投资基金持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_normal_legal</td><td>一般法人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_other_limited</td><td>其他流通受限股份</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_nation_limited</td><td>国家持股（受限）</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_nation_legal_limited</td><td>国有法人持股（受限）</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>other_instate_limited</td><td>其他内资持股（受限）</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>legal of other_instate_limited</td><td>其他内资持股（受限）中的境内法人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>natural of other_instate_limited</td><td>其他内资持股（受限）中的境内自然人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>outstate_limited</td><td>外资持股（受限）</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>legal of outstate_limited</td><td>外资持股（受限）中的境外法人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>natural of outstate_limited</td><td>外资持股（受限）境外自然人持股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_trade_total</td><td>已流通股份（自由流通股）</td><td>decimal(20,4)</td><td><p>人民币普通股+ 境内上市外资股(B股)+ 境外上市外资股(H股)+</p><p>高管股+ 其他流通股</p></td></tr><tr><td>share_rmb</td><td>人民币普通股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_b</td><td>境内上市外资股（B股）</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_b_limited</td><td>限售B股</td><td>decimal（20,4）</td><td>单位:万股</td></tr><tr><td>share_h</td><td>境外上市外资股（H股）</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_h_limited</td><td>限售H股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_management</td><td>高管股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_management_limited</td><td>限售高管股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>share_other_trade</td><td>其他流通股</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>control_shareholder_limited</td><td>控股股东、实际控制人(受限)</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>core_employee_limited</td><td>核心员工(受限)</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>individual_fund_limited</td><td>个人或基金(受限)</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>other_legal_limited</td><td>其他法人(受限)</td><td>decimal(20,4)</td><td>单位:万股</td></tr><tr><td>other_limited</td><td>其他(受限)</td><td>decimal(20,4)</td><td>单位:万股</td></tr></tbody></table>

-   **filter(finance.STK\_CAPITAL\_CHANGE.code==code)**：指定筛选条件，通过finance.STK\_CAPITAL\_CHANGE.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_CAPITAL\_CHANGE.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为恒瑞医药（600276.XSHG)的股本变动情况，返回条数为5条
q=query(finance.STK_CAPITAL_CHANGE).filter(finance.STK_CAPITAL_CHANGE.code=='600276.XSHG',finance.STK_CAPITAL_CHANGE.pub_date>'2015-01-01').limit(5)
df=finance.run_query(q)
print(df)

     id  company_id  company_name         code change_date    pub_date  \
0   107   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-01-16  2017-01-10   
1  3506   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-05-31  2017-05-22   
2  4130   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-06-29  2017-06-29   
3  4417   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-07-25  2017-07-20   
4  7659   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-06-30  2017-08-30   

   change_reason_id change_reason  share_total  share_non_trade      ...       \
0               NaN        激励股份解禁  234745.9674              0.0      ...        
1          306010.0            送股  281695.1609              0.0      ...        
2          306016.0          股份回购  281688.9833              0.0      ...        
3               NaN        激励股份解禁  281688.9833              0.0      ...        
4          306019.0          定期报告  281688.9833              0.0      ...        

   share_h  share_h_limited  share_management share_management_limited  \
0      0.0             None               0.0                     None   
1      0.0             None               0.0                     None   
2      0.0             None               0.0                     None   
3      0.0             None               0.0                     None   
4      0.0             None               0.0                     None   

  share_other_trade control_shareholder_limited core_employee_limited  \
0               0.0                        None                  None   
1               0.0                        None                  None   
2               0.0                        None                  None   
3               0.0                        None                  None   
4               0.0                        None                  None   

   individual_fund_limited other_legal_limited other_limited  
0                     None                None          None  
1                     None                None          None  
2                     None                None          None  
3                     None                None          None  
4                     None                None          None  

[5 rows x 49 columns]
```

<a id="STK_LIMITED_SHARES_LIST"></a>

### STK\_LIMITED\_SHARES\_LIST

**受限股份上市公告日期**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_LIMITED_SHARES_LIST).filter(finance.STK_LIMITED_SHARES_LIST.code==code).limit(n))
```

获取上市公司受限股份上市公告日期和预计解禁日期。

**参数：**

-   **query(finance.STK\_LIMITED\_SHARES\_LIST)**：表示从finance.STK\_LIMITED\_SHARES\_LIST这张表中查询上市公司受限股份上市公告和预计解禁的日期，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[query简单教程](https://www.joinquant.com/help/api/%20www.joinquant.com=)

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
    | limited\_reason\_id | **限售原因编码** | int | 如下 限售原因编码 |
    | limited\_reason | 限售原因 | varchar(60) | 用户选择：股改限售；发行限售 |
    | trade\_condition | 上市交易条件 | varchar(500) | 股份上市交易的条件限制 |

-   **filter(finance.STK\_LIMITED\_SHARES\_LIST.code==code)**：指定筛选条件，通过finance.STK\_LIMITED\_SHARES\_LIST.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_LIMITED\_SHARES\_LIST.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为华泰证券（601688.XSHG)的受限股份上市公告日期
q=query(finance.STK_LIMITED_SHARES_LIST).filter(finance.STK_LIMITED_SHARES_LIST.code=='601688.XSHG',finance.STK_LIMITED_SHARES_LIST.pub_date>'2018-01-01')
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

<a id="STK_LIMITED_SHARES_UNLIMIT"></a>

### STK\_LIMITED\_SHARES\_UNLIMIT

**受限股份实际解禁日期**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_LIMITED_SHARES_UNLIMIT).filter(finance.STK_LIMITED_SHARES_UNLIMIT.code==code).limit(n))
```

获取公司已上市的受限股份实际解禁的日期。

**参数：**

-   **query(finance.STK\_LIMITED\_SHARES\_UNLIMIT)**：表示从finance.STK\_LIMITED\_SHARES\_UNLIMIT这张表中查询上市公司受限股份实际解禁的日期，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_LIMITED\_SHARES\_UNLIMIT**：代表上市公司受限股份实际解禁表，收录了上市公司受限股份实际解禁的日期信息，表结构和字段信息如下：

    | 字段名称 | 中文名称 | 字段类型 | 含义 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | company\_name | 公司名称 | varchar(100) |  |
    | code | 股票代码 | varchar(12) |  |
    | pub\_date | 公告日期 | date |  |
    | shareholder\_name | 股东名称 | varchar(100) |  |
    | actual\_unlimited\_date | 实际解除限售日期 | date |  |
    | actual\_unlimited\_number | 实际解除限售数量 | int | 股 |
    | actual\_unlimited\_ratio | 实际解除限售比例 | decimal(10,4) | 实际解除限售数量占总股本比例，单位% |
    | limited\_reason\_id | 限售原因编码 | int |  |
    | limited\_reason | 限售原因 | varchar(60) |  |
    | actual\_trade\_number | 实际可流通数量 | int |  |

-   **filter(finance.STK\_LIMITED\_SHARES\_UNLIMIT.code==code)**：指定筛选条件，通过finance.STK\_LIMITED\_SHARES\_UNLIMIT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_LIMITED\_SHARES\_UNLIMIT.pub\_date>='2015-01-01'，表示筛选公布日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#指定查询对象为恒瑞医药（600276.XSHG)的受限股份实际解禁日期，返回条数为5条
q=query(finance.STK_LIMITED_SHARES_UNLIMIT).filter(finance.STK_LIMITED_SHARES_UNLIMIT.code=='600276.XSHG',finance.STK_LIMITED_SHARES_UNLIMIT.pub_date>'2015-01-01').limit(5)
df=finance.run_query(q)
print(df)

      id  company_id  company_name         code    pub_date shareholder_name  \
0  11252   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2015-07-14             蒋素梅等   
1  11889   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2016-01-16             周云曙等   
2  12613   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2016-07-14             蒋素梅等   
3  13335   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-01-10             周云曙等   
4  14162   420600276  江苏恒瑞医药股份有限公司  600276.XSHG  2017-07-20             蒋素梅等   

  actual_unlimited_date  actual_unlimited_number  actual_unlimited_ratio  \
0            2015-07-17                4021160.0                  0.1672   
1            2016-01-21                 531960.0                  0.0068   
2            2016-07-19                3488285.0                  0.1486   
3            2017-01-16                 478764.0                  0.0051   
4            2017-07-25                4024089.0                  0.1167   

   limited_reason_id limited_reason  actual_trade_number  
0             309004           股权激励            3270410.0  
1             309004           股权激励             132990.0  
2             309004           股权激励            3488285.0  
3             309004           股权激励             119691.0  
4             309004           股权激励            3287409.0  
​
```
