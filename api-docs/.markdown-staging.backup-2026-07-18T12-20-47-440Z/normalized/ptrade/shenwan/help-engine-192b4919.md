---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 业务流程框架
section_path:
  - 策略引擎简介
  - 业务流程框架
source_file: api-docs/raw/ptrade/shenwan/03_help_engine.html
source_url: http://101.71.132.53:9091/qthelp/help/engine.html
source_anchor: "#业务流程框架"
source_sha256: 48aa93271ac2ae21c083f05a30cc2bd5c7a0482c4c042fa03d66e90223e9c7cc
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="策略引擎简介"></a>

# 策略引擎简介

<a id="业务流程框架"></a>

## 业务流程框架

-   PTrade量化引擎以事件触发为基础，通过初始化事件`initialize`、盘前事件`before_trading_start`、盘中事件`handle_data`、盘后事件 `after_trading_end`来完成每个交易日的策略任务。
-   `initialize`和`handle_data`是一个允许运行策略的最基础结构，也就是必选项，`before_trading_start`和`after_trading_end`是可以按需运行的。
-   `handle_data`仅满足日线和分钟级别的盘中处理，tick级别的盘中处理则需要通过`tick_data`或者`run_interval`来实现。
-   PTrade还支持委托主推事件`on_order_response`、交易主推事件`on_trade_response`，可以通过委托和成交的信息来处理策略逻辑，是tick级的一个补充。
-   除了以上的一些事件以外，PTrade支持通过定时任务来运行策略逻辑，通过`run_daily`接口实现。
-   框架对`initialize`、`before_trading_start`、`handle_data`、`after_trading_end`、`tick_data`、`run_daily`、`run_interval`、 `on_order_response`、`on_trade_response`做了try保护，即这些事件中策略执行报错不会导致程序主进程退出，下一个事件会正常触发。

