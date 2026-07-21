---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 路径型
section_path:
  - 技术分析指标
  - 路径型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#路径型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="路径型"></a>

## 路径型

<a id="BOLL-布林线"></a>

### BOLL-布林线

```python
Bollinger_Bands(security_list, check_date, timeperiod=20, nbdevup=2, nbdevdn=2, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数timeperiod
-   nbdevup：统计的天数 nbdevup
-   nbdevdn：统计的天数 nbdevdn
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   上轨线UB 、中轨线MB、下轨线LB 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 9.2899945886169739, '603177.XSHG': nan, '000002.XSHE': 21.378028110909778, '601211.XSHG': 18.846866409164456}, {'000001.XSHE': 9.1745000000000037, '603177.XSHG': nan, '000002.XSHE': 20.795500000000004, '601211.XSHG': 18.423999999999999}, {'000001.XSHE': 9.0590054113830334, '603177.XSHG': nan, '000002.XSHE': 20.21297188909023, '601211.XSHG': 18.001133590835543})

**备注：**

-   计算方式与通达信、东方财富和同花顺相同

**用法注释：**

1.股价上升穿越布林线上限时，回档机率大； 2.股价下跌穿越布林线下限时，反弹机率大； 3.布林线震动波带变窄时，表示变盘在即； 4.BOLL须配合BB 、WIDTH 使用；

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 BOLL 值
upperband, middleband, lowerband = Bollinger_Bands(security_list1, check_date='2017-01-04', timeperiod=20, nbdevup=2, nbdevdn=2)
print upperband[security_list1]
print middleband[security_list1]
print lowerband[security_list1]

# 输出 security_list2 的 BOLL 值
upperband, middleband, lowerband = Bollinger_Bands(security_list2, check_date='2017-01-04', timeperiod=20, nbdevup=2, nbdevdn=2)
for stock in security_list2:
    print upperband[stock]
    print middleband[stock]
    print lowerband[stock]
```

<a id="ENE-轨道线"></a>

### ENE-轨道线

```python
ENE(security_list,check_date,N=25,M1=6,M2=6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   N：统计的天数
-   M1：统计的天数
-   M2：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   UPPER LOWER ENE的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.9341039999999996, '603177.XSHG': nan, '000002.XSHE': 17.686311999999997, '601211.XSHG': 17.851672000000001}, {'000001.XSHE': 7.9226959999999993, '603177.XSHG': nan, '000002.XSHE': 15.684087999999997, '601211.XSHG': 15.830727999999999}, {'000001.XSHE': 8.4283999999999999, '603177.XSHG': nan, '000002.XSHE': 16.685199999999998, '601211.XSHG': 16.841200000000001})

**备注：**

-   计算方式与东方财富和通达信相同，同花顺没有该指标

**用法注释：**

1.  股价上升穿越轨道线上限时，回档机率大；
2.  股价下跌穿越轨道线下限时，反弹机率大；
3.  股价波动于轨道线内时，代表常态行情，此时，超买超卖指标可发挥效用；
4.  股价波动于轨道线外时，代表脱轨行情，此时，应使用趋势型指标。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 ENE 值
up1, low1, ENE1 = ENE(security_list1,check_date='2017-01-04',N=25,M1=6,M2=6)
print up1[security_list1]
print low1[security_list1]
print ENE1[security_list1]

# 输出 security_list2 的 ENE 值
up2, low2, ENE2 = ENE(security_list2,check_date='2017-01-04',N=25,M1=6,M2=6)
for stock in security_list2:
    print up2[stock]
    print low2[stock]
    print ENE2[stock]
```

<a id="MIKE-麦克支撑压力"></a>

### MIKE-麦克支撑压力

