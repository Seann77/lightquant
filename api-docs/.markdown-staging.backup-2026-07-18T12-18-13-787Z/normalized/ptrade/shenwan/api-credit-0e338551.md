---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 融资融券交易类接口
section_path:
  - 融资融券专用接口
  - 融资融券交易类接口
source_file: api-docs/raw/ptrade/shenwan/11_api_credit.html
source_url: http://101.71.132.53:9091/qthelp/api/credit.html
source_anchor: "#融资融券交易类接口"
source_sha256: 0f9dd100798d9db91ba0d81172d8f32946b26d92ce2c0904f9fe8827c1010327
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="融资融券专用接口"></a>

# 融资融券专用接口

<a id="融资融券交易类接口"></a>

## 融资融券交易类接口

<a id="margin_trade"></a>

### `margin_trade`

<a id="中文名"></a>

#### 中文名

担保品买卖

<a id="接口说明"></a>

#### 接口说明

进行担保品买卖交易，支持限价委托和市价委托方式。

<a id="接口定义"></a>

#### 接口定义

python

```python
margin_trade(security, amount, limit_price=None, market_type=None)
```

<a id="使用场景"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

-   限价和市价委托类型都不传时默认取当前最新价进行限价委托，限价和市价委托类型都传入时以limit\_price为委托限价进行市价委托。
-   当market\_type传入且委托上证股票时，limit\_price为保护限价字段，必传字段。

<a id="参数"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`amount`**

-   类型： `int`

交易数量，正数表示买入，负数表示卖出，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价/保护限价，选填字段

**`market_type`**

-   类型： `int`
-   默认： `None`

