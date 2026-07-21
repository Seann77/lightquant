---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: market_data
title: 市场代码接口
section_path:
  - 数据接口
  - 市场代码接口
source_file: api-docs/raw/ptrade/shenwan/08_api_data.html
source_url: http://101.71.132.53:9091/qthelp/api/data.html
source_anchor: "#市场代码接口"
source_sha256: f3ab9ba25e36fa781998eb70f34588f59350edf1682aa3d8402bc435e3042b1e
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="市场代码接口"></a>

## 市场代码接口

<a id="get_market_list"></a>

### `get_market_list`

<a id="中文名-4"></a>

#### 中文名

获取市场列表

<a id="接口说明-4"></a>

#### 接口说明

该接口用于返回当前市场列表目录。

<a id="接口定义-4"></a>

#### 接口定义

python

```python
get_market_list()
```

<a id="使用场景-4"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

<a id="返回-4"></a>

#### 返回

`pandas.DataFrame`：

-   返回字段包括：
    -   finance\_mic - 市场编码(str)
    -   finance\_name - 市场名称(str)

<a id="示例-4"></a>

#### 示例

python

```python
get_market_list()
```

如返回：

|  | finance\_mic | finance\_name |
| --- | --- | --- |
| 1 | SS | 上海证券交易所 |
| 2 | SZ | 深圳证券交易所 |
| 3 | CSI | 中证指数 |
| 4 | XBHS | 沪深板块 |

<a id="get_market_detail"></a>

### `get_market_detail`

<a id="中文名-5"></a>

#### 中文名

获取市场详细信息

<a id="接口说明-5"></a>

#### 接口说明

该接口用于返回市场编码对应的详细信息。

<a id="接口定义-5"></a>

#### 接口定义

python

```python
get_market_detail(finance_mic)
```

<a id="使用场景-5"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   仅支持get\_market\_list接口所返回的四个市场数据。

<a id="参数-4"></a>

#### 参数

**`finance_mic`**

-   类型： `str`

市场代码，相关市场编码参考[get\_market\_list](#get_market_list) 返回信息，必填字段

<a id="返回-5"></a>

#### 返回

`pandas.DataFrame`：

-   返回市场详细信息，字段包括：
    -   prod\_code: 产品代码(str)
    -   prod\_name: 产品名称(str)
    -   hq\_type\_code: 类型代码(str)
    -   trade\_time\_rule: 时间规则(numpy.int64)

如返回：

| hq\_type\_code | prod\_code | prod\_name | trade\_time\_rule |
| --- | --- | --- | --- |
| MRI | 000001 | 上证指数 | 0 |
| MRI | 000002 | Ａ股指数 | 0 |
| ... | ... | ... | ... |

<a id="示例-5"></a>

#### 示例

python

```python
# 获取上海证券交易所相关信息 'XSHG'/'SS'
get_market_detail('XSHG')
```

<a id="get_stock_name"></a>

### `get_stock_name`

<a id="中文名-6"></a>

#### 中文名

获取证券名称

<a id="接口说明-6"></a>

#### 接口说明

该接口可获取股票、可转债、ETF、港股通等名称。

<a id="接口定义-6"></a>

#### 接口定义

python

```python
get_stock_name(stocks)
```

<a id="使用场景-6"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   交易场景下，默认每个交易日的09:07分~09:09之间完成当日数据的更新，因此在09:10分之后正常情况下可以获取到当天更新的数据。
-   如当日未更新，新股返回空dict。

<a id="参数-5"></a>

#### 参数

**`stocks`**

-   类型： `list[str]` 或 `str`

证券代码，必填字段

<a id="返回-6"></a>

#### 返回

`dict[str:str]`：

-   证券名称字典，key为证券代码，value为证券名称
-   查询不到或输入有误时，value为 None

如

md

```md
{'600570.XSHG': '恒生电子'}
```

<a id="示例-6"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '600571.XSHG']
    set_universe(g.security)

def handle_data(context, data):
    # 获取600570.SS股票名称
    stock_name = get_stock_name(g.security[0])
    log.info(stock_name)
    # 获取股票池所有的证券名称
    stock_names = get_stock_name(g.security)
    log.info(stock_names)
