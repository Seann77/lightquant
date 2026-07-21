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

<a id="doc-callback_function"></a>

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

```python
#coding:gbk
def show_data(data):
    tdata = {}
    for ar in dir(data):
        if ar[:2] != 'm_':continue
        try:
            tdata[ar] = data.__getattribute__(ar)
        except:
            tdata[ar] = '<CanNotConvert>'
    return tdata

def init(ContextInfo):
    # 设置对应的资金账号
    # 示例需要在策略交易界面运行
    ContextInfo.set_account(account)
    
def after_init(ContextInfo):
    # 在策略交易界面运行时，account的值会被赋值为策略配置中的账号，编辑器界面运行时，需要手动赋值
    # 编译器界面里执行的下单函数不会产生实际委托  
    passorder(23, 1101, account, "000001.SZ", 5, 0, 100, "示例", 2, "投资备注",ContextInfo)
    pass

def account_callback(ContextInfo, accountInfo):
    print(show_data(accountInfo)) 

```

```python
{'m_Enable': True, 'm_dAssetBalance': 9975010.001775814, 'm_dAssureAsset': 9975010.001775814, 'm_dAvailable': 9555238.805375814, 'm_dBalance': 9975010.001775814, 'm_dBuyWaitMoney': 0.0, 'm_dCashIn': 0.0, 'm_dCloseProfit': 0.0, 'm_dCommission': 14.284000000000006, 'm_dCredit': 0.0, 'm_dCurrMargin': 0.0, 'm_dDeposit': 0.0, 'm_dEntrustAsset': 0.0, 'm_dFetchBalance': 9556221.001775814, 'm_dFrozenCash': 982.1964, 'm_dFrozenCommission': 0.0, 'm_dFrozenMargin': 9555238.805375814, 'm_dFrozenRoyalty': 0.0, 'm_dFundValue': 0.0, 'm_dGoldFrozen': 0.0, 'm_dGoldValue': 0.0, 'm_dInitBalance': 0.0, 'm_dInitCloseMoney': -4249.283999999998, 'm_dInstrumentValue': 418789.0, 'm_dInstrumentValueRMB': 0.0, 'm_dIntradayBalance': 0.0, 'm_dIntradayFreedBalance': 0.0, 'm_dLoanValue': 0.0, 'm_dLongValue': 0.0, 'm_dMargin': 0.0, 'm_dMaxMarginRate': 0.0, 'm_dMortgage': 0.0, 'm_dNav': 0.0, 'm_dNetValue': 0.0, 'm_dOccupiedBalance': 0.0, 'm_dPositionProfit': -3441.6657800000025, 'm_dPreBalance': 9556221.001775814, 'm_dPreCredit': 0.0, 'm_dPreMortgage': 0.0, 'm_dPurchasingPower': 0.0, 'm_dRawMargin': 0.0, 'm_dRealRiskDegree': 0.0, 'm_dRealUsedMargin': 0.0, 'm_dReceiveInterestTotal': 0.0, 'm_dRepurchaseValue': 0.0, 'm_dRisk': 0.0, 'm_dRoyalty': 0.0, 'm_dSellWaitMoney': 0.0, 'm_dShortValue': 0.0, 'm_dStockValue': 418789.0, 'm_dSubscribeFee': 0.0, 'm_dTotalDebit': 0.0, 'm_dWithdraw': 0.0, 'm_nBrokerType': 2, 'm_nDirection': 48, 'm_strAccountID': '2000567', 'm_strAccountKey': '2____11194____114911____49____2000567____', 'm_strAccountRemark': '', 'm_strBrokerName': '', 'm_strMoneyType': '', 'm_strOpenDate': '', 'm_strStatus': '准备登录', 'm_strTradingDate': '20240220'}
{'m_Enable': True, 'm_dAssetBalance': 9975010.001775814, 'm_dAssureAsset': 9975010.001775814, 'm_dAvailable': 9556221.001775814, 'm_dBalance': 9975010.001775814, 'm_dBuyWaitMoney': 0.0, 'm_dCashIn': 0.0, 'm_dCloseProfit': 0.0, 'm_dCommission': 14.284000000000006, 'm_dCredit': 0.0, 'm_dCurrMargin': 0.0, 'm_dDeposit': 0.0, 'm_dEntrustAsset': 0.0, 'm_dFetchBalance': 9556221.001775814, 'm_dFrozenCash': 0.0, 'm_dFrozenCommission': 0.0, 'm_dFrozenMargin': 9556221.001775814, 'm_dFrozenRoyalty': 0.0, 'm_dFundValue': 0.0, 'm_dGoldFrozen': 0.0, 'm_dGoldValue': 0.0, 'm_dInitBalance': 0.0, 'm_dInitCloseMoney': -4249.283999999998, 'm_dInstrumentValue': 418789.0, 'm_dInstrumentValueRMB': 0.0, 'm_dIntradayBalance': 0.0, 'm_dIntradayFreedBalance': 0.0, 'm_dLoanValue': 0.0, 'm_dLongValue': 0.0, 'm_dMargin': 0.0, 'm_dMaxMarginRate': 0.0, 'm_dMortgage': 0.0, 'm_dNav': 0.0, 'm_dNetValue': 0.0, 'm_dOccupiedBalance': 0.0, 'm_dPositionProfit': -3441.6657800000025, 'm_dPreBalance': 9556221.001775814, 'm_dPreCredit': 0.0, 'm_dPreMortgage': 0.0, 'm_dPurchasingPower': 0.0, 'm_dRawMargin': 0.0, 'm_dRealRiskDegree': 0.0, 'm_dRealUsedMargin': 0.0, 'm_dReceiveInterestTotal': 0.0, 'm_dRepurchaseValue': 0.0, 'm_dRisk': 0.0, 'm_dRoyalty': 0.0, 'm_dSellWaitMoney': 0.0, 'm_dShortValue': 0.0, 'm_dStockValue': 418789.0, 'm_dSubscribeFee': 0.0, 'm_dTotalDebit': 0.0, 'm_dWithdraw': 0.0, 'm_nBrokerType': 2, 'm_nDirection': 48, 'm_strAccountID': '2000567', 'm_strAccountKey': '2____11194____114911____49____2000567____', 'm_strAccountRemark': '', 'm_strBrokerName': '', 'm_strMoneyType': '', 'm_strOpenDate': '', 'm_strStatus': '准备登录', 'm_strTradingDate': '20240220'}
{'m_Enable': True, 'm_dAssetBalance': 9975010.001775814, 'm_dAssureAsset': 9975010.001775814, 'm_dAvailable': 9555238.805375814, 'm_dBalance': 9975010.001775814, 'm_dBuyWaitMoney': 0.0, 'm_dCashIn': 0.0, 'm_dCloseProfit': 0.0, 'm_dCommission': 14.480400000000007, 'm_dCredit': 0.0, 'm_dCurrMargin': 0.0, 'm_dDeposit': 0.0, 'm_dEntrustAsset': 0.0, 'm_dFetchBalance': 9556221.001775814, 'm_dFrozenCash': 0.0, 'm_dFrozenCommission': 0.0, 'm_dFrozenMargin': 9555238.805375814, 'm_dFrozenRoyalty': 0.0, 'm_dFundValue': 0.0, 'm_dGoldFrozen': 0.0, 'm_dGoldValue': 0.0, 'm_dInitBalance': 0.0, 'm_dInitCloseMoney': -4249.283999999998, 'm_dInstrumentValue': 419771.0, 'm_dInstrumentValueRMB': 0.0, 'm_dIntradayBalance': 0.0, 'm_dIntradayFreedBalance': 0.0, 'm_dLoanValue': 0.0, 'm_dLongValue': 0.0, 'm_dMargin': 0.0, 'm_dMaxMarginRate': 0.0, 'm_dMortgage': 0.0, 'm_dNav': 0.0, 'm_dNetValue': 0.0, 'm_dOccupiedBalance': 0.0, 'm_dPositionProfit': -3441.6657800000025, 'm_dPreBalance': 9556221.001775814, 'm_dPreCredit': 0.0, 'm_dPreMortgage': 0.0, 'm_dPurchasingPower': 0.0, 'm_dRawMargin': 0.0, 'm_dRealRiskDegree': 0.0, 'm_dRealUsedMargin': 0.0, 'm_dReceiveInterestTotal': 0.0, 'm_dRepurchaseValue': 0.0, 'm_dRisk': 0.0, 'm_dRoyalty': 0.0, 'm_dSellWaitMoney': 0.0, 'm_dShortValue': 0.0, 'm_dStockValue': 419771.0, 'm_dSubscribeFee': 0.0, 'm_dTotalDebit': 0.0, 'm_dWithdraw': 0.0, 'm_nBrokerType': 2, 'm_nDirection': 48, 'm_strAccountID': '2000567', 'm_strAccountKey': '2____11194____114911____49____2000567____', 'm_strAccountRemark': '', 'm_strBrokerName': '', 'm_strMoneyType': '', 'm_strOpenDate': '', 'm_strStatus': '准备登录', 'm_strTradingDate': '20240220'}
```

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

