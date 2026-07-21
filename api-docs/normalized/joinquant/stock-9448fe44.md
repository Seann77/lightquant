---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 上市公司概况
section_path:
  - 股票数据
  - 上市公司概况
source_file: api-docs/raw/joinquant/Stock/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Stock
source_anchor: "#上市公司概况"
source_sha256: 4f98d75f021aa61af93665d67a18decc90781d913d89bb880d603b6b48186e5b
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="上市公司概况"></a>

## 上市公司概况

<a id="上市公司基本信息"></a>

### 上市公司基本信息

```python
from jqdata import finance
finance.run_query(query(finance.STK_COMPANY_INFO).filter(finance.STK_COMPANY_INFO.code==code).limit(n))
```

获取上市公司最新公布的基本信息，包含注册资本，主营业务，行业分类等。

**参数：**

-   **query(finance.STK\_COMPANY\_INFO)**：表示从finance.STK\_COMPANY\_INFO这张表中查询上市公司最新公布的基本信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_COMPANY\_INFO**：代表上市公司基本信息表，收录了上市公司最新公布的基本信息，表结构和字段信息如下：


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

-   **filter(finance.STK\_COMPANY\_INFO.code==code)**：指定筛选条件，通过finance.STK\_COMPANY\_INFO.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_COMPANY\_INFO.city==’北京市’，表示所属城市为北京市；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
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

<a id="上市公司状态变动"></a>

### 上市公司状态变动

```python
from jqdata import finance
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
    | change\_date | 变更日期 | date |  |
    | public\_status\_id | 上市状态编码 | int | 如下[上市状态编码](https://www.joinquant.com/help/api/help?name=Stock#list_status) |
    | public\_status | 上市状态 | varchar(32) |  |
    | change\_reason | 变更原因 | varchar(500) |  |
    | change\_type\_id | 变更类型编码 | int | 如下[变更类型编码](https://www.joinquant.com/help/api/help?name=Stock#change_reason) |
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

    变更类型编码

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

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为恒瑞医药（600276.XSHG)的上市公司状态变动，限定返回条数为10
q=query(finance.STK_STATUS_CHANGE).filter(finance.STK_STATUS_CHANGE.code=='600276.XSHG').limit(10)
df=finance.run_query(q)
print(df)

     id   company_id         code     name   pub_date    public_status_id  \
0  2840    420600276  600276.XSHG  恒瑞医药  2000-10-18             301001

  public_status   change_date  change_reason  change_type_id   change_type  comments
0       正常上市    2000-10-18            NaN           303009      新股上市      NaN
```

<a id="股票上市信息"></a>

### 股票上市信息

```python
from jqdata import finance
finance.run_query(query(finance.STK_LIST).filter(finance.STK_LIST.code==code).limit(n))
```

获取沪深A股的上市信息，包含上市日期、交易所、发行价格、初始上市数量等

**参数：**

-   **query(finance.STK\_LIST)**：表示从finance.STK\_LIST这张表中查询沪深A股的上市信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_LIST**：代表股票上市信息表，收录了沪深A股的上市信息，包含上市日期、交易所、发行价格、初始上市数量等，表结构和字段信息如下：


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

-   **filter(finance.STK\_LIST.code==code)**：指定筛选条件，通过finance.STK\_LIST.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_LIST.start\_date>=’2015-01-01’，表示筛选上市日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为恒瑞医药（600276.XSHG)的上市信息，限定返回条数为10
q=query(finance.STK_LIST).filter(finance.STK_LIST.code=='600276.XSHG').limit(10)
df=finance.run_query(q)
print(df)

     id         code     name    short_name  category   exchange    start_date   \    
0  1364  600276.XSHG   恒瑞医药         HRYY         A       XSHG      2000-10-18     

  end_date   company_id         company_name   ipo_shares    book_price   par_value \ 
0     NaN     420600276  江苏恒瑞医药股份有限公司  40000000.0         11.98         1.0   

  state_id      state