```python
MIKE(security_list, check_date, timeperiod = 10, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   STOR MIDR WEKR WEKS MIDS STOS 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.6416666666666675, '603177.XSHG': nan, '000002.XSHE': 26.2775, '601211.XSHG': 17.473333333333329}, {'000001.XSHE': 8.5164999999999988, '603177.XSHG': nan, '000002.XSHE': 23.604055555555551, '601211.XSHG': 17.071111111111108}, {'000001.XSHE': 8.3913333333333338, '603177.XSHG': nan, '000002.XSHE': 20.930611111111112, '601211.XSHG': 16.668888888888887}, {'000001.XSHE': 8.1854999999999993, '603177.XSHG': nan, '000002.XSHE': 15.899777777777777, '601211.XSHG': 16.035555555555558}, {'000001.XSHE': 8.1048333333333336, '603177.XSHG': nan, '000002.XSHE': 13.542388888888889, '601211.XSHG': 15.804444444444448}, {'000001.XSHE': 8.024166666666666, '603177.XSHG': nan, '000002.XSHE': 11.185, '601211.XSHG': 15.573333333333336})

**备注：**

-   计算方式与通达信和东方财富相同，与同花顺不同

**用法注释：**

1.  MIKE指标共有六条曲线，上方三条压力线，下方三条支撑线；
2.  当股价往压力线方向涨升时，其下方支撑线不具参考价值；
3.  当股价往支撑线方向下跌时，其上方压力线不具参考价值；

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 MIKE 值
stor1, midr1, wekr1, weks1, mids1, stos1 = MIKE(security_list1,check_date='2017-01-04',timeperiod = 10)
print stor1[security_list1]
print midr1[security_list1]
print wekr1[security_list1]
print weks1[security_list1]
print mids1[security_list1]
print stos1[security_list1]

# 输出 security_list2 的 MIKE 值
stor2, midr2, wekr2, weks2, mids2, stos2 = MIKE(security_list2,check_date='2017-01-04', timeperiod = 10)
for stock in security_list2:
    print stor2[stock]
    print midr2[stock]
    print wekr2[stock]
    print weks2[stock]
    print mids2[stock]
    print stos2[stock]
```

<a id="PBX-瀑布线"></a>

### PBX-瀑布线

```python
PBX(security_list, check_date, timeperiod = 9, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   PBX的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 8.4039531237966347, '603177.XSHG': nan, '000002.XSHE': 17.843806850286313, '601211.XSHG': 16.843910079955958}

**备注：**

-   计算方式与通达信和同花顺相同，东方财富没有该指标

**用法注释：**

1.  股价上升穿越轨道线上限时，回档机率大；
2.  股价下跌穿越轨道线下限时，反弹机率大；
3.  股价波动于轨道线内时，代表常态行情，此时，超买超卖指标可发挥效用；
4.  股价波动于轨道线外时，代表脱轨行情，此时，应使用趋势型指标。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 PBX 值
PBX1 = PBX(security_list1,check_date='2017-01-04', timeperiod = 9)
print PBX1[security_list1]

# 输出 security_list2 的 PBX 值
PBX2 = PBX(security_list2,check_date='2017-01-04', timeperiod = 9)
for stock in security_list2:
    print PBX2[stock]
```

<a id="XS-薛斯通道"></a>

### XS-薛斯通道

