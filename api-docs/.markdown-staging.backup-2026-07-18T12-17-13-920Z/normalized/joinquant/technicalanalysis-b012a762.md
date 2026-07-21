---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 其他型
section_path:
  - 技术分析指标
  - 其他型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#其他型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="其他型"></a>

## 其他型

<a id="EMA-指数移动平均"></a>

### EMA-指数移动平均

```python
EMA(security_list, check_date, timeperiod=30, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数timeperiod
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   EMA 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： {'000001.XSHE': 9.2093998886039152, '603177.XSHG': nan, '000002.XSHE': 21.508006572807883, '601211.XSHG': 18.477471693552996}

**备注：**

-   EMA(X,N)，求X的N日指数平滑移动平均。
-   通达信，同花顺和东方财富软件中没有独立的EMA指标，但在技术指标公式中很常见

**用法注释：**

返回指数移动平均

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 EMA 值
EMA1 = EMA(security_list1, check_date='2017-01-04', timeperiod=30)
print EMA1[security_list1]

# 输出 security_list2 的 EMA 值
EMA2 = EMA(security_list2, check_date='2017-01-04', timeperiod=30)
for stock in security_list2:
    print EMA2[stock]
```

<a id="SMA-移动平均"></a>

### SMA-移动平均

```python
SMA(security_list, check_date, N = 7, M = 1, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M：权重 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   SMA(X的 N 日移动平均) 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 9.2162678826932893, '603177.XSHG': nan, '000002.XSHE': 20.728620789626724, '601211.XSHG': 18.560024926286996}

**备注：**

-   SMA(X, N, M)， 求X的N日移动平均，M为权重。
-   与EMA指标类似，通达信，同花顺和东方财富软件中都没有独立的SMA指标，但在技术指标公式中很常见

**用法注释：**

返回移动平均

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 SMA 值
SMA1 = SMA(security_list1, check_date='2017-01-04', N = 7, M = 1)
print SMA1[security_list1]

# 输出 security_list2 的 SMA 值
SMA2 = SMA(security_list2, check_date='2017-01-04', N = 7, M = 1)
for stock in security_list2:
    print SMA2[stock]
```

<a id="BDZX-波段之星"></a>

### BDZX-波段之星

```python
BDZX(security_list, check_date, timeperiod = 40, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   AK AD1 AJ AA BB CC BUY SELL的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 22.397881644648351, '603177.XSHG': nan, '000002.XSHE': 108.93248196853847, '601211.XSHG': 18.728878312355658}, {'000001.XSHE': 15.461025692779121, '603177.XSHG': nan, '000002.XSHE': 105.76639666053059, '601211.XSHG': 10.553105095800039}, {'000001.XSHE': 36.271593548386811, '603177.XSHG': nan, '000002.XSHE': 115.26465258455423, '601211.XSHG': 35.080424745466892}, {'000001.XSHE': 100, '603177.XSHG': nan, '000002.XSHE': 100, '601211.XSHG': 100}, {'000001.XSHE': 0, '603177.XSHG': nan, '000002.XSHE': 0, '601211.XSHG': 0}, {'000001.XSHE': 80, '603177.XSHG': nan, '000002.XSHE': 80, '601211.XSHG': 80}, {'000001.XSHE': 20, '603177.XSHG': nan, '000002.XSHE': 20, '601211.XSHG': 20}, {'000001.XSHE': 20, '603177.XSHG': nan, '000002.XSHE': 20, '601211.XSHG': 20})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的BDZX值
ak1, ad11, aj1, aa1, bb1, cc1, buy1, sell1 = BDZX(security_list1,check_date='2017-01-04',timeperiod = 40)
print ak1[security_list1]
print ad11[security_list1]
print aj1[security_list1]
print aa1[security_list1]
print bb1[security_list1]
print cc1[security_list1]
print buy1[security_list1]
print sell1[security_list1]

# 输出 security_list2 的BDZX值
ak2, ad12, aj2, aa2, bb2, cc2, buy2, sell2 = BDZX(security_list2,check_date='2017-01-04',timeperiod = 40)
for stock in security_list2:
    print ak2[stock]
    print ad12[stock]
    print aj2[stock]
    print aa2[stock]
    print bb2[stock]
    print cc2[stock]
    print buy2[stock]
    print sell2[stock]
```

<a id="CDP-STD-逆势操作"></a>

### CDP-STD-逆势操作

