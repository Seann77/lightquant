---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 港股通查询类接口
section_path:
  - 港股通专用接口
  - 港股通查询类接口
source_file: api-docs/raw/ptrade/shenwan/13_api_hks.html
source_url: http://101.71.132.53:9091/qthelp/api/hks.html
source_anchor: "#港股通查询类接口"
source_sha256: a16cd446ed5f662114a8898cafdf17fa26137382cfde23364126b47984ec6b46
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="港股通专用接口"></a>

# 港股通专用接口

注意事项

1.  09:10分(市场初始化默认时间，自建行情需要询问券商)之前调用[get\_hks\_list](#get_hks_list)可能会取到历史数据。
2.  如果策略中频繁使用到[get\_hks\_price\_gap](#get_hks_price_gap)、 [get\_hks\_unit\_amount](#get_hks_unit_amount)数据，建议在策略中缓存到全局变量中。
3.  调用港股通专用接口时参数校验不通过/API内部执行报错将会raise并抛出报错信息( qtcommon.exception.ParamsError/RuntimeError)，需要在策略中做保护。

<a id="港股通查询类接口"></a>

## 港股通查询类接口

<a id="get_hks_list"></a>

### `get_hks_list`

<a id="中文名"></a>

#### 中文名

获取港股通代码表

<a id="接口说明"></a>

#### 接口说明

用于获取行情返回的港股通代码列表。

<a id="接口定义"></a>

#### 接口定义

python

```python
get_hks_list(market)
```

注意事项

1.  market仅支持XHKG-SS和XHKG-SZ两个市场，不支持获取其他市场代码。不入参时，默认返回沪港通和深港通的代码列表。
2.  为减小对行情服务压力，该函数在同一分钟内多次调用返回当前分钟首次查询的缓存数据。

<a id="使用场景"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数"></a>

#### 参数

**`market`**

-   类型：`str`

市场代码，仅支持`XHKG-SS`、`XHKG-SZ`、`XHKG-SS;XHKG-SZ`和`XHKG-SZ;XHKG-SS`，选填字段。

<a id="返回值"></a>

#### 返回值

`list`:

-   查询成功返回对应市场代码的港股通代码列表。
-   查询失败，返回空列表。

<a id="异常"></a>

#### 异常

-   qtcommon.exception.ParamsError：参数校验失败。
-   RuntimeError：API执行错误。

<a id="示例"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "02899.XHKG-SS"
    set_universe(g.security)


def before_trading_start(context, data):
    g.flag = False


def handle_data(context, data):
    if not g.flag:
        try:
            g.hks_list = get_hks_list("XHKG-SS;XHKG-SZ")
            log.info("港股通代码表为：{}".format(g.hks_list))
        except BaseException as e:
            g.hks_list = []
            log.error("获取港股通代码表失败，错误信息为：{}".format(e))
        g.flag = True
```

<a id="get_hks_price_gap"></a>

### `get_hks_price_gap`

<a id="中文名-1"></a>

#### 中文名

获取港股通价差信息

<a id="接口说明-1"></a>

#### 接口说明

港股不同价格代码的最小价格变动幅度是不同的，该接口用于获取港股通代码的价差信息。

<a id="接口定义-1"></a>

#### 接口定义

python

```python
get_hks_price_gap(market)
```

注意事项

1.  market仅支持XHKG-SS和XHKG-SZ两个市场，不支持获取其他市场代码。
2.  为减小对柜台压力，该函数在同一分钟内多次调用且入参相同时返回当前分钟首次查询的缓存数据。

<a id="使用场景-1"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-1"></a>

#### 参数

**`market`**

-   类型：`str`

市场代码，仅支持`XHKG-SS`和`XHKG-SZ`，必填字段。

<a id="返回值-1"></a>

#### 返回值

`list`:

-   查询成功返回对应市场代码的港股通价差信息列表，列表中每个元素包含的字段如下：

    | 字段名 | 类型 | 说明 |
    | --- | --- | --- |
    | `begin_price` | `float` | 分段起始价格 |
    | `end_price` | `float` | 分段结束价格 |
    | `step_price` | `float` | 最小价差 |

-   查询失败，返回空列表。

<a id="异常-1"></a>

#### 异常

-   qtcommon.exception.ParamsError：参数校验失败。
-   RuntimeError：API执行错误。

<a id="示例-1"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "02899.XHKG-SS"
    set_universe(g.security)


def before_trading_start(context, data):
    g.flag = False


def handle_data(context, data):
    if not g.flag:
        try:
            g.hks_price_gap = {"XHKG-SS": get_hks_price_gap("XHKG-SS"), "XHKG-SZ": get_hks_price_gap("XHKG-SZ")}
            log.info("港股通价差信息为：{}".format(g.hks_price_gap))
        except BaseException as e:
            g.hks_price_gap = {"XHKG-SS": [], "XHKG-SZ": []}
            log.error("获取港股通价差信息失败，错误信息为：{}".format(e))
        g.flag = True
```

<a id="get_hks_unit_amount"></a>

### `get_hks_unit_amount`

<a id="中文名-2"></a>

#### 中文名

获取港股通委托单位数量

<a id="接口说明-2"></a>

#### 接口说明

港股通每个标的的最小交易单位不同，交易前需要调用该接口查询获取。

<a id="接口定义-2"></a>

#### 接口定义

python

```python
get_hks_unit_amount(security, entrust_prop)
```

<a id="使用场景-2"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-2"></a>

#### 参数

**`security`**

-   类型：`str`

港股通标的代码，必填字段。

**`entrust_prop`**

-   类型：`str`

[委托属性](help-engine-e187e04d.md#entrust_prop)，仅支持`HKN`和`HKO`，必填字段。

<a id="返回值-2"></a>

#### 返回值

`dict`:

-   查询成功返回对应港股通标的代码的交易单位信息，字典中包含的字段如下：

    | 字段名 | 类型 | 说明 |
    | --- | --- | --- |
    | `buy_unit` | `int` | 买入单位数量 |
    | `sell_unit` | `int` | 卖出单位数量 |

-   查询失败，返回空字典。

<a id="异常-2"></a>

#### 异常

-   qtcommon.exception.ParamsError：参数校验失败。
-   RuntimeError：API执行错误。

<a id="示例-2"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "02899.XHKG-SS"
    set_universe(g.security)


def before_trading_start(context, data):
    g.flag = False
    g.hks_unit_amount = {}


def handle_data(context, data):
    if not g.flag:
        try:
            for security in get_hks_list("XHKG-SS;XHKG-SZ"):
                g.hks_unit_amount[security] = get_hks_unit_amount(security, "HKN")
            log.info("港股通委托单位数量信息为：{}".format(g.hks_unit_amount))
        except BaseException as e:
            log.error("获取港股通委托单位数量信息失败，错误信息为：{}".format(e))
        g.flag = True
```

<a id="get_hks_enable_amount"></a>

### `get_hks_enable_amount`

<a id="中文名-3"></a>

#### 中文名

获取港股通大约可买数量

<a id="接口说明-3"></a>

#### 接口说明

调用该接口获取当前账户港股通标的代码大约可买数量。

<a id="接口定义-3"></a>

#### 接口定义

python

```python
get_hks_enable_amount(security, entrust_price, entrust_prop)
```

<a id="使用场景-3"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-3"></a>

#### 参数

**`security`**

-   类型：`str`

港股通标的代码，必填字段。

**`entrust_price`**

-   类型：`float`

委托价格，必须大于0，必填字段。

**`entrust_prop`**

-   类型：`str`

[委托属性](help-engine-e187e04d.md#entrust_prop)，仅支持`HKN`和`HKO`，必填字段。

<a id="返回值-3"></a>

#### 返回值

`int`:

-   查询成功返回对应港股通标的代码的可买数量。
-   查询失败，返回`0`。

<a id="异常-3"></a>

#### 异常

-   qtcommon.exception.ParamsError：参数校验失败。
-   RuntimeError：API执行错误。

<a id="示例-3"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "02899.XHKG-SS"
    set_universe(g.security)


def before_trading_start(context, data):
    g.flag = False


def handle_data(context, data):
    if not g.flag:
        try:
            last_price = get_snapshot(g.security).get(g.security, {}).get("last_px", 0)
            if last_price > 0:
                hks_enable_amount = get_hks_enable_amount(g.security, last_price, "HKN")
                log.info("港股通代码 {} 可买数量为：{}".format(g.security, hks_enable_amount))
        except BaseException as e:
            log.error("获取港股通代码 {} 可买数量失败，错误信息为：{}".format(g.security, e))
        g.flag = True
```

<a id="get_kline_by_range"></a>

### `get_kline_by_range`

<a id="中文名-4"></a>

#### 中文名

按时间范围获取港股通K线

<a id="接口说明-4"></a>

#### 接口说明

该接口用于获取指定日期范围内的K线数据，仅支持港股通代码

<a id="接口定义-4"></a>

#### 接口定义

python

```python
get_kline_by_range(security_list, frequency, start_time, end_time=None, field=None)
```

注意事项

-   当查询日线数据时，start\_time和end\_time请传入年月日（长度为8）的字符串，当查询分钟线数据时，start\_time和end\_time请传入年月日小时分钟（长度为12）的字符串；

-   针对停牌场景，我们没有跳过停牌的日期，无论对单只股票还是多只股票进行调用，停牌时使用停牌前的价格填充，成交量、成交额为0，日K线可使用成交量为0的逻辑进行停牌日过滤。

-   该接口只能获取2025年后开始的数据。（需券商本地存在该段时间的数据）

-   该接口与get\_kline\_by\_offset接口不支持多线程同时调用，即在run\_daily或run\_interval等函数中不要与handle\_data等框架模块同一时刻调用get\_kline\_by\_range或get\_kline\_by\_offset接口，否则会偶现获异常raise的现象。

-   当日实时数据只有在9:30分之后才能获取到（不包含9:30分），请注意取数时间。


<a id="使用场景-4"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-4"></a>

#### 参数

**`security_list`**

-   类型： `list[str]`

港股通代码列表,必须传入list，支持单只或多只代码，必填字段

**`frequency`**

-   类型： `str`

单位时间长度，仅支持1分钟线(1m)、5分钟线(5m)、15分钟线(15m)、30分钟线(30m)、60分钟线(60m)、120分钟线(120m)、日线(1d)，必填字段

**`start_time`**

-   类型： `str`

开始时间，输入请小于当前日期，且均小于等于end\_date的时间。查询日线数据仅支持（YYYYmmdd），如'20250901'; 查询分钟线数据仅支持（YYYYmmddHHMM）'202506011000'，必填字段

**`end_time`**

-   类型： `str|None`
-   默认值： `str`

结束时间，输入请小于等于当前日期。查询日线数据仅支持（YYYYmmdd），如'20250901'; 查询分钟线数据仅支持（YYYYmmddHHMM）'202506011000'，不传时默认取引擎的时间（例如框架函数handle\_data在9:31分触发，而写在handle\_data中的该函数直到9:32分才调用，此时引擎时间还是9:31）;选填字段

**`field`**

-   类型： `list[str]|None`
-   默认值： `None`

数据结果集中所支持输出字段，选填字段,当frequency为'1d'时，默认为\['open','high','low','close','volume','money','price','is\_open','preclose','high\_limit','low\_limit'\],当frequency不为'1d'时，默认为\['open','high','low','close','volume','money','price'\]

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

<a id="返回值-4"></a>

#### 返回值

`dict`:

1.  正常获取到数据后,会返回一个dict，其中key是代码，value是获取到代码的K线数据，如下：

python

```python
dict{股票代码(str): array([日期时间(numpy.int64), 开盘价(numpy.float64), 最高价(numpy.float64), 最低价(numpy.float64), 收盘价(numpy.float64), 成交量(numpy.float64), 成交额(numpy.float64), 最新价(numpy.float64)])}

dict{'00001.XHKG-SZ': array([(202509171610, 52.15, 52.4 , 52.15, 52.25, 1824129., 9.54154380e+07, 52.25),...])}
```

1.  当获取不到某只代码的情况下，代码的值返回的是空的数据(请对空数据做好保护)，如下：

python

```python
dict{股票代码(str): array([])}

dict{'00001.XHKG-SZ': array([])}
```

1.  当数据异常，或函数处理异常的时候，该函数会raise异常，请调用该函数的时候做好保护。

<a id="示例-4"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ["00001.XHKG-SZ", "00001.XHKG-SS"]
    set_universe(g.security)

def handle_data(context, data):
    # 获得"00001.XHKG-SZ", "00001.XHKG-SS"的数据
    kline_data = get_kline_by_range(g.stock_list, "1m", "202509110930")
    log.info(kline_data)
    log.info("获取到00001.XHKG-SZ数据一共 {} 条".format(len(kline_data[g.stock_list[0]])))
```

<a id="get_kline_by_offset"></a>

### `get_kline_by_offset`

<a id="中文名-5"></a>

#### 中文名

按根数偏移获取港股通K线

<a id="接口说明-5"></a>

#### 接口说明

该接口用于获取根数偏移的K线数据，仅支持港股通代码

<a id="接口定义-5"></a>

#### 接口定义

python

```python
get_kline_by_offset(security_list, frequency, count, field=None, include=False, query_time=None)
```

注意事项

-   当入参query\_time时，query\_time请传入年月日小时分钟（长度为12）的字符串；

-   针对停牌场景，我们没有跳过停牌的日期，无论对单只股票还是多只股票进行调用，停牌时使用停牌前的价格填充，成交量、成交额为0，日K线可使用成交量为0的逻辑进行停牌日过滤。

-   该接口只能获取2025年后开始的数据。（需券商本地存在该段时间的数据）

-   该接口与get\_kline\_by\_range接口不支持多线程同时调用，即在run\_daily或run\_interval等函数中不要与handle\_data等框架模块同一时刻调用get\_kline\_by\_range或get\_kline\_by\_offset接口，否则会偶现获异常raise的现象。

-   当日实时数据只有在9:30分之后才能获取到（不包含9:30分），请注意取数时间。


<a id="使用场景-5"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-5"></a>

#### 参数

**`security_list`**

-   类型： `list[str]`

港股通代码列表,必须传入list，支持单只或多只代码，必填字段

**`frequency`**

-   类型： `str`

单位时间长度，仅支持1分钟线(1m)、5分钟线(5m)、15分钟线(15m)、30分钟线(30m)、60分钟线(60m)、120分钟线(120m)、日线(1d)，周线(1w)、月线(mo)、季度线(1q)和年线(1y),必填字段

**`count`**

-   类型： `int`

K线数量，大于0，返回指定数量的K线行情，必填字段

**`field`**

-   类型： `list[str]|None`
-   默认值： `None`

数据结果集中所支持输出字段，选填字段,当frequency为'1d'时，默认为\['open','high','low','close','volume','money','price','is\_open','preclose','high\_limit','low\_limit'\],当frequency不为'1d'时，默认为\['open','high','low','close','volume','money','price'\]

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

**`include`**

-   类型： `bool`
-   默认值： `False`

是否包含查询周期的数据，True -包含，False-不包含，选填字段

**`query_time`**

-   类型： `str|None`
-   默认值： `str`

结束时间，输入请小于等于当前日期。仅支持（YYYYmmddHHMM）'202506011000'，不传时默认取引擎的时间（例如框架函数handle\_data在9:31分触发，而写在handle\_data中的该函数直到9:32分才调用，此时引擎时间还是9:31）;选填字段

<a id="返回值-5"></a>

#### 返回值

`dict`:

1.  正常获取到数据后,会返回一个dict，其中key是代码，value是获取到代码的K线数据，如下：

python

```python
dict{股票代码(str): array([日期时间(numpy.int64), 开盘价(numpy.float64), 最高价(numpy.float64), 最低价(numpy.float64), 收盘价(numpy.float64), 成交量(numpy.float64), 成交额(numpy.float64), 最新价(numpy.float64)])}

dict{'00001.XHKG-SZ': array([(202509171610, 52.15, 52.4 , 52.15, 52.25, 1824129., 9.54154380e+07, 52.25),...])}
```

1.  当获取不到某只代码的情况下，代码的值返回的是空的数据(请对空数据做好保护)，如下：

python

```python
dict{股票代码(str): array([])}

dict{'00001.XHKG-SZ': array([])}
```

1.  当数据异常，或函数处理异常的时候，该函数会raise异常，请调用该函数的时候做好保护。

<a id="示例-5"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ["00001.XHKG-SZ", "00001.XHKG-SS"]
    set_universe(g.security)

def handle_data(context, data):
    # 获得"00001.XHKG-SZ"和"00001.XHKG-SS"的天数据
    kline_data = get_kline_by_range(g.stock_list, "1m", "202509110930")
    log.info(kline_data)
    log.info("获取到00001.XHKG-SZ数据一共 %s 条" % len(kline_data[g.stock_list[0]]))
```