```

<a id="get_stock_info"></a>

### `get_stock_info`

<a id="中文名-7"></a>

#### 中文名

获取证券基础信息

<a id="接口说明-7"></a>

#### 接口说明

该接口可获取股票、可转债、ETF的证券代码对应公司名、证券上市日期、证券退市日期。

<a id="接口定义-7"></a>

#### 接口定义

python

```python
get_stock_info(stocks, field=None)
```

<a id="使用场景-7"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   field 不做入参时默认只返回 stock\_name 字段。

<a id="参数-6"></a>

#### 参数

**`stocks`**

-   类型： `list[str]/str`

证券代码，必填字段

**`field`**

-   类型： `list[str]/str`
-   默认 `None`

指明数据结果集中所支持输出字段，支持：

-   stock\_name -- 证券代码对应公司名(str)
-   listed\_date -- 证券上市日期(str)
-   de\_listed\_date -- 证券退市日期，若未退市，返回2900-01-01(str)

<a id="返回-7"></a>

#### 返回

`dict[str:dict[str:str]]`：

-   嵌套 dict 类型，包含 field 中指定内容，选填字段，若 field=None，返回证券基础信息仅包含对应公司名，如：

md

```md
{
    '600570.XSHG': {
        'stock_name': '恒生电子',
        'listed_date': '2003-12-16',
        'de_listed_date': '2900-01-01'
    }
}
```

<a id="示例-7"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600570.XSHG', '600571.XSHG']
    set_universe(g.security)

def handle_data(context, data):
    # 获取单支证券的基础信息
    stock_info = get_stock_info(g.security[0])
    log.info(stock_info)
    # 获取多支证券的基础信息
    stock_infos = get_stock_info(g.security, ['stock_name','listed_date','de_listed_date'])
    log.info(stock_infos)
```

<a id="get_stock_status"></a>

### `get_stock_status`

<a id="中文名-8"></a>

#### 中文名

获取证券状态信息

<a id="接口说明-8"></a>

#### 接口说明

该接口用于获取指定日期证券的ST、停牌、退市、退市整理期属性。

<a id="接口定义-8"></a>

#### 接口定义

python

```python
get_stock_status(stocks, query_type='ST', query_date=None)
```

<a id="使用场景-8"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

<a id="参数-7"></a>

#### 参数

**`stocks`**

-   类型： `list[str]/str`

证券代码，必填字段

**`query_type`**

-   类型： `str`
-   默认 `'ST'`

选填字段，支持以下四种类型属性的查询：

-   'ST' - 查询是否属于ST证券
-   'HALT' - 查询是否停牌
-   'DELISTING' - 查询是否退市
-   'DELISTING\_SORTING' - 查询是否退市整理期(只支持交易场景下查询当日数据，查询历史返回空字典)

**`query_date`**

-   类型： `str`
-   默认 `None`

格式为YYYYmmdd，选填字段，默认为None，表示当前日期（回测为回测当前周期，研究与交易则取系统当前时间）

<a id="返回-8"></a>

#### 返回

`dict[str:bool] | None`：

-   返回dict类型，每支证券对应的值为True或False。
-   查询不到或输入有误时返回None。

如：

md

```md
{'600570': None}
```

<a id="示例-8"></a>

#### 示例

python

```python
def initialize(context):
    g.security = ['600397.SS', '600701.SS', '000001.SZ']
    set_universe(g.security)

def handle_data(context, data):
    stocks_list = g.security
    filter_stocks = []
    # 判断证券是否为ST、停牌或者退市
    st_status = get_stock_status(stocks_list, 'ST')
    # 将不是ST的证券筛选出来
    for i in stocks_list:
        if st_status[i] is not True:
            filter_stocks.append(i)
    # 获取证券停牌信息
    # halt_status = get_stock_status(stocks_list, 'HALT')
    # 获取指定日期的对应属性
    # halt_status = get_stock_status(stocks_list, 'HALT', '20180312')
    # 获取证券退市信息
    # delist_status = get_stock_status(stocks_list, 'DELISTING')
    log.info('筛选不是ST的证券列表: %s' % filter_stocks)
```

