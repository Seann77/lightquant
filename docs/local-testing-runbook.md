# LightQuant 本地验收 Runbook

本文只记录本地开发和验收命令，不包含任何密钥、数据库密码、模型 Key 或真实连接串。

## 当前推荐入口

本地站点默认使用：

```bash
npm run dev:3010
```

访问：

```text
http://127.0.0.1:3010
```

启动后优先运行本地可用性检查：

```bash
npm run verify:local
```

该命令会顺序检查本地配置、数据库握手、TypeScript 类型和核心页面入口，不写业务数据、不调用真实模型、不触发真实支付。
如果本地 dev server 没有启动，它会先停在站点预检，并提示运行 `npm run dev:3010`。
如果服务不在 3010 端口，可以通过 `PORT=3000 npm run verify:local` 或 `SMOKE_BASE_URL=http://127.0.0.1:3000 npm run verify:local` 覆盖。
`verify:local` 的站点预检会在 60 秒内重试，以兼容 Next dev 首次编译页面较慢的情况。如需调整，可使用 `VERIFY_LOCAL_PREFLIGHT_TIMEOUT_MS` 和 `VERIFY_LOCAL_PREFLIGHT_INTERVAL_MS`。

如果需要强制使用 mock 数据、mock 短信和 mock 支付，可以启动：

```bash
npm run dev:mock:3010
```

如果需要使用真实 PostgreSQL 数据库，并继续使用 mock 短信和 mock 支付做 MVP 闭环，可以启动：

```bash
npm run dev:database:mock:3010
```

## 不消耗模型额度的回归

优先运行一键低成本回归：

```bash
npm run smoke:local:regression
```

这个命令要求本地 dev server 已经启动，默认访问 `http://127.0.0.1:3010`。它会顺序运行数据库连接、AI 配置、支付、文件上传和后台权限相关 smoke，但不会主动调用真实大模型，也不会调用真实支付渠道。

如果只想拆开跑，可以使用：

```bash
npm run check:db
npm run check:ai
npm run check:env-example
npm run check:legacy-ai
npm run check:deploy
npm run check:secrets
npm run smoke:ui:pages
npm run smoke:ai:config-check
npm run smoke:payment:regression
npm run smoke:files:local
npm run smoke:admin:local
```

如果只想快速确认核心页面入口没有“服务不可用”之类的渲染回归，可以单独运行：

```bash
npm run smoke:ui:pages
```

该命令只请求本地页面并检查关键文案，不登录、不提交表单、不写业务数据、不调用真实模型或真实支付。

## AI Workbench 专项验收

阶段 1-6 的 Workbench 验收说明见 [lightquant-ai-workbench-implementation-status.md](./lightquant-ai-workbench-implementation-status.md)。本地复跑时建议先启动数据库模式和 mock 外部服务：

```bash
npm run dev:database:mock:3010
```

然后按顺序运行：

```bash
npm run smoke:ai:workbench
npm run smoke:ai:events
npm run smoke:files:local
npm run smoke:files:image
npm run smoke:ai:three
npm run smoke:ui:pages
```

这些脚本覆盖三类 AI 任务、最近对话恢复、附件/图片上传、RunEvent 时间线和核心页面入口。`smoke:ai:three` 会创建三类任务；在真实 provider 配置下会消耗模型额度和业务积分，在 mock 服务模式下用于低成本回归。

## 会消耗 MiMo 额度的 AI 验收

当前真实模型配置为 OpenAI-compatible MiMo Pro 时，以下命令会调用真实模型并按业务规则扣积分。

只验证一次策略生成：

```bash
npm run smoke:ai:local
```

预期消耗：策略生成 50 积分。

一次验证三类核心任务：

```bash
npm run smoke:ai:three
```

预期消耗：

- 策略生成：50 积分
- 代码解析：100 积分
- 平台转换：200 积分

三项合计 350 积分。脚本只输出任务状态、模型名、`scopeStatus`、`tokenUsage`、结果长度和扣费前后余额，不输出完整模型回复、API Key、数据库连接串或其他密钥。

最近一次本地真实模型验收结论：

- 当前真实模型配置：`openai_compatible` + `mimo-v2.5-pro`
- 策略生成已真实跑通，扣 50 积分，`ai_tasks`、`ai_task_results`、`credit_ledger` 均已持久化。
- 代码解析已真实跑通，扣 100 积分，返回 `reportJson`、风险提示和 tokenUsage。
- 平台转换已真实跑通，扣 200 积分，返回转换代码、迁移说明、风险提示和 tokenUsage。
- 三类任务的积分流水均为 `scene=ai_task`、`type=consume`、`direction=out`，幂等键形态为 `ai_task_cost:{taskId}`。
- `smoke:ai:three` 已加入硬断言：价格、`scopeStatus`、模型名、`tokenUsage.totalTokens` 和结果输出字段缺失时会失败。

## 数据库与持久化

检查 `.env.local` 中的数据库连接是否可用：

```bash
npm run check:db
```

该命令会显式读取 `.env` 和 `.env.local`，但只输出脱敏后的连接形态和握手结果，不输出完整 `DATABASE_URL` 或密码。

真实数据库初始化或更新：

```bash
npm run db:migrate
npm run db:seed
```

database 模式下的业务闭环 smoke：

```bash
npm run smoke:database:local
```

如需在 database 模式下同时验证真实 AI 扣费：

```bash
SMOKE_DB_INCLUDE_AI=true npm run smoke:database:local
```

开启 `SMOKE_DB_INCLUDE_AI=true` 时，如果服务端配置的是真实模型 provider，会消耗一次策略生成额度。

## 静态检查

日常快速检查可以先运行：

```bash
npm run check:quick
```

这个命令不会创建 smoke 用户、订单、上传文件或 AI 任务，也不会调用真实模型或真实支付渠道。它会顺序检查编码、AI prompt、`.env.example`、旧 AI 配置残留、AI runner 自愈护栏、部署模板、仓库文本秘密扫描、runbook 命令一致性、当前 AI/支付配置、Prisma schema 和 TypeScript 类型。

改完代码后建议运行：

```bash
npm run check:encoding
npm run check:ai-prompts
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
```

如果只修改环境变量或连接配置，优先运行：

```bash
npm run check:db
npm run check:ai
npm run check:env-example
npm run check:payment
```

## 手动页面验收

1. 打开 `http://127.0.0.1:3010`。
2. 使用手机号登录；本地 mock 短信验证码为 `123456`。
3. 新用户登录后应获得 500 基础积分。
4. 在策略生成、代码解析、平台转换三个页面分别提交任务。
5. 成功后余额应分别减少 50、100、200 积分。
6. 打开 `/credits`，确认积分流水包含注册赠送、AI 消耗和充值流水。
7. 上传 `.py` 或 `.txt` 文件时，确认服务端返回扫描状态；BLOCKED 文件不能创建 AI 任务。
8. 管理员手机号在 `ADMIN_PHONE_WHITELIST` 中时，可以访问 `/admin`；普通用户不能看到后台数据。

## 重要提醒

- 不要提交 `.env.local`。
- 不要把 `DATABASE_URL`、`AUTH_SECRET`、AI Key、支付私钥写进文档或前端代码。
- 前端只能展示状态和发起请求，积分扣减、发放、支付到账和 AI 调用都必须由服务端完成。
- `return_url` 只用于支付完成后的页面展示，不能作为充值到账依据。
