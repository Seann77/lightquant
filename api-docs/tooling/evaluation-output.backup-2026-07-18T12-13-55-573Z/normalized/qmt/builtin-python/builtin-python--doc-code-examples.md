---
platform: qmt
variant: builtin-python
source_role: primary
document_type: strategy_api
title: 13. 完整示例
section_path:
  - 迅投知识库 - 内置Python API文档全集
  - 13. 完整示例
source_file: api-docs/raw/qmt/innerapi-combined.html
source_url: file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html
source_anchor: "#doc-code_examples"
source_sha256: 08ffb4fd69f4e96745a5d83d27b6716c0682a20496b6664df00cc79c55670f28
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

# 13\. 完整示例

<a id="code_examples--获取行情示例"></a>

## 获取行情示例

<a id="code_examples--按品种划分"></a>

### 按品种划分

<a id="code_examples--两融"></a>

#### 两融

<a id="code_examples--获取融资融券账户可融资买入标的"></a>

##### 获取融资融券账户可融资买入标的

<a id="code_examples--按功能划分"></a>

### 按功能划分

<a id="code_examples--订阅k线全推"></a>

#### 订阅K线全推

提示

1.  K线全推需要[VIP权限在新窗口打开](http://dict.thinktrader.net/dictionary/?id=null#vip-%E8%A1%8C%E6%83%85%E7%94%A8%E6%88%B7%E4%BC%98%E5%8A%BF%E5%AF%B9%E6%AF%94)，非VIP用户请勿使用此功能

订阅全市场1m周期K线

<a id="code_examples--获取n分钟周期k线数据"></a>

#### 获取N分钟周期K线数据

提示

1.  获取历史N分钟数据前，需要先下载历史数据
2.  1m以上，5m以下的数据，是通过1m数据合成的
3.  5m以上，1d以下的数据，是通过5m数据合成的
4.  1d以上的数据，是通过1d的数据合成的

<a id="code_examples--获取-lv1-行情数据"></a>

#### 获取 Lv1 行情数据

本示例用于说明如何通过函数获取行情数据。

<a id="code_examples--获取-lv2-数据-需要数据源支持"></a>

#### 获取 Lv2 数据（需要数据源支持）

<a id="code_examples--方法1-查询lv2数据"></a>

##### 方法1 - 查询LV2数据

使用该函数后，会定期查询最新数据，并进行数据返回。

<a id="code_examples--方法2-订阅lv2数据"></a>

##### 方法2 - 订阅LV2数据

此方法在发起订阅后，会自动收到所订阅数据，订阅方需要记录订阅函数返回的订阅号，并在不需要订阅时调用unsubscribe\_quote反订阅数据，释放资源。

<a id="code_examples--使用-lv1-全推数据计算全市场涨幅"></a>

#### 使用 Lv1 全推数据计算全市场涨幅

<a id="code_examples--在行情回调函数里处理动态行情"></a>

#### 在行情回调函数里处理动态行情

[ContextInfo.subscribe\_quote - 订阅行情函数说明](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#data_function--contextinfosubscribe_quote---%E8%AE%A2%E9%98%85%E8%A1%8C%E6%83%85%E6%95%B0%E6%8D%AE)
[行情回调函数字段说明](builtin-python--doc-data-structure.md#data_structure--交易类)

<a id="code_examples--python写入扩展数据"></a>

#### python写入扩展数据

<a id="code_examples--扩展数据展示"></a>

### 扩展数据展示

![扩展数据](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E6%89%A9%E5%B1%95%E6%95%B0%E6%8D%AE-58079b49.png)

<a id="code_examples--每1分钟统计一次市场涨跌情况"></a>

#### 每1分钟统计一次市场涨跌情况

<a id="code_examples--交易下单示例"></a>

## 交易下单示例

<a id="code_examples--按品种划分-1"></a>

### 按品种划分

<a id="code_examples--股票"></a>

#### 股票

<a id="code_examples--基金"></a>

#### 基金

<a id="code_examples--两融-1"></a>

#### 两融

<a id="code_examples--期货"></a>

#### 期货

<a id="code_examples--期权"></a>

#### 期权

<a id="code_examples--新股申购"></a>

#### 新股申购

<a id="code_examples--债券"></a>

#### 债券

<a id="code_examples--etf"></a>

#### ETF

<a id="code_examples--组合交易"></a>

#### 组合交易

一键买卖（一篮子下单）

**功能描述：** 该示例演示如何用python进行一揽子股票买卖的交易操作

**代码示例：**

<a id="code_examples--组合套利交易"></a>

#### 组合套利交易

提示

（`accountID`、`orderType` 特殊设置）

**用法**

**释义**：

**参数**

| 参数名称 | 描述 |
| --- | --- |
| accountID | 'stockAccountID, futureAccountID' |
| orderCode | 'basketName, futureName' |
| hedgeRatio | 套利比例（0 ~ 2 之间值，相当于 %0 至 200% 套利） |
| volume | 份数 \\ 资金 \\ 比例 |
| orderType | 参考下方**orderType-下单方式（特殊设置）** |

**orderType - 下单方式（特殊设置）**

| 编号 | 项目 |
| --- | --- |
| 2331 | 组合、套利、合约价值自动套利、按组合股票数量方式下单 |
| 2332 | 组合、套利、按合约价值自动套利、按组合股票权重方式下单 |
| 2333 | 组合、套利、按合约价值自动套利、按账号可用方式下单 |

**示例**

<a id="code_examples--按功能划分-1"></a>

### 按功能划分

<a id="code_examples--passorder-下单函数"></a>

#### passorder 下单函数

本示例用于演示K线走完下单及立即下单的参数写法差异，旨在帮助您了解如何快速实现下单操作。

<a id="code_examples--集合竞价下单"></a>

#### 集合竞价下单

本示例演示了利用定时器函数和passorder下单函数在集合竞价期间以指定价买入平安银行100股。

<a id="code_examples--止盈止损示例"></a>

#### 止盈止损示例

<a id="code_examples--passorder-下算法单函数"></a>

#### passorder 下算法单函数

本示例由于演示如何下达算法单，具体算法参数请参考迅投投研平台客户端参数说明。

<a id="code_examples--如何使用投资备注"></a>

#### 如何使用投资备注

投资备注功能是模型下单时指定的任意字符串(长度小于24)，即passorder的userOrderId参数，可以用于匹配委托或成交。有且只有passorder， algo\_passorder, smart\_algo\_passorder下单函数支持投资备注功能。

<a id="code_examples--如何获取委托持仓及资金数据"></a>

#### 如何获取委托持仓及资金数据

本示例用于演示如何通过函数获取指定账户的委托、持仓、资金数据。

<a id="code_examples--使用快速交易参数委托"></a>

#### 使用快速交易参数委托

本例展示如何使用快速交易参数(quickTrade)立刻进行委托。

<a id="code_examples--调整至目标持仓"></a>

#### 调整至目标持仓

本示例由于演示如何调仓。

<a id="code_examples--获取融资融券账户可融资买入标的-1"></a>

#### 获取融资融券账户可融资买入标的

<a id="code_examples--获取两融账号信息示例"></a>

#### 获取两融账号信息示例

<a id="code_examples--直接还款示例"></a>

#### 直接还款示例

该示例演示使用python进行融资融券账户的还款操作。

<a id="code_examples--交易数据查询示例"></a>

### 交易数据查询示例
