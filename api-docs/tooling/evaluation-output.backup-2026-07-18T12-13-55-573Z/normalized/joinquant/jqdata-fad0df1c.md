---
platform: joinquant
variant: web-help
source_role: supplementary
document_type: research_data
title: 新闻联播文本
section_path:
  - JQData使用说明
  - 新闻联播文本
source_file: api-docs/raw/joinquant/JQData/rendered.html
source_url: https://www.joinquant.com/help/api/help?name=JQData
source_anchor: "#新闻联播文本"
source_sha256: 455d753fbc9e42e235ce9cd199e4b96f64bb91746e5f8f251304f18f30381095
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="新闻联播文本"></a>

## 新闻联播文本

-   **2009年6月至今，每日21:30前更新**

方法 描述

CCTV\_NEWS 新闻联播文本数据

获取新闻联播每日播报的新闻文本数据，数据来源：央视新闻联播频道，时间范围：2009-06-26至今。

**参数：**

-   **query(finance.CCTV\_NEWS)**：表示从finance.CCTV\_NEWS 这张表中查询新闻联播的新闻文本数据，还可以指定所要查询的字段名，格式如下：query(库名.表名.字段名1，库名.表名.字段名2），多个字段用逗号分隔进行提取；query函数的更多用法详见： **[sqlalchemy.orm.query.Query对象](https://docs.sqlalchemy.org/en/rel_1_0/orm/query.html)**
-   **finance.CCTV\_NEWS**：收录了新闻联播每日播报的新闻文本数据，表结构和字段信息如下：

**字段统计**

| 字段名称 | 中文名称 | 字段类型 | 非空 | 描述 |
| --- | --- | --- | --- | --- |
| day | 日期 | date | Y |  |
| title | 标题 | varchar(200) | Y |  |
| content | 正文 | varchar(5000) |  |  |

-   **filter(finance.CCTV\_NEWS.day=='2019-02-19')**：指定筛选条件，通过finance.CCTV\_NEWS.day=='2019-02-19' 可以指定你想要查询的某天的新闻联播的新闻文本数据；除此之外，还可以对表中其他字段指定筛选条件，如finance.CCTV\_NEWS.title.like('%%新春%%')，表示标题中包含'新春'的新闻文本数据；多个筛选条件用英文逗号分隔。
-   **limit(n)**：限制返回的数据条数，n指定返回条数。

**返回结果：**

-   返回一个 dataframe，每一行对应数据表中的一条数据， 列索引是您所查询的字段名称

**注意：**

1.  为了防止返回数据量过大, 我们每次最多返回5000行
2.  不能进行连表查询，即同时查询多张表的数据

**示例：**
