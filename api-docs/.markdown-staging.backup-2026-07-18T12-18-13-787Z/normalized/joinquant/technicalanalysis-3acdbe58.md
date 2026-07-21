---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 成交量型
section_path:
  - 技术分析指标
  - 成交量型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#成交量型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="成交量型"></a>

## 成交量型

<a id="AMO-成交金额"></a>

### AMO-成交金额

```python
AMO(security_list, check_date, M1 = 5, M2 = 10, unit = '1d', include_now = True, fq_ref_date = None)
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

-   AMOW，AMO1和AMO2 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 42858.215500999999, '603177.XSHG': nan, '000002.XSHE': 528895.0784, '601211.XSHG': 26720.7556}, {'000001.XSHE': 36852.956986600002, '603177.XSHG': nan, '000002.XSHE': 391033.63072000002, '601211.XSHG': 30396.797399999999}, {'000001.XSHE': 40629.7649418, '603177.XSHG': nan, '000002.XSHE': 432376.88320000004, '601211.XSHG': 36740.013179999994})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标
-   本函数未显示VOLSTICK，其在通达信中是柱状线的图形

**用法注释：**

1.  成交金额大，代表交投热络，可界定为热门股；
2.  底部起涨点出现大成交金额，代表攻击量；
3.  头部地区出现大成交金额，代表出货量；
4.  观察成交金额的变化，比观察成交手数更具意义，因为成交手数并未反应股价的涨跌的后所应支出的实际金额。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 AMO 值
AMOW,AMO1,AMO2 = AMO(security_list1, check_date='2017-01-04', M1 = 5, M2 = 10)
print AMOW[security_list1]
print AMO1[security_list1]
print AMO2[security_list1]

# 输出 security_list2 的 AMO 值
AMOW,AMO1,AMO2 = AMO(security_list2, check_date='2017-01-04', M1 = 5, M2 = 10)
for stock in security_list2:
    print AMOW[stock]
    print AMO1[stock]
    print AMO2[stock]
```

<a id="CCL-持仓量（适用期货期权）"></a>

### CCL-持仓量（适用期货期权）

```python
CCL(futures_list, check_date, M=5)
```

**参数：**

-   futures\_list：期货、期权列表
-   check\_date：要查询数据的日期
-   M：统计的天数 M

**返回：**

-   CCL和MACCL 的值。

**返回结果类型：**

-   字典(dict)：键(key)为期货期权代码，值(value)为数据。
-   如：({'IF1712.CCFX': 2533.0, 'IF1803.CCFX': nan, 'IF1709.CCFX': 9828.0, 'IF1708.CCFX': 1504.0}, {'IF1712.CCFX': 2500.0, 'IF1803.CCFX': nan, 'IF1709.CCFX': 9748.6000000000004, 'IF1708.CCFX': 1213.8})

**备注：**

-   计算方式与通达信和东方财富（参数M取值不同）相同，同花顺没有该指标

**用法注释：**

1.  持仓量上升或下降的变化为图表分析师提供了判断价格走势的线索。
2.  持仓量远不如价格信息重要，所以它主要用于印证市场走势。

**示例：**

```python
# 定义金融期货代码列表
futures_list1 = 'IF1708.CCFX'
futures_list2 = ['IF1708.CCFX','IF1709.CCFX','IF1712.CCFX','IF1803.CCFX']

# 计算并输出 futures_list1 的 CCL 值
CCL1,MACCL1 = CCL(futures_list1, check_date='2017-07-04', M=5)
print CCL1[futures_list1]
print MACCL1[futures_list1]

# 输出 futures_list2 的 CCL 值
CCL2,MACCL2 = CCL(futures_list2, check_date='2017-07-04', M=5)
for stock in futures_list2:
    print CCL2[stock]
    print MACCL2[stock]
```

<a id="DBLB-对比量比"></a>

### DBLB-对比量比

```python
DBLB(index_stock, security_list, check_date, N=5, M=5, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock: 大盘股票代码
-   security\_list:股票列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   DBLB和MADBLB 的值

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：({'000001.XSHE': 2.1493659892493957, '603177.XSHG': nan, '000002.XSHE': 0.76166585836540168, '601211.XSHG': 3.1383580528664869}, {'000001.XSHE': 1.310194821508738, '603177.XSHG': nan, '000002.XSHE': 0.82666969680671354, '601211.XSHG': 1.3389363967102343})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标

**用法注释：**

-   对比量比指标用于用于测度成交量放大程度或萎缩程度 的指标。对比量比值越大，说明成交量较前期成交量放 大程度越大，对比量比值越小，说明成交量较前期成交 量萎缩程度越大，一般认为:

1.  对比量比大于20可以认为成交量极度放大；
2.  对比量比大于3,可以认为成交量显著放大；
3.  对比量比小于0.2,可以认为成交量极度萎缩；
4.  对比量比小于0.4,可以认为成交量显著萎缩。

**示例：**

```python
# 定义股票池列表
index_stock = '399106.XSHE'
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 DBLB 值
DBLB1,MADBLB1 = DBLB(index_stock, security_list1, check_date='2017-01-04', N=5, M=5)
print DBLB1[security_list1]
print MADBLB1[security_list1]

