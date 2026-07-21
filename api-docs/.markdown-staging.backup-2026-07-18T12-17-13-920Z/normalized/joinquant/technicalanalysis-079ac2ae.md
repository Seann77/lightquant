---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 超买超卖型
section_path:
  - 技术分析指标
  - 超买超卖型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#超买超卖型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="超买超卖型"></a>

## 超买超卖型

<a id="ACCER-幅度涨速"></a>

### ACCER-幅度涨速

```python
ACCER(security_list, check_date, N = 8, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   ACCER 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 0.0013989466754443464, '603177.XSHG': nan, '000002.XSHE': 0.024078586658544048, '601211.XSHG': -0.0056372951942572323}

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

-   算法：先求出斜率，再对其价格进行归一

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 ACCER 值
ACCER1 = ACCER(security_list1, check_date='2017-01-04', N = 8)
print ACCER1[security_list1]

# 输出 security_list2 的 ACCER 值
ACCER2 = ACCER(security_list2, check_date='2017-01-04', N = 8)
for stock in security_list2:
    print ACCER2[stock]
```

<a id="ADTM-动态买卖气指标"></a>

### ADTM-动态买卖气指标

```python
ADTM(security_list, check_date, N = 23, M = 8, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   ADTM和MAADTM 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.49999999999999584, '603177.XSHG': nan, '000002.XSHE': 0.83612040133779286, '601211.XSHG': -0.050991501416427533}, {'000001.XSHE': 0.46909197819443404, '603177.XSHG': nan, '000002.XSHE': 0.79181488308861514, '601211.XSHG': 0.10434158941106236})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.  该指标在+1到-1之间波动;
2.  低于-0.5时为很好的买入点,高于+0.5时需注意风险.

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 ADTM 值
ADTM1, MAADTM1 = ADTM(security_list1, check_date='2017-01-04', N = 23, M = 8)
print ADTM1[security_list1]
print MAADTM1[security_list1]

# 输出 security_list2 的 ADTM 值
ADTM2, MAADTM2 = ADTM(security_list2, check_date='2017-01-04', N = 23, M = 8)
for stock in security_list2:
    print ADTM2[stock]
    print MAADTM2[stock]
```

<a id="ATR-真实波幅"></a>

### ATR-真实波幅

```python
ATR(security_list, check_date, timeperiod=14, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数 timeperiod
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   MTR和ATR 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 0.080000000000000071, '603177.XSHG': nan, '000002.XSHE': 0.16000000000000014, '601211.XSHG': 0.19000000000000128}, {'000001.XSHE': 0.059999999999999866, '603177.XSHG': nan, '000002.XSHE': 0.51142857142857168, '601211.XSHG': 0.28571428571428648})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

算法：今日振幅、今日最高与昨收差价、今日最低与昨收差价中的最大值，为真实波幅，求真实波幅的N日移动平均 参数：N　天数，一般取14

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 ATR 值
MTR1,ATR1 = ATR(security_list1, check_date='2017-01-04', timeperiod=14)
print MTR1[security_list1]
print ATR1[security_list1]

# 输出 security_list2 的 ATR 值
MTR2,ATR2 = ATR(security_list2, check_date='2017-01-04', timeperiod=14)
for stock in security_list2:
    print MTR2[stock]
    print ATR2[stock]
```

<a id="BIAS-乖离率"></a>

### BIAS-乖离率

```python
BIAS(security_list,check_date, N1=6, N2=12, N3=24, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N1: 统计的天数 N1
-   N2: 统计的天数 N2
-   N3: 统计的天数 N3
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   BIAS1, BIAS2, BIAS3 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 0.9012256669069999, '603177.XSHG': nan, '000002.XSHE': 0.064516129032250957, '601211.XSHG': 0.285408490902611}, {'000001.XSHE': 1.4222302744813846, '603177.XSHG': nan, '000002.XSHE': -0.54106047853793771, '601211.XSHG': 1.0015719739501157}, {'000001.XSHE': 1.8605285902742783, '603177.XSHG': nan, '000002.XSHE': -0.51514361883382098, '601211.XSHG': 1.9332321011717053})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.本指标的乖离极限值随个股不同而不同，使用者可利用参考线设定，固定其乖离范围； 2.当股价的正乖离扩大到一定极限时，股价会产生向下拉回的作用力； 3.当股价的负乖离扩大到一定极限时，股价会产生向上拉升的作用力； 4.本指标可设参考线。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 BIAS 值
BIAS11,BIAS12,BIAS13 = BIAS(security_list1,check_date='2017-01-04', N1=6, N2=12, N3=24)
print BIAS11[security_list1]
print BIAS12[security_list1]
print BIAS13[security_list1]

# 输出 security_list2 的 BIAS 值
BIAS21,BIAS22,BIAS23 = BIAS(security_list2,check_date='2017-01-04', N1=6, N2=12, N3=24)
for stock in security_list2:
    print BIAS21[stock]
    print BIAS22[stock]
    print BIAS23[stock]
```

