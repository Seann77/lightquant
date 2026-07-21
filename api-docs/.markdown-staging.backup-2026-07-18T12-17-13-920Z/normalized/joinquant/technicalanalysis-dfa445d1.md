---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 趋势型
section_path:
  - 技术分析指标
  - 趋势型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#趋势型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="趋势型"></a>

## 趋势型

<a id="CHO-佳庆指标"></a>

### CHO-佳庆指标

```python
CHO(security_list, check_date, N1 = 10, N2 = 20, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N1：统计的天数 N1
-   N2: 统计的天数 N2
-   M: 统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   CHO 和 MACHO 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': -2349.7877426190771, '603177.XSHG': nan, '000002.XSHE': 267047.22475180856, '601211.XSHG': -1726.9088373843188}, {'000001.XSHE': -2304.8620185057907, '603177.XSHG': nan, '000002.XSHE': 292638.40931959258, '601211.XSHG': -3050.487984994948})

**备注：**

-   计算方式与通达信、同花顺（交易量不是以手为单位）和东方财富相同

**用法注释：**

1.CHO 曲线产生急促的「凸起」时，代表行情即将向上或向下反转； 2.股价>90 天平均线，CHO由负转正时，买进； 3.股价<90 天平均线，CHO由正转负时，卖出； 4.本指标也可设参考线，自定超买超卖的界限值； 5.本指标须配合OBOS、ENVELOPE同时使用。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 CHO 值
CHO1,MACHO1 = CHO(security_list1,check_date='2017-01-04', N1 = 10, N2 = 20, M = 6)
print CHO1[security_list1]
print MACHO1[security_list1]

# 输出 security_list2 的 CHO 值
CHO2,MACHO2 = CHO(security_list2,check_date='2017-01-04', N1 = 10, N2 = 20, M = 6)
for stock in security_list2:
    print CHO2[stock]
    print MACHO2[stock]
```

<a id="CYE-市场趋势"></a>

### CYE-市场趋势

```python
CYE(security_list, check_date, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   CYEL和CYES的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.22946305644790699, '603177.XSHG': nan, '000002.XSHE': 4.3811058515459811, '601211.XSHG': -0.38592508513052126}, {'000001.XSHE': 0.0057132410073656359, '603177.XSHG': nan, '000002.XSHE': 2.139178579978255, '601211.XSHG': -0.26377299139325172})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

1.  CYE指标又叫趋势指标,是计算机模拟人的感觉用数值分析的方法对即日的K线进行一次拟合和趋势的判断;
2.  CYE以 0轴为界，其上为上升趋势,否则为下降趋势.

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 CYE 值
CYEL1,CYES1 = CYE(security_list1,check_date='2017-01-04')
print CYEL1[security_list1]
print CYES1[security_list1]

# 输出 security_list2 的 CYE 值
CYEL2,CYES2 = CYE(security_list2,check_date='2017-01-04')
for stock in security_list2:
    print CYEL2[stock]
    print CYES2[stock]
```

<a id="DMI-趋向指标"></a>

#### DMI - 趋向指标

