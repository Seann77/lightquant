---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 均线型
section_path:
  - 技术分析指标
  - 均线型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#均线型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="均线型"></a>

## 均线型

<a id="AMV-成本价均线"></a>

### AMV-成本价均线

```python
AMV(security_list, check_date, timeperiod = 13, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表

-   check\_date: 要查询数据的日期

-   timeperiod：统计的天数

-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月

-   include\_now：是否包含当前周期，默认为 True

-   fq\_ref\_date：复权基准日，默认为 None


**返回：**

-   AMV的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{‘000001.XSHE’: 8.2675000000000001, ‘603177.XSHG’: nan, ‘000002.XSHE’: 18.232499999999998, ‘601211.XSHG’: 16.314999999999998}

**备注：**

-   计算方式与通达信，同花顺相同，东方财富没有该指标

**用法注释：**

-   成本价均线不同于一般移动平均线系统，成本价均线系统首次将成交量引入均线系统，充分提高均线系统的可靠性。同样对于成本价均线可以使用月均线系统(5,10,20,250)和季均线系统(20,40,60,250),另外成本价均线还可以使用自身特有的均线系统(5,13,34,250),称为市场平均建仓成本均线，简称成本价均线。在四个均线中参数为250的均线为年度均线,为行情支撑均线。成本均线不容易造成虚假信号或骗线，比如某日股价无量暴涨，移动均线会大幅拉升，但成本均线却不会大幅上升，因为在无量的情况下市场持仓成本不会有太大的变化。依据均线理论，当短期均线站在长期均线之上时叫多头排列，反之就叫空头排列。短期均线上穿长期均线叫金叉，短期均线下穿长期均线叫死叉。均线的多头排列是牛市的标志，空头排列是熊市的标志。均线系统一直是市场广泛认可的简单而可靠的分析指标，其使用要点是尽量做多头排列的股票，回避空头排列的股票。34日成本线是市场牛熊的重要的分水岭。一旦股价跌破34日成本线，则常常是最后的出逃机会。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 AMV 值
AMV1 = AMV(security_list1,check_date='2017-01-04', timeperiod=13)
print AMV1[security_list1]

# 输出 security_list2 的 AMV 值
AMV2 = AMV(security_list2,check_date='2017-01-04', timeperiod=13)
for stock in security_list2:
    print AMV2[stock]
```

<a id="ALLIGAT-鳄鱼线"></a>

### ALLIGAT-鳄鱼线

```python
ALLIGAT(security_list, check_date, timeperiod = 21, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   上唇 牙齿 下颚 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.2959999999999976, '603177.XSHG': nan, '000002.XSHE': 18.943000000000001, '601211.XSHG': 16.442000000000004}, {'000001.XSHE': 8.3268749999999994, '603177.XSHG': nan, '000002.XSHE': 17.969375000000003, '601211.XSHG': 16.434999999999999}, {'000001.XSHE': 8.4411538461538456, '603177.XSHG': nan, '000002.XSHE': 15.414615384615388, '601211.XSHG': 16.79269230769231})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标

**用法注释：**

-   鳄鱼线是运用分形几何学和非线性动力学的一组平均线（实际上就是一种比较特别的均线）。它分为蓝、红、绿三条。 蓝线被称为鳄鱼的颚部，红线被称为鳄鱼的牙齿，绿色被称为鳄鱼的唇吻。 它们的构造方法如下： 颚部——13根价格线的平滑移动均线，并将数值向未来方向移动8根价格线； 牙齿——8根价格线的平滑移动平均线，并将数值向未来方向移动5根价格线； 唇吻——5根价格线的平滑移动均线，并将数值向未来方向移动3根价格线。 鳄鱼线的基本使用方法是： 当颚部、牙齿、唇吻纠缠在一起时，我们便进入了观望期（鳄鱼休息了） 当唇吻(绿）在牙齿（红）以上，牙齿在颚部（蓝）以上时，我们便进入了多头市场（颚鱼要开始吃牛肉了） 当唇吻在牙齿以下，牙齿在颚部以下时，我便进入了空头市场（鳄鱼要开始吃熊肉了）

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 ALLIGAT 值
up1, teeth1, down1 = ALLIGAT(security_list1,check_date='2017-01-04', timeperiod = 21)
print up1[security_list1]
print teeth1[security_list1]
print down1[security_list1]

# 输出 security_list2 的 ALLIGAT 值
up2, teeth2, down2 = ALLIGAT(security_list2,check_date='2017-01-04', timeperiod = 21)
for stock in security_list2:
    print up2[stock]
    print teeth2[stock]
    print down2[stock]
```

