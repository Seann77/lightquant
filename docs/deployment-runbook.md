# LightQuant 部署 Runbook

本文记录当前 Ubuntu 一键部署脚本的使用方式和安全边界，不包含任何真实密钥、数据库密码、模型 Key 或支付私钥。

## 第一阶段后台优化上线基线

当前正式域名是 `https://lightquant.cloud`，正式后台入口本阶段先继续使用 `https://lightquant.cloud/admin`。后续可以规划 `admin.lightquant.cloud`，但第一阶段不强制拆分后台域名。

现有环境保持不变：

- 正式环境：`/var/www/lightquant`，PM2 应用 `lightquant`，端口 `3000`，分支 `master`。
- 测试环境：`/var/www/lightquant-staging`，PM2 应用 `lightquant-staging`，端口 `3010`，规划分支 `staging`。

第一阶段部署后的后台只允许只读能力。生产环境继续使用真实 Tencent SMS；真实支付仍在建设中，`PAYMENT_FEATURE_ENABLED=false` 必须保持关闭。后台写操作统一由以下开关保护，默认均为关闭：

```bash
ADMIN_WRITE_ENABLED=false
ADMIN_MODEL_CONFIG_WRITE_ENABLED=false
```

后续补积分、模型配置切换、密钥更新等后台写操作上线前，必须先完成对应功能验收，再显式打开所需开关。

如果不希望正式后台出现浏览器的服务器账号密码弹窗，可以在部署环境中显式设置 `BASIC_AUTH_ENABLED=false`。关闭后，后台只依赖网站登录态和 `ADMIN_PHONE_WHITELIST` 管理员手机号白名单保护。

## 一键部署脚本

脚本位置：

```bash
deploy/ubuntu-one-click-deploy.sh
```

首次部署示例：

```bash
APP_DOMAIN=admin.example.com \
REPO_URL=https://github.com/your-name/lightquant.git \
ADMIN_PHONE=13800138000 \
LIGHTQUANT_AI_API_KEY=your_mimo_key \
PAYMENT_FEATURE_ENABLED=false \
BASIC_AUTH_ENABLED=false \
ADMIN_WRITE_ENABLED=false \
ADMIN_MODEL_CONFIG_WRITE_ENABLED=false \
bash deploy/ubuntu-one-click-deploy.sh
```

如果不想把 `LIGHTQUANT_AI_API_KEY` 放在命令行里，也可以不传该变量，脚本会交互式隐藏输入。留空时部署仍可继续，但真实 AI 调用会在配置补齐前返回 `AI_PROVIDER_CONFIG_ERROR`。

如果服务器无法访问 GitHub，可以上传源码包并从本地目录部署：

```bash
mkdir -p ~/lightquant-src
tar -xzf ~/lightquant-source.tar.gz -C ~/lightquant-src
cd ~/lightquant-src
LOCAL_SOURCE_DIR="$PWD" bash deploy/ubuntu-one-click-deploy.sh
```

## 输入预检查

脚本会在安装系统包和写入配置前做轻量校验，尽量让错误早一点、清楚一点暴露出来：

- `APP_DOMAIN` 只能包含字母、数字、点和连字符，不能包含路径、端口或空格。
- `APP_PORT` 必须是 `1-65535` 范围内的整数。
- `DB_NAME`、`DB_USER` 必须是安全的 PostgreSQL 标识符，只能使用字母、数字和下划线，且不能以数字开头。
- `BASIC_AUTH_ENABLED` 只能是 `true` 或 `false`；默认 `true`，如果正式后台不需要服务器账号密码弹窗，可显式设置为 `false`。
- `LIGHTQUANT_PAYMENT_MODE` 生产部署只允许 `alipay` 或 `wechat`，不会允许 `mock`；`PAYMENT_FEATURE_ENABLED=false` 时不会展示充值入口，也不会创建充值订单。
- `ADMIN_WRITE_ENABLED` 和 `ADMIN_MODEL_CONFIG_WRITE_ENABLED` 只能是 `true` 或 `false`；第一阶段生产部署保持 `false`。
- `LIGHTQUANT_SMS_PROVIDER` 生产部署允许 `tencent` 或 `aliyun`；当前正式环境默认使用 `tencent`。
- 支付、短信、模型等密钥变量必须以单行形式传入；PEM 换行请使用字面量 `\n`，不要直接传多行内容。

## 当前默认生产配置

部署脚本会生成服务端 `.env`，关键配置形态如下：

```bash
NODE_ENV=production
LIGHTQUANT_DATA_MODE=database
LIGHTQUANT_PAYMENT_MODE=wechat
PAYMENT_FEATURE_ENABLED=false
PAYMENT_MOCK_ENABLED=false
ADMIN_WRITE_ENABLED=false
ADMIN_MODEL_CONFIG_WRITE_ENABLED=false
LIGHTQUANT_AI_PROVIDER=openai_compatible
LIGHTQUANT_AI_BASE_URL=https://api.xiaomimimo.com/v1
LIGHTQUANT_AI_MODEL=mimo-v2.5-pro
LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION=false
```

实际部署时仍需要根据商户和域名配置支付变量、短信变量和 `LIGHTQUANT_AI_API_KEY`。

## 短信变量

生产环境默认使用 Tencent Cloud SMS，不允许自动落回 mock SMS。执行部署脚本前需要配置：

