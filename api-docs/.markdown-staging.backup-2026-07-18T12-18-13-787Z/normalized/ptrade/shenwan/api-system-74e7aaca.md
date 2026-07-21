---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 其他接口
section_path:
  - 系统接口
  - 其他接口
source_file: api-docs/raw/ptrade/shenwan/07_api_system.html
source_url: http://101.71.132.53:9091/qthelp/api/system.html
source_anchor: "#其他接口"
source_sha256: dd5b0e91a45ad4614bf4f9d8cfaf3bcc862fb84513c1860d5ddf55cc84dd1695
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="其他接口"></a>

## 其他接口

<a id="log"></a>

### `log`

<a id="中文名-12"></a>

#### 中文名

日志记录

<a id="接口说明-12"></a>

#### 接口说明

用于打印日志，与 python 的 logging 模块用法一致。

<a id="接口定义-12"></a>

#### 接口定义

python

```python
log.debug("debug")
log.info("info")
log.warning("warning")
log.error("error")
log.critical("critical")
```

<a id="使用场景-12"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-12"></a>

#### 参数

参数可以是字符串、对象等。

<a id="返回-12"></a>

#### 返回

`None`

<a id="示例-12"></a>

#### 示例

python

```python
# 打印出一个格式化后的字符串
g.security='600570.XSHG'
log.info("Selling %s, amount=%s" % (g.security, 10000))
```

<a id="is_trade"></a>

### `is_trade`

<a id="中文名-13"></a>

#### 中文名

业务代码场景判断

<a id="接口说明-13"></a>

#### 接口说明

用于提供业务代码执行场景判断依据，明确标识当前业务代码运行场景为回测还是交易。因部分函数仅限回测或交易场景使用，该函数可以协助区分对应场景，以便限制函数可以在一套策略代码同时兼容回测与交易场景。

<a id="接口定义-13"></a>

#### 接口定义

python

```python
is_trade()
```

<a id="使用场景-13"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="返回-13"></a>

#### 返回

`bool`:

-   当前代码在交易中运行返回 True

-   当前代码在回测中运行返回 False


<a id="示例-13"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    _id = order(g.security, 100)

    if is_trade():
        log.info("当前运行场景：交易")
    else:
        log.info("当前运行场景：回测")
```

<a id="send_email"></a>

### `send_email`

<a id="中文名-14"></a>

#### 中文名

发送邮箱信息

<a id="接口说明-14"></a>

#### 接口说明

用于通过 QQ 邮箱发送邮件内容。

<a id="接口定义-14"></a>

#### 接口定义

python

```python
send_email(send_email_info, get_email_info, smtp_code, info='', path='', subject='')
```

<a id="使用场景-14"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1、该接口需要服务端连通外网，是否开通由所在券商决定

2、是否允许发送附件（即 path 参数），由所在券商的配置管理决定

3、邮件中接受到的附件为文件名而非附件路径

<a id="参数-13"></a>

#### 参数

**`send_email_info`**

-   类型： `str`

发送方的邮箱地址，必填字段，如:50xxx00@qq.com

**`get_email_info`**

-   类型： `list[str]/str`

接收方的邮箱地址，必填字段，如:\[50xxx00@qq.com, [1xxx10@126.com](mailto:1xxx10@126.com)\]

**`smtp_code`**

-   类型： `str`

邮箱的 smtp 授权码，注意，不是邮箱密码，必填字段

**`info`**

-   类型： `str`
-   默认： `""`

发送内容，选填字段

**`path`**

-   类型： `str`
-   默认： `""`

附件路径，选填字段，如: '/home/fly/notebook/stock.csv'

**`subject`**

-   类型： `str`
-   默认： `""`

邮件主题

<a id="返回-14"></a>

#### 返回

`None`

<a id="示例-14"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    #发送文字信息
    send_email('53xxxxxx7@qq.com', ['53xxxxx7@qq.com', 'Kxxxxn@126.com'], 'phfxxxxxxxxxxcd', info='今天的股票池信息')
```

<a id="send_qywx"></a>

### `send_qywx`

<a id="中文名-15"></a>

#### 中文名

发送企业微信信息

<a id="接口说明-15"></a>

#### 接口说明

