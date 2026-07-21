---
platform: qmt
variant: builtin-python
source_role: primary
document_type: strategy_api
title: 8. 绘图函数
section_path:
  - 迅投知识库 - 内置Python API文档全集
  - 8. 绘图函数
source_file: api-docs/raw/qmt/innerapi-combined.html
source_url: file:///Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html
source_anchor: "#doc-drawing_function"
source_sha256: 08ffb4fd69f4e96745a5d83d27b6716c0682a20496b6664df00cc79c55670f28
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="doc-drawing_function"></a>

# 8\. 绘图函数

<a id="drawing_function--contextinfo-paint-在界面上画图"></a>

## ContextInfo.paint - 在界面上画图

在界面上画图

**调用方法：** ContextInfo.paint(name, value, index, line\_style, color = 'white', limit = '')

**参数：**

| 参数名 | 类型 | 说明 | 提示 |
| --- | --- | --- | --- |
| `name` | `string` | 需显示的指标名 |  |
| `value` | `number` | 需显示的数值 |  |
| `index` | `number` | 显示索引位置 | 填 -1 表示按主图索引显示 |
| `line_style` | `number` | 线型 | 0：曲线
42：柱状线 |
| `color` | `string` | 颜色（不填默认为白色） | blue：蓝色
brown：棕
cyan：蓝绿
green：绿
magenta：品红
red：红
white：白
yellow：黄 |
| `limit` | `string` | 画线控制 | 'noaxis'：不影响坐标画线
'nodraw'：不画线 |

\*\*返回：\*\*无

**示例：**

```python
def init(ContextInfo):
    realtimetag = ContextInfo.get_bar_timetag(ContextInfo.barpos)
    value = ContextInfo.get_close_price('', '', realtimetag) 
    ContextInfo.paint('close', value, -1, 0, 'white','noaxis')
```

<a id="drawing_function--contextinfo-draw-text-在图形上显示文字"></a>

## ContextInfo.draw\_text - 在图形上显示文字

在图形上显示数字   **调用方法：** `ContextInfo.draw_text(condition, position, text)`

**参数：**

| 参数名 | 类型 | 说明 | 提示 |
| --- | --- | --- | --- |
| `condition` | `bool` | 条件 |  |
| `Position` | `number` | 文字显示的位置 |  |
| `text` | `string` | 文字 |  |

\*\*返回值：\*\*无

**示例：**

```text
def init(ContextInfo):
    ContextInfo.draw_text(1, 10, '文字')
```

<a id="drawing_function--contextinfo-draw-number-在图形上显示数字"></a>

## ContextInfo.draw\_number - 在图形上显示数字

在图形上显示数字

**调用方法：** `ContextInfo.draw_number(cond, height, number, precision)`

**参数：**

| 参数名 | 类型 | 说明 | 提示 |
| --- | --- | --- | --- |
| `cond` | `bool` | 条件 |  |
| `height` | `number` | 显示文字的高度位置 |  |
| `text` | `string` | 显示的数字 |  |
| `precision` | `number` | 为小数显示位数 | 取值范围 0 - 7 |

\*\*返回值：\*\*无

**示例：**

```text
def init(ContextInfo):
    close = ContextInfo.get_market_data(['close'])   
    ContextInfo.draw_number(1 > 0, close, 66, 1)
```

<a id="drawing_function--contextinfo-draw-vertline-在数字-1-和数字-2-之间绘垂直线"></a>

## ContextInfo.draw\_vertline - 在数字 1 和数字 2 之间绘垂直线

在数字1和数字2之间绘垂直线

**调用方法：** `ContextInfo.draw_vertline(cond, number1, number2, color = '', limit = '')`

**参数：**

| 参数名 | 类型 | 说明 | 提示 |
| --- | --- | --- | --- |
| `cond` | `bool` | 条件 |  |
| `number1` | `number` | 数字1 |  |
| `number2` | `number` | 数字2 |  |
| `color` | `string` | 颜色（不填默认为白色） | blue：蓝色
brown：棕
cyan：蓝绿
green：绿
magenta：品红
red：红
white：白
yellow：黄 |
| `limit` | `string` | 画线控制 | 'noaxis'：不影响坐标画线
'nodraw'：不画线 |

**返回：** 无

**示例：**

```text
def init(ContextInfo):
    close = ContextInfo.get_market_data(['close'])
    open = ContextInfo.get_market_data(['open'])
    ContextInfo.draw_vertline(1 > 0, close, open, 'cyan')
```

<a id="drawing_function--contextinfo-draw-icon-在图形上绘制小图标"></a>

## ContextInfo.draw\_icon - 在图形上绘制小图标

在图形上绘制小图标

**调用方法：** `ContextInfo.draw_icon(cond, height, type)`

**参数：**

| 参数名 | 类型 | 说明 | 提示 |
| --- | --- | --- | --- |
| `cond` | `bool` | 条件 |  |
| `height` | `number` | 图标的位置 |  |
| `text` | `number` | 图标的类型 | 1：椭圆
0：矩形 |

\*\*返回值：\*\*无

**示例：**

```text
def init(ContextInfo):
    close = ContextInfo.get_market_data(['close'])
    ContextInfo.draw_icon(1 > 0, close, 0)
```