[市价委托类型](help-engine-e187e04d.md#market_type)，上证股票支持参数0、1、2、4，深证股票支持参数0、2、3、4、5，选填字段

<a id="返回"></a>

#### 返回

`str | None`:

-   正常返回Order对象中的id（str），如果创建订单成功
-   失败则返回None（NoneType）

<a id="示例"></a>

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
        # 以系统最新价委托
        margin_trade(g.security, 100)
        # 以46块价格下一个限价单
        margin_trade(g.security, 100, limit_price=46)

        # 以46保护限价按最优五档即时成交剩余转限价买入100股
        margin_trade(g.security, 100, limit_price=46, market_type=1)
        # 按全额成交或撤单买入100股
        margin_trade("000001.XSHE", 100, market_type=5)
        g.flag = True
```

<a id="margincash_open"></a>

### `margincash_open`

<a id="中文名-1"></a>

#### 中文名

融资买入

<a id="接口说明-1"></a>

#### 接口说明

融资买入，使用券商提供的融资资金买入指定证券。

<a id="接口定义-1"></a>

#### 接口定义

python

```python
margincash_open(security, amount, limit_price=None, market_type=None, cash_group=None)
```

<a id="使用场景-1"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   限价和市价委托类型都不传时默认取当前最新价进行限价委托，限价和市价委托类型都传入时以limit\_price为委托限价进行市价委托。
-   当market\_type传入且委托上证股票时，limit\_price为保护限价字段，必传字段。

<a id="参数-1"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`amount`**

-   类型： `int`

交易数量，输入正数，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，选填字段

**`market_type`**

-   类型： `int`
-   默认： `None`

[市价委托类型](help-engine-e187e04d.md#market_type)，上证股票支持参数0、1、2、4，深证股票支持参数0、2、3、4、5，选填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-1"></a>

#### 返回

`str | None`:

-   正常返回Order对象中的id（str），如果创建订单成功
-   失败则返回None（NoneType）

<a id="示例-1"></a>

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
        # 以系统最新价委托
        margincash_open(g.security, 100)
        # 以46块价格下一个限价单
        margincash_open(g.security, 100, limit_price=46)

        # 以46保护限价按最优五档即时成交剩余转限价买入100股
        margincash_open(g.security, 100, limit_price=46, market_type=1)
        # 按全额成交或撤单买入100股
        margincash_open("000001.XSHE", 100, market_type=5)
        g.flag = True
```

<a id="margincash_close"></a>

### `margincash_close`

<a id="中文名-2"></a>

#### 中文名

卖券还款

<a id="接口说明-2"></a>

#### 接口说明

卖券还款，通过卖出指定证券来偿还融资负债。

<a id="接口定义-2"></a>

#### 接口定义

python

```python
margincash_close(security, amount, limit_price=None, market_type=None, cash_group=None)
```

<a id="使用场景-2"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   限价和市价委托类型都不传时默认取当前最新价进行限价委托，限价和市价委托类型都传入时以limit\_price为委托限价进行市价委托。
-   当market\_type传入且委托上证股票时，limit\_price为保护限价字段，必传字段。

<a id="参数-2"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`amount`**

-   类型： `int`

交易数量，输入正数，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，选填字段

**`market_type`**

-   类型： `int`
-   默认： `None`

[市价委托类型](help-engine-e187e04d.md#market_type)，上证股票支持参数0、1、2、4，深证股票支持参数0、2、3、4、5，选填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-2"></a>

#### 返回

`str | None`:

-   正常返回Order对象中的id（str），如果创建订单成功
-   失败则返回None（NoneType）

<a id="示例-2"></a>

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
        # 以系统最新价委托
        margincash_close(g.security, 100)
        # 以46块价格下一个限价单
        margincash_close(g.security, 100, limit_price=46)

        # 以46保护限价按最优五档即时成交剩余转限价卖100股还款
        margincash_close(g.security, 100, limit_price=46, market_type=1)
        # 按全额成交或撤单卖100股还款
        margincash_close("000001.XSHE", 100, market_type=5)
        g.flag = True
```

<a id="margincash_direct_refund"></a>

### `margincash_direct_refund`

<a id="中文名-3"></a>

#### 中文名

直接还款

<a id="接口说明-3"></a>

#### 接口说明

直接还款，使用账户可用资金偿还融资负债。

<a id="接口定义-3"></a>

#### 接口定义

python

```python
margincash_direct_refund(value, cash_group=None)
```

<a id="使用场景-3"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-3"></a>

#### 参数

**`value`**

-   类型： `float`

还款金额，必填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-3"></a>

#### 返回

`None`

<a id="示例-3"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 获取负债总额
    fin_compact_balance = get_margin_asset().get('fin_compact_balance')
    # 还款
    margincash_direct_refund(fin_compact_balance)
```

<a id="marginsec_open"></a>

### `marginsec_open`

<a id="中文名-4"></a>

#### 中文名

融券卖出

<a id="接口说明-4"></a>

#### 接口说明

融券卖出，借入证券后卖出，预期价格下跌后低价买入还券获利。

<a id="接口定义-4"></a>

#### 接口定义

python

```python
marginsec_open(security, amount, limit_price=None, cash_group=None)
```

<a id="使用场景-4"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-4"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`amount`**

-   类型： `int`

交易数量，输入正数，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，选填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1为普通头寸，2为专项头寸，选填字段，默认为1-普通头寸

<a id="返回-4"></a>

#### 返回

`str | None`:

-   正常返回Order对象中的id（str），如果创建订单成功
-   失败则返回None（NoneType）

<a id="示例-4"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600030.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    # 融券卖出100股
    marginsec_open(security, 100)
```

<a id="marginsec_close"></a>

### `marginsec_close`

<a id="中文名-5"></a>

#### 中文名

买券还券

<a id="接口说明-5"></a>

#### 接口说明

买券还券，通过买入证券来偿还融券负债，完成融券交易的平仓操作。

<a id="接口定义-5"></a>

#### 接口定义

python

```python
marginsec_close(security, amount, limit_price=None, market_type=None, cash_group=None)
```

<a id="使用场景-5"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   限价和市价委托类型都不传时默认取当前最新价进行限价委托，限价和市价委托类型都传入时以limit\_price为委托限价进行市价委托。
-   当market\_type传入且委托上证股票时，limit\_price为保护限价字段，必传字段。

<a id="参数-5"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`amount`**

-   类型： `int`

交易数量，输入正数，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，选填字段

**`market_type`**

-   类型： `int`
-   默认： `None`

[市价委托类型](help-engine-e187e04d.md#market_type)，上证股票支持参数0、1、2、4，深证股票支持参数0、2、3、4、5，选填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，默认为1-普通头寸

<a id="返回-5"></a>

#### 返回

`str | None`:

-   正常返回Order对象中的id（str），如果创建订单成功
-   失败则返回None（NoneType）

<a id="示例-5"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600030.XSHG"
    set_universe(g.security)

def before_trading_start(context, data):
    g.flag = False

def handle_data(context, data):
    if not g.flag:
        # 以系统最新价委托
        marginsec_close(g.security, 100)
        # 以46块价格下一个限价单
        marginsec_close(g.security, 100, limit_price=46)

        # 以46保护限价按最优五档即时成交剩余转限价买100股还券
        marginsec_close(g.security, 100, limit_price=46, market_type=1)
        # 按全额成交或撤单买100股还券
        marginsec_close("000001.XSHE", 100, market_type=5)
        g.flag = True
```

<a id="marginsec_direct_refund"></a>

### `marginsec_direct_refund`

<a id="中文名-6"></a>

#### 中文名

直接还券

<a id="接口说明-6"></a>

#### 接口说明

直接还券，使用账户中的证券偿还融券负债。

<a id="接口定义-6"></a>

#### 接口定义

python

```python
marginsec_direct_refund(security, amount, cash_group=None)
```

<a id="使用场景-6"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-6"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`amount`**

-   类型： `int`

交易数量，输入正数，必填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认表示1-普通头寸

<a id="返回-6"></a>

#### 返回

`None`

<a id="示例-6"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600030.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    #买100股
    marginsec_direct_refund(security, 100)
```
