---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 港股通交易类接口
section_path:
  - 港股通专用接口
  - 港股通交易类接口
source_file: api-docs/raw/ptrade/shenwan/13_api_hks.html
source_url: http://101.71.132.53:9091/qthelp/api/hks.html
source_anchor: "#港股通交易类接口"
source_sha256: a16cd446ed5f662114a8898cafdf17fa26137382cfde23364126b47984ec6b46
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="港股通交易类接口"></a>

## 港股通交易类接口

<a id="hks_order"></a>

### `hks_order`

<a id="中文名-6"></a>

#### 中文名

港股通委托

<a id="接口说明-6"></a>

#### 接口说明

港股通标的买卖接口。支持港股通委托和港股通零股委托。

<a id="接口定义-6"></a>

#### 接口定义

python

```python
hks_order(security, amount, entrust_prop, entrust_price, quote_type)
```

<a id="使用场景-6"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-6"></a>

#### 参数

**`security`**

-   类型：`str`

港股通标的代码，必填字段。

**`amount`**

-   类型：`int`

委托数量，买为正数、卖为负数，必填字段。

**`entrust_prop`**

-   类型：`str`

[委托属性](help-engine-e187e04d.md#entrust_prop)，仅支持`HKN`和`HKO`，必填字段。

**`entrust_price`**

-   类型：`float`

委托价格，必须大于0，必填字段。

**`quote_type`**

-   类型：`str`

报价方式，`0`为增强限价盘，`1`为竞价限价盘，必填字段。港股通零股委托时该参数不生效强制为增强限价盘。

<a id="返回值-6"></a>

#### 返回值

`order_id|None`:

-   创建订单成功时返回`Order`对象的`id`。
-   创建订单失败时，返回`None`。

<a id="异常-4"></a>

#### 异常

-   qtcommon.exception.ParamsError：参数校验失败。
-   RuntimeError：API执行错误。

<a id="示例-6"></a>

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
                if hks_enable_amount > 0:
                    order_id = hks_order(g.security, hks_enable_amount, "HKN", last_price, "0")
                    log.info("港股通代码 {} 委托成功，order_id：{}".format(g.security, order_id))
        except BaseException as e:
            log.error("港股通代码 {} 委托失败，错误信息为：{}".format(g.security, e))
        g.flag = True
```

<a id="hks_cancel_order"></a>

### `hks_cancel_order`

<a id="中文名-7"></a>

#### 中文名

港股通撤单

<a id="接口说明-7"></a>

#### 接口说明

该接口用于撤销港股通委托订单，根据order\_id撤销订单。

<a id="接口定义-7"></a>

#### 接口定义

python

```python
hks_cancel_order(order_id)
```

<a id="使用场景-7"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-7"></a>

#### 参数

**`order_id`**

-   类型：`str`

港股通委托返回的订单编号，必填字段。

<a id="返回值-7"></a>

#### 返回值

`None`:

-   返回`None`。

<a id="异常-5"></a>

#### 异常

-   qtcommon.exception.ParamsError：参数校验失败。
-   RuntimeError：API执行错误。

<a id="示例-7"></a>

#### 示例

python

```python
import time


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
                if hks_enable_amount > 0:
                    order_id = hks_order(g.security, hks_enable_amount, "HKN", last_price, "0")
                    log.info("港股通代码 {} 委托成功，order_id：{}".format(g.security, order_id))
                    time.sleep(1)
                    try:
                        hks_cancel_order(order_id)
                    except BaseException as e:
                        log.error("港股通代码 {} 撤单失败，错误信息为：{}".format(g.security, e))
        except BaseException as e:
            log.error("港股通代码 {} 委托失败，错误信息为：{}".format(g.security, e))
        g.flag = True
```

* * *

说明

接口支持的业务范围以及支持在引擎的哪些流程函数中调用，详见 [接口列表](http://101.71.132.53:9091/qthelp/api/list.html)
