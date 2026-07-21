---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 融资融券查询类接口
section_path:
  - 融资融券专用接口
  - 融资融券查询类接口
source_file: api-docs/raw/ptrade/shenwan/11_api_credit.html
source_url: http://101.71.132.53:9091/qthelp/api/credit.html
source_anchor: "#融资融券查询类接口"
source_sha256: 0f9dd100798d9db91ba0d81172d8f32946b26d92ce2c0904f9fe8827c1010327
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="融资融券查询类接口"></a>

## 融资融券查询类接口

<a id="get_margincash_stocks"></a>

### `get_margincash_stocks`

<a id="中文名-7"></a>

#### 中文名

融资标的查询

<a id="接口说明-7"></a>

#### 接口说明

获取当前账户支持的融资标的证券列表，包含上交所和深交所的融资标的。

<a id="接口定义-7"></a>

#### 接口定义

python

```python
get_margincash_stocks()
```

<a id="使用场景-7"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接顶点HTS柜台暂不支持该函数。

<a id="返回-7"></a>

#### 返回

`list[str]`:

-   返回上交所、深交所最近一次披露的可融资标的列表。

md

```md
['000002.SZ', '000519.SZ', '600570.SS', '600519.SS']
```

<a id="示例-7"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 获取最新的融资标的列表
    margincash_stocks = get_margincash_stocks()
    log.info(margincash_stocks)
```

<a id="get_marginsec_stocks"></a>

### `get_marginsec_stocks`

<a id="中文名-8"></a>

#### 中文名

融券标的查询

<a id="接口说明-8"></a>

#### 接口说明

融券标的查询，获取当前市场可融券卖出的标的证券列表。

<a id="接口定义-8"></a>

#### 接口定义

python

```python
get_marginsec_stocks()
```

<a id="使用场景-8"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接顶点HTS柜台暂不支持该函数。

<a id="返回-8"></a>

#### 返回

`list[str]`:

-   返回上交所、深交所最近一次披露的可融券标的列表。

md

```md
['000002.SZ', '000519.SZ', '600570.SS', '600519.SS']
```

<a id="示例-8"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 获取最新的融券标的列表
    marginsec_stocks = get_marginsec_stocks()
    log.info(marginsec_stocks)
```

<a id="get_margin_contract"></a>

### `get_margin_contract`

<a id="中文名-9"></a>

#### 中文名

合约查询

<a id="接口说明-9"></a>

#### 接口说明

该接口用于合约查询。

<a id="接口定义-9"></a>

#### 接口定义

python

```python
get_margin_contract(compact_source=None)
```

<a id="使用场景-9"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-7"></a>

#### 参数

**`compact_source`**

-   类型： `int`
-   默认： `None`

合约来源，0-普通头寸，1-专项头寸，选填字段，不填默认为0-普通头寸

<a id="返回-9"></a>

#### 返回

`DataFrame | None`:

-   正常返回一个DataFrame类型字段，columns为每个合约所包含的信息(相应字段无数据时返回None)
-   异常返回None(NoneType)

