---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: market_data
title: 交易日期接口
section_path:
  - 数据接口
  - 交易日期接口
source_file: api-docs/raw/ptrade/shenwan/08_api_data.html
source_url: http://101.71.132.53:9091/qthelp/api/data.html
source_anchor: "#交易日期接口"
source_sha256: f3ab9ba25e36fa781998eb70f34588f59350edf1682aa3d8402bc435e3042b1e
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="数据接口"></a>

# 数据接口

<a id="交易日期接口"></a>

## 交易日期接口

<a id="get_trading_day"></a>

### `get_trading_day`

<a id="中文名"></a>

#### 中文名

获取市场获取交易日期列表

<a id="接口说明"></a>

#### 接口说明

该接口用于获取当前时间数天前或数天后的交易日期。

<a id="接口定义"></a>

#### 接口定义

python

```python
get_trading_day(day=0)
```

<a id="使用场景"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   默认情况下，回测中当前时间为策略中调用该接口的回测日日期(context.blotter.current\_dt)。
-   默认情况下，研究和交易中当前时间为调用当天日期。
-   day为正数表示数天后，负数为数天前，0为当前交易日（若为非交易日则返回上一交易日）。
-   不建议获取交易所还未公布的交易日期。

<a id="参数"></a>

#### 参数

**`day`**

-   类型： `int`
-   默认值： `0`

表示天数，正的为数天后，负的为数天前，0为当前交易日。

<a id="返回"></a>

#### 返回

`datetime.date`：

-   返回交易日的日期对象。

<a id="示例"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    # 获取后一天的交易日期
    next_trading_date = get_trading_day(1)
    log.info(next_trading_date)
    # 获取前一天的交易日期
    previous_trading_date = get_trading_day(-1)
    log.info(previous_trading_date)
```

<a id="get_all_trades_days"></a>

### `get_all_trades_days`

<a id="中文名-1"></a>

#### 中文名

获取全部交易日期

<a id="接口说明-1"></a>

#### 接口说明

获取指定日期之前的所有历史交易日数据，可用于交易日历查询和策略回测。

<a id="接口定义-1"></a>

#### 接口定义

python

```python
get_all_trades_days(date=None)
```

<a id="使用场景-1"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   默认情况下，回测中 date 为策略中调用该接口的回测日日期(context.blotter.current\_dt)。
-   默认情况下，研究和交易中 date 为调用当天日期。
-   该接口返回的最早的交易日日期为："2005-01-04"。

<a id="参数-1"></a>

#### 参数

**`date`**

-   类型： `str`
-   默认： `None`

查询截止日期，格式如'2016-02-13' 或 '20160213'，选填字段，不填则为当前日期。

<a id="返回-1"></a>

#### 返回

`numpy.ndarray`：

-   返回包含所有交易日的数组。

<a id="示例-1"></a>

#### 示例

python

```python
def initialize(context):
    # 获取当前回测日期之前的所有交易日
    all_trades_days = get_all_trades_days()
    log.info(all_trades_days)
    all_trades_days_date = get_all_trades_days('20150312')
    log.info(all_trades_days_date)
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    pass
```

<a id="get_trade_days"></a>

### `get_trade_days`

<a id="中文名-2"></a>

#### 中文名

获取指定范围交易日期

<a id="接口说明-2"></a>

#### 接口说明

该接口用于获取指定范围交易日期。

<a id="接口定义-2"></a>

#### 接口定义

python

```python
get_trade_days(start_date=None, end_date=None, count=None)
```

<a id="使用场景-2"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   默认情况下，回测中 end\_date 为策略中调用该接口的回测日日期(context.blotter.current\_dt)。
-   默认情况下，研究和交易中 end\_date 为调用当天日期。

<a id="参数-2"></a>

#### 参数

**`start_date`**

-   类型： `str`
-   默认： `None`

开始日期，与 count 二选一，不可同时使用。如 '2016-02-13' 或 '20160213'，开始日期最早不超过1990年。

**`end_date`**

-   类型： `str`
-   默认： `None`

结束日期，如 '2016-02-13' 或 '20160213'。如果输入的结束日期大于今年则至多返回截止到今年的数据。

**`count`**

-   类型： `int`
-   默认： `None`

数量，与 start\_date 二选一，不可同时使用，必须大于0。表示获取 end\_date 往前的 count 个交易日，包含 end\_date 当天。建议不大于3000，即返回数据的开始日期不早于1990年。

<a id="返回-2"></a>

#### 返回

`numpy.ndarray`：

-   返回包含指定范围交易日的数组

<a id="示例-2"></a>

#### 示例

python

```python
def initialize(context):
    # 获取指定范围内交易日
    trade_days = get_trade_days('2016-01-01', '2016-02-01')
    log.info(trade_days)
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    # 获取回测日期往前10天的所有交易日，包含历史回测日期
    trading_days = get_trade_days(count=10)
    log.info(trading_days)
```

<a id="get_trading_day_by_date"></a>

### `get_trading_day_by_date`

<a id="中文名-3"></a>

#### 中文名

按日期获取指定交易日

<a id="接口说明-3"></a>

#### 接口说明

该接口用于根据输入日期获取指定的交易日。

<a id="接口定义-3"></a>

#### 接口定义

python

```python
get_trading_day_by_date(query_date, day=0)
```

<a id="使用场景-3"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   主要使用场景：按固定自然日调仓。

<a id="参数-3"></a>

#### 参数

**`query_date`**

-   类型： `str`

查询日期，如 "20230213"，必填字段

**`day`**

-   类型： `int`
-   默认值： `0`

表示天数，正的为数天后，负的为数天前，0为当前交易日（若为非交易日则返回下一个交易日），选填字段

<a id="返回-3"></a>

#### 返回

`str`：

-   返回交易日日期字符串

<a id="示例-3"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    current_date = context.blotter.current_dt.strftime('%Y-%m-%d')
    trading_date = get_trading_day_by_date("20230501", 0)
    if trading_date == current_date:
        log.info("今日是5月1日之后首个交易日")
```