该接口用于通过企业微信发送内容，使用方法请查看[企业微信功能使用手册](http://101.71.132.53:9091/qthelp/api/other/send_qywx_help.html)。

<a id="接口定义-15"></a>

#### 接口定义

python

```python
send_qywx(corp_id, secret, agent_id, info='', path='', toparty='', touser= '', totag= '')
```

<a id="使用场景-15"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1、该接口需要服务端连通外网，是否开通由所在券商决定

2、是否允许发送文件（即 path 参数），由所在券商的配置管理决定

3、企业微信不能同时发送文字和文件，当同时入参 info 和 path 的时候，默认发送文件

4、企业微信接受到的文件为文件名而非文件路径

5、2022年6月20日之后创建的应用由于需要配置企业可信ip(企业微信官方升级)导致企业微信功能不可用，该日期之前创建的应用仍可以正常使用

<a id="参数-14"></a>

#### 参数

**`corp_id`**

-   类型： `str`

企业 ID，必填字段

**`secret`**

-   类型： `str`

企业微信应用的密码，必填字段

**`agent_id`**

-   类型： `str`

企业微信应用的 ID，必填字段

**`info`**

-   类型： `str`
-   默认： `""`

发送内容，选填字段

**`path`**

-   类型： `str`
-   默认： `""`

附件路径，选填字段，如: '/home/fly/notebook/stock.csv'

**`toparty`**

-   类型： `str`
-   默认： `""`

发送对象为部门，选填字段，多个对象之间用'|' 符号分割

**`touser`**

-   类型： `str`
-   默认： `""`

发送内容为个人，选填字段，多个对象之间用'|' 符号分割

**`totag`**

-   类型： `str`
-   默认： `""`

发送内容为分组，选填字段，多个对象之间用'|' 符号分割

注意：toparty、touser、totag 如果都不传入，接口默认发送至应用中设定的第一个 toparty

<a id="返回-15"></a>

#### 返回

`None`

<a id="示例-15"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    #发送文字信息
    send_qywx('wwxxxxxxxxxxxxf9', 'hixxxxxxxxxxxxxxxxxxxBX8', '10xxxx3', info='已触发委托买入', toparty='1|2')
```

<a id="permission_test"></a>

### `permission_test`

<a id="中文名-16"></a>

#### 中文名

权限校验

<a id="接口说明-16"></a>

#### 接口说明

该接口用于账号和有效期的权限校验，用户可以在接口中入参指定账号和指定有效期截止日，策略运行时会校验运行策略的账户与指定账户是否相符，以及运行当日日期是否超过指定的有效期截止日，任一条件校验失败，接口都会返回 False，两者同时校验成功则返回 True。校验失败会在策略日志中提示原因。

<a id="接口定义-16"></a>

#### 接口定义

python

```python
permission_test(account=None, end_date=None)
```

<a id="使用场景-16"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

如果需要使用授权模式下载功能，不要在接口中入参，策略编码时候直接调用 permission\_test()，授权工具会把需要授权的账号和有效期信息放到策略文件中。

<a id="参数-15"></a>

#### 参数

**`account`**

-   类型： `str`
-   默认： `None`

授权账号，选填字段，如果不填就代表不需要验证账号

**`end_date`**

-   类型： `str`
-   默认： `None`

授权有效期截止日，选题字段，如果不填就代表不需要验证有效期，日期格式必须为'YYYYmmdd'的 8 位日期格式，如'20200101'

<a id="返回-16"></a>

#### 返回

`bool`:

-   校验成功返回 True

-   校验失败返回 False


<a id="示例-16"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)
def handle_data(context, data):
    pass
def after_trading_end(context, data):
    # 需要用授权模式下载功能的情况下不用入参
    flag = permission_test()
    if not flag:
        raise RuntimeError('授权不通过，终止程序，抛出异常')
    # 不需要用授权模式下载功能的情况下通过入参来进行授权校验
    flag = permission_test(account='10110922',end_date='20220101')
    if not flag:
        raise RuntimeError('授权不通过，终止程序，抛出异常')
```

<a id="check_strategy"></a>

### `check_strategy`

<a id="中文名-17"></a>

#### 中文名

检查策略内容

<a id="接口说明-17"></a>

#### 接口说明

该接口用于检查策略内容是否涉及升级过程中变动的API和Python库。

<a id="接口定义-17"></a>

#### 接口定义

python

```python
check_strategy(strategy_content=None, strategy_path=None)
```

<a id="使用场景-17"></a>

#### 使用场景

✅研究 ❌回测 ❌交易

注意事项

1.  每次版本升级后应当将使用的策略内容统一检查一遍。

2.  strategy\_content和strategy\_path都传入时仅对strategy\_content入参内容进行检查。

3.  如果传入strategy\_path，需要将对应策略文件上传至研究，且必须是utf-8编码的文本文件。

4.  如果日志打印策略内容涉及升级过程变动，需根据告警信息参考API接口说明调整策略内容。


<a id="参数-16"></a>

#### 参数

**`strategy_content`**

-   类型： `str`

策略内容, 选填字段

**`strategy_path`**

-   类型： `str`

策略路径, 选填字段

<a id="返回-17"></a>

#### 返回

`list`:

-   策略内容涉及升级过程中变动的API和Python库信息

接收到的数据如下：

json

```json
{
"api_change_list": [
    "margincash_open",
    "get_history",
    "get_fundamentals",
    "get_etf_info",
    "get_individual_transaction",
    "get_individual_transcation",
    "check_limit",
    "get_price",
    "get_snapshot",
    "on_trade_response",
    "set_parameters",
    "set_yesterday_position",
    "marginsec_open",
    "order_market",
    "margin_trade",
    "get_user_name",
    "debt_to_stock_order",
    "get_instruments",
    "get_margincash_open_amount",
    "get_all_orders",
    "run_interval",
    "get_trades",
    "margincash_close",
    "marginsec_close",
    "get_margin_assert",
    "ipo_stocks_order",
    "neeq_ipo_stocks_order",
    "get_enslo_security_info",
    "get_hks_unit_amount",
    "get_individual_entrust",
    "get_tick_direction",
    "get_margin_contractreal",
    "get_gear_price",
    "get_stock_status"],
"package_change_list": [
    "walrus",
    "keras",
    "pykalman",
    "arch",
    "cvxopt",
    "pulp"]，
}
```

<a id="示例-17"></a>

#### 示例

python

```python
check_strategy(strategy_content="""
import arch
import cvxopt
import keras
import pulp
import pykalman
import tensorflow
import walrus


def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    pos={}
    pos["sid"] = "600570.XSHG"
    pos["amount"] = "1000"
    pos["enable_amount"] = "600"
    pos["cost_basis"] = "55"
    set_yesterday_position([pos])
    run_interval(context, interval_handle, seconds=10)


def interval_handle(context):
    pass


def before_trading_start(context, data):
    get_history(100, frequency="1d", field=["close"], security_list=g.security)
    get_fundamentals(g.security, "balance_statement", "total_assets")
    get_etf_info("510020.XSHG")
    get_individual_transaction()
    get_individual_transcation()
    check_limit(g.security)
    get_price(g.security, start_date="20150101", end_date="20150131", frequency="1d")
    get_snapshot(g.security)
    set_parameters(holiday_not_do_before="1")
    get_user_name(False)
    get_instruments(g.security)
    get_all_orders()
    get_trades()
    get_margin_assert()
    get_enslo_security_info()
    get_hks_unit_amount("02899.XHKG-SS", "1")
    get_individual_entrust()
    get_tick_direction([g.security])
    get_margin_contractreal()
    get_gear_price(g.security)
    get_stock_status([g.security], "ST")


def on_trade_response(context, trade_list):
    pass


def handle_data(context, data):
    margincash_open(g.security, 100)
    marginsec_open(g.security, 100)
    order_market(g.security, 100, 0, 35)
    margin_trade(g.security, 100)
    get_margincash_open_amount(g.security)
    debt_to_stock_order("110033.XSHG", -1000)
    margincash_close(g.security, 100)
    marginsec_close(g.security, 100)
    ipo_stocks_order(submarket_type=0)
    neeq_ipo_stocks_order({"889913.NEEQ":1000})
""")
```

python

```python
check_strategy(strategy_path="./strategy.txt")
```

<a id="create_dir"></a>

### `create_dir`

<a id="中文名-18"></a>

#### 中文名

创建文件路径

<a id="接口说明-18"></a>

#### 接口说明

由于 PTrade量化 引擎禁用了 os 模块，因此用户无法在策略中通过编写代码实现子目录创建。用户可以通过此接口来创建文件的子目录路径。

<a id="接口定义-18"></a>

#### 接口定义

python

```python
create_dir(user_path=None)
```

<a id="使用场景-18"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

文件根目录路径为'/home/fly/notebook'。

<a id="参数-17"></a>

#### 参数

**`user_path`**

-   类型： `str`
-   默认： `None`

子目录路径，选填字段。

比如 user\_path='download'，会在研究中生成/home/fly/notebook/download 的目录；

比如 user\_path='download/2022'，会在研究中生成/home/fly/notebook/download/2022 的目录；

<a id="返回-18"></a>

#### 返回

`None`

<a id="示例-18"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)
    create_dir(user_path=g.security)
