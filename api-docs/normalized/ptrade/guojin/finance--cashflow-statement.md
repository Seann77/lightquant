---
platform: ptrade
variant: guojin
source_role: primary
document_type: finance
title: cashflow_statement-现金流量表
section_path:
  - 财务数据
  - cashflow_statement-现金流量表
source_file: api-docs/raw/ptrade/guojin/财务数据api.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/财务数据api.html
source_anchor: "#cashflow_statement"
source_sha256: 17a731aed6d9e2e59c49534660b7779a3eb0429a60368f497b46a63933a22e4a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="cashflow_statement"></a>

## cashflow\_statement-现金流量表

### 接口说明

```python
get_fundamentals(security,'cashflow_statement',fields, date = None, start_year = None, end_year = None, report_types = None, date_type = None, merge_type = None)
```

```python

               company_type invest_cash_paid   publ_date      secu_abbr
end_date
2013-03-31            1        5.271e+08       2013-04-19      恒生电子
2014-03-31            1       3.9488e+08       2014-04-29      恒生电子
2015-03-31            1      9.92432e+08       2015-04-25      恒生电子
```

### 示例

```python
# 获取数据的两种模式
# 1. 按日期查询模式（默认以发布日期为参考时间）：返回输入日期之前对应的财务数据
# 在回测中获取单一股票中对应回测日期第一季度现金流量表中投资支付的现金
#（invest_cash_paid）数据
get_fundamentals('600570.SS','cashflow_statement','invest_cash_paid','20160628')

# 2. 按年份查询模式：返回输入年份范围内对应季度的财务数据
# 获取恒生电子(600570.SS)从2013年至2015年第一季度现金流量表中投资支付的现金#（invest_cash_paid）数据
get_fundamentals('600570.SS','cashflow_statement','invest_cash_paid',start_year='2013',end_year='2015', report_types='1')
```

### 表数据具体字段