```python
CDP_STD(security_list, check_date, timeperiod = 2, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   CDP AH NH NL AL的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.2999999999999989, '603177.XSHG': nan, '000002.XSHE': 20.716666666666669, '601211.XSHG': 16.420000000000002}, {'000001.XSHE': 8.3999999999999986, '603177.XSHG': nan, '000002.XSHE': 23.683333333333337, '601211.XSHG': 16.839999999999996}, {'000001.XSHE': 8.3399999999999981, '603177.XSHG': nan, '000002.XSHE': 21.903333333333336, '601211.XSHG': 16.580000000000002}, {'000001.XSHE': 8.2799999999999976, '603177.XSHG': nan, '000002.XSHE': 20.123333333333338, '601211.XSHG': 16.320000000000004}, {'000001.XSHE': 8.2199999999999971, '603177.XSHG': nan, '000002.XSHE': 18.343333333333341, '601211.XSHG': 16.060000000000006})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

1.  在股价波动不是很大的情况下，即开盘价位在近高值与近低值之间时，通常交易者可以在近低值价位买进，而在近高值 价位卖出，或在近高值价位卖出，近低值价位买进；
2.  当开盘价开在最高值或最低值附近时，则意味着跳空开高跳空开低，是一个大行情发动的开始；
3.  投资者可以在最高值的价位去追买，在最低值的价位去追。通常，一个跳空意味着强烈的涨跌，一般有相当利润。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CDP_STD 值
cdp1, ah1, nh1, nl1, al1 = CDP_STD(security_list1,check_date='2017-01-04',timeperiod = 2)
print cdp1[security_list1]
print ah1[security_list1]
print nh1[security_list1]
print nl1[security_list1]
print al1[security_list1]

# 输出 security_list2 的 CDP_STD 值
cdp2, ah2, nh2, nl2, al2 = CDP_STD(security_list2,check_date='2017-01-04',timeperiod = 2)
for stock in security_list2:
    print cdp2[stock]
    print ah2[stock]
    print nh2[stock]
    print nl2[stock]
    print al2[stock]
```

<a id="CJDX-超级短线"></a>

### CJDX-超级短线

```python
CJDX(security_list, check_date, timeperiod = 16, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   J D X 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.11002480230239936, '603177.XSHG': nan, '000002.XSHE': 2.6556460504346004, '601211.XSHG': 0.29901270180941614}, {'000001.XSHE': -0.01320344720107162, '603177.XSHG': nan, '000002.XSHE': 2.1633636400906964, '601211.XSHG': 0.077664343546118675}, {'000001.XSHE': 0.11002480230239936, '603177.XSHG': nan, '000002.XSHE': 2.6556460504346004, '601211.XSHG': 0.29901270180941614})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CJDX 值
j1, d1, x1 = CJDX(security_list1,check_date='2017-01-04',timeperiod = 16)
print j1[security_list1]
print d1[security_list1]
print x1[security_list1]

# 输出 security_list2 的 CJDX 值
j2, d2, x2 = CJDX(security_list2,check_date='2017-01-04', timeperiod = 16)
for stock in security_list2:
    print j2[stock]
    print d2[stock]
    print x2[stock]
```

<a id="CYHT-财运亨通"></a>

### CYHT-财运亨通

```python
CYHT(security_list, check_date, timeperiod = 60, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   高抛 SK SD 低吸 强弱分界 卖出 买进的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 80, '603177.XSHG': nan, '000002.XSHE': 80, '601211.XSHG': 80}, {'000001.XSHE': 17.929490206459231, '603177.XSHG': nan, '000002.XSHE': 83.601127541849465, '601211.XSHG': 12.914568429828984}, {'000001.XSHE': 17.146097465013412, '603177.XSHG': nan, '000002.XSHE': 82.349398031667931, '601211.XSHG': 11.993894956959814}, {'000001.XSHE': 20, '603177.XSHG': nan, '000002.XSHE': 20, '601211.XSHG': 20}, {'000001.XSHE': 50, '603177.XSHG': nan, '000002.XSHE': 50, '601211.XSHG': 50}, {'000001.XSHE': 78, '603177.XSHG': nan, '000002.XSHE': 78, '601211.XSHG': 78}, {'000001.XSHE': 40, '603177.XSHG': nan, '000002.XSHE': 22, '601211.XSHG': 40})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   无

**示例：**

```
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CYHT 值
h_throw1, sk1, sd1, weak1, bound1, sell1, buy1 = CYHT(security_list1,check_date='2017-07-03', timeperiod = 60)
print h_throw1[security_list1]
print sk1[security_list1]
print sd1[security_list1]
print weak1[security_list1]
print bound1[security_list1]
print sell1[security_list1]
print buy1[security_list1]

# 输出 security_list2 的 CYHT 值
h_throw2, sk2, sd2, weak2, bound2, sell2, buy2 = CYHT(security_list2,check_date='2016-01-04', timeperiod = 60)
for stock in security_list2:
    print h_throw2[stock]
    print sk2[stock]
    print sd2[stock]
    print weak2[stock]
    print bound2[stock]
    print sell2[stock]
    print buy2[stock]
