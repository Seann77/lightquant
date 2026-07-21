---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 设置接口
section_path:
  - 系统接口
  - 设置接口
source_file: api-docs/raw/ptrade/shenwan/07_api_system.html
source_url: http://101.71.132.53:9091/qthelp/api/system.html
source_anchor: "#设置接口"
source_sha256: dd5b0e91a45ad4614bf4f9d8cfaf3bcc862fb84513c1860d5ddf55cc84dd1695
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="设置接口"></a>

## 设置接口

<a id="set_universe"></a>

### `set_universe`

<a id="中文名-2"></a>

#### 中文名

设置股票池

<a id="接口说明-2"></a>

#### 接口说明

用于设置或者更新此策略要操作的股票池。

<a id="接口定义-2"></a>

#### 接口定义

python

```python
set_universe(security_list)
```

<a id="使用场景-2"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

股票策略中，该函数只用于设定 get\_history 函数的默认 security\_list 入参;

期货策略中，会获取指定期货代码的交易时间，在指定期货代码的交易时间内执行handle\_data函数，不设置时默认以股票交易时间为准。

<a id="参数-2"></a>

#### 参数

**`security_list`**

-   类型： `list[str]/str`

股票列表，支持单支或者多支股票，必填字段

<a id="返回-2"></a>

#### 返回

`None`

<a id="示例-2"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ["600570.XSHG", "600571.XSHG"]
    # 将g.security中的股票设置为股票池
    set_universe(g.security)

def handle_data(context, data):
    # 获取初始化设定的股票池行情数据
    his = get_history(5, "1d", "close", security_list=None)
```

<a id="set_benchmark"></a>

### `set_benchmark`

<a id="中文名-3"></a>

#### 中文名

设置基准

<a id="接口说明-3"></a>

#### 接口说明

用于设置策略的比较基准，前端展现的策略评价指标都基于此处设置的基准标的。

<a id="接口定义-3"></a>

#### 接口定义

python

```python
set_benchmark(sids)
```

<a id="使用场景-3"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

注意事项

如果不做基准设置，默认选定沪深 300 指数(000300.XSHG)的每日价格作为判断策略好坏和一系列风险值计算的基准。如果要指定其他股票/指数/ETF 的价格作为基准，就需要使用 set\_benchmark。

<a id="参数-3"></a>

#### 参数

**`sids`**

-   类型： `str`

股票/指数/ETF/港股通代码，必填字段

<a id="返回-3"></a>

#### 返回

None

<a id="示例-3"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "000001.XSHE"
    set_universe(g.security)
    #将上证50（000016.XSHG）设置为参考基准
    set_benchmark("000016.XSHG")

def handle_data(context, data):
    order("000001.XSHE", 100)
```

<a id="set_commission"></a>

### `set_commission`

<a id="中文名-4"></a>

#### 中文名

设置佣金费率

<a id="接口说明-4"></a>

#### 接口说明

用于设置佣金费率。

<a id="接口定义-4"></a>

#### 接口定义

python

```python
set_commission(commission_ratio=0.0003, min_commission=5.0, type="STOCK")
```

<a id="使用场景-4"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

注意事项

1.  关于回测手续费计算：手续费=佣金费+经手费+印花税。
2.  佣金费=佣金费率\*交易总金额(若佣金费计算后小于设置的最低佣金，则佣金费取最小佣金)。
3.  经手费=经手费率(万分之 0.487)\*交易总金额。
4.  印花税=印花税率(千分之1)\*交易总金额，仅卖出时收。

<a id="参数-4"></a>

#### 参数

**`commission_ratio`**

-   类型： `float`
-   默认： `0.0003`

佣金费率，默认股票每笔交易的佣金费率是万分之三，ETF 基金、LOF 基金每笔交易的佣金费率是万分之八，选填字段

**`min_commission`**

-   类型： `float`
-   默认： `5.0`

