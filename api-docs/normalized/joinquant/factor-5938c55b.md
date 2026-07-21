---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 附录
section_path:
  - 因子分析
  - 附录
source_file: api-docs/raw/joinquant/factor/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=factor
source_anchor: "#附录"
source_sha256: 696149a6fbb4eae39080d3f3c6a739d62f8dd42a478ed6b4a76377894ff94a05
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="附录"></a>

## 附录

<a id="normalIC与rankIC的区别"></a>

### normal IC 与 rank IC 的区别

#### 1、normal IC

IC（Information coefficient 信息系数)的定义：t期的因子载荷（因子值）和t+1期的因子收益之间的相关系数。

举个例子：

因子：Variance20 20日收益方差

股票池：000001.XSHE(平安银行)、000002.XSHE(万科A)、000060.XSHE(中金岭南)、000063.XSHE(中兴通讯)、000069.XSHE(华侨城A)

日期：2018年1月2日

| 股票代码 | 因子值 | 下期股票收益 |
| --- | --- | --- |
| 000001.XSHE | 0.120140 | \-0.0267 |
| 000002.XSHE | 0.105666 | \-0.0070 |
| 000060.XSHE | 0.07945 | \-0.0547 |
| 000063.XSHE | 0.237343 | 0.0269 |
| 000069.XSHE | 0.134598 | 0.0057 |

(注：下期股票收益为股票下一交易日的涨幅)

可以求IC得两个必要条件就是求到因子值和下一期的股票收益，我们对这两列求相关系数就可以得到该因子在当前股票池范围内的IC值，值为0.8505（由于上表中的股票池极少，导致了求得的IC值比较高）。我们对每一天都求一个IC值就可以得到IC值得时间序列图，单日IC值得波动是比较大的，所以提供了IC的月度移动平均线作为参考，而因子的有效性也是通过IC值均值来判断，当IC值均值大于0.03，可以说该因子是有效因子。

注：当样本股票过少时，IC是没有统计意义的，在对因子做有效性分析时，要保证至少有100只股票，IC才有意义。

#### 2、rank IC

rank IC和IC唯一的不同点就是在求相关系数时，换成秩相关系数，即： rank IC： t 期的因子载荷（因子值）的排序值和 t+1 期的因子收益的排序值之间的相关系数。

举个例子：

| 股票代码 | 因子值 | 因子值排名 | 下期股票收益 | 下期股票收益排名 |
| --- | --- | --- | --- | --- |
| 000001.XSHE | 0.120140 | 3 | \-0.0267 | 2 |
| 000002.XSHE | 0.105666 | 2 | \-0.0070 | 3 |
| 000060.XSHE | 0.07945 | 1 | \-0.0547 | 1 |
| 000063.XSHE | 0.237343 | 5 | 0.0269 | 5 |
| 000069.XSHE | 0.134598 | 4 | 0.0057 | 4 |

(注：下期股票收益为股票下一交易日的涨幅)

IC值是对因子值和下期股票收益求相关系数，而rank IC值是对因子值排名和下期股票收益排名求相关系数，值为0.8999。

现在更多的人选择用rank IC来代替普通的IC，这是因为普通的IC求相关系数有一个前提条件，就是数据要服从正态分布，但金融类数据往往并不如此，所以现在更多人采用秩相关系数也就是rank IC来判断因子的有效性。

<a id="常见问题或报错"></a>

### 常见问题或报错

<a id="valueerrornoobjectstoconcatenate"></a>

### ValueError: No objects to concatenate

检查下得到的因子数据索引的数据类型是否正常，index为日期的DatetimeIndex;可以使用pandas的to\_datetime方法转换；

<a id="dataframe"></a>

### 将自有因子值转换成 DataFrame 格式的数据

[将自有因子值转换成 DataFrame 格式的数据](https://github.com/JoinQuant/jqfactor_analyzer)