```

<a id="JAX-济安线"></a>

### JAX-济安线

```python
JAX(security_list, check_date, timeperiod = 30, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   JAX的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.5740591143944016, '603177.XSHG': nan, '000002.XSHE': 20.897541170540642, '601211.XSHG': 17.019535303955521}, {'000001.XSHE': 8.5740591143944016, '603177.XSHG': nan, '000002.XSHE': nan, '601211.XSHG': 17.019535303955521}, {'000001.XSHE': 8.308706269396076, '603177.XSHG': nan, '000002.XSHE': 21.390565309524611, '601211.XSHG': 16.648839215213961}, {'000001.XSHE': 8.308706269396076, '603177.XSHG': nan, '000002.XSHE': nan, '601211.XSHG': 16.648839215213961})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   随行情自动调整参数，在济安线上面做多，重心价低于济安线做空。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 JAX 值
jax1, j1, a1, x1 = JAX(security_list1,check_date='2017-01-04',timeperiod = 30)
print jax1[security_list1]
print j1[security_list1]
print a1[security_list1]
print x1[security_list1]

# 输出 security_list2 的 JAX 值
jax2, j2, a2, x2 = JAX(security_list2,check_date='2017-01-04', timeperiod = 30)
for stock in security_list2:
    print jax2[stock]
    print j2[stock]
    print a2[stock]
    print x2[stock]
```

<a id="JFZX-飓风智能中线"></a>

### JFZX-飓风智能中线

```python
JFZX(security_list, check_date, timeperiod = 30, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   多头力量 空头力量 多空平衡的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 51.561349115382981, '603177.XSHG': nan, '000002.XSHE': 74.378474653808553, '601211.XSHG': 45.557918745746676}, {'000001.XSHE': 48.438650884617019, '603177.XSHG': nan, '000002.XSHE': 25.621525346191447, '601211.XSHG': 54.442081254253324}, {'000001.XSHE': 50, '603177.XSHG': nan, '000002.XSHE': 50, '601211.XSHG': 50})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 JFZX 值
most1, empty1, balance1 = JFZX(security_list1,check_date='2017-01-04',timeperiod = 30)
print most1[security_list1]
print empty1[security_list1]
print balance1[security_list1]
# 输出 security_list2 的 JFZX 值
most2, empty2, balance2 = JFZX(security_list2,check_date='2017-01-04', timeperiod = 30)
for stock in security_list2:
    print most2[stock]
    print empty2[stock]
    print balance2[stock]
```

<a id="JYJL-交易参考均量"></a>

### JYJL-交易参考均量

```python
JYJL(security_list, check_date, N = 120, M = 5, unit = '1d', include_now = True, fq_ref_date = None)
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

-   单位时间总量 单位时间内均量的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 7182321907.0, '603177.XSHG': nan, '000002.XSHE': 21805306577.0, '601211.XSHG': 4912822384.0}, {'000001.XSHE': 299263412.79166663, '603177.XSHG': nan, '000002.XSHE': 908554440.70833337, '601211.XSHG': 204700932.66666666})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 JYJL 值
com1, per1 = JYJL(security_list1,check_date='2017-01-04',N = 120, M = 5)
print com1[security_list1]
print per1[security_list1]
# 输出 security_list2 的 JYJL 值
com2, per2 = JYJL(security_list2,check_date='2017-01-04', N = 120, M = 5)
for stock in security_list2:
    print com2[stock]
    print per2[stock]
```

<a id="LHXJ-猎狐先觉"></a>

### LHXJ-猎狐先觉

```python
LHXJ(security_list, check_date, timeperiod = 100, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   弃盘 控盘 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': -0.078954910995084795, '603177.XSHG': nan, '000002.XSHE': -2.4117024942960295, '601211.XSHG': -0.55041969706332594}, {'000001.XSHE': 0.078954910995084795, '603177.XSHG': nan, '000002.XSHE': 2.4117024942960295, '601211.XSHG': 0.55041969706332594})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 LHXJ 值
give_up1, control1 = LHXJ(security_list1,check_date='2017-01-04',timeperiod = 100)
print give_up1[security_list1]
print control1[security_list1]
# 输出 security_list2 的 LHXJ 值
give_up2, control2 = LHXJ(security_list2,check_date='2017-01-04', timeperiod = 100)
for stock in security_list2:
    print give_up2[stock]
    print control2[stock]
```

<a id="LYJH-猎鹰歼狐"></a>

### LYJH-猎鹰歼狐

```python
LYJH(security_list, check_date, M = 80, M1 = 50, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   M：统计的天
-   M1：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   EMPTY MOST LH LH1的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 70.233318935447187, '603177.XSHG': nan, '000002.XSHE': 3.3460592852753157, '601211.XSHG': 75.765157023322814}, {'000001.XSHE': 41.673107311405985, '603177.XSHG': nan, '000002.XSHE': 77.29146032043505, '601211.XSHG': 43.650685322144895}, {'000001.XSHE': 80, '603177.XSHG': nan, '000002.XSHE': 80, '601211.XSHG': 80}, {'000001.XSHE': 50, '603177.XSHG': nan, '000002.XSHE': 50, '601211.XSHG': 50})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 LYJH 值
empty1, most1, lh1, lh11 = LYJH(security_list1,check_date='2017-01-04',M = 80, M1 = 50)
print empty1[security_list1]
print most1[security_list1]
print lh1[security_list1]
print lh11[security_list1]

