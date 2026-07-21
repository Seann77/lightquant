---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: debt_paying_ability-偿债能力
section_path:
  - 财务数据
  - debt_paying_ability-偿债能力
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#debt_paying_ability"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="debt_paying_ability"></a>

## debt\_paying\_ability-偿债能力

### 接口说明

```python
get_fundamentals(security,'debt_paying_ability',fields, date = None, start_year = None, end_year = None, report_types = None, date_type = None)
```

注意: 获取此表中数据，不支持输入的参数有：merge\_type

```python

           current_ratio   publ_date      secu_abbr
end_date
2013-03-31        3.4234   2013-04-19      恒生电子
2014-03-31        3.4941   2014-04-29      恒生电子
2015-03-31        1.8332   2015-04-25      恒生电子
```

### 示例

```python
# 获取数据的两种模式
# 1. 按日期查询模式（默认以发布日期为参考时间）：返回输入日期之前对应的财务数据
# 在回测中获取单一股票中对应回测日期第一季度偿债能力指标中流动比率（current_ratio）
# 数据
get_fundamentals('600570.SS','debt_paying_ability','current_ratio','20160628')

# 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
# 获取恒生电子(600570.SS)从2013年至2015年第一季度偿债能力指标中流动比率
#（current_ratio）数据
get_fundamentals('600570.SS','debt_paying_ability','current_ratio',start_year='2013',end_year='2015', report_types='1')
```

### 表数据具体字段

偿债能力- debt\_paying\_ability
| 字段名称 | 字段类型 | 字段说明 | 属性 |
| --- | --- | --- | --- |
| secu\_code | str | 股票代码 | 固定返回 |
| secu\_abbr | str | 股票简称 | 固定返回 |
| publ\_date | str | 公告日期 | 固定返回 |
| end\_date | str | 截止日期 | 固定返回 |
| current\_ratio | numpy.float64 | 流动比率 | 自选返回 |
| quick\_ratio | numpy.float64 | 速动比率 | 自选返回 |
| super\_quick\_ratio | numpy.float64 | 超速动比率 | 自选返回 |
| debt\_equity\_ratio | numpy.float64 | 产权比率（%） | 自选返回 |
| sewmi\_to\_total\_liability | numpy.float64 | 归属母公司股东的权益／负债合计（%） | 自选返回 |
| sewmi\_to\_interest\_bear\_debt | numpy.float64 | 归属母公司股东的权益／带息债务（%） | 自选返回 |
| debt\_tangible\_equity\_ratio | numpy.float64 | 有形净值债务率（%） | 自选返回 |
| tangible\_a\_to\_interest\_bear\_debt | numpy.float64 | 有形净值／带息债务（%） | 自选返回 |
| tangible\_a\_to\_net\_debt | numpy.float64 | 有形净值／净债务（%） | 自选返回 |
| ebitda\_to\_t\_liability | numpy.float64 | 息税折旧摊销前利润／负债合计 | 自选返回 |
| nocf\_to\_t\_liability | numpy.float64 | 经营活动产生现金流量净额/负债合计 | 自选返回 |
| nocf\_to\_interest\_bear\_debt | numpy.float64 | 经营活动产生现金流量净额/带息债务 | 自选返回 |
| nocf\_to\_current\_liability | numpy.float64 | 经营活动产生现金流量净额/流动负债 | 自选返回 |
| nocf\_to\_net\_debt | numpy.float64 | 经营活动产生现金流量净额/净债务 | 自选返回 |
| interest\_cover | numpy.float64 | 利息保障倍数（倍） | 自选返回 |
| long\_debt\_to\_working\_capital | numpy.float64 | 长期负债与营运资金比率 | 自选返回 |
| opercashinto\_current\_debt | numpy.float64 | 现金流动负债比 | 自选返回 |
