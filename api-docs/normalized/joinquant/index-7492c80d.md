---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 沪深指数列表
section_path:
  - 指数数据
  - 沪深指数列表
source_file: api-docs/raw/joinquant/index/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=index
source_anchor: "#沪深指数列表"
source_sha256: 7bdf516b7d02046cc65a12d7e0e74923d589f3aa325fd1be1c7adf90fbd19fb8
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="沪深指数列表"></a>

## 沪深指数列表

我们支持交易所披露的指数数据，包括指数的行情数据以及成分股数据。为了避免未来函数，我们支持获取历史任意时刻的指数成分股信息。
温馨提示：

-   由于不断会有新的指数被创建，文档无法及时更新，建议直接使用get\_all\_securities获取所有指数列表
-   指数相关问题如创业板成交量请查看[数据常见问题](https://www.joinquant.com/view/community/detail/1226a48b1f9b7bd90dc3516feea8b5cc?type=2)行情部分
-   **因部分中证指数不再由交易所披露行情，部分指数自2020-04-22停止更新，详情见[更新日志](https://www.joinquant.com/view/community/detail/26929)**

```python
df = get_all_securities("index",'2023-06-21')  #获取截至2023-06-21还未退市的指数 
df = get_all_securities("index")  #获取所有支持的指数
df[df.display_name.str.contains("全指")] #获取名称中含"全指"的指数
df[df.index.str.contains("000905")]  # 获取000905指数的信息
```