**合约包含以下信息**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `open_date` | `int` | 开户日期 |
| `compact_id` | `str` | 合约编号 |
| `stock_code` | `str` | 证券代码 |
| `entrust_no` | `str` | 委托编号 |
| `entrust_price` | `float` | 委托价格 |
| `entrust_amount` | `float` | 委托数量 |
| `business_amount` | `float` | 成交数量 |
| `business_balance` | `float` | 成交金额 |
| `compact_type` | `str` | [合约类别](help-engine-e187e04d.md#compact_type) |
| `compact_source` | `str` | 合约来源 |
| `compact_status` | `str` | 合约状态 |
| `repaid_interest` | `float` | 已还利息 |
| `repaid_amount` | `float` | 已还数量 |
| `repaid_balance` | `float` | 已还金额 |
| `used_bail_balance` | `float` | 已用保证金 |
| `ret_end_date` | `int` | 归还截止日 |
| `date_clear` | `int` | 清算日期 |
| `fin_income` | `float` | 融资合约盈亏 |
| `slo_income` | `float` | 融券合约盈亏 |
| `total_debit` | `float` | 负债总额 |
| `compact_interest` | `float` | 合约利息金额 |
| `real_compact_interest` | `float` | 日间实时利息金额 |
| `real_compact_balance` | `float` | 日间实时合约金额 |
| `real_compact_amount` | `float` | 日间实时合约数量 |

md

```md
    open_date   compact_id   stock_code   ...   real_compact_balance   real_compact_amount
0   20250218   20250131234567   600570.SS   ...   103235.31   2800
1   20250219   20250131232321   000002.SZ   ...	  532581.10   72130
2   20250220   20250131232131   600519.SS   ...	  444000.00   300
```

<a id="示例-9"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 获取合约信息
    df = get_margin_contract()
    log.info(df)
```

<a id="get_margin_contractreal"></a>

### `get_margin_contractreal`

<a id="中文名-10"></a>

#### 中文名

实时合约查询

<a id="接口说明-10"></a>

#### 接口说明

获取两融账户的实时合约流水信息，包括合约编号、发生金额、后资金额等实时数据。

<a id="接口定义-10"></a>

#### 接口定义

python

```python
get_margin_contractreal()
```

<a id="使用场景-10"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接金证集中，金证快订、云订柜台暂不支持该函数。

<a id="返回-10"></a>

#### 返回

`DataFrame | None`:

-   正常返回一个DataFrame类型字段，columns为每个合约所包含的信息(相应字段无数据时返回None)
-   异常返回None(NoneType)

**实时合约流水包含以下信息**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `init_date` | `str:int` | 交易日期 |
| `compact_id` | `str:str` | 合约编号 |
| `client_id` | `str:str` | 客户编号 |
| `money_type` | `str:str` | 币种类别 |
| `exchange_type` | `str:str` | 交易类别，仅包含1和2 |
| `entrust_no` | `str:str` | 委托编号 |
| `compact_type` | `str:str` | [合约类别](help-engine-e187e04d.md#compact_type) |
| `stock_code` | `str:str` | 证券代码 |
| `business_flag` | `str:int` | 业务标志 |
| `occur_balance` | `str:float` | 发生金额 |
| `post_balance` | `str:float` | 后资金额 |
| `occur_amount` | `str:float` | 发生数量 |
| `post_amount` | `str:float` | 后证券额 |
| `occur_fare` | `str:float` | 发生费用 |
| `post_fare` | `str:float` | 后余费用 |
| `occur_interest` | `str:float` | 发生利息 |
| `post_interest` | `str:float` | 后余利息 |
| `remark` | `str:str` | 备注 |

md

```md
    init_date   compact_id   client_id   ...   post_interest   remark
0   20250218   20250131234567   339200779   ...	  58.2   利息
1   20250219   20250131232321   339200779   ...	  61.3   利息
2   20250220   20250131232131   339200779   ...	  77.1   利息
```

<a id="示例-10"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 获取实时流水
    df = get_margin_contractreal()
    log.info(df)
```

<a id="get_margin_asset"></a>

### `get_margin_asset`

<a id="中文名-11"></a>

#### 中文名

信用资产查询

<a id="接口说明-11"></a>

#### 接口说明

获取账户信用资产信息，包括担保资产、负债总额、可用保证金等详细信息。

<a id="接口定义-11"></a>

#### 接口定义

python

```python
get_margin_asset()
```

<a id="使用场景-11"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="返回-11"></a>

#### 返回

`dict[str:float]`:

-   正常返回一个dict类型字段，包含所有信用资产信息
-   异常返回空dict，如{}

**信用资产包含以下信息(相应字段无数据时返回None)**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `assure_asset` | `float` | 担保资产 |
| `total_debit` | `float` | 负债总额 |
| `enable_bail_balance` | `float` | 可用保证金 |
| `assure_enbuy_balance` | `float` | 买担保品可用资金 |
| `fin_enrepaid_balance` | `float` | 现金还款可用资金 |
| `fin_max_quota` | `float` | 融资额度上限 |
| `fin_enable_quota` | `float` | 融资可用额度 |
| `fin_used_quota` | `float` | 融资已用额度 |
| `fin_compact_balance` | `float` | 融资合约金额 |
| `fin_compact_fare` | `float` | 融资合约费用 |
| `fin_compact_interest` | `float` | 融资合约利息 |
| `slo_enable_quota` | `float` | 融券可用额度 |
| `slo_compact_fare` | `float` | 融券合约费用 |
| `slo_compact_interest` | `float` | 融券合约利息 |

md

```md
{
    'slo_compact_fare': 0.0,
    'assure_asset': 22647586233.8,
    'fin_compact_interest': 0.0,
    'fin_used_quota': 424057.23,
    'slo_compact_interest': 0.59,
    'fin_enable_quota': 575942.77,
    'assure_enbuy_balance': 15796927.64,
    'fin_enrepaid_balance': 15796927.64,
    'total_debit': 288878.59,
    'fin_compact_fare': 0.0,
    'slo_enable_quota': 751589.0,
    'enable_bail_balance': 16638502122.05,
    'fin_max_quota': 1000000.0,
    'fin_compact_balance': 156078.0
}
```

<a id="示例-11"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 获取信用资产信息
    asset = get_margin_asset()
    log.info(asset)
```

<a id="get_assure_security_list"></a>

### `get_assure_security_list`

<a id="中文名-12"></a>

#### 中文名

两融担保券查询

<a id="接口说明-12"></a>

#### 接口说明

该接口用于担保券查询，获取当前账号支持的两融担保券列表。

<a id="接口定义-12"></a>

#### 接口定义

python

```python
get_assure_security_list()
```

<a id="使用场景-12"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接顶点HTS柜台暂不支持该函数

<a id="返回-12"></a>

#### 返回

`list[str]`:

-   正常返回一个list类型字段，包含所有担保券代码
-   异常返回空list，如\[\]

md

```md
['000002.SZ', '000519.SZ', '600570.SS', '600519.SS']
```

<a id="示例-12"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 获取最新的担保券列表
    assure_security = get_assure_security_list()
    log.info(assure_security)
```

<a id="get_margincash_open_amount"></a>

### `get_margincash_open_amount`

<a id="中文名-13"></a>

#### 中文名

融资标的最大可买数量查询

<a id="接口说明-13"></a>

#### 接口说明

查询融资合约融资买入时标的证券的最大可买数量。

<a id="接口定义-13"></a>

#### 接口定义

python

```python
get_margincash_open_amount(security, price=None, cash_group=None)
```

<a id="使用场景-13"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-8"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`price`**

-   类型： `float`
-   默认： `None`

限定价格，选填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-13"></a>

#### 返回

`dict[str:int]`:

-   正常返回一个dict类型对象，key为股票代码，values为最大数量。
-   异常返回空dict，如{}

md

```md
{'600570.SS': 1900}
```

<a id="示例-13"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    # 查询恒生电子最大可融资买入数量
    margincash_open_dict = get_margincash_open_amount(security)
    if margincash_open_dict is not None:
        log.info(margincash_open_dict.get(security))
```

<a id="get_margincash_close_amount"></a>

### `get_margincash_close_amount`

<a id="中文名-14"></a>

#### 中文名

卖券还款标的最大可卖数量查询

<a id="接口说明-14"></a>

#### 接口说明

查询融资合约卖券还款时标的证券的最大可卖数量。

<a id="接口定义-14"></a>

#### 接口定义

python

```python
get_margincash_close_amount(security, price=None, cash_group=None)
```

<a id="使用场景-14"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-9"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`price`**

-   类型： `float`
-   默认： `None`

限定价格，选填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-14"></a>

#### 返回

`dict[str:int]`:

-   正常返回一个dict类型对象，key为股票代码，values为最大数量
-   异常返回空dict，如{}

md

```md
{'600570.SS': 1500}
```

<a id="示例-14"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    # 查询恒生电子最大可卖券还款数量
    margincash_close_dict = get_margincash_close_amount(security)
    if margincash_close_dict is not None:
        log.info(margincash_close_dict.get(security))
```

<a id="get_marginsec_open_amount"></a>

### `get_marginsec_open_amount`

<a id="中文名-15"></a>

#### 中文名

融券标的最大可卖数量查询

<a id="接口说明-15"></a>

#### 接口说明

查询融券合约融券卖出时标的证券的最大可卖数量。

<a id="接口定义-15"></a>

#### 接口定义

python

```python
get_marginsec_open_amount(security, price=None, cash_group=None)
```

<a id="使用场景-15"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-10"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`price`**

-   类型： `float`
-   默认： `None`

限定价格，选填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-15"></a>

#### 返回

`dict[str:int]`:

-   正常返回一个dict类型对象，key为股票代码，values为最大数量
-   异常返回空dict，如{}

md

```md
{'600570.SS': 2500}
```

<a id="示例-15"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600030.SS'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    # 查询中信证券最大可融券卖出数量
    marginsec_open_dict = get_marginsec_open_amount(security)
    if marginsec_open_dict is not None:
        log.info(marginsec_open_dict.get(security))
```

<a id="get_marginsec_close_amount"></a>

### `get_marginsec_close_amount`

<a id="中文名-16"></a>

#### 中文名

买券还券标的最大可买数量查询

<a id="接口说明-16"></a>

#### 接口说明

查询融券合约买券还券时标的证券的最大可买数量。

<a id="接口定义-16"></a>

#### 接口定义

python

```python
get_marginsec_close_amount(security, price=None, cash_group=None)
```

<a id="使用场景-16"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-11"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`price`**

-   类型： `float`
-   默认： `None`

限定价格，选填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-16"></a>

#### 返回

`dict[str:int]`:

-   正常返回一个dict类型对象，key为股票代码，values为最大数量
-   异常返回空dict，如{}

md

```md
{'600570.SS': 3000}
```

<a id="示例-16"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600030.SS'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    # 查询中信证券最大可买券还券数量
    marginsec_close_dict = get_marginsec_close_amount(security)
    if marginsec_close_dict is not None:
        log.info(marginsec_close_dict.get(security))
```

<a id="get_margin_entrans_amount"></a>

### `get_margin_entrans_amount`

<a id="中文名-17"></a>

#### 中文名

现券还券数量查询

<a id="接口说明-17"></a>

#### 接口说明

查询指定证券的现券还券最大可还数量，用于融券合约的现券还券操作。

<a id="接口定义-17"></a>

#### 接口定义

python

```python
get_margin_entrans_amount(security, cash_group=None)
```

<a id="使用场景-17"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-12"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-17"></a>

#### 返回

`dict[str:int]`:

-   正常返回一个dict类型对象，key为股票代码，values为最大数量
-   异常返回空dict，如{}

md

```md
{'600570.SS': 1300}
```

<a id="示例-17"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600030.SS'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    # 查询中信证券最大可现券还券数量
    margin_entrans_dict = get_margin_entrans_amount(security)
    if margin_entrans_dict is not None:
        log.info(margin_entrans_dict.get(security))
```

<a id="get_enslo_security_info"></a>

### `get_enslo_security_info`

<a id="中文名-18"></a>

#### 中文名

融券信息查询

<a id="接口说明-18"></a>

#### 接口说明

获取融券相关信息，包括融券保证金比例、可用数量、融券状态等。

<a id="接口定义-18"></a>

#### 接口定义

python

```python
get_enslo_security_info(cash_group=None)
```

<a id="使用场景-18"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-13"></a>

#### 参数

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-18"></a>

#### 返回

`dict[str:dict] | None`:

-   正常返回一个dict类型对象，key为股票代码，values为dict，包含返回的相关字段信息
-   异常返回None(NoneType)

**包含以下信息(相应字段无数据时返回None)**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `exchange_type` | `str` | 交易类别，仅包含1和2 |
| `slo_ratio` | `float` | 融券保证金比例 |
| `enable_amount` | `int` | 可用数量 |
| `real_buy_amount` | `int` | 回报买入数量 |
| `real_sell_amount` | `int` | 回报卖出数量 |
| `slo_status` | `str` | 融券状态，包括"0":正常，"1":暂停，"2":作废 |
| `cashgroup_prop` | `str` | 两融头寸性质，包括"1":普通，"2":专项 |

md

```md
{
    '688001.SS': {
        'slo_status': '0',
        'real_buy_amount': 0,
        'cashgroup_prop': '1',
        'enable_amount': 100000000000000,
        'slo_ratio': 0.6,
        'real_sell_amount': 0,
        'exchange_type': '1'
    },
    '010303.SS': {
        'slo_status': '0',
        'real_buy_amount': 0,
        'cashgroup_prop': '1',
        'enable_amount': 100000000000000,
        'slo_ratio': 0.6,
        'real_sell_amount': 0,
        'exchange_type': '1'
    },
    '810004': {
        'slo_status': '0',
        'real_buy_amount': 0,
        'cashgroup_prop': '1',
        'enable_amount': 10000,
        'slo_ratio': 0.6,
        'real_sell_amount': 0,
        'exchange_type': '9'
    }
}
```

<a id="示例-18"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 获取融券信息
    info = get_enslo_security_info()
    log.info(info)
```

<a id="get_crdt_fund"></a>

### `get_crdt_fund`

<a id="中文名-19"></a>

#### 中文名

可融资金查询

<a id="接口说明-19"></a>

#### 接口说明

获取账户可融资金信息，包括可用资金、回报买入金额和回报卖出金额等。

<a id="接口定义-19"></a>

#### 接口定义

python

```python
get_crdt_fund(cash_group=None)
```

<a id="使用场景-19"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-14"></a>

#### 参数

**`cash_group`**

-   类型： `int`
-   默认： `None`

[两融头寸性质](help-engine-e187e04d.md#cash_group)，1-普通头寸，2-专项头寸，选填字段，不填默认为1-普通头寸

<a id="返回-19"></a>

#### 返回

`dict[str:float]`:

-   正常返回一个dict类型字段，包含所有可融资金信息
-   异常返回None

**包含以下信息(相应字段无数据时返回None)**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `nable_balance` | `float` | 可用资金 |
| `real_buy_balance` | `float` | 回报买入金额 |
| `real_sell_balance` | `float` | 回报卖出金额 |

md

```md
{
    'enable_balance': 68258.96,
    'real_sell_balance': 446720.12,
    'real_buy_balance': 491809.45
}
```

<a id="示例-19"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 获取可融资金信息
    fund = get_crdt_fund()
    log.info(fund)
```

* * *

说明

接口支持的业务范围以及支持在引擎的哪些流程函数中调用，详见 [接口列表](http://101.71.132.53:9091/qthelp/api/list.html)
