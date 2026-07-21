---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: faq
title: 关于委托
section_path:
  - 常见问题
  - 关于委托
source_file: api-docs/raw/ptrade/shenwan/16_qa.html
source_url: http://101.71.132.53:9091/qthelp/qa.html
source_anchor: "#关于委托"
source_sha256: d46c7a244c291a3cfc214fdb12b3679c57001f91ee0f1d7efd879f3879a89980
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="关于委托"></a>

## 关于委托

<a id="实时行情获取失败导致委托失败"></a>

### 实时行情获取失败导致委托失败

限价委托接口包括order、order\_target、order\_value、order\_target\_value，如果不入参限价字段limit\_price，引擎会默认以将行情最新价报单要，碰到行情异常快照数据推送为空的时候，下单会失败形成废单，日志中会有提醒，可以通过废单逻辑判断来进行二次委托。

<a id="委托数量校验"></a>

### 委托数量校验

委托接口有委托数量校验，如果数量不是整数，会下单失败返回None。

<a id="集合竞价下单"></a>

### 集合竞价下单

已支持，参考集合竞价demo。

<a id="委托状态如何监控"></a>

### 委托状态如何监控

get\_orders接口可以获取当日本策略的所有订单信息（6秒同步更新），交易模块还可调用on\_trade\_response接口获取成交回报主推。

<a id="手动委托单策略中能否撤单"></a>

### 手动委托单策略中能否撤单

通过get\_all\_orders接口获取账户当日全部订单，再结合cancel\_order\_ex撤单接口，可以对手动委托单进行撤单。