最低交易佣金，默认每笔交易最低扣 5 元佣金，选填字段

**`type`**

-   类型： `str`
-   默认： `STOCK`

交易类型，不传参默认为 STOCK(目前只支持 STOCK, ETF, LOF)，选填字段

<a id="返回-4"></a>

#### 返回

`None`

<a id="示例-4"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    #将佣金费率设置为万分之三，将最低手续费设置为3元
    set_commission(commission_ratio=0.0003, min_commission=3.0)

def handle_data(context, data):
    pass
```

<a id="set_fixed_slippage"></a>

### `set_fixed_slippage`

<a id="中文名-5"></a>

#### 中文名

设置固定滑点

<a id="接口说明-5"></a>

#### 接口说明

用于设置固定滑点，滑点在真实交易场景是不可避免的，因此回测中设置合理的滑点有利于让回测逼近真实场景。

<a id="接口定义-5"></a>

#### 接口定义

python

```python
set_fixed_slippage(fixedslippage=0.0)
```

<a id="使用场景-5"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

<a id="参数-5"></a>

#### 参数

**`fixedslippage`**

-   类型： `float`
-   默认： `0.0`

固定滑点，委托价格与最后的成交价格的价差设置，这个价差是一个固定的值(比如 0.02 元，撮合成交时委托价格 ±0.01 元)。最终的成交价格=委托价格 ±float(fixedslippage)/2，选填字段

<a id="返回-5"></a>

#### 返回

`None`

<a id="示例-5"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    # 将滑点设置为固定的0.2元，即原本买入交易的成交价为10元，则设置之后成交价将变成10.1元或9.9元
    set_fixed_slippage(fixedslippage=0.2)

def handle_data(context, data):
    pass
```

<a id="set_slippage"></a>

### `set_slippage`

<a id="中文名-6"></a>

#### 中文名

设置滑点

<a id="接口说明-6"></a>

#### 接口说明

用于设置滑点比例，滑点在真实交易场景是不可避免的，因此回测中设置合理的滑点有利于让回测逼近真实场景。

<a id="接口定义-6"></a>

#### 接口定义

python

```python
set_slippage(slippage=0.1)
```

<a id="使用场景-6"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

<a id="参数-6"></a>

#### 参数

**`slippage`**

-   类型： `float`
-   默认： `0.1`

滑点比例，委托价格与最后的成交价格的价差设置，这个价差是当时价格的一个百分比(比如设置 0.002 时，撮合成交时委托价格 ± 当前周期价格\*0.001)。最终成交价格=委托价格 ± 委托价格\*float(slippage)/2，选填字段

<a id="返回-6"></a>

#### 返回

`None`

<a id="示例-6"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    # 将滑点设置为0.002
    set_slippage(slippage=0.002)

def handle_data(context, data):
    pass
```

<a id="set_volume_ratio"></a>

### `set_volume_ratio`

<a id="中文名-7"></a>

#### 中文名

设置成交比例

<a id="接口说明-7"></a>

#### 接口说明

用于设置回测中单笔委托的成交比例，使得盘口流动性方面的设置尽量逼近真实交易场景。

<a id="接口定义-7"></a>

#### 接口定义

python

```python
set_volume_ratio(volume_ratio=0.25)
```

<a id="使用场景-7"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

注意事项

假如委托下单数量大于成交比例计算后的数量，系统会按成交比例计算后的数量撮合，差额部分委托数量不会继续挂单。

<a id="参数-7"></a>

#### 参数

**`volume_ratio`**

-   类型： `float`
-   默认： `0.25`

设置成交比例，即指本周期最大成交数量为本周期市场可成交总量的四分之一，选填字段

<a id="返回-7"></a>

#### 返回

`None`

<a id="示例-7"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    #将最大成交数量设置为本周期可成交总量的二分之一
    set_volume_ratio(volume_ratio=0.5)

def handle_data(context, data):
    pass
```

