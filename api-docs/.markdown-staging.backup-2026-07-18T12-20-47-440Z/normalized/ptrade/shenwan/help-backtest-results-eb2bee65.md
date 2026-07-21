---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 绩效指标
section_path:
  - 策略绩效评价说明
  - 绩效指标
source_file: api-docs/raw/ptrade/shenwan/05_help_backtest_results.html
source_url: http://101.71.132.53:9091/qthelp/help/backtest_results.html
source_anchor: "#绩效指标"
source_sha256: 2dd81a01f1aad2bc053fd5dc8d51bee662e58e54ce0633e6c713e0d42318b902
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="绩效指标"></a>

## 绩效指标

<a id="_1-策略收益-total-return"></a>

### 1\. 策略收益 (Total Return)

**定义**：策略在回测期间的总收益率

**算法**：将每日收益率加1后连乘，最后减去1

python

```python
(1 + strategy_daily_returns).prod() - 1
```

**实现逻辑**：

1、每天记录策略收益率（今日资产/昨日资产）
2、将所有日收益率加1后相乘
3、结果减去1即为总收益

**参数说明**：：无

<a id="_2-基准收益-benchmark-total-return"></a>

### 2\. 基准收益 (Benchmark Total Return)

**定义**：基准指数在回测期间的总收益率

**算法**：将每日基准收益率加1后连乘，最后减去1

python

```python
(1 + benchmark_daily_returns).prod() - 1
```

**实现逻辑**：

1、每天记录基准收益率（今日指数/昨日指数）
2、将所有日收益率加1后相乘
3、结果减去1即为基准总收益

**参数说明**：：无

<a id="_3-alpha比率-alpha"></a>

### 3\. Alpha比率 (Alpha)

**定义**：策略相对于基准的超额收益（经系统性风险调整后）

**算法**：策略年化收益 - (无风险利率 + Beta × (基准年化收益 - 无风险利率))

python

```python
annual_return - (risk_free_rate + beta * (benchmark_annual_return - risk_free_rate))
```

**实现逻辑**：

1、计算策略年化收益
2、计算基准年化收益
3、计算Beta系数
4、代入公式计算Alpha

**参数说明**：

无风险利率：默认0.04（4%）

<a id="_4-beta比率-beta"></a>

### 4\. Beta比率 (Beta)

**定义**：策略相对于基准的系统性风险暴露程度

**算法**：策略与基准的波动联动程度

python

```python
cov(strategy_returns, benchmark_returns) / var(benchmark_returns)
```

**实现逻辑**：

1、计算策略收益与基准收益的协同变化程度
2、计算基准收益自身的变化程度
3、协同变化程度除以基准自身变化程度

**参数说明**：

无

<a id="_5-夏普比率-sharpe-ratio"></a>

### 5\. 夏普比率 (Sharpe Ratio)

**定义**：单位风险产生的超额收益

**算法**：(年化收益 - 无风险利率) ÷ 收益波动程度

python

```python
(annual_return - risk_free_rate) / volatility
```

**实现逻辑**：

1、计算策略年化收益
2、计算策略收益波动幅度
3、计算超额收益（年化收益 - 无风险利率）
4、超额收益除以波动幅度

**参数说明**：

无风险利率：默认0.04（4%）

<a id="_6-索提诺比率-sortino-ratio"></a>

### 6\. 索提诺比率 (Sortino Ratio)

**定义**：单位下行风险产生的超额收益

**算法**：(年化收益 - 无风险利率) ÷ 下跌波动程度

python

```python
(annual_return - risk_free_rate) / downside_risk
```

**实现逻辑**：

1、计算策略年化收益
2、仅计算低于无风险利率的波动（下跌风险）
3、计算超额收益（年化收益 - 无风险利率）
4、超额收益除以下跌风险

**参数说明**：

无风险利率：默认0.04（4%）

<a id="_7-最大回撤-max-drawdown"></a>

### 7\. 最大回撤 (Max Drawdown)

**定义**：策略净值从峰值到谷底的最大跌幅

**算法**：最高点到最低点的最大跌幅百分比

python

```python
max(1 - current_value / historical_peak)
```

**实现逻辑**：

1、记录每日策略净值
2、跟踪历史最高净值
3、计算每日从最高点下跌的百分比
4、取最大下跌值

**参数说明**：

无

<a id="_8-策略年化收益率-annualized-strategy-return"></a>

### 8\. 策略年化收益率 (Annualized Strategy Return)

**定义**：策略收益的年化复合增长率

**算法**：将总收益转化为年度平均收益率

python

```python
(1 + total_return) ** (annual_factor / days) - 1
```

