---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 查询类接口
section_path:
  - 业务公共接口
  - 查询类接口
source_file: api-docs/raw/ptrade/shenwan/09_api_trade.html
source_url: http://101.71.132.53:9091/qthelp/api/trade.html
source_anchor: "#查询类接口"
source_sha256: 8a04ed1d625ea8c951d9993f12891a7e4604b0f774adba136bc4aa5b3159a315
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="查询类接口"></a>

## 查询类接口

<a id="get_order"></a>

### `get_order`

<a id="中文名-7"></a>

#### 中文名

获取指定订单

<a id="接口说明-7"></a>

#### 接口说明

该接口用于获取指定编号订单。

<a id="接口定义-7"></a>

#### 接口定义

python

```python
get_order(order_id)
```

<a id="使用场景-7"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-7"></a>

#### 参数

**`order_id`**

-   类型： `str`

-   订单编号，必填字段


<a id="返回-7"></a>

#### 返回

`list[Order]`:

-   返回一个list，该list中只包含一个Order对象，如：

python

```python
[<Order {'id': '52e6a3f8a2b7468e92258c52dfcb6d42', 'dt': datetime.datetime(2025, 2, 21, 11, 25, 1, 229575), 'priceGear': 0, 'limit': 34.1, 'symbol': '600570.XSHG', 'amount': 1000, 'created': datetime.datetime(2025, 2, 21, 11, 25, 1, 229575), 'filled': 0, 'status': '2', 'entrust_no': '3596', 'cancel_entrust_no': None}>]
```

<a id="示例-7"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    order_id = order(g.security, 100)
    current_order = get_order(order_id)
    log.info(current_order)
```

<a id="get_open_orders"></a>

### `get_open_orders`

<a id="中文名-8"></a>

#### 中文名

获取未完成订单

<a id="接口说明-8"></a>

#### 接口说明

该接口用于获取当天所有未完成的订单，或按条件获取指定未完成的订单。

<a id="接口定义-8"></a>

#### 接口定义

python

```python
get_open_orders(security=None)
```

<a id="使用场景-8"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

1.  该接口仅支持获取本策略内的订单

2.  未完成的状态(status(str))包括以下类型:


-   '0' -- "未报"
-   '1' -- "待报"
-   '2' -- "已报"
-   '3' -- "已报待撤"
-   '4' -- "部成待撤"
-   '7' -- "部成"

<a id="参数-8"></a>

#### 参数

**`security`**

-   类型： `str`

-   默认： `None`

-   标的代码，如'600570.XSHG'，选填字段，不传时默认为获取所有未成交订单


<a id="返回-8"></a>

#### 返回

`list[Order,...]`:

-   返回一个list，该list中包含多个Order对象，如：

python

```python
[<Order {'id': '52e6a3f8a2b7468e92258c52dfcb6d42', 'dt': datetime.datetime(2025, 2, 21, 11, 25, 1, 229575), 'priceGear': 0, 'limit': 34.1, 'symbol': '600570.XSHG', 'amount': 1000, 'created': datetime.datetime(2025, 2, 21, 11, 25, 1, 229575), 'filled': 0, 'status': '2', 'entrust_no': '3596', 'cancel_entrust_no': None}>]
```

<a id="示例-8"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    for _sec in g.security:
        _id = order(_sec, 100, limit_price = 30)
    # 当运行周期为分钟则可获取本周期及之前所有未完成的订单
    dict_list = get_open_orders()
    log.info(dict_list)

# 当运行周期为天，可在after_trading_end中调用此函数获取当天未完成的订单
def after_trading_end(context, data):
    dict_list = get_open_orders()
    log.info(dict_list)
```

<a id="get_orders"></a>

### `get_orders`

<a id="中文名-9"></a>

#### 中文名

获取全部订单

<a id="接口说明-9"></a>

#### 接口说明

该接口用于获取策略内所有订单，或按条件获取指定订单。

<a id="接口定义-9"></a>

#### 接口定义

python

```python
get_orders(security=None)
```

<a id="使用场景-9"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-9"></a>

#### 参数

**`security`**

-   类型： `str`

