---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 短周期价量特征 191 Alphas 因子函数使用说明
section_path:
  - Alpha191
  - 短周期价量特征 191 Alphas 因子函数使用说明
source_file: api-docs/raw/joinquant/Alpha191/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=Alpha191
source_anchor: "#短周期价量特征191Alphas因子函数使用说明"
source_sha256: 6bc2a111fdf86e762540018d231c94a2c06e03744b2000849634395bb934bee6
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="短周期价量特征191Alphas因子函数使用说明"></a>

## 短周期价量特征 191 Alphas 因子函数使用说明

<a id="因子来源"></a>

### 因子来源

通过交易型阿尔法策略的研究，发现在 A 股市场，与传统多因子模型所获取的股票价值阿尔法收益相比，交易型阿尔法收益的空间更大、收益稳定性也更强。

短周期交易型阿尔法体系既是对传统多因子体系的补充，也可以说是全新思路、独立设计的交易体系。在这其中，量化模型不再仅仅是低风险低收益的投资策略，同样也可获得高额的收益回报。

JoinQuant聚宽（专业的量化交易平台）旨在为大家提供更多的投资思路及可使用的数据，因此我们根据国泰君安数量化专题研究报告 - [*基于短周期价量特征的多因子选股体系*](https://file.joinquant.com/198f09d54939dbcd27819bb96f67ac15/%E5%9B%BD%E6%B3%B0%E5%90%9B%E5%AE%89-%E6%95%B0%E9%87%8F%E5%8C%96%E4%B8%93%E9%A2%98%E4%B9%8B%E4%B9%9D%E5%8D%81%E4%B8%89%EF%BC%9A%E5%9F%BA%E4%BA%8E%E7%9F%AD%E5%91%A8%E6%9C%9F%E4%BB%B7%E9%87%8F%E7%89%B9%E5%BE%81%E7%9A%84%E5%A4%9A%E5%9B%A0%E5%AD%90%E9%80%89%E8%82%A1%E4%BD%93%E7%B3%BB-2017-06-16.pdf?_upd=%E5%9B%BD%E6%B3%B0%E5%90%9B%E5%AE%89-%E6%95%B0%E9%87%8F%E5%8C%96%E4%B8%93%E9%A2%98%E4%B9%8B%E4%B9%9D%E5%8D%81%E4%B8%89%EF%BC%9A%E5%9F%BA%E4%BA%8E%E7%9F%AD%E5%91%A8%E6%9C%9F%E4%BB%B7%E9%87%8F%E7%89%B9%E5%BE%81%E7%9A%84%E5%A4%9A%E5%9B%A0%E5%AD%90%E9%80%89%E8%82%A1%E4%BD%93%E7%B3%BB-2017-06-16.pdf)给出了 191 个短周期交易型阿尔法因子。

其中因子数据则均来自于个股日频率的价格与成交量数据，并且在编写短周期交易型 Alpha191因子时，有对缺失部分和不合理部分的因子公式进行调整。

我们初衷是想为大家提供更多的投资思路及可使用的数据。至于这些因子如何使用能达到策略最佳收益，或者说这些因子是否适用于A股市场等问题，还需要大家自己去研究与钻研。

**注：在对编写 alpha191因子时，有对缺失部分和不合理部分的因子公式进行调整**

<a id="因子使用"></a>

### 因子使用

**使用方法（以Alpha001因子为例）：**

```python
# 导入 Alpha191 库
from jqlib import alpha191

#获取alpha001因子值
alpha191.alpha_001(code, end_date=None,fq='pre')
```

**输入:**

-   code：股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   fq: 复权选项:


1.  `'pre'`: 前复权,默认为前复权；目前官网设置fq= 'pre' 时,使用动态复权计算,无论在策略中(开启动态复权与否)还是研究中使用 ;
2.  `None`: 不复权，返回实际价格；使用不复权数据计算 ;
3.  `'post'`: 后复权，使用后复权数据计算 ;

**输出:**

-   输出一个 Series：index 为成分股代码，values 为对应的因子值
-   注意：当Alpha因子的返回结果为-999999999999或+999999999999时，代表该因子值的计算结果为负无穷或正无穷。在Excel中打开会显示成1E+12或1E-12.

**因子公式:**

-   (-1 \* CORR(RANK(DELTA(LOG(VOLUME),1)),RANK(((CLOSE-OPEN)/OPEN)),6)

**示例:**

```python
#获取平安银行2019年4月24日按照不复权价格计算的Alpha002的因子值
from jqlib import alpha191
a = alpha191.alpha_002('000001.XSHE','2019-04-24',fq = None)
a

000001.XSHE   -0.403162
Name: 2019-04-24 00:00:00, dtype: float64

#获取平安银行2019年4月24日按照前复权价格计算的Alpha002的因子值
from jqlib import alpha191
a = alpha191.alpha_002('000001.XSHE','2019-04-24',fq ='pre')
a

000001.XSHE   -0.403162
Name: 2019-04-24 00:00:00, dtype: float64

#获取平安银行2019年4月24日按照后复权价格计算的Alpha002的因子值
from jqlib import alpha191
a = alpha191.alpha_002('000001.XSHE','2019-04-24',fq ='post')
a

000001.XSHE   -0.403247
Name: 2019-04-24 00:00:00, dtype: float64


# 查询函数说明
help(alpha191.alpha_001)

Help on function alpha_001 in module jqdatasdk.alpha191:

alpha_001(code, end_date=None, fq=None)
    公式:
        (-1 * CORR(RANK(DELTA(LOG(VOLUME),1)),RANK(((CLOSE-OPEN)/OPEN)),6)
    Inputs:
        code: 股票池
        end_date: 查询日期
    Outputs:
        因子的值
```

<a id="公用函数说明"></a>

### 公用函数说明

**股票的默认获取时间长度为截止日期的前350个交易日**

OPEN
*开盘价*

HIGH
*最高价*

LOW
*最低价*

CLOSE
*收盘价*

VWAP
*均价*

VOLUME
*成交量*

AMOUNT
*成交额*

BANCHMARKINDEXOPEN
*基准指数的开盘价*

BANCHMARKINDEXCLOSE
*基准指数的收盘价*

RET
*每日收益率（收盘/前收盘-1）*

DTM
*(OPEN<=DELAY(OPEN,1)?0:MAX((HIGH-OPEN),(OPEN-DELAY(OPEN,1))))*

DBM
*(OPEN>=DELAY(OPEN,1)?0:MAX((OPEN-LOW),(OPEN-DELAY(OPEN,1))))*

TR *MAX(MAX(HIGH-LOW,ABS(HIGH-DELAY(CLOSE,1))),ABS(LOW-DELAY(CLOSE,1)))*

HD
*HIGH-DELAY(HIGH,1)*

LD
*DELAY(LOW,1)-LOW*

HML SMB MKE
*Fama French 三因子*

SELF
*特殊变量，出现在 Alpha143，表示 t-1 日的 Alpha143 因子计算结果*

RANK(A)
*向量 A 升序排序*

MAX(A, B)
*在 A,B 中选择最大的数*

MIN(A, B)
*在 A,B 中选择最小的数*

STD(A, n)
*序列 A 过去 n 天标准差*

CORR(A, B, n)
*序列 A、 B 过去 n 天相关系数*

DELTA(A, n)
Ai−Ai−n

LOG(A)
*自然对数函数*

SUM(A, n)
*序列 A 过去 n 天求和*

ABS(A)
*绝对值函数*

MEAN(A, n)
*序列 A 过去 n 天均值*

TSRANK(A, n)
*序列 A 的末位值在过去 n 天的顺序排位*

SIGN(A) *符号函数：1 if A>0; o if A=0 ; -1 if A \\<0;*

COVIANCE (A, B, n)
*序列 A、 B 过去 n 天协方差*

DELAY(A, n)
Ai−n

TSMIN(A, n)
*序列 A 过去 n 天的最小值*

TSMAX(A, n)
*序列 A 过去 n 天的最大值*

PROD(A, n)
*序列 A 过去 n 天累乘*

COUNT(condition, n)
*计算前 n 期满足条件 condition 的样本个数*

REGBETA(A, B, n)
*前 n 期样本 A 对 B 做回归所得回归系数*

REGRESI(A, B, n)
*前 n 期样本 A 对 B 做回归所得的残差*

SMA(A, n, m)

ŷ i+1=(Aim+ŷ i(n−m))/n ，其中 Yˆ 表示最终结果

SUMIF(A, n, condition)
*对 A 前 n 项条件求和，其中 condition 表示选择条件*

WMA(A, n)
*计算 A前 n期样本加权平均值权重为 0.9i，(i 表示样本距离当前时点的间隔)*

DECAYLINEAR(A, d)
*对 A 序列计算移动平均加权，其中权重对应 d,d-1,…,1（权重和为 1）*

FILTER(A, condition)
*对 A 筛选出符合选择条件 condition 的样本*

HIGHDAY(A, n)
*计算 A 前 n 期时间序列中最大值距离当前时点的间隔*

LOWDAY(A, n)
*计算 A 前 n 期时间序列中最小值距离当前时点的间隔*

SEQUENCE(n)
*生成 1~n 的等差序列*

SUMAC(A, n)
*计算 A 的前 n 项的累加*

&
*逻辑运算与*

||
*逻辑运算或*

A?B:C
*若 A 成立，则为 B，否则为 C*

<a id="因子说明"></a>

### 因子说明

在对编写 alpha191因子时，有对缺失部分和不合理部分的因子公式进行调整

<a id="alpha（获取全部因子值）"></a>

#### alpha（获取全部因子值）

获取标的191个全部因子值，因计算量较大，运行会有少许缓慢( jqdatasdk 不支持此方法 )

```python
from jqlib.alpha191 import *
alpha(code,benchmark='000300.XSHG',end_date=None, fq='pre', alpha='all')
```

-   输入：

    -   code: 股票代码列表
    -   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期
    -   fq: 复权选项
    -   alpha，因子列表，**默认全取**。也可指定获取其中的某些因子，写法如alpha=\['alpha\_005', 'alpha\_010', 'alpha\_015', 'alpha\_020'\]，或 alpha=\[5,10,15,20\]
-   输出：

    -   一个 DataFrame，包括股票列表中每一只股票的 alpha001-alpha191 的值

<a id="alpha_001"></a>

#### alpha\_001

```python
alpha_001(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date：计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：


(-1 \* CORR(RANK(DELTA(LOG(VOLUME), 1)), RANK(((CLOSE - OPEN) / OPEN)), 6))

<a id="alpha_002"></a>

#### alpha\_002

```python
alpha_002(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式： -1 \* delta((((close-low)-(high-close))/((high-low)),1))


<a id="alpha_003"></a>

#### alpha\_003

```python
alpha_003(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((CLOSE=DELAY(CLOSE,1)?0:CLOSE-(CLOSE>DELAY(CLOSE,1)?MIN(LOW,DELAY(CLOSE,1)):MAX(HIGH,DELAY(CLOSE,1)))),6)


<a id="alpha_004"></a>

#### alpha\_004

```python
alpha_004(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((((SUM(CLOSE,8)/8)+STD(CLOSE,8))<(SUM(CLOSE,2)/2))?(-1\* 1):(((SUM(CLOSE,2)/2)<((SUM(CLOSE,8)/8)-STD(CLOSE,8)))?1:(((1<(VOLUME/MEAN(VOLUME,20)))||((VOLUME/MEAN(VOLUME,20))==1))?1:(-1\* 1))))


<a id="alpha_005"></a>

#### alpha\_005

```python
alpha_005(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*TSMAX(CORR(TSRANK(VOLUME,5),YSRANK(HIGH,5),5),3))


<a id="alpha_006"></a>

#### alpha\_006

```python
alpha_006(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(SIGN(DELTA((((OPEN \* 0.85)+(HIGH \* 0.15))),4)))\*-1)


<a id="alpha_007"></a>

#### alpha\_007

```python
alpha_007(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK(MAX((VWAP-CLOSE),3))+RANK(MIN((VWAP-CLOSE),3)))\* RANK(DELTA(VOLUME,3)))


<a id="alpha_008"></a>

#### alpha\_008

```python
alpha_008(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   RANK(DELTA(((((HIGH + LOW) / 2) \* 0.2) + (VWAP \* 0.8)), 4) \* -1)


<a id="alpha_009"></a>

#### alpha\_009

```python
alpha_009(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(((HIGH+LOW)/2-(DELAY(HIGH,1)+DELAY(LOW,1))/2)\*(HIGH-LOW)/VOLUME,7,2)


<a id="alpha_010"></a>

#### alpha\_010

```python
alpha_010(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(MAX(((RET < 0) ? STD(RET, 20) : CLOSE)^2),5))


<a id="alpha_011"></a>

#### alpha\_011

```python
alpha_011(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(((CLOSE-LOW)-(HIGH-CLOSE)). /(HIGH-LOW) . \* VOLUME,6)


<a id="alpha_012"></a>

#### alpha\_012

```python
alpha_012(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK((OPEN - (SUM(VWAP, 10) / 10)))) \* (-1 \* (RANK(ABS((CLOSE - VWAP)))))


<a id="alpha_013"></a>

#### alpha\_013

```python
alpha_013(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((HIGH \* LOW)^0.5)-VWAP)


<a id="alpha_014"></a>

#### alpha\_014

```python
alpha_014(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   CLOSE-DELAY(CLOSE,5)


<a id="alpha_015"></a>

#### alpha\_015

```python
alpha_015(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   OPEN/DELAY(CLOSE,1)-1


<a id="alpha_016"></a>

#### alpha\_016

```python
alpha_016(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1 \* TSMAX(RANK(CORR(RANK(VOLUME),RANK(VWAP),5)),5))


<a id="alpha_017"></a>

#### alpha\_017

```python
alpha_017(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   RANK((VWAP-MAX(VWAP,15)))^DELTA(CLOSE,5)


<a id="alpha_018"></a>

#### alpha\_018

```python
alpha_018(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   CLOSE/DELAY(CLOSE,5)


<a id="alpha_019"></a>

#### alpha\_019

```python
alpha_019(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE<DELAY(CLOSE,5)?(CLOSE-DELAY(CLOSE,5))/DELAY(CLOSE,5):(CLOSE=DELAY(CLOSE,5)?0:(CLOSE-DELAY(CLOSE,5))/CLOSE))


<a id="alpha_020"></a>

#### alpha\_020

```python
alpha_020(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE-DELAY(CLOSE,6))/DELAY(CLOSE,6)\*100


<a id="alpha_021"></a>

#### alpha\_021

```python
alpha_021(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   REGBETA(MEAN(CLOSE,6),SEQUENCE(6))


<a id="alpha_022"></a>

#### alpha\_022

```python
alpha_022(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMEAN(((CLOSE-MEAN(CLOSE,6))/MEAN(CLOSE,6)-DELAY((CLOSE-MEAN(CLOSE,6))/MEAN(CLOSE,6),3)),12,1)


<a id="alpha_023"></a>

#### alpha\_023

```python
alpha_023(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA((CLOSE>DELAY(CLOSE,1)?STD(CLOSE:20),0),20,1)/(SMA((CLOSE>DELAY(CLOSE,1)?STD(CLOSE,20):0),20,1)+SMA((CLOSE<=DELAY(CLOSE,1)?STD(CLOSE,20):0),20,1))\*100


<a id="alpha_024"></a>

#### alpha\_024

```python
alpha_024(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(CLOSE-DELAY(CLOSE,5),5,1)


<a id="alpha_025"></a>

#### alpha\_025

```python
alpha_025(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1*RANK((DELTA(CLOSE,7)*(1-RANK(DECAYLINEAR((VOLUME/MEAN(VOLUME,20)),9))))))\*(1+RANK(SUM(RET,250))))


<a id="alpha_026"></a>

#### alpha\_026

```python
alpha_026(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((((SUM(CLOSE,7)/7)-CLOSE))+((CORR(VWAP,DELAY(CLOSE,5),230))))


<a id="alpha_027"></a>

#### alpha\_027

```python
alpha_027(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   WMA((CLOSE-DELAY(CLOSE,3))/DELAY(CLOSE,3)*100+(CLOSE-DELAY(CLOSE,6))/DELAY(CLOSE,6)*100,12)


<a id="alpha_028"></a>

#### alpha\_028

```python
alpha_028(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   3*SMA((CLOSE-TSMIN(LOW,9))/(TSMAX(HIGH,9)-TSMIN(LOW,9))*100,3,1)-2*SMA(SMA((CLOSE-TSMIN(LOW,9))/( MAX(HIGH,9)-TSMAX(LOW,9))*100,3,1),3,1)


<a id="alpha_029"></a>

#### alpha\_029

```python
alpha_029(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE-DELAY(CLOSE,6))/DELAY(CLOSE,6)\*VOLUME


<a id="alpha_030（尚未实现）"></a>

#### alpha\_030（尚未实现）

```python
alpha_030(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   WMA((REGRESI(CLOSE/DELAY(CLOSE)-1,MKT,SMB,HML，60))^2,20)


<a id="alpha_031"></a>

#### alpha\_031

```python
alpha_031(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   CLOSE-MEAN(CLOSE,12))/MEAN(CLOSE,12)\*100


<a id="alpha_032"></a>

#### alpha\_032

```python
alpha_032(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*SUM(RANK(CORR(RANK(HIGH),RANK(VOLUME),3)),3))


<a id="alpha_033"></a>

#### alpha\_033

```python
alpha_033(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((((-1*TSMIN(LOW,5))+DELAY(TSMIN(LOW,5),5))*RANK(((SUM(RET,240)-SUM(RET,20))/220)))\*TSRANK(VOLUME,5))


<a id="alpha_034"></a>

#### alpha\_034

```python
alpha_034(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MEAN(CLOSE,12)/CLOSE


<a id="alpha_035"></a>

#### alpha\_035

```python
alpha_035(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MIN(RANK(DECAYLINEAR(DELTA(OPEN,1),15)),RANK(DECAYLINEAR(CORR((VOLUME),((OPEN*0.65)+(OPEN*0.35)),17),7)))\*-1)


<a id="alpha_036"></a>

#### alpha\_036

```python
alpha_036(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   RANK(SUM(CORR(RANK(VOLUME),RANK(VWAP)),6),2)


<a id="alpha_037"></a>

#### alpha\_037

```python
alpha_037(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1*RANK(((SUM(OPEN,5)*SUM(RET,5))-DELAY((SUM(OPEN,5)\*SUM(RET,5)),10))))


<a id="alpha_038"></a>

#### alpha\_038

```python
alpha_038(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((SUM(HIGH,20)/20)<HIGH)?(-1\*DELTA(HIGH,2)):0)


<a id="alpha_039"></a>

#### alpha\_039

```python
alpha_039(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK(DECAYLINEAR(DELTA((CLOSE),2),8))-RANK(DECAYLINEAR(CORR(((VWAP*0.3)+(OPEN*0.7)),SUM(MEAN(VOLUME,180),37),14),12)))\*-1


<a id="alpha_040"></a>

#### alpha\_040

```python
alpha_040(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((CLOSE>DELAY(CLOSE,1)?VOLUME:0),26)/SUM((CLOSE<=DELAY(CLOSE,1)?VOLUME:0),26)\*100


<a id="alpha_041"></a>

#### alpha\_041

```python
alpha_041(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(MAX(DELTA((VWAP),3),5))\*-1)


<a id="alpha_042"></a>

#### alpha\_042

```python
alpha_042(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1*RANK(STD(HIGH,10)))*CORR(HIGH,VOLUME,10))


<a id="alpha_043"></a>

#### alpha\_043

```python
alpha_043(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((CLOSE>DELAY(CLOSE,1)?VOLUME:(CLOSE<DELAY(CLOSE,1)?-VOLUME:0)),6)


<a id="alpha_044"></a>

#### alpha\_044

```python
alpha_044(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (TSRANK(DECAYLINEAR(CORR(((LOW)),MEAN(VOLUME,10),7),6),4)+TSRANK(DECAYLINEAR(DELTA((VWAP),3),10),15))


<a id="alpha_045"></a>

#### alpha\_045

```python
alpha_045(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(DELTA((((CLOSE*0.6)+(OPEN*0.4))),1))\*RANK(CORR(VWAP,MEAN(VOLUME,150),15)))


<a id="alpha_046"></a>

#### alpha\_046

```python
alpha_046(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MEAN(CLOSE,3)+MEAN(CLOSE,6)+MEAN(CLOSE,12)+MEAN(CLOSE,24))/(4\*CLOSE)


<a id="alpha_047"></a>

#### alpha\_047

```python
alpha_047(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA((TSMAX(HIGH,6)-CLOSE)/(TSMAX(HIGH,6)-TSMIN(LOW,6))\*100,9,1)


<a id="alpha_048"></a>

#### alpha\_048

```python
alpha_048(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1*((RANK(((SIGN((CLOSE-DELAY(CLOSE,1)))+SIGN((DELAY(CLOSE,1)-DELAY(CLOSE,2))))+SIGN((DELAY(CLOSE,2)-DELAY(CLOSE,3))))))*SUM(VOLUME,5))/SUM(VOLUME,20))


<a id="alpha_049"></a>

#### alpha\_049

```python
alpha_049(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(((HIGH+LOW)>=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12)/(SUM(((HIGH+LOW)>=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12)+SUM(((HIGH+LOW)<=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HI GH,1)),ABS(LOW-DELAY(LOW,1)))),12))


<a id="alpha_050"></a>

#### alpha\_050

```python
alpha_050(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(((HIGH+LOW)<=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12)/(SUM(((HIGH+LOW)<=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12)+SUM(((HIGH+LOW)>=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12))-SUM(((HIGH+LOW)>=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12)/(SUM(((HIGH+LOW)>=(DELAY(HIGH,1)+DELAY(LOW,1))?0: MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12)+SUM(((HIGH+LOW)<=(DELAY(HIGH,1)+DELA Y(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12))


<a id="alpha_051"></a>

#### alpha\_051

```python
alpha_051(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(((HIGH+LOW)<=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12)/(SUM(((HIGH+LOW)<=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HIGH,1)),ABS(LOW-DELAY(LOW,1)))),12)+SUM(((HIGH+LOW)>=(DELAY(HIGH,1)+DELAY(LOW,1))?0:MAX(ABS(HIGH-DELAY(HI GH,1)),ABS(LOW-DELAY(LOW,1)))),12))


<a id="alpha_052"></a>

#### alpha\_052

```python
alpha_052(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(MAX(0,HIGH-DELAY((HIGH+LOW+CLOSE)/3,1)),26)/SUM(MAX(0,DELAY((HIGH+LOW+CLOSE)/3,1)-L),26)\*100


<a id="alpha_053"></a>

#### alpha\_053

```python
alpha_053(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   COUNT(CLOSE>DELAY(CLOSE,1),12)/12\*100


<a id="alpha_054"></a>

#### alpha\_054

```python
alpha_054(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*RANK((STD(ABS(CLOSE-OPEN))+(CLOSE-OPEN))+CORR(CLOSE,OPEN,10)))


<a id="alpha_055"></a>

#### alpha\_055

```python
alpha_055(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(16*(CLOSE-DELAY(CLOSE,1)+(CLOSE-OPEN)/2+DELAY(CLOSE,1)-DELAY(OPEN,1))/((ABS(HIGH-DELAY(CL OSE,1))>ABS(LOW-DELAY(CLOSE,1))&ABS(HIGH-DELAY(CLOSE,1))>ABS(HIGH-DELAY(LOW,1))?ABS(HIGH-DELAY(CLOSE,1))+ABS(LOW-DELAY(CLOSE,1))/2+ABS(DELAY(CLOSE,1)-DELAY(OPEN,1))/4:(ABS(LOW-DELAY(CLOSE,1))>ABS(HIGH-DELAY(LOW,1))&ABS(LOW-DELAY(CLOSE,1))>ABS(HIGH-DELAY(CLOSE,1))?ABS(LOW-DELAY(CLOSE,1))+ABS(HIGH-DELAY(CLOSE,1))/2+ABS(DELAY(CLOSE,1)-DELAY(OPEN,1))/4:ABS(HIGH-DELAY(LOW,1))+ABS(DELAY(CLOSE,1)-DELAY(OPEN,1))/4)))*MAX(ABS(HIGH-DELAY(CLOSE,1)),ABS(LOW-DELAY(CLOSE,1))),20)


<a id="alpha_056"></a>

#### alpha\_056

```python
alpha_056(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK((OPEN-TSMIN(OPEN,12)))<RANK((RANK(CORR(SUM(((HIGH +LOW)/2),19),SUM(MEAN(VOLUME,40),19),13))^5)))


<a id="alpha_057"></a>

#### alpha\_057

```python
alpha_057(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA((CLOSE-TSMIN(LOW,9))/(TSMAX(HIGH,9)-TSMIN(LOW,9))\*100,3,1)


<a id="alpha_058"></a>

#### alpha\_058

```python
alpha_058(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   COUNT(CLOSE>DELAY(CLOSE,1),20)/20\*100


<a id="alpha_059"></a>

#### alpha\_059

```python
alpha_059(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((CLOSE=DELAY(CLOSE,1)?0:CLOSE-(CLOSE>DELAY(CLOSE,1)?MIN(LOW,DELAY(CLOSE,1)):MAX(HIGH,DELAY(CLOSE,1)))),20)


<a id="alpha_060"></a>

#### alpha\_060

```python
alpha_060(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(((CLOSE-LOW)-(HIGH-CLOSE))./(HIGH-LOW).\*VOLUME,20)


<a id="alpha_061"></a>

#### alpha\_061

```python
alpha_061(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MAX(RANK(DECAYLINEAR(DELTA(VWAP,1),12)),RANK(DECAYLINEAR(RANK(CORR((LOW),MEAN(VOLUME,80),8)),17)))\*-1)


<a id="alpha_062"></a>

#### alpha\_062

```python
alpha_062(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*CORR(HIGH,RANK(VOLUME),5))


<a id="alpha_063"></a>

#### alpha\_063

```python
alpha_063(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(MAX(CLOSE-DELAY(CLOSE,1),0),6,1)/SMA(ABS(CLOSE-DELAY(CLOSE,1)),6,1)\*100


<a id="alpha_064"></a>

#### alpha\_064

```python
alpha_064(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MAX(RANK(DECAYLINEAR(CORR(RANK(VWAP),RANK(VOLUME),4),4)),RANK(DECAYLINEAR(MAX(CORR(RANK(CLOSE),RANK(MEAN(VOLUME,60)),4),13),14)))\*-1)


<a id="alpha_065"></a>

#### alpha\_065

```python
alpha_065(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MEAN(CLOSE,6)/CLOSE


<a id="alpha_066"></a>

#### alpha\_066

```python
alpha_066(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE-MEAN(CLOSE,6))/MEAN(CLOSE,6)\*100


<a id="alpha_067"></a>

#### alpha\_067

```python
alpha_067(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(MAX(CLOSE-DELAY(CLOSE,1),0),24,1)/SMA(ABS(CLOSE-DELAY(CLOSE,1)),24,1)\*100


<a id="alpha_068"></a>

#### alpha\_068

```python
alpha_068(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(((HIGH+LOW)/2-(DELAY(HIGH,1)+DELAY(LOW,1))/2)\*(HIGH-LOW)/VOLUME,15,2)


<a id="alpha_069"></a>

#### alpha\_069

```python
alpha_069(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (SUM(DTM,20)>SUM(DBM,20)?(SUM(DTM,20)-SUM(DBM,20))/SUM(DTM,20):(SUM(DTM,20)=SUM(DBM,20)？0:(SUM(DTM,20)-SUM(DBM,20))/SUM(DBM,20)))


<a id="alpha_070"></a>

#### alpha\_070

```python
alpha_070(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   STD(AMOUNT,6)


<a id="alpha_071"></a>

#### alpha\_071

```python
alpha_071(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE-MEAN(CLOSE,24))/MEAN(CLOSE,24)\*100


<a id="alpha_072"></a>

#### alpha\_072

```python
alpha_072(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA((TSMAX(HIGH,6)-CLOSE)/(TSMAX(HIGH,6)-TSMIN(LOW,6))\*100,15,1)


<a id="alpha_073"></a>

#### alpha\_073

```python
alpha_073(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((TSRANK(DECAYLINEAR(DECAYLINEAR(CORR((CLOSE),VOLUME,10),16),4),5)-RANK(DECAYLINEAR(CORR(VWAP,MEAN(VOLUME,30),4),3)))\*-1)


<a id="alpha_074"></a>

#### alpha\_074

```python
alpha_074(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(CORR(SUM(((LOW*0.35)+(VWAP*0.65)),20),SUM(MEAN(VOLUME,40),20),7))+RANK(CORR(RANK(VWAP),RANK(VOLUME),6)))


<a id="alpha_075"></a>

#### alpha\_075

```python
alpha_075(code,benchmark='000300.XSHG',end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   benchmark:基准指数，默认为沪深300

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   BANCHMARKINDEXCLOSE<BANCHMARKINDEXOPEN,50)/COUNT(BANCHMARKINDEXCLOSE<BANCHMARKIN DEXOPEN,50)


<a id="alpha_076"></a>

#### alpha\_076

```python
alpha_076(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   STD(ABS((CLOSE/DELAY(CLOSE,1)-1))/VOLUME,20)/MEAN(ABS((CLOSE/DELAY(CLOSE,1)-1))/VOLUME,20)


<a id="alpha_077"></a>

#### alpha\_077

```python
alpha_077(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MIN(RANK(DECAYLINEAR(((((HIGH+LOW)/2)+HIGH)-(VWAP+HIGH)),20)),RANK(DECAYLINEAR(CORR(((HIGH+LOW)/2),MEAN(VOLUME,40),3),6)))


<a id="alpha_078"></a>

#### alpha\_078

```python
alpha_078(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((HIGH+LOW+CLOSE)/3-MA((HIGH+LOW+CLOSE)/3,12))/(0.015×MEAN(ABS(CLOSE-MEAN((HIGH+LOW+CLOSE)/3,12)),12))


<a id="alpha_079"></a>

#### alpha\_079

```python
alpha_079(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(MAX(CLOSE-DELAY(CLOSE,1),0),12,1)/SMA(ABS(CLOSE-DELAY(CLOSE,1)),12,1)×100


<a id="alpha_080"></a>

#### alpha\_080

```python
alpha_080(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (VOLUME-DELAY(VOLUME,5))/DELAY(VOLUME,5)×100


<a id="alpha_081"></a>

#### alpha\_081

```python
alpha_081(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(VOLUME,21,2)


<a id="alpha_082"></a>

#### alpha\_082

```python
alpha_082(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA((TSMAX(HIGH,6)-CLOSE)/(TSMAX(HIGH,6)-TSMIN(LOW,6))×100,20,1)


<a id="alpha_083"></a>

#### alpha\_083

```python
alpha_083(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1×RANK(COVIANCE(RANK(HIGH),RANK(VOLUME),5)))


<a id="alpha_084"></a>

#### alpha\_084

```python
alpha_084(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((CLOSE>DELAY(CLOSE,1)?VOLUME:(CLOSE<DELAY(CLOSE,1)?-VOLUME:0)),20)


<a id="alpha_085"></a>

#### alpha\_085

```python
alpha_085(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (TSRANK((VOLUME/MEAN(VOLUME,20)),20)× TSRANK((-1×DELTA(CLOSE,7)),8))


<a id="alpha_086"></a>

#### alpha\_086

```python
alpha_086(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((0.25<(((DELAY(CLOSE,20)-DELAY(CLOSE,10))/10)-((DELAY(CLOSE,10)-CLOSE)/10)))?(-1×1):(((((DELAY(CLOSE,20)-DELAY(CLOSE,10))/10)-((DELAY(CLOSE,10)-CLOSE)/10))\\<0)?1:((-1\*1)×(CLOSE-DELAY(CLOSE,1)))))


<a id="alpha_087"></a>

#### alpha\_087

```python
alpha_087(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK(DECAYLINEAR(DELTA(VWAP,4),7))+TSRANK(DECAYLINEAR(((((LOW*0.9)+(LOW*0.1))-VWAP)/(OPEN-((HIGH+LOW)/2))),11),7))\*-1)


<a id="alpha_088"></a>

#### alpha\_088

```python
alpha_088(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE-DELAY(CLOSE,20))/DELAY(CLOSE,20)\*100


<a id="alpha_089"></a>

#### alpha\_089

```python
alpha_089(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   2\*(SMA(CLOSE,13,2)-SMA(CLOSE,27,2)-SMA(SMA(CLOSE,13,2)-SMA(CLOSE,27,2),10,2))


<a id="alpha_090"></a>

#### alpha\_090

```python
alpha_090(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(CORR(RANK(VWAP),RANK(VOLUME),5))\*-1)


<a id="alpha_091"></a>

#### alpha\_091

```python
alpha_091(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK((CLOSE-MAX(CLOSE,5)))×RANK(CORR((MEAN(VOLUME,40)),LOW,5)))×-1)


<a id="alpha_092"></a>

#### alpha\_092

```python
alpha_092(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MAX(RANK(DECAYLINEAR(DELTA(((CLOSE×0.35)+(VWAP×0.65)),2),3)),TSRANK(DECAYLINEAR(ABS(CORR((MEAN(VOLUME,180)),CLOSE,13)),5),15))×-1)


<a id="alpha_093"></a>

#### alpha\_093

```python
alpha_093(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((OPEN>=DELAY(OPEN,1)?0:MAX((OPEN-LOW),(OPEN-DELAY(OPEN,1)))),20)


<a id="alpha_094"></a>

#### alpha\_094

```python
alpha_094(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((CLOSE>DELAY(CLOSE,1)?VOLUME:(CLOSE<DELAY(CLOSE,1)?-VOLUME:0)),30)


<a id="alpha_095"></a>

#### alpha\_095

```python
alpha_095(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   STD(AMOUNT,20)


<a id="alpha_096"></a>

#### alpha\_096

```python
alpha_096(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(SMA((CLOSE-TSMIN(LOW,9))/(TSMAX(HIGH,9)-TSMIN(LOW,9))×100,3,1),3,1)


<a id="alpha_097"></a>

#### alpha\_097

```python
alpha_097(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   STD(VOLUME,10)


<a id="alpha_098"></a>

#### alpha\_098

```python
alpha_098(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((((DELTA((SUM(CLOSE,100)/100),100)/DELAY(CLOSE,100))\\<0.05)||((DELTA((SUM(CLOSE,100)/100),100)/DELAY(CLOSE,100))==0.05))?(-1×(CLOSE-TSMIN(CLOSE,100))):(-1×DELTA(CLOSE,3)))


<a id="alpha_099"></a>

#### alpha\_099

```python
alpha_099(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1×RANK(COVIANCE(RANK(CLOSE),RANK(VOLUME),5)))


<a id="alpha_100"></a>

#### alpha\_100

```python
alpha_100(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   STD(VOLUME,20)


<a id="alpha_101"></a>

#### alpha\_101

```python
alpha_101(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK(CORR(CLOSE, SUM(MEAN(VOLUME,30), 37), 15)) < RANK(CORR(RANK(((HIGH \* 0.1) + (VWAP \* 0.9))), RANK(VOLUME), 11))) \* -1)


<a id="alpha_102"></a>

#### alpha\_102

```python
alpha_102(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(MAX(VOLUME-DELAY(VOLUME,1),0),6,1)/SMA(ABS(VOLUME-DELAY(VOLUME,1)),6,1)\*100


<a id="alpha_103"></a>

#### alpha\_103

```python
alpha_103(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((20-LOWDAY(LOW,20))/20)\*100


<a id="alpha_104"></a>

#### alpha\_104

```python
alpha_104(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1 \* (DELTA(CORR(HIGH,VOLUME,5),5) \* RANK(STD(CLOSE,20))))


<a id="alpha_105"></a>

#### alpha\_105

```python
alpha_105(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*CORR(RANK(OPEN),RANK(VOLUME),10))


<a id="alpha_106"></a>

#### alpha\_106

```python
alpha_106(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   CLOSE-DELAY(CLOSE,20)


<a id="alpha_107"></a>

#### alpha\_107

```python
alpha_107(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((-1*RANK((OPEN-DELAY(HIGH,1))))*RANK((OPEN-DELAY(CLOSE,1))))\*RANK((OPEN-DELAY(LOW,1))))


<a id="alpha_108"></a>

#### alpha\_108

```python
alpha_108(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK((HIGH-MIN(HIGH,2)))^RANK(CORR((VWAP),(MEAN(VOLUME,120)),6)))\*-1)


<a id="alpha_109"></a>

#### alpha\_109

```python
alpha_109(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(HIGH-LOW,10,2)/SMA(SMA(HIGH-LOW,10,2),10,2)


<a id="alpha_110"></a>

#### alpha\_110

```python
alpha_110(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(MAX(0,HIGH-DELAY(CLOSE,1)),20)/SUM(MAX(0,DELAY(CLOSE,1)-LOW),20)\*100


<a id="alpha_111"></a>

#### alpha\_111

```python
alpha_111(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(VOL*((CLOSE-LOW)-(HIGH-CLOSE))/(HIGH-LOW),11,2)-SMA(VOL*((CLOSE-LOW)-(HIGH-CLOSE))/(HIGH-LOW),4,2)


<a id="alpha_112"></a>

#### alpha\_112

```python
alpha_112(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (SUM((CLOSE-DELAY(CLOSE,1)>0?CLOSE-DELAY(CLOSE,1):0),12)-SUM((CLOSE-DELAY(CLOSE,1)\\<0?ABS(CLOS E-DELAY(CLOSE,1)):0),12))/(SUM((CLOSE-DELAY(CLOSE,1)>0?CLOSE-DELAY(CLOSE,1):0),12)+SUM((CLOSE-DE LAY(CLOSE,1)\\<0?ABS(CLOSE-DELAY(CLOSE,1)):0),12))\*100


<a id="alpha_113"></a>

#### alpha\_113

```python
alpha_113(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1*((RANK((SUM(DELAY(CLOSE,5),20)/20))*CORR(CLOSE,VOLUME,2))\*RANK(CORR(SUM(CLOSE,5),SUM(CLOSE,20),2))))


<a id="alpha_114"></a>

#### alpha\_114

```python
alpha_114(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK(DELAY(((HIGH-LOW)/(SUM(CLOSE,5)/5)),2))\*RANK(RANK(VOLUME)))/(((HIGH-LOW)/(SUM(CLOSE,5)/5))/(VWAP-CLOSE)))


<a id="alpha_115"></a>

#### alpha\_115

```python
alpha_115(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(CORR(((HIGH*0.9)+(CLOSE*0.1)),MEAN(VOLUME,30),10))^RANK(CORR(TSRANK(((HIGH+LOW)/2),4),TSRANK(VOLUME,10),7)))


<a id="alpha_116"></a>

#### alpha\_116

```python
alpha_116(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   REGBETA(CLOSE,SEQUENCE,20)


<a id="alpha_117"></a>

#### alpha\_117

```python
alpha_117(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((TSRANK(VOLUME,32)*(1-TSRANK(((CLOSE+HIGH)-LOW),16)))*(1-TSRANK(RET,32)))


<a id="alpha_118"></a>

#### alpha\_118

```python
alpha_118(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(HIGH-OPEN,20)/SUM(OPEN-LOW,20)\*100


<a id="alpha_119"></a>

#### alpha\_119

```python
alpha_119(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(DECAYLINEAR(CORR(VWAP,SUM(MEAN(VOLUME,5),26),5),7))-RANK(DECAYLINEAR(TSRANK(MIN(CORR(RANK(OPEN),RANK(MEAN(VOLUME,15)),21),9),7),8)))


<a id="alpha_120"></a>

#### alpha\_120

```python
alpha_120(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK((VWAP-CLOSE))/RANK((VWAP+CLOSE)))


<a id="alpha_121"></a>

#### alpha\_121

```python
alpha_121(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK((VWAP-MIN(VWAP,12)))^TSRANK(CORR(TSRANK(VWAP,20),TSRANK(MEAN(VOLUME,60),2),18),3))\*-1)


<a id="alpha_122"></a>

#### alpha\_122

```python
alpha_122(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (SMA(SMA(SMA(LOG(CLOSE),13,2),13,2),13,2)-DELAY(SMA(SMA(SMA(LOG(CLOSE),13,2),13,2),13,2),1))/DELAY(SMA(SMA(SMA(LOG(CLOSE),13,2),13,2),13,2),1)


<a id="alpha_123"></a>

#### alpha\_123

```python
alpha_123(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK(CORR(SUM(((HIGH+LOW)/2),20),SUM(MEAN(VOLUME,60),20),9))\\


<a id="alpha_124"></a>

#### alpha\_124

```python
alpha_124(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE-VWAP)/DECAYLINEAR(RANK(TSMAX(CLOSE,30)),2)


<a id="alpha_125"></a>

#### alpha\_125

```python
alpha_125(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(DECAYLINEAR(CORR((VWAP),MEAN(VOLUME,80),17),20))/RANK(DECAYLINEAR(DELTA(((CLOSE*0.5)+(VWAP*0.5)),3),16)))


<a id="alpha_126"></a>

#### alpha\_126

```python
alpha_126(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE+HIGH+LOW)/3


<a id="alpha_127"></a>

#### alpha\_127

```python
alpha_127(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MEAN((100\*(CLOSE-MAX(CLOSE,12))/(MAX(CLOSE,12)))^2))^(1/2)


<a id="alpha_128"></a>

#### alpha\_128

```python
alpha_128(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   100-(100/(1+SUM(((HIGH+LOW+CLOSE)/3>DELAY((HIGH+LOW+CLOSE)/3,1)?(HIGH+LOW+CLOSE)/3\* VOLUM E:0),14)/SUM(((HIGH+LOW+CLOSE)/3 < DELAY((HIGH+LOW+CLOSE)/3,1)?(HIGH+LOW+CLOSE)/3\* VOLUME:0), 14)))


<a id="alpha_129"></a>

#### alpha\_129

```python
alpha_129(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((CLOSE-DELAY(CLOSE,1)\\<0?ABS(CLOSE-DELAY(CLOSE,1)):0),12)


<a id="alpha_130"></a>

#### alpha\_130

```python
alpha_130(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(DECAYLINEAR(CORR(((HIGH+LOW)/2),MEAN(VOLUME,40),9),10))/RANK(DECAYLINEAR(CORR(RANK(VWAP),RANK(VOLUME),7),3)))


<a id="alpha_131"></a>

#### alpha\_131

```python
alpha_131(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(DELAT(VWAP,1))^TSRANK(CORR(CLOSE,MEAN(VOLUME,50),18),18))


<a id="alpha_132"></a>

#### alpha\_132

```python
alpha_132(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MEAN(AMOUNT,20)


<a id="alpha_133"></a>

#### alpha\_133

```python
alpha_133(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((20-HIGHDAY(HIGH,20))/20)*100-((20-LOWDAY(LOW,20))/20)*100


<a id="alpha_134"></a>

#### alpha\_134

```python
alpha_134(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE-DELAY(CLOSE,12))/DELAY(CLOSE,12)\*VOLUME


<a id="alpha_135"></a>

#### alpha\_135

```python
alpha_135(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式： -SMA(DELAY(CLOSE/DELAY(CLOSE,20),1),20,1)


<a id="alpha_136"></a>

#### alpha\_136

```python
alpha_136(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1*RANK(DELTA(RET,3)))*CORR(OPEN,VOLUME,10))


<a id="alpha_137"></a>

#### alpha\_137

```python
alpha_137(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   16*(CLOSE-DELAY(CLOSE,1)+(CLOSE-OPEN)/2+DELAY(CLOSE,1)-DELAY(OPEN,1))/((ABS(HIGH-DELAY(CLOSE,1))>ABS(LOW-DELAY(CLOSE,1)) &ABS(HIGH-DELAY(CLOSE,1))>ABS(HIGH-DELAY(LOW,1))?ABS(HIGH-DELAY(CLOSE,1))+ABS(LOW-DELAY(CLOSE,1))/2+ABS(DELAY(CLOSE,1)-DELAY(OPEN,1))/4:(ABS(LOW-DELAY(CLOSE,1))>ABS(HIGH-DELAY(LOW,1)) & ABS(LOW-DELAY(CLOSE,1))>ABS(HIGH-DELAY(CLOSE,1))?ABS(LOW-DELAY(CLOSE,1))+ABS(HIGH-DELAY(CLOSE,1))/2+ABS(DELAY(CLOSE,1)-DELAY(OPEN,1))/4:ABS(HIGH-DELAY(LOW,1))+ABS(DELAY(CLOSE,1)-DELAY(OPEN,1))/4)))*MAX(ABS(HIGH-DELAY(CLOSE,1)),ABS(LOW-DELAY(CLOSE,1)))


<a id="alpha_138"></a>

#### alpha\_138

```python
alpha_138(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK(DECAYLINEAR(DELTA((((LOW*0.7)+(VWAP*0.3))),3),20))-TSRANK(DECAYLINEAR(TSRANK(CORR(TSRANK(LOW,8),TSRANK(MEAN(VOLUME,60),17),5),19),16),7))\* -1)


<a id="alpha_139"></a>

#### alpha\_139

```python
alpha_139(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*CORR(OPEN,VOLUME,10))


<a id="alpha_140"></a>

#### alpha\_140

```python
alpha_140(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MIN(RANK(DECAYLINEAR(((RANK(OPEN)+RANK(LOW))-(RANK(HIGH)+RANK(CLOSE))),8)),TSRANK(DECAYLINEAR(CORR(TSRANK(CLOSE,8),TSRANK(MEAN(VOLUME,60),20),8),7),3))


<a id="alpha_141"></a>

#### alpha\_141

```python
alpha_141(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(CORR(RANK(HIGH),RANK(MEAN(VOLUME,15)),9))\*-1)


<a id="alpha_142"></a>

#### alpha\_142

```python
alpha_142(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((-1*RANK(TSRANK(CLOSE,10)))*RANK(DELTA(DELTA(CLOSE,1),1)))\*RANK(TSRANK((VOLUME/MEAN(VOLUME,20)),5)))


<a id="alpha_143"></a>

#### alpha\_143

```python
alpha_143(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   CLOSE>DELAY(CLOSE,1)?(CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1)\*SELF:SELF


<a id="alpha_144"></a>

#### alpha\_144

```python
alpha_144(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUMIF(ABS(CLOSE/DELAY(CLOSE,1)-1)/AMOUNT,20,CLOSE<DELAY(CLOSE,1))/COUNT(CLOSE<DELAY(CLOSE,1),20)


<a id="alpha_145"></a>

#### alpha\_145

```python
alpha_145(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MEAN(VOLUME,9)-MEAN(VOLUME,26))/MEAN(VOLUME,12)\*100


<a id="alpha_146"></a>

#### alpha\_146

```python
alpha_146(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MEAN((CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1)-SMA((CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1),61,2),20)\*(( CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1)-SMA((CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1),61,2))/SMA(((CLOS E-DELAY(CLOSE,1))/DELAY(CLOSE,1)-((CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1)-SMA((CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1),61,2)))^2,60);


<a id="alpha_147"></a>

#### alpha\_147

```python
alpha_147(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   REGBETA(MEAN(CLOSE,12),SEQUENCE(12))


<a id="alpha_148"></a>

#### alpha\_148

```python
alpha_148(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((RANK(CORR((OPEN),SUM(MEAN(VOLUME,60),9),6))<RANK((OPEN-TSMIN(OPEN,14))))\*-1)


<a id="alpha_149"></a>

#### alpha\_149

```python
alpha_149(code,benchmark='000300.XSHG',end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   benchmark:基准指数，默认为沪深300

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   REGBETA(FILTER(CLOSE/DELAY(CLOSE,1)-1,BANCHMARKINDEXCLOSE<DELAY(BANCHMARKINDEXCLOSE,1)),FILTER(BANCHMARKINDEXCLOSE/DELAY(BANCHMARKINDEXCLOSE,1)-1,BANCHMARKINDEXCLOSE<DELAY(BANCHMARKINDEXCLOSE,1)),252)


<a id="alpha_150"></a>

#### alpha\_150

```python
alpha_150(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE+HIGH+LOW)/3\*VOLUME


<a id="alpha_151"></a>

#### alpha\_151

```python
alpha_151(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(CLOSE-DELAY(CLOSE,20),20,1)


<a id="alpha_152"></a>

#### alpha\_152

```python
alpha_152(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(MEAN(DELAY(SMA(DELAY(CLOSE/DELAY(CLOSE,9),1),9,1),1),12)-MEAN(DELAY(SMA(DELAY(CLOSE/DELAY (CLOSE,9),1),9,1),1),26),9,1)


<a id="alpha_153"></a>

#### alpha\_153

```python
alpha_153(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MEAN(CLOSE,3)+MEAN(CLOSE,6)+MEAN(CLOSE,12)+MEAN(CLOSE,24))/4


<a id="alpha_154"></a>

#### alpha\_154

```python
alpha_154(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (((VWAP-MIN(VWAP,16)))<(CORR(VWAP,MEAN(VOLUME,180),18)))


<a id="alpha_155"></a>

#### alpha\_155

```python
alpha_155(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(VOLUME,13,2)-SMA(VOLUME,27,2)-SMA(SMA(VOLUME,13,2)-SMA(VOLUME,27,2),10,2)


<a id="alpha_156"></a>

#### alpha\_156

```python
alpha_156(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MAX(RANK(DECAYLINEAR(DELTA(VWAP,5),3)),RANK(DECAYLINEAR(((DELTA(((OPEN*0.15)+(LOW*0.85)),2)/((OPEN*0.15)+(LOW*0.85)))*\-1),3)))*\-1)


<a id="alpha_157"></a>

#### alpha\_157

```python
alpha_157(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MIN(PROD(RANK(RANK(LOG(SUM(TSMIN(RANK(RANK((-1*RANK(DELTA((CLOSE-1),5))))),2),1)))),1),5) +TSRANK(DELAY((-1*RET),6),5))


<a id="alpha_158"></a>

#### alpha\_158

```python
alpha_158(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((HIGH-SMA(CLOSE,15,2))-(LOW-SMA(CLOSE,15,2)))/CLOSE


<a id="alpha_159"></a>

#### alpha\_159

```python
alpha_159(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((CLOSE-SUM(MIN(LOW,DELAY(CLOSE,1)),6))/SUM(MAX(HGIH,DELAY(CLOSE,1))-MIN(LOW,DELAY(CLOSE,1)),6)*12*24+(CLOSE-SUM(MIN(LOW,DELAY(CLOSE,1)),12))/SUM(MAX(HGIH,DELAY(CLOSE,1))-MIN(LOW,DELAY(CL OSE,1)),12)*6*24+(CLOSE-SUM(MIN(LOW,DELAY(CLOSE,1)),24))/SUM(MAX(HGIH,DELAY(CLOSE,1))-MIN(LOW,D ELAY(CLOSE,1)),24)*6*24)*100/(6*12+6*24+12*24)


<a id="alpha_160"></a>

#### alpha\_160

```python
alpha_160(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA((CLOSE<=DELAY(CLOSE,1)?STD(CLOSE,20):0),20,1)


<a id="alpha_161"></a>

#### alpha\_161

```python
alpha_161(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MEAN(MAX(MAX((HIGH-LOW),ABS(DELAY(CLOSE,1)-HIGH)),ABS(DELAY(CLOSE,1)-LOW)),12)


<a id="alpha_162"></a>

#### alpha\_162

```python
alpha_162(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (SMA(MAX(CLOSE-DELAY(CLOSE,1),0),12,1)/SMA(ABS(CLOSE-DELAY(CLOSE,1)),12,1)*100-MIN(SMA(MAX(CLOSE-DELAY(CLOSE,1),0),12,1)/SMA(ABS(CLOSE-DELAY(CLOSE,1)),12,1)*100,12))/(MAX(SMA(MAX(CLOSE-DELAY(CLOSE,1),0),12,1)/SMA(ABS(CLOSE-DELAY(CLOSE,1)),12,1)*100,12)-MIN(SMA(MAX(CLOSE-DELAY(CLOSE,1),0),12, 1)/SMA(ABS(CLOSE-DELAY(CLOSE,1)),12,1)*100,12))


<a id="alpha_163"></a>

#### alpha\_163

```python
alpha_163(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   RANK(((((-1*RET)*MEAN(VOLUME,20))\*VWAP)\*(HIGH-CLOSE)))


<a id="alpha_164"></a>

#### alpha\_164

```python
alpha_164(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA((((CLOSE>DELAY(CLOSE,1))?1/(CLOSE-DELAY(CLOSE,1)):1)-MIN(((CLOSE>DELAY(CLOSE,1))?1/(CLOSE-D ELAY(CLOSE,1)):1),12))/(HIGH-LOW)\*100,13,2)


<a id="alpha_165（尚未实现）"></a>

#### alpha\_165（尚未实现）

```python
alpha_165(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MAX(SUMAC(CLOSE-MEAN(CLOSE,48)))-MIN(SUMAC(CLOSE-MEAN(CLOSE,48)))/STD(CLOSE,48)


<a id="alpha_166"></a>

#### alpha\_166

```python
alpha_166(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   \-20*(20-1)^1.5* SUM(CLOSE/DELAY(CLOSE,1)-1-MEAN(CLOSE/DELAY(CLOSE,1)-1,20),20)/((20-1)\* (20-2)(SUM((CLOSE/DELAY(CLOSE,1),20)^2,20))^1.5)


<a id="alpha_167"></a>

#### alpha\_167

```python
alpha_167(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((CLOSE-DELAY(CLOSE,1)>0?CLOSE-DELAY(CLOSE,1):0),12


<a id="alpha_168"></a>

#### alpha\_168

```python
alpha_168(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (-1\*VOLUME/MEAN(VOLUME,20))


<a id="alpha_169"></a>

#### alpha\_169

```python
alpha_169(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA(MEAN(DELAY(SMA(CLOSE-DELAY(CLOSE,1),9,1),1),12)-MEAN(DELAY(SMA(CLOSE-DELAY(CLOSE,1),9,1),1), 26),10,1)


<a id="alpha_170"></a>

#### alpha\_170

```python
alpha_170(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((((RANK((1/CLOSE))*VOLUME)/MEAN(VOLUME,20))*((HIGH\*RANK((HIGH-CLOSE)))/(SUM(HIGH,5)/5)))-RANK((VWAP-DELAY(VWAP,5))))


<a id="alpha_171"></a>

#### alpha\_171

```python
alpha_171(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((-1*((LOW-CLOSE)*(OPEN^5)))/((CLOSE-HIGH)\*(CLOSE^5)))


<a id="alpha_172"></a>

#### alpha\_172

```python
alpha_172(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MEAN(ABS(SUM((LD>0&LD>HD)?LD:0,14)*100/SUM(TR,14)-SUM((HD>0&HD>LD)?HD:0,14)*100/SUM(TR,14))/(SUM((LD>0&LD>HD)?LD:0,14)*100/SUM(TR,14)+SUM((HD>0&HD>LD)?HD:0,14)*100/SUM(TR,14))\*100,6)


<a id="alpha_173"></a>

#### alpha\_173

```python
alpha_173(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   3*SMA(CLOSE,13,2)-2*SMA(SMA(CLOSE,13,2),13,2)+SMA(SMA(SMA(LOG(CLOSE),13,2),13,2),13,2);


<a id="alpha_174"></a>

#### alpha\_174

```python
alpha_174(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SMA((CLOSE>DELAY(CLOSE,1)?STD(CLOSE,20):0),20,1)


<a id="alpha_175"></a>

#### alpha\_175

```python
alpha_175(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MEAN(MAX(MAX((HIGH-LOW),ABS(DELAY(CLOSE,1)-HIGH)),ABS(DELAY(CLOSE,1)-LOW)),6)


<a id="alpha_176"></a>

#### alpha\_176

```python
alpha_176(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   CORR(RANK(((CLOSE-TSMIN(LOW,12))/(TSMAX(HIGH,12)-TSMIN(LOW,12)))),RANK(VOLUME),6)


<a id="alpha_177"></a>

#### alpha\_177

```python
alpha_177(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((20-HIGHDAY(HIGH,20))/20)\*100


<a id="alpha_178"></a>

#### alpha\_178

```python
alpha_178(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1)\*VOLUME


<a id="alpha_179"></a>

#### alpha\_179

```python
alpha_179(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(CORR(VWAP,VOLUME,4))\*RANK(CORR(RANK(LOW),RANK(MEAN(VOLUME,50)),12)))


<a id="alpha_180"></a>

#### alpha\_180

```python
alpha_180(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((MEAN(VOLUME,20)<VOLUME)?((-1*TSRANK(ABS(DELTA(CLOSE,7)),60))*SIGN(DELTA(CLOSE,7)):(-1\*VOLUME)))


<a id="alpha_181"></a>

#### alpha\_181

```python
alpha_181(code,benchmark='000300.XSHG',end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   benchmark:基准指数，默认为沪深300

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM(((CLOSE/DELAY(CLOSE,1)-1)-MEAN((CLOSE/DELAY(CLOSE,1)-1),20))-(BANCHMARKINDEXCLOSE-MEAN(BANCHMARKINDEXCLOSE,20))^2,20)/SUM((BANCHMARKINDEXCLOSE-MEAN(BANCHMARKINDEXCLOSE,20))^3)


<a id="alpha_182"></a>

#### alpha\_182

```python
alpha_182(code,benchmark='000300.XSHG',end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   benchmark:基准指数，默认为沪深300

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   COUNT((CLOSE>OPEN&BANCHMARKINDEXCLOSE>BANCHMARKINDEXOPEN)OR(CLOSE<OPEN&BANCHMARKINDEXCLOSE<BANCHMARKINDEXOPEN),20)/20


<a id="alpha_183（尚未实现）"></a>

#### alpha\_183（尚未实现）

```python
alpha_183(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MAX(SUMAC(CLOSE-MEAN(CLOSE,24)))-MIN(SUMAC(CLOSE-MEAN(CLOSE,24)))/STD(CLOSE,24)


<a id="alpha_184"></a>

#### alpha\_184

```python
alpha_184(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (RANK(CORR(DELAY((OPEN-CLOSE),1),CLOSE,200))+RANK((OPEN-CLOSE)))


<a id="alpha_185"></a>

#### alpha\_185

```python
alpha_185(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   RANK((-1\*((1-(OPEN/CLOSE))^2)))


<a id="alpha_186"></a>

#### alpha\_186

```python
alpha_186(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   (MEAN(ABS(SUM((LD>0&LD>HD)?LD:0,14)*100/SUM(TR,14)-SUM((HD>0&HD>LD)?HD:0,14)*100/SUM(TR,14))/(SUM((LD>0&LD>HD)?LD:0,14)*100/SUM(TR,14)+SUM((HD>0&HD>LD)?HD:0,14)*100/SUM(TR,14))*100,6)+DELAY(MEAN(ABS(SUM((LD>0&LD>HD)?LD:0,14)*100/SUM(TR,14)-SUM((HD>0&HD>LD)?HD:0,14)*100/SUM(TR,14))/(SUM((LD>0&LD>HD)?LD:0,14)*100/SUM(TR,14)+SUM((HD>0&HD>LD)?HD:0,14)*100/SUM(TR,14))*100,6),6))/2


<a id="alpha_187"></a>

#### alpha\_187

```python
alpha_187(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   SUM((OPEN<=DELAY(OPEN,1)?0:MAX((HIGH-OPEN),(OPEN-DELAY(OPEN,1)))),20)


<a id="alpha_188"></a>

#### alpha\_188

```python
alpha_188(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((HIGH-LOW–SMA(HIGH-LOW,11,2))/SMA(HIGH-LOW,11,2))\*100


<a id="alpha_189"></a>

#### alpha\_189

```python
alpha_189(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   MEAN(ABS(CLOSE-MEAN(CLOSE,6)),6)


<a id="alpha_190"></a>

#### alpha\_190

```python
alpha_190(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：（公式有部分缺失 有调整）

-   原公式:

    -   LOG((COUNT(CLOSE/DELAY(CLOSE)-1>((CLOSE/DELAY(CLOSE,19))^(1/20)-1),20)-1)*(SUMIF(((CLOSE/DELAY(CLOSE)-1-(CLOSE/DELAY(CLOSE,19))^(1/20)-1))^2,20,CLOSE/DELAY(CLOSE)-1<(CLOSE/DELAY(CLOSE,19))^(1/20)-1))/((COUNT((CLOSE/DELAY(CLOSE)-1<(CLOSE/DELAY(CLOSE,19))^(1/20)-1),20))*(SUMIF((CLOSE/DELAY(CLOSE)-1-((CLOSE/DELAY(CLOSE,19))^(1/20)-1))^2,20,CLOSE/DELAY(CLOSE)-1>(CLOSE/DELAY(CLOSE,19))^(1/20)-1))))
-   修改后公式:

    -   LOG((COUNT(CLOSE/DELAY(CLOSE,1)-1>((CLOSE/DELAY(CLOSE,19))^(1/20)-1),20)-1)*(SUMIF(((CLOSE/DELAY(CLOSE,1)-1-(CLOSE/DELAY(CLOSE,19))^(1/20)-1))^2,20,CLOSE/DELAY(CLOSE,1)-1<(CLOSE/DELAY(CLOSE,19))^(1/20)-1))/((COUNT((CLOSE/DELAY(CLOSE,1)-1<(CLOSE/DELAY(CLOSE,19))^(1/20)-1),20))*(SUMIF((CLOSE/DELAY(CLOSE,1)-1-((CLOSE/DELAY(CLOSE,19))^(1/20)-1))^2,20,CLOSE/DELAY(CLOSE,1)-1>(CLOSE/DELAY(CLOSE,19))^(1/20)-1))))

<a id="alpha_191"></a>

#### alpha\_191

```python
alpha_191(code,end_date=None)
```

-   输入：

-   code: 股票代码列表

-   end\_date: 计算哪一天的因子 ,默认为None也就是最近一交易日的日期

-   输出：

-   一个 Series：index 为成分股代码，values 为对应的因子值

-   因子公式：

-   ((CORR(MEAN(VOLUME,20),LOW,5)+((HIGH+LOW)/2))-CLOSE)
