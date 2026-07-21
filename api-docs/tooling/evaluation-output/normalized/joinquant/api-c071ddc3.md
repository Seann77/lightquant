---
platform: joinquant
variant: web-help
source_role: primary
document_type: strategy_api
title: 策略程序架构♠
section_path:
  - API新
  - 策略程序架构♠
source_file: api-docs/raw/joinquant/api/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=api
source_anchor: "#策略程序架构♠"
source_sha256: 4d5305bb8f4c82791a0c9580f48d8748462d017c0b7095a0a51ad5737ad433ba
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="策略程序架构♠"></a>

## 策略程序架构♠

<a id="initialize"></a>

### initialize

**初始化函数**

```python
initialize(context)
```

初始化方法，在整个回测、模拟中最开始执行一次，用于初始一些全局变量

**参数** context: [Context](api--api--814c0653.md#Context)对象, 存放有当前的账户/股票持仓信息

**注意** 该函数只在开始模拟交易的时候运行一次, 直接替换/修改代码导致的初始化函数变动并不会在模拟盘中生效 , 应该使用after\_code\_changed等函数

**返回** None

**示例**

```python
def initialize(context):
    # g为全局变量
    g.security = "000001.XSHE"
```

### run\_daily/run\_weekly/run\_monthly

**定时运行策略(可选)**

-   run\_monthly
-   run\_weekly
-   run\_daily

```python
def initialize(context):
    ## func是您自己定义的函数
    # 按月运行
    run_monthly(func, monthday, time='9:30', reference_security, force=False)
    # 按周运行
    run_weekly(func, weekday, time='9:30', reference_security, force=False)
    # 每天内何时运行(没有force属性)
    run_daily(func, time='9:30', reference_security)
```

**回测环境/模拟专用API**

指定每月, 每周或者每天要运行的函数, 可以在具体每月/周的第几个交易日(或者倒数第几天)的某一分钟执行。

在日级模拟中使用时，如果设置time='9:30'，策略的实际运行时间是9:27~9:30之间。策略内获取到逻辑时间(context.current\_dt)仍然是 9:30。 注意只有在使用相同的参照标的时，定时运行函数的优先级别为:run\_monthly>run\_weekly>run\_daily且与函数被注册的顺序无关；handle\_data与handle\_tick的执行顺序与前述函数无关。用户策略不应该依赖于这些计划任务执行的顺序。

**调用这些函数后, handle\_data可以不实现**

**参数**

| 参数 | 解释 |
| --- | --- |
| func | 一个自定义的函数, 此函数必须接受context参数;例如自定义函数名market\_open(context) |
| force | run\_weekly和run\_monthly中使用，**run\_daily不可使用**；表示若注册回调函数的时间晚于第一次回调的执行时间是否就近执行；默认为True，**建议使用False** |
| monthday | 每月的第几个交易日, 可以是负数, 表示倒数第几个交易日。开始策略的那个月会运行的，开始这个月第几个交易日不是从当月第一天开始算的，而是从开始运行当天开始算的（举例说明：假设您策略是3月20号开始运行的，3月1号和3月20都是交易日，系统会认为3月20是3月的第一个交易日，4月不会受影响的）。force=True时如果超出每月总交易日个数，则取临近的交易日执行。force=False,若注册回调函数的时间晚于第一次回调的执行时间不会就近执行。（具体见下方注意中的示例） |
| weekday | 每周的第几个交易日, 可以是负数, 表示倒数第几个交易日。开始策略的那一周第一个交易日是从策略开始的那一天 计算的。force=True如果超出每周总交易日个数，则取临近的交易日执行；force=False,若注册回调函数的时间晚于第一次回调的执行时间不会就近执行。（具体见下方注意中的示例） |
| time | 具体执行时间,一个字符串格式的时间,有三种方式：(1) 24小时内的任意时间，例如"10:00", "01:00"；在tick频率的策略中，可以精确到秒。指定为具体时间时，不可设置reference\_security参数 (2)time="every\_bar",只能在 run\_daily 中调用,运行时间和您设置的频率(回测页面右上方设置)一致，按天会在交易日的开盘时调用一次，按分钟会在交易时间每分钟运行, tick级别不支持设置为every\_bar 。(3) 'open' 或 'open+5m'或'open-10m' 这种形式，代表在reference\_security对应标的开盘时间(或加减X分钟)运行一次，一般用于期货，因为期货有夜盘，开盘时间点不定。 |
| reference\_security | 时间的参照标的代码，字符串类型，默认为‘000001.XSHG’。 如参照 '000001.XSHG'，交易时间为 9:30-15:00；如参照'IF9999.CCFX'，2016-01-01之后的交易时间为 9:30-15:00，在此之前为 9:15-15:15；如参照'A9999.XDCE'，因为有夜盘，因此开始时间为21:00，结束时间为15:00。期货策略一定要修改参考标的，建议修改为对应的主力合约。当time为具体时间时请勿设置此参数 |

**返回值** None

**注意**

-   **一个策略中尽量不要同时使用run\_daily和handle\_data，更不能使用run\_daily(handle\_data, "xx:xx")**
-   建议使用run\_daily；
-   [【API解析】策略运行频率（附隔固定时间运行方法）](https://www.joinquant.com/view/community/detail/6797d703ee45325b51079374439b1ca5)
-   run\_daily中的函数只能有一个参数context，具体示例如下：

```python
def initialize(context):
    run_daily(func, time='10:00')

def func(context):
    parm1 = 'JoinQuant'
    func1(context, parm1)

def func1(context, parm1):
    print(parm1)
    print(context.current_dt)
    print('-'*50)
```

-   **参数 func 必须是一个全局的函数, 不能是类的成员函数**, 示例:

```python
def on_week_start(context):
    pass

class MyObject(object):
    def on_week_start2(self, context):
        pass

def initialize(context):
    # OK
    run_weekly(on_week_start, 1)
    # 错误, 下面的语句会报错
    run_weekly(MyObject().on_week_start2, 1)
```

-   通过[history](api--api--814c0653.md#history)/[attribute\_history](api--api--814c0653.md#attribute_history)取天数据时, **是不包括当天的数据的**(即使在15:00和after\_close里面也是如此), 要取得当天数据, 只能取分钟的
-   这些函数可以**重复调用**, 比如下面的代码可以在每周的第一个交易日和最后一个交易日分别调用两个函数:

```python
def on_week_start(context):
    pass
def on_week_end(context):
    pass
def initialize(context):
    run_weekly(on_week_start, 1)
    run_weekly(on_week_end, -1)
```

-   每次调用这些函数都会产生一个新的定时任务, 如果想修改或者删除旧的定时任务, 请先调用 [unschedule\_all](#unschedule_all) 来删除所有定时任务, 然后再添加新的.

-   在一月/一周交易日数不够以致于monthday/weekday无法满足时, 我们会找这周内最近的一个日期来执行, 比如, 如果某一周只有4个交易日:

    -   若 weekday == 5, 我们会在第4个交易日执行
    -   若 weekday == -5, 我们会在第1个交易日执行

    如果要避免这样的行为, 您可以这样做:


```python
def initialize(context):
    run_weekly(weekly, 1)

def weekly(context):
    if context.current_dt.isoweekday() != 1:
        # 不在周一, 跳过执行
        return
```

**示例**

```python
def initialize(context):
    run_weekly(market_open, weekday=2, force=False)

def market_open(context):
    print("今天是周内第二个交易日") #注意策略开始的那一周,第一个交易日是按策略开始的日期开始计算的
```

```python
def weekly(context):
    print('weekly %s %s' % (context.current_dt, context.current_dt.isoweekday()))


def monthly(context):
    print('monthly %s %s' % (context.current_dt, context.current_dt.month))


def daily(context):
    print('daily %s' % context.current_dt)


def initialize(context):

    # 指定每月第一个交易日, 在开盘后十分钟执行
    # 注意策略开始的那一月,第一个交易日是按策略开始的日期开始计算的
    run_monthly(monthly, 1, '09:40')

    # 指定每周倒数第一个交易日, 在开盘前执行
    run_weekly(weekly, -1, '9:00')

    # 指定每天收盘前10分钟运行
    run_daily(daily, '14:50')

    # 指定每天收盘后执行
    run_daily(daily, '15:30')

    # 指定在每天的10:00运行
    run_daily(daily, '10:00')

    # 指定在每天的01:00运行
    run_daily(daily, '01:00')

    # 参照股指期货的时间每分钟运行一次, 必须选择分钟回测, 否则每天执行
    run_daily(daily, 'every_bar', reference_security='IF9999.CCFX')
```

<a id="handle_data"></a>

### handle\_data

**运行策略(可选)**

```python
handle_data(context, data)
```

该函数每个单位时间会调用一次, 如果按天回测,则每天调用一次,如果按分钟,则每分钟调用一次 ,tick频率不支持这个函数。

**该函数依据的时间是股票的交易时间，即 9:30 - 15:00. 期货请使用[定时运行](https://www.joinquant.com/help/api/help?name=api#task_func)函数。**

该函数在回测中的非交易日是不会触发的（如回测结束日期为2016年1月5日，则程序在2016年1月1日-3日时，handle\_data不会运行，4日继续运行）。

对于使用当日开盘价撮合的日级模拟盘，在9:25集合竞价完成时就可以获取到开盘价，出于减少并发运行模拟盘数量的目的，我们会提前到9:27~9:30之间运行, 策略内获取到逻辑时间(context.current\_dt)仍然是 9:30。

**参数** context: [Context](api--api--814c0653.md#Context)对象, 存放有当前的账户/标的持仓信息 data: 一个字典(dict), key是股票代码, value是当时的[SecurityUnitData](api--api--814c0653.md#SecurityUnitData) 对象. 存放前一个单位时间(按天回测, 是前一天, 按分钟回测, 则是前一分钟) 的数据. **注意**:

-   为了加速, data 里面的数据是按需获取的, 每次 handle\_data 被调用时, data 是空的 dict, 当你使用 `data[security]` 时该 security 的数据才会被获取.
-   data 只在这一个时间点有效, 请不要存起来到下一个 handle\_data 再用
-   注意, 要获取回测当天的开盘价/是否停牌/涨跌停价, 请使用 [get\_current\_data](https://www.joinquant.com/help/api/help?name=api#get_current_data)

**返回**
None

**示例**

```python
def handle_data(context, data):
    order("000001.XSHE",100)
```

<a id="on_event"></a>

### on\_event

**事件回调(可选)**

```python
on_event(context, event)
```

用户在策略中定义on\_event，在账户中持仓的标的发生对应的事件时on\_event会被调用。建议用户使用isinstance对事件类型进行判断。 目前已支持的事件有：

-   DividendsEvent：分红送股事件
-   ForcedLiquidationEvent：强行平仓事件

**参数**

-   context: [Context](api--api--814c0653.md#Context)对象, 存放有当前的账户/标的持仓信息
-   event: 发生的事件，一个事件对象。详见[事件对象](api--api--814c0653.md#Event)

**返回**
None

<a id="before_trading_start"></a>

### before\_trading\_start

**开盘前运行策略(可选)**

```python
before_trading_start(context)
```

该函数会在每天开始交易前被调用一次, 您可以在这里添加一些每天都要初始化的东西.

**该函数依据的时间是股票的交易时间，即该函数启动时间为'09:00'. 期货请使用[定时运行](https://www.joinquant.com/help/api/help?name=api#task_func)函数，time 参数设定为'08:30' 。**

**参数** context: [Context](api--api--814c0653.md#Context)对象, 存放有当前的账户/股票持仓信息

**返回** None

**示例**

```python
def before_trading_start(context):
    log.info(str(context.current_dt))
```

<a id="after_trading_end"></a>

### after\_trading\_end

**收盘后运行策略(可选)**

```python
after_trading_end(context)
```

该函数会在每天结束交易后被调用一次, 您可以在这里添加一些每天收盘后要执行的内容. 这个时候所有未完成的订单已经取消.

**该函数依据的时间是股票的交易时间，即该函数启动时间为 15:30. 期货请使用[定时运行](https://www.joinquant.com/help/api/help?name=api#task_func)函数，time 参数设定为'15:30' 。**

**参数** context: [Context](api--api--814c0653.md#Context)对象, 存放有当前的账户/股票持仓信息

**返回** None

**示例**

```python
def after_trading_end(context):
    log.info(str(context.current_dt))
```

<a id="on_strategy_end"></a>

### on\_strategy\_end

**策略运行结束时调用(可选)**

```python
def on_strategy_end(context)
```

在回测、模拟交易正常结束时被调用， 失败时不会被调用。

在模拟交易到期结束时也会被调用， 手动在到期前关闭不会被调用。

**参数** context: [Context](api--api--814c0653.md#Context)对象, 存放有当前的账户/股票持仓信息

**返回** None

**示例**

```python
def on_strategy_end(context):
    print('回测结束')
```

<a id="process_initialize"></a>

### process\_initialize

**每次程序启动时运行函数(可选)**

```python
process_initialize(context)
```

该函数会在每次模拟盘/回测进程重启时执行, 一般用来初始化一些**不能持久化保存**的内容. 在 [initialize](#initialize) 后执行.

因为模拟盘会每天重启(只在注册的定时运行时间点才会启动,任务结束后进程关闭), 所以这个函数会每天都执行.

**参数** context: [Context](api--api--814c0653.md#Context)对象, 存放有当前的账户/股票持仓信息

**返回** None

**示例**

```python
def process_initialize(context):
    # query 对象不能被 pickle 序列化, 所以不能持久保存, 所以每次进程重启时都给它初始化
    # 以两个下划线开始, 系统序列化 [g](#g) 时就会自动忽略这个变量, 更多信息, 请看 [g](#g) 和 [模拟盘注意事项](#simulation_matters)
    g.__q = query(valuation)

def handle_data(context, data):
    get_fundamentals(g.__q)
```

<a id="after_code_changed"></a>

### after\_code\_changed

**模拟交易更换代码后运行函数(可选)**

```python
after_code_changed(context)
```

模拟盘在每天的交易时间结束后会休眠，第二天开盘时会恢复，如果在恢复时发现代码已经发生了修改，则会在恢复时执行这个函数。 具体的使用场景：可以利用这个函数修改一些模拟盘的数据。

注意: 因为一些原因, 执行回测时这个函数也会被执行一次, 在 [process\_initialize](#process_initialize) 执行之前执行.

**参数** context: [Context](api--api--814c0653.md#Context)对象, 存放有当前的账户/股票持仓信息

**返回** None

**示例**

```python
def after_code_changed(context):
    g.stock = '000001.XSHE'
```

<a id="unschedule_all"></a>

### unschedule\_all

**取消所有定时运行(可选)**

```python
# 取消所有定时运行
unschedule_all()
```

**示例**

```python
def after_code_changed(context):
    # 取消所有定时运行
    unschedule_all()
    # 设定新的定时运行函数，指定函数在每天的10:00运行
    run_daily(func, '10:00')
```
