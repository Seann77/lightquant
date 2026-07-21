---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: faq
title: 关于模拟交易
section_path:
  - 常见问题
  - 关于模拟交易
source_file: api-docs/raw/ptrade/shenwan/16_qa.html
source_url: http://101.71.132.53:9091/qthelp/qa.html
source_anchor: "#关于模拟交易"
source_sha256: d46c7a244c291a3cfc214fdb12b3679c57001f91ee0f1d7efd879f3879a89980
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="关于模拟交易"></a>

## 关于模拟交易

<a id="模拟交易个数"></a>

### 模拟交易个数

默认允许同时运行5个交易，具体以券商配置为准。

<a id="交易过程可以客户端离线吗"></a>

### 交易过程可以客户端离线吗

交易在服务器上运行，因此客户端关闭或掉线并不影响策略运行。

<a id="不同交易的账户管理"></a>

### 不同交易的账户管理

所有运行的模拟交易或实盘交易都共享一个账户（资金、持仓无法隔离），暂不支持子账户交易系统。

<a id="交易开启的时间"></a>

### 交易开启的时间

交易在任何时间都可以开启，开启后会立刻运行initialize和before\_trading\_start（如果策略中定义的话），要注意的是：开盘前开启交易，before\_trading\_start肯定会先于handle\_data开启；但开盘期间开启交易，before\_trading\_start和handle\_data可能会同时运行，策略逻辑防止混乱。

<a id="策略中模块的运行顺序"></a>

### 策略中模块的运行顺序

交易中before\_trading\_start、handle\_data、tick\_data、run\_interval都是独立的线程，当交易开启之后，每个线程都会启动，理论上没有先后顺序关系。因此建议在策略中设置强制顺序的控制系统，比如运行完before\_trading\_start后打开handle\_data的运行开关，运行完handle\_data后打开tick\_data或者run\_interval的运行开关。

<a id="重启功能"></a>

### 重启功能

重启功能和新建交易本质上是一样的，会重新创建交易id，原策略中的内存变量如果不做保存会清除。

<a id="回测与交易代码兼容"></a>

### 回测与交易代码兼容

由于交易中支持tick数据以及市价单下单，因此大多数情况下回测和交易在代码设计上会有不同。为了减少代码维护的难度，PTrade量化提供了is\_trade接口。通过该接口，用户可以在一套代码中兼容回测和交易两种逻辑。

<a id="关于模拟交易的稳定性"></a>

### 关于模拟交易的稳定性

常见的影响交易稳定性的因素来自以下几方面：

1、历史行情K线数据服务器更新异常。这种情况往往可以通过比较入参的K线数量、实际返回数据框的长度、时间戳index去重后的返回数据框的长度来做判断（看三者是否保持一致）。

2、实时行情数据获取失败。实时行情源的推送并不能保证一直稳定，因此需要做数据保护：比如

```python
def initialize(context):
    # 初始化此策略
    # 设置我们要操作的股票池, 这里我们只操作一支股票
    g.security = ['600570.XSHG','600571.XSHG']
    set_universe(g.security)
    #每3秒运行一次主函数
    run_interval(context, func, seconds=3)

def func(context):
    for stock in g.security:
        #获取最新价
        snapshot = get_snapshot(stock)
        # 非空判断
        if snapshot[stock]:
            # 字段数据做保护
            price = snapshot[stock].get('last_px', 0)
            if price == 0:
                log.info((stock,'该股在本tick行情数据异常，不进行判断'))
                continue
            order(stock, 100, limit_price=price)

def handle_data(context, data):
    pass
```

3、财务数据获取失败。财务数据接口是在线向数据源调用的接口，瞬时调用量过大或者其他导致网络堵塞的原因都有可能使得获取失败，因此建议加入重连机制做保护（可参考单因子demo）。

4、服务器环境异常。这种情况是用户主观不能控制的，但可以通过持久化处理，让策略在短暂停止后，重新拉起并保持原有的策略逻辑连贯（可参考持久化说明）。

<a id="关于模拟交易的账户数据更新频率"></a>

### 关于模拟交易的账户数据更新频率

模拟交易和实盘交易的账户数据同步理论上是6秒一次，包括资金、持仓、订单状态、撤单状态等。因此用户需要自建一定的中间变量做过渡，防止重复交易或者重复判断。

<a id="tick-data和run-interval的关系"></a>

### tick\_data和run\_interval的关系

tick\_data和run\_interval都可以实现tick级别周期策略，tick\_data固定3秒一个间隔，run\_interval可以随意设置运行间隔时间，最小间隔3秒，数据源也都是行情快照数据，因此可以选择其一进行策略设计。