<a id="set_limit_mode"></a>

### `set_limit_mode`

<a id="中文名-8"></a>

#### 中文名

设置成交数量限制模式

<a id="接口说明-8"></a>

#### 接口说明

用于设置回测的成交数量限制模式。对于月度调仓等低频策略，对流动性冲击不是很敏感，不做成交量限制可以让回测更加便捷。

<a id="接口定义-8"></a>

#### 接口定义

python

```python
set_limit_mode(limit_mode="LIMIT")
```

<a id="使用场景-8"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

注意事项

不做限制之后实际撮合成交量是可以大于该时间段的实际成交总量。

<a id="参数-8"></a>

#### 参数

**`limit_mode`**

-   类型： `str`
-   默认： `LIMIT`

设置成交数量限制模式，即指回测撮合交易时对成交数量是否做限制进行控制，选填字段

默认为限制，入参"LIMIT"，不做限制则入参"UNLIMITED"

<a id="返回-8"></a>

#### 返回

`None`

<a id="示例-8"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    #回测中不限制成交数量
    set_limit_mode("UNLIMITED")

def handle_data(context, data):
    pass
```

<a id="set_yesterday_position"></a>

### `set_yesterday_position`

<a id="中文名-9"></a>

#### 中文名

设置底仓

<a id="接口说明-9"></a>

#### 接口说明

用于设置回测的初始底仓。

<a id="接口定义-9"></a>

#### 接口定义

python

```python
set_yesterday_position(poslist)
```

<a id="使用场景-9"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

注意事项

该函数会使策略初始化运行就创建出持仓对象，里面包含了设置的持仓信息。

<a id="参数-9"></a>

#### 参数

**`poslist`**

-   类型： `list[dict[str:str],...]`

list 类型数据，该 list 中是字典类型的元素，参数不能为空，必填字段

数据格式及参数字段如下：

```json
[{
    "sid":标的代码,
    "amount":持仓数量,
    "enable_amount":可用数量,
    "cost_basis":每股的持仓成本价格,
}]
```

参数也可通过 csv 文件的形式传入，参考接口[convert\_position\_from\_csv](api-system-74e7aaca.md#convert_position_from_csv)

<a id="返回-9"></a>

#### 返回

`None`

<a id="示例-9"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    # 设置底仓
    pos={}
    pos["sid"] = "600570.XSHG"
    pos["amount"] = "1000"
    pos["enable_amount"] = "600"
    pos["cost_basis"] = "55"
    set_yesterday_position([pos])

def handle_data(context, data):
    #卖出100股
    order(g.security,-100)
```

<a id="set_parameters"></a>

### `set_parameters`

<a id="中文名-10"></a>

#### 中文名

设置策略配置参数

<a id="接口说明-10"></a>

#### 接口说明

用于设置策略中的配置参数，包括：交易中节假日是否执行 before\_trading\_start；tick\_data 中 data 是否包含 order 和 transcation；策略中是否接收非本交易产生的主推；交易时间段若服务器重启，是否自动执行重新拉起本交易；若服务器重启导致重拉交易，是否重复执行 before\_trading\_start 函数。

<a id="接口定义-10"></a>

#### 接口定义

python

```python
set_parameters(**kwargs)
```

<a id="使用场景-10"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1、该函数入参格式必须为 a=b 样式。

2、not\_restart\_trade、server\_restart\_not\_do\_before 两个入参必须在 initialize 模块中设置

3、not\_restart\_trade 入参配置说明(交易场景务必了解)：

服务器环境重启拉起交易时，initialize 和 before\_trading\_start 函数会被重复调用，请务必检查策略编写逻辑：

(1)避免在这两个函数中设置无法被系统持久化保存的变量，变量一旦被初始化会导致策略逻辑异常。

(2)避免在这两个函数中调用委托接口，造成重复委托。

