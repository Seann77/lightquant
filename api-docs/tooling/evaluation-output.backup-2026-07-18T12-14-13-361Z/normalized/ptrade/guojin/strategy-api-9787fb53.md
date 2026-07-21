---
platform: ptrade
variant: guojin
source_role: primary
document_type: strategy_api
title: 开始写策略
section_path:
  - 帮助
  - 开始写策略
source_file: api-docs/raw/ptrade/guojin/ptradeapi.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/ptradeapi.html
source_anchor: "#开始写策略"
source_sha256: 1c0efbee00c9b6cca4195e5cff528980f4c7a6daeac9ed214157d3f196f53881
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="开始写策略"></a>

## 开始写策略

<a id="简单但是完整的策略"></a>

### 简单但是完整的策略

先来看一个简单但是完整的策略:

```python
def initialize(context):
    set_universe('600570.SS')

def handle_data(context, data):
    pass
```

一个完整策略只需要两步:

1.  set\_universe: 设置股票池，上面的例子中，只操作一支股票: '600570.SS'，恒生电子。所有的操作只能对股票池的标的进行。
2.  实现一个函数: handle\_data。

这是一个完整的策略，但是我们没有任何交易，下面我们来添加一些交易

<a id="添加一些交易"></a>

### 添加一些交易

```python
def initialize(context):
    g.security = '600570.SS'
    # 是否创建订单标识
    g.flag = False
    set_universe(g.security)

def handle_data(context, data):
    if not g.flag:
        order(g.security, 1000)
        g.flag = True
```

