---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: factor
title: 基础技术指标
section_path:
  - 技术指标接口
  - 基础技术指标
source_file: api-docs/raw/ptrade/shenwan/14_api_factor.html
source_url: http://101.71.132.53:9091/qthelp/api/factor.html
source_anchor: "#基础技术指标"
source_sha256: a1ee86713e832d403472df42a411a26f0bad8433af575c3d690639c09a366656
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="技术指标接口"></a>

# 技术指标接口

<a id="基础技术指标"></a>

## 基础技术指标

<a id="get_MACD"></a>

### `get_MACD`

<a id="中文名"></a>

#### 中文名

异同移动平均线

<a id="接口说明"></a>

#### 接口说明

获取异同移动平均线 MACD 指标的计算结果

<a id="接口定义"></a>

#### 接口定义

python

```python
get_MACD(close, short=12, long=26, m=9)
```

注意事项

该函数仅在回测、交易模块可用

<a id="使用场景"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数"></a>

#### 参数

**`close`**

-   类型： `numpy.ndarray`

价格的时间序列数据

**`short`**

-   类型： `int`
-   默认值： `12`

短周期

**`long`**

-   类型： `int`
-   默认值： `26`

长周期

**`m`**

-   类型： `int`
-   默认值： `9`

移动平均线的周期

<a id="返回值"></a>

#### 返回值

`tuple`:

-   `dif`: MACD 指标 dif 值的时间序列, numpy.ndarray 类型
-   `dea`: MACD 指标 dea 值的时间序列, numpy.ndarray 类型
-   `macd`: MACD 指标 macd 值的时间序列, numpy.ndarray 类型

<a id="示例"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def handle_data(context, data):
    h = get_history(100, '1d', ['close','high','low'], security_list=g.security)
    close_data = h['close'].values
    macdDIF_data, macdDEA_data, macd_data = get_MACD(close_data, 12, 26, 9)
    dif = macdDIF_data[-1]
    dea = macdDEA_data[-1]
    macd = macd_data[-1]
```

<a id="get_KDJ"></a>

### `get_KDJ`

<a id="中文名-1"></a>

#### 中文名

随机指标

<a id="接口说明-1"></a>

#### 接口说明

获取随机指标 KDJ 指标的计算结果

<a id="接口定义-1"></a>

#### 接口定义

python

```python
get_KDJ(high, low, close, n=9, m1=3, m2=3)
```

注意事项

该函数仅在回测、交易模块可用

<a id="使用场景-1"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-1"></a>

#### 参数

**`high`**

-   类型： `numpy.ndarray`

最高价的时间序列数据

**`low`**

-   类型： `numpy.ndarray`

最低价的时间序列数据

**`close`**

-   类型： `numpy.ndarray`

收盘价的时间序列数据

**`n`**

-   类型： `int`
-   默认值： `9`

周期

**`m1`**

-   类型： `int`
-   默认值： `3`

参数 m1

**`m2`**

-   类型： `int`
-   默认值： `3`

参数 m2

<a id="返回值-1"></a>

#### 返回值

`tuple`:

-   `k`: KDJ 指标 k 值的时间序列, numpy.ndarray 类型
-   `d`: KDJ 指标 d 值的时间序列, numpy.ndarray 类型
-   `j`: KDJ 指标 j 值的时间序列, numpy.ndarray 类型

<a id="示例-1"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def handle_data(context, data):
    h = get_history(100, '1d', ['close','high','low'], security_list=g.security)
    high_data = h['high'].values
    low_data = h['low'].values
    close_data = h['close'].values
    k_data, d_data, j_data = get_KDJ(high_data, low_data, close_data, 9, 3, 3)
    k = k_data[-1]
    d = d_data[-1]
    j = j_data[-1]
```

<a id="get_RSI"></a>

### `get_RSI`

<a id="中文名-2"></a>

#### 中文名

相对强弱指标

<a id="接口说明-2"></a>

#### 接口说明

获取相对强弱指标 RSI 指标的计算结果

<a id="接口定义-2"></a>

#### 接口定义

python

```python
get_RSI(close, n=6)
```

注意事项

该函数仅在回测、交易模块可用