-   默认： `None`

-   标的代码，如'600570.XSHG'，选填字段，不传时默认为获取所有订单


<a id="返回-9"></a>

#### 返回

`list[Order,...]`:

-   返回一个list，该list中包含多个Order对象，如：

python

```python
[<Order {'id': '52e6a3f8a2b7468e92258c52dfcb6d42', 'dt': datetime.datetime(2025, 2, 21, 11, 25, 1, 229575), 'priceGear': 0, 'limit': 34.1, 'symbol': '600570.XSHG', 'amount': 1000, 'created': datetime.datetime(2025, 2, 21, 11, 25, 1, 229575), 'filled': 0, 'status': '2', 'entrust_no': '3596', 'cancel_entrust_no': None}>]
```

<a id="示例-9"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    order(g.security, 100)
    order(g.security, 200)
    current_order = get_orders(g.security)
    log.info(current_order)
```

<a id="get_all_orders"></a>

### `get_all_orders`

<a id="中文名-10"></a>

#### 中文名

获取账户当日全部订单

<a id="接口说明-10"></a>

#### 接口说明

该接口用于获取账户当日所有订单(包含非本交易的订单记录)，或按条件获取指定代码的订单。

<a id="接口定义-10"></a>

#### 接口定义

python

```python
get_all_orders(security=None)
```

<a id="使用场景-10"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   该函数返回账户当日在柜台的全部委托记录，不能查询策略中待报、未报状态的委托。
-   该函数返回的可撤委托仅可通过[cancel\_order\_ex](api-trade-74a4b542.md#cancel_order_ex)函数进行撤单，且非本交易的委托进行撤单仅可通过本函数查询[委托状态](help-engine-e187e04d.md#status)更新。
-   股票、两融、港股通业务返回的amount字段区分正负值，卖出为负数；期货业务返回的amount字段不区分正负值，均为正数。

<a id="参数-10"></a>

#### 参数

**`security`**

-   类型： `str`

-   默认： `None`

-   标的代码，如'600570.XSHG'，选填字段，不传时默认为获取所有订单


<a id="返回-10"></a>

#### 返回

`list[Order,...]`:

-   返回一个list，该list中包含多条订单记录

-   股票、两融、港股通返回如下：


python

```python
[{'symbol': , 'entrust_no': , 'amount': , 'entrust_bs': , 'price': , 'status': , 'filled_amount': , 'entrust_time': }, ...]
```

-   期货返回如下：

python

```python
[{'symbol': , 'entrust_no': , 'amount': , 'entrust_bs': , 'price': , 'status': , 'filled_amount': , 'entrust_time': , 'futures_direction': }, ...]
```

-   字段含义如下：

-   symbol： 标的代码(str)

-   entrust\_no： 委托编号(str)

-   amount： 委托数量(int)

-   entrust\_bs： [委托方向](help-engine-e187e04d.md#entrust_bs)(int)；

-   price： 委托价格(float)

-   status： [委托状态](help-engine-e187e04d.md#status)(str)；

-   filled\_amount： 成交数量(int)

-   entrust\_time： 委托时间(str)

-   futures\_direction： 期货开平仓类型，期货专用(str)


<a id="示例-10"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 获取账户当日委托600570代码的全部订单
    log.info('当日委托600570代码的全部订单：%s' % get_all_orders(g.security))
    # 获取账户当日全部订单
    log.info('当日全部订单：%s' % get_all_orders())
```

<a id="get_trades"></a>

### `get_trades`

<a id="中文名-11"></a>

#### 中文名

获取当日成交订单

<a id="接口说明-11"></a>

#### 接口说明

该接口用于获取策略内当日已成交订单详情。

<a id="接口定义-11"></a>

#### 接口定义

python

```python
get_trades()
```

<a id="使用场景-11"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

-   为减小对柜台压力，该函数在股票/港股通交易模块中同一分钟内多次调用返回当前分钟首次查询的缓存数据。
-   该接口会返回当日截止到当前时间段内的成交数据。
-   一个订单编号会对应一笔或多笔成交记录。
-   不同品种返回字段不同。
-   股票标的代码尾缀为四位，上证为XSHG，深圳为XSHE，如需对应到代码请做代码尾缀兼容。
-   获取国债逆回购成交详情时，成交价格字段实际为回购利率。

