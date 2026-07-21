---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: profit_ability-盈利能力
section_path:
  - 财务数据
  - profit_ability-盈利能力
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#profit_ability"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="profit_ability"></a>

## profit\_ability-盈利能力

### 接口说明

```python
get_fundamentals(security,'profit_ability',fields, date = None, start_year = None, end_year = None, report_types = None, date_type = None)
```

```python
             publ_date     roe     secu_abbr
end_date
2013-03-31  2013-04-19  2.8127      恒生电子
2014-03-31  2014-04-29  3.3056      恒生电子
2015-03-31  2015-04-25  3.4869      恒生电子
```

注意: 获取此表中数据，不支持输入的参数有：merge\_type

### 示例

```python
# 获取数据的两种模式
# 1. 按日期查询模式（默认以发布日期为参考时间）：返回输入日期之前对应的财务数据
# 在回测中获取单一股票中对应回测日期第一季度盈利能力指标中净资产收益率（roe）数据
get_fundamentals('600570.SS','profit_ability','roe','20160628')

# 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
# 获取恒生电子(600570.SS)从2013年至2015年第一季度盈利能力指标中净资产收益率
#（roe）数据
get_fundamentals('600570.SS','profit_ability','roe',start_year='2013',end_year='2015',report_types='1')
```

### 表数据具体字段

盈利能力- profit\_ability
| 字段名称 | 字段类型 | 字段说明 | 属性 |
| --- | --- | --- | --- |
| secu\_code | str | 股票代码 | 固定返回 |
| secu\_abbr | str | 股票简称 | 固定返回 |
| publ\_date | str | 公告日期 | 固定返回 |
| end\_date | str | 截止日期 | 固定返回 |
| roe\_avg | numpy.float64 | 净资产收益率%平均计算值（%） | 自选返回 |
| roe\_weighted | numpy.float64 | 净资产收益率%加权公布值（%） | 自选返回 |
| roe | numpy.float64 | 净资产收益率%摊薄公布值（%） | 自选返回 |
| roe\_cut | numpy.float64 | 净资产收益率%扣除摊薄（%） | 自选返回 |
| roe\_cut\_weighted | numpy.float64 | 净资产收益率%扣除加权（%） | 自选返回 |
| roe\_ttm | numpy.float64 | 净资产收益率\_TTM（%） | 自选返回 |
| roa\_ebit | numpy.float64 | 总资产报酬率（%） | 自选返回 |
| roa\_ebit\_ttm | numpy.float64 | 总资产报酬率\_TTM（%） | 自选返回 |
| roa | numpy.float64 | 总资产净利率（%） | 自选返回 |
| roa\_ttm | numpy.float64 | 总资产净利率\_TTM（%） | 自选返回 |
| roic | numpy.float64 | 投入资本回报率（%） | 自选返回 |
| net\_profit\_ratio | numpy.float64 | 销售净利率（%） | 自选返回 |
| net\_profit\_ratio\_ttm | numpy.float64 | 销售净利率\_TTM（%） | 自选返回 |
| gross\_income\_ratio | numpy.float64 | 销售毛利率（%） | 自选返回 |
| gross\_income\_ratio\_ttm | numpy.float64 | 销售毛利率\_TTM（%） | 自选返回 |
| sales\_cost\_ratio | numpy.float64 | 销售成本率（%） | 自选返回 |
| period\_costs\_rate | numpy.float64 | 销售期间费用率（%） | 自选返回 |
| period\_costs\_rate\_ttm | numpy.float64 | 销售期间的费用率\_TTM（%） | 自选返回 |
| np\_to\_tor | numpy.float64 | 净利润／营业总收入（%） | 自选返回 |
| np\_to\_tor\_ttm | numpy.float64 | 净利润／营业总收入\_TTM（%） | 自选返回 |
| operating\_profit\_to\_tor | numpy.float64 | 营业利润／营业总收入（%） | 自选返回 |
| operating\_profit\_to\_tor\_ttm | numpy.float64 | 营业利润／营业总收入\_TTM（%） | 自选返回 |
| ebit\_to\_tor | numpy.float64 | 息税前利润／营业总收入（%） | 自选返回 |
| ebit\_to\_tor\_ttm | numpy.float64 | 息税前利润／营业总收入\_TTM（%） | 自选返回 |
| t\_operating\_cost\_to\_tor | numpy.float64 | 营业总成本／营业总收入（%） | 自选返回 |
| t\_operating\_cost\_to\_tor\_ttm | numpy.float64 | 营业总成本／营业总收入\_TTM（%） | 自选返回 |
| operating\_expense\_rate | numpy.float64 | 销售费用／营业总收入（%） | 自选返回 |
| operating\_expense\_rate\_ttm | numpy.float64 | 销售费用／营业总收入\_TTM（%） | 自选返回 |
| admini\_expense\_rate | numpy.float64 | 管理费用／营业总收入（%） | 自选返回 |
| admini\_expense\_rate\_ttm | numpy.float64 | 管理费用／营业总收入\_TTM（%） | 自选返回 |
| financial\_expense\_rate | numpy.float64 | 财务费用／营业总收入（%） | 自选返回 |
| financial\_expense\_rate\_ttm | numpy.float64 | 财务费用／营业总收入\_TTM（%） | 自选返回 |
| asset\_impa\_loss\_to\_tor | numpy.float64 | 资产减值损失／营业总收入（%） | 自选返回 |
| asset\_impa\_loss\_to\_tor\_ttm | numpy.float64 | 资产减值损失／营业总收入\_TTM（%） | 自选返回 |
| net\_profit | numpy.float64 | 归属母公司净利润（元） | 自选返回 |
| net\_profit\_cut | numpy.float64 | 扣除非经常性损益后的净利润（元） | 自选返回 |
| ebit | numpy.float64 | 息税前利润（元） | 自选返回 |
| ebitda | numpy.float64 | 息税折旧摊销前利润（元） | 自选返回 |
| operating\_profit\_ratio | numpy.float64 | 营业利润率（%） | 自选返回 |
| total\_profit\_cost\_ratio | numpy.float64 | 成本费用利润率 | 自选返回 |
