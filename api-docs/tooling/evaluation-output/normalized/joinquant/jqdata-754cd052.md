---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 指数
section_path:
  - JQData使用说明
  - 指数
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#指数"
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

<a id="指数"></a>

## 指数

<a id="指数概况"></a>

### 指数概况

-   **更新时间：2005至今，8:00更新**

<a id="get_security_info"></a>

### get\_security\_info

**获取单只指数信息**

```python
get_security_info(code)
```

获取股票/基金/指数的信息.

**参数**

-   code: 指数代码

**返回值**

-   一个对象, 有如下属性:

    -   display\_name: 中文名称
    -   name: 缩写简称
    -   start\_date: 上市日期, \[datetime.date\] 类型
    -   end\_date: 退市日期， \[datetime.date\] 类型, 如果没有退市则为2200-01-01
    -   type: 类型，index(指数)

**示例**

```python
# 获取沪深300指数的中文名称
get_security_info("000300.XSHG").display_name
# 获取沪深300指数的缩写简称
get_security_info("000300.XSHG").name
# 获取沪深300指数的上市日期
get_security_info("000300.XSHG").start_date
#获取沪深300指数的类型
get_security_info("000300.XSHG").type
```

<a id="get_all_securities"></a>

### get\_all\_securities

**获取所有指数信息**

```python
get_all_securities(types=[], date=None)
```

获取平台支持的所有股票、基金、指数、期货信息

**参数**

-   types:'index'。**types为空时返回所有股票, 不包括基金,指数和期货**
-   date: 日期, 一个字符串或者 \[datetime.datetime\]/\[datetime.date\] 对象, 用于获取某日期还在上市的股票信息. 默认值为 None, 表示获取所有日期的股票信息