<a id="返回-11"></a>

#### 返回

`dict{str: list[list[], list[], ...]`:

-   返回一个订单编号的一笔或多笔成交，其中：

python

```python
# 股票、港股通返回字段格式（dict格式）
{
    '订单编号': [
        [
            成交编号,
            委托编号,
            标的代码,
            买卖类型,
            成交数量,
            成交价格,
            成交金额,
            成交时间
        ]
    ]
}

# 期货返回字段格式（dict格式）
{
    '订单编号': [
        [
            成交编号,
            委托编号,
            标的代码,
            买卖类型,
            开平仓类型,
            成交数量,
            成交价格,
            成交金额,
            成交时间
        ]
    ]
}

- 成交编号：str类型
- 委托编号：str类型
- 标的代码：str类型
- 买卖类型：str类型
- 开平仓类型：开仓、平仓、平今仓，仅支持衍生品业务，str类型
- 成交数量：float类型
- 成交价格：float类型
- 成交金额：float类型
- 成交时间：YYYY-mm-dd HH:MM:SS格式，str类型
```

python

```python
# 实际返回示例（dict格式）
{
    'ba6a80d9746347a99c050b29069807c7': [
        [
            '5001',                    # 成交编号
            '700001',                  # 委托编号
            '600570.XSHG',            # 标的代码
            '买',                      # 买卖类型
            100000.0,                 # 成交数量
            86.60,                    # 成交价格
            8660000.0,                # 成交金额
            '2021-08-15 09:32:00'     # 成交时间
        ]
    ]
}
```

<a id="示例-11"></a>

#### 示例

python

```python
def initialize(context):
    # 初始化策略
    g.security = "600570.XSHG"
    set_universe(g.security)

def before_trading_start(context, data):
    g.count = 0

def handle_data(context, data):
    if g.count == 0:
        # 按照回购利率1.76委托国债逆回购
        order("204001.XSHG", -1000, 1.76)
        g.count += 1
    log.info(get_trades())
```

<a id="get_position"></a>

### `get_position`

<a id="中文名-12"></a>

#### 中文名

获取单只标的持仓信息

<a id="接口说明-12"></a>

#### 接口说明

该接口用于获取某个标的持仓信息详情。

<a id="接口定义-12"></a>

#### 接口定义

python

```python
get_position(security)
```

<a id="使用场景-12"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-11"></a>

#### 参数

**`security`**

-   类型： `str`

-   标的代码，如'600570.SS'，必填字段


支持品种：

-   股票
-   ETF
-   LOF
-   期货
-   港股通

<a id="返回-12"></a>

#### 返回

`Position`:

-   返回一个Position对象，如：

python

```python
<Position {
    'business_type': 'stock',
    'short_amount': 0,
    'contract_multiplier': 1,
    'short_pnl': 0,
    'delivery_date': None,
    'today_short_amount': 0,
    'last_sale_price': 118.7,
    'sid': '600570.SS',
    'enable_amount': 100,
    'margin_rate': 1,
    'amount': 200,
    'long_amount': 0,
    'short_cost_basis': 0,
    'today_long_amount': 0,
    'cost_basis': 117.9,
    'long_pnl': 0,
    'long_cost_basis': 0
}>
```

<a id="示例-12"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    position = get_position(g.security)
    log.info(position)