<a id="get_underlying_code"></a>

### `get_underlying_code`

<a id="中文名-9"></a>

#### 中文名

获取证券的关联代码

<a id="接口说明-9"></a>

#### 接口说明

该接口用于获取证券的关联代码。

<a id="接口定义-9"></a>

#### 接口定义

python

```python
get_underlying_code(symbols)
```

<a id="使用场景-9"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

<a id="参数-8"></a>

#### 参数

**`symbols`**

-   类型： `str/list[str]`

需要查询的代码，必填字段

<a id="返回-9"></a>

#### 返回

`dict[str: [int, str]]`：

-   返回每个代码的信息包含以下字段内容：
    -   underlying\_type: [关联类型](help-engine-e187e04d.md#underlying_type)(int)
    -   underlying\_code: 关联代码(str)

如：

md

```md
{"110063.XSHG": [1, "600570.XSHG"]}
```

<a id="示例-9"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '000001.XSHE'
    set_universe(g.security)

def handle_data(context, data):
    # 获取110063.SS的关联的代码信息
    underlying_code_info = get_underlying_code("110063.XSHG")
    log.info(underlying_code_info)
    # 获取110063.SS的正股代码
    underlying_code = underlying_code_info["110063.XSHG"][1]
    log.info(underlying_code)
```

<a id="get_stock_exrights"></a>

### `get_stock_exrights`

<a id="中文名-10"></a>

#### 中文名

获取证券除权除息信息

<a id="接口说明-10"></a>

#### 接口说明

该接口用于获取证券除权除息信息。

<a id="接口定义-10"></a>

#### 接口定义

python

```python
get_stock_exrights(stock_code, date=None)
```

<a id="使用场景-10"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

<a id="参数-9"></a>

#### 参数

**`stock_code`**

类型： `str`

证券代码，必填字段。

**`date`**

-   类型： `str/int/datetime.date`
-   默认 `None`

查询该日期的除权除息信息，选填字段，默认获取该证券历史上所有除权除息信息。

<a id="返回-10"></a>

#### 返回

`pandas.DataFrame | None`：

-   有相关数据则返回 pandas.DataFrame 类型数据
-   输入日期若没有除权除息信息则返回 None

如：

md

```md
例如输入get_stock_exrights('600570.XSHG')，返回:
         allotted_ps   rationed_ps   rationed_px   bonus_ps   exer_forward_a   exer_forward_b   exer_backward_a   exer_backward_b
date
20040604  0.0          0.0           0.0           0.43       0.046077         -1.433            1.000000         0.430
20050601  0.5          0.0           0.0           0.20       0.046077         -1.413            1.500000         0.630
20050809  0.4          0.0           0.0           0.00       0.069115         -1.404            2.100000         0.630
20060601  0.4          0.0           0.0           0.11       0.096762         -1.404            2.940000         0.861
20070423  0.3          0.0           0.0           0.10       0.135466         -1.394            3.822000         1.155
20080528  0.6          0.0           0.0           0.07       0.176106         -1.380            6.115200         1.422
20090423  0.5          0.0           0.0           0.10       0.281770         -1.368            9.172799         2.034
20100510  0.4          0.0           0.0           0.05       0.422654         -1.340            12.841919        2.492
20110517  0.0          0.0           0.0           0.05       0.591716         -1.318            12.841919        3.134
20120618  0.0          0.0           0.0           0.08       0.591716         -1.289            12.841919        4.162
20130514  0.0          0.0           0.0           0.10       0.591716         -1.242            12.841919        5.446
20140523  0.0          0.0           0.0           0.16       0.591716         -1.182            12.841919        7.501
20150529  0.0          0.0           0.0           0.18       0.591716         -1.088            12.841919        9.812
20160530  0.0          0.0           0.0           0.26       0.591716         -0.981            12.841919        13.151
20170510  0.0          0.0           0.0           0.10       0.591716         -0.827            12.841919        14.435
20180524  0.0          0.0           0.0           0.29       0.591716         -0.768            12.841919        18.159
20190515  0.3          0.0           0.0           0.32       0.591716         -0.597            16.694494        22.269
20200605  0.3          0.0           0.0           0.53       0.769231         -0.407            21.702843        31.117
```

字段说明：

-   date -- 日期(索引列，类型为int64)；
-   allotted\_ps -- 每股送股(str:numpy.float64)；
-   rationed\_ps -- 每股配股(str:numpy.float64)；
-   rationed\_px -- 配股价(str:numpy.float64)；
-   bonus\_ps -- 每股分红(str:numpy.float64)；
-   exer\_forward\_a -- 前复权除权因子A；用于计算前复权价格(前复权价格=A\*价格+B)(str:numpy.float64)
-   exer\_forward\_b -- 前复权除权因子B；用于计算前复权价格(前复权价格=A\*价格+B)(str:numpy.float64)
-   exer\_backward\_a -- 后复权除权因子A；用于计算后复权价格(后复权价格=A\*价格+B)(str:numpy.float64)
-   exer\_backward\_b -- 后复权除权因子B；用于计算后复权价格(后复权价格=A\*价格+B)(str:numpy.float64)

<a id="示例-10"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    stock_exrights = get_stock_exrights(g.security)
    log.info('the stock exrights info of security %s:\n%s' % (g.security, stock_exrights))
```

<a id="get_stock_blocks"></a>

### `get_stock_blocks`

<a id="中文名-11"></a>

#### 中文名

获取证券所属板块信息

<a id="接口说明-11"></a>

#### 接口说明

该接口用于获取证券所属板块信息。

<a id="接口定义-11"></a>

#### 接口定义

python

```python
get_stock_blocks(stock_code)
```

<a id="使用场景-11"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   该函数获取的是当下的数据，因此回测不能取到真正匹配回测日期的数据，注意未来函数。
-   已退市证券无法成功获取数据，接口会返回None。
-   聚源行业、概念板块、地域板块的成分股分类规则由数据源决定，存在与三方数据源不一致的情况。如用户需要在策略中使用，应自行评估该数据的合理性。

<a id="参数-10"></a>

#### 参数

**`stock_code`**

-   类型： `str`

证券代码，必填字段

<a id="返回-11"></a>

#### 返回

`dict[str:list[list[str,str],...],...] | None`:

-   获取成功返回dict类型，包含所属行业、板块等详细信息
-   获取失败返回None

md

```md
返回数据如：
{
'HGT': [['HGTHGT.XBHK', '沪股通']],
'HY': [['710200.XBHS', '计算机应用']],
'DY': [['DY1172.XBHS', '浙江板块']],
'ZJHHY': [['I65000.XBHS', '软件和信息技术服务业']],
'GN': [['003596.XBHS', '融资融券'], ['003631.XBHS', '转融券标的'], ['003637.XBHS', '互联网金融'], ['003665.XBHS', '电商概念'], ['003707.XBHS', '沪股通'], ['003718.XBHS', '证金持股'], ['003800.XBHS', '人工智能'], ['003830.XBHS', '区块链'], ['031027.XBHS', 'MSCI概念'], ['B10003.XBHS', '蚂蚁金服概念']]
}
```

<a id="示例-11"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    blocks = get_stock_blocks(g.security)
    log.info('security %s in these blocks:\n%s' % (g.security, blocks))
```

<a id="get_index_stocks"></a>

### `get_index_stocks`

<a id="中文名-12"></a>

#### 中文名

指数成分股查询

<a id="接口说明-12"></a>

#### 接口说明

获取一个指数在平台可交易的成分股列表，[指数列表](http://101.71.132.53:9091/qthelp/api/other/index.html)，支持查询历史日期的成分股信息。

<a id="接口定义-12"></a>

#### 接口定义

python

```python
get_index_stocks(index_code, date=None)
```

<a id="使用场景-12"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   在回测中，date不入参默认取当前回测周期所属历史日期。
-   在研究和交易中，date不入参默认取的是当前日期。

<a id="参数-11"></a>

#### 参数

**`index_code`**

-   类型： `str`

指数代码，必填字段

**`date`**

-   类型： `str`
-   默认 `None`

日期，输入形式必须为'YYYYMMDD'，如'20170620'，选填字段，不输入默认为当前日期

<a id="返回-12"></a>

#### 返回

`list[str,...]`：

返回股票代码的list

如：

md

```md
['000001.SZ', '000002.SZ', '000063.SZ', '000069.SZ', '000100.SZ', '000157.SZ', '000425.SZ', '000538.SZ', '000568.SZ', '000625.SZ', '000651.SZ', '000725.SZ', '000728.SZ', '000768.SZ', '000776.SZ', '000783.SZ', '000786.SZ', ..., '603338.SS', '603939.SS', '603233.SS', '600426.SS', '688126.SS', '600079.SS', '600521.SS', '600143.SS', '000800.SZ']
```

<a id="示例-12"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def before_trading_start(context, data):
    # 获取当前所有沪深300的股票
    g.stocks = get_index_stocks('000300.SS')
    log.info(g.stocks)
    # 获取2016年6月20日所有沪深300的股票, 设为股票池
    g.stocks = get_index_stocks('000300.SS','20160620')
    set_universe(g.stocks)
    log.info(g.stocks)

def handle_data(context, data):
    pass
```

<a id="get_industry_stocks"></a>

### `get_industry_stocks`

<a id="中文名-13"></a>

#### 中文名

获取行业成份股

<a id="接口说明-13"></a>

#### 接口说明

该接口用于获取一个行业的所有股票，[行业列表](http://101.71.132.53:9091/qthelp/api/other/industry_concept.html)。

<a id="接口定义-13"></a>

#### 接口定义

python

```python
get_industry_stocks(industry_code)
```

<a id="使用场景-13"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   该函数获取的是当下的数据，因此回测不能取到真正匹配回测日期的数据，注意未来函数。
-   聚源行业、概念板块、地域板块的成份股分类规则由数据源决定，存在与三方数据源不一致的情况。如用户需要在策略中使用，应自行评估该数据的合理性。

<a id="参数-12"></a>

#### 参数

**`industry_code`**

-   类型： `str`

行业编码，尾缀必须是.XBHS，如农业股：A01000.XBHS，必填字段。

<a id="返回-13"></a>

#### 返回

`list[str]`：

-   返回股票代码的list

如：

md

```md
['300970.SZ', '300087.SZ', '300972.SZ', '002772.SZ', '000998.SZ', '002041.SZ', '600598.SS', '600371.SS', '600506.SS', '300511.SZ', '600359.SS', '600354.SS', '601118.SS', '600540.SS', '300189.SZ', '600313.SS', '600108.SS']
```

<a id="示例-13"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def before_trading_start(context, data):
    # 获取农业的股票, 设为股票池
    stocks = get_industry_stocks('A01000.XBHS')
    set_universe(stocks)
    log.info(stocks)

def handle_data(context, data):
    pass
```

<a id="get_Ashares"></a>

### `get_Ashares`

<a id="中文名-14"></a>

#### 中文名

获取指定日期A股代码列表

<a id="接口说明-14"></a>

#### 接口说明

该接口用于获取指定日期的所有A股代码列表，包括沪深两市的A股股票。

<a id="接口定义-14"></a>

#### 接口定义

python

```python
get_Ashares(date=None)
```

<a id="使用场景-14"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   在回测中，date不入参默认取回测日期，默认值会随着回测日期变化而变化，等于context.blotter.current\_dt。
-   在研究和交易中，date不入参默认取当天日期。

<a id="参数-13"></a>

#### 参数

**`date`**

-   类型： `str`
-   默认： `None`

格式为YYYYmmdd，选填字段，默认为当天日期

<a id="返回-14"></a>

#### 返回

`list[str,...]`:

-   股票代码列表，list类型

md

```md
['000001.SZ', '000002.SZ', '000004.SZ', '000005.SZ', '000006.SZ', '000007.SZ', '000008.SZ', '000009.SZ', '000010.SZ', '000011.SZ', '000012.SZ', '000014.SZ', '000016.SZ', '000017.SZ', '000018.SZ', '000019.SZ', '000020.SZ', '000021.SZ', '000023.SZ', '000024.SZ', '000025.SZ', '000026.SZ', '000027.SZ',..., '603128.SS', '603167.SS', '603333.SS', '603366.SS', '603399.SS', '603766.SS', '603993.SS']
```

<a id="示例-14"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 沪深A股代码
    ashares = get_Ashares()
    log.info('%s A股数量为%s' % (context.blotter.current_dt,len(ashares)))
    ashares = get_Ashares('20130512')
    log.info('20130512 A股数量为%s'%len(ashares))
```

<a id="get_cb_list"></a>

### `get_cb_list`

<a id="中文名-15"></a>

#### 中文名

可转债列表查询

<a id="接口说明-15"></a>

#### 接口说明

获取当前可转债市场的所有代码列表，包括正常交易和停牌的转债代码。

<a id="接口定义-15"></a>

#### 接口定义

python

```python
get_cb_list()
```

<a id="使用场景-15"></a>

#### 使用场景

❌研究 ❌回测 ✅交易

注意事项

-   为减小对行情服务压力，该函数在交易模块中同一分钟内多次调用返回当前分钟首次查询的缓存数据。

<a id="返回-15"></a>

#### 返回

`list[str,...]`:

-   当前可转债市场的所有代码列表（包含停牌代码），list类型

<a id="示例-15"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.SS"
    set_universe(g.security)
    run_daily(context, get_trade_cb_list, "9:25")

def before_trading_start(context, data):
    # 每日清空，避免取到昨日市场代码表
    g.trade_cb_list = []

def handle_data(context, data):
    pass

# 获取当天可交易的可转债代码列表
def get_trade_cb_list(context):
    cb_list = get_cb_list()
    cb_snapshot = get_snapshot(cb_list)
    # 代码有行情快照并且交易状态不在暂停交易、停盘、长期停盘、退市状态的判定为可交易代码
    g.trade_cb_list = [cb_code for cb_code in cb_list if
                       cb_snapshot.get(cb_code, {}).get("trade_status") not in
                       [None, "HALT", "SUSP", "STOPT", "DELISTED"]]
    log.info("当天可交易的可转债代码列表为：%s" % g.trade_cb_list)
```

<a id="get_cb_info"></a>

### `get_cb_info`

<a id="中文名-16"></a>

#### 中文名

可转债信息查询

<a id="接口说明-16"></a>

#### 接口说明

获取可转债基础信息，包括可转债代码、名称、对应股票、转股价格、溢价率等详细信息。

<a id="接口定义-16"></a>

#### 接口定义

python

```python
get_cb_info()
```

<a id="使用场景-16"></a>

#### 使用场景

✅研究 ❌回测 ✅交易

注意事项

-   获取失败时返回空DataFrame。
-   此API依靠可转债基础数据权限，使用前请与券商确认是否有此权限，无权限时调用返回空DataFrame。

<a id="返回-16"></a>

#### 返回

`pandas.DataFrame`：

-   正常返回一个DataFrame类型数据，包含每只可转债的信息
-   异常失败时返回空DataFrame
-   主要字段：
    -   bond\_code: 可转债代码(str)
    -   bond\_name: 可转债名称(str)
    -   stock\_code: 股票代码(str)
    -   stock\_name: 股票名称(str)
    -   list\_date: 上市日期(str)
    -   premium\_rate: 溢价率(float)
    -   convert\_date: 转股起始日(str)
    -   maturity\_date: 到期日(str)
    -   convert\_rate: 转股比例(float)
    -   convert\_price: 转股价格(float)
    -   convert\_value: 转股价值(float)

<a id="示例-16"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    df = get_cb_info()
    log.info(df)
```

<a id="get_reits_list"></a>

### `get_reits_list`

<a id="中文名-17"></a>

#### 中文名

获取基础设施公募REITs基金代码列表

<a id="接口说明-17"></a>

#### 接口说明

该接口用于获取指定日期沪深市场的所有公募REITs基金代码列表。

<a id="接口定义-17"></a>

#### 接口定义

python

```python
get_reits_list(date=None)
```

<a id="使用场景-17"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   在回测中，date不入参默认取回测日期，默认值会随着回测日期变化而变化，等于context.blotter.current\_dt。
-   在研究和交易中，date不入参默认取当天日期。

<a id="参数-14"></a>

#### 参数

**`date`**

-   类型： `str`
-   默认： `None`

格式为YYYYmmdd，选填字段，默认为当天日期

<a id="返回-17"></a>

#### 返回

`list[str,...]`：

-   公募REITs基金代码列表，list类型

md

```md
['180101.SZ', '180102.SZ', '180103.SZ', '180201.SZ', '180202.SZ', '180301.SZ', '180401.SZ', '180501.SZ', '180801.SZ', '508000.SS', '508001.SS', '508006.SS', '508008.SS', '508009.SS', '508018.SS', '508021.SS', '508027.SS', '508028.SS', '508056.SS', '508058.SS', '508066.SS', '508068.SS', '508077.SS', '508088.SS', '508096.SS', '508098.SS', '508099.SS']
```

<a id="示例-17"></a>

#### 示例

python

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    # 公募REITs基金代码
    ashares = get_reits_list()
    log.info('%s 公募REITs基金数量为%s' % (context.blotter.current_dt,len(ashares)))
    ashares = get_reits_list('20230403')
    log.info('20230403 公募REITs基金数量为%s'%len(ashares))
```

<a id="get_block_info"></a>

### `get_block_info`

<a id="中文名-18"></a>

#### 中文名

获取板块数据

<a id="接口说明-18"></a>

#### 接口说明

获取当前板块数据，包括地域、概念、证监会行业、聚源行业、指数五种数据。

<a id="接口定义-18"></a>

#### 接口定义

python

```python
get_block_info(block_type)
```

<a id="使用场景-18"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   返回数据为当前最新的板块分类，不支持查询历史的分类，回测场景使用要注意与历史分类不一致的情况。

<a id="参数-15"></a>

#### 参数

**`block_type`**

-   类型： `str`

'DY'（地域）、'GN'（概念）、'HY'（聚源行业）、'ZJHHY'（证监会行业）、'ZS'（指数），必填字段

<a id="返回-18"></a>

#### 返回

`pandas.DataFrame`：

-   板块数据

<a id="示例-18"></a>

#### 示例

python

```python
def initialize(context):
    # 初始化策略
    g.security = "600570.XSHG"
    set_universe(g.security)
def before_trading_start(context, data):
    df = get_block_info('ZJHHY')
    log.info(df)
def handle_data(context, data):
    pass
```

<a id="get_dominant_contract"></a>

### `get_dominant_contract`

<a id="中文名-19"></a>

#### 中文名

主力合约查询

<a id="接口说明-19"></a>

#### 接口说明

获取期货连续合约对应的主力合约代码及相关信息。

<a id="接口定义-19"></a>

#### 接口定义

python

```python
get_dominant_contract(contract, date=None)
```

<a id="使用场景-19"></a>

#### 使用场景

✅研究 ✅回测 ✅交易

注意事项

-   此API依靠期货主力合约与对应月合约数据权限，使用前请与券商确认是否有此权限，无权限时调用返回空dict。

<a id="参数-16"></a>

#### 参数

**`contract`**

-   类型： `str`

期货的连续合约代码，必填字段

**`date`**

-   类型： `str/datetime`
-   默认： `None`

查询日期，选填字段，不入参默认为当前日期，支持'YYYY-mm-dd'和'YYYYmmdd'格式

<a id="返回-19"></a>

#### 返回

`dict[str:dict]`：

-   期货连续合约对应的主力合约相关信息，key为主力合约，value为dict类型，包含以下字段：
    -   corr\_month\_code: 主力合约代码(str)
    -   trade\_date: 交易日期(str)
    -   month\_contract\_name: 主力合约名称(str)

<a id="示例-19"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "IF2312.CCFX"
    set_universe(g.security)

def handle_data(context, data):
    # 获取2023年1月3日的IF主力合约代码
    main_code_info = get_dominant_contract("IF888.CCFX",date='2023-01-03')
    log.info(main_code_info)
    # 获取当前交易日的IF主力合约代码
    main_code = get_dominant_contract("IF888.CCFX")["IF888.CCFX"]['corr_month_code']
    log.info(main_code)
```