<a id="BIAS_QL-乖离率_传统版"></a>

### BIAS\_QL-乖离率\_传统版

```python
BIAS_QL(security_list, check_date, N = 6, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   BIAS和BIASMA 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 48.10992396473096, '603177.XSHG': nan, '000002.XSHE': 76.922476397442992, '601211.XSHG': 42.883942027049542}, {'000001.XSHE': 44.033385880780266, '603177.XSHG': nan, '000002.XSHE': 79.616029960653222, '601211.XSHG': 32.35472793345135})

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

1.  因为BIAS\_QL的计算公式与BIAS36相似，而常见的炒股软件中均没有找到BIAS\_QL的用法注释，所以此处使用了BIAS36的用法注释；
2.  本指标的乖离极限值随个股不同而不同，使用者可利用参考线设定，固定其乖离范围。※一般6-12BIAS信号的可靠度比3-6BIAS佳；
3.  当股价的正乖离扩大到一定极限时，股价会产生向下拉回的作用力；
4.  当股价的负乖离扩大到一定极限时，股价会产生向上拉升的作用力；
5.  本指标可设参考线。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 BIAS_QL 值
BIAS1, BIASMA1 = BIAS_QL(security_list1, check_date = '2017-01-04', N = 6, M = 6)
print BIAS1[security_list1]
print BIASMA1[security_list1]

# 输出 security_list2 的 BIAS_QL 值
BIAS2, BIASMA2 = BIAS_QL(security_list2, check_date = '2017-01-04', N = 6, M = 6)
for stock in security_list2:
    print BIAS2[stock]
    print BIASMA2[stock]
```

<a id="BIAS_36-三六乖离"></a>

### BIAS\_36-三六乖离

```python
BIAS_36(security_list, check_date, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   BIAS36, BIAS612和MABIAS 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.021666666666666501, '603177.XSHG': nan, '000002.XSHE': 0.92333333333333201, '601211.XSHG': -0.2083333333333357}, {'000001.XSHE': -0.054999999999999716, '603177.XSHG': nan, '000002.XSHE': 1.1916666666666735, '601211.XSHG': -0.37666666666667226}, {'000001.XSHE': -0.020555555555556992, '603177.XSHG': nan, '000002.XSHE': 0.65916666666666279, '601211.XSHG': -0.17138888888888873})

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

1.  本指标的乖离极限值随个股不同而不同，使用者可利用参考线设定，固定其乖离范围。※一般6-12BIAS信号的可靠度比3-6BIAS佳；
2.  当股价的正乖离扩大到一定极限时，股价会产生向下拉回的作用力；
3.  当股价的负乖离扩大到一定极限时，股价会产生向上拉升的作用力；
4.  本指标可设参考线。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 BIAS36 值
BIAS36_1, BIAS612_1, ABIAS_1 = BIAS_36(security_list1, check_date='2017-01-04', M = 6)
print BIAS36_1[security_list1]
print BIAS612_1[security_list1]
print ABIAS_1[security_list1]

# 输出 security_list2 的 BIAS36 值
BIAS36_2, BIAS612_2, ABIAS_2 = BIAS_36(security_list2, check_date='2017-01-04', M = 6)
for stock in security_list2:
    print BIAS36_2[stock]
    print BIAS612_2[stock]
    print ABIAS_2[stock]
```

<a id="CCI-商品路径指标"></a>

### CCI-商品路径指标