**返回** 返回\[pandas.DataFrame，如案例所示

-   display\_name: 中文名称
-   name: 缩写简称
-   start\_date: 上市日期
-   end\_date: 退市日期，如果没有退市则为2200-01-01
-   type: 类型，index(指数)

**示例**

```python
# 获得所有指数列表
df=get_all_securities(['index'])
print(df[:4])

            display_name  name start_date   end_date   type
000001.XSHG         上证指数  SZZS 1991-07-15 2200-01-01  index
000002.XSHG         A股指数  AGZS 1992-02-21 2200-01-01  index
000003.XSHG         B股指数  BGZS 1992-02-21 2200-01-01  index
000004.XSHG         工业指数  GYZS 1993-05-03 2200-01-01  index
```

<a id="指数行情数据"></a>

### 指数行情数据

-   **日行情：2005至今**
-   **分钟行情：2005至今**

<a id="get_price"></a>

### get\_price

**（1天/分钟）行情数据**

```python
get_price(security, start_date=None, end_date=None, frequency='daily', fields=None, skip_paused=False, fq='pre', count=None, panel=True, fill_paused=True)
```

-   获取一支或者多只指数数据
-   frequency为非一天或者一分钟，请使用get\_bars;
-   取多支标的的数据时，不要获取交易时段不同的标的（例如：不同交易时间的期货标的），否则会报错；
-   这里在使用时注意 end\_date 的设置，不要引入未来的数据；
-   标识时间为09:32:00的1分钟k线，其数据时间为09:31:00至09:31:59；
-   end\_date：**当天 09:00 ~ 15:00 的行情在 15:00 之后可以获取。**注意：当end\_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间
-   get\_price指定frequency为 非1m/1d时，fields选择'high\_limit','low\_limit'会报错

**关于停牌**: 因为此API可以获取多只股票的数据, 可能有的股票停牌有的没有, 为了保持时间轴的一致,

我们默认没有跳过停牌的日期, 停牌时使用停牌前的数据填充. 如想跳过, 请使用 skip\_paused=True 参数, 注意当 panel=True 且获取多标的时不支持(panel结构需要索引对齐)

```python
get_price(security, start_date=None, end_date=None, frequency='daily', fields=None, skip_paused=False, fq='pre', count=None)
```

**参数**

<table><tbody><tr><td><strong>参数名称</strong></td><td><strong>参数说明</strong></td><td><strong>注释</strong></td></tr><tr><td>security</td><td>标的</td><td>可获取种类：股票、期货、基金、指数、期权</td></tr><tr><td>start_date</td><td>开始时间，不可与count同时使用。当'count'和'start_date'为None时, 默认值是 '2015-01-01 00:00:00'</td><td>当指定frequency为minute时，如果只传入日期，则日内时间为当日的 00:00:00</td></tr><tr><td>end_date</td><td>结束时间，如无指定，默认为'2015-12-31 00:00:00'。当end_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间</td><td><p>当指定frequency为minute时, 如果只传入日期, 则日内时间为当日的 00:00:00，</p><p>所以返回的数据不包括 end_date这天。</p></td></tr><tr><td>count</td><td>表示获取 end_date 之前几个 frequency 的数据，与start_date不可同时使用。</td><td>返回的结果集的行数, 即表示获取 end_date 之前count个 frequency 的数据</td></tr><tr><td>frequency</td><td>单位时间长度，即指定获取的时间频级为分钟级（minute）或日级（daily）,也可以指定为 '3m','10d' 等</td><td><p>daily'(同'1d')， 'minute'(同'1m')，</p><p><a href="https://www.joinquant.com/view/community/detail/cea095760a0583ce965964912580077e?type=1">点击查看get_price和get_bars的合成逻辑。</a>如需5分钟,1小时等标准bar请使用get_bars</p></td></tr><tr><td>fields</td><td>所获取数据的字段名称，即表头。默认是None(返回标准字段['open','close','high','low','volume','money'])</td><td><p>可选择填入以下字段，字段说明可查阅下面fields表</p><p>['open','close','low','high','volume','money','factor',</p><p>'high_limit','low_limit','avg','pre_close','paused','open_interest'],</p><p>open_interest为期货持仓量</p></td></tr><tr><td>skip_paused</td><td>是否跳过不交易日期(含：停牌/未上市/退市后的日期)</td><td>如果不跳过, 停牌时会使用停牌前的数据填充，上市前或者退市后数据都为 nan。</td></tr><tr><td>fill_paused</td><td>对于停牌股票的价格处理，默认为True</td><td>默认为True,用pre_close价格填充);False 表示使用NAN填充停牌的股票价格。</td></tr><tr><td>fq</td><td>复权选项，默认为前复权（fq='pre'）</td><td>'pre'：前复权 / 'none'：不复权, 返回实际价格 / 'post'：后复权</td></tr><tr><td>panel</td><td>指定返回的数据格式为panel</td><td><p>默认为True；指定panel=False时返回dataframe格式；</p><p>如本地pandas版本大于0.25将强制返回dataframe详见案例</p></td></tr></tbody></table>

**fields**内各字段属性

<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>注释</strong></td></tr><tr><td>open</td><td>时间段开始时价格</td><td></td></tr><tr><td>close</td><td>时间段结束时价格</td><td></td></tr><tr><td>low</td><td>时间段中的最低价</td><td></td></tr><tr><td>high</td><td>时间段中的最高价</td><td></td></tr><tr><td>volume</td><td>时间段中的成交的股票数量</td><td>单位股</td></tr><tr><td>money</td><td>时间段中的成交的金额</td><td></td></tr><tr><td>factor</td><td>pre':前复权(默认)/None:不复权,返回实际价格/'post':后复权</td><td><p>前(后)复权数据=价格×前(后)复权因子;</p><p>前(后)复权后的成交量=成交量 / 前(后)复权因子;</p><p>成交额不处理</p></td></tr><tr><td>high_limit</td><td>时间段中的涨停价</td><td></td></tr><tr><td>low_limit</td><td>时间段中的跌停价</td><td></td></tr><tr><td>avg</td><td>时间段中的平均价</td><td><p>(1)天级别：股票是成交额除以成交量；期货是直接从CTP行情获取的，计算方法为成交额除以成交量再除以合约乘数；</p><p>(2)分钟级别：用该分钟所有tick的现价乘以该tick的成交量加起来之后，再除以该分钟的成交量。</p></td></tr><tr><td>pre_close</td><td>前一个单位时间结束时的价格,按天则是前一天的收盘价</td><td>期货：pre_close--前一天结算；建议使用get_extras获取结算价；在分钟频率下pre_close=open</td></tr><tr><td>paused</td><td>bool值,股票是否停牌;</td><td>停牌时open/close/low/high/pre_close；都等于停牌前的收盘价, volume=money=0</td></tr></tbody></table>

**返回**

-   请注意, 为了方便比较一只指数的多个属性, 同时也满足对比多只指数的一个属性的需求, 我们在security参数是**一只指数和多只指数时返回的结构完全不一样 (默认panel=True时)**

**代码示例**

**获取一支指数**

```python
# 获得上证指数的2018年08月01日 10:00:00-2018年08月01日 10:05:00的分钟数据
df = get_price('000001.XSHG', start_date='2018-08-01 10:00:00', end_date='2018-08-01 10:05:00', frequency='1m')
# 返回[pandas.DataFrame]对象, 行索引是[datetime.datetime]对象, 列索引是行情字段名字
print(df[:5])

                        open    close     high      low       volume  \
2018-08-01 10:00:00  2895.33  2896.48  2896.48  2895.33  105555600.0   
2018-08-01 10:01:00  2897.39  2894.12  2897.39  2894.12  106207600.0   
2018-08-01 10:02:00  2893.73  2892.71  2893.73  2892.05   94199600.0   
2018-08-01 10:03:00  2892.74  2892.19  2892.74  2891.62   75960400.0   
2018-08-01 10:04:00  2891.84  2891.77  2892.42  2891.56   68796400.0   

                            money  
2018-08-01 10:00:00  1.165263e+09  
2018-08-01 10:01:00  1.113068e+09  
2018-08-01 10:02:00  9.975439e+08  
2018-08-01 10:03:00  7.984701e+08  
2018-08-01 10:04:00  7.453942e+08  
```

**获取多只指数**

```python
#获得上证指数和A股指数在2018-08-01 10:00:00至2018-08-01 10:05:00的分钟数据，返回[pandas.Panel]对象
panel=get_price(['000001.XSHG','000002.XSHG'],start_date='2018-08-01 10:00:00', end_date='2018-08-01 10:05:00', frequency='1m')
#返回[pandas.DataFrame]对象,行索引是[datetime.datetime]对象, 列索引是指数代号
df=panel['open'][:4]
print(df)

                     000001.XSHG  000002.XSHG
2018-08-01 10:00:00      2895.33      3032.32
2018-08-01 10:01:00      2897.39      3034.48
2018-08-01 10:02:00      2893.73      3030.63
2018-08-01 10:03:00      2892.74      3029.60
```

<a id="get_bars"></a>

### get\_bars

**指定时间周期的指数行情（支持时间周期：'1m','5m', '15m', '30m', '60m', '120m', '1w', '1M'）**

```python
get_bars(security, count, unit='1d',
         fields=['date','open','high','low','close'],
         include_now=False, end_dt=None, fq_ref_date=None,df=True)
```

获取各种时间周期的bar数据，bar的分割方式与主流股票软件相同， 同时还支持返回当前时刻所在 bar 的数据。

**参数**

-   security: 指数代码，支持单个及多个标的
-   count: 大于0的整数，表示获取bar的个数。如果行情数据的bar不足count个，返回的长度则小于count个数。
-   unit: bar的时间单位
    当unit为'1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w'(一周), '1M'（一月）标准bar时，bar的分割方式与主流股票软件类似，期货的bar各平台也许稍微有差异，我们与文华接近；
    当unit为非上述标准bar时('xm', 例如'3m')，只支持分钟级别的,x需要小于240，以每天的开盘为起始点，每x分钟为一条bar；
-   fields: 获取数据的字段， 支持如下值：'date', 'open', 'close', 'high', 'low', 'volume', 'money', 'open\_interest'（期货持仓量），factor(复权因子)。
-   include\_now: 取值True 或者False。 表示是否包含end\_dt所在的bar, 比如end\_dt指定为9:38:00，unit参数为5m， 如果 include\_now=True,则返回的最后一条bar为9:35:00-9:38:00这个 bar，否则返回的最后一条bar为09:30:00-09:35:00的bar。
-   end\_dt：查询的截止时间，支持的类型为datetime.datetime或None，默认为datetime.now()。
-   fq\_ref\_date：复权基准日期，为None时为不复权数据。
    -   如果用户输入 fq\_ref\_date = None, 则获取到的是不复权的数据
    -   如果用户想获取后复权的数据，可以将fq\_ref\_date 指定为一个很早的日期，比如 datetime.date(2000, 1, 1)
    -   定点复权，以某一天价格点位为参照物，进行的前复权或后复权。设置为datetime.datetime.now()即返回前复权数据 ;
-   df：默认为True，指定返回数据为dataframe结构；当df=False的时候，传入单个标的时，返回一个np.ndarray，多个标的返回一个字典，key是code，value是np.array

**返回**

返回一个pandas.dataframe对象，可以按任意周期返回指数的开盘价、收盘价、最高价、最低价，同时也可以利用date数据查看所返回的数据是什么时刻的。

**示例**

```python
#获取沪深300按天为周期以"2020-9-16"为基础往前8个交易日的数据
df = get_bars('000300.XSHG', 8, unit='1d',fields=['date','open','high','low','close'],include_now=False,end_dt='2020-9-16')
print(df)

# 输出
         date     open     high      low    close
0  2020-09-04  4737.24  4778.20  4726.56  4770.22
1  2020-09-07  4759.52  4789.30  4655.56  4669.37
2  2020-09-08  4683.83  4707.90  4639.05  4694.39
3  2020-09-09  4634.25  4645.20  4558.03  4584.59
4  2020-09-10  4632.10  4647.75  4572.21  4581.98
5  2020-09-11  4572.26  4630.88  4563.11  4627.28
6  2020-09-14  4652.05  4666.99  4625.99  4651.05
7  2020-09-15  4649.45  4691.50  4630.54  4688.48
```

```python
# 获取沪深300、上证指数按5分钟为周期以“2020-9-16 14:22:35”为基础前4个时间单位的数据
df = get_bars(['000300.XSHG','000001.XSHG'],4, unit='5m',fields=['date','open','high','low','close'],include_now=True,end_dt='2020-9-16 14:22:35')
print(df)

# 输出
                             date     open     high      low    close
000300.XSHG 0 2020-09-16 14:10:00  4657.03  4657.93  4650.24  4650.24
            1 2020-09-16 14:15:00  4649.63  4649.63  4641.87  4643.58
            2 2020-09-16 14:20:00  4643.67  4646.66  4642.36  4642.36
            3 2020-09-16 14:22:00  4641.59  4641.64  4638.90  4638.90
000001.XSHG 0 2020-09-16 14:10:00  3282.83  3283.60  3279.32  3279.32
            1 2020-09-16 14:15:00  3278.67  3278.67  3273.17  3274.24
            2 2020-09-16 14:20:00  3274.25  3275.90  3273.28  3273.36
            3 2020-09-16 14:22:00  3272.78  3273.05  3271.11  3271.11
```

<a id="get_call_auction"></a>

### get\_call\_auction

**获取集合竞价数据 / 2017年至今**

```python
get_call_auction(security, start_date, end_date, fields=None)
```

支持股票（2010年至今）、场内基金（2019年至今）、指数（2017年至今）和上证ETF期权（2017年至今）的集合竞价数据。当日的集合竞价数据最晚于9:28分返回。为了防止返回数据量过大, 我们每次最多返回5000行。

**参数**：

-   security: **指数（2017年至今）**
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

```
#获取沪深300指数2017-09-01至2017-09-05期间的集合竞价数据
df=get_call_auction('000300.XSHG','2017-09-01','2017-09-05')
print(df)

          code                time  current       volume         money  a1_p  \
0  000300.XSHG 2017-09-01 09:25:12  3825.34   60406600.0  6.963988e+08  None   
1  000300.XSHG 2017-09-04 09:25:10  3828.54  145635600.0  1.222139e+09  None   
2  000300.XSHG 2017-09-05 09:25:13  3845.55   59488700.0  6.133801e+08  None   

   a1_v  a2_p  a2_v  a3_p  ...   b1_p  b1_v  b2_p  b2_v  b3_p  b3_v  b4_p  \
0  None  None  None  None  ...   None  None  None  None  None  None  None   
1  None  None  None  None  ...   None  None  None  None  None  None  None   
2  None  None  None  None  ...   None  None  None  None  None  None  None   

   b4_v  b5_p  b5_v  
0  None  None  None  
1  None  None  None  
2  None  None  None  

[3 rows x 25 columns]
```

<a id="get_ticks (机构)"></a>

### get\_ticks (机构)

**指数tick数据 / 2017-01-01至今**

```python
get_ticks(security, start_dt=None, end_dt=None, count=None, fields=None, skip=True, df=True)
```

**指数部分， 支持 2017-01-01 至今的tick数据。（每3秒一次快照）**

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 指数代码，如'000001.XSHG'
-   start\_dt: 开始日期，格式为'YYYY-MM-DD HH:MM:SS'
-   end\_dt: 结束日期，格式为'YYYY-MM-DD HH:MM:SS'
-   count: 取出指定时间区间内前N条的tick数据。
-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下指数tick返回结果。
-   skip:默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据。
-   df: 默认为True，传入单个标的返回的是一个dataframe, 当df=False的时候，返回一个np.ndarray

**指数tick返回结果：**

| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价 | float |
| high | 当日最高价 | float |
| low | 当日最低价 | float |
| volume | 累计成交量（股） | float |
| money | 累计成交额（元） | float |

**指数tick数据示例**：

```python
# 获取上证指数2019-11-19 10:00:00 到 2019-11-19 10:01:00的tick数据
df=get_ticks('000001.XSHG','2019-11-19 10:00:00','2019-11-19 10:01:00')
print(df[:6])

                     time    current       high       low        volume  \
0 2019-11-19 10:00:01.608  2913.4288  2914.6199  2902.855  2.795233e+09   
1 2019-11-19 10:00:06.600  2913.1890  2914.6199  2902.855  2.800322e+09   
2 2019-11-19 10:00:10.628  2913.0532  2914.6199  2902.855  2.807082e+09   
3 2019-11-19 10:00:16.608  2913.3964  2914.6199  2902.855  2.814624e+09   
4 2019-11-19 10:00:21.620  2913.2224  2914.6199  2902.855  2.818837e+09   
5 2019-11-19 10:00:25.620  2913.6741  2914.6199  2902.855  2.824412e+09   

          money  
0  3.171538e+10  
1  3.178079e+10  
2  3.185376e+10  
3  3.193569e+10  
4  3.198723e+10  
5  3.204712e+10  
​
```

<a id="指数成分股及权重数据"></a>

### 指数成分股及权重数据

**更新时间：2005至今，交易日8:00更新**

<a id="stock get_index_stocks"></a>

### get\_index\_stocks

**指数成份股**

```python
get_index_stocks(index_symbol, date=None)
```

获取一个指数给定日期在平台可交易的成分股列表，请点击[指数列表](https://www.joinquant.com/indexData)查看指数信息

**参数**

-   index\_symbol: 指数代码
-   date: 查询日期, 一个字符串(格式类似'2015-10-15')或者\[datetime.date\]/\[datetime.datetime\]对象, 可以是None,

**返回** 返回股票代码的list

**示例**

```python
# 获取所有沪深300的股票
stocks = get_index_stocks('000300.XSHG')
print(stocks[:5])

# 输出
['000001.XSHE', '000002.XSHE', '000063.XSHE', '000066.XSHE', '000069.XSHE']
```

<a id="index get_index_weights"></a>

### get\_index\_weights

**指数成份股权重（月度）**

```
get_index_weights(index_id, date=None)
```

获取指数成份股给定日期的权重数据，每月的月底或者月初更新一次，请点击[指数列表](https://www.joinquant.com/help/api/help?name=JQData#%E6%B2%AA%E6%B7%B1%E6%8C%87%E6%95%B0%E5%88%97%E8%A1%A8)查看指数信息

**参数**

-   index\_id: 代表指数的标准形式代码， 形式：指数代码.交易所代码，例如"000001.XSHG"。
-   date: 查询权重信息的日期，形式："%Y-%m-%d"，例如"2018-05-03"；

**返回**

-   查询到对应日期，且有权重数据，返回 pandas.DataFrame， code(股票代码)，display\_name(股票名称), date(日期), weight(权重)；
-   查询到对应日期，且无权重数据， 返回距离查询日期最近日期的权重信息；
-   找不到对应日期的权重信息， 返回距离查询日期最近日期的权重信息；

**示例**

```
#获取2018年5月9日这天的上证指数的成份股权重
df = get_index_weights(index_id="000001.XSHG", date="2018-05-09")
print(df)

＃输出
                   date  weight display_name
603648.XSHG  2018-04-27   0.023         畅联股份
603139.XSHG  2018-04-27   0.007         康惠制药
603138.XSHG  2018-04-27   0.015         海量数据
603136.XSHG  2018-04-27   0.009          天目湖
603131.XSHG  2018-04-27   0.011         上海沪工
...                 ...     ...          ...
603005.XSHG  2018-04-27   0.023         晶方科技
603007.XSHG  2018-04-27   0.013         ST花王
603006.XSHG  2018-04-27   0.008         联明股份
603009.XSHG  2018-04-27   0.014         北特科技
603008.XSHG  2018-04-27   0.022          喜临门
```
