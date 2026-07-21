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

将其他形式的场内基金代码转换为jqdatasdk函数可用的基金代码形式。 **仅适用于场内基金代码,支持传入单只基金或一个基金list**

**示例**

get\_security\_info 获取单只基金信息/ 2005至今，8:00更新

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

get\_all\_securities 获取所有基金信息/ 2005至今，8:00更新

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

get\_extras 基金累计净值/基金单位净值/场外基金的复权净值——2005至今，下一个交易日10点之前更新

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

FUND\_SHARE\_DAILY 基金份额数据（二级市场）/ 2005-02-23至今，下一个交易日10点之前更新

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

<a id="场内基金行情数据"></a>

### 场内基金行情数据

-   **更新时间：日行情 2005至今，盘后15点、24点更新**
-   **更新时间：分钟行情 2005至今，盘后15点、24点更新**

方法 描述（场内）/ 更新时间及频率

get\_price 1天/分钟行情数据

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

**参数**

<table><tbody><tr><td><strong>参数名称</strong></td><td><strong>参数说明</strong></td><td><strong>注释</strong></td></tr><tr><td>security</td><td>标的</td><td>可获取种类：股票、期货、基金、指数、期权</td></tr><tr><td>start_date</td><td>开始时间，不可与count同时使用。当'count'和'start_date'为None时, 默认值是 '2015-01-01 00:00:00'</td><td>当指定frequency为minute时，如果只传入日期，则日内时间为当日的 00:00:00</td></tr><tr><td>end_date</td><td>结束时间，如无指定，默认为'2015-12-31 00:00:00'。当end_date指定为当天尚未结束的交易时间时，会自动填充为上一个交易日的盘后时间</td><td><p>当指定frequency为minute时, 如果只传入日期, 则日内时间为当日的 00:00:00，</p><p>所以返回的数据不包括 end_date这天。</p></td></tr><tr><td>count</td><td>表示获取 end_date 之前几个 frequency 的数据，与start_date不可同时使用。</td><td>返回的结果集的行数, 即表示获取 end_date 之前count个 frequency 的数据</td></tr><tr><td>frequency</td><td>单位时间长度，即指定获取的时间频级为分钟级（minute）或日级（daily）,也可以指定为 '3m','10d' 等</td><td><p>daily'(同'1d')， 'minute'(同'1m')，</p><p><a href="https://www.joinquant.com/view/community/detail/cea095760a0583ce965964912580077e?type=1">点击查看get_price和get_bars的合成逻辑。</a>如需5分钟,1小时等标准bar请使用get_bars</p></td></tr><tr><td>fields</td><td>所获取数据的字段名称，即表头。默认是None(返回标准字段['open','close','high','low','volume','money'])</td><td><p>可选择填入以下字段，字段说明可查阅下面fields表</p><p>['open','close','low','high','volume','money','factor',</p><p>'high_limit','low_limit','avg','pre_close','paused','open_interest'],</p><p>open_interest为期货持仓量</p></td></tr><tr><td>skip_paused</td><td>是否跳过不交易日期(含：停牌/未上市/退市后的日期)</td><td>如果不跳过, 停牌时会使用停牌前的数据填充，上市前或者退市后数据都为 nan。</td></tr><tr><td>fill_paused</td><td>对于停牌股票的价格处理，默认为True</td><td>默认为True,用pre_close价格填充);False 表示使用NAN填充停牌的股票价格。</td></tr><tr><td>fq</td><td>复权选项，默认为前复权（fq='pre'）</td><td>'pre'：前复权 / 'none'：不复权, 返回实际价格 / 'post'：后复权</td></tr><tr><td>panel</td><td>指定返回的数据格式为panel</td><td><p>默认为True；指定panel=False时返回dataframe格式；</p><p>如本地pandas版本大于0.25将强制返回datdaframe详见案例</p></td></tr></tbody></table>

**fields**内各字段属性

