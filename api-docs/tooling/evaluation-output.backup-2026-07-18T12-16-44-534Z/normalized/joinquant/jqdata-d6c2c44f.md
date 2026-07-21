---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 基金
section_path:
  - JQData使用说明
  - 基金
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#基金"
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - complex_table_preserved_as_html
canonical: true
alias_of: null
---

<a id="基金"></a>

## 基金

<a id="基金概况"></a>

### 基金概况

方法 描述 / 更新时间及频率（**注意：场外基金编码 +.OF**）

normalize\_code 将场内基金代码转化成聚宽标准格式

```python
normalize_code(code)
```

将其他形式的场内基金代码转换为jqdatasdk函数可用的基金代码形式。 **仅适用于场内基金代码,支持传入单只基金或一个基金list**

**示例**

```python
#输入
normalize_code(['159001', '159003', '159005','159901','159902'])
#输出
['159001.XSHE', '159003.XSHE', '159005.XSHE', '159901.XSHE', '159902.XSHE']
```

get\_security\_info 获取单只基金信息/ 2005至今，8:00更新

```python
get_security_info(code)
```

获取股票/基金/指数的信息.

**参数**

-   code: 基金代码

**返回值**

-   一个对象, 有如下属性:

    -   display\_name: 中文名称
    -   name: 缩写简称
    -   start\_date: 上市日期, \[datetime.date\] 类型
    -   end\_date: 退市日期， \[datetime.date\] 类型, 如果没有退市则为2200-01-01
    -   type: 类型etf(ETF基金)，fja（分级A），fjb（分级B）、场外基金
    -   parent: 分级基金的母基金代码

**示例**

```python
# 获取基金的中文名称
get_security_info('502050.XSHG').display_name

>>> 上证50B
```

```python
#获取基金的上市日期
get_security_info('502050.XSHG').start_date

>>> datetime.date(2015, 4, 27)
```

```python
#获取基金的退市时间
get_security_info('502050.XSHG').end_date

>>> datetime.date(2021, 1, 4)
```

```python
#获取基金的类型
get_security_info('502050.XSHG').type

>>> 'fjb'
```

```python
# 获取基金的母基金, 下面的判断为真.
get_security_info('502050.XSHG').parent == '502048.XSHG'

>>> True
```

get\_all\_securities 获取所有基金信息/ 2005至今，8:00更新

```python
get_all_securities(types=[], date=None)
```

获取平台支持的所有股票、基金、指数、期货信息

**参数**

-   types: list: 用来过滤securities的类型, list元素可选:'fund', 'etf', 'lof', 'fja', 'fjb', 'open\_fund', 'bond\_fund', 'stock\_fund', 'QDII\_fund', 'money\_market\_fund', 'mixture\_fund'。types为空时返回所有股票, 不包括基金,指数和期货
-   date: 日期, 一个字符串或者 \[datetime.datetime\]/\[datetime.date\] 对象, 用于获取某日期还在上市的股票信息. 默认值为 None, 表示获取所有日期的股票信息

**返回** \[pandas.DataFrame\]

-   display\_name: 中文名称
-   name: 缩写简称
-   start\_date: 上市日期
-   end\_date: 退市日期，如果没有退市则为2200-01-01
-   type: 类型，etf(ETF基金)，fja（分级A），fjb（分级B），fjm（分级母基金），mmf（场内交易的货币基金）open\_fund（开放式基金）, bond\_fund（债券基金）, stock\_fund（股票型基金）, QDII\_fund（QDII 基金）, money\_market\_fund（场外交易的货币基金）, mixture\_fund（混合型基金）

**示例**

```python
#获得etf基金列表
df = get_all_securities(['etf'])
#获得lof基金列表
df = get_all_securities(['lof'])
#获得分级A基金列表
df = get_all_securities(['fja'])
#获得分级B基金列表
df = get_all_securities(['fjb'])

# 获得fjm基金列表
df = get_all_securities('fund')
df[df.type=="fjm"]

# 获得开放式基金列表
df = get_all_securities(['open_fund'])
# 获得债券基金列表
df = get_all_securities(['bond_fund'])
# 获得股票型基金列表
df = get_all_securities('stock_fund')
# 获得QDII基金列表
df = get_all_securities(['QDII_fund'])
# 获得混合型基列表
df = get_all_securities(['mixture_fund'])

# 获得场内交易的货币基金列表
df = get_all_securities('fund')
df[df.type=="mmf"]

# 获得场外交易的货币基金列表
df = get_all_securities(['money_market_fund'])

#获得2015年10月10日还在上市的 etf 和 lof 基金列表
get_all_securities(['etf', 'lof'], '2015-10-10')
```

get\_extras 基金累计净值/基金单位净值/场外基金的复权净值——2005至今，下一个交易日10点之前更新

```python
get_extras(info, security_list, start_date='2015-01-01', end_date='2015-12-31', df=True, count=None)
```

**参数**

-   info: \[ 'acc\_net\_value', 'unit\_net\_value', 'adj\_net\_value'\] 中的一个

    | 指定info字段 | 返回信息 |
    | --- | --- |
    | acc\_net\_value | 基金累计净值 |
    | unit\_net\_value | 基金单位净值 |
    | adj\_net\_value | 场外基金的复权净值 |

-   security\_list: 基金列表

-   start\_date/end\_date: 开始结束日期, 同 \[get\_price\]

-   df: 返回\[pandas.DataFrame\]对象还是一个dict

-   count: 数量, **与 start\_date 二选一, 不可同时使用**, 必须大于 0. 表示取 end\_date 往前的 count 个交易日的数据


**返回值**

-   df=True: 返回\[pandas.DataFrame\]对象, 列索引是股票代号, 行索引是\[datetime.datetime\], 比如

```python
# 获取基金累计净值
# df=True,返回[pandas.DataFrame]对象
df=get_extras('acc_net_value', ['510300.XSHG', '510050.XSHG'], start_date='2015-12-01', end_date='2015-12-03',df=True)
print(df)

            510300.XSHG  510050.XSHG
2015-12-01       1.3950        3.119
2015-12-02       1.4432        3.251
2015-12-03       1.4535        3.254
```

```python
# 获取基金单位净值
# df=False,返回一个dict, key是基金代号, value是[numpy.ndarray]
get_extras('unit_net_value', ['510300.XSHG', '510050.XSHG'], start_date='2015-12-01', end_date='2015-12-03',df=False)
#返回
{'510300.XSHG': array([3.6446, 3.7746, 3.8023]),
 '510050.XSHG': array([2.344, 2.455, 2.458])}
```

```python
# 获取场外基金的复权净值
df=get_extras('adj_net_value','398051.OF')
print(df[:4])
            398051.OF
2015-01-05      1.087
2015-01-06      1.073
2015-01-07      1.086
2015-01-08      1.054
```

FUND\_SHARE\_DAILY 基金份额数据（二级市场）/ 2005-02-23至今，下一个交易日10点之前更新

```python
from jqdatasdk import *
finance.run_query(query(finance.FUND_SHARE_DAILY).filter(finance.FUND_SHARE_DAILY.date=='2019-05-23').limit(n))
```

描述：记录每日场内基金份额数据

**参数：**

