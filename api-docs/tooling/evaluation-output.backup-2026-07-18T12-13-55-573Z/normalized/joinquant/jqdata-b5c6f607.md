---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 因子数据（含新接口）
section_path:
  - JQData使用说明
  - 因子数据（含新接口）
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#因子数据（含新接口）"
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="因子数据（含新接口）"></a>

## 因子数据（含新接口）

<a id="聚宽因子库"></a>

### 聚宽因子库

-   **更新时间：2005年至今，下一自然日5:00、8:00更新**
-   **复权方式：后复权**

方法 描述

get\_factor\_values 因子值

**参数**

-   securities:股票池，单只股票（字符串）或一个股票列表
-   factors: 因子名称，单个因子（字符串）或一个因子列表
-   start\_date:开始日期，字符串或 datetime 对象，与 coun t参数二选一
-   end\_date: 结束日期， 字符串或 datetime 对象，可以与 start\_date 或 count 配合使用
-   count: 截止 end\_date 之前交易日的数量（含 end\_date 当日），与 start\_date 参数二选一

**返回**

-   一个 dict： key 是因子名称， value 是 pandas.dataframe。

-   dataframe 的 index 是日期， column 是股票代码， value 是因子值

-   注：1.为保证数据的连续性，所有数据基于后复权计算

    ​ 2.为了防止单次返回数据时间过长，每次调用 api 请求的因子值不能超过 200000 个


**购买** 用户如有需要使用聚宽因子的，请联系我们的运营同事。**个人用户咨询【邮箱：sunping@joinquant.com】，机构服务咨询添加微信号JQData02**

**示例**

get\_all\_factors 聚宽因子库中所有的因子

描述：获取聚宽因子库中所有的因子code和因子名称

**参数**：无

**返回**：pandas.DataFrame，

-   factor:因子code
-   factor\_intro:因子说明
-   category:因子分类名称
-   category\_intro:因子分类说明

**示例**：

get\_factor\_effect 单因子分层回测函数

**单因子分层回测函数**是为了检测单个因子的选股收益效果而设计。指定股票池，根据因子值从小到大将股票池等分成几组，按照一定的调仓周期进行交易，从而得到各个股票组合从开始交易至各个调仓周期结束日期的累计收益，最后从各组股票的收益情况来判断因子的选股效果。

**输入参数：**

| 参数 | 名称 | 说明 |
| --- | --- | --- |
| security | 指数代码（如传入沪深300指数：000300.XSHG） | 指数的成分股作为基础股票池 |
| start\_date | 开始交易日期 |  |
| end\_date | 结束交易日期 |  |
| period | 调仓周期，传入'XD'，'XW'，'XM'，分别代表按X个交易日调仓，按X周调仓，按X月调仓。 | D代表交易日，W代表自然周，M代表自然月 |
| factor | 因子库的因子名称，如传入营业收入TTM：'operating\_revenue\_ttm' |  |
| group\_num | 股票分组数，默认5组 | 每次调仓根据股票池中各个股票的因子值，按照从小到大排序，然后等分成group\_num个股票组合 |

**返回结果：**

返回DataFrame结果：输出从开始日期到各个调仓周期结束日期的累计收益

**示例：**

因子列表 因子列表

**说明：**

-   在单因子分析中可以直接获取因子库中的数据
-   同时也可以通过API的形式，在其他模块中获取这些因子
-   为保证数据的连续性，所有数据基于**后复权**计算
-   涉及到财务数据的因子，使用季报数据进行计算
-   为了防止单次返回数据时间过长，每次调用 api 请求的因子值不能超过 200000 个
-   频率为天，每天05：00更新前一天数据
-   提供股票的因子数据，不支持期货、指数等
-   因子库中nan值：缺少依赖数据;财务数据中如果标的未披露相关字段,依赖数据不完整的话会返回nan值,请注意到财务报表披露规则变更,标的报表披露形式(金融类,非金融类等) , 以及标的上市时间等
-   有关因子处理：仅风格因子有进行去极值及标准化的处理(风格因子的基础因子为原始因子)

**基础因子**

| 因子 code | 因子名称 | 计算方法 |
| --- | --- | --- |
| net\_working\_capital | 净运营资本 | 流动资产 － 流动负债 |
| total\_operating\_revenue\_ttm | 营业总收入TTM | 计算过去12个月的 营业总收入 之和 |
| operating\_profit\_ttm | 营业利润TTM | 计算过去12个月 营业利润 之和 |
| net\_operate\_cash\_flow\_ttm | 经营活动现金流量净额TTM | 计算过去12个月 经营活动产生的现金流量净值 之和 |
| operating\_revenue\_ttm | 营业收入TTM | 计算过去12个月的 营业收入 之和 |
| interest\_carry\_current\_liability | 带息流动负债 | 流动负债合计 - 无息流动负债 |
| sale\_expense\_ttm | 销售费用TTM | 计算过去12个月 销售费用 之和 |
| retained\_earnings | 留存收益 | 盈余公积金+未分配利润 |
| total\_operating\_cost\_ttm | 营业总成本TTM | 计算过去12个月的 营业总成本 之和 |
| non\_operating\_net\_profit\_ttm | 营业外收支净额TTM | 营业外收入（TTM） - 营业外支出（TTM） |
| net\_invest\_cash\_flow\_ttm | 投资活动现金流量净额TTM | 计算过去12个月 投资活动现金流量净额 之和 |
| financial\_expense\_ttm | 财务费用TTM | 计算过去12个月 财务费用 之和 |
| administration\_expense\_ttm | 管理费用TTM | 计算过去12个月 管理费用 之和 |
| net\_interest\_expense | 净利息费用 | 利息支出-利息收入 |
| value\_change\_profit\_ttm | 价值变动净收益TTM | 计算过去12个月 价值变动净收益 之和 |
| total\_profit\_ttm | 利润总额TTM | 计算过去12个月 利润总额 之和 |
| net\_finance\_cash\_flow\_ttm | 筹资活动现金流量净额TTM | 计算过去12个月 筹资活动现金流量净额 之和 |
| interest\_free\_current\_liability | 无息流动负债 | 应付票据+应付账款+预收账款(用 预售款项 代替)+应交税费+应付利息+其他应付款+其他流动负债 |
| EBIT | 息税前利润 | 净利润+所得税+财务费用 |
| net\_profit\_ttm | 净利润TTM | 计算过去12个月 净利润 之和 |
| OperateNetIncome | 经营活动净收益 | 经营活动净收益/利润总额(%) \* 利润总额 |
| EBITDA | 息税折旧摊销前利润（报告期） | 一般企业：（营业总收入-营业税金及附加）-（营业成本+利息支出+手续费及佣金支出+销售费用+管理费用+研发费用+资产减值损失）+（固定资产折旧、油气资产折耗、生产性生物资产折旧）+无形资产摊销+长期待摊费用摊销;银行业：（营业总收入-营业税金及附加）-（营业成本+管理费用+资产减值损失）+（固定资产折旧、油气资产折耗、生产性生物资产折旧+无形资产摊销+长期待摊费用摊销）+无形资产摊销+长期待摊费用摊销 |
| asset\_impairment\_loss\_ttm | 资产减值损失TTM | 计算过去12个月 资产减值损失 之和 |
| np\_parent\_company\_owners\_ttm | 归属于母公司股东的净利润TTM | 计算过去12个月 归属于母公司股东的净利润 之和 |
| operating\_cost\_ttm | 营业成本TTM | 计算过去12个月的 营业成本 之和 |
| net\_debt | 净债务 | 总债务-期末现金及现金等价物余额 |
| non\_recurring\_gain\_loss | 非经常性损益 | 归属于母公司股东的净利润-扣除非经常损益后的净利润(元) |
| goods\_sale\_and\_service\_render\_cash\_ttm | 销售商品提供劳务收到的现金 | 计算过去12个月 销售商品提供劳务收到的现金 之和 |
| market\_cap | 市值 | 市值 |
| cash\_flow\_to\_price\_ratio | 现金流市值比 | 1 / pcf\_ratio (ttm) |
| sales\_to\_price\_ratio | 营收市值比 | 1 / ps\_ratio (ttm) |
| circulating\_market\_cap | 流通市值 | 流通市值 |
| operating\_assets | 经营性资产 | 总资产 - 金融资产 |
| financial\_assets | 金融资产 | 货币资金 + 交易性金融资产 + 应收票据 + 应收利息 + 应收股利 + 可供出售金融资产 + 持有至到期投资 |
| operating\_liability | 经营性负债 | 总负债 - 金融负债 |
| financial\_liability | 金融负债 | (流动负债合计-无息流动负债)+(有息非流动负债)=(流动负债合计-应付账款-预收款项-应付职工薪酬-应交税费-其他应付款-一年内的递延收益-其它流动负债)+(长期借款+应付债券) |

