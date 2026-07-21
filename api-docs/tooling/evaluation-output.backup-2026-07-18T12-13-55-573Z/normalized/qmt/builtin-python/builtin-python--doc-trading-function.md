---
platform: qmt
variant: builtin-python
source_role: primary
document_type: strategy_api
title: 7. 交易函数
section_path:
  - 迅投知识库 - 内置Python API文档全集
  - 7. 交易函数
source_file: api-docs/raw/qmt/innerapi-combined.html
source_url: file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html
source_anchor: "#doc-trading_function"
source_sha256: 08ffb4fd69f4e96745a5d83d27b6716c0682a20496b6664df00cc79c55670f28
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

# 7\. 交易函数

<a id="trading_function--交易下单函数"></a>

## 交易下单函数

<a id="trading_function--passorder-综合下单函数"></a>

### passorder - 综合下单函数

综合下单函数，用于股票、期货、期权等下单和新股、新债申购、融资融券等交易操作**推荐使用**

提示

1.  推荐使用
2.  可覆盖多品种下单
3.  注意参数的变化

**调用方法：**

**参数：**

| 参数名 | 类型 | 说明 | 提示 |
| --- | --- | --- | --- |
| `opType` | `int` | 交易类型 | 可选买、买，期货开仓、平仓等

可选值参考[opType-操作类型在新窗口打开](builtin-python--doc-enum-constants.md#enum_constants--optype-操作类型) |
| `orderType` | `int` |

下单方式 | 可选值参考[orderType-下单方式在新窗口打开](builtin-python--doc-enum-constants.md#enum_constants--ordertype-下单方式)

可选按股票数量买卖或按照金额等方式买卖

一、期货不支持 1102 和 1202;

二、对所有账号组的操作相当于对账号组里的每个账号做一样的操作，如 `passorder (23, 1202, 'testS', '000001. SZ', 5, -1, 50000, ContextInfo)`，意思就是对账号组 `testS` 里的所有账号都以最新价开仓买入 50000 元市值的 `000001.SZ` 平安银行；`passorder (60,1101,"test",'510050. SH', 5,-1,1, ContextInfo)`意思就是账号`test`申购 1 个单位 (900000股)的华夏上证50ETF (只申购不买入成分股)。

 |
| `accountID` | `string` | 资金账号 | 下单的账号ID（可多个）或账号组名或套利组名（一个篮子一个套利账号，如 accountID = '股票账户名, 期货账号'） |
| `orderCode` | `string` | 下单代码 | 1\. 如果是单股或单期货、港股，则该参数填合约代码；
2\. 如果是组合交易, 则该参数填篮子名称，参考[组合交易在新窗口打开](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#code_examples--%E7%BB%84%E5%90%88%E4%BA%A4%E6%98%93-1)；
3\. 如果是组合套利，则填一个篮子名和一个期货合约名（如orderCode = '篮子名, 期货合约名'），请参考[组合套利交易在新窗口打开](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#code_examples--%E7%BB%84%E5%90%88%E5%A5%97%E5%88%A9%E4%BA%A4%E6%98%93-1)

 |
| `prType` | `int` | 下单选价类型 | 可选值参考[prType-下单选价类型在新窗口打开](builtin-python--doc-enum-constants.md#enum_constants--prtype-下单选价类型)

特别的对于套利，这个 prType 只对篮子起作用，期货的采用默认的方式） |
| `price` | `float` | 下单价格 | 一、单股下单时，`prType` 是模型价/科创板盘后定价时 `price` 有效；其它情况无效；

1.1 即单股时， `prType` 参数为 `11`，`49` 时被使用。

1.2 `prType` 参数不为 `11`，`49` 时也需填写，填写的内容可为 `-1`，`0`，`2`，`100` 等任意数字；

二、组合下单时，是组合套利时，price 作套利比例有效，其它情况无效。 |
| `volume` | `int` | 下单数量（股 / 手 / 元 / %） | 根据 orderType 值最后一位确定 volume 的单位，可选值参考[volume - 下单在新窗口打开](builtin-python--doc-enum-constants.md#enum_constants--volume-下单数量) |
| `strategyName` | `string` | 自定义策略名 |

一、用来区分 `order` 委托和`deal` 成交来自不同的策略。

根据该策略名，`get_trade_detail_data`，`get_last_order_id` 函数可以获取相应策略名对应的委托或成交集合。

`strategyName` 只对同账号本地客户端有效，即 `strategyName` 只对当前客户端下的单进行策略区分，且该策略区分只能当前客户端使用。

 |
| `quickTrade` | `int` | 设定是否立即触发下单 |

可选值参考[quicktrade - 快速下单在新窗口打开](builtin-python--doc-enum-constants.md#enum_constants--quicktrade-快速下单)

`passorder`是对最后一根K线完全走完后生成的模型信号在下一根K线的第一个tick数据来时触发下单交易；

采用`quickTrade`参数设置为`1`时，非历史bar上执行时`（ContextInfo.is_last_bar()`为`True`），只要策略模型中调用到就触发下单交易。

`quickTrade`参数设置为`2`时，不判断bar状态，只要策略模型中调用到就触发下单交易，历史bar上也能触发下单，请谨慎使用。 |
| `userOrderId` | `string` | 用户自设委托 ID | 如果传入该参数，
则 `strategyName` 和 `quickTrade` 参数也填写。
对应 `order` 委托对象和 `deal` 成交对象中的 `m_strRemark` 属性，通过 `get_trade_detail_data` 函数或委托主推函数 `order_callback` 和成交主推函数 `deal_callback` 可拿到这两个对象信息。
 |
| ContextInfo | class | 系统参数 | 含有k线信息和接口的上下文对象 |

**返回：**

无

**更多示例：**

1.  [股票在新窗口打开](builtin-python--doc-code-examples.md#code_examples--股票)
2.  [基金在新窗口打开](builtin-python--doc-code-examples.md#code_examples--基金)
3.  [两融在新窗口打开](builtin-python--doc-code-examples.md#code_examples--两融-1)
4.  [期货在新窗口打开](builtin-python--doc-code-examples.md#code_examples--期货)
5.  [期权在新窗口打开](builtin-python--doc-code-examples.md#code_examples--期权)
6.  [新股申购在新窗口打开](builtin-python--doc-code-examples.md#code_examples--新股申购)
7.  [债券在新窗口打开](builtin-python--doc-code-examples.md#code_examples--债券)
8.  [ETF在新窗口打开](builtin-python--doc-code-examples.md#code_examples--etf)
9.  [组合交易在新窗口打开](builtin-python--doc-code-examples.md#code_examples--组合交易)
10.  [组合套利交易在新窗口打开](builtin-python--doc-code-examples.md#code_examples--组合套利交易)

<a id="trading_function--algo-passorder-算法下单-拆单-函数"></a>

### algo\_passorder - 算法下单（拆单）函数

用于按固定时间间隔和固定规则把目标交易数量拆分成多次下单的交易函数

**调用用法：**

提示

算法交易下单，此时使用**交易面板-程序交易-函数交易-函数交易**参数中设置的下单类型(普通交易,算法交易,随机量交易) 如果函数交易参数使用未修改的默认值,此函数和`passorder`函数一致， 设置了函数交易参数后，将会使用函数交易参数的超价等拆单参数，`algo_passorder`内的`prType`若赋值,则优先使用该参数，若`algo_passorder`内的`prType=-1`,将会使用`userOrderParam`内的`opType`，若`userOrderParam`未赋值，则使用界面上的函数交易参数的报价方式

**参数：**
其他参数同`passorder`，详细解释可参考`passorder`的说明
`userOrderParam` `dict[str:value]` 是用户自定义交易参数,主要用于修改算法交易的参数 其中`Key` `Value`定义如下

注：所有参数均为非必选

| Key | Value类型 | Value |
| --- | --- | --- |
| OrderType | int | 普通交易:`0`
算法交易:`1`
随机量交易:`2` |
| PriceType | int | 报价方式:数值同passorde prType |
| MaxOrderCount | int | 最大下单次数 |
| SinglePriceRange | int | 波动区间是否单向:
否:`0`，
是:`1` |
| PriceRangeType | int | 波动区间类型按比例:`0`,按数值`1` |
| PriceRangeValue | float | 波动区间(按数值) |
| PriceRangeRate | float | 波动区间(按比例)\[`0-1`\] |
| SuperPriceType | int | 单笔超价类型:
按比例:`0`
按数值`1` |
| SuperPriceRate | float | 单笔超价(按比例)\[`0-1`\] |
| SuperPriceValue | float | 单笔超价(按数值) |
| VolumeType | int | 单笔基准量类型卖1+2+3+4+5量:`0`
卖1+2+3+4量:`1`
...
卖1量:`4`
买1量:`5`
...
买1+2+3+4+5量:`9`
目标量:`10`
目标剩余量:`11`
持仓数量:`12` |
| VolumeRate | float | 单笔下单比率\[`0-1`\] |
| SingleNumMin | float | 单笔下单量最小值 |
| SingleNumMax | float | 单笔下单量最大值 |
| ValidTimeType | int | 有效时间类型:
`0`:按持续时间
`1` 按时间区间，默认为0 |
| ValidTimeElapse | int | 有效持续时间,ValidTimeType设置为0时生效 |
| ValidTimeStart | int | 有效开始时间偏移,ValidTimeType设置为1时生效 |
| ValidTimeEnd | int | 有效结束时间偏移,ValidTimeType设置为1时生效 |
| UndealtEntrustRule | int | 未成委托处理数值同prType |
| PlaceOrderInterval | int | 下撤单时间间隔 |
| UseTrigger | int | 是否触价:
否:`0`
是:`1` |
| TriggerType | int | 触价类型:
最新价大于:`1`
最新价小于:`2` |
| TriggerPrice | float | 触价价格 |
| SuperPriceEnable | int | 超价启用笔数 |

**返回**
无
**示例**

<a id="trading_function--smart-algo-passorder-智能算法-vwap-等-函数"></a>

### smart\_algo\_passorder - 智能算法（VWAP 等）函数

提示

1.  调用该函数需要有【智能算法】使用权限

用于使用主动算法或被动算法交易的函数如VWAP TWAP等

**调用方法一：**

提示

可选参数可缺省

**参数：**
其他参数同`passorder`，详细解释可参考[passorder的说明在新窗口打开](#trading_function--passorder-综合下单函数)

| 参数名 | 类型 | 说明 | 提示 |
| --- | --- | --- | --- |
| prType | int | **可选值**：
11:限价（只对单股情况支持,对组合交易不支持）
12:市价
**特别的对于套利：这个prType只对篮子起作用，期货的采用默认的方式** |  |
| smartAlgoType | str | 智能算法类型 \[[enum\_constants#smartAlgoType智能算法类型在新窗口打开](builtin-python--doc-enum-constants.md#enum_constants--enum-eordertype-算法交易、普通交易类型)\] |  |
| limitOverRate | int | 量比 数据范围0-100 | 网格算法无此项
若在algoParam中填写量比，则填写范围0-1的小数。 |
| minAmountPerOrder | int | 智能算法最小委托金额，数据范围0-100000 |  |
| targetPriceLevel | int | 智能算法目标价格,可选值：
1：己方盘口 1
2：己方盘口2
3：己方盘口3
4：己方盘口4
5：己方盘口5
6：最新价
7：对方盘口 | 一、输入无效值则targetPriceLevel为1
二、本项只针对冰山算法,其他算法可缺省。 |
| startTime | str | 智能算法开始时间 | 格式"HH:MM:SS"，如"10:30:00"。如果缺省值，则默认为"09:30:00" |
| endTime | str | 智能算法截止时间 | 格式"HH:MM:SS"，如"14:30:00"。如果缺省值，则默认为"15:30:00" |
| limitControl | int | 涨跌停控制 | 默认值为1
1：涨停不卖跌停不买
0：无限制 |

**返回**
无

**示例：**

**调用方法二：**
当时用algoParam时，函数声明为：`smart_algo_passorder(opType,orderType,accountid,orderCode,prType,modelprice,volume,strageName,quickTrade,userid,smartAlgoType,startTime,endTime,algoParam,ContextInfo)`参数均不可缺省
`smartAlgoType`,`startTime`,`endTime` 含义同上，`algoParam`请使用下面的方法获取：

<a id="trading_function--获取algoparam具体字段"></a>

#### 获取algoParam具体字段

**释义**

获取智能算法参数配置信息

**用法**

**参数**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `algoList` | list | 需要查询参数配置信息的算法名称列表, 若传空则查询全部有权限的算法参数配置信息 |

**返回**

返回一个字典，键为算法名称，值为参数字典列表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `key` | string | 参数名称key值,即`smart_algo_order`中`algoList`字典需要传的键值 |
| `name` | string | 参数名称 |
| `dataType` | string | 参数类型 |
| `valueRange` | string | 参数范围 |
| `defaultValue` | string | 参数默认值 |
| `enumName` | string | 参数枚举值的名称 |
| `enumValue` | string | 参数实际的枚举值 |
| `unit` | string | 参数的单位, 当单位为%时, 值要填写小数而非参数范围所示的百分数值 |
| `valueRangeByName` | string | 不同算法参数范围 |
| `defaultValueByName` | string | 不同算法参数默认值 |

**示例**

<a id="trading_function--cancel-撤销委托"></a>

### cancel-撤销委托

**调用方法**`cancel(orderId, accountId, accountType, ContextInfo)`

**参数**

| 参数名 | 类型 | 含义 | 说明 |
| --- | --- | --- | --- |
| orderId | string | 委托号 | 必填 |
| accountID | string | 资金账号 | 必填 |
| AccountType | string | 账号类型 可选：
'FUTURE'：期货
'STOCK'：股票
'CREDIT'：信用
'HUGANGTONG'：沪港通
'SHENGANGTONG'：深港通
'STOCK\_OPTION'：期权
 | 必填 |
| ContextInfo | class | 含有k线信息和接口的上下文对象 | 必填 |

**返回** bool，是否发出了取消委托信号，返回值含义：

> True：是
> False：否

**示例**

<a id="trading_function--cancel-task-撤销任务"></a>

### cancel\_task - 撤销任务

**调用方法**`cancel_task(taskId,accountId,accountType,ContextInfo)`

**参数**

| 参数名 | 类型 | 含义 | 说明 |
| --- | --- | --- | --- |
| taskId | string | 委托号 | 必填 |
| accountID | string | 资金账号 | 必填 |
| AccountType | string | 账号类型 可选：
'FUTURE'：期货
'STOCK'：股票
'CREDIT'：信用
'HUGANGTONG'：沪港通
'SHENGANGTONG'：深港通
'STOCK\_OPTION'：期权
 | 必填 |
| ContextInfo | class | 含有k线信息和接口的上下文对象 | 必填 |

**返回** bool，是否发出了撤销任务信号，返回值含义：

> True：是
>
> False：否

**示例**

<a id="trading_function--pause-task-暂停任务"></a>

### pause\_task - 暂停任务

暂停智能算法任务

**调用方法** pause\_task(taskId,accountId,accountType,ContextInfo)

**参数**

| 参数名 | 类型 | 含义 | 说明 |
| --- | --- | --- | --- |
| taskId | string | 委托号 | 必填 |
| accountID | string | 资金账号 | 必填 |
| AccountType | string | 账号类型 可选：
'FUTURE'：期货
'STOCK'：股票
'CREDIT'：信用
'HUGANGTONG'：沪港通
'SHENGANGTONG'：深港通
'STOCK\_OPTION'：期权
 | 必填 |
| ContextInfo | class | 含有k线信息和接口的上下文对象 | 必填 |

**返回** bool，是否发出了暂停任务信号，返回值含义：

> True：是
>
> False：否

**示例**

<a id="trading_function--resume-task-继续任务"></a>

### resume\_task - 继续任务

继续智能算法任务

**调用方法**`resume_task(taskId,accountId,accountType,ContextInfo)`

**参数**

| 参数名 | 类型 | 含义 | 说明 |
| --- | --- | --- | --- |
| taskId | string | 委托号 | 必填 |
| accountID | string | 资金账号 | 必填 |
| AccountType | string | 账号类型 可选：
'FUTURE'：期货
'STOCK'：股票
'CREDIT'：信用
'HUGANGTONG'：沪港通
'SHENGANGTONG'：深港通
'STOCK\_OPTION'：期权
 | 必填 |
| ContextInfo | class | 含有k线信息和接口的上下文对象 | 必填 |

**返回** bool，是否发出了重启任务信号，返回值含义：

> True：是
>
> False：否

**示例**

<a id="trading_function--get-basket-获取股票篮子"></a>

### get\_basket-获取股票篮子

**用法：** get\_basket(basketName)

**释义：** 获取股票篮子

**参数：**

-   basketName：股票篮子名称

**示例：**

<a id="trading_function--set-basket-设置股票篮子"></a>

### set\_basket-设置股票篮子

**用法：** set\_basket(basketDict)

**释义：** 设置passorder的股票篮子,仅用于passorder进行篮子交易,设置成功后,用get\_basket可以取出后即可进行passorder组合交易下单

**参数：**

-   basketDict：股票篮子 {'name':股票篮子名称,'stocks':\[{'stock':股票名称,'weight',权重,'quantity':数量,'optType':交易类型}\]} 。

**示例：**

<a id="trading_function--交易查询函数"></a>

## 交易查询函数

<a id="trading_function--get-trade-detail-data-查询账号资金信息、委托记录等"></a>

### get\_trade\_detail\_data-查询账号资金信息、委托记录等

**调用方法** `get_trade_detail_data(accountID, strAccountType, strDatatype, strategyName)`
或不区分策略
`get_trade_detail_data(accountID, strAccountType, strDatatype)`

**参数**

| 参数名 | 类型 | 说明 | 备注 |
| --- | --- | --- | --- |
| accountID | string | 资金账号 | 必填 |
| strAccountType | string | 账号类型 可选：
'FUTURE'：期货
'STOCK'：股票
'CREDIT'：信用
'HUGANGTONG'：沪港通
'SHENGANGTONG'：深港通
'STOCK\_OPTION'：期权
 | 必填 |
| strDatatype | string | 要查询数据类型 可选：
`ACCOUNT`：[账号对象在新窗口打开](builtin-python--doc-data-structure.md#data_structure--account-账户对象)或[信用账号对象在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ccreditaccountdetail-信用账号对象-非查柜台)
`POSITION`：[持仓在新窗口打开](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#data_structure--position-statistics-%E6%8C%81%E4%BB%93%E7%BB%9F%E8%AE%A1%E5%AF%B9%E8%B1%A1)
`POSITION_STATISTICS`：[持仓统计在新窗口打开](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#data_structure--position-statistics-%E6%8C%81%E4%BB%93%E7%BB%9F%E8%AE%A1%E5%AF%B9%E8%B1%A1)
`ORDER`：[委托在新窗口打开](builtin-python--doc-data-structure.md#data_structure--order-委托对象)
`DEAL` ：[成交在新窗口打开](builtin-python--doc-data-structure.md#data_structure--deal-成交对象)
`TASK`：[任务在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ctaskdetail-任务对象) | 必填 |
| strategyName | string | 策略 当用`passorder`下单时指定了strategyName 参数时，当查询成交和委托时传入同样的`strageName`，则可以只返回包含`strategyName`的委托子集或成交子集 | `strategyName`参数只对成交和委托有效,选填 |

**返回** list，list 中放的是对应strDatatype的 Python对象，通过 dir(pythonobj) 可返回某个对象的属性列表。

有五种交易相关信息，包括：

ACCOUNT：[账号对象在新窗口打开](builtin-python--doc-data-structure.md#data_structure--account-账户对象)或[信用账号对象在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ccreditaccountdetail-信用账号对象-非查柜台)

POSITION：[持仓明细在新窗口打开](builtin-python--doc-data-structure.md#data_structure--position-持仓对象)

POSITION\_STATISTICS: [持仓统计在新窗口打开](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#data_structure--position-statistics-%E6%8C%81%E4%BB%93%E7%BB%9F%E8%AE%A1%E5%AF%B9%E8%B1%A1)

ORDER：[委托在新窗口打开](builtin-python--doc-data-structure.md#data_structure--order-委托对象)

DEAL：[成交在新窗口打开](builtin-python--doc-data-structure.md#data_structure--deal-成交对象)

TASK：[任务在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ctaskdetail-任务对象)

**示例：**

<a id="trading_function--get-history-trade-detail-data-查询历史交易明细"></a>

### get\_history\_trade\_detail\_data - 查询历史交易明细

**用法：** get\_history\_trade\_detail\_data(accountID,strAccountType,strDatatype,strStratDate,strEndDate);

**释义：** 获取历史成交明细数据，返回结果为一个(\[timetag,obj...\])的元组

**参数：**

accountID：string,账号； strAccountType：string,账号类型,有"FUTURE","STOCK","CREDIT","HUGANGTONG","SHENGANGTONG","STOCK\_OPTION"； strDatatype：string,交易明细数据类型,有：持仓"POSITION"、委托"ORDER"、成交"DEAL"； strStratDate：string,开始时间,如'20240513'； strEndDate：string,结束时间,如'20240514'；

\*\*返回：\*\*list,list中放的是PythonObj,通过dir(pythonobj)可返回某个对象的属性列表 **示例：**

<a id="trading_function--get-ipo-data-获取当日新股新债信息"></a>

### get\_ipo\_data-获取当日新股新债信息

**用法：** get\_ipo\_data(\[,type\])

**释义：** 获取当日新股新债信息，返回结果为一个字典,包括新股申购代码,申购名称,最大申购数量,最小申购数量等数据

**参数：**

-   type：为空时返回新股新债信息，type="STOCK"时只返回新股申购信息，type="BOND"时只返回新债申购信息

**示例：**

<a id="trading_function--get-new-purchase-limit-获取账户新股申购额度"></a>

### get\_new\_purchase\_limit-获取账户新股申购额度

**用法：** get\_new\_purchase\_limit(accid)

**释义：** 获取账户新股申购额度，返回结果为一个字典,包括上海主板,深圳市场,上海科创版的申购额度

**参数：**

-   accid：资金账号，必须时股票账号或者信用账号

**示例：**

<a id="trading_function--get-value-by-order-id-根据委托号获取委托或成交信息"></a>

### get\_value\_by\_order\_id-根据委托号获取委托或成交信息

**调用方法**`get_value_by_order_id(orderId, accountID, strAccountType, strDatatype)`

**参数**

| 参数名 | 类型 | 含义 | 说明 |
| --- | --- | --- | --- |
| orderId | string | 委托号 | 必填 |
| accountID | string | 资金账号 | 必填 |
| strAccountType | string | 账号类型 可选：
'FUTURE'：期货
'STOCK'：股票
'CREDIT'：信用
'HUGANGTONG'：沪港通
'SHENGANGTONG'：深港通
'STOCK\_OPTION'：期权
 | 必填 |
| strDatatype | string | 要查询数据类型 可选：
'ORDER'：委托
'DEAL' ：成交 | 必填 |

**返回**

委托对象 或 成交对象

**示例**

<a id="trading_function--get-last-order-id-获取最新的委托或成交的委托号"></a>

### get\_last\_order\_id-获取最新的委托或成交的委托号

获取最新的委托或成交的委托号

提示

注意，下单后需要一段不确定的时间才能查询到此次委托的委托号，而且如果委托废单，则只能查询到上次成功下单的委托号

**调用方法**

**参数**

| 参数名 | 类型 | 含义 | 说明 |
| --- | --- | --- | --- |
| accountID | string | 资金账号 | 必填 |
| strAccountType | string | 账号类型 可选：
'FUTURE'：期货
'STOCK'：股票
'CREDIT'：信用
'HUGANGTONG'：沪港通
'SHENGANGTONG'：深港通
'STOCK\_OPTION'：期权
 | 必填 |
| strDatatype | string | 要查询数据类型 可选：
'ORDER'：委托
'DEAL' ：成交 | 必填 |
| strategyName | string | 策略 当用passorder下单时指定了strategyName 参数时，当查询成交和委托时传入同样的strageName，则可以只返回包含strategyName的委托子集或成交子集 | 选填 |

**返回**

String，委托号，如果没找到返回 '-1'。

**示例**

<a id="trading_function--get-assure-contract-获取两融担保标的明细"></a>

### get\_assure\_contract-获取两融担保标的明细

**用法：** get\_assure\_contract(accId)

**释义：** 获取信用账户担保合约明细

**参数：**

-   accId：信用账户

**返回：** list，list 中放的是 [StkSubjects在新窗口打开](builtin-python--doc-data-structure.md#data_structure--stkcompacts-负债合约对象)，通过 dir(pythonobj) 可返回某个对象的属性列表。

**示例：**

<a id="trading_function--get-enable-short-contract-获取可融券明细"></a>

### get\_enable\_short\_contract-获取可融券明细

提示

注:由于字段m\_dSloRatio、m\_dSloStatus提供来源和取担保品明细([get\_assure\_contract](#trading_function--get-assure-contract-获取两融担保标的明细))重复，字段在2021年9月移除，后续用担保品明细接口获取,具体见 [担保标的对象字段说明在新窗口打开](builtin-python--doc-data-structure.md#data_structure--stkcompacts-负债合约对象)

**用法：** get\_enable\_short\_contract(accId)

**释义：** 获取信用账户当前可融券的明细

**参数：**

-   accId：信用账户

**返回：** list，list 中放的是 [CreditSloEnableAmount在新窗口打开](builtin-python--doc-data-structure.md#data_structure--creditsloenableamount-可融券明细对象)，通过 dir(pythonobj) 可返回某个对象的属性列表。

**示例：**

<a id="trading_function--query-credit-account-查询信用账户明细"></a>

### query\_credit\_account - 查询信用账户明细

注意

1.  本函数一次最多查询200只股票的两融最大下单量，且同时只能有一个查询,如果前面的查询正在进行中,后面的查询将会提前返回。本函数从服务器查询数据,建议平均查询时间间隔180s一次,不可频繁调用。
2.  该函数必须配合credit\_account\_callback回调才能使用，关于此回调的说明请看[credit\_account\_callback在新窗口打开](builtin-python--doc-callback-function.md#callback_function--credit-account-callback-查询信用账户明细回调)
3.  callback返回的对象是[CCreditAccountDetail在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ccreditaccountdetail-信用账号对象-非查柜台)

调用query\_credit\_account，该接口的查询结果将会推送给credit\_account\_callback，所以程序里需要按照函数参数实现函数`credit_account_callback`,callback返回的对象是[CCreditAccountDetail在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ccreditaccountdetail-信用账号对象-非查柜台)

**用法：** query\_credit\_account(accountId,seq,ContextInfo)
**释义：** 查询信用账户明细。本函数只能有一个查询，如果前面的查询正在进行中，后面的查询将会提前返回。

**参数：**

-   accountId：string，查询的两融账号

-   seq：int，查询序列号，建议输入唯一值以便对应结果回调


**示例：**

**回调示例** 见[query\_credit\_account在新窗口打开](builtin-python--doc-code-examples.md#code_examples--获取两融账号信息示例)

<a id="trading_function--query-credit-opvolume-查询两融最大可下单量"></a>

### query\_credit\_opvolume - 查询两融最大可下单量

注意

1.  本函数一次最多查询200只股票的两融最大下单量，且同时只能有一个查询,如果前面的查询正在进行中,后面的查询将会提前返回。本函数从服务器查询数据,建议平均查询时间间隔180s一次,不可频繁调用。
2.  该函数必须配合credit\_opvolume\_callback回调才能使用,关于此回调的说明请看[credit\_account\_callback在新窗口打开](builtin-python--doc-callback-function.md#callback_function--credit-opvolume-callback-查询两融最大可下单量的回调)

调用query\_credit\_opvolume，该接口的查询结果将会推送给credit\_opvolume\_callback，所以必须配合credit\_opvolume\_callback回调才能使用

**用法：** query\_credit\_opvolume(accountId,stockCode,opType,prType,price,seq,ContextInfo)

**释义：** 查询两融最大可下单量。

**参数：**

-   `accountId`:查询的两融账号
-   `stockCode`:需要查询的股票代码,stockCode为List的类型,可以查询多只股票
-   `opType`:两融下单类型,同`passorder`的下单类型
-   `prType`:报单价格类型,同`passorder`的报价类型
-   `seq`:查询序列号,int型，建议输入唯一值以便对应结果回调
-   `price`:报价(非限价单可以填任意值),**如果`stockCode`为`List`类型,报价也需要为长度相同的List**
-   `ContextInfo`:ContextInfo类

**示例：**

<a id="trading_function--get-option-subject-position-取期权标的持仓"></a>

### get\_option\_subject\_position-取期权标的持仓

**用法：** get\_option\_subject\_position(accountID)

**释义：** 取期权标的持仓

**参数：**

-   accountID：string,账号

**返回：** list,list中放的是[CLockPosition在新窗口打开](builtin-python--doc-data-structure.md#data_structure--clockposition-期权标的持仓),通过dir(pythonobj)可返回某个对象的属性列表

**示例：**

<a id="trading_function--get-comb-option-取期权组合持仓"></a>

### get\_comb\_option-取期权组合持仓

**用法：** get\_comb\_option(accountID)

**释义：** 取期权组合持仓

**参数：**

-   accountID：string,账号

**返回：** list,list中放的是[CStkOptCombPositionDetail 在新窗口打开](builtin-python--doc-data-structure.md#data_structure--cstkoptcombpositiondetail-期权组合持仓),通过dir(pythonobj)可返回某个对象的属性列表

**示例：**

<a id="trading_function--get-unclosed-compacts-获取未了结负债合约明细"></a>

### get\_unclosed\_compacts-获取未了结负债合约明细

**用法：** get\_unclosed\_compacts(accountID,accountType)

**释义：** 获取未了结负债合约明细

**参数：**

-   accountID：str，资金账号
-   accountType：str，账号类型，这里应该填'CREDIT'

**返回：**

list(\[ CStkUnclosedCompacts, ... \]) 负债列表，CStkUnclosedCompacts属性如下：

| 字段名称 | 类型 | 说明 |
| --- | --- | --- |
| `m_strAccountID` | string | 账号ID |
| `m_nBrokerType` | int | 账号类型
1-期货账号
2-股票账号
3-信用账号
5-期货期权账号
6-股票期权账号
7-沪港通账号
11-深港通账号 |
| `m_strExchangeID` | string | 市场 |
| `m_strInstrumentID` | string | 证券代码 |
| `m_eCompactType` | int | 合约类型
32-不限制
48-融资
49-融券 |
| `m_eCashgroupProp` | int | 头寸来源
32-不限制
48-普通头寸
49-专项头寸 |
| `m_nOpenDate` | int | 开仓日期(如'20201231') |
| `m_nBusinessVol` | int | 合约证券数量 |
| `m_nRealCompactVol` | int | 未还合约数量 |
| `m_nRetEndDate` | int | 到期日(如'20201231') |
| `m_dBusinessBalance` | float | 合约金额 |
| `m_dBusinessFare` | float | 合约息费 |
| `m_dRealCompactBalance` | float | 未还合约金额 |
| `m_dRealCompactFare` | float | 未还合约息费 |
| `m_dRepaidFare` | float | 已还息费 |
| `m_dRepaidBalance` | float | 已还金额 |
| `m_strCompactId` | string | 合约编号 |
| `m_strEntrustNo` | string | 委托编号 |
| `m_nRepayPriority` | int | 偿还优先级 |
| `m_strPositionStr` | string | 定位串 |
| `m_eCompactRenewalStatus` | int | 合约展期状态
48-可申请
49-已申请
50-审批通过
51-审批不通过
52-不可申请
53-已执行
54-已取消 |
| `m_nDeferTimes` | int | 展期次数 |

**示例：**

<a id="trading_function--get-closed-compacts-获取已了结负债合约明细"></a>

### get\_closed\_compacts-获取已了结负债合约明细

**用法：** get\_closed\_compacts(accountID,accountType)

**释义：** 获取已了结负债合约明细

**参数：**

-   accountID：str，资金账号
-   accountType：str，账号类型，这里应该填'CREDIT'

**返回：**

list(\[ CStkUnclosedCompacts, ... \]) 负债列表，CStkUnclosedCompacts属性如下：

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `m_strAccountID` | string | 账号ID |
| `m_nBrokerType` | int | 账号类型
1-期货账号
2-股票账号
3-信用账号
5-期货期权账号
6-股票期权账号
7-沪港通账号
11-深港通账号 |
| `m_strExchangeID` | string | 市场 |
| `m_strInstrumentID` | string | 证券代码 |
| `m_eCompactType` | int | 合约类型
32-不限制
48-融资
49-融券 |
| `m_eCashgroupProp` | int | 头寸来源
32-不限制
48-普通头寸
49-专项头寸 |
| `m_nOpenDate` | int | 开仓日期(如'20201231') |
| `m_nBusinessVol` | int | 合约证券数量 |
| `m_nRetEndDate` | int | 到期日(如'20201231') |
| `m_nDateClear` | int | 了结日期(如'20201231') |
| `m_nEntrustVol` | int | 委托数量 |
| `m_dEntrustBalance` | float | 委托金额 |
| `m_dBusinessBalance` | float | 合约金额 |
| `m_dBusinessFare` | float | 合约息费 |
| `m_dRepaidFare` | float | 已还息费 |
| `m_dRepaidBalance` | float | 已还金额 |
| `m_strCompactId` | string | 合约编号 |
| `m_strEntrustNo` | string | 委托编号 |
| `m_strPositionStr` | string | 定位串 |

**示例：**

<a id="trading_function--其他交易函数-仅回测可用"></a>

## 其他交易函数（仅回测可用）

警告

以下函数仅回测生效，实盘和模拟盘交易均不可用

<a id="trading_function--order-lots-指定手数交易"></a>

### order\_lots-指定手数交易

**用法：** order\_lots(stockcode, lots\[, style, price\], ContextInfo\[, accId\])

**释义：** 指定手数交易，指定手数发送买/卖单。如有需要落单类型当做一个参量传入，如果忽略掉落单类型，那么默认以最新价下单。

**参数：**

-   stockcode：代码，string，如 '000002.SZ'

-   lots：手数，int

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定 选此参数时必须指定有效的`price`参数，其他style值可不用传入price参数
    >
    > 'HANG'：挂单 用己方盘口挂单，即买入时用盘口买一价下单，卖出时用卖一价挂单，
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE5', 'SALE4', 'SALE3', 'SALE2', 'SALE1'：卖5-1价
    >
    > 'BUY1', 'BUY2', 'BUY3', 'BUY4', 'BUY5'：买1-5价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--order-value-指定价值交易"></a>

### order\_value-指定价值交易

**用法：** order\_value(stockcode, value\[, style, price\], ContextInfo\[, accId\])

**释义：** 指定价值交易，使用想要花费的金钱买入 / 卖出股票，而不是买入 / 卖出想要的股数，正数代表买入，负数代表卖出。股票的股数总是会被调整成对应的 100 的倍数（在中国 A 股市场 1 手是 100 股）。当您提交一个卖单时，该方法代表的意义是您希望通过卖出该股票套现的金额，如果金额超出了您所持有股票的价值，那么您将卖出所有股票。需要注意，如果资金不足，该 API 将不会创建发送订单。

**参数：**

-   stockcode：代码，string，如 '000002.SZ'

-   value：金额（元），double

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE5', 'SALE4', 'SALE3', 'SALE2', 'SALE1'：卖5-1价
    >
    > 'BUY1', 'BUY2', 'BUY3', 'BUY4', 'BUY5'：买1-5价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--order-percent-指定比例交易"></a>

### order\_percent-指定比例交易

**用法：** order\_percent(stockcode, percent\[, style, price\], ContextInfo\[, accId\])

**释义：** 指定比例交易，发送一个等于目前投资组合价值（市场价值和目前现金的总和）一定百分比的买 / 卖单，正数代表买，负数代表卖。股票的股数总是会被调整成对应的一手的股票数的倍数（1 手是 100 股）。百分比是一个小数，并且小于或等于1（小于等于100%），0.5 表示的是 50%。需要注意，如果资金不足，该 API 将不会创建发送订单。

**参数：**

-   stockcode：代码，string，如 '000002.SZ'

-   percent：比例，double

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE5', 'SALE4', 'SALE3', 'SALE2', 'SALE1'：卖5-1价
    >
    > 'BUY1', 'BUY2', 'BUY3', 'BUY4', 'BUY5'：买1-5价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--order-target-value-指定目标价值交易"></a>

### order\_target\_value-指定目标价值交易

**用法：** order\_target\_value(stockcode, tar\_value\[, style, price\], ContextInfo\[, accId\])

**释义：** 指定目标价值交易，买入 / 卖出并且自动调整该证券的仓位到一个目标价值。如果还没有任何该证券的仓位，那么会买入全部目标价值的证券；如果已经有了该证券的仓位，则会买入 / 卖出调整该证券的现在仓位和目标仓位的价值差值的数目的证券。需要注意，如果资金不足，该API将不会创建发送订单。

**参数：**

-   stockcode：代码，string，如 '000002.SZ'

-   tar\_value：目标金额（元），double，非负数

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE5', 'SALE4', 'SALE3', 'SALE2', 'SALE1'：卖5-1价
    >
    > 'BUY1', 'BUY2', 'BUY3', 'BUY4', 'BUY5'：买1-5价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--order-target-percent-指定目标比例交易"></a>

### order\_target\_percent-指定目标比例交易

**用法：** order\_target\_percent(stockcode, tar\_percent\[, style, price\], ContextInfo\[, accId\])

**释义：** 指定目标比例交易，买入 / 卖出证券以自动调整该证券的仓位到占有一个指定的投资组合的目标百分比。投资组合价值等于所有已有仓位的价值和剩余现金的总和。买 / 卖单会被下舍入一手股数（A 股是 100 的倍数）的倍数。目标百分比应该是一个小数，并且最大值应该小于等于1，比如 0.5 表示 50%，需要注意，如果资金不足，该API将不会创建发送订单。

**参数：**

-   stockcode：代码，string，如 '000002.SZ'

-   tar\_percent：目标百分比 \[0 ~ 1\]，double

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE5', 'SALE4', 'SALE3', 'SALE2', 'SALE1'：卖5-1价
    >
    > 'BUY1', 'BUY2', 'BUY3', 'BUY4', 'BUY5'：买1-5价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--order-shares-指定股数交易"></a>

### order\_shares-指定股数交易

**用法：** order\_shares(stockcode, shares\[, style, price\], ContextInfo\[, accId\])

**释义：** 指定股数交易，指定股数的买 / 卖单,最常见的落单方式之一。如有需要落单类型当做一个参量传入，如果忽略掉落单类型，那么默认以最新价下单。

**参数：**

-   stockcode：代码，string，如 '000002.SZ'

-   shares：股数，int

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE5', 'SALE4', 'SALE3', 'SALE2', 'SALE1'：卖5-1价
    >
    > 'BUY1', 'BUY2', 'BUY3', 'BUY4', 'BUY5'：买1-5价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--buy-open-期货买入开仓"></a>

### buy\_open-期货买入开仓

**用法：** buy\_open(stockcode, amount\[, style, price\], ContextInfo\[, accId\])

**释义：** 期货买入开仓

**参数：**

-   stockcode：代码，string，如 'IF1805.IF'

-   amount：手数，int

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE1'：卖一价
    >
    > 'BUY1'：买一价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--buy-close-tdayfirst-期货买入平仓-平今优先"></a>

### buy\_close\_tdayfirst-期货买入平仓（平今优先）

**用法：** buy\_close\_tdayfirst(stockcode, amount\[, style, price\], ContextInfo\[, accId\])

**释义：** 期货买入平仓，平今优先

**参数：**

-   stockcode：代码，string，如 'IF1805.IF'

-   amount：手数，int

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE1'：卖一价
    >
    > 'BUY1'：买一价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--buy-close-ydayfirst-期货买入平仓-平昨优先"></a>

### buy\_close\_ydayfirst-期货买入平仓（平昨优先）

**用法：** buy\_close\_ydayfirst(stockcode, amount\[, style, price\], ContextInfo\[, accId\])

**释义：** 期货买入开仓，平昨优先

**参数：**

-   stockcode：代码，string，如 'IF1805.IF'

-   amount：手数，int

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE1'：卖一价
    >
    > 'BUY1'：买一价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--sell-open-期货卖出开仓"></a>

### sell\_open-期货卖出开仓

**用法：** sell\_open(stockcode, amount\[, style, price\], ContextInfo\[, accId\])

**释义：** 期货卖出开仓

**参数：**

-   stockcode：代码，string，如 'IF1805.IF'

-   amount：手数，int

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE1'：卖一价
    >
    > 'BUY1'：买一价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--sell-close-tdayfirst-期货卖出平仓-平今优先"></a>

### sell\_close\_tdayfirst-期货卖出平仓（平今优先）

**用法：** sell\_close\_tdayfirst(stockcode, amount\[, style, price\], ContextInfo\[, accId\])

**释义：** 期货卖出平仓，平今优先

**参数：**

-   stockcode：代码，string，如 'IF1805.IF'

-   amount：手数，int

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE1'：卖一价
    >
    > 'BUY1'：买一价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--sell-close-ydayfirst-期货卖出平仓-平昨优先"></a>

### sell\_close\_ydayfirst-期货卖出平仓（平昨优先）

**用法：** sell\_close\_ydayfirst(stockcode, amount\[, style, price\], ContextInfo\[, accId\])

**释义：** 期货卖出平仓，平昨优先

**参数：**

-   stockcode：代码，string，如 'IF1805.IF'

-   amount：手数，int

-   style：下单选价类型，string，默认为最新价 'LATEST'，可选值：

    > 'LATEST'：最新
    >
    > 'FIX'：指定
    >
    > 'HANG'：挂单
    >
    > 'COMPETE'：对手
    >
    > 'MARKET'：市价
    >
    > 'SALE1'：卖一价
    >
    > 'BUY1'：买一价

-   price：价格，double

-   ContextInfo：PythonObj，Python 对象，这里必须是 ContextInfo

-   accId：账号，string


**返回：** 无

**示例：**

<a id="trading_function--已弃用-get-debt-contract-获取两融负债合约明细"></a>

### \[已弃用\] get\_debt\_contract-获取两融负债合约明细

**用法：** get\_debt\_contract(accId)

**释义：** 获取信用账户负债合约明细

此接口已弃用，替代接口为get\_unclosed\_compacts（获取未了结负债）和get\_closed\_compacts（获取已了结负债）

**参数：**

-   accId：信用账户

**返回：** list，list 中放的是 [PythonObj](https://dict.thinktrader.net/pages/e148c4/#_5-3-7-stkcompacts%E8%B4%9F%E5%80%BA%E5%90%88%E7%BA%A6%E5%AF%B9%E8%B1%A1)，通过 dir(pythonobj) 可返回某个对象的属性列表。

**示例：**

<a id="trading_function--get-hkt-exchange-rate-获取沪深港通汇率数据"></a>

### get\_hkt\_exchange\_rate-获取沪深港通汇率数据

**用法：** get\_hkt\_exchange\_rate(accountID,accountType)

**释义：** 获取沪深港通汇率数据

**参数：**

-   accountID：string,账号；
-   accountType:string,账号类型,必须填HUGANGTONG或者SHENGANGTONG

**返回：**

> dict,字段释义：
>
> bidReferenceRate:买入参考汇率
>
> askReferenceRate:卖出参考汇率
>
> dayBuyRiseRate:日间买入参考汇率浮动比例
>
> daySaleRiseRate:日间卖出参考汇率浮动比例

**示例：**
