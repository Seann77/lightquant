# LightQuant AI Workbench 重构设计文档

> 版本：v1.0  
> 日期：2026-06-13  
> 范围：策略生成、代码转换、代码翻译解析三大 AI 模块的底层会话、附件、异步任务与最近对话体验重构。  
> 核心约束：本次重构不改变当前 LightQuant 页面设计风格、品牌视觉、布局气质、配色体系、导航结构和整体 UI 风格。

## 0. 参考来源与借鉴边界

本设计参考 GitHub 成熟开源项目的代码结构和交互机制，但只吸收架构与交互模式，不照搬视觉样式。LightQuant 仍保持现有专业量化工具风格。

- [LibreChat](https://github.com/danny-avila/LibreChat)：参考聊天消息结构、附件上传、图片/文件对话、多会话管理、Reasoning UI、流式/可恢复响应、Artifacts、文件处理与 S3/媒体链接等机制。其 README 明确覆盖多模型、文件/图片交互、Reasoning UI、resumable streams 和 artifacts 等能力。
- [LibreChat Upload as Text 文档](https://www.librechat.ai/docs/features/upload_as_text)：参考“上传文件、抽取文本、注入会话上下文”的轻量路径。
- [LibreChat RAG API 文档](https://www.librechat.ai/docs/configuration/rag_api)：参考文件索引、检索增强与文档上下文的后续扩展路径。
- [Open WebUI](https://github.com/open-webui/open-webui)：参考自托管 AI 工作台、OpenAI-compatible/Ollama 模型适配、文件/图片上传、会话组织、工具调用、RAG 与 artifact 存储能力。
- [Open WebUI models 目录](https://github.com/open-webui/open-webui/tree/main/backend/open_webui/models)：参考 chats、chat_messages、files、knowledge、tools 等按模型域拆分的后端结构。
- [Open WebUI chat_messages.py](https://github.com/open-webui/open-webui/blob/main/backend/open_webui/models/chat_messages.py)：参考 message 中 role、parent、content、files、sources、embeds、done、status_history、usage 与索引设计。
- [Open WebUI files.py](https://github.com/open-webui/open-webui/blob/main/backend/open_webui/models/files.py)：参考 file 元数据、hash、path、data/meta、用户隔离、列表分页与 metadata-only 查询。
- [Microsoft Magentic-UI](https://github.com/microsoft/magentic-ui)：参考异步 Agent 任务、用户在环控制、浏览器/文件系统任务过程、沙箱与多步骤可追踪执行。
- [Magentic-UI types.py](https://github.com/microsoft/magentic-ui/blob/main/src/magentic_ui/types.py)：参考 `InputRequest`、`ApprovalRequest`、`ContinuationRequest`、`PauseController` 的用户确认、继续/停止、暂停/取消、运行中消息注入机制。
- [Magentic-UI approval.py](https://github.com/microsoft/magentic-ui/blob/main/src/magentic_ui/approval.py)：参考 approve / deny / alternative、user / auto_session / policy / safe 等确认状态。
- Claude Code UI / CloudCLI 类项目：参考“项目/会话切换、文件上下文、任务执行过程可追溯、用户中断和恢复”的产品机制，不参考其视觉样式。
- Cherry Studio、NextChat、Chatbot UI、LangChain Agent Chat UI：仅作为辅助参考，尤其是多模型、会话列表、附件入口和轻量聊天 UI 的交互组织，不改变 LightQuant 的业务形态。

## 一、重构背景

### 1.1 当前三大模块

LightQuant 当前已有三个核心 AI 模块：

- 策略生成：位于 `src/app/chat/ChatClient.tsx` 的 strategy 模式，已有聊天式输入、目标平台选择、任务轮询、历史会话恢复雏形。
- 代码转换：位于 `src/app/chat/ChatClient.tsx` 的 convert 模式，当前以任务型左右工作区呈现，含源/目标平台、代码输入、转换要求、结果 tabs。
- 代码翻译解析：位于 `src/app/code-analysis/CodeAnalysisClient.tsx`，当前以代码编辑区、平台选择、解析结果 tabs 呈现。

这三个模块的视觉和业务入口已经形成 LightQuant 的专业量化工具气质：浅色半透明工作台、蓝色品牌主色、侧边栏导航、最近列表、量化平台选择、代码编辑/结果面板、积分消耗提示。重构必须保留这些外观与导航结构。

### 1.2 当前问题

1. 上传日志后，对话中没有像 ChatGPT 一样展示附件。  
   当前 `UploadedFile` 只通过 `inputFileId` 关联到 `AiTask`，用户消息里只写了文件名或文本提示，没有独立的 message attachment 列表。

2. 缺少图片上传和图片理解能力。  
   当前 `src/server/files/file-service.ts` 只支持文本类 `.py` / `.txt` 文件，并直接 UTF-8 解码到 `contentText`。Provider payload 也只有纯文本 `messages`，没有 image content block。

3. AI 处理过程不像 ChatGPT / Claude Code / 豆包那样自然、可追踪。  
   当前 `ai-task-progress.ts` 是内存 Map 快照，只能展示阶段和百分比，刷新或跨进程会丢。`AiMessage.contentJson.visibleSteps` 只能保存粗粒度步骤，不是真实事件流。

4. 代码转换、代码解析结果没有完整进入最近对话。  
   目前 `createAiTask` 只为 `strategy_generation` 创建 `AiConversation` 和 `AiMessage`。`code_conversion`、`code_analysis` 只是单次 `AiTask`，结果在当前页面 state 中展示，用户从最近对话回去只能回到空页面，无法恢复输入、tabs、结果、附件和过程。

5. 点击最近对话速度较慢。  
   当前 `/api/v1/ai/conversations/[conversationId]/messages` 会一次性返回 conversation、全部 messages、最近 30 个 tasks，并逐个查 result。最近列表仍使用 page/total，`AppShell` 还先查 strategy conversations，没查到再查 tasks。点击历史会话容易被完整消息、大结果、task result 加载阻塞首屏。

### 1.3 为什么升级为 AI Workbench

当前结构更像“单次任务页面”：用户提交一次任务、等待结果、页面 state 承载任务体验。随着附件、图片理解、过程追踪、继续追问、最近恢复、并行任务和断线恢复进入产品要求，单次任务页面会越来越难维护。

目标应升级为“AI Workbench 会话工作台”：

- Conversation 是长期业务上下文，不再只属于策略生成。
- Message 是用户输入、系统反馈、助手结果的统一记录。
- Attachment 是消息和任务都可复用的上下文资产。
- Run/AiTask 是一次可追踪、可取消、可恢复的执行。
- RunEvent 是过程事实，不暴露模型隐私思维链，只展示用户可理解、可验证的过程摘要。
- Artifact 是结果产物，可被最近对话、详情恢复、下载、继续修改复用。

## 二、设计目标

- 统一三大模块的底层会话结构：`strategy_generation`、`code_conversion`、`code_analysis` 都写入 `AiConversation` / `AiMessage`。
- 保留每个模块当前业务入口和页面风格：侧边栏导航不变，`/chat?mode=strategy`、`/chat?mode=convert`、`/code-analysis` 继续存在。
- 最近对话支持策略生成、代码转换、代码解析，并能恢复原业务界面。
- 支持日志、代码文件、txt、markdown、csv、PDF、图片等附件，并分阶段启用。
- 支持图片理解：AI 能结合图表、报错截图、回测曲线、交易界面截图修改策略或解释问题。
- 支持异步任务事件流：展示 AI 正在读取、分析、生成、校验、产出结果的过程。
- 优化最近对话点击速度：先打开业务页面和轻量 summary，再渐进加载 messages、events、artifacts。
- 为后续多任务并行、断线恢复、结果产物管理、项目/文件上下文打基础。

## 三、当前代码现状分析

### 3.1 可以保留的结构

- Prisma 现有 `AiTaskType`：`strategy_generation`、`code_conversion`、`code_analysis` 能直接作为统一 Workbench 的 run type。
- Prisma 现有 `AiConversation` / `AiMessage`：已具备 user、mode、title、lastMessageAt、role、content、contentJson、taskId，适合作为第一阶段基础。
- 现有 `AiTask` / `AiTaskResult`：已有状态、平台、输入、成本、幂等请求、开始/结束时间、结果字段、tokenUsage，可兼容为 `AiRun` 的 MVP。
- 现有 `UploadedFile`：已保存 user、originalName、ext、mimeType、sizeBytes、sha256、contentText、parseStatus、scanStatus、riskFlags，可作为 `AttachmentFile` 的兼容层。
- Repository 抽象：`LightQuantRepository`、`DatabaseLightQuantRepository`、`MockLightQuantRepository` 已覆盖会话、消息、任务、文件，是分阶段迁移的重要基础。
- AI provider 抽象：`runAiProvider`、`openai-compatible-provider.ts`、`deepseek-provider.ts`、`mock-provider.ts` 已抽出 provider 层，便于扩展 vision payload 和模型 capability。
- 现有 `code-chunking.ts`：已有 scan、chunking、processing、merging、validating 等真实步骤，可直接映射为 RunEvent。
- 现有 `AiTaskProgressPanel`：可保留 LightQuant 视觉语言，升级数据源为持久化 `RunEvent` summary。
- 前端页面结构：策略生成聊天式、代码转换左右工作区、代码解析编辑+结果 tabs 都应保留。
- `AppShell` 侧边栏与最近列表：导航结构和 UI 样式保留，只替换数据源与点击恢复逻辑。

### 3.2 需要升级的结构

- `AiConversationMode` 当前为 `strategy | convert | analysis`，而 `AiTaskType` 是 `strategy_generation | code_conversion | code_analysis`，命名不统一。建议保留 enum 兼容，但 API 层统一输出 `mode` 与 `taskType` 映射。
- `AiMessage` 缺少 attachments、status、runId、artifact 引用。现在附件信息混在 `contentJson`，不利于多附件、图片缩略图、下载权限和最近 summary。
- `AiTask.inputFileId` 只能表达单个输入文件，不支持一个消息多个附件，也不支持同一附件被多个 run 使用。
- `UploadedFile.contentText` 强制非空文本，不适合图片、PDF、二进制原文件、对象存储路径、缩略图和 OCR/解析异步状态。
- `AiTaskProgress` 是进程内 Map，不持久、不分页、不支持断线恢复。
- `AiTaskResult` 是最终结果表，缺少 artifact 类型、版本、预览、下载、可恢复 UI state。
- `/api/v1/ai/conversations/[conversationId]/messages` 一次性返回完整消息和任务结果，不利于最近对话快速打开。
- `AppShell.refreshRecentAiTasks` 只优先 strategy conversation，代码转换/解析仍回退到 tasks，导致“最近”不是统一会话。
- OpenAI-compatible provider 目前使用 non-streaming JSON 模式，缺少流式响应、vision content block、reasoning tag 解析与 fallback 逻辑。
- 前端附件组件重复存在于策略、转换、解析页面，且只显示简单 file status，不像消息附件卡片。

### 3.3 文件级现状结论

- `prisma/schema.prisma`：可保留现有 `AiTask`、`AiTaskResult`、`AiConversation`、`AiMessage`、`UploadedFile` 主干；需要新增 message attachment、run event、artifact，并把 UploadedFile 从“文本代码文件”升级为“多类型附件文件”。
- `src/app/chat/ChatClient.tsx`：可保留策略生成聊天体验、代码转换工作台布局、任务轮询、取消/重试、`AgentWorkLog`、`CopyableCodeBlock`、结果 tabs；需要拆出 WorkbenchShell、ChatComposer、AttachmentPreviewCard、RunProgressPanel、ArtifactViewer，并让 convert 模式支持 conversationId 恢复。
- `src/app/code-analysis/CodeAnalysisClient.tsx`：可保留代码解析页面布局、平台选择、上传按钮、解析结果 tabs、进度面板；需要接入 conversation、message、artifact、uiState，并支持从最近对话恢复原输入、附件、activeTab 和报告。
- `src/server/ai/ai-service.ts`：可保留创建任务、幂等、积分预留/确认、任务运行、结果落库、取消/重试；需要把 strategy-only conversation 逻辑推广到三大模块，并在关键阶段写入 RunEvent 和 Artifact。
- `src/server/ai/providers/openai-compatible-provider.ts`：可保留 OpenAI-compatible endpoint、JSON 输出校验、provider retry、tokenUsage 归一；需要新增 vision content block、模型能力判断、流式输出、reasoning tag 解析和非 vision fallback。
- `src/server/files/file-service.ts`：可保留扩展名校验、大小限制、sha256、风险扫描、contentPreview；需要支持图片/PDF/日志类型、contentText nullable、缩略图、对象存储、异步解析和下载/预览权限。
- `src/app/api/v1/ai/tasks/route.ts`：可保留 `POST` 创建任务、`GET` 任务列表、schedule runner；需要新增 run API 或在 tasks API 中接受 message/attachmentIds/uiState，并返回 conversation summary。
- `src/app/api/v1/ai/conversations/*`：可保留 conversation 列表和 messages 读取；需要补创建、summary、更新、归档、删除、cursor 分页、轻量 messages、attachments summary。
- `src/app/api/v1/files/route.ts`：可保留 multipart 上传入口；需要扩展 purpose/parseMode，支持图片、preview、thumbnail、download。
- `src/server/repositories/types.ts`：可保留 repository 抽象；需要新增 conversation summary、message pagination、message attachment、run event、artifact、file preview metadata 等方法。
- `src/server/repositories/database/database-repository.ts`：可保留 Prisma 转换层、事务、幂等和分页实现；需要避免最近列表 count 阻塞，新增 cursor 查询和大字段隔离。
- `src/server/repositories/mock/mock-repository.ts`：可保留内存 Map 测试模式；需要同步新增模型，确保本地 mock 与 database 行为一致。

## 四、目标数据模型设计

### 4.1 AiConversation

职责：一个用户可恢复的 AI 工作上下文，覆盖三大模块。

关键字段：

- `id`
- `userId`
- `mode`: `strategy | convert | analysis`
- `taskType`: 可选冗余字段，推荐后续新增为 `strategy_generation | code_conversion | code_analysis`，用于统一统计与最近筛选。
- `title`
- `status`: `active | archived | deleted`
- `sourcePlatform`
- `targetPlatform`
- `summary`: 最近列表摘要，控制长度 200-500 字。
- `lastMessageId`
- `lastMessagePreview`
- `lastRunId`
- `lastRunStatus`
- `artifactCount`
- `attachmentCount`
- `uiState`: JSON，保存模块恢复状态，如 activeTab、平台选择、滚动锚点、结果 tab。
- `createdAt`
- `updatedAt`
- `lastMessageAt`
- `deletedAt`

索引：

- `(userId, status, lastMessageAt desc, id desc)`：最近列表主索引。
- `(userId, mode, status, lastMessageAt desc, id desc)`：模块筛选。
- `(userId, taskType, status, lastMessageAt desc, id desc)`：任务类型筛选。
- `(userId, updatedAt desc)`：管理和回收。

兼容关系：

- 现有 `AiConversation` 保留，新增字段可 nullable，避免一次性迁移。
- 旧 `mode=strategy|convert|analysis` 继续使用。
- 代码转换/解析旧任务补建 conversation 时根据 `AiTask.type` 映射模式。

### 4.2 AiMessage

职责：会话中的消息，包括用户输入、助手结果、系统提示、过程摘要。

关键字段：

- `id`
- `conversationId`
- `userId`
- `role`: `user | assistant | system | tool`
- `runId`: nullable，推荐新增，替代 `taskId` 的未来语义。
- `taskId`: 兼容字段，保留到 `AiRun` 完成替换。
- `parentMessageId`: 支持重试、分支、重新生成。
- `content`: 文本摘要，供列表和搜索。
- `contentJson`: 结构化块，如 markdown、code、reasoningSummary、platformState。
- `status`: `created | streaming | completed | failed | cancelled`
- `finishReason`
- `tokenUsage`
- `createdAt`
- `updatedAt`

索引：

- `(conversationId, createdAt asc, id asc)`：消息分页。
- `(conversationId, id)`：游标分页。
- `(userId, createdAt desc)`：搜索和审计。
- `(runId)` / `(taskId)`：从 run 找 assistant message。

兼容关系：

- 现有 `taskId @unique` 可逐步放宽为普通索引，因为一个 run 可能产生多个 message、event summary 或 artifact mention。

### 4.3 AiMessageAttachment

职责：连接消息与附件文件，解决“对话中看不到附件”的核心问题。

关键字段：

- `id`
- `messageId`
- `conversationId`
- `userId`
- `fileId`
- `role`: `input | generated | reference`
- `displayOrder`
- `caption`
- `extractMode`: `raw | text_extract | ocr | vision | ignored`
- `createdAt`

索引：

- `(messageId, displayOrder)`
- `(conversationId, createdAt)`
- `(fileId)`
- `unique(messageId, fileId, role)` 避免重复挂载。

兼容关系：

- 旧 `AiTask.inputFileId` 可迁移为 user message 的 `AiMessageAttachment`。
- 新提交任务时先创建 user message，再创建附件关联，再创建 run。

### 4.4 AiRun / 兼容 AiTask

职责：一次 AI 执行实例。短期继续使用 `AiTask`，中期新增 `AiRun` 或将 `AiTask` 扩展为 run。

关键字段：

- `id`
- `userId`
- `conversationId`
- `triggerMessageId`
- `type`: `strategy_generation | code_conversion | code_analysis`
- `status`: `PENDING | RUNNING | SUCCEEDED | FAILED | CANCELLED`
- `scopeStatus`
- `sourcePlatform`
- `targetPlatform`
- `prompt`
- `inputSnapshot`: JSON，包含输入文本、附件 IDs、平台、uiState、context message IDs。
- `model`
- `provider`
- `costPoints`
- `clientRequestId`
- `requestId`
- `attempt`
- `parentRunId`
- `cancelRequestedAt`
- `startedAt`
- `finishedAt`
- `createdAt`
- `updatedAt`
- `errorCode`
- `errorMessage`

索引：

- `unique(userId, clientRequestId)`：幂等。
- `(userId, createdAt desc)`
- `(conversationId, createdAt desc)`
- `(conversationId, status, updatedAt desc)`
- `(status, updatedAt)`：后台恢复/扫尾。

兼容关系：

- 阶段 1-5 继续以 `AiTask` 为物理表，新增 run 概念和字段。
- 阶段 6 后可决定是否新建 `ai_runs` 并把 `ai_tasks` 作为兼容 view/alias。

### 4.5 AiRunEvent

职责：持久化任务过程事件，替代内存 progress，支持刷新恢复、取消、重试、断线续接。

关键字段：

- `id`
- `runId`
- `conversationId`
- `userId`
- `seq`: 单 run 内递增序号。
- `type`: 见第九章事件枚举。
- `status`: `pending | running | completed | failed | skipped`
- `title`
- `summary`: 用户可理解的过程摘要。
- `detailJson`: 结构化细节，如 fileId、chunkIndex、platformSignals、tokenUsage。
- `progressPercent`
- `visibility`: `public | debug | admin_only`
- `createdAt`

索引：

- `unique(runId, seq)`
- `(runId, createdAt asc)`
- `(conversationId, createdAt desc)`
- `(userId, createdAt desc)`

重要约束：

- 不保存模型原始隐私思维链。
- 可保存“过程摘要”和“可验证事实”，如读取了哪个附件、识别到哪些平台信号、生成了几个 artifact。

### 4.6 AiArtifact

职责：保存 AI 输出产物，支持结果恢复、版本、下载和后续修改。

关键字段：

- `id`
- `conversationId`
- `runId`
- `messageId`
- `userId`
- `type`: `strategy_code | converted_code | analysis_report | migration_notes | risk_report | image_analysis | log_summary`
- `title`
- `mimeType`
- `contentText`
- `contentJson`
- `fileId`: 可选，产物落文件后引用。
- `preview`
- `version`
- `parentArtifactId`
- `createdAt`
- `updatedAt`

索引：

- `(conversationId, updatedAt desc)`
- `(runId, createdAt)`
- `(userId, type, updatedAt desc)`
- `(fileId)`

兼容关系：

- 现有 `AiTaskResult.generatedCode/explanation/migrationNotes/riskWarnings/reportJson` 可同步写入 `AiArtifact`。
- 短期可保留 `AiTaskResult` 为任务结果 API 的快速读取来源，artifact 用于恢复体验和产物管理。

### 4.7 UploadedFile / AttachmentFile

职责：保存用户上传或系统生成的文件元数据、存储位置、解析状态与安全扫描结果。

建议升级字段：

- `id`
- `userId`
- `originalName`
- `displayName`
- `ext`
- `mimeType`
- `sizeBytes`
- `sha256`
- `storageProvider`: `db | local | s3 | r2 | oss`
- `storageKey`
- `publicUrl`: nullable，通常不用公开。
- `signedUrlExpiresAt`: nullable。
- `thumbnailFileId`: 图片缩略图或 PDF 首图。
- `contentText`: nullable，文本抽取结果。
- `contentJson`: nullable，OCR/表格/图片元数据。
- `parseStatus`: `PENDING | SUCCEEDED | FAILED | PARTIAL`
- `scanStatus`: `PASSED | BLOCKED | WARNING | PENDING`
- `riskFlags`
- `kind`: `code | log | text | image | pdf | spreadsheet | binary`
- `createdAt`
- `updatedAt`

索引：

- `(userId, createdAt desc)`
- `(sha256)`
- `(userId, kind, createdAt desc)`
- `(parseStatus, createdAt)`
- `(scanStatus, createdAt)`

兼容关系：

- 现有 `UploadedFile` 表可先 nullable 改造，不必立即新建表。
- 如果担心旧表含大量 `contentText`，后续可拆 `AttachmentFile` 元数据表和 `AttachmentFileContent` 大文本表。

### 4.8 三种模式支持

- `strategy_generation`：conversation.mode=`strategy`；消息流为主；artifact 类型主要是 `strategy_code`、`log_summary`、`image_analysis`。
- `code_conversion`：conversation.mode=`convert`；一次转换任务也写入 conversation；保存 activeTab、sourcePlatform、targetPlatform、输入代码/附件、输出代码、迁移说明、风险提示。
- `code_analysis`：conversation.mode=`analysis`；保存输入代码/附件、解析报告、结构化说明、风险点、tabs 状态。

### 4.9 最近对话快速查询

最近列表只查 `AiConversation` summary 字段：

- `id`
- `mode`
- `title`
- `lastMessagePreview`
- `lastRunStatus`
- `sourcePlatform`
- `targetPlatform`
- `attachmentCount`
- `artifactCount`
- `lastMessageAt`
- `updatedAt`

不查大字段：

- 不查 messages。
- 不查 `AiTaskResult.generatedCode`。
- 不查 `UploadedFile.contentText`。
- 不查 artifacts 正文。

## 五、接口设计

所有 API 默认需要登录，返回结构沿用当前 `{ success, data, requestId }` 包装。

### 5.1 创建会话

- 路径：`POST /api/v1/ai/conversations`
- 请求：

```json
{
  "mode": "strategy",
  "title": "双均线策略优化",
  "sourcePlatform": "JoinQuant",
  "targetPlatform": "PTrade",
  "uiState": { "activeTab": "目标平台代码" }
}
```

- 响应：轻量 `conversationSummary`
- 分页：否
- 性能影响：只写 summary 字段，不加载消息。

### 5.2 获取最近对话列表

- 路径：`GET /api/v1/ai/conversations`
- 参数：`mode?`、`status=active`、`cursor?`、`limit=20`
- 响应：

```json
{
  "items": [
    {
      "id": "uuid",
      "mode": "convert",
      "title": "JoinQuant 转 PTrade",
      "lastMessagePreview": "已完成平台代码转换",
      "lastRunStatus": "SUCCEEDED",
      "sourcePlatform": "JoinQuant",
      "targetPlatform": "PTrade",
      "attachmentCount": 1,
      "artifactCount": 3,
      "lastMessageAt": "..."
    }
  ],
  "nextCursor": "..."
}
```

- 分页：cursor 分页，禁止首屏 `count(*)`
- 轻量 summary：必须
- 性能影响：最近列表主路径，必须走 `(userId,status,lastMessageAt,id)` 索引。

### 5.3 获取会话 summary

- 路径：`GET /api/v1/ai/conversations/{conversationId}`
- 响应：conversation summary + `uiState` + latest run summary
- 分页：否
- 用途：点击最近对话后先恢复页面框架和 tabs。
- 性能影响：不得加载大消息和 artifact 正文。

### 5.4 获取会话完整消息

- 路径：`GET /api/v1/ai/conversations/{conversationId}/messages`
- 参数：`cursor?`、`limit=30`、`direction=backward|forward`
- 响应：messages + attachments summary + `nextCursor`
- 分页：cursor 分页
- 轻量 summary：消息只带 attachment metadata，不带大文件正文。
- 性能影响：首屏只取最近 20-30 条；历史向上滚动再加载。

### 5.5 上传附件

- 路径：`POST /api/v1/files`
- 请求：`multipart/form-data`
  - `file`
  - `purpose`: `conversation | run | artifact`
  - `conversationId?`
  - `parseMode?`: `auto | text | ocr | vision | metadata_only`
- 响应：

```json
{
  "fileId": "uuid",
  "kind": "image",
  "originalName": "回测曲线.png",
  "mimeType": "image/png",
  "sizeBytes": 345678,
  "sha256": "...",
  "parseStatus": "PENDING",
  "scanStatus": "PASSED",
  "thumbnailUrl": "/api/v1/files/{id}/thumbnail",
  "contentPreview": null
}
```

- 分页：否
- 性能影响：上传后只返回 metadata 和 preview，不返回大正文。

### 5.6 附件预览/下载

- 预览：`GET /api/v1/files/{fileId}/preview`
- 缩略图：`GET /api/v1/files/{fileId}/thumbnail`
- 下载：`GET /api/v1/files/{fileId}/download`
- 参数：`disposition=inline|attachment`
- 响应：文本 preview JSON 或文件 stream/signed redirect
- 性能影响：最近列表不调用，进入消息或附件面板按需加载。

### 5.7 创建 AI Run

- 路径：`POST /api/v1/ai/runs`
- 兼容路径：`POST /api/v1/ai/tasks`
- 请求：

```json
{
  "conversationId": "uuid",
  "type": "code_conversion",
  "message": {
    "content": "请转换为 PTrade，并保留止损逻辑",
    "attachmentIds": ["file-1"]
  },
  "sourcePlatform": "JoinQuant",
  "targetPlatform": "PTrade",
  "uiState": { "activeTab": "目标平台代码" },
  "clientRequestId": "convert-..."
}
```

- 响应：`202`，返回 run summary、created user message、conversation summary
- 分页：否
- 性能影响：同步阶段只入库和排队，不等待模型完成。

### 5.8 获取 Run 状态

- 路径：`GET /api/v1/ai/runs/{runId}`
- 响应：run summary + latest event + progress + artifact summary
- 分页：否
- 性能影响：轮询轻量接口，不返回完整 events。

### 5.9 获取 RunEvent 列表

- 路径：`GET /api/v1/ai/runs/{runId}/events`
- 参数：`afterSeq?`、`limit=100`
- 响应：events + `nextAfterSeq`
- 分页：增量序号分页
- 性能影响：轮询或 SSE 恢复时只取增量。
- 后续可增加：`GET /api/v1/ai/runs/{runId}/events/stream` 使用 SSE。

### 5.10 取消 Run

- 路径：`POST /api/v1/ai/runs/{runId}/cancel`
- 请求：`{ "reason": "user_cancel" }`
- 响应：run summary
- 性能影响：写 `cancelRequestedAt`，runner 检查后落 `cancelled` event。

### 5.11 重试 Run

- 路径：`POST /api/v1/ai/runs/{runId}/retry`
- 请求：`{ "clientRequestId": "retry-...", "reuseAttachments": true }`
- 响应：新 run summary
- 性能影响：复用原 conversation、message/attachment snapshot，新建 attempt。

### 5.12 获取 Artifact

- 路径：`GET /api/v1/ai/artifacts/{artifactId}`
- 参数：`includeContent=true|false`
- 响应：artifact summary 或正文
- 分页：否
- 性能影响：最近和消息默认只拿 artifact summary，正文点击 tab 或 viewer 时加载。

### 5.13 更新会话标题/归档/删除

- 改标题：`PATCH /api/v1/ai/conversations/{conversationId}`，body `{ "title": "..." }`
- 归档：`POST /api/v1/ai/conversations/{conversationId}/archive`
- 恢复：`POST /api/v1/ai/conversations/{conversationId}/unarchive`
- 删除：`DELETE /api/v1/ai/conversations/{conversationId}`
- 响应：conversation summary
- 性能影响：只更新 conversation 行，必要时异步清理附件引用。

## 六、前端组件设计

组件重构原则：只抽结构能力，不改变现有 LightQuant 风格。继续使用当前 `lq-*` CSS、浅色半透明面板、8px 圆角、蓝色主按钮、专业量化工作台布局、侧边栏导航。

### 6.1 WorkbenchShell

职责：统一三大模块的数据加载、summary 先行、messages/events/artifacts 渐进加载。

- 复用现有 `lq-workspace`、`lq-workbench`、`lq-analysis-card` 的视觉语言。
- 不新增开源项目式暗色聊天全屏 UI。
- 接收 `mode`，内部挂载对应业务视图：Strategy、Conversion、Analysis。

### 6.2 ConversationList / ConversationListItem

职责：替换 `AppShell` 最近列表的数据层。

- 视觉复用 `.lq-recent`、`.lq-recent-link`。
- 展示极简：标题、状态、模式图标，不增加复杂卡片。
- hover 时预取 summary，不预取大消息。

### 6.3 ChatComposer

职责：统一输入框、附件、发送、快捷提交。

- 策略生成使用现有 `.lq-composer` 和 `.lq-composer-textarea`。
- 转换/解析仍保留现有代码输入区，不强制变成聊天框。
- 提交时产出 message + run。

### 6.4 AttachmentPicker

职责：统一上传入口。

- 复用 `lq-upload-chip`。
- 支持文件类型提示：代码/日志/文本/PDF/图片。
- 不做 Open WebUI/LibreChat 风格的大型拖拽弹窗作为 MVP。

### 6.5 AttachmentPreviewCard

职责：上传后和消息内展示附件。

- 复用 `lq-file-status`，升级成小型卡片：图标/缩略图、文件名、大小、解析状态、风险标记、删除按钮。
- 图片显示小缩略图；文本显示 preview；PDF 显示页数/解析状态。
- 在消息气泡中自然出现，解决“上传日志后对话中没有附件”的问题。

### 6.6 MessageBubble

职责：统一 user/assistant/system message。

- 策略生成沿用现有 `ChatBubble` / `StrategyMessageBubble`。
- 用户消息支持 `MessageAttachmentList`。
- Assistant 消息支持 result summary、artifact link、RunProgressPanel。

### 6.7 MessageAttachmentList

职责：在消息下展示附件列表。

- 用紧凑横向或换行列表，不占大面积。
- 支持点击预览/下载。
- 对 blocked 附件显示红色风险提示。

### 6.8 RunProgressPanel

职责：统一 run 当前状态摘要。

- 基于现有 `AiTaskProgressPanel` 演进。
- 数据源从 `task.progress` 变为 `run.progress + latestEvents`。
- 策略聊天中可折叠显示，转换/解析结果区可嵌在原结果面板中。

### 6.9 RunEventTimeline

职责：完整过程时间线。

- 复用现有 `lq-agent-log` / `lq-agent-steps` 风格。
- 支持折叠/展开。
- 事件文案是用户可验证摘要，如“读取附件 xxx.py”“识别到 JoinQuant API”“生成迁移说明”。
- 不展示模型隐私思维链。

### 6.10 ArtifactViewer

职责：统一产物查看。

- 对代码产物复用 `CopyableCodeBlock` 和现有代码预览面板。
- 对解析报告复用现有 tabs。
- 对图片分析结果用 LightQuant 风格说明块，不做大图社交媒体样式。

### 6.11 StrategyResultView

- 从 `StrategyAssistantResult` 抽出。
- 显示策略代码、说明、风险提示、继续修改入口。
- Artifact 化保存每次策略结果。

### 6.12 CodeConversionResultView

- 保留当前三 tabs：目标平台代码、迁移说明、风险提醒。
- tabs 状态写入 conversation.uiState。
- 输出代码、迁移说明、风险提醒分别可作为 artifacts。

### 6.13 CodeAnalysisResultView

- 保留当前解析 tabs：概览、交易逻辑、关键参数、风险提醒、优化建议。
- 保存 reportJson 和 activeTab。
- 最近对话恢复时先展示 summary，再加载完整 report。

## 七、三大模块重构方案

### 7.1 策略生成

保持聊天式体验：

- `/chat?mode=strategy` 不变。
- 目标平台 strip 不变。
- 输入框、消息气泡、AI 处理日志保持现有 LightQuant 视觉。

附件展示：

- 上传日志、代码、图片后，先生成 `UploadedFile`。
- 提交时 user message 关联 `AiMessageAttachment`。
- 消息气泡下显示 `AttachmentPreviewCard`，包含文件名、类型、解析状态。

Artifact：

- 每次生成结果保存为 `AiArtifact(type=strategy_code)`。
- 如图片参与分析，保存 `AiArtifact(type=image_analysis)`。
- 如日志参与诊断，保存 `AiArtifact(type=log_summary)`。

继续追问和修改：

- 新 user message 引用同 conversation。
- provider context 读取最近消息 summary、相关 artifacts preview、附件文本/图片理解结果。
- 不把全部历史无限塞进 prompt，按 token 预算选择。

### 7.2 代码转换

写入 Conversation：

- 用户点击“开始转换”时，如无 conversation 则创建 `mode=convert`。
- 创建 user message，content 为转换要求或默认摘要，attachments 包含源代码文件。
- 创建 run，type=`code_conversion`。

保存内容：

- `sourcePlatform`、`targetPlatform` 写入 conversation 和 run。
- 输入代码保存到 run.inputSnapshot，长文本可保存为 artifact 或 attachment file。
- 输出代码保存 `AiArtifact(type=converted_code)`。
- 迁移说明保存 `AiArtifact(type=migration_notes)`。
- 风险提示保存 `AiArtifact(type=risk_report)`。

最近对话恢复：

- 最近点击 `/chat?mode=convert&conversationId=...`。
- 页面先加载 summary：平台、标题、lastRunStatus、activeTab。
- 再加载 artifacts，恢复 tabs 和结果。
- 再按需加载完整输入代码和 events。

### 7.3 代码翻译解析

写入 Conversation：

- `/code-analysis?conversationId=...` 支持会话恢复。
- 新解析任务创建 `mode=analysis` conversation。
- user message 保存输入代码摘要和附件。
- run type=`code_analysis`。

保存内容：

- 输入代码/文件：message attachments + run.inputSnapshot。
- 解析报告：`AiArtifact(type=analysis_report)`。
- 结构化说明：artifact.contentJson 保存 overview、tradingLogic、parameters、optimizationSuggestions。
- 风险点：`AiArtifact(type=risk_report)` 或 reportJson.riskWarnings。

恢复原界面：

- summary 恢复平台、activeTab、标题。
- artifacts 恢复 tabs 内容。
- messages/events 延迟加载。
- 页面视觉仍是当前代码解析工作台，不切换成纯聊天 UI。

## 八、附件与图片能力

### 8.1 支持类型

MVP：

- 代码：`.py`、`.txt`
- 日志/文本：`.log`、`.txt`、`.md`
- 图片：`.png`、`.jpg`、`.jpeg`、`.webp`

第二阶段：

- PDF：`.pdf`
- 表格：`.csv`、`.xlsx`
- 压缩包：谨慎支持，默认不开放。

### 8.2 文件大小限制

建议默认：

- 文本/代码/日志：10 MB，超过后要求拆分或仅提取前后关键片段。
- 图片：8 MB，自动压缩生成 vision 输入图和缩略图。
- PDF：20 MB 或 100 页，MVP 可先限制 10 MB / 30 页。
- 单条消息附件数：5 个。
- 单 run 总附件文本预算：按任务配置 token/char budget 截断。

### 8.3 文本解析策略

- UTF-8 优先，失败时尝试 GBK/GB18030，仅对代码/日志开放。
- 对 `.py` 做结构扫描，提取函数、导入、平台 API 信号。
- 对 `.log` 提取错误栈、关键异常、最近 N 行、时间段。
- 对 `.md` / `.txt` 直接抽取 preview 和全文。
- 对超长文本生成 `contentPreview`、`contentSummary`、`chunkManifest`。

### 8.4 图片存储策略

- 原图保存到对象存储或本地私有目录，数据库只保存 metadata 和 storageKey。
- 永不把公开 URL 直接写入消息，下载/预览通过鉴权 API。
- 生成标准化 vision 版本：最长边 1600-2048，保留原图。
- 生成缩略图：最长边 320，用于消息卡片。

### 8.5 图片缩略图策略

- 上传成功后异步生成 thumbnail。
- `AttachmentPreviewCard` 优先读 thumbnail。
- thumbnail 失败时显示图片图标和文件名。

### 8.6 传给 vision 模型的方式

- Provider 增加 capability：`supportsVision`、`supportsImageUrl`、`supportsBase64Image`。
- OpenAI-compatible payload 使用 content blocks：

```json
[
  { "type": "text", "text": "请结合这张回测图分析策略问题" },
  { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
]
```

- 如 provider 支持 signed URL，可传短期签名 URL。
- Vision prompt 不要求模型输出隐私思维链，只输出可解释分析结论。

### 8.7 非 vision 模型 fallback

- 图片上传仍显示在消息中。
- 若模型不支持 vision：
  - 如可 OCR，则抽取图片文字参与分析。
  - 如是图表，提示“当前模型无法直接理解图片，可切换支持图片的模型或补充文字说明”。
  - run event 记录 `parse_image` skipped，并写明 fallback。

### 8.8 附件安全扫描

- 文本类继续复用 `scanCodeSafety`，检测密钥、token、密码、私钥。
- 图片扫描 metadata，剔除 EXIF 中 GPS 等隐私字段。
- PDF 扫描页数、嵌入脚本、可疑对象，MVP 可先只允许文本抽取。
- blocked 附件不可提交 run。
- warning 附件可提交，但 message 和 event 明示风险。

### 8.9 消息气泡展示

- 用户消息正文下显示附件卡片。
- 图片显示缩略图，代码/日志显示文件图标、扩展名、大小、解析状态。
- 点击可打开预览 modal 或右侧 ArtifactViewer，不改变主布局。

### 8.10 附件与 Run 的关联

- `AiMessageAttachment` 关联消息。
- `AiRun.inputSnapshot.attachmentIds` 固化本次 run 使用的附件列表。
- 可选新增 `AiRunAttachment`，用于记录 run 实际读取、忽略、fallback 的附件。
- RunEvent 中记录 `read_attachment`、`parse_text`、`parse_image`。

## 九、异步任务和过程事件

### 9.1 RunEvent 类型

建议标准事件：

- `queued`：任务已进入队列。
- `upload_received`：已收到附件。
- `read_attachment`：读取附件 metadata 或正文。
- `parse_text`：解析代码/日志/文本/PDF 文本。
- `parse_image`：生成缩略图、OCR 或 vision 输入。
- `detect_platform`：识别 PTrade / JoinQuant / QMT 平台信号。
- `analyze_code`：扫描函数、调度、数据接口、下单接口和风险点。
- `generate_plan`：整理生成/转换/解析计划。
- `call_model`：调用模型。
- `stream_output`：接收模型输出，可按片段更新 message。
- `validate_result`：校验 JSON、空结果、截断、重复块、平台一致性。
- `create_artifact`：保存代码、报告、说明、风险提示。
- `completed`：任务完成。
- `failed`：任务失败。
- `cancelled`：任务取消。

### 9.2 不展示隐私思维链

禁止保存或展示模型原始 chain-of-thought。允许展示：

- 输入事实：读取了哪些附件。
- 程序事实：识别到哪些函数/API/平台信号。
- 处理摘要：正在合并结果、校验输出。
- 可验证结果：生成了哪些 artifact。
- 风险提示：哪些内容需要人工复核。

### 9.3 折叠/展开

- 默认：运行中展开，完成后折叠。
- Summary 文案：`已完成 · 用时 42s · 生成 3 个产物`。
- 展开后按事件时间展示。
- 失败时默认展开到失败事件。

### 9.4 取消、重试、恢复

- 取消：写 `cancelRequestedAt`，runner 在阶段边界检查；若 provider 无法中断，则 UI 显示“已请求取消，等待当前模型调用返回”。
- 重试：复制 inputSnapshot、attachments、uiState，新建 run attempt。
- 恢复：刷新页面后根据 conversation summary 找 latest run，再拉 run status 和 events。
- 多端：同一 conversation 可轮询或 SSE 订阅同一 run events。

### 9.5 与现有代码映射

- `ai-task-runner.ts` 的 schedule 入口写 `queued`。
- `runAiTask` 更新 RUNNING 写 `call_model` 或前置事件。
- `resolveInputFile` 写 `read_attachment` / `parse_text`。
- `code-chunking.ts` 的 scanning/chunking/processing/merging/validating 直接写对应事件。
- `createAssistantMessageForTask` 后写 `create_artifact` 和 `completed`。
- `cancelAiTaskForUser` 写 `cancelled`。

## 十、最近对话性能优化

### 10.1 Summary 查询

- 最近列表只读 `AiConversation` summary 字段。
- 不查 messages、events、artifacts 正文。
- 代码转换/解析也必须进入 `AiConversation`，避免 tasks fallback。

### 10.2 Cursor 分页

- 使用 `(lastMessageAt, id)` cursor。
- limit 默认 20，侧边栏只取 5-10。
- 不返回 total 和 totalPages。

### 10.3 轻量字段

最近 item 字段固定控制在 1 KB 内：

- title
- mode
- lastMessagePreview
- lastRunStatus
- platform pair
- counts
- lastMessageAt

### 10.4 大结果懒加载

- Artifact 正文点击 tab 时加载。
- 完整 message history 进入会话后加载最近 20 条。
- 历史消息向上滚动加载。
- 文件正文点击预览时加载。

### 10.5 消息分页

- `GET messages?cursor&limit&direction`
- 新消息用 `afterSeq` 或 `createdAt/id` 增量拉。
- 不一次性查 30 tasks + result。

### 10.6 Hover / Prefetch

- 侧边栏 hover 最近项时预取 conversation summary。
- 点击后先路由跳转并用 summary 恢复页面 skeleton。
- 再并行拉 messages、latestRun、artifacts summary。

### 10.7 前端缓存

- 用 React state 或 SWR/自研 cache 缓存 conversation summary。
- `AppShell` 刷新最近列表时不清空当前缓存，避免闪烁。
- run status 短轮询只更新对应 run。

### 10.8 数据库索引

必须新增/调整：

- `ai_conversations(user_id, status, last_message_at desc, id desc)`
- `ai_conversations(user_id, mode, status, last_message_at desc, id desc)`
- `ai_messages(conversation_id, created_at desc, id desc)`
- `ai_run_events(run_id, seq)`
- `ai_artifacts(conversation_id, updated_at desc)`
- `ai_message_attachments(message_id, display_order)`

### 10.9 避免阻塞首屏

点击最近对话流程：

1. 立即路由到对应模块。
2. 先展示 summary 和已有缓存。
3. 页面恢复平台、tabs、标题。
4. 异步加载 artifacts summary。
5. 异步加载 messages。
6. 用户打开结果 tab 时加载 artifact 正文。

## 十一、迁移策略

### 11.1 兼容现有模型

- 保留现有 `AiConversation` / `AiMessage` / `AiTask` / `AiTaskResult` / `UploadedFile`。
- 新字段 nullable。
- 新表按能力逐步增加。
- API 保持旧 `/api/v1/ai/tasks` 可用，同时新增 `/api/v1/ai/runs`。

### 11.2 老数据补 conversation mode

- `strategy_generation` 且已有 conversation：保持。
- `strategy_generation` 无 conversation：按 task 创建 `mode=strategy` conversation。
- `code_conversion`：创建 `mode=convert` conversation。
- `code_analysis`：创建 `mode=analysis` conversation。
- title 规则：
  - prompt preview 优先。
  - 转换：`{sourcePlatform} 转 {targetPlatform}`。
  - 解析：`{sourcePlatform} 代码解析`。

### 11.3 旧 UploadedFile 兼容新附件模型

- 旧 `UploadedFile` 作为 `AttachmentFile` metadata 使用。
- `contentText` 保留。
- 新增 nullable `kind/storageKey/thumbnailFileId/contentJson/updatedAt`。
- 对 task.inputFileId 建 `AiMessageAttachment`。

### 11.4 新增表还是改造旧表

建议：

- 阶段 1：改造旧表，补字段。
- 阶段 3：新增 `AiMessageAttachment`。
- 阶段 5：新增 `AiRunEvent`。
- 阶段 5/6：新增 `AiArtifact`。
- 是否新增 `AiRun` 延后，先以 `AiTask` 兼容。

### 11.5 避免大爆炸改造

- 先把数据写全，再切 UI 读取。
- 先 summary 快速恢复，再消息分页。
- 先文本附件卡片，再图片 vision。
- 先轮询 events，再 SSE。
- 先 mock/database repository 同步，再开启页面改造。

### 11.6 mock/database repository 同步

每新增接口必须同步：

- `LightQuantRepository` 类型定义。
- `DatabaseLightQuantRepository` Prisma 实现。
- `MockLightQuantRepository` Map 实现。
- smoke 脚本覆盖 mock 和 database 两种模式。

### 11.7 Prisma migration 顺序

1. 给 `ai_conversations` 增加 summary/uiState/count/latestRun 字段和索引。
2. 给 `ai_messages` 增加 status/parentMessageId/runId/updatedAt 字段。
3. 给 `uploaded_files` 增加 kind/storage 字段，contentText 改 nullable 或新增内容表。
4. 新增 `ai_message_attachments`。
5. 新增 `ai_artifacts`。
6. 新增 `ai_run_events`。
7. 数据回填脚本。
8. 索引验证和 explain。
9. 后续可选新增 `ai_runs`。

## 十二、阶段计划与验收标准

### 阶段 1：统一会话结构和最近对话

- 改动范围：让三大模块提交时都创建/更新 conversation、message。
- 数据库改动：为 conversation 增加 `summary`、`lastMessagePreview`、`lastRunStatus`、`uiState`。
- API 改动：`POST /conversations`、`GET /conversations/{id}`、tasks 创建时支持 convert/analysis conversation。
- 前端改动：最近列表统一读 conversations；convert/analysis URL 支持 conversationId。
- 风险点：旧任务重复生成 conversation；幂等冲突。
- 测试重点：三类任务提交后都能出现在最近列表。
- 验收标准：最近列表同时出现策略、转换、解析；点击后能回到对应模块页面。

### 阶段 2：最近对话提速

- 改动范围：summary API、cursor 分页、懒加载消息和 artifact。
- 数据库改动：新增最近列表索引。
- API 改动：`GET /conversations?cursor&limit`；`GET /messages?cursor&limit`。
- 前端改动：AppShell 只取 summary；hover prefetch summary；点击后渐进加载。
- 风险点：分页游标错乱；旧 page API 兼容。
- 测试重点：1000+ conversations 列表查询耗时；点击首屏不等待大结果。
- 验收标准：最近列表接口 P95 < 150ms；点击最近对话 300ms 内进入页面 skeleton。

### 阶段 3：附件卡片与日志/代码文件展示

- 改动范围：message attachment 模型、附件卡片、文本/日志/代码预览。
- 数据库改动：新增 `AiMessageAttachment`；`UploadedFile.kind`。
- API 改动：上传返回 kind/preview；messages 返回 attachments summary；preview/download API。
- 前端改动：AttachmentPicker、AttachmentPreviewCard、MessageAttachmentList。
- 风险点：旧 `inputFileId` 与新 attachment 双写不一致。
- 测试重点：上传、blocked/warning、消息展示、预览下载权限。
- 验收标准：上传日志/代码后，对话消息中可见附件卡片，刷新后仍存在。

### 阶段 4：图片上传和 vision 调用

- 改动范围：图片上传、缩略图、vision provider payload、fallback。
- 数据库改动：UploadedFile 增加 thumbnail/storage/contentJson。
- API 改动：thumbnail API；upload 支持图片；run 创建支持 image attachments。
- 前端改动：图片附件卡片；不支持 vision 时提示。
- 风险点：图片隐私、base64 过大、provider capability 差异。
- 测试重点：PNG/JPG/WebP、大小限制、缩略图、vision/fallback。
- 验收标准：用户可上传回测图/截图，支持 vision 的模型能结合图片回答；不支持时有明确 fallback。

### 阶段 5：RunEvent 异步过程面板

- 改动范围：持久化事件流、RunProgressPanel、RunEventTimeline。
- 数据库改动：新增 `AiRunEvent`。
- API 改动：`GET /runs/{id}`、`GET /runs/{id}/events`、cancel/retry 统一到 runs。
- 前端改动：现有 `AiTaskProgressPanel` 改为 event 驱动，支持折叠展开。
- 风险点：事件写入过多；旧内存 progress 与新事件不一致。
- 测试重点：刷新恢复、失败事件、取消事件、分段处理事件。
- 验收标准：任务过程中可见 queued/read/parse/analyze/call/validate/create/completed 等事件，刷新不丢。

### 阶段 6：三大模块统一接入 Workbench

- 改动范围：抽 `WorkbenchShell`、统一 composer/attachment/run/artifact 结构。
- 数据库改动：可选新增 `AiArtifact` 完整接入。
- API 改动：artifact summary/detail API；conversation uiState 更新 API。
- 前端改动：StrategyResultView、CodeConversionResultView、CodeAnalysisResultView 统一产物读取。
- 风险点：抽象过度导致业务页面变形。
- 测试重点：三大模块视觉回归、最近恢复、tabs、继续追问。
- 验收标准：视觉风格不变；底层统一；三大模块结果都可从最近对话恢复。

## 十三、测试方案

### 13.1 单元测试

- task type 与 conversation mode 映射。
- conversation title/summary 生成。
- RunEvent 追加 seq。
- attachment kind/mime/ext 识别。
- provider capability 判断。
- 非 vision fallback。
- artifact 从 AiTaskResult 映射。

### 13.2 API 测试

- 创建会话。
- 最近列表 cursor 分页。
- 获取 summary 不返回大字段。
- 获取 messages 分页。
- 上传附件、预览、下载。
- 创建 run、查询状态、events 增量。
- cancel/retry。
- artifact summary/detail。
- 归档/删除权限。

### 13.3 数据迁移测试

- 旧 strategy conversation 不重复。
- 旧 code_conversion task 补 conversation。
- 旧 code_analysis task 补 conversation。
- 旧 inputFileId 补 message attachment。
- UploadedFile contentText nullable 后旧数据可读。
- rollback 演练。

### 13.4 前端交互测试

- 三大模块提交任务。
- 最近列表点击恢复。
- summary 先渲染、messages 后加载。
- tabs 状态恢复。
- 附件卡片展示和删除。
- ArtifactViewer 打开/复制/下载。

### 13.5 附件上传测试

- `.py`、`.txt`、`.log`、`.md`。
- 超大文件报错。
- 空文件报错。
- GBK/UTF-8。
- 风险字段 warning/blocked。
- 下载权限隔离。

### 13.6 图片理解测试

- PNG/JPG/WebP。
- 超大图片压缩。
- thumbnail 生成。
- vision 模型调用。
- 非 vision fallback。
- EXIF 清理。

### 13.7 最近对话性能测试

- 100、1000、10000 conversations。
- summary query explain。
- P95 延迟。
- 点击首屏渲染时间。
- 大 artifact 存在时最近列表不变慢。

### 13.8 任务取消/重试/刷新恢复测试

- queued 取消。
- running 取消。
- provider 超时失败。
- failed retry。
- cancelled retry。
- 刷新页面后继续显示 running events。
- 同一 run 多次轮询不重复写事件。

### 13.9 三大模块回归测试

- 策略生成：继续追问、上传日志、生成代码、积分扣除。
- 代码转换：平台选择、输入代码/文件、三 tabs、风险提示。
- 代码解析：平台选择、报告 tabs、结构化内容。
- AppShell：导航 active、最近列表、登录态、积分刷新。

## 十四、风险与取舍

### 14.1 为什么不直接替换成 LibreChat / Open WebUI

- LightQuant 是垂直量化工具，不是通用聊天平台。
- 当前业务入口、平台选择、代码转换 tabs、解析报告结构、积分体系、风险提示都与量化场景强绑定。
- LibreChat/Open WebUI 的视觉和交互密度会改变 LightQuant 现有品牌气质。
- 直接替换会引入大量无关能力：多模型市场、通用 agent、通用 RAG、复杂权限/插件系统，增加维护成本。
- 本项目已有 Next.js + Prisma + repository + AI task runner 基础，渐进升级成本更低。

### 14.2 为什么保留 LightQuant 当前业务模块

- 用户心智清晰：策略生成、代码转换、代码翻译解析是三个明确业务场景。
- 当前页面已经贴合量化工作流：平台选择、代码输入、结果 tabs、风险提示。
- 会话化应服务业务恢复，而不是把所有场景压成通用聊天。
- 保留模块能降低迁移风险，避免视觉和使用习惯突变。

### 14.3 MVP 先做能力

- 三大模块统一写入 conversation。
- 最近列表统一 summary + cursor。
- 点击最近对话恢复原模块。
- 文本/代码/日志附件卡片。
- `AiMessageAttachment`。
- `AiArtifact` 保存最终结果。
- `AiRunEvent` 基础事件流。
- 刷新恢复 running 状态。

### 14.4 二期能力

- 图片 vision。
- PDF/OCR。
- SSE 流式事件和输出。
- 多任务并行队列。
- 对象存储/S3/R2。
- Conversation 搜索。
- Artifact 版本对比。
- 项目级文件上下文。
- 更完整的 RAG/知识库。

### 14.5 开源项目参考边界

- LibreChat：参考 conversation/message/files/reasoning/resumable/artifact 机制，不参考其 ChatGPT clone 视觉。
- Open WebUI：参考自托管模型适配、files/chats/chat_messages 分层、RAG 和工具调用，不参考其通用 AI 面板视觉。
- Magentic-UI：参考 run/input/approval/continuation/pause/cancel 的 Agent 过程控制，不照搬浏览器自动化 UI。
- Claude Code UI / CloudCLI 类项目：参考任务过程可追溯、文件上下文、用户中断恢复，不把 LightQuant 改成终端或 IDE 风格。

## 结论

LightQuant 的重构方向不是“大改 UI”，而是在现有专业量化工具风格下，把三大模块从单次任务页面升级为统一的 AI Workbench 会话工作台。核心路径是：

1. Conversation 统一三大模块。
2. MessageAttachment 解决附件可见性。
3. UploadedFile 升级支持文本、日志、代码、图片和 PDF 扩展。
4. AiTask 兼容演进为 Run。
5. RunEvent 让过程可追踪、可恢复。
6. AiArtifact 让结果可保存、可恢复、可复用。
7. 最近对话只查 summary，首屏先打开，再渐进加载大内容。

这样既能吸收 LibreChat、Open WebUI、Magentic-UI 的成熟架构经验，又不会让 LightQuant 偏离自身的量化业务形态和现有品牌视觉。
