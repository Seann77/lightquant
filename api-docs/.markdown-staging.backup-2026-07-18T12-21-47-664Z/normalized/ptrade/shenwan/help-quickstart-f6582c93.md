---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 简单但是完整的策略
section_path:
  - 开始写策略
  - 简单但是完整的策略
source_file: api-docs/raw/ptrade/shenwan/02_help_quickstart.html
source_url: http://101.71.132.53:9091/qthelp/help/quickstart.html
source_anchor: "#简单但是完整的策略"
source_sha256: 70a1d286729aeccd616c5423c93600bb9574a7a72b379b9313a5fffdbee5abb7
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="开始写策略"></a>

# 开始写策略

<a id="简单但是完整的策略"></a>

## 简单但是完整的策略

先来看一个简单但是完整的策略:

python

```python
def initialize(context):
    set_universe('600570.XSHG')

def handle_data(context, data):
    pass
```

一个完整策略只需要两步:

1.  set\_universe: 设置我们要操作的股票池，上面的例子中，只操作一支股票: '600570.XSHG'，恒生电子。所有的操作只能对股票池的标的进行。
2.  实现一个函数: handle\_data。

这是一个完整的策略，但是我们没有任何交易，下面我们来添加一些交易