```

<a id="get_positions"></a>

### `get_positions`

<a id="中文名-13"></a>

#### 中文名

持仓查询

<a id="接口说明-13"></a>

#### 接口说明

获取多个标的的持仓信息详情，支持按标的代码查询或获取全部持仓信息。

<a id="接口定义-13"></a>

#### 接口定义

python

```python
get_positions(security=None)
```

<a id="使用场景-13"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

四位尾缀或者两位尾缀代码皆可作为键取到返回的数据字典值，如'600570.XSHG'或者'600570.SS'。

<a id="参数-12"></a>

#### 参数

**`security`**

-   类型： `list[str]/str`

-   默认： `None`

-   标的代码，可以是一个列表，选填字段，不传时默认为获取所有持仓


支持品种：

-   股票
-   ETF
-   LOF
-   期货
-   港股通

<a id="返回-13"></a>

#### 返回

`dict[str:Position]`:

-   返回一个数据字典，键为标的代码，值为Position对象，如：

python

```python
{
    '600570.SS': <Position {
        'business_type': 'stock',
        'short_amount': 0,
        'contract_multiplier': 1,
        'short_pnl': 0,
        'delivery_date': None,
        'today_short_amount': 0,
        'last_sale_price': 118.7,
        'sid': '600570.SS',
        'enable_amount': 100,
        'margin_rate': 1,
        'amount': 200,
        'long_amount': 0,
        'short_cost_basis': 0,
        'today_long_amount': 0,
        'cost_basis': 117.9,
        'long_pnl': 0,
        'long_cost_basis': 0
    }>
}
```

<a id="示例-13"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.SS','600000.SS']
    set_universe(g.security)

def handle_data(context, data):
    log.info(get_positions('600570.SS'))
    log.info(get_positions(g.security))
    log.info(get_positions())
```

<a id="get_all_positions"></a>

### `get_all_positions`

<a id="中文名-14"></a>

#### 中文名

获取全部持仓信息

<a id="接口说明-14"></a>

#### 接口说明

获取当前账户的持仓信息详情，包括股票、融资融券、期货、港股通等所有持仓信息。

<a id="接口定义-14"></a>

#### 接口定义

python

```python
get_all_positions()
```

<a id="使用场景-14"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   因不同柜台返回的字段存在差异，当该接口返回的字段不在返回字段描述中时请咨询券商人员。
-   不同柜台返回的字段值类型不一致，比如不同柜台返回的enable\_amount类型有可能为str/float/int，需要策略中对此做兼容。
-   该接口返回当前账户所有的持仓信息，包含国债逆回购产生的新标准券、打新中签尚未上市等量化不支持标的的持仓。
-   为减小对柜台压力，该函数返回的是缓存的账户定时同步持仓查询数据。

<a id="返回-14"></a>

#### 返回

`list[dict[],...]`:

-   返回一个列表，包含不同标的字典类型的持仓信息。不同交易类型返回不同字段的持仓信息，如：

md

```md
[
    {
        'position_str': '0111900000000001926516100010000000000A027483621600010',
        'fund_account': '19265161',
        'exchange_type': '1',
        'stock_account': 'A027483621',
        'stock_code': '600010',
        'stock_name': '包钢股份',
        'stock_type': '0',
        'current_amount': 8300.0,
        'enable_amount': 0.0,
        'last_price': 1.86,
        'cost_price': 1.862,
        'keep_cost_price': 1.862,
        'income_balance': -18.22,
        'hand_flag': '0',
        'market_value': 15438.0,
        'av_buy_price': 0.0,
        'av_income_balance': 0.0,
        'client_id': '19265161',
        'cost_balance': 15443.25,
        'hold_amount': 0.0,
        'uncome_buy_amount': 0.0,
        'uncome_sell_amount': 0.0,
        'entrust_sell_amount': 0.0,
        'real_buy_amount': 8300.0,
        'real_sell_amount': 0.0,
        'asset_price': 1.86,
        'delist_flag': '0',
        'delist_date': 0,
        'par_value': 1.0,
        'income_balance_nofare': -5.25,
        'frozen_amount': 0.0,
        'profit_ratio': -0.11,
        'sub_stock_type': '!',
        'stbtrans_type': ' ',
        'stb_layer_flag': ' ',
        'av_cost_price': 1.861,
        'income_flag': ' ',
        'real_sell_balance': 0.0,
        'real_buy_balance': 15443.25,
        'sum_buy_amount': 0.0,
        'sum_buy_balance': 0.0,
        'sum_sell_amount': 0.0,
        'sum_sell_balance': 0.0,
        'correct_amount': 0.0,
        'stbtrans_flag': ' ',
        'stock_name_long': '包钢股份',
        'pre_dr_price': 1.86,
        'close_price': 1.86,
        'hold_cost_price': 1.861,
        'comb_hold_flag': '0',
        'store_unit': 1
    }
]
```

