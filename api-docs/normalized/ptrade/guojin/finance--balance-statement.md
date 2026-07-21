---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: balance_statement-资产负债表
section_path:
  - 财务数据
  - balance_statement-资产负债表
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#balance_statement"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="balance_statement"></a>

## balance\_statement-资产负债表

### 接口说明

```python
get_fundamentals(security, 'balance_statement',fields, date = None, start_year = None, end_year = None, report_types = None, date_type = None, merge_type = None)
```

```python

               company_type   publ_date   secu_abbr    total_assets
end_date
2013-03-31            1       2013-04-19   恒生电子     1.76795e+09
2014-03-31            1       2014-04-29   恒生电子     2.20999e+09
2015-03-31            1       2015-04-25   恒生电子     3.09674e+09
```

### 示例

```python
# 获取数据的两种模式
# 1. 按日期查询模式（默认以发布日期为参考时间）：返回输入日期之前对应的财务数据
# 在回测中获取单一股票中对应回测日期资产负债表中资产总计（total_assets）数据
get_fundamentals('600570.SS','balance_statement','total_assets','20160628')

# 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
# 获取恒生电子(600570.SS)从2013年至2015年第一季度资产负债表中资产总计
#（total_assets）数据
get_fundamentals('600570.SS','balance_statement','total_assets',start_year='2013',end_year='2015', report_types='1')
```

### 表数据具体字段