```python
CCI(security_list, check_date, N=14, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   CCI 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 176.62274280137152, '603177.XSHG': nan, '000002.XSHE': -30.935837245695815, '601211.XSHG': 98.68173258003705}

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.CCI 为正值时，视为多头市场；为负值时，视为空头市场； 2.常态行情时，CCI 波动于±100 的间；强势行情，CCI 会超出±100 ； 3.CCI>100 时，买进，直到CCI<100 时，卖出； 4.CCI<-100 时，放空，直到CCI>-100 时，回补。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 CCI 值
CCI1 = CCI(security_list1, check_date='2017-01-04', N=14)
print CCI1[security_list1]

# 输出 security_list2 的 CCI 值
CCI2 = CCI(security_list2, check_date='2017-01-04', N=14)
for stock in security_list2:
    print CCI2[stock]
```

<a id="CYF-市场能量"></a>

### CYF-市场能量

```python
CYF(security_list, check_date, N = 21, unit = '1d', include_now = True)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True

**返回：**

-   CYF 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 25.457927713284477, '603177.XSHG': nan, '000002.XSHE': 34.823659982605108, '601211.XSHG': 47.605522169406555}

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标
-   因本指标调用的API较多，该程序计算速度较慢

**用法注释：**

1.  CYF反映了市场公众的状态和追涨热情,又称市场能量指标;
2.  使用CYF判断股票的活跃程度, CYF小于10的股票是冷门股，CYF在20到40之间是活跃股，CYF大于50是热门股;
3.  CYF与股价顶背离时,易形成反转.

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CYF 值
CYF1 = CYF(security_list1, check_date='2017-01-04', N = 21)
print CYF1[security_list1]

# 输出 security_list2 的 CYF 值
CYF2 = CYF(security_list2, check_date='2017-01-04', N = 21)
for stock in security_list2:
    print CYF2[stock]
```

<a id="DKX-多空线"></a>

### DKX-多空线

```python
DKX(security_list, check_date, M = 10, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   DKX和MADKX 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.7320238095238096, '603177.XSHG': nan, '000002.XSHE': 18.6065, '601211.XSHG': 18.081222222222227}, {'000001.XSHE': 8.7608388888888875, '603177.XSHG': nan, '000002.XSHE': 16.825250793650795, '601211.XSHG': 18.38326587301588})

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

1.  当多空线上穿其均线时为买入信号;
2.  当多空线下穿其均线时为卖出信号。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 DKX 值
DKX1,MADKX1 = DKX(security_list1, check_date='2017-01-04', M = 10)
print DKX1[security_list1]
print MADKX1[security_list1]

# 输出 security_list2 的 DKX 值
DKX2,MADKX2 = DKX(security_list2, check_date='2017-01-04', M = 10)
for stock in security_list2:
    print DKX2[stock]
    print MADKX2[stock]
```

<a id="KD-随机指标KD"></a>

### KD-随机指标KD

```python
KD(security_list, check_date, N = 9, M1 = 3, M2 = 3, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表

-   check\_date：要查询数据的日期

-   N：统计的天数 N

-   M1：统计的天数 M1

-   M2：统计的天数 M2

-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月

-   include\_now：是否包含当前周期，默认为 True

-   fq\_ref\_date：复权基准日，默认为 None


**返回：**

-   K和D 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 76.634909558440839, '603177.XSHG': nan, '000002.XSHE': 31.205826728484286, '601211.XSHG': 65.666306018342183}, {'000001.XSHE': 77.290976650878633, '603177.XSHG': nan, '000002.XSHE': 32.552242430383409, '601211.XSHG': 64.593395785918702})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.  KD的计算公式与SKDJ的不太大，而常见的炒股软件中均没有找到KD的用法注释，所以该处的用法注释使用的是公式SKDJ的；
2.  指标>80 时，回档机率大；指标<20 时，反弹机率大；
3.  K在20左右向上交叉D时，视为买进信号；
4.  K在80左右向下交叉D时，视为卖出信号；
5.  SKDJ波动于50左右的任何讯号，其作用不大。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 KD值
K1, D1 = KD(security_list1, check_date = '2017-01-04', N = 9, M1 = 3, M2 = 3)
print K1[security_list1]
print D1[security_list1]

# 输出 security_list2 的 KD 值
K2, D2 = KD(security_list2, check_date = '2017-01-04', N = 9, M1 = 3, M2 = 3)
for stock in security_list2:
    print K2[stock]
    print D2[stock]
```

<a id="KDJ-随机指标"></a>

### KDJ-随机指标