def handle_data(context, data):
    pass
```

<a id="get_research_path"></a>

### `get_research_path`

<a id="中文名-19"></a>

#### 中文名

获取研究路径

<a id="接口说明-19"></a>

#### 接口说明

该接口用于获取研究根目录路径，该路径为'/home/fly/notebook/'。

<a id="接口定义-19"></a>

#### 接口定义

python

```python
get_research_path()
```

<a id="使用场景-19"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="返回-19"></a>

#### 返回

`str`:

-   返回一个字符串类型对象

<a id="示例-19"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    path = get_research_path()

def handle_data(context, data):
    pass
```

<a id="get_frequency"></a>

### `get_frequency`

<a id="中文名-20"></a>

#### 中文名

获取当前业务代码的周期

<a id="接口说明-20"></a>

#### 接口说明

该接口用于返回当前业务代码的周期，如在周期为分钟的情况下执行回测或交易，该函数返回minute；在周期为每日的情况下执行回测或交易，该函数返回daily。

<a id="接口定义-20"></a>

#### 接口定义

python

```python
get_frequency()
```

<a id="使用场景-20"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="返回-20"></a>

#### 返回

`str`:

-   周期为分钟返回minute，周期为每日返回daily

<a id="示例-20"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)
    log.info(get_frequency())