# 输出 security_list2 的 LYJH 值
empty2, most2, lh2, lh12 = LYJH(security_list2,check_date='2017-01-04',M = 80, M1 = 50)
for stock in security_list2:
    print empty2[stock]
    print most2[stock]
    print lh2[stock]
    print lh12[stock]
```

<a id="TBP-STD-趋势平衡点"></a>

### TBP-STD-趋势平衡点

```python
TBP_STD(security_list, check_date, timeperiod=30, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   tbp，多头获利，多头停损，空头回补和空头停损的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 7.6199999999999992, '603177.XSHG': nan, '000002.XSHE': 19.489999999999998, '601211.XSHG': 14.91}, {'000001.XSHE': 7.9133333333333331, '603177.XSHG': nan, '000002.XSHE': 21.903333333333336, '601211.XSHG': 15.940000000000001}, {'000001.XSHE': 7.4466666666666663, '603177.XSHG': nan, '000002.XSHE': 18.786666666666669, '601211.XSHG': 14.67}, {'000001.XSHE': nan, '603177.XSHG': nan, '000002.XSHE': nan, '601211.XSHG': nan}, {'000001.XSHE': nan, '603177.XSHG': nan, '000002.XSHE': nan, '601211.XSHG': nan})

**备注：**

-   计算方式与通达信一致，东方财富和同花顺没有该指标

**用法注释：**

-   一.开始进场
    1.  当收盘价高于TBP时，在收盘的那一刻，应该进场买入股票；
    2.  当收盘价低于TBP时，在收盘的那一刻，应该卖出股票出场或融券放空；
-   二.市况反转（股价未触及了结点或停损点时）
    1.  当收盘价高于TBP时，在收盘的那一刻，应该把空头交易改为多头交易；
    2.  当收盘价低于TBP时，在收盘的那一刻，应该把多头交易改为空头交易；
-   三.出场
    1.  当股价抵达了结点时，应获利了结出场，但不能反转；
    2.  当股价碰触停损点时，应停损出场，但不能反转；
-   四.重新进场
    1.  出场后，须依据收盘时的TBP来决定是否重新进场；
-   五.决定明天的TBP
    1.  如果市况是多头，则先挑出前两天速量因子中较小者，然后，再与昨天的收盘价相加，即可求出明天的TBP；
    2.  如果市况是空头，则先挑出前两天速量加子中较大者，然后，再与昨天的收盘 价相加，即可求出明天的TBP。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 TBP-STD 值
tbp,dthl,dtts,kthb,ktts = TBP_STD(security_list1, check_date='2017-01-04', timeperiod=30)
print tbp[security_list1]
print dthl[security_list1]
print dtts[security_list1]
print dthb[security_list1]
print dtts[security_list1]
# 输出 security_list2 的 TBP-STD 值
tbp,dthl,dtts,kthb,ktts = TBP_STD(security_list1, check_date='2017-01-04', timeperiod=30)
for stock in security_list2:
    print tbp[stock]
    print dthl[stock]
    print dtts[stock]
    print dthb[stock]
    print dtts[stock]
```

<a id="ZBCD-准备抄底"></a>

### ZBCD-准备抄底

```python
ZBCD(security_list, check_date, timeperiod = 10, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date: 要查询数据的日期
-   timeperiod：统计的天数
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   抄底 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 2.2391834797025112, '603177.XSHG': nan, '000002.XSHE': 22.322622024365632, '601211.XSHG': 4.8837093022246734}

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 ZBCD 值
cd1 = ZBCD(security_list1,check_date='2017-01-04',timeperiod = 10)
print cd1[security_list1]

# 输出 security_list2 的 ZBCD 值
cd2 = ZBCD(security_list2,check_date='2017-01-04', timeperiod = 10)
for stock in security_list2:
    print cd2[stock]
```
