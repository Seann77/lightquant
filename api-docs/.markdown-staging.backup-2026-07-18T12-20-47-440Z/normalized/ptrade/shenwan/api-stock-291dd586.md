---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 现货交易类接口
section_path:
  - 现货专用接口
  - 现货交易类接口
source_file: api-docs/raw/ptrade/shenwan/10_api_stock.html
source_url: http://101.71.132.53:9091/qthelp/api/stock.html
source_anchor: "#现货交易类接口"
source_sha256: ddf9524069d23afe5bf97ae287e70df82de6435d1b8b78f13c7bf6c288414e73
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="现货专用接口"></a>

# 现货专用接口

<a id="现货交易类接口"></a>

## 现货交易类接口

<a id="order"></a>

### `order`

<a id="中文名"></a>

#### 中文名

股票买卖委托

<a id="接口说明"></a>

#### 接口说明

买卖指定数量的证券，支持股票、ETF、可转债等证券的限价或市价交易，同时支持逆回购交易。

<a id="接口定义"></a>

#### 接口定义

python

```python
order(security, amount, limit_price=None)
```

注意事项

1.  支持交易场景的逆回购交易。[委托方向](help-engine-e187e04d.md#entrust_bs)为卖出(amount必须为负数)，逆回购最小申购金额为1000元(10张)，因此本接口amount入参应大于等于10(10张)，否则会导致委托失败。
2.  回测场景，amount有最小下单数量校验，股票、ETF、LOF：100股，可转债：10张；交易场景接口不做amount校验，直接报柜台。
3.  交易场景如果limit\_price字段不入参，系统会默认用行情快照数据最新价报单，假如行情快照获取失败会导致委托失败，系统会在日志中增加提醒。
4.  由于下述原因，回测中实际买入或者卖出的股票数量有时候可能与委托设置的不一样，针对上述内容调整，系统会在日志中增加警告信息：

-   根据委托买入数量与价格经计算后的资金数量，大于当前可用资金。
-   委托卖出数量大于当前可用持仓数量。
-   每次交易股票时取整100股，交易可转债时取整10张，但是卖出所有股票时不受此限制。
-   股票停牌、股票未上市或者退市、股票不存在。
-   回测中每天结束时会取消所有未完成交易。

<a id="使用场景"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数"></a>

#### 参数

**`security`**

-   类型： `str`

证券代码，交易市场代码作为后缀，比如`600570.XSHG`，选填字段

**`amount`**

-   类型： `int`

下单数量，正数表示买入，负数表示卖出，选填字段

**`limit_price`**

-   类型： `float|None`
-   默认值： `None`

买卖限价，选填字段

<a id="返回值"></a>

#### 返回值

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    # 以系统最新价委托
    order('600570.XSHG', 100)
    # 逆回购1000元
    order('131810.XSHE', -10)
    # 以39块价格下一个限价单
    order('600570.XSHG', 100, limit_price=39)
```

<a id="order_target"></a>

### `order_target`

<a id="中文名-1"></a>

#### 中文名

指定目标数量买卖

<a id="接口说明-1"></a>

#### 接口说明

该接口用于买卖股票，直到股票最终数量达到指定的amount。

<a id="接口定义-1"></a>

#### 接口定义

python

```python
order_target(security, amount, limit_price=None)
```

<a id="使用场景-1"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

1.  该函数不支持逆回购交易。

2.  该函数在委托股票时取整100股，委托可转债时取整10张。

3.  交易场景如果limit\_price字段不入参，系统会默认用行情快照数据最新价报单，假如行情快照获取失败会导致委托失败，系统会在日志中增加提醒。

4.  该接口的使用有场景限制，回测可以正常使用，交易谨慎使用。回测场景下撮合是引擎计算的，因此成交之后持仓信息的更新是瞬时的，但交易场景下信息的更新依赖于柜台数据的返回，无法做到瞬时同步，可能造成重复下单。具体原因如下：


-   柜台返回持仓数据体现当日变化(由柜台配置决定)：交易场景中持仓信息同步有时滞，一般在6秒左右，假如在这6秒之内连续下单两笔或更多order\_target委托，由于持仓数量不会瞬时更新，会造成重复下单。
-   柜台返回持仓数据体现当日变化(由柜台配置决定)：第一笔委托未完全成交，如果不对第一笔做撤单再次order\_target相同的委托目标数量，引擎不会计算包括在途的总委托数量，也会造成重复下单。
-   柜台返回持仓数据不体现当日变化(由柜台配置决定)：这种情况下持仓数量只会一天同步一次，必然会造成重复下单。

1.  针对以上几种情况，假如要在交易场景使用该接口，首先要确定券商柜台的配置，是否实时更新持仓情况，其次需要增加订单和持仓同步的管理，来配合order\_target使用。

<a id="参数-1"></a>

#### 参数

**`security_list`**

-   类型： `str`

股票列表，必填字段

**`amount`**

-   类型： `int`

期望的最终数量，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，选填字段，不填时，获取行情快照数据最新价报单

<a id="返回"></a>

#### 返回

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例-1"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    #买卖恒生电子股票数量到100股
    order_target('600570.XSHG', 100)
    #卖出恒生电子所有股票
    if data['600570.XSHG']['close'] > 39:
        order_target('600570.XSHG', 0)
```

<a id="order_value"></a>

### `order_value`

<a id="中文名-2"></a>

#### 中文名

指定目标价值买卖

<a id="接口说明-2"></a>

#### 接口说明

该接口用于买卖指定价值为value的股票。

<a id="接口定义-2"></a>

#### 接口定义

python

```python
order_value(security, value, limit_price=None)
```

<a id="使用场景-2"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

1.  该函数不支持逆回购交易。

2.  该函数在委托股票时取整100股，委托可转债时取整10张。

3.  交易场景如果limit\_price字段不入参，系统会默认用行情快照数据最新价报单，假如行情快照获取失败会导致委托失败，系统会在日志中增加提醒。


<a id="参数-2"></a>

#### 参数

**`security_list`**

-   类型： `str`

股票列表，必填字段

**`value`**

-   类型： `float`

期望的股票最终价值，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，选填字段，不填时，获取行情快照数据最新价报单

<a id="返回-1"></a>

#### 返回

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例-2"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    #买入价值为10000元的恒生电子股票
    order_value('600570.XSHG', 10000)

    if data['600570.XSHG']['close'] > 39:
        #卖出价值为10000元的恒生电子股票
        order_value('600570.XSHG', -10000)
```

<a id="order_target_value"></a>

### `order_target_value`

<a id="中文名-3"></a>

#### 中文名

指定持仓市值买卖

<a id="接口说明-3"></a>

#### 接口说明

该接口用于调整股票持仓市值到value价值。

<a id="接口定义-3"></a>

#### 接口定义

python

```python
order_target_value(security, value, limit_price=None)
```

<a id="使用场景-3"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

1.  该函数不支持逆回购交易。

2.  该函数在委托股票时取整100股，委托可转债时取整10张。

3.  交易场景如果limit\_price字段不入参，系统会默认用行情快照数据最新价报单，假如行情快照获取失败会导致委托失败， 系统会在日志中增加提醒。

4.  该接口的使用有场景限制，回测可以正常使用，交易谨慎使用。回测场景下撮合是引擎计算的，因此成交之后持仓信息的更新是瞬时的，但交易场景下信息的更新依赖于柜台数据的返回，无法做到瞬时同步，可能造成重复下单。具体原因如下：


-   柜台返回持仓数据体现当日变化(由柜台配置决定)：交易场景中持仓信息同步有时滞，一般在6秒左右，假如在这6秒之内连续下单两笔或更多order\_target\_value委托，由于持仓市值不会瞬时更新，会造成重复下单。
-   柜台返回持仓数据体现当日变化(由柜台配置决定)：第一笔委托未完全成交，如果不对第一笔做撤单再次order\_target\_value相同的委托目标金额，引擎不会计算包括在途的总委托数量，也会造成重复下单。
-   柜台返回持仓数据不体现当日变化(由柜台配置决定)：这种情况下持仓金额只会一天同步一次，必然会造成重复下单。

1.  针对以上几种情况，假如要在交易场景使用该接口，首先要确定券商柜台的配置，是否实时更新持仓情况，其次需要增加订单和持仓同步的管理，来配合order\_target\_value使用。

<a id="参数-3"></a>

#### 参数

**`security_list`**

-   类型： `str`

股票列表，必填字段

**`value`**

-   类型： `float`

期望的股票最终价值，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，选填字段，不填时，获取行情快照数据最新价报单

<a id="返回-2"></a>

#### 返回

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例-3"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '000001.XSHE']
    set_universe(g.security)

def handle_data(context, data):
    #买卖股票到指定价值
    order_target_value('600570.XSHG', 10000)

    #卖出当前所有恒生电子的股票
    if data['600570.XSHG']['close'] > 39:
        order_target_value('600570.XSHG', 0)
```

<a id="order_market"></a>

### `order_market`

<a id="中文名-4"></a>

#### 中文名

市价委托交易

<a id="接口说明-4"></a>

#### 接口说明

使用市价委托方式进行股票买卖交易，支持多种[市价委托类型](help-engine-e187e04d.md#market_type)。

<a id="接口定义-4"></a>

#### 接口定义

python

```python
order_market(security, amount, market_type, limit_price=None)
```

<a id="使用场景-4"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  支持逆回购交易。[委托方向](help-engine-e187e04d.md#entrust_bs)为卖出(amount必须为负数)，逆回购最小申购金额为1000元(10张)，因此本接口amount入参应大于等于10(10张)，否则会导致委托失败。

2.  不支持可转债交易。

3.  该函数中market\_type是必传字段，如不传入参数会出现报错。

4.  该函数委托上证股票时limit\_price是必传字段，如不传入参数会出现报错。


<a id="参数-4"></a>

#### 参数

**`security`**

-   类型： `str`

股票代码，必填字段

**`amount`**

-   类型： `int`

交易数量，正数表示买入，负数表示卖出，必填字段

**`market_type`**

-   类型： `int`

[市价委托类型](help-engine-e187e04d.md#market_type)，上证股票支持参数0、1、2、4，深证股票支持参数0、2、3、4、5，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

保护限价，选填字段，委托上证股票时必传参数

<a id="返回-3"></a>

#### 返回

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例-4"></a>

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
        # 以35保护限价按对手方最优价格买入100股
        order_market(g.security, 100, 0, 35)
        # 以35保护限价按最优五档即时成交剩余转限价买入100股
        order_market(g.security, 100, 1, 35)
        # 以35保护限价按本方最优价格买入100股
        order_market(g.security, 100, 2, 35)
        # 以35保护限价按最优五档即时成交剩余撤销买入100股
        order_market(g.security, 100, 4, 35)

        # 按对手方最优价格买入100股
        order_market("000001.XSHE", 100, 0)
        # 按本方最优价格买入100股
        order_market("000001.XSHE", 100, 2)
        # 按即时成交剩余撤销买入100股
        order_market("000001.XSHE", 100, 3)
        # 按最优五档即时成交剩余撤销买入100股
        order_market("000001.XSHE", 100, 4)
        # 按全额成交或撤单买入100股
        order_market("000001.XSHE", 100, 5)
        g.flag = True
```

<a id="after_trading_order"></a>

### `after_trading_order`

<a id="中文名-5"></a>

#### 中文名

盘后固定价委托(股票)

<a id="接口说明-5"></a>

#### 接口说明

该接口用于盘后固定价委托申报。

<a id="接口定义-5"></a>

#### 接口定义

python

```python
after_trading_order(security, amount, entrust_price)
```

<a id="使用场景-5"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接ATP柜台不支持该函数。

<a id="参数-5"></a>

#### 参数

**`security_list`**

-   类型： `str`

股票列表，必填字段

**`amount`**

-   类型： `int`

交易数量，正数表示买入，负数表示卖出，必填字段

**`entrust_price`**

-   类型： `float`

委托价格，必填字段

<a id="返回-4"></a>

#### 返回

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例-5"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "300001.XSHE"
    set_universe(g.security)
    # 15:00-15:30期间使用run_daily进行盘后固定价委托
    run_daily(context, order_test, time="15:15")
    g.flag = False

def order_test(context):
    snapshot = get_snapshot(g.security)
    if snapshot is not None:
        last_px = snapshot[g.security].get("last_px", 0)
        if last_px > 0:
            after_trading_order(g.security, 200, float(last_px))

def handle_data(context, data):
    if not g.flag:
        snapshot = get_snapshot(g.security)
        if snapshot is not None:
            last_px = snapshot[g.security].get("last_px", 0)
            if last_px > 0:
                after_trading_order(g.security, 200, float(last_px))
                g.flag = True
```

<a id="after_trading_cancel_order"></a>

### `after_trading_cancel_order`

<a id="中文名-6"></a>

#### 中文名

盘后固定价委托撤单(股票)

<a id="接口说明-6"></a>

#### 接口说明

该接口用于盘后固定价委托取消订单，根据[Order对象](help-engine-19502d4e.md#Order)或order\_id取消订单。

<a id="接口定义-6"></a>

#### 接口定义

python

```python
after_trading_cancel_order(order_param)
```

<a id="使用场景-6"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接ATP柜台不支持该函数。

<a id="参数-6"></a>

#### 参数

**`order_param`**

-   类型： `Order/str`

[Order对象](help-engine-19502d4e.md#Order)或者order\_id

<a id="返回-5"></a>

#### 返回

None

<a id="示例-6"></a>

#### 示例

python

```python
import time

def initialize(context):
    g.security = "300001.XSHE"
    set_universe(g.security)
    # 15:00-15:30期间使用run_daily进行盘后固定价委托、盘后固定价委托撤单
    run_daily(context, order_test, time="15:15")
    g.flag = False

def order_test(context):
    snapshot = get_snapshot(g.security)
    if snapshot is not None:
        last_px = snapshot[g.security].get("last_px", 0)
        if last_px > 0:
            order_id = after_trading_order(g.security, 200, float(last_px))
            time.sleep(5)
            after_trading_cancel_order(order_id)


def handle_data(context, data):
    if not g.flag:
        snapshot = get_snapshot(g.security)
        if snapshot is not None:
            last_px = snapshot[g.security].get("last_px", 0)
            if last_px > 0:
                order_id = after_trading_order(g.security, 200, float(last_px))
                time.sleep(5)
                after_trading_cancel_order(order_id)
                g.flag = True
```

<a id="etf_basket_order"></a>

### `etf_basket_order`

<a id="中文名-7"></a>

#### 中文名

ETF成分券篮子下单

<a id="接口说明-7"></a>

#### 接口说明

该接口用于ETF成分券篮子下单。

<a id="接口定义-7"></a>

#### 接口定义

python

```python
etf_basket_order(etf_code ,amount, price_style=None, position=True, info=None)
```

<a id="使用场景-7"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接jz\_ufx、ATP、云订柜台不支持该函数。

<a id="参数-7"></a>

#### 参数

**`etf_code`**

-   类型： `str`

单支ETF代码，必填字段

**`amount`**

-   类型： `int`

下单篮子份数, 正数表示买入, 负数表示卖出，必填字段

**`price_style`**

-   类型： `str`
-   默认： `None`

设定委托价位，可传入’B1’、’B2’、’B3’、’B4’、’B5’、’S1’、’S2’、’S3’、’S4’、’S5’、’new’，分别为买一~买五、卖一~卖五、最新价，选填字段，默认为最新价

**`position`**

-   类型： `bool`
-   默认： `True`

仅在篮子买入时使用。申购是否使用持仓替代，True为使用，该情况下篮子股票买入时使用已有的持仓部分；False为不使用，选填字段，默认使用持仓替代

**`info`**

-   默认： `None`

-   类型： `Mapping[str, Mapping[str, Union[int, float]]]`


成份股信息。key为成分股代码，values为dict类型，包含的成分股信息字段作为key，选填字段：

-   cash\_replace\_flag -- 设定[现金替代标志](help-engine-e187e04d.md#cash_replace_flag)，1为替代，0为不替代，仅允许替代状态的标的传入有效，否则无效，如不传入info或不传入该字段信息系统默认为成分股不做现金替代
-   position\_replace\_flag -- 设定持仓替代标志，1为替代，0为不替代，如不传入info或不传入该字段信息按position参数的设定进行计算
-   limit\_price -- 设定委托价格，如不传入info或不传入该字段信息按price\_style参数的设定进行计算

<a id="返回-6"></a>

#### 返回

`dict[str:str]`:

-   创建订单成功，正常返回一个dict类型字段， key为股票代码，values为Order对象的id
-   失败则返回空dict{}

md

```md
{
    '600010.SS': '34e6733d26c14056b2096cafdec253b2',
    '600028.SS': '4299f7ad527842dd89f2a04cef48b935',
    '600030.SS': '1729b80b107d408d882a39814fef667d',
    '600031.SS': 'c17f28961d1248f0b914c62f2e44cd13',
    '600036.SS': 'ea7274a4e06349308f552d60181bbec8',
    '600048.SS': 'bd69c204a653483e975d2914c5fe5705',
    '600104.SS': 'ac8a890df68c453fb93333e19f58be91',
    '600111.SS': '9c9c5f604c2d43d396c811189699f072'
}
```

<a id="示例-7"></a>

#### 示例

python

```python
def initialize(context):
    g.security = get_Ashares()
    set_universe(g.security)

def handle_data(context, data):
    #ETF成分券篮子下单
    etf_basket_order('510050.SS' ,1, price_style='S3',position=True)
    stock_info = {'600000.SS':{'cash_replace_flag':1,'position_replace_flag':1,'limit_price':12}}
    etf_basket_order('510050.SS' ,1, price_style='S2',position=False, info=stock_info)
```

<a id="etf_purchase_redemption"></a>

### `etf_purchase_redemption`

<a id="中文名-8"></a>

#### 中文名

ETF基金申赎接口

<a id="接口说明-8"></a>

#### 接口说明

该接口用于单只ETF基金申赎。

<a id="接口定义-8"></a>

#### 接口定义

python

```python
etf_purchase_redemption(etf_code,amount,limit_price=None)
```

<a id="使用场景-8"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接jz\_ufx、ATP、云订柜台不支持该函数。

<a id="参数-8"></a>

#### 参数

**`etf_code`**

-   类型： `str`

单支ETF代码，必填字段

**`amount`**

-   类型： `int`

基金申赎数量, 正数表示申购, 负数表示赎回，必填字段

**`limit_price`**

-   类型： `float`
-   默认： `None`

买卖限价，选填字段，不填时，获取行情快照数据最新价报单

<a id="返回-7"></a>

#### 返回

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例-8"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '510050.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    #ETF申购
    etf_purchase_redemption('510050.XSHG',900000)
    #ETF赎回
    etf_purchase_redemption('510050.XSHG',-900000,limit_price = 2.9995)
```

<a id="monetary_fund_purchase_redemption"></a>

### `monetary_fund_purchase_redemption`

<a id="中文名-9"></a>

#### 中文名

货币基金申赎

<a id="接口说明-9"></a>

#### 接口说明

该接口用于单只货币基金申赎。

<a id="接口定义-9"></a>

#### 接口定义

python

```python
monetary_fund_purchase_redemption(fund_code, purchase_value=None, redemption_amount=None)
```

<a id="使用场景-9"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-9"></a>

#### 参数

**`fund_code`**

-   类型： `str`

单支货币基金代码，必填字段

**`purchase_value`**

-   类型： `int`
-   默认： `None`

申购资金，入参必须为正值，选填字段，与redemption\_amount选其一传值

**`redemption_amount`**

-   类型： `int`
-   默认： `None`

赎回数量，入参必须为正值，选填字段，与purchase\_value选其一传值

<a id="返回-8"></a>

#### 返回

`str|None`:

-   创建订单成功，则返回订单编号。对应`Order`对象中的`id`
-   创建订单失败，返回`None`

<a id="示例-9"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '519888.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 货币基金申购1000元
    monetary_fund_purchase_redemption(g.security, purchase_value=1000)
    # 货币基金赎回1份
    monetary_fund_purchase_redemption(g.security, redemption_amount=1)
```

<a id="ipo_stocks_order"></a>

### `ipo_stocks_order`

<a id="中文名-10"></a>

#### 中文名

新股/新债一键申购

<a id="接口说明-10"></a>

#### 接口说明

该接口用于一键申购当日全部新股/新债。

<a id="接口定义-10"></a>

#### 接口定义

python

```python
ipo_stocks_order(submarket_type=None, black_stocks=None)
```

<a id="使用场景-10"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  使用前请与券商确认柜台是否支持该函数.

2.  申购黑名单的股票代码必须为申购代码，代码可以是6位数(不带尾缀)，也可以带尾缀入参。比如：black\_stocks='787001' 或black\_stocks='787001.SS'。


<a id="参数-10"></a>

#### 参数

**`submarket_type`**

-   类型： `int`

[申购代码所属市场](help-engine-e187e04d.md#submarket_type)。选填字段，不传时默认申购全部新股/新债。

**`black_stocks`**

-   类型： `str/list`

黑名单股票，可以是单个股票/可转债或者股票/可转债列表，传入的黑名单股票/可转债将不做申购。选填字段，不传时默认申购全部新股/新债。

<a id="返回-9"></a>

#### 返回

`{"stock_code"(委托代码(str)): {"entrust_no": 委托编号(int), "entrust_status": 委托状态(int), "redemption_amount": 委托数量(int)}, ...}`:

-   成功时返回dict({"stock\_code"(委托代码(str)): {"entrust\_no": 委托编号(int), "entrust\_status": 委托状态(int), "redemption\_amount": 委托数量(int)}, ...})。
-   失败时返回空字典dict()。

md

```md
{
    '732116.SS': {
        'entrust_no': '205001',
        'entrust_status': 1,
        'redemption_amount': 1000
    },
    '732100.SS': {
        'entrust_no': '205002',
        'entrust_status': 1,
        'redemption_amount': 2000
    }
}
```

<a id="示例-10"></a>

#### 示例

python

```python
import time


def initialize(context):
    g.security = "600570.SS"
    set_universe(g.security)
    g.flag = False


def before_trading_start(context, data):
    g.flag = False


def handle_data(context, data):
    if not g.flag:
        # 上证普通代码
        log.info("申购上证普通代码：")
        ipo_stocks_order(submarket_type=0)
        time.sleep(5)
        # 上证科创板代码
        log.info("申购上证科创板代码：")
        ipo_stocks_order(submarket_type=1)
        time.sleep(5)
        # 深证普通代码
        log.info("申购深证普通代码：")
        ipo_stocks_order(submarket_type=2)
        time.sleep(5)
        # 深证创业板代码
        log.info("申购深证创业板代码：")
        ipo_stocks_order(submarket_type=3)
        time.sleep(5)
        # 可转债代码
        log.info("申购可转债代码：")
        ipo_stocks_order(submarket_type=4)
        time.sleep(5)
        g.flag = True
```

<a id="neeq_ipo_stocks_order"></a>

### `neeq_ipo_stocks_order`

<a id="中文名-11"></a>

#### 中文名

北交所新股申购(股票)

<a id="接口说明-11"></a>

#### 接口说明

该接口用于申购当日北交所新股。

<a id="接口定义-11"></a>

#### 接口定义

python

```python
neeq_ipo_stocks_order(order_info)
```

<a id="使用场景-11"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  不支持两融账户申购北交所新股。

<a id="参数-11"></a>

#### 参数

**`order_info`**

-   类型： `dict[str:int,str:int,...]`

委托信息(dict类型)，key为申购代码(str)，value为申购数量(int)，如：

md

```md
{"889913.NEEQ":1000, "889920.NEEQ":2000}
```

<a id="返回-10"></a>

#### 返回

`dict[str:dict[str:str,str:int,str:float],...]`:

-   返回dict类型，包含委托代码、委托编号、[委托状态](help-engine-e187e04d.md#status)(委托失败为0，委托成功为1)、委托数量等信息

md

```md
{
    '889913.NEEQ': {
        'entrust_no': '206001',
        'entrust_status': 1,
        'redemption_amount': 800
    },
    '889920.NEEQ': {
        'entrust_no': '206002',
        'entrust_status': 1,
        'redemption_amount': 1000
    }
}
```

<a id="示例-11"></a>

#### 示例

python

```python
def initialize(context):
    g.flag = False

def before_trading_start(context, data):
    g.flag = False

def handle_data(context, data):
    if not g.flag:
        # 获取北交所新股申购标的
        info = get_ipo_stocks()
        stock_list = info['北交所代码']
        # 创建北交所新股申购委托信息
        order_info = {}
        for stock in stock_list:
            order_info[stock] = 1000
        # 北交所新股申购
        neeq_ipo_stocks_order(order_info)
        g.flag = True
```
