---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 期货查询类接口
section_path:
  - 期货专用接口
  - 期货查询类接口
source_file: api-docs/raw/ptrade/shenwan/12_api_future.html
source_url: http://101.71.132.53:9091/qthelp/api/future.html
source_anchor: "#期货查询类接口"
source_sha256: b416bb62a751ffdace9e9f67cf5e48faa7abd0e13e7b10b66b163c2a59191307
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="期货查询类接口"></a>

## 期货查询类接口

<a id="get_instruments"></a>

### `get_instruments`

<a id="中文名-4"></a>

#### 中文名

获取合约信息

<a id="接口说明-4"></a>

#### 接口说明

获取合约的上市的具体信息

<a id="接口定义-4"></a>

#### 接口定义

python

```python
get_instruments(contract)
```

注意事项

期货实盘模块中，由于行情源的限制，涨跌幅目前暂无法提供

此 API 依靠期货资料详情数据权限，使用前请与券商确认是否有此权限，无权限时调用返回空 dict

<a id="使用场景-4"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

<a id="参数-4"></a>

#### 参数

**`contract`**

-   类型： `str`

期货的合约代码

<a id="返回值-4"></a>

#### 返回值

`FutureParams`:

FutureParams 对象，主要返回的字段为:

-   `contract_code` -- 合约代码，str 类型
-   `contract_name` -- 合约名称，str 类型
-   `exchange` -- 交易所：大商所、郑商所、上期所、中金所，str 类型
-   `trade_unit` -- 交易单位，int 类型
-   `contract_multiplier` -- 合约乘数，float 类型
-   `delivery_date` -- 交割日期，str 类型
-   `listing_date` -- 上市日期，str 类型
-   `trade_code` -- 交易代码，str 类型
-   `margin_rate` -- 保证金比例，float 类型

<a id="示例-4"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ["IF2312.CCFX"]
    set_universe(g.security)

def before_trading_start(context, data):
    # 获取股票池代码合约信息
    for security in g.security:
        info = get_instruments(security)
    log.info(info)

def handle_data(context, data):
    pass
```

<a id="get_margin_rate"></a>

### `get_margin_rate`

<a id="中文名-5"></a>

#### 中文名

获取用户设置的保证金比例

<a id="接口说明-5"></a>

#### 接口说明

获取用户设置的保证金比例

<a id="接口定义-5"></a>

#### 接口定义

python

```python
get_margin_rate(transaction_code)
```

<a id="使用场景-5"></a>

#### 使用场景

✅研究 ✅回测 ❌交易

<a id="参数-5"></a>

#### 参数

**`transaction_code`**

-   类型： `str`

期货合约的交易代码，如沪铜 2112（"CU2112"）的交易代码为"CU"

<a id="返回值-5"></a>

#### 返回值

`float`:

用户设置的保证金比例，默认返回交易所设定的保证金比例

<a id="示例-5"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "IF2312.CCFX"
    set_universe(g.security)
    # 设置沪深300指数的保证金比例为8%
    set_margin_rate("IF", 0.08)

def before_trading_start(context, data):
    # 获取沪深300指数的保证金比例
    margin_rate = get_margin_rate("IF")
    log.info(margin_rate)
    # 获取5年期国债的保证金比例
    margin_rate = get_margin_rate("TF")
    log.info(margin_rate)

def handle_data(context, data):
    pass
```
