---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 内置对象
section_path:
  - 策略引擎简介
  - 内置对象
source_file: api-docs/raw/ptrade/shenwan/03_help_engine.html
source_url: http://101.71.132.53:9091/qthelp/help/engine.html
source_anchor: "#内置对象"
source_sha256: 48aa93271ac2ae21c083f05a30cc2bd5c7a0482c4c042fa03d66e90223e9c7cc
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="内置对象"></a>

## 内置对象

<a id="g"></a>

### `g`

python

```python
g.security = None #股票池
```

全局对象，用于存储用户策略自定义的全局数据，在整个策略中都可以访问

<a id="使用场景-7"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="示例-7"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    g.count = 1
    g.flag = 0
    set_universe(g.security)

def handle_data(context, data):
    log.info(g.security)
    log.info(g.count)
    log.info(g.flag)
```

<a id="Context"></a>

### `Context`

业务上下文对象，存放有当前的账户及持仓等信息

注意事项

对象内的`portfolio`数据更新周期详见[`Portfolio`](#Portfolio)对象对象注意事项说明。

<a id="使用场景-8"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="数据结构"></a>

#### 数据结构

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `capital_base` | `float` | 起始资金 |
| `previous_date` | `datetime` | 前一个交易日 |
| `sim_params` | [`SimulationParameters`](#SimulationParameters) | 模拟参数对象 |
| `slippage` | [`VolumeShareSlippage`](#VolumeShareSlippage) | 滑点参数对象 |
| `commission` | [`Commission`](#Commission) | 佣金参数对象 |
| `blotter` | [`Blotter`](#Blotter) | 订单信息组合 |
| `portfolio` | [`Portfolio`](#Portfolio) | 账户信息对象 |
| `initialized` | `bool` | 是否执行初始化 |
| `recorded_vars` | `dict` | 收益曲线值 |

<a id="数据示例"></a>

#### 数据示例

python

```python
{
    'capital_base': 100000.0,
    'previous_date': datetime.date(2025, 1, 14),
    'sim_params': {
        'period_start': datetime.datetime(2025, 1, 2, 0, 0),
        'period_end': datetime.datetime(2025, 1, 23, 0, 0),
        'capital_base': 100000.0,
        'data_frequency': 'daily',
        'emission_rate': 'daily',
        'first_open': datetime.datetime(2025, 1, 2, 9, 31),
        'last_close': datetime.datetime(2025, 1, 23, 15, 0)
    },
    'slippage': {'volume_limit': 0.25, 'price_impact': 0.0},
    'commission': {'tax': 0.001, 'cost': 0.0003, 'min_trade_cost': 5.0},
    'blotter': {
        'orders': [
            {
                'id': '23b4d6ae557041498c05f50ead7842db',
                'dt': datetime.datetime(2025, 1, 9, 15, 0),
                'priceGear': 0,
                'limit': 26.5,
                'symbol': '600570.XSHG',
                'amount': 500,
                'created': datetime.datetime(2025, 1, 9, 15, 0),
                'filled': 500,
                'status': '8',
                'entrust_no': None,
                'cancel_entrust_no': None
            }
        ],
        'new_orders': [],
        'open_orders': [],
        'current_dt': datetime.datetime(2025, 1, 15, 15, 30)
    },
    'portfolio': {
        'cash': 728.16,
        'capital_used': 99271.83,
        'positions': {
            '600570.XSHG': {
                'sid': '600570.XSHG',
                'amount': 3900,
                'enable_amount': 3900,
                'today_amount': 0,
                'business_type': 'stock',
                'last_sale_price': 26.3,
                'cost_basis': 25.45,
                'update_time': None
            }
        },
        'positions_value': 102570.0,
        'portfolio_value': 103298.16,
        'start_date': datetime.date(2025, 1, 2),
        'returns': 0.032,
        'pnl': 3298.16
    },
    'initialized': True,
    'recorded_vars': {},
}
```

<a id="SimulationParameters"></a>

### `SimulationParameters`

模拟参数对象，模拟回测的相关参数信息

<a id="使用场景-9"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

<a id="数据结构-1"></a>

#### 数据结构

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `period_start` | `datetime` | 开始时间 |
| `period_end` | `datetime` | 结束时间 |
| `capital_base` | `float` | 起始资金 |
| `data_frequency` | `str` | 数据频率 |
| `emission_rate` | `str` | 执行速率 |
| `first_open` | `datetime` | 开市时间，第一个交易日的 9:31 |
| `last_close` | `datetime` | 停市时间，最后一个交易日的 15:00 |

<a id="数据示例-1"></a>

#### 数据示例

python

```python
{
    'period_start': datetime.datetime(2025, 1, 2, 0, 0),
    'period_end': datetime.datetime(2025, 1, 23, 0, 0),
    'capital_base': 100000.0,
    'data_frequency': 'daily',
    'emission_rate': 'daily',
    'first_open': datetime.datetime(2025, 1, 2, 9, 31),
    'last_close': datetime.datetime(2025, 1, 23, 15, 0)
}
```

<a id="VolumeShareSlippage"></a>

### `VolumeShareSlippage`

滑点参数对象

<a id="使用场景-10"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

<a id="数据结构-2"></a>

#### 数据结构

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `volume_limit` | `float` | 成交限量 |
| `price_impact` | `float` | 价格影响力 |

<a id="数据示例-2"></a>

#### 数据示例

python

```python
{
    'volume_limit': 0.25,
    'price_impact': 0.0
}
```

<a id="Commission"></a>

### `Commission`

佣金参数对象

<a id="使用场景-11"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

<a id="数据结构-3"></a>

#### 数据结构

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `tax` | `float` | 印花税 |
| `cost` | `float` | 佣金费率 |
| `min_trade_cost` | `float` | 最小佣金 |

<a id="数据示例-3"></a>

#### 数据示例

python

```python
{
    'tax': 0.001,
    'cost': 0.0003,
    'min_trade_cost': 5.0
}
```

<a id="Blotter"></a>

### `Blotter`

订单信息组合

<a id="使用场景-12"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="数据结构-4"></a>

#### 数据结构

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `orders` | `list[Order]` | 全部交易订单 |
| `new_orders` | `list[Order]` | 新生成的交易订单 |
| `open_orders` | `list[Order]` | 未完成交易订单 |
| `current_dt` | `datetime` | 当前单位时间的开始时间 |

<a id="数据示例-4"></a>

#### 数据示例

python

```python
{
    'orders': [{
        'limit': 26.5,
        'created': datetime.datetime(2025, 1, 9, 15, 0),
        'priceGear': 0,
        'entrust_no': None,
        'cancel_entrust_no': None,
        'dt': datetime.datetime(2025, 1, 9, 15, 0),
        'id': '23b4d6ae557041498c05f50ead7842db',
        'symbol': '600570.XSHG',
        'status': '8',
        'amount': 500,
        'filled': 500
    }],
    'new_orders': [],
    'open_orders': [],
    'current_dt': datetime.datetime(2025, 1, 15, 15, 30)
}
```

<a id="Portfolio"></a>

### `Portfolio`

账户信息对象，包含账户当前的资金和仓位信息

注意事项

1.  数据更新周期默认为6s(具体配置需咨询所在券商)，即上一次账户资金、委托、持仓查询并更新到对象中后，间隔6s发起下一次查询。数据更新时间范围为 `before_trading_start`\-`after_trading_end`之间。
2.  不同业务返回的字段存在差异，需要注意区分。

<a id="使用场景-13"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="数据结构-5"></a>

#### 数据结构

**股票账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `cash` | `float` | 当前可用资金(不包含冻结资金) |
| `capital_used` | `float` | 已使用资金 |
| `positions` | `list[Position]` | 当前持有的标的 |
| `positions_value` | `float` | 持仓价值 |
| `portfolio_value` | `float` | 当前持有的标的和现金的总价值 |
| `start_date` | `datetime` | 开始时间 |
| `returns` | `float` | 当前的收益比例 |
| `pnl` | `float` | 浮动盈亏，即当前账户总资产-初始账户总资产 |

**港股通账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `cash` | `float` | 当前可用资金(不包含冻结资金) |
| `positions` | `list[Position]` | 当前持有的标的 |
| `portfolio_value` | `float` | 当前持有的标的和现金的总价值 |
| `positions_value` | `float` | 持仓价值 |
| `returns` | `float` | 当前的收益比例 |
| `pnl` | `float` | 浮动盈亏，即当前账户总资产-初始账户总资产 |
| `start_date` | `datetime` | 开始时间 |

**期货账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `cash` | `float` | 当前可用资金(不包含冻结资金) |
| `margin` | `float` | 持仓保证金 |
| `positions` | `dict[str, Position]` | 当前持有的标的 |
| `positions_value` | `float` | 持仓价值 |
| `portfolio_value` | `float` | 当前持仓保证金和现金的总价值 |
| `start_date` | `datetime` | 开始时间 |
| `returns` | `float` | 当前的收益比例 |
| `pnl` | `float` | 浮动盈亏，即当前账户总资产-初始账户总资产 |

<a id="数据示例-5"></a>

#### 数据示例

python

```python
{
    'cash': 728.16,
    'capital_used': 99271.83,
    'positions': {
        '600570.XSHG': {
            'update_time': None,
            'cost_basis': 25.45,
            'business_type': 'stock',
            'enable_amount': 3900,
            'today_amount': 0,
            'last_sale_price': 26.3,
            'sid': '600570.XSHG',
            'amount': 3900,
        }
    },
    'positions_value': 102570.0,
    'portfolio_value': 103298.16,
    'start_date': datetime.date(2025, 1, 2),
    'returns': 0.032,
    'pnl': 3298.16,
}
```

<a id="Order"></a>

### `Order`

委托订单信息

注意事项

1.  回测中`entrust_no`、`cancel_entrust_no`、`entrust_reference`字段值为 None。
2.  交易中对象内的数据更新分为两种同时进行：
    -   定时更新，周期默认为6s(具体配置需咨询所在券商)，即上一次账户资金、委托、持仓查询并更新到对象中后，间隔6s发起下一次查询。数据更新时间范围为 `before_trading_start`\-`after_trading_end`之间。
    -   主推事件更新，后台接收到主推数据时会更新对象内成交数量、[委托状态](help-engine-e187e04d.md#status)、持仓成本价等信息。
3.  交易中对原委托进行撤单时，cancel\_entrust\_no字段值填充撤单委托编号。
4.  交易中期货(对接UFT柜台)对原委托进行撤单时，撤单委托编号等于原委托编号。
5.  不同业务返回的字段存在差异，需要注意区分。

<a id="使用场景-14"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="数据结构-6"></a>

#### 数据结构

**股票账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `str` | 订单编号 |
| `dt` | `datetime` | 订单产生时间 |
| `priceGear` | `int` | 盘口标识 买1卖-1 |
| `limit` | `float` | 指定价格 |
| `symbol` | `str` | 标的代码 |
| `amount` | `int` | 下单数量，买入是正数，卖出是负数 |
| `created` | `datetime` | 订单生成时间 |
| `filled` | `int` | 成交数量，买入时为正数，卖出时为负数 |
| `status` | `str` | [委托状态](help-engine-e187e04d.md#status) |
| `entrust_no` | `str` | 委托编号 |
| `cancel_entrust_no` | `str` | 撤单委托编号 |
| `entrust_reference` | `str` | 委托引用 |

**港股通账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `str` | 订单编号 |
| `dt` | `datetime` | 订单产生时间 |
| `limit` | `float` | 指定价格 |
| `symbol` | `str` | 标的代码 |
| `amount` | `int` | 下单数量，买入是正数，卖出是负数 |
| `created` | `datetime` | 订单生成时间 |
| `filled` | `int` | 成交数量，买入时为正数，卖出时为负数 |
| `status` | `str` | [委托状态](help-engine-e187e04d.md#status) |
| `entrust_no` | `str` | 委托编号 |
| `cancel_entrust_no` | `str` | 撤单委托编号 |
| `entrust_reference` | `str` | 委托引用 |

**期货账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `str` | 订单编号 |
| `dt` | `datetime` | 订单产生时间 |
| `priceGear` | `int` | 盘口标识 买1卖-1 |
| `limit` | `float` | 指定价格 |
| `symbol` | `str` | 标的代码 |
| `amount` | `int` | 下单数量，买入是正数，卖出是负数 |
| `created` | `datetime` | 订单生成时间 |
| `side` | `str` | 多空标志（long：多头，short：空头） |
| `action` | `str` | 开平仓方向（open：开仓，close：平仓） |
| `entrust_direction` | `str` | 买卖方向（buy：买入，sell：卖出） |
| `filled` | `int` | 成交数量，买入时为正数，卖出时为负数 |
| `status` | `str` | [委托状态](help-engine-e187e04d.md#status) |
| `entrust_no` | `str` | 委托编号 |
| `cancel_entrust_no` | `str` | 撤单委托编号 |
| `entrust_reference` | `str` | 委托引用 |

<a id="数据示例-6"></a>

#### 数据示例

python

```python
{
    'id': '23b4d6ae557041498c05f50ead7842db',
    'dt': datetime.datetime(2025, 1, 9, 15, 0),
    'priceGear': 0,
    'limit': 26.5,
    'symbol': '600570.XSHG',
    'amount': 500,
    'created': datetime.datetime(2025, 1, 9, 15, 0),
    'filled': 500,
    'status': '8',
    'entrust_no': None,
    'cancel_entrust_no': None
}
```

<a id="Position"></a>

### `Position`

持有的某个标的的信息

注意事项

1.  期货业务持仓把单个合约的持仓分为了多头仓(long)、空头仓(short)。
2.  交易中对象内的数据更新周期默认为6s(具体配置需咨询所在券商)，即上一次账户资金、委托、持仓查询并更新到对象中后，间隔6s发起下一次查询。数据更新时间范围为 `before_trading_start`\-`after_trading_end`之间。
3.  交易场景下，持仓信息是每6秒与柜台同步后更新的，update\_time字段记录了最近的更新时间，格式为："%Y-%m-%d %H:%M:%S" 。回测场景返回None。
4.  不同业务返回的字段存在差异，需要注意区分。

<a id="使用场景-15"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="数据结构-7"></a>

#### 数据结构

**股票账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `sid` | `str` | 标的代码 |
| `amount` | `int` | 持仓数量 |
| `enable_amount` | `int` | 可用数量 |
| `today_amount` | `int` | 今日买入数量 |
| `business_type` | `str` | 持仓类型 |
| `last_sale_price` | `float` | 最新价格 |
| `cost_basis` | `float` | 持仓成本 |
| `update_time` | `str` | 更新时间 |

**港股通账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `sid` | `str` | 标的代码 |
| `amount` | `int` | 持仓数量 |
| `enable_amount` | `int` | 可用数量 |
| `business_type` | `str` | 持仓类型 |
| `last_sale_price` | `float` | 最新价格 |
| `cost_basis` | `float` | 持仓成本 |
| `update_time` | `str` | 更新时间 |

**期货账户**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `sid` | `str` | 标的代码 |
| `contract_multiplier` | `int` | 合约乘数 |
| `delivery_date` | `int` | 交割日期 |
| `amount` | `int` | 持仓数量 |
| `long_amount` | `int` | 多头持仓数量 |
| `short_amount` | `int` | 空头持仓数量 |
| `enable_amount` | `int` | 可用数量 |
| `long_enable_amount` | `int` | 多头可用数量 |
| `short_enable_amount` | `int` | 空头可用数量 |
| `today_long_amount` | `int` | 多头今仓数量 |
| `today_short_amount` | `int` | 空头今仓数量 |
| `margin` | `float` | 持仓保证金 |
| `business_type` | `str` | 持仓类型 |
| `last_sale_price` | `float` | 最新价格 |
| `long_cost_basis` | `float` | 多头持仓成本 |
| `short_cost_basis` | `float` | 空头持仓成本 |
| `long_pnl` | `float` | 多头浮动盈亏 |
| `short_pnl` | `float` | 空头浮动盈亏 |
| `update_time` | `str` | 更新时间 |

<a id="数据示例-7"></a>

#### 数据示例

python

```python
{
    'sid': '600570.XSHG',
    'amount': 3900,
    'enable_amount': 3900,
    'today_amount': 0,
    'business_type': 'stock',
    'last_sale_price': 26.3,
    'cost_basis': 25.45,
    'update_time': None
}
```

<a id="BarData"></a>

### `BarData`

K线行情数据对象

注意事项

1.  `preclose`、`high_limit`、`low_limit`、`unlimited`在分钟频率中均填充为0.0。
2.  当前周期内首次调用会在线获取该代码K线数据，当前周期重复调用时将会返回首次调用缓存的该代码K线数据。

<a id="使用场景-16"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="数据结构-8"></a>

#### 数据结构

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `symbol` | `str` | 标的代码 |
| `name` | `str` | 代码名称 |
| `dt` | `datetime` | 当前周期时间 |
| `is_open` | `int` | 停牌标志，0-停牌，1-非停牌 |
| `open` | `float` | 当前周期开盘价 |
| `close` | `float` | 当前周期收盘价 |
| `price` | `float` | 当前周期最新价 |
| `low` | `float` | 当前周期最低价 |
| `high` | `float` | 当前周期最高价 |
| `volume` | `float` | 当前周期成交量 |
| `money` | `float` | 当前周期成交额 |
| `preclose` | `float` | 昨收盘价(仅日线返回) |
| `high_limit` | `flot` | 涨停价(仅日线返回) |
| `low_limit` | `float` | 跌停价(仅日线返回) |
| `unlimited` | `bool` | 是否无涨跌停限制(仅日线返回) |
| `datetime` | `datetime` | 当前周期时间 |

<a id="示例-8"></a>

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
        # 打印代码BarData对象
        log.info(data[g.security])
        # 打印标的代码
        log.info(data[g.security].symbol)
        # 打印代码名称
        log.info(data[g.security].name)
        # 打印当前周期时间
        log.info(data[g.security].dt)
        # 打印当前周期是否开盘
        log.info(data[g.security].is_open)
        # 打印当前周期开盘价
        log.info(data[g.security].open)
        # 打印当前周期收盘价
        log.info(data[g.security].close)
        # 打印当前周期最新价
        log.info(data[g.security].price)
        # 打印当前周期最低价
        log.info(data[g.security].low)
        # 打印当前周期最高价
        log.info(data[g.security].high)
        # 打印当前周期成交量
        log.info(data[g.security].volume)
        # 打印当前周期成交额
        log.info(data[g.security].money)
        # 打印昨收盘价(仅日线返回)
        log.info(data[g.security].preclose)
        # 打印涨停价(仅日线返回)
        log.info(data[g.security].high_limit)
        # 打印跌停价(仅日线返回)
        log.info(data[g.security].low_limit)
        # 打印是否无涨跌停限制(仅日线返回)
        log.info(data[g.security].unlimited)
        # 打印当前周期时间
        log.info(data[g.security].datetime)
        g.flag = True
```
