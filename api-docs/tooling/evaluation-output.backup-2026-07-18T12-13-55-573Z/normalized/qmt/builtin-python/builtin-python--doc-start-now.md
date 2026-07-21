---
platform: qmt
variant: builtin-python
source_role: primary
document_type: strategy_api
title: 1. 快速开始
section_path:
  - 迅投知识库 - 内置Python API文档全集
  - 1. 快速开始
source_file: api-docs/raw/qmt/innerapi-combined.html
source_url: file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html
source_anchor: "#doc-start_now"
source_sha256: 08ffb4fd69f4e96745a5d83d27b6716c0682a20496b6664df00cc79c55670f28
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

# 1\. 快速开始

<a id="start_now--一、概述"></a>

### 一、概述

QMT 极速策略交易系统，以下简称 **QMT 系统**，内置了 **`3.6 版本`** 的 `python` 运行环境，提供**行情数据**与**交易下单**两大核心功能。通过编写 python 脚本，可以完成指标计算，策略编写，策略回测，实盘下单等需求。

<a id="start_now--二、场景需求"></a>

### 二、场景需求

QMT 系统支持**回测模型**与**实盘模型**。

![](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E5%9B%9E%E6%B5%8B%E6%A8%A1%E5%9E%8B_%E5%AE%9E%E7%9B%98%E6%A8%A1%E5%9E%8B-a800c759.png)

**回测模型：** 指在历史 k 线上，自左向右逐根遍历 k 线，以模拟的资金账号记录每日的买卖信号，持仓盈亏，最终展示策略在历史上的净值走势结果。

**实盘模型：** 指在盘中收取最新的动态行情，即时发送买卖信号到交易所，判断委托状态，需要实时重复报撤的模型。


**两类模型分别有各自的注意点：**

<a id="start_now--回测模型"></a>

#### 回测模型

1.  回测是遍历固定的历史数据：

    ![](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E6%93%8D%E4%BD%9C_%E6%95%B0%E6%8D%AE%E7%AE%A1%E7%90%86_%E4%B8%8B%E8%BD%BD%E5%85%A8%E9%83%A8-d3b5864c.png)

    -   首先需要下载历史行情，首次下载可以在界面左上角，点击`操作`，选择`数据管理`补充行情，选择回测的周期，如`日线`，所需的板块数据，如`沪深A股板块`，时间范围选择`全部`，下载完整历史行情

    ![](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E6%89%B9%E9%87%8F%E4%B8%8B%E8%BD%BD-c98af807.png)

    -   其次设置每日定时更新，可以点击客户端右下角`行情`按钮，在`批量下载`界面选择需要每天更新的数据，勾选`定时下载`选项，之后每天在指定时间会自动下载行情数据到本地
2.  回测模型取本地数据遍历，不需要向服务器订阅实时行情，应使用 `get_market_data_ex`函数，指定`subscribe`参数为`False`，来读取本地行情数据。

3.  回测模型的撮合规则为，指定交易价格在当前k线高低点间的，按指定价格撮合，超过高低点的，按当前 k 线收盘价撮合。委托数量大于可用数量时，按可用数量撮合。


![](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E5%9F%BA%E6%9C%AC%E4%BF%A1%E6%81%AF_%E5%9B%9E%E6%B5%8B%E5%8F%82%E6%95%B0-eec55083.png)

1.  回测模型右侧的基本信息，如默认周期，默认主图，在`我的界面`点击回测时会生效。在行情界面k线下点击回测，以当前 k 线的周期，品种为准。回测必须以`副图模式`执行，不要选择主图 /主图叠加.

<a id="start_now--实盘模型"></a>

#### 实盘模型

当你回测结束，你需要开始实盘模型，注意这里提到的实盘，指的是接收未来 K 线的数据，生成策略信号，进行交易下单。

提示

