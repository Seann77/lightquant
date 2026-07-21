---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 通用接口
section_path:
  - JQData使用说明
  - 通用接口
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#通用接口"
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

<a id="通用接口"></a>

## 通用接口

<a id="JQData证券代码格式"></a>

### JQData证券代码格式

<a id="证券代码标准格式的定义"></a>

### 证券代码标准格式的定义

**股票/期货/场外基金（场内基金同股票）**

-   由于同一代码可能代表不同的交易品种，JQData给每个交易品种后面都添加了该市场特定的代码后缀，用户在调用API时，需要将参数security传入带有该市场后缀的证券代码，如security='600519.XSHG'，以便于区分实际调用的交易品种。以下列出了每个交易市场的代码后缀和示例代码。

| 交易市场 | 代码后缀 | 示例代码 | 证券简称 |
| --- | --- | --- | --- |
| 上海证券交易所 | .XSHG | 600519.XSHG | 贵州茅台 |
| 深圳证券交易所 | .XSHE | 000001.XSHE | 平安银行 |
| 中金所 | .CCFX | IC9999.CCFX | 中证500主力合约 |
| 大商所 | .XDCE | A9999.XDCE | 豆一主力合约 |
| 上期所 | .XSGE | AU9999.XSGE | 黄金主力合约 |
| 郑商所 | .XZCE | CY8888.XZCE | 棉纱期货指数 |
| 上海国际能源期货交易所 | .XINE | SC9999.XINE | 原油主力合约 |
| 场外基金 | .OF | 398051.OF | 中海环保新能源混合 |

<a id="normalize_code"></a>

### normalize\_code

**将标的代码转化成聚宽标准格式(支持股票、期货、场内基金)**

```python
normalize_code(code)
```

将其他形式的标的代码转换为jqdatasdk可用的标的代码形式。 **适用于A股市场股票、期货以及场内基金代码,支持传入单只标的或一个标的list**

**以股票为例**

```python
#输入
normalize_code(['000001', 'SZ000001', '000001SZ', '000001.sz', '000001.XSHE'])
#输出
['000001.XSHE', '000001.XSHE', '000001.XSHE', '000001.XSHE', '000001.XSHE']
```

<a id="获取标的概况"></a>

### 获取标的概况

-   **接口的具体使用，可查看各市场对应的示例**

<a id="get_security_info"></a>

### get\_security\_info

**单个标的信息（股票/基金/指数的信息）**

```python
get_security_info(code)
```

获取股票/基金/指数的信息.

**参数**

-   code: 证券代码
-   date：获取指定日期的标的信息，默认为None，仅支持股票

**返回值**

-   一个对象, 有如下属性:

    -   display\_name: 中文名称
    -   name: 缩写简称
    -   start\_date: 上市日期, \[datetime.date\] 类型
    -   end\_date: 退市日期， \[datetime.date\] 类型, 如果没有退市则为2200-01-01
    -   type: 类型，stock(股票)，index(指数)，etf(ETF基金)，fja（分级A），fjb（分级B）
    -   parent: 分级基金的母基金代码

**示例**

以股票为例

```python
# 获取000001.XSHE的中文名称
display_name = get_security_info('000001.XSHE').display_name
print(display_name)
>>>平安银行
```

<a id=" get_all_securities"></a>

### get\_all\_securities

**所有标的信息(股票、基金、指数、期货等)**

```python
get_all_securities(types=[], date=None)
```

获取平台支持的所有股票、基金、指数、期货信息

**参数**

-   types: list: 用来过滤securities的类型, list元素可选: 'stock', 'fund', 'index', 'futures', 'etf', 'lof', 'fja', 'fjb'。**types为空时返回所有股票, 不包括基金,指数和期货**
-   date: 日期, 一个字符串或者 \[datetime.datetime\]/\[datetime.date\] 对象, 用于获取某日期还在上市的股票信息. 默认值为 None, 表示获取所有日期的股票信息

**返回** \[pandas.DataFrame\], 比如:`get_all_securities()[:2]`返回:

| \--- | display\_name | name | start\_date | end\_date | type |
| --- | --- | --- | --- | --- | --- |
| 000001.XSHE | 平安银行 | PAYH | 1991-04-03 | 9999-01-01 | stock |
| 000002.XSHE | 万 科Ａ | WKA | 1991-01-29 | 9999-01-01 | stock |

