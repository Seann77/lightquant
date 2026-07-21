---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 合并现金流量表
section_path:
  - JQData使用说明
  - 合并现金流量表
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: null
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - complex_table_preserved_as_html
canonical: true
alias_of: null
---

<a id="利润表"></a>

### 利润表

**合并利润表、母公司利润表**

### 合并利润表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.STK_INCOME_STATEMENT).filter(finance.STK_INCOME_STATEMENT.code==code).limit(n))
```

获取上市公司定期公告中公布的合并利润表数据（2007版）

**参数：**

-   **query(finance.STK\_INCOME\_STATEMENT)**：表示从finance.STK\_INCOME\_STATEMENT这张表中查询上市公司定期公告中公布的合并利润表信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_INCOME\_STATEMENT**：代表上市公司合并利润表，收录了上市公司定期公告中公布的合并利润表数据，表结构和字段信息如下：

-   **filter(finance.STK\_INCOME\_STATEMENT.code==code)**：指定筛选条件，通过finance.STK\_INCOME\_STATEMENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_INCOME\_STATEMENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日上市公司公布的合并利润表信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询贵州茅台2015年之后公告的合并利润表数据，取出合并利润表中本期的营业总收入，归属于母公司的净利润
from jqdatasdk import finance
q=query(finance.STK_INCOME_STATEMENT.company_name,
        finance.STK_INCOME_STATEMENT.code,
        finance.STK_INCOME_STATEMENT.pub_date,
        finance.STK_INCOME_STATEMENT.start_date,
        finance.STK_INCOME_STATEMENT.end_date,
        finance.STK_INCOME_STATEMENT.total_operating_revenue,
finance.STK_INCOME_STATEMENT.np_parent_company_owners).filter(finance.STK_INCOME_STATEMENT.code=='600519.XSHG',finance.STK_INCOME_STATEMENT.pub_date>='2015-01-01',finance.STK_INCOME_STATEMENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

  company_name         code    pub_date  start_date    end_date  \
0  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2014-01-01  2014-12-31   
1  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2015-01-01  2015-03-31   
2  贵州茅台酒股份有限公司  600519.XSHG  2015-08-28  2015-01-01  2015-06-30   
3  贵州茅台酒股份有限公司  600519.XSHG  2015-10-23  2015-01-01  2015-09-30   
4  贵州茅台酒股份有限公司  600519.XSHG  2016-03-24  2015-01-01  2015-12-31   
5  贵州茅台酒股份有限公司  600519.XSHG  2016-04-21  2016-01-01  2016-03-31   
6  贵州茅台酒股份有限公司  600519.XSHG  2016-08-27  2016-01-01  2016-06-30   
7  贵州茅台酒股份有限公司  600519.XSHG  2016-10-29  2016-01-01  2016-09-30   

   total_operating_revenue  np_parent_company_owners  
0             3.221721e+10              1.534980e+10  
1             8.760368e+09              4.364902e+09  
2             1.618565e+10              7.888232e+09  
3             2.373432e+10              1.142464e+10  
4             3.344686e+10              1.550309e+10  
5             1.025087e+10              4.889272e+09  
6             1.873762e+10              8.802637e+09  
7             2.753274e+10              1.246558e+10
```

<a id="-1"></a>

### 母公司利润表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.STK_INCOME_STATEMENT_PARENT).filter(finance.STK_INCOME_STATEMENT_PARENT.code==code).limit(n))
```

获取上市公司母公司利润的信息（2007版）

**参数：**

-   **query(finance.STK\_INCOME\_STATEMENT\_PARENT)**：表示从finance.STK\_INCOME\_STATEMENT\_PARENT这张表中查询上市公司母公司利润表的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_INCOME\_STATEMENT\_PARENT**：代表上市公司母公司利润表，收录了上市公司母公司的利润信息，表结构和字段信息如下：

-   **filter(finance.STK\_INCOME\_STATEMENT\_PARENT.code==code)**：指定筛选条件，通过finance.STK\_INCOME\_STATEMENT\_PARENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_INCOME\_STATEMENT\_PARENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日上市公司公布的母公司利润表信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询贵州茅台2015年之后公告的母公司利润表数据，取出母公司利润表中本期的营业总收入，归属于母公司所有者的净利润
from jqdatasdk import finance
q=query(finance.STK_INCOME_STATEMENT_PARENT.company_name,
        finance.STK_INCOME_STATEMENT_PARENT.code,
        finance.STK_INCOME_STATEMENT_PARENT.pub_date,
        finance.STK_INCOME_STATEMENT_PARENT.start_date,
        finance.STK_INCOME_STATEMENT_PARENT.end_date,
        finance.STK_INCOME_STATEMENT_PARENT.total_operating_revenue,
finance.STK_INCOME_STATEMENT_PARENT.np_parent_company_owners).filter(finance.STK_INCOME_STATEMENT_PARENT.code=='600519.XSHG',finance.STK_INCOME_STATEMENT_PARENT.pub_date>='2015-01-01',finance.STK_INCOME_STATEMENT_PARENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

  company_name         code    pub_date  start_date    end_date  \
0  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2014-01-01  2014-12-31   
1  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2015-01-01  2015-03-31   
2  贵州茅台酒股份有限公司  600519.XSHG  2015-08-28  2015-01-01  2015-06-30   
3  贵州茅台酒股份有限公司  600519.XSHG  2015-10-23  2015-01-01  2015-09-30   
4  贵州茅台酒股份有限公司  600519.XSHG  2016-03-24  2015-01-01  2015-12-31   
5  贵州茅台酒股份有限公司  600519.XSHG  2016-04-21  2016-01-01  2016-03-31   
6  贵州茅台酒股份有限公司  600519.XSHG  2016-08-27  2016-01-01  2016-06-30   
7  贵州茅台酒股份有限公司  600519.XSHG  2016-10-29  2016-01-01  2016-09-30   

   total_operating_revenue  np_parent_company_owners  
0             6.878165e+09              1.028603e+10  
1             1.886084e+09             -5.773331e+07  
2             3.571872e+09             -1.556184e+08  
3             5.411957e+09              9.476542e+09  
4             8.843334e+09              9.611173e+09  
5             1.507658e+09              8.850591e+09  
6             3.608903e+09              8.733012e+09  
7             5.430884e+09              8.002128e+09  
```

**字段信息展示**

<table><tbody><tr><td>字段名称</td><td>中文名称</td><td>字段类型</td><td>含义</td></tr><tr><td>company_id</td><td>公司ID</td><td>int</td><td></td></tr><tr><td>company_name</td><td>公司名称</td><td>varchar(100)</td><td></td></tr><tr><td>code</td><td>股票代码</td><td>varchar(12)</td><td></td></tr><tr><td>a_code</td><td>A股代码</td><td>varchar(12)</td><td></td></tr><tr><td>b_code</td><td>B股代码</td><td>varchar(12)</td><td></td></tr><tr><td>h_code</td><td>H股代码</td><td>varchar(12)</td><td></td></tr><tr><td>pub_date</td><td>公告日期</td><td>date</td><td></td></tr><tr><td>start_date</td><td>开始日期</td><td>date</td><td></td></tr><tr><td>end_date</td><td>截止日期</td><td>date</td><td></td></tr><tr><td>report_date</td><td>报告期</td><td>date</td><td></td></tr><tr><td>report_type</td><td>报告期类型</td><td>int</td><td>0：本期，1：上期</td></tr><tr><td>source_id</td><td>报表来源编码</td><td>int</td><td>如下&nbsp;报表来源编码</td></tr><tr><td>source</td><td>报表来源</td><td>varchar(60)</td><td>选择时程序自动填入</td></tr><tr><td>total_operating_revenue</td><td>营业总收入</td><td>decimal(20,4)</td><td></td></tr><tr><td>operating_revenue</td><td>营业收入</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_operating_cost</td><td>营业总成本</td><td>decimal(20,4)</td><td></td></tr><tr><td>operating_cost</td><td>营业成本</td><td>decimal(20,4)</td><td></td></tr><tr><td>operating_tax_surcharges</td><td>营业税金及附加</td><td>decimal(20,4)</td><td></td></tr><tr><td>sale_expense</td><td>销售费用</td><td>decimal(20,4)</td><td></td></tr><tr><td>administration_expense</td><td>管理费用</td><td>decimal(20,4)</td><td></td></tr><tr><td>exploration_expense</td><td>堪探费用</td><td>decimal(20,4)</td><td>勘探费用用于核算企业（石油天然气开采）核算的油气勘探过程中发生的地质调查、物理化学勘探各项支出和非成功探井等支出。</td></tr><tr><td>financial_expense</td><td>财务费用</td><td>decimal(20,4)</td><td></td></tr><tr><td>asset_impairment_loss</td><td>资产减值损失</td><td>decimal(20,4)</td><td></td></tr><tr><td>fair_value_variable_income</td><td>公允价值变动净收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>investment_income</td><td>投资收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>invest_income_associates</td><td>对联营企业和合营企业的投资收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>exchange_income</td><td>汇兑收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_items_influenced_income</td><td>影响营业利润的其他科目</td><td>decimal(20,4)</td><td></td></tr><tr><td>operating_profit</td><td>营业利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>subsidy_income</td><td>补贴收入</td><td>decimal(20,4)</td><td></td></tr><tr><td>non_operating_revenue</td><td>营业外收入</td><td>decimal(20,4)</td><td></td></tr><tr><td>non_operating_expense</td><td>营业外支出</td><td>decimal(20,4)</td><td></td></tr><tr><td>disposal_loss_non_current_liability</td><td>非流动资产处置净损失</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_items_influenced_profit</td><td>影响利润总额的其他科目</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_profit</td><td>利润总额</td><td>decimal(20,4)</td><td></td></tr><tr><td>income_tax</td><td>所得税</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_items_influenced_net_profit</td><td>影响净利润的其他科目</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_profit</td><td>净利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>np_parent_company_owners</td><td>归属于母公司所有者的净利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>minority_profit</td><td>少数股东损益</td><td>decimal(20,4)</td><td></td></tr><tr><td>eps</td><td>每股收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>basic_eps</td><td>基本每股收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>diluted_eps</td><td>稀释每股收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_composite_income</td><td>其他综合收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_composite_income</td><td>综合收益总额</td><td>decimal(20,4)</td><td></td></tr><tr><td>ci_parent_company_owners</td><td>归属于母公司所有者的综合收益总额</td><td>decimal(20,4)</td><td></td></tr><tr><td>ci_minority_owners</td><td>归属于少数股东的综合收益总额</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_income</td><td>利息收入</td><td>decimal(20,4)</td><td></td></tr><tr><td>premiums_earned</td><td>已赚保费</td><td>decimal(20,4)</td><td></td></tr><tr><td>commission_income</td><td>手续费及佣金收入</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_expense</td><td>利息支出</td><td>decimal(20,4)</td><td></td></tr><tr><td>commission_expense</td><td>手续费及佣金支出</td><td>decimal(20,4)</td><td></td></tr><tr><td>refunded_premiums</td><td>退保金</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_pay_insurance_claims</td><td>赔付支出净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>withdraw_insurance_contract_reserve</td><td>提取保险合同准备金净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>policy_dividend_payout</td><td>保单红利支出</td><td>decimal(20,4)</td><td></td></tr><tr><td>reinsurance_cost</td><td>分保费用</td><td>decimal(20,4)</td><td></td></tr><tr><td>non_current_asset_disposed</td><td>非流动资产处置利得</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_earnings</td><td>其他收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>asset_deal_income</td><td>资产处置收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>sust_operate_net_profit</td><td>持续经营净利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>discon_operate_net_profit</td><td>终止经营净利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>credit_impairment_loss</td><td>信用减值损失</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_open_hedge_income</td><td>净敞口套期收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_cost_fin</td><td>财务费用-利息费用</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_income_fin</td><td>财务费用-利息收入</td><td>decimal(20,4)</td><td></td></tr><tr><td>rd_expenses</td><td>研发费用</td><td>decimal(20,4)</td><td></td></tr></tbody></table>

**报表来源编码**

| 编码 | 名称 |
| --- | --- |
| 321001 | 招募说明书 |
| 321002 | 上市公告书 |
| 321003 | 定期报告 |
| 321004 | 预披露公告 |
| 321005 | 换股报告书 |
| 321099 | 其他 |

<a id="现金流量表"></a>

### 现金流量表

**合并现金流量表、母公司现金流量表**

