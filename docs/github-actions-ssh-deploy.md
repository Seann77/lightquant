# LightQuant GitHub Actions + 腾讯云 CVM 部署指南

本文适用于当前阶段：只有一台腾讯云服务器，正式环境已经部署在 `lightquant.cloud`，需要在同一台服务器上增加测试环境，并让测试环境 GitHub push 后自动部署；正式环境采用手动一键部署，避免推送代码时误碰线上。

## 第一阶段后台优化发布约束

当前正式域名是 `https://lightquant.cloud`，正式后台入口本阶段先使用 `https://lightquant.cloud/admin`。后续可以规划 `admin.lightquant.cloud`，但第一阶段不要求拆分后台域名。

第一阶段只整理上线前基线和后台写保护，不实现总览页改造、补积分、积分流水、订单增强、留言反馈或模型配置页面。真实短信已具备，生产继续使用 Tencent SMS；真实支付仍在建设中，生产保持 `PAYMENT_FEATURE_ENABLED=false`。

后台写操作开关在测试和正式环境默认都应保持关闭：

```bash
ADMIN_WRITE_ENABLED=false
ADMIN_MODEL_CONFIG_WRITE_ENABLED=false
```

后续补积分、模型配置切换、密钥更新等写操作上线前，必须在对应环境显式打开开关并完成验收。正式环境仍然通过 GitHub Actions 手动选择 `production` target 发布，不允许 push `master` 自动发布正式。

如果不希望后台出现浏览器的服务器账号密码弹窗，在对应的 `/etc/lightquant/*.deploy.env` 中设置 `BASIC_AUTH_ENABLED=false`。关闭后，后台只依赖网站登录态和 `ADMIN_PHONE_WHITELIST` 管理员手机号白名单保护。

## 目标结构

| 环境 | Git 分支 | 目录 | 端口 | 数据库 | 访问方式 |
| --- | --- | --- | ---: | --- | --- |
| 测试环境 | `staging` | `/var/www/lightquant-staging` | `3010` | `lightquant_staging` | 优先用 SSH tunnel |
| 正式环境 | `master` | `/var/www/lightquant` | `3000` | 当前正式库 | `https://lightquant.cloud` |

测试环境和正式环境必须使用不同的 `APP_NAME`、`APP_DIR`、`APP_PORT`、`DB_NAME`、`DB_USER`、`AUTH_SECRET`。如果启用 Basic Auth，也必须使用不同的 `BASIC_AUTH_PASSWORD`。

## 1. 准备 staging 分支

如果 `master` 就是当前线上稳定代码：

```bash
git fetch origin
git checkout master
git pull --ff-only origin master
git checkout -b staging
git push -u origin staging
```

如果当前线上代码来自某个功能分支，先把该分支合入 `master`，再从 `master` 创建 `staging`。

## 2. 配置 GitHub Actions 连接服务器

在本机生成一把只给 GitHub Actions 使用的 SSH key：

```bash
ssh-keygen -t ed25519 -C "github-actions-lightquant" -f ~/.ssh/lightquant_github_actions -N ""
```

把公钥写入服务器部署用户的 `authorized_keys`：

```bash
cat ~/.ssh/lightquant_github_actions.pub | ssh ubuntu@你的服务器IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

测试这个 key 能登录，并且部署用户可以免密码 sudo：

```bash
ssh -i ~/.ssh/lightquant_github_actions ubuntu@你的服务器IP "sudo -n true && echo deploy-user-ok"
```

进入 GitHub 仓库 `Settings -> Secrets and variables -> Actions -> New repository secret`，添加：

```text
TENCENT_CVM_HOST=你的服务器IP或可解析域名
TENCENT_CVM_PORT=22
TENCENT_CVM_USER=ubuntu
TENCENT_CVM_SSH_KEY=~/.ssh/lightquant_github_actions 私钥完整内容
```

私钥内容需要完整粘贴，包括 OpenSSH 私钥的起始和结束标记行。

## 3. 在服务器创建测试环境配置

登录服务器：

```bash
ssh ubuntu@你的服务器IP
sudo mkdir -p /etc/lightquant
```

生成几个固定密钥，填入后面的配置文件：

```bash
openssl rand -hex 18
openssl rand -base64 48 | tr -d '\n'
openssl rand -hex 12
```

创建 `/etc/lightquant/staging.deploy.env`：

```bash
sudo nano /etc/lightquant/staging.deploy.env
```

参考模板：

```bash
APP_NAME=lightquant-staging
APP_DIR=/var/www/lightquant-staging
DEPLOY_SECRETS_FILE=/var/www/lightquant-staging/.deploy-secrets
APP_PORT=3010
APP_DOMAIN=staging.lightquant.cloud
REPO_BRANCH=staging
ENABLE_SSL=false
LETSENCRYPT_EMAIL=admin@example.com

ADMIN_PHONE=你的管理员手机号
DB_NAME=lightquant_staging
DB_USER=lightquant_staging
DB_PASSWORD=上面生成的数据库密码
AUTH_SECRET=上面生成的base64长密钥
BASIC_AUTH_ENABLED=false
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=上面生成的basic-auth密码

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