![](http://101.71.132.53:9091/qthelp/static/images/help/BizFrame.png)

<a id="initialize"></a>

### `initialize`

python

```python
initialize(context):
    pass
```

该函数用于初始化一些全局变量，是策略运行的唯二必须定义的函数之一

注意事项

1.  该函数只会在每次回测或交易启动的时候运行一次。

<a id="使用场景"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数"></a>

#### 参数

**`context`**

-   类型： [`Context`](help-engine-19502d4e.md#Context)

策略上下文，存放有当前的账户及持仓等信息

<a id="示例"></a>

#### 示例

python

```python
def initialize(context):
    #g为全局对象
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    order('600570.XSHG', 100)
```

<a id="before_trading_start"></a>

### `before_trading_start`

python

```python
before_trading_start(context, data):
    pass
```

该函数用于添加每天盘前的处理逻辑，如无盘前初始化需求，该函数可以在策略中不做定义。

注意事项

1.  在回测中，该函数在每个回测交易日 8:30 分执行。
2.  在交易中，该函数在开启交易时立即执行，从隔日开始每天 9:10(股票)/08:58(港股通) 分(默认)执行。
3.  当在 9:10(股票)/08:58(港股通) 前开启交易时，受行情未更新原因在该函数内调用实时行情接口会导致数据有误。可通过在该函数内 sleep 至 9:10(股票)/08:58(港股通) 分或调用实时行情接口改为`run_daily`执行等方式进行避免。

<a id="使用场景-1"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-1"></a>

#### 参数

**`context`**

-   类型： [`Context`](help-engine-19502d4e.md#Context)

策略上下文，存放有当前的账户及持仓等信息

**`data`**

保留字段暂无数据

<a id="示例-1"></a>

#### 示例

python

```python
def initialize(context):
    #g为全局变量
    g.security = '600570.XSHG'
    set_universe(g.security)

def before_trading_start(context, data):
    log.info(g.security)

def handle_data(context, data):
    order('600570.XSHG',100)
```

<a id="handle_data"></a>

### `handle_data`

python

```python
handle_data(context, data):
    pass
```

该函数在交易时间内按指定的周期频率运行，是用于处理策略交易的主要模块，根据策略保存时的周期参数分为每分钟运行和每天运行，是策略运行唯二必须定义的函数之一。

注意事项

1.  该函数每个单位周期执行一次。
2.  该函数执行时间由券商配置决定。
3.  如果是日线级别策略，每天执行一次。股票回测场景下，默认在 15:00 执行；股票交易场景下，默认在 14:50 执行。期货回测场景下，默认在 14:50 执行；港股通交易场景下，默认在 16:00 执行。
4.  如果是分钟级别策略，每分钟执行一次。股票回测场景下，默认执行时间为 9:31-15:00，股票交易场景下，默认执行时间为 9:30-14: 59；港股通交易场景下，默认执行时间为 9:30-16:09。
5.  回测与交易中，handle\_data 函数不会在非交易日触发（如回测或交易起始日期为2015年12月21日，则策略在2016年1月1日-3日时， `handle_data`不会运行，4日继续运行）。

<a id="使用场景-2"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-2"></a>

#### 参数

**`context`**

-   类型： [`Context`](help-engine-19502d4e.md#Context)

策略上下文，存放有当前的账户及持仓等信息

**`data`**

-   类型： `dict[str, BarData]`

一个字典，key是标的代码，value是当时的[`BarData`](help-engine-19502d4e.md#BarData)对象，存放当前周期（日线策略，则是当天；分钟策略，则是这一分钟）的行情数据；

说明

为了加速，`data`中的数据只包含股票池中所订阅标的的信息，可使用`data[security]`的方式来获取当前周期对应的标的信息；

<a id="示例-2"></a>

#### 示例

python

```python
def initialize(context):
    #g为全局变量
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    order('600570.XSHG', 100)
```

<a id="after_trading_end"></a>

### `after_trading_end`

python

```python
after_trading_end(context, data):
    pass
```

该函数会在每天交易结束之后调用，用于处理每天收盘后的操作，如无盘后处理需求，该函数可以在策略中不做定义。

注意事项

1.  该函数只会在每天盘后执行一次
2.  该函数执行时间由券商配置决定，默认为 15:30(股票)/16:30(港股通)。

<a id="使用场景-3"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-3"></a>

#### 参数

**`context`**

-   类型： [`Context`](help-engine-19502d4e.md#Context)

策略上下文，存放有当前的账户及持仓等信息

**`data`**

保留字段暂无数据

<a id="示例-3"></a>

#### 示例

python

```python
def initialize(context):
    #g为全局变量
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    order('600570.XSHG',100)

def after_trading_end(context, data):
    log.info(g.security)
```

<a id="tick_data"></a>

### `tick_data`

python

```python
tick_data(context, data):
    pass
```

该函数可以用于处理 tick 级别策略的交易逻辑，每隔 3 秒执行一次，如无 tick 处理需求，该函数可以在策略中不做定义。

注意事项

1.  该函数执行时间为 9:30-14:59。
2.  该函数中的`data`和[`handle_data`](#handle_data)函数中的`data`是不一样的，请勿混淆。
3.  参数`data`中包含的逐笔委托，逐笔成交数据需开通 level2 行情才能获取到数据，否则对应数据返回 None。
4.  参数`data`中的 tick 数据取自[`get_snapshot`](api-data-550d561d.md#get_snapshot)并转换为 DataFrame 格式，如要更快速的获取快照强烈建议直接使用[`get_snapshot`](api-data-550d561d.md#get_snapshot)获取。
5.  当调用[`set_parameters`](api-system-e3a203f0.md#set_parameters)并设置`tick_data_no_l2="1"`时，参数`data`中将不包含逐笔委托、逐笔成交字段，当券商有 l2 行情时配置该参数可提升 data 取速；
6.  当策略执行时间超过 3s 时，将会丢弃中间堵塞的 tick\_data。
7.  在收盘后，将会清空队列中未执行的 tick\_data。
8.  参数 data 中包含的逐笔委托，逐笔成交数据正常返回 DataFrame 格式，异常时返回 None。
9.  该函数不支持港股通业务。

<a id="使用场景-4"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-4"></a>

#### 参数

**`context`**

-   类型： [`Context`](help-engine-19502d4e.md#Context)

策略上下文，存放有当前的账户及持仓等信息

**`data`**

-   类型：`dict[str, dict]`

一个字典，key 为对应的标的代码（如：'600570.XSHG'），value 为一个字典对象，包含 tick（实时行情快照）、order（最近一条逐笔委托）、transcation（最近一条逐笔成交）三项

*数据示例*

python

```python
{
    '600570.XSHG': {
        'tick': DataFrame,
        'order': DataFrame | None,
        'transcation': DataFrame | None,
    }
}
```

*tick（实时行情快照）*

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `last_px` | `float` | 最新成交价 |
| `open_px` | `float` | 今开盘价 |
| `high_px` | `float` | 最高价 |
| `low_px` | `float` | 最低价 |
| `close_px` | `float` | 今日收盘 |
| `preclose_px` | `float` | 昨收价 |
| `up_px` | `float` | 涨停价格 |
| `down_px` | `float` | 跌停价格 |
| `avg_px` | `float` | 均价 |
| `wavg_px` | `float` | 加权平均价 |
| `business_amount` | `int` | 成交数量 |
| `business_amount_in` | `int` | 内盘成交量 |
| `business_amount_out` | `int` | 外盘成交量 |
| `business_balance` | `float` | 成交金额 |
| `business_count` | `int` | 成交笔数 |
| `current_amount` | `int` | 最近成交量(现手) |
| `pe_rate` | `float` | 动态市盈率 |
| `pb_rate` | `float` | 市净率 |
| `px_change_rate` | `float` | 涨跌幅 |
| `turnover_ratio` | `float` | 换手率 |
| `vol_ratio` | `float` | 量比 |
| `entrust_diff` | `float` | 委差 |
| `entrust_rate` | `float` | 委比 |
| `hsTimeStamp` | `str` | 时间戳（YYYYMMDDHHMISS格式） |
| `trade_mins` | `int` | 交易时间（距开盘分钟数） |
| `issue_date` | `int` | 上市日期（YYYYMMDD格式） |
| `start_trade_date` | `int` | 首个交易日（YYYYMMDD格式） |
| `end_trade_date` | `int` | 最后交易日（YYYYMMDD格式） |
| `bid_grp` | `dict[int, list]` | 买档位数据 |
| `offer_grp` | `dict[int, list]` | 卖档位数据 |
| `total_bidqty` | `int` | 委买量 |
| `total_offerqty` | `int` | 委卖量 |
| `total_bid_turnover` | `float` | 委买金额 |
| `total_offer_turnover` | `float` | 委卖金额 |
| `circulation_amount` | `flat` | 流通股本 |
| `tick_size` | `float` | 最小报价单位 |
| `amount` | `float` | 持仓量，期货专用，股票返回0.0 |
| `settlement` | `float` | 结算价，期货专用，股票返回0.0 |
| `prev_settlement` | `float` | 昨结算，期货专用，股票返回0.0 |
| `trade_status` | `str` | [交易状态](help-engine-e187e04d.md#trade_status) |

档位数据格式

`{1: [42.71, 200, 0], 2: [42.74, 200, 0], ...}`，其中每个档位包含：`[委托价格, 委托数量, 委托笔数]`

*order（逐笔委托）*

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `business_time` | `int` | 时间戳毫秒级 |
| `hq_px` | `float` | 价格 |
| `business_amount` | `int` | 委托量 |
| `order_no` | `int` | 委托编号 |
| `business_direction` | `int` | [成交方向](help-engine-e187e04d.md#business_direction) |
| `trans_kind` | `int` | [委托类别](help-engine-e187e04d.md#trans_kind) |

*transcation（逐笔成交）*

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `business_time` | `int` | 时间戳毫秒级 |
| `hq_px` | `float` | 价格 |
| `business_amount` | `int` | 成交量 |
| `trade_index` | `int` | 成交编号 |
| `business_direction` | `int` | [成交方向](help-engine-e187e04d.md#business_direction) |
| `buy_no` | `int` | 叫买方编号 |
| `sell_no` | `int` | 叫卖方编号 |
| `trans_flag` | `int` | [成交标记](help-engine-e187e04d.md#trans_flag) |
| `trans_identify_am` | `int` | [盘后逐笔成交序号标识](help-engine-e187e04d.md#trans_identify_am) |
| `channel_num` | `int` | 成交通道信息 |

<a id="示例-4"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def tick_data(context,data):
    # 获取买一价
    security = g.security
    current_price = eval(data[security]['tick']['bid_grp'][0])[1][0]
    log.info(current_price)
    # 获取买二价
    # current_price = eval(data[security]['tick']['bid_grp'][0])[2][0]
    # 获取买三量
    # current_amount = eval(data[security]['tick']['bid_grp'][0])[3][1]
    # 获取tick最高价
    # current_high_price = data[security]['tick']['high_px'][0]
    # 最近一笔逐笔成交的成交量
    # transaction = data[security]["transcation"]
    # business_amount = list(transaction["business_amount"])
    # if len(business_amount) > 0:
    #     log.info("最近一笔逐笔成交的成交量：%s" % business_amount[0])
    # 最近一笔逐笔委托的委托类别
    # order = data[security]["order"]
    # trans_kind = list(order["trans_kind"])
    # if len(trans_kind) > 0:
    #     log.info("最近一笔逐笔委托的委托类别：%s" % trans_kind[0])
    if current_price > 38.19:
        # 按买一档价格下单
        order_tick(security, 100, 1)

def handle_data(context, data):
    pass
```

<a id="on_order_response"></a>

### `on_order_response`

python

```python
on_order_response(context, order_list):
    pass
```

该函数会在引擎收到委托主推时回调，比通过`get_order`和`get_orders`等接口更新订单[委托状态](help-engine-e187e04d.md#status)的速度更快，适合对速度要求比较高的策略。

注意事项

1.  目前可接收股票、可转债、ETF、LOF、期货、港股通代码的主推数据。
2.  当接到策略外交易产生的主推时(需券商配置默认不推送)：由于没有对应的Order对象，主推信息中order\_id字段赋值为"" ；主推信息中entrust\_reference字段赋值为""
3.  当接到策略外交易产生的主推时(需券商配置默认不推送)，由于没有对应的`Order`对象，主推信息中`order_id`字段赋值为""。
4.  当在主推里调用委托接口时，需要进行判断处理避免无限迭代循环问题。
5.  当券商配置接收策略外交易产生的主推且策略调用[`set_parameters`](api-system-e3a203f0.md#set_parameters)并设置 `receive_other_response="1"`时，策略中将接收非本交易产生的主推。
6.  当策略调用[`set_parameters`](api-system-e3a203f0.md#set_parameters)并设置`receive_cancel_response="1"`，策略接收到撤单成交主推时，主推信息中的 `order_id`为买入或卖出委托`Order`对象的订单编号，`entrust_no`为撤单委托的委托编号。
7.  撤单委托主推信息中成交数量均处理为正数。
8.  主推信息中的entrust\_reference可以与Order对象的entrust\_reference进行匹配判断是本策略发送的委托，由于get\_orders() 可以获取到开启交易后所有的Order对象，需要根据Order.dt过滤当日数据。

<a id="使用场景-5"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-5"></a>

#### 参数

**`context`**

-   类型： [`Context`](help-engine-19502d4e.md#Context)

策略上下文，存放有当前的账户及持仓等信息

**`order_list`**

-   类型：`list`

当委托订单状态发生变化时，返回发生变化的委托订单列表。每条订单包含的字段如下：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `order_id` | `str` | 订单编号 |
| `entrust_no` | `str` | 委托编号 |
| `order_time` | `str` | 委托时间 |
| `stock_code` | `str` | 证券代码 |
| `amount` | `int` | 委托数量 |
| `price` | `float` | 委托价格 |
| `business_amount` | `float` | 成交数量 |
| `status` | `str` | [委托状态](help-engine-e187e04d.md#status) |
| `entrust_type` | `str` | [委托类别](help-engine-e187e04d.md#entrust_type) |
| `entrust_prop` | `str` | [委托属性](help-engine-e187e04d.md#entrust_prop) |
| `error_info` | `str` | 错误信息 |
| `entrust_reference` | `str` | 委托引用 |

*数据样例*

python

```python
[
    # 本交易委托产生的主推：
    {
        'order_id': 'e71d1684c8a74b4ca00b3326c9eb8614',
        'entrust_no': '700006',
        'order_time': '2022-05-10 15:52:10.780',
        'stock_code': '600570.XSHG',
        'amount': 200,
        'price': 36.95,
        'business_amount': 0.0,
        'status': '2',
        'entrust_type': '0',
        'entrust_prop': '0',
        'error_info': '',
        'entrust_reference': '10000005'
    },
    # 非本交易委托产生的主推：
    {
        'order_id': '',
        'entrust_no': '700008',
        'order_time': '2022-05-10 15:54:30.204',
        'stock_code': '600570.XSHG',
        'amount': 200,
        'price': 36.95,
        'business_amount': 0.0,
        'status': '2',
        'entrust_type': '0',
        'entrust_prop': '0',
        'error_info': '',
        'entrust_reference': ''
    },
    # 本交易撤单产生的主推：
    {
        'order_id': '0e27467920464390aa10a7a53da4d49a',
        'entrust_no': '700007',
        'order_time': '2022-05-10 15:52:10.780',
        'stock_code': '600570.XSHG',
        'amount': 200,
        'price': 36.95,
        'business_amount': 0.0,
        'status': '2',
        'entrust_type': '2',
        'entrust_prop': '0',
        'error_info': '',
        'entrust_reference': '10000006'
    },
    # 非本交易撤单产生的主推：
    {
        'order_id': '',
        'entrust_no': '700009',
        'order_time': '2022-05-10 15:54:30.204',
        'stock_code': '600570.XSHG',
        'amount': 200,
        'price': 36.95,
        'business_amount': 0.0,
        'status': '2',
        'entrust_type': '2',
        'entrust_prop': '0',
        'error_info': '',
        'entrust_reference': ''
    }
]
```

<a id="示例-5"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG','002416.XSHE']
    set_universe(g.security)
    g.flag = 0

def on_order_response(context, order_list):
    log.info(order_list)
    if (g.flag == 0):
        order('600570.XSHG', 100)
        g.flag = 1
    else:
        log.info("end")

def handle_data(context, data):
    order('600570.XSHG', 100)
```

<a id="on_trade_response"></a>

### `on_trade_response`

python

```python
on_trade_response(context, trade_list):
    pass
```

该函数会在引擎收到委托主推时回调，比通过`get_trades`接口更新`Order`状态的速度更快，适合对速度要求比较高的策略。

注意事项

1.  目前可接收股票、可转债、ETF、LOF、期货、港股通代码的主推数据。
2.  当接到策略外交易产生的主推时(需券商配置默认不推送)：由于没有对应的Order对象，主推信息中order\_id字段赋值为"" ；主推信息中entrust\_reference字段赋值为""。
3.  当接到策略外交易产生的主推时(需券商配置默认不推送)，由于没有对应的`Order`对象，主推信息中`order_id`字段赋值为""。
4.  当在主推里调用委托接口时，需要进行判断处理避免无限迭代循环问题。
5.  当券商配置接收策略外交易产生的主推且策略调用[set\_parameters](api-system-e3a203f0.md#set_parameters)并设置 `receive_other_response="1"`时，策略中将接收非本交易产生的主推。
6.  当策略调用[set\_parameters](api-system-e3a203f0.md#set_parameters)并设置`receive_cancel_response="1"`，策略接收到撤单成交主推时，主推信息中的 `order_id`为买入或卖出委托`Order`对象的订单编号，`entrust_no`为撤单委托的委托编号。
7.  撤单成交主推信息中成交数量均处理为正数。
8.  withdraw\_no(撤单原委托号)仅在撤单成交主推信息中才有对应值，在委托成交主推中该字段赋'0'默认值。
9.  撤单成交主推信息中entrust\_no在异构柜台情况下与withdraw\_no一致，因此策略中请勿将该字段作为撤单成交主推信息的关联字段。
10.  主推信息中的entrust\_reference可以与Order对象的entrust\_reference进行匹配判断是本策略发送的委托，由于get\_orders() 可以获取到开启交易后所有的Order对象，需要根据Order.dt过滤当日数据。

<a id="使用场景-6"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-6"></a>

#### 参数

**`context`**

-   类型： [`Context`](help-engine-19502d4e.md#Context)

策略上下文，存放有当前的账户及持仓等信息

**`trade_list`**

-   类型： `list`

当委托成交状态发生变化时，返回发生变化的成交列表。每条成交包含的字段如下：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `order_id` | `str` | 订单编号 |
| `entrust_no` | `str` | 委托编号 |
| `business_time` | `str` | 成交时间 |
| `stock_code` | `str` | 证券代码 |
| `entrust_bs` | `str` | [委托方向](help-engine-e187e04d.md#entrust_bs) |
| `business_amount` | `float` | 成交数量 |
| `business_price` | `float` | 成交价格 |
| `business_id` | `str` | 成交编号 |
| `status` | `str` | [委托状态](help-engine-e187e04d.md#status) |
| `cancel_info` | `str` | 废单原因 |
| `withdraw_no` | `str` | 撤单原委托编号 |
| `real_type` | `str` | [成交类型](help-engine-e187e04d.md#real_type) |
| `real_status` | `str` | [成交状态](help-engine-e187e04d.md#real_status) |
| `entrust_reference` | `str` | 委托引用 |

使用说明

-   当`real_type`为 "0"，`real_status`为 "0" 时，为买卖成交主推；
-   当`real_type`为 "2"，`real_status`为 "0" 时，为撤单成交主推；
-   当`real_type`为 "0"，`real_status`为 "2" 时，为买卖废单主推；
-   当`real_type`为 "2"，`real_status`为 "2" 时，为撤单废单主推；
-   当`real_type`为 "0"，`real_status`为 "4" 时，为买卖确认主推；

*数据样例*

python

```python
[
    # 本交易委托产生的主推：
    {
        'status': '8',
        'business_id': '76',
        'business_amount': 200,
        'order_id': 'e71d1684c8a74b4ca00b3326c9eb8614',
        'entrust_no': '700006',
        'business_balance': 7390.0,
        'business_price': 36.95,
        'stock_code': '600570.XSHG',
        'entrust_bs': '1',
        'business_time': '2022-05-10 15:51:47',
        'real_type': '0',
        'real_status': '0',
        'entrust_reference': '10000005'
    },
    # 非本交易委托产生的主推
    {
        'status': '8',
        'business_id': 'b155235000000003',
        'business_amount': 200,
        'order_id': '',
        'entrust_no': '700007',
        'business_balance': 3000.0,
        'business_price': 15.0,
        'stock_code': '000001.XSHE',
        'entrust_bs': '1',
        'business_time': '2022-05-10 15:52:35',
        'real_type': '0',
        'real_status': '0',
        'entrust_reference': ''
    },
    # 本交易撤单产生的主推：
    {
        'status': '8',
        'business_id': '0',
        'withdraw_no': '78',
        'business_amount': 0,
        'order_id': 'e71d1684c8a74b4ca00b3326c9eb8614',
        'entrust_no': '700006',
        'business_balance': 7390.0,
        'business_price': 36.95,
        'stock_code': '600570.XSHG',
        'entrust_bs': '1',
        'business_time': '2022-05-10 15:51:47',
        'real_type': '2',
        'real_status': '0',
        'entrust_reference': '10000006'
    },
    # 非本交易撤单产生的主推
    {
        'status': '8',
        'business_id': '0',
        'withdraw_no': '79',
        'business_amount': 0,
        'order_id': '',
        'entrust_no': '700007',
        'business_balance': 3000.0,
        'business_price': 15.0,
        'stock_code': '000001.XSHE',
        'entrust_bs': '1',
        'business_time': '2022-05-10 15:52:35',
        'real_type': '2',
        'real_status': '0',
        'entrust_reference': ''
    }
]
```

<a id="示例-6"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG','002416.XSHE']
    set_universe(g.security)
    g.flag = 0

def on_trade_response(context, trade_list):
    log.info(trade_list)
    if(g.flag==0):
        order('600570.XSHG', 100)
        g.flag = 1
    else:
        log.info("end")

def handle_data(context, data):
    order('600570.XSHG', 100)
```