def handle_data(context, data):
    pass
```

<a id="get_business_type"></a>

### `get_business_type`

<a id="中文名-21"></a>

#### 中文名

获取当前策略的业务类型

<a id="接口说明-21"></a>

#### 接口说明

该接口用于返回当前策略的业务类型。

<a id="接口定义-21"></a>

#### 接口定义

python

```python
get_business_type()
```

<a id="使用场景-21"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="返回-21"></a>

#### 返回

`str`:

-   策略业务类型：

1.  stock -- 股票

2.  rzrq -- 融资融券

3.  future -- 期货

4.  hks -- 港股通


<a id="示例-21"></a>

#### 示例

python

```python
def initialize(context):
    # 初始化策略
    g.security = "600570.XSHG"
    set_universe(g.security)


def before_trading_start(context, data):
    g.flag = False
    g.business_type = get_business_type()
    log.info("当前策略的业务类型为：%s" % g.business_type)


def handle_data(context, data):
    if g.flag is False:
        if g.business_type == "stock":
            order("600570.XSHG", 100)
        elif g.business_type == "future":
            buy_open("IF2309.CCFX", 1, 3816.0)
        g.flag = True
```

<a id="get_trade_name"></a>

### `get_trade_name`

<a id="中文名-22"></a>

#### 中文名

获取交易名称

<a id="接口说明-22"></a>

#### 接口说明

该接口用于获取当前交易的名称。

<a id="接口定义-22"></a>

#### 接口定义

python

```python
get_trade_name()
```

<a id="使用场景-22"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   当获取失败时，返回空字符串。

<a id="返回-22"></a>

#### 返回

`str`:

-   返回一个字符串类型对象

<a id="示例-22"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def handle_data(context, data):
    name = get_trade_name()
```

<a id="get_trades_file"></a>

### `get_trades_file`

<a id="中文名-23"></a>

#### 中文名

获取对账数据文件

<a id="接口说明-23"></a>

#### 接口说明

该接口用于获取对账数据文件。

<a id="接口定义-23"></a>

#### 接口定义

python

```python
get_trades_file(save_path='')
```

<a id="使用场景-23"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

注意事项

文件目录的命名需要遵守如下规则：

1、长度不能超过 256 个字符；

2、名称中不能出下如下字符：:?,@#$&();\\"\\'<>\`~!%^\*；

<a id="参数-18"></a>

#### 参数

**`save_path`**

-   类型： `str`
-   默认： `""`

导出对账数据存储的路径，选填字段，默认在 notebook 的根目录下

<a id="返回-23"></a>

#### 返回

`str|None`:

-   成功返回导出文件的路径

-   失败返回 `None`


python

```python
导出数据格式的说明:
交易数据文件的组织格式为csv文件，表头信息为：
订单编号，成交编号，委托编号，标的代码，交易类型，成交数量，成交价，成交金额，交易费用，交易时间，对应的表头字段为：
[order_id,trading_id,entrust_id,security_code,order_type,volume,price,total_money,trading_fee, trade_time]
```

注意：

order\_id 列中可能出现如下几种取值：

1、M000000，通过外部系统委托的成交数据；

2、类似 a6fbc145958843cc86639b23fbcfdc4c 的字符串，通过平台委托的成交数据；

3、H000000，引入对账数据接口前的版本产生的交易数据；

<a id="示例-23"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    # 委托
    order_obj = order(g.security, 100)
    log.info('订单编号为：%s'% order_obj)