```python
DMI(security_list, check_date, N=14,  MM = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   MM : 统计的天数 MM
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   PDI, MDI, ADX, ADXR的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 25.688830529080601, '603177.XSHG': nan, '000002.XSHE': 53.19815968968976, '601211.XSHG': 18.761296151049379}, {'000001.XSHE': 12.721819718749906, '603177.XSHG': nan, '000002.XSHE': 4.3611435006995558, '601211.XSHG': 25.554094733429896}, {'000001.XSHE': 25.604986954849515, '603177.XSHG': nan, '000002.XSHE': 74.405711362635628, '601211.XSHG': 27.156295106705297}, {'000001.XSHE': 24.423375009809824, '603177.XSHG': nan, '000002.XSHE': 68.677055698186052, '601211.XSHG': 30.275031367421029})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

用法：市场行情趋向明显时，指标效果理想。 PDI(上升方向线) MDI(下降方向线) ADX(趋向平均值) 1.PDI线从下向上突破MDI线，显示有新多头进场，为买进信号； 2.PDI线从上向下跌破MDI线，显示有新空头进场，为卖出信号； 3.ADX值持续高于前一日时，市场行情将维持原趋势； 4.ADX值递减，降到20以下，且横向行进时，市场气氛为盘整； 5.ADX值从上升倾向转为下降时，表明行情即将反转。 参数：N　统计天数； M 间隔天数，一般为14、6

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 DMI 值
dmi_pdi, dmi_mdi, dmi_adx, dmi_adxr = DMI(security_list1,check_date='2017-01-04', N= 14, MM = 6)
print dmi_pdi[security_list1]
print dmi_mdi[security_list1]
print dmi_adx[security_list1]
print dmi_adxr[security_list1]

# 输出 security_list2 的 DMI 值
dmi_pdi, dmi_mdi, dmi_adx, dmi_adxr = DMI(security_list2,check_date='2017-01-04', N= 14, MM = 6)
for stock in security_list2:
    print dmi_pdi[stock]
    print dmi_mdi[stock]
    print dmi_adx[stock]
    print dmi_adxr[stock]
```

<a id="DBQR-对比强弱"></a>

### DBQR-对比强弱

```python
DBQR(index_stock, security_list, check_date, N = 5, M1 = 10, M2 = 20, M3 = 60, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock:大盘股票代码
-   security\_list：股票列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M1：统计的天数 M1
-   M2：统计的天数 M2
-   M3：统计的天数 M3
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   ZS, GG, MADBQR1, MADBQR2和MADBQR3的值。

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：({'000001.XSHE': 0.008962931388970025, '000002.XSHE': 0.008962931388970025, '601211.XSHG': 0.008962931388970025}, {'000001.XSHE': 0.011494252873563383, '603177.XSHG': nan, '000002.XSHE': 0.22774869109947632, '601211.XSHG': -0.01895206243032329}, {'000001.XSHE': -0.0075263047885744793, '603177.XSHG': nan, '000002.XSHE': 0.11067285706112595, '601211.XSHG': -0.031800418795617236}, {'000001.XSHE': 0.00045608985991743469, '603177.XSHG': nan, '000002.XSHE': 0.11198281967226727, '601211.XSHG': -0.012823522774402763}, {'000001.XSHE': 0.00683851952397502, '603177.XSHG': nan, '000002.XSHE': 0.044647671789494942, '601211.XSHG': 0.0081085126473629619})

**备注：**

-   计算方式与通达信相同（其中ZS值与用户选择的大盘股票代码直接相关），同花顺和东方财富没有该指标

**用法注释：**

-   对比强弱指标包含有两条指标线,一条是对应指数的强弱线。另外一条是个股的强弱线。当个股强弱线与指数强弱线发生金叉时，表明个股开始强过大盘，是买入时机。
-   当个股强弱线与指数强弱线发生死叉时，表明个股开始弱于大盘，是卖出时机。对比强弱指标是一个短线指标。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 DBQR 值
dbqr_zs, dbqr_gg, dbqr_madbqr1, dbqr_madbqr2, dbqr_madbqr3 = DBQR('000001.XSHG',security_list1,check_date='2017-01-04', N = 5, M1 = 10, M2 = 20, M3 = 60)
print dbqr_zs['000001.XSHG']
print dbqr_gg[security_list1]
print dbqr_madbqr1[security_list1]
print dbqr_madbqr2[security_list1]
print dbqr_madbqr3[security_list1]

# 输出 security_list2 的 DBQR 值
dbqr_zs, dbqr_gg, dbqr_madbqr1, dbqr_madbqr2, dbqr_madbqr3 = DBQR('000001.XSHG',security_list2,check_date='2017-01-04', N = 5, M1 = 10, M2 = 20, M3 = 60)
for stock in security_list2:
    print dbqr_zs['000001.XSHG']
    print dbqr_gg[stock]
    print dbqr_madbqr1[stock]
    print dbqr_madbqr2[stock]
    print dbqr_madbqr3[stock]
```