<a id="使用场景-2"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-2"></a>

#### 参数

**`close`**

-   类型： `numpy.ndarray`

价格的时间序列数据

**`n`**

-   类型： `int`
-   默认值： `6`

周期

<a id="返回值-2"></a>

#### 返回值

`numpy.ndarray`:

RSI 指标 rsi 值的时间序列

<a id="示例-2"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def handle_data(context, data):
    h = get_history(100, '1d', ['close','high','low'], security_list=g.security)
    close_data = h['close'].values
    rsi_data = get_RSI(close_data, 6)
    rsi = rsi_data[-1]
```

<a id="get_CCI"></a>

### `get_CCI`

<a id="中文名-3"></a>

#### 中文名

顺势指标CCI

<a id="接口说明-3"></a>

#### 接口说明

计算顺势指标CCI，用于判断股票的超买超卖状态和价格趋势的转折点。

<a id="接口定义-3"></a>

#### 接口定义

python

```python
get_CCI(high, low, close, n=14)
```

注意事项

该函数仅在回测、交易模块可用

<a id="使用场景-3"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-3"></a>

#### 参数

**`high`**

-   类型： `numpy.ndarray`

最高价的时间序列数据

**`low`**

-   类型： `numpy.ndarray`

最低价的时间序列数据

**`close`**

-   类型： `numpy.ndarray`

收盘价的时间序列数据

**`n`**

-   类型： `int`
-   默认值： `14`

周期

<a id="返回值-3"></a>

#### 返回值

`numpy.ndarray`:

CCI 指标 cci 值的时间序列

<a id="示例-3"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def handle_data(context, data):
    h = get_history(100, '1d', ['close','high','low'], security_list=g.security)
    high_data = h['high'].values
    low_data = h['low'].values
    close_data = h['close'].values
    cci_data = get_CCI(high_data, low_data, close_data, 14)
    cci = cci_data[-1]
```

<a id="get_MA"></a>

### `get_MA`

<a id="中文名-4"></a>

#### 中文名

简单移动平均线

<a id="接口说明-4"></a>

#### 接口说明

获取简单移动平均线MA指标的计算结果

<a id="接口定义-4"></a>

#### 接口定义

python

```python
get_MA(close, n=14)
```

<a id="使用场景-4"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-4"></a>

#### 参数

**`close`**

-   类型： `numpy.ndarray`

收盘价的时间序列数据

**`n`**

-   类型： `int`
-   默认值： `14`

周期

<a id="返回值-4"></a>

#### 返回值

`numpy.ndarray`:

MA指标MA值的时间序列

<a id="示例-4"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def handle_data(context, data):
    h = get_history(100, '1d', ['close','high','low'], security_list=g.security)
    close_data = h['close'].values
    ma_data = get_MA(close_data, 12)
    ma = ma_data[-1]
```

<a id="get_EMA"></a>

### `get_EMA`

<a id="中文名-5"></a>

#### 中文名

指数移动平均线

<a id="接口说明-5"></a>

#### 接口说明

获取指数异动平均线EMA指标的计算结果

<a id="接口定义-5"></a>

#### 接口定义

python

```python
get_EMA(close, n=12)
```

<a id="使用场景-5"></a>

#### 使用场景

❌研究 ✅回测 ✅交易

<a id="参数-5"></a>

#### 参数

**`close`**

-   类型： `numpy.ndarray`

收盘价的时间序列数据

**`n`**

-   类型： `int`
-   默认值： `12`

周期

<a id="返回值-5"></a>

#### 返回值

`numpy.ndarray`:

EMA指标EMA值的时间序列

<a id="示例-5"></a>

#### 示例

python

```python
def initialize(context):
    g.security = "600570.XSHG"
    set_universe(g.security)

def handle_data(context, data):
    h = get_history(100, '1d', ['close','high','low'], security_list=g.security)
    close_data = h['close'].values
    ema_data = get_EMA(close_data, 12)
    ema = ema_data[-1]
```

* * *

说明

接口支持的业务范围以及支持在引擎的哪些流程函数中调用，详见 [接口列表](http://101.71.132.53:9091/qthelp/api/list.html)
