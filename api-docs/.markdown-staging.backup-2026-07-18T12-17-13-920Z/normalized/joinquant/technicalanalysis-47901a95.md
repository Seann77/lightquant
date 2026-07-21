---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 因子说明
section_path:
  - 技术分析指标
  - 因子说明
source_file: api-docs/raw/joinquant/technicalanalysis/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=technicalanalysis
source_anchor: "#因子说明"
source_sha256: d239f176c77af15430d8ab5aef200c09e9aaca79a5d66f28b9d73aa19118c966
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="因子说明"></a>

## 因子说明

为了让用户有更多可直接调用的技术分析指标因子，我们计划基于通达信、东方财富、同花顺等的公式，来完善我们的技术分析指标因子库。
我们给出了公式的API、参数说明、返回值的结果及类型说明、备注（相较于上述三家结果及算法的比对）、用法注释及示例，旨在帮助您更方便、更快速的在策略研究中使用这些因子函数。

支持多周期，取数逻辑同get\_bars

-   unit：统计周期，默认为 '1d', 支持如下周期: '1m', '5m', '15m', '30m', '60m', '120m', '1d', '1w', '1M'. '1w' 表示一周, ‘1M' 表示一月;
-   include\_now：是否包含当前周期，默认为 True.

**注意**

-   如果需要在Python3环境使用，print需要加()，例如：print(ACCER1\[security\_list1\])
-   如果传入了fq\_ref\_date，则以fq\_ref\_date为基准日进行复权 ； 否则默认为None，回测中如果开启动态复权,则返回复权计算动态前的技术指标(复权基准日为策略逻辑时间),否则返回前复权计算的指标 ;研究及jqdatasdk默认返回前复权计算的指标
-   当check\_date可以精确到分时秒时,如'2019-08-05 11:30:00',datetime.datetime(2019,1,10)(datetime对象本身带有分时秒,默认为00:00:00),返回当前时间点的指标值
-   当check\_date只精确到日期时,如'2019-08-05',datetime.date(2019,1,10),返回当天收盘后的指标,盘中调用当天的指标会产生未来数据,策略中建议check\_date直接填写context.current\_dt
-   文档中的统计天数，默认是unit为'1d'，当unit不为'1d'的话，指的是统计周期unit
-   因复权数据不同平台不一致、部分算法不一致、涉及回溯的技术指标提取的数据量不同，计算得到的结果可能和其他平台存在差异[技术指标数据与其他平台有差异](https://www.joinquant.com/view/community/detail/48502bfa85355991258093e990d74f35)
