# LightQuant

LightQuant 是一个面向量化策略研究者和个人开发者的 AI 策略工程工作台，重点覆盖 PTrade、聚宽 JoinQuant、QMT 等国内常见量化平台的策略代码生成、代码迁移和代码解读场景。

项目目标不是替代投资判断，而是把重复的策略工程工作沉淀为可审计、可回归、可持续维护的开源工具：用户可以用自然语言描述策略想法，上传已有策略代码或日志文件，让 AI 生成候选代码、解释交易逻辑、提示迁移风险，并通过积分、任务、文件和审计链路记录每次调用结果。

## 核心能力

- 策略生成与修改：根据自然语言需求生成或调整量化策略代码。
- 平台代码转换：支持在 PTrade、聚宽 JoinQuant、QMT 等平台之间迁移策略片段。
- 代码分析报告：解析策略结构、交易逻辑、关键参数、潜在风险和优化建议。
- AI Workbench：统一管理策略生成、代码转换、代码分析三类 AI 任务，并支持历史会话恢复。
- 文件输入：支持文本、代码、Markdown、日志和图片附件的上传、预览与服务端安全扫描。
- 积分账本：对 AI 任务做积分预占、成功扣费、失败释放，避免重复扣费。
- 支付骨架：包含支付宝、微信支付 provider、notify 路由、签名校验和幂等保护的 MVP 链路。
- 只读后台：提供用户、订单、AI 任务、上传文件和基础统计的管理入口。
- 本地回归脚本：覆盖配置、编码、密钥扫描、AI runner、支付 notify、文件上传和核心页面可用性。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma 7
- PostgreSQL / Supabase PostgreSQL
- OpenAI-compatible AI provider abstraction
- 支付宝、微信支付 provider 骨架

## 项目结构

```text
src/app/                 Next.js 页面和 API 路由
src/components/          前端组件、Workbench、Shell 和通用 UI
src/server/              认证、AI、积分、支付、文件、仓储和后台服务
src/server/ai/skills/    策略生成、代码转换、代码分析三类 AI Skill
prisma/                  Prisma schema、迁移和 seed
scripts/                 本地检查、smoke test 和部署前验证脚本
docs/                    路线图、部署说明、支付联调和当前状态文档
deploy/                  Ubuntu 一键部署脚本
```

## 本地运行

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量模板并按需填写本地配置：

```bash
cp .env.example .env.local
```

3. 生成 Prisma Client：

```bash
npm run db:generate
```

4. 启动本地开发服务：

```bash
npm run dev:3010
```

如需使用数据库模式并 mock 外部服务：

```bash
npm run dev:database:mock:3010
```

## 常用验证命令

```bash
npm run check:quick
npm run check:secrets
npm run typecheck
npm run db:validate
npm run smoke:ui:pages
npm run smoke:local:regression
npm run build
```

其中 `check:secrets` 用于在公开仓库前扫描常见密钥、数据库连接串、支付私钥和模型 Key 泄露风险。

## 安全与边界

- `.env.local`、真实数据库连接串、模型 Key、短信 AccessKey、支付私钥和生产凭据不应进入仓库。
- AI 输出仅用于学习、研究和工程辅助，不构成投资建议。
- 策略代码在投入实盘前必须经过人工审阅、回测、风控评估和小规模验证。
- 当前支付链路仍以 MVP 骨架和本地回归为主，真实商户环境需要继续联调。
- 当前文件存储适合单实例 MVP，正式多实例部署前建议迁移到对象存储。

## 路线图

- 完成真实支付宝或微信小额订单端到端验收。
- 增加后台审计日志和受控手动补偿能力。
- 引入队列或 Worker，将长耗时 AI 任务从 Web 请求生命周期中拆出。
- 将上传文件迁移到 Supabase Storage 或兼容对象存储。
- 继续迭代三类 AI Skill 的输出稳定性、JSON 成功率和策略迁移质量。

## 维护目标

LightQuant 希望成为一个围绕中文量化策略开发工作流的公开样例项目：既展示 AI coding / AI review 在真实业务代码里的落地方式，也沉淀量化策略生成、代码迁移、结果审计和本地回归的工程实践。
