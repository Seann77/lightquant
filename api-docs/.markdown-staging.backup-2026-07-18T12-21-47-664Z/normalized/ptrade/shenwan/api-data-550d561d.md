---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: market_data
title: 行情数据接口
section_path:
  - 数据接口
  - 行情数据接口
source_file: api-docs/raw/ptrade/shenwan/08_api_data.html
source_url: http://101.71.132.53:9091/qthelp/api/data.html
source_anchor: "#行情数据接口"
source_sha256: f3ab9ba25e36fa781998eb70f34588f59350edf1682aa3d8402bc435e3042b1e
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="行情数据接口"></a>

## 行情数据接口

<a id="get_history"></a>

### `get_history`

<a id="中文名-20"></a>

#### 中文名

历史行情查询

<a id="接口说明-20"></a>

#### 接口说明

获取股票历史行情K线数据，支持多股票、多周期、多字段的历史数据查询。

<a id="接口定义-20"></a>

#### 接口定义

python

```python
get_history(count, frequency='1d', field=None, security_list=None, fq=None, include=False, fill='nan', is_dict=False)
```

<a id="使用场景-20"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   该接口只能获取2005年后的数据。
-   针对停牌场景，我们没有跳过停牌的日期，无论对单只股票还是多只股票进行调用，时间轴均为二级市场交易日日历， 停牌时使用停牌前的数据填充，成交量为0，日K线可使用成交量为0的逻辑进行停牌日过滤。
-   证监会行业、聚源行业、概念板块、地域板块所对应标的的行情数据为非标准的交易所下发数据，是由数据源自行按照成分股分类规则进行计算的，存在与三方数据源不一致的情况。如用户需要在策略中使用，应自行评估该数据的合理性。
-   该接口与get\_price接口不支持多线程同时调用，即在run\_daily或run\_interval等函数中不要与handle\_data等框架模块同一时刻调用get\_history或get\_price接口，否则会偶现获取数据为空的现象。
-   该接口获取的数据由调用该接口的引擎时间决定的，例如框架函数handle\_data在9:31分触发，而写在handle\_data中的该函数直到9：33分才调用，那么获取的数据均是9:31分之前的数据，不包含9:32和9:33的数据。
-   建议用户使用该接口获取历史数据时不要同时获取当日数据，因为当日数据受行情影响不可控；建议用户每天在获取历史数据之后缓存起来，不必每次都进行调用获取。

<a id="参数-17"></a>

#### 参数

**`count`**

-   类型： `int`

K线数量，大于0，返回指定数量的K线行情，必填字段

**`frequency`**

-   类型： `str`
-   默认： `'1d'`

K线周期，K线周期，现有支持1分钟线(1m)、5分钟线(5m)、15分钟线(15m)、30分钟线(30m)、60分钟线(60m)、120分钟线(120m)、日线(1d)、周线(1w/weekly)、月线(mo/monthly)、季度线(1q/quarter)和年线(1y/yearly)频率的数据，选填参数，默认为'1d'

**`field`**

-   类型： `str/list[str]`
-   默认： `None`

行情字段，选填字段，当frequency为'1d'时，默认为\['open','high','low','close','volume','money','price'\]；当frequency不为'1d'时，默认为\['open','high','low','close','volume','money','price','is\_open','preclose','high\_limit','low\_limit','unlimited'\]

-   字段如下：
    -   open -- 开盘价，字段返回类型：numpy.float64；
    -   high -- 最高价，字段返回类型：numpy.float64；
    -   low --最低价，字段返回类型：numpy.float64；
    -   close -- 收盘价，字段返回类型：numpy.float64；
    -   volume -- 交易量，字段返回类型：numpy.float64；
    -   money -- 交易金额，字段返回类型：numpy.float64；
    -   price -- 最新价，字段返回类型：numpy.float64；
    -   is\_open -- 是否开盘，字段返回类型：numpy.int64(仅日线返回)；
    -   preclose -- 昨收盘价，字段返回类型：numpy.float64(仅日线返回)；
    -   high\_limit -- 涨停价，字段返回类型：numpy.float64(仅日线返回)；
    -   low\_limit -- 跌停价，字段返回类型：numpy.float64(仅日线返回)；
    -   unlimited -- 判断查询日是否是无涨跌停限制(1:该日无涨跌停限制;0:该日不是无涨跌停限制)，字段返回类型： numpy.int64(仅日线返回)；

**`security_list`**

-   类型： `str/list[str]`
-   默认： `None`

