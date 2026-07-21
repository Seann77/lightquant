---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: tick数据(机构)
section_path:
  - JQData使用说明
  - tick数据(机构)
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#tick数据机构"
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="tick数据机构"></a>

## tick数据(机构)

方法 描述 / 更新时间及频率

股票tick数据 2010-01-01起

**股票部分， 支持 2010-01-01 至今的tick数据，提供买五卖五数据。盘后15:00更新，24:00校对完成入库**

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 股票代码或期货代码,不支持传入多个标的

-   start\_dt: 开始日期，格式为'YYYY-MM-DD HH:MM:SS'

-   end\_dt: 结束日期，格式为'YYYY-MM-DD HH:MM:SS'

-   count: 取出指定时间区间内前多少条的tick数据。

-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下：

-   skip:默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据

-   df:指定返回的数据格式，默认为True，返回dataframe；df=False时返回一个np.ndarray

-   **股票tick返回结果**


| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价 | float |
| high | 当日最高价 | float |
| low | 当日最低价 | float |
| volume | 累计成交量（股） | float |
| money | 累计成交额 | float |
| a1\_v~a5\_v | 五档卖量 | float |
| a1\_p~a5\_p | 五档卖价 | float |
| b1\_v~b5\_v | 五档买量 | float |
| b1\_p~b5\_p | 五档买价 | float |

**股票tick数据示例**：

期货tick数据 2010-01-01 起

**期货部分， 支持 2010-01-01 至今的tick数据，提供买一卖一数据。盘后15:00更新，24:00校对完成入库。**如果要获取主力合约的tick数据，可以先使用get\_dominant\_future(underlying\_symbol,dt)获取主力合约对应的标的，然后再用get\_ticks()获取该合约的tick数据

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 期货代码

-   start\_dt: 开始日期，格式为'YYYY-MM-DD HH:MM:SS'

-   end\_dt: 结束日期，格式为'YYYY-MM-DD HH:MM:SS'

-   count: 取出指定时间区间内前多少条的tick数据。

-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下：

-   skip:默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据

-   df:指定返回的数据格式，默认为True，返回dataframe；df=False时返回一个np.ndarray

-   **期货tick返回结果：**


| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价 | float |
| high | 当日最高价 | float |
| low | 当日最低价 | float |
| volume | 累计成交量（手） | float |
| money | 累计成交额 | float |
| position | 持仓量 | float |
| a1\_v | 一档卖量 | float |
| a1\_p | 一档卖价 | float |
| b1\_v | 一档买量 | float |
| b1\_p | 一档买价 | float |

**期货tick数据示例**：

期权tick数据 上交所ETF（2017-01-01起），商品期权（2019-12-02起）

**期权部分**， 支持期权tick数据，盘后15:00更新，24:00校对完成入库。其中上交所ETF期权从2017-01-01开始，提供买卖五档；商品期权从2019-12-02开始，提供买卖一档。

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 期权代码；如security='10001979.XSHG' #上交所ETF期权，上海证券交易所；security='CU2001C42000.XSGE'#铜期权，上海期货交易所； security='SR003C5600.XZCE' #白糖期权，郑州商品交易所； security='M2005-P-2400.XDCE' #豆粕期权，大连商品交易所；
-   start\_dt: 开始日期，格式为'YYYY-MM-DD HH:MM:SS'
-   end\_dt: 结束日期，格式为'YYYY-MM-DD HH:MM:SS'
-   count: 取出指定时间区间内前多少条的tick数据。
-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下：
-   skip: 默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据
-   df:指定返回的数据格式，默认为True，返回dataframe；df=False时返回一个np.ndarray

**期权tick返回结果：**

| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价 | float |
| high | 当日最高价 | float |
| low | 当日最低价 | float |
| volume | 累计成交量（张） | float |
| money | 累计成交额（元） | float |
| position | 持仓量（张） | float |
| a1\_p | 一档卖价 | float |
| a1\_v | 一档卖量 | float |
| … |  |  |
| a5\_p | 五档卖价 | float |
| a5\_v | 五档卖量 | float |
| b1\_p | 一档买价 | float |
| b1\_v | 一档买量 | float |
| … |  |  |
| b5\_p | 五档买价 | float |
| b5\_v | 五档买量 | float |

**期权tick数据示例**：

场内基金tick数据 2019-01-01起

**场内基金部分， 支持 2019-01-01 至今的tick数据，提供买五卖五盘口数据。盘后15:00更新，24:00校对完成入库**

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 场内基金代码，如'510050.XSHG'

-   start\_dt: 开始日期，格式为'YYYY-MM-DD HH:MM:SS'

-   end\_dt: 结束日期，格式为'YYYY-MM-DD HH:MM:SS'

-   count: 取出指定时间区间内前N条的tick数据。

-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下场内基金tick返回结果。

-   skip:默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据

-   df:指定返回的数据格式，默认为True，返回dataframe；df=False时返回一个np.ndarray

    **场内基金tick返回结果**


| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价 | float |
| high | 当日最高价 | float |
| low | 当日最低价 | float |
| volume | 累计成交量（股） | float |
| money | 累计成交额 | float |
| a1\_v~a5\_v | 五档卖量 | float |
| a1\_p~a5\_p | 五档卖价 | float |
| b1\_v~b5\_v | 五档买量 | float |
| b1\_p~b5\_p | 五档买价 | float |

**获取场内基金tick数据示例**：

指数tick数据 2017-01-01起

**指数部分， 支持 2017-01-01 至今的tick数据。盘后15:00更新，24:00校对完成入库**

**购买**：用户如有需要使用tick数据的，可添加**微信号JQData02**申请试用或咨询开通，或发送邮件至jqdatasdk@joinquant.com

**参数**：

-   security: 指数代码，如'000001.XSHG'
-   start\_dt: 开始日期，格式为'YYYY-MM-DD HH:MM:SS'
-   end\_dt: 结束日期，格式为'YYYY-MM-DD HH:MM:SS'
-   count: 取出指定时间区间内前N条的tick数据。
-   fields: 选择要获取的行情数据字段，默认为None，返回结果如下指数tick返回结果。
-   skip:默认为True，过滤掉无成交变化的tick数据；当指定skip=False时，返回的tick数据会保留无成交有盘口变化的tick数据
-   df: 默认为True，传入单个标的返回的是一个dataframe, 当df=False的时候，返回一个np.ndarray

**指数tick返回结果：**

| 字段名 | 说明 | 字段类型 |
| --- | --- | --- |
| time | 时间 | datetime |
| current | 当前价 | float |
| high | 当日最高价 | float |
| low | 当日最低价 | float |
| volume | 累计成交量（股） | float |
| money | 累计成交额（元） | float |

**获取指数tick数据示例**：