<a id="BBI-多空均线"></a>

### BBI-多空均线

```python
BBI(security_list, check_date, timeperiod1=3, timeperiod2=6, timeperiod3=12, timeperiod4=24, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod1：统计的天数 N1
-   timeperiod2：统计的天数 N2
-   timeperiod3：统计的天数 N3
-   timeperiod4：统计的天数 N4
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   BBI 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： {'000001.XSHE': 9.223020833333333, '603177.XSHG': nan, '000002.XSHE': 20.7265625, '601211.XSHG': 18.572187500000002}

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.股价位于BBI 上方，视为多头市场； 2.股价位于BBI 下方，视为空头市场。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 BBI 值
BBI1 = BBI(security_list1, check_date='2017-01-04', timeperiod1=3, timeperiod2=6, timeperiod3=12, timeperiod4=24)
print BBI1[security_list1]

# 输出 security_list2 的 BBI 值
BBI2 = BBI(security_list2, check_date='2017-01-04', timeperiod1=3, timeperiod2=6, timeperiod3=12, timeperiod4=24)
for stock in security_list2:
    print BBI2[stock]
```

<a id="EXPMA-指数平均线"></a>

### EXPMA-指数平均线

```python
EXPMA(security_list, check_date, timeperiod = 12, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表

-   check\_date: 要查询数据的日期

-   timeperiod：统计的天数

-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月

-   include\_now：是否包含当前周期，默认为 True

-   fq\_ref\_date：复权基准日，默认为 None


**返回：**

-   EXPMA的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 8.3341666666666665, '603177.XSHG': nan, '000002.XSHE': 19.265000000000001, '601211.XSHG': 16.537499999999998}

**备注：**

-   计算方式与同花顺、东方财富和通达信相同

**用法注释：**

1.  EXPMA 一般以观察12日和50日二条均线为主；
2.  12日指数平均线向上交叉50日指数平均线时，买进；
3.  12日指数平均线向下交叉50日指数平均线时，卖出；
4.  EXPMA 是多种平均线计算方法的一；
5.  EXPMA 配合MTM 指标使用，效果更佳。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 EXPMA 值
EXPMA1 = EXPMA(security_list1,check_date='2017-01-04', timeperiod=12)
print EXPMA1[security_list1]

# 输出 security_list2 的 EXPMA 值
EXPMA2 = EXPMA(security_list2,check_date='2017-01-04', timeperiod=12)
for stock in security_list2:
    print EXPMA2[stock]
```

<a id="BBIBOLL-多空布林线"></a>

### BBIBOLL-多空布林线

```python
BBIBOLL(security_list, check_date, N = 11, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
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

-   BBIBOLL UPR DWN 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.3691666666666649, '603177.XSHG': nan, '000002.XSHE': 19.480520833333337, '601211.XSHG': 16.675729166666663}, {'000001.XSHE': 8.5978513909597396, '603177.XSHG': nan, '000002.XSHE': 24.940210721576193, '601211.XSHG': 17.285976571029227}, {'000001.XSHE': 8.1404819423735901, '603177.XSHG': nan, '000002.XSHE': 14.020830945090481, '601211.XSHG': 16.065481762304099})

**备注：**

-   计算方式与通达信和同花顺相同，东方财富没有该指标

**用法注释：**

1.  为BBI与BOLL的迭加；
2.  高价区收盘价跌破BBI线，卖出信号；
3.  低价区收盘价突破BBI线，买入信号；
4.  BBI线向上，股价在BBI线之上，多头势强；
5.  BBI线向下，股价在BBI线之下，空头势强。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 BBIBOLL 值
bbi1, upr1, dwn1 = BBIBOLL(security_list1,check_date='2017-01-04', N = 11, M = 6)
print bbi1[security_list1]
print upr1[security_list1]
print dwn1[security_list1]

# 输出 security_list2 的 BBIBOLL 值
bbi2, upr2, dwn2 = BBIBOLL(security_list2,check_date='2017-01-04', N = 11, M = 6)
for stock in security_list2:
    print bbi2[stock]
    print upr2[stock]
    print dwn2[stock]
```

