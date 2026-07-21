---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 期货设置类接口
section_path:
  - 期货专用接口
  - 期货设置类接口
source_file: api-docs/raw/ptrade/shenwan/12_api_future.html
source_url: http://101.71.132.53:9091/qthelp/api/future.html
source_anchor: "#期货设置类接口"
source_sha256: b416bb62a751ffdace9e9f67cf5e48faa7abd0e13e7b10b66b163c2a59191307
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="期货设置类接口"></a>

## 期货设置类接口

<a id="set_future_commission"></a>

### `set_future_commission`

<a id="中文名-6"></a>

#### 中文名

设置期货手续费

<a id="接口说明-6"></a>

#### 接口说明

设置期货手续费，手续费是按照交易代码进行设置的

<a id="接口定义-6"></a>

#### 接口定义

python

```python
set_future_commission(transaction_code, commission)
```

注意事项

手续费不能够小于或者等于0，请核对后重新输入

交易场景不支持此函数

<a id="使用场景-6"></a>

#### 使用场景

✅研究 ✅回测 ❌交易

<a id="参数-6"></a>

#### 参数

**`transaction_code`**

-   类型： `str`

期货合约的交易代码，如沪铜 2112（"CU2112"）的交易代码为"CU"

**`commission`**

-   类型： `float`

手续费，设置说明：

-   当交易时的手续费是按手数收取时，则这里应当设置为每手收取的金额，例如：将期货的手续费设置为 2 元/手，此处应填写 2
-   当交易时的手续费是按总成交额收取时，则这里应当设置为总成交额的比例，例如：将期货的手续费费率设置为 0.4/万，此处应填写 0.00004

<a id="返回值-6"></a>

#### 返回值

`None`

<a id="异常-4"></a>

#### 异常

-   `IQInvalidArgument`: 当手续费小于或等于0时抛出异常

<a id="示例-6"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "IF2312.CCFX"
    set_universe(g.security)
    # 设置沪深300指数的手续费，0.4/万
    set_future_commission("IF", 0.00004)
    # 设置沪深300指数的手续费，2元/手
    set_future_commission("IF", 2)

def handle_data(context, data):
    # 买入指数2312
    buy_open(g.security, 2)
```

<a id="set_margin_rate"></a>

### `set_margin_rate`

<a id="中文名-7"></a>

#### 中文名

设置期货保证金比例

<a id="接口说明-7"></a>

#### 接口说明

设置期货收取的保证金比例，保证金比例是按照交易代码进行设置的

<a id="接口定义-7"></a>

#### 接口定义

python

```python
set_margin_rate(transaction_code, margin_rate)
```

注意事项

保证金比例必须大于0，请仔细核对；

<a id="使用场景-7"></a>

#### 使用场景

✅研究 ✅回测 ❌交易

<a id="参数-7"></a>

#### 参数

**`transaction_code`**

-   类型： `str`

期货合约的交易代码，如沪铜 2112（"CU2112"）的交易代码为"CU"

**`margin_rate`**

-   类型： `float`

保证金比例，将对应期货的保证金比例设置为 5%则输入 0.05

<a id="返回值-7"></a>

#### 返回值

`None`

<a id="异常-5"></a>

#### 异常

-   `IQInvalidArgument`: 当保证金比例小于或等于0时抛出异常

<a id="示例-7"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "IF2312.CCFX"
    set_universe(g.security)
    # 设置沪深300指数收取的保证金比例设置为5%
    set_margin_rate("IF", 0.05)

def handle_data(context, data):
    # 买入指数2312
    buy_open(g.security, 10)
```

* * *

说明

接口支持的业务范围以及支持在引擎的哪些流程函数中调用，详见 [接口列表](http://101.71.132.53:9091/qthelp/api/list.html)
