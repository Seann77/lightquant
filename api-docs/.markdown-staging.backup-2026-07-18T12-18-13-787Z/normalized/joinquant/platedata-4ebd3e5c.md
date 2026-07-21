---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: market_data
title: 概念类
section_path:
  - 行业概念数据
  - 概念类
source_file: api-docs/raw/joinquant/plateData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=plateData
source_anchor: "#概念类"
source_sha256: 4153c304ebeaccfba61ed5e5a681200a066c001bfcc37ec85d12f6511a6978de
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="概念类"></a>

## 概念类

<a id="概念板块"></a>

### 概念板块

概念数据会不定期新增，以下列表仅作示例，请使用 get\_concepts() 获取所有概念，可以使用pandas提供的方法进行筛选

```python
from jqdata import get_concepts
df = get_concepts()
df[df['name'].str.contains("智能")]
```

| 概念代码 | 概念名称 | 起始日期 |
| --- | --- | --- |
| SC0001 | 石墨烯 | 2016-07-31 |
| SC0002 | 阿里 | 2016-07-31 |
| SC0003 | 腾讯 | 2017-12-26 |
| SC0004 | 百度 | 2018-06-11 |
| SC0005 | 华为 | 2018-12-24 |
| SC0006 | 今日头条 | 2020-04-16 |
| SC0007 | 拼多多 | 2020-11-05 |
| SC0008 | 安防 | 2016-07-31 |
| SC0009 | 车联网 | 2016-07-31 |
| SC0010 | 互联网金融 | 2016-08-09 |
| SC0011 | 网络游戏 | 2016-07-31 |
| …… | …… | …… |
| …… | …… | …… |
| SC0327 | 数据要素 | 2023-04-11 |
| SC0328 | 太赫兹 | 2023-04-20 |
| SC0329 | 英伟达概念 | 2023-05-30 |
| SC0330 | 空间计算 | 2023-06-08 |
| SC0331 | 算力租赁 | 2023-06-12 |
