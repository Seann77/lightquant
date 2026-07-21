---
platform: qmt
variant: builtin-python
source_role: primary
document_type: strategy_api
title: 10. 成交回报实时主推函数
section_path:
  - 迅投知识库 - 内置Python API文档全集
  - 10. 成交回报实时主推函数
source_file: api-docs/raw/qmt/innerapi-combined.html
source_url: file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html
source_anchor: "#doc-callback_function"
source_sha256: 08ffb4fd69f4e96745a5d83d27b6716c0682a20496b6664df00cc79c55670f28
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

# 10\. 成交回报实时主推函数

<a id="callback_function--实时主推函数"></a>

## 实时主推函数

<a id="callback_function--account-callback-资金账号状态变化主推"></a>

### account\_callback - 资金账号状态变化主推

提示

1.  仅在实盘运行模式下生效。
2.  需要先在init里调用ContextInfo.set\_account后生效。

**用法：** account\_callback(ContextInfo, accountInfo)

**释义：** 当资金账号状态有变化时，这个函数被客户端调用

**参数：**

-   ContextInfo：特定对象
-   accountInfo：[账号对象在新窗口打开](builtin-python--doc-data-structure.md#data_structure--account-账户对象)或[信用账号对象在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ccreditaccountdetail-信用账号对象-非查柜台)

**返回：** 无

**示例：**

<a id="callback_function--task-callback-账号任务状态变化主推"></a>

### task\_callback - 账号任务状态变化主推

提示

1.  仅在实盘运行模式下生效。
2.  需要先在init里调用ContextInfo.set\_account后生效。

**用法：** task\_callback(ContextInfo, taskInfo)

**释义：** 当账号任务状态有变化时，这个函数被客户端调用

**参数：**

-   ContextInfo：特定对象
-   taskInfo [任务对象在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ctaskdetail-任务对象)

**返回：** 无

**示例：**

<a id="callback_function--order-callback-账号委托状态变化主推"></a>

### order\_callback - 账号委托状态变化主推

提示

1.  仅在实盘运行模式下生效。
2.  需要先在init里调用ContextInfo.set\_account后生效。

**用法：** order\_callback(ContextInfo, orderInfo)

**释义：** 当账号委托状态有变化时，这个函数被客户端调用

**参数：**

-   ContextInfo：特定对象
-   orderInfo：[委托在新窗口打开](builtin-python--doc-data-structure.md#data_structure--order-委托对象)

**返回：** 无

**示例：**

<a id="callback_function--deal-callback-账号成交状态变化主推"></a>

### deal\_callback - 账号成交状态变化主推

提示

1.  仅在实盘运行模式下生效。
2.  需要先在init里调用ContextInfo.set\_account后生效。

**用法：** deal\_callback(ContextInfo, dealInfo)

**释义：** 当账号成交状态有变化时，这个函数被客户端调用

**参数：**

-   ContextInfo：特定对象
-   dealInfo：[成交在新窗口打开](builtin-python--doc-data-structure.md#data_structure--deal-成交对象)

**返回：** 无

**示例：**

<a id="callback_function--position-callback-账号持仓状态变化主推"></a>

### position\_callback - 账号持仓状态变化主推

提示

1.  仅在实盘运行模式下生效。
2.  需要先在init里调用ContextInfo.set\_account后生效。

**用法：** position\_callback(ContextInfo, positonInfo)

**释义：** 当账号持仓状态有变化时，这个函数被客户端调用

**参数：**

-   ContextInfo：特定对象
-   positonInfo：[持仓在新窗口打开](builtin-python--doc-data-structure.md#data_structure--position-持仓对象)

**返回：** 无

**示例：**

<a id="callback_function--ordererror-callback-账号异常下单主推"></a>

### orderError\_callback - 账号异常下单主推

提示

1.  仅在实盘运行模式下生效。
2.  需要先在init里调用ContextInfo.set\_account后生效。

**用法：** orderError\_callback(ContextInfo,orderArgs,errMsg)

**释义：** 当账号下单异常时，这个函数被客户端调用

**参数：**

-   ContextInfo：特定对象
-   orderArgs：[下单参数在新窗口打开](builtin-python--doc-data-structure.md#data_structure--passorderarguments-下单函数参数对象)
-   errMsg：错误信息

**返回：** 无

**示例：**

<a id="callback_function--其他主推函数"></a>

## 其他主推函数

<a id="callback_function--credit-account-callback-查询信用账户明细回调"></a>

### credit\_account\_callback - 查询信用账户明细回调

**用法：** credit\_account\_callback(ContextInfo,seq,result)

**释义：** 查询信用账户明细回调

**参数：**

-   ContextInfo：策略模型全局对象
-   seq:query\_credit\_account时输入查询seq
-   result: [信用账户明细在新窗口打开](builtin-python--doc-data-structure.md#data_structure--ccreditdetail-两融资金信息-查柜台)

<a id="callback_function--credit-opvolume-callback-查询两融最大可下单量的回调"></a>

### credit\_opvolume\_callback - 查询两融最大可下单量的回调

**用法：** credit\_opvolume\_callback(ContextInfo,accid,seq,ret,result)

**释义：** 查询两融最大可下单量的回调。

**参数：**

-   `ContextInfo`：策略模型全局对象
-   `accid`:查询的账号
-   `seq`:`query_credit_opvolume`时输入查询`seq`
-   `ret`:查询结果状态。正常返回:`1`,正在查询中`-1`,输入账号非法:`-2`,输入查询参数非法:`-3`,超时等服务器返回报错:`-4`
-   `result`:查询到的结果

**示例** 见[query\_credit\_opvolume](file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html#callback_function--query_credit_opvolume---%E6%9F%A5%E8%AF%A2%E4%B8%A4%E8%9E%8D%E6%9C%80%E5%A4%A7%E5%8F%AF%E4%B8%8B%E5%8D%95%E9%87%8F%60)
