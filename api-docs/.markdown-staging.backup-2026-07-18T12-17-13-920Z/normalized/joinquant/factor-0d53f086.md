---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 示例
section_path:
  - 因子分析
  - 示例
source_file: api-docs/raw/joinquant/factor/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=factor
source_anchor: "#示例"
source_sha256: 696149a6fbb4eae39080d3f3c6a739d62f8dd42a478ed6b4a76377894ff94a05
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="示例"></a>

## 示例

<a id="『价量』alpha191中的013"></a>

### 『价量』alpha 191 中的 013

**因子链接**

-   [alpha\_013](https://www.joinquant.com/data/dict/alpha191#alpha013)

**因子公式**

-   (((HIGH\*LOW)^0.5)-VWAP)

**因子实现**

```python
from jqfactor import Factor
import numpy as np

class ALPHA013(Factor):
    # 设置因子名称
    name = 'alpha013'
    # 设置获取数据的时间窗口长度
    max_window = 1
    # 设置依赖的数据
    dependencies = ['high','low','volume','money']

    # 计算因子的函数， 需要返回一个 pandas.Series, index 是股票代码，value 是因子值
    def calc(self, data):

    # 最高价的 dataframe ， index 是日期， column 是股票代码
        high = data['high']

        # 最低价的 dataframe ， index 是日期， column 是股票代码
        low = data['low']

        #计算 vwap
        vwap = data['money']/data['volume']

        # 返回因子值， 这里求平均值是为了把只有一行的 dataframe 转成 series
        return (np.power(high*low,0.5) - vwap).mean()
```

<a id="『基本面』grossprofitability"></a>

### 『基本面』gross profitability

**参考链接**

-   [首席质量因子 - Gross Profitability -- 小兵哥](https://www.joinquant.com/post/6585?tag=algorithm)

**因子公式**

-   (total\_operating\_revenue - total\_operating\_cost) / total\_assets

**因子实现**

```python
from jqfactor import Factor

class GROSSPROFITABILITY(Factor):
    # 设置因子名称
    name = 'gross_profitability'
    # 设置获取数据的时间窗口长度
    max_window = 1
    # 设置依赖的数据
    # 在策略中需要使用 get_fundamentals 获取的 income.total_operating_revenue, 在这里可以直接写做total_operating_revenue。 其他数据同理。
    dependencies = ['total_operating_revenue','total_operating_cost','total_assets']

    # 计算因子的函数， 需要返回一个 pandas.Series, index 是股票代码，value 是因子值
    def calc(self, data):
        # 获取单季度的营业总收入数据 , index 是日期，column 是股票代码， value 是营业总收入
        total_operating_revenue = data['total_operating_revenue']
        # 获取单季度的营业总成本数据
        total_operating_cost = data['total_operating_cost']
        # 获取总资产
        total_assets = data['total_assets']
        # 计算 gross_profitability
        gross_profitability = (total_operating_revenue - total_operating_cost)/total_assets
        # 由于 gross_profitability 是一个一行 n 列的 dataframe，可以直接求 mean 转成 series
        return gross_profitability.mean()
```

<a id="『中性化』产权比率"></a>

### 『中性化』产权比率

**因子公式**

-   负债合计/归属母公司所有者权益合计

**因子实现**

```python
from jqfactor import Factor
import numpy as np
import pandas as pd

class DebtEquityRatio(Factor):
    name = 'debt_to_equity_ratio'
    max_window = 1
    dependencies = ['total_liability','equities_parent_company_owners',
                    # 以下为中性化需要使用的数据
                    'market_cap',
                    'HY001','HY002','HY003',
                    'HY004','HY005','HY006',
                    'HY007','HY008','HY009',
                    'HY010','HY011']

    def calc(self, data):
        tl = data['total_liability']
        epco = data['equities_parent_company_owners']
        result = tl / epco
        return neutralization(data, result.mean())

# 行业市值中性化
def neutralization(data, factor):
    from statsmodels.api import OLS
    industry_exposure = pd.DataFrame(index=data['HY001'].columns)
    industry_list = ['HY001','HY002','HY003','HY004','HY005',
                    'HY006','HY007','HY008','HY009','HY010','HY011']
    for key, value in data.items():
        if key in industry_list:
            industry_exposure[key]=value.iloc[-1]
    market_cap_exposure = data['market_cap'].iloc[-1]
    total_exposure = pd.concat([market_cap_exposure,industry_exposure],axis=1)
    result = OLS(factor, total_exposure, missing='drop').fit().resid
    return result
```

<a id="『指数』近10日alpha"></a>

### 『指数』近10日 alpha

**因子公式**

-   个股近10日收益 - 指数（沪深300）近10日收益 近10日收益计算方法： (第10日价格/第1日价格) - 1

**因子实现**

```python
from jqfactor import Factor

class Hs300Alpha(Factor):
    # 设置因子名称
    name = 'hs300_alpha'
    # 设置获取数据的时间窗口长度
    max_window = 10
    # 设置依赖的数据
    dependencies = ['close']

    # 计算因子的函数， 需要返回一个 pandas.Series, index 是股票代码，value 是因子值
    def calc(self, data):
        # 获取个股的收盘价数据
        close = data['close']
        # 计算个股近10日收益
        stock_return = close.iloc[-1,:]/close.iloc[0,:] -1
        # 获取指数（沪深300）的收盘价数据
        index_close = self._get_extra_data(securities=['000300.XSHG'], fields=['close'])['close']
        # 计算指数的近10日收益
        index_return = index_close.iat[-1,0]/index_close.iat[0,0] - 1
        # 计算 alpha
        alpha = stock_return - index_return
        return alpha
```

<a id="『基本面』近两年净利润增长率"></a>

### 『基本面』近两年净利润增长率

**因子公式**

-   最新一年度的净利润/上一年度的净利润 -1

**因子实现**

```python
from jqfactor import Factor

class NetProfitGrowth(Factor):
    # 设置因子名称
    name = 'net_profit_growth_rate'
    # 设置获取数据的时间窗口长度
    max_window = 1
    # 设置依赖的数据
    dependencies = ['net_profit_y','net_profit_y1']

    # 计算因子的函数， 需要返回一个 pandas.Series, index 是股票代码，value 是因子值
    def calc(self, data):
        # 个股最新一年度的净利润数据
        net_profit_y = data['net_profit_y']
        # 个股最新一年度的上一年的净利润数据
        net_profit_y1 = data['net_profit_y1']
        # 计算增长率
        growth = net_profit_y/net_profit_y1 - 1
        # 返回一个 series
        return growth.mean()
```

<a id="『多季度』资产回报率"></a>

### 『多季度』 资产回报率

**因子公式**

-   过去四个季度的净利润之和/期末总资产

**因子实现**

```python
class ROATTM(Factor):
    name = 'roa_ttm'
    max_window = 1
    # 定义依赖的数据： 过去四个季度的净利润， 以及最新一个季度的总资产
    dependencies = ['net_profit', 'net_profit_1', 'net_profit_2', 'net_profit_3',
                    'total_assets']

    def calc(self, data):
        # 计算净利润的 ttm 值
        net_profit_ttm = data['net_profit'] + data['net_profit_1'] + data['net_profit_2'] + data['net_profit_3']
        # 计算 ROA
        result = net_profit_ttm / data['total_assets']
        # 把结果转成一个 series
        return result.mean()
```

<a id="构建因子数据进行单因子分析"></a>

### 构建因子数据进行单因子分析

前面的例子讲述了通过自定义类实现因子，本例讲解如何直接获取因子数据或者构建因子数据，然后对得到的数据进行单因子分析。
其中的factor\_data数据需要自己获取，并整理成符合因子分析要求的格式。
更多关于factor\_data数据格式请查看单因子分析框架[jqfactor\_analyzer](https://github.com/JoinQuant/jqfactor_analyzer)

```python
# 载入函数库
from jqfactor import analyze_factor
from jqdata import *
from jqlib import alpha191
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

# 测试开始时间
start_date = '2019-10-01'
# 测试结束时间
end_date = '2019-11-11'
# 测试时间区间的交易日
date_list = get_trade_days(start_date=start_date, end_date=end_date)
# 转换交易日时间的数据类型
# date_list = [date.strftime('%Y-%m-%d') for date in date_list]

# 获取一段时间股票池191因子数据
factor_data = {}
# 循环获取每天数据
for date in date_list:
    # 获取每天的股票池
    universe = get_index_stocks('000300.XSHG', date=date)
    # 获取每天股票池的因子数据
    _factor_data = alpha191.alpha_002(code=universe, end_date=date, fq='post')
    # 添加每天的因子数据
    factor_data[date] = _factor_data

# 将字典类型数据转换为DataFrame
factor_data = pd.DataFrame(factor_data).T
# 将 index 转换为 DatetimeIndex
factor_data.index = pd.to_datetime(factor_data.index)

# 对因子进行分析，参数使用默认值
far = analyze_factor(factor=factor_data, )
# 展示全部分析
far.create_full_tear_sheet(demeaned=False, group_adjust=False, by_group=False, turnover_periods=None,
                           avgretplot=(5, 15), std_bar=False)
```

<a id="多因子参考资料"></a>

### 多因子参考资料

1.  《主动投资组合管理》 英文版的名称是"Active Portfolio Management"
2.  Quantitative Equity Portfolio Management -- An Active Approach to Portfolio Construction and Management
3.  Quantitative Equity Portfolio Management -- Modern Techniques and Applications
4.  Barra Risk Model Handbook
