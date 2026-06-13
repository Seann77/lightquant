# LightQuant AI Workbench 实施状态

更新时间：2026-06-14

本文记录 AI Workbench 阶段 1-6 的完成范围、阶段 7 验收命令、生产部署注意事项和剩余风险。不包含任何密钥、数据库连接串、模型 Key、支付凭证或真实用户数据。

## 已完成范围

- 阶段 1：`strategy_generation`、`code_conversion`、`code_analysis` 三类任务统一写入 `AiConversation`；用户消息和助手消息通过 `AiMessage.contentJson` 保存 task/result/error 恢复数据。
- 阶段 2：最近对话轻量化；`/api/v1/ai/conversations` 支持 cursor `limit/cursor` 和旧版 `page/pageSize`，cursor 模式不强制 `count(*)`。
- 阶段 2：消息接口增加加载控制；`/api/v1/ai/conversations/[conversationId]/messages` 支持 `limit`、`cursor`、`direction`、`taskLimit`、`includeTaskResults`。
- 阶段 3：新增 `AiMessageAttachment`；文本、代码、日志、Markdown 上传文件可以在消息中展示附件 summary，并保留旧 `contentJson.inputFileId` fallback。
- 阶段 4：支持 `.png`、`.jpg`、`.jpeg`、`.webp` 图片上传；图片保存到 `FILE_STORAGE_ROOT` 指向的服务端私有本地目录；新增鉴权 preview/thumbnail 接口；provider 不支持 vision 时走 fallback。
- 阶段 5：新增 `AiRunEvent` 和 `/api/v1/ai/tasks/[taskId]/events`，三大模块都可以恢复可见的任务过程时间线。
- 阶段 6：抽出轻量 Workbench 结构层和共享前端能力，包括 conversation restore hook/client、附件卡片、结果视图、Workbench shell、RunEvent timeline。
- 阶段 6：新增 `AiConversation.uiState`，用于保存 active tab 等轻量 UI 状态。

## 当前恢复模型

当前未引入 `AiArtifact`，也未引入独立 `AiRun` 表。Workbench 状态恢复依赖：

- `AiConversation`：mode、title、source/target platform、status、时间戳和 `uiState`。
- `AiMessage`：用户/助手历史、task 关联和 `contentJson` 快照。
- `AiTask` / `AiTaskResult`：最近任务状态和结果 payload。
- `AiMessageAttachment`：消息与上传文件的显式关联。
- `UploadedFile`：附件 metadata 和文本 preview；图片二进制不会进入 conversation API。
- `AiRunEvent`：公开可见的任务过程事件。

## 已核对 API 预期

- `/api/v1/ai/conversations` 只返回 conversation summary，不包含 messages、大结果、文件正文、图片 base64 或 events。
- `/api/v1/ai/conversations/[conversationId]` 返回鉴权后的单个 conversation summary，并支持小范围 `PATCH` 更新 title/platform/uiState。
- `/api/v1/ai/conversations/[conversationId]/messages` 返回受限 messages、受限最近 tasks、可选 latest/all task result，以及附件 summary。
- `/api/v1/ai/tasks` 保持旧创建、幂等、积分预占、异步 runner、轮询流程兼容。
- `/api/v1/ai/tasks/[taskId]/result` 保持旧轮询/result 响应兼容，并继续返回 conversation/messages/events 快照。
- `/api/v1/ai/tasks/[taskId]/events` 返回鉴权后的公开 RunEvent，支持 `afterSeq` 和 `limit`。
- `/api/v1/files` 对文本/代码上传保持兼容；图片字段是向后兼容的增量字段。
- `/api/v1/files/[fileId]/preview` 和 `/api/v1/files/[fileId]/thumbnail` 必须校验 owner，且不会被最近对话 summary 内联加载。

## 生产部署注意事项

- `FILE_STORAGE_ROOT` 默认是 `.lightquant/uploads`。生产部署必须把该目录挂到持久化磁盘，或显式设置到其他服务端私有持久目录。
- 多实例部署前需要共享文件卷，或先迁移到对象存储；否则不同实例之间无法读取彼此写入的图片文件。
- `.lightquant/uploads` 已被 git 忽略。备份、保留周期和删除策略需要由部署环境或运维脚本负责。
- 当前 thumbnail 能力复用原图作为预览源，还没有真正的缩略图压缩流水线。
- `FILE_UPLOAD_MAX_BYTES` 默认 `1048576`，用于文本/代码/日志/Markdown 文件。
- `FILE_IMAGE_UPLOAD_MAX_BYTES` 默认 `8388608`，用于图片文件。
- vision 能力取决于 provider 配置。可使用 `AI_SUPPORTS_VISION` 显式配置，或使用可被识别为 vision-capable 的模型名；非 vision provider 会继续处理文字输入，并在结果中说明图片未参与模型理解。
- 新库迁移顺序需要包含：`20260613043000_ai_conversations`、`20260613110000_ai_message_attachments`、`20260613123000_uploaded_file_image_metadata`、`20260613133000_ai_run_events`、`20260614093000_ai_conversation_ui_state`。

## 明确未实现事项

- `AiArtifact`
- 独立 `AiRun` 表
- SSE 或流式 UI
- 多任务并行 Workbench
- 对象存储 provider 接入
- 真缩略图压缩流水线
- PDF 上传、OCR 或文档理解
- 复杂 RAG、搜索、artifact 版本管理、对比或下载中心
- 视觉重做，或改成 LibreChat/Open WebUI 风格

## 阶段 7 验收命令

本阶段建议按以下顺序验收：

```bash
npm run typecheck
npm run db:validate
npm run db:migrate
npm run smoke:ai:workbench
npm run smoke:ai:events
npm run smoke:files:local
npm run smoke:files:image
npm run smoke:ai:three
npm run smoke:ui:pages
npm run check:quick
```

smoke 脚本默认访问 `http://127.0.0.1:3010`，除非设置 `SMOKE_BASE_URL`。低成本本地验收可先启动数据库模式并使用 mock 外部服务：

```bash
npm run dev:database:mock:3010
```

## 建议手动验收路径

1. 在 `/chat?mode=strategy` 创建策略任务，分别覆盖纯文本、代码/文本/日志附件、图片附件。
2. 从侧边栏最近列表打开该策略 conversation，确认聊天消息、附件、图片预览、结果和 RunEvent timeline 可恢复。
3. 在 `/chat?mode=convert` 创建转换任务，切换结果 tab 后从最近列表恢复，确认平台、输入来源、active tab、结果和事件过程都恢复。
4. 在 `/code-analysis` 创建解析任务，切换结果 tab 后从最近列表恢复，确认平台、输入来源、active tab、结果和事件过程都恢复。
5. 检查最近列表接口响应仍然是 summary-only，不包含大 messages、task result 正文、文件正文、图片 base64 或 event list。

## 剩余风险与后续计划

- 本地图片存储适合 MVP 和单实例部署；进入多实例或弹性部署前，建议迁移图片二进制到托管对象存储，并在 PostgreSQL 中只保留 metadata。
- 当前没有自动化文件清理策略；长期运行前应补充运维 runbook 或定时清理任务。
- `AiTaskResult` 与 `AiMessage.contentJson` 足够支撑当前恢复；若后续需要结果产物版本、导出、对比或下载中心，再引入最小 `AiArtifact`。
- RunEvent 当前通过 HTTP 轮询获取；如果长任务需要更低延迟进度，再考虑 SSE。
- provider 能力识别保持保守；生产环境建议固定 provider/model 组合，并显式验收 vision 能力。