## 合并现金流量表

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_CASHFLOW_STATEMENT).filter(finance.STK_CASHFLOW_STATEMENT.code==code).limit(n))
```

获取上市公司定期公告中公布的合并现金流量表数据（2007版）

**参数：**

-   **query(finance.STK\_CASHFLOW\_STATEMENT)**：表示从finance.STK\_CASHFLOW\_STATEMENT这张表中查询上市公司定期公告中公布的合并现金流量表信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_CASHFLOW\_STATEMENT**：代表上市公司合并现金流量表，收录了上市公司定期公告中公布的合并现金流量表数据，表结构和字段信息如下：

-   **filter(finance.STK\_CASHFLOW\_STATEMENT.code==code)**：指定筛选条件，通过finance.STK\_CASHFLOW\_STATEMENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_CASHFLOW\_STATEMENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日上市公司合并现金流量表数据；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询贵州茅台2015年之后公告的合并现金流量表数据，取出本期的经营活动现金流量净额，投资活动现金流量净额，以及筹资活动现金流量净额
from jqdatasdk import *
q=query(finance.STK_CASHFLOW_STATEMENT.company_name,
        finance.STK_CASHFLOW_STATEMENT.code,
        finance.STK_CASHFLOW_STATEMENT.pub_date,
        finance.STK_CASHFLOW_STATEMENT.start_date,
        finance.STK_CASHFLOW_STATEMENT.end_date,
        finance.STK_CASHFLOW_STATEMENT.net_operate_cash_flow,
        finance.STK_CASHFLOW_STATEMENT.net_invest_cash_flow,
finance.STK_CASHFLOW_STATEMENT.net_finance_cash_flow).filter(finance.STK_CASHFLOW_STATEMENT.code=='600519.XSHG',finance.STK_CASHFLOW_STATEMENT.pub_date>='2015-01-01',finance.STK_CASHFLOW_STATEMENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

  company_name         code    pub_date  start_date    end_date  \
0  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2014-01-01  2014-12-31   
1  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2015-01-01  2015-03-31   
2  贵州茅台酒股份有限公司  600519.XSHG  2015-08-28  2015-01-01  2015-06-30   
3  贵州茅台酒股份有限公司  600519.XSHG  2015-10-23  2015-01-01  2015-09-30   
4  贵州茅台酒股份有限公司  600519.XSHG  2016-03-24  2015-01-01  2015-12-31   
5  贵州茅台酒股份有限公司  600519.XSHG  2016-04-21  2016-01-01  2016-03-31   
6  贵州茅台酒股份有限公司  600519.XSHG  2016-08-27  2016-01-01  2016-06-30   
7  贵州茅台酒股份有限公司  600519.XSHG  2016-10-29  2016-01-01  2016-09-30   

   net_operate_cash_flow  net_invest_cash_flow  net_finance_cash_flow  
0           1.263252e+10         -4.580160e+09          -5.041427e+09  
1           2.111634e+09         -8.540453e+08          -3.464185e+07  
2           4.901688e+09         -1.290715e+09          -3.494246e+07  
3           1.142339e+10         -1.782995e+09          -5.587555e+09  
4           1.743634e+10         -2.048790e+09          -5.588020e+09  
5           7.436044e+09         -4.213453e+08          -5.085073e+08  
6           1.360396e+10         -5.555078e+08          -3.283074e+09  
7           3.253533e+10         -7.734874e+08          -8.284064e+09  
```

<a id="-1"></a>

### 母公司现金流量表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.STK_CASHFLOW_STATEMENT_PARENT).filter(finance.STK_CASHFLOW_STATEMENT_PARENT.code==code).limit(n))
```

获取上市公司定期公告中公布的母公司现金流量表（2007版）

**参数：**

-   **query(finance.STK\_CASHFLOW\_STATEMENT\_PARENT)**：表示从finance.STK\_CASHFLOW\_STATEMENT\_PARENT这张表中查询上市公司定期公告中公布的母公司现金流量表信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_CASHFLOW\_STATEMENT\_PARENT**：代表上市公司母公司现金流量表，收录了上市公司定期公告中公布的母公司现金流量表数据，表结构和字段信息如下：

-   **filter(finance.STK\_CASHFLOW\_STATEMENT\_PARENT.code==code)**：指定筛选条件，通过finance.STK\_CASHFLOW\_STATEMENT\_PARENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_CASHFLOW\_STATEMENT\_PARENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日上市公司公布的母公司现金流量表信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询贵州茅台2015年之后公告的母公司现金流量表数据，取出本期的经营活动现金流量净额，投资活动现金流量净额，以及筹资活动现金流量净额
from jqdatasdk import *
q=query(finance.STK_CASHFLOW_STATEMENT_PARENT.company_name,
        finance.STK_CASHFLOW_STATEMENT_PARENT.code,
        finance.STK_CASHFLOW_STATEMENT_PARENT.pub_date,
        finance.STK_CASHFLOW_STATEMENT_PARENT.start_date,
        finance.STK_CASHFLOW_STATEMENT_PARENT.end_date,
        finance.STK_CASHFLOW_STATEMENT_PARENT.net_operate_cash_flow,
        finance.STK_CASHFLOW_STATEMENT_PARENT.net_invest_cash_flow,
finance.STK_CASHFLOW_STATEMENT_PARENT.net_finance_cash_flow).filter(finance.STK_CASHFLOW_STATEMENT_PARENT.code=='600519.XSHG',finance.STK_CASHFLOW_STATEMENT_PARENT.pub_date>='2015-01-01',finance.STK_CASHFLOW_STATEMENT_PARENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

  company_name         code    pub_date  start_date    end_date  \
0  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2014-01-01  2014-12-31   
1  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2015-01-01  2015-03-31   
2  贵州茅台酒股份有限公司  600519.XSHG  2015-08-28  2015-01-01  2015-06-30   
3  贵州茅台酒股份有限公司  600519.XSHG  2015-10-23  2015-01-01  2015-09-30   
4  贵州茅台酒股份有限公司  600519.XSHG  2016-03-24  2015-01-01  2015-12-31   
5  贵州茅台酒股份有限公司  600519.XSHG  2016-04-21  2016-01-01  2016-03-31   
6  贵州茅台酒股份有限公司  600519.XSHG  2016-08-27  2016-01-01  2016-06-30   
7  贵州茅台酒股份有限公司  600519.XSHG  2016-10-29  2016-01-01  2016-09-30   

   net_operate_cash_flow  net_invest_cash_flow  net_finance_cash_flow  
0          -2.713989e+09          6.192758e+09          -4.562999e+09  
1           2.082144e+09         -1.135273e+09           2.200000e+07  
2           3.259594e+09         -1.568552e+09           2.200000e+07  
3           2.284079e+09          8.054632e+08          -5.040068e+09  
4           1.975006e+09          7.412721e+09          -5.018068e+09  
5           6.073286e+08          8.692869e+07                    NaN  
6          -7.648020e+08          7.468597e+09          -2.774566e+09  
7          -7.797669e+08          8.882256e+09          -7.751997e+09  
```

**字段信息展示：**

<table><tbody><tr><td>字段名称</td><td>中文名称</td><td>字段类型</td><td>含义</td></tr><tr><td>company_id</td><td>公司ID</td><td>int</td><td></td></tr><tr><td>company_name</td><td>公司名称</td><td>varchar(100)</td><td></td></tr><tr><td>code</td><td>股票主证券代码</td><td>varchar(12)</td><td></td></tr><tr><td>a_code</td><td>A股代码</td><td>varchar(12)</td><td></td></tr><tr><td>b_code</td><td>B股代码</td><td>varchar(12)</td><td></td></tr><tr><td>h_code</td><td>H股代码</td><td>varchar(12)</td><td></td></tr><tr><td>pub_date</td><td>公告日期</td><td>date</td><td></td></tr><tr><td>start_date</td><td>开始日期</td><td>date</td><td></td></tr><tr><td>end_date</td><td>截止日期</td><td>date</td><td></td></tr><tr><td>report_date</td><td>报告期</td><td>date</td><td></td></tr><tr><td>report_type</td><td>报告期类型</td><td>int</td><td>0本期，1上期</td></tr><tr><td>source_id</td><td>报表来源编码</td><td>int</td><td>如下报表来源编码</td></tr><tr><td>source</td><td>报表来源</td><td>varchar(60)</td><td></td></tr><tr><td><p>goods_sale_and_service</p><p>_render_cash</p></td><td>销售商品、提供劳务收到的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>tax_levy_refund</td><td>收到的税费返还</td><td>decimal(20,4)</td><td></td></tr><tr><td>subtotal_operate_cash_inflow</td><td>经营活动现金流入小计</td><td>decimal(20,4)</td><td></td></tr><tr><td>goods_and_services_cash_paid</td><td>购买商品、接受劳务支付的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>staff_behalf_paid</td><td>支付给职工以及为职工支付的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>tax_payments</td><td>支付的各项税费</td><td>decimal(20,4)</td><td></td></tr><tr><td>subtotal_operate_cash_outflow</td><td>经营活动现金流出小计</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_operate_cash_flow</td><td>经营活动现金流量净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>invest_withdrawal_cash</td><td>收回投资收到的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>invest_proceeds</td><td>取得投资收益收到的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>fix_intan_other_asset_dispo_cash</td><td>处置固定资产、无形资产和其他长期资产收回的现金净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_cash_deal_subcompany</td><td>处置子公司及其他营业单位收到的现金净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>subtotal_invest_cash_inflow</td><td>投资活动现金流入小计</td><td>decimal(20,4)</td><td></td></tr><tr><td>fix_intan_other_asset_acqui_cash</td><td>购建固定资产、无形资产和其他长期资产支付的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>invest_cash_paid</td><td>投资支付的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>impawned_loan_net_increase</td><td>质押贷款净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_cash_from_sub_company</td><td>取得子公司及其他营业单位支付的现金净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>subtotal_invest_cash_outflow</td><td>投资活动现金流出小计</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_invest_cash_flow</td><td>投资活动现金流量净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_from_invest</td><td>吸收投资收到的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_from_borrowing</td><td>取得借款收到的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_from_bonds_issue</td><td>发行债券收到的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>subtotal_finance_cash_inflow</td><td>筹资活动现金流入小计</td><td>decimal(20,4)</td><td></td></tr><tr><td>borrowing_repayment</td><td>偿还债务支付的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>dividend_interest_payment</td><td>分配股利、利润或偿付利息支付的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>subtotal_finance_cash_outflow</td><td>筹资活动现金流出小计</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_finance_cash_flow</td><td>筹资活动现金流量净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>exchange_rate_change_effect</td><td>汇率变动对现金的影响</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_reason_effect_cash</td><td>其他原因对现金的影响</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_equivalent_increase</td><td>现金及现金等价物净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_equivalents_at_beginning</td><td>期初现金及现金等价物余额</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_and_equivalents_at_end</td><td>期末现金及现金等价物余额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_profit</td><td>净利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>assets_depreciation_reserves</td><td>资产减值准备</td><td>decimal(20,4)</td><td></td></tr><tr><td>fixed_assets_depreciation</td><td>固定资产折旧、油气资产折耗、生产性生物资产折旧</td><td>decimal(20,4)</td><td></td></tr><tr><td>intangible_assets_amortization</td><td>无形资产摊销</td><td>decimal(20,4)</td><td></td></tr><tr><td>defferred_expense_amortization</td><td>长期待摊费用摊销</td><td>decimal(20,4)</td><td></td></tr><tr><td>fix_intan_other_asset_dispo_loss</td><td>处置固定资产、无形资产和其他长期资产的损失</td><td>decimal(20,4)</td><td></td></tr><tr><td>fixed_asset_scrap_loss</td><td>固定资产报废损失</td><td>decimal(20,4)</td><td></td></tr><tr><td>fair_value_change_loss</td><td>公允价值变动损失</td><td>decimal(20,4)</td><td></td></tr><tr><td>financial_cost</td><td>财务费用</td><td>decimal(20,4)</td><td></td></tr><tr><td>invest_loss</td><td>投资损失</td><td>decimal(20,4)</td><td></td></tr><tr><td>deffered_tax_asset_decrease</td><td>递延所得税资产减少</td><td>decimal(20,4)</td><td></td></tr><tr><td>deffered_tax_liability_increase</td><td>递延所得税负债增加</td><td>decimal(20,4)</td><td></td></tr><tr><td>inventory_decrease</td><td>存货的减少</td><td>decimal(20,4)</td><td></td></tr><tr><td>operate_receivables_decrease</td><td>经营性应收项目的减少</td><td>decimal(20,4)</td><td></td></tr><tr><td>operate_payable_increase</td><td>经营性应付项目的增加</td><td>decimal(20,4)</td><td></td></tr><tr><td>others</td><td>其他</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_operate_cash_flow_indirect</td><td>经营活动现金流量净额_间接法</td><td>decimal(20,4)</td><td></td></tr><tr><td>debt_to_capital</td><td>债务转为资本</td><td>decimal(20,4)</td><td></td></tr><tr><td>cbs_expiring_in_one_year</td><td>一年内到期的可转换公司债券</td><td>decimal(20,4)</td><td></td></tr><tr><td>financial_lease_fixed_assets</td><td>融资租入固定资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_at_end</td><td>现金的期末余额</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_at_beginning</td><td>现金的期初余额</td><td>decimal(20,4)</td><td></td></tr><tr><td>equivalents_at_end</td><td>现金等价物的期末余额</td><td>decimal(20,4)</td><td></td></tr><tr><td>equivalents_at_beginning</td><td>现金等价物的期初余额</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_reason_effect_cash_indirect</td><td>其他原因对现金的影响_间接法</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_equivalent_increase_indirect</td><td>现金及现金等价物净增加额_间接法</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_deposit_increase</td><td>客户存款和同业存放款项净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_borrowing_from_central_bank</td><td>向中央银行借款净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_borrowing_from_finance_co</td><td>向其他金融机构拆入资金净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_original_insurance_cash</td><td>收到原保险合同保费取得的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_cash_received_from_ reinsurance_business</td><td>收到再保险业务现金净额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_insurer_deposit_investment</td><td>保户储金及投资款净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_deal_trading_assets</td><td>处置以公允价值计量且其变动计入当期损益的金融资产净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_and_commission_cashin</td><td>收取利息、手续费及佣金的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_increase_in_placements</td><td>拆入资金净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_buyback</td><td>回购业务资金净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_loan_and_advance_increase</td><td>客户贷款及垫款净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>net_deposit_in_cb_and_ib</td><td>存放中央银行和同业款项净增加额</td><td>decimal(20,4)</td><td></td></tr><tr><td>original_compensation_paid</td><td>支付原保险合同赔付款项的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>handling_charges_and_commission</td><td>支付利息、手续费及佣金的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>policy_dividend_cash_paid</td><td>支付保单红利的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_from_mino_s_invest_sub</td><td>子公司吸收少数股东投资收到的现金</td><td>decimal(20,4)</td><td></td></tr><tr><td>proceeds_from_sub_to_mino_s</td><td>子公司支付给少数股东的股利、利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>investment_property_depreciation</td><td>投资性房地产的折旧及摊销</td><td>decimal(20,4)</td><td></td></tr><tr><td>credit_impairment_loss</td><td>信用减值损失(现金流量表补充科目)</td><td>decimal(20,4)</td><td></td></tr></tbody></table>

