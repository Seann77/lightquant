---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 模拟盘和实盘注意事项
section_path:
  - 开始写策略
  - 模拟盘和实盘注意事项
source_file: api-docs/raw/ptrade/shenwan/02_help_quickstart.html
source_url: http://101.71.132.53:9091/qthelp/help/quickstart.html
source_anchor: "#模拟盘和实盘注意事项"
source_sha256: 70a1d286729aeccd616c5423c93600bb9574a7a72b379b9313a5fffdbee5abb7
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="模拟盘和实盘注意事项"></a>

## 模拟盘和实盘注意事项

<a id="关于持久化"></a>

### 关于持久化

<a id="为什么要做持久化处理"></a>

#### 为什么要做持久化处理

服务器异常、策略优化等诸多场景，都会使得正在进行的模拟盘和实盘策略存在中断后再重启的需求，但是一旦交易中止后，策略中存储在内存中的全局变量就清空了，因此通过持久化处理为量化交易保驾护航必不可少。

<a id="量化框架持久化处理"></a>

#### 量化框架持久化处理

使用 pickle 模块保存股票池、账户信息、订单信息、全局变量 g 定义的变量等内容。

注意事项：

1.  框架会在[before\_trading\_start（隔日开始）](help-engine-192b4919.md#before_trading_start)、[handle\_data](help-engine-192b4919.md#handle_data)、[after\_trading\_end](help-engine-192b4919.md#after_trading_end)事件后触发持久化信息更新及保存操作；
2.  券商升级/环境重启后恢复交易时，框架会先执行策略[initialize](help-engine-192b4919.md#initialize)函数再执行持久化信息恢复操作。如果持久化信息保存有策略定义的全局对象 g 中的变量，将会以持久化信息中的变量覆盖掉[initialize](help-engine-192b4919.md#initialize)函数中初始化的该变量。
3.  全局变量 g 中不能被序列化的变量将不会被保存。您可在[initialize](help-engine-192b4919.md#initialize)中初始化该变量时名字以'\_\_'开头；
4.  涉及到 IO(打开的文件，实例化的类对象等)的对象是不能被序列化的；
5.  全局变量 g 中以'\_\_'开头的变量为私有变量，持久化时将不会被保存；

<a id="示例"></a>

#### 示例

python

```python
class Test(object):
    count = 5

    def print_info(self):
        self.count += 1
        log.info("a" * self.count)


def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)
    # 初始化无法被序列化类对象，并赋值为私有变量，落地持久化信息时跳过保存该变量
    g.__test_class = Test()

def handle_data(context, data):
    # 调用私有变量中定义的方法
    g.__test_class.print_info()
```

<a id="策略中持久化处理方法"></a>

#### 策略中持久化处理方法

使用 pickle 模块保存 g 对象(全局变量)。

<a id="示例-1"></a>

#### 示例

python

```python
import pickle
from collections import defaultdict
'''
持仓N日后卖出，仓龄变量每日pickle进行保存，重启策略后可以保证逻辑连贯
'''
def initialize(context):
    #获取研究路径
    g.notebook_path = get_research_path()    
    #尝试启动pickle文件
    try:
        with open(g.notebook_path+'hold_days.pkl','rb') as f:
            g.hold_days = pickle.load(f)
    #定义空的全局字典变量
    except:
        g.hold_days = defaultdict(list)
    g.security = '600570.XSHG'
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
