---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 图表型
section_path:
  - 技术分析指标
  - 图表型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#图表型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="图表型"></a>

## 图表型

<a id="ZX-重心线"></a>

### ZX-重心线

```python
ZX(security_list, check_date, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   AV 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': -2349.7877426190771, '603177.XSHG': nan, '000002.XSHE': 267047.22475180856, '601211.XSHG': -1726.9088373843188}, {'000001.XSHE': 2304.8620185057907, '603177.XSHG': nan, '000002.XSHE': 292638.40931959258, '601211.XSHG': -3050.487984994948})

**备注：**

-   计算方式与通达信和同花顺相同，东方财富没有该指标

**用法注释：**

重心线指标，重心线是由重心价连接而成的曲线，反映历史平均价位， 对于指数计算公式为:     ZX = 成交金额/成交量。 对个股而言:     ZX = (最高指数＋最低指数＋收盘指数) / 3 类似于不加权平均指数。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 ZX 值
AV1 = ZX(security_list1, check_date='2017-01-04')
print AV1[security_list1]

# 输出 security_list2 的 ZX 值
AV2 = ZX(security_list2, check_date='2017-01-04')
for stock in security_list2:
    print AV2[stock]
```

<a id="PUCU-逆时钟曲线"></a>

### PUCU-逆时钟曲线

```python
PUCU(security_list, check_date, N=24, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   PU 和 CU 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 9.193749999999998, '603177.XSHG': nan, '000002.XSHE': 23.042083333333334, '601211.XSHG': 18.68916666666667}, {'000001.XSHE': 631259.65249999997, '603177.XSHG': nan, '000002.XSHE': 540794.70458333334, '601211.XSHG': 580351.75625000009})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标

**用法注释：**

1.  图表的曲线上有一个箭头，该处代表目前价量的位置；
2.  曲线由绿变成红色时，视为买进信号；
3.  曲线由红变成绿色时，视为卖出信号。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 PUCU 值
PU1,CU1 = PUCU(security_list1, check_date='2017-01-04', N=24)
print PU1[security_list1]
print CU1[security_list1]

# 输出 security_list2 的 PUCU 值
PU2,CU2 = PUCU(security_list2, check_date='2017-01-04', N=24)
for stock in security_list2:
    print PU2[stock]
    print CU2[stock]
```
