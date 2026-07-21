# API 索引 QA 报告

## 结论

**通过。事实型索引可以进入后续使用评审；本阶段未接入应用。**

## 自动检查

| 状态 | 检查 | 结果 |
| --- | --- | --- |
| PASS | documents JSON Schema | 197 records valid |
| PASS | symbols JSON Schema | 1168 records valid |
| PASS | chunks JSON Schema | 1451 records valid |
| PASS | documents id uniqueness | 0 duplicate ids |
| PASS | symbols id uniqueness | 0 duplicate ids |
| PASS | chunks id uniqueness | 0 duplicate ids |
| PASS | aliases id uniqueness | 0 duplicate ids |
| PASS | conflicts id uniqueness | 0 duplicate ids |
| PASS | symbol document references | all symbol.document_id must exist |
| PASS | document Markdown references | all document Markdown files exist |
| PASS | chunk document references | all chunk.document_id must exist |
| PASS | chunk symbol references | all chunk.symbol_ids must exist |
| PASS | symbol chunk references | every symbol is linked by at least one chunk |
| PASS | alias references | all symbol aliases must resolve |
| PASS | conflict references | all conflict symbol ids must resolve |
| PASS | normalized Markdown hashes unchanged | 197 canonical Markdown files checked against manifest |
| PASS | raw source hashes unchanged | 36 raw source files checked against manifest |
| PASS | raw tree baseline unchanged | 94 files compared with pre-conversion baseline |
| PASS | index UTF-8 replacement characters | none |
| PASS | document count | 197/197 canonical Markdown documents |
| PASS | PTrade priorities | guojin=100, shenwan=50 |
| PASS | primary roles | all guojin documents primary |
| PASS | PTrade variants independent | no merged PTrade variant |
| PASS | JoinQuant main not indexed | main source has no document/body index |
| PASS | JoinQuant source role | all JoinQuant records are web-help primary priority 100 |
| PASS | JoinQuant main alias explicit | main -> api alias |
| PASS | cross-platform aliases absent | aliases remain platform-local |
| PASS | false-positive exclusion list | none indexed |
| PASS | signature/name consistency | all signatures match canonical names |
| PASS | document symbol duplicates | none |
| PASS | required symbol evidence | all records line-traceable |
| PASS | low confidence review status | 0 low-confidence records |
| PASS | nonempty chunks | all chunks nonempty with exact counts and hashes |
| PASS | chunk code/table boundaries | no chunk splits inside fences or HTML tables |
| PASS | duplicate chunk bodies | none within a document |
| PASS | chunk neighbor links | all previous/next chunk ids resolve |
| PASS | 36 source page coverage | 36/36 indexed or aliased |
| PASS | positive factual search cases | 10 passed |
| PASS | negative search cases | 19 passed |
| PASS | stable repeated build | 9 output files byte-identical |

## 人工可读性抽样

| 状态 | 类型 | 平台/版本 | 对象 | Markdown |
| --- | --- | --- | --- | --- |
| PASS | platform_api | ptrade/guojin | get_history | api-docs/normalized/ptrade/guojin/strategy-api--api.md |
| PASS | platform_api | ptrade/guojin | get_fundamentals | api-docs/normalized/ptrade/guojin/strategy-api--api.md |
| PASS | platform_api | ptrade/guojin | order | api-docs/normalized/ptrade/guojin/strategy-api--api.md |
| PASS | platform_api | ptrade/guojin | run_daily | api-docs/normalized/ptrade/guojin/strategy-api--api.md |
| PASS | platform_api | ptrade/guojin | get_price | api-docs/normalized/ptrade/guojin/strategy-api--api.md |
| PASS | platform_api | ptrade/shenwan | get_history | api-docs/normalized/ptrade/shenwan/api-data-550d561d.md |
| PASS | platform_api | ptrade/shenwan | get_fundamentals | api-docs/normalized/ptrade/shenwan/api-data-3929251f.md |
| PASS | platform_api | ptrade/shenwan | order | api-docs/normalized/ptrade/shenwan/api-stock-291dd586.md |
| PASS | platform_api | ptrade/shenwan | run_daily | api-docs/normalized/ptrade/shenwan/api-system-392b21bd.md |
| PASS | platform_api | ptrade/shenwan | get_price | api-docs/normalized/ptrade/shenwan/api-data-550d561d.md |
| PASS | platform_api | qmt/builtin-python | get_market_data_ex | api-docs/normalized/qmt/builtin-python/builtin-python--doc-data-function.md |
| PASS | platform_api | qmt/builtin-python | passorder | api-docs/normalized/qmt/builtin-python/builtin-python--doc-trading-function.md |
| PASS | platform_api | qmt/builtin-python | subscribe_quote | api-docs/normalized/qmt/builtin-python/builtin-python--doc-data-function.md |
| PASS | platform_api | qmt/builtin-python | get_trade_detail_data | api-docs/normalized/qmt/builtin-python/builtin-python--doc-trading-function.md |
| PASS | platform_api | qmt/builtin-python | schedule_run | api-docs/normalized/qmt/builtin-python/builtin-python--doc-system-function.md |
| PASS | platform_api | joinquant/web-help | initialize | api-docs/normalized/joinquant/api-c071ddc3.md |
| PASS | platform_api | joinquant/web-help | run_daily | api-docs/normalized/joinquant/api-c071ddc3.md |
| PASS | platform_api | joinquant/web-help | get_price | api-docs/normalized/joinquant/jqdata-d6c2c44f.md |
| PASS | platform_api | joinquant/web-help | order_target | api-docs/normalized/joinquant/api--api--814c0653.md |
| PASS | platform_api | joinquant/web-help | get_fundamentals | api-docs/normalized/joinquant/api--api--814c0653.md |
| PASS | callback | ptrade/guojin | before_trading_start | api-docs/normalized/ptrade/guojin/strategy-api-3408c0e7.md |
| PASS | callback | ptrade/shenwan | after_trading_end | api-docs/normalized/ptrade/shenwan/help-engine-192b4919.md |
| PASS | object_or_field | qmt/builtin-python | m_strCompactNo | api-docs/normalized/qmt/builtin-python/builtin-python--doc-data-structure.md |
| PASS | object_or_field | qmt/builtin-python | m_dTradedPrice | api-docs/normalized/qmt/builtin-python/builtin-python--doc-data-structure.md |
| PASS | factor_or_indicator | joinquant/web-help | ZLMM | api-docs/normalized/joinquant/technicalanalysis-e06bf6d5.md |
| PASS | factor_or_indicator | joinquant/web-help | alpha_180 | api-docs/normalized/joinquant/alpha191--191alphas.md |
| PASS | complex_parameter_table | / | chk:02952e985240aaea | api-docs/normalized/qmt/builtin-python/builtin-python--doc-data-function.md |
| PASS | complex_parameter_table | / | chk:0627c9da82de69fe | api-docs/normalized/joinquant/jqdata-d6c2c44f.md |
| PASS | ptrade_conflict | / | order_value |  |
| PASS | ptrade_conflict | / | get_sort_msg |  |
| PASS | negative_names | / | negative-names |  |

## 低置信度

0 条；全部必须标记 needs_review。

## 工具链提示

- npm audit 报告 2 个 moderate 级别的离线构建依赖风险；未使用强制升级。
- 索引不含 embedding，不含跨平台语义映射。

## 失败与警告

- 无失败
- 无警告

## 跨平台 API 映射阶段

适合进入；本阶段仅提供事实型输入，未建立映射。
