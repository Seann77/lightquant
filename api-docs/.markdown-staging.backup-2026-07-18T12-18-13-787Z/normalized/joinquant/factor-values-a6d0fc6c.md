---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: factor
title: 使用方法
section_path:
  - 因子库
  - 使用方法
source_file: api-docs/raw/joinquant/factor_values/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=factor_values
source_anchor: "#使用方法"
source_sha256: 5a622f2341cb1d5e0c324ba9570efa383bf44aa0e7ed70bc42a20bb614f27a7a
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="使用方法"></a>

## 使用方法

**说明：**

-   在单因子分析中可以直接获取因子库中的数据
-   同时也可以通过API的形式，在其他模块中获取这些因子
-   为保证数据的连续性，所有数据基于`后复权`计算
-   涉及到财务数据的因子，使用对应日期所能获取到的最新一期单季度数据进行计算
-   为了防止单次返回数据时间过长，每次调用 api 请求的因子值不能超过 200000 个
-   频率为天，每天05：00更新前一天数据
-   提供股票的因子数据，不支持期货、指数等
-   因子库中nan值：缺少依赖数据;财务数据中如果标的未披露相关字段,依赖数据不完整的话会返回nan值,请注意到财务报表披露规则变更,标的报表披露形式(金融类,非金融类等) , 以及标的上市时间等
-   有关因子处理：除了因子描述及说明中有解释处理方法的因子，其他的都是原始因子，没有经过处理

<a id="获取因子值"></a>

### 获取因子值

获取因子值:

```python
# 导入函数库
from jqfactor import get_factor_values
# 取值函数
get_factor_values(securities, factors, start_date, end_date, count)
```

**参数**

-   securities:股票池，单只股票（字符串）或一个股票列表
-   factors: 因子名称，单个因子（字符串）或一个因子列表
-   start\_date:开始日期，字符串或 datetime 对象，与 coun t参数二选一
-   end\_date: 结束日期， 字符串或 datetime 对象，可以与 start\_date 或 count 配合使用
-   count: 截止 end\_date 之前交易日的数量（含 end\_date 当日），与 start\_date 参数二选一

**返回**

-   一个 dict： key 是因子名称， value 是 pandas.dataframe。
-   dataframe 的 index 是日期， column 是股票代码， value 是因子值

**示例**

```python
# 导入函数库
from jqfactor import get_factor_values

# 获取因子Skewness60(个股收益的60日偏度)从 2017-01-01 至 2017-03-04 的因子值
factor_data = get_factor_values(securities=['000001.XSHE'], factors=['Skewness60','DEGM','quick_ratio'], start_date='2017-01-01', end_date='2017-03-04')
# 查看因子值
factor_data['Skewness60']
```

<a id="获取所有因子"></a>

### 获取所有因子

```python
get_all_factors()
```

描述：获取聚宽因子库中所有的因子code和因子名称

**参数**：无

**返回**：pandas.DataFrame，

-   factor:因子code
-   factor\_intro:因子说明
-   category:因子分类名称
-   category\_intro:因子分类说明 **示例**：

```python
#获取聚宽因子库所有因子
from jqfactor import get_all_factors
print(get_all_factors())

#输出
                                     factor     factor_intro   category  category_intro
0                                      beta             BETA      style  风险因子 - 风格因子
1                       book_to_price_ratio            市净率因子      style  风险因子 - 风格因子
2                            earnings_yield           盈利预期因子      style  风险因子 - 风格因子
3                                    growth             成长因子      style  风险因子 - 风格因子
4                                  leverage             杠杆因子      style  风险因子 - 风格因子
5                                 liquidity            流动性因子      style  风险因子 - 风格因子
6                                  momentum             动量因子      style  风险因子 - 风格因子
7                           non_linear_size          非线性市值因子      style  风险因子 - 风格因子
8                       residual_volatility           残差波动因子      style  风险因子 - 风格因子
9                                      size             市值因子      style  风险因子 - 风格因子
10               administration_expense_ttm          管理费用TTM     basics      基础科目及衍生类因子
11                asset_impairment_loss_ttm        资产减值损失TTM     basics      基础科目及衍生类因子
12                                     EBIT            息税前利润     basics      基础科目及衍生类因子
...
...
```