-   display\_name: 中文名称
-   name: 缩写简称
-   start\_date: 上市日期
-   end\_date: 退市日期，如果没有退市则为2200-01-01
-   type: 类型，stock(股票)，index(指数)，etf(ETF基金)，fja（分级A），fjb（分级B），fjm（分级母基金），mmf（场内交易的货币基金）open\_fund（开放式基金）, bond\_fund（债券基金）, stock\_fund（股票型基金）, QDII\_fund（QDII 基金）, money\_market\_fund（场外交易的货币基金）, mixture\_fund（混合型基金）, options(期权)

**示例**

```python
#将所有股票列表转换成数组
stocks = list(get_all_securities(['stock']).index)

#获得所有指数列表
get_all_securities(['index'])

#获得所有基金列表
df = get_all_securities(['fund'])

#获取所有期货列表
get_all_securities(['futures'])

#获得etf基金列表
df = get_all_securities(['etf'])
#获得lof基金列表
df = get_all_securities(['lof'])
#获得分级A基金列表
df = get_all_securities(['fja'])
#获得分级B基金列表
df = get_all_securities(['fjb'])

#获得2015年10月10日还在上市的所有股票列表
get_all_securities(date='2015-10-10')
#获得2015年10月10日还在上市的 etf 和 lof 基金列表
get_all_securities(['etf', 'lof'], '2015-10-10')
```

<a id="获取交易日历"></a>

### 获取交易日历

<a id="get_trade_days"></a>

### get\_trade\_days

**指定范围交易日**

```python
get_trade_days(start_date=None, end_date=None, count=None)
```

获取指定日期范围内的所有交易日, 返回 \[numpy.ndarray\], 包含指定的 start\_date 和 end\_date, 默认返回至 datatime.date.today() 的所有交易日

**参数**

-   start\_date: 开始日期, **与 count 二选一, 不可同时使用**. str/\[datetime.date\]/\[datetime.datetime\] 对象
-   end\_date: 结束日期, str/\[datetime.date\]/\[datetime.datetime\] 对象, 默认为 datetime.date.today()
-   count: 数量, **与 start\_date 二选一, 不可同时使用**, 必须大于 0. 表示取 end\_date 往前的 count 个交易日，包含 end\_date 当天。

```python
#获取“2018-02-10”至”2018-03-01“的交易日
get_trade_days(start_date="2018-02-10",end_date="2018-03-01")

# 输出为数组
array([datetime.date(2018, 2, 12), datetime.date(2018, 2, 13),
       datetime.date(2018, 2, 14), datetime.date(2018, 2, 22),
       datetime.date(2018, 2, 23), datetime.date(2018, 2, 26),
       datetime.date(2018, 2, 27), datetime.date(2018, 2, 28),
       datetime.date(2018, 3, 1)], dtype=object)
```

<a id="get_all_trade_days"></a>

### get\_all\_trade\_days

**获取所有交易日**

```python
get_all_trade_days()
```

获取所有交易日, 不需要传入参数, 返回一个包含所有交易日的 \[numpy.ndarray\], 每个元素为一个 \[datetime.date\] 类型.

```python
get_all_trade_days()

# 输出
array([datetime.date(2005, 1, 4), datetime.date(2005, 1, 5),
       datetime.date(2005, 1, 6), ..., datetime.date(2023, 3, 7),
       datetime.date(2023, 3, 8), datetime.date(2023, 3, 9)], dtype=object)
```

<a id="通用行情接口"></a>

### 通用行情接口

-   **接口的具体使用，可查看各市场对应的示例**

<a id="get_price"></a>

### get\_price

**1天/分钟行情数据**

```python
get_price(security, start_date=None, end_date=None, frequency='daily', fields=None, skip_paused=False, fq='pre', count=None)
```

-   获取一支或者多只股票、期货、指数场内基金、上证ETF期权、股指期权及商品期权的行情（按天或者按分钟）；上证ETF期权分钟行情 2017-01-01至今，股指期权分钟行情 2019-12-24至今，商品期权分钟行情 2019-12-02至今。
-   frequency为非一天或者一分钟，请使用get\_bars;
-   取多支标的的数据时，不要获取交易时段不同的标的（例如：不同交易时间的期货标的），否则会报错；
-   标识时间为09:32:00的1分钟k线，其数据时间为09:31:00至09:31:59；
-   **当天 09:00 ~ 15:00 的行情在 15:00 之后可以获取 , 期货夜盘 21:00~次日02:30 的分钟行情在 02:30 之后可以获取。**注意：当end\_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后(或夜盘结束)时间
-   get\_price指定frequency为 非1m/1d时，fields选择'high\_limit','low\_limit'会报错
-   fq:对股票/基金的价格字段、成交量字段生效，factor不受影响，只返回后复权因子

