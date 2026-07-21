---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 获取龙虎榜数据
section_path:
  - 股票数据
  - 获取龙虎榜数据
source_file: api-docs/raw/joinquant/Stock/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Stock
source_anchor: "#获取龙虎榜数据"
source_sha256: 4f98d75f021aa61af93665d67a18decc90781d913d89bb880d603b6b48186e5b
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="获取龙虎榜数据"></a>

## 获取龙虎榜数据

```python
get_billboard_list(stock_list, start_date, end_date, count)
```

获取指定日期区间内的龙虎榜数据

**参数**

-   stock\_list: 一个股票代码的 list。 当值为 None 时， 返回指定日期的所有股票。
-   start\_date:开始日期
-   end\_date: 结束日期
-   count: 交易日数量， 可以与 end\_date 同时使用， 表示获取 end\_date 前 count 个交易日的数据(含 end\_date 当日)

**返回值**

-   pandas.DataFrame， 各 column 的含义如下:
-   code: 股票代码
-   day: 日期
-   direction: ALL 表示『汇总』，SELL 表示『卖』，BUY 表示『买』
-   abnormal\_code: 异常波动类型
-   abnormal\_name: 异常波动名称
-   sales\_depart\_name: 营业部名称
-   rank: 0 表示汇总， 1~5 对应买入金额或卖出金额排名第一到第五
-   buy\_value:买入金额
-   buy\_rate:买入金额占比(买入金额/市场总成交额)
-   sell\_value:卖出金额
-   sell\_rate:卖出金额占比(卖出金额/市场总成交额)
-   total\_value:总额(买入金额 + 卖出金额)
-   net\_value:净额(买入金额 - 卖出金额)
-   amount:市场总成交额

**异常波动类型**

| 参数编码 | 参数名称 |
| --- | --- |
| 106001 | 涨幅偏离值达7%的证券 |
| 106002 | 跌幅偏离值达7%的证券 |
| 106003 | 日价格振幅达到15%的证券 |
| 106004 | 换手率达20%的证券 |
| 106005 | 无价格涨跌幅限制的证券 |
| 106006 | 连续三个交易日内收盘价格涨幅偏离值累计达到20%的证券 |
| 106007 | 连续三个交易日内收盘价格跌幅偏离值累计达到20%的证券 |
| 106008 | 连续三个交易日内收盘价格涨幅偏离值累计达到15%的证券 |
| 106009 | 连续三个交易日内收盘价格跌幅偏离值累计达到15%的证券 |
| 106010 | 连续三个交易日内涨幅偏离值累计达到12%的ST证券、\*ST证券和未完成股改证券 |
| 106011 | 连续三个交易日内跌幅偏离值累计达到12%的ST证券、\*ST证券和未完成股改证券 |
| 106012 | 连续三个交易日的日均换手率与前五个交易日日均换手率的比值到达30倍 |
| 106013 | 单只标的证券的当日融资买入数量达到当日该证券总交易量的50％以上的证券 |
| 106014 | 单只标的证券的当日融券卖出数量达到当日该证券总交易量的50％以上的证券 |
| 106015 | 日价格涨幅达到20%的证券 |
| 106016 | 日价格跌幅达到-15%的证券 |
| 106099 | 其它异常波动的证券 |

**示例**

```python
# 获取2018-08-01的龙虎榜数据
get_billboard_list(stock_list=None, end_date = '2018-08-01', count =1)
```