```python
#coding:gbk
def show_data(data):
    tdata = {}
    for ar in dir(data):
        if ar[:2] != 'm_':continue
        try:
            tdata[ar] = data.__getattribute__(ar)
        except:
            tdata[ar] = '<CanNotConvert>'
    return tdata

def init(ContextInfo):
    # 设置对应的资金账号
    # 示例需要在策略交易界面运行
    ContextInfo.set_account(account)
    
def after_init(ContextInfo):
    # 在策略交易界面运行时，account的值会被赋值为策略配置中的账号，编辑器界面运行时，需要手动赋值
    # 编译器界面里执行的下单函数不会产生实际委托  
    passorder(23, 1101, account, "000001.SZ", 5, 0, 100, "示例", 2, "投资备注",ContextInfo)
    pass

def task_callback(ContextInfo, taskInfo):
    print(show_data(taskInfo))
```

```python
{'m_3rdPartyTradeParam': '', 'm_cancelTime': 2147483647, 'm_dFixPrice': 9.82, 'm_eOperationType': 18, 'm_eOrderType': 0, 'm_ePriceType': 5, 'm_eStatus': 3, 'm_endTime': 2147483647, 'm_nBusinessNum': 0, 'm_nGroupId': 11, 'm_nNum': 100, 'm_nTaskId': '11', 'm_script': '', 'm_startTime': 1708420476, 'm_stockCode': '000001.SZ', 'm_strAccountID': '2000567', 'm_strMsg': '9.8200全部委托! 报价行情已8076秒未更新!', 'm_strRemark': '投资备注'}
{'m_3rdPartyTradeParam': '', 'm_cancelTime': 2147483647, 'm_dFixPrice': 9.82, 'm_eOperationType': 18, 'm_eOrderType': 0, 'm_ePriceType': 5, 'm_eStatus': 3, 'm_endTime': 2147483647, 'm_nBusinessNum': 100, 'm_nGroupId': 11, 'm_nNum': 100, 'm_nTaskId': '11', 'm_script': '', 'm_startTime': 1708420476, 'm_stockCode': '000001.SZ', 'm_strAccountID': '2000567', 'm_strMsg': '9.8200全部委托! 报价行情已8076秒未更新!', 'm_strRemark': '投资备注'}
{'m_3rdPartyTradeParam': '', 'm_cancelTime': 2147483647, 'm_dFixPrice': 9.82, 'm_eOperationType': 18, 'm_eOrderType': 0, 'm_ePriceType': 5, 'm_eStatus': 7, 'm_endTime': 1708420476, 'm_nBusinessNum': 100, 'm_nGroupId': 11, 'm_nNum': 100, 'm_nTaskId': '11', 'm_script': '', 'm_startTime': 1708420476, 'm_stockCode': '000001.SZ', 'm_strAccountID': '2000567', 'm_strMsg': '任务完成', 'm_strRemark': '投资备注'}
{'m_3rdPartyTradeParam': '', 'm_cancelTime': 2147483647, 'm_dFixPrice': 9.82, 'm_eOperationType': 18, 'm_eOrderType': 0, 'm_ePriceType': 5, 'm_eStatus': 7, 'm_endTime': 1708420476, 'm_nBusinessNum': 100, 'm_nGroupId': 11, 'm_nNum': 100, 'm_nTaskId': '11', 'm_script': '', 'm_startTime': 1708420476, 'm_stockCode': '000001.SZ', 'm_strAccountID': '2000567', 'm_strMsg': '任务完成', 'm_strRemark': '投资备注'}

```

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

