---
platform: qmt
variant: builtin-python
source_role: primary
document_type: strategy_api
title: 6. 行情函数
section_path:
  - 迅投知识库 - 内置Python API文档全集
  - 6. 行情函数
source_file: api-docs/raw/qmt/innerapi-combined.html
source_url: file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html
source_anchor: "#doc-data_function"
source_sha256: 08ffb4fd69f4e96745a5d83d27b6716c0682a20496b6664df00cc79c55670f28
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

# 6\. 行情函数

<a id="data_function--数据下载"></a>

## 数据下载

<a id="data_function--download-history-data-下载指定合约代码指定周期对应时间范围的行情数据"></a>

### download\_history\_data - 下载指定合约代码指定周期对应时间范围的行情数据

提示

QMT提供的行情数据中，基础周期包含 tick 1m 5m 1d，这些是实际用于存储的周期 其他周期为合成周期，以基础周期合成得到

合成周期

-   3m， 由1m线合成
-   10m, 15m, 30m, 60m, 2h, 3h, 4h 由5分钟线合成
-   2d(2日线), 3d(3日线), 5d(5日线), 1w（周线）, 1mon（月线）, 1q(季线), 1hy(半年线), 1y（年线） 由日线数据合成

获取合成周期时

-   如果取历史，需要下载历史的基础周期（如取15m需要下载5m）
-   如果取实时，可以直接订阅原始周期（如直接订阅15m）

如果同时用到基础周期和合成周期，只需要下载基础周期,例如同时使用5m和15m，因为15m也是由5m合成，所以只需要下载一次5m的数据即可

**原型**

**释义**

下载指定合约代码指定周期对应时间范围的行情数据

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 股票代码，格式为'stkcode.market'，例如 '600000.SH' |
| `period` | `string` | K线周期类型，包括:
`'tick'`：分笔线
`'1d'`：日线
`'1m'`：分钟线
`'5m'`：5分钟线 |
| `startTime` | `string` | 起始时间，格式为 "20200101" 或 "20200101093000"，可以为空 |
| `endTime` | `string` | 结束时间，格式为 "20200101" 或 "20200101093000"，可以为空 |
| `incrementally` | `bool` | 默认为 `None` 是否从本地最后一条数据往后增量下载，部分版本客户端可能不支持此参数 |

**返回值**

`none`

**示例**

界面端进行数据下载还可参考:

提示

【攻略】K线/财务数据下载方式 https://www.xuntou.net/forum.php?mod=viewthread&tid=1354&user\_code=7zqjlm 来自: 迅投QMT社区

<a id="data_function--获取行情数据"></a>

## 获取行情数据

该目录下的函数用于获取实时行情,历史行情

<a id="data_function--contextinfo-get-market-data-ex-获取行情数据"></a>

### ContextInfo.get\_market\_data\_ex - 获取行情数据

注意

