---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 策略运行周期
section_path:
  - 使用说明
  - 策略运行周期
source_file: api-docs/raw/ptrade/shenwan/01_help_introduce.html
source_url: http://101.71.132.53:9091/qthelp/help/introduce.html
source_anchor: "#策略运行周期"
source_sha256: 356095f47ce5f98e11cc2e88f15ef01a8b068ffa52efda3008b23481f30dd1e3
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="策略运行周期"></a>

## 策略运行周期

回测支持日线级别、分钟级别运行，详见[handle\_data](help-engine-192b4919.md#handle_data)方法。

交易支持日线级别、分钟级别、tick 级别运行，日线级别和分钟级别详见[handle\_data](help-engine-192b4919.md#handle_data)方法，tick 级别运行详见[run\_interval](api-system-392b21bd.md#run_interval)和[tick\_data](help-engine-192b4919.md#tick_data)方法。

频率：日线级别

当选择日线频率时，回测和交易都是每天运行一次，运行时间详见[handle\_data](help-engine-192b4919.md#handle_data)方法。

频率：分钟级别

当选择分钟频率时，回测和交易都是每分钟运行一次，运行时间为每根分钟 K 线结束。

频率：tick 级别

当选择 tick 频率时，交易最小频率可以达到 3 秒运行一次。