LIGHTQUANT_PAYMENT_MODE=wechat
PAYMENT_FEATURE_ENABLED=false
PAYMENT_ORDER_EXPIRE_MINUTES=30
ADMIN_WRITE_ENABLED=false
ADMIN_MODEL_CONFIG_WRITE_ENABLED=false

LIGHTQUANT_AI_BASE_URL=https://api.xiaomimimo.com/v1
LIGHTQUANT_AI_MODEL=mimo-v2.5-pro
LIGHTQUANT_AI_API_KEY=
```

保存后设置权限：

```bash
sudo chmod 600 /etc/lightquant/staging.deploy.env
sudo chown ubuntu:ubuntu /etc/lightquant/staging.deploy.env
```

测试环境建议先不解析公网域名，所以 `ENABLE_SSL=false`。如果后续要让外部内测用户访问，再单独配置 `staging.lightquant.cloud`、HTTPS 和访问保护。

## 4. 触发测试环境部署

推送 `staging` 分支会自动触发：

```bash
git checkout staging
git push origin staging
```

也可以在 GitHub 仓库 `Actions -> LightQuant SSH Deploy -> Run workflow` 中手动选择 `staging`，但必须从 `staging` 分支触发。

部署完成后，在服务器上检查：

```bash
pm2 status
curl -I http://127.0.0.1:3010
```

本机通过 SSH tunnel 访问测试环境：

```bash
ssh -L 3010:127.0.0.1:3010 ubuntu@你的服务器IP
```

然后浏览器打开：

```text
http://127.0.0.1:3010
```

## 5. 准备正式环境自动部署

正式环境不要重新生成关键密钥。先从当前线上配置确认这些值：

```bash
sudo ls -la /var/www/lightquant/.env /var/www/lightquant/.deploy-secrets
sudo cat /var/www/lightquant/.deploy-secrets
```

创建 `/etc/lightquant/prod.deploy.env`，把当前正式环境的 `DB_NAME`、`DB_USER`、`DB_PASSWORD`、`AUTH_SECRET`、短信配置、AI Key 等原样迁过去：

```bash
sudo nano /etc/lightquant/prod.deploy.env
sudo chmod 600 /etc/lightquant/prod.deploy.env
sudo chown ubuntu:ubuntu /etc/lightquant/prod.deploy.env
```

正式环境模板：

```bash
APP_NAME=lightquant
APP_DIR=/var/www/lightquant
DEPLOY_SECRETS_FILE=/var/www/lightquant/.deploy-secrets
APP_PORT=3000
APP_DOMAIN=lightquant.cloud
REPO_BRANCH=master
ENABLE_SSL=true
LETSENCRYPT_EMAIL=你的邮箱

ADMIN_PHONE=你的管理员手机号
DB_NAME=当前正式数据库名
DB_USER=当前正式数据库用户
DB_PASSWORD=当前正式数据库密码
AUTH_SECRET=当前正式AUTH_SECRET
BASIC_AUTH_ENABLED=false
BASIC_AUTH_USER=当前BasicAuth用户
BASIC_AUTH_PASSWORD=当前BasicAuth密码

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

LIGHTQUANT_PAYMENT_MODE=wechat
PAYMENT_FEATURE_ENABLED=false
PAYMENT_ORDER_EXPIRE_MINUTES=30
ADMIN_WRITE_ENABLED=false
ADMIN_MODEL_CONFIG_WRITE_ENABLED=false

LIGHTQUANT_AI_BASE_URL=https://api.xiaomimimo.com/v1
LIGHTQUANT_AI_MODEL=mimo-v2.5-pro
LIGHTQUANT_AI_API_KEY=
```

`prod.deploy.env` 未准备好之前，不要手动触发 `production` workflow，也不要把未验证的改动合入 `master`。正式发布前建议先备份生产数据库，再执行 GitHub Actions 手动 `production` 发布；发布后运行 smoke 验收，确认 `https://lightquant.cloud`、`https://lightquant.cloud/admin`、短信登录、支付关闭和后台写开关关闭状态符合预期。

## 6. 后续发布节奏

日常开发：

```bash
git checkout -b codex/feature-name
npm run check:quick
git add .
git commit -m "描述改动"
git push origin codex/feature-name
```

发布到测试：

```bash
git checkout staging
git pull --ff-only origin staging
git merge --no-ff codex/feature-name
git push origin staging
```

测试通过后发布正式：

```bash
git checkout master
git pull --ff-only origin master
git merge --no-ff staging
git push origin master
```

推送 `master` 不会自动部署正式环境。确认要上线后，到 GitHub 仓库 `Actions -> LightQuant SSH Deploy -> Run workflow`，选择 `master` 分支和 `production` target 后手动运行。

## 7. 常用排查命令

```bash
pm2 status
pm2 logs lightquant-staging --lines 100
pm2 logs lightquant --lines 100
sudo nginx -t
sudo systemctl status nginx --no-pager
curl -I http://127.0.0.1:3010
curl -I http://127.0.0.1:3000
```

如果 GitHub Actions 报 `Missing deploy env file`，说明服务器还没创建对应的 `/etc/lightquant/*.deploy.env`。

如果报 sudo 权限问题，说明 GitHub Actions 使用的服务器用户不能免密码执行 `sudo`。请换成你当前部署正式环境使用的用户，或给部署用户配置必要的免密码 sudo 权限。
