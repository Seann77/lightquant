---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 风险模型因子列表
section_path:
  - 因子库
  - 风险模型因子列表
source_file: api-docs/raw/joinquant/factor_values/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=factor_values
source_anchor: "#风险模型因子列表"
source_sha256: 5a622f2341cb1d5e0c324ba9570efa383bf44aa0e7ed70bc42a20bb614f27a7a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="风险模型因子列表"></a>

## 风险模型因子列表

<a id="风格因子"></a>

### 风格因子

#### 风格因子简介

| 因子 code | 因子名称 | 简介 |
| --- | --- | --- |
| size | 市值 | 捕捉大盘股和小盘股之间的收益差异 |
| beta | 贝塔 | 表征股票相对于市场的波动敏感度 |
| momentum | 传统动量 | 描述了过去两年里相对强势的股票与弱势股票之间的差异 |
| residual\_volatility | 残差波动率 | 解释了剥离了市场风险后的波动率高低产生的收益率差异 |
| non\_linear\_size | 非线性市值 | 描述了无法由规模因子解释的但与规模有关的收益差异，通常代表中盘股 |
| book\_to\_price\_ratio | 账面市值比 | 描述了股票估值高低不同而产生的收益差异, 即价值因子 |
| liquidity | 流动性 | 解释了由股票相对的交易活跃度不同而产生的收益率差异 |
| earnings\_yield | 盈利能力 | 描述了由盈利收益导致的收益差异 |
| growth | 成长 | 描述了对销售或盈利增长预期不同而产生的收益差异 |
| leverage | 杠杆 | 描述了高杠杆股票与低杠杆股票之间的收益差异 |

除了上面的风格因子，在计算风格因子过程中的描述因子daily\_standard\_deviation、cumulative\_range等也可以通过get\_factor\_values、get\_all\_factors以及get\_factor\_kanban\_values获取；描述因子是原始值，没有进行数据处理。

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

<a id="-2"></a>

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
        -   月换手率 share\_turnover\_monthly：股票一个月换手率，过去21日的股票换手率之和的对数。
        -   季度平均平均月换手率 average\_share\_turnover\_quarterly：过去3个月平均换手率，计算过去3个月的平均换手率，并取对数。
        -   年度平均月换手率 average\_share\_turnover\_annual：过去12个月平均换手率，计算过去12个月的平均换手率，并取对数。
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
        -   5年盈利增长率 earnings\_growth：盈利增长率，过去5年的基本每股收益（basic\_eps）关于\[0,1,2,3,4\]回归的斜率系数，然后再除以过去 5 年基本每股收益绝对值的均值。
        -   5年营业收入增长率 sales\_growth：营收增长率，过去 5 年每股营业收入关于\[0,1,2,3,4\]回归的斜率系数，然后再除以过去 5 年每股营业收入绝对值的均值。对于保险行业的股票，使用“已赚保费”代替“销售收入”计算每股营业收入，对于银行业的股票，sales\_growth为nan。
        -   earnings\_growth和sales\_growth至少需要有4年的财务数据，否则为nan。
-   杠杆因子 leverage

    -   定义：0.38•market\_leverage + 0.35•debt\_to\_assets + 0.27•book\_leverage
    -   解释
        -   市场杠杆 market\_leverage：(当前的普通股市值+优先股账面价值+长期债务账面价值)/当前的普通股市值。
        -   资产负债比 debt\_to\_assets：总负债的账面价值/总资产的账面价值。
        -   账面杠杆 book\_leverage：(普通股账面价値+优先股账面价值+长期债务账面价值)/普通股账面价值。账面杠杆需在0到100之间，否则结果为nan。

<a id="行业因子"></a>

### 行业因子

可以获取以下行业的分类因子，股票属于这个行业则为赋值为1，否则赋值为0
1.[证监会行业](https://www.joinquant.com/help/api/help?name=faq#plateData%3A%E8%AF%81%E7%9B%91%E4%BC%9A%E8%A1%8C%E4%B8%9A)
2.[聚宽行业(一二级)](https://www.joinquant.com/help/api/help?name=faq#plateData%3A%E8%81%9A%E5%AE%BD%E8%A1%8C%E4%B8%9A)
3.[申万行业(一二三级)](https://www.joinquant.com/help/api/help?name=faq#plateData%3A%E7%94%B3%E4%B8%87%E8%A1%8C%E4%B8%9A)

```python
>>> df_dic = get_factor_values('000001.XSHE',['A01','HY007','801780','801723'] ,end_date='2023-02-23',count=1)
print(df_dic)
>>>  {'A01':             000001.XSHE
    2023-02-23            0, 
'HY007':             000001.XSHE
    2023-02-23            1, 
'801780':             000001.XSHE
    2023-02-23            1, 
'801723':             000001.XSHE
    2023-02-23            0}
```

<a id="风格因子pro仅本地数据jqdatasdk可用"></a>

### 风格因子pro(仅本地数据jqdatasdk可用)

<a id="pro"></a>

#### 风格因子PRO简介

风格因子pro在原有的风格因子基础上，对底层的因子进一步细分和扩充。目前仅jqdatasdk提供，如有需求可[咨询运营开通](https://www.joinquant.com/help/api/doc?name=logon&id=9831)

| 因子 code | 因子名称 | 简介 |
| --- | --- | --- |
| btop | 市净率因子 | 描述了股票估值高低不同而产生的收益差异, 即价值因子 |
| divyild | 分红因子 | 股票历史和预测的股息价格比的股票回报差异 |
| earnqlty | 盈利质量因子 | 股票收益因其收益的应计部分而产生的差异 |
| earnvar | 盈利变动率因子 | 解释由于收益、销售额和现金流的可变性而导致的股票回报差异，以及分析师预测的收益与价格之比。 |
| earnyild | 收益因子 | 描述了由盈利收益导致的收益差异 |
| financial\_leverage | 财务杠杆因子 | 描述了高杠杆股票与低杠杆股票之间的收益差异 |
| invsqlty | 投资能力因子 | 衡量当股票价格过高/过低时，公司对资产扩张/紧缩的的倾向以及管理观点 |
| liquidty | 流动性因子 | 解释了由股票相对的交易活跃度不同而产生的收益率差异 |
| long\_growth | 长期成长因子 | 描述了对销售或盈利增长预期不同而产生的收益差异 |
| ltrevrsl | 长期反转因子 | 解释与长期股票价格行为相关的常见回报变化 |
| market\_beta | 市场波动率因子 | 表征股票相对于市场的波动敏感度 |
| market\_size | 市值规模因子 | 捕捉大盘股和小盘股之间的收益差异 |
| midcap | 中等市值因子 | 捕捉中等市值股票与大盘股或者小盘股之间的收益差异 |
| profit | 盈利能力因子 | 表征公司运营的效率，盈利能力指标的组合 |
| relative\_momentum | 相对动量因子 | 解释与最近（12个月，滞后1个月）股价行为相关的股票回报的常见变化 |
| resvol | 残余波动率因子 | 捕捉股票回报的相对波动性，这种波动性不能用股票对市场回报的敏感性差异来解释（市场波动率因子） |