-   股票

md

```md
    exchange_type  交易类别
    stock_code  证券代码
    stock_name  证券名称
    stock_type  证券类别
    hold_amount  持有数量
    current_amount  当前数量
    enable_amount  可用数量
    real_buy_amount  回报买入数量
    real_sell_amount  回报卖出数量
    uncome_buy_amount  未回买入数量
    uncome_sell_amount  未回卖出数量
    entrust_sell_amount  委托卖出数量
    last_price  最新价
    cost_price  成本价
    keep_cost_price  保本价
    income_balance  盈亏金额
    market_value  证券市值
    av_buy_price  买入均价
    av_income_balance  实现盈亏
    cost_balance  持仓成本
    delist_flag  退市标志
    delist_date  退市日期
    income_balance_nofare  无费用盈亏
    frozen_amount  冻结数量
    profit_ratio  盈亏比例(%)
    asset_price  市值价
    av_cost_price  摊薄成本价
```

-   港股通

md

```md
    exchange_type  交易类别
    stock_code  证券代码
    stock_name  证券名称
    stock_type  证券类别
    hold_amount  持有数量
    current_amount  当前数量
    enable_amount  可用数量
    real_buy_amount  回报买入数量
    real_sell_amount  回报卖出数量
    uncome_buy_amount  未回买入数量
    uncome_sell_amount  未回卖出数量
    entrust_sell_amount  委托卖出数量
    last_price  最新价
    cost_price  成本价
    keep_cost_price  保本价
    income_balance  盈亏金额
    market_value  证券市值
    av_buy_price  买入均价
    av_income_balance  实现盈亏
    cost_balance  持仓成本
    delist_flag  退市标志
    delist_date  退市日期
    par_value  面值
    frozen_amount  冻结数量
    profit_ratio  盈亏比例(%)
```

-   融资融券

md

```md
    exchange_type  交易类别
    stock_code  证券代码
    stock_name  证券名称
    current_amount  当前数量
    hold_amount  持有数量
    enable_amount  可用数量
    last_price  最新价
    cost_price  成本价
    income_balance  盈亏金额
    income_balance_nofare  无费用盈亏
    market_value  证券市值
    av_buy_price  买入均价
    av_income_balance  实现盈亏
    cost_balance  持仓成本
    uncome_buy_amount  未回买入数量
    uncome_sell_amount  未回卖出数量
    entrust_sell_amount  委托卖出数量
    real_buy_amount  回报买入数量
    real_sell_amount  回报卖出数量
    asset_price  市值价
    assure_ratio  担保折算率
    profit_ratio  盈亏比例(%)
    sum_buy_amount  累计买入数量
    sum_buy_balance  累计买入金额
    sum_sell_amount  累计卖出数量
    sum_sell_balance  累计卖出金额
    real_buy_balance  回报买入金额
    real_sell_balance  回报卖出金额
    av_cost_price  摊薄成本价
```

-   期货

md

```md
    futu_exch_type  交易类别
    futu_code  合约代码
    entrust_bs  委托方向
    begin_amount  期初数量
    enable_amount  可用数量
    real_enable_amount  当日开仓可用数量
    hold_income_float  持仓浮动盈亏
    hold_income  期货盯市盈亏
    hold_margin  持仓保证金
    average_price  平均价
    average_hold_price  持仓均价
    tas_average_hold_price  TAS持仓均价
    futu_last_price  最新价格
    hedge_type  投机/套保类型
    real_amount  成交数量
    real_open_balance  回报开仓金额
    old_open_balance  老仓持仓成交额
    real_current_amount  今总持仓
    old_current_amount  老仓持仓数量
    tas_current_amount  TAS持仓数量
    combinable_amount  可组合持仓数量
```

-   其中，delist\_date：默认为0。

<a id="示例-14"></a>

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
        # 打印当前账户全部持仓
        log.info(get_all_positions())
        g.flag = True
