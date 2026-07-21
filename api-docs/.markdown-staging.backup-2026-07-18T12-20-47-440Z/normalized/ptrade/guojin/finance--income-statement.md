---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: income_statement-利润表
section_path:
  - 财务数据
  - income_statement-利润表
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#income_statement"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="income_statement"></a>

## income\_statement-利润表

### 接口说明

```python
get_fundamentals(security, 'income_statement',fields, date = None, start_year = None, end_year = None, report_types = None, date_type = None, merge_type = None)
```

```python
                company_type   net_profit   publ_date      secu_abbr
end_date
2013-03-31            1        3.71658e+07  2013-04-19      恒生电子
2014-03-31            1        5.38395e+07  2014-04-29      恒生电子
2015-03-31            1           7.22e+07  2015-04-25      恒生电子
```

### 示例

```python
# 获取数据的两种模式
# 1. 按日期查询模式（默认以发布日期为参考时间）：返回输入日期之前对应的财务数据
# 在回测中获取单一股票中对应回测日期第一季度利润表中净利润（net_profit）数据
get_fundamentals('600570.SS','income_statement','net_profit','20160628')

# 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
# 获取恒生电子(600570.SS)从2013年至2015年第一季度利润表中净利润（net_profit）# 数据
get_fundamentals('600570.SS','income_statement','net_profit',start_year='2013',end_year='2015', report_types='1')
```

### 表数据具体字段

利润表 - income\_statement
| 字段名称 | 字段类型 | 字段说明 |
| --- | --- | --- |
| secu\_code | str | 股票代码 |
| secu\_abbr | str | 股票简称 |
| company\_type | str | 公司类型 |
| end\_date | str | 截止日期 |
| publ\_date | str | 公告日期 |
| basic\_eps | numpy.float64 | 基本每股收益 |
| diluted\_eps | numpy.float64 | 稀释每股收益 |
| net\_profit | numpy.float64 | 净利润 |
| np\_parent\_company\_owners | numpy.float64 | 归属于母公司所有者的净利润 |
| minority\_profit | numpy.float64 | 少数股东损益 |
| total\_operating\_cost | numpy.float64 | 营业总成本 |
| operating\_payout | numpy.float64 | 营业支出 |
| refunded\_premiums | numpy.float64 | 退保金 |
| compensation\_expense | numpy.float64 | 赔付支出 |
| amortization\_expense | numpy.float64 | 减:摊回赔付支出 |
| premium\_reserve | numpy.float64 | 提取保险责任准备金 |
| amortization\_premium\_reserve | numpy.float64 | 减:摊回保险责任准备金 |
| policy\_dividend\_payout | numpy.float64 | 保单红利支出 |
| reinsurance\_cost | numpy.float64 | 分保费用 |
| amortization\_reinsurance\_cost | numpy.float64 | 减:摊回分保费用 |
| insurance\_commission\_expense | numpy.float64 | 保险手续费及佣金支出 |
| other\_operating\_cost | numpy.float64 | 其他营业成本 |
| operating\_cost | numpy.float64 | 营业成本 |
| operating\_tax\_surcharges | numpy.float64 | 营业税金及附加 |
| operating\_expense | numpy.float64 | 销售费用 |
| administration\_expense | numpy.float64 | 管理费用 |
| financial\_expense | numpy.float64 | 财务费用 |
| asset\_impairment\_loss | numpy.float64 | 资产减值损失 |
| operating\_profit | numpy.float64 | 营业利润 |
| non\_operating\_income | numpy.float64 | 加：营业收入 |
| non\_operating\_expense | numpy.float64 | 减：营业外支出 |
| non\_current\_assetss\_deal\_loss | numpy.float64 | 其中：非流动资产处置净损失 |
| total\_operating\_revenue | numpy.float64 | 营业总收入 |
| operating\_revenue | numpy.float64 | 营业收入 |
| net\_interest\_income | numpy.float64 | 利息净收入 |
| interest\_income | numpy.float64 | 其中：利息收入 |
| interest\_expense | numpy.float64 | 其中:利息支出 |
| net\_commission\_income | numpy.float64 | 手续费及佣金净收入 |
| commission\_income | numpy.float64 | 其中：手续费及佣金收入 |
| commission\_expense | numpy.float64 | 其中：手续费及佣金支出 |
| net\_proxy\_secu\_income | numpy.float64 | 其中：代理买卖证券业务净收入 |
| net\_subissue\_secu\_income | numpy.float64 | 其中：证券承销业务净收入 |
| net\_trust\_income | numpy.float64 | 其中:受托客户资产管理业务净收入 |
| premiums\_earned | numpy.float64 | 已赚保费 |
| premiums\_income | numpy.float64 | 保险业务收入 |
| reinsurance\_income | numpy.float64 | 其中：分保费收入 |
| reinsurance | numpy.float64 | 减：分出保费 |
| unearned\_premium\_reserve | numpy.float64 | 提取未到期责任准备金 |
| other\_operating\_revenue | numpy.float64 | 其他营业收入 |
| other\_net\_revenue | numpy.float64 | 非营业性收入 |
| fair\_value\_change\_income | numpy.float64 | 公允价值变动净收益 |
| invest\_income | numpy.float64 | 投资净收益 |
| invest\_income\_associates | numpy.float64 | 其中:对联营合营企业的投资收益 |
| exchange\_income | numpy.float64 | 汇兑收益 |
| total\_profit | numpy.float64 | 利润总额 |
| income\_tax\_cost | numpy.float64 | 减：所得税费用 |
| total\_composite\_income | numpy.float64 | 综合收益总额 |
| ci\_parent\_company\_owners | numpy.float64 | 归属于母公司所有者的综合收益总额 |
| ci\_minority\_owners | numpy.float64 | 归属于少数股东的综合收益总额 |
| r\_and\_d | numpy.float64 | 研发费用 |