**关于停牌**: 因为此API可以获取多只股票的数据, 可能有的股票停牌有的没有, 为了保持时间轴的一致,

我们默认没有跳过停牌的日期, 停牌时使用停牌前的数据填充. 如想跳过, 请使用 skip\_paused=True 参数, 注意当 panel=True 且获取多标的时不支持(panel结构需要索引对齐)

```python
get_price(security, start_date=None, end_date=None, frequency='daily', fields=None, skip_paused=False, fq='pre', count=None)
```

**参数**

<table><tbody><tr><td><strong>参数名称</strong></td><td><strong>参数说明</strong></td><td><strong>注释</strong></td></tr><tr><td>security</td><td>标的</td><td>可获取种类：股票、期货、基金、指数、期权</td></tr><tr><td>start_date</td><td>开始时间，不可与count同时使用。当'count'和'start_date'为None时, 默认值是 '2015-01-01 00:00:00'</td><td>当指定frequency为minute时，如果只传入日期，则日内时间为当日的 00:00:00</td></tr><tr><td>end_date</td><td>结束时间，如无指定，默认为'2015-12-31 00:00:00'。当end_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后(或夜盘结束)时间</td><td><p>当指定frequency为minute时, 如果只传入日期, 则日内时间为当日的 00:00:00，</p><p>所以返回的数据不包括 end_date这天。</p></td></tr><tr><td>count</td><td>表示获取 end_date 之前几个 frequency 的数据，与start_date不可同时使用。</td><td>返回的结果集的行数, 即表示获取 end_date 之前count个 frequency 的数据</td></tr><tr><td>frequency</td><td>单位时间长度，即指定获取的时间频级为分钟级（minute）或日级（daily）,也可以指定为 '3m','10d' 等</td><td><p>daily'(同'1d')， 'minute'(同'1m')，</p><p><a href="https://www.joinquant.com/view/community/detail/cea095760a0583ce965964912580077e?type=1">点击查看get_price和get_bars的合成逻辑。</a>如需5分钟,1小时等标准bar请使用get_bars</p></td></tr><tr><td>fields</td><td>所获取数据的字段名称，即表头。默认是None(返回标准字段['open','close','high','low','volume','money'])</td><td><p>可选择填入以下字段，字段说明可查阅下面fields表</p><p>['open','close','low','high','volume','money','factor',</p><p>'high_limit','low_limit','avg','pre_close','paused','open_interest'],</p><p>open_interest为期货持仓量</p></td></tr><tr><td>skip_paused</td><td>是否跳过不交易日期(含：停牌/未上市/退市后的日期)</td><td>如果不跳过, 停牌时会使用停牌前的数据填充，上市前或者退市后数据都为 nan。</td></tr><tr><td>fill_paused</td><td>对于停牌股票的价格处理，默认为True</td><td>默认为True,用pre_close价格填充);False 表示使用NAN填充停牌的股票价格。</td></tr><tr><td>fq</td><td>复权选项，默认为前复权（fq='pre'）</td><td>'pre'：前复权 / 'none'：不复权, 返回实际价格 / 'post'：后复权</td></tr><tr><td>panel</td><td>指定返回的数据格式为panel</td><td><p>默认为True；指定panel=False时返回dataframe格式；</p><p>如本地pandas版本大于0.25将强制返回dataframe , 详见案例</p></td></tr></tbody></table>

**fields**内各字段属性