**报表来源编码**

| 编码 | 名称 |
| --- | --- |
| 321001 | 招募说明书 |
| 321002 | 上市公告书 |
| 321003 | 定期报告 |
| 321004 | 预披露公告 |
| 321005 | 换股报告书 |
| 321099 | 其他 |

<a id="资产负债表"></a>

### 资产负债表

**合并资产负债表、母公司现金资产负债表**

### 合并资产负债表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.STK_BALANCE_SHEET).filter(finance.STK_BALANCE_SHEET.code==code).limit(n))
```

获取上市公司定期公告中公布的合并资产负债表（2007版）

**参数：**

-   **query(finance.STK\_BALANCE\_SHEET)**：表示从finance.STK\_BALANCE\_SHEET这张表中查询上市公司定期公告中公布的合并资产负债表信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_BALANCE\_SHEET**：代表上市公司合并资产负债表信息，收录了上市公司定期公告中公布的合并资产负债表数据，表结构和字段信息如下：

-   **filter(finance.STK\_BALANCE\_SHEET.code==code)**：指定筛选条件，通过finance.STK\_BALANCE\_SHEET.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_BALANCE\_SHEET.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日上市公司公布的合并资产负债表信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询贵州茅台2015年之后公告的合并资产负债表数据，取出本期的货币资金，总资产和总负债
from jqdatasdk import *
q=query(finance.STK_BALANCE_SHEET.company_name,
        finance.STK_BALANCE_SHEET.code,
        finance.STK_BALANCE_SHEET.pub_date,
        finance.STK_BALANCE_SHEET.start_date,
        finance.STK_BALANCE_SHEET.end_date,
        finance.STK_BALANCE_SHEET.cash_equivalents,
        finance.STK_BALANCE_SHEET.total_assets,
        finance.STK_BALANCE_SHEET.total_liability
).filter(finance.STK_BALANCE_SHEET.code=='600519.XSHG',finance.STK_BALANCE_SHEET.pub_date>='2015-01-01',finance.STK_BALANCE_SHEET.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

  company_name         code    pub_date  start_date    end_date  \
0  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2014-01-01  2014-12-31   
1  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2015-01-01  2015-03-31   
2  贵州茅台酒股份有限公司  600519.XSHG  2015-08-28  2015-01-01  2015-06-30   
3  贵州茅台酒股份有限公司  600519.XSHG  2015-10-23  2015-01-01  2015-09-30   
4  贵州茅台酒股份有限公司  600519.XSHG  2016-03-24  2015-01-01  2015-12-31   
5  贵州茅台酒股份有限公司  600519.XSHG  2016-04-21  2016-01-01  2016-03-31   
6  贵州茅台酒股份有限公司  600519.XSHG  2016-08-27  2016-01-01  2016-06-30   
7  贵州茅台酒股份有限公司  600519.XSHG  2016-10-29  2016-01-01  2016-09-30   

   cash_equivalents  total_assets  total_liability  
0      2.771072e+10  6.587317e+10     1.056161e+10  
1      2.842068e+10  6.876902e+10     8.838873e+09  
2      3.023650e+10  7.233774e+10     8.675962e+09  
3      3.053612e+10  7.755903e+10     1.564019e+10  
4      3.680075e+10  8.630146e+10     2.006729e+10  
5      4.377574e+10  9.069045e+10     1.974919e+10  
6      4.752806e+10  9.554650e+10     2.819334e+10  
7      6.199974e+10  1.051460e+11     3.386253e+10  
```

<a id="-1"></a>

### 母公司资产负债表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.STK_BALANCE_SHEET_PARENT).filter(finance.STK_BALANCE_SHEET_PARENT.code==code).limit(n))
```

获取上市公司定期公告中公布的母公司资产负债表（2007版）

**参数：**

-   **query(finance.STK\_BALANCE\_SHEET\_PARENT)**：表示从finance.STK\_BALANCE\_SHEET\_PARENT这张表中查询上市公司定期公告中公布的母公司资产负债表信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_BALANCE\_SHEET\_PARENT**：代表上市公司母公司资产负债表信息，收录了上市公司定期公告中公布的母公司资产负债表数据，表结构和字段信息如下：

-   **filter(finance.STK\_BALANCE\_SHEET\_PARENT.code==code)**：指定筛选条件，通过finance.STK\_BALANCE\_SHEET\_PARENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_BALANCE\_SHEET\_PARENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日上市公司公布的母公司资产负债表信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询贵州茅台2015年之后公告的母公司资产负债表数据，取出本期的货币资金，总资产和总负债
from jqdatasdk import *
q=query(finance.STK_BALANCE_SHEET_PARENT.company_name,
        finance.STK_BALANCE_SHEET_PARENT.code,
        finance.STK_BALANCE_SHEET_PARENT.pub_date,
        finance.STK_BALANCE_SHEET_PARENT.start_date,
        finance.STK_BALANCE_SHEET_PARENT.end_date,
        finance.STK_BALANCE_SHEET_PARENT.cash_equivalents,
        finance.STK_BALANCE_SHEET_PARENT.total_assets,
        finance.STK_BALANCE_SHEET_PARENT.total_liability
).filter(finance.STK_BALANCE_SHEET_PARENT.code=='600519.XSHG',finance.STK_BALANCE_SHEET_PARENT.pub_date>='2015-01-01',finance.STK_BALANCE_SHEET_PARENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

  company_name         code    pub_date  start_date    end_date  \
0  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2014-01-01  2014-12-31   
1  贵州茅台酒股份有限公司  600519.XSHG  2015-04-21  2015-01-01  2015-03-31   
2  贵州茅台酒股份有限公司  600519.XSHG  2015-08-28  2015-01-01  2015-06-30   
3  贵州茅台酒股份有限公司  600519.XSHG  2015-10-23  2015-01-01  2015-09-30   
4  贵州茅台酒股份有限公司  600519.XSHG  2016-03-24  2015-01-01  2015-12-31   
5  贵州茅台酒股份有限公司  600519.XSHG  2016-04-21  2016-01-01  2016-03-31   
6  贵州茅台酒股份有限公司  600519.XSHG  2016-08-27  2016-01-01  2016-06-30   
7  贵州茅台酒股份有限公司  600519.XSHG  2016-10-29  2016-01-01  2016-09-30   

   cash_equivalents  total_assets  total_liability  
0      1.070530e+10  4.662489e+10     1.693767e+10  
1      1.165218e+10  4.903731e+10     1.940782e+10  
2      1.239635e+10  5.079041e+10     2.125881e+10  
3      8.754779e+09  5.396424e+10     1.979558e+10  
4      1.505296e+10  5.512518e+10     2.082189e+10  
5      1.574722e+10  6.608276e+10     2.292887e+10  
6      1.898219e+10  6.186466e+10     2.658035e+10  
7      1.540346e+10  5.697338e+10     2.241995e+10  
```

**字段信息展示：**

