---
platform: qmt
variant: builtin-python
source_role: primary
document_type: strategy_api
title: 2. 使用须知
section_path:
  - 迅投知识库 - 内置Python API文档全集
  - 2. 使用须知
source_file: api-docs/raw/qmt/innerapi-combined.html
source_url: file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html
source_anchor: "#doc-user_attention"
source_sha256: 08ffb4fd69f4e96745a5d83d27b6716c0682a20496b6664df00cc79c55670f28
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

# 2\. 使用须知

<a id="user_attention--安装路径的选择"></a>

## 安装路径的选择

在安装 QMT 软件时，**请不要安装在C盘，以避免因权限问题导致的使用问题**

若是只能安装到C盘，请在启动时选择`以管理员权限启动`

<a id="user_attention--下载python库"></a>

## 下载python库

初次使用 QMT 时，请确保补全所需的 Python 库。安装完毕后，不要忘记重启客户端。

提示

在盘中，下载速度会很慢，建议盘前或盘后更新。

![下载python库](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E4%B8%8B%E8%BD%BDpython%E5%BA%93-521fbb73.png)

<a id="user_attention--关于contextinfo"></a>

## 关于ContextInfo

由于底层机制的限制，`ContextInfo`中存储的变量值将会回滚，即在对`ContextInfo`中的变量进行修改之后，在下一次`handlebar`调用时，这些修改将不会保留。具体细节请参阅[常见问题在新窗口打开](builtin-python--doc-question-answer.md#question_answer--系统对象-contextinfo-逐-k-线保存的机制)。因此，在完全理解`ContextInfo`机制之前，请避免在其中存储任何变量。

<a id="user_attention--推荐用法"></a>

### 推荐用法

```python
class G(): pass

g = G()

def init(ContextInfo):
    g.stock_list = ['000001.SZ']

def handlebar(ContextInfo):
    g.stock_list.append('600000.SH')

```

<a id="user_attention--错误用法"></a>

### 错误用法

警告

下面的示例请勿使用

```python
def init(ContextInfo):
    ContextInfo.stock_list = ['000001.SZ']

def handlebar(ContextInfo):
    ContextInfo.stock_list.append('600000.SH')

```

<a id="user_attention--关于线程和进程"></a>

## 关于线程和进程

QMT中，python**无法**使用多线程和多进程，而且**所有策略都在同一线程中执行**，所以策略中应该尽量避免阻塞类的写法，否则会影响其他策略的执行。

<a id="user_attention--主图解析"></a>

## **主图**解析

如下图所示，策略执行依赖于K线图。这里所说的主图即是K线图，策略正是在K线图上运行，也是由它驱动的（也有非K线驱动的策略写法，详见快速入门）。

**K线回放**：策略在客户端运行时会从第一根K线开始，依次调用`handlebar`函数，直至最后一根K线。并且在盘中，每一个新的行情快照都会触发一次`handlebar`函数调用（无论主图的周期如何）。如果想要过滤掉某些K线，可以设置右侧的快速计算，或使用`ContextInfo. is_last_bar ()`函数进行过滤。

![Alt text](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_K%E7%BA%BF%E5%9B%9E%E6%94%BE-f0f166ba.png)

<a id="user_attention--策略运行无反应-运行报错提示-run-script-failed"></a>

## 策略运行无反应/运行报错提示 "run script failed! "

最快解决方法是点击右上角**布局**按钮，选择**恢复默认布局**

如果策略运行后无任何反应，首先检查客户端是否有其他策略正在运行，如果有，请先将其停止，然后重试。检查方法如下图所示：

![Alt text](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E5%81%9C%E6%AD%A2%E7%AD%96%E7%95%A51-660e5a2b.png)

![Alt text](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E5%81%9C%E6%AD%A2%E7%AD%96%E7%95%A52-c93e6732.png)

![Alt text](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E5%81%9C%E6%AD%A2%E7%AD%96%E7%95%A53-2ebf0e22.png)

![Alt text](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E5%81%9C%E6%AD%A2%E7%AD%96%E7%95%A54-dfca1cc1.png)

提示

最后建议重启客户端

<a id="user_attention--数据下载"></a>

## 数据下载

QMT提供了许多接口来依赖数据下载功能。客户端的数据下载功能如下图所示：

![Alt text](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E6%95%B0%E6%8D%AE%E4%B8%8B%E8%BD%BD1-bd7db774.png) 而且，在批量下载中可以设置定时下载，这样可以方便地每天自动下载当日的行情数据。 ![Alt text](https://dict.thinktrader.net/assets/%E5%86%85%E7%BD%AEAPI_%E5%AE%9A%E6%97%B6%E4%B8%8B%E8%BD%BD-034ff844.png)