<a id="DMA-平均差"></a>

### DMA-平均差

```python
DMA(security_list, check_date, N1 = 10, N2 = 50, M = 10, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N1：统计的天数 N1
-   N2: 统计的天数 N2
-   M: 统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   DIF 和 DIFMA 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.10940000000000794, '603177.XSHG': nan, '000002.XSHE': 4.5221999999999927, '601211.XSHG': 0.021799999999998931}, {'000001.XSHE': 0.20262000000000988, '603177.XSHG': nan, '000002.XSHE': 3.4217399999999927, '601211.XSHG': 0.53958000000000261})

**备注：**

-   计算方式与通达信、同花顺（名为“新DMA”）和东方财富相同

**用法注释：**

1.DMA 向上交叉其平均线时，买进； 2.DMA 向下交叉其平均线时，卖出； 3.DMA 的交叉信号比MACD、TRIX 略快； 4.DMA 与股价产生背离时的交叉信号，可信度较高； 5.DMA、MACD、TRIX 三者构成一组指标群，互相验证。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 DMA 值
DIF1,DIFMA1 = DMA(security_list1,check_date='2017-01-04', N1 = 10, N2 = 50, M = 10)
print DIF1[security_list1]
print DIFMA1[security_list1]

# 输出 security_list2 的 DMA 值
DIF2,DIFMA2 = DMA(security_list2,check_date='2017-01-04', N1 = 10, N2 = 50, M = 10)
for stock in security_list2:
    print DIF2[stock]
    print DIFMA2[stock]
```

<a id="DPO-区间震荡线"></a>

### DPO-区间震荡线

```python
DPO(security_list, check_date, N=20,  M = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M : 统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   DPO 和 MADPO 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 0.035000000000000142, '603177.XSHG': nan, '000002.XSHE': 9.1530000000000129, '601211.XSHG': -0.99149999999998784}, {'000001.XSHE': 0.0036666666666658188, '603177.XSHG': nan, '000002.XSHE': 6.5928333333333455, '601211.XSHG': -0.79808333333332138})

**备注：**

-   计算方式与通达信，东方财富相同，与同花顺不同

**用法注释：**

1.DPO>0 DPO<0 ，表示目前处于空头市场； 2.在0 轴上方设定一条超买线，当股价波动至超买线时，会形成短期高点； 3.在0 轴下方设定一条超卖线，当股价波动至超卖线时，会形成短期低点； 4.超买超卖的范围随个股不同而不同，使用者应自行调整； 5.本指标可设参考线。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 DPO 值
DPO1,MADPO1 = DPO(security_list1,check_date='2017-01-04', N= 20, M = 6)
print DPO1[security_list1]
print MADPO1[security_list1]

# 输出 security_list2 的 DPO 值
DPO2,MADPO2 = DPO(security_list2,check_date='2017-01-04', N= 20, M = 6)
for stock in security_list2:
    print DPO2[stock]
    print MADPO2[stock]
```

<a id="EMV-简易波动指标"></a>

### EMV-简易波动指标

```python
EMV(security_list, check_date, N = 14, M = 9, unit = '1d', include_now = True, fq_ref_date = None)
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

-   EMV和MAEMV的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': -0.19292255670566558, '603177.XSHG': nan, '000002.XSHE': 3.851095221636061, '601211.XSHG': -0.75492717743004634}, {'000001.XSHE': -0.20164346999313121, '603177.XSHG': nan, '000002.XSHE': 2.0612852628683846, '601211.XSHG': -0.72654134699455397})

**备注：**

-   计算方式与通达信、同花顺和东方财富相同

**用法注释：**

1.EMV 由下往上穿越0 轴时，视为中期买进信号； 2.EMV 由上往下穿越0 轴时，视为中期卖出信号； 3.EMV 的平均线穿越0 轴，产生假信号的机会较少； 4.当ADX 低于±DI时，本指标失去效用； 5.须长期使用EMV 指标才能获得最佳利润。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 EMV 值
EMV1,MAEMV1 = EMV(security_list1,check_date='2017-01-04', N = 14, M = 9)
print EMV1[security_list1]
print MAEMV1[security_list1]

# 输出 security_list2 的 EMV 值
EMV2,MAEMV2 = EMV(security_list2,check_date='2017-01-04', N = 14, M = 9)
for stock in security_list2:
    print EMV2[stock]
    print MAEMV2[stock]
```

