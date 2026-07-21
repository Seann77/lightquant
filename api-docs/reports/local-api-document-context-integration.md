# LightQuant 本地 API 文档上下文接入报告

生成日期：2026-07-18

## 结论

事实型 API 索引已以“最小文档上下文注入”方式接入本地 AI 服务。`strategy_generation`、`code_conversion`、`code_analysis` 的流式和非流式调用均在进入 provider 前执行文档检索。本次未建立跨平台硬映射、API 白名单、调用拦截器、新任务状态或用户确认流程。

当前具备本地人工测试条件，不涉及上传、部署或 Git 提交。

## 修改文件

- `src/server/ai/api-document-retrieval.ts`：只读索引加载、进程缓存、平台内检索、Markdown 回退、动态预算、上下文格式化和开发日志。
- `src/server/ai/providers/index.ts`：在流式和非流式 provider 公共入口强制检索。
- `src/server/ai/providers/types.ts`：将 `apiDocumentContext` 设为 provider 输入必填字段。
- `src/server/ai/providers/openai-compatible-provider.ts`：在 Skill/系统规则之后、用户需求和代码之前注入文档上下文。
- `src/instrumentation.ts`：Node.js 服务启动时检查知识库可读性和基本引用完整性。
- `scripts/smoke-ai-api-document-context.ts`：26 项专项检索、预算和提示词注入测试。
- `scripts/smoke-ai-output-contracts.ts`、`scripts/smoke-ai-stream-partial.ts`、`scripts/smoke-ai-code-artifact.ts`：补齐 provider 测试输入的必填文档上下文。
- `scripts/fetch_api_docs.mjs`：将原有乱码检测字面量改为等价 Unicode 转义，仅为通过全仓编码检查，不改变抓取行为。
- `package.json`：新增 `smoke:ai:api-doc-context` 命令。

## 检索模块

模块仅从项目根目录读取：

- `api-docs/index/documents.jsonl`
- `api-docs/index/symbols.jsonl`
- `api-docs/index/chunks.jsonl`
- `api-docs/index/aliases.jsonl`
- `api-docs/index/conflicts.jsonl`
- `api-docs/index/platform-resolution.json`

索引解析结果使用 `globalThis` 进程级 Promise 缓存。Normalized Markdown 仅在 symbol 未精确命中时读取，读取结果也在同一进程内按文件缓存。路径来自已加载的 canonical document 记录，并校验必须位于 `api-docs/normalized/`；用户输入不参与文件路径构造。

知识库整体缺失、JSONL 损坏、跨平台 alias 规则异常或索引引用断裂时，复用现有 `AI_PROVIDER_CONFIG_ERROR`，不静默跳过检索，也没有新增失败类型。

## 检索与平台规则

检索顺序为 canonical/qualified name 严格精确匹配、平台内 alias、相关 chunk、normalized Markdown 标题与正文、基础能力章节。Python 代码识别函数调用、对象方法和已有平台回调；排除内置函数和本地函数，大小写按 Python 语义严格区分。不完整代码依然可通过轻量扫描提取检索词。

- PTrade：未指定版本时优先 guojin primary；该 API 在国金不存在时才使用 shenwan supplementary。两版记录不合并。
- QMT：子模式不明时只使用 builtin-python。明确 XtQuant/MiniQMT/VBA 时不注入 builtin-python；当前知识库无对应子模式文档，不以此推断平台不支持。
- JoinQuant：只使用 web-help canonical 记录，不加载 `main` alias 正文，按 strategy/market/finance/factor/research/faq 文档类型取相关记录。

即使没有显式 API，策略生成和转换也会查询生命周期、数据、调度、下单、账户与持仓基础内容。代码解析仅保留与现有代码行为有关的能力类别。

## 上下文与动态预算

文档上下文在现有 Skill/系统规则之后，在最近对话之后、“用户需求”和“输入代码”之前注入。流式和非流式 payload 共用同一 `buildUserContent` 路径，不重复注入。

预算计算同时考虑：

- 任务 `maxTotalInputChars`
- 当前模型 `modelMaxOutputTokens`
- 任务输出 Token 预留
- Skill/系统规则字符数
- 用户要求、完整策略代码和历史对话
- 固定提示词和 8% 安全预留
- 任务类型、显式 API 数、能力类别和涉及平台数

没有“最多 8 个 symbol”或“最多 6 个 chunk”限制。所有显式 API 首先保留平台/版本、签名、关键参数、返回值、关键说明和来源的最小事实摘要；详细正文只在剩余预算可容纳完整摘录时追加，不从函数签名、参数表或正文中间截断。