```bash
LIGHTQUANT_SMS_PROVIDER=tencent
TENCENTCLOUD_SECRET_ID=
TENCENTCLOUD_SECRET_KEY=
TENCENT_SMS_SDK_APP_ID=
TENCENT_SMS_SIGN_NAME=
TENCENT_SMS_TEMPLATE_ID=
TENCENT_SMS_TEMPLATE_PARAM_KEYS=code,minutes
TENCENT_SMS_REGION=ap-guangzhou
TENCENT_SMS_ENDPOINT=sms.tencentcloudapi.com
TENCENT_SMS_COUNTRY_CODE=86
TENCENT_SMS_VALID_TIME=300
TENCENT_SMS_CODE_LENGTH=6
```

如果短信密钥或签名模板缺失，生产登录发码会返回稳定配置错误，不会暴露密钥或内部堆栈。

如果需要显式切换到 Aliyun SMS，可设置 `LIGHTQUANT_SMS_PROVIDER=aliyun`，并提供 `ALIBABA_CLOUD_ACCESS_KEY_ID`、`ALIBABA_CLOUD_ACCESS_KEY_SECRET`、`ALIYUN_DYPNS_SIGN_NAME`、`ALIYUN_DYPNS_TEMPLATE_CODE` 等阿里云短信变量。

## 支付变量

`LIGHTQUANT_PAYMENT_MODE` 支持：

- `alipay`
- `wechat`

`PAYMENT_FEATURE_ENABLED=false` 时，充值入口和创建充值订单接口保持关闭，6 月 28 日开放前不需要提供支付宝或微信支付商户参数。需要开放支付时，再设置 `PAYMENT_FEATURE_ENABLED=true` 并补齐对应渠道配置。

脚本默认值为 `wechat`，也可以在执行脚本前通过环境变量覆盖。对应渠道的商户变量会原样写入服务端 `.env`，例如：

```bash
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_SELLER_ID=
ALIPAY_GATEWAY_URL=
WECHAT_PAY_APP_ID=
WECHAT_PAY_MCH_ID=
WECHAT_PAY_API_KEY=
WECHAT_PAY_CERT_SERIAL_NO=
WECHAT_PAY_PRIVATE_KEY=
WECHAT_PAY_PLATFORM_CERT_SERIAL_NO=
WECHAT_PAY_PLATFORM_CERTIFICATE=
WECHAT_PAY_GATEWAY_URL=
```

私钥和证书建议使用单行内容，或使用 `\n` 表示换行，服务端会在读取时恢复 PEM 格式。不要把真实支付密钥写入文档或仓库。

## 后台写操作开关

`ADMIN_WRITE_ENABLED=false` 是后台写操作总开关，`ADMIN_MODEL_CONFIG_WRITE_ENABLED=false` 是模型配置写操作的额外开关。第一阶段后台优化上线只建立基线和保护配置，不开放补积分、积分流水、订单增强、留言反馈或模型配置页面。

当未来需要上线补积分、模型配置切换或密钥更新时，必须在测试环境先显式设置所需开关并完成验收；正式环境发布前再按变更窗口显式打开，不能依赖默认值。

## 后台 Basic Auth 开关

`BASIC_AUTH_ENABLED=true` 时，部署脚本会在 nginx 的 `/admin` 和 `/api/v1/admin` 前加一层浏览器 Basic Auth。`BASIC_AUTH_ENABLED=false` 时，部署脚本不会写入这层 nginx 保护，用户访问 `https://lightquant.cloud/admin` 会直接进入网站登录流程。

如果关闭 Basic Auth，请确保 `ADMIN_PHONE_WHITELIST` 只包含管理员手机号，并在发布后用普通手机号确认无法访问后台。

## 安全注意

- 不要提交服务器生成的 `.env`。
- 不要把 `DATABASE_URL`、`AUTH_SECRET`、`LIGHTQUANT_AI_API_KEY`、支付私钥或短信密钥写进文档、前端代码或仓库。
- 部署脚本不会在完成摘要中打印 `LIGHTQUANT_AI_API_KEY`、数据库密码或 Basic Auth 密码。
- 首次部署生成的 bootstrap 密码会写入服务器上的 `${APP_DIR}/.deploy-secrets`，该文件权限为 `600`，请妥善保存并避免进入自动化日志。
- 生产环境不允许 mock 数据层、mock 支付或 mock AI，除非显式临时放开对应变量并清楚知道风险。
- `return_url` 只用于页面展示，充值到账必须以服务端支付 notify 验签成功为准。

## 部署后建议检查

部署前建议先备份数据库，特别是正式环境 `/var/www/lightquant` 对应的生产数据库。

进入应用目录后运行：

```bash
npm run check:quick
npm run check:db
npm run build
```

如果本地或服务器上已经启动服务，也可以运行：

```bash
PORT=3000 npm run verify:local
```

如果服务监听的不是默认端口，也可以显式指定：

```bash
SMOKE_BASE_URL=http://127.0.0.1:3000 npm run verify:local
```

第一阶段后台优化上线后，建议对 `https://lightquant.cloud` 和 `https://lightquant.cloud/admin` 做 smoke 验收，确认登录、只读后台、短信发送、支付入口关闭和后台写开关关闭状态符合预期。

真实支付上线前，请继续使用支付渠道沙箱或小额真实订单验证 notify 验签、订单 `PAID`、积分到账和重复通知幂等。
