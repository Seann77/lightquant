---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 宏观数据
section_path:
  - JQData使用说明
  - 宏观数据
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#宏观数据"
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="宏观数据"></a>

## 宏观数据

-   **统计局统计开始至今，交易日盘前8：30之前更新**

方法（跳转链接） 描述（点击空白处显示具体内容）

数据调用方法 注意使用jqdatasdk，数据调用应该是from jqdatasdk import \*，而不是 from jqdata import \*

**数据调用方法**

```python
from jqdatasdk import macro
macro.run_query(query(macro.table_name).filter(macro.table_name.indicator==value).limit(n))
```

**参数**

-   **query(macro.table\_name)**：表示从macro.table\_name这张表中查询宏观经济数据，table\_name是所要查询的宏观经济分类表，如macro.MAC\_INDUSTRY\_ESTATE\_INVEST\_MONTH代表房地产开发投资情况表，更多表名点击[宏观经济数据分类](macrodata-a5578545.md#农业)查看。还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：sqlalchemy.orm.query.Query对象。
-   **filter(macro.table\_name.indicator==value)**:指定限制条件，macro.table\_name.indicator是具体表的字段名称，如macro.MAC\_INDUSTRY\_ESTATE\_INVEST\_MONTH.stat\_quarter==12代表取出房地产开发投资情况中统计季度等于第四季度的情况。
-   **limit(n)**:指定返回的数据条数。

**返回：** 返回一个 dataframe， 每一行对应数据库返回的每一行， 列索引是你所查询的字段

注意

1.  为了防止返回数据量过大, 我们每次最多返回5000行
2.  不能进行连表查询，即同时查询多张表内数据

**示例**

```python
# 查询分地区农林牧渔业总产值表(季度累计) 的前4条数据
q = query(macro.MAC_INDUSTRY_AREA_AGR_OUTPUT_VALUE_QUARTER
    ).limit(4)
df = macro.run_query(q)
print(df)

   id stat_quarter area_code area_name      total    farming  forestry  \
0   1      2015-06    350000       福建省  1240.1000   430.4000  101.2000
1   2      2014-09    350000       福建省  2027.9000   830.8000  155.2000
2   3      2015-03    350000       福建省   538.2000   148.2000   36.4000
3   4      2014-12    350000       福建省  3522.3053  1529.5705  323.2506

   animal_husbandry    fishery
0          237.7000   417.6000
1          368.4000   591.2000
2          127.6000   197.9000
3          522.8944  1025.1946
```

```python
# 查询2014年的分地区农林牧渔业总产值表(年度)
q = query(macro.MAC_INDUSTRY_AREA_AGR_OUTPUT_VALUE_YEAR
        ).filter(macro.MAC_INDUSTRY_AREA_AGR_OUTPUT_VALUE_YEAR.stat_year=='2014')
df = macro.run_query(q)
print(df[:4])

    id stat_year area_code area_name      total    farming  forestry  \
0  104      2014    110000       北京市   420.0672   155.1015   90.6852
1  214      2014    120000       天津市   367.7488   182.2270    3.2204
2  264      2014    130000       河北省  5373.7637  2893.2898  118.4668
3  164      2014    140000       山西省  1440.5971   872.5551   92.4834

   animal_husbandry   fishery  total_idx  farming_idx  forestry_idx  \
0          152.6590   13.2024    99.9874      91.3496      119.5023
1          102.7424   68.8678   102.9743     103.3167      103.5446
2         1895.9047  175.8537   104.0124     103.1439      108.9083
3          384.0043    7.9749   104.0256     103.2592      102.3852

   animal_husbandry_idx  fishery_idx
0               99.2970     105.1272
1              102.8987     102.1849
2              105.0522     103.2209
3              105.6783     109.1235
```

[农业](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E5%86%9C%E4%B8%9A)

分地区农林牧渔业总产值表(季度累计) 表名：MAC\_INDUSTRY\_AREA\_AGR\_OUTPUT\_VALUE\_QUARTER

分地区农林牧渔业总产值表(年度) 表名：MAC\_INDUSTRY\_AREA\_AGR\_OUTPUT\_VALUE\_YEAR

全国农产品生产价格指数表(季度) 表名：MAC\_INDUSTRY\_AGR\_PRODUCT\_IDX\_QUARTER

[国内贸易](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E5%9B%BD%E5%86%85%E8%B4%B8%E6%98%93)

社会消费品销售总额（月度） 表名：MAC\_SALE\_RETAIL\_MONTH

限额以上零售分类表（月度） 表名： MAC\_SALE\_SCALE\_RETAIL\_MONTH

分地区消费品零售总额（年度） 表名：MAC\_AREA\_RETAIL\_SALE

亿元以上商品交易市场基本情况（年度） 表名：MAC\_SALE\_MARKET

分地区亿元以上商品交易市场基本情况（年度） 表名：MAC\_AREA\_SALE\_MARKET

[就业与工资](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E5%B0%B1%E4%B8%9A%E4%B8%8E%E5%B7%A5%E8%B5%84)

分地区城镇登记失业率（年度） 表名：MAC\_AREA\_UNEMPLOY

就业情况基本表(年度) 表名：MAC\_EMPLOY\_YEAR

分地区城镇单位就业人员情况表(年度) 表名：MAC\_AREA\_WAGEIDX\_YEAR

分地区分行业城镇单位就业人员工资情况表(年度) 表名：MAC\_AREA\_INDUSTRY\_WAGE\_YEAR

分行业城镇单位就业人员工资情况表(年度) 表名：MAC\_INDUSTRY\_WAGE\_YEAR

分地区按注册类型分城镇单位就业人员工资情况表(年度) 表名：MAC\_AREA\_REGISTERED\_WAGE\_YEAR

分地区按行业分城镇单位就业人员情况表（年度） 表名：MAC\_AREA\_INDUSTRY\_EMPLOY\_YEAR

[资源环境](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E8%B5%84%E6%BA%90%E7%8E%AF%E5%A2%83)

各地区森林资源情况表（年度） 表名：MAC\_RESOURCES\_AREA\_FOREST

生态环境情况信息表（年度） 表名：MAC\_RESOURCES\_ECOLOGICAL\_ENVIRONMENT

水资源情况表（年度） 表名：MAC\_RESOURCES\_AREA\_WATER\_RESOURCES

全国水资源量年度信息表（年度） 表名：MAC\_RESOURCES\_WATER\_RESOURCES\_YEAR

各地区供水用水情况表（年度） 表名：MAC\_RESOURCES\_AREA\_WATER\_SUPPLY\_USE

供水用水情况表（年度） 表名：MAC\_RESOURCES\_WATER\_SUPPLY\_USE\_YEAR

水环境情况信息表（年度） 表名：MAC\_RESOURCES\_WATER\_ENVIRONMENT

各地区废气排放及处理情况表（年度） 表名：MAC\_RESOURCES\_AREA\_WASTE\_GAS\_EMISSION

自然灾害情况信息表（年度） 表名：MAC\_RESOURCES\_NATURAL\_DISASTER

环境污染治理投资情况信息表（年度） 表名：MAC\_RESOURCES\_ENVIRONMENT\_TREAT\_INVEST

[房地产行业](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E6%88%BF%E5%9C%B0%E4%BA%A7%E8%A1%8C%E4%B8%9A)

房地产开发投资情况表(月度累计) 表名：MAC\_INDUSTRY\_ESTATE\_INVEST\_MONTH

分地区房地产开发投资情况表(月度累计) 表名：MAC\_INDUSTRY\_AREA\_ESTATE\_INVEST\_MONTH

房地产开发投资资金来源情况表(月度累计) 表名：MAC\_INDUSTRY\_ESTATE\_FUND\_SOURCE\_MONTH

各地区房地产开发规模与开、竣工面积增长情况表(月度累计) 表名：MAC\_INDUSTRY\_AREA\_ESTATE\_BUILD\_MONTH

70个大中城市房屋销售价格指数(月度) 表名：MAC\_INDUSTRY\_ESTATE\_70CITY\_INDEX\_MONTH

[金融业](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E9%87%91%E8%9E%8D%E4%B8%9A)

人民币外汇牌价(日级) 表名：MAC\_RMB\_EXCHANGE\_RATE

银行间拆借利率表（日级） 表名：MAC\_LEND\_RATE

金融机构人民币信贷资金平衡表（年度） 表名：MAC\_CREDIT\_BALANCE\_YEAR

货币供应量(月度) 表名：MAC\_MONEY\_SUPPLY\_MONTH

货币供应量(年度) 表名：MAC\_MONEY\_SUPPLY\_YEAR

货币当局资产负债表（年度） 表名：MAC\_CURRENCY\_STATE\_YEAR

其他存款性公司资产负债表（年度） 表名：MAC\_OTHER\_DEPOSIT

社会融资规模及构成（年度） 表名：MAC\_SOCIAL\_SCALE\_FINANCE

证券市场基本情况（年度） 表名：MAC\_STK\_MARKET

黄金和外汇储备（月度） 表名：MAC\_GOLD\_FOREIGN\_RESERVE

股票发行量和筹资额（年度） 表名：MAC\_STK\_ISSUE

股票市场统计表（年度） 表名：MAC\_STK\_TRADE

[财政政策](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E8%B4%A2%E6%94%BF%E6%94%BF%E7%AD%96)

**数据调用方法**

国家财政收支总额及增长速度表（年度） 表名：MAC\_FISCAL\_TOTAL\_YEAR

中央财政与地方财政收支及比重表（年度） 表名：MAC\_FISCAL\_BALANCE\_YEAR

中央和地方财政主要收入项目情况表(年度) 表名：MAC\_FISCAL\_CENTRAL\_REVENUE\_YEAR

中央和地方财政主要支出项目情况表(年度) 表名：MAC\_FISCAL\_CENTRAL\_EXPENSE\_YEAR

各项税收表（年度） 表名：MAC\_FISCAL\_TAX\_YEAR

预算外资金分项目收支表（年度） 表名：MAC\_FISCAL\_EXTRA\_REVENUE\_EXPENSE\_YEAR

中央财政与地方财政预算外收支表（年度） 表名：MAC\_FISCAL\_EXTRAL\_BALANCE\_YEAR

外债余额表（年度） 表名：MAC\_FISCAL\_EXTERNAL\_DEBT\_YEAR

外债风险指标表（年度） 表名：MAC\_FISCAL\_RISK\_INDICATOR\_YEAR

各地区财政收入表（年度） 表名：MAC\_AREA\_FISCAL\_REVENUE\_YEAR

各地区财政支出表（年度） 表名：MAC\_AREA\_FISCAL\_EXPENSE\_YEAR

[固定资产投资](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E5%9B%BA%E5%AE%9A%E8%B5%84%E4%BA%A7%E6%8A%95%E8%B5%84)

固定资产投资情况（月度） 表名：MAC\_FIXED\_INVESTMENT

分地区固定资产投资情况（月度） 表名：MAC\_AREA\_FIXED\_INVESTMENT

分行业固定资产投资情况（月度） 表名：MAC\_INDUSTRY\_FIXED\_INVEST

按注册类型登记分固定资产投资（月度） 表名：MAC\_REGISTERED\_FIXED\_INVESTMENT

固定资产投资情况表(年度) 表名：MAC\_FIXED\_INVESTMENT\_YEAR

[对外贸易](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E5%AF%B9%E5%A4%96%E8%B4%B8%E6%98%93)

货物进出口总额表（年度） 表名：MAC\_TRADE\_VALUE\_YEAR

海关进出口货物分类金额表（年度） 表名：MAC\_TRADE\_VALUE\_SITC\_YEAR

地区按经营单位所在地分货物进出口总额表（年度） 表名：MAC\_TRADE\_VALUE\_LOCATION\_YEAR

各地区按境内目的地和货源地分货物进出口总额表（年度） 表名：MAC\_TRADE\_VALUE\_DESTINATION\_YEAR

利用外资情况表（月度） 表名：MAC\_FOREIGN\_CAPITAL\_MONTH

利用外资概况表（年度） 表名：MAC\_FOREIGN\_CAPITAL\_YEAR

按行业分对外直接投资情况表（年度） 表名：MAC\_INDUSTRY\_OFDI\_YEAR

分国别对外外直接投资情况表（年度） 表名：MAC\_NATION\_OFDI

分地区外商投资企业年底注册登记情况表（年度） 表名：MAC\_AREA\_FOREIGN\_REGISTER

按行业分外商投资企业年底注册登记情况表（年度） 表名：MAC\_INDUSTRY\_FOREIGN\_REGISTER

对外经济合作表（年度） 表名：MAC\_FOREIGN\_COOPERATE\_YEAR

按国别对外经济合作表（年度） 表名：MAC\_NATION\_COOPERATE\_YEAR

[景气指数](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E6%99%AF%E6%B0%94%E6%8C%87%E6%95%B0)

宏观经济景气指数（月度） 表名：MAC\_ECONOMIC\_BOOM\_IDX

消费者景气指数（月度） 表名：MAC\_CONSUMER\_BOOM\_IDX

宏观经济景气预警指数（月度） 表名：MAC\_BOOM\_WARNING\_IDX

企业景气及企业家信心指数（季度） 表名：MAC\_ENTERPRISE\_BOOM\_CONFIDENCE\_IDX

制造业采购经理指数（月度） 表名：MAC\_MANUFACTURING\_PMI

非制造业采购经理指数（月度） 表名：MAC\_NONMANUFACTURING\_PMI

分地区居民消费价格指数（月度） 表名：MAC\_AREA\_CPI\_MONTH

全国居民消费价格指数（月度） 表名：MAC\_CPI\_MONTH

[工业](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E5%B7%A5%E4%B8%9A)

全国工业增长速度（月度） 表名：MAC\_INDUSTRY\_GROWTH

全国工业分行业增长速度（月度） 表名：MAC\_INDUSTRY\_CATEGORY\_GROWTH

全国工业企业主要经济指标（月度） 表名：MAC\_INDUSTRY\_INDICATOR

[保险业](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E4%BF%9D%E9%99%A9%E4%B8%9A)

全国各地区保险业务统计表(年度) 表名：MAC\_INSURANCE\_AREA\_YEAR

保险公司保费金额表(年度) 表名：MAC\_INSURANCE\_PREMIUM\_YEAR

保险公司赔款及给付表(年度) 表名：MAC\_INSURANCE\_PAYMENT\_YEAR

保险公司资产情况（年度） 表名：MAC\_INSURANCE\_ASSETS\_YEAR

保险公司原保费收入和赔付支出情况（年度） 表名：MAC\_INSURANCE\_REVENUE\_EXPENSE\_YEAR

[国民经济](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E5%9B%BD%E6%B0%91%E7%BB%8F%E6%B5%8E)

全国各地区的行政划分（年度） 表名：MAC\_AREA\_DIV

分地区国内生产总值表(季度) 表名：MAC\_AREA\_GDP\_QUARTER

分地区国内生产总值表(年度) 表名：MAC\_AREA\_GDP\_YEAR

分地区国内生产总值指数表(上年=100，年度) 表名：MAC\_AREA\_GDP\_YEAR\_IDX

分地区国内生产总值指数表（年度） 表名：MAC\_AREA\_GDP\_YEAR\_IDX\_1978

分地区支出法国内生产总值表(年度) 表名：MAC\_AREA\_GDP\_EXPEND\_YEAR

分地区收入法国内生产总值表(年度) 表名：MAC\_AREA\_GDP\_INCOME\_YEAR

国家统计局发布经济信息的日程表（年度） 表名：MAC\_STATS\_REPORT\_CALENDAR

[人民生活](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E4%BA%BA%E6%B0%91%E7%94%9F%E6%B4%BB)

各地区居民消费水平表(年度) 表名：MAC\_AREA\_CONSUME\_YEAR

居民人均收入支出表(年度) 表名：MAC\_REVENUE\_EXPENSE\_YEAR

城乡居民家庭人均收入及恩格尔系数(年度) 表名：MAC\_ENGEL\_COEFFICIENT\_YEAR

城乡居民人民币储蓄存款表(年度) 表名：MAC\_RESIDENT\_SAVING\_DEPOSIT\_YEAR

分地区城镇居民家庭平均每人全年收入来源表(年度) 表名：MAC\_AREA\_URBAN\_INCOME\_YEAR

分地区城镇及农村居民家庭平均每人全年消费性支出表(年度) 表名：MAC\_AREA\_URBAN\_RURAL\_EXPENSE\_YEAR

农村居民家庭平均每人纯收入(年度) 表名：MAC\_RURAL\_NET\_INCOME\_YEAR

各地区按来源分农村居民家庭人均纯收入(年度) 表名：MAC\_AREA\_RURAL\_NET\_INCOME\_YEAR

分地区农村居民家庭住房情况表(年度) 表名：MAC\_AREA\_RURAL\_HOUSE\_YEAR

[人口信息](https://www.joinquant.com/help/api/help?name=faq#macroData%3A%E4%BA%BA%E5%8F%A3%E4%BF%A1%E6%81%AF)

人口基本情况表(年度)： 表名：MAC\_POPULATION\_YEAR

各地区人口平均预期寿命表（年度） 表名：MAC\_LIFE\_EXPECT

按年龄和性别分人口数表（年度） 表名：MAC\_POPULATION\_AGE

各地区户数、人口数、性别比和户规模表（年度） 表名：MAC\_AREA\_HOUSEHOLD\_SIZE

户口登记状况（年度） 表名：MAC\_AREA\_HOUSEHOLD\_REGISTER

各地区人口年龄结构和抚养比例表（年度） 表名：MAC\_AREA\_POP\_DEPENDENCY

各地区按性别和婚姻状况分的人口表（年度） 表名：MAC\_AREA\_POP\_MARITAL

各地区按性别和受教育程度分人口情况表（年度） 表名：MAC\_AREA\_POP\_EDUCATION

各地区按性别分的15岁及以上文盲人口表（年度） 表名：MAC\_AREA\_POP\_ILLITERATE

各地区按家庭户规模分的户数表（年度） 表名：MAC\_AREA\_FAMILY\_HOUSEHOLD

育龄妇女分年龄生育状况表（年度） 表名：MAC\_POP\_FERTILITY\_RATE

人口年龄结构和抚养比例表（年度） 表名：MAC\_POPULATION\_DEPENDENCY