现金流量表 - cashflow\_statement
| 字段名称 | 字段类型 | 字段说明 |
| --- | --- | --- |
| secu\_code | str | 股票代码 |
| secu\_abbr | str | 股票简称 |
| company\_type | str | 公司类型 |
| end\_date | str | 截止日期 |
| publ\_date | str | 公告日期 |
| goods\_sale\_service\_render\_cash | numpy.float64 | 销售商品、提供劳务收到的现金 |
| tax\_levy\_refund | numpy.float64 | 收到的税费返还 |
| net\_deposit\_increase | numpy.float64 | 客户存款和同业存放款项净增加额 |
| net\_borrowing\_from\_central\_bank | numpy.float64 | 向中央银行借款净增加额 |
| net\_borrowing\_from\_finance\_co | numpy.float64 | 向其他金融机构拆入资金净增加额 |
| interest\_and\_commission\_cashin | numpy.float64 | 收取利息、手续费及佣金的现金 |
| net\_deal\_trading\_assets | numpy.float64 | 处置交易性金融资产净增加额 |
| net\_buyback | numpy.float64 | 回购业务资金净增加额 |
| net\_original\_insurance\_cash | numpy.float64 | 收到原保险合同保费取得的现金 |
| net\_reinsurance\_cash | numpy.float64 | 收到再保业务现金净额 |
| net\_insurer\_deposit\_investment | numpy.float64 | 保户储金及投资款净增加额 |
| other\_cashin\_related\_operate | numpy.float64 | 收到其他与经营活动有关的现金 |
| subtotal\_operate\_cash\_inflow | numpy.float64 | 经营活动现金流入小计 |
| goods\_and\_services\_cash\_paid | numpy.float64 | 购买商品、接受劳务支付的现金 |
| staff\_behalf\_paid | numpy.float64 | 支付给职工以及为职工支付的现金 |
| all\_taxes\_paid | numpy.float64 | 支付的各项税费 |
| net\_loan\_and\_advance\_increase | numpy.float64 | 客户贷款及垫款净增加额 |
| net\_deposit\_in\_cb\_and\_ib | numpy.float64 | 存放中央银行和同业款项净增加额 |
| net\_lend\_capital | numpy.float64 | 拆出资金净增加额 |
| commission\_cash\_paid | numpy.float64 | 支付手续费及佣金的现金 |
| original\_compensation\_paid | numpy.float64 | 支付原保险合同赔付款项的现金 |
| net\_cash\_for\_reinsurance | numpy.float64 | 支付再保业务现金净额 |
| policy\_dividend\_cash\_paid | numpy.float64 | 支付保单红利的现金 |
| other\_operate\_cash\_paid | numpy.float64 | 支付其他与经营活动有关的现金 |
| subtotal\_operate\_cash\_outflow | numpy.float64 | 经营活动现金流出小计 |
| net\_operate\_cash\_flow | numpy.float64 | 经营活动产生的现金流量净额 |
| invest\_withdrawal\_cash | numpy.float64 | 收回投资收到的现金 |
| invest\_proceeds | numpy.float64 | 取得投资收益收到的现金 |
| fix\_intan\_other\_asset\_dispo\_cash | numpy.float64 | 处置固定资产、无形资产和其他长期资产收回的现金净额 |
| net\_cash\_deal\_sub\_company | numpy.float64 | 处置子公司及其他营业单位收到的现金净额 |
| other\_cash\_from\_invest\_act | numpy.float64 | 收到其他与投资活动有关的现金 |
| subtotal\_invest\_cash\_inflow | numpy.float64 | 投资活动现金流入小计 |
| fix\_intan\_other\_asset\_acqui\_cash | numpy.float64 | 购建固定资产、无形资产和其他长期资产支付的现金 |
| invest\_cash\_paid | numpy.float64 | 投资支付的现金 |
| net\_cash\_from\_sub\_company | numpy.float64 | 取得子公司及其他营业单位支付的现金净额 |
| impawned\_loan\_net\_increase | numpy.float64 | 质押贷款净增加额 |
| other\_cash\_to\_invest\_act | numpy.float64 | 支付其他与投资活动有关的现金 |
| subtotal\_invest\_cash\_outflow | numpy.float64 | 投资活动现金流出小计 |
| net\_invest\_cash\_flow | numpy.float64 | 投资活动产生的现金流量净额 |
| cash\_from\_invest | numpy.float64 | 吸收投资收到的现金 |
| cash\_from\_bonds\_issue | numpy.float64 | 发行债券收到的现金 |
| cash\_from\_borrowing | numpy.float64 | 取得借款收到的现金 |
| other\_finance\_act\_cash | numpy.float64 | 收到其他与筹资活动有关的现金 |
| subtotal\_finance\_cash\_inflow | numpy.float64 | 筹资活动现金流入小计 |
| borrowing\_repayment | numpy.float64 | 偿还债务支付的现金 |
| dividend\_interest\_payment | numpy.float64 | 分配股利、利润或偿付利息支付的现金 |
| other\_finance\_act\_payment | numpy.float64 | 支付其他与筹资活动有关的现金 |
| subtotal\_finance\_cash\_outflow | numpy.float64 | 筹资活动现金流出小计 |
| net\_finance\_cash\_flow | numpy.float64 | 筹资活动产生的现金流量净额 |
| exchan\_rate\_change\_effect | numpy.float64 | 汇率变动对现金及现金等价物的影响 |
| cash\_equivalent\_increase | numpy.float64 | 现金及现金等价物净增加额 |
| begin\_period\_cash | numpy.float64 | 加：期初现金及现金等价物余额 |
| end\_period\_cash\_equivalent | numpy.float64 | 期末现金及现金等价物余额 |
| net\_profit | numpy.float64 | 净利润 |
| minority\_profit | numpy.float64 | 加:少数股东损益 |
| assets\_depreciation\_reserves | numpy.float64 | 加:资产减值准备 |
| fixed\_asset\_depreciation | numpy.float64 | 固定资产折旧 |
| intangible\_asset\_amortization | numpy.float64 | 收无形资产摊销 |
| deferred\_expense\_amort | numpy.float64 | 长期待摊费用摊销 |
| deferred\_expense\_decreased | numpy.float64 | 待摊费用减少(减:增加) |
| accrued\_expense\_added | numpy.float64 | 预提费用增加(减:减少) |
| fix\_intanther\_asset\_dispo\_loss | numpy.float64 | 处置固定资产、无形资产和其他长期资产的损失 |
| fixed\_asset\_scrap\_loss | numpy.float64 | 固定资产报废损失 |
| loss\_from\_fair\_value\_changes | numpy.float64 | 公允价值变动损失 |
| financial\_expense | numpy.float64 | 财务费用 |
| invest\_loss | numpy.float64 | 投资损失 |
| defered\_tax\_asset\_decrease | numpy.float64 | 递延所得税资产减少 |
| defered\_tax\_liability\_increase | numpy.float64 | 递延所得税负债增加 |
| inventory\_decrease | numpy.float64 | 存货的减少 |
| operate\_receivable\_decrease | numpy.float64 | 经营性应收项目的减少 |
| operate\_payable\_increase | numpy.float64 | 经营性应付项目的增加 |
| others | numpy.float64 | 其他 |
| net\_operate\_cash\_flow\_notes | numpy.float64 | 经营活动产生的现金流量净额 |
| debt\_to\_captical | numpy.float64 | 债务转为资本 |
| cbs\_expiring\_within\_one\_year | numpy.float64 | 一年内到期的可转换公司债券 |
| fixed\_assets\_finance\_leases | numpy.float64 | 融资租入固定资产 |
| cash\_at\_end\_of\_year | numpy.float64 | 现金的期末余额 |
| cash\_at\_beginning\_of\_year | numpy.float64 | 减:现金的期初余额 |
| cash\_equivalents\_at\_end\_of\_year | numpy.float64 | 加:现金等价物的期末余额 |
| cash\_equivalents\_at\_beginning | numpy.float64 | 减:现金等价物的期初余额 |
| net\_incr\_in\_cash\_and\_equivalents | numpy.float64 | 现金及现金等价物净增加额 |