```python
#coding:gbk
def show_data(data):
    tdata = {}
    for ar in dir(data):
        if ar[:2] != 'm_':continue
        try:
            tdata[ar] = data.__getattribute__(ar)
        except:
            tdata[ar] = '<CanNotConvert>'
    return tdata

def init(ContextInfo):
    # 设置对应的资金账号
    # 示例需要在策略交易界面运行
    ContextInfo.set_account(account)
    
def after_init(ContextInfo):
    # 在策略交易界面运行时，account的值会被赋值为策略配置中的账号，编辑器界面运行时，需要手动赋值
    # 编译器界面里执行的下单函数不会产生实际委托  
    passorder(23, 1101, account, "000001.SZ", 5, 0, 100, "示例", 2, "投资备注",ContextInfo)
    pass

def order_callback(ContextInfo, orderInfo):
    print(show_data(orderInfo))
```

```python
{'m_bEnable': True, 'm_dCancelAmount': 0.0, 'm_dFrozenCommission': 0.21600000000000003, 'm_dFrozenMargin': 1080.0, 'm_dLimitPrice': 10.8, 'm_dOrderPriceRMB': 0.0, 'm_dReferenceRate': 0.0, 'm_dShortOccupedMargin': 1.7976931348623157e+308, 'm_dTradeAmount': 0.0, 'm_dTradeAmountRMB': 0.0, 'm_dTradedPrice': 0.0, 'm_eCashgroupProp': 48, 'm_eCoveredFlag': 0, 'm_eEntrustType': 48, 'm_nDirection': 48, 'm_nErrorID': 2147483647, 'm_nFrontID': -1, 'm_nGroupId': 2147483647, 'm_nHedgeFlag': 49, 'm_nOffsetFlag': 48, 'm_nOpType': 23, 'm_nOrderPriceType': 50, 'm_nOrderStatus': 50, 'm_nOrderStrategyType': -946575058, 'm_nOrderSubmitStatus': 51, 'm_nRef': 1745879041, 'm_nSessionID': -1, 'm_nStrategyID': 0, 'm_nTaskId': 1, 'm_nVolumeTotal': 100, 'm_nVolumeTotalOriginal': 100, 'm_nVolumeTraded': 0, 'm_strAccountID': '2000567', 'm_strAccountKey': '2____11194____114911____49____2000567____', 'm_strAccountName': '', 'm_strAccountRemark': '', 'm_strBrokerName': '', 'm_strCancelInfo': '', 'm_strCompactNo': '', 'm_strErrorMsg': '', 'm_strExchangeID': 'SZ', 'm_strExchangeName': '深交所', 'm_strInsertDate': '20240222', 'm_strInsertTime': '091259', 'm_strInstrumentID': '000001', 'm_strInstrumentName': '平安银行', 'm_strLocalInfo': '', 'm_strOptName': '限价买入', 'm_strOption': '', 'm_strOrderParam': '', 'm_strOrderRef': '8875341038780543374', 'm_strOrderStrategyType': '函数下单', 'm_strOrderSysID': '87', 'm_strProductID': '', 'm_strProductName': '', 'm_strRemark': '投资备注', 'm_strSource': '新建策略文件15', 'm_strUnderCode': '', 'm_strXTTrade': '本终端', 'm_xtTag': '<CanNotConvert>'}
```

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