```

<a id="get_deliver"></a>

### `get_deliver`

<a id="中文名-15"></a>

#### 中文名

获取历史交割单信息

<a id="接口说明-15"></a>

#### 接口说明

该接口用来获取账户历史交割单信息。

<a id="接口定义-15"></a>

#### 接口定义

python

```python
get_deliver(start_date, end_date)
```

<a id="使用场景-15"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   仅支持查询上一个交易日(包含)之前的交割单信息。
-   因不同柜台返回的字段存在差异，因此接口返回的为柜台原数据，使用时请根据实际柜台信息做字段解析。
-   该接口仅支持查询普通股票账户(非两融)。
-   对接ATP柜台不支持该函数。

<a id="参数-13"></a>

#### 参数

**`start_date`**

-   类型： `str`

-   开始日期，输入形式仅支持"YYYYmmdd"，如'20170620'，必填字段


**`end_date`**

-   类型： `str`

-   结束日期，输入形式仅支持"YYYYmmdd"，如'20170620'，必填字段


<a id="返回-15"></a>

#### 返回

`list[dict,...]`:

-   返回一个list类型对象，包含一个或N个dict，每个dict为一条交割单信息，其中包含柜台返回的字段信息，失败则返回空list\[\]，如：

md

```md
[
    {
        'entrust_way': '7',
        'exchange_fare': 0.04,
        'post_balance': 3539128.83,
        'stock_account': '0010110920',
        'exchange_farex': 0.0,
        'fare0': 0.5,
        'report_milltime': 110400187,
        'business_balance': 2987.0,
        'exchange_fare5': 0.0,
        'fare_remark': '内部:.5( | ,费用类别:9999)',
        'client_id': '10110920',
        'uncome_flag': '0',
        'exchange_fare0': 0.03,
        'exchange_fare2': 0.0,
        'fare1': 0.0,
        'init_date': 20210811,
        'stock_code': '162605',
        'occur_amount': 1000.0,
        'report_time': 110400,
        'entrust_bs': '1',
        'seat_no': '123456',
        'business_id': '0110351000000242',
        'business_amount': 1000.0,
        'business_time': 110351,
        'fund_account': '10110920',
        'begin_issueno': ' ',
        'post_amount': 1000.0,
        'correct_amount': 0.0,
        'money_type': '0',
        'client_name': '客户10110920',
        'business_type': '0',
        'business_flag': 4002,
        'clear_balance': -2987.5,
        'exchange_fare1': 0.0,
        'date_back': 20210811,
        'branch_no': 1011,
        'serial_no': 153,
        'occur_balance': -2987.5,
        'stock_name': '景顺鼎益',
        'curr_time': 173028,
        'exchange_fare4': 0.0,
        'brokerage': 0.0,
        'business_name': '证券买入',
        'order_id': 'F04Z',
        'business_times': 1,
        'entrust_date': 20210811,
        'remark': '证券买入;uft节点:31;',
        'exchange_fare6': 0.0,
        'standard_fare0': 0.5,
        'exchange_fare3': 0.01,
        'farex': 0.0,
        'clear_fare0': 0.46,
        'entrust_no': '38',
        'profit': 0.0,
        'exchange_type': '2',
        'fare2': 0.0,
        'business_no': 181,
        'stock_type': 'L',
        'fare3': 0.0,
        'business_status': '0',
        'business_price': 2.987,
        'position_str': '020210811010110000000153',
        'stock_name_long': '景顺鼎益LOF',
        'report_no': '38',
        'correct_balance': 0.0,
        'exchange_rate': 0.0
    }
]
```

<a id="示例-15"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def before_trading_start(context, data):
    h = get_deliver('20210101', '20211117')
    log.info(h)

def handle_data(context, data):
    pass
```

<a id="get_fundjour"></a>

### `get_fundjour`

<a id="中文名-16"></a>

#### 中文名

获取历史资金流水信息

<a id="接口说明-16"></a>

#### 接口说明

该接口用来获取账户历史资金流水信息。

<a id="接口定义-16"></a>

#### 接口定义

python

```python
get_fundjour(start_date, end_date)
```