1.  **该函数不建议在`init`中运行,在`init`中运行时仅能取到本地数据**
2.  关于获取行情函数之间的区别与注意事项可在 - [常见问题-行情相关在新窗口打开](builtin-python--doc-question-answer.md#question_answer--行情相关) 查看
3.  除实时行情外，该函数还可用于获取特色数据，如`资金流向数据`,`订单流数据`等，获取方式见[数据字典在新窗口打开](https://dict.thinktrader.net/dictionary/)

**原型**

**释义**

获取实时行情与历史行情数据

**参数**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `field` | `list` | `数据字段，详情见下方field字段表` |
| `stock_list` | `list` | `合约代码列表` |
| `period` | `str` | `数据周期，可选字段为:`
`"tick"`
`"1m"：1分钟线`
`"5m"：5分钟线；"15m"：15分钟线；"30m"：30分钟线`
`"1h"小时线`
`"1d"：日线`
`"1w"：周线`
`"1mon"：月线`
`"1q"：季线`
`"1hy"：半年线`
`"1y"：年线`
`'l2quote'：Level2行情快照`
`'l2quoteaux'：Level2行情快照补充`
`'l2order'：Level2逐笔委托`
`'l2transaction'：Level2逐笔成交`
`'l2transactioncount'：Level2大单统计`
`'l2orderqueue'：Level2委买委卖队列` |
| `start_time` | `str` | `数据起始时间，格式为 %Y%m%d 或 %Y%m%d%H%M%S，填""为获取历史最早一天` |
| `end_time` | `str` | `数据结束时间，格式为 %Y%m%d 或 %Y%m%d%H%M%S ，填""为截止到最新一天` |
| `count` | `int` | `数据个数` |
| `dividend_type` | `str` | `除权方式,可选值为`
`'none'：不复权`
`'front':前复权`
`'back':后复权`
`'front_ratio': 等比前复权`
`'back_ratio': 等比后复权` |
| `fill_data` | `bool` | `是否填充数据` |
| `subscribe` | `bool` | `订阅数据开关，默认为True，设置为False时不做数据订阅，只读取本地已有数据。` |

-   `field`字段可选：

| field | 数据类型 | 含义 |
| --- | --- | --- |
| `time` | `int` | `时间` |
| `open` | `float` | `开盘价` |
| `high` | `float` | `最高价` |
| `low` | `float` | `最低价` |
| `close` | `float` | `收盘价` |
| `volume` | `float` | `成交量` |
| `amount` | `float` | `成交额` |
| `settle` | `float` | `今结算` |
| `openInterest` | `float` | `持仓量` |
| `preClose` | `float` | `前收盘价` |
| `suspendFlag` | `int` | `停牌` 1停牌，0 不停牌 |

-   `period`周期为tick时，`field`字段可选:

| field | 数据类型 | 含义 |
| --- | --- | --- |
| `time` | `int` | `时间` |
| `lastPrice` | `float` | `最新价` |
| `lastClose` | `float` | `前收盘价` |
| `open` | `float` | `开盘价` |
| `high` | `float` | `最高价` |
| `low` | `float` | `最低价` |
| `close` | `float` | `收盘价` |
| `volume` | `float` | `成交量` |
| `amount` | `float` | `成交额` |
| `settle` | `float` | `今结算` |
| `openInterest` | `float` | `持仓量` |
| `stockStatus` | `int` | `停牌` 1停牌，0 不停牌 |

-   `period`周期为Level2数据时，字段参考[数据结构](builtin-python--doc-data-structure.md#data_structure--l2quote-level2行情快照)

**返回值**

-   返回dict { stock\_code1 : value1, stock\_code2 : value2, ... }
-   value1, value2, ... ：pd.DataFrame 数据集，index为time\_list，columns为fields,可参考[Bar字段在新窗口打开](builtin-python--doc-data-structure.md#data_structure--bar-bar对象)
-   各标的对应的DataFrame维度相同、索引相同

**示例**

<a id="data_function--contextinfo-get-full-tick-获取全推数据"></a>

### ContextInfo.get\_full\_tick - 获取全推数据

提示

不能用于回测 只能取最新的分笔，不能取历史分笔

**原型**

**释义**

获取最新分笔数据

**参数**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `stock_code` | `list[str]` | `合约代码列表，如['600000.SH','600036.SH']，不指定时为当前主图合约。` |

**返回值** 根据stock\_code返回一个dict，该字典的key值是股票代码，其值仍然是一个dict，在该dict中存放股票代码对应的最新的数据。该字典数据key值参考[tick字段在新窗口打开](builtin-python--doc-data-structure.md#data_structure--tick-tick-对象)

**示例**

<a id="data_function--contextinfo-subscribe-quote-订阅行情数据"></a>

### ContextInfo.subscribe\_quote - 订阅行情数据

提示

1.  该函数属于订阅函数，非VIP用户限制订阅数量

2.  VIP用户支持全推市场指定周期K线

3.  VIP用户权限请参考[vip-行情用户优势对比](https://dict.thinktrader.net/dictionary/#vip-%E8%A1%8C%E6%83%85%E7%94%A8%E6%88%B7%E4%BC%98%E5%8A%BF%E5%AF%B9%E6%AF%94)


**原型**

**释义**

订阅行情数据,关于订阅机制请参考[运行机制对比在新窗口打开](builtin-python--doc-start-now.md#start_now--三、运行机制对比)

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | `股票代码，'stkcode.market'，如'600000.SH'` |
| `period` | `string` | `K线周期类型` |
| `dividend_type` | `string` | `除权方式,可选值为`
`'none'：不复权`
`'front':前复权`
`'back':后复权`
`'front_ratio': 等比前复权`
`'back_ratio': 等比后复权`
`注意：分笔周期返回数据均为不复权` |
| `result_type` | `string` | `返回数据格式,可选范围：<br>'DataFrame'或''（默认）：返回{code:data}，data为pd.DataFrame数据集，index为字符串格式的时间序列，columns为数据字段<br>'dict'：返回{code:{k1:v1,k2:v2,...}}，k为数据字段名，v为字段值<br>'list'：返回{code:{k1:[v1],k2:[v2],...}}，k为数据字段名，v为字段值` |
| `callback` | `function` | `指定推送行情的回调函数` |

**返回值**

`int`：订阅号，用于反订阅

**示例**

<a id="data_function--contextinfo-subscribe-whole-quote-订阅全推数据"></a>

### ContextInfo.subscribe\_whole\_quote - 订阅全推数据

提示

**释义**

订阅全推数据，全推数据只有分笔周期，每次增量推送数据有变化的品种

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `code_list` | `list[str,...]` | `市场代码列表/品种代码列表,如 ['SH','SZ'] 或 ['600000.SH', '000001.SZ']` |
| `callback` | `function` | `数据推送回调` |

**返回值**`int`，订阅号，可用`ContextInfo.unsubscribe_quote`做反订阅

<a id="data_function--contextinfo-unsubscribe-quote-反订阅行情数据"></a>

### ContextInfo.unsubscribe\_quote - 反订阅行情数据

**原型**

**释义**

反订阅行情数据，配合`ContextInfo.subscribe_quote()`或`ContextInfo.subscribe_whole_quote()`使用

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `subId` | `int` | `行情订阅返回的订阅号` |

**示例**

<a id="data_function--subscribe-formula-订阅模型"></a>

### subscribe\_formula - 订阅模型

**原型**

**释义** 订阅vba模型运行结果，使用前要注意补充本地K线数据或分笔数据

**参数**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| formula\_name | str | 模型名称名 |
| stock\_code | str | 模型主图代码形式如'stkcode.market'，如'000300.SH' |
| period | str | K线周期类型，可选范围：'tick':分笔线，'1d':日线，'1m':分钟线，'3m':三分钟线，'5m':5分钟线，'15m':15分钟线，'30m':30分钟线，'1h':小时线，'1w':周线，'1mon':月线，'1q':季线，'1hy':半年线，'1y':年线 |
| start\_time | str | 模型运行起始时间，形如:'20200101'，默认为空视为最早 |
| end\_time | str | 模型运行截止时间，形如:'20200101'，默认为空视为最新 |
| count | int | 模型运行范围为向前 count 根 bar，默认为 -1 运行所有 bar |
| dividend\_type | str | 复权方式，默认为主图除权方式，可选范围：'none':不复权，'front':向前复权，'back':向后复权，'front\_ratio':等比向前复权，'back\_ratio':等比向后复权 |
| extend\_param | dict | 模型的入参，形如 {'a': 1, '\_\_basket': {}} |
| \_\_basket | dict | 可选参数，组合模型的股票池权重，形如 {'600000.SH': 0.06, '000001.SZ': 0.01} |

**返回值** 分两块，

-   subscribe\_formula返回模型的订阅号,可用于后续反订阅，失败返回 -1

-   callback:

    -   timelist： 数据时间戳
    -   outputs：模型的输出值，结构为{变量名:值}

**示例**

<a id="data_function--unsubscribe-formula-反订阅模型"></a>

### unsubscribe\_formula - 反订阅模型

**原型**

**释义** 反订阅模型

**参数**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| subID | int | 模型订阅号 |

**返回值**

-   bool:反订阅成功为True，失败为False

**示例**

<a id="data_function--call-formula-调用模型"></a>

### call\_formula - 调用模型

**原型**

**释义** 获取vba模型运行结果，使用前要注意补充本地K线数据或分笔数据

**参数**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| formula\_name | str | 模型名称名 |
| stock\_code | str | 模型主图代码形式如'stkcode.market'，如'000300.SH' |
| period | str | K线周期类型，可选范围：'tick':分笔线，'1d':日线，'1m':分钟线，'3m':三分钟线，'5m':5分钟线，'15m':15分钟线，'30m':30分钟线，'1h':小时线，'1w':周线，'1mon':月线，'1q':季线，'1hy':半年线，'1y':年线 |
| start\_time | str | 模型运行起始时间，形如:'20200101'，默认为空视为最早 |
| end\_time | str | 模型运行截止时间，形如:'20200101'，默认为空视为最新 |
| count | int | 模型运行范围为向前 count 根 bar，默认为 -1 运行所有 bar |
| dividend\_type | str | 复权方式，默认为主图除权方式，可选范围：'none':不复权，'front':向前复权，'back':向后复权，'front\_ratio':等比向前复权，'back\_ratio':等比向后复权 |
| extend\_param | dict | 模型的入参,{"模型名:参数名":参数值},例如在跑模型MA时，{'MA:n1':1};入参可以添加\_\_basket:dict,组合模型的股票池权重,形如{'\_\_basket':{'600000.SH':0.06,'000001.SZ':0.01}}，如果在跑一个模型1的时候，模型1调用了模型2，如果只想修改模型2的参数可以传{'模型2:参数':参数值} |

**返回值** 返回：dict{ 'dbt':0,#返回数据类型，0:全部历史数据 'timelist':\[...\],#返回数据时间范围list, 'outputs':{'var1':\[...\],'var2':\[...\]}#输出变量名：变量值list }

**示例**

<a id="data_function--call-formula-batch-批量调用模型"></a>

### call\_formula\_batch - 批量调用模型

**原型**

**释义** 批量获取vba模型运行结果，使用前要注意补充本地K线数据或分笔数据

**参数**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| formula\_names | list | 包含要批量运行的模型名 |
| stock\_codes | list | 包含要批量运行的模型主图代码形式'stkcode.market'，如'000300.SH' |
| period | str | K线周期类型，可选范围：'tick':分笔线，'1d':日线，'1m':分钟线，'3m':三分钟线，'5m':5分钟线，'15m':15分钟线，'30m':30分钟线，'1h':小时线，'1w':周线，'1mon':月线，'1q':季线，'1hy':半年线，'1y':年线 |
| start\_time | str | 模型运行起始时间，形如:'20200101'，默认为空视为最早 |
| end\_time | str | 模型运行截止时间，形如:'20200101'，默认为空视为最新 |
| count | int | 模型运行范围为向前 count 根 bar，默认为 -1 运行所有 bar |
| dividend\_type | str | 复权方式，默认为主图除权方式，可选范围：'none':不复权，'front':向前复权，'back':向后复权，'front\_ratio':等比向前复权，'back\_ratio':等比向后复权 |
| extend\_params | list | 包含每个模型的入参,\[{"模型名:参数名":参数值}\],例如在跑模型MA时，{'MA:n1':1};入参可以添加\_\_basket:dict,组合模型的股票池权重,形如{'\_\_basket':{'600000.SH':0.06,'000001.SZ':0.01}}，如果在跑一个模型1的时候，模型1调用了模型2，如果只想修改模型2的参数可以传{'模型2:参数':参数值} |

**返回值**

-   list\[dict\]
    -   dict说明:
        -   formula:模型名
        -   stock:品种代码
        -   argument:参数
        -   result:dict参考call\_formula返回结果

**示例**

<a id="data_function--contextinfo-get-svol-根据代码获取对应股票的内盘成交量"></a>

### ContextInfo.get\_svol - 根据代码获取对应股票的内盘成交量

**原型**

**释义**

根据代码获取对应股票的内盘成交量

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 股票代码，如 '000001.SZ'，缺省值''，默认为当前图代码 |

**返回值**`int`:内盘成交量

**示例**

<a id="data_function--contextinfo-get-bvol-根据代码获取对应股票的外盘成交量"></a>

### ContextInfo.get\_bvol - 根据代码获取对应股票的外盘成交量

**原型**

**释义**

根据代码获取对应股票的外盘成交量

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 股票代码，如 '000001.SZ'，缺省值''，默认为当前图代码 |

**返回值**

`int`:外盘成交量

**示例**

<a id="data_function--contextinfo-get-turnover-rate-获取换手率"></a>

### ContextInfo.get\_turnover\_rate - 获取换手率

提示

使用之前需要下载财务数据(在财务数据下载中)以及日线数据

如果不补充股本数据,将使用最新流通股本计算历史换手率,可能会造成历史换手率不正确

**原型**

**释义**

获取换手率

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stock_list` | `list` | 股票列表，如\['600000.SH','000001.SZ'\] |
| `startTime` | `string` | 起始时间，如'20170101' |
| `endTime` | `string` | 结束时间，如'20180101' |

**返回值**

`pandas.Dataframe`

**示例**

<a id="data_function--contextinfo-get-longhubang-获取龙虎榜数据"></a>

### ContextInfo.get\_longhubang - 获取龙虎榜数据

**原型**

**释义**

获取龙虎榜数据

**参数**

| 参数名称 | 类型 | 描述 |
| --- | --- | --- |
| `stock_list` | `list` | 股票列表，如 \['600000.SH', '600036.SH'\] |
| `startTime` | `str` | 起始时间，如 '20170101' |
| `endTime` | `str` | 结束时间，如 '20180101' |

**返回值**

-   格式为`pandas.DataFrame`:

| 参数名称 | 数据类型 | 描述 |
| --- | --- | --- |
| `stockCode` | `str` | 股票代码 |
| `stockName` | `str` | 股票名称 |
| `date` | `datetime` | 上榜日期 |
| `reason` | `str` | 上榜原因 |
| `close` | `float` | 收盘价 |
| `SpreadRate` | `float` | 涨跌幅 |
| `TurnoverVolume` | `float` | 成交量 |
| `Turnover_Amount` | `float` | 成交金额 |
| `buyTraderBooth` | `pandas.DataFrame` | 买方席位 |
| `sellTraderBooth` | `pandas.DataFrame` | 卖方席位 |

-   `buyTraderBooth` 或 `sellTraderBooth` 包含字段：

| 参数名称 | 数据类型 | 描述 |
| --- | --- | --- |
| `traderName` | `str` | 交易营业部名称 |
| `buyAmount` | `float` | 买入金额 |
| `buyPercent` | `float` | 买入金额占总成交占比 |
| `sellAmount` | `float` | 卖出金额 |
| `sellPercent` | `float` | 卖出金额占总成交占比 |
| `totalAmount` | `float` | 该席位总成交金额 |
| `rank` | `int` | 席位排行 |
| `direction` | `int` | 买卖方向 |

**示例**

<a id="data_function--contextinfo-get-north-finance-change-获取对应周期的北向数据"></a>

### ContextInfo.get\_north\_finance\_change - 获取对应周期的北向数据

**原型**

**释义**

获取对应周期的北向数据

**参数**

| 字段名 | 数据类型 | 描述 |
| --- | --- | --- |
| `period` | `str` | 数据周期 |

**返回值**

-   根据`period`返回一个`dict`，该字典的`key`值是北向数据的时间戳，其值仍然是一个`dict`，其值的`key`值是北向数据的字段类型，其值是对应字段的值。该字典数据`key`值有：

| 字段名 | 数据类型 | 描述 |
| --- | --- | --- |
| hgtNorthBuyMoney | int | HGT北向买入资金 |
| hgtNorthSellMoney | int | HGT北向卖出资金 |
| hgtSouthBuyMoney | int | HGT南向买入资金 |
| hgtSouthSellMoney | int | HGT南向卖出资金 |
| sgtNorthBuyMoney | int | SGT北向买入资金 |
| sgtNorthSellMoney | int | SGT北向卖出资金 |
| sgtSouthBuyMoney | int | SGT南向买入资金 |
| sgtSouthSellMoney | int | SGT南向卖出资金 |
| hgtNorthNetInFlow | int | HGT北向资金净流入 |
| hgtNorthBalanceByDay | int | HGT北向当日资金余额 |
| hgtSouthNetInFlow | int | HGT南向资金净流入 |
| hgtSouthBalanceByDay | int | HGT南向当日资金余额 |
| sgtNorthNetInFlow | int | SGT北向资金净流入 |
| sgtNorthBalanceByDay | int | SGT北向当日资金余额 |
| sgtSouthNetInFlow | int | SGT南向资金净流入 |
| sgtSouthBalanceByDay | int | SGT南向当日资金余额 |

**示例：**

<a id="data_function--contextinfo-get-hkt-details-获取指定品种的持股明细"></a>

### ContextInfo.get\_hkt\_details - 获取指定品种的持股明细

**原型**

**释义**

获取指定品种的持股明细

**参数**

| 参数名称 | 数据类型 | 描述 |
| --- | --- | --- |
| `stockcode` | `string` | 必须是'stock.market'形式 |

**返回值**

-   根据`stockcode`返回一个`dict`，该字典的key值是北向持股明细数据的时间戳，其值仍然是一个`dict`，其值的`key`值是北向持股明细数据的字段类型，其值是对应字段的值，该字典数据`key`值有：

| 参数名称 | 数据类型/单位 | 描述 |
| --- | --- | --- |
| `stockCode` | `str` | 股票代码 |
| `ownSharesCompany` | `str` | 机构名称 |
| `ownSharesAmount` | `int` | 持股数量 |
| `ownSharesMarketValue` | `float` | 持股市值 |
| `ownSharesRatio` | `float` | 持股数量占比 |
| `ownSharesNetBuy` | `float` | 净买入金额（当日持股-前一日持股） |

**示例：**

<a id="data_function--contextinfo-get-hkt-statistics-获取指定品种的持股统计"></a>

### ContextInfo.get\_hkt\_statistics - 获取指定品种的持股统计

**原型**

**释义**

获取指定品种的持股统计

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 必须是'stock.market'形式 |

**返回值**

根据stockcode返回一个dict，该字典的key值是北向持股统计数据的时间戳，其值仍然是一个dict，其值的key值是北向持股统计数据的字段类型，其值是对应字段的值，该字典数据key值有：

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockCode` | `string` | 股票代码 |
| `ownSharesAmount` | `float` | 持股数量，单位：股 |
| `ownSharesMarketValue` | `float` | 持股市值，单位：元 |
| `ownSharesRatio` | `float` | 持股数量占比，单位：% |
| `ownSharesNetBuy` | `float` | 净买入，单位：元，浮点数（当日持股-前一日持股） |

**示例**

<a id="data_function--get-etf-info-根据etf基金代码获取etf申赎清单及对应成分股数据"></a>

### get\_etf\_info - 根据ETF基金代码获取ETF申赎清单及对应成分股数据

**原型**

**释义**

根据ETF基金代码获取ETF申赎清单及对应成分股数据,每日盘前更新

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | ETF基金代码如"510050.SH" |

**返回值**

一个多层嵌套的`dict`

**示例**

<a id="data_function--get-etf-iopv-根据etf基金代码获取etf的基金份额参考净值"></a>

### get\_etf\_iopv - 根据ETF基金代码获取ETF的基金份额参考净值

**原型**

**释义**

根据ETF基金代码获取ETF的基金份额参考净值

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | ETF基金代码如"510050.SH" |

**返回值**

`float`类型值,IOPV，基金份额参考净值

**示例**

<a id="data_function--contextinfo-get-local-data-获取本地行情数据【不推荐】"></a>

### ContextInfo.get\_local\_data - 获取本地行情数据【不推荐】

注意

本函数用于仅用于获取本地历史行情数据，使用前请确保已通过[download\_history\_data在新窗口打开](#data_function--download-history-data-下载指定合约代码指定周期对应时间范围的行情数据)下载过历史行情数据

**原型**

**释义**

获取本地行情数据

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stock_code` | `string` | 默认参数，合约代码格式为 `code.market`，不指定时为当前图合约 |
| `start_time` | `string` | 默认参数，开始时间，格式为 '20171209' 或 '20171209010101' |
| `end_time` | `string` | 默认参数，结束时间，格式同 `start_time` |
| `period` | `string` | 默认参数，K线类型，可选值包括：
`'tick'`：分笔线（只用于获取'quoter'字段数据）、`'realtime'`: 实时线、`'1d'`：日线
`'md'`：多日线、`'1m'`：1分钟线、`'3m'`：3分钟线
`'5m'`：5分钟线、`'15m'`：15分钟线、`'30m'`：30分钟线
`'mm'`：多分钟线、`'1h'`：小时线、`'mh'`：多小时线
`'1w'`：周线、`'1mon'`：月线、`'1q'`：季线
`'1hy'`：半年线、`'1y'`：年线 |
| `dividend_type` | `string` | 除复权种类，可选值：
`'none'`：不复权
`'front'`：向前复权
`'back'`：向后复权
`'front_ratio'`：等比向前复权
`'back_ratio'`：等比向后复权 |
| `count` | `int` | 当 `count` 大于等于0时：
如果指定了 `start_time` 和 `end_time`，则以 `end_time` 为基准向前取 `count` 条数据；
如果 `start_time` 和 `end_time` 缺省，则默认取本地数据最新的 `count` 条数据；
如果 `start_time`、`end_time` 和 `count` 都缺省时，则默认取本地全部数据。 |

**返回值**

返回一个`dict`，键值为timetag，value为另一个dict(valuedict)

-   period='tick'时函数获取分笔数据，valuedict字典数据key值有：

| 字段 | 数据类型 | 含义 |
| --- | --- | --- |
| `lastPrice` | `float` | `最新价` |
| `open` | `float` | `开盘价` |
| `high` | `float` | `最高价` |
| `low` | `float` | `最低价` |
| `lastClose` | `float` | `前收盘价` |
| `amount` | `float` | `成交额` |
| `volume` | `float` | `成交量` |
| `pvolume` | `float` | `原始成交量` |
| `stockStatus` | `int` | `作废 参考openInt` |
| `openInt` | `float` | `若是股票，则openInt含义为股票状态，非股票则是持仓量`[openInt字段说明在新窗口打开](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#data_structure--openint-%E8%AF%81%E5%88%B8%E7%8A%B6%E6%80%81) |
| `lastSettlementPrice` | `float` | `昨结算价` |
| `askPrice` | `list` | `委卖价` |
| `bidPrice` | `list` | `委买价` |
| `askVol` | `list` | `委卖量` |
| `bidVol` | `list` | `委买量` |
| `settlementPrice` | `float` | `今结算价` |

-   period为其他值时，valuedict字典数据key值有：

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `amount` | `float` | 成交额 |
| `volume` | `float` | 成交量 |
| `open` | `float` | 开盘价 |
| `high` | `float` | 最高价 |
| `low` | `float` | 最低价 |
| `close` | `float` | 收盘价 |

**示例**

<a id="data_function--contextinfo-get-history-data-获取历史行情数据【不推荐】"></a>

### ContextInfo.get\_history\_data - 获取历史行情数据【不推荐】

警告

1.  此函数已不推荐使用，推荐使用[ContextInfo.get\_market\_data\_ex()在新窗口打开](#data_function--contextinfo-get-market-data-ex-获取行情数据)
2.  此函数使用前需要先通过ContextInfo.set\_universe()设定股票池

**原型**

**释义**

获取历史行情数据

**参数**

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `len` | `int` | `需获取的历史数据长度` |
| `period` | `string` | 需获取的历史数据周期，可选值包括：
`'tick'`：分笔线、 `'1d'`：日线、 `'1m'`：1分钟线
`'3m'`：3分钟线、 `'5m'`：5分钟线、 `'15m'`：15分钟线
`'30m'`：30分钟线、 `'1h'`：小时线、 `'1w'`：周线
`'1mon'`：月线、 `'1q'`：季线、 `'1hy'`：半年线
`'1y'`：年线 |
| `field` | `string` | 需获取的历史数据的类型，可选值包括：
`'open'`：开盘价
`'high'`：最高价
`'low'`：最低价
`'close'`：收盘价
`'quoter'`：详细报价（结构见 `get_market_data` 方法） |
| `dividend_type` | `int` | 默认参数，除复权，默认不复权，可选值包括：
`0`：不复权
`1`：向前复权
`2`：向后复权
`3`：等比向前复权
`4`：等比向后复权 |
| `skip_paused` | `bool` | 默认参数，是否停牌填充，默认填充 |

**返回值** 一个字典`dict`结构，key 为 stockcode.market, value 为行情数据 list，list 中第 0 位为最早的价格，第 1 位为次早价格，依次下去。

**示例**

<a id="data_function--contextinfo-get-market-data-获取行情数据【不推荐】"></a>

### ContextInfo.get\_market\_data() - 获取行情数据【不推荐】

提示

推荐使用[ContextInfo.get\_market\_data\_ex()在新窗口打开](#data_function--contextinfo-get-market-data-ex-获取行情数据)

**原型**

**释义**

获取行情数据

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `fields` | 字段列表 | 可选值包括：
`'open'`: 开
`'high'`: 高
`'low'`: 低
`'close'`: 收
`'volume'`: 成交量
`'amount'`: 成交额
`'settle'`: 结算价
`'quoter'`: 分笔数据（包括历史） |
| `stock_code` | 默认参数，合约代码列表 | 合约格式为 `code.market`，例如 '600000.SH'，不指定时为当前图合约 |
| `start_time` | 默认参数，时间戳 | 开始时间，格式为 '20171209' 或 '20171209010101' |
| `end_time` | 默认参数，时间戳 | 结束时间，格式为 '20171209' 或 '20171209010101' |
| `skip_paused` | 默认参数，布尔值 | 如何处理停牌数据：
`true`：如果是停牌股，会自动填充未停牌前的价格作为停牌日的价格
`false`：停牌数据为 NaN |
| `period` | `string` | 需获取的历史数据周期，可选值包括：
`'tick'`：分笔线、 `'1d'`：日线、 `'1m'`：1分钟线
`'3m'`：3分钟线、 `'5m'`：5分钟线、 `'15m'`：15分钟线
`'30m'`：30分钟线、 `'1h'`：小时线、 `'1w'`：周线
`'1mon'`：月线、 `'1q'`：季线、 `'1hy'`：半年线
`'1y'`：年线 |
| `dividend_type` | 默认参数，字符串 | 缺省值为 'none'，除复权，可选值包括：
`'none'`：不复权
`'front'`：向前复权
`'back'`：向后复权
`'front_ratio'`：等比向前复权
`'back_ratio'`：等比向后复权 |
| `count` | 默认参数，整数 | 缺省值为 -1。当大于等于 0 时，效果与 `get_history_data` 保持一致 |

-   count参数设置的几种情况

| count 取值 | 时间设置是否生效 | 开始时间和结束时间设置效果 |
| --- | --- | --- |
| count >= 0 | **生效** | 返回数量取决于开始时间与结束时间和count与结束时间的交集 |
| count = -1 | **生效** | 同时设置开始时间和结束时间，在所设置的时间段内取值 |
| count = -1 | **生效** | 开始时间结束时间都不设置，取当前最新bar的值 |
| count = -1 | **生效** | 只设置开始时间，取所设开始时间到当前时间的值 |
| count = -1 | **生效** | 只设置结束时间，取股票上市第一根 bar 到所设结束时间的值 |

**返回值**

-   返回值根据传入的参数情况，会返回不同类型的结果

| count | 字段数量 | 股票数量 | 时间点 | 返回类型 |
| --- | --- | --- | --- | --- |
| \=-1 | \=1 | \=1 | \=1 | float |
| \=-1 | \>1 | \=1 | 默认值 | pandas.Series |
| \>=-1 | \>=1 | \=1 | \>=1 | pandas.DataFrame(字段数量和时间点不同时为1) |
| \=-1 | \>=1 | \>1 | 默认值 | pandas.DataFrame |
| \>1 | \=1 | \=1 | \=1 | pandas.DataFrame |
| \>=-1 | \>=1 | \>1 | \>=1 | pandas.Panel |

**示例**

<a id="data_function--获取财务数据"></a>

## 获取财务数据

获取财务数据前，请先通过`界面端数据管理 - 财务数据`下载

![财务数据下载](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E4%B8%8B%E8%BD%BD%E8%B4%A2%E5%8A%A1%E6%95%B0%E6%8D%AE-61e927b9.png)

提示

财务数据接口通过读取下载本地的数据取数，使用前需要补充本地数据。除公告日期和报表截止日期为时间戳毫秒格式其他单位为元或 %，数据主要包括资产负债表(ASHAREBALANCESHEET)、利润表（ASHAREINCOME）、现金流量表（ASHARECASHFLOW）、股本表（CAPITALSTRUCTURE）的主要字段数据以及经过计算的主要财务指标数据（PERSHAREINDEX）。建议使用本文档对照表中的英文表名和迅投英文字段，表名不区分大小写。

<a id="data_function--contextinfo-get-financial-data-获取财务数据"></a>

### ContextInfo.get\_financial\_data - 获取财务数据

财务数据接口有两种用法，入参和返回值不同，具体如下

<a id="data_function--用法1"></a>

#### 用法1

**原型**

**释义**

获取财务数据，方法1

**参数**

| 字段名 | 类型 | 释义与用例 |
| --- | --- | --- |
| `fieldList` | `List（必须）` | `财报字段列表：['ASHAREBALANCESHEET.fix_assets', '利润表.净利润']` |
| `stockList` | `List（必须）` | `股票列表：['600000.SH', '000001.SZ']` |
| `startDate` | `Str（必须）` | `开始时间：'20171209'` |
| `endDate` | `Str（必须）` | `结束时间：'20171212'` |
| `report_type` | `Str（可选）` | `报表时间类型，可缺省，默认是按照数据的公告期为区分取数据，设置为 'report_time' 为按照报告期取数据，' announce_time' 为按照公告日期取数据` |

提示

选择按照公告期取数和按照报告期取数的区别：

报告日期是指财务报告所覆盖的会计时间段，而公告日期是指公司向外界公布该报告的具体时间点

若指定report\_type为`report_time`，则不会考虑财报的公告日期，**可能会取到未来数据**

若指定report\_type为`announce_time`，则会按财报实际发布日期返回数据，**不会取到未来数据**

例：

**返回值**

函数根据stockList代码列表,startDate,endDate时间范围，返回不同的的数据类型。如下：

| 代码数量 | 时间范围 | 返回类型 |
| --- | --- | --- |
| \=1 | \=1 | pandas.Series (index = 字段) |
| \=1 | \>1 | pandas.DataFrame (index = 时间, columns = 字段) |
| \>1 | \=1 | pandas.DataFrame (index = 代码, columns = 字段) |
| \>1 | \>1 | pandas.Panel (items = 代码, major\_axis = 时间, minor\_axis = 字段) |

**示例**

<a id="data_function--用法2"></a>

#### 用法2

**原型**

与用法 1 可同时使用

**释义**

获取财务数据，方法2

**参数**

| 字段名 | 类型 | 释义与用例 |
| --- | --- | --- |
| `tabname` | `Str（必须）` | `表名：'ASHAREBALANCESHEET'` |
| `colname` | `Str（必须）` | `字段名：'fix_assets'` |
| `market` | `Str（必须）` | `市场：'SH'` |
| `code` | `Str（必须）` | `代码：'600000'` |
| `report_type` | `Str（可选）` | `报表时间类型，可缺省，默认是按照数据的公告期为区分取数据，设置为 'report_time' 为按照报告期取数据，' announce_time ' 为按照公告日期取数据` |
| `barpos` | `number` | `当前 bar 的索引` |

**返回值**

`float` ：所取字段的数值

**示例**

<a id="data_function--contextinfo-get-raw-financial-data-获取原始财务数据"></a>

### ContextInfo.get\_raw\_financial\_data - 获取原始财务数据

提示

取原始财务数据,与get\_financial\_data相比不填充每个交易日的数据

**原型**

**释义**

取原始财务数据,与get\_financial\_data相比不填充每个交易日的数据

**参数**

| 字段名 | 类型 | 释义与用例 |
| --- | --- | --- |
| `fieldList` | `List（必须）` | 字段列表：例如 \['资产负债表.固定资产','利润表.净利润'\] |
| `stockList` | `List（必须）` | 股票列表：例如\['600000.SH','000001.SZ'\] |
| `startDate` | `Str（必须）` | 开始时间：例如 '20171209' |
| `endDate` | `Str（必须）` | 结束时间：例如 '20171212' |
| `report_type` | `Str（可选）` | 时间类型，可缺省，默认是按照数据的公告期为区分取数据，设置为 'report\_time' 为按照报告期取数据，可选值:'announce\_time','report\_time' |

**返回值**

函数根据stockList代码列表,startDate,endDate时间范围，返回不同的的数据类型。如下：

| 代码数量 | 时间范围 | 返回类型 |
| --- | --- | --- |
| \=1 | \=1 | pandas.Series (index = 字段) |
| \=1 | \>1 | pandas.DataFrame (index = 时间, columns = 字段) |
| \>1 | \=1 | pandas.DataFrame (index = 代码, columns = 字段) |
| \>1 | \>1 | pandas.Panel (items = 代码, major\_axis = 时间, minor\_axis = 字段) |

**示例**

<a id="data_function--contextinfo-get-last-volume-获取最新流通股本"></a>

### ContextInfo.get\_last\_volume - 获取最新流通股本

**原型**

**释义**

获取最新流通股本

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 标的名称，必须是 'stock.market' 形式 |

**返回值**

`int`类型值,代表流通股本数量

**示例**

<a id="data_function--contextinfo-get-total-share-获取总股数"></a>

### ContextInfo.get\_total\_share - 获取总股数

**原型**

**释义**

获取总股数

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 股票代码，缺省值 ''，默认为当前图代码, 如：'600000.SH' |

**返回值**

`int`:总股数

**示例**

<a id="data_function--财务数据字段表"></a>

### 财务数据字段表

<a id="data_function--资产负债表-asharebalancesheet"></a>

#### 资产负债表 (ASHAREBALANCESHEET)

| **中文字段** | **迅投字段** |
| --- | --- |
| `应收利息` | `int_rcv` |
| `可供出售金融资产` | `fin_assets_avail_for_sale` |
| `持有至到期投资` | `held_to_mty_invest` |
| `长期股权投资` | `long_term_eqy_invest` |
| `固定资产` | `fix_assets` |
| `无形资产` | `intang_assets` |
| `递延所得税资产` | `deferred_tax_assets` |
| `资产总计` | `tot_assets` |
| `交易性金融负债` | `tradable_fin_liab` |
| `应付职工薪酬` | `empl_ben_payable` |
| `应交税费` | `taxes_surcharges_payable` |
| `应付利息` | `int_payable` |
| `应付债券` | `bonds_payable` |
| `递延所得税负债` | `deferred_tax_liab` |
| `负债合计` | `tot_liab` |
| `实收资本(或股本)` | `cap_stk` |
| `资本公积金` | `cap_rsrv` |
| `盈余公积金` | `surplus_rsrv` |
| `未分配利润` | `undistributed_profit` |
| `归属于母公司股东权益合计` | `tot_shrhldr_eqy_excl_min_int` |
| `少数股东权益` | `minority_int` |
| `负债和股东权益总计` | `tot_liab_shrhldr_eqy` |
| `所有者权益合计` | `total_equity` |
| `货币资金` | `cash_equivalents` |
| `应收票据` | `bill_receivable` |
| `应收账款` | `account_receivable` |
| `预付账款` | `advance_payment` |
| `其他应收款` | `other_receivable` |
| `其他流动资产` | `other_current_assets` |
| `流动资产合计` | `total_current_assets` |
| `存货` | `inventories` |
| `在建工程` | `constru_in_process` |
| `工程物资` | `construction_materials` |
| `长期待摊费用` | `long_deferred_expense` |
| `非流动资产合计` | `total_non_current_assets` |
| `短期借款` | `shortterm_loan` |
| `应付股利` | `dividend_payable` |
| `其他应付款` | `other_payable` |
| `一年内到期的非流动负债` | `non_current_liability_in_one_year` |
| `其他流动负债` | `other_current_liability` |
| `长期应付款` | `longterm_account_payable` |
| `应付账款` | `accounts_payable` |
| `预收账款` | `advance_peceipts` |
| `流动负债合计` | `total_current_liability` |
| `应付票据` | `notes_payable` |
| `长期借款` | `long_term_loans` |
| `专项应付款` | `grants_received` |
| `其他非流动负债` | `other_non_current_liabilities` |
| `非流动负债合计` | `non_current_liabilities` |
| `专项储备` | `specific_reserves` |
| `商誉` | `goodwill` |
| `报告截止日` | `m_timetag` |
| `公告日` | `m_anntime` |

<a id="data_function--利润表-ashareincome"></a>

#### 利润表 (ASHAREINCOME)

| **中文字段** | **迅投字段** |
| --- | --- |
| `投资收益` | `plus_net_invest_inc` |
| `联营企业和合营企业的投资收益` | `incl_inc_invest_assoc_jv_entp` |
| `营业税金及附加` | `less_taxes_surcharges_ops` |
| `营业总收入` | `revenue` |
| `营业总成本` | `total_operating_cost` |
| `营业收入` | `revenue_inc` |
| `营业成本` | `total_expense` |
| `资产减值损失` | `less_impair_loss_assets` |
| `营业利润` | `oper_profit` |
| `营业外收入` | `plus_non_oper_rev` |
| `营业外支出` | `less_non_oper_exp` |
| `利润总额` | `tot_profit` |
| `所得税` | `inc_tax` |
| `净利润` | `net_profit_incl_min_int_inc` |
| `归母净利润` | `net_profit_excl_min_int_inc` |
| `管理费用` | `less_gerl_admin_exp` |
| `销售费用` | `sale_expense` |
| `财务费用` | `financial_expense` |
| `综合收益总额` | `total_income` |
| `归属于少数股东的综合收益总额` | `total_income_minority` |
| `公允价值变动收益` | `change_income_fair_value` |
| `已赚保费` | `earned_premium` |
| `报告截止日` | `m_timetag` |
| `公告日` | `m_anntime` |

<a id="data_function--现金流量表-asharecashflow"></a>

#### 现金流量表 (ASHARECASHFLOW)

| **中文字段** | **迅投字段** |
| --- | --- |
| `收到其他与经营活动有关的现金` | `other_cash_recp_ral_oper_act` |
| `经营活动现金流入小计` | `stot_cash_inflows_oper_act` |
| `支付给职工以及为职工支付的现金` | `cash_pay_beh_empl` |
| `支付的各项税费` | `pay_all_typ_tax` |
| `支付其他与经营活动有关的现金` | `other_cash_pay_ral_oper_act` |
| `经营活动现金流出小计` | `stot_cash_outflows_oper_act` |
| `经营活动产生的现金流量净额` | `net_cash_flows_oper_act` |
| `取得投资收益所收到的现金` | `cash_recp_return_invest` |
| `处置固定资产、无形资产和其他长期投资收到的现金` | `net_cash_recp_disp_fiolta` |
| `投资活动现金流入小计` | `stot_cash_inflows_inv_act` |
| `投资支付的现金` | `cash_paid_invest` |
| `购建固定资产、无形资产和其他长期投资支付的现金` | `cash_pay_acq_const_fiolta` |
| `支付其他与投资的现金` | `other_cash_pay_ral_inv_act` |
| `投资活动产生的现金流出小计` | `stot_cash_outflows_inv_act` |
| `投资活动产生的现金流量净额` | `net_cash_flows_inv_act` |
| `吸收投资收到的现金` | `cash_recp_cap_contrib` |
| `取得借款收到的现金` | `cash_recp_borrow` |
| `收到其他与筹资活动有关的现金` | `other_cash_recp_ral_fnc_act` |
| `筹资活动现金流入小计` | `stot_cash_inflows_fnc_act` |
| `偿还债务支付现金` | `cash_prepay_amt_borr` |
| `分配股利、利润或偿付利息支付的现金` | `cash_pay_dist_dpcp_int_exp` |
| `支付其他与筹资的现金` | `other_cash_pay_ral_fnc_act` |
| `筹资活动现金流出小计` | `stot_cash_outflows_fnc_act` |
| `筹资活动产生的现金流量净额` | `net_cash_flows_fnc_act` |
| `汇率变动对现金的影响` | `eff_fx_flu_cash` |
| `现金及现金等价物净增加额` | `net_incr_cash_cash_equ` |
| `销售商品、提供劳务收到的现金` | `goods_sale_and_service_render_cash` |
| `收到的税费与返还` | `tax_levy_refund` |
| `购买商品、接受劳务支付的现金` | `goods_and_services_cash_paid` |
| `处置子公司及其他收到的现金` | `net_cash_deal_subcompany` |
| `其中子公司吸收现金` | `cash_from_mino_s_invest_sub` |
| `处置固定资产、无形资产和其他长期资产支付的现金净额` | `fix_intan_other_asset_dispo_cash_payment` |
| `报告截止日` | `m_timetag` |
| `公告日` | `m_anntime` |

<a id="data_function--股本表-capitalstructure"></a>

#### 股本表 (CAPITALSTRUCTURE)

| **中文字段** | **迅投字段** |
| --- | --- |
| `总股本` | `total_capital` |
| `已上市流通A股` | `circulating_capital` |
| `自由流通股本` | `free_float_capital`（旧版本为`freeFloatCapital`） |
| `限售流通股份` | `restrict_circulating_capital` |
| `变动日期` | `m_timetag` |
| `公告日` | `m_anntime` |

<a id="data_function--主要指标-pershareindex"></a>

#### 主要指标 (PERSHAREINDEX)

| **中文字段** | **迅投字段** |
| --- | --- |
| `每股经营活动现金流量` | `s_fa_ocfps` |
| `每股净资产` | `s_fa_bps` |
| `基本每股收益` | `s_fa_eps_basic` |
| `稀释每股收益` | `s_fa_eps_diluted` |
| `每股未分配利润` | `s_fa_undistributedps` |
| `每股资本公积金` | `s_fa_surpluscapitalps` |
| `扣非每股收益` | `adjusted_earnings_per_share` |
| `净资产收益率` | `du_return_on_equity` |
| `销售毛利率` | `sales_gross_profit` |
| `主营收入同比增长` | `inc_revenue_rate` |
| `净利润同比增长` | `du_profit_rate` |
| `归属于母公司所有者的净利润同比增长` | `inc_net_profit_rate` |
| `扣非净利润同比增长` | `adjusted_net_profit_rate` |
| `营业总收入滚动环比增长` | `inc_total_revenue_annual` |
| `归属净利润滚动环比增长` | `inc_net_profit_to_shareholders_annual` |
| `扣非净利润滚动环比增长` | `adjusted_profit_to_profit_annual` |
| `加权净资产收益率` | `equity_roe` |
| `摊薄净资产收益率` | `net_roe` |
| `摊薄总资产收益率` | `total_roe` |
| `毛利率` | `gross_profit` |
| `净利率` | `net_profit` |
| `实际税率` | `actual_tax_rate` |
| `预收款营业收入` | `pre_pay_operate_income` |
| `销售现金流营业收入` | `sales_cash_flow` |
| `资产负债比率` | `gear_ratio` |
| `存货周转率` | `inventory_turnover` |

<a id="data_function--十大股东-十大流通股东-top10holder-top10flowholder"></a>

#### 十大股东/十大流通股东 (TOP10HOLDER/TOP10FLOWHOLDER)

提示

对于公告内披露的十大股东数量大于10条的，我们会保留原始数据，以保持和公司公告信息一致

| **中文字段** | **迅投字段** |
| --- | --- |
| `公告日期` | `declareDate` |
| `截止日期` | `endDate` |
| `股东名称` | `name` |
| `股东类型` | `type` |
| `持股数量` | `quantity` |
| `变动原因` | `reason` |
| `持股比例` | `ratio` |
| `股份性质` | `nature` |
| `持股排名` | `rank` |

<a id="data_function--股东数-shareholder"></a>

#### 股东数 (SHAREHOLDER)

| **中文字段** | **迅投字段** |
| --- | --- |
| `公告日期` | `declareDate` |
| `截止日期` | `endDate` |
| `股东总数` | `shareholder` |
| `A股东户数` | `shareholderA` |
| `B股东户数` | `shareholderB` |
| `H股东户数` | `shareholderH` |
| `已流通股东户数` | `shareholderFloat` |
| `未流通股东户数` | `shareholderOther` |

<a id="data_function--获取合约信息"></a>

## 获取合约信息

<a id="data_function--contextinfo-get-instrument-detail-根据代码获取合约详细信息"></a>

### ContextInfo.get\_instrument\_detail - 根据代码获取合约详细信息

提示

旧版本客户端中，函数名为ContextInfo.get\_instrumentdetail；不支持iscomplete参数

**原型**

**释义**

根据代码获取合约详细信息

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 标的名称，必须是 'stock.market' 形式 |
| `iscomplete` | `bool` | 是否获取全部字段，默认为False |

**返回值**

根据stockcode返回一个dict。该字典数据key值有：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| ExchangeID | string | 合约市场代码 |
| InstrumentID | string | 合约代码 |
| InstrumentName | string | 合约名称 |
| ProductID | string | 合约的品种ID(期货) |
| ProductName | string | 合约的品种名称(期货) |
| ProductType | int | 合约的类型, 默认-1,枚举值可参考下方说明 |
| ExchangeCode | string | 交易所代码 |
| UniCode | string | 统一规则代码 |
| CreateDate | str | 创建日期 |
| OpenDate | str | 上市日期（特殊值情况见表末） |
| ExpireDate | int | 退市日或者到期日（特殊值情况见表末） |
| PreClose | float | 前收盘价格 |
| SettlementPrice | float | 前结算价格 |
| UpStopPrice | float | 当日涨停价 |
| DownStopPrice | float | 当日跌停价 |
| FloatVolume | float | 流通股本（单位：股。注意，部分低等级客户端中此字段为FloatVolumn） |
| TotalVolume | float | 总股本（单位：股。注意，部分低等级客户端中此字段为FloatVolumn） |
| LongMarginRatio | float | 多头保证金率 |
| ShortMarginRatio | float | 空头保证金率 |
| PriceTick | float | 最小价格变动单位 |
| VolumeMultiple | int | 合约乘数(对期货以外的品种，默认是1) |
| MainContract | int | 主力合约标记，1、2、3分别表示第一主力合约，第二主力合约，第三主力合约 |
| LastVolume | int | 昨日持仓量 |
| InstrumentStatus | int | 合约停牌状态(<=0:正常交易（-1:复牌）;>=1停牌天数;) |
| IsTrading | bool | 合约是否可交易 |
| IsRecent | bool | 是否是近月合约 |
| ChargeType | int | 期货和期权手续费方式 |
| ChargeOpen | float | 开仓手续费(率) |
| ChargeClose | float | 平仓手续费(率) |
| ChargeTodayOpen | float | 开今仓(日内开仓)手续费(率) |
| ChargeTodayClose | float | 平今仓(日内平仓)手续费(率) |
| OptionType | int | 期权类型 |
| OpenInterestMultiple | int | 交割月持仓倍数 |

提示

字段`OpenDate`有以下几种特殊值： 19700101=新股, 19700102=老股东增发, 19700103=新债, 19700104=可转债, 19700105=配股， 19700106=配号 字段`ExpireDate`为0 或 99999999 时，表示该标的暂无退市日或到期日

字段`ProductType` 对于**股票以外**的品种，有以下几种值

**国内期货市场：** 1-期货 2-期权(DF SF ZF INE GF) 3-组合套利 4-即期 5-期转现 6-期权(IF) 7-结算价交易(tas)

\*\*沪深股票期权市场：\*\*0-认购 1-认沽

**外盘：** 1-100：期货， 101-200：现货, 201-300:股票相关 1：股指期货 2：能源期货 3：农业期货 4：金属期货 5：利率期货 6：汇率期货 7：数字货币期货 99：自定义合约期货 107：数字货币现货 201：股票 202：GDR 203：ETF 204：ETN 300：其他

**示例**

<a id="data_function--get-st-status-获取历史st状态"></a>

### get\_st\_status - 获取历史st状态

提示

本函数需要下载历史ST数据(过期合约K线),可通过`界面端数据管理 - 过期合约数据`下载

**原型**

**释义**

获取历史st状态

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 股票代码，如000004.SZ（可为空，为空时取主图代码） |

**返回值**

st范围字典 格式 {'ST': \[\['20210520', '20380119'\]\], '\*ST': \[\['20070427', '20080618'\], \['20200611', '20210520'\]\]}

示例：

**示例**

<a id="data_function--contextinfo-get-his-st-data-获取某只股票st的历史"></a>

### ContextInfo.get\_his\_st\_data - 获取某只股票ST的历史

提示

本函数需要下载历史ST数据(过期合约K线),可通过`界面端数据管理 - 过期合约数据`下载

**原型**

**释义**

获取某只股票ST的历史

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 股票代码，'stkcode.market'，如'000004.SZ' |

**返回值**

`dict`,st历史，key为ST,\*ST,PT,历史未ST会返回{}

**示例**

<a id="data_function--contextinfo-get-main-contract-获取期货主力合约"></a>

### ContextInfo.get\_main\_contract - 获取期货主力合约

提示

1.  该函数支持实盘/回测两种模式
2.  若要使用该函数获取历史主力合约，必须要先下载`历史主力合约`数据
3.  `历史主力合约`数据目前通过`界面端数据管理 - 过期合约数据 - 历史主力合约`下载

**原型**

**释义**

获取当前期货主力合约

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `codemarket` | `string` | 合约和市场，合约格式为品种名加00，如IF00.IF，zn00.SF |
| `startDate` | `string` | 开始日期(可以不写),如20180608 |
| `endDate` | `string` | 结束日期(可以不写),如20190608 |

**返回值**

`str`，合约代码

**示例**

<a id="data_function--contextinfo-get-contract-multiplier-获取合约乘数"></a>

### ContextInfo.get\_contract\_multiplier - 获取合约乘数

**原型**

**释义**

获取合约乘数

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `contractcode` | `string` | 合约代码，格式为 'code.market'，例如 'IF1707.IF' |

**返回值**`int`,表示合约乘数

**示例**

<a id="data_function--contextinfo-get-contract-expire-date-获取期货合约到期日"></a>

### ContextInfo.get\_contract\_expire\_date - 获取期货合约到期日

**原型**

**释义**

获取期货合约到期日

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `Codemarket` | `string` | 合约和市场,如IF00.IF,zn00.SF |

**返回值**`str`，合约到期日

**示例**

<a id="data_function--contextinfo-get-his-contract-list-获取市场已退市合约"></a>

### ContextInfo.get\_his\_contract\_list - 获取市场已退市合约

**原型**

**释义**

获取市场已退市合约，需要手动补充过期合约列表

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `market` | `string` | 市场,SH,SZ,SHO,SZO,IF等 |

**返回值**

`list`,合约代码列表

**示例**

<a id="data_function--获取期权信息"></a>

## 获取期权信息

<a id="data_function--contextinfo-get-option-detail-data-获取指定期权品种的详细信息"></a>

### ContextInfo.get\_option\_detail\_data - 获取指定期权品种的详细信息

**原型**

**释义**

获取指定期权品种的详细信息

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `optioncode` | `string` | 期权代码,如'10001506.SHO',当填写空字符串时候默认为当前主图的期权品种 |

**返回值**`dict`,字段如下：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| ExchangeID | str | 期权市场代码 |
| InstrumentID | str | 期权代码 |
| ProductID | str | 期权标的的产品ID |
| OpenDate | int | 发行日期 |
| ExpireDate | int | 到期日 |
| PreClose | float | 前收价格 |
| SettlementPrice | float | 前结算价格 |
| UpStopPrice | float | 当日涨停价 |
| DownStopPrice | float | 当日跌停价 |
| LongMarginRatio | float | 多头保证金率 |
| ShortMarginRatio | float | 空头保证金率 |
| PriceTick | float | 最小变价单位 |
| VolumeMultiple | int | 合约乘数 |
| MaxMarketOrderVolume | int | 涨跌停价最大下单量 |
| MinMarketOrderVolume | int | 涨跌停价最小下单量 |
| MaxLimitOrderVolume | int | 限价单最大下单量 |
| MinLimitOrderVolume | int | 限价单最小下单量 |
| OptUnit | int | 期权合约单位 |
| MarginUnit | float | 期权单位保证金 |
| OptUndlCode | str | 期权标的证券代码 |
| OptUndlMarket | str | 期权标的证券市场 |
| OptExercisePrice | float | 期权行权价 |
| NeeqExeType | str | 全国股转转让类型 |
| OptUndlRiskFreeRate | float | 期权标的无风险利率 |
| OptUndlHistoryRate | float | 期权标的历史波动率 |
| EndDelivDate | int | 期权行权终止日 |
| optType | str | 期权类型 |

**示例**

<a id="data_function--contextinfo-get-option-list-获取指定期权列表"></a>

### ContextInfo.get\_option\_list - 获取指定期权列表

**原型**

**释义**

获取指定期权列表。如获取历史期权，需先下载过期合约列表

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `undl_code` | `string` | 期权标的代码,如'510300.SH' |
| `dedate` | `string` | 期权到期月或当前交易日期，"YYYYMM"格式为期权到期月，"YYYYMMDD"格式为获取当前日期交易的期权 |
| `opttype` | `string` | 期权类型，默认值为空，"CALL"，"PUT"，为空时认购认沽都取 |
| `isavailable` | `bool` | 是否可交易，当`dedate`的格式为"YYYYMMDD"格式为获取当前日期交易的期权时，`isavailable`为True时返回当前可用，为False时返回当前和历史可用 |

**返回值**

`list`，期权合约列表

**示例**

<a id="data_function--contextinfo-get-option-undl-data-获取指定期权标的对应的期权品种列表"></a>

### ContextInfo.get\_option\_undl\_data - 获取指定期权标的对应的期权品种列表

**原型**

**释义**

获取指定期权标的对应的期权品种列表

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `undl_code_ref` | `string` | 期权标的代码,如'510300.SH'，传空字符串时获取全部标的数据 |

**返回值**

指定期权标的代码时返回对应该标的的期权合约列表`list`

期权标的代码为空字符串时返回全部标的对应的品种列表的字典`dict`

**示例**

<a id="data_function--contextinfo-bsm-price-基于bs模型计算欧式期权理论价格"></a>

### ContextInfo.bsm\_price - 基于BS模型计算欧式期权理论价格

**原型**

**释义**

基于Black-Scholes-Merton模型，输入期权标的价格、期权行权价、无风险利率、期权标的年化波动率、剩余天数、标的分红率、计算期权的理论价格

**参数**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `optionType` | `str` | `期权类型，认购：'C'，认沽：'P'` |
| `objectPrices` | `float` | `期权标的价格，可以是价格列表或者单个价格` |
| `strikePrice` | `float` | `期权行权价` |
| `riskFree` | `float` | `无风险收益率` |
| `sigma` | `float` | `标的波动率` |
| `days` | `int` | `剩余天数` |
| `dividend` | `float` | `分红率` |

**返回**

提示

-   objectPrices为float时，返回float
-   objectPrices为list时，返回list
-   计算结果最小值0.0001，结果保留4位小数,输入非法参数返回nan

<a id="data_function--contextinfo-bsm-iv-基于bs模型计算欧式期权隐含波动率"></a>

### ContextInfo.bsm\_iv - 基于BS模型计算欧式期权隐含波动率

**原型**

**释义** 基于Black-Scholes-Merton模型,输入期权标的价格、期权行权价、期权现价、无风险利率、剩余天数、标的分红率,计算期权的隐含波动率

**参数**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `optionType` | `str` | `期权类型，认购：'C'，认沽：'P'` |
| `objectPrices` | `float` | `期权标的价格，可以是价格列表或者单个价格` |
| `strikePrice` | `float` | `期权行权价` |
| `riskFree` | `float` | `无风险收益率` |
| `sigma` | `float` | `标的波动率` |
| `days` | `int` | `剩余天数` |
| `dividend` | `float` | `分红率` |

**返回**

`double`

<a id="data_function--获取除复权信息"></a>

## 获取除复权信息

<a id="data_function--contextinfo-get-divid-factors-获取除权除息日和复权因子"></a>

### ContextInfo.get\_divid\_factors - 获取除权除息日和复权因子

**原型**

**释义**

获取除权除息日和复权因子

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stock.market` | `string` | 股票代码.市场代码，如 '600000.SH' |

**返回值**

`dict`

key:时间戳，

value:list\[每股红利,每股送转,每股转赠,配股,配股价,是否股改,复权系数\]

输入除权除息日非法时候返回空dict，合法时返回输入日期的对应的dict，不输入时返回查询股票的所有除权除息日及对应dict

**示例**

<a id="data_function--获取指数权重"></a>

## 获取指数权重

<a id="data_function--contextinfo-get-weight-in-index-获取某只股票在某指数中的绝对权重"></a>

### ContextInfo.get\_weight\_in\_index - 获取某只股票在某指数中的绝对权重

**原型**

**释义**

获取某只股票在某指数中的绝对权重

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `indexcode` | `string` | 指数代码，格式为 'stockcode.market'，例如 '000300.SH' |
| `stockcode` | `string` | 股票代码，格式为 'stockcode.market'，例如 '600004.SH' |

**返回值**

`float`：返回的数值单位是 %，如 1.6134 表示权重是 1.6134%

**示例**

<a id="data_function--获取成分股信息"></a>

## 获取成分股信息

<a id="data_function--contextinfo-get-stock-list-in-sector-获取板块成份股"></a>

### ContextInfo.get\_stock\_list\_in\_sector - 获取板块成份股

**原型**

**释义**

获取板块成份股，支持客户端左侧板块列表中任意的板块，包括自定义板块

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `sectorname` | `string` | 板块名，如 '沪深300'，'中证500'，'上证50'，'我的自选'等 |
| `realtime` | 毫秒级时间戳 | 实时数据的毫秒级时间戳 |

**返回值**

list：内含成份股代码，代码形式为 'stockcode.market'，如 '000002.SZ'

**示例**

<a id="data_function--获取交易日信息"></a>

## 获取交易日信息

注意

1.  该函数只能在`after_init`;`handlebar`运行

<a id="data_function--contextinfo-get-trading-dates-获取交易日信息"></a>

### ContextInfo.get\_trading\_dates - 获取交易日信息

**原型**

**释义**

ContextInfo.get\_trading\_dates(stockcode,start\_date,end\_date,count,period='1d')

**参数**

| 字段名 | 数据类型 | 解释 |
| --- | --- | --- |
| `stockcode` | `string` | 股票代码,缺省值''默认为当前图代码，如:'600000.SH' |
| `start_date` | `string` | 开始时间，缺省值''为空时不使用，如:'20170101','20170101000000' |
| `end_date` | `string` | 结束时间，缺省值''默认为当前bar的时间，如:'20170102','20170102000000' |
| `count` | `int` | K线个数，必须大于0，取包括end\_date往前的count个K线，但最早不会早于start\_date |
| `period` | `string` | k线类型,'1d':日线,'1m':分钟线,'3m':三分钟线,'5m':5分钟线,'15m':15分钟线,'30m':30分钟线,'1h':小时线,'1w':周线,'1mon':月线,'1q':季线,'1hy':半年线,'1y':年线 |

**返回值**

list:K线周期（交易日）列表 period为日线时返回如\['20170101','20170102',...\]样式 其它返回如\['20170101010000','20170102020000',...\]样式

**示例**
