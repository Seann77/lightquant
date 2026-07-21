---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 两融策略示例
section_path:
  - 策略示例
  - 两融策略示例
source_file: api-docs/raw/ptrade/shenwan/15_demo.html
source_url: http://101.71.132.53:9091/qthelp/demo.html
source_anchor: "#两融策略示例"
source_sha256: e5555ae450159230a5e920be0cb13580799ffea4732524f8bb790f4cd0f82aff
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="两融策略示例"></a>

## 两融策略示例

<a id="融资融券双均线策略"></a>

### 融资融券双均线策略

设置标的池，每个handle\_data周期进行如下判断处理：当五日均线高于十日均线时买入，当五日均线低于十日均线时卖出。其中买入卖出所调用的API为融资融券业务专用API。

python

```python
def initialize(context):
    # 初始化策略
    # 设置我们要操作的股票池, 这里我们只操作一支股票
    g.security = "600570.XSHG"
    set_universe(g.security)

def before_trading_start(context, data):
    # 买入标识
    g.order_buy_flag = False
    # 卖出标识
    g.order_sell_flag = False

#当五日均线高于十日均线时买入，当五日均线低于十日均线时卖出
def handle_data(context, data):
    # 得到十日历史价格
    df = get_history(10, "1d", "close", g.security, fq=None, include=False)
    # 得到五日均线价格
    ma5 = round(df["close"][-5:].mean(), 3)
    # 得到十日均线价格
    ma10 = round(df["close"][-10:].mean(), 3)
    # 取得昨天收盘价
    price = data[g.security]["close"]
    # 如果五日均线大于十日均线
    if ma5 > ma10:
        if not g.order_buy_flag:
            # 获取最大可融资数量
            amount = get_margincash_open_amount(g.security).get(g.security)
            # 进行融资买入操作
            margincash_open(g.security, amount)
            # 记录这次操作
            log.info("Buying %s Amount %s" % (g.security, amount))
            # 当日已融资买入
            g.order_buy_flag = True

    # 如果五日均线小于十日均线，并且目前有头寸
    elif ma5 < ma10 and get_position(g.security).amount > 0:
        if not g.order_sell_flag:
            # 获取标的卖券还款最大可卖数量
            amount = get_margincash_close_amount(g.security).get(g.security)
            # 进行卖券还款操作
            margincash_close(g.security, -amount)
            # 记录这次操作
            log.info("Selling %s Amount %s" % (g.security, amount))
            # 当日已卖券还款
            g.order_sell_flag = True
```
