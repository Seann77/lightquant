---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: eps-每股指标
section_path:
  - 财务数据
  - eps-每股指标
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#eps"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="eps"></a>

## eps-每股指标

### 接口说明

```python
get_fundamentals(security,'eps',fields, date = None, start_year = None, end_year = None, report_types = None, date_type = None)
```

注意: 获取此表中数据，不支持输入的参数有：merge\_type

```python

           basic_eps   publ_date      secu_abbr
end_date
2013-03-31      0.06   2013-04-19      恒生电子
2014-03-31      0.09   2014-04-29      恒生电子
2015-03-31      0.11   2015-04-25      恒生电子
```

### 示例

```python
# 获取数据的两种模式
# 1. 按日期查询模式（默认以发布日期为参考时间）：返回输入日期之前对应的财务数据
# 在回测中获取单一股票中对应回测日期第一季度每股指标中基本每股收益（basic_eps）# 数据
get_fundamentals('600570.SS','eps','basic_eps','20160628')

# 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
# 获取恒生电子(600570.SS)从2013年至2015年第一季度每股指标中基本每股收益
#（basic_eps）数据
get_fundamentals('600570.SS','eps','basic_eps',start_year='2013',end_year='2015',report_types='1')
```

### 表数据具体字段

每股指标-eps
| 字段名称 | 字段类型 | 字段说明 | 属性 |
| --- | --- | --- | --- |
| secu\_code | str | 股票代码 | 固定返回 |
| secu\_abbr | str | 股票简称 | 固定返回 |
| publ\_date | str | 公告日期 | 固定返回 |
| end\_date | str | 截止日期 | 固定返回 |
| basic\_eps | numpy.float64 | 基本每股收益（元/股） | 自选返回 |
| diluted\_eps | numpy.float64 | 稀释每股收益（元/股） | 自选返回 |
| eps | numpy.float64 | 每股收益\_期末股本摊薄（元/股） | 自选返回 |
| eps\_ttm | numpy.float64 | 每股收益\_TTM（元/股） | 自选返回 |
| naps | numpy.float64 | 每股净资产（元/股） | 自选返回 |
| total\_operating\_revenue\_ps | numpy.float64 | 每股营业总收入（元/股） | 自选返回 |
| main\_income\_ps | numpy.float64 | 每股营业收入（元/股） | 自选返回 |
| operating\_revenue\_ps\_ttm | numpy.float64 | 每股营业收入\_TTM（元/股） | 自选返回 |
| oper\_profit\_ps | numpy.float64 | 每股营业利润（元/股） | 自选返回 |
| ebitps | numpy.float64 | 每股息税前利润（元/股） | 自选返回 |
| capital\_surplus\_fund\_ps | numpy.float64 | 每股资本公积金（元/股） | 自选返回 |
| surplus\_reserve\_fund\_ps | numpy.float64 | 每股盈余公积（元/股） | 自选返回 |
| accumulation\_fund\_ps | numpy.float64 | 每股公积金（元/股） | 自选返回 |
| undivided\_profit | numpy.float64 | 每股未分配利润（元/股） | 自选返回 |
| retained\_earnings\_ps | numpy.float64 | 每股留存收益（元/股） | 自选返回 |
| net\_operate\_cash\_flow\_ps | numpy.float64 | 每股经营活动产生的现金流量净额（元/股） | 自选返回 |
| net\_operate\_cash\_flow\_ps\_ttm | numpy.float64 | 每股经营活动产生的现金流量净额\_TTM（元/股） | 自选返回 |
| cash\_flow\_ps | numpy.float64 | 每股现金流量净额（元/股） | 自选返回 |
| cash\_flow\_ps\_ttm | numpy.float64 | 每股现金流量净额\_TTM（元/股） | 自选返回 |
| enterprise\_fcf\_ps | numpy.float64 | 每股企业自由现金流量（元/股） | 自选返回 |
| shareholder\_fcf\_ps | numpy.float64 | 每股股东自由现金流量（元/股） | 自选返回 |
