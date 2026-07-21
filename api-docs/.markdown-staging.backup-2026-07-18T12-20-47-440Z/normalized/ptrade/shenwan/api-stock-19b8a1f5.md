---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: strategy_api
title: 现货查询类接口
section_path:
  - 现货专用接口
  - 现货查询类接口
source_file: api-docs/raw/ptrade/shenwan/10_api_stock.html
source_url: http://101.71.132.53:9091/qthelp/api/stock.html
source_anchor: "#现货查询类接口"
source_sha256: ddf9524069d23afe5bf97ae287e70df82de6435d1b8b78f13c7bf6c288414e73
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="现货查询类接口"></a>

## 现货查询类接口

<a id="get_etf_list"></a>

### `get_etf_list`

<a id="中文名-12"></a>

#### 中文名

获取ETF代码

<a id="接口说明-12"></a>

#### 接口说明

该接口用于获取柜台返回的可申赎ETF代码列表和可交易ETF代码列表。

<a id="接口定义-12"></a>

#### 接口定义

python

```python
get_etf_list(qry_type=None, date=None)
```

<a id="使用场景-12"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

1.  当qry\_type入参为'redeem'时，仅支持交易场景使用，且仅支持获取交易日当日的数据，在此场景下date入参无效;

2.  对接jz\_ufx、ATP、云订柜台不支持;


<a id="参数-12"></a>

#### 参数

**`qry_type`**

-   类型： `str`
-   默认： `None`

查询类型，'redeem'-可申赎标的查询、'trade'-可交易标的查询，选填字段，默认值为'redeem'

**`date`**

-   类型： `str`
-   默认： `None`

查询日期，支持的日期格式为YYYYmmdd，选填字段，不传时默认获取的是当前交易日的数据

<a id="返回-11"></a>

#### 返回

`list[str,...]`:

-   正常返回一个list类型对象，包含所有ETF代码
-   异常返回空list，如\[\]

md

```md
['510010.SS', '510020.SS', '510030.SS', '510050.SS', '510060.SS', '510180.SS', '510300.SS', '510310.SS', '510330.SS', '511800.SS', '511810.SS', '511820.SS', '511830.SS', '511880.SS', '511990.SS', '512010.SS', '512510.SS', '159001.SZ', '159003.SZ', '159005.SZ', '159901.SZ', '159903.SZ', '159905.SZ', '159906.SZ', '159909.SZ', '159910.SZ', '159919.SZ', '159923.SZ', '159923.SZ', '159924.SZ', '159925.SZ', '159927.SZ', '159928.SZ', '159929.SZ']
```

<a id="示例-12"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 获取可申赎ETF代码列表
    etf_code_list = get_etf_list()
    log.info('可申赎ETF列表为%s' % etf_code_list)
    # 获取可交易ETF代码列表
    etf_code_list = get_etf_list(qry_type='trade')
    log.info('可交易ETF列表为%s' % etf_code_list)
```

<a id="get_etf_info"></a>

### `get_etf_info`

<a id="中文名-13"></a>

#### 中文名

获取ETF信息

<a id="接口说明-13"></a>

#### 接口说明

该接口用于获取单支或者多支ETF的信息。

<a id="接口定义-13"></a>

#### 接口定义

python

```python
get_etf_info(etf_code)
```

<a id="使用场景-13"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接jz\_ufx、ATP、云订柜台不支持该函数

<a id="参数-13"></a>

#### 参数

**`etf_code`**

-   类型： `list[str]/str`

-   单支ETF代码或者一个ETF代码的list，必填字段


<a id="返回-12"></a>

#### 返回

`dict[str:dict[...]]`:

-   正常返回一个dict类型字段，包含每只ETF信息，key为ETF代码，values为包含etf信息的dict
-   异常返回空dict，如{}

md

```md
{
    '510020.XSHG': {
        'nav_percu': 206601.39,
        'redeem_max': 0.0,
        'nav_pre': 0.207,
        'report_unit': 1000000,
        'max_cash_ratio': 0.4,
        'cash_balance': -813.75,
        'etf_redemption_code': '510021',
        'pre_cash_component': 598.39,
        'allot_max': 0.0,
        'publish': 1
    }
}

返回结果字段介绍：
    etf_redemption_code -- 申赎代码(str:str)；
    publish -- 是否需要发布IOPV(str:int), 1-需要发布，0-不需要发布；
    report_unit -- 最小申购、赎回单位(str:int)；
    cash_balance -- 现金差额(str:float)；
    max_cash_ratio -- 现金替代比例上限(str:float)；
    pre_cash_component -- T-1日申购基准单位现金余额(str:float)；
    nav_percu -- T-1日申购基准单位净值(str:float)；
    nav_pre -- T-1日基金单位净值(str:float)；
    allot_max -- 申购上限(str:float)；
    redeem_max -- 赎回上限(str:float)；
```

<a id="示例-13"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    #ETF信息
    etf_info = get_etf_info('510020.XSHG')
    log.info(etf_info)
    etfs_info = get_etf_info(['510020.XSHG','510050.XSHG'])
    log.info(etfs_info)
```

