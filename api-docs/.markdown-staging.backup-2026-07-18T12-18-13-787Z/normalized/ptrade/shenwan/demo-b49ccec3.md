---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 股票策略示例
section_path:
  - 策略示例
  - 股票策略示例
source_file: api-docs/raw/ptrade/shenwan/15_demo.html
source_url: http://101.71.132.53:9091/qthelp/demo.html
source_anchor: "#股票策略示例"
source_sha256: e5555ae450159230a5e920be0cb13580799ffea4732524f8bb790f4cd0f82aff
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="策略示例"></a>

# 策略示例

<a id="股票策略示例"></a>

## 股票策略示例

<a id="集合竞价追涨停策略"></a>

### 集合竞价追涨停策略

设置股票池，每天9:23分运行集合竞价处理函数：如果最新价不小于涨停价则买入。

python

```python
def initialize(context):
    # 初始化此策略
    # 设置我们要操作的股票池, 这里我们只操作一支股票
    g.security = '600570.XSHG'
    set_universe(g.security)
    #每天9:23分运行集合竞价处理函数
    run_daily(context, aggregate_auction_func, time='9:23')

def aggregate_auction_func(context):
    stock = g.security
    #最新价
    snapshot = get_snapshot(stock)
    price = snapshot[stock]['last_px']
    #涨停价
    up_limit = snapshot[stock]['up_px']
    #如果最新价不小于涨停价，买入
    if float(price) >= float(up_limit):
        order(g.security, 100, limit_price=up_limit)

def handle_data(context, data):
    pass
```

<a id="tick-级别均线策略"></a>

### tick 级别均线策略

设置股票池，盘前准备历史数据，每3秒钟触发一次：首先用最新的tick行情数据计算五日均线和十日均线，然后进行比较：当五日均线高于十日均线时买入，当五日均线低于十日均线时卖出。

python

```python
def initialize(context):
    # 初始化此策略
    # 设置我们要操作的股票池, 这里我们只操作一支股票
    g.security = '600570.XSHG'
    set_universe(g.security)
    #每3秒运行一次主函数
    run_interval(context, func, seconds=3)

#盘前准备历史数据
def before_trading_start(context, data):
    history = get_history(10, '1d', 'close', g.security, fq='pre', include=False)
    g.close_array = history['close'].values

#当五日均线高于十日均线时买入，当五日均线低于十日均线时卖出
def func(context):

    stock = g.security

    #获取最新价
    snapshot = get_snapshot(stock)
    price = snapshot[stock]['last_px']

    # 得到五日均线价格
    days = 5
    ma5 = get_MA_day(stock, days, g.close_array[-4:], price)
    # 得到十日均线价格
    days = 10
    ma10 = get_MA_day(stock, days, g.close_array[-9:], price)

    # 得到当前资金余额
    cash = context.portfolio.cash

    # 如果当前有余额，并且五日均线大于十日均线
    if ma5 > ma10:
        # 用所有 cash 买入股票
        order_value(stock, cash)
        # 记录这次买入
        log.info("Buying %s" % (stock))

    # 如果五日均线小于十日均线，并且目前有头寸
    elif ma5 < ma10 and get_position(stock).amount > 0:
        # 全部卖出
        order_target(stock, 0)
        # 记录这次卖出
        log.info("Selling %s" % (stock))

#计算实时均线函数
def get_MA_day(stock,days,close_array,current_price):
    close_sum = close_array[-(days-1):].sum()
    MA = (current_price + close_sum)/days
    return MA

def handle_data(context, data):
    pass
```

<a id="双均线策略"></a>

### 双均线策略

设置股票池，每个handle\_data周期进行如下判断处理：当五日均线高于十日均线时买入，当五日均线低于十日均线时卖出。

python

```python
def initialize(context):
    # 初始化此策略
    # 设置我们要操作的股票池, 这里我们只操作一支股票
    g.security = '600570.XSHG'
    set_universe(g.security)

#当五日均线高于十日均线时买入，当五日均线低于十日均线时卖出
def handle_data(context, data):
    security = g.security

    #得到十日历史价格
    df = get_history(10, '1d', 'close', security, fq=None, include=False)

    # 得到五日均线价格
    ma5 = round(df['close'][-5:].mean(), 3)

    # 得到十日均线价格
    ma10 = round(df['close'][-10:].mean(), 3)

    # 取得昨天收盘价
    price = data[security]['close']

    # 得到当前资金余额
    cash = context.portfolio.cash

    # 如果当前有余额，并且五日均线大于十日均线
    if ma5 > ma10:
        # 用所有 cash 买入股票
        order_value(security, cash)
        # 记录这次买入
        log.info("Buying %s" % (security))

    # 如果五日均线小于十日均线，并且目前有头寸
    elif ma5 < ma10 and get_position(security).amount > 0:
        # 全部卖出
        order_target(security, 0)
        # 记录这次卖出
        log.info("Selling %s" % (security))
```

<a id="macd-策略"></a>

### macd 策略

用历史日K线数据计算MACD指标，以计算结果进行买入卖出交易。

python

```python
def initialize(context):
    g.hold_num = 10

def before_trading_start(context, data):
    # 获取沪深300股票
    g.security_list = get_index_stocks('000300.XSHG')
    g.close_data_dict = {}
    # 获取K线数据
    history = get_history(100, frequency='1d', field=["close"], security_list=g.security_list, fq='dypre',
                             include=False, is_dict=True)
    for stock in g.security_list:
        close_data = history[stock]['close']
        g.close_data_dict[stock] = close_data
    g.every_value = context.portfolio.portfolio_value/g.hold_num

def handle_data(context, data):

    for security in g.security_list:
        close_data = g.close_data_dict[security]
        macdDIF_data, macdDEA_data, macd_data = get_MACD(close_data, 12, 26, 9)
        DIF = macdDIF_data[-1]
        DEA = macdDEA_data[-1]
        macd_current = macd_data[-1]
        macd_pre = macd_data[-2]

        # 获取当前价格
        current_price = data[security].price
        # 获取当前的现金
        position = context.portfolio.positions
        # DIF、DEA均为正，macd金叉，买入信号参考
        if position[security].amount == 0:
            if DIF > 0 and DEA > 0 and macd_pre < 0 and macd_current >= 0:
                if context.portfolio.cash < g.every_value*0.8:
                    continue

                # 以市单价买入股票，日回测时即是开盘价
                order_target_value(security, g.every_value)
                # 记录这次买入
                log.info("Buying %s" % (security))
        else:
            # DIF、DEA均为负，macd死叉，卖出信号参考
            if DIF < 0 and DEA < 0 and macd_pre >= 0 and macd_current < 0:
                # 卖出所有股票,使这只股票的最终持有量为0
                order_target(security, 0)
                # 记录这次卖出
                log.info("Selling %s" % (security))
```