```python
KDJ(security_list, check_date, N =9, M1=3, M2=3, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M1：统计的天数 M1
-   M2：统计的天数 M2
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   K，D和J 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 89.145187806127595, '603177.XSHG': nan, '000002.XSHE': 20.523907534762358, '601211.XSHG': 82.545216532766361}, {'000001.XSHE': 82.915346288340473, '603177.XSHG': nan, '000002.XSHE': 21.246652224886216, '601211.XSHG': 80.903864946907802}, {'000001.XSHE': 101.60487084170185, '603177.XSHG': nan, '000002.XSHE': 19.078418154514644, '601211.XSHG': 85.827919704483492})

**备注：**

-   计算方式与通达信、东方财富和同花顺相同

**用法注释：**

1.指标>80 时，回档机率大；指标<20时，反弹机率大； 2.K在20左右向上交叉D时，视为买进信号； 3.K在80左右向下交叉D时，视为卖出信号； 4.J>100 时，股价易反转下跌；J<0 时，股价易反转上涨； 5.KDJ 波动于50左右的任何信号，其作用不大。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 KDJ 值
K1,D1,J1 = KDJ(security_list1, check_date='2017-01-04', N =9, M1=3, M2=3)
print K1[security_list1]
print D1[security_list1]
print J1[security_list1]

# 输出 security_list2 的 KDJ 值
K2,D2,J2 = KDJ(security_list2, check_date='2017-01-04', N =9, M1=3, M2=3)
for stock in security_list2:
    print K2[stock]
    print D2[stock]
    print J2[stock]
```

<a id="SKDJ-慢速随机指标"></a>

### SKDJ-慢速随机指标

```python
SKDJ(security_list, check_date, N = 9, M = 3, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表

-   check\_date：要查询数据的日期

-   N：统计的天数 N

-   M：统计的天数 M

-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月

-   include\_now：是否包含当前周期，默认为 True

-   fq\_ref\_date：复权基准日，默认为 None


**返回：**

-   K和D 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 43.670179685638736, '603177.XSHG': nan, '000002.XSHE': 88.536829377842508, '601211.XSHG': 11.706561251360608}, {'000001.XSHE': 39.385998813653607, '603177.XSHG': nan, '000002.XSHE': 83.231798914083683, '601211.XSHG': 14.897182159244849})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.  指标>80 时，回档机率大；指标<20 时，反弹机率大；
2.  K在20左右向上交叉D时，视为买进信号；
3.  K在80左右向下交叉D时，视为卖出信号；
4.  SKDJ波动于50左右的任何讯号，其作用不大。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 SKDJ 值
K1, D1 = SKDJ(security_list1, check_date = '2017-01-04', N = 9, M = 3)
print K1[security_list1]
print D1[security_list1]

# 输出 security_list2 的 SKDJ 值
K2, D2 = SKDJ(security_list2, check_date = '2017-01-04', N = 9, M = 3)
for stock in security_list2:
    print K2[stock]
    print D2[stock]
```

<a id="MFI-资金流量指标"></a>

### MFI-资金流量指标

```python
MFI(security_list, check_date, timeperiod=14, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   MFI 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 49.042496052317411, '603177.XSHG': nan, '000002.XSHE': 82.747463608411636, '601211.XSHG': 24.455594865835923}

**备注：**

-   计算方式与同花顺、东方财富和通达信相同

**用法注释：**

1.MFI>80 为超买，当其回头向下跌破80 时，为短线卖出时机； 2.MFI<20 为超卖，当其回头向上突破20 时，为短线买进时机； 3.MFI>80，而产生背离现象时，视为卖出信号； 4.MFI<20，而产生背离现象时，视为买进信号。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 MFI 值
MFI1 = MFI(security_list1,check_date='2017-01-04', timeperiod=14)
print MFI1[security_list1]

# 输出 security_list2 的 MFI 值
MFI2 = MFI(security_list2,check_date='2017-01-04', timeperiod=14)
for stock in security_list2:
    print MFI2[stock]
```

<a id="MTM-动量线"></a>

### MTM-动量线