-   **query(finance.FUND\_SHARE\_DAILY)**：表示从finance.FUND\_SHARE\_DAILY这张表中查询每日场内基金份额数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[query简易教程](https://www.joinquant.com/help/api/%20www.joinquant.com=)
-   **finance.FUND\_SHARE\_DAILY**：收录了每日场内基金份额数据，表结构和字段信息如下：
-   **filter(finance.FUND\_SHARE\_DAILY.date==date)**：指定筛选条件，通过finance.FUND\_SHARE\_DAILY.date==date可以指定你想要查询的日期；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**字段设计**：

<table><tbody><tr><td><strong>名称</strong></td><td><strong>类型</strong></td><td><strong>描述</strong></td></tr><tr><td>code</td><td>varchar(12)</td><td>基金代码</td></tr><tr><td>name</td><td>varchar(50）</td><td>基金简称</td></tr><tr><td>exchange_code</td><td>varchar(12)</td><td><p>交易市场编码</p><p>XSHG-上海证券交易所；</p><p>XSHE-深圳证券交易所</p></td></tr><tr><td>date</td><td>date</td><td>日期</td></tr><tr><td>shares</td><td>bigint</td><td>基金份额（份）</td></tr></tbody></table>

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询2019-05-23的场内基金份额数据。
from jqdatasdk import *
df=finance.run_query(query(finance.FUND_SHARE_DAILY).filter(finance.FUND_SHARE_DAILY.date=='2019-05-23').limit(5))
print(df)
       id         code    name exchange_code        date    shares
0  960881  150008.XSHE    瑞和小康          XSHE  2019-05-23  17749200
1  960882  150009.XSHE    瑞和远见          XSHE  2019-05-23  17749200
2  960883  150012.XSHE  中证100A          XSHE  2019-05-23  36139500
3  960884  150013.XSHE  中证100B          XSHE  2019-05-23  54209300
4  960885  150016.XSHE     合润A          XSHE  2019-05-23  38111200
```

<a id="场内基金行情数据"></a>

### 场内基金行情数据

-   **更新时间：日行情 2005至今，盘后15点、24点更新**
-   **更新时间：分钟行情 2005至今，盘后15点、24点更新**

方法 描述（场内）/ 更新时间及频率

get\_price 1天/分钟行情数据

```python
get_price(security, start_date=None, end_date=None, frequency='daily', fields=None, skip_paused=False, fq='pre', count=None, panel=True, fill_paused=True)
```

-   获取一支或者多只场内基金数据；
-   frequency为非一天或者一分钟，请使用get\_bars;
-   取多支标的的数据时，不要获取交易时段不同的标的（例如：不同交易时间的期货标的），否则会报错；
-   这里在使用时注意 end\_date 的设置，不要引入未来的数据；
-   标识时间为09:32:00的1分钟k线，其数据时间为09:31:00至09:31:59；
-   end\_date:**当天 09:00 ~ 15:00 的行情在 15:00 之后可以获取。**注意：当end\_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间
-   get\_price指定frequency为 非1m/1d时，fields选择'high\_limit','low\_limit'会报错
-   fq:对股票/基金的价格字段、成交量字段生效，factor不受影响，只返回后复权因子

**关于停牌**: 因为此API可以获取多只股票的数据, 可能有的股票停牌有的没有, 为了保持时间轴的一致,

我们默认没有跳过停牌的日期, 停牌时使用停牌前的数据填充. 如想跳过, 请使用 skip\_paused=True 参数, 注意当 panel=True 且获取多标的时不支持(panel结构需要索引对齐)

```python
get_price(security, start_date=None, end_date=None, frequency='daily', fields=None, skip_paused=False, fq='pre', count=None)
```

**参数**

<table><tbody><tr><td><strong>参数名称</strong></td><td><strong>参数说明</strong></td><td><strong>注释</strong></td></tr><tr><td>security</td><td>标的</td><td>可获取种类：股票、期货、基金、指数、期权</td></tr><tr><td>start_date</td><td>开始时间，不可与count同时使用。当'count'和'start_date'为None时, 默认值是 '2015-01-01 00:00:00'</td><td>当指定frequency为minute时，如果只传入日期，则日内时间为当日的 00:00:00</td></tr><tr><td>end_date</td><td>结束时间，如无指定，默认为'2015-12-31 00:00:00'。当end_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间</td><td><p>当指定frequency为minute时, 如果只传入日期, 则日内时间为当日的 00:00:00，</p><p>所以返回的数据不包括 end_date这天。</p></td></tr><tr><td>count</td><td>表示获取 end_date 之前几个 frequency 的数据，与start_date不可同时使用。</td><td>返回的结果集的行数, 即表示获取 end_date 之前count个 frequency 的数据</td></tr><tr><td>frequency</td><td>单位时间长度，即指定获取的时间频级为分钟级（minute）或日级（daily）,也可以指定为 '3m','10d' 等</td><td><p>daily'(同'1d')， 'minute'(同'1m')，</p><p><a href="https://www.joinquant.com/view/community/detail/cea095760a0583ce965964912580077e?type=1">点击查看get_price和get_bars的合成逻辑。</a>如需5分钟,1小时等标准bar请使用get_bars</p></td></tr><tr><td>fields</td><td>所获取数据的字段名称，即表头。默认是None(返回标准字段['open','close','high','low','volume','money'])</td><td><p>可选择填入以下字段，字段说明可查阅下面fields表</p><p>['open','close','low','high','volume','money','factor',</p><p>'high_limit','low_limit','avg','pre_close','paused','open_interest'],</p><p>open_interest为期货持仓量</p></td></tr><tr><td>skip_paused</td><td>是否跳过不交易日期(含：停牌/未上市/退市后的日期)</td><td>如果不跳过, 停牌时会使用停牌前的数据填充，上市前或者退市后数据都为 nan。</td></tr><tr><td>fill_paused</td><td>对于停牌股票的价格处理，默认为True</td><td>默认为True,用pre_close价格填充);False 表示使用NAN填充停牌的股票价格。</td></tr><tr><td>fq</td><td>复权选项，默认为前复权（fq='pre'）</td><td>'pre'：前复权 / 'none'：不复权, 返回实际价格 / 'post'：后复权</td></tr><tr><td>panel</td><td>指定返回的数据格式为panel</td><td><p>默认为True；指定panel=False时返回dataframe格式；</p><p>如本地pandas版本大于0.25将强制返回datdaframe详见案例</p></td></tr></tbody></table>

**fields**内各字段属性

<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>注释</strong></td></tr><tr><td>open</td><td>时间段开始时价格</td><td></td></tr><tr><td>close</td><td>时间段结束时价格</td><td></td></tr><tr><td>low</td><td>时间段中的最低价</td><td></td></tr><tr><td>high</td><td>时间段中的最高价</td><td></td></tr><tr><td>volume</td><td>时间段中的成交的股票数量</td><td>单位股</td></tr><tr><td>money</td><td>时间段中的成交的金额</td><td></td></tr><tr><td>factor</td><td>pre':前复权(默认)/None:不复权,返回实际价格/'post':后复权</td><td><p>前(后)复权数据=价格×前(后)复权因子;</p><p>前(后)复权后的成交量=成交量 / 前(后)复权因子;</p><p>成交额不处理</p></td></tr><tr><td>high_limit</td><td>时间段中的涨停价</td><td></td></tr><tr><td>low_limit</td><td>时间段中的跌停价</td><td></td></tr><tr><td>avg</td><td>时间段中的平均价</td><td><p>(1)天级别：股票是成交额除以成交量；期货是直接从CTP行情获取的，计算方法为成交额除以成交量再除以合约乘数；</p><p>(2)分钟级别：用该分钟所有tick的现价乘以该tick的成交量加起来之后，再除以该分钟的成交量。</p></td></tr><tr><td>pre_close</td><td>前一个单位时间结束时的价格,按天则是前一天的收盘价</td><td>期货：pre_close--前一天结算；建议使用get_extras获取结算价；在分钟频率下pre_close=open</td></tr><tr><td>paused</td><td>bool值,股票是否停牌;</td><td>停牌时open/close/low/high/pre_close；都等于停牌前的收盘价, volume=money=0</td></tr></tbody></table>

**返回**

-   请注意, 为了方便比较一只基金的多个属性, 同时也满足对比多只基金的一个属性的需求, 我们在security参数是**一只基金和多只基金时返回的结构完全不一样 (默认panel=True时)**

**代码示例**

**获取一支基金**

```python
# 获得华泰柏瑞沪深300ETF的2018年07月02日 23:30:00-2018年07月02日 23:35:00的分钟数据
df = get_price('510300.XSHG', start_date='2018-08-01 10:00:00', end_date='2018-08-01 10:05:00', frequency='1m')
# 返回[pandas.DataFrame]对象, 行索引是[datetime.datetime]对象, 列索引是行情字段名字
print(df[:5])
                      open  close   high    low     volume      money
2018-08-01 10:00:00  3.435  3.437  3.437  3.435  1250645.0  4297417.0
2018-08-01 10:01:00  3.438  3.435  3.441  3.435  2179295.0  7492471.0
2018-08-01 10:02:00  3.435  3.432  3.435  3.432  1241940.0  4264887.0
2018-08-01 10:03:00  3.432  3.432  3.433  3.431  2061509.0  7075951.0
2018-08-01 10:04:00  3.432  3.431  3.432  3.431   276371.0   948489.0
```

**获取多只基金**

```python
#获得华泰柏瑞沪深300ETF和华夏上证50ETF在2018-08-01 10:00:00至2018-08-01 10:05:00的分钟数据
df = get_price(['510300.XSHG','510050.XSHG'],start_date='2018-08-01 10:00:00', end_date='2018-08-01 10:05:00', frequency='1m')
# 获取开盘价的[pandas.DataFrame],行索引是[datetime.datetime]对象, 列索引是基金代号
print(df['open'])

                     510300.XSHG  510050.XSHG
2018-08-01 10:00:00        3.435        2.491
2018-08-01 10:01:00        3.438        2.493
2018-08-01 10:02:00        3.435        2.491
2018-08-01 10:03:00        3.432        2.486
2018-08-01 10:04:00        3.432        2.486
2018-08-01 10:05:00        3.432        2.486
```

get\_bars 时间周期的行情数据（支持时间周期：'1m','5m', '15m', '30m', '60m', '120m', '1w', '1M'）

```python
get_bars(security, count, unit='1d',
         fields=['date','open','high','low','close'],
         include_now=False, end_dt=None, fq_ref_date=None,df=True)
```

获取各种时间周期的bar数据，bar的分割方式与主流股票软件相同， 同时还支持返回当前时刻所在 bar 的数据。

**参数**

-   security: 基金代码，支持单个及多个标的
-   count: 大于0的整数，表示获取bar的个数。如果行情数据的bar不足count个，返回的长度则小于count个数。
-   unit: bar的时间单位
    当unit为'1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w'(一周), '1M'（一月）标准bar时，bar的分割方式与主流股票软件类似，期货的bar各平台也许稍微有差异，我们与文华接近；
    当unit为非上述标准bar时('xm', 例如'3m')，只支持分钟级别的,x需要小于240，以每天的开盘为起始点，每x分钟为一条bar；
-   fields: 获取数据的字段， 支持如下值：'date', 'open', 'close', 'high', 'low', 'volume', 'money', 'open\_interest'（期货持仓量），factor(复权因子)。
-   include\_now: 取值True 或者False。 表示是否包含end\_dt所在的bar, 比如end\_dt指定为9:38:00，unit参数为5m， 如果 include\_now=True,则返回的最后一条bar为9:35:00-9:38:00这个 bar，否则返回的最后一条bar为09:30:00-09:35:00的bar。
-   end\_dt：查询的截止时间，默认最新的时间。注意:当end\_dt指定为当天尚未结束的交易时间时，会自动填充为上一个交易日收盘的时间
-   fq\_ref\_date：复权基准日期，为None时为不复权数据。
    -   如果用户输入 fq\_ref\_date = None, 则获取到的是不复权的数据
    -   如果用户想获取后复权的数据，可以将fq\_ref\_date 指定为一个很早的日期，比如 datetime.date(2000, 1, 1)
    -   定点复权，以某一天价格点位为参照物，进行的前复权或后复权。设置为datetime.datetime.now()即返回前复权数据 ;
-   df：默认为True，指定返回数据为dataframe结构；当df=False的时候，传入单个标的时，返回一个np.ndarray，多个标的返回一个字典，key是code，value是np.array

**返回**

返回一个pandas.dataframe对象，可以按任意周期返回基金的开盘价、收盘价、最高价、最低价，同时也可以利用date数据查看所返回的数据是什么时刻的。

**示例** **获取一只基金**

```python
#获取招商快线ETF按120分钟为周期以"2018-12-05"为基础往前5个时间单位的数据
df = get_bars('159003.XSHE', 5, unit='120m',fields=['date','open','high','low','close'],include_now=False,end_dt='2018-12-05')
print(df)

                 date     open     high     low    close
0 2018-11-30 15:00:00  100.000  100.001  99.999  100.000
1 2018-12-03 11:30:00   99.997  100.000  99.995   99.998
2 2018-12-03 15:00:00   99.998  100.000  99.998  100.000
3 2018-12-04 11:30:00   99.999  100.001  99.999  100.000
4 2018-12-04 15:00:00  100.000  100.050  99.999  100.002
```

**获取多只基金**

```python
# 获取港股精选lof、招商快线ETF按5分钟为周期以“2018-3-01 14:22:35”为基础前4个时间单位的数据
df = get_bars(['160322.XSHE','159003.XSHE'],4, unit='5m',fields=['date','open','high','low','close'],include_now=True,end_dt='2018-3-01 14:22:35')
print(df)
                 date   open   high    low  close
0 2018-03-01 13:50:00  1.233  1.233  1.233  1.233
1 2018-03-01 13:55:00  1.233  1.233  1.233  1.233
2 2018-03-01 14:00:00  1.233  1.233  1.219  1.219
3 2018-03-01 14:05:00  1.219  1.219  1.218  1.219
4 2018-03-01 14:10:00  1.219  1.219  1.218  1.218
5 2018-03-01 14:15:00  1.218  1.218  1.218  1.218
6 2018-03-01 14:20:00  1.218  1.218  1.218  1.218
7 2018-03-01 14:22:00  1.218  1.218  1.218  1.218
```

get\_call\_auction 获取集合竞价数据 / 2019年至今

```python
get_call_auction(security, start_date, end_date, fields=None)
```

支持股票（2010年至今）、场内基金（2019年至今）、指数（2017年至今）和上证ETF期权（2017年至今）的集合竞价数据。当日的集合竞价数据下午15点更新。为了防止返回数据量过大, 我们每次最多返回5000行。

**参数**：

-   security: **场内基金（2019年至今）**
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
#获取招商快线2019-3-05至2019-3-06期间的集合竞价数据
df=get_call_auction('159003.XSHE','2019-3-05','2019-3-06')
print(df)

          code                time  current   volume      money   a1_p  \
0  159003.XSHE 2019-03-05 09:25:03    100.0  16300.0  1629951.1  100.0
1  159003.XSHE 2019-03-06 09:25:03    100.0  29300.0  2929941.4  100.0

      a1_v   a2_p     a2_v   a3_p   ...     b1_p    b1_v    b2_p    b2_v  \
0  19412.0  100.0  21915.0  100.0   ...    100.0  1500.0   99.99  5300.0
1   9199.0  100.0  49813.0  100.0   ...    100.0   300.0  100.00   500.0

     b3_p    b3_v   b4_p    b4_v   b5_p    b5_v
0   99.99   900.0  99.99  3000.0  99.99  1000.0
1  100.00  1200.0  99.99  6500.0  99.99  9400.0

[2 rows x 25 columns]
```

get\_ticks (机构) 获取场内基金tick数据 / 2019-01-01 至今

```python
get_ticks(security, start_dt, end_dt, count, fields, skip,df)
```

**场内基金部分， 支持 2019-01-01 至今的tick数据，提供买五卖五盘口数据。（每3秒一次快照）**

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 场内基金代码，如'510050.XSHG'

-   start\_dt: 开始日期，格式为'YYYY-MM-DD HH:MM:SS'

-   end\_dt: 结束日期，格式为'YYYY-MM-DD HH:MM:SS'

-   count: 取出指定时间区间内前N条的tick数据。

-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下场内基金tick返回结果。

-   skip: 默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据。

-   df: 指定返回的数据格式，默认为True，返回dataframe；df=False时返回一个np.ndarray

    **场内基金tick返回结果**


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

**场内基金tick数据示例**：

```python
#获取50ETF基金2019-10-15的tick数据
df=get_ticks('510050.XSHG','2019-10-16 09:00:00','2019-10-16 15:00:00')
print(df[:15])
                      time  current   high    low     volume       money  \
0  2019-10-16 09:25:00.392    3.064  3.064  3.064  2327900.0   7132686.0
1  2019-10-16 09:30:00.552    3.064  3.065  3.063  2491600.0   7634304.0
2  2019-10-16 09:30:03.532    3.064  3.065  3.063  3177815.0   9737131.0
3  2019-10-16 09:30:06.488    3.062  3.065  3.062  4283600.0  13124520.0
4  2019-10-16 09:30:08.988    3.064  3.065  3.062  4346100.0  13315970.0
5  2019-10-16 09:30:11.480    3.065  3.065  3.062  4666100.0  14296725.0
6  2019-10-16 09:30:14.500    3.064  3.065  3.062  4731900.0  14498336.0
7  2019-10-16 09:30:17.360    3.062  3.065  3.062  4856200.0  14878966.0
8  2019-10-16 09:30:21.148    3.062  3.065  3.062  5109000.0  15653040.0
9  2019-10-16 09:30:24.520    3.063  3.065  3.061  5361300.0  16425704.0
10 2019-10-16 09:30:26.120    3.062  3.065  3.061  5401300.0  16548184.0
11 2019-10-16 09:30:30.560    3.063  3.065  3.061  5579200.0  17093053.0
12 2019-10-16 09:30:33.540    3.064  3.065  3.061  6100200.0  18689378.0
13 2019-10-16 09:30:36.420    3.065  3.065  3.061  6270800.0  19212123.0
14 2019-10-16 09:30:38.892    3.067  3.067  3.061  6640300.0  20345030.0

     a1_p       a1_v   a2_p       a2_v    ...      b1_p      b1_v   b2_p  \
0   3.064    80011.0  3.065   471300.0    ...     3.063  111500.0  3.062
1   3.065   412211.0  3.066    50800.0    ...     3.064   20900.0  3.063
2   3.065   110711.0  3.066    44400.0    ...     3.064  118700.0  3.063
3   3.063    45715.0  3.064    49200.0    ...     3.062  101200.0  3.061
4   3.064    44615.0  3.065  1338211.0    ...     3.063     500.0  3.062
5   3.065  1062826.0  3.066  1544500.0    ...     3.064   10000.0  3.063
6   3.064  1445000.0  3.065  1662826.0    ...     3.063    3100.0  3.062
7   3.062   252800.0  3.064  2594900.0    ...     3.061  121500.0  3.060
8   3.064  2324000.0  3.065  2263226.0    ...     3.063    6000.0  3.061
9   3.063   189700.0  3.064  2024000.0    ...     3.062   64000.0  3.061
10  3.063   157700.0  3.064  1163900.0    ...     3.062   34000.0  3.061
11  3.063    18800.0  3.064   865200.0    ...     3.062  346000.0  3.061
12  3.064    63400.0  3.065   325300.0    ...     3.063   10000.0  3.062
13  3.066    44500.0  3.067   407600.0    ...     3.065  418400.0  3.064
14  3.067   387600.0  3.068   977500.0    ...     3.065   50000.0  3.064

        b2_v   b3_p      b3_v   b4_p       b4_v   b5_p      b5_v
0    91300.0  3.061   50600.0  3.060   159200.0  3.059   10800.0
1    97100.0  3.062   93300.0  3.061    55600.0  3.060  159200.0
2   546585.0  3.062  165500.0  3.061   156400.0  3.060  402100.0
3   466400.0  3.060  473100.0  3.059    20100.0  3.058  219200.0
4   101200.0  3.061  399900.0  3.060   491100.0  3.059   20100.0
5      500.0  3.062  111200.0  3.061   471500.0  3.060  521100.0
6   111200.0  3.061  481500.0  3.060   521100.0  3.059  164100.0
7   522100.0  3.059  164100.0  3.058   363200.0  3.057     400.0
8   471500.0  3.060  520200.0  3.059   164100.0  3.058  363200.0
9   451500.0  3.060  520200.0  3.059   164100.0  3.058  363200.0
10  411700.0  3.060  520200.0  3.059   164100.0  3.058  363200.0
11  141700.0  3.060  553200.0  3.059   164100.0  3.058  363200.0
12  297000.0  3.061  141700.0  3.060   594100.0  3.059  164100.0
13   50000.0  3.063  212200.0  3.062  1227000.0  3.061  142200.0
14  330200.0  3.063  212000.0  3.062  1227100.0  3.061  142200.0

[15 rows x 26 columns]
```

<a id="基金融资融券"></a>

### 基金融资融券

-   **更新时间：2010至今，下一个交易日10点之前更新**

方法 描述

get\_mtss 获取基金的融资融券信息

```python
get_mtss(security_list, start_date=None, end_date=None, fields=None, count=None)
```

获取一只或者多只基金在一个时间段内的融资融券信息

**参数**

-   security\_list: 一只基金代码或者一个基金代码的 list

-   start\_date: 开始日期, **与 count 二选一, 不可同时使用**. 一个字符串或者 \[datetime.datetime\]/\[datetime.date\] 对象, 默认为平台提供的数据的最早日期

-   end\_date: 结束日期, 一个字符串或者 \[datetime.date\]/\[datetime.datetime\] 对象, 默认为 datetime.date.today()

-   count: 数量, **与 start\_date 二选一，不可同时使用**, 必须大于 0. 表示返回 end\_date 之前 count 个交易日的数据, 包含 end\_date

-   fields: 字段名或者 list, 可选. 默认为 None, 表示取全部字段, 各字段含义如下：

    | 字段名 | 含义 |
    | --- | --- |
    | date | 日期 |
    | sec\_code | 基金代码 |
    | fin\_value | 融资余额(元） |
    | fin\_buy\_value | 融资买入额（元） |
    | fin\_refund\_value | 融资偿还额（元） |
    | sec\_value | 融券余量（股） |
    | sec\_sell\_value | 融券卖出量（股） |
    | sec\_refund\_value | 融券偿还量（股） |
    | fin\_sec\_value | 融资融券余额（元） |

-   **返回**


返回一个 \[pandas.DataFrame\] 对象，默认的列索引为取得的全部字段. 如果给定了 fields 参数, 则列索引与给定的 fields 对应.

**示例**

**获取一只基金**

```python
# 获取易方达恒生国企ETF在2016-01-01和2016-04-01的融资融券信息
df=get_mtss('510900.XSHG','2016-01-01','2016-04-01',fields=['date','sec_code','fin_value','fin_buy_value','fin_refund_value','sec_value','sec_sell_value','sec_refund_value','fin_sec_value'])
print(df[:5])

        date     sec_code    fin_value  fin_buy_value  fin_refund_value  \
0 2016-01-04  510900.XSHG  482308708.0     22248940.0        11551982.0
1 2016-01-05  510900.XSHG  491306588.0     22509481.0        16488831.0
2 2016-01-06  510900.XSHG  508819867.0     35343749.0        17830470.0
3 2016-01-07  510900.XSHG  523377028.0     17389386.0         2832225.0
4 2016-01-08  510900.XSHG  540172694.0     44289244.0        27493578.0

   sec_value  sec_sell_value  sec_refund_value  fin_sec_value
0        0.0             0.0               0.0    482308708.0
1        0.0             0.0               0.0    491306588.0
2        0.0             0.0               0.0    508819867.0
3        0.0             0.0               0.0    523377028.0
4        0.0             0.0               0.0    540172694.0
```

```python
# 获取上证180ETF基金在日期 2016-06-30 往前 5 个交易日的融资融券信息
df=get_mtss('510180.XSHG', end_date="2016-06-30", count=5,fields=['date','sec_code','fin_value','fin_buy_value','fin_refund_value','sec_value','sec_sell_value','sec_refund_value','fin_sec_value'])
print(df)
        date     sec_code     fin_value  fin_buy_value  fin_refund_value  \
0 2016-06-24  510180.XSHG  1.390217e+09       819754.0          947410.0
1 2016-06-27  510180.XSHG  1.390132e+09        21340.0          106343.0
2 2016-06-28  510180.XSHG  1.390143e+09       228053.0          217386.0
3 2016-06-29  510180.XSHG  1.390280e+09       344875.0          207587.0
4 2016-06-30  510180.XSHG  1.387647e+09       492910.0         3125884.0

   sec_value  sec_sell_value  sec_refund_value  fin_sec_value
0  2222005.0        476900.0          475800.0   1.396101e+09
1  1924005.0        112000.0          410000.0   1.395292e+09
2  1894305.0        354900.0          384600.0   1.395254e+09
3  1917305.0        240800.0          217800.0   1.395491e+09
4  1888705.0         11400.0           40000.0   1.392781e+09
```

**获取多只基金**

```python
# 获取消费ETF、金融ETF、农业50基金的融资融券信息
df=get_mtss(['510150.XSHG','510230.XSHG','159827.XSHE'],'2021-02-24','2021-02-24',fields=['date','sec_code','fin_value','fin_buy_value','fin_refund_value','sec_value','sec_sell_value','sec_refund_value','fin_sec_value'])
print(df)
        date     sec_code   fin_value  fin_buy_value  fin_refund_value  \
0 2021-02-24  510150.XSHG  34822768.0      2121711.0         3335257.0
1 2021-02-24  510230.XSHG  41945048.0      3083287.0         7138831.0
2 2021-02-24  159827.XSHE   6530989.0      1408821.0         1551326.0

   sec_value  sec_sell_value  sec_refund_value  fin_sec_value
0        0.0             0.0               0.0     34822768.0
1        0.0             0.0               0.0     41945048.0
2        0.0             0.0               0.0      6530989.0
```

get\_margincash\_stocks **融资**标的列表

```python
get_margincash_stocks(date)
```

**参数** date:默认为None,不指定时返回上交所、深交所最近一次披露的的可融资标的列表的list。

**返回结果** 返回指定日期上交所、深交所披露的的可融资标的列表的list。

**示例**

```python
# 判断芯片ETF是否在可融资列表
'159813.XSHE' in get_margincash_stocks(date='2021-03-02')
>>> True
```

get\_marginsec\_stocks **融券**标的列表

```python
get_marginsec_stocks(date)
```

**参数** date:默认为None,不指定时返回上交所、深交所最近一次披露的的可融券标的列表的list。

**返回结果** 返回指定日期上交所、深交所披露的的可融券标的列表的list。

**示例**

```python
# 判断新经济ETF是否在可融券列表
'159822.XSHE' in get_marginsec_stocks(date='2021-03-02')
>>> True
```

STK\_MT\_TOTAL 融资融券汇总数据

```python
from jqdatasdk import *
finance.run_query(query(finance.STK_MT_TOTAL).filter(finance.STK_MT_TOTAL.date=='2019-05-23').limit(n))
```

描述：记录上海交易所和深圳交易所的融资融券汇总数据

**参数：**

-   **query(finance.STK\_MT\_TOTAL)**：表示从finance.STK\_MT\_TOTAL这张表中查询融资融券汇总数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[query简易教程](https://www.joinquant.com/view/community/detail/16411)
-   **finance.STK\_MT\_TOTAL**：收录了融资融券汇总数据，表结构和字段信息如下：

**字段设计**

<table><tbody><tr><td>名称</td><td>类型</td><td>描述</td></tr><tr><td>date</td><td>date</td><td>交易日期</td></tr><tr><td>exchange_code</td><td>varchar(12)</td><td><p>交易市场。例如，XSHG-上海证券交易所；XSHE-深圳证券交易所。</p><p>对应DataAPI.SysCodeGet.codeTypeID=10002。</p></td></tr><tr><td>fin_value</td><td>decimal(20,2)</td><td>融资余额（元）</td></tr><tr><td>fin_buy_value</td><td>decimal(20,2)</td><td>融资买入额（元）</td></tr><tr><td>sec_volume</td><td>int</td><td>融券余量（股）</td></tr><tr><td>sec_value</td><td>decimal(20,2)</td><td>融券余量金额（元）</td></tr><tr><td>sec_sell_volume</td><td>int</td><td>融券卖出量（股）</td></tr><tr><td>fin_sec_value</td><td>decimal(20,2)</td><td>融资融券余额（元）</td></tr></tbody></table>

-   **filter(finance.STK\_MT\_TOTAL.date==date)**：指定筛选条件，通过finance.STK\_MT\_TOTAL.date==date可以指定你想要查询的日期；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询2019-05-23的融资融券汇总数据。
df=finance.run_query(query(finance.STK_MT_TOTAL).filter(finance.STK_MT_TOTAL.date=='2019-05-23'))
print(df)

     id        date exchange_code     fin_value  fin_buy_value  sec_volume  \
0  4445  2019-05-23          XSHE  3.601290e+11   1.460400e+10   136000000
1  4446  2019-05-23          XSHG  5.605276e+11   1.906461e+10   930593681

      sec_value  sec_sell_volume  fin_sec_value
0  1.465000e+09         26000000   3.615940e+11
1  6.018287e+09        144633497   5.665458e+11
```

<a id="公募基金数据净值等"></a>

### 公募基金数据(净值等)

方法 描述（传入基金代码无需添加后缀）/ 更新时间及频率

FUND\_MAIN\_INFO 基金主体信息 / 上市至今，盘后24:00更新

```python
from jqdatasdk import finance
finance.run_query(query(finance.FUND_MAIN_INFO).filter(finance.FUND_MAIN_INFO.main_code==main_code).limit(n))
```

描述：记录不同基金的主体信息

**参数：**

-   **query(finance.FUND\_MAIN\_INFO)**：表示从finance.FUND\_MAIN\_INFO这张表中查询公募基金主体信息数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.FUND\_MAIN\_INFO**：收录了公募基金主体信息数据，表结构和字段信息如下：

**字段设计**

| **字段** | **名称** | **类型** |
| --- | --- | --- |
| main\_code | 基金主体代码 | varchar(12) |
| name | 基金名称 | varchar(100) |
| advisor | 基金管理人 | varchar(100) |
| trustee | 基金托管人 | varchar(100) |
| operate\_mode\_id | 基金运作方式编码 | int |
| operate\_mode | 基金运作方式 | varchar(32) |
| underlying\_asset\_type\_id | 投资标的类型编码 | int |
| underlying\_asset\_type | 投资标的类型 | varchar(32) |
| start\_date | 成立日期 | date |
| pub\_date | 发行日期 | date |
| end\_date | 结束日期 | date |
| invest\_style\_id | 投资风格编码 | int |
| invest\_style | 投资风格 | varchar(32) |
| statistics\_main\_code | 基金统计主代码（仅多份额基金存在此字段） | varchar(32) |
| 基金运作方式编码 |  |  |

| 编码 | 401001 | 401002 | 401003 | 401004 | 401005 | 401006 | 401008 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 基金运作方式 | 开放式基金 | 封闭式基金 | QDII | FOF | ETF | LOF | 基础设施基金 |

基金类别编码

| 编码 | 402001 | 402002 | 402003 | 402004 | 402005 | 402006 | 402007 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 基金类别 | 股票型 | 货币型 | 债券型 | 混合型 | 基金型 | 贵金属 | 封闭式 |

-   **filter(finance.FUND\_MAIN\_INFO.main\_code==main\_code)**：指定筛选条件，通过finance.FUND\_MAIN\_INFO.main\_code==main\_code可以指定你想要查询的基金主体代码；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

场内

```python
#查询瑞和小康封闭式基金的基金主体信息数据,传入的基金代码无须添加后缀
from jqdatasdk import finance
q=query(finance.FUND_MAIN_INFO).filter(finance.FUND_MAIN_INFO.main_code=='150008')
df=finance.run_query(q)
print(df)

     id main_code  name       advisor       trustee  operate_mode_id  \
0  4975    150008  瑞和小康  国投瑞银基金管理有限公司  中国工商银行股份有限公司           401002

  operate_mode  underlying_asset_type_id underlying_asset_type  start_date  \
0        封闭式基金                    402001                   股票型  2009-10-14

     end_date
0  2020-08-28
```

场外

```python
#查询华夏成长开放式基金的基金主体信息数据,传入的基金代码无须添加后缀
q=query(finance.FUND_MAIN_INFO).filter(finance.FUND_MAIN_INFO.main_code=='000001')
df=finance.run_query(q)
print(df)

  id main_code  name     advisor       trustee  operate_mode_id operate_mode  \
0   1    000001  华夏成长  华夏基金管理有限公司  中国建设银行股份有限公司           401001        开放式基金

   underlying_asset_type_id underlying_asset_type  start_date end_date
0                    402004                   混合型  2001-12-18     None
```

FUND\_NET\_VALUE 基金净值信息 / 上市至今，盘前9:00更新

```python
from jqdatasdk import finance
finance.run_query(query(finance.FUND_NET_VALUE).filter(finance.FUND_NET_VALUE.code==code).limit(n))
```

描述：记录公募基金的净值数据

**参数：**

-   **query(finance.FUND\_NET\_VALUE)**：表示从finance.FUND\_NET\_VALUE这张表中查询基金净值数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.FUND\_NET\_VALUE**：收录了基金净值数据，表结构和字段信息如下：

**字段设计**

| **字段** | **名称** | **类型** | **注释** |
| --- | --- | --- | --- |
| code | 基金代码 | varchar(12) |  |
| day | 交易日 | date |  |
| net\_value | 单位净值 | decimal(20,6) | 基金单位净值=（基金资产总值－基金负债）÷ 基金总份额 |
| sum\_value | 累计净值 | decimal(20,6) | 累计单位净值＝单位净值＋成立以来每份累计分红派息的金额 |
| factor | 复权因子 | decimal(20,6) | 交易日最近一次分红拆分送股的复权因子 |
| acc\_factor | 累计复权因子 | decimal(20,6) | 基金从上市至今累计分红拆分送股的复权因子 |
| refactor\_net\_value | 累计复权净值 | decimal(20,6) | 复权单位净值＝单计净值＋成立以来每份累计分红派息的金额（1+涨跌幅） |

-   **filter(finance.FUND\_NET\_VALUE.code==code)**：指定筛选条件，通过finance.FUND\_NET\_VALUE.code==code可以指定你想要查询的基金代码；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

场内

```python
#查询瑞和小康("150008)基金净值数据，传入的基金代码无需添加后缀
from jqdatasdk import finance
q=query(finance.FUND_NET_VALUE).filter(finance.FUND_NET_VALUE.code=="150008").order_by(finance.FUND_NET_VALUE.day.desc()).limit(5)
df=finance.run_query(q)
print(df)
         id    code         day  net_value  sum_value  factor  acc_factor  \
0  23506832  150008  2020-08-27      1.227      1.613     1.0    1.314668
1  23506831  150008  2020-08-26      1.228      1.614     1.0    1.314668
2  23506830  150008  2020-08-25      1.234      1.622     1.0    1.314668
3  23425100  150008  2020-08-24      1.234      1.622     1.0    1.314668
4  23414948  150008  2020-08-21      1.229      1.616     1.0    1.314668

   refactor_net_value
0            1.613098
1            1.614412
2            1.622300
3            1.622300
4            1.615727
```

场外

```python
#查询华夏成长证券投资基金("000001")基金净值数据，传入的基金代码无需添加后缀
q=query(finance.FUND_NET_VALUE).filter(finance.FUND_NET_VALUE.code=="000001").order_by(finance.FUND_NET_VALUE.day.desc()).limit(5)
df=finance.run_query(q)
print(df)

         id    code         day  net_value  sum_value  factor  acc_factor  \
0  27902258  000001  2021-03-05      1.284      3.795     1.0    6.062503
1  27897919  000001  2021-03-04      1.281      3.792     1.0    6.062503
2  27884693  000001  2021-03-03      1.330      3.841     1.0    6.062503
3  27871106  000001  2021-03-02      1.315      3.826     1.0    6.062503
4  27864300  000001  2021-03-01      1.336      3.847     1.0    6.062503

   refactor_net_value
0            7.784254
1            7.766066
2            8.063129
3            7.972191
4            8.099504
```

FUND\_PORTFOLIO\_STOCK 基金持股信息 / 上市至今，盘后24:00更新

```python
from jqdatasdk import finance
finance.run_query(query(finance.FUND_PORTFOLIO_STOCK).filter(finance.FUND_PORTFOLIO_STOCK.code==code).limit(n))
```

描述：统计基金季度报表、半年度报表和年度报表披露的股票持仓数据

**参数：**

-   **query(finance.FUND\_PORTFOLIO\_STOCK)**：表示从finance.FUND\_PORTFOLIO\_STOCK这张表中查询基金持仓股票组合数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.FUND\_PORTFOLIO\_STOCK**：收录了基金持仓股票组合数据，表结构和字段信息如下：

**字段设计**

| 字段名称 | 中文名称 | 字段类型 |
| --- | --- | --- |
| code | 基金代码 | varchar(12) |
| period\_start | 开始日期 | date |
| period\_end | 报告期 | date |
| pub\_date | 公告日期 | date |
| report\_type\_id | 报告类型编码 | int |
| report\_type | 报告类型 | varchar(32) |
| rank | 持仓排名 | int |
| symbol | 股票代码 | varchar(32) |
| name | 股票名称 | varchar(100) |
| shares | 持有股票 | decimal(20,4) |
| market\_cap | 持有股票的市值 | decimal(20,4) |
| proportion | 占净值比例 | decimal(10,4) |

-   **filter(finance.FUND\_PORTFOLIO\_STOCK.code==code)**：指定筛选条件，通过finance.FUND\_PORTFOLIO\_STOCK.code==code可以指定你想要查询的基金代码；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

场内

```python
#查询合润A基金("150016")最近一个季度的基金持仓股票组合前5只股票
q=query(finance.FUND_PORTFOLIO_STOCK).filter(finance.FUND_PORTFOLIO_STOCK.code=="150016").order_by(finance.FUND_PORTFOLIO_STOCK.pub_date.desc()).limit(5)
df=finance.run_query(q)
print(df)

         id    code period_start  period_end    pub_date  report_type_id  \
0  16178727  150016   2020-10-01  2020-12-31  2021-01-22          403004
1  16178726  150016   2020-10-01  2020-12-31  2021-01-22          403004
2  16178725  150016   2020-10-01  2020-12-31  2021-01-22          403004
3  16178724  150016   2020-10-01  2020-12-31  2021-01-22          403004
4  16178723  150016   2020-10-01  2020-12-31  2021-01-22          403004

  report_type  rank  symbol  name      shares    market_cap  proportion
0        第四季度    10  601012  隆基股份   6707249.0  5.835850e+08        2.83
1        第四季度     9  688099  晶晨股份   7575165.0  5.887965e+08        2.86
2        第四季度     8  000895  双汇发展  13913806.0  6.439926e+08        3.13
3        第四季度     7  300413  芒果超媒   9394546.0  6.811046e+08        3.31
4        第四季度     6  002594   比亚迪   3581370.0  6.958602e+08        3.38
```

场外

```python
#查询中海新能源主题灵活配置混合型证券投资基金("398051")最近一个季度的基金持仓股票组合前10只股票
q=query(finance.FUND_PORTFOLIO_STOCK).filter(finance.FUND_PORTFOLIO_STOCK.code=="398051").order_by(finance.FUND_PORTFOLIO_STOCK.pub_date.desc()).limit(5)
df=finance.run_query(q)
print(df)

         id    code period_start  period_end    pub_date  report_type_id  \
0  16189331  398051   2020-10-01  2020-12-31  2021-01-22          403004
1  16189327  398051   2020-10-01  2020-12-31  2021-01-22          403004
2  16189328  398051   2020-10-01  2020-12-31  2021-01-22          403004
3  16189329  398051   2020-10-01  2020-12-31  2021-01-22          403004
4  16189330  398051   2020-10-01  2020-12-31  2021-01-22          403004

  report_type  rank  symbol  name     shares   market_cap  proportion
0        第四季度     5  002460  赣锋锂业   496540.0  50249848.00        3.63
1        第四季度     1  300750  宁德时代   203995.0  71624684.45        5.17
2        第四季度     2  600438  通威股份  1673800.0  64340872.00        4.64
3        第四季度     3  002594   比亚迪   285600.0  55492080.00        4.00
4        第四季度     4  300124  汇川技术   540276.0  50407750.80        3.64
```

FUND\_PORTFOLIO\_BOND 基金持有的债券信息 / 上市至今，盘后24:00更新

```python
from jqdatasdk import finance
finance.run_query(query(finance.FUND_PORTFOLIO_BOND).filter(finance.FUND_PORTFOLIO_BOND.code==code).limit(n))
```

描述：记录公募基金按季度公布的债券组合，为债券投资者提供一些参照

**参数：**

-   **query(finance.FUND\_PORTFOLIO\_BOND)**：表示从finance.FUND\_PORTFOLIO\_BOND这张表中查询基金持仓债券组合数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.FUND\_PORTFOLIO\_BOND**：收录了基金持仓债券组合数据，表结构和字段信息如下：

**字段设计**

| 字段名称 | 中文名称 | 字段类型 |
| --- | --- | --- |
| code | 基金代码 | varchar(12) |
| period\_start | 开始日期 | date |
| period\_end | 报告期 | date |
| pub\_date | 公告日期 | date |
| report\_type\_id | 报告类型编码 | int |
| report\_type | 报告类型 | varchar(32) |
| rank | 持仓排名 | int |
| symbol | 债券代码 | varchar(32) |
| name | 债券名称 | varchar(100) |
| shares | 持有债券数量 | decimal(20,4) |
| market\_cap | 持有债券的市值 | decimal(20,4) |
| proportion | 占净值比例 | decimal(10,4) |

-   **filter(finance.FUND\_PORTFOLIO\_BOND.code==code)**：指定筛选条件，通过finance.FUND\_PORTFOLIO\_BOND.code==code可以指定你想要查询的基金代码；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

场内

```python
#查询银华锐进基金("150019")基金持有的债券组合数据
df=finance.run_query(query(finance.FUND_PORTFOLIO_BOND).filter(finance.FUND_PORTFOLIO_BOND.code=='150019').order_by(finance.FUND_PORTFOLIO_BOND.pub_date.desc()).limit(5))
print(df)

       id    code period_start  period_end    pub_date  report_type_id  \
0  727440  150019   2019-04-01  2019-06-30  2019-07-19          403002
1  697207  150019   2019-01-01  2019-03-31  2019-04-18          403001
2  697208  150019   2019-01-01  2019-03-31  2019-04-18          403001
3  697209  150019   2019-01-01  2019-03-31  2019-04-18          403001

  report_type  rank  symbol    name    shares  market_cap  proportion
0        第二季度     1  108603  国开1804   90000.0   9005400.0        0.14
1        第一季度     1  018005  国开1701  380000.0  38003800.0        0.57
2        第一季度     2  108603  国开1804   80000.0   8040000.0        0.12
3        第一季度     3  019537  16国债09   66810.0   6681000.0        0.10
```

场外

```python
#查询中海环保新能源主题灵活配置混合型证券投资基金("398051")基金持有的债券组合数据
df=finance.run_query(query(finance.FUND_PORTFOLIO_BOND).filter(finance.FUND_PORTFOLIO_BOND.code=='398051').order_by(finance.FUND_PORTFOLIO_BOND.pub_date.desc()).limit(5))
print(df)

       id    code period_start  period_end    pub_date  report_type_id  \
0  929557  398051   2020-10-01  2020-12-31  2021-01-22          403004
1  929556  398051   2020-10-01  2020-12-31  2021-01-22          403004
2  929555  398051   2020-10-01  2020-12-31  2021-01-22          403004
3  929554  398051   2020-10-01  2020-12-31  2021-01-22          403004
4  929558  398051   2020-10-01  2020-12-31  2021-01-22          403004

  report_type  rank  symbol    name    shares   market_cap  proportion
0        第四季度     4  113040    星宇转债  110000.0  15744300.00        1.14
1        第四季度     3  019640  20国债10  235200.0  23489424.00        1.69
2        第四季度     2  123070    鹏辉转债  269372.0  37356508.96        2.70
3        第四季度     1  019645  20国债15  380000.0  38136800.00        2.75
4        第四季度     5  113586    上机转债   37130.0  15395583.20        1.11
```

FUND\_PORTFOLIO 基金资产组合概况 / 上市至今，盘后24:00更新

```python
from jqdatasdk import finance
finance.run_query(query(finance.FUND_PORTFOLIO).filter(finance.FUND_PORTFOLIO.code==code).limit(n))
```

描述：基金资产组合概况

**参数：**

-   **query(finance.FUND\_PORTFOLIO)**：表示从finance.FUND\_PORTFOLIO这张表中查询基金资产组合概况数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.FUND\_PORTFOLIO**：收录了基金资产组合概况数据，表结构和字段信息如下：

**字段设计**

| 字段名称 | 中文名称 | 字段类型 |
| --- | --- | --- |
| code | 基金代码 | varchar(12) |
| name | 基金名称 | varchar(80) |
| period\_start | 开始日期 | date |
| period\_end | 报告期 | date |
| pub\_date | 公告日期 | date |
| report\_type\_id | 报告类型编码 | int |
| report\_type | 报告类型 | varchar(32) |
| equity\_value | 权益类投资金额 | decimal(20,4) |
| equity\_rate | 权益类投资占比 | decimal(10,4) |
| stock\_value | 股票投资金额 | decimal(20,4) |
| stock\_rate | 股票投资占比 | decimal(10,4) |
| fixed\_income\_value | 固定收益投资金额 | decimal(20,4) |
| fixed\_income\_rate | 固定收益投资占比 | decimal(10,4) |
| precious\_metal\_value | 贵金属投资金额 | decimal(20,4) |
| precious\_metal\_rate | 贵金属投资占比 | decimal(10,4) |
| derivative\_value | 金融衍生品投资金额 | decimal(20,4) |
| derivative\_rate | 金融衍生品投资占比 | decimal(10,4) |
| buying\_back\_value | 买入返售金融资产金额 | decimal(20,4) |
| buying\_back\_rate | 买入返售金融资产占比 | decimal(10,4) |
| deposit\_value | 银行存款和结算备付金合计 | decimal(20,4) |
| deposit\_rate | 银行存款和结算备付金合计占比 | decimal(10,4) |
| others\_value | 其他资产 | decimal(20,4) |
| others\_rate | 其他资产占比 | decimal(10,4) |
| total\_asset | 总资产合计 | decimal(20,4) |

-   **filter(finance.FUND\_PORTFOLIO.code==code)**：指定筛选条件，通过finance.FUND\_PORTFOLIO.code==code可以指定你想要查询的基金代码；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

场内

```python
#查询深成指B基金("150023")基金资产组合概况数据，传入的基金代码无需后缀
from jqdatasdk import finance
q=query(finance.FUND_PORTFOLIO.code,
                  finance.FUND_PORTFOLIO.name,
                  finance.FUND_PORTFOLIO.pub_date,
                  finance.FUND_PORTFOLIO.stock_rate,
                  finance.FUND_PORTFOLIO.fixed_income_rate,
finance.FUND_PORTFOLIO.total_asset).filter(finance.FUND_PORTFOLIO.code=="150023").order_by(finance.FUND_PORTFOLIO.pub_date.desc()).limit(5)
df=finance.run_query(q)
print(df)

     code                    name    pub_date  stock_rate  fixed_income_rate  \
0  150023  申万菱信深证成指分级证券投资基金申万进取份额  2021-01-22       84.92                0.0
1  150023  申万菱信深证成指分级证券投资基金申万进取份额  2020-10-28       93.66                0.0
2  150023  申万菱信深证成指分级证券投资基金申万进取份额  2020-07-21       93.18                NaN
3  150023  申万菱信深证成指分级证券投资基金申万进取份额  2020-04-22       92.68                NaN
4  150023  申万菱信深证成指分级证券投资基金申万进取份额  2020-01-20       93.35                NaN

    total_asset
0  2.499121e+09
1  3.503815e+09
2  3.314002e+09
3  2.794784e+09
4  2.960295e+09
```

场外

```python
#查询开元证券投资基金("184688")基金资产组合概况数据，传入的基金代码无需后缀
from jqdatasdk import finance
q=query(finance.FUND_PORTFOLIO.code,
                  finance.FUND_PORTFOLIO.name,
                  finance.FUND_PORTFOLIO.pub_date,
                  finance.FUND_PORTFOLIO.stock_rate,
                  finance.FUND_PORTFOLIO.fixed_income_rate,
finance.FUND_PORTFOLIO.total_asset).filter(finance.FUND_PORTFOLIO.code=="184688").order_by(finance.FUND_PORTFOLIO.pub_date.desc()).limit(5)
df=finance.run_query(q)
print(df)

     code      name    pub_date  stock_rate  fixed_income_rate   total_asset
0  184688  开元证券投资基金  2013-01-21       76.08              23.14  1.755376e+09
1  184688  开元证券投资基金  2012-10-26       73.16              25.00  1.710568e+09
2  184688  开元证券投资基金  2012-07-18       73.93              24.76  1.733814e+09
3  184688  开元证券投资基金  2012-04-23       76.62              21.86  1.726419e+09
4  184688  开元证券投资基金  2012-01-20       73.83              24.41  1.625162e+09
```

FUND\_FIN\_INDICATOR 基金财务指标信息 / 上市至今，盘后24:00更新

```python
from jqdatasdk import finance
finance.run_query(query(finance.FUND_FIN_INDICATOR).filter(finance.FUND_FIN_INDICATOR.code==code).limit(n))
```

描述：基金财务指标表

**参数：**

-   **query(finance.FUND\_FIN\_INDICATOR)**：表示从finance.FUND\_FIN\_INDICATOR这张表中查询基金财务指标数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.FUND\_FIN\_INDICATOR**：收录了基金财务指标数据，表结构和字段信息如下：

**字段设计**

| **字段** | **名称** | **类型** |
| --- | --- | --- |
| code | 基金代码 | varchar(12) |
| name | 基金名称 | varchar(80) |
| period\_start | 开始日期 | date |
| period\_end | 结束日期 | date |
| pub\_date | 公告日期 | date |
| report\_type\_id | 报告类型编码 | int |
| report\_type | 报告类型 | varchar(32) |
| profit | 本期利润 |  |
| adjust\_profit | 本期利润扣减本期公允价值变动损益后的净额 |  |
| avg\_profit | 加权平均份额本期利润 |  |
| avg\_roe | 加权平均净值利润率 |  |
| profit\_available | 期末可供分配利润 |  |
| profit\_avaialbe\_per\_share | 期末可供分配份额利润 |  |
| total\_tna | 期末基金资产净值 |  |
| nav | 期末基金份额净值 |  |
| adjust\_nav | 期末还原后基金份额累计净值 |  |
| nav\_growth | 本期净值增长率 |  |
| acc\_nav\_growth | 累计净值增长率 |  |
| adjust\_nav\_growth | 扣除配售新股基金净值增长率 |  |

-   filter(finance.FUND\_FIN\_INDICATOR.code==code)\*\*：指定筛选条件，通过finance.FUND\_FIN\_INDICATOR.code==code可以指定你想要查询的基金代码；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

场内

```python
#查询中证100A ("150012")最近公布的基金财务指标数据
from jqdatasdk import finance
df=finance.run_query(query(finance.FUND_FIN_INDICATOR).filter(finance.FUND_FIN_INDICATOR.code=="150012").order_by(finance.FUND_FIN_INDICATOR.pub_date.desc()).limit(5))
print(df)

       id    code                        name period_start  period_end  \
0  292513  150012  国联安双禧中证100指数分级证券投资基金之双禧A份额   2020-10-01  2020-12-03
1  281349  150012  国联安双禧中证100指数分级证券投资基金之双禧A份额   2020-07-01  2020-09-30
2  271957  150012  国联安双禧中证100指数分级证券投资基金之双禧A份额   2020-01-01  2020-06-30
3  261374  150012  国联安双禧中证100指数分级证券投资基金之双禧A份额   2020-04-01  2020-06-30
4  253095  150012  国联安双禧中证100指数分级证券投资基金之双禧A份额   2019-01-01  2019-12-31

     pub_date  report_type_id report_type       profit adjust_profit  \
0  2021-01-22             NaN        None  45870259.14          None
1  2020-10-28        403003.0        第三季度  36286659.81          None
2  2020-08-31        403005.0         半年度   4531704.53          None
3  2020-07-21        403002.0        第二季度  24149860.00          None
4  2020-04-30        403006.0          年度  57334199.41          None

      ...      avg_roe  profit_available  profit_avaialbe_per_share  \
0     ...          NaN               NaN                        NaN
1     ...          NaN               NaN                        NaN
2     ...         2.31       83167293.31                     0.4727
3     ...          NaN               NaN                        NaN
4     ...        33.40       89486260.36                     0.4413

      total_tna    nav  adjust_nav nav_growth  acc_nav_growth  \
0  3.340269e+08  0.998        None        NaN             NaN
1  3.989853e+08  1.314        None        NaN             NaN
2  1.971414e+08  1.120        None       2.85           72.87
3  1.971414e+08  1.120        None        NaN             NaN
4  2.208318e+08  1.089        None      39.27           68.09

   adjust_nav_growth total_asset
0               None        None
1               None        None
2               None        None
3               None        None
4               None        None

[5 rows x 21 columns]
```

场外

```python
# 查询开元证券投资基金("184688")最近公布的基金财务指标数据
from jqdatasdk import finance
df=finance.run_query(query(finance.FUND_FIN_INDICATOR).filter(finance.FUND_FIN_INDICATOR.code=="184688").order_by(finance.FUND_FIN_INDICATOR.pub_date.desc()).limit(5))
print(df)

      id    code      name period_start  period_end    pub_date  \
0  96394  184688  开元证券投资基金   2013-01-01  2013-02-17  2013-04-19
1  96390  184688  开元证券投资基金   2012-01-01  2012-12-31  2013-03-29
2  96393  184688  开元证券投资基金   2012-10-01  2012-12-31  2013-01-21
3  96392  184688  开元证券投资基金   2012-07-01  2012-09-30  2012-10-26
4  96389  184688  开元证券投资基金   2012-01-01  2012-06-30  2012-08-29

   report_type_id report_type        profit  adjust_profit     ...      \
0          403001        第一季度  1.046992e+08  -2.691637e+08     ...
1          403006          年度  1.294180e+08  -9.863223e+07     ...
2          403004        第四季度  4.416168e+07  -1.701878e+07     ...
3          403003        第三季度 -2.341911e+07  -5.788890e+06     ...
4          403005         半年度  1.086755e+08  -7.582456e+07     ...

   avg_roe  profit_available  profit_avaialbe_per_share     total_tna     nav  \
0      NaN               NaN                        NaN  1.853842e+09  0.9269
1     7.48     -2.508577e+08                    -0.1254  1.749142e+09  0.8746
2      NaN               NaN                        NaN  1.749142e+09  0.8746
3      NaN               NaN                        NaN  1.704981e+09  0.8525
4     6.12     -2.716003e+08                    -0.1358  1.728400e+09  0.8642

   adjust_nav nav_growth  acc_nav_growth  adjust_nav_growth total_asset
0        None        NaN             NaN               None        None
1        None       7.99          488.67               None        None
2        None        NaN             NaN               None        None
3        None        NaN             NaN               None        None
4        None       6.70          484.78               None        None

[5 rows x 21 columns]
```

FUND\_MF\_DAILY\_PROFIT 货币基金收益日报 / 上市至今，盘后24:00更新

```python
from jqdatasdk import finance
finance.run_query(query(finance.FUND_MF_DAILY_PROFIT).filter(finance.FUND_MF_DAILY_PROFIT.code==code).limit(n))
```

描述：货币基金收益日报

**参数：**

-   **query(finance.FUND\_MF\_DAILY\_PROFIT)**：表示从finance.FUND\_MF\_DAILY\_PROFIT这张表中查询货币基金收益日报数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.FUND\_MF\_DAILY\_PROFIT**：收录了货币基金收益日报数据，表结构和字段信息如下：

**字段设计**

| **字段** | **名称** | **类型** |
| --- | --- | --- |
| code | 基金代码 | varchar(12) |
| name | 基金名称 | varchar(80) |
| end\_date | 收益日期 | date |
| weekly\_yield | 7日年化收益率(%) | decimal(10,4) |
| daily\_profit | 每万份基金单位当日收益(元) | decimal(10,4) |

-   **filter(finance.FUND\_MF\_DAILY\_PROFIT.code==code)**：指定筛选条件，通过finance.FUND\_MF\_DAILY\_PROFIT.code==code可以指定你想要查询的基金代码；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

```python
#查询汇添富现金宝("000330")货币基金收益日报数据，只显示5条信息。
from jqdatasdk import finance
df=finance.run_query(query(finance.FUND_MF_DAILY_PROFIT).filter(finance.FUND_MF_DAILY_PROFIT.code=='000330').order_by(finance.FUND_MF_DAILY_PROFIT.end_date.desc()).limit(5))
print(df)

        id    code            name    end_date  weekly_yield  daily_profit
0  1742123  000330  汇添富现金宝货币市场基金A类  2021-03-17         2.165        0.5857
1  1741454  000330  汇添富现金宝货币市场基金A类  2021-03-16         2.172        0.5863
2  1740404  000330  汇添富现金宝货币市场基金A类  2021-03-15         2.168        0.6136
3  1740100  000330  汇添富现金宝货币市场基金A类  2021-03-14         2.155        0.5785
4  1739586  000330  汇添富现金宝货币市场基金A类  2021-03-13         2.155        0.5812
```

FUND\_DIVIDEND 基金分红拆分合并信息 / 上市至今，盘后24:00更新

```python
from jqdatasdk import finance
finance.run_query(query(finance.FUND_DIVIDEND).filter(finance.FUND_DIVIDEND.code==code).limit(n))
```

描述：记录基金分红、拆分和合并的方案

**参数：**

-   **query(finance.FUND\_DIVIDEND)**：表示从finance.FUND\_DIVIDEND这张表中查询基金分红拆分合并数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见：[sqlalchemy.orm.query.Query对象](http://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)
-   **finance.FUND\_DIVIDEND**：收录了基金分红拆分合并数据，表结构和字段信息如下：

**字段设计**

| **字段** | **名称** | **类型** |
| --- | --- | --- |
| code | 基金代码 | varchar(12) |
| name | 基金名称 | varchar(80) |
| pub\_date | 公布日期 | date |
| event\_id | 事项类别 | int |
| event | 事项名称 | varchar(100) |
| distribution\_date | 分配收益日 | date |
| process\_id | 方案进度编码 | int |
| process | 方案进度 | varchar(100) |
| proportion | 派现比例 | decimal(20,8) |
| split\_ratio | 分拆（合并、赠送）比例 | decimal(20,8) |
| record\_date | 权益登记日 | date |
| ex\_date | 除息日 | date |
| fund\_paid\_date | 基金红利派发日 | date |
| redeem\_date | 再投资赎回起始日 | date |
| dividend\_implement\_date | 分红实施公告日 | dated |
| dividend\_cancel\_date | 取消分红公告日 | date |
| otc\_ex\_date | 场外除息日 | date |
| pay\_date | 红利派发日 | date |
| new\_share\_code | 新增份额基金代码 | varchar(10) |
| new\_share\_name | 新增份额基金名称 | varchar(100) |

事项类别编码 404

| **编码** | **名称** |
| --- | --- |
| 404001 | 基金分红 |
| 404002 | 基金分拆 |
| 404003 | 基金合并 |
| 404004 | 基金赠送 |
| 404005 | 分级基金折算 |

基金分红拆分合并进度编码 405

| **编码** | **名称** |
| --- | --- |
| 405001 | 分红预案 |
| 405002 | 实施方案 |
| 405003 | 取消折算 |

-   **filter(finance.FUND\_DIVIDEND.code==code)**：指定筛选条件，通过finance.FUND\_DIVIDEND.code==code可以指定你想要查询的基金代码；除此之外，还可以对表中其他字段指定筛选条件；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  **为了防止返回数据量过大, 我们每次最多返回5000行**
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**

场内

```python
#查询银华稳进("150018")基金分红拆分合并数据。
from jqdatasdk import finance
df=finance.run_query(query(finance.FUND_DIVIDEND).filter(finance.FUND_DIVIDEND.code=="150018").order_by(finance.FUND_DIVIDEND.pub_date.desc()).limit(5))
print(df)

      id    code                    name    pub_date  event_id   event  \
0  67506  150018  银华深证100指数分级证券投资基金之银华稳进  2021-01-05    404005  分级基金折算
1  66010  150018  银华深证100指数分级证券投资基金之银华稳进  2020-01-06    404005  分级基金折算
2  49827  150018  银华深证100指数分级证券投资基金之银华稳进  2019-01-04    404005  分级基金折算
3  17737  150018  银华深证100指数分级证券投资基金之银华稳进  2018-01-04    404005  分级基金折算
4  15266  150018  银华深证100指数分级证券投资基金之银华稳进  2017-01-05    404005  分级基金折算

  distribution_date process_id process proportion          ...           \
0              None       None    None       None          ...
1              None       None    None       None          ...
2              None       None    None       None          ...
3              None       None    None       None          ...
4              None       None    None       None          ...

   record_date     ex_date fund_paid_date redeem_date dividend_implement_date  \
0   2020-12-31  2020-12-31           None        None                    None
1   2020-01-02  2020-01-02           None        None                    None
2   2019-01-02  2019-01-02           None        None                    None
3   2018-01-02  2018-01-02           None        None                    None
4   2017-01-03  2017-01-03           None        None                    None

  dividend_cancel_date otc_ex_date pay_date new_share_code  \
0                 None        None     None       77161812
1                 None        None     None       77161812
2                 None        None     None       77161812
3                 None        None     None       77161812
4                 None        None     None       77161812

         new_share_name
0  银华深证100指数证券投资基金(LOF)
1     银华深证100指数分级证券投资基金
2     银华深证100指数分级证券投资基金
3     银华深证100指数分级证券投资基金
4     银华深证100指数分级证券投资基金

[5 rows x 21 columns]
```

场外

```python
#查询开元证券投资基金("184688")基金分红拆分合并数据。
from jqdatasdk import finance
df=finance.run_query(query(finance.FUND_DIVIDEND).filter(finance.FUND_DIVIDEND.code=="184688").order_by(finance.FUND_DIVIDEND.pub_date.desc()).limit(4))
print(df)

     id    code      name    pub_date  event_id event distribution_date  \
0  2759  184688  开元证券投资基金  2011-02-15    404001  基金分红        2010-12-31
1  2306  184688  开元证券投资基金  2010-04-03    404001  基金分红        2009-12-31
2  1581  184688  开元证券投资基金  2008-03-29    404001  基金分红        2007-12-31
3  1452  184688  开元证券投资基金  2007-10-25    404001  基金分红        2007-09-30

   process_id process  proportion      ...       record_date ex_date  \
0      405002    实施方案       0.030      ...        2011-02-18    None
1      405002    实施方案       0.050      ...        2010-04-13    None
2      405002    实施方案       1.372      ...        2008-04-10    None
3      405002    实施方案       0.300      ...        2007-11-01    None

  fund_paid_date redeem_date dividend_implement_date dividend_cancel_date  \
0           None        None              2011-02-15                 None
1           None        None              2010-04-03                 None
2           None        None              2008-03-29                 None
3           None        None              2007-10-25                 None

  otc_ex_date    pay_date new_share_code new_share_name
0  2011-02-21  2011-02-21           None           None
1  2010-04-14  2010-04-14           None           None
2  2008-04-11  2008-04-11           None           None
3  2007-11-02  2007-11-02           None           None

[4 rows x 21 columns]
```