长策略测试中文档剩余预算为 0，仍保留 13 个显式 API 的最小事实摘要，文档上下文约 28,108 字符，用户代码未被修改或截断，输出预留保持 80,000 Token。此时仅在开发日志记录 `document_compression_applied=true`。

## 开发日志

非生产环境使用 `[api-document-retrieval]` 前缀记录：`task_id`、`task_type`、源/目标平台、检测 API 名、symbol/chunk/normalized 命中数、实际包含 API 名、文档字符数、Token 估算、是否压缩和检索耗时。日志不记录 API 密钥、认证信息、完整策略或完整文档正文。

## 自动测试

| 验证 | 结果 |
| --- | --- |
| `npm run smoke:ai:api-doc-context` | 通过，26 项；包含 13 个显式 API 和长策略预算样本 |
| `npm run typecheck` | 通过 |
| `npm run check:ai-prompts` | 通过，20 个提示词文件 |
| `npm run check:lightquant-skills` | 通过，8 项 Skill 同步检查 |
| `npm run smoke:ai:output-contracts` | 通过，流/非流式输出契约未回归 |
| `npm run smoke:ai:stream-partial` | 通过，流式输出与 Token 上限未回归 |
| `npm run smoke:ai:domain-rules` | 通过，LightQuant 平台和任务边界未回归 |
| `npm run smoke:ai:code-artifact` | 通过，长代码和代码产物路径未回归 |
| `npm run check:quick` | 通过，12 个本地检查步骤 |
| 知识库启动检查 | 通过 |
| 现有事实索引正式校验器 | 通过，0 失败，31 个人工复核样本 |

以上测试未调用真实 DeepSeek/MiMo/OpenAI 兼容模型，未产生外部模型费用。

## 本地启动

使用 mock AI 启动：

```bash
LIGHTQUANT_AI_PROVIDER=mock npm run dev:mock:3010
```

访问地址：`http://127.0.0.1:3010`

建议页面：

- `http://127.0.0.1:3010/chat`：策略生成、修改、调试、审查和平台转换。
- `http://127.0.0.1:3010/code-analysis`：策略代码解析。

验证时工作区已有 Next.js 开发进程占用 3010，根页面 HTTP 检查返回 200。Next.js 对同一工作区使用开发锁，因此未同时启动第二个实例。

## 手工测试

建议在 `/chat` 选择 PTrade，使用下列超过 8 个 API 的样本：

```python
def initialize(context):
    before_trading_start(context, None)
    get_price()
    get_history()
    get_fundamentals()
    get_index_stocks()
    get_industry_stocks()
    get_stock_status()
    get_positions()
    order()
    order_value()
    order_target()
    cancel_order()
```

建议分别测试：

1. 要求修改上述 PTrade 策略，观察所有显式 API 是否进入检索日志。
2. 选择 JoinQuant 到 PTrade 转换，观察日志是否同时出现源平台和目标平台。
3. 在 `/code-analysis` 提交只含 `get_market_data_ex` 的 QMT 代码，确认未注入无关财务章节。
4. 明确输入“QMT XtQuant”，确认日志和结果未混入 builtin-python 文档。

查看检索日志：

```bash
tail -f .next/dev/logs/next-development.log | rg 'api-document-retrieval'
```

对比事实索引：

```bash
cd api-docs/indexing
node search_api_index.mjs --platform ptrade --variant guojin --name get_history
node search_api_index.mjs --platform joinquant --name get_price
node search_api_index.mjs --platform qmt --variant builtin-python --name get_market_data_ex
```

检索结果会给出对应 `markdown_file` 和 `source_anchor`，可继续与 `api-docs/normalized/` 中的原章节核对生成代码。

## 尚存风险

- Token 估算使用字符数折算，而不是特定模型 tokenizer；预算仍保留 8% 安全余量和模型输出预留。
- normalized Markdown 回退在进程内会缓存，但某文件首次未命中查询仍有一次读盘成本。
- 当前事实库只含 QMT builtin-python；明确 XtQuant/VBA 任务会保持子模式边界，但无本地对应文档可注入。
- 本阶段只完成本地接入和 mock/契约测试，尚未使用真实模型做人工结果评审。

## 完成条件复核

已满足：所有相关 AI 任务强制查询文档；无检索开关和旧绕过路径；流/非流式完整接入；PTrade/QMT/JoinQuant 边界正确；显式 API 无固定数量截断；索引仅用于事实定位；现有 Skill 仍负责策略理解与目标平台原生实现选择；未上传、未部署、未提交 Git。
