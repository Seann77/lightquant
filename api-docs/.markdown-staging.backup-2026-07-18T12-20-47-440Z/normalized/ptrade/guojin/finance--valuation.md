---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: valuation-估值数据
section_path:
  - 财务数据
  - valuation-估值数据
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#valuation"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="财务数据的API接口说明"></a>

# 财务数据的API接口说明

<a id="valuation"></a>

## valuation-估值数据

### 接口说明

```python
get_fundamentals(security, 'valuation', fields=None, date=None)
```

注意事项：

一、该接口只支持按天查询模式，返回查询日期对应股票相关数据。查询此表不支持输入的参数有：start\_year, end\_year, report\_types, date\_type, merge\_type。

二、换手率（turnover\_rate）和滚动股息率（dividend\_ratio）两个字段数据源返回的是带%的字符串。比如turnover\_rate：20%，用户需要自行转换成0.2的float格式。

关于date字段的说明

场景一：date字段不入参。回测中默认是获取context.blotter.current\_dt交易日收盘后更新的数据，因此会产生未来函数，交易和研究会返回当日数据，若在盘中时间由于数据未更新将返回字段为NAN的数据，因此建议获取最新数据的场景都使用date参数入参上一个交易日日期。

场景二：date字段入参日期。回测和交易中若date为非交易日，将返回字段为NAN的数据；研究中若date为非交易日，将返回往前最近一个交易日的数据，注意回测和交易中是可以取到未来的数据，需要规避。

```python
               turnover_rate     pb    total_value   trading_day    pe_dynamic
secu_code
600570.SS         4.20%        11.89   3.748224e+10   2018-04-24      163.38
000001.SZ         0.86%         0.91   2.036411e+11   2018-04-24        7.72
```

### 示例

```python
# 获取股票池
stocks = get_index_stocks('000906.XBHS')
# 指定股票池
stocks = ['600570.SS','000001.SZ']

# 获取估值数据，默认会返回context.blotter.current_dt前一交易日的数据(在实际生活中，我们只能看到前一交易日的估值数据)。仅在回测中返回前一交易日的估值数据，在研究和交易中返回当前时间的估值数据。
get_fundamentals(stocks, 'valuation')

#获取股票池中对应上市公司2018年04月10日前一交易日的市净率
get_fundamentals(stocks, 'valuation', date = '20180410', fields = 'pb')

# 获取股票池中对应上市公司2018年04月24日前一交易日的A股总市值(元)、动态市盈率、换手率和市净率数据
get_fundamentals(stocks, 'valuation', date = '2018-04-24', fields = ['total_value', 'pe_dynamic', 'turnover_rate', 'pb'])
```

### 表数据具体字段

估值数据 - valuation
| 字段名称 | 字段类型 | 字段说明 | 属性 |
| --- | --- | --- | --- |
| trading\_day | str | 交易日期 | 固定返回 |
| total\_value | float | A股总市值(元) | 固定返回 |
| float\_value | float | A股流通市值(元) | 自选返回 |
| naps | float | 每股净资产/(元/股) | 自选返回 |
| pcf | float | 市现率 | 自选返回 |
| secu\_abbr | str | 证券简称 | 自选返回 |
| secu\_code | str | 证券代码 | 固定返回 |
| ps | float | 市销率PS | 自选返回 |
| ps\_ttm | float | 市销率PS(TTM) | 自选返回 |
| pe\_ttm | float | 市盈率PE(TTM) | 自选返回 |
| a\_shares | float | A股股本 | 自选返回 |
| a\_floats | float | 可流通A股 | 自选返回 |
| pe\_dynamic | float | 动态市盈率 | 自选返回 |
| pe\_static | float | 静态市盈率 | 自选返回 |
| b\_floats | float | 可流通B股 | 自选返回 |
| b\_shares | float | B股股本 | 自选返回 |
| h\_shares | float | H股股本 | 自选返回 |
| total\_shares | float | 总股本 | 自选返回 |
| turnover\_rate | float | 换手率 | 自选返回 |
| dividend\_ratio | float | 滚动股息率 | 自选返回 |
| pb | float | 市净率 | 自选返回 |
| roe | float | 净资产收益率 | 自选返回 |
