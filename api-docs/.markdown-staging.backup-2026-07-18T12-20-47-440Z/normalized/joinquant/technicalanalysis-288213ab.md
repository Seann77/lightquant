---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 特色型
section_path:
  - 技术分析指标
  - 特色型
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#特色型"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="特色型"></a>

## 特色型

<a id="AROON-阿隆指标"></a>

### AROON-阿隆指标

```python
AROON(security_list, check_date, N = 25, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   上轨和下轨 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 8, '603177.XSHG': 16, '000002.XSHE': 4, '601211.XSHG': 52}, {'000001.XSHE': 76, '603177.XSHG': 68, '000002.XSHE': 100, '601211.XSHG': 72})

**备注：**

-   计算方式与通达信相同, 同花顺和东方财富没有该指标

**用法注释：**

1.  在分析Aroon指标时,主要观察三种状态:
2.  极值0和100，当UP线达到100时，市场处于强势；如果维持在70~100之间，表示一个上升趋势。同样，如果Down线达到0，表示处于弱势，如果维持在0~30之间，表示处于下跌趋势。如果两条线同处于极值水平，则表明一个更强的趋势。
3.  平行运动，如果两条线平行运动时，表明市场趋势被打破。可以预期该状况将持续下去，只到由极值水平或交叉穿行时为止。 　　
4.  交叉穿行，当下行线上穿上行线时，表明潜在弱势，预期价格开始趋于下跌。反之，表明潜在强势，预期价格趋于走高。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 AROON 值
SG1,XG1 = AROON(security_list1, check_date='2017-01-04', N = 25)
print SG1[security_list1]
print XG1[security_list1]

# 输出 security_list2 的 AROON 值
SG2,XG2 = AROON(security_list2, check_date='2017-01-04', N = 25)
for stock in security_list2:
    print SG2[stock]
    print XG2[stock]
```

<a id="CFJT-财富阶梯"></a>

### CFJT-财富阶梯

```python
CFJT(security_list, check_date, MM = 200, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表

-   check\_date：要查询数据的日期

-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月

-   include\_now：是否包含当前周期，默认为 True

-   fq\_ref\_date：复权基准日，默认为 None


**返回：**

-   突破，A1X，多方和空方 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 9.091020360179682, '603177.XSHG': nan, '000002.XSHE': 20.803750806335895, '601211.XSHG': 18.557344251180741}, {'000001.XSHE': 0.30048617213779022, '603177.XSHG': nan, '000002.XSHE': -0.35335749810512884, '601211.XSHG': 0.10620817622332195}, {'000001.XSHE': 9.0220919736614977, '603177.XSHG': nan, '000002.XSHE': None, '601211.XSHG': 18.29222867039314}, {'000001.XSHE': None, '603177.XSHG': nan, '000002.XSHE': 26.722071885395618, '601211.XSHG': None})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标
-   只输出通达信公式中的赋值数据，没有画图
-   MM 取值200，是因为各支股票的在某些阶段的BARSLAST(CROSS(A1X,0))(即上次A1X上穿0距今天数)不一致，有的会是50左右（出现次数较多），有的是100左右（出现次数较少），在兼顾考虑程序运行占用内存的情况下，本函数选择获取MM(200)天的数据来计算，来使其尽量适用于任何股票，同时用户可以自己设置MM的取值。

**用法注释：**

-   在红色阶梯内做多，在绿色阶梯内做空。（来自新浪博客）

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CFJT 值
TP1,A1X1,DF1,KF1 = CFJT(security_list1, check_date='2017-01-04', MM = 200)
print TP1[security_list1]
print A1X1[security_list1]
print DF1[security_list1]
print KF1[security_list1]
# 输出 security_list2 的 CFJT 值
TP2,A1X2,DF2,KF2 = CFJT(security_list1, check_date='2017-01-04', MM = 200)
for stock in security_list2:
    print TP2[stock]
    print A1X2[stock]
    print DF2[stock]
    print KF2[stock]
```

<a id="ZSDB-指数对比"></a>

### ZSDB-指数对比

```python
ZSDB(index_stock, check_date, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   A和指数涨幅 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'399001.XSHE': 10004.844999999999}, {'399001.XSHE': 0.73852218600089092})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标
-   公式中需要画图部分未输出

**用法注释：**

-   无

**示例：**

```python
# 定义大盘股票
index_stock = '399001.XSHE'

# 计算并输出 index_stock 的 ZSDB 值
A1,ZSZF1 = ZSDB(index_stock, check_date='2017-01-04')
print A1[index_stock]
print ZSZF1[index_stock]
```