```python
#coding:gbk
def show_data(data):
    tdata = {}
    for ar in dir(data):
        if ar[:2] != 'm_':continue
        try:
            tdata[ar] = data.__getattribute__(ar)
        except:
            tdata[ar] = '<CanNotConvert>'
    return tdata

def init(ContextInfo):
    # 设置对应的资金账号
    # 示例需要在策略交易界面运行
    ContextInfo.set_account(account)
    
def after_init(ContextInfo):
    # 在策略交易界面运行时，account的值会被赋值为策略配置中的账号，编辑器界面运行时，需要手动赋值
    # 编译器界面里执行的下单函数不会产生实际委托  
    passorder(23, 1101, account, "000001.SZ", 5, 0, 100, "示例", 2, "投资备注",ContextInfo)
    pass

def deal_callback(ContextInfo, dealInfo):
    print(show_data(dealInfo))
```

```python
{'m_dCloseProfit': 0.0, 'm_dComssion': 0.19640000000000002, 'm_dOrderPriceRMB': 0.0, 'm_dPrice': 9.82, 'm_dPriceRMB': 0.0, 'm_dReferenceRate': 0.0, 'm_dTradeAmount': 982.0, 'm_dTradeAmountRMB': 0.0, 'm_eCoveredFlag': 48, 'm_eEntrustType': 48, 'm_eFutureTradeType': 48, 'm_nCloseTodayVolume': 0, 'm_nDirection': 48, 'm_nGroupId': 2147483647, 'm_nHedgeFlag': 49, 'm_nOffsetFlag': 48, 'm_nOrderPriceType': 50, 'm_nOrderStrategyType': 0, 'm_nRealOffsetFlag': -1, 'm_nRef': 1209008141, 'm_nStrategyID': 0, 'm_nTaskId': 14, 'm_nVolume': 100, 'm_strAccountID': '2000567', 'm_strAccountKey': '2____11194____114911____49____2000567____', 'm_strAccountRemark': '', 'm_strCompactNo': '', 'm_strExchangeID': 'SZ', 'm_strExchangeName': '深交所', 'm_strInstrumentID': '000001', 'm_strInstrumentName': '平安银行', 'm_strLocalInfo': '', 'm_strOperation': '', 'm_strOptName': '限价买入', 'm_strOrderRef': '8875341038780443523', 'm_strOrderStrategyType': '函数下单', 'm_strOrderSysID': '24500', 'm_strProductID': '', 'm_strProductName': '', 'm_strRemark': '投资备注', 'm_strSource': '新建策略文件15', 'm_strTradeDate': '20240220', 'm_strTradeID': '13', 'm_strTradeTime': '172341', 'm_strXTTrade': '本终端', 'm_xtTag': '<CanNotConvert>'}
```

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

