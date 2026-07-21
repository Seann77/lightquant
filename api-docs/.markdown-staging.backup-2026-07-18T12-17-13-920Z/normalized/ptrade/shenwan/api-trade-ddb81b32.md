---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 账户类接口
section_path:
  - 业务公共接口
  - 账户类接口
source_file: api-docs/raw/ptrade/shenwan/09_api_trade.html
source_url: http://101.71.132.53:9091/qthelp/api/trade.html
source_anchor: "#账户类接口"
source_sha256: 8a04ed1d625ea8c951d9993f12891a7e4604b0f774adba136bc4aa5b3159a315
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="业务公共接口"></a>

# 业务公共接口

<a id="账户类接口"></a>

## 账户类接口

<a id="get_user_name"></a>

### `get_user_name`

<a id="中文名"></a>

#### 中文名

获取登录终端的资金账号

<a id="接口说明"></a>

#### 接口说明

该接口用于获取登录终端的账号

<a id="接口定义"></a>

#### 接口定义

python

```python
get_user_name(login_account=True)
```

<a id="使用场景"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

-   回测中无论是否传入login\_account参数均返回登录终端的资金账号。
-   交易中login\_account参数不传或传入True时返回登录终端的资金账号。
-   交易中login\_account参数传入False时返回当前策略绑定账号，如两融交易返回对应信用账号。

<a id="参数"></a>

#### 参数

**`login_account`**

-   类型： `bool`
-   默认： `True`

True-返回登录终端的资金账号，False-返回当前策略绑定资金账号(如两融交易返回对应信用账号)，选填字段

<a id="返回"></a>

#### 返回

`str|None`:

-   成功时，返回登录终端的资金账号/当前策略绑定账号

-   失败时，返回None


<a id="示例"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    g.current_id = get_user_name(False)

def before_trading_start(context, data):
    g.flag = False

def handle_data(context, data):
    # 账号为234567890且当日未委托过，担保品买卖100股
    if g.current_id == "234567890" and not g.flag:
        margin_trade(g.security, 100)
        g.flag = True
```

<a id="fund_transfer"></a>

### `fund_transfer`

<a id="中文名-1"></a>

#### 中文名

资金调拨

<a id="接口说明-1"></a>

#### 接口说明

用于UF20柜台与极速柜台、UF20柜台与极速柜台双中心资金调拨

<a id="接口定义-1"></a>

#### 接口定义

python

```python
fund_transfer(trans_direction, occur_balance, exchange_type="1")
```

<a id="使用场景-1"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  如要使用该函数，需咨询券商当前柜台是否支持。

2.  当前仅支持UF20柜台与ATP柜台、UF20柜台与ATP柜台双中心资金调拨。

3.  如果是UF20与ATP柜台，exchange\_type可不传。

4.  如果是UF20与ATP柜台双中心，exchange\_type为必传字段。


<a id="参数-1"></a>

#### 参数

**`trans_direction`**

-   类型： `str`

调拨方向，0-转入极速、1-转出极速, 必填参数

**`occur_balance`**

-   类型： `float`

发生金额(单位：元，最小精度：0.01元)，必填参数

**`exchange_type`**

-   类型： `str`
-   默认： `1`

交易类别，1-上海，2-深圳，选填参数，选填参数

<a id="返回-1"></a>

#### 返回

`bool`:

-   成功调拨返回True

-   失败调拨返回False


<a id="示例-1"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def before_trading_start(context, data):
    # 转出深A极速柜台100000元
    fund_transfer('1', 100000, exchange_type='2')

def handle_data(context, data):
    pass
```

<a id="market_fund_transfer"></a>

### `market_fund_transfer`

<a id="中文名-2"></a>

#### 中文名

市场间资金调拨

<a id="接口说明-2"></a>

#### 接口说明

用于极速柜台双中心之间资金调拨

<a id="接口定义-2"></a>

#### 接口定义

python

```python
market_fund_transfer(exchange_type, occur_balance)
```

<a id="使用场景-2"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  如要使用该函数，需咨询券商当前柜台是否支持。

2.  当前仅支持ATP柜台双中心之间资金调拨。


<a id="参数-2"></a>

#### 参数

**`exchange_type`**

-   类型： `str`

交易类别，1-上海，2-深圳，必填参数

**`occur_balance`**

-   类型： `float`

发生金额(单位：元，最小精度：0.01元)，必填参数

<a id="返回-2"></a>

#### 返回

`bool`:

-   成功调拨返回True

-   失败调拨返回False


<a id="示例-2"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def before_trading_start(context, data):
    # 转入沪A极速柜台100000元
    market_fund_transfer('1', 100000)

def handle_data(context, data):
    pass
```