<a id="GDX-鬼道线"></a>

### GDX-鬼道线

```python
GDX(security_list, check_date, N = 30, M = 9, unit = '1d', include_now = True, fq_ref_date = None)
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

-   济安线、压力线和支撑线的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8.579464236747615, '603177.XSHG': nan, '000002.XSHE': 21.274312299926329, '601211.XSHG': 18.052914184896178}, {'000001.XSHE': 9.3516160180549015, '603177.XSHG': nan, '000002.XSHE': 23.1890004069197, '601211.XSHG': 19.677676461536834}, {'000001.XSHE': 7.8073124554403304, '603177.XSHG': nan, '000002.XSHE': 19.359624192932959, '601211.XSHG': 16.428151908255522})

**备注：**

-   计算方式与通达信相同，东方财富和同花顺没有该指标

**用法注释：**

通道理论公式，是一种用技术手段和经验判断来决定买卖股票的方法。该公式对趋势线做了平滑和修正处理，更精确的反应了股价运行规律。当股价上升到压力线时，投资者就卖出股票，而当股价下跌到支撑线时，投资者就进行相应的补进。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 GDX 值
gdx_jax, gdx_ylx, gdx_zcx = GDX(security_list1,check_date='2017-01-04', N = 30, M = 9)
print gdx_jax[security_list1]
print gdx_ylx[security_list1]
print gdx_zcx[security_list1]

# 输出 security_list2 的 GDX 值
gdx_jax, gdx_ylx, gdx_zcx = GDX(security_list2,check_date='2017-01-04', N = 30, M = 9)
for stock in security_list2:
    print gdx_jax[stock]
    print gdx_ylx[stock]
    print gdx_zcx[stock]
```

<a id="JLHB-绝路航标"></a>

### JLHB-绝路航标

```python
JLHB(security_list, check_date, N = 7, M = 5, unit = '1d', include_now = True, fq_ref_date = None)
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

-   B, VAR2和绝路航标的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': 62.675406125612177, '603177.XSHG': nan, '000002.XSHE': 50.248304902948838, '601211.XSHG': 48.413005376201845}, {'000001.XSHE': 66.875000000000057, '603177.XSHG': nan, '000002.XSHE': 80.0, '601211.XSHG': 43.800904977375581}, {'000001.XSHE': 0, '603177.XSHG': nan, '000002.XSHE': 0, '601211.XSHG': 0})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标

**用法注释：**

反趋势类选股指标。综合了动量观念、强弱指标与移动平均线的优点，在计算过程中主要研究高低价位与收市价的关系，反映价格走势的强弱和超买超卖现象。在市场短期超买超卖的预测方面又较敏感。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 JLHB 值
jlhb_b, jlhb_var2, jlhb_jlhb = JLHB(security_list1,check_date='2017-01-04', N = 7, M = 5)
print jlhb_b[security_list1]
print jlhb_var2[security_list1]
print jlhb_jlhb[security_list1]

# 输出 security_list2 的 JLHB 值
jlhb_b, jlhb_var2, jlhb_jlhb = JLHB(security_list2,check_date='2017-01-04', N = 7, M = 5)
for stock in security_list2:
    print jlhb_b[stock]
    print jlhb_var2[stock]
    print jlhb_jlhb[stock]
```

<a id="JS-加速线"></a>

### JS-加速线