```python
MTM(security_list, check_date, timeperiod=14, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   MTM的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': -0.12999999999999901, '603177.XSHG': nan, '000002.XSHE': 5.9499999999999993, '601211.XSHG': -1.2699999999999996}

**备注：**

-   计算方式与通达信、同花顺和东方财富和相同

**用法注释：**

MTM线　:当日收盘价与N日前的收盘价的差； MTMMA线:对上面的差值求N日移动平均； 参数：N 间隔天数，也是求移动平均的天数，一般取6用法： 1.MTM从下向上突破MTMMA，买入信号； 2.MTM从上向下跌破MTMMA，卖出信号； 3.股价续创新高，而MTM未配合上升，意味上涨动力减弱； 4.股价续创新低，而MTM未配合下降，意味下跌动力减弱； 5.股价与MTM在低位同步上升，将有反弹行情；反之，从高位同步下降，将有回落走势。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 MTM 值
MTM1 = MTM(security_list1,check_date='2017-01-04', timeperiod=12)
print MTM1[security_list1]

# 输出 security_list2 的 MTM 值
MTM2= MTM(security_list2,check_date='2017-01-04', timeperiod=12)
for stock in security_list2:
    print MTM2[stock]
```

<a id="ROC-变动率指标"></a>

### ROC-变动率指标

```python
ROC(security_list, check_date, timeperiod=12, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   ROC的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： {'000001.XSHE': -1.4557670772676223, '603177.XSHG': nan, '000002.XSHE': 33.999999999999986, '601211.XSHG': -6.7302596714361336}

**备注：**

-   计算方式与通达信、同花顺和东方财富相同

**用法注释：**

1.本指标的超买超卖界限值随个股不同而不同，使用者应自行调整； 2.本指标的超买超卖范围，一般介于±6.5之间； 3.本指标用法请参考MTM 指标用法； 4.本指标可设参考线。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 ROC 值
ROC1 = ROC(security_list1,check_date='2017-01-04', timeperiod=12)
print ROC1[security_list1]

# 输出 security_list2 的 ROC 值
ROC2 = ROC(security_list2,check_date='2017-01-04', timeperiod=12)
for stock in security_list2:
    print ROC2[stock]
```

<a id="RSI-相对强弱指标"></a>

### RSI-相对强弱指标

```python
RSI(security_list, check_date, N1=6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N1：统计的天数N1
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   RSI 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： {'000001.XSHE': 86.697784941552129, '603177.XSHG': nan, '000002.XSHE': 45.669839353084029, '601211.XSHG': 65.952531344607962}

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.RSI>80 为超买，RSI<20 为超卖； 2.RSI 以50为中界线，大于50视为多头行情，小于50视为空头行情； 3.RSI 在80以上形成Ｍ头或头肩顶形态时，视为向下反转信号； 4.RSI 在20以下形成Ｗ底或头肩底形态时，视为向上反转信号； 5.RSI 向上突破其高点连线时，买进；RSI 向下跌破其低点连线时，卖出。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 RSI 值
RSI1 = RSI(security_list1, check_date='2017-01-04', N1=6)
print RSI1[security_list1]

# 输出 security_list2 的 RSI 值
RSI2 = RSI(security_list2, check_date='2017-01-04', N1=6)
for stock in security_list2:
    print RSI2[stock]
```

<a id="MARSI-相对强弱平均线"></a>

### MARSI-相对强弱平均线

```python
MARSI(security_list, check_date, M1 = 10, M2 = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   M1：统计的天数 M1
-   M2：统计的天数 M2
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   RSI10和RSI6 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 48.10992396473096, '603177.XSHG': nan, '000002.XSHE': 76.922476397442992, '601211.XSHG': 42.883942027049542}, {'000001.XSHE': 44.033385880780266, '603177.XSHG': nan, '000002.XSHE': 79.616029960653222, '601211.XSHG': 32.35472793345135})

**备注：**

-   计算方式与通达信相同，与同花顺计算方式本质上相同，但参数不一致，东方财富没有该指标

**用法注释：**

1.  RSI>80 为超卖；RSI<20 为超买；
2.  RSI 以50为中界线，大于50视为多头行情，小于50视为空头行情；
3.  RSI 在80以上形成Ｍ头或头肩顶形态时，视为向下反转信号；
4.  RSI 在20以下形成Ｗ底或头肩底形态时，视为向上反转信号；
5.  RSI 向上突破其高点连线时，买进；RSI 向下跌破其低点连线时，卖出。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 MARSI 值
RSI10_1, RSI6_1 = MARSI(security_list1, check_date = '2017-01-04', M1 = 10, M2 = 6)
print RSI10_1[security_list1]
print RSI6_1[security_list1]

# 输出 security_list2 的 MARSI 值
RSI10_2, RSI6_2 = MARSI(security_list2, check_date = '2017-01-04', M1 = 10, M2 = 6)
for stock in security_list2:
    print RSI10_2[stock]
    print RSI6_2[stock]
```

