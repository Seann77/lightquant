---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 因子定义和计算
section_path:
  - 因子分析
  - 因子定义和计算
source_file: api-docs/raw/joinquant/factor/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=factor
source_anchor: "#因子定义和计算"
source_sha256: 696149a6fbb4eae39080d3f3c6a739d62f8dd42a478ed6b4a76377894ff94a05
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="因子定义和计算"></a>

## 因子定义和计算

**学习资料**

-   [开源因子分析框架：jqfactor\_analyzer](https://github.com/JoinQuant/jqfactor_analyzer)
-   [经典教程：因子及多因子分析](https://www.joinquant.com/view/community/detail/5535e9ae3e551e132aa441219a71999d)
-   [【有用功】从单因子到策略](https://www.joinquant.com/view/community/detail/bcde6092a40c993ba697c70d5477cb89)
-   [获取因子看板列表数据](https://www.joinquant.com/help/api/help?name=api#get_factor_kanban_values)

<a id="因子计算"></a>

### 因子计算

在回测以及研究中， 可以通过调用jqfactor中的 calc\_factors 函数来计算单因子分析中定义的因子值。

为了便于理解，将因子计算部分置于因子定义前面。

```python
calc_factors(securities, factors, start_date, end_date, use_real_price, skip_paused)
```

**参数**

-   securities: 股票代码列表。
-   factors: 因子(object)列表
-   start\_date: 开始日期
-   end\_date: 在回测中使用时，注意应该保证截止日期小于 context.current\_dt
-   use\_real\_price: 是否使用真实价格。默认为 False，表示使用后复权价格。
-   skip\_paused:是否跳过停牌。 默认为 False。 注意：当 dependencies 使用的因子为价量信息，且 skip\_paused = True 时，返回的 DataFrame 的索引由 datetime 变为 int， 值越大，表示离『当前』日期越近。其他情况下，返回的 DataFrame 的索引为 datetime。

**返回值** 返回一个 dict 对象, key 是各 factors 的 name，value 是一个pandas.DataFrame，DataFrame 的 index 是日期， column 是股票代码。

**示例**

示例中的ALPHA013、GROSSPROFITABILITY为自定义因子，定义因子的方法及说明见下节**因子定义**。

```python
# 导入函数库
from jqfactor import Factor, calc_factors

# 定义因子
class ALPHA013(Factor):
    name = 'alpha013_name'
    max_window = 1
    dependencies = ['high','low','volume','money']
    def calc(self, data):
        high = data['high']
        low = data['low']
        vwap = data['money']/data['volume']
        return (np.power(high*low,0.5) - vwap).mean()

# 定义因子
class GROSSPROFITABILITY(Factor):
    name = 'gross_profitability'
    max_window = 1
    dependencies = ['total_operating_revenue','total_operating_cost','total_assets']
    def calc(self, data):
        total_operating_revenue = data['total_operating_revenue']
        total_operating_cost = data['total_operating_cost']
        total_assets = data['total_assets']
        gross_profitability = (total_operating_revenue - total_operating_cost)/total_assets
        return gross_profitability.mean()
# 定义股票池
securities = ['600000.XSHG','600016.XSHG']
# 计算因子值
factors = calc_factors(securities, [ALPHA013(),GROSSPROFITABILITY()], start_date='2017-01-01', end_date='2017-02-01',  use_real_price=False, skip_paused=False)

# 查看因子值
factors['alpha013_name'].head()
>>>
600000.XSHG  600016.XSHG
2017-01-03    -0.176511    -0.070154
2017-01-04    -0.068026     0.006268
2017-01-05    -0.092072     0.022604
2017-01-06    -0.021411     0.259906
2017-01-09     0.054015    -0.118956
```

<a id="因子定义"></a>

### 因子定义

**使用方法**
`用户需要实现一个自定义因子的类， 继承 Factor 类， 并实现 calc 方法。`
`max_window 和 dependencies 定义了在 calc 中可以获取到的数据，calc 实现因子的算法。`
`calc 的返回值即每天的因子值。 calc 需要返回一个pandas.Series。index 是股票代码， value 是因子值。`

```python
class MA5(Factor):
    name = 'ma5'
    # 每天获取过去五日的数据
    max_window = 5
    # 获取的数据是收盘价
    dependencies = ['close']
    def calc(self, data):
        # print("现在处理{}的数据"format( self._current_date)) #打印逻辑日期
        return data['close'][-5:].mean()
```

**各属性的含义**

-   name： 因子的名称， 不能与基础因子冲突。
-   max\_window： 获取数据的最长时间窗口，返回的是日级别的数据。
-   dependencies： 依赖的基础因子名称。
-   main\_class: 指定是否为主因子，取值为 True 或 False，仅单因子分析时有效当因子需要定义依赖因子时，用该字段指定需要分析的主因子。

**dependencies 中可以使用的基础因子**

| 数据 | 说明 | 示例 |
| --- | --- | --- |
| 价量信息 | 包含open\\close\\high\\low\\money\\volume 字段
当use\_real\_price=True时使用动态复权数据 , 为False时使用后复权数据 | dependencies=\[‘open'\] |
| 聚宽因子库数据 | 包含质量因子、基础因子、情绪因子、成长因子、风险因子、每股因子等数百个因子数据
详细的因子列表请参考[因子库](https://www.joinquant.com/help/api/help?name=factor_values) | 质量因子: 营业周期、市场杠杆
dependencies = \['OperatingCycle','MLEV'\] |
| 单季度财务指标因子 | 每日可看到的最新单季度财务指标。包含市值数据（valuation）、资产负债数据（balance）、现金流数据（cash\_flow）、利润数据（income）、财务指标数据（indicator）。
可以直接使用该指标的名称获取数据。详细的指标列表请参考：[股票财务数据](https://www.joinquant.com/data/dict/fundamentals) | 获取利润表（income）中的营业收入（operating\_revenue）数据
dependencies = \[‘operating\_revenue'\] |
| 前 N 季度的财务数据 | 前1-8季度的单季度财务指标。
包含资产负债数据（balance）、现金流数据（cash\_flow）、利润数据（income）、财务指标数据（indicator）。
可以通过在因子后加『\_1』的方式， 获取前几个季度的财务指标。
详细的指标列表请参考：[股票财务数据](https://www.joinquant.com/data/dict/fundamentals) | 某公司于6月23日发布半年报，当前的逻辑时间是6月24日
operating\_revenue 表示第二季度的营业收入
operating\_revenue\_1 表示第一季度的营业收入。 |
| 过去五年的年度财务数据 | 过去五年的年度财务数据
包含资产负债数据（balance）、现金流数据（cash\_flow）、利润数据（income）、财务指标数据（indicator）。
可以通过在因子后加『\_y1』的方式， 获取前几年的财务指标。
详细的指标列表请参考：[股票财务数据](https://www.joinquant.com/data/dict/fundamentals) | 当前的逻辑时间是2016年9月24日
operating\_revenue\_y 表示当前时间可以看到的最新年度营业收入数据，即2015年的营业收入数据
operating\_revenue\_y1 表示2014年的营业收入数据。 |
| 行业因子 | 包含证监会行业分类、聚宽一、二级行业分类以及申万一、二、三级行业分类。
因子名称是行业代码， 因子值是一个哑变量，如果某股票属于某行业， 则返回1， 否则， 返回0。
详细的行业列表请参考[行业数据](https://www.joinquant.com/data/dict/plateData) | 获取聚宽一级能源行业因子
dependencies = \[‘HY001’\] |
| 概念因子 | 因子的名称是概念代码，因子值是一个哑变量， 如果某股票属于某个概念，则返回1； 否则，返回0。
详细的概念列表请参考[概念数据](https://www.joinquant.com/data/dict/plateData) | 获取智能电网概念因子
dependencies = \[‘GN028’\] |
| 指数因子 | 因子名称是指数代码， 因子值是一个哑变量， 如果某股票属于某个指数，则返回1； 否则，返回0。
详细的指数列表请参考[指数数据](https://www.joinquant.com/data/dict/indexData) | 获取沪深300指数因子
dependencies = \[‘000300.XSHG’\] |
| 资金流因子 | 即 [get\_money\_flow](https://www.joinquant.com/api#jqdatagetmoneyflow-%E8%8E%B7%E5%8F%96%E8%B5%84%E9%87%91%E6%B5%81%E4%BF%A1%E6%81%AF) API 查询的数据。
可以使用的字段包括：change\_pct(涨跌幅(%)、net\_amount\_main(主力净额(万))、net\_pct\_main(主力净占比(%))、net\_amount\_xl(超大单净额(万))、net\_pct\_xl(超大单净占比(%))、net\_amount\_l(大单净额(万))、net\_pct\_l(大单净占比(%))、net\_amount\_m(中单净额(万))、net\_pct\_m(中单净占比(%))、net\_amount\_s(小单净额(万))、net\_pct\_s(小单净占比(%)) | 获取主力净占比因子
dependencies = \[‘net\_pct\_main’\] |

**calc 的参数**

在 calc 中，
(1) self.\_current\_date返回当前数据的逻辑日期，使用此日期可以结合其他取数api获取到更多额外的数据，因子分析是使用T日因子值和T+X日后的收益进行分析，因此获取此日期(T日)收盘后的数据不存在未来信息。
(2) 可以通过 data 参数获取通过 max\_window 和 dependencies 定义的数据。 data 是一个 dict， key 是 dependencies 中的因子名称， value 是pandas.DataFrame。

-   DataFrame 的 column 是股票代码;
-   DataFrame 的 index 是一个时间序列，结束时间是当前时间， 长度是 max\_window;

**calc 的返回值**

需要保证返回一个pandas.Series, index 股票代码， value 是因子值。

注意：当 max\_window 设置为1时，返回的是一个**1行N列**的 dataframe。需要使用dataframe.iloc\[0\] 或 dataframe.mean() 的方式转换为一个 Series。

<a id="在因子定义中获取额外数据"></a>

### 在因子定义中获取额外数据

```python
self._get_extra_data(securities=[],fields=[])
```

在 calc 方法中获取额外数据的方法。可以用来获取指数收盘价等数据。 **只能在 calc 内部使用**

**参数**

-   securities:股票代码的列表，可以使用个股和指数
-   fields:基础因子名称列表。表示需要获取那些基础因子。支持的因子与 dependencies 中相同。

**返回**

-   dict, 结构与 data 类似。 dict 的 key 是 fields 中定义的基础因子名称。 value 是一个 dataframe。 dataframe 的 index 是日期索引， column 是 securities 中定义的股票代码， values 是因子值。 其中， index 的时间跨度与 data 中一致， 都是由 max\_window 定义的。

**示例 获取指数收盘价**

```python
class IndexClose(Factor):
    name = 'indice_close'
    max_window = 10
    dependencies = ['market_cap']

    def calc(self, data):
        market_cap = data['market_cap']
        # 获取指数的开盘收盘价
        index = self._get_extra_data(securities=['000001.XSHG','000002.XSHG','399433.XSHE'],fields=['open','close'])

        print index.keys()
        print index['close'].columns
        print index['open'].head()
        return 0
```

<a id="因子定义dependencies中的财务因子"></a>

### 因子定义 dependencies 中的财务因子

在因子定义中，如果依赖的基础因子名称（dependencies）为财务因子，可能有些小伙伴理解起来有困难，下面通过一些场景和示例帮助理解。
也可以自学一下金融方面的基础知识，多查看一些上市公司的财务报告。

<a id="情景一"></a>

#### 情景一

当前时间是2015年8月23日， 平安银行二季报的发布日期是 2015年8月15日。

| 基础因子 | 含义 |
| --- | --- |
| net\_profit | 2015q2 的单季度净利润 |
| net\_profit\_1 | 2015q1 的单季度净利润 |
| net\_profit\_y | 2014 的年度净利润 |
| net\_profit\_y1 | 2013 的年度净利润 |

<a id="情景二"></a>

#### 情景二

我们继续以 『00001.XSHE』 的数据为例， 说明 data 中返回数据的逻辑。 『00001.XSHE』2017年 Q1 ~ Q3 的三季营业收入数据如下：

| 季度 | 发布时间 | 营业收入 |
| --- | --- | --- |
| 2017q1 | 2017-04-22 | 27712000000 |
| 2017q2 | 2017-08-11 | 26360999936 |
| 2017q3 | 2017-10-21 | 25760000000 |

假设我们定义 max\_window = 5, dependencies = \['operating\_revenue', 'operating\_revenue\_1'\]， 观察10月25日的数据情况：

`data['operating_revenue'] 的数据特征`

由于10月21日是周六， 所以数据在10月23日之前为 2017Q2 的数据， 10月23日之后（含当日）为 2017Q3 的数据 **『operating\_revenue』 表示每天（index），每个股票（column），可以看到的最新单季度数据（value）**

| 日期/股票 | 000001.XSHE | 000002.XSHE | 000008.XSHE | 000060.XSHE | 000063.XSHE |
| --- | --- | --- | --- | --- | --- |
| 2017-10-19 | 26360999936 | 51221250048 | 365977728 | 5138314240 | 28265984000 |
| 2017-10-20 | 26360999936 | 51221250048 | 365977728 | 5138314240 | 28265984000 |
| 2017-10-23 | 25760000000 | 51221250048 | 365977728 | 5138314240 | 28265984000 |
| 2017-10-24 | 25760000000 | 51221250048 | 365977728 | 5138314240 | 28265984000 |
| 2017-10-25 | 25760000000 | 51221250048 | 365977728 | 5138314240 | 28265984000 |

`data['operating_revenue_1'] 的数据特征`

1.  2017-10-19 能取到的最新数据是 2017Q2 的季报， 而下表中的数据是 2017Q1 的数据。
2.  2017-10-23 能取到的最新数据是 2017Q3 的季报， 而下表中的数据是 2017Q2 的数据。
    总结一下， **『operating\_revenue\_1』 表示获取最新报告期上一期的数据**

| 日期/股票 | 000001.XSHE | 000002.XSHE | 000008.XSHE | 000060.XSHE | 000063.XSHE |
| --- | --- | --- | --- | --- | --- |
| 2017-10-19 | 27712000000 | 18589229056 | 202465472 | 4739692032 | 25744611328 |
| 2017-10-20 | 27712000000 | 18589229056 | 202465472 | 4739692032 | 25744611328 |
| 2017-10-23 | 26360999936 | 18589229056 | 202465472 | 4739692032 | 25744611328 |
| 2017-10-24 | 26360999936 | 18589229056 | 202465472 | 4739692032 | 25744611328 |
| 2017-10-25 | 26360999936 | 18589229056 | 202465472 | 4739692032 | 25744611328 |

<a id="示例-计算TTM数据"></a>

#### 示例-计算TTM数据

```python
# 计算营业收入TTM
from jqfactor import Factor
class OR_TTM(Factor):
    # 设置因子名称
    name = 'operating_revenue_ttm'
    # 设置获取数据的时间窗口长度
    max_window = 1
    # 设置依赖的数据，即前四季度的营业收入
    dependencies = ['operating_revenue',
                    'operating_revenue_1',
                    'operating_revenue_2',
                    'operating_revenue_3']

    # 计算因子的函数， 需要返回一个 pandas.Series, index 是股票代码，value 是因子值
    def calc(self, data):
        # 计算 ttm ， 为前四季度相加
        ttm = data['operating_revenue'] + data['operating_revenue_1'] + data['operating_revenue_2'] + data['operating_revenue_3']
        # 将 ttm 转换成 series
        return ttm.mean()
```