```python
JS(security_list, check_date, N = 5, M1 = 5, M2 = 10, M3 = 20, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   M1：统计的天数 M1
-   M2：统计的天数 M2
-   M3：统计的天数 M3
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   JS, MAJS1, MAJS2和MAJS3 的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.22988505747126764, '603177.XSHG': nan, '000002.XSHE': 4.5549738219895266, '601211.XSHG': -0.37904124860646582}, {'000001.XSHE': 0.19895890422201745, '603177.XSHG': nan, '000002.XSHE': 2.7934335630385538, '601211.XSHG': -0.42736705593419566}, {'000001.XSHE': -0.1505260957714892, '603177.XSHG': nan, '000002.XSHE': 2.2134571412225181, '601211.XSHG': -0.63600837591234527}, {'000001.XSHE': 0.0091217971983490014, '603177.XSHG': nan, '000002.XSHE': 2.2396563934453453, '601211.XSHG': -0.25647045548805508})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标

**用法注释：**

加速线指标是衡量股价涨速的工具,加速线指标上升表明股价上升动力增加,加速线指标下降表明股价下降压力增加。 加速线适用于DMI表明趋势明显时(DMI.ADX大于20)使用： 1.如果加速线在0值附近形成平台，则表明既不是最好的买入时机也不是最好的卖入时机； 2.在加速线发生金叉后,均线形成底部是买入时机； 3.在加速线发生死叉后,均线形成顶部是卖出时机；

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 JS 值
js_jsx, js_majsx1, js_majsx2, js_majsx3 = JS(security_list1,check_date='2017-01-04', N = 5, M1 = 5, M2 = 10, M3 = 20)
print js_jsx[security_list1]
print js_majsx1[security_list1]
print js_majsx2[security_list1]
print js_majsx3[security_list1]

# 输出 security_list2 的 JS 值
js_jsx, js_majsx1, js_majsx2, js_majsx3 = JS(security_list2,check_date='2017-01-04', N = 5, M1 = 5, M2 = 10, M3 = 20)
for stock in security_list2:
    print js_jsx[stock]
    print js_majsx1[stock]
    print js_majsx2[stock]
    print js_majsx3[stock]
```

<a id="MACD-平滑异同平均"></a>

### MACD-平滑异同平均

```python
MACD(security_list, check_date, SHORT = 12, LONG = 26, MID = 9, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   SHORT：统计的天数 SHORT
-   LONG：统计的天数 LONG
-   MID：统计的天数 MID
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   DIF, DEA和MACD的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.024474457964069884, '603177.XSHG': nan, '000002.XSHE': 1.9534717416190936, '601211.XSHG': -0.13735007291032986}, {'000001.XSHE': 0.031674925444633864, '603177.XSHG': nan, '000002.XSHE': 1.4784672678080988, '601211.XSHG': -0.020490844872792721}, {'000001.XSHE': -0.014400934961127959, '603177.XSHG': nan, '000002.XSHE': 0.95000894762198973, '601211.XSHG': -0.23371845607507427})

**备注：**

-   计算方式与通达信、东方财富和同花顺相同

**用法注释：**

DIFF线　收盘价短期、长期指数平滑移动平均线间的差 DEA线　 DIFF线的M日指数平滑移动平均线 MACD线　DIFF线与DEA线的差，彩色柱状线 参数：SHORT(短期)、LONG(长期)、M 天数，一般为12、26、9

用法： 1.DIFF、DEA均为正，DIFF向上突破DEA，买入信号。 2.DIFF、DEA均为负，DIFF向下跌破DEA，卖出信号。 3.DEA线与K线发生背离，行情反转信号。 4.分析MACD柱状线，由红变绿(正变负)，卖出信号；由绿变红，买入信号

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 MACD 值
macd_dif, macd_dea, macd_macd = MACD(security_list1,check_date='2017-01-04', SHORT = 12, LONG = 26, MID = 9)
print macd_dif[security_list1]
print macd_dea[security_list1]
print macd_macd[security_list1]

# 输出 security_list2 的 MACD 值
macd_dif, macd_dea, macd_macd = MACD(security_list2,check_date='2017-01-04', SHORT = 12, LONG = 26, MID = 9)
for stock in security_list2:
    print macd_dif[stock]
    print macd_dea[stock]
    print macd_macd[stock]
```