<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>注释</strong></td></tr><tr><td>open</td><td>时间段开始时价格</td><td></td></tr><tr><td>close</td><td>时间段结束时价格</td><td></td></tr><tr><td>low</td><td>时间段中的最低价</td><td></td></tr><tr><td>high</td><td>时间段中的最高价</td><td></td></tr><tr><td>volume</td><td>时间段中的成交的股票数量</td><td></td></tr><tr><td>money</td><td>时间段中的成交的金额</td><td></td></tr><tr><td>factor</td><td>pre':前复权(默认)/None:不复权,返回实际价格/'post':后复权</td><td><p>前(后)复权数据=价格×前(后)复权因子;</p><p>前(后)复权后的成交量=成交量 / 前(后)复权因子;</p><p>成交不额处理</p></td></tr><tr><td>high_limit</td><td>时间段中的涨停价</td><td></td></tr><tr><td>low_limit</td><td>时间段中的跌停价</td><td></td></tr><tr><td>avg</td><td>时间段中的平均价</td><td><p>(1)天级别：股票是成交额除以成交量；期货是直接从CTP行情获取的，计算方法为成交额除以成交量再除以合约乘数；</p><p>（2）分钟级别：用该分钟所有tick的现价乘以该tick的成交量加起来之后，再除以该分钟的成交量。</p></td></tr><tr><td>pre_close</td><td>前一个单位时间结束时的价格,按天则是前一天的收盘价</td><td>期货：pre_close--前一天结算；建议使用get_extras获取结算价；在分钟频率下pre_close=open</td></tr><tr><td>paused</td><td>bool值,股票是否停牌;</td><td>停牌时open/close/low/high/pre_close；都等于停牌前的收盘价, volume=money=0</td></tr><tr><td>open_interest</td><td>期货(期权)持仓量</td><td></td></tr></tbody></table>

**返回**

-   请注意, 为了方便比较一只标的的多个属性, 同时也满足对比多只标的的一个属性的需求, 我们在security参数是**一只标的和多只标的时返回的结构完全不一样 (默认panel=True时)，以下以股票为例，具体使用看各接口的示例**

**代码示例**

**获取一支股票**

```python
#获取平安银行按1分钟为周期以“2015-01-30 14:00:00”为基础前4个时间单位的数据
df = get_price('000001.XSHE', end_date='2015-01-30 14:00:00',count=4, frequency='minute', fields=['open','close','high','low','volume','money'])
print(df)
                     open  close  high   low    volume      money
2015-01-30 13:57:00  8.98   8.97  8.98  8.97  295949.0  2656384.0
2015-01-30 13:58:00  8.97   8.97  8.98  8.97  339030.0  3041408.0
2015-01-30 13:59:00  8.98   8.98  8.98  8.96  459533.0  4121592.0
2015-01-30 14:00:00  8.98   8.97  8.98  8.96  469211.0  4208384.0
```

**获取多只股票**

```python
#获取多支股票, 则返回[pandas.Panel]对象
panel=get_price(['000300.XSHG', '000001.XSHE'])
#返回[pandas.DataFrame]对象,行索引是[datetime.datetime]对象, 列索引是股票代号
df=panel['money'][:4]
print(df)

             000300.XSHG   000001.XSHE
2015-01-05  5.198498e+11  4.565388e+09
2015-01-06  4.985296e+11  3.453446e+09
2015-01-07  3.987317e+11  2.634796e+09
2015-01-08  3.558320e+11  2.128003e+09
```

<a id="get_bars"></a>

### get\_bars

**指定时间周期的分钟/日行情数据（支持时间周期：'1m','5m', '15m', '30m', '60m', '120m', '1w', '1M'）**

```python
get_bars(security, count, unit='1d',
         fields=['date','open','high','low','close'],
         include_now=False, end_dt=None, fq_ref_date=None,df=True)
```

-   获取各种时间周期的bar数据，bar的分割方式与主流股票软件相同， 同时还支持返回当前时刻所在 bar 的数据。
-   **当天 09:00 ~ 15:00 的行情在 15:00 之后可以获取 , 期货夜盘 21:00~次日02:30 的行情在 02:30 之后可以获取。**注意：当end\_dt指定为当天尚未结束的交易时间时，会自动填充为上一个交易日结束(或夜盘结束)的时间

**参数**

-   security: 标的代码，支持单个及多个标的
-   count: 大于0的整数，表示获取bar的个数。如果行情数据的bar不足count个，返回的长度则小于count个数。
-   unit: bar的时间单位
    当unit为'1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w'(一周), '1M'（一月）标准bar时，bar的分割方式与主流股票软件类似，期货的bar各平台也许稍微有差异，我们与文华接近；
    当unit为非上述标准bar时('xm', 例如'3m')，只支持分钟级别的,x需要小于240，以每天的开盘为起始点，每x分钟为一条bar；
