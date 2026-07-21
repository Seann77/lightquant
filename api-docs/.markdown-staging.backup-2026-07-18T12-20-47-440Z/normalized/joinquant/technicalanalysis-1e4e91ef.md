---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 能量型
section_path:
  - 技术分析指标
  - 能量型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#能量型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="能量型"></a>

## 能量型

<a id="BRAR-情绪指标"></a>

### BRAR-情绪指标

```python
BRAR(security_list, check_date, N=26, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   BR和AR 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 90.769230769230703, '603177.XSHG': nan, '000002.XSHE': 210.38812785388123, '601211.XSHG': 81.198910081743762}, {'000001.XSHE': 92.349726775956157, '603177.XSHG': nan, '000002.XSHE': 283.66762177650412, '601211.XSHG': 81.192660550459109})

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

1.  BR>400，暗示行情过热，应反向卖出；BR<40 ，行情将起死回生，应买进；
2.  AR>180，能量耗尽，应卖出；AR<40 ，能量已累积爆发力，应买进；
3.  BR 由300 以上的高点下跌至50以下的水平,低于AR 时,为绝佳买点；
4.  BR、AR、CR、VR 四者合为一组指标群，须综合搭配使用。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 BRAR 值
BR1,AR1 = BRAR(security_list1, check_date='2017-01-04', N=26)
print BR1[security_list1]
print AR1[security_list1]

# 输出 security_list2 的 BRAR 值
BR2,AR2 = BRAR(security_list2, check_date='2017-01-04', N=26)
for stock in security_list2:
    print BR2[stock]
    print AR2[stock]
```

<a id="CR-带状能量线"></a>

### CR-带状能量线

```python
CR(security_list, check_date, N=26, M1=10, M2=20, M3=40, M4=62, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M1：统计的天数 M1
-   M2：统计的天数 M2
-   M3：统计的天数 M3
-   M4：统计的天数 M4
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   CR和MA1，MA2，MA3，MA4 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 92.287917737788732, '603177.XSHG': nan, '000002.XSHE': 310.60606060606005, '601211.XSHG': 65.852168601099407}, {'000001.XSHE': 140.86650665677868, '603177.XSHG': nan, '000002.XSHE': 263.61151123494176, '601211.XSHG': 132.45402304938904}, {'000001.XSHE': 147.02494118319379, '603177.XSHG': nan, '000002.XSHE': 187.92520738936778, '601211.XSHG': 138.9584146734295}, {'000001.XSHE': 98.715266031757878, '603177.XSHG': nan, '000002.XSHE': 116.68759448530741, '601211.XSHG': 93.303386336228911}, {'000001.XSHE': 78.759338424450661, '603177.XSHG': nan, '000002.XSHE': 100.63420206110173, '601211.XSHG': 78.912222905134882})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.  CR>400时，其10日平均线向下滑落，视为卖出信号；CR<40买进；
2.  CR 由高点下滑至其四条平均线下方时，股价容易形成短期底部；
3.  CR 由下往上连续突破其四条平均线时，为强势买进点；
4.  CR 除了预测价格的外，最大的作用在于预测时间；
5.  BR、AR、CR、VR 四者合为一组指标群，须综合搭配使用。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CR 值
CR1, MA1, MA2, MA3, MA4 = CR(security_list1, check_date='2017-01-04', N=26, M1=10, M2=20, M3=40, M4=62)
print CR1[security_list1]
print MA1[security_list1]
print MA2[security_list1]
print MA3[security_list1]
print MA4[security_list1]

# 输出 security_list2 的 CR 值
CR1, MA1, MA2, MA3, MA4 = CR(security_list2, check_date='2017-01-04', N=26, M1=10, M2=20, M3=40, M4=62)
for stock in security_list2:
    print CR1[stock]
    print MA1[stock]
    print MA2[stock]
    print MA3[stock]
    print MA4[stock]
```

<a id="CYR-市场强弱"></a>

### CYR-市场强弱

```python
CYR(security_list, check_date, N = 13, M = 5, unit = '1d', include_now = True, fq_ref_date = None)
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

-   CYR 和 MACYR 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': -0.054093150941103563, '603177.XSHG': nan, '000002.XSHE': 3.2324567390829451, '601211.XSHG': -0.39420121431832378}, {'000001.XSHE': -0.061359574639450187, '603177.XSHG': nan, '000002.XSHE': 1.7008273617957137, '601211.XSHG': -0.35959378850023205})

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

1.  CYR是成本均线派生出的指标,是13日成本均线的升降幅度;
2.  使用CYR可以对股票的强弱进行排序,找出其中的强势和弱势股票。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CYR 值
CYR1,MACYR1 = CYR(security_list1, check_date='2017-01-04', N = 13, M = 5)
print CYR1[security_list1]
print MACYR1[security_list1]

# 输出 security_list2 的 CYR 值
CYR2,MACYR2 = CYR(security_list2, check_date='2017-01-04', N = 13, M = 5)
for stock in security_list2:
    print CYR2[stock]
    print MACYR2[stock]
```

