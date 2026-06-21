# LightQuant 当前状态

更新时间：2026-06-14

本文只记录项目交接状态和验收入口，不包含任何密钥、数据库密码、模型 Key、支付私钥或真实连接串。

## 当前可用能力

- AI Workbench 阶段 1-6 已完成：三类任务统一写入 `AiConversation`，最近对话轻量化，消息分页，附件卡片，图片上传/vision fallback，RunEvent 时间线，`uiState` active tab 恢复，以及三大模块共享恢复层。详见 [lightquant-ai-workbench-implementation-status.md](./lightquant-ai-workbench-implementation-status.md)。
- 用户登录/session、用户状态、用户协议同意记录。
- Supabase PostgreSQL 持久化数据层。
- 积分账户、积分流水、新用户 500 积分赠送。
- 充值套餐、充值订单、订单状态、paymentAction、支付宝/微信 provider 骨架和 notify 链路。
- 文件上传、`.py` / `.txt` 解析入库、服务端安全扫描。
- AI 任务、积分预占/确认扣费/失败释放、任务结果、任务历史。
- AI 任务异步 runner 已具备 MVP 自愈能力：卡住的本地运行记录会按超时替换，旧 `RUNNING` 任务在轮询时会重新调度，确认扣费前会二次检查任务状态以避免重复扣费。
- 三类 AI Skill 文件化管理：策略生成、代码解析、平台转换。
- 真实 MiMo Pro 调用已跑通，当前配置形态为 `openai_compatible + mimo-v2.5-pro`。
- 只读后台 MVP：用户、订单、AI 任务、上传文件、概览统计。

## 当前仍是 mock 或待联调的边界

- 支付宝/微信真实商户回调仍需按真实渠道环境继续联调。
- 微信 Native 已有 provider 与签名/notify 骨架，但尚未完成真实商户端到端支付验收。
- mock SMS 仍可用于本地测试；生产短信需使用已配置的 Tencent Cloud SMS provider。
- 没有队列/Worker，AI 任务当前仍由服务端进程内异步 runner 执行；该能力适合 MVP，不等同于生产级持久队列。
- 文件内容当前保存到数据库；后续可迁移到 Supabase Storage 或对象存储。
- 没有退款、发票、后台手动补偿、审计日志、用户可见的任务重试/取消。

## 已验证的关键证据

- `npm run check:quick` 已通过：编码、AI prompt、`.env.example`、旧 AI 配置残留、AI runner 自愈护栏、部署模板、秘密扫描、文档命令、AI/支付配置、Prisma schema、TypeScript。
- `npm run check:ai-runner` 已通过：覆盖 runner 超时保护、旧 `RUNNING` 任务恢复、轮询结果接口再调度、确认扣费前二次状态检查。
- `npm run smoke:local:regression` 已通过：数据库握手、AI 配置防回退、支付回归、文件上传、安全扫描、后台权限。
- `npm run smoke:payment:regression` 已通过：覆盖支付宝 `redirect` action、微信 `qr_code` action、签名 notify 模拟、金额不匹配保护、重复通知幂等、过期订单和维护接口权限。
- `npm run smoke:ui:pages` 已通过：策略生成、代码转换、代码解析、积分页和后台登录拦截页均能返回 200，并且没有出现“服务不可用”文案。
- `npm run check:secrets` 已通过：仓库文本未发现密钥、数据库连接串、支付私钥或模型 Key 泄露。
- `npm run check:deploy` 已通过：一键部署脚本仍符合生产环境边界检查，生产路径不允许 mock 数据层、mock 支付或 mock AI。
- `npm run build` 已通过。
- `http://127.0.0.1:3010/` 已确认返回 200。
- `npm run verify:local` 已通过，且站点预检支持 60 秒内重试，避免 Next dev 首次编译期间误报不可用。
- 三类真实 AI 任务已使用 MiMo Pro 跑通并持久化：
  - 策略生成：扣 50 积分，记录 `tokenUsage` 和 `credit_ledger`。
  - 代码解析：扣 100 积分，返回 `reportJson`、风险提示和 `tokenUsage`。
  - 平台转换：扣 200 积分，返回转换代码、迁移说明、风险提示和 `tokenUsage`。

## 推荐日常命令

部署路径说明见：

- [deployment-runbook.md](./deployment-runbook.md)

恢复本地项目时优先运行，确认配置、数据库握手、TypeScript 和核心页面入口：

```bash
npm run verify:local
```

如果本地 dev server 没有启动，这条命令会先停在站点预检，并提示运行 `npm run dev:3010`。

不写业务数据、不调用真实模型、不触发真实支付的纯检查集合：

```bash
npm run check:quick
```

完整低成本回归，会创建 smoke 测试用户、订单和文件记录，但不调用真实模型或真实支付：

```bash
npm run smoke:local:regression
```

支付链路专项回归，不连接真实支付宝/微信，但会验证 provider action、签名 notify 模拟、幂等和异常保护：

```bash
npm run smoke:payment:regression
```

只检查核心页面入口是否能正常返回，不登录、不写数据：

```bash
npm run smoke:ui:pages
```

真实 AI 三任务验收，会调用 MiMo Pro 并按业务规则扣 350 积分：

```bash
npm run smoke:ai:three
```

生产构建检查：

```bash
npm run build
```

## 下一步建议

1. 继续支付宝真实支付联调：重点验证真实 notify 验签、订单 `PAID`、充值积分入账和重复通知幂等。
2. 做 AI Skill 效果迭代：重点优化 MiMo Pro 输出稳定性、JSON 成功率、平台策略代码质量。
3. 增加后台审计与手动补偿：只在账务规则完全清楚后开放写操作。
4. 引入队列/Worker：把 AI 长任务和支付维护任务从 Web 请求生命周期中拆出来。
5. 文件迁移对象存储：数据库保留元数据、hash、扫描结果和审计字段。

## 交付前提醒

- 当前工作区包含大量未提交的阶段性成果，包括迁移、脚本、文档、AI runner、Skill 文件化、支付、上传和后台相关源码；不要把未跟踪文件当作临时垃圾删除。
- 提交或部署前建议先运行 `git status --short`，按阶段核对变更范围，再运行 `npm run check:quick`、`npm run smoke:local:regression` 和 `npm run build`。
- `.env.local`、数据库连接串、`AUTH_SECRET`、AI Key、支付私钥和短信 AccessKey 仍然只应存在于本地或部署环境变量中，不应进入仓库。
