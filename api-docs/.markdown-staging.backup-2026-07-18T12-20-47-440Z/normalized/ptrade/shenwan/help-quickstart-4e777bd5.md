---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 实用的策略
section_path:
  - 开始写策略
  - 实用的策略
source_file: api-docs/raw/ptrade/shenwan/02_help_quickstart.html
source_url: http://101.71.132.53:9091/qthelp/help/quickstart.html
source_anchor: "#实用的策略"
source_sha256: 70a1d286729aeccd616c5423c93600bb9574a7a72b379b9313a5fffdbee5abb7
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="实用的策略"></a>

## 实用的策略

下面我们来看一个真正实用的策略

在这个策略里，我们会根据历史价格做出判断:

-   如果上一时间点价格高出五天平均价 1%，则全仓买入
-   如果上一时间点价格低于五天平均价，则空仓卖出

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    sid = g.security

    # 取得过去五天的历史价格
    df = get_history(5, '1d', 'close', security, fq=None, include=False)

    # 取得过去五天的平均价格
    average_price = round(df['close'][-5:].mean(), 3)

    # 取得上一时间点价格
    current_price = data[sid]['close']

    # 取得当前的现金
    cash = context.portfolio.cash

    # 如果上一时间点价格高出五天平均价1%, 则全仓买入
    if current_price > 1.01*average_price:
        # 用所有 cash 买入股票
        order_value(g.security, cash)
        log.info('buy %s' % g.security)
    # 如果上一时间点价格低于五天平均价, 则空仓卖出
    elif current_price < average_price and get_position(security).amount > 0:
        # 卖出所有股票,使这只股票的最终持有量为0
        order_target(g.security, 0)
        log.info('sell %s' % g.security)
```
