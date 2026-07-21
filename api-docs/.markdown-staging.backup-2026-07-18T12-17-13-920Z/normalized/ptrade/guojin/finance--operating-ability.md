---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: operating_ability-营运能力
section_path:
  - 财务数据
  - operating_ability-营运能力
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#operating_ability"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="operating_ability"></a>

## operating\_ability-营运能力

### 接口说明

```python
get_fundamentals(security,'operating_ability',fields, date = None, start_year = None, end_year = None, report_types = None, date_type = None)
```

注意: 获取此表中数据，不支持输入的参数有：merge\_type

```python
           current_assets_turnover_rate   publ_date     secu_abbr
end_date
2013-03-31                       0.1803   2013-04-19     恒生电子
2014-03-31                       0.1518   2014-04-29     恒生电子
2015-03-31                       0.1568   2015-04-25     恒生电子
```

### 示例

```python
# 获取数据的两种模式
# 1. 按日期查询模式（默认以发布日期为参考时间）：返回输入日期之前对应的财务数据
# 在回测中获取单一股票中对应回测日期第一季度营运能力指标中流动资产周转率
#（current_assets_turnover_rate）数据
get_fundamentals('600570.SS','operating_ability','current_assets_turnover_rate','20160628')

# 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
# 获取恒生电子(600570.SS)从2013年至2015年第一季度营运能力指标中流动资产周转# 率（current_assets_turnover_rate）数据
get_fundamentals('600570.SS','operating_ability','current_assets_turnover_rate',start_year='2013',end_year='2015', report_types='1')
```

### 表数据具体字段

营运能力- operating\_ability
| 字段名称 | 字段类型 | 字段说明 | 属性 |
| --- | --- | --- | --- |
| secu\_code | str | 股票代码 | 固定返回 |
| secu\_abbr | str | 股票简称 | 固定返回 |
| publ\_date | str | 公告日期 | 固定返回 |
| end\_date | str | 截止日期 | 固定返回 |
| oper\_cycle | numpy.float64 | 营业周期（天/次） | 自选返回 |
| inventory\_turnover\_rate | numpy.float64 | 存货周转率（次） | 自选返回 |
| inventory\_turnover\_days | numpy.float64 | 存货周转天数（天/次） | 自选返回 |
| accounts\_receivables\_turnover\_rate | numpy.float64 | 应收账款周转率（次） | 自选返回 |
| accounts\_receivables\_turnover\_days | numpy.float64 | 应收账款周转天数（天/次） | 自选返回 |
| accounts\_payables\_turnover\_rate | numpy.float64 | 应付账款周转率（次） | 自选返回 |
| accounts\_payables\_turnover\_days | numpy.float64 | 应付账款周转天数（天/次） | 自选返回 |
| current\_assets\_turnover\_rate | numpy.float64 | 流动资产周转率（次） | 自选返回 |
| fixed\_asset\_turnover\_rate | numpy.float64 | 固定资产周转率（次） | 自选返回 |
| equity\_turnover\_rate | numpy.float64 | 股东权益周转率（次） | 自选返回 |
| total\_asset\_turnover\_rate | numpy.float64 | 总资产周转率（次） | 自选返回 |
