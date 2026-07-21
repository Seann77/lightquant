---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: WorldQuant 101 Alphas 因子函数使用说明
section_path:
  - Alpha101
  - WorldQuant 101 Alphas 因子函数使用说明
source_file: api-docs/raw/joinquant/Alpha101/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Alpha101
source_anchor: "#WorldQuant101Alphas因子函数使用说明"
source_sha256: 581094e377100036b3b2faf41f148e58ad505d68493155014303b562fa448b11
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="WorldQuant101Alphas因子函数使用说明"></a>

## WorldQuant 101 Alphas 因子函数使用说明

<a id="因子来源"></a>

### 因子来源

根据 WorldQuant LLC 发表的论文 [101 Formulaic Alphas](https://arxiv.org/ftp/arxiv/papers/1601/1601.00991.pdf) 中给出的 101 个 Alphas 因子公式，我们将公式编写成了函数，方便大家使用。

<a id="因子使用"></a>

### 因子使用

```python
# 导入 Alpha101 库
>>> from jqlib.alpha101 import *

#传入一个股票list,获取股票list的alpha_001因子值
a=alpha_001('2018-12-24',['000001.XSHE','000002.XSHE'])
print(a)
000001.XSHE    0.0
000002.XSHE    0.5
Name: rank_value_boolean, dtype: float64

# 获取沪深300成分股的 alpha_001 因子值
>>> a = alpha_001('2017-03-10','000300.XSHG')

# 查看前5行的因子值
>>> a.head()
000001.XSHE   -0.496667
000002.XSHE    0.226667
000008.XSHE   -0.043333
000009.XSHE   -0.093333
000027.XSHE   -0.030000
Name: rank_value_boolean, dtype: float64

# 查看平安银行的因子值
>>> a['000001.XSHE']
-0.49666666666666665

# 获取所有股票 alpha_007 的因子值
>>> a = alpha_007('2014-10-22')
# 查看欣旺达(300207)的因子值
>>> a['300207.XSHE']
0.8

# 获取多个股票多个因子值
from jqlib.alpha101 import *
df2 = alpha(enddate='2019-01-22', index=['000001.XSHE', '000002.XSHE'], fq='pre', alpha=[5,10,15,20]) 
print(df2)

# 查询函数说明
>>> alpha_101?
Type:        cython_function_or_method
String form: <cyfunction alpha_101 at 0x7f037a0167d0>
Docstring:
公式：
((close - open) / ((high - low) + .001))

Inputs:
    enddate: 查询日期
    index: 股票池,可传入股票list或指数代码，传入指数代码，对应该指数的所有成分股。默认是指定日期的所有上市股票。

Outputs:
    因子的值
```

<a id="公用函数说明"></a>

### 公用函数说明

abs(x),log(x),sign(x) = standard definitions *分别为：取绝对值、对数值、正负号（正数返回1，负数返回-1）*

rank(x) = cross-sectional rank *股票的排名，数值从1-最后，若输入值含nan，则nan不参与排名，输出为股票对应排名值（排名所占总位数的百分比）*

delay(x,d) = value of x d days ago *x变量d天之前的值*

correlation(x,y,d) = time-serial correlation of x and y for the past d days *x和y两个变量d天以来的值的相关系数*

covariance(x,y,d) = time-serial covariance of x and y for the past d days *x和y两个变量d天以来的值的协方差*

scale(x,a) = rescaled x such that sum(abs(x))=a (the default is a=1) *将x中的值标准化，使x的绝对值的和为a，默认a=1*

delta(x,d) = today’s value of x minus the value of x d days ago *指定enddate的x值减去d天之前的x值*

signedpower(x,a) = x^a *x值的a次方，如果x为一个list或者series，则为x中每一个值的a次方*

decay\_linear(x,d) = weighted moving average over the past d days with linearly decaying weights d,d-1,…,1 (rescaled up to 1) *x中时间从最远到最近的值，分别乘权重d，d-1，…，1（权重要进行标准化，使和为1）再求和*

ts\_min(x,d) = time-series min over the past d days *x中d天内最小的值*

ts\_max(x,d) = time-series max over the past d days *x中d天内最大的值*

ts\_argmin(x,d) = which day ts\_min(x,d) occurred on *ts\_min(x,d)发生在d天中的第几天，最远的天为第一天*

ts\_argmax(x,d) = which day ts\_max(x,d) occurred on *ts\_max(x,d)发生在d天中的第几天，最远的天为第一天*

ts\_rank(x,d) = time-series rank in the past d days *x中，最后一天的值，在这d天中，排多少名，输出为对应的排名值（即该名次占总排名数的百分比）*

min(x,d) = ts\_min(x,d) *当遇到min函数时，当ts\_min函数处理*——-注意！！实际上遇到min时，当min中的输入不是（x,d）而是（x,y）时，取x、y两个值中的最小值

max(x,d) = ts\_max(x,d) *当遇到max函数时，当ts\_max函数处理*——注意！！实际上遇到max时，当max中的输入不是（x,d）而是（x,y）时，取x、y两个值中的最大值

sum(x,d) = time-series sum over the past d days *d天以来x值的和*

product(x,d) = time-series product over the past d days *d天以来x值的乘积*

stddev(x,d) = moving time series standard deviation over the past d days *d天以来，x值的标准差*

<a id="公用变量说明"></a>

### 公用变量说明

returns = daily close-to-close returns *收益率，输入n+1行closeprice，输出n行returns，index为closeprice的后面n个index，columns为closeprice中的columns*

open,close,high,low,volume = standard definitions for daily price and volume data *开盘价，收盘价，最高价，最低价，交易数量*

vwap = daily volume-weighted average price *在我们的函数程序里，用均价avg来表示这里的vwap*

cap = market cap *市值，在我们的函数程序里，提取的是聚宽财务报表数据中的market\_cap*

adv{d} = average daily dollar volume for the past d days *过去d天内的平均交易金额*

<a id="因子说明"></a>

### 因子说明

<a id="alpha（获取全部因子值）"></a>

#### alpha（获取全部因子值）

获取标的101个全部因子值，因计算量较大，运行会有少许缓慢

```python
from jqlib.alpha101 import *
alpha(enddate=None, index='all', fq='pre', alpha=[])
```

-   输入：

    -   enddate: 必选参数，计算哪一天的因子
    -   index: 默认参数
        -   如果想要成分股，可传入股票指数的字符串，默认为所有股票’all’，如index='all' 或 index='000300.XSHG'
        -   如果想要自定义股票列表，传入一个list，如 index=\['000001.XSHE', '000002.XSHE'\]
    -   fq: 复权选项:
        -   `'pre'`: 前复权,默认为前复权
        -   `None`: 不复权，返回实际价格
        -   `'post'`: 动态后复权
    -   alpha，因子列表，**默认全取**。也可指定获取其中的某些因子，写法如alpha=\['alpha\_005', 'alpha\_010', 'alpha\_015', 'alpha\_020'\]，或 alpha=\[5,10,15,20\]
-   输出：

    -   一个 DataFrame，包括股票列表中每一只股票的 alpha001-alpha101 的值

<a id="alpha_001"></a>

#### alpha\_001

```python
alpha_001(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (rank(Ts\_ArgMax(SignedPower(((returns < 0) ? stddev(returns, 20) : close), 2.), 5)) - 0.5)


<a id="alpha_002"></a>

#### alpha\_002

```python
alpha_002(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*correlation(rank(delta(log(volume), 2)), rank(((close - open) / open)), 6))


<a id="alpha_003"></a>

#### alpha\_003

```python
alpha_003(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*correlation(rank(open), rank(volume), 10))


<a id="alpha_004"></a>

#### alpha\_004

```python
alpha_004(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*Ts\_Rank(rank(low), 9))


<a id="alpha_005"></a>

#### alpha\_005

```python
alpha_005(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (rank((open - (sum(vwap, 10) / 10)))*(-1*abs(rank((close - vwap)))))


<a id="alpha_006"></a>

#### alpha\_006

```python
alpha_006(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*correlation(open, volume, 10))


<a id="alpha_007"></a>

#### alpha\_007

```python
alpha_007(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values：符合条件的为公式里的数值，不符合条件的为-1

-   因子公式：

-   ((adv20 < volume) ? ((-1*ts\_rank(abs(delta(close, 7)), 60))*sign(delta(close, 7))) : (-1\*1))


<a id="alpha_008"></a>

#### alpha\_008

```python
alpha_008(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1*rank(((sum(open, 5)*sum(returns, 5)) - delay((sum(open, 5)\*sum(returns, 5)), 10))))


<a id="alpha_009"></a>

#### alpha\_009

```python
alpha_009(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((0 < ts\_min(delta(close, 1), 5)) ? delta(close, 1) : ((ts\_max(delta(close, 1), 5) < 0) ? delta(close, 1) : (-1\*delta(close, 1))))


<a id="alpha_010"></a>

#### alpha\_010

```python
alpha_010(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   rank(((0 < ts\_min(delta(close, 1), 4)) ? delta(close, 1) : ((ts\_max(delta(close, 1), 4) < 0) ? delta(close, 1) : (-1\*delta(close, 1)))))


<a id="alpha_011"></a>

#### alpha\_011

```python
alpha_011(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((rank(ts\_max((vwap - close), 3)) + rank(ts\_min((vwap - close), 3)))\*rank(delta(volume, 3)))


<a id="alpha_012"></a>

#### alpha\_012

```python
alpha_012(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (sign(delta(volume, 1))\*(-1 \* delta(close, 1)))


<a id="alpha_013"></a>

#### alpha\_013

```python
alpha_013(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*rank(covariance(rank(close), rank(volume), 5)))


<a id="alpha_014"></a>

#### alpha\_014

```python
alpha_014(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1*rank(delta(returns, 3)))*correlation(open, volume, 10))


<a id="alpha_015"></a>

#### alpha\_015

```python
alpha_015(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*sum(rank(correlation(rank(high), rank(volume), 3)), 3))


<a id="alpha_016"></a>

#### alpha\_016

```python
alpha_016(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*rank(covariance(rank(high), rank(volume), 5)))


<a id="alpha_017"></a>

#### alpha\_017

```python
alpha_017(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为对应的因子值，取值有问题的股票对应值为-0.0

-   因子公式：

-   (((-1*rank(ts\_rank(close, 10)))*rank(delta(delta(close, 1), 1)))\*rank(ts\_rank((volume / adv20), 5)))


<a id="alpha_018"></a>

#### alpha\_018

```python
alpha_018(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*rank(((stddev(abs((close - open)), 5) + (close - open)) + correlation(close, open, 10))))


<a id="alpha_019"></a>

#### alpha\_019

```python
alpha_019(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1*sign(((close - delay(close, 7)) + delta(close, 7))))*(1 + rank((1 + sum(returns, 250)))))


<a id="alpha_020"></a>

#### alpha\_020

```python
alpha_020(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((-1*rank((open - delay(high, 1))))* rank((open - delay(close, 1))))\* rank((open - delay(low, 1))))


<a id="alpha_021"></a>

#### alpha\_021

```python
alpha_021(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，取决于满不满足某些因子中的条件

-   因子公式：

-   ((((sum(close, 8) / 8) + stddev(close, 8)) < (sum(close, 2) / 2)) ? (-1\* 1) : (((sum(close, 2) / 2) < ((sum(close, 8) / 8) - stddev(close, 8))) ? 1 : (((1 < (volume / adv20)) or ((volume / adv20) == 1)) ? 1 : (-1\* 1))))


<a id="alpha_022"></a>

#### alpha\_022

```python
alpha_022(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\* (delta(correlation(high, volume, 5), 5)\* rank(stddev(close, 20))))


<a id="alpha_023"></a>

#### alpha\_023

```python
alpha_023(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为对应因子值或0.00，当不满足条件时为0.00

-   因子公式：

-   (((sum(high, 20) / 20) < high) ? (-1\* delta(high, 2)) : 0)


<a id="alpha_024"></a>

#### alpha\_024

```python
alpha_024(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((((delta((sum(close, 100) / 100), 100) / delay(close, 100)) < 0.05) or ((delta((sum(close, 100) / 100), 100) / delay(close, 100)) == 0.05)) ? (-1\* (close - ts\_min(close, 100))) : (-1\* delta(close, 3)))


<a id="alpha_025"></a>

#### alpha\_025

```python
alpha_025(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   rank(((((-1\* returns)\* adv20)\* vwap)\* (high - close)))


<a id="alpha_026"></a>

#### alpha\_026

```python
alpha_026(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\* ts\_max(correlation(ts\_rank(volume, 5), ts\_rank(high, 5), 5), 3))


<a id="alpha_027"></a>

#### alpha\_027

```python
alpha_027(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，满足条件为-1，不满足为1

-   因子公式：

-   ((0.5 < rank((sum(correlation(rank(volume), rank(vwap), 6), 2) / 2.0))) ? (-1\* 1) : 1)


<a id="alpha_028"></a>

#### alpha\_028

```python
alpha_028(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   scale(((correlation(adv20, low, 5) + ((high + low) / 2)) - close))


<a id="alpha_029"></a>

#### alpha\_029

```python
alpha_029(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (min(product(rank(rank(scale(log(sum(ts\_min(rank(rank((-1*rank(delta((close - 1), 5))))), 2), 1))))), 1), 5) + ts\_rank(delay((-1* returns), 6), 5))


<a id="alpha_030"></a>

#### alpha\_030

```python
alpha_030(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((1.0 - rank(((sign((close - delay(close, 1))) + sign((delay(close, 1) - delay(close, 2)))) + sign((delay(close, 2) - delay(close, 3))))))\* sum(volume, 5)) / sum(volume, 20))


<a id="alpha_031"></a>

#### alpha\_031

```python
alpha_031(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((rank(rank(rank(decay\_linear((-1\* rank(rank(delta(close, 10)))), 10)))) + rank((-1\* delta(close, 3)))) + sign(scale(correlation(adv20, low, 12))))


<a id="alpha_032"></a>

#### alpha\_032

```python
alpha_032(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (scale(((sum(close, 7) / 7) - close)) + (20\* scale(correlation(vwap, delay(close, 5), 230))))


<a id="alpha_033"></a>

#### alpha\_033

```python
alpha_033(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   rank((-1\* ((1 - (open / close))^1)))


<a id="alpha_034"></a>

#### alpha\_034

```python
alpha_034(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   rank(((1 - rank((stddev(returns, 2) / stddev(returns, 5)))) + (1 - rank(delta(close, 1)))))


<a id="alpha_035"></a>

#### alpha\_035

```python
alpha_035(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((Ts\_Rank(volume, 32)\* (1 - Ts\_Rank(((close + high) - low), 16)))\* (1 - Ts\_Rank(returns, 32)))


<a id="alpha_036"></a>

#### alpha\_036

```python
alpha_036(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((((2.21\* rank(correlation((close - open), delay(volume, 1), 15))) + (0.7\* rank((open - close)))) + (0.73\* rank(Ts\_Rank(delay((-1\* returns), 6), 5)))) + rank(abs(correlation(vwap, adv20, 6)))) + (0.6\* rank((((sum(close, 200) / 200) - open)\* (close - open)))))


<a id="alpha_037"></a>

#### alpha\_037

```python
alpha_037(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (rank(correlation(delay((open - close), 1), close, 200)) + rank((open - close)))


<a id="alpha_038"></a>

#### alpha\_038

```python
alpha_038(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1\* rank(Ts\_Rank(close, 10)))\* rank((close / open)))


<a id="alpha_039"></a>

#### alpha\_039

```python
alpha_039(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1\* rank((delta(close, 7)\* (1 - rank(decay\_linear((volume / adv20), 9))))))\* (1 + rank(sum(returns, 250))))


<a id="alpha_040"></a>

#### alpha\_040

```python
alpha_040(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1\* rank(stddev(high, 10)))\* correlation(high, volume, 10))


<a id="alpha_041"></a>

#### alpha\_041

```python
alpha_041(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((high\* low)^0.5) - vwap)


<a id="alpha_042"></a>

#### alpha\_042

```python
alpha_042(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (rank((vwap - close)) / rank((vwap + close)))


<a id="alpha_043"></a>

#### alpha\_043

```python
alpha_043(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (ts\_rank((volume / adv20), 20)\* ts\_rank((-1\* delta(close, 7)), 8))


<a id="alpha_044"></a>

#### alpha\_044

```python
alpha_044(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\* correlation(high, rank(volume), 5))


<a id="alpha_045"></a>

#### alpha\_045

```python
alpha_045(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\* ((rank((sum(delay(close, 5), 20) / 20))\* correlation(close, volume, 2))\* rank(correlation(sum(close, 5), sum(close, 20), 2))))


<a id="alpha_046"></a>

#### alpha\_046

```python
alpha_046(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1或对应因子值，取决于满不满足某些因子中的条件

-   因子公式：

-   ((0.25 < (((delay(close, 20) - delay(close, 10)) / 10) - ((delay(close, 10) - close) / 10))) ? (-1\* 1) : (((((delay(close, 20) - delay(close, 10)) / 10) - ((delay(close, 10) - close) / 10)) < 0) ? 1 : ((-1\* 1)\* (close - delay(close, 1)))))


<a id="alpha_047"></a>

#### alpha\_047

```python
alpha_047(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((((rank((1 / close))\* volume) / adv20)\* ((high\* rank((high - close))) / (sum(high, 5) / 5))) - rank((vwap - delay(vwap, 5))))


<a id="alpha_048（未实现）"></a>

#### alpha\_048（未实现）

-   因子公式：

-   (indneutralize(((correlation(delta(close, 1), delta(delay(close, 1), 1), 250)\* delta(close, 1)) / close), IndClass.subindustry) / sum(((delta(close, 1) / delay(close, 1))^2), 250))


<a id="alpha_049"></a>

#### alpha\_049

```python
alpha_049(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为对应因子值或1，当满足条件时为1

-   因子公式：

-   (((((delay(close, 20) - delay(close, 10)) / 10) - ((delay(close, 10) - close) / 10)) < (-1\* 0.1)) ? 1 : ((-1\* 1)\* (close - delay(close, 1))))


<a id="alpha_050"></a>

#### alpha\_050

```python
alpha_050(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\* ts\_max(rank(correlation(rank(volume), rank(vwap), 5)), 5))


<a id="alpha_051"></a>

#### alpha\_051

```python
alpha_051(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为对应因子值或1，当满足条件时为1

-   因子公式：

-   (((((delay(close, 20) - delay(close, 10)) / 10) - ((delay(close, 10) - close) / 10)) < (-1\* 0.05)) ? 1 : ((-1\* 1)\* (close - delay(close, 1))))


<a id="alpha_052"></a>

#### alpha\_052

```python
alpha_052(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((((-1\* ts\_min(low, 5)) + delay(ts\_min(low, 5), 5))\* rank(((sum(returns, 240) - sum(returns, 20)) / 220)))\* ts\_rank(volume, 5))


<a id="alpha_053"></a>

#### alpha\_053

```python
alpha_053(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\* delta((((close - low) - (high - close)) / (close - low)), 9))


<a id="alpha_054"></a>

#### alpha\_054

```python
alpha_054(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1\* ((low - close)\* (open^5))) / ((low - high)\* (close^5)))


<a id="alpha_055"></a>

#### alpha\_055

```python
alpha_055(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\* correlation(rank(((close - ts\_min(low, 12)) / (ts\_max(high, 12) - ts\_min(low, 12)))), rank(volume), 6))


<a id="alpha_056"></a>

#### alpha\_056

```python
alpha_056(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (0 - (1\* (rank((sum(returns, 10) / sum(sum(returns, 2), 3)))\* rank((returns\* cap)))))


<a id="alpha_057"></a>

#### alpha\_057

```python
alpha_057(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (0 - (1\* ((close - vwap) / decay\_linear(rank(ts\_argmax(close, 30)), 2))))


<a id="alpha_058（未实现）"></a>

#### alpha\_058（未实现）

-   因子公式：

-   (-1\* Ts\_Rank(decay\_linear(correlation(IndNeutralize(vwap, IndClass.sector), volume, 3.92795), 7.89291), 5.50322))


<a id="alpha_059（未实现）"></a>

#### alpha\_059（未实现）

-   因子公式：

-   (-1\* Ts\_Rank(decay\_linear(correlation(IndNeutralize(((vwap\* 0.728317) + (vwap\* (1 - 0.728317))), IndClass.industry), volume, 4.25197), 16.2289), 8.19648))


<a id="alpha_060"></a>

#### alpha\_060

```python
alpha_060(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (0 - (1\* ((2\* scale(rank(((((close - low) - (high - close)) / (high - low))\* volume)))) - scale(rank(ts\_argmax(close, 10))))))


<a id="alpha_061"></a>

#### alpha\_061

```python
alpha_061(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为1，否则为-1

-   因子公式：

-   (rank((vwap - ts\_min(vwap, 16.1219))) < rank(correlation(vwap, adv180, 17.9282)))


<a id="alpha_062"></a>

#### alpha\_062

```python
alpha_062(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为-1，否则为1

-   因子公式：

-   ((rank(correlation(vwap, sum(adv20, 22.4101), 9.91009)) < rank(((rank(open) + rank(open)) < (rank(((high + low) / 2)) + rank(high)))))\*-1)


<a id="alpha_063（未实现）"></a>

#### alpha\_063（未实现）

-   因子公式：

-   ((rank(decay\_linear(delta(IndNeutralize(close, IndClass.industry), 2.25164), 8.22237)) - rank(decay\_linear(correlation(((vwap\* 0.318108) + (open\* (1 - 0.318108))), sum(adv180, 37.2467), 13.557), 12.2883)))\* -1)


<a id="alpha_064"></a>

#### alpha\_064

```python
alpha_064(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为-1，否则为1

-   因子公式：

-   ((rank(correlation(sum(((open\* 0.178404) + (low\* (1 - 0.178404))), 12.7054), sum(adv120, 12.7054), 16.6208)) < rank(delta(((((high + low) / 2)\* 0.178404) + (vwap\* (1 - 0.178404))), 3.69741)))\* -1)


<a id="alpha_065"></a>

#### alpha\_065

```python
alpha_065(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为-1，否则为1

-   因子公式：

-   ((rank(correlation(((open\* 0.00817205) + (vwap\* (1 - 0.00817205))), sum(adv60, 8.6911), 6.40374)) < rank((open - ts\_min(open, 13.635))))\* -1)


<a id="alpha_066"></a>

#### alpha\_066

```python
alpha_066(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((rank(decay\_linear(delta(vwap, 3.51013), 7.23052)) + Ts\_Rank(decay\_linear(((((low\* 0.96633) + (low\* (1 - 0.96633))) - vwap) / (open - ((high + low) / 2))), 11.4157), 6.72611))\* -1)


<a id="alpha_067（未实现）"></a>

#### alpha\_067（未实现）

-   因子公式：

-   ((rank((high - ts\_min(high, 2.14593)))^rank(correlation(IndNeutralize(vwap, IndClass.sector), IndNeutralize(adv20, IndClass.subindustry), 6.02936)))\* -1)


<a id="alpha_068"></a>

#### alpha\_068

```python
alpha_068(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为-1，否则为1

-   因子公式：

-   ((Ts\_Rank(correlation(rank(high), rank(adv15), 8.91644), 13.9333) < rank(delta(((close\* 0.518371) + (low\* (1 - 0.518371))), 1.06157)))\* -1)


<a id="alpha_069（未实现）"></a>

#### alpha\_069（未实现）

-   因子公式：

-   ((rank(ts\_max(delta(IndNeutralize(vwap, IndClass.industry), 2.72412), 4.79344))^Ts\_Rank(correlation(((close\* 0.490655) + (vwap\* (1 - 0.490655))), adv20, 4.92416), 9.0615))\* -1)


<a id="alpha_070（未实现）"></a>

#### alpha\_070（未实现）

-   因子公式：

-   ((rank(delta(vwap, 1.29456))^Ts\_Rank(correlation(IndNeutralize(close, IndClass.industry), adv50, 17.8256), 17.9171))\* -1)


<a id="alpha_071"></a>

#### alpha\_071

```python
alpha_071(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   max(Ts\_Rank(decay\_linear(correlation(Ts\_Rank(close, 3.43976), Ts\_Rank(adv180, 12.0647), 18.0175), 4.20501), 15.6948), Ts\_Rank(decay\_linear((rank(((low + open) - (vwap + vwap)))^2), 16.4662), 4.4388))


<a id="alpha_072"></a>

#### alpha\_072

```python
alpha_072(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (rank(decay\_linear(correlation(((high + low) / 2), adv40, 8.93345), 10.1519)) / rank(decay\_linear(correlation(Ts\_Rank(vwap, 3.72469), Ts\_Rank(volume, 18.5188), 6.86671), 2.95011)))


<a id="alpha_073"></a>

#### alpha\_073

```python
alpha_073(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (max(rank(decay\_linear(delta(vwap, 4.72775), 2.91864)), Ts\_Rank(decay\_linear(((delta(((open\* 0.147155) + (low\* (1 - 0.147155))), 2.03608) / ((open\* 0.147155) + (low\* (1 - 0.147155))))\* -1), 3.33829), 16.7411))\* -1)


<a id="alpha_074"></a>

#### alpha\_074

```python
alpha_074(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为-1，否则为1

-   因子公式：

-   ((rank(correlation(close, sum(adv30, 37.4843), 15.1365)) < rank(correlation(rank(((high\* 0.0261661) + (vwap\* (1 - 0.0261661)))), rank(volume), 11.4791)))\* -1)


<a id="alpha_075"></a>

#### alpha\_075

```python
alpha_075(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为1，否则为-1

-   因子公式：

-   (rank(correlation(vwap, volume, 4.24304)) < rank(correlation(rank(low), rank(adv50), 12.4413)))


<a id="alpha_076（未实现）"></a>

#### alpha\_076（未实现）

-   因子公式：

-   (max(rank(decay\_linear(delta(vwap, 1.24383), 11.8259)), Ts\_Rank(decay\_linear(Ts\_Rank(correlation(IndNeutralize(low, IndClass.sector), adv81, 8.14941), 19.569), 17.1543), 19.383))\* -1)


<a id="alpha_077"></a>

#### alpha\_077

```python
alpha_077(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   min(rank(decay\_linear(((((high + low) / 2) + high) - (vwap + high)), 20.0451)), rank(decay\_linear(correlation(((high + low) / 2), adv40, 3.1614), 5.64125)))


<a id="alpha_078"></a>

#### alpha\_078

```python
alpha_078(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (rank(correlation(sum(((low\* 0.352233) + (vwap\* (1 - 0.352233))), 19.7428), sum(adv40, 19.7428), 6.83313))^rank(correlation(rank(vwap), rank(volume), 5.77492)))


<a id="alpha_079（未实现）"></a>

#### alpha\_079（未实现）

-   因子公式：

-   (rank(delta(IndNeutralize(((close\* 0.60733) + (open\* (1 - 0.60733))), IndClass.sector), 1.23438)) < rank(correlation(Ts\_Rank(vwap, 3.60973), Ts\_Rank(adv150, 9.18637), 14.6644)))


<a id="alpha_080（未实现）"></a>

#### alpha\_080（未实现）

-   因子公式：

-   ((rank(Sign(delta(IndNeutralize(((open\* 0.868128) + (high\* (1 - 0.868128))), IndClass.industry), 4.04545)))^Ts\_Rank(correlation(high, adv10, 5.11456), 5.53756))\* -1)


<a id="alpha_081"></a>

#### alpha\_081

-   因子公式：

-   ((rank(Log(product(rank((rank(correlation(vwap, sum(adv10, 49.6054), 8.47743))^4)), 14.9655))) < rank(correlation(rank(vwap), rank(volume), 5.07914)))\* -1)


<a id="alpha_082（未实现）"></a>

#### alpha\_082（未实现）

-   因子公式：

-   (min(rank(decay\_linear(delta(open, 1.46063), 14.8717)), Ts\_Rank(decay\_linear(correlation(IndNeutralize(volume, IndClass.sector), ((open\* 0.634196) + (open\* (1 - 0.634196))), 17.4842), 6.92131), 13.4283))\* -1)


<a id="alpha_083"></a>

#### alpha\_083

```python
alpha_083(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((rank(delay(((high - low) / (sum(close, 5) / 5)), 2))\* rank(rank(volume))) / (((high - low) / (sum(close, 5) / 5)) / (vwap - close)))


<a id="alpha_084"></a>

#### alpha\_084

```python
alpha_084(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SignedPower(Ts\_Rank((vwap - ts\_max(vwap, 15.3217)), 20.7127), delta(close, 4.96796))


<a id="alpha_085"></a>

#### alpha\_085

```python
alpha_085(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (rank(correlation(((high\* 0.876703) + (close\* (1 - 0.876703))), adv30, 9.61331))^rank(correlation(Ts\_Rank(((high + low) / 2), 3.70596), Ts\_Rank(volume, 10.1595), 7.11408)))


<a id="alpha_086"></a>

#### alpha\_086

```python
alpha_086(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为-1，否则为1

-   因子公式：

-   ((Ts\_Rank(correlation(close, sum(adv20, 14.7444), 6.00049), 20.4195) < rank(((open + close) - (vwap + open))))\* -1)


<a id="alpha_087（未实现）"></a>

#### alpha\_087（未实现）

-   因子公式：

-   (max(rank(decay\_linear(delta(((close\* 0.369701) + (vwap\* (1 - 0.369701))), 1.91233), 2.65461)), Ts\_Rank(decay\_linear(abs(correlation(IndNeutralize(adv81, IndClass.industry), close, 13.4132)), 4.89768), 14.4535))\* -1)


<a id="alpha_088"></a>

#### alpha\_088

```python
alpha_088(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   min(rank(decay\_linear(((rank(open) + rank(low)) - (rank(high) + rank(close))), 8.06882)), Ts\_Rank(decay\_linear(correlation(Ts\_Rank(close, 8.44728), Ts\_Rank(adv60, 20.6966), 8.01266), 6.65053), 2.61957))


<a id="alpha_089（未实现）"></a>

#### alpha\_089（未实现）

-   因子公式：

-   (Ts\_Rank(decay\_linear(correlation(((low\* 0.967285) + (low\* (1 - 0.967285))), adv10, 6.94279), 5.51607), 3.79744) - Ts\_Rank(decay\_linear(delta(IndNeutralize(vwap, IndClass.industry), 3.48158), 10.1466), 15.3012))


<a id="alpha_090（未实现）"></a>

#### alpha\_090（未实现）

-   因子公式：

-   ((rank((close - ts\_max(close, 4.66719)))^Ts\_Rank(correlation(IndNeutralize(adv40, IndClass.subindustry), low, 5.38375), 3.21856))\* -1)


<a id="alpha_091（未实现）"></a>

#### alpha\_091（未实现）

-   因子公式：

-   ((Ts\_Rank(decay\_linear(decay\_linear(correlation(IndNeutralize(close, IndClass.industry), volume, 9.74928), 16.398), 3.83219), 4.8667) - rank(decay\_linear(correlation(vwap, adv30, 4.01303), 2.6809)))\* -1)


<a id="alpha_092"></a>

#### alpha\_092

```python
alpha_092(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   min(Ts\_Rank(decay\_linear(((((high + low) / 2) + close) < (low + open)), 14.7221), 18.8683), Ts\_Rank(decay\_linear(correlation(rank(low), rank(adv30), 7.58555), 6.94024), 6.80584))


<a id="alpha_093（未实现）"></a>

#### alpha\_093（未实现）

-   因子公式：

-   (Ts\_Rank(decay\_linear(correlation(IndNeutralize(vwap, IndClass.industry), adv81, 17.4193), 19.848), 7.54455) / rank(decay\_linear(delta(((close\* 0.524434) + (vwap\* (1 - 0.524434))), 2.77377), 16.2664)))


<a id="alpha_094"></a>

#### alpha\_094

```python
alpha_094(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((rank((vwap - ts\_min(vwap, 11.5783)))^Ts\_Rank(correlation(Ts\_Rank(vwap, 19.6462), Ts\_Rank(adv60, 4.02992), 18.0926), 2.70756))\* -1)


<a id="alpha_095"></a>

#### alpha\_095

```python
alpha_095(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为1，否则为-1

-   因子公式：

-   (rank((open - ts\_min(open, 12.4105))) < Ts\_Rank((rank(correlation(sum(((high + low) / 2), 19.1351), sum(adv40, 19.1351), 12.8742))^5), 11.7584))


<a id="alpha_096"></a>

#### alpha\_096

```python
alpha_096(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (max(Ts\_Rank(decay\_linear(correlation(rank(vwap), rank(volume), 3.83878), 4.16783), 8.38151), Ts\_Rank(decay\_linear(Ts\_ArgMax(correlation(Ts\_Rank(close, 7.45404), Ts\_Rank(adv60, 4.13242), 3.65459), 12.6556), 14.0365), 13.4143))\* -1)


<a id="alpha_097（未实现）"></a>

#### alpha\_097（未实现）

-   因子公式：

-   ((rank(decay\_linear(delta(IndNeutralize(((low\* 0.721001) + (vwap\* (1 - 0.721001))), IndClass.industry), 3.3705), 20.4523)) - Ts\_Rank(decay\_linear(Ts\_Rank(correlation(Ts\_Rank(low, 7.87871), Ts\_Rank(adv60, 17.255), 4.97547), 18.5925), 15.7152), 6.71659))\* -1)


<a id="alpha_098"></a>

#### alpha\_098

```python
alpha_098(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (rank(decay\_linear(correlation(vwap, sum(adv5, 26.4719), 4.58418), 7.18088)) - rank(decay\_linear(Ts\_Rank(Ts\_ArgMin(correlation(rank(open), rank(adv15), 20.8187), 8.62571), 6.95668), 8.07206)))


<a id="alpha_099"></a>

#### alpha\_099

```python
alpha_099(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个Series：index为成分股代码，values为1或-1，当满足条件时为-1，否则为1

-   因子公式：

-   ((rank(correlation(sum(((high + low) / 2), 19.8975), sum(adv60, 19.8975), 8.8136)) < rank(correlation(low, volume, 6.28259)))\* -1)


<a id="alpha_100（未实现）"></a>

#### alpha\_100（未实现）

-   因子公式：

-   (0 - (1\* (((1.5\* scale(indneutralize(indneutralize(rank(((((close - low) - (high - close)) / (high - low))\* volume)), IndClass.subindustry), IndClass.subindustry))) - scale(indneutralize((correlation(close, rank(adv20), 5) - rank(ts\_argmin(close, 30))), IndClass.subindustry)))\* (volume / adv20))))


<a id="alpha_101"></a>

#### alpha\_101

```python
alpha_101(enddate, index='all')
```

-   输入：

-   enddate: 必选参数，计算哪一天的因子

-   index: 默认参数，股票指数，默认为所有股票’all’

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((close - open) / ((high - low) + .001))