**质量因子**

| 因子 code | 因子名称 | 计算方法 |
| --- | --- | --- |
| net\_profit\_to\_total\_operate\_revenue\_ttm | 净利润与营业总收入之比 | 净利润与营业总收入之比=净利润（TTM）/营业总收入（TTM） |
| cfo\_to\_ev | 经营活动产生的现金流量净额与企业价值之比TTM | 经营活动产生的现金流量净额TTM / 企业价值。其中，企业价值=司市值+负债合计-货币资金 |
| accounts\_payable\_turnover\_days | 应付账款周转天数 | 应付账款周转天数 = 360 / 应付账款周转率 |
| net\_profit\_ratio | 销售净利率 | 售净利率=净利润（TTM）/营业收入（TTM） |
| net\_non\_operating\_income\_to\_total\_profit | 营业外收支利润净额/利润总额 | 营业外收支利润净额/利润总额 |
| fixed\_asset\_ratio | 固定资产比率 | 固定资产比率=(固定资产+工程物资+在建工程)/总资产 |
| account\_receivable\_turnover\_days | 应收账款周转天数 | 应收账款周转天数=360/应收账款周转率 |
| DEGM | 毛利率增长 | 毛利率增长=(今年毛利率（TTM）/去年毛利率（TTM）)-1 |
| sale\_expense\_to\_operating\_revenue | 营业费用与营业总收入之比 | 营业费用与营业总收入之比=销售费用（TTM）/营业总收入（TTM） |
| operating\_tax\_to\_operating\_revenue\_ratio\_ttm | 销售税金率 | 销售税金率=营业税金及附加（TTM）/营业收入（TTM） |
| inventory\_turnover\_days | 存货周转天数 | 存货周转天数=360/存货周转率 |
| OperatingCycle | 营业周期 | 应收账款周转天数+存货周转天数 |
| net\_operate\_cash\_flow\_to\_operate\_income | 经营活动产生的现金流量净额与经营活动净收益之比 | 经营活动产生的现金流量净额（TTM）/(营业总收入（TTM）-营业总成本（TTM） |
| net\_operating\_cash\_flow\_coverage | 净利润现金含量 | 经营活动产生的现金流量净额/归属于母公司所有者的净利润 |
| quick\_ratio | 速动比率 | 速动比率=(流动资产合计-存货)/ 流动负债合计 |
| intangible\_asset\_ratio | 无形资产比率 | 无形资产比率=(无形资产+研发支出+商誉)/总资产 |
| MLEV | 市场杠杆 | 市场杠杆=非流动负债合计/(非流动负债合计+总市值) |
| debt\_to\_equity\_ratio | 产权比率 | 产权比率=负债合计/归属母公司所有者权益合计 |
| super\_quick\_ratio | 超速动比率 | （货币资金+交易性金融资产+应收票据+应收帐款+其他应收款）／流动负债合计 |
| inventory\_turnover\_rate | 存货周转率 | 存货周转率=营业成本（TTM）/存货 |
| operating\_profit\_growth\_rate | 营业利润增长率 | 营业利润增长率=(今年营业利润（TTM）/去年营业利润（TTM）)-1 |
| long\_debt\_to\_working\_capital\_ratio | 长期负债与营运资金比率 | 长期负债与营运资金比率=非流动负债合计/(流动资产合计-流动负债合计) |
| current\_ratio | 流动比率(单季度) | 流动比率=流动资产合计/流动负债合计 |
| net\_operate\_cash\_flow\_to\_net\_debt | 经营活动产生现金流量净额/净债务 | 经营活动产生现金流量净额/净债务 |
| net\_operate\_cash\_flow\_to\_asset | 总资产现金回收率 | 经营活动产生的现金流量净额(ttm) / 总资产 |
| non\_current\_asset\_ratio | 非流动资产比率 | 非流动资产比率=非流动资产合计/总资产 |
| total\_asset\_turnover\_rate | 总资产周转率 | 总资产周转率=营业收入(ttm)/总资产 |
| long\_debt\_to\_asset\_ratio | 长期借款与资产总计之比 | 长期借款与资产总计之比=长期借款/总资产 |
| debt\_to\_tangible\_equity\_ratio | 有形净值债务率 | 负债合计/有形净值 其中有形净值=股东权益-无形资产净值，无形资产净值= 商誉+无形资产 |
| ROAEBITTTM | 总资产报酬率 | （利润总额（TTM）+利息支出（TTM）） / 总资产在过去12个月的平均 |
| operating\_profit\_ratio | 营业利润率 | 营业利润率=营业利润（TTM）/营业收入（TTM） |
| long\_term\_debt\_to\_asset\_ratio | 长期负债与资产总计之比 | 长期负债与资产总计之比=非流动负债合计/总资产 |
| current\_asset\_turnover\_rate | 流动资产周转率TTM | 过去12个月的营业收入/过去12个月的平均流动资产合计 |
| financial\_expense\_rate | 财务费用与营业总收入之比 | 财务费用（TTM） / 营业总收入（TTM） |
| operating\_profit\_to\_total\_profit | 经营活动净收益/利润总额 | 经营活动净收益/利润总额 |
| debt\_to\_asset\_ratio | 债务总资产比 | 债务总资产比=负债合计/总资产 |
| equity\_to\_fixed\_asset\_ratio | 股东权益与固定资产比率 | 股东权益与固定资产比率=股东权益/(固定资产+工程物资+在建工程) |
| net\_operate\_cash\_flow\_to\_total\_liability | 经营活动产生的现金流量净额/负债合计 | 经营活动产生的现金流量净额/负债合计 |
| cash\_rate\_of\_sales | 经营活动产生的现金流量净额与营业收入之比 | 经营活动产生的现金流量净额（TTM） / 营业收入（TTM） |
| operating\_profit\_to\_operating\_revenue | 营业利润与营业总收入之比 | 营业利润与营业总收入之比=营业利润（TTM）/营业总收入（TTM） |
| roa\_ttm | 资产回报率TTM | 资产回报率=净利润（TTM）/期末总资产 |
| admin\_expense\_rate | 管理费用与营业总收入之比 | 管理费用与营业总收入之比=管理费用（TTM）/营业总收入（TTM） |
| fixed\_assets\_turnover\_rate | 固定资产周转率 | 等于过去12个月的营业收入/过去12个月的平均（固定资产+工程物资+在建工程） |
| invest\_income\_associates\_to\_total\_profit | 对联营和合营公司投资收益/利润总额 | 对联营和营公司投资收益/利润总额 |
| equity\_to\_asset\_ratio | 股东权益比率 | 股东权益比率=股东权益/总资产 |
| goods\_service\_cash\_to\_operating\_revenue\_ttm | 销售商品提供劳务收到的现金与营业收入之比 | 销售商品提供劳务收到的现金与营业收入之比=销售商品和提供劳务收到的现金（TTM）/营业收入（TTM） |
| cash\_to\_current\_liability | 现金比率 | 期末现金及现金等价物余额/流动负债合计的12个月均值 |
| net\_operate\_cash\_flow\_to\_total\_current\_liability | 现金流动负债比 | 现金流动负债比=经营活动产生的现金流量净额（TTM）/流动负债合计 |
| ACCA | 现金流资产比和资产回报率之差 | 现金流资产比-资产回报率,其中现金流资产比=经营活动产生的现金流量净额/总资产 |
| roe\_ttm | 权益回报率TTM | 权益回报率=净利润（TTM）/期末股东权益 |
| accounts\_payable\_turnover\_rate | 应付账款周转率 | TTM(营业成本,0)/（AvgQ(应付账款,4,0) + AvgQ(应付票据,4,0) + AvgQ(预付款项,4,0) ） |
| gross\_income\_ratio | 销售毛利率 | 销售毛利率=(营业收入（TTM）-营业成本（TTM）)/营业收入（TTM） |
| adjusted\_profit\_to\_total\_profit | 扣除非经常损益后的净利润/利润总额 | 扣除非经常损益后的净利润/利润总额 |
| account\_receivable\_turnover\_rate | 应收账款周转率 | 即，TTM(营业收入,0)/（AvgQ(应收账款,4,0) + AvgQ(应收票据,4,0) + AvgQ(预收账款,4,0) ） |
| equity\_turnover\_rate | 股东权益周转率 | 股东权益周转率=营业收入(ttm)/股东权益 |
| total\_profit\_to\_cost\_ratio | 成本费用利润率 | 成本费用利润率=利润总额/(营业成本+财务费用+销售费用+管理费用)，以上科目使用的都是TTM的数值 |
| operating\_cost\_to\_operating\_revenue\_ratio | 销售成本率 | 销售成本率=营业成本（TTM）/营业收入（TTM） |
| LVGI | 财务杠杆指数 | 本期(年报)资产负债率/上期(年报)资产负债率 |
| SGI | 营业收入指数 | 本期(年报)营业收入/上期(年报)营业收入 |
| GMI | 毛利率指数 | 上期(年报)毛利率/本期(年报)毛利率 |
| DSRI | 应收账款指数 | 本期(年报)应收账款占营业收入比例/上期(年报)应收账款占营业收入比例 |
| rnoa\_ttm | 经营资产回报率TTM | 销售利润率\*经营资产周转率 |
| profit\_margin\_ttm | 销售利润率TTM | 营业利润/营业收入 |
| roe\_ttm\_8y | 长期权益回报率TTM | 8年(1+roe\_ttm)的累乘 ^ (1/8) - 1 # 至少要有近4年的数据，否则为 nan |
| asset\_turnover\_ttm | 经营资产周转率TTM | 营业收入TTM/近4个季度期末净经营性资产均值; 净经营性资产=经营资产-经营负债 |
| roic\_ttm | 投资资本回报率TTM | 权益回报率=归属于母公司股东的净利润（TTM）/ 前四个季度投资资本均值; 投资资本=股东权益+负债合计-无息流动负债-无息非流动负债; 无息流动负债=应付账款+预收款项+应付职工薪酬+应交税费+其他应付款+一年内的递延收益+其它流动负债; 无息非流动负债=非流动负债合计-长期借款-应付债券； |
| roa\_ttm\_8y | 长期资产回报率TTM | 8年(1+roa\_ttm)的乘积 ^ (1/8) - 1 # 至少要有近4年的数据，否则为 nan |
| SGAI | 销售管理费用指数 | 本期(年报)销售管理费用占营业收入的比例/上期(年报)销售管理费用占营业收入的比例 |
| DEGM\_8y | 长期毛利率增长 | 过去8年(1+DEGM)的累成 ^ (1/8) - 1 |
| maximum\_margin | 最大盈利水平 | max(margin\_stability, DEGM\_8y) |
| margin\_stability | 盈利能力稳定性 | mean(GM)/std(GM); GM 为过去8年毛利率ttm |

**成长因子**

| 因子 code | 因子名称 | 计算方法 |
| --- | --- | --- |
| operating\_revenue\_growth\_rate | 营业收入增长率 | 营业收入增长率=（今年营业收入（TTM）/去年营业收入（TTM））-1 |
| total\_asset\_growth\_rate | 总资产增长率 | 总资产 / 总资产\_4 -1 |
| net\_operate\_cashflow\_growth\_rate | 经营活动产生的现金流量净额增长率 | (今年经营活动产生的现金流量净额（TTM）/去年经营活动产生的现金流量净额（TTM）)-1 |
| total\_profit\_growth\_rate | 利润总额增长率 | 利润总额增长率=(今年利润总额（TTM）/去年利润总额（TTM）)-1 |
| np\_parent\_company\_owners\_growth\_rate | 归属母公司股东的净利润增长率 | (今年归属于母公司所有者的净利润（TTM）/去年归属于母公司所有者的净利润（TTM）)-1 |
| financing\_cash\_growth\_rate | 筹资活动产生的现金流量净额增长率 | 过去12个月的筹资现金流量净额 / 4季度前的12个月的筹资现金流量净额 - 1 |
| net\_profit\_growth\_rate | 净利润增长率 | 净利润增长率=(今年净利润（TTM）/去年净利润（TTM）)-1 |
| net\_asset\_growth\_rate | 净资产增长率 | （当季的股东权益/三季度前的股东权益）-1 |
| PEG | 市盈率相对盈利增长比率 | PEG = PE / (归母公司净利润(TTM)增长率 \* 100) # 如果 PE 或 增长率为负，则为 nan |

**每股因子**

| 因子 code | 因子名称 | 计算方法 |
| --- | --- | --- |
| total\_operating\_revenue\_per\_share\_ttm | 每股营业总收入TTM | 营业总收入（TTM）除以总股本 |
| cash\_and\_equivalents\_per\_share | 每股现金及现金等价物余额 | 每股现金及现金等价物余额 |
| surplus\_reserve\_fund\_per\_share | 每股盈余公积金 | 每股盈余公积金 |
| retained\_profit\_per\_share | 每股未分配利润 | 每股未分配利润 |
| operating\_revenue\_per\_share\_ttm | 每股营业收入TTM | 营业收入（TTM）除以总股本 |
| net\_asset\_per\_share | 每股净资产 | 归属母公司所有者权益合计除以总股本 |
| total\_operating\_revenue\_per\_share | 每股营业总收入 | 每股营业总收入 |
| retained\_earnings\_per\_share | 每股留存收益 | 每股留存收益 |
| operating\_revenue\_per\_share | 每股营业收入 | 每股营业收入 |
| net\_operate\_cash\_flow\_per\_share | 每股经营活动产生的现金流量净额 | 每股经营活动产生的现金流量净额 |
| operating\_profit\_per\_share\_ttm | 每股营业利润TTM | 营业利润（TTM）除以总股本 |
| eps\_ttm | 每股收益TTM | 过去12个月归属母公司所有者的净利润（TTM）除以总股本 |
| cashflow\_per\_share\_ttm | 每股现金流量净额，根据当时日期来获取最近变更日的总股本 | 现金流量净额（TTM）除以总股本 |
| operating\_profit\_per\_share | 每股营业利润 | 每股营业利润 |
| capital\_reserve\_fund\_per\_share | 每股资本公积金 | 每股资本公积金 |

**情绪因子**

| 因子 code | 因子名称 | 计算方法 |
| --- | --- | --- |
| VROC12 | 12日量变动速率指标 | 成交量减N日前的成交量，再除以N日前的成交量，放大100倍，得到VROC值 ，n=12 |
| TVMA6 | 6日成交金额的移动平均值 | 6日成交金额的移动平均值 |
| VEMA10 | 成交量的10日指数移动平均 |  |
| VR | 成交量比率（Volume Ratio） | VR=（AVS+1/2CVS）/（BVS+1/2CVS） |
| VOL5 | 5日平均换手率 | 5日换手率的均值,单位为% |
| BR | 意愿指标 | BR=N日内（当日最高价－昨日收盘价）之和 / N日内（昨日收盘价－当日最低价）之和×100 n设定为25 |
| VEMA12 | 12日成交量的移动平均值 |  |
| TVMA20 | 20日成交金额的移动平均值 | 20日成交金额的移动平均值 |
| DAVOL5 | 5日平均换手率与120日平均换手率 | 5日平均换手率 / 120日平均换手率 |
| VDIFF | 计算VMACD因子的中间变量 | EMA(VOLUME，SHORT)-EMA(VOLUME，LONG) short设置为12，long设置为26，M设置为9 |
| WVAD | 威廉变异离散量 | (收盘价－开盘价)/(最高价－最低价)×成交量，再做加和，使用过去6个交易日的数据 |
| MAWVAD | 因子WVAD的6日均值 |  |
| VSTD10 | 10日成交量标准差 | 10日成交量标准差 |
| ATR14 | 14日均幅指标 | 真实振幅的14日移动平均 |
| VOL10 | 10日平均换手率 | 10日换手率的均值,单位为% |
| DAVOL10 | 10日平均换手率与120日平均换手率之比 | 10日平均换手率 / 120日平均换手率 |
| VDEA | 计算VMACD因子的中间变量 | EMA(VDIFF，M) short设置为12，long设置为26，M设置为9 |
| VSTD20 | 20日成交量标准差 | 20日成交量标准差 |
| ATR6 | 6日均幅指标 | 真实振幅的6日移动平均 |
| VOL20 | 20日平均换手率 | 20日换手率的均值,单位为% |
| DAVOL20 | 20日平均换手率与120日平均换手率之比 | 20日平均换手率 / 120日平均换手率 |
| VMACD | 成交量指数平滑异同移动平均线 | 快的指数移动平均线（EMA12）减去慢的指数移动平均线（EMA26）得到快线DIFF, 由DIFF的M日移动平均得到DEA，由DIFF-DEA的值得到MACD |
| AR | 人气指标 | AR=N日内（当日最高价—当日开市价）之和 / N日内（当日开市价—当日最低价）之和 \* 100，n设定为26 |
| VOL60 | 60日平均换手率 | 60日换手率的均值,单位为% |
| turnover\_volatility | 换手率相对波动率 | 取20个交易日个股换手率的标准差 |
| VOL120 | 120日平均换手率 | 120日换手率的均值,单位为% |
| VROC6 | 6日量变动速率指标 | 成交量减N日前的成交量，再除以N日前的成交量，放大100倍，得到VROC值 ，n=6 |
| TVSTD20 | 20日成交金额的标准差 | 20日成交额的标准差 |
| ARBR | ARBR | 因子 AR 与因子 BR 的差 |
| money\_flow\_20 | 20日资金流量 | 用收盘价、最高价及最低价的均值乘以当日成交量即可得到该交易日的资金流量 |
| VEMA5 | 成交量的5日指数移动平均 |  |
| VOL240 | 240日平均换手率 | 240日换手率的均值,单位为% |
| VEMA26 | 成交量的26日指数移动平均 |  |
| VOSC | 成交量震荡 | 'VEMA12'和'VEMA26'两者的差值，再求差值与'VEMA12'的比，最后将比值放大100倍，得到VOSC值 |
| TVSTD6 | 6日成交金额的标准差 | 6日成交额的标准差 |

**风险因子**

| 因子 code | 因子名称 | 计算方法 |
| --- | --- | --- |
| Variance20 | 20日年化收益方差 | 20日年化收益方差 |
| Skewness20 | 个股收益的20日偏度 | 个股收益的20日偏度 |
| Kurtosis20 | 个股收益的20日峰度 | 个股收益的20日峰度 |
| sharpe\_ratio\_20 | 20日夏普比率 | （Rp - Rf）/Sigma p 其中，Rp是个股的年化收益率，Rf是无风险利率（在这里设置为0.04），Sigma p是个股的收益波动率（标准差） |
| Variance60 | 60日年化收益方差 | 60日年化收益方差 |
| Skewness60 | 个股收益的60日偏度 | 个股收益的60日偏度 |
| Kurtosis60 | 个股收益的60日峰度 | 个股收益的60日峰度 |
| sharpe\_ratio\_60 | 60日夏普比率 | （Rp - Rf）/Sigma p 其中，Rp是个股的年化收益率，Rf是无风险利率（在这里设置为0.04），Sigma p是个股的收益波动率（标准差） |
| Variance120 | 120日年化收益方差 | 120日年化收益方差 |
| Skewness120 | 个股收益的120日偏度 | 个股收益的120日偏度 |
| Kurtosis120 | 个股收益的120日峰度 | 个股收益的120日峰度 |
| sharpe\_ratio\_120 | 120日夏普比率 | （Rp - Rf）/Sigma p 其中，Rp是个股的年化收益率，Rf是无风险利率（在这里设置为0.04），Sigma p是个股的收益波动率（标准差） |

**动量因子**

| 因子 code | 因子名称 | 计算方法 |
| --- | --- | --- |
| arron\_up\_25 | Aroon指标上轨 | Aroon(上升)=\[(计算期天数-最高价后的天数)/计算期天数\]\*100 |
| arron\_down\_25 | Aroon指标下轨 | Aroon(下降)=\[(计算期天数-最低价后的天数)/计算期天数\]\*100 |
| BBIC | BBI 动量 | BBI(3, 6, 12, 24) / 收盘价 （BBI 为常用技术指标类因子“多空均线”） |
| bear\_power | 空头力道 | (最低价-EMA(close,13)) / close |
| BIAS5 | 5日乖离率 | （收盘价-收盘价的N日简单平均）/ 收盘价的N日简单平均\*100，在此n取5 |
| BIAS10 | 10日乖离率 | （收盘价-收盘价的N日简单平均）/ 收盘价的N日简单平均\*100，在此n取10 |
| BIAS20 | 20日乖离率 | （收盘价-收盘价的N日简单平均）/ 收盘价的N日简单平均\*100，在此n取20 |
| BIAS60 | 60日乖离率 | （收盘价-收盘价的N日简单平均）/ 收盘价的N日简单平均\*100，在此n取60 |
| bull\_power | 多头力道 | (最高价-EMA(close,13)) / close |
| CCI10 | 10日顺势指标 | CCI:=(TYP-MA(TYP,N))/(0.015\*AVEDEV(TYP,N)); TYP:=(HIGH+LOW+CLOSE)/3; N:=10 |
| CCI15 | 15日顺势指标 | CCI:=(TYP-MA(TYP,N))/(0.015\*AVEDEV(TYP,N)); TYP:=(HIGH+LOW+CLOSE)/3; N:=15 |
| CCI20 | 20日顺势指标 | CCI:=(TYP-MA(TYP,N))/(0.015\*AVEDEV(TYP,N)); TYP:=(HIGH+LOW+CLOSE)/3; N:=20 |
| CCI88 | 88日顺势指标 | CCI:=(TYP-MA(TYP,N))/(0.015\*AVEDEV(TYP,N)); TYP:=(HIGH+LOW+CLOSE)/3; N:=88 |
| CR20 | CR指标 | ①中间价=1日前的最高价+最低价/2②上升值=今天的最高价-前一日的中间价（负值记0）③下跌值=前一日的中间价-今天的最低价（负值记0）④多方强度=20天的上升值的和，空方强度=20天的下跌值的和⑤CR=（多方强度÷空方强度）×100 |
| fifty\_two\_week\_close\_rank | 当前价格处于过去1年股价的位置 | 取过去的250个交易日各股的收盘价时间序列，每只股票按照从大到小排列，并找出当日所在的位置 |
| MASS | 梅斯线 | MASS(N1=9, N2=25, M=6) |
| PLRC12 | 12日收盘价格与日期线性回归系数 | 计算 12 日收盘价格，与日期序号（1-12）的线性回归系数，(close / mean(close)) = beta \* t + alpha |
| PLRC24 | 24日收盘价格与日期线性回归系数 | 计算 24 日收盘价格，与日期序号（1-24）的线性回归系数， (close / mean(close)) = beta \* t + alpha |
| PLRC6 | 6日收盘价格与日期线性回归系数 | 计算 6 日收盘价格，与日期序号（1-6）的线性回归系数，(close / mean(close)) = beta \* t + alpha |
| Price1M | 当前股价除以过去一个月股价均值再减1 | 当日收盘价 / mean(过去一个月(21天)的收盘价) -1 |
| Price3M | 当前股价除以过去三个月股价均值再减1 | 当日收盘价 / mean(过去三个月(61天)的收盘价) -1 |
| Price1Y | 当前股价除以过去一年股价均值再减1 | 当日收盘价 / mean(过去一年(250天)的收盘价) -1 |
| Rank1M | 1减去 过去一个月收益率排名与股票总数的比值 | 1-(Rank(个股20日收益) / 股票总数) |
| ROC12 | 12日变动速率（Price Rate of Change） | ①AX=今天的收盘价—12天前的收盘价②BX=12天前的收盘价③ROC=AX/BX\*100 |
| ROC120 | 120日变动速率（Price Rate of Change） | ①AX=今天的收盘价—120天前的收盘价②BX=120天前的收盘价③ROC=AX/BX\*100 |
| ROC20 | 20日变动速率（Price Rate of Change） | ①AX=今天的收盘价—20天前的收盘价②BX=20天前的收盘价③ROC=AX/BX\*100 |
| ROC6 | 6日变动速率（Price Rate of Change） | ①AX=今天的收盘价—6天前的收盘价②BX=6天前的收盘价③ROC=AX/BX\*100 |
| ROC60 | 60日变动速率（Price Rate of Change） | ①AX=今天的收盘价—60天前的收盘价②BX=60天前的收盘价③ROC=AX/BX\*100 |
| single\_day\_VPT | 单日价量趋势 | （今日收盘价 - 昨日收盘价）/ 昨日收盘价 \* 当日成交量 # (复权方法为基于当日前复权) |
| single\_day\_VPT\_12 | 单日价量趋势12均值 | MA(single\_day\_VPT, 12) |
| single\_day\_VPT\_6 | 单日价量趋势6日均值 | MA(single\_day\_VPT, 6) |
| TRIX10 | 10日终极指标TRIX | MTR=收盘价的10日指数移动平均的10日指数移动平均的10日指数移动平均;TRIX=(MTR-1日前的MTR)/1日前的MTR\*100 |
| TRIX5 | 5日终极指标TRIX | MTR=收盘价的5日指数移动平均的10日指数移动平均的5日指数移动平均;TRIX=(MTR-1日前的MTR)/1日前的MTR\*100 |
| Volume1M | 当前交易量相比过去1个月日均交易量 与过去过去20日日均收益率乘积 | 当日交易量 / 过去20日交易量MEAN \* 过去20日收益率MEAN |

**技术因子**

| 因子 code | 因子名称 | 计算方法 |
| --- | --- | --- |
| boll\_down | 下轨线（布林线）指标 | (MA(CLOSE,M)-2\*STD(CLOSE,M)) / 今日收盘价; M=20 |
| boll\_up | 上轨线（布林线）指标 | (MA(CLOSE,M)+2\*STD(CLOSE,M)) / 今日收盘价; M=20 |
| EMA5 | 5日指数移动均线 | 5日指数移动均线 / 今日收盘价 |
| EMAC10 | 10日指数移动均线 | 10日指数移动均线 / 今日收盘价 |
| EMAC12 | 12日指数移动均线 | 12日指数移动均线 / 今日收盘价 |
| EMAC20 | 20日指数移动均线 | 20日指数移动均线 / 今日收盘价 |
| EMAC26 | 26日指数移动均线 | 26日指数移动均线 / 今日收盘价 |
| EMAC120 | 120日指数移动均线 | 120日指数移动均线 / 今日收盘价 |
| MAC5 | 5日移动均线 | 5日移动均线 / 今日收盘价 |
| MAC10 | 10日移动均线 | 10日移动均线 / 今日收盘价 |
| MAC20 | 20日移动均线 | 20日移动均线 / 今日收盘价 |
| MAC60 | 60日移动均线 | 60日移动均线 / 今日收盘价 |
| MAC120 | 120日移动均线 | 120日移动均线 / 今日收盘价 |
| MACDC | 平滑异同移动平均线 | MACD(SHORT=12, LONG=26, MID=9) / 今日收盘价 |
| MFI14 | 资金流量指标 | ①求得典型价格（当日最高价，最低价和收盘价的均值）②根据典型价格高低判定正负向资金流（资金流=典型价格\*成交量）③计算MR= 正向/负向 ④MFI=100-100/（1+MR） |

**风格因子**

进行了去极值和标准化的处理

| 因子 code | 因子名称 | 简介 |
| --- | --- | --- |
| size | 市值 | 捕捉大盘股和小盘股之间的收益差异 |
| beta | 贝塔 | 表征股票相对于市场的波动敏感度 |
| momentum | 动量 | 描述了过去两年里相对强势的股票与弱势股票之间的差异 |
| residual\_volatility | 残差波动率 | 解释了剥离了市场风险后的波动率高低产生的收益率差异 |
| non\_linear\_size | 非线性市值 | 描述了无法由规模因子解释的但与规模有关的收益差异，通常代表中盘股 |
| book\_to\_price\_ratio | 账面市值比 | 描述了股票估值高低不同而产生的收益差异, 即价值因子 |
| liquidity | 流动性 | 解释了由股票相对的交易活跃度不同而产生的收益率差异 |
| earnings\_yield | 盈利能力 | 描述了由盈利收益导致的收益差异 |
| growth | 成长 | 描述了对销售或盈利增长预期不同而产生的收益差异 |
| leverage | 杠杆 | 描述了高杠杆股票与低杠杆股票之间的收益差异 |

除了上面的风格因子，在计算风格因子过程中的描述因子daily\_standard\_deviation、cumulative\_range等也可以通过get\_factor\_values、get\_all\_factors以及get\_factor\_kanban\_values获取；描述因子是原始值，没有进行数据处理。

#### 风格因子计算说明

-   市值因子 size

    -   定义：1•natural\_log\_of\_market\_cap
    -   解释
        -   对数市值 natural\_log\_of\_market\_cap：公司的总市值的自然对数。
-   贝塔因子 beta

    -   定义：1•raw\_beta
    -   解释
        -   raw\_beta：CAPM 模型中的β，过去252个交易日股票的收益与市场收益（全A股票收益按流通市值加权）进行时间序列指数加权回归后的斜率系数。指数加权的半衰期为63个交易日。 停牌股票收益率为0，股票上市需超过21个交易日，否则beta为nan。
-   动量因子 momentum

    -   定义：1•relative\_strength
    -   解释
        -   相对强弱 relative\_strength：滞后21个交易日的过去504个交易日股票超额对数收益率的指数加权之和。其中指数权重半衰期为126个交易日。停牌股票收益率为0，上市之前收益率为nan。
-   残差波动率因子 residual\_volatility

    -   定义：0.74•daily\_standard\_deviation + 0.16•cumulative\_range + 0.10•historical\_sigma
    -   解释
        -   日收益率标准差 daily\_standard\_deviation：日标准差，过去252日的超额收益的指数加权标准差，以42个交易日为半衰期。
        -   收益离差 cumulative\_range：过去12个月中月收益率（以21个交易日为一个月）的最大值和最小值之间的差异。股票需上市需超过6个月，否则结果为nan。
        -   残差历史波动率 historical\_sigma：计算beta时的回归残差项的过去252个交易日的标准差。股票上市需超过21个交易日，否则结果为nan。
        -   用 daily\_standard\_deviation、cumulative\_range、historical\_sigma 加权求和得到的 residual\_volatility，之后 关于 beta 和 size 因子做正交化以消除共线性。
-   非线性市值因子 non\_linear\_size

    -   定义：1•cube\_of\_size
    -   解释
        -   市值立方因子 cube\_of\_size：首先对标准化后的市值因子size暴露值求立方，将得到的结果与市值进行加权回归的正交化处理。
-   账面市值比因子 book\_to\_price\_ratio

    -   定义：book\_to\_price\_ratio
    -   解释
        -   最新一季财报的账面价值与当前市值的比值（pb\_ratio的倒数）。其中小于0的值设置为nan。
-   流动性因子 liquidity

    -   定义：0.35•share\_turnover\_monthly + 0.35•average\_share\_turnover\_quarterly + 0.3•average\_share\_turnover\_annual
    -   解释
        -   月换手率 share\_turnover\_monthly：股票一个月换手率，过去21日的股票换手率之和的对数。股票需上市超过1个月，否则结果为nan。
        -   季度平均平均月换手率 average\_share\_turnover\_quarterly：过去3个月平均换手率，计算过去3个月的平均share\_turnover\_monthly，并取对数。股票需上市超过3个月，否则结果为nan。
        -   年度平均月换手率 average\_share\_turnover\_annual：过去12个月平均换手率，计算过去12个月的平均share\_turnover\_monthly，并取对数。股票需上市超过12个月，否则结果为nan。
        -   用 share\_turnover\_monthly、average\_share\_turnover\_quarterly、average\_share\_turnover\_annual 加权求和得到的 liquidity 关于对数市值做正交化以消除共线性。
-   盈利能力因子 earnings\_yield

    -   定义：0.68•predicted\_earnings\_to\_price\_ratio + 0.21•cash\_earnings\_to\_price\_ratio + 0.11•earnings\_to\_price\_ratio
    -   解释
        -   预期利润市值比 predicted\_earnings\_to\_price\_ratio：用未来12个月的净利预测值除以当前市值。
        -   现金流量市值比 cash\_earnings\_to\_price\_ratio：过去12个月的净经营现金流除以当前股票市值。
        -   利润市值比 earnings\_to\_price\_ratio：过去12个月的归母净利润除以当前股票市值。
-   成长因子 growth

    -   定义：0.18•long\_term\_predicted\_earnings\_growth + 0.11•short\_term\_predicted\_earnings\_growth + 0.24•earnings\_growth + 0.47•sales\_growth
    -   解释
        -   预期长期盈利增长率 long\_term\_predicted\_earnings\_growth：未来三年净利润分析师一致预期相对于净利润(不含少数股东损益)最新年报值的平均增长率。一个分析师预测的股票值为nan。
        -   预期短期盈利增长率 short\_term\_predicted\_earnings\_growth：未来一年净利润分析师一致预期相对于净利润(不含少数股东损益)最新年报值的平均增长率，只有一个分析师预测的股票值为nan。
        -   5年盈利增长率 earnings\_growth：盈利增长率，过去5年的基本每股收益（basic\_eps）关于\[0,1,2,3,4\]回归的斜率系数，然后再除以过去 5 年基本每股收益的均值的绝对值。
        -   5年营业收入增长率 sales\_growth：营收增长率，过去 5 年每股营业收入关于\[0,1,2,3,4\]回归的斜率系数，然后再除以过去 5 年每股营业收入的均值的绝对值。对于保险行业的股票，使用“已赚保费”代替“销售收入”计算每股营业收入，对于银行业的股票，sales\_growth为nan。
        -   earnings\_growth和sales\_growth至少需要有4年的财务数据，否则为nan。
-   杠杆因子 leverage

    -   定义：0.38•market\_leverage + 0.35•debt\_to\_assets + 0.27•book\_leverage
    -   解释
        -   市场杠杆 market\_leverage：(当前的普通股市值+优先股账面价值+长期债务账面价值)/当前的普通股市值。
        -   资产负债比 debt\_to\_assets：总负债的账面价值/总资产的账面价值。
        -   账面杠杆 book\_leverage：(普通股账面价値+优先股账面价值+长期债务账面价值)/普通股账面价值。账面杠杆需在0到100之间，否则结果为nan。

<a id="-1"></a>

#### 风格因子数据处理说明

对描述因子和风格因子的数据分别进行正规化的处理，步骤如下：

-   对描述因子分别进行去极值和标准化
    去极值为将2.5倍标准差之外的值，赋值成2.5倍标准差的边界值
    标准化为市值加权标准化
    x=(x- mean(x))/(std(x))
    其中，均值的计算使用股票的市值加权，标准差为正常标准差。
-   对描述因子按照权重加权求和
    按照公式给出的权重对描述因子加权求和。如果某个因子的值为nan，则对不为nan的因子加权求和，同时权重重新归一化；如果所有因子都为nan，则结果为nan。
-   对风格因子市值加权标准化
-   缺失值填充
    按照聚宽一级行业分行业，以不缺失的股票因子值相对于市值的对数进行回归，对缺失值进行填充
-   对风格因子去极值，去极值方法同上面去极值描述

**行业因子**

[点击链接跳转了解**行业因子**详细内容](https://www.joinquant.com/help/api/help?name=JQData#factor_values%3A%E8%A1%8C%E4%B8%9A%E5%9B%A0%E5%AD%90)

<a id="ALPHA特色因子"></a>

### ALPHA特色因子

-   **更新时间：2005至今，次日08:00更新**
-   **复权方式：动态前复权**

方法 描述

Alpha 101 因子 Alpha 101 因子

**因子来源：** 根据 WorldQuant LLC 发表的论文 [*101 Formulaic Alphas*](https://arxiv.org/ftp/arxiv/papers/1601/1601.00991.pdf) 中给出的 101 个 Alphas 因子公式，我们将公式编写成了函数，并计算出自2005年以来的动态前复权因子值，方便大家使用。

**详细介绍：** 函数计算公式、API 调用方法，输入输出值详情请见:[数据 - Alpha 101](https://www.joinquant.com/data/dict/alpha101).

**购买**：用户如有需要使用Alpha101和Alpha191因子的，请联系我们的运营同事。**个人用户咨询【邮箱：sunping@joinquant.com】，机构服务咨询添加微信号JQData02**

**使用方法：**

Alpha 191 因子 Alpha 191 因子

**因子来源：** 根据国泰君安数量化专题研究报告 - [基于短周期价量特征的多因子选股体系](http://vdisk.weibo.com/s/uEfe2futCdyJ9)给出了 191 个短周期交易型阿尔法因子。为了方便用户快速调用，我们将所有Alpha191因子基于股票的动态前复权价格做了完整的计算。

**详细介绍：** 函数计算公式、API 调用方法，输入输出值详情请见:[数据 - Alpha 191](https://www.joinquant.com/data/dict/alpha191).

**使用方法（以Alpha001因子为例）：**

**输入:**

-   code：股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期；数据类型为str或者datetime.date

-   fq: 复权选项:只支持 'pre', 动态前复权（所有Alpha191因子基于股票的动态复权价格已经做了完整的计算。）


**输出:**

-   输出一个 Series：index 为成分股代码，values 为对应的因子值
-   注意：当Alpha因子的返回结果为-999999999999或+999999999999时，代表该因子值的计算结果为负无穷或正无穷。在Excel中打开会显示成1E+12或1E-12.

**因子公式:**

-   (-1 \* CORR(RANK(DELTA(LOG(VOLUME),1)),RANK(((CLOSE-OPEN)/OPEN)),6)

**示例:**

<a id="技术分析指标"></a>

### 技术分析指标

-   **复权方式：持设置复权基准日（fq\_ref\_date 参数）, 实时计算**

方法 描述

技术指标 技术分析指标

**详细介绍：**函数计算公式、API 调用方法，用法注释， 输入输出值详情请见:[数据 - 技术分析指标](https://www.joinquant.com/help/api/help?name=JQData#name%3Atechnicalanalysis).

**购买**：用户如有需要使用技术指标因子的，请联系我们的运营同事。**个人用户咨询【邮箱：sunping@joinquant.com】，机构服务咨询添加微信号JQData02**

**示例：**

<a id="因子看板及风格因子等（新）"></a>

### 因子看板及风格因子等（新）

提供因子看板及风格因子归因数据

<a id="因子看板数据"></a>

#### 因子看板数据

-   **更新时间：2005至今，9:00更新前一交易日**
-   点击跳转[因子看板](https://www.joinquant.com/view/factorlib/list)


方法 描述

get\_factor\_kanban\_values 获取因子看板列表数据

\*\*参数\*\* - universe：股票池 - 'hs300': 沪深300 - 'zz500': 中证500 - 'zz800': 中证800 - bt\_cycle：测试周期 - 'month\_3'：近三个月 - 'year\_1'：近一年 - year\_3'：近三年 - year\_10'：近十年 - model：组合构建模型 - 'long\_only'：纯多头组合 - 'long\_short'：多空组合 - category：分类，具体见\[聚宽因子库\](https://www.joinquant.com/help/api/help#name:factor\_values) - 'quality': 质量类 - 'basics': 基础类 - 'emotion': 情绪类 - 'growth': 成长类 - 'risk': 风险类 - 'pershare': 每股类 - 'style': 风险因子 - 风格因子 - 'technical': 技术类 - 'momentum': 动量类 - skip\_paused: 过滤涨停及停牌股 - False: 否 - True: 是 - commision\_slippage: 手续费及滑点 - 0: 无 - 1: 3‱佣金+1‰印花税+无滑点 - 2: 3‱佣金+1‰印花税+1‰滑点 \*\*返回\*\* pandas.DataFrame 针对 \[model - 组合构建模型\]选择的不同，返回的结构有所差异 一、long\_only - 纯多头组合 - index：自然增长的数字，从0开始，无意义 - column： - date：数据的更新日期，因子的收益需要下一交易日才可得到 ,因此实际数据的时间比date晚一天(T日收盘后的因子收益需要T+1的收盘价才可得出，数据需要在T+2日凌晨3点计算之后才可得到) - universe: 股票池 - bt\_cycle: 测试周期 - skip\_paused: 过滤涨停及停牌股 - commision\_slippage: 手续费及滑点 - category: 因子分类 - code：因子代码 - compound\_return\_1q：一分位数累积收益 - compound\_return\_5q：五分位数累积收益 - annualized\_return\_1q：一分位数年化收益率 - annualized\_return\_5q：五分位数年化收益率 - max\_drawdown\_1q：一分位数最大回撤 - max\_drawdown\_5q：五分位数最大回撤 - sharpe\_1q：一分位数夏普比率 - sharpe\_5q：五分位数夏普比率 - turnover\_ratio\_1q：一分位数换手率 - turnover\_ratio\_5q：五分位数换手率 - annual\_return\_bm：基准指数年化收益率 - ic\_mean：IC均值 - ir：IR值 - good\_ic：IC绝对值大于0.02的比率 二、long\_short - 多空组合 - index：自然增长的数字，从0开始，无意义 - column： - date：数据的更新日期，因子的收益需要下一交易日才可得到 ,因此实际数据的时间比date晚一天(T日收盘后的因子收益需要T+1的收盘价才可得出，数据需要在T+2日凌晨3点计算之后才可得到) - universe: 股票池 - bt\_cycle: 测试周期 - skip\_paused: 过滤涨停及停牌股 - commision\_slippage: 手续费及滑点 - category: 因子分类 - code：因子代码 - compound\_return\_ls：累积收益 - annualized\_return\_ls：年化收益率 - max\_drawdown\_ls：最大回撤 - sharpe\_ls：夏普比率 - turnover\_ratio\_ls：换手率 - annual\_return\_bm：基准指数年化收益率 - ic\_mean：IC均值 - ir：IR值 - good\_ic：IC绝对值大于0.02的比率 \*\*示例:\*\*

get\_factor\_stats 获取因子看板分位数历史收益率

\*\*参数：\*\* - factor\_names : 因子名称，单个因子（字符串）或一个因子列表，支持的因子见\[聚宽因子库\](https://www.joinquant.com/help/api/help#name:factor\_values) - universe\_type : 股票池包括以下五种： 'hs300': 沪深300 'zz500': 中证500 'zz800': 中证800 'zz1000': 中证1000 'zzqz': 中证全指 默认为'hs300' - start\_date : 开始日期，字符串或 datetime 对象 - end\_date : 结束日期，字符串或 datetime 对象，可以与 start\_date 或 count 配合使用 - count: 截止 end\_date 之前交易日的数量（含 end\_date 当日） - skip\_paused : 是否跳过停牌，bool，默认为False - commision\_fee : 手续费，float，0.0/0.0008/0.0018, 默认为0.0 \*\*返回：\*\* - 一个 dict，其中 key 是因子名称，value 是一个 pandas.DataFrame - DataFrame 的 index 是日期，column 1,2,3,4,5是一分位、二分位、三分位、四分位、五分位累积收益 \*\*示例：\*\*

<a id="风格因子归因"></a>

#### 风格因子归因

-   **更新时间：2005至今，9:00更新前一交易日**

方法 描述

get\_factor\_style\_returns 获取风格因子暴露收益率

\*\*参数：\*\* - factors : 因子名称，单个因子（字符串）或一个因子列表,支持\[风格因子\](https://www.joinquant.com/help/api/help#factor\_values:%E9%A3%8E%E6%A0%BC%E5%9B%A0%E5%AD%90)如"size"及申万/聚宽一级行业如 "801010"和"HY001" - start\_date : 开始日期，字符串或 datetime 对象 - end\_date : 结束日期，字符串或 datetime 对象，可以与 start\_date 或 count 配合使用 - count: 截止 end\_date 之前交易日的数量（含 end\_date 当日） - universe : 市场范围,默认为None代表全市场, 可选 : 'hs300': 沪深300 ; 'zz500': 中证500'; zz800': 中证800; 'zz1000':中证1000; 'zzqz':中证全指 - industry : 行业选取,默认为'sw\_l1', 可选 : 'sw\_l1':申万一级,'jq\_l1':聚宽一级 \*\*返回：\*\* 一个 DataFrame, index 是日期, columns为因子名, 值为因子暴露收益率 \*\*示例：\*\*

get\_factor\_specific\_returns 获取个股特质收益率(无法被风格因子解释的收益)

\*\*参数:\*\* - security : 股票代码, 或者股票代码组成的list - start\_date : 开始日期，字符串或 datetime 对象 - end\_date : 结束日期，字符串或 datetime 对象，可以与 start\_date 或 count 配合使用 - count: 截止 end\_date 之前交易日的数量（含 end\_date 当日） \*\*返回:\*\* - 个股被风格因子无法解释的那部分收益，即特质收益率 \*\*示例：\*\*

<a id="活动专区"></a>

## 活动专区

方法 描述

师生活动 师生活动

随着云计算、区块链等新兴技术在金融行业的深入应用，科技对于金融的促进作用被不断强化，创新型的金融解决方案层出不穷，金融科技发展进入新阶段。社会对金融与计算机的复合背景人才需求越来越大。在此背景下，为探讨金融科技行业人才需求趋势、人才培养与实践教学方法，聚宽JQData推出师生活动，助力在校师生在量化方面方面进行更多有效的探索。用最专业的产品支持量化高校教育，助力学生们步步进阶。 ![](https://image.joinquant.com/e580aac5e03eb204bddd205d8eadaf12) 活动说明 - 参与方式：高校老师可根据教学安排联系聚宽运营。师生获得高校专属的校园账号 - 金融数据类型包括：中国A股、指数、财务、宏观数据 - 账号试用期：6个月 - 账号有效期内：每日可获取100万条的金融数据 - 账号可获取的时间范围：2005年至今

论文支持活动 论文支持活动

为帮助学生更好投入量化论文课题，聚宽JQData聚焦学生数据需求并提供数据支持，解决学生写论文时花费大量精力找数据、清洗数据的难题。 ![](https://image.joinquant.com/56d71fa7b4bd6a0145d3f13282ccb587) 活动细则 - 金融数据类型包括：中国A股、指数、财务、宏观数据 - 账号试用期：6个月 - 账号有效期内：每日可获取100万条的金融数据 - 账号可获取的时间范围：2005年至今

试用账号延期活动 试用账号延期活动

\### 试用账号延期活动 为了满足JQData用户们长期投研需求，我们特意为以此推出下述【重磅福利活动】。 \`活动规则：以下每个活动只可参与一次，不可重复参与。活动期限不可以叠加，3个月期限到期后，如果需要继续参与，可填写表单：http://jqdatasdk.mikecrm.com/V2dqm0Y\` 注意： - ①参与\*\*文章撰写活动\*\*，需联系JQData运营审核。运营微信：15815705123 - ②试用账号延期权限为\[最新的试用账号权限\]("https://www.joinquant.com/help/api/doc?name=logon&id=9830&keyword=%u591A%u8FDB%u7A0B") - ③参与活动的截图时间不能与提交表单的时间相差过久 ## \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* #### \*\*活动内容\*\* ####【朋友圈转发活动】 \*\*活动主题\*\*：朋友圈转发推文 \[点击查看推文并转发\](https://www.joinquant.com/view/community/detail/2ce1b76f4c25c33d675d8d9cad866cab?type=1) - 朋友圈文案内容：量化不得不知道的数据服务JQData； - 次数：\*\*仅限转载一次\*\* - 延期或流量奖励：有效期3个月，每天10万数据流量 \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* ####【B站回复活动】 >活动细则：在B站与量化相关视频的评论区回复推荐聚宽 数量：一次 转载或流量奖励：有效期3个月，每天50万数据流量 \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* ####【知乎推荐活动】 \*\*活动主题\*\*：回复活动 - 活动内容：在\*\*知乎\*\*等相关提问中，回复聚宽的优势 - 数量：\*\*一个\*\* - 转载或流量奖励：有效期3个月，每天25万-50万数据流量 - 活动细则：相关提问参考【如何获取金融数据】、【量化平台推荐】【量化投资者是如何获取实时行情数据的】等 \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* ####【文章撰写活动】 \*\*活动内容\*\*：在 聚宽官网社区撰写 JQData（本地数据）强相关的文章，参考下方精品贴 - 数量：\*\*一篇\*\* - 转载或流量奖励：有效期3个月，每天200万-300万条流量 - 参与文章活动，需联系JQData运营审核。运营微信：15815705123 \*\*\`活动解释权归聚宽所有\`\*\* \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* ####▽ JQData 精品文章集合!! ▽#### \[JQData应用 | 基于估值波动周期的择时策略 — by 夏鲁迅\](https://www.joinquant.com/view/community/detail/3d0d3562e94143b8b34c2f942d5e59fe) \[JQData应用 | A股行业投资指南——好的投资，首先是选好行业 — by 夏鲁迅\](https://www.joinquant.com/view/community/detail/dc8851bd832a2cb2372992db0d06b664) \[JQData应用 | A股投资指南-单因子选股的有效性验证 — by 陈鹏\](https://www.joinquant.com/view/community/detail/7ebe3adf478ce360f6e96dd09d240bc4?type=1) \[JQData Monte Carlo = 有效前沿及投资组合优化 — by Supercritical\](https://www.joinquant.com/community/post/detailMobile?postId=15331&page=&limit=20&replyId=&tag=) \[JQData | 十年一瞬 · 量化分析股市涨跌周期规律(日内) — by 薛定谔の喵\](https://www.joinquant.com/view/community/detail/781e477fbbb05dd6953f5e535e4b7861) \[JQData | 股市估值分析，带你穿越资本市场迷雾 — by tom王小昭\](https://www.joinquant.com/view/community/detail/9e0c400b057e246bdca2db2d54b85941) \[基于Keras深度学习LSTM模型 预测黄金主力收盘价 — by HeartBearting\](https://www.joinquant.com/view/community/detail/2e996d21c95a409ba23a651085ab9f61) \[深度学习模型 CNN LSTM 预测收盘价 — by HeartBearting\](https://www.joinquant.com/community/post/detailMobile?postId=15443&page=&limit=20&replyId=&tag=) \[Keras框架 深度学习模型CNN LSTM Attention机制 预测黄金主力收盘价 — by HeartBearting\](https://www.joinquant.com/community/post/detailMobile?postId=15466&page=&limit=20&replyId=&tag=algorithm) \[强化学习入门：基于Q-learning算法的日内择时策略初窥 — by 。大咖\](https://www.joinquant.com/community/post/detailMobile?postId=15441&page=&limit=20&replyId=&tag=) \[使用jqdatasdk探究“裁员”的情况 — by 丁智\](https://www.joinquant.com/view/community/detail/5b69c06bd3a5a2d536512bd5c3f5fd22) \[深度学习和缠论应用，JQData应用 — by hprotein\](https://www.joinquant.com/view/community/detail/1b733f9f81b32d650d89b0ed26c17313?type=1) \[结合jqdata数据源的基于滤波降噪和LSTM期货量化研究 — by Timpage\](https://www.joinquant.com/view/community/detail/25917) \[使用fbprofhet对CF期货价格的预测 — by 蜗牛往上爬\](https://www.joinquant.com/view/community/detail/ae835141dc4c36a7c0d67cb1c435b2b8) \`（快来挑战他们）\`