<a id="QACD-快速异同平均"></a>

### QACD-快速异同平均

```python
QACD(security_list, check_date, N1 = 12, N2 = 26, M = 9, unit = '1d', include_now = True, fq_ref_date = None)
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

-   DIF, MACD和DDIF的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.024474457258216731, '603177.XSHG': nan, '000002.XSHE': 1.9534717597632003, '601211.XSHG': -0.13735007291033341}, {'000001.XSHE': 0.031674924406612889, '603177.XSHG': nan, '000002.XSHE': 1.4784672944906101, '601211.XSHG': -0.020490844872803629}, {'000001.XSHE': -0.0072004671483961585, '603177.XSHG': nan, '000002.XSHE': 0.47500446527259022, '601211.XSHG': -0.11685922803752978})

**备注：**

-   计算方式与通达信和同花顺（同花顺的N2取值为6）相同，东方财富没有该公式

**用法注释：**

1.DIF 向上交叉MACD，买进；DIF 向下交叉MACD，卖出； 2.DIF 连续两次向下交叉MACD，将造成较大的跌幅； 3.DIF 连续两次向上交叉MACD，将造成较大的涨幅； 4.DIF 与股价形成背离时所产生的信号，可信度较高； 5.DMA、MACD、TRIX 三者构成一组指标群，互相验证。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 QACD 值
qacd_dif, qacd_macd, qacd_ddif = QACD(security_list1,check_date='2017-01-04',  N1 = 12, N2 = 26, M = 9)
print qacd_dif[security_list1]
print qacd_macd[security_list1]
print qacd_ddif[security_list1]

# 输出 security_list2 的 QACD 值
qacd_dif, qacd_macd, qacd_ddif = QACD(security_list2,check_date='2017-01-04',  N1 = 12, N2 = 26, M = 9)
for stock in security_list2:
    print qacd_dif[stock]
    print qacd_macd[stock]
    print qacd_ddif[stock]
```

<a id="QR-强弱指标"></a>

### QR-强弱指标

```python
QR(index_stock, security_list, check_date, N = 21, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock:大盘股票代码
-   security\_list：股票列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   个股，大盘和强弱指标的值。

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：({'000001.XSHE': 0.57142857142857961, '603177.XSHG': nan, '000002.XSHE': 68.462643678160916, '601211.XSHG': -5.4779806659505876}, {'000001.XSHE': -0.60666287471217795, '000002.XSHE': -0.60666287471217795, '601211.XSHG': -0.60666287471217795}, {'000001.XSHE': 1.0486350432810712, '603177.XSHG': nan, '000002.XSHE': 62.726365293281042, '601211.XSHG': -4.7928242094193871})

**备注：**

-   计算方式与通达信相同（其中ZS值与用户选择的大盘股票代码直接相关），同花顺和东方财富没有该指标

**用法注释：**

指标攀升表明个股走势渐强于大盘，后市看好；指标滑落表明个股走势弱于大盘，可择机换股。同时要结合大盘走势研判，应选择大盘转暖或走牛时出击。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 QR 值
qr_gg, qr_dp, qr_qrz = QR('000001.XSHG',security_list1,check_date='2017-01-04', N = 21)
print qr_gg[security_list1]
print qr_dp['000001.XSHG']
print qr_qrz[security_list1]

# 输出 security_list2 的 QR 值
qr_gg, qr_dp, qr_qrz = QR('000001.XSHG',security_list2,check_date='2017-01-04', N = 21)
for stock in security_list2:
    print qr_gg[stock]
    print qr_dp['000001.XSHG']
    print qr_qrz[stock]
```

<a id="TRIX-终极指标"></a>

### TRIX-终极指标