您可将 not\_restart\_trade 入参设置为 1，在交易时间段避免重复执行的问题，交易时间段默认为 09:00-11:30、13:00-15:30，实际以券商的配置为准。

4、server\_restart\_not\_do\_before 入参配置说明(交易场景务必了解)：

服务器环境重启拉起交易时，before\_trading\_start 函数默认会被调用，为了避免重复调用带来的一系列问题(同上)，您可将 server\_restart\_not\_do\_before 入参设置为"1"，即一个交易日内 before\_trading\_start 函数仅调用一次。

<a id="参数-10"></a>

#### 参数

**`holiday_not_do_before`**

-   类型： `str`
-   默认： `0`

交易中节假日是否执行 before\_trading\_start。缺省，执行；1，不执行。

**`tick_data_no_l2`**

-   类型： `str`
-   默认： `0`

tick\_data 中 data 是否包含 order 和 transcation。缺省，包含；1，不包含。

**`receive_other_response`**

-   类型： `str`
-   默认： `0`

策略中是否接收非本交易产生的主推。缺省，不接收；1，接收。

**`receive_cancel_response`**

-   类型： `str`
-   默认： `0`

策略中是否接收撤单委托产生的主推。缺省，不接收；1，接收。

**`not_restart_trade`**

-   类型： `str`
-   默认： `0`

交易时间段若服务器重启，是否自动执行重新拉起本交易。缺省，执行；1，不执行。

**`server_restart_not_do_before`**

-   类型： `str`
-   默认： `0`

若服务器重启导致重拉交易，是否重复执行 before\_trading\_start 函数。缺省，执行；1，不执行。

<a id="返回-10"></a>

#### 返回

`None`

<a id="示例-10"></a>

#### 示例

python

```python
def initialize(context):
    # 初始化策略
    g.security = "600570.XSHG"
    set_universe(g.security)
    # 设置非交易日不执行before_trading_start
    # 设置tick_data中data不包含order和transaction
    # 设置接收非本交易产生的主推
    # 设置接收撤单委托产生的主推
    set_parameters(holiday_not_do_before="1", tick_data_no_l2="1", receive_other_response="1",
                   receive_cancel_response="1", not_restart_trade="1", server_restart_not_do_before="1")

def before_trading_start(context, data):
    log.info("do before_trading_start")
    g.count = 0

def on_order_response(context, order_list):
    log.info("委托主推：%s" % order_list)

def on_trade_response(context, trade_list):
    log.info("成交主推：%s" % trade_list)

def tick_data(context, data):
    if g.count == 0:
        log.info(data[g.security])
        g.count += 1

def handle_data(context, data):
    pass
```

<a id="set_email_info"></a>

### `set_email_info`

<a id="中文名-11"></a>

#### 中文名

设置邮件信息

<a id="接口说明-11"></a>

#### 接口说明

该函数用于设置邮件信息，当交易报错终止时会发送提示邮件。

<a id="接口定义-11"></a>

#### 接口定义

python

```python
set_email_info(email_address, smtp_code, email_subject)
```

<a id="使用场景-11"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  如要使用该函数，需咨询券商当前环境是否支持发送邮件。

2.  当前仅支持设置QQ邮箱地址。


<a id="参数-11"></a>

#### 参数

**`email_address`**

-   类型： `str`

邮箱地址(发送方与接收方一致)，必填字段

**`smtp_code`**

-   类型： `str`

邮箱SMTP授权码，必填字段

**`email_subject`**

-   类型： `str`

邮件主题，必填字段

<a id="返回-11"></a>

#### 返回

`bool`:

-   正常返回True
-   失败返回False

<a id="示例-11"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    # 设置邮件信息
    set_email_info("2222@qq.com", "AABB", "【PTrade量化-策略交易异常终止提醒】")

def before_trading_start(context, data):
    raise BaseException("test send error email")

def handle_data(context, data):
    pass
```