<a id="OSC-变动速率线"></a>

### OSC-变动速率线

```python
OSC(security_list, check_date, N = 20, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   OSC和MAOSC 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 7.3500000000001009, '603177.XSHG': nan, '000002.XSHE': -17.449999999998766, '601211.XSHG': -5.150000000000432}, {'000001.XSHE': 10.992588074732661, '603177.XSHG': nan, '000002.XSHE': -6.6110853409889812, '601211.XSHG': 8.2021191350369627})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.  OSC 以100 为中轴线，OSC>100 为多头市场；OSC<100 为空头市场；
2.  OSC 向上交叉其平均线时，买进；OSC 向下交叉其平均线时卖出；
3.  OSC 在高水平或低水平与股价产生背离时，应注意股价随时有反转的可能；
4.  OSC 的超买超卖界限值随个股不同而不同，使用者应自行调整

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 OSC 值
OSC1, MAOSC1 = OSC(security_list1, check_date = '2017-01-04', N = 20, M = 6)
print OSC1[security_list1]
print MAOSC1[security_list1]

# 输出 security_list2 的 OSC 值
OSC2, MAOSC2 = OSC(security_list2, check_date = '2017-01-04', N = 20, M = 6)
for stock in security_list2:
    print OSC2[stock]
    print MAOSC2[stock]
```

<a id="UDL-引力线"></a>

### UDL-引力线

```python
UDL(security_list, check_date, N1 = 3, N2 = 5, N3 = 10, N4 = 20, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N1：统计的天数 N1
-   N2：统计的天数 N2
-   N3：统计的天数 N3
-   N4：统计的天数 N4
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   UDL和MAUDL 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 8.7100833333333352, '603177.XSHG': nan, '000002.XSHE': 19.746000000000006, '601211.XSHG': 17.816458333333333}, {'000001.XSHE': 8.711291666666666, '603177.XSHG': nan, '000002.XSHE': 18.525548611111123, '601211.XSHG': 18.064673611111122})

**备注：**

-   计算方式与通达信和同花顺相同，东方财富没有该指标

**用法注释：**

1.  本指标的超买超卖界限值随个股不同而不同，使用者应自行调整；
2.  使用时，可列出一年以上走势图，观察其常态性分布范围，然后用参考线设定其超买超卖范围。通常UDL 高于某个极限时，短期股价会下跌；UDL 低于某个极限时，短期股价会上涨；
3.  本指标可设参考线。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 UDL 值
UDL1, MAUDL1 = UDL(security_list1, check_date = '2017-01-04', N1 = 3, N2 = 5, N3 = 10, N4 = 20, M = 6)
print UDL1[security_list1]
print MAUDL1[security_list1]

# 输出 security_list2 的 UDL 值
UDL2, MAUDL2 = UDL(security_list2, check_date = '2017-01-04', N1 = 3, N2 = 5, N3 = 10, N4 = 20, M = 6)
for stock in security_list2:
    print UDL2[stock]
    print MAUDL2[stock]
```

<a id="WR-威廉指标"></a>

### WR-威廉指标

```python
WR(security_list, check_date, N = 10, N1 = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   WR和MAWR 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 57.50000000000005, '603177.XSHG': nan, '000002.XSHE': 0.0, '601211.XSHG': 93.706293706293721}, {'000001.XSHE': 55.172413793103658, '603177.XSHG': nan, '000002.XSHE': 0.0, '601211.XSHG': 88.157894736842152})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**方法注释：**

1.  WR波动于0 - 100，100置于顶部，0置于底部。
2.  本指标以50为中轴线，高于50视为股价转强；低于50视为股价转弱
3.  本指标高于20后再度向下跌破20，卖出；低于80后再度向上突破80，买进。
4.  WR连续触底3 - 4次，股价向下反转机率大；连续触顶3 - 4次，股价向上反转机率大。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 WR 值
WR1, MAWR1 = WR(security_list1, check_date = '2017-01-04', N = 10, N1 = 6)
print WR1[security_list1]
print MAWR1[security_list1]

# 输出 security_list2 的 WR 值
WR2, MAWR2 = WR(security_list2, check_date = '2017-01-04', N = 10, N1 = 6)
for stock in security_list2:
    print WR2[stock]
    print MAWR2[stock]
```

