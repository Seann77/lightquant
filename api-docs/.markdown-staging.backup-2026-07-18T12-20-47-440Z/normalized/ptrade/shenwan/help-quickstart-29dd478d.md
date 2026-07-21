---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 添加一些交易
section_path:
  - 开始写策略
  - 添加一些交易
source_file: api-docs/raw/ptrade/shenwan/02_help_quickstart.html
source_url: http://101.71.132.53:9091/qthelp/help/quickstart.html
source_anchor: "#添加一些交易"
source_sha256: 70a1d286729aeccd616c5423c93600bb9574a7a72b379b9313a5fffdbee5abb7
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings:
  - source_anchor_not_mapped
canonical: true
alias_of: null
---

<a id="添加一些交易"></a>

## 添加一些交易

python

```python
def initialize(context):
    g.security = '600570.XSHG'
    # 是否创建订单标识
    g.flag = False
    set_universe(g.security)

def handle_data(context, data):
    if not g.flag:
        order(g.security, 1000)
        g.flag = True
```

这个策略里，当我们没有创建订单时就买入 1000 股'600570.XSHG'，具体的下单 API 请看[order](http://101.71.132.53:9091/qthelp/api/system.html#order)函数。这里我们有了交易，但是只是无意义的交易，没有依据当前的数据做出合理的分析。
