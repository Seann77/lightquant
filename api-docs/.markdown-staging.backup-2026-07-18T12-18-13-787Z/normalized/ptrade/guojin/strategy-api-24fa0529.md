---
platform: ptrade
variant: guojin
source_role: primary
document_type: strategy_api
title: 公共资源
section_path:
  - 帮助
  - 公共资源
source_file: api-docs/raw/ptrade/guojin/ptradeapi.html
source_url: file:///Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本/ptradeapi.html
source_anchor: "#公共资源"
source_sha256: 1c0efbee00c9b6cca4195e5cff528980f4c7a6daeac9ed214157d3f196f53881
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="公共资源"></a>

## 公共资源

<a id="对象"></a>

### 对象

<a id="g"></a>

#### g - 全局对象

##### 使用场景

该对象仅支持回测、交易模块。

##### 对象说明

全局对象g，用于存储用户的各类可被不同函数(包括自定义函数)调用的全局数据,如：

```python
g.security = None #股票池
```

注意事项：

无

##### 示例

```python
def initialize(context):
    g.security = "600570.SS"
    g.count = 1
    g.flag = 0
    set_universe(g.security)

def handle_data(context, data):
    log.info(g.security)
    log.info(g.count)
    log.info(g.flag)
```

<a id="Context"></a>

#### Context - 上下文对象

##### 使用场景

该对象仅支持回测、交易模块。

##### 对象说明

类型为业务上下文对象

注意事项：