<a id="使用场景-16"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   仅支持查询上一个交易日(包含)之前的资金流水信息。
-   因不同柜台返回的字段存在差异，因此接口返回的为柜台原数据，使用时请根据实际柜台信息做字段解析。
-   该接口仅支持查询普通股票账户(非两融)。
-   对接jz\_ufx、ATP、云订柜台不支持该函数。

<a id="参数-14"></a>

#### 参数

**`start_date`**

-   类型： `str`

-   开始日期，输入形式仅支持"YYYYmmdd"，如'20170620'，必填字段


**`end_date`**

-   类型： `str`

-   结束日期，输入形式仅支持"YYYYmmdd"，如'20170620'，必填字段


<a id="返回-16"></a>

#### 返回

`list[dict,...]`:

-   返回一个list类型对象，包含一个或N个dict，每个dict为一条资金流水，其中包含柜台返回的字段信息，失败则返回空list\[\]，如：

md

```md
[
    {
        'post_balance': 3260341.36,
        'init_date': 20210104,
        'asset_prop': '0',
        'serial_no': 1,
        'business_flag': 4002,
        'occur_balance': -10598.21,
        'exchange_type': '0',
        'stock_name': ' ',
        'business_date': 20210104,
        'business_price': 0.0,
        'bank_no': '0',
        'occur_amount': 0.0,
        'remark': '证券买入,恒生电子,100股,价格105.93',
        'stock_account': ' ',
        'money_type': '0',
        'fund_account': '10110920',
        'position_str': '20210104010110000000001',
        'bank_name': '内部银行',
        'business_name': '证券买入',
        'stock_code': ' ',
        'curr_date': 20210104,
        'entrust_bs': ' ',
        'business_time': 171730
    }
]
```

<a id="示例-16"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def before_trading_start(context, data):
    h = get_fundjour('20210101', '20211117')
    log.info(h)

def handle_data(context, data):
    pass
```

<a id="get_lucky_info"></a>

### `get_lucky_info`

<a id="中文名-17"></a>

#### 中文名

获取历史中签信息

<a id="接口说明-17"></a>

#### 接口说明

该接口用于获取指定时间范围内的中签信息。

<a id="接口定义-17"></a>

#### 接口定义

python

```python
get_lucky_info(start_date, end_date)
```

<a id="使用场景-17"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   为减小对柜台压力，该函数在股票交易模块中同一分钟内多次调用返回当前分钟首次查询的缓存数据。
-   对接jz\_ufx柜台不支持该函数。

<a id="参数-15"></a>

#### 参数

**`start_date`**

-   类型： `str`

-   开始日期，输入形式仅支持"YYYYmmdd"，如'20170620'，必填字段


**`end_date`**

-   类型： `str`

-   结束日期，输入形式仅支持"YYYYmmdd"，如'20170620'，必填字段


<a id="返回-17"></a>

#### 返回

`list[dict,...]`:

-   正常返回一个列表套字典数据，异常或无中签信息时返回一个空列表，正常数据如：

md

```md
[
    {
        'stock_code': 证券代码(str),
        'occur_amount': 发生数量(float),
        'business_price': 成交价格(float),
        'stock_name': 证券名称(str),
        'init_date': 交易日期(int)
    },
    ...
]

[
    {
        'stock_code': '371002.XZ',
        'occur_amount': 10.0,
        'business_price': 100.0,
        'stock_name': '崧盛发债',
        'init_date': 20220928
    },
    ...
]
```

<a id="示例-17"></a>

#### 示例

python

```python
def initialize(context):
    # 初始化策略
    g.security = "600570.SS"
    set_universe(g.security)

def before_trading_start(context, data):
    pre_date = str(get_trading_day(-1)).replace("-", "")
    current_date = context.blotter.current_dt.strftime("%Y%m%d")
    # 获取上一交易日至今天中签信息
    lucky_info = get_lucky_info(pre_date, current_date)
    log.info(lucky_info)

def handle_data(context, data):
    pass
```

* * *

说明

接口支持的业务范围以及支持在引擎的哪些流程函数中调用，详见 [接口列表](http://101.71.132.53:9091/qthelp/api/list.html)
