---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 策略运行时间
section_path:
  - 使用说明
  - 策略运行时间
source_file: api-docs/raw/ptrade/shenwan/01_help_introduce.html
source_url: http://101.71.132.53:9091/qthelp/help/introduce.html
source_anchor: "#策略运行时间"
source_sha256: 356095f47ce5f98e11cc2e88f15ef01a8b068ffa52efda3008b23481f30dd1e3
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="策略运行时间"></a>

## 策略运行时间

盘前运行:

9:30 分钟之前为盘前运行时间，交易环境支持运行在[run\_daily](api-system-392b21bd.md#run_daily)中指定交易时间(如 time='09:15')运行的函数；回测环境和交易环境支持运行[before\_trading\_start](help-engine-192b4919.md#before_trading_start)函数

盘中运行:

9:31(股票回测)/9:30(股票交易)~15:00(股票回测)/14:59(股票交易)、9:30(港股通交易)~16:09(港股通交易)分为盘中运行时间，分钟级别回测环境和交易环境支持运行在[run\_daily](api-system-392b21bd.md#run_daily)中指定交易时间(如 time='14:30')运行的函数；回测环境和交易环境支持运行[handle\_data](help-engine-192b4919.md#handle_data)函数；交易环境支持运行[run\_interval](api-system-392b21bd.md#run_interval)函数

盘后运行:

15:30(股票)/16:30(港股通)分为盘后运行时间，回测环境和交易环境支持运行[after\_trading\_end](help-engine-192b4919.md#after_trading_end)函数(该函数为定时运行)；15:00(股票)/16:10(港股通)之后交易环境支持运行在[run\_daily](api-system-392b21bd.md#run_daily)中指定交易时间(如 time='15:10')运行的函数，