<a id="MASS-梅斯线"></a>

### MASS-梅斯线

```python
MASS(security_list, check_date, N1=9, N2=25, M=6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N1：统计的天数 N1
-   N2：统计的天数 N2
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   MASS和MAMASS 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 24.239711786446705, '603177.XSHG': nan, '000002.XSHE': 32.023209054655545, '601211.XSHG': 23.609848955660624}, {'000001.XSHE': 23.894883731671456, '603177.XSHG': nan, '000002.XSHE': 31.687243323851508, '601211.XSHG': 23.978558571459313})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.  MASS>27 后，随后又跌破26.5，此时股价若呈上涨状态，则卖出；
2.  MASS<27 后，随后又跌破26.5，此时股价若呈下跌状态，则买进；
3.  MASS<20 的行情，不宜进行投资。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 MASS 值
MASS1,MAMASS1 = MASS(security_list1, check_date='2017-01-04', N1=9, N2=25, M=6)
print MASS1[security_list1]
print MAMASS1[security_list1]

# 输出 security_list2 的 MASS 值
MASS2,MAMASS2 = MASS(security_list2, check_date='2017-01-04', N1=9, N2=25, M=6)
for stock in security_list2:
    print MASS2[stock]
    print MAMASS2[stock]
```

<a id="PCNT-幅度比"></a>

### PCNT-幅度比

```python
PCNT(security_list, check_date, M = 5, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   PCNT 和 MAPCNT 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': -0.81775700934579765, '603177.XSHG': nan, '000002.XSHE': 9.1257995735607711, '601211.XSHG': -0.17261219792866017}, {'000001.XSHE': -0.093375782685468367, '603177.XSHG': nan, '000002.XSHE': 5.1789530788938016, '601211.XSHG': -0.6614506214203465})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

1.  PCNT 重视价格的涨跌幅度，排除观察涨跌跳动值；
2.  较高的PCNT 值，表示该股波动幅度大；
3.  较低的PCNT 值，表示该股波动幅度小。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 PCNT 值
PCNT1,MAPCNT1 = PCNT(security_list1, check_date='2017-01-04', M=5)
print PCNT1[security_list1]
print MAPCNT1[security_list1]

# 输出 security_list2 的 PCNT 值
PCNT2,MAPCNT2 = PCNT(security_list2, check_date='2017-01-04', M=5)
for stock in security_list2:
    print PCNT2[stock]
    print MAPCNT2[stock]
```

<a id="PSY-心理线"></a>

### PSY-心理线

```python
PSY(security_list, check_date, timeperiod=12, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   PSY 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 50.0, '603177.XSHG': nan, '000002.XSHE': 58.333333333333336, '601211.XSHG': 33.333333333333329}

**备注：**

-   计算方式与通达信、同花顺和东方财富相同

**用法注释：**

1.PSY>75，形成Ｍ头时，股价容易遭遇压力； 2.PSY<25，形成Ｗ底时，股价容易获得支撑； 3.PSY 与VR 指标属一组指标群，须互相搭配使用。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 PSY 值
PSY1 = PSY(security_list1,check_date='2017-01-04', timeperiod=14)
print PSY1[security_list1]

# 输出 security_list2 的 PSY 值
PSY2 = PSY(security_list2,check_date='2017-01-04', timeperiod=14)
for stock in security_list2:
    print PSY2[stock]
```

<a id="VR-成交量变异率"></a>

### VR-成交量变异率

```python
VR(security_list, check_date, N=26, M=6, unit = '1d', include_now = True, fq_ref_date = None)
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

-   VR和MAVR 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 131.42761741216233, '603177.XSHG': nan, '000002.XSHE': 213.15765431976482, '601211.XSHG': 84.984239389082546}, {'000001.XSHE': 133.5803410407361, '603177.XSHG': nan, '000002.XSHE': 182.61022230207126, '601211.XSHG': 117.87968865084336})

**备注：**

-   计算方式与通达信和东方财富相同，与同花顺中的VR指标不同

**用法注释：**

1.  VR>450，市场成交过热，应反向卖出；
2.  VR<40 ，市场成交低迷，人心看淡的际，应反向买进；
3.  VR 由低档直接上升至250，股价仍未遭受阻力，此为大行情的前兆；
4.  VR 除了与PSY为同指标群外，尚须与BR、AR、CR同时搭配研判

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 VR 值
VR1,MAVR1 = VR(security_list1, check_date='2017-01-04', N=26, M=6)
print VR1[security_list1]
print MAVR1[security_list1]

# 输出 security_list2 的 VR 值
VR2,MAVR2 = VR(security_list2, check_date='2017-01-04', N=26, M=6)
for stock in security_list2:
    print VR2[stock]
    print MAVR2[stock]
```