# 输出 security_list2 的 DBLB 值
DBLB2,MADBLB2 = DBLB(index_stock, security_list2, check_date='2017-01-04', N=5, M=5)
for stock in security_list2:
    print DBLB2[stock]
    print MADBLB2[stock]
```

<a id="DBQRV-对比强弱量"></a>

### DBQRV-对比强弱量

```python
DBQRV(index_stock, security_list, check_date, N = 5, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock: 大盘股票代码
-   security\_list:股票列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   ZS和GG 的值

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：({'399106.XSHE': 0.6426864576400364}, {'000001.XSHE': 2.6501693742416115, '603177.XSHG': nan, '000002.XSHE': 0.10023325347228342, '601211.XSHG': 3.7644208422132119})（此次示例把深证综指（399106.XSHE）当做了大盘股票）

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标

**用法注释：**

-   对比强弱量指标包含有两条指标线,一条是对应指数量的 强弱线。另外一条是个股成交量的强弱线。当个股强弱线 与指数强弱线发生金叉时，表明个股成交活跃过大盘。当 个股强弱线与指数强弱线发生死叉时，表明个股活跃度开 始弱于大盘。对比强弱量指标也是一个短线指标。

-   注意：此指标使用到了大盘的数据，所以需要下载完整的 日线数据,否则显示可能不正确


**示例：**

```python
# 定义股票池列表
index_stock = '399106.XSHE'
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 DBQRV 值
ZS1,GG1 = DBQRV(index_stock, security_list1, check_date='2017-01-04', N = 5)
print ZS1[index_stock]
print GG1[security_list1]

# 输出 security_list2 的 DBQRV 值
ZS2,GG2 = DBQRV(index_stock, security_list2, check_date='2017-01-04', N = 5)
for stock in security_list2:
    print ZS2[index_stock]
    print GG2[stock]
```

<a id="HSL-换手线"></a>

### HSL-换手线

```python
HSL(security_list, check_date, N = 5, unit = '1d', include_now = True)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True

**返回：**

-   HSL和MAHSL 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 0.42388098152752657, '603177.XSHG': nan, '000002.XSHE': 2.4040782443554365, '601211.XSHG': 1.0070272131147542}, {'000001.XSHE': 0.36486110275710459, '603177.XSHG': nan, '000002.XSHE': 1.9485759345950888, '601211.XSHG': 1.1303558950819672})

**备注：**

-   计算方式与通达信和同花顺相同，东方财富没有该指标
-   通达信中HSCOL指标的计算方式与HSL完全相同，如果需要HSCOL，请以HSL做参考。

**用法注释：**

1.  换手线是根据换手率绘制的曲线，使对于成交量的研判
2.  不受股本变动的影响，更增加了成交量具有可比性。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 HSL 值
HSL1,MAHSL1 = HSL(security_list1, check_date='2017-01-04', N = 5)
print HSL1[security_list1]
print MAHSL1[security_list1]

# 输出 security_list2 的 HSL 值
HSL2,MAHSL2 = HSL(security_list2, check_date='2017-01-04', N = 5)
for stock in security_list2:
    print HSL2[stock]
    print MAHSL2[stock]
```

<a id="OBV-累积能量线"></a>

### OBV-累积能量线

```python
OBV(security_list, check_date, timeperiod=30, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   timeperiod：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   OBV 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 7606250650.0, '603177.XSHG': nan, '000002.XSHE': 10161140224.0, '601211.XSHG': 3422411336.0}

**备注：**

-   返回结果与通达信、同花顺、东方财富结果均不一致

**用法注释：**

1.股价一顶比一顶高，而OBV 一顶比一顶低，暗示头部即将形成； 2.股价一底比一底低，而OBV 一底比一底高，暗示底部即将形成； 3.OBV 突破其Ｎ字形波动的高点次数达5 次时，为短线卖点； 4.OBV 跌破其Ｎ字形波动的低点次数达5 次时，为短线买点； 5.OBV 与ADVOL、PVT、WAD、ADL同属一组指标群，使用时应综合研判。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 OBV 值
OBV1 = OBV(security_list1,check_date='2017-01-04', timeperiod=30)
print OBV1[security_list1]

# 输出 security_list2 的 OBV 值
OBV2 = OBV(security_list2,check_date='2017-01-04', timeperiod=30)
for stock in security_list2:
    print OBV2[stock]
```

<a id="VOL-成交量"></a>

### VOL-成交量

```python
VOL(security_list, check_date, M1=5, M2=10, unit = '1d', include_now = True, fq_ref_date = None)
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

-   VOL 和 MAVOL 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 500351.22999999998, '603177.XSHG': nan, '000002.XSHE': 2333030.52, '601211.XSHG': 153571.64999999999}, {'000001.XSHE': 430683.87, '603177.XSHG': nan, '000002.XSHE': 1890989.6699999999, '601211.XSHG': 172379.274}, {'000001.XSHE': 474050.94499999995, '603177.XSHG': nan, '000002.XSHE': 2246594.1269999999, '601211.XSHG': 205083.77899999998})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

1.  成交量大，代表交投热络，可界定为热门股；
2.  底部起涨点出现大成交量(成交手数)，代表攻击量；
3.  头部地区出现大成交量(成交手数)，代表出货量；
4.  观察成交金额的变化，比观察成交手数更具意义，因为成交手数并未反应股价的涨跌的后所应支出的实际金额。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 VOL 值
VOL1,MAVOL11,MAVOL12 = VOL(security_list1, check_date='2017-01-04', M1=5, M2=10)
print VOL1[security_list1]
print MAVOL11[security_list1]
print MAVOL12[security_list1]

# 输出 security_list2 的 VOL 值
VOL2,MAVOL21,MAVOL22 = VOL(security_list2, check_date='2017-01-04', M1=5, M2=10)
for stock in security_list2:
    print VOL2[stock]
    print MAVOL21[stock]
    print MAVOL22[security_list1]
```

<a id="VRSI-相对强弱量"></a>

### VRSI-相对强弱量

```python
VRSI(security_list, check_date, N1=6, N2=12, N3=24, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N1：统计的天数 N1
-   N2：统计的天数 N2
-   N3：统计的天数 N3
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   RSI1，VRSI2和VRSI3 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 50.467938637493823, '603177.XSHG': nan, '000002.XSHE': 50.382520845028509, '601211.XSHG': nan}, {'000001.XSHE': 49.322460708038193, '603177.XSHG': nan, '000002.XSHE': 51.166143930198224, '601211.XSHG': nan}, {'000001.XSHE': 49.251191741159232, '603177.XSHG': nan, '000002.XSHE': 51.867549823141722, '601211.XSHG': nan})

**备注：**

-   计算方式与通达信和同花顺相同，东方财富没有该指标

**用法注释：**

1.  VRSI>20 为超买；VRSI<20 为超卖；
2.  VRSI 以50为中界线，大于50视为多头行情，小于50视为空头行情；
3.  VRSI 在80以上形成Ｍ头或头肩顶形态时，视为向下反转信号；
4.  VRSI 在20以下形成Ｗ底或头肩底形态时，视为向上反转信号；
5.  VRSI 向上突破其高点连线时，买进；VRSI 向下跌破其低点连线时，卖出。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 VRSI 值
VRSI1,VRSI2,VRSI3  = VRSI(security_list1, check_date='2017-01-04', N1=6, N2=12, N3=24)
print VRSI1[security_list1]
print VRSI2[security_list1]
print VRSI3[security_list1]

# 输出 security_list2 的 VRSI 值
VRSI1,VRSI2,VRSI3 = VRSI(security_list2, check_date='2017-01-04', N1=6, N2=12, N3=24)
for stock in security_list2:
    print VRSI1[stock]
    print VRSI2[stock]
    print VRSI3[stock]
```

<a id="LB-量比"></a>

### LB-量比

```python
LB(security_list, check_date, N=5, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期时间
-   N：统计的天数 N
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   量比的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.98, '603177.XSHG': nan, '000002.XSHE': 1.25846})

**用法注释：**

1.  量比是指股市开市后平均每分钟的成交量与过去N个交易日平均每分钟成交量之比
2.  当天开盘截至到当前时刻（check\_date），平均每分钟的成交手数，除以过去N天平均每分钟的成交手数，这里的unit就是分钟级别的，所以不用unit属性；

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 LB 值
lb = LB(security_list1, check_date='2017-01-04 10:00:00', N=5)
print(lb[security_list1])

# 输出 security_list2 的 LB 值
lb = LB(security_list2, check_date='2017-01-04', N=10)
for stock in security_list2:
    print(lb[stock])
```
