---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: growth_ability-成长能力
section_path:
  - 财务数据
  - growth_ability-成长能力
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#growth_ability"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="growth_ability"></a>

## growth\_ability-成长能力

### 接口说明

```python
get_fundamentals(security,'growth_ability',fields, date = None, start_year = None, end_year = None, report_types = None, date_type = None)
```

```python
               oper_profit_grow_rate   publ_date      secu_abbr
end_date
2013-03-31               124.705       2013-04-19      恒生电子
2014-03-31                9.1946       2014-04-29      恒生电子
2015-03-31               14.2251       2015-04-25      恒生电子
```

注意: 获取此表中数据，不支持输入的参数有：merge\_type

### 示例

```python
# 获取数据的两种模式
# 1. 按日期查询模式（默认以发布日期为参考时间）：返回输入日期之前对应的财务数据
# 在回测中获取单一股票中对应回测日期第一季度成长能力指标中营业利润同比增长
#（oper_profit_grow_rate）数据
get_fundamentals('600570.SS','growth_ability','oper_profit_grow_rate','20160628')

# 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
# 获取恒生电子(600570.SS)从2013年至2015年第一季度成长能力指标中营业利润同比# 增长（oper_profit_grow_rate）数据
get_fundamentals('600570.SS','growth_ability','oper_profit_grow_rate',start_year='2013',end_year='2015', report_types='1')
```

### 表数据具体字段

成长能力- growth\_ability
| 字段名称 | 字段类型 | 字段说明 | 属性 |
| --- | --- | --- | --- |
| secu\_code | str | 股票代码 | 固定返回 |
| secu\_abbr | str | 股票简称 | 固定返回 |
| publ\_date | str | 公告日期 | 固定返回 |
| end\_date | str | 截止日期 | 固定返回 |
| basic\_eps\_yoy | numpy.float64 | 基本每股收益同比增长（%） | 自选返回 |
| diluted\_eps\_yoy | numpy.float64 | 稀释每股收益同比增长（%） | 自选返回 |
| operating\_revenue\_grow\_rate | numpy.float64 | 营业收入同比增长（%） | 自选返回 |
| np\_parent\_company\_yoy | numpy.float64 | 归属母公司股东的净利润同比增长（%） | 自选返回 |
| net\_operate\_cash\_flow\_yoy | numpy.float64 | 经营活动产生的现金流量净额同比增长（%） | 自选返回 |
| oper\_profit\_grow\_rate | numpy.float64 | 营业利润同比增长（%） | 自选返回 |
| total\_profit\_grow\_rate | numpy.float64 | 利润总额同比增长（%） | 自选返回 |
| eps\_grow\_rate\_ytd | numpy.float64 | 每股净资产相对年初增长率（%） | 自选返回 |
| se\_without\_mi\_grow\_rate\_ytd | numpy.float64 | 归属母公司股东的权益相对年初增长率（%） | 自选返回 |
| ta\_grow\_rate\_ytd | numpy.float64 | 资产总计相对年初增长率（%) | 自选返回 |
| np\_parent\_company\_cut\_yoy | numpy.float64 | 归属母公司股东的净利润(扣除)同比增长（%） | 自选返回 |
| avg\_np\_yoy\_past\_five\_year | numpy.float64 | 过去五年同期归属母公司净利润平均增幅（%） | 自选返回 |
| oper\_cash\_ps\_grow\_rate | numpy.float64 | 每股经营活动产生的现金流量净额同比增长（%） | 自选返回 |
| naor\_yoy | numpy.float64 | 净资产收益率(摊薄)同比增（%） | 自选返回 |
| net\_asset\_grow\_rate | numpy.float64 | 净资产同比增长（%） | 自选返回 |
| total\_asset\_grow\_rate | numpy.float64 | 总资产同比增长（%） | 自选返回 |
| sustainable\_grow\_rate | numpy.float64 | 可持续增长率（%） | 自选返回 |
| net\_profit\_grow\_rate | numpy.float64 | 净利润同比增长（%） | 自选返回 |