**实现逻辑**：

1、计算策略总收益
2、根据交易日数折算成年化收益
3、考虑复利效应

**参数说明**：

年化因子：默认250（年交易日数）

<a id="_9-基准年化收益率-annualized-benchmark-return"></a>

### 9\. 基准年化收益率 (Annualized Benchmark Return)

**定义**：基准收益的年化复合增长率

**算法**：将总收益转化为年度平均收益率

python

```python
(1 + benchmark_total_return) ** (annual_factor / days) - 1
```

**实现逻辑**：

1、计算基准总收益
2、根据交易日数折算成年化收益
3、考虑复利效应

**参数说明**：

年化因子：默认250（年交易日数）

<a id="_10-超额收益-excess-return"></a>

### 10\. 超额收益 (Excess Return)

**定义**：策略收益超越基准收益的部分

**算法**：策略总收益 - 基准总收益

python

```python
strategy_total_return - benchmark_total_return
```

**实现逻辑**：

1、计算策略总收益
2、计算基准总收益
3、两者相减

**参数说明**：

无

<a id="_11-年化超额收益-annualized-excess-return"></a>

### 11\. 年化超额收益 (Annualized Excess Return)

**定义**：超额收益的年化复合增长率

**算法**：将超额收益转化为年度平均值

python

```python
(1 + excess_return) ** (annual_factor / days) - 1
```

**实现逻辑**：

1、计算超额收益
2、根据交易日数折算成年化值
3、考虑复利效应

**参数说明**：

年化因子：默认250（年交易日数）

<a id="_12-日胜率-daily-win-rate"></a>

### 12\. 日胜率 (Daily Win Rate)

**定义**：策略日收益跑赢基准日收益的天数占比

**算法**：跑赢天数 ÷ 总交易天数

python

```python
sum(strategy_daily_returns > benchmark_daily_returns) / total_days
```

**实现逻辑**：

1、每日比较策略收益和基准收益
2、统计策略收益更高的天数
3、除以总交易天数

**参数说明**：

无

<a id="_13-胜率-win-rate"></a>

### 13\. 胜率 (Win Rate)

**定义**：盈利交易次数占总交易次数的比例

**算法**：盈利交易次数 ÷ 总交易次数

python

```python
win_trades / total_trades
```

**实现逻辑**：

1、统计所有交易
2、标记盈利交易（收益率 > 0）
3、盈利次数除以总交易次数

**参数说明**：

无

<a id="_14-盈亏比-profit-loss-ratio"></a>

### 14\. 盈亏比 (Profit Loss Ratio)

**定义**：平均盈利与平均亏损的比值

**算法**：总盈利金额 ÷ 总亏损金额（绝对值）

python

```python
total_profit / abs(total_loss)
```

**实现逻辑**：

1、计算所有盈利交易的总收益
2、计算所有亏损交易的总亏损（取绝对值）
3、总盈利除以总亏损

**参数说明**：

无

<a id="_15-盈利次数-number-of-profitable-trades"></a>

### 15\. 盈利次数 (Number of Profitable Trades)

**定义**：获得正收益的交易次数

**算法**：统计所有赚钱的交易次数

python

```python
count(return > 0 for all trades)
```

**实现逻辑**：

1、遍历交易记录
2、统计收益率为正的交易数量

**参数说明**：

无

<a id="_16-亏损次数-number-of-loss-trades"></a>

### 16\. 亏损次数 (Number of Loss Trades)

**定义**：获得负收益的交易次数

**算法**：统计所有亏钱的交易次数

python

```python
count(return < 0 for all trades)
```

**实现逻辑**：

1、遍历交易记录
2、统计收益率为负的交易数量

**参数说明**：

无

<a id="_17-信息比率-information-ratio"></a>

### 17\. 信息比率 (Information Ratio)

**定义**：单位主动风险产生的超额收益

**算法**：(策略年化收益 - 基准年化收益) ÷ 策略与基准的差异波动

python

```python
(annual_return - benchmark_annual_return) / tracking_error
```

**实现逻辑**：

1、计算策略与基准的日收益差异
2、计算这些差异的波动程度
3、年化收益差除以波动程度

**参数说明**：

无

<a id="_18-平均持仓时长-average-holding-period"></a>

### 18\. 平均持仓时长 (Average Holding Period)

**定义**：所有交易持仓时间的平均值

**算法**：总持仓天数 ÷ 交易次数

python

```python
sum(holding_periods) / total_trades
```

**实现逻辑**：

1、计算每笔交易的持仓天数（清仓日 - 首次建仓日）
2、求和所有持仓天数
3、除以总交易次数

**参数说明**：

无
