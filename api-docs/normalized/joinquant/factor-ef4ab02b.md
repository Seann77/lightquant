---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 因子分析结果
section_path:
  - 因子分析
  - 因子分析结果
source_file: api-docs/raw/joinquant/factor/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=factor
source_anchor: "#因子分析结果"
source_sha256: 696149a6fbb4eae39080d3f3c6a739d62f8dd42a478ed6b4a76377894ff94a05
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="因子分析结果"></a>

## 因子分析结果

<a id="收益分析"></a>

### 收益分析

在收益分析中, 分位数的平均收益， 各分位数的累积收益， 以及分位数的多空组合收益三方面观察因子的表现。 第一分位数的因子值最小， 第五分位数的因子值最大。

1.  分位数收益： 表示持仓1、5、10天后，各分位数可以获得的平均收益。
2.  分位数的累积收益： 表示各分位数持仓收益的累计值。
3.  多空组合收益： 做多五分位（因子值最大）， 做空一分位（因子值最小）的投资组合的收益。

<a id="IC分析"></a>

### IC 分析

IC 是 information coefficient 的缩写。IC 代表了预测值和实现值之间的相关性， 通常用以评价预测能力。 取值在-1到1之间， 绝对值越大， 表示预测能力越好。

IC 的计算， 一般有两种方法， normal IC 与 rank IC。 我们计算的是rank IC.

-   normal IC： 因子载荷与因子收益之间的相关系数

-   rank IC： 因子载荷的排序值与收益的排序值之间的相关系数

-   详情：[normal IC 与 rank IC 的区别](https://www.joinquant.com/help/api/help?name=factor#normal_rank_IC)

    同时考虑到单日 IC 的波动较大， 我们提供了 IC 的月度移动平均线作为参考。


<a id="换手率分析"></a>

### 换手率分析

因子的换手率是在不同的时间周期下， 观察因子个分位中个股的进出情况。 计算方法举例： 某因子第一分位持有的股票数量为30支， 一天后有一只发生变动， 换手率为： 1/30 \*100% = 3.33% 对于5日、10日的换手率，在每日都会对比当日1、5分位数的成分股与5日、10日前该分位数的成分股的变化进行计算。

因子分位数换手率的价值体现在两个方面：

1.  因子稳定性的体现：换手率低的因子，因子值在时间序列层面的持续性更好
2.  衡量交易成本：在实际的交易过程中， 假设我们要维护投资组合的因子暴露恒定， 对于高换手率因子， 则需要进行更多的交易。 交易中的税费和滑点， 也会吞噬掉我们的部分利润。