<table><tbody><tr><td>字段名称</td><td>中文名称</td><td>字段类型</td><td>含义</td></tr><tr><td>company_id</td><td>公司ID</td><td>int</td><td></td></tr><tr><td>company_name</td><td>公司名称</td><td>varchar(100)</td><td></td></tr><tr><td>code</td><td>股票代码</td><td>varchar(12)</td><td></td></tr><tr><td>a_code</td><td>A股代码</td><td>varchar(12)</td><td></td></tr><tr><td>b_code</td><td>B股代码</td><td>varchar(12)</td><td></td></tr><tr><td>h_code</td><td>H股代码</td><td>varchar(12)</td><td></td></tr><tr><td>pub_date</td><td>公告日期</td><td>date</td><td></td></tr><tr><td>end_date</td><td>截止日期</td><td>date</td><td></td></tr><tr><td>report_date</td><td>报告期</td><td>date</td><td></td></tr><tr><td>report_type</td><td>报告期类型</td><td>int</td><td>0本期，1上期</td></tr><tr><td>source_id</td><td>报表来源编码</td><td>int</td><td>如下 报表来源编码</td></tr><tr><td>source</td><td>报表来源</td><td>varchar(60)</td><td></td></tr><tr><td>cash_equivalents</td><td>货币资金</td><td>decimal(20,4)</td><td></td></tr><tr><td>trading_assets</td><td>交易性金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>bill_receivable</td><td>应收票据</td><td>decimal(20,4)</td><td></td></tr><tr><td>account_receivable</td><td>应收账款</td><td>decimal(20,4)</td><td></td></tr><tr><td>advance_payment</td><td>预付款项</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_receivable</td><td>其他应收款</td><td>decimal(20,4)</td><td></td></tr><tr><td>affiliated_company_receivable</td><td>应收关联公司款</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_receivable</td><td>应收利息</td><td>decimal(20,4)</td><td></td></tr><tr><td>dividend_receivable</td><td>应收股利</td><td>decimal(20,4)</td><td></td></tr><tr><td>inventories</td><td>存货</td><td>decimal(20,4)</td><td></td></tr><tr><td>expendable_biological_asset</td><td>消耗性生物资产</td><td>decimal(20,4)</td><td>消耗性生物资产，是指为出售而持有的、或在将来收获为农产品的生物资产，包括生长中的大田作物、蔬菜、用材林，以及存栏代售的牲畜等</td></tr><tr><td>non_current_asset_in_one_year</td><td>一年内到期的非流动资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_current_assets</td><td>流动资产合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>hold_for_sale_assets</td><td>可供出售金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>hold_to_maturity_investments</td><td>持有至到期投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>longterm_receivable_account</td><td>长期应收款</td><td>decimal(20,4)</td><td></td></tr><tr><td>longterm_equity_invest</td><td>长期股权投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>investment_property</td><td>投资性房地产</td><td>decimal(20,4)</td><td></td></tr><tr><td>fixed_assets</td><td>固定资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>constru_in_process</td><td>在建工程</td><td>decimal(20,4)</td><td></td></tr><tr><td>construction_materials</td><td>工程物资</td><td>decimal(20,4)</td><td></td></tr><tr><td>fixed_assets_liquidation</td><td>固定资产清理</td><td>decimal(20,4)</td><td></td></tr><tr><td>biological_assets</td><td>生产性生物资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>oil_gas_assets</td><td>油气资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>intangible_assets</td><td>无形资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>development_expenditure</td><td>开发支出</td><td>decimal(20,4)</td><td></td></tr><tr><td>good_will</td><td>商誉</td><td>decimal(20,4)</td><td></td></tr><tr><td>long_deferred_expense</td><td>长期待摊费用</td><td>decimal(20,4)</td><td></td></tr><tr><td>deferred_tax_assets</td><td>递延所得税资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_non_current_assets</td><td>非流动资产合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_assets</td><td>资产总计</td><td>decimal(20,4)</td><td></td></tr><tr><td>shortterm_loan</td><td>短期借款</td><td>decimal(20,4)</td><td></td></tr><tr><td>trading_liability</td><td>交易性金融负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>notes_payable</td><td>应付票据</td><td>decimal(20,4)</td><td></td></tr><tr><td>accounts_payable</td><td>应付账款</td><td>decimal(20,4)</td><td></td></tr><tr><td>advance_peceipts</td><td>预收款项</td><td>decimal(20,4)</td><td></td></tr><tr><td>salaries_payable</td><td>应付职工薪酬</td><td>decimal(20,4)</td><td></td></tr><tr><td>taxs_payable</td><td>应交税费</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_payable</td><td>应付利息</td><td>decimal(20,4)</td><td></td></tr><tr><td>dividend_payable</td><td>应付股利</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_payable</td><td>其他应付款</td><td>decimal(20,4)</td><td></td></tr><tr><td>affiliated_company_payable</td><td>应付关联公司款</td><td>decimal(20,4)</td><td></td></tr><tr><td>non_current_liability_in_one_year</td><td>一年内到期的非流动负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_current_liability</td><td>流动负债合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>longterm_loan</td><td>长期借款</td><td>decimal(20,4)</td><td></td></tr><tr><td>bonds_payable</td><td>应付债券</td><td>decimal(20,4)</td><td></td></tr><tr><td>longterm_account_payable</td><td>长期应付款</td><td>decimal(20,4)</td><td></td></tr><tr><td>specific_account_payable</td><td>专项应付款</td><td>decimal(20,4)</td><td></td></tr><tr><td>estimate_liability</td><td>预计负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>deferred_tax_liability</td><td>递延所得税负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_non_current_liability</td><td>非流动负债合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_liability</td><td>负债合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>paidin_capital</td><td>实收资本（或股本）</td><td>decimal(20,4)</td><td></td></tr><tr><td>capital_reserve_fund</td><td>资本公积</td><td>decimal(20,4)</td><td></td></tr><tr><td>specific_reserves</td><td>专项储备</td><td>decimal(20,4)</td><td></td></tr><tr><td>surplus_reserve_fund</td><td>盈余公积</td><td>decimal(20,4)</td><td></td></tr><tr><td>treasury_stock</td><td>库存股</td><td>decimal(20,4)</td><td></td></tr><tr><td>retained_profit</td><td>未分配利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>equities_parent_company_owners</td><td>归属于母公司所有者权益</td><td>decimal(20,4)</td><td></td></tr><tr><td>minority_interests</td><td>少数股东权益</td><td>decimal(20,4)</td><td></td></tr><tr><td>foreign_currency_report_conv_diff</td><td>外币报表折算价差</td><td>decimal(20,4)</td><td></td></tr><tr><td>irregular_item_adjustment</td><td>非正常经营项目收益调整</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_owner_equities</td><td>所有者权益（或股东权益）合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_sheet_owner_equities</td><td>负债和所有者权益（或股东权益）合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_comprehensive_income</td><td>其他综合收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>deferred_earning</td><td>递延收益-非流动负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>settlement_provi</td><td>结算备付金</td><td>decimal(20,4)</td><td></td></tr><tr><td>lend_capital</td><td>拆出资金</td><td>decimal(20,4)</td><td></td></tr><tr><td>loan_and_advance_current_assets</td><td>发放贷款及垫款-流动资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>derivative_financial_asset</td><td>衍生金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>insurance_receivables</td><td>应收保费</td><td>decimal(20,4)</td><td></td></tr><tr><td>reinsurance_receivables</td><td>应收分保账款</td><td>decimal(20,4)</td><td></td></tr><tr><td><p>reinsurance_contract_</p><p>reserves_receivable</p></td><td>应收分保合同准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>bought_sellback_assets</td><td>买入返售金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>hold_sale_asset</td><td>划分为持有待售的资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>loan_and_advance_noncurrent_assets</td><td>发放贷款及垫款-非流动资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>borrowing_from_centralbank</td><td>向中央银行借款</td><td>decimal(20,4)</td><td></td></tr><tr><td>deposit_in_interbank</td><td>吸收存款及同业存放</td><td>decimal(20,4)</td><td></td></tr><tr><td>borrowing_capital</td><td>拆入资金</td><td>decimal(20,4)</td><td></td></tr><tr><td>derivative_financial_liability</td><td>衍生金融负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>sold_buyback_secu_proceeds</td><td>卖出回购金融资产款</td><td>decimal(20,4)</td><td></td></tr><tr><td>commission_payable</td><td>应付手续费及佣金</td><td>decimal(20,4)</td><td></td></tr><tr><td>reinsurance_payables</td><td>应付分保账款</td><td>decimal(20,4)</td><td></td></tr><tr><td>insurance_contract_reserves</td><td>保险合同准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>proxy_secu_proceeds</td><td>代理买卖证券款</td><td>decimal(20,4)</td><td></td></tr><tr><td><p>receivings_from_vicariously</p><p>_sold_securities</p></td><td>代理承销证券款</td><td>decimal(20,4)</td><td></td></tr><tr><td>hold_sale_liability</td><td>划分为持有待售的负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>estimate_liability_current</td><td>预计负债-流动负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>deferred_earning_current</td><td>递延收益-流动负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>preferred_shares_noncurrent</td><td>优先股-非流动负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>pepertual_liability_noncurrent</td><td>永续债-非流动负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>longterm_salaries_payable</td><td>长期应付职工薪酬</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_equity_tools</td><td>其他权益工具</td><td>decimal(20,4)</td><td></td></tr><tr><td>preferred_shares_equity</td><td>其中：优先股-所有者权益</td><td>decimal(20,4)</td><td></td></tr><tr><td>pepertual_liability_equity</td><td>永续债-所有者权益</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_current_assets</td><td>其他流动资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_non_current_assets</td><td>其他非流动资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_current_liability</td><td>其他流动负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_non_current_liability</td><td>其他非流动负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>ordinary_risk_reserve_fund</td><td>一般风险准备</td><td>decimal(20,4)</td><td></td></tr><tr><td>contract_assets</td><td>合同资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>bond_invest</td><td>债权投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_bond_invest</td><td>其他债权投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_equity_tools_invest</td><td>其他权益工具投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_non_current_financial_assets</td><td>其他非流动金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>contract_liability</td><td>合同负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>receivable_fin</td><td>应收款项融资</td><td>decimal(20,4)</td><td></td></tr><tr><td>usufruct_assets</td><td>使用权资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>bill_and_account_payable</td><td>应付票据及应付账款</td><td>decimal(20,4)</td><td></td></tr><tr><td>bill_and_account_receivable</td><td>应收票据及应收账款</td><td>decimal(20,4)</td><td></td></tr><tr><td>lease_liability</td><td>租赁负债</td><td>decimal(20,4)</td><td></td></tr></tbody></table>

-   **报表来源编码**

    | 编码 | 名称 |
    | --- | --- |
    | 321001 | 招募说明书 |
    | 321002 | 上市公告书 |
    | 321003 | 定期报告 |
    | 321004 | 预披露公告 |
    | 321005 | 换股报告书 |
    | 321099 | 其他 |


<a id="金融类财务报表"></a>

#### 金融类财务报表

-   **更新时间：2005至今，每天18:00-24:00更新**

<a id="利润表"></a>

### 利润表

**金融类合并利润表、母公司利润表**