1.  对象内的portfolio数据更新周期详见[Portfolio对象](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#Portfolio)对象注意事项说明。

##### 内容

```python
capital_base -- 起始资金
previous_date -- 前一个交易日
sim_params -- SimulationParameters对象
    capital_base -- 起始资金
    data_frequency -- 数据频率
portfolio -- 账户信息，可参考Portfolio对象
initialized -- 是否执行初始化
slippage -- 滑点，VolumeShareSlippage对象
    volume_limit -- 成交限量
    price_impact -- 价格影响力
commission -- 佣金费用，Commission对象
    tax—印花税费率
    cost—佣金费率
    min_trade_cost—最小佣金
blotter -- Blotter对象(记录)
    current_dt -- 当前单位时间的开始时间，datetime.datetime对象(北京时间)
recorded_vars -- 收益曲线值
```

##### 示例

```python
def initialize(context):
    g.security = ['600570.SS', '000001.SZ']
    set_universe(g.security)

def handle_data(context, data):
    # 获得当前回测相关时间
    pre_date = context.previous_date
    log.info(pre_date)
    year = context.blotter.current_dt.year
    log.info(year)
    month = context.blotter.current_dt.month
    log.info(month)
    day = context.blotter.current_dt.day
    log.info(day)
    hour = context.blotter.current_dt.hour
    log.info(hour)
    minute = context.blotter.current_dt.minute
    log.info(minute)
    second = context.blotter.current_dt.second
    log.info(second)
    # 获取"年-月-日"格式
    date = context.blotter.current_dt.strftime("%Y-%m-%d")
    log.info(date)
    # 获取周几
    weekday = context.blotter.current_dt.isoweekday()
    log.info(weekday)
```

<a id="BarData"></a>

#### BarData - K线数据对象

##### 使用场景

该对象仅支持回测、交易模块。

##### 对象说明

一个单位时间内代码的K线数据，是一个类对象。

注意事项：

1.  preclose、high\_limit、low\_limit、unlimited在分钟频率中均填充为0.0。
2.  当前周期内首次调用会在线获取该代码K线数据，当前周期重复调用时将会返回首次调用缓存的该代码K线数据。

##### 基本属性

以下属性也能通过[get\_history()](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#get_history)/[get\_price()](http://180.169.107.9:7766/hub/help/api?weworkcfmcode#get_price)获取到

```python
symbol 标的代码
name 代码名称
dt 当前周期时间
is_open 停牌标志，0-停牌，1-非停牌
open 当前周期开盘价
close 当前周期收盘价
price 当前周期最新价
low 当前周期最低价
high 当前周期最高价
volume 当前周期成交量
money 当前周期成交额
preclose 昨收盘价(仅日线返回)
high_limit 涨停价(仅日线返回)
low_limit 跌停价(仅日线返回)
unlimited 是否无涨跌停限制(仅日线返回)
datetime 当前周期时间
```

##### 示例

```python
def initialize(context):
    g.security = "600570.SS"
    set_universe(g.security)


def before_trading_start(context, data):
    g.flag = False


def handle_data(context, data):
    if not g.flag:
        # 打印代码BarData对象
        log.info(data[g.security])
        # 打印标的代码
        log.info(data[g.security].symbol)
        # 打印代码名称
        log.info(data[g.security].name)
        # 打印当前周期时间
        log.info(data[g.security].dt)
        # 打印当前周期是否开盘
        log.info(data[g.security].is_open)
        # 打印当前周期开盘价
        log.info(data[g.security].open)
        # 打印当前周期收盘价
        log.info(data[g.security].close)
        # 打印当前周期最新价
        log.info(data[g.security].price)
        # 打印当前周期最低价
        log.info(data[g.security].low)
        # 打印当前周期最高价
        log.info(data[g.security].high)
        # 打印当前周期成交量
        log.info(data[g.security].volume)
        # 打印当前周期成交额
        log.info(data[g.security].money)
        # 打印昨收盘价(仅日线返回)
        log.info(data[g.security].preclose)
        # 打印涨停价(仅日线返回)
        log.info(data[g.security].high_limit)
        # 打印跌停价(仅日线返回)
        log.info(data[g.security].low_limit)
        # 打印是否无涨跌停限制(仅日线返回)
        log.info(data[g.security].unlimited)
        # 打印当前周期时间
        log.info(data[g.security].datetime)
        g.flag = True
```

<a id="Portfolio"></a>

#### Portfolio - 资产对象

##### 使用场景

该对象仅支持回测、交易模块。

##### 对象说明

对象数据包含账户当前的资金，标的信息，即所有标的操作仓位的信息汇总

注意事项：

1.  交易中对象内的数据更新周期默认为6s(具体配置需咨询所在券商)，即上一次账户资金、委托、持仓查询并更新到对象中后，间隔6s发起下一次查询。数据更新时间范围为before\_trading\_start-after\_trading\_end。

##### 内容

```python
股票账户返回
     cash 当前可用资金(不包含冻结资金)
     positions 当前持有的标的(包含不可卖出的标的)，dict类型，key是标的代码，value是Position对象
     portfolio_value 当前持有的标的和现金的总价值
     positions_value 持仓价值
     capital_used 已使用的现金
     returns 当前的收益比例, 相对于初始资金
     pnl 当前账户总资产-初始账户总资产
     start_date 开始时间
```

```
期货账户返回：
     cash 当前可用资金(不包含冻结资金)
     positions 当前持有的标的(包含不可卖出的标的)，dict类型，key是标的代码，value是Position对象
     portfolio_value 当前持有的保证金和现金的总价值
     positions_value 持仓价值
     returns 当前的收益比例, 相对于初始资金
     pnl 当前账户总资产-初始账户总资产
     start_date 开始时间
     margin 保证金
```

```
期权账户返回：
     cash 当前可用资金(不包含冻结资金)
     positions 当前持有的标的(包含不可卖出的标的)，dict类型，key是标的代码，value是Position对象
     portfolio_value 当前持有的标的和现金的总价值
     positions_value 持仓价值
     returns 当前的收益比例, 相对于初始资金
     pnl 当前账户总资产-初始账户总资产
     margin 保证金
     risk_degree 风险度
     start_date 开始时间
```

```
港股通账户返回：
     cash 当前可用资金(不包含冻结资金)
     positions 当前持有的标的(包含不可卖出的标的)，dict类型，key是标的代码，value是Position对象
     portfolio_value 当前持有的标的和现金的总价值
     hks_positions_value 港股通标的持仓价值
     positions_value 持仓价值
     returns 当前的收益比例, 相对于初始资金
     pnl 当前账户总资产-初始账户总资产
     start_date 开始时间
```

##### 示例

```python
def initialize(context):
    g.security = "600570.SS"
    set_universe([g.security])

def handle_data(context, data):
    log.info(context.portfolio.portfolio_value)
```

<a id="Position"></a>

#### Position - 持仓对象

##### 使用场景

该对象仅支持回测、交易模块。

##### 对象说明

持有的某个标的的信息。

注意事项：

1.  期货业务持仓把单个合约的持仓分为了多头仓(long)、空头仓(short)。
2.  期权业务持仓把单个合约的持仓分为了权利仓(long)、义务仓(short)、备兑仓(covered)，备兑仓虽然也是空开的业务类型，但为了区分备兑业务类型，所以没有和义务仓合并。
3.  交易中对象内的数据更新周期默认为6s(具体配置需咨询所在券商)，即上一次账户资金、委托、持仓查询并更新到对象中后，间隔6s发起下一次查询。数据更新时间范围为before\_trading\_start-after\_trading\_end。
4.  交易场景下，持仓信息是每6秒与柜台同步后更新的，update\_time字段记录了最近的更新时间，格式为："%Y-%m-%d %H:%M:%S"。回测场景返回None。

##### 内容

```python
股票账户返回
     sid 标的代码
     enable_amount 可用数量
     amount 总持仓数量
     last_sale_price 最新价格
     cost_basis 持仓成本价格
     today_amount 今日开仓数量
     business_type 持仓类型
     update_time 持仓更新时间
```

```
期货账户返回：
     sid 标的代码
     short_enable_amount 空头仓可用数量
     long_enable_amount 多头仓可用数量
     today_short_amount 空头仓今仓数量
     today_long_amount 多头仓今仓数量
     long_cost_basis 多头仓持仓成本
     short_cost_basis 空头仓持仓成本
     long_amount 多头仓总持仓量
     short_amount 空头仓总持仓量
     long_pnl 多头仓浮动盈亏
     short_pnl 空头仓浮动盈亏
     amount 总持仓数量
     enable_amount 可用数量
     last_sale_price 最新价格
     business_type 持仓类型
     delivery_date 交割日，期货使用
     margin 持仓保证金
     contract_multiplier 合约乘数
     update_time 持仓更新时间
```

```
期权账户返回：
     sid 标的代码
     short_enable_amount 义务仓可用数量
     long_enable_amount 权利仓可用数量
     covered_enable_amount 备兑仓可用数量
     short_cost_basis 义务仓持仓成本
     long_cost_basis 权利仓持仓成本
     covered_cost_basis 备兑仓持仓成本
     short_amount 义务仓总持仓量
     long_amount 权利仓总持仓量
     covered_amount 备兑仓总持仓量
     short_pnl 义务仓浮动盈亏
     long_pnl 权利仓浮动盈亏
     covered_pnl 备兑仓浮动盈亏
     last_sale_price 最新价格
     margin 保证金
     exercise_date 行权日，期权使用
     business_type 持仓类型
     update_time 持仓更新时间
```

##### 示例

```python
def initialize(context):
    g.security = '600570.SS'
    set_universe(g.security)

def handle_data(context, data):
    order(g.security,1000)
    position = get_position(g.security)
    log.info(position)
```

<a id="Order"></a>

#### Order - 委托对象

##### 使用场景

该对象仅支持回测、交易模块。

##### 对象说明

买卖订单信息

注意事项：

1.  回测中entrust\_no、cancel\_entrust\_no字段值为None。
2.  交易中对象内的数据更新分为两种同时进行：1.数据周期默认为6s(具体配置需咨询所在券商)，即上一次账户资金、委托、持仓查询并更新到对象中后，间隔6s发起下一次查询。数据更新时间范围为before\_trading\_start-after\_trading\_end。2.后台接收到主推数据时会更新对象内成交数量、委托状态、持仓成本价等信息。
3.  交易中对原委托进行撤单时，cancel\_entrust\_no字段值填充撤单委托编号。
4.  交易中期货(对接UFT柜台)对原委托进行撤单时，撤单委托编号等于原委托编号。

##### 内容

```python
股票账户返回
    id -- 订单号
    dt -- 订单产生时间，datetime.datetime类型
    limit -- 指定价格
    symbol -- 标的代码(备注：标的代码尾缀为四位，上证为XSHG，深圳为XSHE，如需对应到代码请做代码尾缀兼容)
    amount -- 下单数量，买入是正数，卖出是负数
    created -- 订单生成时间，datetime.datetime类型
    filled -- 成交数量，买入时为正数，卖出时为负数
    entrust_no -- 委托编号
    cancel_entrust_no -- 撤单委托编号
    priceGear -- 盘口档位
    status -- 委托状态
```

```
期货账户返回：
    id -- 订单号
    dt -- 订单产生时间，datetime.datetime类型
    limit -- 指定价格
    symbol -- 标的代码
    amount -- 下单数量，正数
    created -- 订单生成时间，datetime.datetime类型
    side -- 多空仓标志(str类型，long：多头仓，short：空头仓)
    action -- 开平仓方向(str类型，open：开仓，close：平仓)
    entrust_direction -- 买卖方向(str类型，buy：买入，sell：卖出)
    filled -- 成交数量，正数
    entrust_no -- 委托编号
    cancel_entrust_no -- 撤单委托编号
    priceGear -- 盘口档位
    status -- 委托状态
```

```python
期权账户返回：
    id -- 订单号
    dt -- 订单产生时间，datetime.datetime类型
    limit -- 指定价格
    symbol -- 标的代码
    amount -- 下单数量，正数
    created -- 订单生成时间，datetime.datetime类型
    position_type -- 目标仓位类型(str类型，long：多头仓，short：空头仓，covered：备兑仓)
    action -- 开平仓方向(str类型，open：开仓，close：平仓)
    entrust_direction -- 买卖方向(str类型，buy：买入，sell：卖出)
    filled -- 成交数量，正数
    entrust_no -- 委托编号
    cancel_entrust_no -- 撤单委托编号
    priceGear -- 盘口档位
    status -- 委托状态
```

##### 示例

```python
def initialize(context):
    g.security = "600570.SS"
    set_universe(g.security)

def handle_data(context, data):
    order(g.security, 100)
    log.info(get_orders())
```

<a id="数据字典"></a>

### 数据字典

<a id="委托状态"></a>

#### status -- 委托状态

-   "0" -- 未报
-   "1" -- 待报
-   "2" -- 已报
-   "3" -- 已报待撤
-   "4" -- 部成待撤
-   "5" -- 部撤
-   "6" -- 已撤
-   "7" -- 部成
-   "8" -- 已成
-   "9" -- 废单
-   "+" -- 已受理
-   "-" -- 已确认
-   "C" -- 正报
-   "V" -- 已确认

<a id="委托类别"></a>

#### entrust\_type -- 委托类别

-   "0" -- 委托
-   "2" -- 撤单
-   "4" -- 确认
-   "6" -- 信用融资
-   "7" -- 信用融券
-   "9" -- 信用交易

<a id="委托属性"></a>

#### entrust\_prop -- 委托属性

-   "0" -- 买卖
-   "1" -- 配股
-   "3" -- 申购
-   "4" -- 回购
-   "7" -- 转股
-   "9" -- 股息
-   "N" -- ETF申赎
-   "Q" -- 对手方最优价格
-   "R" -- 最优五档即时成交剩余转限价
-   "S" -- 本方最优价格
-   "T" -- 即时成交剩余撤销
-   "U" -- 最优五档即时成交剩余撤销
-   "V" -- 全成交或撤销
-   "b" -- 定价委托
-   "c" -- 确认委托
-   "d" -- 限价委托
-   "HKN" -- 港股订单申报
-   "HKO" -- 零股订单申报

<a id="成交方向"></a>

#### business\_direction -- 成交方向

-   0 -- 卖
-   1 -- 买
-   2 -- 借入
-   3 -- 出借

<a id="委托类型"></a>

#### trans\_kind -- 委托类型

##### 深圳市场

-   1 -- 市价委托
-   2 -- 限价委托
-   3 -- 本方最优

##### 上海市场

-   4 -- 增加订单
-   5 -- 删除订单

<a id="交易状态"></a>

#### trade\_status -- 交易状态

-   "START" -- 市场启动(初始化之后，集合竞价前)
-   "PRETR" -- 盘前
-   "OCALL" -- 开始集合竞价
-   "TRADE" -- 交易(连续撮合)
-   "HALT" -- 暂停交易
-   "SUSP" -- 停盘
-   "BREAK" -- 休市
-   "POSTR" -- 盘后
-   "ENDTR" -- 交易结束
-   "STOPT" -- 长期停盘，停盘n天，n>=1
-   "DELISTED" -- 退市
-   "POSMT" -- 盘后交易
-   "PCALL" -- 盘后集合竞价
-   "INIT" -- 盘后固定价格启动前
-   "ENDPT" -- 盘后固定价格闭市阶段
-   "POSSP " -- 盘后固定价格停牌

<a id="成交标记"></a>

#### trans\_flag -- 成交标记

-   0 -- 普通成交
-   1 -- 撤单成交

<a id="盘后逐笔成交序号标识"></a>

#### trans\_identify\_am -- 盘后逐笔成交序号标识

-   0 -- 盘中
-   1 -- 盘后

<a id="委托方向"></a>

#### entrust\_bs -- 委托方向

-   "1" -- 买
-   "2" -- 卖

<a id="现金替代标志"></a>

#### cash\_replace\_flag -- 现金替代标志

-   "0" -- 禁止替代
-   "1" -- 允许替代
-   "2" -- 必须替代
-   "3" -- 非沪市退补现金替代
-   "4" -- 非沪市必须现金替代
-   "5" -- 非沪深退补现金替代
-   "6" -- 非沪深必须现金替代

<a id="交易类别"></a>

#### exchange\_type/futu\_exch\_type -- 交易类别

-   "0" -- 资金
-   "1" -- 上海
-   "2" -- 深圳
-   "9" -- 特转A
-   "A" -- 特转B
-   "D" -- 沪Ｂ
-   "G" -- 沪港通
-   "H" -- 深Ｂ
-   "Q" -- 青岛产权
-   "S" -- 深港通
-   "T" -- 场外OTC市场
-   "U" -- 转融通
-   "J" -- 金华基金
-   "K" -- 香港市场
-   "X" -- 固定收益
-   "F1" -- 郑州交易所
-   "F2" -- 大连交易所
-   "F3" -- 上海交易所
-   "F4" -- 金融交易所
-   "F5" -- 能源交易所
-   "Z1" -- 业务受理
-   "R" -- H股全流通

<a id="退市标志"></a>

#### delist\_flag -- 退市标志

-   "0" -- 正常
-   "1" -- 退市

<a id="投机/套保类型"></a>

#### hedge\_type -- 投机/套保类型

-   "0" -- 投机
-   "1" -- 套保
-   "2" -- 套利
-   "3" -- 做市商
-   "4" -- 备兑

<a id="期权持仓类别"></a>

#### opthold\_type -- 期权持仓类别

-   "0" -- 权利方
-   "1" -- 义务方
-   "2" -- 备兑方

<a id="期权属性"></a>

#### option\_type -- 期权属性

-   "C" -- 看涨期权
-   "P" -- 看跌期权

<a id="市价委托类型"></a>

#### market\_type -- 市价委托类型

-   0 -- 对手方最优价格
-   1 -- 最优五档即时成交剩余转限价
-   2 -- 本方最优价格
-   3 -- 即时成交剩余撤销
-   4 -- 最优五档即时成交剩余撤销
-   5 -- 全额成交或撤单

<a id="申购代码所属市场"></a>

#### submarket\_type -- 申购代码所属市场

-   0 -- 上证普通代码
-   1 -- 上证科创板代码
-   2 -- 深证普通代码
-   3 -- 深证创业板代码
-   4 -- 可转债代码

<a id="两融头寸性质"></a>

#### cash\_group -- 两融头寸性质

-   0 -- 核心头寸
-   1 -- 普通业务头寸
-   2 -- 专项业务头寸

<a id="合约类别"></a>

#### compact\_type -- 合约类别

-   "0" -- 融资
-   "1" -- 融券
-   "2" -- 其他负债

<a id="合约状态"></a>

#### compact\_status -- 合约状态

-   "0" -- 开仓未归还
-   "1" -- 部分归还
-   "2" -- 合约已过期
-   "3" -- 客户自行归还
-   "4" -- 手工了结
-   "5" -- 未形成负债

<a id="关联类型"></a>

#### underlying\_type -- 关联类型

-   0 -- A股
-   1 -- B股
-   2 -- H股
-   3 -- 期货
-   4 -- 期权
-   5 -- 港股-认购
-   6 -- 港股-认沽
-   7 -- 港股-牛证
-   8 -- 港股-熊证
-   9 -- 港股-界内证
-   10 -- 英股关联关系
-   11 -- 美股关联代码
-   12 -- 股本认股权证认购证
-   13 -- 股本认股权证认沽证
-   14 -- 可转债关联关系正向-正股关联可转债
-   15 -- 可转债关联关系反向-可转债关联正股

<a id="成交类型"></a>

#### real\_type -- 成交类型

-   "0" -- 买卖
-   "1" -- 查询
-   "2" -- 撤单
-   "6" -- 融资
-   "7" -- 融券
-   "8" -- 平仓
-   "9" -- 信用
-   "G" -- 期权强制平仓

<a id="成交状态"></a>

#### real\_status -- 成交状态

-   "0" -- 成交
-   "2" -- 废单
-   "4" -- 确认