-   fields: 获取数据的字段， 支持如下值：'date', 'open', 'close', 'high', 'low', 'volume', 'money', 'open\_interest'（期货持仓量），factor(复权因子)。
-   include\_now: 取值True 或者False。 表示是否包含end\_dt所在的bar, 比如end\_dt指定为9:38:00，unit参数为5m， 如果 include\_now=True,则返回的最后一条bar为9:35:00-9:38:00这个 bar，否则返回的最后一条bar为09:30:00-09:35:00的bar。
-   end\_dt：查询的截止时间，默认最新的时间。注意:当end\_dt指定为当天尚未结束的交易时间时，会自动填充为上一个交易日收盘(或夜盘结束)的时间
-   fq\_ref\_date：复权基准日期，为None时为不复权数据。
    -   如果用户输入 fq\_ref\_date = None, 则获取到的是不复权的数据
    -   如果用户想获取后复权的数据，可以将fq\_ref\_date 指定为一个很早的日期，比如 datetime.date(2000, 1, 1)
    -   定点复权，以某一天价格点位为参照物，进行的前复权或后复权。设置为当前时间（例如 datetime.datetime.now()）即返回前复权数据 ;
-   df：默认为True，指定返回数据为dataframe结构；当df=False的时候，传入单个标的时，返回一个np.ndarray，多个标的返回一个字典，key是code，value是np.array

**关于停牌**: 此API可以获取多只股票的数据, 部分标的在获取时间的范围内可能存在停牌的情况。 此接口返回的结果会直接跳过停牌的日期, 在获取多标的时或使用索引时，需注意时间轴在部分标的停牌时不一致的情况

**返回**

返回一个pandas.dataframe对象，可以按任意周期返回股票的开盘价、收盘价、最高价、最低价，同时也可以利用date数据查看所返回的数据是什么时刻的。

**示例**

**获取一支股票**

```python
#获取平安银行按120分钟为周期以"2018-12-05"为基础往前5个时间单位的数据
df = get_bars('000001.XSHE', 5, unit='120m',fields=['date','open','close','high','low','volume','money'],include_now=False,end_dt='2018-12-05')
print(df)
                 date   open  close   high    low      volume        money
0 2018-11-30 15:00:00  10.25  10.36  10.36  10.18  31202900.0  320769828.0
1 2018-12-03 11:30:00  10.59  10.64  10.66  10.48  80398200.0  850921284.0
2 2018-12-03 15:00:00  10.64  10.59  10.65  10.56  26011500.0  275453511.0
3 2018-12-04 11:30:00  10.57  10.60  10.62  10.53  29793600.0  315213376.0
4 2018-12-04 15:00:00  10.60  10.59  10.61  10.54  23687700.0  250530360.0
```

**获取多支股票**

```python
#获取平安银行、万科A按120分钟为周期以"2018-12-05"为基础往前2个时间单位的数据
df = get_bars(['000001.XSHE','000002.XSHE'], 2, unit='120m',fields=['date','open','close','high','low','volume','money'],include_now=False,end_dt='2018-12-05')
print(df)
                             date   open  close   high    low      volume  \
000001.XSHE 0 2018-12-04 11:30:00  10.57  10.60  10.62  10.53  29793600.0   
            1 2018-12-04 15:00:00  10.60  10.59  10.61  10.54  23687700.0   
000002.XSHE 0 2018-12-04 11:30:00  25.56  25.23  25.56  25.10  22614700.0   
            1 2018-12-04 15:00:00  25.24  25.13  25.24  24.87  28379900.0   

                     money  
000001.XSHE 0  315213376.0  
            1  250530360.0  
000002.XSHE 0  571859390.0  
            1  709510464.0  
```

<a id="get_call_auction"></a>

### get\_call\_auction

**获取集合竞价数据**

```python
get_call_auction(security, start_date, end_date, fields=None)
```

支持股票（2010年至今）、场内基金（2019年至今）、指数（2017年至今）和上证ETF期权（2017年至今）的集合竞价数据。为了防止返回数据量过大, 我们每次最多返回5000行。

**参数**：

-   security: **股票（2010年至今）、场内基金（2019年至今）、指数（2017年至今）、上证ETF期权（2017年至今）**支持输入标的列表
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