<a id="get_etf_stock_list"></a>

### `get_etf_stock_list`

<a id="中文名-14"></a>

#### 中文名

获取ETF成分券列表

<a id="接口说明-14"></a>

#### 接口说明

该接口用于获取目标ETF的成分券列表。

<a id="接口定义-14"></a>

#### 接口定义

python

```python
get_etf_stock_list(etf_code)
```

<a id="使用场景-14"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-14"></a>

#### 参数

**`etf_code`**

-   类型： `str`

-   单支ETF代码，必填字段


<a id="返回-13"></a>

#### 返回

`list[str,...]`:

-   正常返回一个list类型字段，包含每只etf代码所对应的成分股
-   异常返回空list，如\[\]

md

```md
['600000.SS', '600010.SS', '600016.SS']
```

<a id="示例-14"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def before_trading_start(context, data):
    #ETF成分券列表
    stock_list = get_etf_stock_list('510020.SS')
    log.info(stock_list)

def handle_data(context, data):
    pass
```

<a id="get_etf_stock_info"></a>

### `get_etf_stock_info`

<a id="中文名-15"></a>

#### 中文名

获取ETF成分券信息

<a id="接口说明-15"></a>

#### 接口说明

该接口用于获取ETF成分券信息。

<a id="接口定义-15"></a>

#### 接口定义

python

```python
get_etf_stock_info(etf_code,security)
```

<a id="使用场景-15"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   对接jz\_ufx、ATP、云订柜台不支持该函数

<a id="参数-15"></a>

#### 参数

**`etf_code`**

-   类型： `str`

-   单支ETF代码，必填字段


**`security`**

-   类型： `list[str]/str`

-   单只股票代码或者一个由多只股票代码组成的列表，必填字段


<a id="返回-14"></a>

#### 返回

`dict[str:dict[...]`:

-   正常返回一个dict类型字段，包含每只etf代码中成分股的信息
-   异常返回空dict，如{}

md

```md
{
    '600000.XSHG': {
        'cash_replace_flag': '1',
        'replace_ratio': 0.1,
        'is_open': 1,
        'code_num': 4700.0,
        'replace_balance': 0.0
    }
}

    code_num -- 成分券数量(str:float)；
    cash_replace_flag -- 现金替代标志(str:str)；
    replace_ratio -- 保证金率(溢价比率)，允许现金替代标的此字段有效(str:float)；
    replace_balance -- 替代金额,必须现金替代标的此字段有效(str:float)；
    is_open -- 停牌标志，0-停牌，1-非停牌(str:int)；
```

<a id="示例-15"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    #ETF成分券信息
    stock_info = get_etf_stock_info('510050.XSHG','600000.XSHG')
    log.info(stock_info)
    stocks_info = get_etf_stock_info('510050.XSHG',['600000.XSHG','600036.XSHG'])
    log.info(stocks_info)
```

<a id="get_ipo_stocks"></a>

### `get_ipo_stocks`

<a id="中文名-16"></a>

#### 中文名

获取当日IPO申购标的

<a id="接口说明-16"></a>

#### 接口说明

该接口用于获取当日IPO申购标的信息。

<a id="接口定义-16"></a>

#### 接口定义

python

```python
get_ipo_stocks()
```

<a id="使用场景-16"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

1.  使用前请与券商确认柜台是否支持该函数.

<a id="返回-15"></a>

#### 返回

`{"上证普通代码": [str, ...], "上证科创板代码": [str, ...], "深证普通代码": [str, ...], "深证创业板代码": [str, ...], "可转债代码": [str, ...], "北交所代码": [str, ...]}`:

-   正常返回dict({"上证普通代码": \[str, ...\], "上证科创板代码": \[str, ...\], "深证普通代码": \[str, ...\], " 深证创业板代码": \[str, ...\], "可转债代码": \[str, ...\], "北交所代码": \[str, ...\]})。
-   异常返回空字典dict()。

md

```md
{
    '上证普通代码': ['732116.SS', '732136.SS'],
    '上证科创板代码': ['787006.SS'],
    '深证普通代码': ['002952.SS', '072318.SS'],
    '深证创业板代码': ['300765.SS'],
    '可转债代码': ['718001.SS', '783012.SS'],
    '北交所代码': ['889113.NEEQ'],
}
```

md

```md
分类市场明细如下：
上证普通代码
上证科创板代码
深证普通代码
深证创业板代码
可转债代码
北交所代码
```

<a id="示例-16"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.SS"
    set_universe(g.security)


def handle_data(context, data):
    # 当日可转债IPO申购标的
    ipo_stocks = get_ipo_stocks().get("可转债代码")
    log.info("可转债IPO申购标的列表为：{}".format(ipo_stocks))
```

* * *

说明

接口支持的业务范围以及支持在引擎的哪些流程函数中调用，详见 [接口列表](http://101.71.132.53:9091/qthelp/api/list.html)