资产负债表 - balance\_statement
| 字段名称 | 字段类型 | 字段说明 |
| --- | --- | --- |
| secu\_code | str | 股票代码 |
| secu\_abbr | str | 股票简称 |
| company\_type | str | 公司类型 |
| end\_date | str | 截止日期 |
| publ\_date | str | 公告日期 |
| settlement\_provi | numpy.float64 | 结算备付金 |
| client\_provi | numpy.float64 | 客户备付金 |
| deposit\_in\_interbank | numpy.float64 | 存放同业款项 |
| r\_metal | numpy.float64 | 贵金属 |
| lend\_capital | numpy.float64 | 拆出资金 |
| derivative\_assets | numpy.float64 | 衍生金融资产 |
| bought\_sellback\_assets | numpy.float64 | 买入返售金融资产 |
| loan\_and\_advance | numpy.float64 | 发放贷款和垫款 |
| insurance\_receivables | numpy.float64 | 应收保费 |
| receivable\_subrogation\_fee | numpy.float64 | 应收代位追偿款 |
| reinsurance\_receivables | numpy.float64 | 应收分保账款 |
| receivable\_unearned\_r | numpy.float64 | 应收分保未到期责任准备金 |
| receivable\_claims\_r | numpy.float64 | 应收分保未决赔款准备金 |
| receivable\_life\_r | numpy.float64 | 应收分保寿险责任准备金 |
| receivable\_lt\_health\_r | numpy.float64 | 应收分保长期健康险责任准备金 |
| insurer\_impawn\_loan | numpy.float64 | 保户质押贷款 |
| fixed\_deposit | numpy.float64 | 定期存款 |
| refundable\_capital\_deposit | numpy.float64 | 存出资本保证金 |
| refundable\_deposit | numpy.float64 | 存出保证金 |
| independence\_account\_assets | numpy.float64 | 独立账户资产 |
| other\_assets | numpy.float64 | 其他资产 |
| borrowing\_from\_centralbank | numpy.float64 | 向中央银行借款 |
| deposit\_of\_interbank | numpy.float64 | 同业及其他金融机构存放款项 |
| borrowing\_capital | numpy.float64 | 拆入资金 |
| derivative\_liability | numpy.float64 | 衍生金融负债 |
| sold\_buyback\_secu\_proceeds | numpy.float64 | 卖出回购金融资产款 |
| deposit | numpy.float64 | 吸收存款 |
| proxy\_secu\_proceeds | numpy.float64 | 代理买卖证券款 |
| sub\_issue\_secu\_proceeds | numpy.float64 | 代理承销证券款 |
| deposits\_received | numpy.float64 | 存入保证金 |
| advance\_insurance | numpy.float64 | 预收保费 |
| commission\_payable | numpy.float64 | 应付手续费及佣金 |
| reinsurance\_payables | numpy.float64 | 应付分保账款 |
| compensation\_payable | numpy.float64 | 应付赔付款 |
| policy\_dividend\_payable | numpy.float64 | 应付保单红利 |
| insurer\_deposit\_investment | numpy.float64 | 保户储金及投资款 |
| unearned\_premium\_reserve | numpy.float64 | 未到期责任准备金 |
| outstanding\_claim\_reserve | numpy.float64 | 未决赔款准备金 |
| life\_insurance\_reserve | numpy.float64 | 寿险责任准备金 |
| lt\_health\_insurance\_lr | numpy.float64 | 长期健康险责任准备金 |
| independence\_liability | numpy.float64 | 独立账户负债 |
| other\_liability | numpy.float64 | 其他负债 |
| cash\_equivalents | numpy.float64 | 货币资金 |
| client\_deposit | numpy.float64 | 客户资金存款 |
| trading\_assets | numpy.float64 | 交易性金融资产 |
| bill\_receivable | numpy.float64 | 应收票据 |
| dividend\_receivable | numpy.float64 | 应收股利 |
| interest\_receivable | numpy.float64 | 应收利息 |
| account\_receivable | numpy.float64 | 应收账款 |
| other\_receivable | numpy.float64 | 其他应收款 |
| advance\_payment | numpy.float64 | 预付款项 |
| inventories | numpy.float64 | 存货 |
| non\_current\_asset\_in\_one\_year | numpy.float64 | 一年内到期的非流动资产 |
| other\_current\_assets | numpy.float64 | 其他流动资产 |
| total\_current\_assets | numpy.float64 | 流动资产合计 |
| shortterm\_loan | numpy.float64 | 短期借款 |
| impawned\_loan | numpy.float64 | 质押借款 |
| trading\_liability | numpy.float64 | 交易性金融负债 |
| notes\_payable | numpy.float64 | 应付票据 |
| accounts\_payable | numpy.float64 | 应付账款 |
| advance\_receipts | numpy.float64 | 预收款项 |
| salaries\_payable | numpy.float64 | 应付职工薪酬 |
| dividend\_payable | numpy.float64 | 应付股利 |
| taxs\_payable | numpy.float64 | 应交税费 |
| interest\_payable | numpy.float64 | 应付利息 |
| other\_payable | numpy.float64 | 其他应付款 |
| non\_current\_liability\_in\_one\_year | numpy.float64 | 一年内到期的非流动负债 |
| other\_current\_liability | numpy.float64 | 其他流动负债 |
| total\_current\_liability | numpy.float64 | 流动负债合计 |
| hold\_for\_sale\_assets | numpy.float64 | 可供出售金融资产 |
| hold\_to\_maturity\_investments | numpy.float64 | 持有至到期投资 |
| investment\_property | numpy.float64 | 投资性房地产 |
| longterm\_equity\_invest | numpy.float64 | 长期股权投资 |
| longterm\_receivable\_account | numpy.float64 | 长期应收款 |
| fixed\_assets | numpy.float64 | 固定资产 |
| construction\_materials | numpy.float64 | 工程物资 |
| constru\_in\_process | numpy.float64 | 在建工程 |
| fixed\_assets\_liquidation | numpy.float64 | 固定资产清理 |
| biological\_assets | numpy.float64 | 生产性生物资产 |
| oil\_gas\_assets | numpy.float64 | 油气资产 |
| intangible\_assets | numpy.float64 | 无形资产 |
| seat\_costs | numpy.float64 | 交易席位费 |
| development\_expenditure | numpy.float64 | 开发支出 |
| good\_will | numpy.float64 | 商誉 |
| long\_deferred\_expense | numpy.float64 | 长期待摊费用 |
| deferred\_tax\_assets | numpy.float64 | 递延所得税资产 |
| other\_non\_current\_assets | numpy.float64 | 其他非流动资产 |
| total\_non\_current\_assets | numpy.float64 | 非流动资产合计 |
| longterm\_loan | numpy.float64 | 长期借款 |
| bonds\_payable | numpy.float64 | 应付债券 |
| longterm\_account\_payable | numpy.float64 | 长期应付款 |
| long\_salaries\_pay | numpy.float64 | 长期应付职工薪酬 |
| specific\_account\_payable | numpy.float64 | 专项应付款 |
| estimate\_liability | numpy.float64 | 预计负债 |
| deferred\_tax\_liability | numpy.float64 | 递延所得税负债 |
| long\_defer\_income | numpy.float64 | 长期递延收益 |
| other\_non\_current\_liability | numpy.float64 | 其他非流动负债 |
| total\_non\_current\_liability | numpy.float64 | 非流动负债合计 |
| paidin\_capital | numpy.float64 | 实收资本（或股本） |
| other\_equityinstruments | numpy.float64 | 其他权益工具 |
| capital\_reserve\_fund | numpy.float64 | 资本公积 |
| surplus\_reserve\_fund | numpy.float64 | 盈余公积 |
| retained\_profit | numpy.float64 | 未分配利润 |
| treasury\_stock | numpy.float64 | 减：库存股 |
| other\_composite\_income | numpy.float64 | 其他综合收益 |
| ordinary\_risk\_reserve\_fund | numpy.float64 | 一般风险准备 |
| foreign\_currency\_report\_conv\_diff | numpy.float64 | 外币报表折算差额 |
| specific\_reserves | numpy.float64 | 专项储备 |
| se\_without\_mi | numpy.float64 | 归属母公司股东权益合计 |
| minority\_interests | numpy.float64 | 少数股东权益 |
| total\_shareholder\_equity | numpy.float64 | 所有者权益合计 |
| total\_liability\_and\_equity | numpy.float64 | 负债和权益总计 |
| total\_assets | numpy.float64 | 资产总计 |
| total\_liability | numpy.float64 | 负债总计 |
| contract\_liability | numpy.float64 | 合同负债 |
| total\_fixed\_asset | numpy.float64 | 固定资产合计 |
| t\_constru\_in\_process | numpy.float64 | 在建工程合计 |
