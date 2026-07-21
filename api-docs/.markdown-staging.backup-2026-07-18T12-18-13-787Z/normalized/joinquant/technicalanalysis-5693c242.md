---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 神系
section_path:
  - 技术分析指标
  - 神系
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#神系"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="神系"></a>

## 神系

<a id="SG-SMX-生命线"></a>

### SG-SMX-生命线

```python
SG_SMX(index_stock, security_list, check_date, N = 50, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock: 大盘股票代码
-   security\_list：股票列表
-   check\_date：要查询数据的日期
-   N：统计的天数 N
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   ZY1, ZY2 和 ZY3 的值

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：({'000001.XSHE': 1.8249767841949445, '603177.XSHG': nan, '000002.XSHE': 4.1215983992887697, '601211.XSHG': 3.6984717987521352}, {'000001.XSHE': 1.8127958869845739, '603177.XSHG': nan, '000002.XSHE': 4.1584984587193548, '601211.XSHG': 3.6942602296341875}, {'000001.XSHE': 1.7890675015767712, '603177.XSHG': nan, '000002.XSHE': 4.2813808808869398, '601211.XSHG': 3.6389978817776334})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标
-   没有计算通达信公式中跟输出结果无关的数据

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
index_stock = '399001.XSHE'
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 SMX 值
ZY1, ZY2, ZY3 = SG_SMX(index_stock, security_list1, check_date='2017-01-04', N = 50)
print ZY1[security_list1]
print ZY2[security_list1]
print ZY3[security_list1]

# 输出 security_list2 的 SMX 值
ZY1, ZY2, ZY3 = SG_SMX(index_stock, security_list2, check_date='2017-01-04', N = 50)
for stock in security_list2:
    print ZY1[stock]
    print ZY2[stock]
    print ZY3[stock]
```

<a id="SG-LB-量比"></a>

### SG-LB-量比

```python
SG_LB(index_stock, security_list, check_date, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock: 大盘股票代码
-   security\_list：股票列表
-   check\_date：要查询数据的日期
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   SG\_LB,MA5和MA10 的值

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：({'000001.XSHE': 10.109096220368592, '603177.XSHG': nan, '000002.XSHE': 2.7192841800000771, '601211.XSHG': 4.0452705438643175}, {'000001.XSHE': 8.6241703174432391, '603177.XSHG': nan, '000002.XSHE': 2.9900942255843939, '601211.XSHG': 4.4009642301227458}, {'000001.XSHE': 9.0082294808292254, '603177.XSHG': nan, '000002.XSHE': 3.9101232166994464, '601211.XSHG': 4.6234315070278713})

**备注：**

-   计算方式与通达信相同，同花顺和东方财富没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
index_stock = '399106.XSHE'
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 SG-LB 值
LB,MA5,MA10 = SG_LB(index_stock, security_list1, check_date='2017-01-04')
print LB[security_list1]
print MA5[security_list1]
print MA10[security_list1]

# 输出 security_list2 的 SG-LB 值
LB,MA5,MA10 = SG_LB(index_stock, security_list2, check_date='2017-01-04')
for stock in security_list2:
    print LB[stock]
    print MA5[stock]
    print MA10[stock]
```

<a id="SG-PF-强势股评分"></a>

### SG-PF-强势股评分

```python
SG_PF(index_stock, security_list, check_date, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   index\_stock：大盘股票代码
-   security\_list：股票列表
-   check\_date：要查询数据的日期
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   强势股评分 的值

**返回结果类型：**

-   字典(dict)：键(key)为股票代码，值(value)为数据。
-   如：{'000001.XSHE': 20, '603177.XSHG': nan, '000002.XSHE': 15, '601211.XSHG': 10}

**备注：**

-   计算方式与通达信和同花顺不完全一致，东方财富没有该指标
-   对公式有修改，将计算A1,A2,A3,A4的公式（如 A1:IF(ZY1>HHV(ZY1,3),10,0);）修改为A1:IF(ZY1>=HHV(ZY1,3),10,0)，原因在于条件ZY1>HHV(ZY1,3)永不成立，就没有存在的意义，且考虑到公式是求一支股票的强势程度，即今天的ZY1是N日内的最大值，所以加了等于号

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
index_stock = '399001.XSHE'
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 SG-PF 值
PF1 = SG_PF(index_stock, security_list1, check_date='2017-01-04')
print PF1[security_list1]

# 输出 security_list2 的 SG-PF 值
PF2 = SG_PF(index_stock, security_list2, check_date='2017-01-04')
for stock in security_list2:
    print PF2[stock]
```

<a id="XDT-心电图"></a>

### XDT-心电图

```python
XDT(index_stock,security_list, check_date, P1 = 5, P2 = 10, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   P1：统计的天数 P1
-   P2：统计的天数 P2
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   QR,MAQR1和MAQR2 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：({'000001.XSHE': 0.91082877183074495, '603177.XSHG': nan, '000002.XSHE': 2.0548217717445239, '601211.XSHG': 1.8365403667306197}, {'000001.XSHE': 0.91460263585968915, '603177.XSHG': nan, '000002.XSHE': 2.0651657576824887, '601211.XSHG': 1.8592000444660219}, {'000001.XSHE': 0.91681359839247212, '603177.XSHG': nan, '000002.XSHE': 2.0851497017887906, '601211.XSHG': 1.8742782030819618})

**备注：**

-   计算方式与通达信，同花顺和东方财富相同

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
index_stock = '399001.XSHE'
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 XDT 值
QR1,MAQR11,MAQR12 = XDT(index_stock, security_list1, check_date='2017-01-04', P1 = 5, P2 = 10)
print QR1[security_list1]
print MAQR11[security_list1]
print MAQR12[security_list1]

# 输出 security_list2 的 XDT 值
QR2,MAQR21,MAQR22 = XDT(index_stock, security_list2, check_date='2017-01-04', P1 = 5, P2 = 10)
for stock in security_list2:
    print QR2[stock]
    print MAQR21[stock]
    print MAQR22[stock]
```
