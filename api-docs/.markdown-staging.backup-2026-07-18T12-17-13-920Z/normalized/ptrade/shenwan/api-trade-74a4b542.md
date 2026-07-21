---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 交易类接口
section_path:
  - 业务公共接口
  - 交易类接口
source_file: api-docs/raw/ptrade/shenwan/09_api_trade.html
source_url: http://101.71.132.53:9091/qthelp/api/trade.html
source_anchor: "#交易类接口"
source_sha256: 8a04ed1d625ea8c951d9993f12891a7e4604b0f774adba136bc4aa5b3159a315
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="交易类接口"></a>

## 交易类接口

<a id="order_tick"></a>

### `order_tick`

<a id="中文名-3"></a>

#### 中文名

tick行情触发买卖

<a id="接口说明-3"></a>

#### 接口说明

该接口用于在tick\_data模块中进行买卖股票下单，可设定价格档位进行委托

<a id="接口定义-3"></a>

#### 接口定义

python

```python
order_tick(sid, amount, priceGear='1', limit_price=None)
```

<a id="使用场景-3"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  该函数只能在tick\_data模块中使用。

<a id="参数-3"></a>

#### 参数

**`sid`**

-   类型： `str`

股票代码，必填参数

**`amount`**

-   类型： `int`

交易数量，正数表示买入，负数表示卖出，必填参数

**`priceGear`**

-   类型： `str`
-   默认： `1`

盘口档位，level1:1~5买档/-1~-5卖档，level2:1~10买档/-1~-10卖档，选填参数

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，当输入参数中也包含priceGear时，下单价格以limit\_price为主，选填参数

<a id="返回-3"></a>

#### 返回

`str`:

-   返回一个委托流水编号

<a id="示例-3"></a>

#### 示例

python

```python
import ast
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def tick_data(context,data):
    security = g.security
    current_price = ast.literal_eval(data[security]['tick']['bid_grp'][0])[1][0]
    if current_price > 56 and current_price < 57:
        # 以买一档下单
        order_tick(g.security, -100, "1")
        # 以卖二档下单
        order_tick(g.security, 100, "-2")
        # 以指定价格下单
        order_tick(g.security, 100, limit_price=56.5)

def handle_data(context, data):
    pass
```

<a id="cancel_order"></a>

### `cancel_order`

<a id="中文名-4"></a>

#### 中文名

撤单

<a id="接口说明-4"></a>

#### 接口说明

该接口用于取消订单，根据[Order对象](help-engine-19502d4e.md#Order)或order\_id取消订单

<a id="接口定义-4"></a>

#### 接口定义

python

```python
cancel_order(order_param)
```

<a id="使用场景-4"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-4"></a>

#### 参数

**`order_param`**

-   类型： `Order/str`

[Order对象](help-engine-19502d4e.md#Order)或者order\_id，必填字段

<a id="返回-4"></a>

#### 返回

`None`

<a id="示例-4"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    _id = order(g.security, 100)

    cancel_order(_id)
    log.info(get_order(_id))
```

<a id="cancel_order_ex"></a>

### `cancel_order_ex`

<a id="中文名-5"></a>

#### 中文名

撤单

<a id="接口说明-5"></a>

#### 接口说明

该接口用于取消订单，根据[get\_all\_orders](api-trade-247439a3.md#get_all_orders)返回列表中的单个字典取消订单。

<a id="接口定义-5"></a>

#### 接口定义

python

```python
cancel_order_ex(order_param)
```

<a id="使用场景-5"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  该函数仅可撤get\_all\_orders函数返回的可撤状态订单。

2.  账户多个交易运行时调用该函数会撤销其他交易产生的订单，可能对其他正在运行的交易策略产生影响。


<a id="参数-5"></a>

#### 参数

**`order_param`**

-   类型： `dict`

-   [get\_all\_orders](api-trade-247439a3.md#get_all_orders)函数返回列表的单个字典，必填字段


<a id="返回-5"></a>

#### 返回

`None`

<a id="示例-5"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)
    g.count = 0

def handle_data(context, data):
    if g.count == 0:
        log.info("当日全部订单为：%s" % get_all_orders())
        # 遍历账户当日全部订单，对已报、部成状态订单进行撤单操作
        for _order in get_all_orders():
            if _order['status'] in ['2', '7']:
                cancel_order_ex(_order)
    if g.count == 1:
        # 查看撤单是否成功
        log.info("当日全部订单为：%s" % get_all_orders())
    g.count += 1
```

<a id="debt_to_stock_order"></a>

### `debt_to_stock_order`

<a id="中文名-6"></a>

#### 中文名

债转股委托

<a id="接口说明-6"></a>

#### 接口说明

该接口用于可转债转股操作。

<a id="接口定义-6"></a>

#### 接口定义

python

```python
debt_to_stock_order(security, amount)
```

<a id="使用场景-6"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  该函数仅可撤get\_all\_orders函数返回的可撤状态订单。

2.  账户多个交易运行时调用该函数会撤销其他交易产生的订单，可能对其他正在运行的交易策略产生影响。


<a id="参数-6"></a>

#### 参数

**`security`**

-   类型： `str`

-   可转债代码，必填字段


**`amount`**

-   类型： `int`

-   委托数量，必填字段


<a id="返回-6"></a>

#### 返回

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例-6"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def before_trading_start(context, data):
    g.count = 0

def handle_data(context, data):
    if g.count == 0:
        # 对持仓内的国贸转债进行转股操作
        debt_to_stock_order("110033.XSHG", -1000)
        g.count += 1
    # 查看委托状态
    log.info(get_orders())
    g.count += 1
```