要获取数据的股票列表，选填参数，默认为None，None表示在上下文中的[set\_universe](api-system-e3a203f0.md#set_universe)中选中的所有股票

**`fq`**

-   类型： `str`
-   默认： `None`

数据复权选项，支持包括，pre-前复权，post-后复权，dypre-动态前复权，None-不复权，选填字段

**`include`**

-   类型： `bool`
-   默认： `False`

是否包含当前周期，True -包含，False-不包含，选填字段

**`fill`**

-   类型： `str`
-   默认： `'nan'`

行情获取不到某一时刻的分钟数据时，是否用上一分钟的数据进行填充该时刻数据，'pre'-用上一分钟数据填充，'nan'-NaN进行填充(仅交易有效)；选填参数

**`is_dict`**

-   类型： `bool`
-   默认： `False`

返回是否是字典格式，True-是，False-不是；选填参数，返回为字典格式取数速度相对较快

<a id="返回-20"></a>

#### 返回

`dict | None | pandas.DataFrame | pandas.Panel(新版本已弃用)`：

-   异常时返回None
-   正常时，数据返回有以下几种情况：

1.  `is_dict`参数为True时，返回dict类型数据：

python

```python
# 数据结构说明（OrderedDict格式）
OrderedDict([
    (
        股票代码(str),
        array([
            日期时间(numpy.int64),
            开盘价(numpy.float64),
            最高价(numpy.float64),
            最低价(numpy.float64),
            收盘价(numpy.float64),
            成交量(numpy.float64),
            成交额(numpy.float64),
            最新价(numpy.float64)
        ])
    )
])

# 实际返回示例
OrderedDict([
    (
        '000001.XSHE',
        array([
            (
                202309220931,
                11.03,
                11.08,
                11.03,
                11.07,
                2289400.0,
                25302018.0,
                11.07
            ),
            ...
        ])
    )
])
```

1.  `is_dict`参数为False时，返回非dict类型数据：

-   (python3.5、python3.11版本均支持)第一种返回数据： 当获取单支股票(单只股票必须为字符串类型security\_list='600570.XSHG'，不能用security\_list=\['600570.XSHG'\])的时候，无论行情字段field入参单个或多个，返回的都是pandas.DataFrame对象，行索引是datetime.datetime对象，列索引是行情字段,为str类型。比如：

如果当前时间是2017-04-18，

python

```python
get_history(5, '1d', 'open', '600570.XSHG', fq=None, include=False)
```

将返回：

md

```md
	        open
2017-04-11	40.30
2017-04-12	40.08
2017-04-13	40.03
2017-04-14	40.04
2017-04-17	39.90
```

-   (仅python3.11版本支持)第二种返回数据： 当获取多支股票(多只股票必须为list类型，特殊情况：当list只有一个股票时仍然当做多股票处理，比如security\_list=\['600570.XSHG'\])的时候，无论行情字段field入参是单个还是多个，返回的是pandas.DataFrame对象，行索引是datetime.datetime对象，列索引是股票代码code和取的字段,为str类型。比如：

如果当前时间是2017-04-18，

python

```python
get_history(5, '1d', 'open', ['600570.XSHG','600571.XSHG'], fq=None, include=False)
```

将返回：

md

```md
	        code	    open
2017-04-11	600570.XSHG	40.30
2017-04-12	600570.XSHG	40.08
2017-04-13	600570.XSHG	40.03
2017-04-14	600570.XSHG	40.04
2017-04-17	600570.XSHG	39.90
2017-04-11	600571.XSHG	17.81
2017-04-12	600571.XSHG	17.56
2017-04-13	600571.XSHG	17.42
2017-04-14	600571.XSHG	17.40
2017-04-17	600571.XSHG	17.49
```

假如要对获取查询多只代码种某单只代码或多只代码的数据，可以通过x.query('code in \["xxxxxx.XSHG"\]')的方法获取。

比如:

python

```python
dataframe_info = get_history(2, frequency='1d', field=['open','close'], security_list=['600570.XSHG', '600571.XSHG'], fq=None, include=False)
```

则获取600570.XSHG = dataframe\_info.query('code in \["600570.XSHG"\]')

-   (仅python3.5版本支持)第三种返回数据： 当获取多支股票(多只股票必须为list类型，特殊情况：当list只有一个股票时仍然当做多股票处理，比如security\_list=\['600570.XSHG'\])的时候，如果行情字段field入参为单个，返回的是pandas.DataFrame对象，行索引是datetime.datetime对象，列索引是股票代码的编号,为str类型。比如：

如果当前时间是2017-04-18，

python

```python
get_history(5, '1d', 'open', ['600570.XSHG','600571.XSHG'], fq=None, include=False)
```

将返回：

md

```md
	600570.XSHG	600571.XSHG
2017-04-11	40.30	17.81
2017-04-12	40.08	17.56
2017-04-13	40.03	17.42
2017-04-14	40.04	17.40
2017-04-17	39.90	17.49
```

-   (仅python3.5版本支持)第四种返回数据： 当获取多支股票(多只股票必须为list类型，特殊情况：当list只有一个股票时仍然当做多股票处理，比如security\_list=\['600570.XSHG'\])的时候，如果行情字段field入参为多个，则返回pandas.Panel对象，items索引是行情字段(如'open'、'close'等)，里面是很多pandas.DataFrame对象，每个pandas.DataFrame的行索引是datetime.datetime对象， 列索引是股票代码,为str类型，比如:

如果当前时间是2015-01-07，

python

```python
get_history(2, frequency='1d', field=['open','close'], security_list=['600570.XSHG', '600571.XSHG'], fq=None, include=False)['open']
```

将返回:

md

```md
	600570.XSHG	600571.XSHG
2015-01-05	54.77	26.93
2015-01-06	51.00	25.83
```

假如要对panel索引中的对象进行转换，比如将items索引由行情字段转换成股票代码，可以通过panel\_info = panel\_info.swapaxes("minor\_axis", "items")的方法转换。

比如:

python

```python
panel_info = get_history(2, frequency='1d', field=['open','close'], security_list=['600570.XSHG', '600571.XSHG'], fq=None, include=False)
```

按默认索引：df = panel\_info\['open'\]

对默认索引做转换：panel\_info = panel\_info.swapaxes("minor\_axis", "items")

转换之后的索引：df = panel\_info\['600570.XSHG'\]

<a id="示例-20"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def before_trading_start(context, data):
    # 获取农业版块过去10天的每日收盘价
    industry_info = get_history(10, frequency="1d", field="close", security_list="A01000.XBHS")
    log.info(industry_info)

def handle_data(context, data):
    # 股票池中全部股票过去5天的每日收盘价
    his = get_history(5, '1d', 'close', security_list=g.security)
    log.info('股票池中全部股票过去5天的每日收盘价')
    log.info(his)

    # 获取600570(恒生电子)过去5天的每天收盘价,
    # 一个pd.Series对象, index是datatime
    log.info('获取600570(恒生电子)过去5天的每天收盘价')
    his_ss = his.query('code in ["600570.XSHG"]')['close']
    log.info(his_ss)

    # 获取600570(恒生电子)昨天(数组最后一项)的收盘价
    log.info('获取600570(恒生电子)昨天的收盘价')
    log.info(his_ss[-1])

    # 获取每一列的平均值
    log.info('获取600570(恒生电子)每一列的平均值')
    log.info(his_ss.mean())

    # 获取股票池中全部股票的过去10分钟的成交量
    his1 = get_history(10, '1m', 'volume')
    log.info('获取股票池中全部股票的过去10分钟的成交量')
    log.info(his1)

    # 获取恒生电子的过去5天的每天的收盘价
    his2 = get_history(5, '1d', 'close', security_list='600570.XSHG')
    log.info('获取恒生电子的过去5天的每天的收盘价')
    log.info(his2)

    # 获取恒生电子的过去5天的每天的后复权收盘价
    his3 = get_history(5, '1d', 'close', security_list='600570.XSHG', fq='post')
    log.info('获取恒生电子的过去5天的每天的后复权收盘价')
    log.info(his3)

    # 获取恒生电子的过去5周的每周的收盘价
    his4 = get_history(5, '1w', 'close', security_list='600570.XSHG')
    log.info('获取恒生电子的过去5周的每周的收盘价')
    log.info(his4)

    # 获取多只股票的开盘价和收盘价数据
    dataframe_info = get_history(2, frequency='1d', field=['open','close'], security_list=g.security)
    open_df = dataframe_info[['code', 'open']]
    log.info('获所有股票的取开盘价数据')
    log.info(open_df)
    df = open_df.query('code in ["600570.XSHG"]')['open']
    log.info('仅获取恒生电子的开盘价数据')
    log.info(df)
```

<a id="get_price"></a>

### `get_price`

<a id="中文名-21"></a>

#### 中文名

获取历史数据

<a id="接口说明-21"></a>

#### 接口说明

该接口用于获取指定日期前N条的历史行情K线数据或者指定时间段内的历史行情K线数据。支持多股票、多行情字段获取。

<a id="接口定义-21"></a>

#### 接口定义

python

```python
get_price(security, start_date=None, end_date=None, frequency='1d', fields=None, fq=None, count=None, is_dict=False)
```

<a id="使用场景-21"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   start\_date与count必须且只能选择输入一个，不能同时输入或者同时都不输入。
-   针对停牌场景，我们没有跳过停牌的日期，无论对单只股票还是多只股票进行调用，时间轴均为二级市场交易日日历， 停牌时使用停牌前的数据填充，成交量为0，日K线可使用成交量为0的逻辑进行停牌日过滤。
-   数据返回内容不包括当天数据。
-   count只针对'daily', 'weekly', 'monthly', 'quarter', 'yearly', '1d', '1m', '5m', '15m', '30m', '60m', '120m', '1w', 'mo', '1q', '1y'频率有效，并且输入日期的类型需与频率对应。
-   'weekly', '1w', 'monthly', 'mo', 'quarter', '1q', 'yearly', '1y'频率不支持start\_date和end\_date组合的入参， 只支持end\_date和count组合的入参形式。
-   返回的周线数据是由日线数据进行合成。
-   该接口只能获取2005年后的数据。
-   证监会行业、聚源行业、概念板块、地域板块所对应标的的行情数据为非标准的交易所下发数据，是由数据源自行按照成分股分类规则进行计算的，存在与三方数据源不一致的情况。如用户需要在策略中使用，应自行评估该数据的合理性。
-   该接口与get\_history接口不支持多线程同时调用，即在run\_daily或run\_interval等函数中不要与handle\_data等框架模块同一时刻调用get\_history或get\_price接口，否则会偶现获取数据为空的现象。

<a id="参数-18"></a>

#### 参数

**`security`**

-   类型： `list[str]/str`

一支股票代码或者一个股票代码的list，必填字段

**`start_date`**

-   类型： `str`
-   默认： `None`

开始时间，回测中输入请小于回测日期，交易、研究中输入请小于当前日期，且均小于等于end\_date。传入格式仅支持：YYYYmmdd、YYYY-mm-dd、YYYY-mm-dd HH:MM、YYYYmmddHHMM，如'20150601'、'2015-06-01'、'2015-06-01 10:00'、'201506011000'，选填字段

**`end_date`**

-   类型： `str`
-   默认： `None`

结束时间，回测中输入请小于回测日期，交易、研究中输入请小于当前日期。传入格式仅支持：YYYYmmdd、YYYY-mm-dd、YYYY-mm-dd HH:MM、YYYYmmddHHMM，如'20150601'、'2015-06-01'、'2015-06-01 14:00'、'201506011400'，选填字段

**`frequency`**

-   类型： `str`
-   默认： `'1d'`

单位时间长度，现有支持1分钟线(1m)、5分钟线(5m)、15分钟线(15m)、30分钟线(30m)、60分钟线(60m)、120分钟线(120m)、日线(1d)、周线(1w/weekly)、月线(mo/monthly)、季度线(1q/quarter)和年线(1y/yearly)频率数据，选填字段

**`fields`**

-   类型： `list[str]/str`
-   默认： `None`

指明数据结果集中所支持输出字段，选填字段，当frequency为'1d'时，默认为\['open','high','low','close','volume','money','price'\]；当frequency不为'1d'时，默认为\['open','high','low','close','volume','money','price','is\_open','preclose','high\_limit','low\_limit','unlimited'\]

-   输出字段包括:
    -   open -- 开盘价(numpy.float64)；
    -   high -- 最高价(numpy.float64)；
    -   low --最低价(numpy.float64)；
    -   close -- 收盘价(numpy.float64)；
    -   volume -- 交易量(numpy.float64)；
    -   money -- 交易金额(numpy.float64)；
    -   price -- 最新价(numpy.float64)；
    -   is\_open -- 是否开盘(numpy.int64)(仅日线返回)；
    -   preclose -- 昨收盘价(numpy.float64)(仅日线返回)；
    -   high\_limit -- 涨停价(numpy.float64)(仅日线返回)；
    -   low\_limit -- 跌停价(numpy.float64)(仅日线返回)；
    -   unlimited -- 判断查询日是否无涨跌停限制(1：该日无涨跌停限制；0：该日有涨跌停限制)(numpy.int64)(仅日线返回)；

**`fq`**

-   类型： `str`
-   默认： `None`

数据复权选项，支持包括，pre-前复权，post-后复权，dypre-动态前复权，None-不复权，选填字段

**`count`**

-   类型： `str`

大于0，不能与start\_date同时输入，获取end\_date前count根的数据，不支持除天('daily'/'1d')、分钟('1m')、5分钟线('5m')、15分钟线('15m')、30分钟线('30m')、60分钟线('60m')、120分钟线('120m')、周('weekly'/'1w')、('monthly'/'mo')、('quarter'/'1q')和('yearly'/'1y')以外的其它频率，必填字段

**`is_dict`**

-   类型： `bool`
-   默认： `False`

返回是否是字典格式，True-是，False-不是；选填参数，返回为字典格式取数速度相对较快

<a id="返回-21"></a>

#### 返回

`dict | None | pandas.DataFrame | pandas.Panel(新版本已弃用)`：

-   异常时返回None
-   正常时，数据返回有以下几种情况：

1.  `is_dict`参数为True时，返回dict类型数据：

python

```python
# 数据结构说明（OrderedDict格式）
OrderedDict([
    (
        股票代码(str),
        array([
            日期时间(numpy.int64),
            开盘价(numpy.float64),
            最高价(numpy.float64),
            最低价(numpy.float64),
            收盘价(numpy.float64),
            成交量(numpy.float64),
            成交额(numpy.float64),
            最新价(numpy.float64)
        ])
    )
])

# 实际返回示例
OrderedDict([
    (
        '600570.SS',
        array([
            (
                201706010931,
                37.1,
                37.14,
                37.05,
                37.09,
                128200.0,
                4756263.0,
                37.09
            ),
            ...
        ])
    )
])
```

1.  `is_dict`参数为False时，返回非dict类型数据，get\_price对于多股票和多字段不同场景下获取返回数据的规则与get\_history一致，如：

-   (python3.5、python3.11版本均支持)第一种返回数据：

当获取单支股票(单只股票必须为字符串类型security='600570.SS'，不能用security=\['600570.SS'\])和单个或多个字段的时候，返回的是pandas.DataFrame对象，行索引是datetime.datetime对象，列索引是行情字段，为str类型。

例如，输入为

python

```python
get_price(security='600570.SS',start_date='20170201',end_date='20170213',frequency='1d')
```

时，将返回：

md

```md
                 open	high	 low    close	 volume	         money	       price is_open  preclose high_limit low_limit unlimited
2017-02-03	44.47	44.50	43.58	43.90	4418325.0	193895820.0	43.90	1	44.26	48.69	  39.83 	0
2017-02-06	43.91	44.30	43.66	44.10	4428487.0	194979290.0	44.10	1	43.90	48.29	  39.51 	0
2017-02-07	44.05	44.07	43.34	43.52	5649251.0	246776480.0	43.52	1	44.10	48.51	  39.69 	0
2017-02-08	43.59	44.78	43.53	44.59	12570233.0	557883600.0	44.59	1	43.52	47.87	  39.17 	0
2017-02-09	44.74	45.28	44.39	44.74	9240223.0	413875390.0	44.74	1	44.59	49.05	  40.13 	0
2017-02-10	44.80	44.98	44.41	44.62	8097465.0	361757300.0	44.62	1	44.74	49.21	  40.27 	0
2017-02-13	44.32	45.98	44.02	44.89	14931596.0	672360490.0	44.89	1	44.62	49.08	  40.16 	0
```

-   (仅python3.11版本支持)第二种返回数据： 当获取多支股票(多只股票必须为list类型，特殊情况：当list只有一个股票时仍然当做多股票处理，比如security=\['600570.SS'\])时候，返回的是pandas.DataFrame对象，行索引是datetime.datetime对象，列索引是股票代码code和取的字段，为str类型。

例如，输入为

python

```python
get_price(['600570.SS'], start_date='20170201', end_date='20170213', frequency='1d', fields='open')
```

时，将返回：

md

```md
              code     open
2017-02-03  600570.SS  44.47
2017-02-06  600570.SS  43.91
2017-02-07  600570.SS  44.05
2017-02-08  600570.SS  43.59
2017-02-09  600570.SS  44.74
2017-02-10  600570.SS  44.80
2017-02-13  600570.SS  44.32
```

例如，输入为

python

```python
get_price(['600570.SS','600571.SS'], start_date='20170201', end_date='20170213', frequency='1d', fields=['open','close'])[['code', 'open']]
```

时，将返回：

md

```md
               code    open
2017-02-03  600570.SS  44.47
2017-02-06  600570.SS  43.91
2017-02-07  600570.SS  44.05
2017-02-08  600570.SS  43.59
2017-02-09  600570.SS  44.74
2017-02-10  600570.SS  44.80
2017-02-13  600570.SS  44.32
2017-02-03  600571.SS  19.36
2017-02-06  600571.SS  19.00
2017-02-07  600571.SS  19.27
2017-02-08  600571.SS  19.10
2017-02-09  600571.SS  19.47
2017-02-10  600571.SS  19.57
2017-02-13  600571.SS  19.22
```

假如要对获取查询多只代码种某单只代码或多只代码的数据，可以通过x.query('code in \["xxxxxx.SS"\]')的方法获取。

-   (仅python3.5版本支持)第三种返回数据： 当获取多支股票(多只股票必须为list类型，特殊情况：当list只有一个股票时仍然当做多股票处理，比如security=\['600570.SS'\])和单个字段的时候，返回的是pandas.DataFrame对象，行索引是datetime.datetime对象，列索引是股票代码的编号，为str类型。

例如，输入为

python

```python
get_price(['600570.SS'], start_date='20170201', end_date='20170213', frequency='1d', fields='open')
```

时，将返回：

md

```md
              600570.SS
2017-02-03      44.47
2017-02-06      43.91
2017-02-07      44.05
2017-02-08      43.59
2017-02-09      44.74
2017-02-10      44.80
2017-02-13      44.32
```

-   (仅python3.5版本支持)第四种返回数据： 如果是获取多支股票(多只股票必须为list类型，特殊情况：当list只有一个股票时仍然当做多股票处理，比如security=\['600570.SS'\])和多个字段，则返回pandas.Panel对象，items索引是行情字段，为str类型(如'open'、'close'等)，里面是很多pandas.DataFrame对象，每个pandas.DataFrame的行索引是datetime.datetime对象， 列索引是股票代码，为str类型。

例如，输入为

python

```python
get_price(['600570.SS','600571.SS'], start_date='20170201', end_date='20170213', frequency='1d', fields=['open','close'])['open']
```

时，将返回：

md

```md
             600570.SS   600571.SS
2017-02-03    44.47        19.36
2017-02-06    43.91        19.00
2017-02-07    44.05        19.27
2017-02-08    43.59        19.10
2017-02-09    44.74        19.47
2017-02-10    44.80        19.57
2017-02-13    44.32        19.22
```

假如要对panel索引中的对象进行转换，比如将items索引由行情字段转换成股票代码，可以通过panel\_info = panel\_info.swapaxes("minor\_axis", "items")的方法转换。

<a id="示例-21"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 获得600570.SS(恒生电子)的2015年01月的天数据，只获取open字段
    price_open = get_price('600570.SS', start_date='20150101', end_date='20150131', frequency='1d')['open']
    log.info(price_open)
    # 获取指定结束日期前count天到结束日期的所有开盘数据
    # price_open = get_price('600570.SS', end_date='20150131', frequency='daily', count=10)['open']
    # log.info(price_open)
    # 获取股票指定结束时间前count分钟到指定结束时间的所有数据
    # stock_info = get_price('600570.SS', end_date='2015-01-31 10:00', frequency='1m', count=10)
    # log.info(stock_info)
    # 获取指定结束日期前count周到结束日期所在周的所有开盘数据
    # week_open = get_price('600570.SS', end_date='20150131', frequency='1w', count=10)['open']
    # log.info(week_open)

    # 获取多只股票
    # 获取沪深300的2015年1月的天数据，返回一个[pandas.DataFrame]
    security_list = get_index_stocks('000300.XBHS', '20150101')
    price = get_price(security_list, start_date='20150101', end_date='20150131')
    log.info(price)
    # 获取某股票开盘价，行索引是[datetime.datetime]对象，列索引是行情字段

    price_open = price.query('code in [@security_list[0]]')['open']
    log.info(price_open)

    # 获取农业版块指定结束日期前count天到结束日期的数据
    industry_info = get_price("A01000.XBHS", end_date="20210315", frequency="daily", count=10)
    log.info(industry_info)
```

<a id="get_individual_entrust"></a>

### `get_individual_entrust`

<a id="中文名-22"></a>

#### 中文名

逐笔委托查询

<a id="接口说明-22"></a>

#### 接口说明

获取当日逐笔委托行情数据，包括委托时间、价格、数量、方向等详细信息。

<a id="接口定义-22"></a>

#### 接口定义

python

```python
get_individual_entrust(stocks=None, data_count=50, start_pos=0, search_direction=1, is_dict=False)
```

<a id="使用场景-22"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   沪深市场都有逐笔委托数据。
-   逐笔委托、逐笔成交数据需开通level2行情才能获取到数据，否则无数据返回。
-   当策略入参is\_dict为True时返回的数据类型为dict，返回dict类型数据的速度比(python3.11版本支持)DataFrame,(python3.5版本支持)Panel类型数据有大幅提升。

<a id="参数-19"></a>

#### 参数

**`stocks`**

-   类型：`list[str]/str`
-   默认：`None`

单个或多个股票，选填字段，默认为当前股票池[set\_universe](api-system-e3a203f0.md#set_universe)中代码列表

**`data_count`**

-   类型：`int`
-   默认：`50`

数据条数，最大为200，选填字段

**`start_pos`**

-   类型：`int`
-   默认：`0`

起始位置，选填字段

**`search_direction`**

-   类型：`int`
-   默认：`1`

搜索方向，1-向前，2-向后，选填字段

**`is_dict`**

-   类型：`bool`
-   默认： `False`

返回类型，False-(python3.11)DataFrame/(python3.5)Panel，True-dict，选填字段

<a id="返回-22"></a>

#### 返回

`dict | None | pandas.DataFrame | pandas.Panel(新版本已弃用)`：

-   异常时返回None

-   正常时，`is_dict`参数为True时，返回dict类型数据；is\_dict参数为False时，返回非dict类型数据：

-   **dict类型**

    -   数据格式：

        python

        ```python
        {
            股票代码(str): [
                [
                    时间戳毫秒级(int),
                    价格(float),
                    委托数量(int),
                    委托编号(int),
                    委托方向(int),
                    委托类型(int)
                ],
                ...
            ],
            "fields": [
                "business_time",
                "hq_px",
                "business_amount",
                "order_no",
                "business_direction",
                "trans_kind"
            ]
        }

        # 实际返回示例
        {
            "600570.XSHG": [
                [
                    20220913105747848,
                    36.16,
                    700,
                    5383145,
                    0,
                    4
                ],
                ...
            ],
            "fields": [
                "business_time",
                "hq_px",
                "business_amount",
                "order_no",
                "business_direction",
                "trans_kind"
            ]
        }
        ```

-   **非dict类型**

    -   (python3.11)DataFrame/(python3.5)Panel
    -   DataFrame字段：
        -   code: 代码(str)
        -   business\_time: 时间戳毫秒级(int)
        -   hq\_px: 价格(float)
        -   business\_amount: 委托数量(int)
        -   order\_no: 委托编号(int)
        -   business\_direction: [成交方向](help-engine-e187e04d.md#business_direction)(int)
        -   trans\_kind: [委托类型](help-engine-e187e04d.md#trans_kind)(int)
    -   Panel结构：
        -   Items axis: 股票代码列表(str)
        -   Major\_axis axis: 数据索引为自然数列(DataFrame)
        -   Minor\_axis axis:
            -   business\_time: 时间戳毫秒级(str:int)
            -   hq\_px: 价格(str:float)
            -   business\_amount: 委托数量(str:int)
            -   order\_no: 委托编号(str:int)
            -   business\_direction: [成交方向](help-engine-e187e04d.md#business_direction)(str:int)
            -   trans\_kind: [委托类型](help-engine-e187e04d.md#trans_kind)(str:int)

<a id="示例-22"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def before_trading_start(context, data):
    g.flag = False

def handle_data(context, data):
    if not g.flag:
        # 获取当前股票池逐笔委托数据
        entrust = get_individual_entrust()
        log.info(entrust)
        # 获取指定股票列表逐笔委托数据
        entrust = get_individual_entrust(["000002.XSHE", "000032.XSHE"])
        log.info(entrust)
        # 获取委托量
        if entrust is not None:
            business_amount = entrust.query('code in ["000002.XSHE"]')["business_amount"]
            log.info("逐笔数据的委托量为：%s" % business_amount)

        # 返回字典类型数据
        entrust = get_individual_entrust([g.security], is_dict=True)
        log.info("逐笔委托数据为：%s" % entrust)
        g.flag = True
```

<a id="get_individual_transaction"></a>

### `get_individual_transaction`

<a id="中文名-23"></a>

#### 中文名

获取逐笔成交行情

<a id="接口说明-23"></a>

#### 接口说明

该接口用于获取当日逐笔成交行情数据。

<a id="接口定义-23"></a>

#### 接口定义

python

```python
get_individual_transaction(stocks=None, data_count=50, start_pos=0, search_direction=1, is_dict=False)
```

<a id="使用场景-23"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   沪深市场都有逐笔成交数据。
-   逐笔委托、逐笔成交数据需开通level2行情才能获取到数据，否则无数据返回。
-   当策略入参is\_dict为True时返回的数据类型为dict，返回dict类型数据的速度比(python3.11版本支持)DataFrame,(python3.5版本支持)Panel类型数据有大幅提升。

<a id="参数-20"></a>

#### 参数

**`stocks`**

-   类型：`list[str]/str`
-   默认：`None`

单个或多个股票，选填字段，默认为当前股票池[set\_universe](api-system-e3a203f0.md#set_universe)中代码列表

**`data_count`**

-   类型：`int`
-   默认：`50`

数据条数，最大为200，选填字段

**`start_pos`**

-   类型：`int`
-   默认：`0`

起始位置，选填字段

**`search_direction`**

-   类型：`int`
-   默认：`1`

搜索方向，1-向前，2-向后，选填字段

**`is_dict`**

-   类型：`bool`
-   默认： `False`

返回类型，False-(python3.11)DataFrame/(python3.5)Panel，True-dict，选填字段

<a id="返回-23"></a>

#### 返回

`dict | None | pandas.DataFrame | pandas.Panel(新版本已弃用)`：

-   异常时返回None

-   正常时，`is_dict`参数为True时，返回dict类型数据；is\_dict参数为False时，返回非dict类型数据：

-   **dict类型**

    -   数据格式：

        python

        ```python
        {
            股票代码(str): [
                [
                    时间戳毫秒级(int),
                    价格(float),
                    成交数量(int),
                    成交编号(int),
                    成交方向(int),
                    叫买方编号(int),
                    叫卖方编号(int),
                    成交标记(int),
                    盘后逐笔成交序号标识(int),
                    成交通道信息(int)
                ],
                ...
            ],
            "fields": [
                "business_time",
                "hq_px",
                "business_amount",
                "trade_index",
                "business_direction",
                "buy_no",
                "sell_no",
                "trans_flag",
                "trans_identify_am",
                "channel_num"
            ]
        }

        # 实际返回示例
        {
            "600570.XSHG": [
                [
                    20220913111141472,
                    36.47,
                    100,
                    3286989,
                    1,
                    5807243,
                    5804930,
                    0,
                    0,
                    2
                ],
                ...
            ],
            "fields": [
                "business_time",
                "hq_px",
                "business_amount",
                "trade_index",
                "business_direction",
                "buy_no",
                "sell_no",
                "trans_flag",
                "trans_identify_am",
                "channel_num"
            ]
        }
        ```

-   **非dict类型**

    -   (python3.11)DataFrame/(python3.5)Panel
    -   DataFrame字段：
        -   code: 代码(str)
        -   business\_time: 时间戳毫秒级(int)
        -   hq\_px: 价格(float)
        -   business\_amount: 成交数量(int)
        -   trade\_index: 成交编号(int)
        -   business\_direction: [成交方向](help-engine-e187e04d.md#business_direction)(int)
        -   buy\_no: 叫买方编号(int)
        -   sell\_no: 叫卖方编号(int)
        -   trans\_flag: [成交标记](help-engine-e187e04d.md#trans_flag)(int)
        -   trans\_identify\_am: [盘后逐笔成交序号标识](help-engine-e187e04d.md#trans_identify_am)(int)
        -   channel\_num: 成交通道信息(int)
    -   Panel结构：
        -   Items axis: 股票代码列表(str)
        -   Major\_axis axis: 数据索引为自然数列(DataFrame)
        -   Minor\_axis axis:
            -   business\_time: 时间戳毫秒级(str:int)
            -   hq\_px: 价格(str:float)
            -   business\_amount: 成交数量(str:int)
            -   trade\_index: 成交编号(str:int)
            -   business\_direction: [成交方向](help-engine-e187e04d.md#business_direction)(str:int)
            -   buy\_no: 叫买方编号(str:int)
            -   sell\_no: 叫卖方编号(str:int)
            -   trans\_flag: [成交标记](help-engine-e187e04d.md#trans_flag)(str:int)
            -   trans\_identify\_am: [盘后逐笔成交序号标识](help-engine-e187e04d.md#trans_identify_am)(str:int)
            -   channel\_num: 成交通道信息(str:int)

<a id="示例-23"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def before_trading_start(context, data):
    g.flag = False

def handle_data(context, data):
    if not g.flag:
        # 获取当前股票池逐笔成交数据
        transaction = get_individual_transaction()
        log.info(transaction)
        # 获取指定股票列表逐笔成交数据
        transaction = get_individual_transaction(["000002.XSHE", "000032.XSHE"])
        log.info(transaction)
        # 获取成交量
        if transaction is not None:
            business_amount = transaction.query('code in ["000002.XSHE"]')["business_amount"]
            log.info("逐笔数据的成交量为：%s" % business_amount)

        # 返回字典类型数据
        transaction = get_individual_transaction([g.security], is_dict=True)
        log.info("逐笔成交数据为：%s" % transaction)
        g.flag = True
```

<a id="get_tick_direction"></a>

### `get_tick_direction`

<a id="中文名-24"></a>

#### 中文名

获取分时成交行情

<a id="接口说明-24"></a>

#### 接口说明

该接口用于获取当日分时成交行情数据。

<a id="接口定义-24"></a>

#### 接口定义

python

```python
get_tick_direction(symbols, query_date=0, start_pos=0, search_direction=1, data_count=50, is_dict=False)
```

<a id="使用场景-24"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   当策略入参is\_dict为True时返回的数据类型为dict，返回dict类型数据的速度比OrderedDict类型数据有提升。

<a id="参数-21"></a>

#### 参数

**`symbols`**

-   类型：`list[str]/str`
-   默认：`None`

单个或多个股票，必填字段

**`query_date`**

-   类型：`int`
-   默认：`0`

查询日期，返回当日数据（格式YYYYMMDD），选填字段

**`start_pos`**

-   类型：`int`
-   默认：`0`

起始位置，选填字段

**`search_direction`**

-   类型：`int`
-   默认：`1`

搜索方向，1-向前，2-向后，选填字段

**`data_count`**

-   类型：`int`
-   默认：`50`

数据条数，最大为200，选填字段

**`is_dict`**

-   类型：`bool`
-   默认： `False`

返回类型，False-OrderedDict，True-dict，选填字段

<a id="返回-24"></a>

#### 返回

-   入参is\_dict为True时返回dict类型，为False（默认）时返回OrderedDict类型

**dict类型**

-   数据格式：

    python

    ```python
    {
        股票代码(str): [
            [
                时间戳毫秒级(int),
                价格(float),
                价格(int),
                成交数量(int),
                成交金额(int),
                成交笔数(int),
                成交方向(int),
                持仓量(int),
                分笔关联的逐笔开始序号(int),
                分笔关联的逐笔结束序号(int)
            ],
            ...
        ],
        "fields": [
            "time_stamp",
            "hq_px",
            "hq_px64",
            "business_amount",
            "business_balance",
            "business_count",
            "business_direction",
            "amount",
            "start_index",
            "end_index"
        ]
    }

    # 实际返回示例
    {
        "600570.XSHG": [
            [
                20220915132138000,
                36.18,
                0,
                2600,
                94062,
                6,
                1,
                0,
                0,
                0
            ],
            ...
        ],
        "fields": [
            "time_stamp",
            "hq_px",
            "hq_px64",
            "business_amount",
            "business_balance",
            "business_count",
            "business_direction",
            "amount",
            "start_index",
            "end_index"
        ]
    }
    ```


**OrderedDict类型**

-   字段说明：
    -   time\_stamp: 时间戳毫秒级(int)
    -   hq\_px: 价格(float)
    -   hq\_px64: 价格(int)（行情暂不支持，返回均为0）
    -   business\_amount: 成交数量(int)
    -   business\_balance: 成交金额(float)
    -   business\_count: 成交笔数(int)
    -   business\_direction: [成交方向](help-engine-e187e04d.md#business_direction)(int)
    -   amount: 持仓量(int)（行情暂不支持，返回均为0）
    -   start\_index: 分笔关联的逐笔开始序号(int)（行情暂不支持，返回均为0）
    -   end\_index: 分笔关联的逐笔结束序号(int)（行情暂不支持，返回均为0）

<a id="示例-24"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def handle_data(context, data):
    # 获取分时成交数据
    direction_data = get_tick_direction([g.security])
    log.info(direction_data)
    # 获取成交量
    business_amount = direction_data[g.security]["business_amount"]
    log.info("分时成交的成交量为：%s" % business_amount)

    # 返回字典类型数据
    direction_data = get_tick_direction([g.security], is_dict=True)
    log.info(direction_data)
```

<a id="get_snapshot"></a>

### `get_snapshot`

<a id="中文名-25"></a>

#### 中文名

获取行情快照

<a id="接口说明-25"></a>

#### 接口说明

该接口用于获取实时行情快照。

<a id="接口定义-25"></a>

#### 接口定义

python

```python
get_snapshot(security)
```

<a id="使用场景-25"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   证监会行业、聚源行业、概念板块、地域板块所对应标的的行情数据为非标准的交易所下发数据，是由数据源自行按照成分股分类规则进行计算的，存在与三方数据源不一致的情况。如用户需要在策略中使用，应自行评估该数据的合理性。
-   港股通快照中bid\_grp和offer\_grp默认仅支持一档行情，自建行情需咨询券商。

<a id="参数-22"></a>

#### 参数

**`security`**

-   类型：`list[str]/str`

单只股票/港股通代码或多个股票/港股通代码组成的列表，必填字段

<a id="返回-25"></a>

#### 返回

`dict[str:dict[...]]`：

-   正常返回一个dict类型数据，包含每只股票/港股通代码的行情快照信息，key为股票/港股通代码，value为对应的快照信息

-   异常返回空dict，如{}

-   快照包含以下信息：

    -   amount:持仓量(str:int)(期货字段，股票/港股通返回0)；
    -   bid\_grp:委买档位(第一档包含委托队列(仅L2支持))(str:dict\[int:list\[float,int,int,{int:int,...}\],int:list\[float,int,int\]...\])；
    -   business\_amount:总成交量(str:int)；
    -   business\_amount\_in:内盘成交量(str:int)；
    -   business\_amount\_out:外盘成交量(str:int)；
    -   business\_balance:总成交额(str:float)；
    -   business\_count:成交笔数(str:int)
    -   circulation\_amount:流通股本(str:int)；
    -   current\_amount:最近成交量(现手)(str:int)；
    -   down\_px:跌停价格(str:float)；
    -   end\_trade\_date:最后交易日(str:str)
    -   entrust\_diff:委差(str:float)；
    -   entrust\_rate:委比(str:float)；
    -   high\_px:最高价(str:float)；
    -   hsTimeStamp:时间戳(str:float)；
    -   last\_px:最新成交价(str:float)；
    -   low\_px:最低价(str:float)；
    -   offer\_grp:委卖档位(第一档包含委托队列(仅L2支持))(str:dict\[int:list\[float,int,int,{int:int,...}\],int:list\[float,int,int\]...\])；
    -   open\_px:今开盘价(str:float)；
    -   pb\_rate:市净率(str:float)；
    -   pe\_rate:动态市盈率(str:float)；
    -   preclose\_px:昨收价(str:float)；
    -   prev\_settlement:昨结算(str:float)(期货字段，股票/港股通返回0)；
    -   px\_change\_rate:涨跌幅(str:float)；
    -   settlement:结算价(str:float)(期货字段，股票/港股通返回0)；
    -   start\_trade\_date:首个交易日(str:float)
    -   tick\_size:最小报价单位(str:float)
    -   total\_bidqty:委买量(str:int)；
    -   total\_offerqty:委卖量(str:int)；
    -   trade\_mins:交易分钟数(str:int)
    -   trade\_status:[交易状态](help-engine-e187e04d.md#trade_status)(str:str)；
    -   turnover\_ratio:换手率(str:float)；
    -   up\_px:涨停价格(str:float)；
    -   vol\_ratio:量比(str:float)；
    -   wavg\_px:加权平均价(str:float)；
    -   iopv:基金份额参考净值(str:float)；
-   字段备注:

    -   bid\_grp -- 委买档位，{'bid\_grp': {1: \[价格, 委托量,委托笔数,委托对列{}\], 2: \[价格, 委托量,委托笔数\], 3: \[价格, 委托量,委托笔数\], 4: \[价格, 委托量,委托笔数\], 5: \[价格, 委托量,委托笔数\]}} ；
    -   offer\_grp -- 委卖档位，{'offer\_grp': {1: \[价格, 委托量,委托笔数,委托对列{}\], 2: \[价格, 委托量,委托笔数\], 3: \[价格, 委托量,委托笔数\], 4: \[价格, 委托量,委托笔数\], 5: \[价格, 委托量,委托笔数\]}} ；
-   返回如下:


python

```python
# 实际返回示例（dict格式）
{
    '600570.XSHG': {
        'offer_grp': {
            1: [44.47, 3300, 0, {}],
            2: [44.48, 2800, 0],
            3: [44.49, 3900, 0],
            4: [44.5, 17300, 0],
            5: [44.51, 1600, 0]
        },
        'open_px': 44.91,
        'pe_rate': 4294573.83,
        'pb_rate': 11.42,
        'entrust_diff': -100.0,
        'entrust_rate': -0.2092,
        'total_bidqty': 18900,
        'preclose_px': 45.2,
        'business_amount_out': 2600706,
        'px_change_rate': -1.62,
        'turnover_ratio': 0.0042,
        'vol_ratio': 1.12,
        'hsTimeStamp': 20220622102358580,
        'amount': 0,
        'prev_settlement': 0.0,
        'circulation_amount': 1461560480,
        'low_px': 44.31,
        'down_px': 40.68,
        'bid_grp': {
            1: [44.45, 600, 0, {}],
            2: [44.44, 600, 0],
            3: [44.43, 8300, 0],
            4: [44.42, 9200, 0],
            5: [44.41, 200, 0]
        },
        'business_balance': 274847503.0,
        'business_amount': 6161800,
        'business_amount_in': 3561094,
        'last_px': 44.47,
        'total_offerqty': 28900,
        'up_px': 49.72,
        'wavg_px': 44.6,
        'high_px': 45.05,
        'trade_status': 'TRADE',
        'iopv': '0.0'
    }
}
```

<a id="示例-25"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 行情快照
    snapshot = get_snapshot(g.security)
    log.info(snapshot)
```

<a id="get_gear_price"></a>

### `get_gear_price`

<a id="中文名-26"></a>

#### 中文名

档位行情查询

<a id="接口说明-26"></a>

#### 接口说明

获取指定代码的档位行情价格，包括委买和委卖的五档价格和数量信息。

<a id="接口定义-26"></a>

#### 接口定义

python

```python
get_gear_price(sids)
```

<a id="使用场景-26"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   获取实时行情快照失败时返回档位内容为空dict({"bid\_grp": {}, "offer\_grp": {}})。
-   若无L2行情时，委托笔数字段返回0。
-   港股通快照中bid\_grp和offer\_grp默认仅支持一档行情，自建行情需咨询券商。

<a id="参数-23"></a>

#### 参数

**`sids`**

-   类型：`list[str]/str`

单只股票/港股通代码或多个股票/港股通代码组成的列表，必填字段

<a id="返回-26"></a>

#### 返回

**`dict[str:dict[int:list[float,int,int],...],...]`**

-   包含以下信息：
    -   bid\_grp: 委买档位(str:dict\[int:list\[float,int,int\],...\])
    -   offer\_grp: 委卖档位(str:dict\[int:list\[float,int,int\],...\])

python

```python
# 单只代码返回示例（dict格式）
{
    'bid_grp': {
        1: [价格, 委托量, 委托笔数],
        2: [价格, 委托量, 委托笔数],
        3: [价格, 委托量, 委托笔数],
        4: [价格, 委托量, 委托笔数],
        5: [价格, 委托量, 委托笔数]
    },
    'offer_grp': {
        1: [价格, 委托量, 委托笔数],
        2: [价格, 委托量, 委托笔数],
        3: [价格, 委托量, 委托笔数],
        4: [价格, 委托量, 委托笔数],
        5: [价格, 委托量, 委托笔数]
    }
}

# 多只代码返回示例（dict格式）
{
    代码: {
        'bid_grp': {
            1: [价格, 委托量, 委托笔数],
            2: [价格, 委托量, 委托笔数],
            3: [价格, 委托量, 委托笔数],
            4: [价格, 委托量, 委托笔数],
            5: [价格, 委托量, 委托笔数]
        },
        'offer_grp': {
            1: [价格, 委托量, 委托笔数],
            2: [价格, 委托量, 委托笔数],
            3: [价格, 委托量, 委托笔数],
            4: [价格, 委托量, 委托笔数],
            5: [价格, 委托量, 委托笔数]
        }
    }
}
```

<a id="示例-26"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    #获取600570.SS当前档位行情
    gear_price = get_gear_price('600570.XSHG')
    log.info(gear_price)
    #获取600571.SS当前档位行情
    gear_price = get_gear_price('600571.XSHG')
    log.info(gear_price)
```

<a id="get_sort_msg"></a>

### `get_sort_msg`

<a id="中文名-27"></a>

#### 中文名

获取板块、行业的快照信息

<a id="接口说明-27"></a>

#### 接口说明

该接口用于获取板块、行业的快照信息（可按指定字段进行排序展示）。

<a id="接口定义-27"></a>

#### 接口定义

python

```python
get_sort_msg(sort_type_grp=None, sort_field_name=None, sort_type=1, data_count=100)
```

<a id="使用场景-27"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   证监会行业、聚源行业、概念板块、地域板块所对应标的的行情数据为非标准的交易所下发数据，是由数据源自行按照成分股分类规则进行计算的，存在与三方数据源不一致的情况。如用户需要在策略中使用，应自行评估该数据的合理性。

<a id="参数-24"></a>

#### 参数

**`sort_type_grp`**

-   类型：`list[str]/str`
-   默认：`None`

板块或行业的代码，选填字段(暂时只支持XBHS.DY地域、XBHS.GN概念、XBHS.ZJHHY证监会行业、XBHS.ZS指数、XBHS.HY行业等)(本地化只支持查询单个板块)

**`sort_field_name`**

-   类型：`str`
-   默认：`None`

需要排序的字段，选填字段，支持：preclose\_px、open\_px、last\_px、high\_px、low\_px、wavg\_px、business\_amount、business\_balance、px\_change、amplitude、px\_change\_rate、circulation\_amount、total\_shares、market\_value、circulation\_value、vol\_ratio、rise\_count、fall\_count

**`sort_type`**

-   类型：`int`
-   默认：`1`

排序方式，0-升序，1-降序，选填字段

**`data_count`**

-   类型：`int`
-   默认：`100`

数据条数，最大为10000，选填字段

<a id="返回-27"></a>

#### 返回

`list[dict{str:str,...},...]`：

-   返回一个List列表，包含板块、行业代码的涨幅排名信息
-   每个代码的信息包含以下字段内容：
    -   prod\_code: 行业代码(str)
    -   prod\_name: 行业名称(str)
    -   hq\_type\_code: 行业板块代码(str)
    -   time\_stamp: 时间戳毫秒级(str:int)
    -   trade\_mins: 交易分钟数(str:int)
    -   trade\_status: [交易状态](help-engine-e187e04d.md#trade_status)(str)
    -   preclose\_px: 昨日收盘价(str:float)
    -   open\_px: 今日开盘价(str:float)
    -   last\_px: 最新价(str:float)
    -   high\_px: 最高价(str:float)
    -   low\_px: 最低价(str:float)
    -   wavg\_px: 加权平均价(str:float)
    -   business\_amount: 总成交量(str:int)
    -   business\_balance: 总成交额(str:int)
    -   px\_change: 涨跌额(str:float)
    -   amplitude: 振幅(str:int)
    -   px\_change\_rate: 涨跌幅(str:float)
    -   circulation\_amount: 流通股本(str:int)
    -   total\_shares: 总股本(str:int)
    -   market\_value: 市值(str:int)
    -   circulation\_value: 流通市值(str:int)
    -   vol\_ratio: 量比(str:float)；
    -   shares\_per\_hand: 每手股数(str:int)；
    -   rise\_count: 上涨家数(str:int)；
    -   fall\_count: 下跌家数(str:int)；
    -   member\_count: 成员个数(str:int)；
    -   rise\_first\_grp: 领涨股票(其包含以下五个字段)(str:list\[dict{str:int,str:str,str:str,str:float,str:float},...\])；
        -   prod\_code: 股票代码(str:str)；
        -   prod\_name: 证券名称(str:str)；
        -   hq\_type\_code: 类型代码(str:str)；
        -   last\_px: 最新价(str:float)；
        -   px\_change\_rate: 涨跌幅(str:float)(本地化不支持，返回为0)；
    -   fall\_first\_grp: 领跌股票(其包含以下五个字段)(str:list\[dict{str:int,str:str,str:str,str:float,str:float},...\])(本地化不支持，返回为空)；
        -   prod\_code: 股票代码(str:str)；
        -   prod\_name: 证券名称(str:str)；
        -   hq\_type\_code: 类型代码(str:str)；
        -   last\_px: 最新价(str:float)；
        -   px\_change\_rate: 涨跌幅(str:float)；

<a id="示例-27"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    #获取XBHS.DY板块按preclose_px字段排序的排名信息
    sort_data = get_sort_msg(sort_type_grp='XBHS.DY', sort_field_name='preclose_px', sort_type=1, data_count=100)
    log.info(sort_data)
    #获取sort_data排序第一条代码的数据
    sort_data_first = sort_data[0]
    log.info(sort_data_first)
```

<a id="get_trend_data"></a>

### `get_trend_data`

<a id="中文名-28"></a>

#### 中文名

获取集中竞价期间代码数据

<a id="接口说明-28"></a>

#### 接口说明

该接口用于获取集合竞价期间代码数据。

<a id="接口定义-28"></a>

#### 接口定义

python

```python
get_trend_data(date=None, stocks=None, market=None)
```

<a id="使用场景-28"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   不传参数时，默认返回当日所有市场的数据。
-   stocks和market不能同时入参。

<a id="参数-25"></a>

#### 参数

**`date`**

-   类型：`str`
-   默认：`None`

日期（格式：YYYYmmdd），选填字段

**`stocks`**

-   类型：`list[str]/str`
-   默认：`None`

股票/港股通代码，选填字段

**`market`**

-   类型：`list[str]/str`
-   默认：`None`

市场，选填字段

<a id="返回-28"></a>

#### 返回

`dict`：

-   返回一个dict类型数据，包含每只代码的信息
-   包含以下信息：
    -   time\_stamp: 时间戳(int)
    -   hq\_px: 价格(float)
    -   wavg\_px: 加权价格(float)
    -   business\_amount: 总成交量(int)
    -   business\_balance: 总成交额(int)
    -   amount: 持仓量(int)

<a id="示例-28"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    trend_data = get_trend_data(stocks='600570.SS')
    log.info(trend_data)
    trend_data = get_trend_data("20230308")
    log.info(trend_data['600570.SS'])
    trend_data = get_trend_data(market=["XSHG", "XSHE"])
    log.info(trend_data['600570.SS'])
```

<a id="check_limit"></a>

### `check_limit`

<a id="中文名-29"></a>

#### 中文名

涨跌停状态查询

<a id="接口说明-29"></a>

#### 接口说明

查询股票/港股通代码的涨跌停状态，返回股票/港股通的涨停、跌停或正常交易状态。

<a id="接口定义-29"></a>

#### 接口定义

python

```python
check_limit(security, query_date=None)
```

<a id="使用场景-29"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   入参的query\_date仅支持YYYYmmdd格式的传参，当query\_date入参为None或传入当日日期时，返回的结果是以实时最新价判断涨跌停状态；当query\_date入参为历史交易日期，则均以交易日收盘价判断涨跌停状态。
-   在交易场景下，建议在查询代码品种的交易时间范围内调用，否则可能会返回上一交易日数据。
-   港股通标的仅支持获取当日状态。

<a id="参数-26"></a>

#### 参数

**`security`**

-   类型： `list[str]/str`

单只股票/港股通代码或者多只股票/港股通代码组成的列表，必填字段

**`query_date`**

-   类型： `str`
-   默认： `None`

查询日期，查询指定日期股票代码的涨跌停状态，回测不传默认是回测当日时间，交易和研究不传默认是执行当日时间，选填字段

<a id="返回-29"></a>

#### 返回

`dict[str:int]`:

-   返回一个dict类型数据，包含每只股票/港股通代码的涨停状态。多只股票/港股通代码查询时其中部分股票/港股通代码查询异常则该代码返回既不涨停也不跌停状态0

-   涨跌停状态说明：

    -   2：触板涨停(已经是涨停价格，但还有卖盘)(仅支持交易研究查询当日)；
    -   1：涨停；
    -   0：既不涨停也不跌停；
    -   \-1：跌停；
    -   \-2：触板跌停(已经是跌停价格，但还有买盘)(仅支持交易研究查询当日)；

<a id="示例-29"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 代码涨跌停状态
    stock_flag = check_limit(g.security)[g.security]
    log.info(stock_flag)
```
