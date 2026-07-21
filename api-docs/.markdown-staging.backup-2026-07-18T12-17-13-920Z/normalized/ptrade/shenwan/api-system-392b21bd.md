---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 定时周期性接口
section_path:
  - 系统接口
  - 定时周期性接口
source_file: api-docs/raw/ptrade/shenwan/07_api_system.html
source_url: http://101.71.132.53:9091/qthelp/api/system.html
source_anchor: "#定时周期性接口"
source_sha256: dd5b0e91a45ad4614bf4f9d8cfaf3bcc862fb84513c1860d5ddf55cc84dd1695
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="系统接口"></a>

# 系统接口

<a id="定时周期性接口"></a>

## 定时周期性接口

<a id="run_daily"></a>

### `run_daily`

<a id="中文名"></a>

#### 中文名

按日周期处理

<a id="接口说明"></a>

#### 接口说明

按日周期处理，以日为单位周期性运行指定函数，可对运行触发时间进行指定。

<a id="接口定义"></a>

#### 接口定义

python

```python
run_daily(context, func, time="9:31")
```

注意事项

1、该函数只能在初始化阶段 initialize 函数中调用。

2、该函数可以多次设定，以实现多个定时任务。

3、股票策略回测中，当回测周期为分钟时，time 的取值指定在 09:31~11:30 与 13:00~15:00 之间，当回测周期为日时，无论设定值是多少都只会在 15:00 执行；交易中不受此时间限制。

<a id="使用场景"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数"></a>

#### 参数

**`context`**

-   类型： `Context`

存放有当前的账户及持仓信息，必传字段；

**`func`**

-   类型： `Callable[[Context], None]`

自定义函数名称，此函数有且只有context一个参数，且该字段不能为量化系统内部定义函数，如handle\_data等，必传字段；

**`time`**

-   类型： `str`

指定周期运行具体触发运行时间点，交易场景可设置范围：00:00~23:59，必传字段。

<a id="返回"></a>

#### 返回

`None`

<a id="示例"></a>

#### 示例

python

```python
# 定义一个财务数据获取函数，每天执行一次
def initialize(context):
    run_daily(context, get_finance, time="9:31")
    g.security = "600570.XSHG"
    set_universe(g.security)

def get_finance(context):
    re = get_fundamentals(g.security,"balance_statement","total_assets")
    log.info(re)

def handle_data(context, data):
    pass
```

<a id="run_interval"></a>

### `run_interval`

<a id="中文名-1"></a>

#### 中文名

按设定时间间隔处理

<a id="接口说明-1"></a>

#### 接口说明

按设定周期处理，设定时间间隔（单位为秒）周期性运行指定函数，可对运行触发时间间隔进行指定。

<a id="接口定义-1"></a>

#### 接口定义

python

```python
run_interval(context, func, seconds=10, interval_timer_ranges="")
```

<a id="使用场景-1"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   该函数只能在初始化阶段initialize函数中调用。

-   可通过 interval\_timer\_ranges 参数设置运行的时间段。

-   该函数可以在initialize中多次调用，以实现多个定时任务。但需要注意的是交易中定时任务线程数限制为5且累计的任务不执行，即run\_daily和run\_interval累计调用超过5次时， 将会因堵塞导致部分定时任务不触发。

-   最小运行时间间隔seconds的设置规则：期货策略为1秒（用户设置值若小于1秒，系统仍当做1秒处理），股票等其他类型策略为3秒。


<a id="参数-1"></a>

#### 参数

**`context`**

-   类型： `Context`

存放有当前的账户及持仓信息，必填字段

**`func`**

-   类型： `Callable[[Context], None]`

自定义函数名称，此函数有且只有context一个参数，且该字段不能为量化系统内部定义函数，如handle\_data等，必填字段

**`seconds`**

-   类型： `int`
-   默认： `10`

设定时间间隔（单位为秒），取值为正整数，选填字段

**`interval_timer_ranges`**

-   类型： `str`
-   默认： `""`

用于设置指定函数运行的时间范围，选填字段

-   使用说明
    -   每个时间段使用 HH:MM-HH:MM 格式，多个时间段之间用英文逗号分隔。例如："09:15-11:30,13:00-15:00"表示从上午9点15分到11点半和下午1点到3点的时间范围。
    -   当前时间大于等于时间段范围的开始时间、小于时间段范围的结束时间时触发 run\_interval 内设置的函数。
    -   时间是以24小时制表示的，确保统一格式。
    -   如果未定义此参数，系统将默认使用券商配置时间范围进行处理。
    -   如果时间段在数据更新范围外，可能会导致获取到未更新的历史数据，建议设置当前业务可交易的时间范围。

<a id="返回-1"></a>

#### 返回

`None`

<a id="示例-1"></a>

#### 示例

python

```python
# 定义一个周期处理函数，每10秒执行一次
def initialize(context):
    run_interval(context, interval_handle, seconds = 10)
    g.security = "600570.XSHG"
    set_universe(g.security)

def interval_handle(context):
    snapshot = get_snapshot(g.security)
    log.info(snapshot)

def handle_data(context, data):
    pass
```