```python
#coding:gbk
def show_data(data):
    tdata = {}
    for ar in dir(data):
        if ar[:2] != 'm_':continue
        try:
            tdata[ar] = data.__getattribute__(ar)
        except:
            tdata[ar] = '<CanNotConvert>'
    return tdata

def init(ContextInfo):
    # 设置对应的资金账号
    # 示例需要在策略交易界面运行
    ContextInfo.set_account(account)
    
def after_init(ContextInfo):
    # 在策略交易界面运行时，account的值会被赋值为策略配置中的账号，编辑器界面运行时，需要手动赋值
    # 编译器界面里执行的下单函数不会产生实际委托  
    passorder(23, 1101, account, "000001.SZ", 5, 0, 100, "示例", 2, "投资备注",ContextInfo)
    pass

def position_callback(ContextInfo, positionInfo):
    print(show_data(positionInfo))

```

```python
{'m_bIsToday': True, 'm_dAvgOpenPrice': 9.417861115, 'm_dCloseAmount': 0.0, 'm_dCloseProfit': 0.0, 'm_dFloatProfit': 11.999999999999744, 'm_dInstrumentValue': 19640.0, 'm_dLastPrice': 9.82, 'm_dLastSettlementPrice': 0.0, 'm_dMargin': 0.0, 'm_dMarketValue': 19640.0, 'm_dOpenCost': 18835.72223, 'm_dOpenPrice': 9.417861115, 'm_dPositionCost': 18835.72223, 'm_dPositionProfit': 804.2777700000006, 'm_dProfitRate': 0.04269959814543308, 'm_dRealUsedMargin': 0.0, 'm_dRedemptionVolume': 0, 'm_dReferenceRate': 0.0, 'm_dRoyalty': 0.0, 'm_dSettlementPrice': 9.82, 'm_dSingleCost': 2.946, 'm_dStaticHoldMargin': 1.7976931348623157e+308, 'm_dStockLastPrice': 1.7976931348623157e+308, 'm_dStructFundVol': 0, 'm_dTotalCost': 5892.0, 'm_eFutureTradeType': 48, 'm_eSideFlag': 48, 'm_nCanUseVolume': 1200, 'm_nCidIncrease': 1953394499, 'm_nCidIsDelist': 678126433, 'm_nCidRateOfCurrentLine': 1667199589, 'm_nCidRateOfTotalValue': 1651272801, 'm_nCloseVolume': 0, 'm_nCoveredVolume': 0, 'm_nDirection': 48, 'm_nEnableExerciseVolume': -1, 'm_nFrozenVolume': 0, 'm_nHedgeFlag': 49, 'm_nLegId': 0, 'm_nOnRoadVolume': 800, 'm_nOptCombUsedVolume': 0, 'm_nPREnableVolume': 2000, 'm_nSettledAmt': 0, 'm_nStrategyID': 0, 'm_nVolume': 2000, 'm_nYesterdayVolume': 1200, 'm_strAccountID': '2000567', 'm_strAccountKey': '2____11194____114911____49____2000567____', 'm_strComTradeID': '', 'm_strExchangeID': 'SZ', 'm_strExchangeName': '深交所', 'm_strExpireDate': '', 'm_strInstrumentID': '000001', 'm_strInstrumentName': '平安银行', 'm_strOpenDate': '', 'm_strProductID': '', 'm_strProductName': '', 'm_strStockHolder': '', 'm_strTradeID': '', 'm_strTradingDay': '20240220', 'm_xtTag': None}
```

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

