---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 获取融资融券标的列表
section_path:
  - 股票数据
  - 获取融资融券标的列表
source_file: api-docs/raw/joinquant/Stock/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Stock
source_anchor: "#获取融资融券标的列表"
source_sha256: 4f98d75f021aa61af93665d67a18decc90781d913d89bb880d603b6b48186e5b
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="获取融资融券标的列表"></a>

## 获取融资融券标的列表

<a id="获取融资标的列表"></a>

### 获取融资标的列表

```python
get_margincash_stocks(date)
```

**参数** date:默认为None,不指定时返回上交所、深交所最近一次披露的的可融资标的列表的list。

**返回结果** 返回指定日期上交所、深交所披露的的可融资标的列表的list。

**示例**

```python
# 获取融资标的列表，并赋值给 margincash_stocks
margincash_stocks = get_margincash_stocks(date='2018-07-02')

# 判断平安银行是否在可融资列表
>>> '000001.XSHE' in get_margincash_stocks(date='2018-07-02')
>>> True
```

<a id="获取融券标的列表"></a>

### 获取融券标的列表

```python
get_marginsec_stocks(date)
```

**参数** date:默认为None,不指定时返回上交所、深交所最近一次披露的的可融券标的列表的list。

**返回结果** 返回指定日期上交所、深交所披露的的可融券标的列表的list。

**示例**

```python
# 获取融券标的列表，并赋值给 marginsec_stocks
marginsec_stocks= get_marginsec_stocks(date='2018-07-05')

# 判断平安银行是否在可融券列表
>>> '000001.XSHE' in get_marginsec_stocks(date='2018-07-05')
>>> True
```
