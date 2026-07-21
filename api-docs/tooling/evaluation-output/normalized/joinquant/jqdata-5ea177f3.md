---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 财务数据
section_path:
  - JQData使用说明
  - 财务数据
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#财务数据"
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

<a id="财务数据"></a>

## 财务数据

<a id="单季度年度财务数据"></a>

### 单季度/年度财务数据

<a id="查询方法（含新接口）"></a>

#### 查询方法（含新接口）

<a id="get_fundamentals"></a>

### get\_fundamentals

**查询财务数据(附综合案例)**

```python
get_fundamentals(query_object, date=None, statDate=None)
```

查询财务数据，详细的数据字段描述请点击[财务数据文档](https://www.joinquant.com/help/api/help?name=JQData#%E8%B4%A2%E5%8A%A1%E6%95%B0%E6%8D%AE%E5%88%97%E8%A1%A8)查看

date和statDate参数只能传入一个:

-   传入date时, 查询**指定日期date收盘后所能看到的最近(对市值表来说, 最近一天, 对其他表来说, 最近一个季度)的数据**, 我们会查找上市公司在这个日期之前(包括此日期)发布的数据, 不会有未来函数.
-   传入statDate时, 查询 **statDate 指定的季度或者年份的财务数据**. **注意:**

1.  由于公司发布财报不及时, 一般是看不到当季度或年份的财务报表的, 回测中使用这个数据可能会有未来函数, 请注意规避.
2.  由于估值表每天更新, 当按季度或者年份查询时, 返回季度或者年份最后一天的数据
3.  由于“资产负债数据”这个表是存量性质的， 查询年度数据是返回第四季度的数据。
4.  银行业、券商、保险专项数据只有年报数据，需传入statDate参数，当传入 date 参数 或 statDate 传入季度时返回空，请自行避免未来函数。

当 date 和 statDate 都不传入时, 相当于使用 date 参数, date 的默认值下面会描述.

**参数**

-   query\_object: 一个sqlalchemy.orm.query.Query对象，可以通过全局的 query 函数获取 Query 对象，[query简易教程](https://www.joinquant.com/view/community/detail/16411)

-   date: 查询日期, 一个字符串(格式类似'2015-10-15')或者\[datetime.date\]/\[datetime.datetime\]对象, 可以是None, 使用默认日期. 如果传入的 date 不是交易日, 则使用这个日期之前的最近的一个交易日

-   statDate: 财报统计的季度或者年份, 一个字符串, 有两种格式:


1.  季度: 格式是: **年 + 'q' + 季度序号**, 例如: '2015q1', '2013q4'.
2.  年份: 格式就是年份的数字, 例如: '2015', '2016'.

**返回**

返回一个 \[pandas.DataFrame\], 每一行对应数据库返回的每一行(可能是几个表的联合查询结果的一行), 列索引是你查询的所有字段 注意：

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  当相关股票上市前、退市后，财务数据返回各字段为空

**综合案例**

**获取多只股票在某一天的指标数据**

```python
# 获取多只股票在某一日期的市值, 利润
df = get_fundamentals(query(
        valuation, income
    ).filter(
        # 这里不能使用 in 操作, 要使用in_()函数
        valuation.code.in_(['000001.XSHE', '600000.XSHG'])
    ), date='2015-10-15')
print(df)

        id         code  pe_ratio  turnover_ratio  pb_ratio  ps_ratio  \
0  5024884  000001.XSHE    7.4984          0.4116    1.0593    1.8748   
1  5031852  600000.XSHG    6.1440          0.0000    1.1596    2.1996   

   pcf_ratio  capitalization  market_cap  circulating_cap         ...          \
0     1.0246     1430867.625   1598.2791      1180405.500         ...           
1     8.1501     1865347.125   2965.9021      1865347.125         ...           

   income_tax_expense    net_profit  np_parent_company_owners  \
0        1.866000e+09  5.956000e+09              5.956000e+09   
1        3.915000e+09  1.281700e+10              1.270900e+10   

   minority_profit basic_eps diluted_eps other_composite_income  \
0              0.0     0.430       0.430           2.680000e+08   
1      108000000.0     0.681       0.681           1.614000e+09   

  total_composite_income  ci_parent_company_owners  ci_minority_owners  
0           6.224000e+09                       NaN                 0.0  
1           1.443100e+10                       NaN         108000000.0  

[2 rows x 56 columns]
```

**根据条件，筛选数据**

```python
# 选出所有的总市值大于1000亿元, 市盈率小于10, 基本每股收益大于0.8的股票
df = get_fundamentals(query(
        valuation.code, valuation.market_cap, valuation.pe_ratio, income.basic_eps ,income.total_operating_revenue
    ).filter(

        valuation.market_cap > 1000,
        valuation.pe_ratio < 10,
         income.basic_eps  > 0.8
    ).order_by(
        # 按市值降序排列
        valuation.market_cap.desc()
   ))
print(df)

          code  market_cap  pe_ratio  basic_eps  total_operating_revenue
0  601166.XSHG   4908.9414    7.3679       0.92             5.176600e+10
1  600585.XSHG   2754.5774    7.8412       1.63             4.997668e+10
```

**使用or\_函数,筛选数据**

```python
# 使用 or_ 函数: 查询总市值大于1000亿元 或者 市盈率小于10的股票 或者 基本每股收益大于0.5
from sqlalchemy.sql.expression import or_
df=get_fundamentals(query(
        valuation.code,valuation.pe_ratio,valuation.market_cap,income.basic_eps ,income.total_operating_revenue
    ).filter(
        or_(
            valuation.market_cap > 1000,
            valuation.pe_ratio < 10,
            income.basic_eps > 0.5          
        )
    ).order_by(
        # 按市值降序排列
        valuation.market_cap.desc()))
print(df[:5])

          code  pe_ratio  market_cap  basic_eps  total_operating_revenue
0  600519.XSHG   56.0766  24998.2109       8.94             2.394051e+10
1  601398.XSHG    6.6798  19317.2188       0.22             2.172370e+11
2  601939.XSHG    7.4127  18325.8047       0.27             1.823260e+11
3  601318.XSHG   10.1966  14591.2891       2.27             3.012450e+11
4  600036.XSHG   13.9336  13563.2334       0.77             6.905200e+10
```

**查询季报, 放到数组中**

```python
# 查询平安银行2014年四个季度的季报, 放到数组中
q = query(
        income.statDate,
        income.code,
        income.basic_eps,
        balance.cash_equivalents,
        cash_flow.goods_sale_and_service_render_cash
    ).filter(
        income.code == '000001.XSHE',
    )

rets = [get_fundamentals(q, statDate='2018q'+str(i)) for i in range(1, 5)]
print(rets)

[     statDate         code  basic_eps  cash_equivalents  \
0  2018-03-31  000001.XSHE       0.33      2.819490e+11   

   goods_sale_and_service_render_cash  
0                                 NaN  ,      statDate         code  basic_eps  cash_equivalents  \
0  2018-06-30  000001.XSHE        0.4      3.074000e+11   

   goods_sale_and_service_render_cash  
0                                 NaN  ,      statDate         code  basic_eps  cash_equivalents  \
0  2018-09-30  000001.XSHE       0.41      2.876480e+11   

   goods_sale_and_service_render_cash  
0                                 NaN  ,      statDate         code  basic_eps  cash_equivalents  \
0  2018-12-31  000001.XSHE       0.25      2.785280e+11   

   goods_sale_and_service_render_cash  
0                                 NaN  ]
```

**查询年报**

```python
# 查询平安银行2018年的年报
q = query(
        income.statDate,
        income.code,
        income.basic_eps,
        cash_flow.goods_sale_and_service_render_cash
    ).filter(
        income.code == '000001.XSHE',
    )

ret = get_fundamentals(q, statDate='2018')
print(ret)

     statDate         code  basic_eps  goods_sale_and_service_render_cash
0  2018-12-31  000001.XSHE       1.39                                 NaN
```

<a id="get_fundamentals_continuously"></a>

### get\_fundamentals\_continuously

**多日财务数据**

```python
get_fundamentals_continuously(query_object, end_date=None,count=1，panel=True)
```

查询财务数据，详细的数据字段描述请点击[财务数据文档](https://www.joinquant.com/data/dict/fundamentals)查看

**参数**

-   query\_object: 一个sqlalchemy.orm.query.Query对象，可以通过全局的 query 函数获取 Query 对象，[query简易教程](https://www.joinquant.com/view/community/detail/16411)。
-   end\_date: 查询日期, 一个字符串(格式类似'2015-10-15')或者\[datetime.date\]/\[datetime.datetime\]对象, 可以是None, 如果传入的 date 不是交易日, 则使用这个日期之前的最近的一个交易日
-   count: 获取 end\_date 前 count 个日期的数据

**返回** 返回一个 \[pandas.Panel\]，如果您的环境pandas大于0.25 ，将强制返回dataframe。

**出于性能方面考虑，我们做出了返回总条数不超过5000条的限制。 也就是说：查询的股票数量\*count 要小于5000。 否则，返回的数据会不完整。**

**示例**

```python
q = query(valuation.turnover_ratio,
              valuation.market_cap,
              indicator.eps
            ).filter(valuation.code.in_(['000001.XSHE', '600000.XSHG']))
df = get_fundamentals_continuously(q, end_date='2017-12-25', count=5,panel=False)[:5]
print(df)

# 输出
          day         code  turnover_ratio  market_cap   eps
0  2017-12-19  000001.XSHE          1.4174   2280.2307  0.38
1  2017-12-20  000001.XSHE          0.6539   2276.7964  0.38
2  2017-12-21  000001.XSHE          0.8779   2324.8738  0.38
3  2017-12-22  000001.XSHE          0.4391   2321.4397  0.38
4  2017-12-25  000001.XSHE          0.9372   2275.0796  0.38
```

<a id="get_valuation"></a>

### ⭐ get\_valuation

**获取多个标的在指定交易日范围内的市值表数据**

```python
from jqdatasdk import *
get_valuation(security, start_date=None, end_date=None, fields=None, count=None)
```

获取多个标的在指定交易日范围内的市值表数据

##### **参数**

-   security: 标的code字符串列表或者单个标的字符串
-   end\_date: 查询结束时间
-   start\_date: 查询开始时间，不能与count共用
-   count: 表示往前查询每一个标的count个交易日的数据，如果期间标的停牌，则该标的返回的市值数据数量小于count
-   fields: 财务数据中市值表的字段，返回结果中总会包含code、day字段，可用字段如下： |code| 股票代码 带后缀.XSHE/.XSHG| |day |日期 取数据的日期| | capitalization |总股本(万股)| |circulating\_cap| 流通股本(万股)| |market\_cap |总市值(亿元)| |circulating\_market\_cap| 流通市值(亿元)| |turnover\_ratio |换手率(%)| |pe\_ratio |市盈率(PE, TTM)| |pe\_ratio\_lyr |市盈率(PE)| |pb\_ratio |市净率(PB)| | ps\_ratio| 市销率(PS, TTM)| |pcf\_ratio| 市现率(PCF, 现金净流量TTM)|

<a id="-1"></a>

##### **返回值**

-   返回一个dataframe，索引默认是pandas的整数索引，返回的结果中总会包含code、day字段。

<a id="-2"></a>

#### **注意**

-   每次最多返回5000条数据，更多数据需要根据标的或者时间分多次获取

<a id="prec0cpre"></a>

##### **示例**

```python
from jqdatasdk import *
# 传入单个标的
df1 = get_valuation('000001.XSHE', end_date="2019-11-18", count=3, fields=['capitalization', 'market_cap'])
print(df1)

# 传入多个标的
df2 = get_valuation(['000001.XSHE', '000002.XSHE'], end_date="2019-11-18", count=3, fields=['capitalization', 'market_cap'])
print(df2)
```

<a id="get_history_fundamentals"></a>

### ⭐ get\_history\_fundamentals

**获取多个季度/年度的历史财务数据**

获取多个季度/年度的三大财务报表和财务指标数据. 可指定单季度数据, 也可以指定年度数据。可以指定观察日期, 也可以指定最后一个报告期的结束日期

```python
get_history_fundamentals(security, fields, watch_date=None, stat_date=None, count=1, interval='1q', stat_by_year=False)
```

##### **参数**

-   security：股票代码或者股票代码列表。
-   fields：要查询的财务数据的列表, 季度数据和年度数据可选择的列不同。示例：
    \[balance.cash\_equivalents, cash\_flow.net\_deposit\_increase, income.total\_operating\_revenue\]
-   watch\_date：观察日期, 如果指定, 将返回 watch\_date 日期前(包含该日期)发布的报表数据
-   stat\_date：统计日期, 可以是 '2019'/'2019q1'/'2018q4' 格式, 如果指定, 将返回 stat\_date 对应报告期及之前的历史报告期的报表数据
    -   watch\_date 和 stat\_date 只能指定一个, 而且必须指定一个
    -   如果没有 stat\_date 指定报告期的数据, 则该数据会缺失一行.
-   count：查询历史的多个报告期时, 指定的报告期数量. 如果股票历史报告期的数量小于 count, 则该股票返回的数据行数将小于 count
-   interval：查询多个报告期数据时, 指定报告期间隔, 可选值: '1q'/'1y', 表示间隔一季度或者一年, 举例说明:
    -   stat\_date='2019q1', interval='1q', count=4, 将返回 2018q2,2018q3,2018q4,2019q1 的数据
    -   stat\_date='2019q1', interval='1y', count=4, 将返回 2016q1,2017q1,2018q1,2019q1 的数据
    -   stat\_by\_year=True, stat\_date='2018', interval='1y', count=4 将返回 2015/2016/2017/2018 年度的年报数据
-   stat\_by\_year：bool, 是否返回年度数据. 默认返回的按季度统计的数据(比如income表中只有单个季度的利润).
    -   如果是True：
        -   interval必须是 '1y'
        -   如果指定了 stat\_date 的话, stat\_date 必须是一个代表年份整数、字符串, 表明统计的年份，比如2019, "2019"。但不能是"20191q"这种格式。
        -   fields 可以选择 balance/income/cash\_flow/indicator/bank\_indicator/security\_indicator/insurance\_indicator 表中的列
    -   如果是False：
        fields只能选择balance/income/cash\_flow/indicator 表中的列

<a id="-1"></a>

##### **返回值**

pandas.DataFrame, 数据库查询结果. 数据格式同 get\_fundamentals. 每个股票每个报告期(一季度或者一年)的数据占用一行.

<a id="-2"></a>

##### **注意**

-   不支持valuation市值表
-   推荐用户对结果使用pandas的[groupby](https://pandas.pydata.org/pandas-docs/version/0.22/generated/pandas.DataFrame.groupby.html)方法来进行分组分析数据
-   每次最多返回50000条数据，更多数据需要根据标的或者时间分多次获取

<a id="prec0cpre"></a>

##### **示例**

```sql
from jqdatasdk import *
security = ['000001.XSHE', '600000.XSHG']
df = get_history_fundamentals(security, fields=[balance.cash_equivalents, 
        cash_flow.net_deposit_increase, income.total_operating_revenue], 
        watch_date=None, stat_date='2019q1', count=5, interval='1q', stat_by_year=False)
print(df)
print(df.groupby('code').mean())
```

<a id="财务及估值数据"></a>

#### 财务及估值数据

-   **更新时间：2005至今， 每天24:00更新**

<a id="valuation"></a>

### valuation

**估值数据（市值、市盈率、市净率等） / 2005至今，每天24:00更新**

```python
get_fundamentals(query_object, date=None, statDate=None)
```

市值数据每天更新，可以使用get\_fundamentals(query(valuation),date),指定date为某一交易日,获取该交易日的估值数据。查询方法详见[get\_fundamentals()接口说明](https://www.joinquant.com/help/api/help?name=JQData#get_fundamentals-%E6%9F%A5%E8%AF%A2%E8%B4%A2%E5%8A%A1%E6%95%B0%E6%8D%AE)

**注意**： （详细内容可看get\_fundamentals接口）

-   date和statDate参数只能传入一个:
-   传入date时, 查询指定日期date收盘后所能看到的最近(对市值表来说, 最近一天, 对其他表来说, 最近一个季度)的数据
-   statDate: 财报统计的季度或者年份,。 季度: 格式是**年 + 'q' + 季度序号**, 例如: **'2015q1', '2013q4'**. 年份: 格式就是**年份的数字**, 例如:**'2015', '2016'**.

**表名: valuation**

| 列名 | 列的含义 | 解释 | 公式 |
| --- | --- | --- | --- |
| code | 股票代码 | 带后缀.XSHE/.XSHG |  |
| day | 日期 | 取数据的日期 |  |
| capitalization | 总股本(万股) | 公司已发行的普通股股份总数(包含A股，B股和H股的总股本) |  |
| circulating\_cap | 流通股本(万股) | 公司已发行的境内上市流通、以人民币兑换的股份总数(A股市场的流通股本) |  |
| market\_cap | 总市值(亿元) | A股收盘价\*已发行股票总股本（A股+B股+H股） |  |
| circulating\_market\_cap | 流通市值(亿元) | 流通市值指在某特定时间内当时可交易的流通股股数乘以当时股价得出的流通股票总价值。 | A股市场的收盘价\*A股市场的流通股数 |
| turnover\_ratio | 换手率(%) | 指在一定时间内市场中股票转手买卖的频率，是反映股票流通性强弱的指标之一。 | 换手率=\[指定交易日成交量(手)*100/截至该日股票流通股本(股)\]*100% |
| pe\_ratio | 市盈率(PE, TTM) | 每股市价为每股收益的倍数，反映投资人对每元净利润所愿支付的价格，用来估计股票的投资报酬和风险 | 市盈率（PE，TTM）=（股票在指定交易日期的收盘价 \* 当日人民币外汇挂牌价\* 截止当日公司总股本）/归属于母公司股东的净利润TTM。 |
| pe\_ratio\_lyr | 市盈率(PE) | 以上一年度每股盈利计算的静态市盈率. 股价/最近年度报告EPS | 市盈率（PE）=（股票在指定交易日期的收盘价 \* 当日人民币外汇牌价 \* 截至当日公司总股本）/归属母公司股东的净利润。 |
| pb\_ratio | 市净率(PB) | 每股股价与每股净资产的比率 | 市净率=（股票在指定交易日期的收盘价 \* 截至当日公司总股本）/(归属母公司股东的权益MRQ-其他权益工具)。 |
| ps\_ratio | 市销率(PS, TTM) | 市销率为股票价格与每股销售收入之比，市销率越小，通常被认为投资价值越高。 | 市销率TTM=（股票在指定交易日期的收盘价 \* 当日人民币外汇牌价 \* 截至当日公司总股本）/营业总收入TTM |
| pcf\_ratio | 市现率(PCF, 现金净流量TTM) | 每股市价为每股现金净流量的倍数 | 市现率=（股票在指定交易日期的收盘价 \* 当日人民币外汇牌价 \* 截至当日公司总股本）/现金及现金等价物净增加额TTM |

**获取最近日期所有股票的市值数据**

```python
# 获取最近日期的市值数据
df=get_fundamentals(query(valuation))
print(df[:4])

         id         code  pe_ratio  turnover_ratio  pb_ratio  ps_ratio  \
0  64650881  000001.XSHE   14.4095             NaN    1.4169    2.7148   
1  64649277  000002.XSHE    9.0344             NaN    1.8051    0.9491   
2  64649388  000004.XSHE   40.2554             NaN    1.9572   19.2944   
3  64649010  000005.XSHE   22.7056             NaN    1.4351   11.5734   

   pcf_ratio  capitalization  market_cap  circulating_cap  \
0     4.1729    1.940592e+06   4168.3911     1.940576e+06   
1     5.1463    1.161773e+06   3658.4238     9.714315e+05   
2    26.1566    1.650526e+04     28.3725     1.151256e+04   
3 -8155.7451    1.058537e+05     23.2878     1.057946e+05   

   circulating_market_cap         day  pe_ratio_lyr  
0               4168.3560  2021-03-14       14.4095  
1               3059.0378  2021-03-14        9.4114  
2                 19.7901  2021-03-14      915.4301  
3                 23.2748  2021-03-14       13.3311  
```

**获取某一天所有的市值数据**

```python
# 获取“2021-01-05”所有的市值数据
get_fundamentals(query(valuation),date="2021-01-05")[:4]
```

**获取某只股票在某天的市值数据**

```python
# 查询'000001.XSHE'的所有市值数据, 时间是2015-10-15
q = query(
    valuation
).filter(
    valuation.code == '000001.XSHE'
)
df = get_fundamentals(q, '2015-10-15')
# 打印出总市值
print(df['market_cap'][0])
```

<a id="indicator"></a>

### indicator

**财务指标数据 / 2005至今，每天24:00更新**

按季度更新, 统计周期是一季度。可以使用**get\_fundamentals(query\_object, date=None, statDate=None)**查询，查询方法详见[get\_fundamentals()接口说明](https://www.joinquant.com/help/api/help?name=JQData#get_fundamentals-%E6%9F%A5%E8%AF%A2%E8%B4%A2%E5%8A%A1%E6%95%B0%E6%8D%AE)

**注意**： （详细内容可看get\_fundamentals接口）

-   date和statDate参数只能传入一个:
-   传入date时, 查询指定日期date收盘后所能看到的最近(对市值表来说, 最近一天, 对其他表来说, 最近一个季度)的数据
-   statDate: 财报统计的季度或者年份,。 季度: 格式是**年 + 'q' + 季度序号**, 例如: **'2015q1', '2013q4'**. 年份: 格式就是**年份的数字**, 例如:**'2015', '2016'**.

**表名: indicator**

| 列名 | 列的含义 | 解释 |
| --- | --- | --- |
| code | 股票代码 | 带后缀.XSHE/.XSHG |
| pubDate | 日期 | 公司发布财报日期 |
| statDate | 日期 | 财报统计的季度的最后一天, 比如2015-03-31, 2015-06-30 |
| eps | 每股收益EPS(元) | 每股收益(摊薄)＝净利润/期末股本；分子从单季利润表取值，分母取季度末报告期股本值。 |
| adjusted\_profit | 扣除非经常损益后的净利润(元) | 非经常性损益这一概念是证监会在1999年首次提出的，当时将其定义为：公司正常经营损益之外的一次性或偶发性损益。《问答第1号》则指出：非经常性损益是公司发生的与经营业务无直接关系的收支；以及虽与经营业务相关，但由于其性质、金额或发生频率等方面的原因，影响了真实公允地反映公司正常盈利能力的各项收入。 |
| operating\_profit | 经营活动净收益(元) | 营业总收入-营业总成本 |
| value\_change\_profit | 价值变动净收益(元) | 公允价值变动净收益+投资净收益+汇兑净收益 |
| roe | 净资产收益率ROE(%) | 归属于母公司股东的净利润\*2/（期初归属于母公司股东的净资产+期末归属于母公司股东的净资产） |
| inc\_return | 净资产收益率(扣除非经常损益)(%) | 扣除非经常损益后的净利润（不含少数股东损益）\*2/（期初归属于母公司股东的净资产+期末归属于母公司股东的净资产） |
| roa | 总资产净利率ROA(%) | 净利润\*2/（期初总资产+期末总资产） |
| net\_profit\_margin | 销售净利率(%) | 净利润/营业收入 |
| gross\_profit\_margin | 销售毛利率(%) | 毛利/营业收入 |
| expense\_to\_total\_revenue | 营业总成本/营业总收入(%) | 营业总成本/营业总收入(%) |
| operation\_profit\_to\_total\_revenue | 营业利润/营业总收入(%) | 营业利润/营业总收入(%) |
| net\_profit\_to\_total\_revenue | 净利润/营业总收入(%) | 净利润/营业总收入(%) |
| operating\_expense\_to\_total\_revenue | 营业费用/营业总收入(%) | 营业费用/营业总收入(%) |
| ga\_expense\_to\_total\_revenue | 管理费用/营业总收入(%) | 管理费用/营业总收入(%) |
| financing\_expense\_to\_total\_revenue | 财务费用/营业总收入(%) | 财务费用/营业总收入(%) |
| operating\_profit\_to\_profit | 经营活动净收益/利润总额(%) | 经营活动净收益/利润总额(%) |
| invesment\_profit\_to\_profit | 价值变动净收益/利润总额(%) | 价值变动净收益/利润总额(%) |
| adjusted\_profit\_to\_profit | 扣除非经常损益后的净利润/归属于母公司所有者的净利润(%) | 扣除非经常损益后的净利润/归属于母公司所有者的净利润(%) |
| goods\_sale\_and\_service\_to\_revenue | 销售商品提供劳务收到的现金/营业收入(%) | 销售商品提供劳务收到的现金/营业收入(%) |
| ocf\_to\_revenue | 经营活动产生的现金流量净额/营业收入(%) | 经营活动产生的现金流量净额/营业收入(%) |
| ocf\_to\_operating\_profit | 经营活动产生的现金流量净额/经营活动净收益(%) | 经营活动产生的现金流量净额/经营活动净收益(%) |
| inc\_total\_revenue\_year\_on\_year | 营业总收入同比增长率(%) | 营业总收入同比增长率是企业在一定期间内取得的营业总收入与其上年同期营业总收入的增长的百分比，以反映企业在此期间内营业总收入的增长或下降等情况。 |
| inc\_total\_revenue\_annual | 营业总收入环比增长率(%) | 营业收入是指企业在从事销售商品，提供劳务和让渡资产使用权等日常经营业务过程中所形成的经济利益的总流入。环比增长率=（本期的某个指标的值-上一期这个指标的值）/上一期这个指标的值\*100%。 |
| inc\_revenue\_year\_on\_year | 营业收入同比增长率(%) | 营业收入,是指公司在从事销售商品、提供劳务和让渡资产使用权等日常经营业务过程中所形成的经济利益的总流入，而营业收入同比增长率，则是检验上市公司去年一年挣钱能力是否提高的标准，营业收入同比增长,说明公司在上一年度挣钱的能力加强了，营业收入同比下降，则说明公司的挣钱能力稍逊于往年。 |
| inc\_revenue\_annual | 营业收入环比增长率(%) | 环比增长率=（本期的某个指标的值-上一期这个指标的值）/上一期这个指标的值\*100%。 |
| inc\_operation\_profit\_year\_on\_year | 营业利润同比增长率(%) | 同比增长率就是指公司当年期的净利润和上月同期、上年同期的净利润比较。（当期的利润-上月（上年）当期的利润）/上月（上年）当期的利润=利润同比增长率。 |
| inc\_operation\_profit\_annual | 营业利润环比增长率(%) | 环比增长率=（本期的某个指标的值-上一期这个指标的值）/上一期这个指标的值\*100%。 |
| inc\_net\_profit\_year\_on\_year | 净利润同比增长率(%) | （当期的净利润-上月（上年）当期的净利润）/上月（上年）当期的净利润绝对值=净利润同比增长率。 |
| inc\_net\_profit\_annual | 净利润环比增长率(%) | 环比增长率=（本期的某个指标的值-上一期这个指标的值）/上一期这个指标的值\*100%。 |
| inc\_net\_profit\_to\_shareholders\_year\_on\_year | 归属母公司股东的净利润同比增长率(%) | 归属于母公司股东净利润是指全部归属于母公司股东的净利润，包括母公司实现的净利润和下属子公司实现的净利润；同比增长率，一般是指和去年同期相比较的增长率。同比增长 和上一时期、上一年度或历史相比的增长（幅度）。 |
| inc\_net\_profit\_to\_shareholders\_annual | 归属母公司股东的净利润环比增长率(%) | 环比增长率=（本期的某个指标的值-上一期这个指标的值）/上一期这个指标的值\*100%。 |

**获取某一天所有的财务指标数据**

```python
# 获取“2021-01-05”所有的财务指标数据
df=get_fundamentals(query(indicator),date="2021-01-05")
print(df[:4])

         id         code         day     pubDate    statDate     eps  \
0  45000708  000001.XSHE  2021-01-05  2020-10-22  2020-09-30  0.4493   
1  45590101  000002.XSHE  2021-01-05  2020-10-30  2020-09-30  0.6331   
2  45590317  000004.XSHE  2021-01-05  2020-10-30  2020-09-30  0.3324   
3  45406174  000005.XSHE  2021-01-05  2020-10-29  2020-09-30  0.0043   

   adjusted_profit  operating_profit  value_change_profit   roe  \
0     8.730000e+09      1.041200e+10         8.570000e+08  2.46   
1     6.775110e+09      1.379713e+10         1.785868e+09  3.69   
2     5.469821e+07      6.525505e+07                  NaN  3.86   
3    -1.787463e+07     -1.747028e+07         4.047380e+07  0.28   

                   ...                    inc_total_revenue_year_on_year  \
0                  ...                                            8.8400   
1                  ...                                           12.4700   
2                  ...                                        17929.4004   
3                  ...                                          -41.6200   

   inc_total_revenue_annual  inc_revenue_year_on_year  inc_revenue_annual  \
0                     -5.36                    8.8400               -5.36   
1                     -3.48                   12.4700               -3.48   
2                    209.31                17929.4004              209.31   
3                     -3.07                  -41.6200               -3.07   

   inc_operation_profit_year_on_year  inc_operation_profit_annual  \
0                               5.51                      69.1000   
1                              10.53                     -28.2900   
2                             745.37                    6337.2998   
3                             138.08                     155.5600   

   inc_net_profit_year_on_year  inc_net_profit_annual  \
0                         6.11                69.9800   
1                        22.97               -29.3600   
2                       721.89              3654.3401   
3                       143.59               151.5400   

   inc_net_profit_to_shareholders_year_on_year  \
0                                         6.11   
1                                        14.94   
2                                       783.92   
3                                       132.08   

   inc_net_profit_to_shareholders_annual  
0                                69.9800  
1                               -34.6700  
2                              4519.6099  
3                               140.9000  

[4 rows x 36 columns]
```

**获取一只股票某个字段数据**

```python
q = query(
    indicator
).filter(
    indicator.code == '000004.XSHE'
)
df = get_fundamentals(q, '2015-10-15')
# 打印出每股收益EPS(元)
print(df['eps'][0])

>>>0.0365
```

**获取多只股票在某一日期的财务数据**

```python
df = get_fundamentals(query(
        indicator
    ).filter(
        # 这里不能使用 in 操作, 要使用in_()函数
        indicator.code.in_(['000001.XSHE', '600000.XSHG'])
    ), date='2015-10-15')
print(df)

        id         code         day     pubDate    statDate     eps  \
0      178  000001.XSHE  2015-10-15  2015-08-14  2015-06-30  0.4162   
1  2952806  600000.XSHG  2015-10-15  2015-08-20  2015-06-30  0.6813   

   adjusted_profit  operating_profit  value_change_profit   roe  \
0     5.954000e+09      6.254000e+09         1.566000e+09  4.14   
1     1.239500e+10      1.553200e+10         8.140000e+08  4.45   

                   ...                    inc_total_revenue_year_on_year  \
0                  ...                                             39.02   
1                  ...                                             19.94   

   inc_total_revenue_annual  inc_revenue_year_on_year  inc_revenue_annual  \
0                     25.32                     39.02               25.32   
1                     14.30                     19.94               14.30   

   inc_operation_profit_year_on_year  inc_operation_profit_annual  \
0                              17.90                         5.01   
1                               4.92                        12.52   

   inc_net_profit_year_on_year  inc_net_profit_annual  \
0                        18.69                   5.81   
1                         6.29                  13.33   

   inc_net_profit_to_shareholders_year_on_year  \
0                                        18.69   
1                                         6.39   

   inc_net_profit_to_shareholders_annual  
0                                   5.81  
1                                  13.53  

[2 rows x 36 columns]
```

<a id="balance"></a>

### balance

**资产负债表 / 2005至今，每天24:00更新**

按季度更新, 统计周期是一季度。可以使用get\_fundamentals() 的statDate参数查询年度数据。 由于这个表是存量性质的， 查询年度数据是返回第四季度的数据。

**注意**： （详细内容可看get\_fundamentals接口）

-   date和statDate参数只能传入一个:
-   传入date时, 查询指定日期date收盘后所能看到的最近(对市值表来说, 最近一天, 对其他表来说, 最近一个季度)的数据
-   statDate: 财报统计的季度或者年份,。 季度: 格式是**年 + 'q' + 季度序号**, 例如: **'2015q1', '2013q4'**. 年份: 格式就是**年份的数字**, 例如:**'2015', '2016'**.

**表名: balance**

<table><tbody><tr><td><strong>列名</strong></td><td><strong>列的含义</strong></td><td><strong>解释</strong></td></tr><tr><td>code</td><td>股票代码</td><td>带后缀.XSHE/.XSHG</td></tr><tr><td>pubDate</td><td>日期</td><td>公司发布财报的日期</td></tr><tr><td>statDate</td><td>日期</td><td>财报统计的季度的最后一天, 比如2015-03-31, 2015-06-30</td></tr><tr><td>cash_equivalents</td><td>货币资金(元)</td><td>货币资金是指在企业生产经营过程中处于货币形态的那部分资金，按其形态和用途不同可分为包括库存现金、银行存款和其他货币资金。它是企业中最活跃的资金，流动性强，是企业的重要支付手段和流通手段，因而是流动资产的审查重点。货币资金：又称为货币资产，是指在企业生产经营过程中处于货币形态的资产。是指可以立即投入流通，用以购买商品或劳务或用以偿还债务的交换媒介物。</td></tr><tr><td>settlement_provi</td><td>结算备付金(元)</td><td>结算备付金是指结算参与人根据规定，存放在其资金交收账户中用于证券交易及非交易结算的资金。资金交收账户即结算备付金账户。</td></tr><tr><td>lend_capital</td><td>拆出资金(元)</td><td>企业（金融）拆借给境内、境外其他金融机构的款项。</td></tr><tr><td>trading_assets</td><td>交易性金融资产(元)</td><td>交易性金融资产是指：企业为了近期内出售而持有的金融资产。通常情况下，以赚取差价为目的从二级市场购入的股票、债券和基金等，应分类为交易性金融资产，故长期股权投资不会被分类转入交易性金融资产及其直接指定为以公允价值计量且其变动计入当期损益的金融资产进行核算。</td></tr><tr><td>bill_receivable</td><td>应收票据(元)</td><td>应收票据是指企业持有的还没有到期、尚未兑现的票据。应收票据是企业未来收取货款的权利，这种权利和将来应收取的货款金额以书面文件形式约定下来，因此它受到法律的保护，具有法律上的约束力。是一种债权凭证。根据我国现行法律的规定，商业汇票的期限不得超过6个月，因而我国的商业汇票是一种流动资产。在我国应收票据、应付票据通常是指“商业汇票”，包括“银行承兑汇票”和“商业承兑汇票”两种，是远期票据，付款期一般在1个月以上，6个月以内。其他的银行票据(支票、本票、汇票}等，都是作为货币资金来核算的，而不作为应收应付票据</td></tr><tr><td>account_receivable</td><td>应收账款(元)</td><td>应收账款是指企业在正常的经营过程中因销售商品、产品、提供劳务等业务，应向购买单位收取的款项，包括应由购买单位或接受劳务单位负担的税金、代购买方垫付的各种运杂费等。</td></tr><tr><td>advance_payment</td><td>预付款项(元)</td><td>预付款项，包括预付货款和预付工程款等，通常属于流动资产。预付账款与应收账款都属于公司的债权，但两者产生的原因不同，应收账款是公司应收的销货款，通常是用货币清偿的，而预付账款是预付给供货单位的购货款或预付给施工单位的工程价款和材料款，通常是用商品、劳务或完工工程来清偿的。</td></tr><tr><td>insurance_receivables</td><td>应收保费(元)</td><td>保险公司按照合同约定应向投保人收取但尚未收到的保费收入。</td></tr><tr><td>reinsurance_receivables</td><td>应收分保账款(元)</td><td>指公司开展分保业务而发生的各种应收款项。</td></tr><tr><td>reinsurance_contract_reserves_receivable</td><td>应收分保合同准备金(元)</td><td>是用于核算企业（再保险分出人）从事再保险业务确认的应收分保未到期责任准备金，以及应向再保险接受人摊回的保险责任准备金。</td></tr><tr><td>interest_receivable</td><td>应收利息(元)</td><td>应收利息是指：短期债券投资实际支付的价款中包含的已到付息期但尚未领取的债券利息。这部分应收利息不计入短期债券投资初始投资成本中。但实际支付的价款中包含尚未到期的债券利息，则计入短期债券投资初始投资成本中（不需要单独核算）。</td></tr><tr><td>dividend_receivable</td><td>应收股利(元)</td><td>应收股利是指企业因股权投资而应收取的现金股利以及应收其他单位的利润，包括企业购入股票实际支付的款项中所包括的已宣告发放但尚未领取的现金股利和企业因对外投资应分得的现金股利或利润等，但不包括应收的股票股利。</td></tr><tr><td>other_receivable</td><td>其他应收款(元)</td><td>其他应收款是企业应收款项的另一重要组成部分。是企业除应收票据、应收账款和预付账款以外的各种应收暂付款项。其他应收款通常包括暂付款，是指企业在商品交易业务以外发生的各种应收、暂付款项。</td></tr><tr><td>bought_sellback_assets</td><td>买入返售金融资产(元)</td><td>指公司按返售协议约定先买入再按固定价格返售的证券等金融资产所融出的资金。</td></tr><tr><td>inventories</td><td>存货(元)</td><td>是指企业在日常活动中持有的以备出售的产成品或商品、处在生产过程中的在产品、在生产过程或提供劳务过程中耗用的材料和物料等。</td></tr><tr><td>non_current_asset_in_one_year</td><td>一年内到期的非流动资产(元)</td><td>一年内到期的非流动资产反映企业将于一年内到期的非流动资产项目金额。包括一年内到期的持有至到期投资、长期待摊费用和一年内可收回的长期应收款。应根据有关科目的期末余额填列。执行企业会计制度的企业根据“一年内到期的长期债权投资”等科目填列。</td></tr><tr><td>other_current_assets</td><td>其他流动资产(元)</td><td>其他流动资产，是指除货币资金、短期投资、应收票据、应收账款、其他应收款、存货等流动资产以外的流动资产</td></tr><tr><td>total_current_assets</td><td>流动资产合计(元)</td><td>指在一年内或者超过一年的一个营业周期内变现或者耗用的资产，包括货币资金、短期投资、应收票据、应收账款、坏账准备、应收账款净额、预付账款、其他应收款、存货、待转其他业务支出、待摊费用、待处理流动资产净损失、一年内到期的长期债券投资、其他流动资产等项。</td></tr><tr><td>loan_and_advance</td><td>发放委托贷款及垫款(元)</td><td>委托贷款是指由委托人提供合法来源的资金转入委托银行一般委存账户，委托银行根据委托人确定的贷款对象、用途、金额、期限、利率等代为发放、监督使用并协助收回的贷款业务。垫款是指银行在客户无力支付到期款项的情况下，被迫以自有资金代为支付的行为。</td></tr><tr><td>hold_for_sale_assets</td><td>可供出售金融资产(元)</td><td>可供出售金融资产指初始确认时即被指定为可供出售的非衍生金融资产，以及下列各类资产之外的非衍生金融资产：（一）贷款和应收款项；（二）持有至到期投资；（三）交易性金融资产。</td></tr><tr><td>hold_to_maturity_investments</td><td>持有至到期投资(元)</td><td>持有至到期投资指企业有明确意图并有能力持有至到期，到期日固定、回收金额固定或可确定的非衍生金融资产。以下非衍生金融资产不应划分为持有至到期投资：（一）初始确认时划分为交易性非衍生金融资产；（二）初始确认时被指定为可供出售非衍生金融资产；（三）符合贷款和应收款项定义的非衍生金融资产。</td></tr><tr><td>longterm_receivable_account</td><td>长期应收款(元)</td><td>长期应收款是根据长期应收款的账户余额减去未确认融资收益还有一年内到期的长期应收款。</td></tr><tr><td>longterm_equity_invest</td><td>长期股权投资(元)</td><td>长期股权投资是指企业持有的对其子公司、合营企业及联营企业的权益性投资以及企业持有的对被投资单位不具有控制、共同控制或重大影响，且在活跃市场中没有报价、公允价值不能可靠计量的权益性投资。</td></tr><tr><td>investment_property</td><td>投资性房地产(元)</td><td>投资性房地产是指为赚取租金或资本增值，或两者兼有而持有的房地产。投资性房地产应当能够单独计量和出售。</td></tr><tr><td>fixed_assets</td><td>固定资产(元)</td><td>固定资产是指企业为生产商品、提供劳务、出租或经营管理而持有的、使用寿命超过一个会计年度的有形资产。属于产品生产过程中用来改变或者影响劳动对象的劳动资料，是固定资本的实物形态。固定资产在生产过程中可以长期发挥作用，长期保持原有的实物形态，但其价值则随着企业生产经营活动而逐渐地转移到产品成本中去，并构成产品价值的一个组成部分。</td></tr><tr><td>constru_in_process</td><td>在建工程(元)</td><td>在建工程是指企业固定资产的新建、改建、扩建，或技术改造、设备更新和大修理工程等尚未完工的工程支出。在建工程通常有”自营”和”出包”两种方式。自营在建工程指企业自行购买工程用料、自行施工并进行管理的工程；出包在建工程是指企业通过签订合同，由其它工程队或单位承包建造的工程。</td></tr><tr><td>construction_materials</td><td>工程物资(元)</td><td>工程物资是指用于固定资产建造的建筑材料（如钢材、水泥、玻璃等），企业（民用航空运输）的高价周转件（例如飞机的引擎）等。买回来要再次加工建设的资产。在资产负债表中列示为非流动资产。</td></tr><tr><td>fixed_assets_liquidation</td><td>固定资产清理(元)</td><td>固定资产清理是指企业因出售、报废和毁损等原因转入清理的固定资产价值及其在清理过程中所发生的清理费用和清理收入等。</td></tr><tr><td>biological_assets</td><td>生产性生物资产(元)</td><td>生产性生物资产是指为产出农产品、提供劳务或出租等目的而持有的生物资产，包括经济林、薪炭林、产畜和役畜等。</td></tr><tr><td>oil_gas_assets</td><td>油气资产(元)</td><td>重要资产，其价值在总资产中占有较大比重。油气资产是指油气开采企业所拥有或控制的井及相关设施和矿区权益。油气资产属于递耗资产。递耗资产是通过开掘、采伐、利用而逐渐耗竭，以致无法恢复或难以恢复、更新或按原样重置的自然资源，如矿藏、原始森林等。油气资产是油气生产企业的重要资产，其价值在总资产中占有较大比重。</td></tr><tr><td>intangible_assets</td><td>无形资产(元)</td><td>无形资产是指企业拥有或者控制的没有实物形态的可辨认非货币性资产。资产满足下列条件之一的，符合无形资产定义中的可辨认性标准：　1、能够从企业中分离或者划分出来，并能够单独或者与相关合同、资产或负债一起，用于出售、转移、授予许可、租赁或者交换。　2、源自合同性权利或其他法定权利，无论这些权利是否可以从企业或其他权利和义务中转移或者分离。无形资产主要包括专利权、非专利技术、商标权、著作权、土地使用权、特许权等。商誉的存在无法与企业自身分离，不具有可辨认性，不属于本章所指无形资产。</td></tr><tr><td>development_expenditure</td><td>开发支出(元)</td><td>开发支出项目是反映企业开发无形资产过程中能够资本化形成无形资产成本的支出部分。开发支出项目应当根据”研发支出”科目中所属的”资本化支出”明细科目期末余额填列。</td></tr><tr><td>good_will</td><td>商誉(元)</td><td>商誉是指能在未来期间为企业经营带来超额利润的潜在经济价值，或一家企业预期的获利能力超过可辨认资产正常获利能力（如社会平均投资回报率）的资本化价值。商誉是企业整体价值的组成部分。在企业合并时，它是购买企业投资成本超过被并企业净资产公允价值的差额。</td></tr><tr><td>long_deferred_expense</td><td>长期待摊费用(元)</td><td>长期待摊费用是指企业已经支出，但摊销期限在1年以上(不含1年)的各项费用，包括开办费、租入固定资产的改良支出及摊销期在1年以上的固定资产大修理支出、股票发行费用等。应由本期负担的借款利息、租金等，不得作为长期待摊费用。</td></tr><tr><td>deferred_tax_assets</td><td>递延所得税资产(元)</td><td>指对于可抵扣暂时性差异，以未来期间很可能取得用来抵扣可抵扣暂时性差异的应纳税所得额为限确认的一项资产。而对于所有应纳税暂时性差异均应确认为一项递延所得税负债，但某些特殊情况除外。递延所得税资产和递延所得税负债是和暂时性差异相对应的，可抵减暂时性差异是将来可用来抵税的部分，是应该收回的资产，所以对应递延所得税资产递延所得税负债是由应纳税暂时性差异产生的，对于影响利润的暂时性差异，确认的递延所得税负债应该调整“所得税费用”。例如会计折旧小于税法折旧，导致资产的账面价值大于计税基础，如果产品已经对外销售了，就会影响利润，所以递延所得税负债应该调整当期的所得税费用。如果暂时性差异不影响利润，而是直接计入所有者权益的，则确认的递延所得税负债应该调整资本公积。例如可供出售金融资产是按照公允价值来计量的，公允价值产升高了，会计上调增了可供出售金融资产的账面价值，并确认的资本公积，因为不影响利润，所以确认的递延所得税负债不能调整所得税费用，而应该调整资本公积。</td></tr><tr><td>other_non_current_assets</td><td>其他非流动资产(元)</td><td>贷款是指贷款人(我国的商业银行等金融机构)对借款人提供的并按约定的利率和期限还本付息的货币资金。贷款币可以是人民币，也可以是外币。</td></tr><tr><td>total_non_current_assets</td><td>非流动资产合计(元)</td><td>公式：非流动资产合计=所有的非流动资产项目之和—一年内到期的非流动资产=固定资产—累计折旧—固定资产减值准备—一年内到期的非流动资产。</td></tr><tr><td>total_assets</td><td>资产总计(元)</td><td>资产总计是指企业拥有或可控制的能以货币计量的经济资源，包括各种财产、债权和其他权利。企业的资产按其流动性划分为：流动资产、长期投资、固定资产、无形资产及递延资产、其他资产等，即为企业资产负债表的资产总计项。所谓流动性是指企业资产的变现能力和支付能力。该指标根据会计“资产负债表”中“资产总计”项的年末数填列。资产总计=流动资产+长期投资+固定资产+无形及递延资产+其他资产。</td></tr><tr><td>shortterm_loan</td><td>短期借款(元)</td><td>短期借款企业用来维持正常的生产经营所需的资金或为抵偿某项债务而向银行或其他金融机构等外单位借入的、还款期限在一年以下或者一年的一个经营周期内的各种借款。</td></tr><tr><td>borrowing_from_centralbank</td><td>向中央银行借款(元)</td><td>向中央银行借款的形式有两种，一种是直接借款，也称再贷款;另一种为间接借款，即所谓的再贴现。</td></tr><tr><td>deposit_in_interbank</td><td>吸收存款及同业存放(元)</td><td>吸收存款是负债类科目，它核算企业（银行）吸收的除了同业存放款项以外的其他各种存款，即：收到的除金融机构以外的企业或者个人、组织的存款，包括单位存款（企业、事业单位、机关、社会团体等）、个人存款、信用卡存款、特种存款、转贷款资金和财政性存款等。同业存放，也称同业存款，全称是同业及其金融机构存入款项，是指因支付清算和业务合作等的需要，由其他金融机构存放于商业银行的款项。</td></tr><tr><td>borrowing_capital</td><td>拆入资金(元)</td><td>拆入资金，是指信托投资公司向银行或其他金融机构借入的资金。拆入资金应按实际借入的金额入账。</td></tr><tr><td>trading_liability</td><td>交易性金融负债(元)</td><td>交易性金融负债是指企业采用短期获利模式进行融资所形成的负债，比如短期借款、长期借款、应付债券。作为交易双方来说，甲方的金融债权就是乙方的金融负债，由于融资方需要支付利息，因比，就形成了金融负债。交易性金融负债是企业承担的交易性金融负债的公允价值。</td></tr><tr><td>notes_payable</td><td>应付票据(元)</td><td>应付票据是指企业购买材料、商品和接受劳务供应等而开出、承兑的商业汇票，包括商业承兑汇票和银行承兑汇票。在我国应收票据、应付票据仅指“商业汇票”，包括“银行承兑汇票”和“商业承兑汇票”两种，属于远期票据，付款期一般在1个月以上，6个月以内。其他的银行票据（支票、本票、汇票）等，都是作为货币资金来核算的，而不作为应收应付票据。</td></tr><tr><td>accounts_payable</td><td>应付账款(元)</td><td>应付账款是指因购买材料、商品或接受劳务供应等而发生的债务，这是买卖双方在购销活动中由于取得物资与支付贷款在时间上不一致而产生的负债。</td></tr><tr><td>advance_peceipts</td><td>预收款项(元)</td><td>预收款项是在企业销售交易成立以前，预先收取的部分货款。</td></tr><tr><td>sold_buyback_secu_proceeds</td><td>卖出回购金融资产款(元)</td><td>卖出回购金融资产款是用于核算企业（金融）按回购协议卖出票据、证券、贷款等金融资产所融入的资金。</td></tr><tr><td>commission_payable</td><td>应付手续费及佣金(元)</td><td>是会计科目的一种，用以核算企业因购买材料、商品和接受劳务供应等经营活动应支付的款项。通常是指因购买材料、商品或接受劳务供应等而发生的债务，这是买卖双方在购销活动中由于取得物资与支付贷款在时间上不一致而产生的负债。</td></tr><tr><td>salaries_payable</td><td>应付职工薪酬(元)</td><td>应付职工薪酬是指企业为获得职工提供的服务而给予各种形式的报酬以及其他相关支出。职工薪酬包括：职工工资、奖金、津贴和补贴；职工福利费；医疗保险费、养老保险费、失业保险费、工伤保险费和生育保险费等社会保险费；住房公积金；工会经费和职工教育经费；非货币性福利；因解除与职工的劳动关系给予的补偿；其他与获得职工提供的服务相关的支出。原“应付工资”和“应付福利费”取消，换成“应付职工薪酬”。</td></tr><tr><td>taxs_payable</td><td>应交税费(元)</td><td>应交税费是指企业根据在一定时期内取得的营业收入、实现的利润等，按照现行税法规定，采用一定的计税方法计提的应交纳的各种税费。应交税费包括企业依法交纳的增值税、消费税、营业税、所得税、资源税、土地增值税、城市维护建设税、房产税、土地使用税、车船税、教育费附加、矿产资源补偿费等税费，以及在上缴国家之前，由企业代收代缴的个人所得税等。</td></tr><tr><td>interest_payable</td><td>应付利息(元)</td><td>应付利息是指金融企业根据存款或债券金额及其存续期限和规定的利率，按期计提应支付给单位和个人的利息。应付利息应按已计但尚未支付的金额入账。应付利息包括分期付息到期还本的长期借款、企业债券等应支付的利息。应付利息与应计利息的区别：应付利息属于借款,应计利息属于企业存款。</td></tr><tr><td>dividend_payable</td><td>应付股利(元)</td><td>应付股利是指企业根据年度利润分配方案，确定分配的股利。是企业经董事会或股东大会，或类似机构决议确定分配的现金股利或利润。企业分配的股票股利，不通过“应付股利”科目核算。确定时借记“未分配利润”帐户，贷记“应付股利”帐户；实际支付时借记“应付股利”帐户，贷记“银行存款”帐户。</td></tr><tr><td>other_payable</td><td>其他应付款(元)</td><td>其他应付款是财务会计中的一个往来科目，通常情况下，该科目只核算企业应付其他单位或个人的零星款项，如应付经营租入固定资产和包装物的租金、存入保证金、应付统筹退休金等。</td></tr><tr><td>reinsurance_payables</td><td>应付分保账款(元)</td><td>应付分保账款表示债务，这样一来，债权、债务关系更加一目了然。另外，财产保险公司应收分保账款是指本公司与其他保险公司之间开展分保业务发生的各种应收款项。</td></tr><tr><td>insurance_contract_reserves</td><td>保险合同准备金(元)</td><td>险准备金是指保险人为保证其如约履行保险赔偿或给付义务，根据政府有关法律规定或业务特定需要，从保费收入或盈余中提取的与其所承担的保险责任相对应的一定数量的基金。</td></tr><tr><td>proxy_secu_proceeds</td><td>代理买卖证券款(元)</td><td>代理买卖证券款是指公司接受客户委托，代理客户买卖股票、债券和基金等有价证券而收到的款项，包括公司代理客户认购新股的款项、代理客户领取的现金股利和债券利息，代客户向证券交易所支付的配股款等。</td></tr><tr><td>receivings_from_vicariously_sold_securities</td><td>代理承销证券款(元)</td><td>代理承销证券款是指公司接受委托，采用承购包销方式或代销方式承销证券所形成的、应付证券发行人的承销资金。</td></tr><tr><td>non_current_liability_in_one_year</td><td>一年内到期的非流动负债(元)</td><td>是反映企业各种非流动负债在一年之内到期的金额，包括一年内到期的长期借款、长期应付款和应付债券。本项目应根据上述账户分析计算后填列。计入(收录)流动负债中。</td></tr><tr><td>other_current_liability</td><td>其他流动负债(元)</td><td>其他流动负债是指不能归属于短期借款，应付短期债券券，应付票据，应付帐款，应付所得税，其他应付款，预收账款这七款项目的流动负债。但以上各款流动负债，其金额未超过流动负债合计金额百分之五者，得并入其他流动负债内。</td></tr><tr><td>total_current_liability</td><td>流动负债合计(元)</td><td>流动负债合计是指企业在一年内或超过一年的一个营业周期内需要偿还的债务，包括短期借款、应付帐款、其他应付款、应付工资、应付福利费、未交税金和未付利润、其他应付款、预提费用等。</td></tr><tr><td>longterm_loan</td><td>长期借款(元)</td><td>长期借款是指企业从银行或其他金融机构借入的期限在一年以上(不含一年)的借款。我国股份制企业的长期借款主要是向金融机构借人的各项长期性借款，如从各专业银行、商业银行取得的贷款；除此之外，还包括向财务公司、投资公司等金融企业借人的款项。</td></tr><tr><td>bonds_payable</td><td>应付债券(元)</td><td>应付债券是指企业为筹集资金而对外发行的期限在一年以上的长期借款性质的书面证明，约定在一定期限内还本付息的一种书面承诺。</td></tr><tr><td>longterm_account_payable</td><td>长期应付款(元)</td><td>长期应付款是指企业除了长期借款和应付债券以外的长期负债，包括应付引进设备款、应付融资租入固定资产的租赁费等。</td></tr><tr><td>specific_account_payable</td><td>专项应付款(元)</td><td>专项应付款是企业接受国家拨入的具有专门用途的款项所形成的不需要以资产或增加其他负债偿还的负债。专项应付款指企业接受国家拨入的具有专门用途的拨款，如新产品试制费拨款、中间试验费拨款和重要科学研究补助费拨款等科技三项拨款等。</td></tr><tr><td>estimate_liability</td><td>预计负债(元)</td><td>预计负债是因或有事项可能产生的负债。根据或有事项准则的规定，与或有事项相关的义务同时符合以下三个条件的，企业应将其确认为负债：一是该义务是企业承担的现时义务；二是该义务的履行很可能导致经济利益流出企业，这里的“很可能”指发生的可能性为“大于50%，但小于或等于95%”；三是该义务的金额能够可靠地计量。</td></tr><tr><td>deferred_tax_liability</td><td>递延所得税负债(元)</td><td>递延所得税负债是指根据应纳税暂时性差异计算的未来期间应付所得税的金额；递延所得税资产和递延所得税负债是和暂时性差异相对应的，可抵减暂时性差异是将来可用来抵税的部分，是应该收回的资产，所以对应递延所得税资产；递延所得税负债是由应纳税暂时性差异产生的，对于影响利润的暂时性差异，确认的递延所得税负债应该调整“所得税费用”。</td></tr><tr><td>other_non_current_liability</td><td>其他非流动负债(元)</td><td>其他非流动负债项目是反映企业除长期借款、应付债券等项目以外的其他非流动负债。其他非流动负债项目应根据有关科目的期末余额填列。其他非流动负债项目应根据有关科目期末余额减去将于一年内(含一年)到期偿还数后的余额填列。非流动负债各项目中将于一年内(含一年)到期的非流动负债，应在”一年内到期的非流动负债”项目内单独反映。</td></tr><tr><td>total_non_current_liability</td><td>非流动负债合计(元)</td><td>流动负债合计是指企业在一年内或超过一年的一个营业周期内需要偿还的债务，包括短期借款、应付帐款、其他应付款、应付工资、应付福利费、未交税金和未付利润、其他应付款、预提费用等。</td></tr><tr><td>total_liability</td><td>负债合计(元)</td><td>负债合计是指企业所承担的能以，将以资产或劳务偿还的债务，偿还形式包括货币、资产或提供劳务。</td></tr><tr><td>paidin_capital</td><td>实收资本(或股本)(元)</td><td>实收资本是指企业的投资者按照企业章程或合同、协议的约定，实际投入企业的资本。我国实行的是注册资本制，因而，在投资者足额缴纳资本之后，企业的实收资本应该等于企业的注册资本。“实收资本”科目用于核算企业实际收到的投资人投入的资本。</td></tr><tr><td>capital_reserve_fund</td><td>资本公积金(元)</td><td>资本公积金是在公司的生产经营之外，由资本、资产本身及其他原因形成的股东权益收入。股份公司的资本公积金，主要来源于的股票发行的溢价收入、接受的赠与、资产增值、因合并而接受其他公司资产净额等。其中，股票发行溢价是上市公司最常见、是最主要的资本公积金来源。</td></tr><tr><td>treasury_stock</td><td>库存股(元)</td><td>指股份有限公司已发行的股票，由于公司的重新回购或其他原因且不是为了注销的目的而由公司持有的股票。</td></tr><tr><td>specific_reserves</td><td>专项储备(元)</td><td>专项储备用于核算高危行业企业按照规定提取的安全生产费以及维持简单再生产费用等具有类似性质的费用。</td></tr><tr><td>surplus_reserve_fund</td><td>盈余公积金(元)</td><td>盈余公积是指企业按照规定从净利润中提取的各种积累资金。</td></tr><tr><td>ordinary_risk_reserve_fund</td><td>一般风险准备(元)</td><td>指从事证券业务的金融企业按规定从 净利润中提取，用于弥补亏损的 风险准备。</td></tr><tr><td>retained_profit</td><td>未分配利润(元)</td><td>未分配利润是企业未作分配的利润。它在以后年度可继续进行分配，在未进行分配之前，属于所有者权益的组成部分。</td></tr><tr><td>foreign_currency_report_conv_diff</td><td>外币报表折算差额(元)</td><td>是指在编制合并财务报表时，把国外子公司或分支机构以所在国家货币编制的财务报表折算成以记账本位币表达的财务报表时，由于报表项目采用不同汇率折算而形成的汇兑损益。</td></tr><tr><td>equities_parent_company_owners</td><td>归属于母公司股东权益合计(元)</td><td>母公司股东权益反映的是母公司所持股份部分的所有者权益数，所有者权益合计是反映的是所有的股东包括母公司与少数股东一起100%的股东所持股份的总体所有者权益合计数。即所有者权益合计＝母公司股东权益合计母＋少数股东权益合计。</td></tr><tr><td>minority_interests</td><td>少数股东权益(元)</td><td>少数股东权益简称少数股权,是反映除母公司以外的其他投资者在子公司中的权益，表示其他投资者在子公司所有者权益中所拥有的份额。在控股合并形式下，子公司股东权益中未被母公司持有部分。在母公司拥有子公司股份不足100%，即只拥有子公司净资产的部分产权时，子公司股东权益的一部分属于母公司所有，即多数股权，其余部分仍属外界其他股东所有，由于后者在子公司全部股权中不足半数，对子公司没有控制能力，故被称为少数股权。</td></tr><tr><td>total_owner_equities</td><td>股东权益合计(元)</td><td>指股本、资本公积、盈余公积、未分配利润的之和，代表了股东对企业的所有权，反映了股东在企业资产中享有的经济利益。</td></tr><tr><td>total_sheet_owner_equities</td><td>负债和股东权益合计</td><td>负债和股东权益总计是等于负债总额加上股东权益总额，也等于资产总额。</td></tr></tbody></table>

**获取所有公司最近季度的资产负债表**

```python
df=get_fundamentals(query(balance))
print(df[:4])
         id         code         day     pubDate    statDate  \
0  31771107  000001.XSHE  2021-03-14  2021-02-02  2020-12-31   
1  32297446  000002.XSHE  2021-03-14  2020-10-30  2020-09-30   
2  32297662  000004.XSHE  2021-03-14  2020-10-30  2020-09-30   
3  32126926  000005.XSHE  2021-03-14  2020-10-29  2020-09-30   

   cash_equivalents  settlement_provi  lend_capital  trading_assets  \
0      2.839820e+11               NaN  7.099600e+10    3.112700e+11   
1      1.730500e+11               NaN           NaN    2.270278e+08   
2      1.293766e+08               NaN           NaN             NaN   
3      6.283763e+07               NaN           NaN    2.531232e+07   

   bill_receivable             ...              treasury_stock  \
0              NaN             ...                         NaN   
1       21815870.0             ...                         NaN   
2         484800.0             ...                         NaN   
3        3513000.0             ...                         NaN   

   specific_reserves  surplus_reserve_fund  ordinary_risk_reserve_fund  \
0                NaN          1.078100e+10                5.153600e+10   
1                NaN          7.082625e+10                         NaN   
2                NaN          1.341421e+07                         NaN   
3                NaN          1.495191e+08                         NaN   

   retained_profit  foreign_currency_report_conv_diff  \
0     1.311860e+11                                NaN   
1     1.034041e+11                                NaN   
2     7.160281e+07                                NaN   
3    -1.715857e+08                                NaN   

   equities_parent_company_owners  minority_interests  total_owner_equities  \
0                    3.641310e+11                 NaN          3.641310e+11   
1                    2.026750e+11        9.996741e+10          3.026424e+11   
2                    1.449622e+09        1.207967e+07          1.461701e+09   
3                    1.622737e+09        9.179124e+07          1.714528e+09   

   total_sheet_owner_equities  
0                4.468514e+12  
1                1.814466e+12  
2                1.548313e+09  
3                2.939184e+09  

[4 rows x 86 columns]
```

**获取某只股票的资产负债表数据**

```python
# 查询'000001.XSHE'的资产负债表数据
q = query(
    balance
).filter(
    balance.code == '000001.XSHE'
)
# 运行时间2020-10-15
df = get_fundamentals(q,'2020-10-15')
# pubDate公司发布财报的日期,statDate财报统计的季度的最后一天,cash_equivalents货币资金
print(df[['pubDate','statDate','cash_equivalents']])

#输出
      pubDate    statDate  cash_equivalents
0  2020-08-28  2020-06-30      2.524260e+11
```

<a id="cash_flow"></a>

### cash\_flow

**现金流量表 / 2005至今，每天24:00更新**

按季度更新, 统计周期是一季度。可以使用get\_fundamentals() 的 statDate 参数查询年度数据。

**表名: cash\_flow**

| 列名 | 列的含义 | 解释 |
| --- | --- | --- |
| code | 股票代码 | 带后缀.XSHE/.XSHG |
| pubDate | 日期 | 公司发布财报日期 |
| statDate | 日期 | 财报统计的季度的最后一天, 比如2015-03-31, 2015-06-30 |
| goods\_sale\_and\_service\_render\_cash | 销售商品、提供劳务收到的现金(元) | 反映企业本期销售商品、提供劳务收到的现金，以及前期销售商品、提供劳务本期收到的现金（包括销售收入和应向购买者收取的增值税销项税额）和本期预收的款项，减去本期销售本期退回的商品和前期销售本期退回的商品支付的现金。企业销售材料和代购代销业务收到的现金，也在本项目反映。 |
| net\_deposit\_increase | 客户存款和同业存放款项净增加额(元) | 客户存款和同业存款净增加额=客户存款和同业存款期末余额－客户存款和同业存款期初余额。 |
| net\_borrowing\_from\_central\_bank | 向中央银行借款净增加额(元) | 向中央银行借款净增加额=向中央银行借款期末余额－向中央银行借款期初余额。 |
| net\_borrowing\_from\_finance\_co | 向其他金融机构拆入资金净增加额(元) | 向其他金融机构拆入资金净增加额=向其他金融机构拆入资金期末余额－向其他金融机构拆入资金期初余额。 |
| net\_original\_insurance\_cash | 收到原保险合同保费取得的现金(元) | 收到原保险合同保费取得的现金 |
| net\_cash\_received\_from\_reinsurance\_business | 收到再保险业务现金净额(元) | 再保险是指一个保险人，分出一定的保险金额给另一个保险人。 |
| net\_insurer\_deposit\_investment | 保户储金及投资款净增加额(元) | 保户储金，是指保险公司以储金利息作为保费的保险业务，收到保户缴存的储金。投资款是收到股东的款项。 |
| net\_deal\_trading\_assets | 处置交易性金融资产净增加额(元) | 交易性金融资产是指企业为了近期内出售而持有的债券投资、股票投资和基金投资。 |
| interest\_and\_commission\_cashin | 收取利息、手续费及佣金的现金(元) | 收取利息、手续费及佣金的现金 |
| net\_increase\_in\_placements | 拆入资金净增加额(元) | 拆入资金净增加额=拆入资金期末余额－拆入资金期初余额。 |
| net\_buyback | 回购业务资金净增加额(元) | 回购交易是质押贷款的一种方式，通常用在政府债券上。债券经纪人向投资者临时出售一定的债券，同时签约在一定的时间内以稍高价格买回来。债券经纪人从中取得资金再用来投资，而投资者从价格差中得利。 |
| tax\_levy\_refund | 收到的税费返还(元) | 反映企业收到返还的增值税、营业税、所得税、消费税、关税和教育费附加返还款等各种税费。 |
| other\_cashin\_related\_operate | 收到其他与经营活动有关的现金(元) | 反映企业收到的罚款收入、经营租赁收到的租金等其他与经营活动有关的现金流入，金额较大的应当单独列示。 |
| subtotal\_operate\_cash\_inflow | 经营活动现金流入小计(元) | 销售商品、提供劳务+收到的现金收到的税费返还+收到其他与经营活动有关的现金。 |
| goods\_and\_services\_cash\_paid | 购买商品、接受劳务支付的现金(元) | 反映企业本期购买商品、接受劳务实际支付的现金（包括增值税进项税额），以及本期支付前期购买商品、接受劳务的未付款项和本期预付款项，减去本期发生的购货退回收到的现金。 |
| net\_loan\_and\_advance\_increase | 客户贷款及垫款净增加额(元) | 客户贷款是科目核算信托项目管理运用、处分信托财产而持有的各项贷款。垫款是指银行在客户无力支付到期款项的情况下，被迫以自有资金代为支付的行为。 |
| net\_deposit\_in\_cb\_and\_ib | 存放中央银行和同业款项净增加额(元) | 存放中央银行款项是指各金融企业在中央银行开户而存入的用于支付清算、调拨款项、提取及缴存现金、往来资金结算以及按吸收存款的一定比例缴存于中央银行的款项和其他需要缴存的款项。存放同业是指商业银行存放在其他银行和非银行金融机构的存款。 |
| original\_compensation\_paid | 支付原保险合同赔付款项的现金(元) | 赔付支出主要指核算企业（保险）支付的原保险合同赔付款项和再保险合同赔付款项。原保险即是区别于再保险的名词。 |
| handling\_charges\_and\_commission | 支付利息、手续费及佣金的现金(元) | 一般是指涉及到贷款利息，银行扣缴的手续费及佣金等现金的流出，用在利息指出，或者银行手续费支出，佣金支出等业务上。 |
| policy\_dividend\_cash\_paid | 支付保单红利的现金(元) | 保单红利支出是根据原保险合同的约定，按照分红保险产品的红利分配方法及有关精算结果而估算，支付给保单持有人的红利。 |
| staff\_behalf\_paid | 支付给职工以及为职工支付的现金(元) | 这个项目反映企业实际支付给职工的现金以及为职工支付的现金，包括本期实际支付给职工的工资、奖金、各种津贴和补贴等，以及为职工支付的其他费用。不包括支付的离退休人员的各项费用和支付给在建工程人员的工资等。 |
| tax\_payments | 支付的各项税费(元) | 反映企业本期发生并支付的、本期支付以前各期发生的以及预交的教育费附加、矿产资源补偿费、印花税、房产税、土地增值税、车船使用税、预交的营业税等税费，计入固定资产价值、实际支付的耕地占用税、本期退回的增值税、所得税等除外。 |
| other\_operate\_cash\_paid | 支付其他与经营活动有关的现金(元) | 反映企业支付的罚款支出、支付的差旅费、业务招待费、保险费、经营租赁支付的现金等其他与经营活动有关的现金流出，金额较大的应当单独列示。 |
| subtotal\_operate\_cash\_outflow | 经营活动现金流出小计(元) | 购买商品、接受劳务支付的现金+支付给职工以及为职工支付的现金+支付的各项税费+支付其他与经营活动有关的现金。 |
| net\_operate\_cash\_flow | 经营活动产生的现金流量净额(元) | 公式: 经营活动产生的现金流量净额 |
| invest\_withdrawal\_cash | 收回投资收到的现金(元) | 反映企业出售、转让或到期收回除现金等价物以外的交易性金融资产、长期股权投资而收到的现金，以及收回长期债权投资本金而收到的现金，但长期债权投资收回的利息除外。 |
| invest\_proceeds | 取得投资收益收到的现金(元) | 反映企业因股权性投资而分得的现金股利，从子公司、联营企业或合营企业分回利润而收到的现金，以及因债权性投资而取得的现金利息收入，但股票股利除外。 |
| fix\_intan\_other\_asset\_dispo\_cash | 处置固定资产、无形资产和其他长期资产收回的现金净额(元) | 反映企业出售、报废固定资产、无形资产和其他长期资产所取得的现金（包括因资产毁损而收到的保险赔偿收入），减去为处置这些资产而支付的有关费用后的净额，但现金净额为负数的除外。 |
| net\_cash\_deal\_subcompany | 处置子公司及其他营业单位收到的现金净额(元) | 反映企业处置子公司及其他营业单位所取得的现金减去相关处置费用后的净额。 |
| other\_cash\_from\_invest\_act | 收到其他与投资活动有关的现金(元) | 反映企业除上述各项目外收到或支付的其他与投资活动有关的现金流入或流出，金额较大的应当单独列示。 |
| subtotal\_invest\_cash\_inflow | 投资活动现金流入小计(元) | 取得投资收益收到的现金+处置固定资产、无形资产和其他长期资产收回的现金净额+处置子公司及其他营业单位收到的现金净额+收到其他与投资活动有关的现金。 |
| fix\_intan\_other\_asset\_acqui\_cash | 购建固定资产、无形资产和其他长期资产支付的现金(元) | 反映企业购买、建造固定资产、取得无形资产和其他长期资产所支付的现金及增值税款、支付的应由在建工程和无形资产负担的职工薪酬现金支出，但为购建固定资产而发生的借款利息资本化部分、融资租入固定资产所支付的租赁费除外。 |
| invest\_cash\_paid | 投资支付的现金(元) | 反映企业取得的除现金等价物以外的权益性投资和债权性投资所支付的现金以及支付的佣金、手续费等附加费用。 |
| impawned\_loan\_net\_increase | 质押贷款净增加额(元) | 质押贷款是指贷款人按《担保法》规定的质押方式以借款人或第三人的动产或权利为质押物发放的贷款。 |
| net\_cash\_from\_sub\_company | 取得子公司及其他营业单位支付的现金净额(元) | 反映企业购买子公司及其他营业单位购买出价中以现金支付的部分，减去子公司或其他营业单位持有的现金和现金等价物后的净额。 |
| other\_cash\_to\_invest\_act | 支付其他与投资活动有关的现金(元) | 现金流量表科目。 |
| subtotal\_invest\_cash\_outflow | 投资活动现金流出小计(元) | 购建固定资产、无形资产和其他长期资产支付的现金+投资支付的现金+取得子公司及其他营业单位支付的现金净额+支付其他与投资活动有关的现金。 |
| net\_invest\_cash\_flow | 投资活动产生的现金流量净额(元) | 现金流量表科目。 |
| cash\_from\_invest | 吸收投资收到的现金(元) | 反映企业以发行股票、债券等方式筹集资金实际收到的款项，减去直接支付给金融企业的佣金、手续费、宣传费、咨询费、印刷费等发行费用后的净额。 |
| cash\_from\_mino\_s\_invest\_sub | 子公司吸收少数股东投资收到的现金(元) | 《企业会计准则第33 号——合并财务报表》合并现金流量表科目。具体核算范围和方法参见上市公司定期报告。 |
| cash\_from\_borrowing | 取得借款收到的现金(元) | 反映企业举借各种短期、长期借款而收到的现金。 |
| cash\_from\_bonds\_issue | 发行债券收到的现金(元) | 反映商业银行本期发行债券收到的本金。 |
| other\_finance\_act\_cash | 收到其他与筹资活动有关的现金(元) | 反映企业除上述项目外，收到或支付的其他与筹资活动有关的现金流入或流出，包括以发行股票、债券等方式筹集资金而由企业直接支付的审计和咨询等费用、为购建固定资产而发生的借款利息资本化部分、融资租入固定资产所支付的租赁费、以分期付款方式购建固定资产以后各期支付的现金等。 |
| subtotal\_finance\_cash\_inflow | 筹资活动现金流入小计(元) | 吸收投资收到的现金+取得借款收到的现金+收到其他与筹资活动有关的现金+发行债券收到的现金。 |
| borrowing\_repayment | 偿还债务支付的现金(元) | 反映企业以现金偿还债务的本金。 |
| dividend\_interest\_payment | 分配股利、利润或偿付利息支付的现金(元) | 反映企业实际支付的现金股利、支付给其他投资单位的利润或用现金支付的借款利息、债券利息。 |
| proceeds\_from\_sub\_to\_mino\_s | 子公司支付给少数股东的股利、利润(元) | 一般企业现金流量表科目。 |
| other\_finance\_act\_payment | 支付其他与筹资活动有关的现金(元) | 包括：筹资费用所支付的现金，融资租赁所支付的现金，减少注册资本所支付的现金（收购本公司股票、退还联营单位的联营投资等）企业以分期付款方式构建固定资产除首期付款支付的现金以外的其他各期所支付的现金。 |
| subtotal\_finance\_cash\_outflow | 筹资活动现金流出小计(元) | 现金流量表科目。 |
| net\_finance\_cash\_flow | 筹资活动产生的现金流量净额(元) | 现金流量表科目。 |
| exchange\_rate\_change\_effect | 汇率变动对现金及现金等价物的影响 | 指企业外币现金流量及境外子公司的现金流量折算成记账本位币时，所采用的是现金流量发生日的汇率或即期汇率的近似汇率。 |
| cash\_equivalent\_increase | 现金及现金等价物净增加额 | 中外币现金净增加额按期末汇率折算的金额。 |
| cash\_equivalents\_at\_beginning | 期初现金及现金等价物余额(元) | 现金流量表科目。 |
| cash\_and\_equivalents\_at\_end | 期末现金及现金等价物余额(元) | 现金流量表科目。 |

**获取所有公司最近季度的现金流量表**

```python
df=get_fundamentals(query(cash_flow))
print(df[:4])

         id         code         day     pubDate    statDate  \
0  30720327  000001.XSHE  2021-03-14  2021-02-02  2020-12-31   
1  31251228  000002.XSHE  2021-03-14  2020-10-30  2020-09-30   
2  31251444  000004.XSHE  2021-03-14  2020-10-30  2020-09-30   
3  31080491  000005.XSHE  2021-03-14  2020-10-29  2020-09-30   

   goods_sale_and_service_render_cash  net_deposit_increase  \
0                                 NaN          1.679780e+11   
1                        1.241204e+11                   NaN   
2                        2.250687e+07                   NaN   
3                        7.293948e+07                   NaN   

   net_borrowing_from_central_bank  net_borrowing_from_finance_co  \
0                     2.162000e+09                            NaN   
1                              NaN                            NaN   
2                              NaN                            NaN   
3                              NaN                            NaN   

   net_original_insurance_cash             ...               \
0                          NaN             ...                
1                          NaN             ...                
2                          NaN             ...                
3                          NaN             ...                

   borrowing_repayment  dividend_interest_payment  \
0         1.789500e+11              -1.834000e+09   
1         2.968062e+10               1.606759e+10   
2                  NaN               1.161236e+05   
3         1.652172e+07              -5.030181e+06   

   proceeds_from_sub_to_mino_s  other_finance_act_payment  \
0                          NaN                        NaN   
1                  942942016.0               6.971033e+09   
2                          NaN                        NaN   
3                          NaN                        NaN   

   subtotal_finance_cash_outflow  net_finance_cash_flow  \
0                   1.818450e+11           3.475700e+10   
1                   5.668232e+10          -3.631014e+10   
2                   1.161236e+05           1.427376e+06   
3                   1.149154e+07           1.550846e+07   

   exchange_rate_change_effect  cash_equivalent_increase  \
0                -1.888000e+09             -1.412100e+10   
1                -4.846036e+08             -2.098908e+10   
2                          NaN              4.059006e+07   
3                          NaN             -1.240253e+06   

   cash_equivalents_at_beginning  cash_and_equivalents_at_end  
0                   2.930710e+11                 2.789500e+11  
1                   1.881395e+11                 1.671504e+11  
2                   8.861202e+07                 1.292021e+08  
3                   3.398542e+07                 3.274517e+07  

[4 rows x 59 columns]
```

**获取某只股票的现金流量表数据**

```python
# 查询'000002.XSHE'的现金流量表数据
q = query(
    cash_flow
).filter(
    cash_flow.code == '000002.XSHE'
)
# 运行时间2020-10-15
df = get_fundamentals(q,'2020-10-15')
# pubDate公司发布财报的日期,statDate财报统计的季度的最后一天,goods_sale_and_service_render_cash销售商品、提供劳务收到的现金(元)
print(df[['pubDate','statDate','goods_sale_and_service_render_cash']])

#输出
      pubDate    statDate  goods_sale_and_service_render_cash
0  2020-08-28  2020-06-30                        1.185840e+11
```

<a id="income"></a>

### income

**利润表 / 2005至今，每天24:00更新**

按季度更新, 统计周期是一季度。可以使用get\_fundamentals() 的statDate参数查询年度数据。

**表名: income**

<table><tbody><tr><td><strong>列名</strong></td><td><strong>列的含义</strong></td><td><strong>解释</strong></td></tr><tr><td>code</td><td>股票代码</td><td>带后缀.XSHE/.XSHG</td></tr><tr><td>pubDate</td><td>日期</td><td>公司发布财报日期</td></tr><tr><td>statDate</td><td>日期</td><td>财报统计的季度的最后一天, 比如2015-03-31, 2015-06-30</td></tr><tr><td>total_operating_revenue</td><td>营业总收入(元)</td><td>具体核算范围和方法参见上市公司定期报告</td></tr><tr><td>operating_revenue</td><td>营业收入(元)</td><td>具体核算范围和方法参见上市公司定期报告</td></tr><tr><td>interest_income</td><td>利息收入(元)</td><td>利息收入是指纳税人购买各种债券等有价证券的利息，外单位欠款付给的利息以及其他利息收入。包括：购买各种债券等有价证券的利息，如购买国库券，重点企业建设债券、国家保值公债以及政府部门和企业发放的各类有价证券；企业各项存款所取得的利息外单位欠本企业款而取得的利息；其他利息收入等。</td></tr><tr><td>premiums_earned</td><td>已赚保费(元)</td><td>已赚保费是指保险起期已经预先缴付的保险费,过去的保险期间的保费就成为已赚的保费。</td></tr><tr><td>commission_income</td><td>手续费及佣金收入(元)</td><td>手续费及佣金收入是指公司为客户办理各种业务收取的手续费及佣金收入，包括办理咨询业务、担保业务、代保管等代理业务以及办理投资业务等取得的手续费及佣金，如业务代办手续费收入、咨询服务收入、担保收入、资产管理收入、代保管收入，代理买卖证券、代理承销证券、代理兑付证券、代理保管证券等代理业务以及其他相关服务实现的手续费及佣金收入等。</td></tr><tr><td>total_operating_cost</td><td>营业总成本(元)</td><td>营业总成本=主营业务成本+其他业务成本+利息支出+手续费及佣金支出+退保金+赔付支出净额+提取保险合同准备金净额+保单红利支出+分保费用+营业税金及附加+销售费用+管理费用+财务费用+资产减值损失+其他</td></tr><tr><td>operating_cost</td><td>营业成本(元)</td><td>营业成本，也称运营成本。是指企业所销售商品或者提供劳务的成本。营业成本应当与所销售商品或者所提供劳务而取得的收入进行配比。</td></tr><tr><td>interest_expense</td><td>利息支出(元)</td><td>利息支出是指临时借款的利息支出。在以收付实现制作为记帐基础的前提条件下，所谓支出应以实际支付为标准，即资金流出，标志着现金、银行存款的减少。就利息支出而言、给个人帐户计息，其资金并没有流出，现金、银行存款并没有减少，因此，给个人计息不应作为利息支出列支。</td></tr><tr><td>commission_expense</td><td>手续费及佣金支出(元)</td><td>手续费及佣金支出，本科目主要核算企业（金融）发生的与其经营活动相关的各项手续费、佣金等支出。</td></tr><tr><td>refunded_premiums</td><td>退保金(元)</td><td>退保金是指公司经营的长期人身保险业务中，投保人办理退保时，按保险条款规定支付给投保人的金额。</td></tr><tr><td>net_pay_insurance_claims</td><td>赔付支出净额(元)</td><td>赔付支出主要指核算企业（保险）支付的原保险合同赔付款项和再保险合同赔付款项。企业（保险）可以单独设置“赔款支出”、“满期给付”、“年金给付”、“死伤医疗给付”、“分保赔付支出”等科目。可按保险合同和险种进行明细核算。</td></tr><tr><td>withdraw_insurance_contract_reserve</td><td>提取保险合同准备金净额(元)</td><td>保险准备金是指保险人为保证其如约履行保险赔偿或给付义务，根据政府有关法律规定或业务特定需要，从保费收入或盈余中提取的与其所承担的保险责任相对应的一定数量的基金。</td></tr><tr><td>policy_dividend_payout</td><td>保单红利支出(元)</td><td>保单红利支出是根据原保险合同的约定，按照分红保险产品的红利分配方法及有关精算结果而估算，支付给保单持有人的红利。</td></tr><tr><td>reinsurance_cost</td><td>分保费用(元)</td><td>分保费用，是办理初保业务的保险公司向其他保险公司分保保险业务，在向对方支付分保费的同时，向对方收取的一定费用，用以弥补初保人的费用支出。</td></tr><tr><td>operating_tax_surcharges</td><td>营业税金及附加(元)</td><td>反映企业经营主要业务应负担的营业税、消费税、城市维护建设税、资源税和教育费附加等。填报此项指标时应注意，实行新税制后，会计上规定应交增值税不再计入“主营业务税金及附加”项，无论是一般纳税企业还是小规模纳税企业均应在“应交增值税明细表”中单独反映。根据企业会计“利润表”中对应指标的本年累计数填列。</td></tr><tr><td>sale_expense</td><td>销售费用(元)</td><td>销售费用是指企业在销售产品、自制半成品和提供劳务等过程中发生的各项费用。包括由企业负担的包装费、运输费、广告费、装卸费、保险费、委托代销手续费、展览费、租赁费（不含融资租赁费)和销售服务费、销售部门人员工资、职工福利费、差旅费、折旧费、修理费、物料消耗、低值易耗品摊销以及其他经费等。与销售有关的差旅费应计入销售费用。</td></tr><tr><td>administration_expense</td><td>管理费用(元)</td><td>管理费用是指 企业行政管理部门为组织和管理生产经营活动而发生的各项费用。管理费用属于期间费用，在发生的当期就计入当期的损失或是利益。</td></tr><tr><td>financial_expense</td><td>财务费用(元)</td><td>财务费用指企业在生产经营过程中为筹集资金而发生的筹资费用。包括企业生产经营期间发生的利息支出（减利息收入）、汇兑损益（有的企业如商品流通企业、保险企业进行单独核算，不包括在财务费用）、金融机构手续费，企业发生的现金折扣或收到的现金折扣等。但在企业筹建期间发生的利息支出，应计入开办费；为购建或生产满足资本化条件的资产发生的应予以资本化的借款费用，在“在建工程”、“制造费用”等账户核算。</td></tr><tr><td>asset_impairment_loss</td><td>资产减值损失(元)</td><td>资产减值损失是指因资产的账面价值高于其可收回金额而造成的损失。 新会计准则规定资产减值范围主要是固定资产、无形资产以及除特别规定外的其他资产减值的处理。《资产减值》准则改变了固定资产、无形资产等的减值准备计提后可以转回的做法，资产减值损失一经确认，在以后会期间不得转回，消除了一些企业通过计提秘密准备来调节利润的可能，限制了利润的人为波动。资产减值损失在会计核算中属于损益类科目。</td></tr><tr><td>fair_value_variable_income</td><td>公允价值变动收益(元)</td><td>“公允价值变动收益” 这个科目，是“以公允价值计量且其变动计入当期损益的交易性金融资产”的一个科目。在资产负债表日，“交易性金融资产”的公允价值高于其账面价值的差额，应借记“交易性金融资产－公允价值变动”，贷记“公允价值变动损益”，公允价值低于其账面价值的差额，则做相反的分录。</td></tr><tr><td>investment_income</td><td>投资收益(元)</td><td>投资收益是对外投资所取得的利润、股利和债券利息等收入减去投资损失后的净收益。严格地讲，所谓投资收益是指以项目为边界的货币收入等。</td></tr><tr><td>invest_income_associates</td><td>对联营企业和合营企业的投资收益(元)</td><td>持有的对联营企业及合营企业的投资，按照《企业会计准则第2号——长期股权投资》的规定，应当采用权益法核算，在按持股比例等计算确认应享有或应分担被投资单位的净损益时，应当考虑以下因素：投资企业与联营企业及合营企业之间发生的内部交易损益按照持股比例计算归属于投资企业的部分，应当予以抵销，在此基础上确认投资损益。&lt;br&gt;投资企业与被投资单位发生的内部交易损失，按照《企业会计准则第8号———资产减值》等规定属于资产减值损失的，应当全额确认。&lt;br&gt;投资企业对于纳入其合并范围的子公司与其联营企业及合营企业之间发生的内部交易损益，也应当按照上述原则进行抵销，在此基础上确认投资损益。&lt;br&gt;投资企业对于首次执行日之前已经持有的对联营企业及合营企业的长期股权投资，如存在与该投资相关的股权投资借方差额，还应扣除按原剩余期限直线摊销的股权投资借方差额，确认投资损益。&lt;br&gt;投资企业在被投资单位宣告发放现金股利或利润时，按照规定计算应分得的部分确认应收股利，同时冲减长期股权投资的账面价值。</td></tr><tr><td>exchange_income</td><td>汇兑收益(元)</td><td>汇兑收益，是指用记账本位币，按照不同的汇率报告相同数量的外币而产生的差额。简单地说，就是公司的外币货币性项目和非货币性项目因汇率变动，在折算成本币时造成损益。而这部分汇兑差额作为财务费用，计入当期损益，从而影响公司利润。</td></tr><tr><td>operating_profit</td><td>营业利润(元)</td><td>营业利润是企业最基本经营活动的成果，也是企业一定时期获得利润中最主要、最稳定的来源。2006年财政部颁布的新企业会计准则-30号财务报表列报中已对营业利润进行了调整，将投资收益调入营业利润，同时取消了主营业务利润和其他业务利润的提法，补贴收入被并入营业外收入，营业利润减营业外收支调整即得到利润总额。</td></tr><tr><td>non_operating_revenue</td><td>营业外收入(元)</td><td>营业外收入是指企业确认与企业生产经营活动没有直接关系的各种收入。</td></tr><tr><td>non_operating_expense</td><td>营业外支出(元)</td><td>营业外支出是企业发生的与其日常活动无直接关系的各项损失，主要包括非流动资产处置损失、公益性捐赠支出、盘亏损失、非常损失、罚款支出等。</td></tr><tr><td>disposal_loss_non_current_liability</td><td>非流动资产处置净损失(元)</td><td>“非流动资产处置损失”属于损益类的科目，在编制利润表时这些科目如果有本期发生额，要填在利润表中。“非流动资产处置损失”是营业外支出的明细科目，在损益表中计入“营业外支出”，“营业外支出”下方会单独列示“非流动资产处置损失”，但是包括在“营业外支出”项目中。</td></tr><tr><td>total_profit</td><td>利润总额(元)</td><td>利润总额指企业在生产经营过程中各种收入扣除各种耗费后的盈余，反映企业在报告期内实现的盈亏总额。</td></tr><tr><td>income_tax_expense</td><td>所得税费用(元)</td><td>所得税费用是指企业经营利润应交纳的所得税。“所得税费用”，核算企业负担的所得税，是损益类科目；这一般不等于当期应交所得税，因为可能存在“暂时性差异”。如果只有永久性差异，则等于当期应交所得税。</td></tr><tr><td>net_profit</td><td>净利润(元)</td><td>净利润（收益）是指在利润总额中按规定交纳了所得税后公司的利润留成，一般也称为税后利润或净利润。净利润的计算公式为：净利润=利润总额-所得税费用.净利润是一个企业经营的最终成果，净利润多，企业的经营效益就好；净利润少，企业的经营效益就差，它是衡量一个企业经营效益的主要指标。</td></tr><tr><td>np_parent_company_owners</td><td>归属于母公司股东的净利润(元)</td><td>准确来讲应称之为“归属于上市公司股东的净利润”，这是因为净利润都归属于股东，只是在合并报表中的净利润有一部分是归属于子公司的其它股东的，这些子公司的其它股东也依法按比例享有子公司的净利润。</td></tr><tr><td>minority_profit</td><td>少数股东损益(元)</td><td>少数股东损益是一个流量概念，是指公司合并报表的子公司其它非控股股东享有的损益，需要在利润表中予以扣除。利润表的“净利润”项下可以分“归属于母公司所有者的净利润”和“少数股东损益”。其对应的存量概念是“少数股东权益”。</td></tr><tr><td>basic_eps</td><td>基本每股收益(元)</td><td>理论算法：归属于普通股股东的当期净利润/(当期实际发行在外的普通股加权平均数=∑(发行在外普通股股数×发行在外月份数)／12)</td></tr><tr><td>diluted_eps</td><td>稀释每股收益(元)</td><td>理论算法：归属于普通股股东的当期净利润(扣除当期已确认为费用的稀释性潜在普通股的利息、稀释性潜在普通股转换时将产生的收益或费用、相关所得税的影响)/假设稀释性潜在普通股于当期期初(或发行日)已经全部转换为普通股，于此计算的普通股股数的加权平均数。</td></tr><tr><td>other_composite_income</td><td>其他综合收益(元)</td><td>其他综合收益是指企业根据企业会计准则规定未在损益中确认的各项利得和损失扣除所得税影响后的净额。企业在计算利润表中的其他综合收益时，应当扣除所得税影响；在计算合并利润表中的其他综合收益时，除了扣除所得税影响以外，还需要分别计算归属于母公司所有者的其他综合收益和归属于少数股东的其他综合收益。</td></tr><tr><td>total_composite_income</td><td>综合收益总额(元)</td><td>综合收益总额项目，反映企业净利润与其他综合收益的合计金额。综合收益，包括其他综合收益和综合收益总额。其中，其他综合收益反映企业根据企业会计准则规定未在损益中确认的各项利得和损失扣除所得税影响后的净额；综合收益总额是企业净利润与其他综合收益的合计金额。</td></tr><tr><td>ci_parent_company_owners</td><td>归属于母公司所有者的综合收益总额(元)</td><td>综合收益是指除所有者的出资额和各种为第三方或客户代收的款项以外的各种收入。根据美国财务会计准则委员会（FASB）1980年在第3号财务会计概念公告(SFAC3）（企业财务报表的要素）（后为1985年发布的SFAC6所取代）的解释，综合收益是指“一个主体在某一期间与非业主方面进行交易或发生其他事项和情况所引起的权益（净资产）变动。它包括这一期间内除业主投资和派给业主款外，一切权益上的变动。”</td></tr><tr><td>ci_minority_owners</td><td>归属于少数股东的综合收益总额(元)</td><td>综合收益是指除所有者的出资额和各种为第三方或客户代收的款项以外的各种收入。根据美国财务会计准则委员会（FASB）1980年在第3号财务会计概念公告(SFAC3）（企业财务报表的要素）（后为1985年发布的SFAC6所取代）的解释，综合收益是指“一个主体在某一期间与非业主方面进行交易或发生其他事项和情况所引起的权益（净资产）变动。它包括这一期间内除业主投资和派给业主款外，一切权益上的变动。”</td></tr></tbody></table>

**获取所有公司最近季度的利润表**

```python
df=get_fundamentals(query(income))
print(df[:4])

         id         code         day     pubDate    statDate  \
0  30660113  000001.XSHE  2021-03-14  2021-02-02  2020-12-31   
1  31192442  000002.XSHE  2021-03-14  2020-10-30  2020-09-30   
2  31366704  000004.XSHE  2021-03-14  2020-10-30  2020-09-30   
3  31021334  000005.XSHE  2021-03-14  2020-10-29  2020-09-30   

   total_operating_revenue  operating_revenue  interest_income  \
0             3.697800e+10       3.697800e+10     4.640600e+10   
1             9.514196e+10       9.514196e+10              NaN   
2             9.349824e+07       9.349824e+07              NaN   
3             8.484838e+07       8.484838e+07              NaN   

   premiums_earned  commission_income         ...          income_tax_expense  \
0              NaN       1.345300e+10         ...                1.398000e+09   
1              NaN                NaN         ...                3.945203e+09   
2              NaN                NaN         ...                4.272845e+06   
3              NaN                NaN         ...                2.525845e+04   

     net_profit  np_parent_company_owners  minority_profit  basic_eps  \
0  6.530000e+09              6.530000e+09              NaN     0.2900   
1  1.144235e+10              7.355308e+09     4.087041e+09     0.6330   
2  5.275023e+07              5.486628e+07    -2.116048e+06     0.3324   
3  5.743845e+06              4.557176e+06     1.186669e+06     0.0043   

   diluted_eps  other_composite_income  total_composite_income  \
0       0.2900            -350000000.0            6.180000e+09   
1       0.6330             174751840.0            1.161710e+10   
2       0.3324                     NaN            5.275023e+07   
3       0.0043                     NaN            5.743845e+06   

   ci_parent_company_owners  ci_minority_owners  
0                       NaN                 NaN  
1              7.553908e+09        4.063192e+09  
2              5.486628e+07       -2.116048e+06  
3              4.557176e+06        1.186669e+06  

[4 rows x 43 columns]
```

**获取某只股票的利润表数据**

```python
# 查询'000002.XSHE'的利润表数据
q = query(
    income
).filter(
    income.code == '000002.XSHE'
)
# 运行时间2020-10-15
df = get_fundamentals(q,'2020-10-15')
# pubDate公司发布财报的日期,statDate财报统计的季度的最后一天,total_operating_revenue    营业总收入
df[['pubDate','statDate','total_operating_revenue']]

#输出
      pubDate    statDate  total_operating_revenue
0  2020-08-28  2020-06-30             9.857516e+10
```

<a id="专项指标（银行业券商保险）"></a>

#### 专项指标（银行业/券商/保险）

-   **更新时间：2005至今，每天24：00更新**

<a id="bank_indicator"></a>

### bank\_indicator

**银行业**

按年度更新，统计周期是一年度。 通过get\_fundamentals(query\_object,statDate=None) statDate传入年查询。当传入 date 参数 或 statDate 传入季度时返回空。

**注意**： （详细内容可看get\_fundamentals接口）

-   date和statDate参数只能传入一个:
-   传入date时, 查询指定日期date收盘后所能看到的最近(对市值表来说, 最近一天, 对其他表来说, 最近一个季度)的数据
-   statDate: 财报统计的季度或者年份,。 季度: 格式是**年 + 'q' + 季度序号**, 例如: **'2015q1', '2013q4'**. 年份: 格式就是**年份的数字**, 例如:**'2015', '2016'**.

**表名: bank\_indicator**

| 列名 | 列的含义 | 解释 |
| --- | --- | --- |
| code | 股票代码 | 带后缀.XSHE/.XSHG |
| pubDate | 日期 | 公司发布财报日期 |
| statDate | 日期 | 财报统计的季度的最后一天, 比如2016-12-31 |
| total\_loan | 贷款总额 | 银行发放的贷款总额 |
| total\_deposit | 存款总额 | 银行的存款总额 |
| interest\_earning\_assets | 生息资产 | 生息资产是指贷款、投资等业务形式上的资产，能为银行的经营带来收入 |
| non\_interest\_earning\_assets | 非生息资产 | 非生息资产 |
| interest\_earning\_assets\_yield | 生息资产收益率 | 生息资产收益率 |
| interest\_bearing\_liabilities | 计息负债 | 计息负债指银行负债当中需要支付利息的债务 |
| non\_interest\_bearing\_liabilities | 非计息负债 | 非计息负债 |
| interest\_bearing\_liabilities\_interest\_rate | 计息负债成本率 | 计息负债成本率 |
| non\_interest\_income | 非利息收入 | 非利息收入 |
| non\_interest\_income\_ratio | 非利息收入占比 | 非利息收入占比为非利息收入占全部收入的比例 |
| net\_interest\_margin | 净息差 | 净息差指的是银行净利息收入和银行全部生息资产的比值 |
| net\_profit\_margin | 净利差 | 净利差是指平均生息资产收益率与平均计息负债成本率之差 |
| core\_level\_capital | 核心一级资本(2013) | 核心一级资本 |
| net\_core\_level\_capital | 核心一级资本净额(2013) | 核心一级资本净额 |
| core\_level\_capital\_adequacy\_ratio | 核心一级资本充足率(2013) | 核心一级资本充足率 |
| net\_level\_1\_capital | 一级资本净额(2013) | 一级资本净额 |
| level\_1\_capital\_adequacy\_ratio | 一级资本充足率(2013) | 一级资本充足率 |
| net\_capital | 资本净额(2013) | 资本净额为核心资本加上附属资本减去扣减项 |
| capital\_adequacy\_ratio | 资本充足率（2013） | 资本充足率是一个银行的资产对其风险的比率 |
| weighted\_risky\_asset | 风险加权资产合计（2013） | 风险加权资产合计 |
| deposit\_loan\_ratio | 存贷款比例 | 存贷款比例是指将银行的贷款总额与存款总额进行对比 |
| short\_term\_asset\_liquidity\_ratio\_CNY | 短期资产流动性比例（人民币） | 人民币的短期资产流动性比例 |
| short\_term\_asset\_liquidity\_ratio\_FC | 短期资产流动性比例（外币） | 外币的短期资产流动性比例 |
| Nonperforming\_loan\_rate | 不良贷款率 | 金融机构不良贷款占总贷款余额的比重 |
| single\_largest\_customer\_loan\_ratio | 单一最大客户贷款比例 | 单一最大客户贷款额占全部贷款余额的比例 |
| top\_ten\_customer\_loan\_ratio | 最大十家客户贷款比例 | 最大十家客户贷款额占全部贷款余额的比例 |
| bad\_debts\_reserve | 贷款呆账准备金 | 贷款呆账准备金 |
| non\_performing\_loan\_provision\_coverage | 不良贷款拨备覆盖率 | 不良贷款拨备覆盖率是衡量商业银行贷款损失准备金计提是否充足的一个重要指标。该项指标从宏观上反映银行贷款的风险程度及社会经济环境、诚信等方面的情况。不良贷款拨备覆盖率=贷款损失准备/(次级类资产+可疑类资产+损失类资产)\*100% |
| cost\_to\_income\_ratio | 成本收入比 | 成本收入比为业务及管理费占营业收入的比例。成本收入比=业务及管理费/营业收入 |
| former\_core\_capital | 核心资本 (旧) | 核心资本净额为核心资本减去核心资本扣减项。 |
| former\_net\_core\_capital | 核心资本净额（旧） |  |
| former\_net\_core\_capital\_adequacy\_ratio | 核心资本充足率 (旧) | 核心资本充足率是指核心资本与加权风险资产总额的比率 |
| former\_net\_capital | 资本净额 (旧) | 资本净额为核心资本加上附属资本减去扣减项 |
| former\_capital\_adequacy\_ratio | 资本充足率 (旧) | 资本充足率是一个银行的资产对其风险的比率 |
| former\_weighted\_risky\_asset | 加权风险资产净额（旧） | 加权风险资产净额是指对银行的资产加以分类，根据不同类别资产的风险性质确定不同的风险系数，以这种风险系数为权重求得的资产净额。 |
| **银行贷款的五级分类指标** |  |  |
| normal\_amount | 正常-金额 | 正常类贷款余额 |
| normal\_amount\_ratio | 正常金额占比 | 正常类贷款占贷款总额的比例。正常金额占比=正常类贷款/(正常类贷款+关注类贷款+次级类贷款+可疑类贷款+损失类贷款)\*100% |
| concerned\_amount | 关注-金额 | 关注类贷款余额 |
| concerned\_amount\_ratio | 关注金额占比 | 关注类贷款占贷款总额的比例。关注金额占比=关注类贷款/(正常类贷款+关注类贷款+次级类贷款+可疑类贷款+损失类贷款)\*100% |
| secondary\_amount | 次级-金额 | 次级类贷款余额 |
| secondary\_amount\_ratio | 次级金额占比 | 次级类贷款占贷款总额的比例。次级金额占比=次级类贷款/(正常类贷款+关注类贷款+次级类贷款+可疑类贷款+损失类贷款)\*100% |
| suspicious\_amount | 可疑-金额 | 可疑类贷款余额 |
| suspicious\_amount\_ratio | 可疑金额占比 | 可疑类贷款占贷款总额的比例。可疑金额占比=可疑类贷款/(正常类贷款+关注类贷款+次级类贷款+可疑类贷款+损失类贷款)\*100% |
| loss\_amount | 损失-金额 | 损失类贷款余额 |
| loss\_amount\_ratio | 损失金额占比 | 损失类贷款占贷款总额的比例。损失金额占比=损失类贷款/(正常类贷款+关注类贷款+次级类贷款+可疑类贷款+损失类贷款)\*100% |
| **平均贷款利率** |  |  |
| short\_term\_loan\_average\_balance | 短期贷款-平均余额 | 短期贷款的平均余额 |
| short\_term\_loan\_annualized\_average\_interest\_rate | 短期贷款-年平均利率 | 短期贷款的年平均利率 |
| mid\_term\_loan\_annualized\_average\_balance | 中长期贷款-平均余额 | 中长期贷款的平均余额 |
| mid\_term\_loan\_annualized\_average\_interest\_rate | 中长期贷款-年平均利率 | 中长期贷款的年平均利率 |
| enterprise\_deposits\_average\_balance | 企业存款-平均余额 | 企业存款的平均余额 |
| enterprise\_deposits\_average\_interest\_rate | 企业存款-年平均利率 | 企业存款的年平均利率 |
| savings\_deposit\_average\_balance | 储蓄存款-平均余额 | 储蓄存款的平均余额 |
| savings\_deposit\_average\_interest\_rate | 储蓄存款-年平均利率 | 储蓄存款的年平均利率 |

```python
# 获取2019年银行业专项指标
df=get_fundamentals(query(bank_indicator),statDate=2019)[:5]
# pubDate公司发布财报的日期,statDate财报统计的季度的最后一天,total_loan贷款总额
print(df[['code','pubDate','statDate','total_loan']])

          code     pubDate    statDate    total_loan
0  000001.XSHE  2020-02-14  2019-12-31  2.328909e+12
1  600036.XSHG  2020-03-21  2019-12-31  4.500199e+12
2  002948.XSHE  2020-03-21  2019-12-31  1.735679e+11
3  601860.XSHG  2020-03-25  2019-12-31  1.019562e+11
4  601658.XSHG  2020-03-26  2019-12-31  4.974186e+12
```

<a id="security_indicator"></a>

### security\_indicator

**券商**

按年度更新，统计周期是一年度。通过get\_fundamentals(query\_object,statDate=None) statDate传入年查询。当传入 date 参数 或 statDate 传入季度时返回空。

**表名: security\_indicator**

| 列名 | 列的含义 | 解释 |
| --- | --- | --- |
| code | 股票代码 | 带后缀.XSHE/.XSHG |
| pubDate | 日期 | 公司发布财报日期 |
| statDate | 日期 | 财报统计的季度的最后一天, 比如2015-03-31, 2015-06-30 |
| net\_capital | 净资本 | 净资本是衡量证券公司资本充足和资产流动性状况的一个综合性监管指标，是证券公司净资产中流动性较高、可快速变现的部分，它表明证券公司可随时用于变现以满足支付需要的资金数额。为公布的母公司净资本及相关风险控制指标之一。 |
| net\_assets | 净资产 | 为公布的母公司净资本及相关风险控制指标之一。 |
| net\_capital\_to\_reserve | 净资本/各项风险准备之和 | 为公布的母公司净资本及相关风险控制指标之一。 |
| net\_capital\_to\_net\_asset | 净资本/净资产 | 净资本/净资产 |
| net\_capital\_to\_debt | 净资本/负债 | 净资本/负债 |
| net\_asset\_to\_debt | 净资产/负债 | 净资产/负债 |
| net\_capital\_to\_sales\_department\_number | 净资本/营业部家数 | 净资本/营业部家数 |
| own\_stock\_to\_net\_capital | 自营股票规模/净资本 | 自营股票规模/净资本 |
| own\_security\_to\_net\_capital | 证券自营业务规模/净资本 | 证券自营业务规模/净资本 |
| operational\_risk\_reserve | 营运风险堆备 | 营运风险堆备 |
| broker\_risk\_reserve | 经纪业务风险堆备 | 经纪业务风险堆备 |
| own\_security\_risk\_reserve | 证券自营业务风险准备 | 证券自营业务风险准备 |
| security\_underwriting\_reserve | 证券承消业务风险准备 | 证券承消业务风险准备 |
| asset\_management\_reserve | 证券资产菅理业务风险准备 | 证券资产菅理业务风险准备 |
| own\_equity\_derivatives\_to\_net\_capital | 自营权益类证券及证券衍生品/净资本 | 自营权益类证券及证券衍生品/净资本 |
| own\_fixed\_income\_to\_net\_capital | 自营固定收益类证券/净资本 | 自营固定收益类证券/净资本 |
| margin\_trading\_reserve | 融资融券业务风险资本准备 | 融资融券业务风险资本准备 |
| branch\_risk\_reserve | 分支机构风险资本堆备 | 分支机构风险资本堆备 |

```python
# 获取券商业专项指标
df=get_fundamentals(query(security_indicator),statDate=2019)[:5]
# pubDate公司发布财报的日期,statDate财报统计的季度的最后一天,net_capital净资本
print(df[['code','pubDate','statDate','net_capital']])

          code     pubDate    statDate   net_capital
0  000987.XSHE  2020-02-29  2019-12-31  8.279037e+09
1  601878.XSHG  2020-03-19  2019-12-31  1.251134e+10
2  600030.XSHG  2020-03-20  2019-12-31  9.490422e+10
3  002736.XSHE  2020-03-20  2019-12-31  4.005491e+10
4  601211.XSHG  2020-03-25  2019-12-31  8.597149e+10
```

<a id="insurance_indicator"></a>

### insurance\_indicator

**保险**

按年度更新，统计周期是一年度。 通过get\_fundamentals(query\_object,statDate=None) statDate传入年查询。当传入 date 参数 或 statDate 传入季度时返回空。

**表名: insurance\_indicator**

| 列名 | 列的含义 | 解释 |
| --- | --- | --- |
| code | 股票代码 | 带后缀.XSHE/.XSHG |
| pubDate | 日期 | 公司发布财报日期 |
| statDate | 日期 | 财报统计的季度的最后一天, 比如2016-12-31 |
| investment\_assets | 投资资产 | 投资资产 |
| total\_investment\_rate\_of\_return | 总投资收益率 | 总投资收益率 |
| net\_investment\_rate\_of\_return | 净投资收益率 | 净投资收益率 |
| earned\_premium | 己赚保费 | 己赚保费 |
| earned\_premium\_growth\_rate | 己赚保费增长率 | 己赚保费增长率 |
| payoff\_cost | 赔付支出 | 赔付支出 |
| compensation\_rate | 退保率(寿险业务) | 寿险业务退保率 |
| not\_expired\_duty\_reserve | 未到期责任准备金（产险业务） | 产险业务未到期责任准备金 |
| outstanding\_claims\_reserve | 未决赔款准备金（产险业务） | 产险业务未决赔款准备金 |
| comprehensive\_cost\_ratio | 综台成本率（产险业务） | 产险业务综台成本率 |
| comprehensive\_compensation\_rate | 综台赔付率（产险业务） | 产险业务综台赔付率 |
| solvency\_adequacy\_ratio | 偿付能力充足率 | 偿付能力充足率 |
| actual\_capital | 实际资本 | 实际资本 |
| minimum\_capital | 最低资本 | 最低资本 |

```python
# 获取保险业专项指标
df=get_fundamentals(query(insurance_indicator),statDate=2019).tail(5)    
# pubDate公司发布财报的日期,statDate财报统计的季度的最后一天,net_capital净资本
df[['code','pubDate','statDate','total_investment_rate_of_return']]

          code     pubDate    statDate  total_investment_rate_of_return
1  601601.XSHG  2020-03-23  2019-12-31                             5.40
2  601628.XSHG  2020-03-26  2019-12-31                             5.23
3  601336.XSHG  2020-03-26  2019-12-31                             4.90
4  000627.XSHE  2020-04-15  2019-12-31                              NaN
5  600291.XSHG  2020-04-30  2019-12-31                            -2.18
```

<a id="报告期财务数据"></a>

### 报告期财务数据

<a id="通用财务报表"></a>

#### 通用财务报表

-   **更新时间：2005至今，每天18:00-24:00更新**