在这个策略里，当创建订单标识为False，也即尚未创建过订单时，买入1000股'600570.SS'，具体的下单API请看[order](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#order)函数。这里我们进行了交易，但只是没有经过条件判断的委托下达。

<a id="实用的策略"></a>

### 实用的策略

下面我们来看一个真正实用的策略

在这个策略里，我们会根据历史价格做出判断:

-   如果上一时间点价格高出五天平均价1%，则全仓买入
-   如果上一时间点价格低于五天平均价，则清仓卖出

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    security = g.security
    sid = g.security

    # 获取过去五天的历史价格
    df = get_history(5, '1d', 'close', security, fq=None, include=False)

    # 获取过去五天的平均价格
    average_price = round(df['close'][-5:].mean(), 3)

    # 获取上一时间点价格
    current_price = data[sid]['close']

    # 获取当前的现金
    cash = context.portfolio.cash

    # 如果上一时间点价格高出五天平均价1%, 则全仓买入
    if current_price > 1.01*average_price:
        # 用所有 cash 买入股票
        order_value(g.security, cash)
        log.info('buy %s' % g.security)
    # 如果上一时间点价格低于五天平均价, 则清仓卖出
    elif current_price < average_price and get_position(security).amount > 0:
        # 卖出所有股票,使这只股票的最终持有量为0
        order_target(g.security, 0)
        log.info('sell %s' % g.security)
```

<a id="模拟盘和实盘注意事项"></a>

### 模拟盘和实盘注意事项

<a id="关于持久化"></a>

#### 关于持久化

##### 为什么要做持久化处理

服务器异常、策略优化等诸多场景，都会使得正在进行的模拟盘和实盘策略存在中断后再重启的需求，但是一旦交易中止后，策略中存储在内存中的全局变量就清空了，因此通过持久化处理为量化交易保驾护航必不可少。

##### 量化框架持久化处理

使用pickle模块保存股票池、账户信息、订单信息、全局变量g定义的变量等内容。

注意事项：

1.  框架会在[before\_trading\_start(隔日开始)](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#before_trading_start)、[handle\_data](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#handle_data)、[after\_trading\_end](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#after_trading_end)事件后触发持久化信息更新及保存操作。
2.  券商升级/环境重启后恢复交易时，框架会先执行策略[initialize](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#initialize)函数再执行持久化信息恢复操作。 如果持久化信息保存有策略定义的全局对象g中的变量，将会以持久化信息中的变量覆盖掉[initialize](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#initialize)函数中初始化的该变量。
3.  全局变量g中不能被序列化的变量将不会被保存。您可在[initialize](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#initialize)中初始化该变量时名字以'\_\_'开头。
4.  涉及到IO(打开的文件，实例化的类对象等)的对象是不能被序列化的。
5.  全局变量g中以'\_\_'开头的变量为私有变量，持久化时将不会被保存。

###### 示例

```python
class Test(object):
    count = 5

    def print_info(self):
        self.count += 1
        log.info("a" * self.count)


def initialize(context):
    g.security = "600570.SS"
    set_universe(g.security)
    # 初始化无法被序列化类对象，并赋值为私有变量，落地持久化信息时跳过保存该变量
    g.__test_class = Test()

def handle_data(context, data):
    # 调用私有变量中定义的方法
    g.__test_class.print_info()
```

##### 策略中持久化处理方法

使用pickle模块保存 g 对象(全局变量)。

###### 示例

```python
import pickle
from collections import defaultdict
'''
持仓N日后卖出，仓龄变量每日pickle进行保存，重启策略后可以保证逻辑连贯
'''
def initialize(context):
    g.notebook_path = get_research_path()
    #尝试启动pickle文件
    try:
        with open(g.notebook_path+'hold_days.pkl','rb') as f:
            g.hold_days = pickle.load(f)
    #定义空的全局字典变量
    except:
        g.hold_days = defaultdict(list)
    g.security = '600570.SS'
    set_universe(g.security)

# 仓龄增加一天
def before_trading_start(context, data):
    if g.hold_days:
        g.hold_days[g.security] += 1

# 每天将存储仓龄的字典对象进行pickle保存
def handle_data(context, data):
    if g.security not in list(context.portfolio.positions.keys()) and g.security not in g.hold_days:
        order(g.security, 100)
        g.hold_days[g.security] = 1
    if g.hold_days:
        if g.hold_days[g.security] > 5:
            order(g.security, -100)
            del g.hold_days[g.security]
    with open(g.notebook_path+'hold_days.pkl','wb') as f:
        pickle.dump(g.hold_days,f,-1)
```

<a id="策略中支持的代码尾缀"></a>

### 策略中支持的代码尾缀

<table><tbody><tr><td>市场品种</td><td>尾缀全称</td><td>尾缀简称</td></tr><tr><td>上海市场证券</td><td>XSHG</td><td>SS</td></tr><tr><td>深圳市场证券</td><td>XSHE</td><td>SZ</td></tr><tr><td>指数</td><td>XBHS</td><td></td></tr><tr><td>中金所期货</td><td>CCFX</td><td></td></tr><tr><td>上海股票期权</td><td>XSHO</td><td></td></tr><tr><td>深圳股票期权</td><td>XSZO</td><td></td></tr><tr><td>上海港股通</td><td>XHKG-SS</td><td></td></tr><tr><td>深圳港股通</td><td>XHKG-SZ</td><td></td></tr></tbody></table>

<a id="关于异常处理"></a>

### 关于异常处理

##### 为什么要做异常处理

交易场景数据缺失等原因会导致策略运行过程中常规的处理出现语法错误，导致策略终止，所以需要做一些异常处理的保护。以下是一些基本的处理方法介绍。

###### 示例

```python
try:
    # 尝试执行的代码
    print(a)
except:
    # 如果在try块执行异常
    # 则执行except块代码
    a = 1
    print(a)
```

```python
try:
    # 尝试执行的代码
    print(a)
except Exception as e:
    # 使用as关键字可以获取异常的实例
    print("出现异常，error为: %s" % e)
    a = 1
    print(a)
```

```python
try:
    a = 1
    print(a)
except:
    print(a)
else:
    # 如果try块成功执行，没有引发异常，可以选择性地添加一个else块。
    print('执行正常')
```

```python
try:
    a = 1
    print(a)
except:
    print(a)
finally:
    # 无论是否发生异常，finally块中的代码都将被执行。这可以用来执行一些清理工作，比如关闭文件或释放资源。
    print('执行完毕')
```

<a id="关于限价交易的价格"></a>

### 关于限价交易的价格

可转债、ETF、LOF的价格是小数点三位。

股票的价格是小数点两位。

股指期货的价格是小数点一位。

ETF期权的价格是小数点四位。

用户在使用限价单委托（如order()入参limit\_price）和市价委托保护限价（order\_market()入参limit\_price）的场景时务必要对入参价格的小数点位数进行处理，否则会导致委托失败。
