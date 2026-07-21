---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: api_index
title: 接口列表
section_path:
  - 接口列表
source_file: api-docs/raw/ptrade/shenwan/06_api_list.html
source_url: http://101.71.132.53:9091/qthelp/api/list.html
source_anchor: "#接口列表"
source_sha256: f24bc11362d09b4453c4354243cdcad04284c9fd3613290589c7ffae75679e84
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="接口列表"></a>

# 接口列表

| 接口名 | 接口说明 | 业务范围 | 支持的引擎流程 |
| --- | --- | --- | --- |
| [set\_universe](api-system-e3a203f0.md#set_universe) | 设置股票池 | ✅沪深北
✅港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_benchmark](api-system-e3a203f0.md#set_benchmark) | 设置基准 | ✅沪深北
✅港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_commission](api-system-e3a203f0.md#set_commission) | 设置佣金费率 | ✅沪深北
❌港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_fixed\_slippage](api-system-e3a203f0.md#set_fixed_slippage) | 设置固定滑点 | ✅沪深北
❌港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_slippage](api-system-e3a203f0.md#set_slippage) | 设置滑点比例 | ✅沪深北
❌港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_volume\_ratio](api-system-e3a203f0.md#set_volume_ratio) | 设置成交比例 | ✅沪深北
❌港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_limit\_mode](api-system-e3a203f0.md#set_limit_mode) | 设置成交数量限制模式 | ✅沪深北
❌港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_yesterday\_position](api-system-e3a203f0.md#set_yesterday_position) | 设置底仓(股票) | ✅沪深北
❌港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_parameters](api-system-e3a203f0.md#set_parameters) | 设置策略配置参数 | ✅全部 | [initialize](help-engine-192b4919.md#initialize)
[before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [set\_email\_info](api-system-e3a203f0.md#set_email_info) | 设置邮件信息 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [run\_daily](api-system-392b21bd.md#run_daily) | 按日周期处理 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [run\_interval](api-system-392b21bd.md#run_interval) | 按设定周期处理 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [log](api-system-74e7aaca.md#log) | 日志记录 | ✅全部 | [initialize](help-engine-192b4919.md#initialize)
[before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [is\_trade](api-system-74e7aaca.md#is_trade) | 业务代码场景判断 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [check\_limit](http://101.71.132.53:9091/qthelp/api/system.html#check_limit) | 代码涨跌停状态判断 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [send\_email](api-system-74e7aaca.md#send_email) | 发送邮箱信息 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [send\_qywx](api-system-74e7aaca.md#send_qywx) | 发送企业微信信息 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [permission\_test](api-system-74e7aaca.md#permission_test) | 权限校验 | ✅全部 | [initialize](help-engine-192b4919.md#initialize)
[before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [create\_dir](api-system-74e7aaca.md#create_dir) | 创建文件路径 | ✅全部 | [initialize](help-engine-192b4919.md#initialize)
[before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_frequency](api-system-74e7aaca.md#get_frequency) | 获取当前业务代码的周期 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [get\_business\_type](api-system-74e7aaca.md#get_business_type) | 获取当前策略的业务类型 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [get\_current\_kline\_count](api-system-74e7aaca.md#get_current_kline_count) | 获取股票业务当前时间的分钟bar数量 | ✅沪深北
❌港股通
✅股债基 | [handle\_data](help-engine-192b4919.md#handle_data) |
| [filter\_stock\_by\_status](api-system-74e7aaca.md#filter_stock_by_status) | 过滤指定状态的股票代码 | ✅沪深北
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start) |
| [check\_strategy](api-system-74e7aaca.md#check_strategy) | 检查策略内容 | ✅全部 |  |
| [get\_research\_path](api-system-74e7aaca.md#get_research_path) | 获取研究路径 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [get\_trades\_file](api-system-74e7aaca.md#get_trades_file) | 获取对账数据文件 | ✅沪深
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_trade\_name](api-system-74e7aaca.md#get_trade_name) | 获取交易名称 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [convert\_position\_from\_csv](api-system-74e7aaca.md#convert_position_from_csv) | 获取设置底仓的参数列表(股票) | ✅沪深北
❌港股通
✅股债基 | [initialize](help-engine-192b4919.md#initialize) |
| [get\_history](api-data-550d561d.md#get_history) | 获取历史行情数据 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_price](api-data-550d561d.md#get_price) | 获取历史数据 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_individual\_entrust](api-data-550d561d.md#get_individual_entrust) | 获取逐笔委托行情 | ✅沪深
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_individual\_transaction](api-data-550d561d.md#get_individual_transaction) | 获取逐笔成交行情 | ✅沪深
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_tick\_direction](api-data-550d561d.md#get_tick_direction) | 获取分时成交行情 | ✅沪深
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_sort\_msg](api-data-550d561d.md#get_sort_msg) | 获取板块、行业的快照信息 | ✅板块
✅行业 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_gear\_price](api-data-550d561d.md#get_gear_price) | 获取指定代码的档位行情价格 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_snapshot](api-data-550d561d.md#get_snapshot) | 取行情快照 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_trend\_data](api-data-550d561d.md#get_trend_data) | 获取集中竞价期间代码数据 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_fundamentals](api-data-3929251f.md#get_fundamentals) | 获取财务数据 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_trading\_day](api-data-44c9a18f.md#get_trading_day) | 获取交易日期 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data) |
| [get\_all\_trades\_days](api-data-44c9a18f.md#get_all_trades_days) | 获取全部交易日期 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data) |
| [get\_trade\_days](api-data-44c9a18f.md#get_trade_days) | 获取指定范围交易日期 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data) |
| [get\_trading\_day\_by\_date](api-data-44c9a18f.md#get_trading_day_by_date) | 按日期获取指定交易日 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data) |
| [get\_market\_list](api-data-776ee715.md#get_market_list) | 获取市场列表 | ✅沪深
❌港股通
✅中证指数
✅沪深板块 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_market\_detail](api-data-776ee715.md#get_market_detail) | 获取市场详细信息 | ✅沪深
❌港股通
✅中证指数
✅沪深板块 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_stock\_name](api-data-776ee715.md#get_stock_name) | 获取证券名称 | ✅股票
✅可转债
✅ETF
✅港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_stock\_info](api-data-776ee715.md#get_stock_info) | 获取证券基础信息 | ✅股票
✅可转债
✅ETF
❌港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_stock\_status](api-data-776ee715.md#get_stock_status) | 获取证券状态信息 | ✅股票
✅可转债
✅ETF | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_underlying\_code](api-data-776ee715.md#get_underlying_code) | 获取证券的关联代码 | ✅沪深
❌港股通
✅股票 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_stock\_exrights](api-data-776ee715.md#get_stock_exrights) | 获取证券除权除息信息 | ✅沪深
❌港股通
✅股票 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_stock\_blocks](api-data-776ee715.md#get_stock_blocks) | 获取证券所属板块信息 | ✅沪深
❌港股通
✅股票 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_index\_stocks](api-data-776ee715.md#get_index_stocks) | 获取指数成分股 | ✅指数 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_industry\_stocks](api-data-776ee715.md#get_industry_stocks) | 获取行业成份股 | ✅股票
❌港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_Ashares](api-data-776ee715.md#get_Ashares) | 获取指定日期A股代码列表 | ✅股票
❌港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_cb\_list](api-data-776ee715.md#get_cb_list) | 获取可转债市场代码表 | ✅可转债 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_cb\_info](api-data-776ee715.md#get_cb_info) | 获取可转债基础信息 | ✅可转债 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_reits\_list](api-data-776ee715.md#get_reits_list) | 获取基础设施公募REITs基金代码列表 | ✅沪深
❌港股通
✅公募REITs基金 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_block\_info](api-data-776ee715.md#get_block_info) | 获取板块数据 | ✅板块 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_dominant\_contract](api-data-776ee715.md#get_dominant_contract) | 获取主力合约代码 | ✅期货 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_user\_name](api-trade-ddb81b32.md#get_user_name) | 获取登录终端的资金账号 | ✅全部 | [initialize](help-engine-192b4919.md#initialize) |
| [fund\_transfer](api-trade-ddb81b32.md#fund_transfer) | 资金调拨 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [market\_fund\_transfer](api-trade-ddb81b32.md#market_fund_transfer) | 市场间资金调拨 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [order\_tick](api-trade-74a4b542.md#order_tick) | tick行情触发买卖 | ✅沪深北
❌港股通
✅股债基 | [tick\_data](help-engine-192b4919.md#tick_data) |
| [cancel\_order](api-trade-74a4b542.md#cancel_order) | 撤单 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [cancel\_order\_ex](api-trade-74a4b542.md#cancel_order_ex) | 撤单 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [debt\_to\_stock\_order](api-trade-74a4b542.md#debt_to_stock_order) | 债转股委托 | ✅可转债 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_order](api-trade-247439a3.md#get_order) | 获取指定订单 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_orders](api-trade-247439a3.md#get_orders) | 获取全部订单 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_all\_orders](api-trade-247439a3.md#get_all_orders) | 获取账户当日全部订单 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_open\_orders](api-trade-247439a3.md#get_open_orders) | 获取未完成订单 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_trades](api-trade-247439a3.md#get_trades) | 获取当日成交订单 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_position](api-trade-247439a3.md#get_position) | 获取单只标的持仓信息 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_positions](api-trade-247439a3.md#get_positions) | 获取多只标的持仓信息 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_all\_positions](api-trade-247439a3.md#get_all_positions) | 获取全部持仓信息 | ✅沪深北
✅港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_deliver](api-trade-247439a3.md#get_deliver) | 获取历史交割单信息 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_fundjour](api-trade-247439a3.md#get_fundjour) | 获取历史资金流水信息 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_lucky\_info](api-trade-247439a3.md#get_lucky_info) | 获取历史中签信息 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [order](api-stock-291dd586.md#order) | 指定委托数量买卖 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [order\_target](api-stock-291dd586.md#order_target) | 指定目标数量买卖 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [order\_value](api-stock-291dd586.md#order_value) | 指定目标价值买卖 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [order\_target\_value](api-stock-291dd586.md#order_target_value) | 指定持仓市值买卖 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [order\_market](api-stock-291dd586.md#order_market) | 按市价进行委托 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [after\_trading\_order](api-stock-291dd586.md#after_trading_order) | 盘后固定价委托(股票) | ✅沪深北
❌港股通
✅股票 | [handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [after\_trading\_cancel\_order](api-stock-291dd586.md#after_trading_cancel_order) | 盘后固定价委托撤单(股票) | ✅沪深北
❌港股通
✅股票 | [handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [etf\_basket\_order](api-stock-291dd586.md#etf_basket_order) | ETF成分券篮子下单 | ✅ETF | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [etf\_purchase\_redemption](api-stock-291dd586.md#etf_purchase_redemption) | ETF基金申赎接口 | ✅ETF | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [monetary\_fund\_purchase\_redemption](api-stock-291dd586.md#monetary_fund_purchase_redemption) | 货币基金申赎接口 | ✅货币基金 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [ipo\_stocks\_order](api-stock-291dd586.md#ipo_stocks_order) | 新股/新债一键申购 | ✅沪深
❌港股通
✅股债 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [neeq\_ipo\_stocks\_order](api-stock-291dd586.md#neeq_ipo_stocks_order) | 北交所新股申购 | ✅北交所
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_etf\_info](api-stock-19b8a1f5.md#get_etf_info) | 获取ETF信息 | ✅ETF | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_etf\_list](api-stock-19b8a1f5.md#get_etf_list) | 获取ETF代码 | ✅ETF | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_etf\_stock\_list](api-stock-19b8a1f5.md#get_etf_stock_list) | 获取ETF成分券列表 | ✅ETF | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_etf\_stock\_info](api-stock-19b8a1f5.md#get_etf_stock_info) | 获取ETF成分券信息 | ✅ETF | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_ipo\_stocks](api-stock-19b8a1f5.md#get_ipo_stocks) | 获取当日IPO申购标的 | ✅沪深北
❌港股通
✅股债基 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [margin\_trade](api-credit-0e338551.md#margin_trade) | 担保品买卖 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [margincash\_open](api-credit-0e338551.md#margincash_open) | 融资买入 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [margincash\_close](api-credit-0e338551.md#margincash_close) | 卖券还款 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [margincash\_direct\_refund](api-credit-0e338551.md#margincash_direct_refund) | 直接还款 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [marginsec\_open](api-credit-0e338551.md#marginsec_open) | 融券卖出 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [marginsec\_close](api-credit-0e338551.md#marginsec_close) | 买券还券 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [marginsec\_direct\_refund](api-credit-0e338551.md#marginsec_direct_refund) | 直接还券 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_margincash\_stocks](api-credit-7fbe2e74.md#get_margincash_stocks) | 获取融资标的列表 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_marginsec\_stocks](api-credit-7fbe2e74.md#get_marginsec_stocks) | 获取融券标的列表 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_margin\_contract](api-credit-7fbe2e74.md#get_margin_contract) | 合约查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_margin\_contractreal](api-credit-7fbe2e74.md#get_margin_contractreal) | 实时合约流水查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_margin\_asset](api-credit-7fbe2e74.md#get_margin_asset) | 信用资产查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_assure\_security\_list](api-credit-7fbe2e74.md#get_assure_security_list) | 担保券查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_margincash\_open\_amount](api-credit-7fbe2e74.md#get_margincash_open_amount) | 融资标的最大可买数量查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_margincash\_close\_amount](api-credit-7fbe2e74.md#get_margincash_close_amount) | 卖券还款标的最大可卖数量查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_marginsec\_open\_amount](api-credit-7fbe2e74.md#get_marginsec_open_amount) | 融券标的最大可卖数量查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_marginsec\_close\_amount](api-credit-7fbe2e74.md#get_marginsec_close_amount) | 买券还券标的最大可买数量查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_margin\_entrans\_amount](api-credit-7fbe2e74.md#get_margin_entrans_amount) | 现券还券数量查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_enslo\_security\_info](api-credit-7fbe2e74.md#get_enslo_security_info) | 融券信息查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_crdt\_fund](api-credit-7fbe2e74.md#get_crdt_fund) | 可融资金信息查询 | ✅沪深北
❌港股通
✅融资融券 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [buy\_open](api-future-3ec5570e.md#buy_open) | 多开 | ✅期货 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [sell\_close](api-future-3ec5570e.md#sell_close) | 多平 | ✅期货 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [sell\_open](api-future-3ec5570e.md#sell_open) | 空开 | ✅期货 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [buy\_close](api-future-3ec5570e.md#buy_close) | 空平 | ✅期货 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_margin\_rate](api-future-c200885c.md#get_margin_rate) | 获取用户设置的保证金比例 | ✅期货 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_instruments](api-future-c200885c.md#get_instruments) | 获取合约信息 | ✅期货 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [set\_future\_commission](api-future-54017819.md#set_future_commission) | 设置期货手续费 | ✅期货 | [initialize](help-engine-192b4919.md#initialize) |
| [set\_margin\_rate](api-future-54017819.md#set_margin_rate) | 设置期货保证金比例 | ✅期货 | [initialize](help-engine-192b4919.md#initialize) |
| [get\_hks\_list](api-hks-2c30a76b.md#get_hks_list) | 获取港股通代码表 | ✅港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_hks\_price\_gap](api-hks-2c30a76b.md#get_hks_price_gap) | 获取港股通价差信息 | ✅港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_hks\_unit\_amount](api-hks-2c30a76b.md#get_hks_unit_amount) | 获取港股通委托单位数量 | ✅港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [get\_hks\_enable\_amount](api-hks-2c30a76b.md#get_hks_enable_amount) | 获取港股通大约可买数量 | ✅港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end) |
| [hks\_order](api-hks-3ac32bbb.md#hks_order) | 港股通委托 | ✅港股通 | [handle\_data](help-engine-192b4919.md#handle_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [hks\_cancel\_order](api-hks-3ac32bbb.md#hks_cancel_order) | 港股通撤单 | ✅港股通 | [handle\_data](help-engine-192b4919.md#handle_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_kline\_by\_range](api-hks-2c30a76b.md#get_kline_by_range) | 按时间范围获取港股通的K线数据 | ✅港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_kline\_by\_offset](api-hks-2c30a76b.md#get_kline_by_offset) | 按根数偏移获取港股通的K线数据 | ✅港股通 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_MACD](http://101.71.132.53:9091/qthelp/api/future.html#get_MACD) | 异同移动平均线 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_KDJ](http://101.71.132.53:9091/qthelp/api/future.html#get_KDJ) | 随机指标 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_RSI](http://101.71.132.53:9091/qthelp/api/future.html#get_RSI) | 相对强弱指标 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_CCI](http://101.71.132.53:9091/qthelp/api/future.html#get_CCI) | 顺势指标 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_EMA](http://101.71.132.53:9091/qthelp/api/future.html#get_EMA) | 指数移动平均线 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
| [get\_MA](http://101.71.132.53:9091/qthelp/api/future.html#get_MA) | 简单移动平均线 | ✅全部 | [before\_trading\_start](help-engine-192b4919.md#before_trading_start)
[handle\_data](help-engine-192b4919.md#handle_data)
[after\_trading\_end](help-engine-192b4919.md#after_trading_end)
[tick\_data](help-engine-192b4919.md#tick_data)
[on\_order\_response](help-engine-192b4919.md#on_order_response)
[on\_trade\_response](help-engine-192b4919.md#on_trade_response) |