```python
XS(security_list, check_date, timeperiod = 13, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   SUP SDN LUP LDN 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.919597907192415, '603177.XSHG': nan, '000002.XSHE': 19.023175426273021, '601211.XSHG': 17.912385099606233}, {'000001.XSHE': 7.9098321063781789, '603177.XSHG': nan, '000002.XSHE': 16.869608396883621, '601211.XSHG': 15.884567918518734}, {'000001.XSHE': 9.5082405240369283, '603177.XSHG': nan, '000002.XSHE': 21.585636157538445, '601211.XSHG': 18.877898148622897}, {'000001.XSHE': 7.1728832023436473, '603177.XSHG': nan, '000002.XSHE': 16.283900960950056, '601211.XSHG': 14.241221410364643})

**备注：**

-   计算方式与通达信相同，与东方财富不同，同花顺没有该指标

**用法注释：**

-   薛斯建立于薛斯的循环理论的基础上，属于短线指标。在薛斯通道中，股价实际上是被短期小通道包容着在长期大通道中上下运行，基本买卖策略是当短期小通道接近长期大通道时，预示着趋势的近期反转。在上沿接近时趋势向下反转，可扑捉短期卖点。在下沿接近时趋势向上反转，可捕捉短期买点。研究这个方法可以在每一波行情中成功地逃顶捉底，寻求最大限度的赢利。薛斯通道的研判法则:

1.  长期大通道是反映该股票的长期趋势状态，趋势有一定惯性，延伸时间较长，反映股票大周期，可以反握 股票整体趋势，适于中长线投资；
2.  短期小通道反映该股票的短期走势状态，包容股票的涨跌起伏，有效地滤除股票走势中的频繁振动，但保留了股票价格在大通道内的上下波动，反映股票小周期，适于中短线炒作；
3.  长期大通道向上，即大趋势总体向上 ，此时短期小通道触及（或接近长期大通道底部时，即买压增大，有反弹的可能。而短期小通道触及长期大通道顶部，既卖压增大，形态出现回调或盘整，有向长期大通道靠近的趋势。如果K线走势与短期小通道走势亦吻合得很好，那么更为有效；
4.  长期大通道向上，而短期小通道触及长期大通道顶此时该股为强力拉长阶段，可适当观望，待短期转平转头向下时，为较好出货点，但穿透区为风险区应注意反转信号，随时出货；
5.  长期大通道向下，即大趋势向下，此时短期小通道或价触顶卖压增加，有再次下跌趋势。而触底形态即买增大，有缓跌调整或止跌要求，同时价格运动将趋向近长期大通道上沿。回调宜慎重对待，待确认反转后方可买入；
6.  长期大通道向下，而短期小通道向下穿透长期大通道线，此时多为暴跌过程，有反弹要求，但下跌过程会续，不宜立即建仓，应慎重，待长期大通道走平且有上趋势，短期小通道回头向上穿回时，是较好的低位仓机会；
7.  当长期大通道长期横向走平时，为盘整行情，价格沿道上下震荡，此时为调整、建仓、洗盘阶段，预示着一轮行情的出现，短线炒家可逢高抛出，逢低买入。以短期小通道强力上穿长期大通道，且长期大通道转向，表明强劲上涨行情开始。若以短期小通道向下透长期大通道，且长期大通道向下转向，表明下跌将续。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 XS 值
sup1, sdn1, lup1, ldn1 = XS(security_list1,check_date='2017-01-04',timeperiod = 13)
print sup1[security_list1]
print sdn1[security_list1]
print lup1[security_list1]
print ldn1[security_list1]

# 输出 security_list2 的 XS 值
sup2, sdn2, lup2, ldn2 = XS(security_list2,check_date='2017-01-04', timeperiod = 13)
for stock in security_list2:
    print sup2[stock]
    print sdn2[stock]
    print lup2[stock]
    print ldn2[stock]
```

<a id="XS2-薛斯通道2"></a>

### XS2-薛斯通道2

```python
XS2(security_list, check_date, N = 102, M = 7, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   N：统计的天数
-   M：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   PASS1 PASS2 PASS3 PASS4 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.4950699999999948, '603177.XSHG': nan, '000002.XSHE': 20.858490000000007, '601211.XSHG': 16.910580000000024}, {'000001.XSHE': 8.1619299999999946, '603177.XSHG': nan, '000002.XSHE': 20.040510000000005, '601211.XSHG': 16.247420000000023}, {'000001.XSHE': 8.902368598745646, '603177.XSHG': nan, '000002.XSHE': 22.024829980205435, '601211.XSHG': 18.300698543678497}, {'000001.XSHE': 7.7375727073209815, '603177.XSHG': nan, '000002.XSHE': 19.143076524851448, '601211.XSHG': 15.9062146220757})

**备注：**

-   计算方式与通达信和相同，东方财富和同花顺没有该指标

**用法注释：**

-   特点:

1.  根据通道形态找出波动的短周期,长周期是多少。
2.  根据周期预测股票的后期走势。
3.  股价的波动周期的各底是买入时机,股价的波动各顶是卖出时机。

-   用法:

1.  当股价运行到短周期通道的下轨时是短线买入机会,当股价运行到短周期通道的上轨时是短线的卖出时机。
2.  当股价运行到长周期的下轨时是中长线买入时机,而当股价运行到长周期的上轨时是中长线的卖出时机。
3.  当短周期运行到长周期的下轨时，从下向上突破长周期的下轨时是买入时机，而当短周期运行到长周期的上轨时，从上向下突破长周期的上轨时为卖出时机。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 XS2 值
pass1, pass2, pass3, pass4 = XS2(security_list1,check_date='2017-01-04',N=102,M=7)
print pass1[security_list1]
print pass2[security_list1]
print pass3[security_list1]
print pass4[security_list1]

# 输出 security_list2 的 XS2 值
pass_1, pass_2, pass_3, pass_4 = XS2(security_list2,check_date='2017-01-04', N=102,M=7)
for stock in security_list2:
    print pass_1[stock]
    print pass_2[stock]
    print pass_3[stock]
    print pass_4[stock]
```
