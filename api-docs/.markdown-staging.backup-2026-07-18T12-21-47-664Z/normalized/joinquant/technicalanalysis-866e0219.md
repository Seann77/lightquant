---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 鬼系
section_path:
  - 技术分析指标
  - 鬼系
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#鬼系"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="鬼系"></a>

## 鬼系

<a id="CYW-主力控盘"></a>

### CYW-主力控盘

```python
CYW(security_list, check_date, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   主力控盘 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 156.19960836507815, '603177.XSHG': nan, '000002.XSHE': -1.0073386373887827, '601211.XSHG': 128.07126639142004}

**备注：**

-   计算方式与通达信和东方财富相同，同花顺没有该指标

**用法注释：**

-   无

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CYW 值
CYW1 = CYW(security_list1, check_date='2017-01-04')
print CYW1[security_list1]

# 输出 security_list2 的 CYW 值
CYW2 = CYW(security_list2, check_date='2017-01-04')
for stock in security_list2:
    print CYW2[stock]
```

<a id="CYS-市场盈亏"></a>

### CYS-市场盈亏

```python
CYS(security_list, check_date, unit = '1d', include_now = True, fq_ref_date = None)
```

**参数：**

-   security\_list：标的列表
-   check\_date：要查询数据的日期
-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月
-   include\_now：是否包含当前周期，默认为 True
-   fq\_ref\_date：复权基准日，默认为 None

**返回：**

-   市场盈亏 的值

**返回结果类型：**

-   字典(dict)：键(key)为标的代码，值(value)为数据。
-   如：{'000001.XSHE': 1.3988916898194301, '603177.XSHG': nan, '000002.XSHE': -1.0261207332078812, '601211.XSHG': 1.0911602313875552}

**备注：**

-   计算方式与通达信和东方财富相同，与同花顺本质上相同

**用法注释：**

-   CYS指标主要用于捕捉超跌股，CYS13<-16为短线超跌，CYS34<-22为中线超跌。一般情况下，买入超跌股，获得一个小额赢利概率较大。
-   注意区分某一个股超跌与大盘下跌时形成的个股超跌的差别，若大盘表现不错，但某些个股出现超跌，则这种超跌的原因是个股基本面的崩溃，风险较大，但当大盘出现调整时，部分个股调整过度，呈现出超跌状态，则是较佳的短线品种，可进行关注。

**示例：**

```python
# 定义股票池列表
security_list1 = '000001.XSHE'
security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']

# 计算并输出 security_list1 的 CYS 值
CYS1 = CYS(security_list1, check_date='2017-01-04')
print CYS1[security_list1]

# 输出 security_list2 的 CYS 值
CYS2 = CYS(security_list2, check_date='2017-01-04')
for stock in security_list2:
    print CYS2[stock]
```