<a id="LWR-LWR威廉指标"></a>

### LWR-LWR威廉指标

```python
LWR(security_list, check_date, N = 9, M1 = 3, M2 = 3, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M1：统计的天数 M1
-   M2：统计的天数 M2
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   LWR1和LWR2 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 55.650573690335541, '603177.XSHG': nan, '000002.XSHE': 10.13678425444178, '601211.XSHG': 87.916457180768532}, {'000001.XSHE': 58.489680228929586, '603177.XSHG': nan, '000002.XSHE': 16.390638110862337, '601211.XSHG': 80.912153275638602})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.  LWR2<30，超买；LWR2>70，超卖。
2.  线LWR1向下跌破线LWR2，买进参考信号；线LWR1向上突破线LWR2，卖出参考信号。
3.  线LWR1与线LWR2的交叉发生在30以下，70以上，才有效。
4.  LWR指标不适于发行量小，交易不活跃的股票；
5.  LWR指标对大盘和热门大盘股有极高准确性。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 LWR 值
LWR1, LWR2 = LWR(security_list1, check_date = '2017-01-04', N = 9, M1 = 3, M2 = 3)
print LWR1[security_list1]
print LWR2[security_list1]

# 输出 security_list2 的 LWR 值
LWR1, LWR2 = LWR(security_list2, check_date = '2017-01-04', N = 9, M1 = 3, M2 = 3)
for stock in security_list2:
    print LWR1[stock]
    print LWR2[stock]
```

<a id="TAPI-加权指数成交值"></a>

### TAPI-加权指数成交值

```python
TAPI(index_stock, security_list, check_date, M=6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock：大盘指数代码
-   security\_list：股票列表
-   check\_date：要查询数据的日期
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   TAPI和MATAPI 的值

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：({'000001.XSHE': 256244.00809560539, '603177.XSHG': nan, '000002.XSHE': 2290672.9391872431, '601211.XSHG': 295372.46021602425}, {'000001.XSHE': 305104.20587265556, '603177.XSHG': nan, '000002.XSHE': 1682196.5742840525, '601211.XSHG': 431300.71571008326})

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

1.  先界定TAPI长期以来经常性的高低极限值，当TAPI触及顶端极限时，股价可能形成头部；当TAPI触及底端极限时，股价可能形成底部；
2.  行情上涨，TAPI应伴随上涨；若不升反跌，则近期内将面临回档；
3.  先前大盘量缩下跌，当其回升时，TAPI值却持续下跌，可视为买入信号。

**示例：**

```python
# 大盘指数代码
index_stock = '399106.XSHE'
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 TAPI 值
TAPI1,MATAPI1 = TAPI(index_stock, security_list1, check_date='2017-01-04', M=6)
print TAPI1[security_list1]
print MATAPI1[security_list1]

# 输出 security_list2 的 TAPI 值
TAPI2,MATAPI2 = TAPI(index_stock, security_list2, check_date='2017-01-04', M=6)
for stock in security_list2:
    print TAPI2[stock]
    print MATAPI2[stock]
```

<a id="FSL-分水岭"></a>

### FSL-分水岭

```python
FSL(security_list, check_date)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期

**返回：**

-   SWL和SWS 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.9778100759204698, '603177.XSHG': nan, '000002.XSHE': 20.894317966512268, '601211.XSHG': 18.208534476715137}, {'000001.XSHE': 9.0214752948717933, '603177.XSHG': nan, '000002.XSHE': 21.072509500000002, '601211.XSHG': 18.330323064102565})

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

-   股价在分水岭之上为强势,反之为弱势.

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 FSL 值
SWL1,SWS1 = FSL(security_list1, check_date='2017-01-04')
print SWL1[security_list1]
print SWS1[security_list1]

# 输出 security_list2 的 FSL 值
SWL2,SWS2 = FSL(security_list2, check_date='2017-01-04')
for stock in security_list2:
    print SWL2[stock]
    print SWS2[stock]
```