实盘模型也分`模拟柜台模拟交易`和`真实柜台实盘交易`两种。具体请参考[如何配置账号在新窗口打开](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#interface_operation--%E9%85%8D%E7%BD%AE%E8%B4%A6%E5%8F%B7)

1.  你要运行实盘模型，QMT 系统提供两种交易模式：

    -   默认的交易模式为**逐 k 线生效** (`passorder`函数**快速交易**`quicktrade`参数填 `0` 即默认值)，适用与需要在盘中模拟历史上逐 k 线的效果需求。例如选择一分钟周期，将下单判断，下单函数放在`handlebar`函数内，盘中主图每个分笔 (三秒一次)会触发一次`handlebar`函数调用，系统会暂存当前`handlebar`产生的下单信号。三秒后下一个分笔到达时，如果是新的一分钟 k 线的第一个分笔，判断上一个分笔为前一根k线最后分笔，会将暂存的交易信号发送给交易所，完成交易。如到达的下一个分笔不是新一根 k 线的，则判定当前 k 线未完成，丢弃暂存的交易信号。1 分钟 k 线情形，每根k线内会有 20 个分笔，前 19 个分笔产生的信号会被丢弃，最后一个分笔的信号，会在下一根k线，首个分笔到达时，延迟三秒发出。系统自带的`ContxtInfo`也做了同样的等待，回退处理，逐 k 线模式的交易记录可以保存在`ContextInfo`对象的属性中。详细说明参见 [常见问题：系统对象ContextInfo 逐K线保存的机制](builtin-python--doc-question-answer.md#question_answer--系统对象-contextinfo-逐-k-线保存的机制)

    -   QMT 系统也支持立即下单的交易模式，`passorder`函数的**快速交易**`quicktrade`参数填 `2`，可以在运行后立刻发出委托，不对信号进行等待，丢弃的操作。此时需要用普通的全局变量(如自定义一个`Class a()`)保存委托状态，不能存在`ContextInfo`的属性里。参见[使用快速交易参数委托](builtin-python--doc-code-examples.md#code_examples--使用快速交易参数委托) 、[调整至目标持仓Demo](builtin-python--doc-code-examples.md#code_examples--调整至目标持仓)

2.  实盘的撮合规则以交易所为准。股票品种的话，价格不能超过 2% 的价格笼子否则废单。数量超过可用数量时会废单。

3.  实盘模型需要在模型交易界面执行。模型交易界面，选择新建策略交易，添加需要的模型。运行模式可以选择`模拟`或`实盘`。

    -   选择`模拟信号模式`，在策略信号界面显示买卖信号，不实际发出委托。具体请参考[模拟信号模式](builtin-python--doc-variable-convention.md#variable_convention--模拟信号模式)
    -   选择`实盘交易模式`，显示的策略信号会实际发出到交易所。具体请参考[实盘交易模式](builtin-python--doc-variable-convention.md#variable_convention--实盘交易模式)

提示

运行模式的`模拟`和`实盘`，与您使用的账号实际是`实盘账号（真实交易所柜台）`或是`模拟账号（模拟交易柜台）`无关。相关账号申请需要联系您做所在券商的工作人员，或者购买[投研端账号在新窗口打开](https://xuntou.net/#%2Fproductvip)获取模拟柜台撮合服务。

<a id="start_now--三、运行机制对比"></a>

### 三、运行机制对比

QMT 系统提供两大类(事件驱动与定时任务)，共三种运行机制。

![](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E4%B8%89%E7%A7%8D%E6%9C%BA%E5%88%B6%E5%AF%B9%E6%AF%94-bc32690d.png)

<a id="start_now--逐-k-线驱动-handlebar"></a>

#### 逐 K 线驱动：`handlebar`

`handlebar`是**主图历史 k 线**+**盘中订阅推送**。运行开始时，所选周期历史 k 线从左向右每根触发一次`handlebar`函数调用。盘中时，主图品种每个新分笔数据到达，触发一次`handlebar`函数调用。

提示

盘中分笔驱动，但是逐 K 线生效。请参考[常见问题：系统对象ContextInfo 逐K线保存的机制](builtin-python--doc-question-answer.md#question_answer--系统对象-contextinfo-逐-k-线保存的机制)

<a id="start_now--事件驱动-subscribe-订阅推送"></a>

#### 事件驱动 ：`subscribe` 订阅推送

盘中订阅指定品种的分笔数据，新分笔到达时，触发指定的回调函数。

<a id="start_now--定时任务-run-time-定时运行"></a>

#### 定时任务 ：`run_time` 定时运行

指定固定的时间间隔，持续触发指定的回调函数.

<a id="start_now--不同机制匹配不同场景需求"></a>

#### 不同机制匹配不同场景需求

![](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E4%B8%8D%E5%90%8C%E6%9C%BA%E5%88%B6%E5%8C%B9%E9%85%8D%E4%B8%8D%E5%90%8C%E5%9C%BA%E6%99%AF%E9%9C%80%E6%B1%82-6942d075.png)

| 机制 | 分类 | 特点 | 匹配需求 |
| --- | --- | --- | --- |
| 逐 K 线运行（`handlebar`） | 事件驱动 | 同时支持历史回测和盘中可模拟逐K线效果 | 在实盘中模拟逐K线运行的效果 |
| 订阅推送（`subscribe`） | 事件驱动 | 盘中行情分笔触发函数调用 | 盘中随分笔行情判断交易 |
| 定时运行（`run_time`） | 定时任务 | 固定间隔触发调用 | 盘中固定时间间隔判断交易 |

<a id="start_now--四、逐-k-线驱动-handlebar-示例"></a>

### 四、逐 K 线驱动（handlebar）示例

因此，结合不同场景需求（回测或实盘），针对不同的机制（定时任务或事件驱动），我们分别给出回测与实盘的完整示例，复制到策略编辑器中即可使用。

在编写策略前，有以下注意事项：

警告

在编写一个策略时，首先需要在代码的最前一行写上： `#coding:gbk` 统一脚本的编码格式是`GBK`

缩进需要统一 全部统一为`····`或者`->`

<a id="start_now--回测示例-基于-handlebar"></a>

#### 回测示例-基于 handlebar

回测的操作流程请参考：[界面操作-策略回测](builtin-python--doc-interface-operation.md#interface_operation--策略回测)

复制代码以下代码到策略编辑器：

**基础信息设置** 请参考[基础信息-字段描述](builtin-python--doc-interface-operation.md#interface_operation--基本信息-字段描述)

**回测参数设置** 请参考[回测参数-字段描述](builtin-python--doc-interface-operation.md#interface_operation--回测参数-字段描述)

<a id="start_now--实盘示例-基于-handlebar"></a>

#### 实盘示例-基于 handlebar

实盘的操作流程请参考：[界面操作-模型交易](builtin-python--doc-interface-operation.md#interface_operation--策略运行)

复制代码以下代码到策略编辑器：

警告

对于立刻下单的模型需要用普通的全局变量来保存状态不能ContextInfo对象存详细说明参考[常见问题：系统对象ContextInfo 逐K线保存的机制](builtin-python--doc-question-answer.md#question_answer--系统对象-contextinfo-逐-k-线保存的机制)

更多示例请参见[完整示例](builtin-python--doc-code-examples.md#doc-code_examples)

<a id="start_now--五、事件驱动-subscribe-示例"></a>

### 五、事件驱动（subscribe）示例

<a id="start_now--实盘示例-基于-subscribe"></a>

#### 实盘示例-基于 subscribe

<a id="start_now--六、定时任务-run-time-示例"></a>

### 六、定时任务（run\_time）示例

<a id="start_now--实盘示例-基于-run-time"></a>

#### 实盘示例-基于 run\_time
