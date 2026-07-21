---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 龙系
section_path:
  - 技术分析指标
  - 龙系
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#龙系"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="龙系"></a>

## 龙系

<a id="ZLMM-主力买卖"></a>

### ZLMM-主力买卖

```python
ZLMM(security_list, check_date, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   MMS, MMM和MML 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 81.84073256710262, '603177.XSHG': 100.0, '000002.XSHE': 55.243339562598599, '601211.XSHG': 66.72863363565412}, {'000001.XSHE': 77.146636073746109, '603177.XSHG': 100.0, '000002.XSHE': 49.409986856429853, '601211.XSHG': 63.28540263029231}, {'000001.XSHE': 56.074044372334619, '603177.XSHG': 100.00000000000001, '000002.XSHE': 37.402631031296416, '601211.XSHG': 53.621023102642006})

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

白线为短期趋势线，黄线为中期趋势线，紫线为长期趋势线。

1.  主力买卖与主力进出配合使用时准确率极高。
2.  当底部构成发出信号，且主力进出线向上时判断买点，准确率极高。
3.  当短线上穿中线及长线时，形成最佳短线买点交叉形态（如底部构成已发出信号或主力进出线也向上且短线乖离率不大时）。
4.  当短线、中线均上穿长线，形成中线最佳买点形态（如底部构成已发出信号或主力进出线也向上且三线均向上时）。
5.  当短线下穿中线，且短线与长线正乖离率太大时，形成短线最佳卖点交叉形态。
6.  当短线、中线下穿长线，且是主力进出已走平或下降时，形成中线最佳卖点交叉形态。
7.  在上升途中，短、中线回落受长线支撑再度上行之时，为较佳的买入时机。
8.  指标在0以上表明个股处于强势，指标跌穿0线表明该股步入弱势。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 ZLMM 值
MMS1,MMM1,MML1 = ZLMM(security_list1, check_date='2017-01-04')
print MMS1[security_list1]
print MMM1[security_list1]
print MML1[security_list1]

# 输出 security_list2 的 ZLMM 值
MMS2,MMM2,MML2 = ZLMM(security_list2, check_date='2017-01-04')
for stock in security_list2:
    print MMS2[stock]
    print MMM2[stock]
    print MML2[stock]
```

<a id="RAD-威力雷达"></a>

### RAD-威力雷达

```python
RAD(index_stock, security_list, check_date, D=3, S=30, M=30, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock:大盘股票代码
-   security\_list:股票列表
-   check\_date：要查询数据的日期
-   D：统计的天数 D
-   S：统计的天数 S
-   M：统计的天数 M
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   RADER1和RADERMA 的值

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：({'000001.XSHE': 41.007798368877012, '603177.XSHG': nan, '000002.XSHE': -124.32686046196363, '601211.XSHG': 31.098497424710864}, {'000001.XSHE': 61.801642266353412, '603177.XSHG': nan, '000002.XSHE': -145.61770337759745, '601211.XSHG': 89.416830374282384})

**备注：**

-   RADERMA与通达信存在不大于1的差异，与另外两者结果不一致；三家炒股软件的RADERMA值也各不相同，应该是在计算RADERMA时设置的RADER1数据的长度不同造成的
-   计算方式与通达信和东方财富相同，与同花顺不相同

**用法注释：**

1.  RAD 曲线往上跷升越陡者，代表该股为强势股。
2.  RAD 指标选择强势股的效果相当良好，请多多利用。

**示例：**

```python
# 定义股票池列表
index_stock = '399001.XSHE'
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 RAD 值
RAD1,MARAD1 = RAD(index_stock, security_list1, check_date='2017-01-04', D=3, S=30, M=30)
print RAD1[security_list1]
print MARAD1[security_list1]

# 输出 security_list2 的 RAD 值
RAD2,MARAD2 = RAD(index_stock, security_list2, check_date='2017-01-04', D=3, S=30, M=30)
for stock in security_list2:
    print RAD2[stock]
    print MARAD2[stock]
```

<a id="SHT-龙系短线"></a>

### SHT-龙系短线

```python
SHT(security_list, check_date, N=5, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   SHT和SHTMA 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 1.9308833356099495, '603177.XSHG': nan, '000002.XSHE': -0.47615239234731388, '601211.XSHG': 2.0635067459722265}, {'000001.XSHE': 1.2099901505545463, '603177.XSHG': nan, '000002.XSHE': -0.46395687264301505, '601211.XSHG': 1.9891297585929468})

**备注：**

-   计算方式与通达信和东方财富（指标名称为SHO）相同，同花顺没有该指标
-   计算公式中MY和SHT值相同，只输出了SHT

**用法注释：**

1.  当指标曲线向上交叉其平均线时，视为短线买进信号。
2.  当指标曲线向下交叉其平均线时，视为短线卖出信号。
3.  本指标可搭配KDJ、DMA指标使用。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 SHT 值
SHT1,MASHT1 = SHT(security_list1, check_date='2017-01-04', N=5)
print SHT1[security_list1]
print MASHT1[security_list1]

# 输出 security_list2 的 SHT 值
SHT2,MASHT2 = SHT(security_list2, check_date='2017-01-04', N=5)
for stock in security_list2:
    print SHT2[stock]
    print MASHT2[stock]
```