def after_trading_end(context, data):
    # 获取对账数据，存放到默认目录
    data_path = get_trades_file()
    log.info(data_path)

    # 获取对账数据，存放到notebook下的指定目录
    user_data_path = get_trades_file('user_data/data')
    log.info(user_data_path)
```

<a id="convert_position_from_csv"></a>

### `convert_position_from_csv`

<a id="中文名-24"></a>

#### 中文名

获取设置底仓的参数列表(股票)

<a id="接口说明-24"></a>

#### 接口说明

该接口用于从 csv 文件中获取设置底仓的参数列表。

<a id="接口定义-24"></a>

#### 接口定义

python

```python
convert_position_from_csv(path)
```

<a id="使用场景-24"></a>

#### 使用场景

❌研究 ✅回测 ❌交易

注意事项

文件目录的命名需要遵守如下规则：

1、长度不能超过 256 个字符；

2、名称中不能出下如下字符：:?,@#$&();\\"\\'<>\`~!%^\*；

<a id="参数-19"></a>

#### 参数

**`path`**

-   类型： `str`

csv 文件对应路径及文件名(需要在研究中上传该文件)

csv 文件内容格式要求如下:

csv

```csv
    sid,enable_amount,amount,cost_basis
    600570.XSHG,10000,10000,45
```

<a id="返回-24"></a>

#### 返回

`list[dict[str:str],...]`:

-   用于设置底仓的参数列表，该 list 中是字典类型的元素；

返回一个 list，该 list 中是一个字典类型的元素，如：

```
[{
    'sid':标的代码,
    'amount':持仓数量,
    'enable_amount':可用数量,
    'cost_basis':每股的持仓成本价格,
}]
```

<a id="示例-24"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)
    # 设置底仓
    poslist= convert_position_from_csv("Poslist.csv")
    set_yesterday_position(poslist)

def handle_data(context, data):
    # 卖出100股
    order(g.security, -100)
```

<a id="filter_stock_by_status"></a>

### `filter_stock_by_status`

<a id="中文名-25"></a>

#### 中文名

过滤指定状态的股票代码

<a id="接口说明-25"></a>

#### 接口说明

该接口用于过滤指定状态的股票代码。

<a id="接口定义-25"></a>

#### 接口定义

python

```python
filter_stock_by_status(stocks, filter_type=["ST", "HALT", "DELISTING"], query_date=None)
```

<a id="使用场景-25"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

<a id="参数-20"></a>

#### 参数

**`stocks`**

-   类型： `list[str]/str`

单只代码或代码列表，必填字段

**`filter_type`**

-   类型： `list[str]/str`
-   默认： `["ST", "HALT", "DELISTING"]`

支持以下四种类型属性的过滤条件，选填字段

-   具体支持输入的字段包括 ：
    -   'ST' - 查询是否属于ST股票
    -   'HALT' - 查询是否停牌
    -   'DELISTING' - 查询是否退市
    -   'DELISTING\_SORTING' - 查询是否退市整理期(只过滤交易当日数据)

**`query_date`**

-   类型： `list[str]/str`
-   默认： `None`

格式为YYYYmmdd，默认为None,表示当前日期(回测为回测当前周期，研究与交易则取系统当前时间)，选填字段

<a id="返回-25"></a>

#### 返回

`list`:

-   股票列表（该列表已剔除符合任一指定状态的标的）

<a id="示例-25"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['123002.XSHE',"688500.XSHG","000001.XSHE", "603997.XSHG", '123181.XSHE']
    set_universe(g.security)

def before_trading_start(context, data):
    filter_stock = filter_stock_by_status(g.security, ["ST", "HALT", "DELISTING"])
    log.info(filter_stock)

def handle_data(context, data):
    pass
```

<a id="get_current_kline_count"></a>

### `get_current_kline_count`

<a id="中文名-26"></a>

#### 中文名

获取股票业务当前时间的分钟bar数量

<a id="接口说明-26"></a>

#### 接口说明

该接口获取当前时间股票的k线根数。

<a id="接口定义-26"></a>

#### 接口定义

python

```python
get_current_kline_count()
```

<a id="使用场景-26"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   回测中返回回测日当前时间的分钟bar数量。
-   研究中返回最新交易日当前时间的分钟bar数量，非交易日执行均返回0。
-   交易中返回最新交易日当前时间的分钟bar数量。

<a id="返回-26"></a>

#### 返回

`int`:

-   当前时间的分钟bar数量

<a id="示例-26"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)
def handle_data(context, data):
    log.info(get_current_kline_count())
```

* * *

说明

接口支持的业务范围以及支持在引擎的哪些流程函数中调用，详见 [接口列表](http://101.71.132.53:9091/qthelp/api/list.html)