```python
TRIX(security_list, check_date, N = 12, M = 9, unit = '1d', include_now = True, fq_ref_date = None)
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

-   TRIX和MATRIX的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.025791210363593713, '603177.XSHG': nan, '000002.XSHE': 1.7583370989762825, '601211.XSHG': -0.10625713971250776}, {'000001.XSHE': 0.069768190877912417, '603177.XSHG': nan, '000002.XSHE': 1.4324777288907538, '601211.XSHG': 0.047380407660970618})

**备注：**

-   计算方式与通达信和东方财富相同，与同花顺不同（差异在于同花顺的M取值为20,其中TRIX值大小相同，而MATRIX值与程序返回结果存在差异）

**用法注释：**

1.TRIX由下往上交叉其平均线时，为长期买进信号； 2.TRIX由上往下交叉其平均线时，为长期卖出信号； 3.DMA、MACD、TRIX 三者构成一组指标群，互相验证。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的TRIX值
TRIX1,MATRIX1 = TRIX(security_list1,check_date='2017-01-04', N = 12, M = 9)
print TRIX1[security_list1]
print MATRIX1[security_list1]

# 输出 security_list2 的 TRIX 值
TRIX2,MATRIX2 = TRIX(security_list2,check_date='2017-01-04', N = 12, M = 9)
for stock in security_list2:
    print TRIX2[stock]
    print MATRIX2[stock]
```

<a id="UOS-终极指标"></a>

### UOS-终极指标

```python
UOS(security_list, check_date, N1 = 7, N2 = 14, N3 = 28, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N1：统计的天数 N1
-   N2：统计的天数 N2
-   N3：统计的天数 N3
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   终极指标和MAUOS的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 57.771547164847973, '603177.XSHG': nan, '000002.XSHE': 70.504859217869893, '601211.XSHG': 46.33057503226491}, {'000001.XSHE': 53.661130731923997, '603177.XSHG': nan, '000002.XSHE': 65.893320720410188, '601211.XSHG': 46.940452580831135})

**备注：**

-   计算方式与通达信，东方财富和同花顺相同

**用法注释：**

1.UOS 上升至50～70的间，而后向下跌破其Ｎ字曲线低点时，为短线卖点； 2.UOS 上升超过70以上，而后向下跌破70时，为中线卖点； 3.UOS 下跌至45以下，而后向上突破其Ｎ字曲线高点时，为短线买点； 4.UOS 下跌至35以下，产生一底比一底高的背离现象时，为底部特征； 5.以上各项数据会因个股不同而略有不同，请利用参考线自行修正。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的UOS值
uos_ultiInc, uos_mauos = UOS(security_list1,check_date='2017-01-04', N1 = 7, N2 = 14, N3 = 28, M = 6)
print uos_ultiInc[security_list1]
print uos_mauos[security_list1]

# 输出 security_list2 的 UOS 值
uos_ultiInc, uos_mauos = UOS(security_list2,check_date='2017-01-04', N1 = 7, N2 = 14, N3 = 28, M = 6)
for stock in security_list2:
    print uos_ultiInc[stock]
    print uos_mauos[stock]
```

<a id="VMACD-量平滑移动平均"></a>

### VMACD-量平滑移动平均

```python
VMACD(security_list, check_date, SHORT = 12, LONG = 26, MID = 9, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   SHORT：统计的天数 SHORT
-   LONG：统计的天数 LONG
-   MID：统计的天数 MID
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   DIF, DEA和MACD 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如： ({'000001.XSHE': -29420.22472378047, '603177.XSHG': nan, '000002.XSHE': 246548.71517315158, '601211.XSHG': -54288.764521957521}, {'000001.XSHE': -34871.616925081325, '603177.XSHG': nan, '000002.XSHE': 403729.04101507459, '601211.XSHG': -60719.532041579558}, {'000001.XSHE': 5451.392201300856, '603177.XSHG': nan, '000002.XSHE': -157180.32584192301, '601211.XSHG': 6430.7675196220371})

**备注：**

-   计算方式与通达信，东方财富相同，与同花顺计算方式基本相同，差别在于同花顺的VOL是以交易量为单位，不是以手为单位

**用法注释：**

基于成交量的MACD算法。 用法： 1.DIFF、DEA均为正，DIFF向上突破DEA，买入信号。 2.DIFF、DEA均为负，DIFF向下跌破DEA，卖出信号。 3.DEA线与K线发生背离，行情反转信号。 4.分析MACD柱状线，由红变绿(正变负)，卖出信号；由绿变红，买入信号

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的VMACD值
vmacd_dif, vmacd_dea, vmacd_macd = VMACD(security_list1,check_date='2017-01-04', SHORT = 12, LONG = 26, MID = 9)
print vmacd_dif[security_list1]
print vmacd_dea[security_list1]
print vmacd_macd[security_list1]

# 输出 security_list2 的 VMACD 值
vmacd_dif, vmacd_dea, vmacd_macd = VMACD(security_list2,check_date='2017-01-04', SHORT = 12, LONG = 26, MID = 9)
for stock in security_list2:
    print vmacd_dif[stock]
    print vmacd_dea[stock]
    print vmacd_macd[stock]
```

