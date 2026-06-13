# LightQuant 真实支付 MVP 联调 Runbook

本文记录真实支付接入前后的本地和测试环境验收步骤，不包含任何支付密钥、私钥、证书、数据库连接串或真实商户敏感信息。

## 当前支付能力边界

已经具备：

- 统一 `paymentAction`
- `mock`：本地开发模拟支付
- `redirect`：支付宝跳转支付
- `qr_code`：微信 Native 扫码支付
- 服务端创建订单，金额和积分来自充值套餐快照
- 支付宝 notify route：`POST /api/v1/payments/alipay/notify`
- 微信 notify route：`POST /api/v1/payments/wechat/notify`
- notify 验签成功后才允许标记订单 `PAID` 并写入充值积分流水
- 重复 notify 不重复发积分
- 金额不匹配、订单关闭、订单过期、订单失败时不发积分
- 前端只打开收银台、展示二维码、轮询支付状态，不直接改订单或发积分

仍不包含：

- 退款
- 发票
- 手动改账
- 支付渠道账单对账
- 队列或 Worker
- 真实支付生产压测

## 配置检查

读取当前支付配置并做脱敏检查：

```bash
npm run check:payment
```

强制检查某个渠道：

```bash
npm run check:payment -- --mode=alipay
npm run check:payment -- --mode=wechat
npm run check:payment -- --mode=mock
```

生产环境 mock 防护检查：

```bash
NODE_ENV=production npm run check:payment -- --mode=mock
```

预期应失败，并提示生产环境不能使用 mock 支付。

## PaymentAction 预检

不创建真实订单、不写数据库、不发积分的 provider 形态检查：

```bash
npm run check:payment-action -- --mode=alipay
npm run check:payment-action -- --mode=wechat
npm run check:payment-action -- --mode=mock
```

说明：

- 支付宝模式只在本地生成签名和跳转参数，不访问支付宝网关。
- 微信模式使用本地 stub 替换 `fetch`，只检查请求体、签名 header 和二维码动作形态。
- mock 模式检查本地开发用 `qrCodeText` 和 `mockPaymentUrl`。

## 充值套餐与渠道可用性

前端打开充值弹窗时会调用：

```text
GET /api/v1/recharge/plans
```

响应中包含：

- `items`：充值套餐
- `paymentChannels`：`mock`、`wechat`、`alipay` 的可用性
- `defaultPayChannel`：服务端建议的默认支付渠道

前端只能用这些字段做展示和减少误选。创建订单时，服务端仍会再次校验支付渠道，不信任前端传值。

可运行负向 smoke：

```bash
npm run smoke:payment:channel-guard
npm run smoke:payment:config-check
npm run smoke:payment:config-order-guard
```

这些命令验证未启用或配置不完整的真实渠道不能创建有效充值订单，也不会产生积分流水。

## 支付宝联调

需要配置：

- `LIGHTQUANT_PAYMENT_MODE=alipay`
- `ALIPAY_APP_ID`
- `ALIPAY_PRIVATE_KEY`
- `ALIPAY_PUBLIC_KEY`
- `PAYMENT_NOTIFY_BASE_URL`
- `PAYMENT_RETURN_BASE_URL`
- `ALIPAY_GATEWAY_URL`，未配置时使用默认网关
- `ALIPAY_SELLER_ID`，可选；配置后 notify 会校验商户一致性

推荐步骤：

1. 运行 `npm run check:payment -- --mode=alipay`。
2. 运行 `npm run smoke:payment:alipay-order`，验证创建支付宝待支付测试订单和 `redirect` 类型 `paymentAction`。
3. 运行 `npm run smoke:payment:alipay-notify`，用本地临时 RSA key 模拟已签名 notify，验证验签、订单置为 `PAID`、充值流水和重复 notify 幂等。
4. 运行 `npm run smoke:payment:return`，确认 `return_url` 只触发状态查询，不会改订单或发积分。
5. 启动站点并登录用户。
6. 在充值弹窗选择支付宝并创建订单。
7. 前端收到 `paymentAction.type=redirect` 后打开支付宝页面。
8. LightQuant 页面每 3 秒轮询 `GET /api/v1/payments/{orderId}/status`。
9. 用户完成支付后，只有支付宝服务端 notify 验签成功才会到账。
10. 确认订单变为 `PAID`，积分余额增加，`credit_ledger` 出现 `recharge` 流水。