```python
#coding:gbk
def show_data(data):
    tdata = {}
    for ar in dir(data):
        if ar[:2] != 'm_':continue
        try:
            tdata[ar] = data.__getattribute__(ar)
        except:
            tdata[ar] = '<CanNotConvert>'
    return tdata

def init(ContextInfo):
    # 设置对应的资金账号
    # 示例需要在策略交易界面运行
    ContextInfo.set_account(account)
    
def after_init(ContextInfo):
    # 在策略交易界面运行时，account的值会被赋值为策略配置中的账号，编辑器界面运行时，需要手动赋值
    # 编译器界面里执行的下单函数不会产生实际委托  
    passorder(23, 1101, account, "000001.SZ", 11, 0, 100, "示例", 2, "投资备注",ContextInfo)
    pass

def orderError_callback(ContextInfo,orderArgs,errMsg):
    print(show_data(orderArgs))
    print(errMsg)

```

```python
{'accountID': '2000567', 'currentTime': 0, 'formulaName': '', 'modelPrice': 0.0, 'modelVolume': 100.0, 'opType': 23, 'orderCode': 'SZ000001', 'orderType': 1101, 'prType': 11, 'strategyName': '示例_&&&_投资备注'}
[函数交易]　函数: passorder,　证券 [SZ000001] 指定价 无效, 无法下单!
```

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
