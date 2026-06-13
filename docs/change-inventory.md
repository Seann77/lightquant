# LightQuant 变更清单

更新时间：2026-06-13

本文用于提交前审计和交接，不包含任何密钥、数据库连接串、模型 Key、短信 AccessKey 或支付私钥。

## 变更概览

当前工作区包含多阶段建设成果，主要覆盖：

- 真实数据库与 Prisma 持久化。
- 用户登录、协议同意、短信发送 provider。
- 积分账户、积分流水、积分预占、AI 扣费。
- 支付订单、支付宝/微信 provider、notify 验签与回归脚本。
- AI Skill 文件化、MiMo Pro OpenAI-compatible provider、异步 runner 自愈。
- 文件上传、服务端扫描、上传文件入库。
- 只读后台 MVP。
- 本地验收、部署、支付、AI、文件、后台相关 smoke/check 脚本。
- 本地测试、部署、支付和当前状态文档。

## 代码与配置

- `.env.example`：补齐数据库、短信、支付、AI、文件上传、后台管理员白名单等示例变量；不包含真实密钥。
- `package.json` / `package-lock.json`：新增 Prisma、PostgreSQL、二维码、短信 SDK 相关依赖和 check/smoke/dev 脚本。
- `next.config.ts`、`tailwind.config.ts`、`src/app/globals.css`：支撑当前 Next 16 前端页面、后台和弹窗 UI。
- `.editorconfig`、`.gitattributes`：约束 UTF-8、换行和文本文件编码，降低中文 skill 再次乱码的概率。

## 数据库

- `prisma/schema.prisma`：覆盖用户、验证码、积分账户、积分流水、积分预占、充值套餐、订单、支付交易、上传文件、AI 任务、AI 结果和协议同意记录。
- `prisma/seed.ts`：充值套餐 seed，可重复执行。
- `prisma/migrations/20260524000000_init`：初始核心业务表。
- `prisma/migrations/20260524001000_enable_rls_and_revoke_client_roles`：Supabase RLS/权限收口。
- `prisma/migrations/20260524002000_secure_prisma_migrations_table`：迁移表权限收口。
- `prisma/migrations/20260525001000_uploaded_files`：上传文件表。
- `prisma/migrations/20260526001000_payment_audit_fields`：支付交易审计字段。
- `prisma/migrations/20260609001000_user_legal_consents`：用户协议同意记录。
- `prisma/migrations/20260612054000_add_orders_plan_id_index`：订单套餐索引。

## 服务端业务

- `src/server/repositories/*`：mock/database repository 双实现、事务边界、分页查询和后台只读查询。
- `src/server/auth/*`：session、验证码登录、Aliyun SMS provider、协议同意记录。
- `src/server/credits/*`：积分账户、流水、预占、确认扣减、失败释放。
- `src/server/billing/*`：充值订单、状态流转、支付到账、过期关闭、幂等。
- `src/server/payments/*`：支付配置、paymentAction、mock/Alipay/WeChat provider、notify 解析校验。
- `src/server/ai/*`：AI 任务配置、异步 runner、provider 抽象、OpenAI-compatible MiMo provider、mock provider、skill 读取。
- `src/server/files/*`：文件解析、大小/扩展名限制、文本安全扫描、上传记录。
- `src/server/admin/*`：管理员手机号白名单鉴权和只读后台数据查询。

## 前端页面

- `src/components/AppShell.tsx`：服务端 `/me` 用户状态、积分刷新、登录/充值弹窗联动。
- `src/components/shell/LoginModal.tsx`：短信验证码登录、协议同意。
- `src/components/shell/RechargeModal.tsx`：服务端套餐、订单创建、paymentAction 展示、支付宝跳转、微信二维码、状态轮询。
- `src/app/chat/ChatClient.tsx`：策略生成和代码转换接入 AI 任务、文件上传、轮询、余额刷新。
- `src/app/code-analysis/CodeAnalysisClient.tsx`：代码解析接入 AI 任务、文件上传、轮询、余额刷新。
- `src/app/credits/CreditsClient.tsx`：积分账户、流水、支付 return_url 状态查询。
- `src/app/admin/*`：只读后台页面。
- `src/app/legal/*`：用户协议和隐私政策页面。

## 脚本

- `scripts/check-*.mjs` / `scripts/check-*.ts`：编码、AI prompt、旧模型防回退、AI runner、数据库、支付、部署模板、文档命令、秘密扫描等检查。
- `scripts/smoke-ai-*.mjs`：真实/配置 AI smoke；三任务 smoke 会调用真实模型并扣积分。
- `scripts/smoke-payment-*.mjs` / `.ts`：支付 action、notify、金额不匹配、过期、维护、配置保护等专项回归。
- `scripts/smoke-files-local.mjs`：文件上传和安全扫描回归。
- `scripts/smoke-admin-local.mjs`：后台权限回归。
- `scripts/smoke-local-regression.mjs`：低成本本地总回归，不调用真实模型或真实支付。
- `scripts/verify-local-ready.mjs`：本地恢复入口，检查站点、配置、数据库、TypeScript 和核心页面。
- `scripts/dev-*.mjs`：3010 本地启动脚本。

## 文档

- `docs/current-status.md`：当前能力、已验证证据、下一步建议和交付提醒。
- `docs/local-testing-runbook.md`：本地启动、检查、低成本回归和真实 AI 验收。
- `docs/payment-real-mvp-runbook.md`：真实支付 MVP 联调步骤。
- `docs/deployment-runbook.md`：Ubuntu 一键部署和生产环境边界。
- `docs/legal/*`：协议和隐私政策文案源。

## 提交前建议

提交或部署前建议至少运行：

```bash
npm run check:quick
npm run smoke:local:regression
npm run build
```

如果改动了支付相关代码，再运行：

```bash
npm run smoke:payment:regression
```

如果准备真实模型验收，并接受额度消耗，再运行：

```bash
npm run smoke:ai:three
```

## 注意事项

- 不要提交 `.env.local`。
- 不要提交真实 `DATABASE_URL`、`AUTH_SECRET`、AI Key、短信 AccessKey、支付私钥、证书或商户密码。
- 当前未跟踪文件中包含有效建设成果，不要批量删除。
- 真实支付仍需用商户环境完成小额订单 notify 闭环验收。