0   301001    正常上市
```

<a id="股票简称变更情况"></a>

### 股票简称变更情况

```python
from jqdata import finance
finance.run_query(query(finance.STK_NAME_HISTORY).filter(finance.STK_NAME_HISTORY.code==code).limit(n))
```

获取在A股市场和B股市场上市的股票简称的变更情况

**参数：**

-   **query(finance.STK\_NAME\_HISTORY)**：表示从finance.STK\_NAME\_HISTORY这张表中查询股票简称的变更情况，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用英文逗号进行分隔；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_NAME\_HISTORY**：代表股票简称变更表，收录了在A股市场和B股市场上市的股票简称的变更情况，表结构和字段信息如下：


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

-   **filter(finance.STK\_NAME\_HISTORY.code==code)**：指定筛选条件，通过finance.STK\_NAME\_HISTORY.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_NAME\_HISTORY.pub\_date>=’2015-01-01’，表示筛选公告日期大于等于2015年1月1日之后的数据；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回4000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为恒瑞医药（600276.XSHG)的股票简称变更信息，限定返回条数为10
q=query(finance.STK_NAME_HISTORY).filter(finance.STK_NAME_HISTORY.code=='600276.XSHG').limit(10)
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

<a id="上市公司员工情况"></a>

### 上市公司员工情况

```sql
from jqdata import finance
finance.run_query(query(finance.STK_EMPLOYEE_INFO).filter(finance.STK_EMPLOYEE_INFO.code==code).limit(n))
```

获取上市公司在公告中公布的员工情况，包括员工人数、学历等信息;
更新时间：上市公司定期报告员工情况的维护时效为定期报告披露后一个月内

**参数：**

-   **query(finance.STK\_EMPLOYEE\_INFO)**：表示从finance.STK\_EMPLOYEE\_INFO这张表中查询上市公司员工情况的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

    **finance.STK\_EMPLOYEE\_INFO**：代表上市公司员工情况表，收录了上市公司在公告中公布的员工情况，表结构和字段信息如下：


| 字段名称 | 中文名称 | 字段类型 | 备注/示例 |
| --- | --- | --- | --- |
| company\_id | 公司ID | int |  |
| code | 证券代码 | varchar(12) | ‘600276.XSHG’，’000001.XSHE’ |
| name | 证券名称 | varchar(64) |  |
| end\_date | 报告期截止日 | date | 统计截止该报告期的员工信息 |
| pub\_date | 公告日期 | date |  |
| employee | 在职员工总数 | int | 人 |
| retirement | 离退休人员 | int | 人 |
| graduate\_rate | 研究生以上人员比例 | decimal(10,4) | % |
| college\_rate | 大学专科以上人员比例 | decimal(10,4) | % |
| middle\_rate | 中专及以下人员比例 | decimal(10,4) | % |

-   **filter(finance.STK\_EMPLOYEE\_INFO.code==code)**：指定筛选条件，通过finance.STK\_EMPLOYEE\_INFO.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_EMPLOYEE\_INFO.pub\_date>=’2015-01-01’，表示公告日期大于2015年1月1日上市公司公布的员工信息；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe， 每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回3000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
# 指定查询对象为恒瑞医药（600276.XSHG)的员工信息且公告日期大于2015年1月1日，限定返回条数为10
q=query(finance.STK_EMPLOYEE_INFO).filter(finance.STK_EMPLOYEE_INFO.code=='600276.XSHG',finance.STK_EMPLOYEE_INFO.pub_date>='2015-01-01').limit(10)
df=finance.run_query(q)
print(df)

        id company_id         code  name    end_date    pub_date      employee  \
  0  21542  420600276  600276.XSHG  恒瑞医药  2014-12-31  2015-03-31     8770
  1  21543  420600276  600276.XSHG  恒瑞医药  2015-12-31  2016-04-13    10191
  2  21544  420600276  600276.XSHG  恒瑞医药  2016-12-31  2017-03-11    12653

    retirement graduate_rate college_rate middle_rate
  0        NaN           NaN          NaN         NaN
  1        NaN           NaN          NaN         NaN
  2        NaN           NaN          NaN         NaN
```
