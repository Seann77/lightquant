---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 期货交易类接口
section_path:
  - 期货专用接口
  - 期货交易类接口
source_file: api-docs/raw/ptrade/shenwan/12_api_future.html
source_url: http://101.71.132.53:9091/qthelp/api/future.html
source_anchor: "#期货交易类接口"
source_sha256: b416bb62a751ffdace9e9f67cf5e48faa7abd0e13e7b10b66b163c2a59191307
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="期货专用接口"></a>

# 期货专用接口

<a id="期货交易类接口"></a>

## 期货交易类接口

<a id="buy_open"></a>

### `buy_open`

<a id="中文名"></a>

#### 中文名

多开

<a id="接口说明"></a>

#### 接口说明

买入开仓

<a id="接口定义"></a>

#### 接口定义

python

```python
buy_open(contract, amount, limit_price=None)
```

注意事项

不同期货品种每一跳的价格变动都不一样，`limit_price` 入参的时候要参考对应品种的价格变动规则，如 `limit_price` 不做入参则会以交易的行情快照最新价或者回测的分钟最新价进行报单

根据交易所规则，每天结束时会取消所有未完成交易

实盘交易中不支持主连合约（88）和指数合约（99）

<a id="使用场景"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数"></a>

#### 参数

**`contract`**

-   类型： `str`

期货合约代码

**`amount`**

-   类型： `int`

交易数量，正数

**`limit_price`**

-   类型： `float|None`
-   默认值： `None`

买卖限价

市价委托

交易场景下，`limit_price`字段为`None`时，系统会获取行情快照最新价报单

<a id="返回值"></a>

#### 返回值

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="异常"></a>

#### 异常

-   `IQInvalidArgument`: 当合约代码包含"88"或"99"时，实盘交易会抛出异常

<a id="示例"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['IF2312.CCFX']
    set_universe(g.security)

def handle_data(context, data):
    # 买入开仓
    buy_open('IF2312.CCFX', 1)
```

<a id="buy_close"></a>

### `buy_close`

<a id="中文名-1"></a>

#### 中文名

期货买入平仓

<a id="接口说明-1"></a>

#### 接口说明

期货合约买入平仓操作，用于平掉空头持仓。

<a id="接口定义-1"></a>

#### 接口定义

python

```python
buy_close(contract, amount, limit_price=None, close_today=False)
```

注意事项

不同期货品种每一跳的价格变动都不一样，`limit_price` 入参的时候要参考对应品种的价格变动规则，如 `limit_price` 不做入参则会以交易的行情快照最新价或者回测的分钟最新价进行报单

根据交易所规则，每天结束时会取消所有未完成交易

实盘交易中不支持主连合约（88）和指数合约（99）

系统会自动检查持仓数量，如果持仓不足会自动调整平仓数量

<a id="使用场景-1"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-1"></a>

#### 参数

**`contract`**

-   类型： `str`

期货合约代码

**`amount`**

-   类型： `int`

交易数量，正数

**`limit_price`**

-   类型： `float|None`
-   默认值： `None`

买卖限价

**`close_today`**

-   类型： `bool`
-   默认值： `False`

平仓方式。`close_today=False` 为优先平昨仓，不足部分再平今仓；`close_today=True` 为仅平今仓，委托数量若大于今仓系统会调整为今仓数量。`close_today=True` 仅对上海期货交易所生效，其他交易所无需入参 `close_today` 字段，若设置为 `True` 系统会警告，并强行转换为 `close_today=False`

市价委托

交易场景下，`limit_price`字段为`None`时，系统会获取行情快照最新价报单

<a id="返回值-1"></a>

#### 返回值

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="异常-1"></a>

#### 异常

-   `IQInvalidArgument`: 当合约代码包含"88"或"99"时，实盘交易会抛出异常

<a id="示例-1"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['IF2312.CCFX']
    set_universe(g.security)

def handle_data(context, data):
    # 买入平仓
    buy_close('IF2312.CCFX', 1)
```

<a id="sell_open"></a>

### `sell_open`

<a id="中文名-2"></a>

#### 中文名

空开

<a id="接口说明-2"></a>

#### 接口说明

卖出开仓

<a id="接口定义-2"></a>

#### 接口定义

python

```python
sell_open(contract, amount, limit_price=None)
```

注意事项

不同期货品种每一跳的价格变动都不一样，`limit_price` 入参的时候要参考对应品种的价格变动规则，如 `limit_price` 不做入参则会以交易的行情快照最新价或者回测的分钟最新价进行报单

根据交易所规则，每天结束时会取消所有未完成交易

实盘交易中不支持主连合约（88）和指数合约（99）

<a id="使用场景-2"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-2"></a>

#### 参数

**`contract`**

-   类型： `str`

期货合约代码

**`amount`**

-   类型： `int`

交易数量，正数

**`limit_price`**

-   类型： `float|None`
-   默认值： `None`

买卖限价

市价委托

交易场景下，`limit_price`字段为`None`时，系统会获取行情快照最新价报单

<a id="返回值-2"></a>

#### 返回值

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="异常-2"></a>

#### 异常

-   `IQInvalidArgument`: 当合约代码包含"88"或"99"时，实盘交易会抛出异常

<a id="示例-2"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['IF2312.CCFX']
    set_universe(g.security)

def handle_data(context, data):
    # 卖出开仓
    sell_open('IF2312.CCFX', 1)
```

<a id="sell_close"></a>

### `sell_close`

<a id="中文名-3"></a>

#### 中文名

多平

<a id="接口说明-3"></a>

#### 接口说明

卖出平仓

<a id="接口定义-3"></a>

#### 接口定义

python

```python
sell_close(contract, amount, limit_price=None, close_today=False)
```

注意事项

不同期货品种每一跳的价格变动都不一样，`limit_price` 入参的时候要参考对应品种的价格变动规则，如 `limit_price` 不做入参则会以交易的行情快照最新价或者回测的分钟最新价进行报单

根据交易所规则，每天结束时会取消所有未完成交易

实盘交易中不支持主连合约（88）和指数合约（99）

系统会自动检查持仓数量，如果持仓不足会自动调整平仓数量

<a id="使用场景-3"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-3"></a>

#### 参数

**`contract`**

-   类型： `str`

期货合约代码

**`amount`**

-   类型： `int`

交易数量，正数

**`limit_price`**

-   类型： `float|None`
-   默认值： `None`

买卖限价

**`close_today`**

-   类型： `bool`
-   默认值： `False`

平仓方式。`close_today=False` 为优先平昨仓，不足部分再平今仓；`close_today=True` 为仅平今仓，委托数量若大于今仓系统会调整为今仓数量。`close_today=True` 仅对上海期货交易所生效，其他交易所无需入参 `close_today` 字段，若设置为 `True` 系统会警告，并强行转换为 `close_today=False`

市价委托

交易场景下，`limit_price`字段为`None`时，系统会获取行情快照最新价报单

<a id="返回值-3"></a>

#### 返回值

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="异常-3"></a>

#### 异常

-   `IQInvalidArgument`: 当合约代码包含"88"或"99"时，实盘交易会抛出异常

<a id="示例-3"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['IF2312.CCFX']
    set_universe(g.security)

def handle_data(context, data):
    # 卖出平仓
    sell_close('IF2312.CCFX', 1)
```
