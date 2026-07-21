---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: guide
title: 关于异常处理
section_path:
  - 开始写策略
  - 关于异常处理
source_file: api-docs/raw/ptrade/shenwan/02_help_quickstart.html
source_url: http://101.71.132.53:9091/qthelp/help/quickstart.html
source_anchor: "#关于异常处理"
source_sha256: 70a1d286729aeccd616c5423c93600bb9574a7a72b379b9313a5fffdbee5abb7
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="关于异常处理"></a>

## 关于异常处理

<a id="为什么要做异常处理"></a>

### 为什么要做异常处理

交易场景数据缺失等原因会导致策略运行过程中常规的处理出现语法错误，导致策略终止，所以需要做一些异常处理的保护。以下是一些基本的处理方法介绍。

<a id="示例-2"></a>

#### 示例

python

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

python

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

python

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

python

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