注意：`return_url` 只用于用户回到前端页面，不作为到账依据。

## 微信 Native 联调

需要配置：

- `LIGHTQUANT_PAYMENT_MODE=wechat`
- `WECHAT_PAY_APP_ID`
- `WECHAT_PAY_MCH_ID`
- `WECHAT_PAY_API_KEY`
- `WECHAT_PAY_CERT_SERIAL_NO`
- `WECHAT_PAY_PRIVATE_KEY`
- `WECHAT_PAY_PLATFORM_CERTIFICATE`
- `WECHAT_PAY_PLATFORM_CERT_SERIAL_NO`
- `PAYMENT_NOTIFY_BASE_URL`
- `WECHAT_PAY_GATEWAY_URL`，未配置时使用默认网关

推荐步骤：

1. 运行 `npm run check:payment -- --mode=wechat`。
2. 运行 `npm run smoke:payment:wechat-action`，使用本地临时配置和 `fetch` stub 验证 Native 预支付动作、二维码 action、签名 header、HTTPS `notify_url` 和过期时间格式。
3. 运行 `npm run smoke:payment:wechat-notify`，使用本地临时 RSA key 和 AES-GCM 密文模拟微信 notify，验证签名、平台证书序列号、资源解密、订单置为 `PAID`、充值流水和重复 notify 幂等。
4. 启动站点并登录用户。
5. 在充值弹窗选择微信并创建订单。
6. 前端收到 `paymentAction.type=qr_code` 后展示二维码。
7. LightQuant 页面每 3 秒轮询 `GET /api/v1/payments/{orderId}/status`。
8. 用户扫码支付后，只有微信服务端 notify 验签和解密成功才会到账。
9. 确认订单变为 `PAID`，积分余额增加，`credit_ledger` 出现 `recharge` 流水。

## 前端行为验收

支付宝：

- 创建订单后打开新标签页或新窗口。
- 弹窗显示“请在新打开的支付宝页面完成支付”。
- “我已完成支付”或“刷新支付状态”按钮只调用状态查询接口。
- 自动轮询成功后停止轮询并刷新积分余额。

微信：

- 创建订单后展示二维码。
- 弹窗显示“请使用微信扫码支付”。
- “我已完成支付”或“刷新支付状态”按钮只调用状态查询接口。
- 自动轮询成功后停止轮询并刷新积分余额。

通用：

- 支付仍未确认时展示等待确认状态。
- 订单过期或关闭时提示重新下单。
- 前端不能直接增加积分。
- `return_url` 不能被当作支付成功依据。

## 本地支付回归

优先运行一键支付回归：

```bash
npm run smoke:payment:regression
```

等价的拆分命令：

```bash
npm run check:payment
npm run check:payment-action -- --mode=alipay
npm run smoke:payment:alipay-order
npm run smoke:payment:return
npm run smoke:payment:alipay-notify
npm run smoke:payment:wechat-action
npm run smoke:payment:wechat-notify
npm run smoke:payment:verified-notify-guards
npm run smoke:payment:notify-routes
npm run smoke:payment:config-guards
npm run smoke:payment:config-check
npm run smoke:payment:config-order-guard
npm run smoke:payment:channel-guard
npm run smoke:payment:provider-failure
npm run smoke:payment:expired-duplicate
npm run smoke:payment:expired-notify
npm run smoke:payment:notify
npm run smoke:payment:maintenance
```

支付回归后建议继续运行：

```bash
npm run check:encoding
npm run check:ai-prompts
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
```

如果只修改支付配置，不修改代码，优先运行：

```bash
npm run check:payment
npm run smoke:payment:notify
npm run smoke:payment:maintenance
npm run check:db
```