<a id="VPT-量价曲线"></a>

### VPT-量价曲线

```python
VPT(security_list, check_date, N = 51, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list: 标的列表
-   check\_date: 要查询数据的日期
-   N: 统计的天数 N
-   M: 统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   VPT 和 MAVPT 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 110162.20673868078, '603177.XSHG': nan, '000002.XSHE': 2333294.6410979889, '601211.XSHG': 213564.11670755409}, {'000001.XSHE': 109563.07430249352, '603177.XSHG': nan, '000002.XSHE': 1968746.2352547429, '601211.XSHG': 216122.67977483606})

**备注：**

-   计算方式与通达信相同，与东方财富相同（差别在于东方财富选取的N，M分别为24和5），与同花顺相同（差别在于同花顺的VOL是以交易量为单位，不是以手为单位）

**用法注释：**

1.VPT 由下往上穿越0 轴时，为买进信号； 2.VPT 由上往下穿越0 轴时，为卖出信号； 3.股价一顶比一顶高，VPT 一顶比一顶低时，暗示股价将反转下跌； 4.股价一底比一底低，VPT 一底比一底高时，暗示股价将反转上涨； 5.VPT 可搭配EMV 和WVAD指标使用效果更佳。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
VPT1,MAVPT1 = VPT(security_list1,context.previous_date, N= 51, M = 6)
print VPT1[security_list1]

# 输出 security_list2 的 VPT 值
VPT2,MAVPT2 = VPT(security_list2,context.previous_date, N= 51, M = 6)
for stock in security_list2:
    print VPT2[stock]
```

<a id="WVAD-威廉变异离散量"></a>

### WVAD-威廉变异离散量

```python
WVAD(security_list, check_date, N = 24, M = 6, unit = '1d', include_now = True, fq_ref_date = None)
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

-   WVAD 和 MAWVAD的值。

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 92.062648361186916, '603177.XSHG': nan, '000002.XSHE': 2329.1965559178616, '601211.XSHG': 3.1691529344278888}, {'000001.XSHE': 33.985407654779912, '603177.XSHG': nan, '000002.XSHE': 1964.3494800488843, '601211.XSHG': -25.500673953544354})

**备注：**

-   计算方式与通达信和东方财富相同，与同花顺不同

**用法注释：**

1.WVAD由下往上穿越0 轴时，视为长期买进信号； 2.WVAD由上往下穿越0 轴时，视为长期卖出信号； 3.当ADX 低于±DI时，本指标失去效用； 4.长期使用WVAD指标才能获得最佳利润； 5.本指标可与EMV 指标搭配使用。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 WVAD 值
wvad_wvad, wvad_mawvad = WVAD(security_list1,check_date='2017-01-04', N = 24, M = 6)
print wvad_wvad[security_list1]
print wvad_mawvad[security_list1]

# 输出 security_list2 的 WVAD 值
wvad_wvad, wvad_mawvad = WVAD(security_list2,check_date='2017-01-04', N = 24, M = 6)
for stock in security_list2:
    print wvad_wvad[stock]
    print wvad_mawvad[stock]
```
