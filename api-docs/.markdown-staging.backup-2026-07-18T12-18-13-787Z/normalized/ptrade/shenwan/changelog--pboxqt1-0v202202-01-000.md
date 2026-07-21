---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PBOXQT1.0V202202.01.000
section_path:
  - 更新日志
  - PBOXQT1.0V202202.01.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#pboxqt1-0v202202-01-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="pboxqt1-0v202202-01-000"></a>

## PBOXQT1.0V202202.01.000

1.  委托流程调整，交易模式中非交易时间段内产生的委托直接发送柜台进行处理；
2.  优化 [tick\_data](help-engine-192b4919.md#tick_data) 触发逻辑：当策略执行时间超过 3s 时，将会丢弃中间堵塞的 tick\_data；在收盘后，将会清空队列中未执行的 tick\_data；
3.  [tick\_data](help-engine-192b4919.md#tick_data) 中参数 data 里的快照数据修改为从 [get\_snapshot()](api-data-550d561d.md#get_snapshot) 中获取，详见注意事项；
4.  修复 [get\_individual\_entrust()](api-data-550d561d.md#get_individual_entrust) 和 [get\_individual\_transaction()](api-data-550d561d.md#get_individual_transaction) 中 stocks 入参代码数量大于 50 只时返回数据缺失问题；
5.  [run\_interval()](api-system-392b21bd.md#run_interval) 和 [run\_daily()](api-system-392b21bd.md#run_daily) 中新增支持 [get\_sort\_msg()](api-data-550d561d.md#get_sort_msg) 调用；
6.  [get\_snapshot()](api-data-550d561d.md#get_snapshot) 新增返回 business\_amount\_in(内盘成交量)、business\_amount\_out(外盘成交量)字段；
7.  交易场景中 [buy\_open()](api-future-3ec5570e.md#buy_open)、[sell\_close()](api-future-3ec5570e.md#sell_close)、[sell\_open()](api-future-3ec5570e.md#sell_open)、[buy\_close()](api-future-3ec5570e.md#buy_close) 新增支持期权业务；
8.  [on\_trade\_response()](help-engine-192b4919.md#on_trade_response) 新增接收撤单的成交主推，详见接口说明注意事项；
9.  [Portfolio](help-engine-19502d4e.md#Portfolio) 账户对象新增支持期权业务，字段详见帮助说明；
10.  [Position](help-engine-19502d4e.md#Position) 持仓对象新增支持期权业务，字段详见帮助说明；
11.  新增 get\_contract\_info() 获取期权合约信息；
12.  新增 get\_opt\_objects() 获取期权标的列表；
13.  新增 get\_opt\_last\_dates() 获取期权标的到期日列表；
14.  新增 get\_opt\_contracts() 获取期权标的对应合约列表；
15.  新增 get\_covered\_lock\_amount() 获取期权标的允许备兑锁定数量；
16.  新增 get\_covered\_unlock\_amount() 获取期权标的允许备兑解锁数量；
17.  新增 option\_covered\_lock() 期权标的备兑锁定；
18.  新增 option\_covered\_unlock() 期权标的备兑解锁；
19.  新增 open\_prepared() 备兑开仓；
20.  新增 close\_prepared() 备兑平仓；
21.  新增 option\_exercise() 行权；
22.  新增 [set\_parameters()](api-system-e3a203f0.md#set_parameters) 设置策略配置参数，支持的参数详见接口说明；