<table><tbody><tr><td><strong>字段名称</strong></td><td><strong>中文名称</strong></td><td><strong>注释</strong></td></tr><tr><td>open</td><td>时间段开始时价格</td><td></td></tr><tr><td>close</td><td>时间段结束时价格</td><td></td></tr><tr><td>low</td><td>时间段中的最低价</td><td></td></tr><tr><td>high</td><td>时间段中的最高价</td><td></td></tr><tr><td>volume</td><td>时间段中的成交的股票数量</td><td>单位股</td></tr><tr><td>money</td><td>时间段中的成交的金额</td><td></td></tr><tr><td>factor</td><td>pre':前复权(默认)/None:不复权,返回实际价格/'post':后复权</td><td><p>前(后)复权数据=价格×前(后)复权因子;</p><p>前(后)复权后的成交量=成交量 / 前(后)复权因子;</p><p>成交额不处理</p></td></tr><tr><td>high_limit</td><td>时间段中的涨停价</td><td></td></tr><tr><td>low_limit</td><td>时间段中的跌停价</td><td></td></tr><tr><td>avg</td><td>时间段中的平均价</td><td><p>(1)天级别：股票是成交额除以成交量；期货是直接从CTP行情获取的，计算方法为成交额除以成交量再除以合约乘数；</p><p>(2)分钟级别：用该分钟所有tick的现价乘以该tick的成交量加起来之后，再除以该分钟的成交量。</p></td></tr><tr><td>pre_close</td><td>前一个单位时间结束时的价格,按天则是前一天的收盘价</td><td>期货：pre_close--前一天结算；建议使用get_extras获取结算价；在分钟频率下pre_close=open</td></tr><tr><td>paused</td><td>bool值,股票是否停牌;</td><td>停牌时open/close/low/high/pre_close；都等于停牌前的收盘价, volume=money=0</td></tr></tbody></table>

**返回**

-   请注意, 为了方便比较一只基金的多个属性, 同时也满足对比多只基金的一个属性的需求, 我们在security参数是**一只基金和多只基金时返回的结构完全不一样 (默认panel=True时)**

**代码示例**

**获取一支基金**

**获取多只基金**

get\_bars 时间周期的行情数据（支持时间周期：'1m','5m', '15m', '30m', '60m', '120m', '1w', '1M'）

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

**获取多只基金**

get\_call\_auction 获取集合竞价数据 / 2019年至今

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

get\_ticks (机构) 获取场内基金tick数据 / 2019-01-01 至今

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

<a id="基金融资融券"></a>

### 基金融资融券

-   **更新时间：2010至今，下一个交易日10点之前更新**

方法 描述

get\_mtss 获取基金的融资融券信息

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

**获取多只基金**

get\_margincash\_stocks **融资**标的列表

**参数** date:默认为None,不指定时返回上交所、深交所最近一次披露的的可融资标的列表的list。

**返回结果** 返回指定日期上交所、深交所披露的的可融资标的列表的list。

**示例**

get\_marginsec\_stocks **融券**标的列表

**参数** date:默认为None,不指定时返回上交所、深交所最近一次披露的的可融券标的列表的list。

**返回结果** 返回指定日期上交所、深交所披露的的可融券标的列表的list。

**示例**

STK\_MT\_TOTAL 融资融券汇总数据

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

<a id="公募基金数据净值等"></a>

### 公募基金数据(净值等)

方法 描述（传入基金代码无需添加后缀）/ 更新时间及频率

FUND\_MAIN\_INFO 基金主体信息 / 上市至今，盘后24:00更新

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

场外

FUND\_NET\_VALUE 基金净值信息 / 上市至今，盘前9:00更新

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

场外

FUND\_PORTFOLIO\_STOCK 基金持股信息 / 上市至今，盘后24:00更新

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

场外

FUND\_PORTFOLIO\_BOND 基金持有的债券信息 / 上市至今，盘后24:00更新

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

场外

FUND\_PORTFOLIO 基金资产组合概况 / 上市至今，盘后24:00更新

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

场外

FUND\_FIN\_INDICATOR 基金财务指标信息 / 上市至今，盘后24:00更新

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

场外

FUND\_MF\_DAILY\_PROFIT 货币基金收益日报 / 上市至今，盘后24:00更新

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

FUND\_DIVIDEND 基金分红拆分合并信息 / 上市至今，盘后24:00更新

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

场外
