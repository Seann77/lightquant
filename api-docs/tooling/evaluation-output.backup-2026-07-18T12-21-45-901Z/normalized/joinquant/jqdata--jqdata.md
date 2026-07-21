---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: JQData-本地量化数据说明书
section_path:
  - JQData使用说明
  - JQData-本地量化数据说明书
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#JQData-本地量化数据说明书"
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - complex_table_preserved_as_html
  - empty_table_removed
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="JQData-本地量化数据说明书"></a>

## JQData-本地量化数据说明书

<a id="uctrlfu"></a>

#### **由于内容较多，可使用Ctrl+F搜索您需要的数据。**

-   **注意：query函数的更多用法详见：[Query的简单教程](https://www.joinquant.com/view/community/detail/433d0e9ed9fed11fc9f7772eab8d9376)**
-   run\_query 查询数据库中的数据：为了防止返回数据量过大, 我们每次最多返回**5000**行；不支持进行连表查询，即同时查询多张表的数据；
-   查询财务数据时如果提示没有定义，请在最上面添加：from jqdatasdk import \*
-   jqdatasdk包(产品名称JQData)和官网的jqdata包是两个不同的包，API不完全相同，点击查看**JQData 介绍与说明**中[关于JQData、jqdatasdk和jqdata](https://www.joinquant.com/help/api/help?name=JQData#JQDataApi%3AJQData%E4%BB%8B%E7%BB%8D%E4%B8%8E%E8%AF%B4%E6%98%8E)，**JQData常见问题及报错解决教程**中[JQData和官网不一致API对比](https://www.joinquant.com/help/api/help?name=JQData#JQDataApi%3AJQData%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E5%8F%8A%E6%8A%A5%E9%94%99%E8%A7%A3%E5%86%B3%E6%95%99%E7%A8%8B)

<a id="介绍与说明"></a>

### 介绍与说明

<a id="JQData介绍"></a>

### JQData介绍

**JQData是什么**

```
    JQData是聚宽数据团队专门为金融机构、学术团体和量化研究者们提供的本地量化金融数据服务。使用JQData，可快速查看和计算金融数据，无障碍解决本地、Web、金融终端调用数据的需求。历经5年沉淀，40万宽客及数3500家知名量化机构投研交易验证。
```

使用上，JQData适用Windows、Mac、Linux多种操作系统，支持python2、python3和以及任意编程语言。数据通过简洁的API方式提供，pip即可直接安装使用，挣脱使用束缚，实现更多场景。只需三行代码，即可随取随用~

<a id="JQData提供的数据及数据更新频率"></a>

### JQData提供的数据及数据更新频率

**JQData提供的数据及数据更新频率**

```
   为了满足用户的需求，聚宽数据团队在JQData中不仅提供了全面的基础金融数据，包括**沪深A股行情数据，上市公司财务数据，场内基金数据，场外基金数据，指数数据，期货数据，期权数据、债券数据以及宏观经济数据**；除此之外，JQData还针对因子数据和特色数据，引进了聚宽因子库，舆情数据，Alpha特色因子，技术分析指标因子，tick数据，助您更好的完成量化研究和投资决策。详细数据清单如下表所示：
```

<table><tbody><tr><td><strong>数据品种</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>股票列表数据</td><td>2005至今</td><td>8:00更新</td></tr><tr><td>行业概念和指数成分股</td><td>2005至今</td><td>8:00更新</td></tr><tr><td>日行情</td><td>2005至今</td><td>盘后15:00更新，24:00校对完成入库</td></tr><tr><td>分钟行情</td><td>2005至今</td><td>盘后15:00更新，24:00校对完成入库</td></tr><tr><td>集合竞价数据</td><td>2010年至今</td><td>盘后15:00更新</td></tr><tr><td>分红拆分送股</td><td>2005至今</td><td>8:00更新</td></tr><tr><td>融资融券</td><td>2010至今</td><td>下一个交易日9点之前更新</td></tr><tr><td>资金流向</td><td>2010至今</td><td>盘后20:00更新</td></tr><tr><td>龙虎榜数据</td><td>2005至今</td><td>盘后20:00和22:00更新</td></tr><tr><td>限售解禁股</td><td>2005至今</td><td>盘后20:00更新</td></tr><tr><td>停复牌、涨跌停价格数据</td><td>2005至今</td><td>盘前9:15更新</td></tr><tr><td>沪深市场每日成交概况</td><td>2005年至今</td><td>交易日20:30-24:00更新</td></tr><tr><td>沪股通，深股通和港股通(市场通数据）</td><td>上市至今</td><td>交易日20:30-06:30更新</td></tr><tr><td>申万一级行业指数日行情数据</td><td>上市至今</td><td>交易日17:30更新</td></tr><tr><td>申万一级行业估值数据</td><td>上市至今</td><td>交易日17:30更新</td></tr><tr><td><strong>上市公司财务数据</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>估值数据</td><td>2005至今</td><td>每天24:00更新</td></tr><tr><td>财务指标</td><td>2005至今</td><td>每天24:00更新</td></tr><tr><td>资产负债表</td><td>2005至今</td><td>每天24:00更新</td></tr><tr><td>现金流量表</td><td>2005至今</td><td>每天24:00更新</td></tr><tr><td>利润表</td><td>2005至今</td><td>每天24:00更新</td></tr><tr><td>银行专项指标表</td><td>2005至今</td><td>每天24:00更新</td></tr><tr><td>券商专项指标表</td><td>2005至今</td><td>每天24:00更新</td></tr><tr><td>保险专项指标表</td><td>2005至今</td><td>每天24:00更新</td></tr><tr><td>上市公司概况</td><td>2005年至今</td><td>交易日24:00更新</td></tr><tr><td>上市公司股东股本</td><td>2005年至今</td><td>交易日24:00更新</td></tr><tr><td><strong>期货数据</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>期货列表数据</td><td>2005至今</td><td>8:00更新</td></tr><tr><td>日行情</td><td>2005至今</td><td>盘后15:00更新，24:00校对完成入库</td></tr><tr><td>分钟行情</td><td>2005至今</td><td>盘后15:00更新，24:00校对完成入库</td></tr><tr><td>期货结算价</td><td>2005至今</td><td>盘后17:00 更新</td></tr><tr><td>期货主力合约</td><td>2005至今</td><td>20点更新下一交易日</td></tr><tr><td>期货连续指数</td><td>2005至今</td><td>盘前8:00更新</td></tr><tr><td>期货龙虎榜数据</td><td>2005年至今</td><td>盘后19:00更新</td></tr><tr><td>期货仓单数据</td><td>2005年至今</td><td>盘后20:00更新</td></tr><tr><td>外盘期货日行情数据</td><td>上市至今</td><td>盘前9:00更新</td></tr><tr><td><strong>场内基金数据</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>场内基金列表数据</td><td>2005至今</td><td>8:00更新</td></tr><tr><td>分级基金数据</td><td>2005至今</td><td>8:00更新</td></tr><tr><td>日行情</td><td>2005至今</td><td>盘后更新15点更新</td></tr><tr><td>分钟行情</td><td>2005至今</td><td>盘后15点更新，盘后24:00更新</td></tr><tr><td>净值数据</td><td>2005至今</td><td>下一个交易日10点之前更新</td></tr><tr><td>融资融券</td><td>2010至今</td><td>下一个交易日9点之前更新</td></tr><tr><td>场内基金份额数据</td><td>2005-02-23至今</td><td>下一个交易日10点之前更新</td></tr><tr><td>集合竞价数据</td><td>2019年至今</td><td>盘后15:00更新</td></tr><tr><td><strong>公募基金</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>基金主体信息</td><td>上市至今</td><td>盘后24:00更新</td></tr><tr><td>基金净值信息</td><td>上市至今</td><td>盘前9:00更新</td></tr><tr><td>基金持股信息</td><td>上市至今</td><td>盘后24:00更新</td></tr><tr><td>基金持仓债券信息</td><td>上市至今</td><td>盘后24:00更新</td></tr><tr><td>基金资产组合概况</td><td>上市至今</td><td>盘后24:00更新</td></tr><tr><td>基金财务指标信息</td><td>上市至今</td><td>盘后24:00更新</td></tr><tr><td>基金收益日报信息</td><td>上市至今</td><td>盘后24:00更新</td></tr><tr><td>基金分红拆分合并信息</td><td>上市至今</td><td>盘后24:00更新</td></tr><tr><td><strong>指数数据</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>指数列表数据</td><td>2005至今</td><td>8:00更新</td></tr><tr><td>指数成分股数据</td><td>2005至今</td><td>8:00更新</td></tr><tr><td>日行情</td><td>2005至今</td><td>盘后15:00更新，24:00校对完成入库</td></tr><tr><td>分钟行情</td><td>2005至今</td><td>盘后15:00更新，24:00校对完成入库</td></tr><tr><td>集合竞价数据</td><td>2017年至今</td><td>盘后15:00更新</td></tr><tr><td><strong>期权数据</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>期权合约资料</td><td>上市至今</td><td>盘后18:00更新</td></tr><tr><td>期权合约调整记录</td><td>上市至今</td><td>盘后18:00更新</td></tr><tr><td>期权每日盘前静态文件</td><td>上市至今</td><td>盘前9:05更新</td></tr><tr><td>期权日行情</td><td>上市至今</td><td>盘后更新15点更新，24:00校对完成入库</td></tr><tr><td>上证ETF期权分钟行情</td><td>2017-01-01至今</td><td>盘后更新15点更新，24:00校对完成入库</td></tr><tr><td>股指期权分钟行情</td><td>2019-12-24至今</td><td>盘后更新15点更新，24:00校对完成入库</td></tr><tr><td>商品期权分钟行情</td><td>2019-12-02至今</td><td>盘后更新15点更新，24:00校对完成入库</td></tr><tr><td>集合竞价数据</td><td>2017年至今</td><td>盘后15:00更新</td></tr><tr><td>股票期权交易和持仓排名统计</td><td>上市至今</td><td>下一交易日盘前8:05更新</td></tr><tr><td>期权风险指标</td><td>上市至今</td><td>下一交易日盘前8:05更新</td></tr><tr><td>期权行权交收信息</td><td>上市至今</td><td>每日10:45更新</td></tr><tr><td><strong>债券数据</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>债券基本信息</td><td>上市至今</td><td>每日19：00、22:00更新</td></tr><tr><td>债券票面利率</td><td>上市至今</td><td>每日19：00、22:00更新</td></tr><tr><td>国债逆回购日行情数据</td><td>上市至今</td><td>每日19：00、22:00更新</td></tr><tr><td>可转债基本资料</td><td>上市至今</td><td>每日19：00、22:00更新</td></tr><tr><td>可转债转股价格调整</td><td>上市至今</td><td>每日19：00、22:00更新</td></tr><tr><td>可转债日行情</td><td>2018-09-13至今</td><td>每日19：00、22:00更新</td></tr><tr><td>可转债分钟日行情</td><td>2019年至今</td><td>盘后15点更新</td></tr><tr><td>可转债每日转股统计</td><td>2000-7-12至今</td><td>下一交易日 8:30、12：30更新</td></tr><tr><td>债券付息事件</td><td>上市至今</td><td>每日19：00、22:00更新</td></tr><tr><td><strong>宏观经济数据</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>国民经济</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>保险业</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>人民生活</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>人口</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>国内贸易</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>就业与工资</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>资源环境</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>房地产行业</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>财政政策</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>固定资产投资</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>对外经济贸易</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>景气指数</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>工业</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>农林牧渔业</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td>金融业</td><td>统计局统计开始至今</td><td>交易日盘前8：30之前更新</td></tr><tr><td><strong>舆情数据</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>新闻联播文本数据</td><td>2009年6月至今</td><td>每日21:30前更新</td></tr><tr><td><strong>聚宽因子库</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>质量因子</td><td>2005年至今</td><td>下一自然日5:00、8:00更新</td></tr><tr><td>基础因子</td><td>2005年至今</td><td>下一自然日5:00、8:00更新</td></tr><tr><td>情绪因子</td><td>2005年至今</td><td>下一自然日5:00、8:00更新</td></tr><tr><td>成长因子</td><td>2005年至今</td><td>下一自然日5:00、8:00更新</td></tr><tr><td>风险因子</td><td>2005年至今</td><td>下一自然日5:00、8:00更新</td></tr><tr><td>每股因子</td><td>2005年至今</td><td>下一自然日5:00、8:00更新</td></tr><tr><td><strong>Alpha特色因子</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>Alpha101因子</td><td>2005至今</td><td>次日08:00更新</td></tr><tr><td>Alpha191因子</td><td>2005至今</td><td>次日08:00更新</td></tr><tr><td><strong>技术指标因子</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>超买超卖型技术指标</td><td>2005至今</td><td>根据传入的参数实时计算</td></tr><tr><td>趋势型技术指标</td><td>2005至今</td><td>根据传入的参数实时计算</td></tr><tr><td>能量型技术指标</td><td>2005至今</td><td>根据传入的参数实时计算</td></tr><tr><td>成交量型技术指标</td><td>2005至今</td><td>根据传入的参数实时计算</td></tr><tr><td>均线型技术指标</td><td>2005至今</td><td>根据传入的参数实时计算</td></tr><tr><td>路径型技术指标</td><td>2005至今</td><td>根据传入的参数实时计算</td></tr><tr><td>其他</td><td>2005至今</td><td>根据传入的参数实时计算</td></tr><tr><td><strong>tick快照数据（仅限机构用户)</strong></td><td><strong>时间范围</strong></td><td><strong>更新频率</strong></td></tr><tr><td>沪深A股tick数据</td><td>2010-01-01至今</td><td>盘后更新历史tick，提供买卖五档数据</td></tr><tr><td>金融期货和商品期货tick数据</td><td>2010-01-01至今</td><td>盘后更新历史tick，提供买卖一档数据</td></tr><tr><td>上证ETF期权tick数据</td><td>2017-01-01至今</td><td>盘后更新历史tick，提供买卖五档数据</td></tr><tr><td>商品期权tick数据</td><td>2019-12-02至今</td><td>盘后更新历史tick，提供买卖一档数据</td></tr><tr><td>场内基金tick数据</td><td>2019-01-01至今</td><td>盘后更新历史tick，提供买卖五档数据</td></tr><tr><td>指数tick数据</td><td>2017-01-01至今</td><td>盘后更新历史tick，提供买卖一档数据</td></tr></tbody></table>

**说明**：

-   有关财务数据更新：一般是这样的情况，譬如财报公布的发布日期是date，实际上一般会在date前一个交易日的晚上发布出来，我们程序也会在date前一天晚上和date这天早上更新财报；
-   期货结算价更新时间：17:00后；

<a id="为什么选择JQData"></a>

### 为什么选择JQData

**JQData的优势**

-   **本地使用**：JQData避免了各个量化平台的限制，适用于Windows，Mac，Linux多种操作系统，用户只需三行Python代码即可完成本地安装和调用，帮助您实现一整套本地化部署的量化投资研究。（支持Python2和Python3）

-   **易于量化**：JQData在设计过程中，聚宽团队基于量化行业专业知识及对投研的经验，对数据进行清洗及整理，使数据更能适用量化的研究习惯，并进一步赋能数据在本地投研的可行性及便利性。

-   **调用方便**：在JQData里，不同品种同一属性的数据用同一个接口就能获取，例如，使用get\_price就能获取所有股票，基金，指数，期货的行情数据，从而大大减少用户的学习成本，代码也更加简洁；与之相反，大部分传统数据商提供的数据分散在不同的数据表中，需要用户自己来回查找。

-   **JQData精准度介绍**：截至目前，聚宽自营基金管理规模已达百亿，使用聚宽数据（详情见文末介绍），一创聚宽平台交易验证，其精准度满足交易需求。聚宽数据团队研发了数据监控系统和多数据源比对系统，通过一整套系统化的机制保证数据的准确性。另外，我们还提供了指定日期参数，杜绝未来数据。

-   **JQData稳定性介绍**：JQData采用与聚宽官网一致的账户校验系统，登录账号即可使用。提供独立的数据服务，采用负载均衡、高可用服务架构，配备完善的灾备体系，保证业务系统24小时不中断，并支持海量用户同时在线。数据传输方面，采用RPC协议传输，并压缩成特有数据格式，减少传输数据量，更加节省带宽。


<a id="商务合作"></a>

### 商务合作

**微信：JQData02/ 邮件：jqdatasdk@joinquant.com**

聚宽作为国内领先的量化平台，欢迎数据行业的各位同仁，和我们共同构建起一整套领先的量化分析数据体系，如贵公司有这方面的数据资源和合作意向，，请添加管理员微信：**JQData02**，或发送邮件至**jqdatasdk@joinquant.com**说明合作意向，欢迎加入聚宽JQData。

<a id="版本信息"></a>

### 版本信息

**版本信息**

-   【最新版本信息】：https://gitee.com/joinquant/jqdatasdk/graph/master

<a id="关于JQData、jqdatasdk和jqdata"></a>

### 关于JQData、jqdatasdk 和 jqdata

**三者的区别**

-   JQData，即jqdatasdk，指的是聚宽数据出品的本地量化数据接口，需要本地python环境内使用， 具体方法见JQData的API： 【sdk版本API文档】：https://www.joinquant.com/help/api/help?name=JQData

-   jqdata：只有在官网环境下才能调用（登录官网在研究环境下使用的包） 步骤：import jqdata 或 from jqdata import , 具体使用方法见官网API：https://www.joinquant.com/help/api/help?name=api


<a id="试用和购买"></a>

### 试用和购买

<a id="如何开通JQData"></a>

### 如何开通JQData

**申请试用**

**申请试用账号**： JQData由聚宽团队专门维护清洗，为金融机构、学术团体和量化研究者们提供的本地量化金融数据服务。 数据产品不仅对外服务，同时服务于聚宽所有业务线，历经平台40万用户、基金百亿资产、每年万亿交易额的考验。本着推动量化行业快速发展的良好愿景，JQData现已开放注册。需要试用JQData的用户只需[提交试用申请>>>](https://www.joinquant.com/default/index/sdk#jq-sdk-apply)，即可获取有效时长为**3个月**的试用账号。试用账号在试用期间可限时免费调用JQData的部分基础数据，具体试用权限如下表所示。（注：**JQData基础数据包含沪深A股行情数据，上市公司财务数据，指数数据，场内基金数据，期货数据和宏观经济数据等多类数据**） 如果数据流量不够用或者需要因子和特色数据，可以付费开通正式账号。[如何开通正式账号>>>](https://www.joinquant.com/help/api/help?name=JQData#JQData%3A%E5%A6%82%E4%BD%95%E8%B4%AD%E4%B9%B0JQData)

<table><tbody><tr><td></td><td></td><td>普通试用账号</td><td><strong>正式账号</strong></td><td>金融机构特色试用权限</td></tr><tr><td rowspan="6">账号功能</td><td>数据种类&amp;可用时间范围</td><td>基础数据</td><td><strong>按需采买</strong></td><td rowspan="5">按需申请</td></tr><tr><td>有效期</td><td>3个月</td><td><strong>1年</strong></td></tr><tr><td>连接数（auth lisense）</td><td>1</td><td><strong>1/3</strong></td></tr><tr><td>每日可用流量（总和）</td><td>50万</td><td><strong>100万/20000万</strong></td></tr><tr><td>行情数据频度</td><td>日频、分钟</td><td><strong>日频、分钟、Tick</strong></td></tr><tr><td>数据获取形式</td><td>API接口</td><td><strong>API接口</strong></td><td>API接口</td></tr><tr><td rowspan="21">数据种类</td><td rowspan="10">基础数据</td><td>沪深A股数据</td><td><strong>沪深A股数据</strong></td><td rowspan="21"><p>微信联系JQData02</p><p>递交名片资料后可申请特色试用权限</p></td></tr><tr><td>期货数据（首次调用后，限时体验14天）</td><td><strong>期货数据</strong></td></tr><tr><td>上市公司财务数据（首次调用后，限时体验14天）</td><td><strong>上市公司财务数据</strong></td></tr><tr><td>债券数据（首次调用后，限时体验14天）</td><td><strong>债券数据</strong></td></tr><tr><td>指数数据</td><td><strong>指数数据</strong></td></tr><tr><td>场内基金数据（首次调用后，限时体验14天）</td><td><strong>场内基金数据</strong></td></tr><tr><td>场外基金数据（首次调用后，限时体验14天）</td><td><strong>场外基金数据</strong></td></tr><tr><td>可转债数据（首次调用后，限时体验14天）</td><td><strong>可转债数据</strong></td></tr><tr><td>宏观经济数据（首次调用后，限时体验14天）</td><td><strong>宏观经济数据</strong></td></tr><tr><td>舆情数据（首次调用后，限时体验14天）</td><td><strong>舆情数据</strong></td></tr><tr><td rowspan="11">特色数据</td><td></td><td><strong>聚宽因子库</strong></td></tr><tr><td></td><td><strong>Alpha191</strong></td></tr><tr><td></td><td><strong>Alpha101</strong></td></tr><tr><td></td><td><strong>技术指标因子</strong></td></tr><tr><td></td><td><strong>沪深A股tick数据（机构专用）</strong></td></tr><tr><td></td><td><strong>商品期货tick数据（机构专用）</strong></td></tr><tr><td></td><td><strong>金融期货tick数据（机构专用）</strong></td></tr><tr><td></td><td><strong>金融期权tick数据（机构专用）</strong></td></tr><tr><td></td><td><strong>商品期权tick数据（机构专用）</strong></td></tr><tr><td></td><td><strong>场内基金tick数据（机构专用）</strong></td></tr><tr><td></td><td><strong>指数tick数据（机构专用）</strong></td></tr></tbody></table>

<a id="如何购买JQData"></a>

### 如何购买JQData

**开通正式账号**

**开通正式账号**：

开通正式账号： 如果您觉得每天50万条的数据不够用，或者需要使用更多的数据，或者想要**延期**，可以**购买**本地数据套餐，**选择套餐升级后每天可调用100万条或2亿条数据**，详情请与我们的运营人员联系。（**个人用户咨询【邮箱sunping@joinquant.com，机构服务咨询添加微信号JQData02**）

<a id="JQData安装、登陆及流量查询"></a>

### JQData 安装、登陆及流量查询

<a id="如何安装使用JQData"></a>

### 如何安装使用JQData

**安装/升级/使用jqdatasdk包**

开通权限后，您可以在本地安装和使用JQData。**Python用户请按以下教程安装使用，**如在使用中遇到问题，还可以联系官网在线客服或在[社区问答板块留言](https://www.joinquant.com/view/community/list?listType=2&keyword=&type=isNew&tags=)，有专门的技术顾问跟进。

-   **安装JQData**： 如您本地已有python环境，打开本地cmd终端或Mac终端，将路径切换到python目录下，直接使用pip语法即可安装。在安装中出现任何问题，可查看[JQData安装教程](https://www.joinquant.com/post/12479?tag=algorithm)，内有详细解答。

```
  pip install jqdatasdk
```

-   **升级JQData**：JQData预计每2周会发布一次迭代版本，增加更多维度的基础数据以及因子类数据，已有python环境的用户可以使用如下语句完成升级：

```python
  pip install -U jqdatasdk
```

windows用户可以直接点击[新版本链接](https://www.joinquant.com/jqdatasdk/download/win64)下载安装。或打开cmd终端，切换到JQData所在路径下，通过下述语句升级到最新版本。

```python
  C:\JQData>python.exe -m pip install jqdatasdk
```

-   **登录JQData**：安装完成后，导入JQData，并认证用户身份。认证完毕显示“auth success”后即可使用，认证步骤如下：

```python
  from jqdatasdk import *
  auth('账号','密码') #账号是申请时所填写的手机号；密码为聚宽官网登录密码
```

-   **调用数据**：详见下一步任务\[登录JQData\]

-   **每天可访问数据条数**：由于用户访问数据会给服务器造成一定的压力，JQData开放给试用账号的每天可访问数据为50万条，基本上能够满足大部分用户的需要；如需更多的访问条数，**您可以付费升级为正式账号，我们将为您开放每天2亿条数据的访问权限**。**个人用户咨询【邮箱：sunping@joinquant.com】，机构服务咨询添加微信号JQData02**&。

-   **因子数据和特色数据**：如果您还想使用Alpha特色因子，技术指标因子，tick数据，您可以将账号升级到正式版、标准版或专业版，详情请联系我们的运营同事。**个人用户咨询【邮箱：sunping@joinquant.com】，机构服务咨询添加微信号JQData02**。

-   **问题反馈和其他数据需求**：如果您在使用JQData的过程中遇到问题，或者希望JQData能够加入更多的数据，请您通过[社区提问](https://www.joinquant.com/community)的方式或者联系官网右下角的在线客服。


<a id="登录JQData"></a>

### 登录JQData

**登录JQData**

打开代码编辑器（第三方编辑器请指定运行环境为已安装JQData的Python环境），输入如下代码认证用户身份。认证完毕后显示“auth success”即可开始调用数据，认证步骤如下：

```python
from jqdatasdk import *
auth('ID','Password') #ID是申请时所填写的手机号；Password为聚宽官网登录密码
```

**注：**JQData支持开启一个连接数，即登录一次账号算一个连接；如遇到连接数超限情况，可使用**logout()**函数退出已有连接后再开启新的连接。

<a id="get_query_count"></a>

### get\_query\_count

**查询当日剩余可调用条数**

```python
get_query_count()
```

描述：查看当日剩余可调用条数，试用账号默认是每日50万条；正式账号是每日2亿条。
说明：**一行表示一条，如下图；如果不确定的话，可以在调用前后分别查询下可调用条数**
![img](https://image.joinquant.com/4dee2952abb2bf6a75ba3fedae3d5da2)

**返回**

一个dict，字段说明如下：

| 字段名 | 说明 |
| --- | --- |
| total | 当日可调用数据总条数 |
| spare | 当日剩余可调用条数 |

**示例**

```python
#查询当日剩余可调用数据条数
count=get_query_count()
print(count)

>>>{'total': 1000000,'spare': 996927}
```