### 合并利润表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.FINANCE_INCOME_STATEMENT).filter(finance.FINANCE_INCOME_STATEMENT.code==code).limit(n))
```

获取金融类上市公司的合并利润表信息

**参数：**

-   **query(finance.FINANCE\_INCOME\_STATEMENT)**：表示从finance.FINANCE\_INCOME\_STATEMENT这张表中查询金融类上市公司合并利润表的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.FINANCE\_INCOME\_STATEMENT**：代表金融类上市公司合并利润表，收录了金融类上市公司的合并利润表，表结构和字段信息如下：

-   filter(finance.FINANCE\_INCOME\_STATEMENT.code==code)\*\*：指定筛选条件，通过finance.FINANCE\_INCOME\_STATEMENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.FINANCE\_INCOME\_STATEMENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日金融类上市公司公布的合并利润表信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```sql
#查询中国平安2015年之后公告的合并利润表数据,指定只取出本期数据
from jqdatasdk import finance
q=query(finance.FINANCE_INCOME_STATEMENT).filter(finance.FINANCE_INCOME_STATEMENT.code=='601318.XSHG',finance.FINANCE_INCOME_STATEMENT.pub_date>='2015-01-01',finance.FINANCE_INCOME_STATEMENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

    id  company_id      company_name         code  a_code b_code h_code  \
0  246   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
1  248   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
2  250   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
3  252   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
4  254   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
5  256   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
6  258   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
7  260   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   

     pub_date  start_date    end_date         ...            net_profit  \
0  2015-03-20  2014-01-01  2014-12-31         ...          4.793000e+10   
1  2015-04-30  2015-01-01  2015-03-31         ...          2.243600e+10   
2  2015-08-21  2015-01-01  2015-06-30         ...          3.991100e+10   
3  2015-10-28  2015-01-01  2015-09-30         ...          5.640500e+10   
4  2016-03-16  2015-01-01  2015-12-31         ...          6.517800e+10   
5  2016-04-27  2016-01-01  2016-03-31         ...          2.338900e+10   
6  2016-08-18  2016-01-01  2016-06-30         ...          4.630800e+10   
7  2016-10-28  2016-01-01  2016-09-30         ...          6.481300e+10   

   np_parent_company_owners  minority_profit   eps  basic_eps  diluted_eps  \
0              3.927900e+10     8.651000e+09  None       4.93         4.68   
1              1.996400e+10     2.472000e+09  None       2.19         2.19   
2              3.464900e+10     5.262000e+09  None       1.90         1.90   
3              4.827600e+10     8.129000e+09  None       2.64         2.64   
4              5.420300e+10     1.097500e+10  None       2.98         2.98   
5              2.070000e+10     2.689000e+09  None       1.16         1.16   
6              4.077600e+10     5.532000e+09  None       2.28         2.28   
7              5.650800e+10     8.305000e+09  None       3.17         3.16   

   other_composite_income  total_composite_income  ci_parent_company_owners  \
0            3.077400e+10            7.870400e+10              6.959000e+10   
1           -3.572000e+09            1.886400e+10              1.633600e+10   
2            7.100000e+07            3.998200e+10              3.450800e+10   
3           -1.316100e+10            4.324400e+10              3.488100e+10   
4            7.520000e+08            6.593000e+10              5.456500e+10   
5           -1.124600e+10            1.214300e+10              9.509000e+09   
6           -9.129000e+09            3.717900e+10              3.167900e+10   
7           -5.917000e+09            5.889600e+10              5.050300e+10   

   ci_minority_owners  
0        9.114000e+09  
1        2.528000e+09  
2        5.474000e+09  
3        8.363000e+09  
4        1.136500e+10  
5        2.634000e+09  
6        5.500000e+09  
7        8.393000e+09  

[8 rows x 66 columns]
```

<a id="-1"></a>

### 母公司利润表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.FINANCE_INCOME_STATEMENT_PARENT).filter(finance.FINANCE_INCOME_STATEMENT_PARENT.code==code).limit(n))
```

获取金融类上市公司的母公司利润表信息

**参数：**

-   **query(finance.FINANCE\_INCOME\_STATEMENT\_PARENT)**：表示从finance.FINANCE\_INCOME\_STATEMENT\_PARENT这张表中查询金融类上市公司母公司利润表的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.FINANCE\_INCOME\_STATEMENT\_PARENT**：代表金融类上市公司母公司利润表，收录了金融类上市公司的母公司利润表，表结构和字段信息如下：

-   filter(finance.FINANCE\_INCOME\_STATEMENT\_PARENT.code==code)\*\*：指定筛选条件，通过finance.FINANCE\_INCOME\_STATEMENT\_PARENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.FINANCE\_INCOME\_STATEMENT\_PARENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日金融类上市公司公布的母公司利润表信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```sql
#查询中国平安2015年之后公告的母公司利润表数据,指定只取出本期数据
from jqdatasdk import finance
q=query(finance.FINANCE_INCOME_STATEMENT_PARENT).filter(finance.FINANCE_INCOME_STATEMENT_PARENT.code=='601318.XSHG',finance.FINANCE_INCOME_STATEMENT_PARENT.pub_date>='2015-01-01',finance.FINANCE_INCOME_STATEMENT_PARENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

    id  company_id      company_name         code  a_code b_code h_code  \
0  214   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
1  216   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
2  218   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
3  220   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
4  222   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
5  224   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
6  226   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   
7  228   300002221  中国平安保险(集团)股份有限公司  601318.XSHG  601318   None   None   

     pub_date  start_date    end_date        ...            net_profit  \
0  2015-03-20  2014-01-01  2014-12-31        ...          7.214000e+09   
1  2015-04-30  2015-01-01  2015-03-31        ...          3.160000e+08   
2  2015-08-21  2015-01-01  2015-06-30        ...          8.390000e+09   
3  2015-10-28  2015-01-01  2015-09-30        ...          8.969000e+09   
4  2016-03-16  2015-01-01  2015-12-31        ...          1.028000e+10   
5  2016-04-27  2016-01-01  2016-03-31        ...          1.810000e+08   
6  2016-08-18  2016-01-01  2016-06-30        ...          1.385000e+10   
7  2016-10-28  2016-01-01  2016-09-30        ...          1.374700e+10   

   np_parent_company_owners  minority_profit   eps  basic_eps diluted_eps  \
0              7.214000e+09             None  None       None        None   
1              3.160000e+08             None  None       None        None   
2              8.390000e+09             None  None       None        None   
3              8.969000e+09             None  None       None        None   
4              1.028000e+10             None  None       None        None   
5              1.810000e+08             None  None       None        None   
6              1.385000e+10             None  None       None        None   
7              1.374700e+10             None  None       None        None   

  other_composite_income total_composite_income ci_parent_company_owners  \
0            235000000.0           7.449000e+09                      NaN   
1            -47000000.0           2.690000e+08                      NaN   
2             85000000.0           8.475000e+09                      NaN   
3            191000000.0           9.160000e+09                      NaN   
4            436000000.0           1.071600e+10                      NaN   
5            -38000000.0           1.430000e+08                      NaN   
6            -48000000.0           1.380200e+10             1.380200e+10   
7              7000000.0           1.375400e+10             1.375400e+10   

  ci_minority_owners  
0               None  
1               None  
2               None  
3               None  
4               None  
5               None  
6               None  
7               None  

[8 rows x 66 columns]
```

**字段信息展示：**

| 字段名称 | 中文名称 | 字段类型 | 含义 |
| --- | --- | --- | --- |
| company\_id | 公司ID | int |  |
| company\_name | 公司名称 | varchar(100) |  |
| code | 公司主证券代码 | varchar(12) |  |
| a\_code | A股代码 | varchar(12) |  |
| b\_code | B股代码 | varchar(12) |  |
| h\_code | H股代码 | varchar(12) |  |
| pub\_date | 公告日期 | date |  |
| start\_date | 开始日期 | date |  |
| end\_date | 截止日期 | date |  |
| report\_date | 报告期 | date |  |
| report\_type | 报告期类型 | int | 0本期，1上期 |
| source\_id | 报表来源编码 | int | 如下报表来源编码 |
| source | 报表来源 | varchar(60) |  |
| operating\_revenue | 营业收入 | decimal(20,4) |  |
| interest\_net\_revenue | 利息净收入 | decimal(20,4) |  |
| interest\_income | 利息收入 | decimal(20,4) |  |
| interest\_expense | 利息支出 | decimal(20,4) |  |
| commission\_net\_income | 手续费及佣金净收入 | decimal(20,4) |  |
| commission\_income | 手续费及佣金收入 | decimal(20,4) |  |
| commission\_expense | 手续费及佣金支出 | decimal(20,4) |  |
| agent\_security\_income | 代理买卖证券业务净收入 | decimal(20,4) |  |
| sell\_security\_income | 证券承销业务净收入 | decimal(20,4) |  |
| manage\_income | 委托客户管理资产业务净收入 | decimal(20,4) |  |
| premiums\_earned | 已赚保费 | decimal(20,4) |  |
| assurance\_income | 保险业务收入 | decimal(20,4) |  |
| premiums\_income | 分保费收入 | decimal(20,4) |  |
| premiums\_expense | 分出保费 | decimal(20,4) |  |
| prepare\_money | 提取未到期责任准备金 | decimal(20,4) |  |
| investment\_income | 投资收益 | decimal(20,4) |  |
| invest\_income\_associates | 对联营企业和合营企业的投资收益 | decimal(20,4) |  |
| fair\_value\_variable\_income | 公允价值变动收益 | decimal(20,4) |  |
| exchange\_income | 汇兑收益 | decimal(20,4) |  |
| other\_income | 其他业务收入 | decimal(20,4) |  |
| operation\_expense | 营业支出 | decimal(20,4) |  |
| refunded\_premiums | 退保金 | decimal(20,4) |  |
| compensate\_loss | 赔付支出 | decimal(20,4) |  |
| compensation\_back | 摊回赔付支出 | decimal(20,4) |  |
| insurance\_reserve | 提取保险责任准备金 | decimal(20,4) |  |
| insurance\_reserve\_back | 摊回保险责任准备金 | decimal(20,4) |  |
| policy\_dividend\_payout | 保单红利支出 | decimal(20,4) |  |
| reinsurance\_cost | 分保费用 | decimal(20,4) |  |
| operating\_tax\_surcharges | 营业税金及附加 | decimal(20,4) |  |
| commission\_expense2 | 手续费及佣金支出(保险专用) | decimal(20,4) |  |
| operation\_manage\_fee | 业务及管理费 | decimal(20,4) |  |
| separate\_fee | 摊回分保费用 | decimal(20,4) |  |
| asset\_impairment\_loss | 资产减值损失 | decimal(20,4) |  |
| other\_cost | 其他业务成本 | decimal(20,4) |  |
| operating\_profit | 营业利润 | decimal(20,4) |  |
| subsidy\_income | 补贴收入 | decimal(20,4) |  |
| non\_operating\_revenue | 营业外收入 | decimal(20,4) |  |
| non\_operating\_expense | 营业外支出 | decimal(20,4) |  |
| other\_items\_influenced\_profit | 影响利润总额的其他科目 | decimal(20,4) |  |
| total\_profit | 利润总额 | decimal(20,4) |  |
| income\_tax\_expense | 所得税费用 | decimal(20,4) |  |
| other\_influence\_net\_profit | 影响净利润的其他科目 | decimal(20,4) |  |
| net\_profit | 净利润 | decimal(20,4) |  |
| np\_parent\_company\_owners | 归属于母公司股东的净利润 | decimal(20,4) |  |
| minority\_profit | 少数股东损益 | decimal(20,4) |  |
| eps | 每股收益 | decimal(20,4) |  |
| basic\_eps | 基本每股收益 | decimal(20,4) |  |
| diluted\_eps | 稀释每股收益 | decimal(20,4) |  |
| other\_composite\_income | 其他综合收益 | decimal(20,4) |  |
| total\_composite\_income | 综合收益总额 | decimal(20,4) |  |
| ci\_parent\_company\_owners | 归属于母公司的综合收益 | decimal(20,4) |  |
| ci\_minority\_owners | 归属于少数股东的综合收益 | decimal(20,4) |  |
| other\_earnings | 其他收益 | decimal(20,4) |  |
| asset\_deal\_income | 资产处置收益 | decimal(20,4) |  |
| sust\_operate\_net\_profit | 持续经营净利润 | decimal(20,4) |  |
| discon\_operate\_net\_profit | 终止经营净利润 | decimal(20,4) |  |
| credit\_impairment\_loss | 信用减值损失 | decimal(20,4) |  |

-   **报表来源编码**

    | 编码 | 名称 |
    | --- | --- |
    | 321001 | 招募说明书 |
    | 321002 | 上市公告书 |
    | 321003 | 定期报告 |
    | 321004 | 预披露公告 |
    | 321005 | 换股报告书 |
    | 321099 | 其他 |


<a id="现金流量表"></a>

### 现金流量表

**金融类合并现金流量表、母公司现金流量表**

### 合并现金流量表

```python
from jqdatasdk import finance
finance.run_query(query(finance.FINANCE_CASHFLOW_STATEMENT).filter(finance.FINANCE_CASHFLOW_STATEMENT.code==code).limit(n))
```

获取金融类上市公司的合并现金流量表信息

**参数：**

-   **query(finance.FINANCE\_CASHFLOW\_STATEMENT)**：表示从finance.FINANCE\_CASHFLOW\_STATEMENT这张表中查询金融类上市公司合并现金流量的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.FINANCE\_CASHFLOW\_STATEMENT**：代表金融类上市公司合并现金流量表，收录了金融类上市公司的合并现金流量，表结构和字段信息如下：

-   **filter(finance.FINANCE\_CASHFLOW\_STATEMENT.code==code)**：指定筛选条件，通过finance.FINANCE\_CASHFLOW\_STATEMENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.FINANCE\_CASHFLOW\_STATEMENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日金融类上市公司公布的合并现金流量信息；多个筛选条件用英文逗号分隔。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```sql
#查询中国平安2015年之后公告的合并现金流量表数据，指定只取出本期数据经营活动现金流量净额，投资活动现金流量净额，以及筹资活动现金流量净额
from jqdatasdk import *
q=query(finance.FINANCE_CASHFLOW_STATEMENT.company_name,
        finance.FINANCE_CASHFLOW_STATEMENT.code,
        finance.FINANCE_CASHFLOW_STATEMENT.pub_date,
        finance.FINANCE_CASHFLOW_STATEMENT.start_date,
        finance.FINANCE_CASHFLOW_STATEMENT.end_date,
        finance.FINANCE_CASHFLOW_STATEMENT.net_operate_cash_flow,
        finance.FINANCE_CASHFLOW_STATEMENT.net_invest_cash_flow,
finance.FINANCE_CASHFLOW_STATEMENT.net_finance_cash_flow).filter(finance.FINANCE_CASHFLOW_STATEMENT.code=='601318.XSHG',finance.FINANCE_CASHFLOW_STATEMENT.pub_date>='2015-01-01',finance.FINANCE_CASHFLOW_STATEMENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

       company_name         code    pub_date  start_date    end_date  \
0  中国平安保险(集团)股份有限公司  601318.XSHG  2015-03-20  2014-01-01  2014-12-31   
1  中国平安保险(集团)股份有限公司  601318.XSHG  2015-04-30  2015-01-01  2015-03-31   
2  中国平安保险(集团)股份有限公司  601318.XSHG  2015-08-21  2015-01-01  2015-06-30   
3  中国平安保险(集团)股份有限公司  601318.XSHG  2015-10-28  2015-01-01  2015-09-30   
4  中国平安保险(集团)股份有限公司  601318.XSHG  2016-03-16  2015-01-01  2015-12-31   
5  中国平安保险(集团)股份有限公司  601318.XSHG  2016-04-27  2016-01-01  2016-03-31   
6  中国平安保险(集团)股份有限公司  601318.XSHG  2016-08-18  2016-01-01  2016-06-30   
7  中国平安保险(集团)股份有限公司  601318.XSHG  2016-10-28  2016-01-01  2016-09-30   

   net_operate_cash_flow  net_invest_cash_flow  net_finance_cash_flow  
0           1.702600e+11         -2.368890e+11           8.536800e+10  
1           6.114900e+10         -4.478700e+10           1.996200e+10  
2           2.478960e+11         -1.355150e+11           1.059350e+11  
3           1.710670e+11         -1.442380e+11           1.675280e+11  
4           1.356180e+11         -2.737320e+11           2.049760e+11  
5           1.192720e+11         -1.241580e+11           5.367100e+10  
6           6.599800e+10         -2.663960e+11           1.714720e+11  
7          -1.702500e+10         -1.942610e+11           1.291400e+11  
```

<a id="-1"></a>

### 母公司现金流量表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.FINANCE_CASHFLOW_STATEMENT_PARENT).filter(finance.FINANCE_CASHFLOW_STATEMENT_PARENT.code==code).limit(n))
```

获取金融类上市公司的母公司现金流量表信息

**参数：**

-   **query(finance.FINANCE\_CASHFLOW\_STATEMENT\_PARENT)**：表示从finance.FINANCE\_CASHFLOW\_STATEMENT\_PARENT这张表中查询金融类上市公司母公司现金流量的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.FINANCE\_CASHFLOW\_STATEMENT\_PARENT**：代表金融类上市公司母公司现金流量表，收录了金融类上市公司的母公司现金流量，表结构和字段信息如下：

-   **filter(finance.FINANCE\_CASHFLOW\_STATEMENT\_PARENT.code==code)**：指定筛选条件，通过finance.FINANCE\_CASHFLOW\_STATEMENT\_PARENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.FINANCE\_CASHFLOW\_STATEMENT\_PARENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日金融类上市公司公布的母公司现金流量信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询中国平安2015年之后公告的母公司现金流量表数据，指定只取出本期经营活动现金流量净额，投资活动现金流量净额，以及筹资活动现金流量净额
from jqdatasdk import *
q=query(finance.FINANCE_CASHFLOW_STATEMENT_PARENT.company_name,
        finance.FINANCE_CASHFLOW_STATEMENT_PARENT.code,
        finance.FINANCE_CASHFLOW_STATEMENT_PARENT.pub_date,
        finance.FINANCE_CASHFLOW_STATEMENT_PARENT.start_date,
        finance.FINANCE_CASHFLOW_STATEMENT_PARENT.end_date,
        finance.FINANCE_CASHFLOW_STATEMENT_PARENT.net_operate_cash_flow,
        finance.FINANCE_CASHFLOW_STATEMENT_PARENT.net_invest_cash_flow,
finance.FINANCE_CASHFLOW_STATEMENT_PARENT.net_finance_cash_flow).filter(finance.FINANCE_CASHFLOW_STATEMENT_PARENT.code=='601318.XSHG',finance.FINANCE_CASHFLOW_STATEMENT_PARENT.pub_date>='2015-01-01',finance.FINANCE_CASHFLOW_STATEMENT_PARENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

       company_name         code    pub_date  start_date    end_date  \
0  中国平安保险(集团)股份有限公司  601318.XSHG  2015-03-20  2014-01-01  2014-12-31   
1  中国平安保险(集团)股份有限公司  601318.XSHG  2015-04-30  2015-01-01  2015-03-31   
2  中国平安保险(集团)股份有限公司  601318.XSHG  2015-08-21  2015-01-01  2015-06-30   
3  中国平安保险(集团)股份有限公司  601318.XSHG  2015-10-28  2015-01-01  2015-09-30   
4  中国平安保险(集团)股份有限公司  601318.XSHG  2016-03-16  2015-01-01  2015-12-31   
5  中国平安保险(集团)股份有限公司  601318.XSHG  2016-04-27  2016-01-01  2016-03-31   
6  中国平安保险(集团)股份有限公司  601318.XSHG  2016-08-18  2016-01-01  2016-06-30   
7  中国平安保险(集团)股份有限公司  601318.XSHG  2016-10-28  2016-01-01  2016-09-30   

   net_operate_cash_flow  net_invest_cash_flow  net_finance_cash_flow  
0            -88000000.0         -1.433300e+10           2.354300e+10  
1           -202000000.0         -7.180000e+08           6.910000e+08  
2            -88000000.0         -8.063000e+09           3.010000e+09  
3            -25000000.0         -1.116800e+10          -7.130000e+09  
4           -203000000.0         -1.099000e+10          -5.711000e+09  
5           -533000000.0          4.560000e+08          -3.000000e+08  
6           -236000000.0          3.237000e+09          -1.620000e+09  
7           -418000000.0          1.089500e+10          -1.039000e+10  
```

**字段信息展示：**

| 字段名称 | 中文名称 | 字段类型 | 含义 |
| --- | --- | --- | --- |
| company\_id | 公司ID | int |  |
| company\_name | 公司名称 | varchar(100) |  |
| code | 公司主证券代码 | varchar(12) |  |
| a\_code | A股代码 | varchar(12) |  |
| b\_code | B股代码 | varchar(12) |  |
| h\_code | H股代码 | varchar(12) |  |
| pub\_date | 公告日期 | date |  |
| start\_date | 开始日期 | date |  |
| end\_date | 截止日期 | date |  |
| report\_date | 报告期 | date |  |
| report\_type | 报告期类型 | int | 0本期，1上期 |
| source\_id | 报表来源编码 | int | 如下报表来源编码 |
| source | 报表来源 | varchar(60) |  |
| operate\_cash\_flow | 经营活动产生的现金流量 | decimal(20,4) |  |
| net\_loan\_and\_advance\_decrease | 客户贷款及垫款净减少额 | decimal(20,4) |  |
| net\_deposit\_increase | 客户存款和同业存放款项净增加额 | decimal(20,4) |  |
| net\_borrowing\_from\_central\_bank | 向中央银行借款净增加额 | decimal(20,4) |  |
| net\_deposit\_in\_cb\_and\_ib\_de | 存放中央银行和同业款项净减少额 | decimal(20,4) |  |
| net\_borrowing\_from\_finance\_co | 向其他金融机构拆入资金净增加额 | decimal(20,4) |  |
| interest\_and\_commission\_cashin | 收取利息、手续费及佣金的现金 | decimal(20,4) |  |
| trade\_asset\_increase | 处置交易性金融资产净增加额 | decimal(20,4) |  |
| net\_increase\_in\_placements | 拆入资金净增加额 | decimal(20,4) |  |
| net\_buyback | 回购业务资金净增加额 | decimal(20,4) |  |
| goods\_sale\_and\_service\_render\_cash | 销售商品、提供劳务收到的现金 | decimal(20,4) |  |
| tax\_levy\_refund | 收到的税费返还 | decimal(20,4) |  |
| net\_original\_insurance\_cash | 收到原保险合同保费取得的现金 | decimal(20,4) |  |
| insurance\_cash\_amount | 收到再保业务现金净额 | decimal(20,4) |  |
| net\_insurer\_deposit\_investment | 保户储金及投资款净增加额 | decimal(20,4) |  |
| subtotal\_operate\_cash\_inflow | 经营活动现金流入小计 | decimal(20,4) |  |
| net\_loan\_and\_advance\_increase | 客户贷款及垫款净增加额 | decimal(20,4) |  |
| saving\_clients\_decrease\_amount | 客户存放及同业存放款项净减少额 | decimal(20,4) |  |
| net\_deposit\_in\_cb\_and\_ib | 存放中央银行和同业款项净增加额 | decimal(20,4) |  |
| central\_borrowing\_decrease | 向中央银行借款净减少额 | decimal(20,4) |  |
| other\_money\_increase | 向其他金融机构拆出资金净增加额 | decimal(20,4) |  |
| purchase\_trade\_asset\_increase | 购入交易性金融资产净增加额 | decimal(20,4) |  |
| repurchase\_decrease | 回购业务资金净减少额 | decimal(20,4) |  |
| handling\_charges\_and\_commission | 支付利息、手续费及佣金的现金 | decimal(20,4) |  |
| goods\_and\_services\_cash\_paid | 购买商品、提供劳务支付的现金 | decimal(20,4) |  |
| net\_cash\_re\_insurance | 支付再保业务现金净额 | decimal(20,4) |  |
| reserve\_investment\_decrease | 保户储金及投资款净减少额 | decimal(20,4) |  |
| original\_compensation\_paid | 支付原保险合同赔付款项的现金 | decimal(20,4) |  |
| policy\_dividend\_cash\_paid | 支付保单红利的现金 | decimal(20,4) |  |
| staff\_behalf\_paid | 支付给职工以及为职工支付的现金 | decimal(20,4) |  |
| tax\_payments | 支付的各项税费 | decimal(20,4) |  |
| subtotal\_operate\_cash\_outflow | 经营活动现金流出小计 | decimal(20,4) |  |
| net\_operate\_cash\_flow | 经营活动现金流量净额 | decimal(20,4) |  |
| invest\_cash\_flow | 投资活动产生的现金流量 | decimal(20,4) |  |
| invest\_withdrawal\_cash | 收回投资收到的现金 | decimal(20,4) |  |
| invest\_proceeds | 取得投资收益收到的现金 | decimal(20,4) |  |
| gain\_from\_disposal | 处置固定资产、无形资产和其他长期资产所收回的现金 | decimal(20,4) |  |
| subtotal\_invest\_cash\_inflow | 投资活动现金流入小计 | decimal(20,4) |  |
| invest\_cash\_paid | 投资支付的现金 | decimal(20,4) |  |
| impawned\_loan\_net\_increase | 质押贷款净增加额 | decimal(20,4) |  |
| fix\_intan\_other\_asset\_acqui\_cash | 购建固定资产、无形资产和其他长期资产支付的现金 | decimal(20,4) |  |
| subtotal\_invest\_cash\_outflow | 投资活动现金流出小计 | decimal(20,4) |  |
| net\_invest\_cash\_flow | 投资活动现金流量净额 | decimal(20,4) |  |
| finance\_cash\_flow | 筹资活动产生的现金流量 | decimal(20,4) |  |
| cash\_from\_invest | 吸收投资收到的现金 | decimal(20,4) |  |
| cash\_from\_bonds\_issue | 发行债券收到的现金 | decimal(20,4) |  |
| cash\_from\_borrowing | 取得借款收到的现金 | decimal(20,4) |  |
| subtotal\_finance\_cash\_inflow | 筹资活动现金流入小计 | decimal(20,4) |  |
| borrowing\_repayment | 偿还债务支付的现金 | decimal(20,4) |  |
| dividend\_interest\_payment | 分配股利、利润或偿付利息支付的现金 | decimal(20,4) |  |
| subtotal\_finance\_cash\_outflow | 筹资活动现金流出小计 | decimal(20,4) |  |
| net\_finance\_cash\_flow | 筹资活动产生的现金流量净额 | decimal(20,4) |  |
| exchange\_rate\_change\_effect | 汇率变动对现金的影响 | decimal(20,4) |  |
| other\_reason\_effect\_cash | 其他原因对现金的影响 | decimal(20,4) |  |
| cash\_equivalent\_increase | 现金及现金等价物净增加额 | decimal(20,4) |  |
| cash\_equivalents\_at\_beginning | 期初现金及现金等价物余额 | decimal(20,4) |  |
| cash\_and\_equivalents\_at\_end | 期末现金及现金等价物余额 | decimal(20,4) |  |
| net\_profit\_cashflow\_adjustment | 将净利润调节为经营活动现金流量 | decimal(20,4) |  |
| net\_profit | 净利润 | decimal(20,4) |  |
| assets\_depreciation\_reserves | 资产减值准备 | decimal(20,4) |  |
| fixed\_assets\_depreciation | 固定资产折旧、油气资产折耗、生产性生物资产折旧 | decimal(20,4) |  |
| intangible\_assets\_amortization | 无形资产摊销 | decimal(20,4) |  |
| defferred\_expense\_amortization | 长期待摊费用摊销 | decimal(20,4) |  |
| fix\_intan\_other\_asset\_dispo\_loss | 处置固定资产、无形资产和其他长期资产的损失 | decimal(20,4) |  |
| fixed\_asset\_scrap\_loss | 固定资产报废损失 | decimal(20,4) |  |
| fair\_value\_change\_loss | 公允价值变动损失 | decimal(20,4) |  |
| financial\_cost | 财务费用 | decimal(20,4) |  |
| invest\_loss | 投资损失 | decimal(20,4) |  |
| deffered\_tax\_asset\_decrease | 递延所得税资产减少 | decimal(20,4) |  |
| deffered\_tax\_liability\_increase | 递延所得税负债增加 | decimal(20,4) |  |
| inventory\_decrease | 存货的减少 | decimal(20,4) |  |
| operate\_receivables\_decrease | 经营性应收项目的减少 | decimal(20,4) |  |
| operate\_payable\_increase | 经营性应付项目的增加 | decimal(20,4) |  |
| others | 其他 | decimal(20,4) |  |
| net\_operate\_cash\_flow2 | 经营活动产生的现金流量净额\_间接法 | decimal(20,4) |  |
| activities\_not\_relate\_major | 不涉及现金收支的重大投资和筹资活动 | decimal(20,4) |  |
| debt\_to\_capital | 债务转为资本 | decimal(20,4) |  |
| cbs\_expiring\_in\_one\_year | 一年内到期的可转换公司债券 | decimal(20,4) |  |
| financial\_lease\_fixed\_assets | 融资租入固定资产 | decimal(20,4) |  |
| change\_info\_cash | 现金及现金等价物净变动情况 | decimal(20,4) |  |
| cash\_at\_end | 现金的期末余额 | decimal(20,4) |  |
| cash\_at\_beginning | 现金的期初余额 | decimal(20,4) |  |
| equivalents\_at\_end | 现金等价物的期末余额 | decimal(20,4) |  |
| equivalents\_at\_beginning | 现金等价物的期初余额 | decimal(20,4) |  |
| other\_influence2 | 其他原因对现金的影响2 | decimal(20,4) |  |
| cash\_equivalent\_increase2 | 现金及现金等价物净增加额2 | decimal(20,4) |  |
| investment\_property\_depreciation | 投资性房地产的折旧及摊销 | decimal(20,4) |  |
| net\_dec\_finance\_out | 融出资金净减少额 | decimal(20,4) |  |
| net\_cash\_received\_from\_proxy\_secu | 代理买卖证券收到的现金净额 | decimal(20,4) |  |
| net\_inc\_finance\_out | 融出资金净增加额 | decimal(20,4) |  |
| net\_cash\_paid\_to\_proxy\_secu | 代理买卖证券支付的现金净额 | decimal(20,4) |  |
| net\_dec\_in\_placements | 拆入资金净减少额 | decimal(20,4) |  |
| credit\_impairment\_loss | 信用减值损失(现金流量表补充科目) | decimal(20,4) |  |

-   **报表来源编码**

    | 编码 | 名称 |
    | --- | --- |
    | 321001 | 招募说明书 |
    | 321002 | 上市公告书 |
    | 321003 | 定期报告 |
    | 321004 | 预披露公告 |
    | 321005 | 换股报告书 |
    | 321099 | 其他 |


<a id="资产负债表"></a>

### 资产负债表

**金融类合并资产负债表、母公司资产负债表**

### 合并资产负债表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.FINANCE_BALANCE_SHEET).filter(finance.FINANCE_BALANCE_SHEET.code==code).limit(n))
```

获取金融类上市公司的合并资产负债表信息

**参数：**

-   **query(finance.FINANCE\_BALANCE\_SHEET)**：表示从finance.FINANCE\_BALANCE\_SHEET这张表中查询金融类上市公司合并资产负债的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.FINANCE\_BALANCE\_SHEET**：代表金融类上市公司合并资产负债表，收录了金融类上市公司的合并资产负债，表结构和字段信息如下：

-   **filter(finance.FINANCE\_BALANCE\_SHEET.code==code)**：指定筛选条件，通过finance.FINANCE\_BALANCE\_SHEET.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.FINANCE\_BALANCE\_SHEET.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日金融类上市公司公布的合并资产负债信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**示例：**

```python
#查询中国平安2015年之后公告的合并资产负债表数据，取出本期的货币资金，总资产和总负债
from jqdatasdk import finance
q=query(finance.FINANCE_BALANCE_SHEET.company_name,
        finance.FINANCE_BALANCE_SHEET.code,
        finance.FINANCE_BALANCE_SHEET.pub_date,
        finance.FINANCE_BALANCE_SHEET.start_date,
        finance.FINANCE_BALANCE_SHEET.end_date,
        finance.FINANCE_BALANCE_SHEET.cash_equivalents,
        finance.FINANCE_BALANCE_SHEET.total_assets,
        finance.FINANCE_BALANCE_SHEET.total_liability
).filter(finance.FINANCE_BALANCE_SHEET.code=='601318.XSHG',finance.FINANCE_BALANCE_SHEET.pub_date>='2015-01-01',finance.FINANCE_BALANCE_SHEET.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

       company_name         code    pub_date  start_date    end_date  \
0  中国平安保险(集团)股份有限公司  601318.XSHG  2015-03-20  2014-01-01  2014-12-31   
1  中国平安保险(集团)股份有限公司  601318.XSHG  2015-04-30  2015-01-01  2015-03-31   
2  中国平安保险(集团)股份有限公司  601318.XSHG  2015-08-21  2015-01-01  2015-06-30   
3  中国平安保险(集团)股份有限公司  601318.XSHG  2015-10-28  2015-01-01  2015-09-30   
4  中国平安保险(集团)股份有限公司  601318.XSHG  2016-03-16  2015-01-01  2015-12-31   
5  中国平安保险(集团)股份有限公司  601318.XSHG  2016-04-27  2016-01-01  2016-03-31   
6  中国平安保险(集团)股份有限公司  601318.XSHG  2016-08-18  2016-01-01  2016-06-30   
7  中国平安保险(集团)股份有限公司  601318.XSHG  2016-10-28  2016-01-01  2016-09-30   

   cash_equivalents  total_assets  total_liability  
0      4.427070e+11  4.005911e+12     3.652095e+12  
1      4.131880e+11  4.215240e+12     3.833842e+12  
2      4.510800e+11  4.632287e+12     4.227789e+12  
3      4.654240e+11  4.667113e+12     4.262293e+12  
4      4.750570e+11  4.765159e+12     4.351588e+12  
5      5.668130e+11  5.006993e+12     4.566653e+12  
6      5.210790e+11  5.219782e+12     4.757190e+12  
7      5.230110e+11  5.296564e+12     4.815950e+12  
```

<a id="-1"></a>

### 母公司资产负债表

```sql
from jqdatasdk import finance
finance.run_query(query(finance.FINANCE_BALANCE_SHEET_PARENT).filter(finance.FINANCE_BALANCE_SHEET_PARENT.code==code).limit(n))
```

获取金融类上市公司的母公司资产负债表信息

**参数：**

-   **query(finance.FINANCE\_BALANCE\_SHEET\_PARENT)**：表示从finance.FINANCE\_BALANCE\_SHEET\_PARENT这张表中查询金融类上市公司母公司资产负债的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.FINANCE\_BALANCE\_SHEET\_PARENT**：代表金融类上市公司母公司资产负债表，收录了金融类上市公司的母公司资产负债，表结构和字段信息如下：

-   **filter(finance.FINANCE\_BALANCE\_SHEET\_PARENT.code==code)**：指定筛选条件，通过finance.FINANCE\_BALANCE\_SHEET\_PARENT.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.FINANCE\_BALANCE\_SHEET\_PARENT.pub\_date>='2015-01-01'，表示公告日期大于2015年1月1日金融类上市公司公布的母公司资产负债信息；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询中国平安2015年之后公告的母公司资产负债表数据，取出本期的货币资金，总资产和总负债
from jqdatasdk import finance
q=query(finance.FINANCE_BALANCE_SHEET_PARENT.company_name,
        finance.FINANCE_BALANCE_SHEET_PARENT.code,
        finance.FINANCE_BALANCE_SHEET_PARENT.pub_date,
        finance.FINANCE_BALANCE_SHEET_PARENT.start_date,
        finance.FINANCE_BALANCE_SHEET_PARENT.end_date,
        finance.FINANCE_BALANCE_SHEET_PARENT.cash_equivalents,
        finance.FINANCE_BALANCE_SHEET_PARENT.total_assets,
        finance.FINANCE_BALANCE_SHEET_PARENT.total_liability
).filter(finance.FINANCE_BALANCE_SHEET_PARENT.code=='601318.XSHG',finance.FINANCE_BALANCE_SHEET_PARENT.pub_date>='2015-01-01',finance.FINANCE_BALANCE_SHEET_PARENT.report_type==0).limit(8)
df=finance.run_query(q)
print(df)

       company_name         code    pub_date  start_date    end_date  \
0  中国平安保险(集团)股份有限公司  601318.XSHG  2015-03-20  2014-01-01  2014-12-31   
1  中国平安保险(集团)股份有限公司  601318.XSHG  2015-04-30  2015-01-01  2015-03-31   
2  中国平安保险(集团)股份有限公司  601318.XSHG  2015-08-21  2015-01-01  2015-06-30   
3  中国平安保险(集团)股份有限公司  601318.XSHG  2015-10-28  2015-01-01  2015-09-30   
4  中国平安保险(集团)股份有限公司  601318.XSHG  2016-03-16  2015-01-01  2015-12-31   
5  中国平安保险(集团)股份有限公司  601318.XSHG  2016-04-27  2016-01-01  2016-03-31   
6  中国平安保险(集团)股份有限公司  601318.XSHG  2016-08-18  2016-01-01  2016-06-30   
7  中国平安保险(集团)股份有限公司  601318.XSHG  2016-10-28  2016-01-01  2016-09-30   

   cash_equivalents  total_assets  total_liability  
0      2.621400e+10  1.970230e+11     1.733100e+10  
1      2.589900e+10  1.980580e+11     8.930000e+09  
2      2.080900e+10  2.096090e+11     1.610500e+10  
3      8.815000e+09  2.004830e+11     9.538000e+09  
4      1.017900e+10  2.033480e+11     1.080500e+10  
5      9.906000e+09  2.031290e+11     1.034900e+10  
6      1.023400e+10  2.155980e+11     1.557700e+10  
7      1.045300e+10  2.069940e+11     1.058500e+10  
```

**字段信息展示**

<table><tbody><tr><td>字段名称</td><td>中文名称</td><td>字段类型</td><td>含义</td></tr><tr><td>company_id</td><td>公司ID</td><td>int</td><td></td></tr><tr><td>company_name</td><td>公司名称</td><td>varchar(100)</td><td></td></tr><tr><td>code</td><td>公司主证券代码</td><td>varchar(12)</td><td></td></tr><tr><td>a_code</td><td>A股代码</td><td>varchar(12)</td><td></td></tr><tr><td>b_code</td><td>B股代码</td><td>varchar(12)</td><td></td></tr><tr><td>h_code</td><td>H股代码</td><td>varchar(12)</td><td></td></tr><tr><td>pub_date</td><td>公告日期</td><td>date</td><td></td></tr><tr><td>start_date</td><td>开始日期</td><td>date</td><td></td></tr><tr><td>end_date</td><td>截止日期</td><td>date</td><td></td></tr><tr><td>report_date</td><td>报告期</td><td>date</td><td></td></tr><tr><td>report_type</td><td>报告期类型</td><td>int</td><td>0本期，1上期</td></tr><tr><td>source_id</td><td>报表来源编码</td><td>int</td><td>如下报表编码表</td></tr><tr><td>source</td><td>报表来源</td><td>varchar(60)</td><td></td></tr><tr><td>deposit_in_ib</td><td>存放同业款项</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_equivalents</td><td>货币资金</td><td>decimal(20,4)</td><td></td></tr><tr><td>deposit_client</td><td>客户资金存款</td><td>decimal(20,4)</td><td></td></tr><tr><td>cash_in_cb</td><td>现金及存放中央银行款项</td><td>decimal(20,4)</td><td></td></tr><tr><td>settlement_provi</td><td>结算备付金</td><td>decimal(20,4)</td><td></td></tr><tr><td>settlement_provi_client</td><td>客户备付金</td><td>decimal(20,4)</td><td></td></tr><tr><td>metal</td><td>贵金属</td><td>decimal(20,4)</td><td></td></tr><tr><td>lend_capital</td><td>拆出资金</td><td>decimal(20,4)</td><td></td></tr><tr><td>fairvalue_fianancial_asset</td><td>以公允价值计量且其变动计入当期损益的金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_grow_asset</td><td>衍生金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>bought_sellback_assets</td><td>买入返售金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_receivable</td><td>应收利息</td><td>decimal(20,4)</td><td></td></tr><tr><td>insurance_receivables</td><td>应收保费</td><td>decimal(20,4)</td><td></td></tr><tr><td>recover_receivable</td><td>应收代位追偿款</td><td>decimal(20,4)</td><td></td></tr><tr><td>separate_receivable</td><td>应收分保帐款</td><td>decimal(20,4)</td><td></td></tr><tr><td>not_time_fund</td><td>应收分保未到期责任准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>not_decide_fund</td><td>应收分保未决赔款准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>response_fund</td><td>应收分保寿险责任准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>health_fund</td><td>应收分保长期健康险责任准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>margin_loan</td><td>保户质押贷款</td><td>decimal(20,4)</td><td></td></tr><tr><td>deposit_period</td><td>定期存款</td><td>decimal(20,4)</td><td></td></tr><tr><td>loan_and_advance</td><td>发放贷款及垫款</td><td>decimal(20,4)</td><td></td></tr><tr><td>margin_out</td><td>存出保证金</td><td>decimal(20,4)</td><td></td></tr><tr><td>agent_asset</td><td>代理业务资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>investment_reveiable</td><td>应收款项类投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>advance_payment</td><td>预付款项</td><td>decimal(20,4)</td><td></td></tr><tr><td>hold_for_sale_assets</td><td>可供出售金融资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>hold_to_maturity_investments</td><td>持有至到期投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>longterm_equity_invest</td><td>长期股权投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>finance_out</td><td>融出资金</td><td>decimal(20,4)</td><td></td></tr><tr><td>capital_margin_out</td><td>存出资本保证金</td><td>decimal(20,4)</td><td></td></tr><tr><td>investment_property</td><td>投资性房地产</td><td>decimal(20,4)</td><td></td></tr><tr><td>inventories</td><td>存货</td><td>decimal(20,4)</td><td></td></tr><tr><td>fixed_assets</td><td>固定资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>constru_in_process</td><td>在建工程</td><td>decimal(20,4)</td><td></td></tr><tr><td>intangible_assets</td><td>无形资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>trade_fee</td><td>交易席位费</td><td>decimal(20,4)</td><td></td></tr><tr><td>long_deferred_expense</td><td>长期待摊费用</td><td>decimal(20,4)</td><td></td></tr><tr><td>fixed_assets_liquidation</td><td>固定资产清理</td><td>decimal(20,4)</td><td></td></tr><tr><td>independent_account_asset</td><td>独立帐户资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>deferred_tax_assets</td><td>递延所得税资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_asset</td><td>其他资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_assets</td><td>资产总计</td><td>decimal(20,4)</td><td></td></tr><tr><td>borrowing_from_centralbank</td><td>向中央银行借款</td><td>decimal(20,4)</td><td></td></tr><tr><td>deposit_in_ib_and_other</td><td>同业及其他金融机构存放款项</td><td>decimal(20,4)</td><td></td></tr><tr><td>shortterm_loan</td><td>短期借款</td><td>decimal(20,4)</td><td></td></tr><tr><td>loan_pledge</td><td>其中：质押借款</td><td>decimal(20,4)</td><td></td></tr><tr><td>borrowing_capital</td><td>拆入资金</td><td>decimal(20,4)</td><td></td></tr><tr><td>fairvalue_financial_liability</td><td>以公允价值计量且其变动计入当期损益的金融负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>derivative_financial_liability</td><td>衍生金融负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>sold_buyback_secu_proceeds</td><td>卖出回购金融资产款</td><td>decimal(20,4)</td><td></td></tr><tr><td>deposit_absorb</td><td>吸收存款</td><td>decimal(20,4)</td><td></td></tr><tr><td>proxy_secu_proceeds</td><td>代理买卖证券款</td><td>decimal(20,4)</td><td></td></tr><tr><td>proxy_sell_proceeds</td><td>代理承销证券款</td><td>decimal(20,4)</td><td></td></tr><tr><td>accounts_payable</td><td>应付账款</td><td>decimal(20,4)</td><td></td></tr><tr><td>notes_payable</td><td>应付票据</td><td>decimal(20,4)</td><td></td></tr><tr><td>advance_peceipts</td><td>预收款项</td><td>decimal(20,4)</td><td></td></tr><tr><td>insurance_receive_early</td><td>预收保费</td><td>decimal(20,4)</td><td></td></tr><tr><td>commission_payable</td><td>应付手续费及佣金</td><td>decimal(20,4)</td><td></td></tr><tr><td>insurance_payable</td><td>应付分保帐款</td><td>decimal(20,4)</td><td></td></tr><tr><td>salaries_payable</td><td>应付职工薪酬</td><td>decimal(20,4)</td><td></td></tr><tr><td>taxs_payable</td><td>应交税费</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_payable</td><td>应付利息</td><td>decimal(20,4)</td><td></td></tr><tr><td>proxy_liability</td><td>代理业务负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>estimate_liability</td><td>预计负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>compensation_payable</td><td>应付赔付款</td><td>decimal(20,4)</td><td></td></tr><tr><td>interest_insurance_payable</td><td>应付保单红利</td><td>decimal(20,4)</td><td></td></tr><tr><td>investment_money</td><td>保户储金及投资款</td><td>decimal(20,4)</td><td></td></tr><tr><td>not_time_reserve</td><td>未到期责任准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>not_decide_reserve</td><td>未决赔款准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>live_reserve</td><td>寿险责任准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>longterm_reserve</td><td>长期健康险责任准备金</td><td>decimal(20,4)</td><td></td></tr><tr><td>longterm_loan</td><td>长期借款</td><td>decimal(20,4)</td><td></td></tr><tr><td>bonds_payable</td><td>应付债券</td><td>decimal(20,4)</td><td></td></tr><tr><td>independent_account</td><td>独立帐户负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>deferred_tax_liability</td><td>递延所得税负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_liability</td><td>其他负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_liability</td><td>负债合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>paidin_capital</td><td>实收资本(或股本)</td><td>decimal(20,4)</td><td></td></tr><tr><td>capital_reserve_fund</td><td>资本公积</td><td>decimal(20,4)</td><td></td></tr><tr><td>treasury_stock</td><td>减：库存股</td><td>decimal(20,4)</td><td></td></tr><tr><td>surplus_reserve_fund</td><td>盈余公积</td><td>decimal(20,4)</td><td></td></tr><tr><td>equities_parent_company_owners</td><td>归属于母公司所有者权益</td><td>decimal(20,4)</td><td></td></tr><tr><td>retained_profit</td><td>未分配利润</td><td>decimal(20,4)</td><td></td></tr><tr><td>minority_interests</td><td>少数股东权益</td><td>decimal(20,4)</td><td></td></tr><tr><td>currency_mis</td><td>外币报表折算差额</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_owner_equities</td><td>所有者权益合计</td><td>decimal(20,4)</td><td></td></tr><tr><td>total_liability_equity</td><td>负债和所有者权益总计</td><td>decimal(20,4)</td><td></td></tr><tr><td>perferred_share_liability</td><td>优先股-负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>account_receivable</td><td>应收账款</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_equity_tools</td><td>其他权益工具</td><td>decimal(20,4)</td><td></td></tr><tr><td>perferred_share_equity</td><td>优先股-权益</td><td>decimal(20,4)</td><td></td></tr><tr><td>pep_debt_equity</td><td>永续债-权益</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_comprehensive_income</td><td>其他综合收益</td><td>decimal(20,4)</td><td></td></tr><tr><td>good_will</td><td>商誉</td><td>decimal(20,4)</td><td></td></tr><tr><td>shortterm_loan_payable</td><td>应付短期融资款</td><td>decimal(20,4)</td><td></td></tr><tr><td>accounts_payable</td><td>应付账款</td><td>decimal(20,4)</td><td></td></tr><tr><td>contract_assets</td><td>合同资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>hold_sale_asset</td><td>持有待售资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>bond_invest</td><td>债权投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_bond_invest</td><td>其他债权投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_equity_tools_invest</td><td>其他权益工具投资</td><td>decimal(20,4)</td><td></td></tr><tr><td>contract_liability</td><td>合同负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>usufruct_assets</td><td>使用权资产</td><td>decimal(20,4)</td><td></td></tr><tr><td>liease_liability</td><td>租赁负债</td><td>decimal(20,4)</td><td></td></tr><tr><td>ordinary_risk_reserve_fund</td><td>一般风险准备</td><td>decimal(20,4)</td><td></td></tr><tr><td>other_operate_cash_paid</td><td>支付其他与经营活动有关的现金(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>subtotal_operate_cash_outflow</td><td>经营活动现金流出小计(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>net_operate_cash_flow</td><td>经营活动现金流量净额(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>invest_cash_flow</td><td>投资活动产生的现金流量(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>invest_withdrawal_cash</td><td>收回投资收到的现金(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>invest_proceeds</td><td>取得投资收益收到的现金(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>other_cash_from_invest_act</td><td>收到其他与投资活动有关的现金(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>gain_from_disposal</td><td>处置固定资产、无形资产和其他长期资产所收回的现金(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>subtotal_invest_cash_inflow</td><td>投资活动现金流入小计(元)</td><td>decimal(20, 4)</td><td></td></tr><tr><td>long_deferred_expense</td><td>长期待摊费用(元)</td><td>decimal(20, 4)</td><td></td></tr></tbody></table>

-   **报表来源编码**

    | 编码 | 名称 |
    | --- | --- |
    | 321001 | 招募说明书 |
    | 321002 | 上市公告书 |
    | 321003 | 定期报告 |
    | 321004 | 预披露公告 |
    | 321005 | 换股报告书 |
    | 321099 | 其他 |


<a id="业绩预告"></a>

#### 业绩预告

-   **更新时间：2005至今，每天20:30-24:00更新**

<a id="STK_FIN_FORCAST"></a>

### STK\_FIN\_FORCAST

**业绩预告 / 2005至今，交易日18:00-24:00更新**

```python
from jqdatasdk import finance
finance.run_query(query(finance.STK_FIN_FORCAST).filter(finance.STK_FIN_FORCAST.code==code).limit(n))
```

获取上市公司业绩预告等信息

**参数：**

-   **query(finance.STK\_FIN\_FORCAST)**：表示从finance.STK\_FIN\_FORCAST这张表中查询上市公司业绩报告的字段信息，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)

-   **finance.STK\_FIN\_FORCAST**：代表上市公司业绩预告表，收录了上市公司的业绩预告信息，表结构和字段信息如下：

    | 字段 | 名称 | 类型 | 注释 |
    | --- | --- | --- | --- |
    | company\_id | 公司ID | int |  |
    | code | 股票代码 | varchar(12) |  |
    | name | 公司名称 | varchar(64) |  |
    | end\_date | 报告期 | date |  |
    | report\_type\_id | 预告期类型编码 | int | 如下 预告期类型编码 |
    | report\_type | 预告期类型 | varchar(32) |  |
    | pub\_date | 公布日期 | date |  |
    | type\_id | 预告类型编码 | int | 如下 业绩类型编码 |
    | type | 预告类型 | varchar(32) |  |
    | profit\_min | 预告净利润（下限） | decimal(22,6) |  |
    | profit\_max | 预告净利润（上限） | decimal(22,6) |  |
    | profit\_last | 去年同期净利润 | decimal(22,6) |  |
    | profit\_ratio\_min | 预告净利润变动幅度(下限) | decimal(10,4) | 单位：% |
    | profit\_ratio\_max | 预告净利润变动幅度(上限) | decimal(10,4) | 单位：% |
    | content | 预告内容 | varchar(2048) |  |

    **预告期类型编码**

    | 预告期编码 | 预告期类型 |
    | --- | --- |
    | 304001 | 一季度预告 |
    | 304002 | 中报预告 |
    | 304003 | 三季度预告 |
    | 304004 | 四季度预告 |

    **业绩类型编码**


<table><tbody><tr><td><strong>业绩类型编码</strong></td><td>305001</td><td>305002</td><td>305003</td><td>305004</td><td>305005</td><td>305006</td><td>305007</td></tr><tr><td><strong>业绩类型</strong></td><td>业绩大幅上升</td><td>业绩预增</td><td>业绩预盈</td><td>预计扭亏</td><td>业绩持平</td><td>无大幅变动</td><td><p>业绩</p><p>预亏</p></td></tr><tr><td><strong>业绩类型编码</strong></td><td>305008</td><td>305009</td><td>305010</td><td>305011</td><td>305012</td><td>305013</td><td></td></tr><tr><td><strong>业绩类型</strong></td><td>业绩大幅下降</td><td>大幅减亏</td><td>业绩预降</td><td>预计减亏</td><td>不确定</td><td>取消预测</td><td></td></tr></tbody></table>

-   **filter(finance.STK\_FIN\_FORCAST.code==code)**：指定筛选条件，通过finance.STK\_FIN\_FORCAST.code==code可以指定你想要查询的股票代码；除此之外，还可以对表中其他字段指定筛选条件，如finance.STK\_FIN\_FORCAST.pub\_date>='2015-01-01'，表示公告日期在2015年1月1日之后发布的业绩预告；多个筛选条件用英文逗号分隔。

-   **limit(n)**：限制返回的数据条数，n指定返回条数。


**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是你所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询贵州茅台2015年之后公布的业绩预告信息
from jqdatasdk import finance 
q=query(finance.STK_FIN_FORCAST).filter(finance.STK_FIN_FORCAST.code=='600519.XSHG',finance.STK_FIN_FORCAST.pub_date>='2015-01-01')
df=finance.run_query(q)
print(df)

       id  company_id         code         name    end_date  report_type_id  \
0  581144   420600519  600519.XSHG  贵州茅台酒股份有限公司  2017-12-31          304004   
1  590510   420600519  600519.XSHG  贵州茅台酒股份有限公司  2018-12-31          304004   
2  592412   420600519  600519.XSHG  贵州茅台酒股份有限公司  2019-03-31          304001   
3  594174   420600519  600519.XSHG  贵州茅台酒股份有限公司  2019-06-30          304002   
4  598280   420600519  600519.XSHG  贵州茅台酒股份有限公司  2019-12-31          304004   
5  605646   420600519  600519.XSHG  贵州茅台酒股份有限公司  2020-12-31          304004   

  report_type    pub_date  type_id    type    profit_min    profit_max  \
0       四季度预告  2018-01-31   305001  业绩大幅上升           NaN           NaN   
1       四季度预告  2019-01-02   305002    业绩预增  3.400000e+10  3.400000e+10   
2       一季度预告  2019-04-05   305002    业绩预增           NaN           NaN   
3        中报预告  2019-07-13   305002    业绩预增  1.990000e+10  1.990000e+10   
4       四季度预告  2020-01-02   305002    业绩预增  4.050000e+10  4.050000e+10   
5       四季度预告  2021-01-04   305002    业绩预增  4.550000e+10  4.550000e+10   

    profit_last  profit_ratio_min  profit_ratio_max  \
0  1.671836e+10              58.0              58.0   
1  2.707936e+10              25.0              25.0   
2  8.506907e+09              30.0              30.0   
3  1.576419e+10              26.2              26.2   
4  3.520363e+10              15.0              15.0   
5  4.120647e+10              10.0              10.0   

                                             content  
0          预计公司2017年01-12月归属于上市公司股东的净利润与上年同期相比增长58%。  
1  预计公司2018年01-12月归属于上市公司股东的净利润为3400000万元，与上年同期相比...  
2          预计公司2019年01-03月归属于上市公司股东的净利润与上年同期相比增长30%。  
3  预计公司2019年01-06月归属于上市公司股东的净利润为1990000万元，与上年同期相比...  
4  预计公司2019年01-12月归属于上市公司股东的净利润为4050000万元，与上年同期相比...  
5  预计公司2020年01-12月归属于上市公司股东的净利润为4550000万元，与上年同期相比...  
```
