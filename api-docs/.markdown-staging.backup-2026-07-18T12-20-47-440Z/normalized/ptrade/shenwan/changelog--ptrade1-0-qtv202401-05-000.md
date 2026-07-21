---
platform: ptrade
variant: shenwan
source_role: supplementary
document_type: changelog
title: PTrade1.0-QTV202401.05.000
section_path:
  - 更新日志
  - PTrade1.0-QTV202401.05.000
source_file: api-docs/raw/ptrade/shenwan/17_changelog.html
source_url: http://101.71.132.53:9091/qthelp/changelog.html
source_anchor: "#ptrade1-0-qtv202401-05-000"
source_sha256: 47cbeac6a963c4ba4f7513f41b67dc036675783504fa498a1a763e24b94bb8d9
captured_at: "2026-07-18T11:37:23.247Z"
converter: turndown
conversion_status: complete
conversion_warnings: []
canonical: true
alias_of: null
---

<a id="ptrade1-0-qtv202401-05-000"></a>

## PTrade1.0-QTV202401.05.000

1.  Python3.11 升级三方库：bs4==0.0.1-->bs4==0.0.2，gensim==4.3.0-->gensim==4.3.3，jax==0.4.13-->jax==0.4.18，jaxlib==0.4.13-->jaxlib==0.4.18，line\_profiler==4.0.2-->line\_profiler==4.1.3，qdldl==0.1.7.post0-->qdldl==0.1.7.post4，TA-Lib==0.4.25-->TA-Lib==0.4.31
2.  Python3.11 新增三方库：asyncache==0.3.1，fastapi==0.100.0，h11==0.14.0，pydantic==1.10.7，starlette==0.27.0，uvicorn==0.30.6，baostock==0.8.9
3.  Python3.5 新增三方库：baostock==0.8.9
4.  股票 [Position](help-engine-19502d4e.md#Position) 对象展示字段新增 update\_time(持仓更新时间)；
5.  新增 [成交类型](help-engine-e187e04d.md#real_type) 字典；
6.  新增 [成交状态](help-engine-e187e04d.md#real_status) 字典；