以股票为例

```
#获取平安银行2019-09-02至2019-09-05期间的集合竞价数据
df=get_call_auction('000001.XSHE','2019-09-02','2019-09-05')
print(df)

          code                time  current     volume       money   a1_p  \
0  000001.XSHE 2019-09-02 09:25:03    14.15   568900.0   8049900.0  14.15   
1  000001.XSHE 2019-09-03 09:25:03    14.48   647700.0   9378700.0  14.48   
2  000001.XSHE 2019-09-04 09:25:03    14.32   322637.0   4620200.0  14.33   
3  000001.XSHE 2019-09-05 09:25:03    14.56  1673700.0  24369100.0  14.56   

       a1_v   a2_p      a2_v   a3_p    ...      b1_p     b1_v   b2_p  \
0   58802.0  14.16    4500.0  14.17    ...     14.14   8700.0  14.13   
1   67091.0  14.49  201092.0  14.50    ...     14.47   3100.0  14.46   
2   67179.0  14.34   17000.0  14.35    ...     14.32  27063.0  14.31   
3  122434.0  14.57  364479.0  14.58    ...     14.55  18700.0  14.54   

       b2_v   b3_p      b3_v   b4_p      b4_v   b5_p      b5_v  
0  116000.0  14.12   30900.0  14.11  267900.0  14.10  119200.0  
1    3900.0  14.45   40000.0  14.44     700.0  14.43    1900.0  
2   12600.0  14.30  166400.0  14.29    2100.0  14.28   10100.0  
3    2100.0  14.53   24800.0  14.51   19300.0  14.50   81700.0  

[4 rows x 25 columns]
```

<a id="get_ticks"></a>

### get\_ticks

**tick数据**

```python
get_ticks(security, start_dt, end_dt, count, fields)
```

股票部分，支持 2010-01-01 至今的tick数据，提供买五卖五数据。（每3秒一次快照）

期货部分，支持 2010-01-01 至今的tick数据，提供买一卖一数据。（每0.5秒一次快照）

期权部分，支持期权tick数据，每0.5s一次快照。其中上证ETF期权从2017-01-01至今，股指期权从2019-12-24至今，商品期权从2019-12-02至今

场内基金，支持 2019-01-01 至今的tick数据，提供买五卖五盘口数据。（每3秒一次快照）

指数部分， 支持 2017-01-01 至今的tick数据。（每3秒一次快照）

**购买**：用户如有需要使用tick数据的，可添加微信号**JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com。

**参数**：

-   security: 指数代码，如'000001.XSHG'
-   start\_dt: 开始日期，格式为'YYYY-MM-DD HH:MM:SS'
-   end\_dt: 结束日期，格式为'YYYY-MM-DD HH:MM:SS'
-   count: 取出指定时间区间内前N条的tick数据。
-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下指数tick返回结果。
-   skip:默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据
-   df: 默认为True，传入单个标的返回的是一个dataframe, 当df=False的时候，返回一个np.ndarray

<a id="判断是否ST基金净值期货结算价"></a>

### 判断是否ST/基金净值/期货结算价

-   **接口的具体使用，可查看各市场对应的示例**

<a id="get_extras"></a>

### get\_extras

**参数：是否是ST/基金单位净值/基金累计净值/场外基金的复权净值/期货结算价**

```python
get_extras(info, security_list, start_date='2015-01-01', end_date='2015-12-31', df=True, count=None)
```

**参数**

-   info: \['is\_st', 'acc\_net\_value', 'unit\_net\_value', 'futures\_sett\_price', 'adj\_net\_value'\] 中的一个

    | 指定info字段 | 返回信息 |
    | --- | --- |
    | is\_st | 是否是ST，是则返回 True，否则返回 False |
    | acc\_net\_value | 基金累计净值 |
    | unit\_net\_value | 基金单位净值 |
    | futures\_sett\_price | 期货结算价 |
    | adj\_net\_value | **场外**基金的复权净值 |

-   security\_list: 标的列表

-   start\_date/end\_date: 开始结束日期, 同 \[get\_price\]

-   df: 返回\[pandas.DataFrame\]对象或者dict

-   count: 数量, **与 start\_date 二选一, 不可同时使用**, 必须大于 0. 表示取 end\_date 往前的 count 个交易日的数据