<a id="MA-均线"></a>

### MA-均线

```python
MA(security_list, check_date, timeperiod=5, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数timeperiod
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   MA 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 9.2599999999999998, '603177.XSHG': nan, '000002.XSHE': 20.68, '601211.XSHG': 18.704000000000001}

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.股价高于平均线，视为强势；股价低于平均线，视为弱势 2.平均线向上涨升，具有助涨力道；平均线向下跌降，具有助跌力道； 3.二条以上平均线向上交叉时，买进； 4.二条以上平均线向下交叉时，卖出； 5.移动平均线的信号经常落后股价，若以EXPMA 、VMA 辅助，可以改善。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 MA 值
MA1 = MA(security_list1, check_date='2017-01-04', timeperiod=5)
print MA1[security_list1]

# 输出 security_list2 的 MA 值
MA2 = MA(security_list2, check_date='2017-01-04', timeperiod=5)
for stock in security_list2:
    print MA2[stock]
```

<a id="HMA-高价平均线"></a>

### HMA-高价平均线

```python
HMA(security_list, check_date, timeperiod = 12, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表

-   check\_date: 要查询数据的日期

-   timeperiod：统计的天数

-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月

-   include\_now：是否包含当前周期，默认为 True

-   fq\_ref\_date：复权基准日，默认为 None


**返回：**

-   HMA的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 8.3641666666666676, '603177.XSHG': nan, '000002.XSHE': 19.754999999999999, '601211.XSHG': 16.634166666666665}

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   一般移动平均线以收盘价为计算基础，高价平均线是以每日最高价为计算基础。目前市场上许多投资人将其运用在空头市场，认为它的压力效应比传统平均线更具参考价值。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 HMA 值
HMA1 = HMA(security_list1,check_date='2017-01-04', timeperiod=12)
print HMA1[security_list1]

# 输出 security_list2 的 HMA 值
HMA2 = HMA(security_list2,check_date='2017-01-04', timeperiod=12)
for stock in security_list2:
    print HMA2[stock]
```

<a id="LMA-低价平均线"></a>

### LMA-低价平均线

```python
LMA(security_list, check_date, timeperiod = 12, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   LMA的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{‘000001.XSHE’: 8.2675000000000001, ‘603177.XSHG’: nan, ‘000002.XSHE’: 18.232499999999998, ‘601211.XSHG’: 16.314999999999998}

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   一般移动平均线以收盘价为计算基础，低价平均线是以每日最低价为计算基础。目前市场上许多投资人将其运用在多头市场，认为它的支撑效应比传统平均线更具参考价值。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 LMA 值
LMA1 = LMA(security_list1,check_date='2017-01-04', timeperiod=12)
print LMA1[security_list1]

# 输出 security_list2 的 LMA 值
LMA2 = LMA(security_list2,check_date='2017-01-04', timeperiod=12)
for stock in security_list2:
    print LMA2[stock]
```

<a id="VMA-变异平均线"></a>

### VMA-变异平均线

```python
VMA(security_list, check_date, timeperiod = 12, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表

-   check\_date: 要查询数据的日期

-   timeperiod：统计的天数

-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月

-   include\_now：是否包含当前周期，默认为 True

-   fq\_ref\_date：复权基准日，默认为 None


**返回：**

-   VMA的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 8.3202083333333334, '603177.XSHG': nan, '000002.XSHE': 18.979166666666668, '601211.XSHG': 16.474166666666669}

**备注：**

-   计算方式与通达信和同花顺相同，东方财富没有该指标

**用法注释：**

1.  股价高于平均线，视为强势；股价低于平均线，视为弱势；
2.  平均线向上涨升，具有助涨力道；平均线向下跌降，具有助跌力道；
3.  二条以上平均线向上交叉时，买进；
4.  二条以上平均线向下交叉时，卖出；
5.  VMA 比一般平均线的敏感度更高，消除了部份平均线落后的缺陷。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 VMA 值
VMA1 = VMA(security_list1,check_date='2017-01-04', timeperiod=12)
print VMA1[security_list1]

# 输出 security_list2 的 VMA 值
VMA2 = VMA(security_list2,check_date='2017-01-04', timeperiod=12)
for stock in security_list2:
    print VMA2[stock]
```