**返回值**

-   df=True: 返回\[pandas.DataFrame\]对象, 列索引是股票代号, 行索引是\[datetime.datetime\]
-   df=False，返回一个dict, key是股票代号，如

以股票为例

```python
# 平安银行和神城A在2013-12-01至2013-12-03是否为ST
get_extras('is_st', ['000001.XSHE', '000018.XSHE'], start_date='2013-12-01', end_date='2013-12-03')

# 输出：
            000001.XSHE  000018.XSHE
2013-12-02        False         True
2013-12-03        False         True
```

<a id="run_query查询数据库中的数据"></a>

### run\_query 查询数据库中的数据

<a id="run_query"></a>

### run\_query

**数据库.run\_query( query\_object )**

目前可通过 run\_query 方法进行查询的数据都为储存于mysql的数据(单季度数据通过get\_fundamentals/get\_fundamentals\_continuously查询)。根据数据的品种我们大致分为四类 :

finance 库(包含股票，基金，期货的相关数据及其他) : [融资融券数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3ASTK_MT_TOTAL)，[沪深市场每日概况](https://www.joinquant.com/help/api/help?name=JQData#JQData%3ASTK_EXCHANGE_TRADE_INFO)，[市场通数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E5%B8%82%E5%9C%BA%E9%80%9A%E6%95%B0%E6%8D%AE)，[上市公司相关信息](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E4%B8%8A%E5%B8%82%E5%85%AC%E5%8F%B8%E7%9B%B8%E5%85%B3%E4%BF%A1%E6%81%AF)，[报告期财务数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E6%8A%A5%E5%91%8A%E6%9C%9F%E8%B4%A2%E5%8A%A1%E6%95%B0%E6%8D%AE)，[申万行业指数数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E7%94%B3%E4%B8%87%E8%A1%8C%E4%B8%9A%E6%8C%87%E6%95%B0%E6%95%B0%E6%8D%AE)，[期货交易统计数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E6%9C%9F%E8%B4%A7%E4%BA%A4%E6%98%93%E7%BB%9F%E8%AE%A1%E6%95%B0%E6%8D%AE)，[期货外盘日行情](https://www.joinquant.com/help/api/help?name=JQData#JQData%3AFUT_GLOBAL_DAILY)，[场内基金份额数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3AFUND_SHARE_DAILY)，[公募基金相关数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E5%85%AC%E5%8B%9F%E5%9F%BA%E9%87%91%E6%95%B0%E6%8D%AE%E5%87%80%E5%80%BC%E7%AD%89)，[新闻联播文本数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E6%96%B0%E9%97%BB%E8%81%94%E6%92%AD%E6%96%87%E6%9C%AC)
opt 库(包含期权相关数据) : [期权相关数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E6%9C%9F%E6%9D%83)
bond 库(包含债券相关数据) : [债券相关数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E5%80%BA%E5%88%B8)
macro 库(包含宏观数据) : [宏观数据](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E5%AE%8F%E8%A7%82%E6%95%B0%E6%8D%AE)

**参数** : query\_object , 使用的query对象通过 from jqdatasdk import \* 导入 , 关于[【query的简易教程】](https://www.joinquant.com/view/community/detail/433d0e9ed9fed11fc9f7772eab8d9376?type=1)

**返回** : DataFrame，

**用法** : 数据库名.run\_query( query\_object) ,

如查询finance库中 STK\_XR\_XD 表的数据

```sql
from jqdatasdk import *
auth(username, pwd)
q = query(finance.STK_XR_XD)  # 注意需要先登陆,否则会报错表不存在
finance.run_query(q)
```

查询 opt 库中 OPT\_CONTRACT\_INFO 表的数据

```
q = query( opt.OPT_CONTRACT_INFO ).filter(       opt.OPT_CONTRACT_INFO.underlying_symbol=='510050.XSHG'
                ).order_by(opt.OPT_CONTRACT_INFO.list_date.desc()).limit(100)  #  查询最新挂牌的100条 510050 etf期权的合约资料
opt.run_query(q)
```

**注意** :

**1.为防止返回数据量过大，单次返回最多5000行；**

**2.不支持进行连表查询，即同时查询多张表的数据；**

**3.如query\_object未使用order\_by指定字段排序，返回数据的顺序没有意义；**

**4.id字段为自增id，没有意义；**
