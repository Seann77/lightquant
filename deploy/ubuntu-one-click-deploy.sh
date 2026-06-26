#!/usr/bin/env bash
set -Eeuo pipefail

# LightQuant Ubuntu one-shot deploy script.
#
# First run example:
#   APP_DOMAIN=admin.example.com \
#   REPO_URL=https://github.com/your-name/lightquant.git \
#   ADMIN_PHONE=13800138000 \
#   LIGHTQUANT_AI_API_KEY=your_mimo_key \
#   bash deploy/ubuntu-one-click-deploy.sh
#
# Update-only run after the first deploy:
#   APP_DOMAIN=admin.example.com bash deploy/ubuntu-one-click-deploy.sh

APP_NAME="${APP_NAME:-lightquant}"
APP_DIR="${APP_DIR:-/var/www/lightquant}"
DEPLOY_SECRETS_FILE="${DEPLOY_SECRETS_FILE:-${APP_DIR}/.deploy-secrets}"
APP_PORT="${APP_PORT:-3000}"
APP_DOMAIN="${APP_DOMAIN:-}"
REPO_URL="${REPO_URL:-}"
REPO_BRANCH="${REPO_BRANCH:-master}"
LOCAL_SOURCE_DIR="${LOCAL_SOURCE_DIR:-}"
ADMIN_PHONE="${ADMIN_PHONE:-}"
ADMIN_WRITE_ENABLED="${ADMIN_WRITE_ENABLED:-false}"
ADMIN_MODEL_CONFIG_WRITE_ENABLED="${ADMIN_MODEL_CONFIG_WRITE_ENABLED:-false}"
CONFIG_ENCRYPTION_KEY="${CONFIG_ENCRYPTION_KEY:-}"
LIGHTQUANT_SMS_PROVIDER="${LIGHTQUANT_SMS_PROVIDER:-tencent}"
ALIBABA_CLOUD_ACCESS_KEY_ID="${ALIBABA_CLOUD_ACCESS_KEY_ID:-}"
ALIBABA_CLOUD_ACCESS_KEY_SECRET="${ALIBABA_CLOUD_ACCESS_KEY_SECRET:-}"
ALIYUN_DYPNS_ENDPOINT="${ALIYUN_DYPNS_ENDPOINT:-dypnsapi.aliyuncs.com}"
ALIYUN_DYPNS_COUNTRY_CODE="${ALIYUN_DYPNS_COUNTRY_CODE:-86}"
ALIYUN_DYPNS_SIGN_NAME="${ALIYUN_DYPNS_SIGN_NAME:-}"
ALIYUN_DYPNS_TEMPLATE_CODE="${ALIYUN_DYPNS_TEMPLATE_CODE:-100001}"
ALIYUN_DYPNS_VALID_TIME="${ALIYUN_DYPNS_VALID_TIME:-300}"
ALIYUN_DYPNS_INTERVAL="${ALIYUN_DYPNS_INTERVAL:-60}"
ALIYUN_DYPNS_CODE_LENGTH="${ALIYUN_DYPNS_CODE_LENGTH:-6}"
TENCENTCLOUD_SECRET_ID="${TENCENTCLOUD_SECRET_ID:-}"
TENCENTCLOUD_SECRET_KEY="${TENCENTCLOUD_SECRET_KEY:-}"
TENCENT_SMS_SDK_APP_ID="${TENCENT_SMS_SDK_APP_ID:-}"
TENCENT_SMS_SIGN_NAME="${TENCENT_SMS_SIGN_NAME:-}"
TENCENT_SMS_TEMPLATE_ID="${TENCENT_SMS_TEMPLATE_ID:-}"
TENCENT_SMS_TEMPLATE_PARAM_KEYS="${TENCENT_SMS_TEMPLATE_PARAM_KEYS:-code,minutes}"
TENCENT_SMS_REGION="${TENCENT_SMS_REGION:-ap-guangzhou}"
TENCENT_SMS_ENDPOINT="${TENCENT_SMS_ENDPOINT:-sms.tencentcloudapi.com}"
TENCENT_SMS_COUNTRY_CODE="${TENCENT_SMS_COUNTRY_CODE:-86}"
TENCENT_SMS_VALID_TIME="${TENCENT_SMS_VALID_TIME:-300}"
TENCENT_SMS_CODE_LENGTH="${TENCENT_SMS_CODE_LENGTH:-6}"
LIGHTQUANT_PAYMENT_MODE="${LIGHTQUANT_PAYMENT_MODE:-wechat}"
PAYMENT_FEATURE_ENABLED="${PAYMENT_FEATURE_ENABLED:-false}"
PAYMENT_ORDER_EXPIRE_MINUTES="${PAYMENT_ORDER_EXPIRE_MINUTES:-30}"
ALIPAY_APP_ID="${ALIPAY_APP_ID:-}"
ALIPAY_PRIVATE_KEY="${ALIPAY_PRIVATE_KEY:-}"
ALIPAY_PUBLIC_KEY="${ALIPAY_PUBLIC_KEY:-}"
ALIPAY_SELLER_ID="${ALIPAY_SELLER_ID:-}"
ALIPAY_GATEWAY_URL="${ALIPAY_GATEWAY_URL:-}"
WECHAT_PAY_APP_ID="${WECHAT_PAY_APP_ID:-}"
WECHAT_PAY_MCH_ID="${WECHAT_PAY_MCH_ID:-}"
WECHAT_PAY_API_KEY="${WECHAT_PAY_API_KEY:-}"
WECHAT_PAY_CERT_SERIAL_NO="${WECHAT_PAY_CERT_SERIAL_NO:-}"
WECHAT_PAY_PRIVATE_KEY="${WECHAT_PAY_PRIVATE_KEY:-}"
WECHAT_PAY_PLATFORM_CERT_SERIAL_NO="${WECHAT_PAY_PLATFORM_CERT_SERIAL_NO:-}"
WECHAT_PAY_PLATFORM_CERTIFICATE="${WECHAT_PAY_PLATFORM_CERTIFICATE:-}"
WECHAT_PAY_GATEWAY_URL="${WECHAT_PAY_GATEWAY_URL:-}"
LIGHTQUANT_AI_BASE_URL="${LIGHTQUANT_AI_BASE_URL:-https://api.xiaomimimo.com/v1}"
LIGHTQUANT_AI_MODEL="${LIGHTQUANT_AI_MODEL:-mimo-v2.5-pro}"
LIGHTQUANT_AI_API_KEY="${LIGHTQUANT_AI_API_KEY:-}"
NODE_MAJOR="${NODE_MAJOR:-22}"
DB_NAME="${DB_NAME:-lightquant}"
DB_USER="${DB_USER:-lightquant}"
DB_PASSWORD="${DB_PASSWORD:-}"
AUTH_SECRET="${AUTH_SECRET:-}"
BASIC_AUTH_ENABLED="${BASIC_AUTH_ENABLED:-true}"
BASIC_AUTH_USER="${BASIC_AUTH_USER:-admin}"
BASIC_AUTH_PASSWORD="${BASIC_AUTH_PASSWORD:-}"
ENABLE_SSL="${ENABLE_SSL:-true}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-admin@example.com}"

need_command() {
  command -v "$1" >/dev/null 2>&1
}

prompt_if_empty() {
  local var_name="$1"
  local prompt="$2"
  local current_value="${!var_name:-}"

  if [[ -z "$current_value" ]]; then
    read -r -p "$prompt: " current_value
    printf -v "$var_name" "%s" "$current_value"
  fi
}

prompt_secret_optional() {
  local var_name="$1"
  local prompt="$2"
  local current_value="${!var_name:-}"

  if [[ -z "$current_value" ]]; then
    read -r -s -p "$prompt: " current_value
    echo
    printf -v "$var_name" "%s" "$current_value"
  fi
}

generate_hex() {
  openssl rand -hex "$1"
}

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    if [[ "${1:-}" == "-u" ]]; then
      sudo "$@"
      return
    fi

    "$@"
  else
    sudo "$@"
  fi
}

write_file_sudo() {
  local target="$1"
  local tmp_file
  tmp_file="$(mktemp)"
  cat >"$tmp_file"
  run_sudo mkdir -p "$(dirname "$target")"
  run_sudo mv "$tmp_file" "$target"
}

fail_input() {
  echo "Invalid deployment input: $1" >&2
  exit 1
}

validate_required() {
  local var_name="$1"
  local value="${!var_name:-}"

  if [[ -z "$value" ]]; then
    fail_input "$var_name is required."
  fi
}

validate_choice() {
  local var_name="$1"
  local allowed_values="$2"
  local value="${!var_name:-}"

  if [[ ",${allowed_values}," != *",${value},"* ]]; then
    fail_input "$var_name must be one of: ${allowed_values}."
  fi
}

validate_integer_range() {
  local var_name="$1"
  local min_value="$2"
  local max_value="$3"
  local value="${!var_name:-}"

  if [[ ! "$value" =~ ^[0-9]+$ ]]; then
    fail_input "$var_name must be an integer."
  fi

  local numeric_value=$((10#$value))
  if (( numeric_value < min_value || numeric_value > max_value )); then
    fail_input "$var_name must be between ${min_value} and ${max_value}."
  fi
}

validate_identifier() {
  local var_name="$1"
  local value="${!var_name:-}"

  if [[ ! "$value" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    fail_input "$var_name must be a safe PostgreSQL identifier: letters, numbers, and underscores, starting with a letter or underscore."
  fi
}

validate_domain() {
  validate_required APP_DOMAIN

  if [[ ! "$APP_DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]]; then
    fail_input "APP_DOMAIN may only contain letters, numbers, dots, and hyphens."
  fi

  if [[ "$APP_DOMAIN" == .* || "$APP_DOMAIN" == *. || "$APP_DOMAIN" == *..* || "$APP_DOMAIN" == *- || "$APP_DOMAIN" == -* ]]; then
    fail_input "APP_DOMAIN must not start/end with a dot or hyphen, and must not contain consecutive dots."
  fi

  if (( ${#APP_DOMAIN} > 253 )); then
    fail_input "APP_DOMAIN must be 253 characters or fewer."
  fi

  local label
  IFS="." read -r -a domain_labels <<<"$APP_DOMAIN"
  for label in "${domain_labels[@]}"; do
    if (( ${#label} > 63 )); then
      fail_input "Each APP_DOMAIN label must be 63 characters or fewer."
    fi

    if [[ "$label" == -* || "$label" == *- ]]; then
      fail_input "APP_DOMAIN labels must not start or end with a hyphen."
    fi
  done
}

validate_no_newline() {
  local var_name="$1"
  local value="${!var_name:-}"

  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    fail_input "$var_name must be provided as a single line. Use literal \\n for PEM line breaks."
  fi
}

validate_inputs() {
  validate_domain
  validate_required ADMIN_PHONE
  validate_choice ENABLE_SSL "true,false"
  validate_choice BASIC_AUTH_ENABLED "true,false"
  validate_choice ADMIN_WRITE_ENABLED "true,false"
  validate_choice ADMIN_MODEL_CONFIG_WRITE_ENABLED "true,false"
  validate_choice LIGHTQUANT_PAYMENT_MODE "alipay,wechat"
  validate_choice PAYMENT_FEATURE_ENABLED "true,false"
  validate_choice LIGHTQUANT_SMS_PROVIDER "aliyun,tencent"
  validate_integer_range APP_PORT 1 65535
  validate_integer_range NODE_MAJOR 18 30
  validate_integer_range PAYMENT_ORDER_EXPIRE_MINUTES 1 1440
  validate_integer_range ALIYUN_DYPNS_VALID_TIME 60 86400
  validate_integer_range ALIYUN_DYPNS_INTERVAL 1 3600
  validate_integer_range ALIYUN_DYPNS_CODE_LENGTH 4 8
  validate_integer_range TENCENT_SMS_VALID_TIME 60 86400
  validate_integer_range TENCENT_SMS_CODE_LENGTH 4 8
  validate_identifier DB_NAME
  validate_identifier DB_USER
  validate_required LIGHTQUANT_AI_MODEL
  if [[ "$BASIC_AUTH_ENABLED" == "true" ]]; then
    validate_required BASIC_AUTH_USER
  fi
  validate_sms_provider_config
  validate_no_newline DB_PASSWORD
  validate_no_newline AUTH_SECRET
  validate_no_newline BASIC_AUTH_PASSWORD
  validate_no_newline CONFIG_ENCRYPTION_KEY
  validate_no_newline LIGHTQUANT_AI_API_KEY
  validate_no_newline ALIBABA_CLOUD_ACCESS_KEY_ID
  validate_no_newline ALIBABA_CLOUD_ACCESS_KEY_SECRET
  validate_no_newline TENCENTCLOUD_SECRET_ID
  validate_no_newline TENCENTCLOUD_SECRET_KEY
  validate_no_newline TENCENT_SMS_SDK_APP_ID
  validate_no_newline TENCENT_SMS_SIGN_NAME
  validate_no_newline TENCENT_SMS_TEMPLATE_ID
  validate_no_newline ALIPAY_PRIVATE_KEY
  validate_no_newline ALIPAY_PUBLIC_KEY
  validate_no_newline WECHAT_PAY_API_KEY
  validate_no_newline WECHAT_PAY_PRIVATE_KEY
  validate_no_newline WECHAT_PAY_PLATFORM_CERTIFICATE
}

validate_sms_provider_config() {
  if [[ "$LIGHTQUANT_SMS_PROVIDER" == "aliyun" ]]; then
    validate_required ALIBABA_CLOUD_ACCESS_KEY_ID
    validate_required ALIBABA_CLOUD_ACCESS_KEY_SECRET
    validate_required ALIYUN_DYPNS_SIGN_NAME
    validate_required ALIYUN_DYPNS_TEMPLATE_CODE
    return
  fi

  validate_required TENCENTCLOUD_SECRET_ID
  validate_required TENCENTCLOUD_SECRET_KEY
  validate_required TENCENT_SMS_SDK_APP_ID
  validate_required TENCENT_SMS_SIGN_NAME
  validate_required TENCENT_SMS_TEMPLATE_ID
}

install_system_packages() {
  run_sudo apt-get update
  run_sudo apt-get install -y ca-certificates curl git nginx postgresql postgresql-contrib apache2-utils openssl rsync

  if ! need_command node || [[ "$(node -v | sed 's/^v//' | cut -d. -f1)" != "$NODE_MAJOR" ]]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | run_sudo bash -
    run_sudo apt-get install -y nodejs
  fi

  if ! need_command pm2; then
    run_sudo npm install -g pm2
  fi

  if [[ "$ENABLE_SSL" == "true" ]]; then
    run_sudo apt-get install -y certbot
  fi
}

prepare_database() {
  if [[ -z "$DB_PASSWORD" ]]; then
    DB_PASSWORD="$(generate_hex 18)"
  fi

  run_sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQL

  run_sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL
}

prepare_source() {
  run_sudo mkdir -p "$(dirname "$APP_DIR")"
  run_sudo chown -R "${USER:-root}:${USER:-root}" "$(dirname "$APP_DIR")"

  if [[ -n "$LOCAL_SOURCE_DIR" ]]; then
    if [[ ! -f "$LOCAL_SOURCE_DIR/package.json" ]]; then
      echo "LOCAL_SOURCE_DIR must point to a LightQuant source directory containing package.json." >&2
      exit 1
    fi

    run_sudo mkdir -p "$APP_DIR"
    run_sudo chown -R "${USER:-root}:${USER:-root}" "$APP_DIR"
    rsync -a --delete \
      --exclude ".git/" \
      --exclude ".env" \
      --exclude ".env.local" \
      --exclude ".deploy-secrets" \
      --exclude ".lightquant/" \
      --exclude ".next/" \
      --exclude "node_modules/" \
      "$LOCAL_SOURCE_DIR"/ "$APP_DIR"/
    return
  fi

  if [[ -d "$APP_DIR/.git" ]]; then
    git -C "$APP_DIR" fetch --all --prune
    git -C "$APP_DIR" checkout "$REPO_BRANCH"
    git -C "$APP_DIR" pull --ff-only origin "$REPO_BRANCH"
    return
  fi

  if [[ -z "$REPO_URL" ]]; then
    echo "REPO_URL is required for the first deploy because $APP_DIR does not exist yet." >&2
    exit 1
  fi

  if [[ -d "$APP_DIR" && -n "$(find "$APP_DIR" -mindepth 1 -maxdepth 1 2>/dev/null)" ]]; then
    echo "$APP_DIR exists and is not empty, but it is not a git repository." >&2
    exit 1
  fi

  git clone --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
}

write_env_file() {
  if [[ -z "$AUTH_SECRET" ]]; then
    AUTH_SECRET="$(openssl rand -base64 48)"
  fi

  if [[ -z "$BASIC_AUTH_PASSWORD" ]]; then
    BASIC_AUTH_PASSWORD="$(generate_hex 12)"
  fi

  local database_url="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public"

  write_file_sudo "$APP_DIR/.env" <<EOF
NODE_ENV=production
LIGHTQUANT_DATA_MODE=database
AUTH_SECRET=${AUTH_SECRET}
DATABASE_URL=${database_url}
ADMIN_PHONE_WHITELIST=${ADMIN_PHONE}
ADMIN_WRITE_ENABLED=${ADMIN_WRITE_ENABLED}
ADMIN_MODEL_CONFIG_WRITE_ENABLED=${ADMIN_MODEL_CONFIG_WRITE_ENABLED}
CONFIG_ENCRYPTION_KEY=${CONFIG_ENCRYPTION_KEY}

LIGHTQUANT_SMS_PROVIDER=${LIGHTQUANT_SMS_PROVIDER}
LIGHTQUANT_ALLOW_MOCK_SMS_IN_PRODUCTION=false
ALIBABA_CLOUD_ACCESS_KEY_ID=${ALIBABA_CLOUD_ACCESS_KEY_ID}
ALIBABA_CLOUD_ACCESS_KEY_SECRET=${ALIBABA_CLOUD_ACCESS_KEY_SECRET}
ALIYUN_DYPNS_ENDPOINT=${ALIYUN_DYPNS_ENDPOINT}
ALIYUN_DYPNS_COUNTRY_CODE=${ALIYUN_DYPNS_COUNTRY_CODE}
ALIYUN_DYPNS_SIGN_NAME=${ALIYUN_DYPNS_SIGN_NAME}
ALIYUN_DYPNS_TEMPLATE_CODE=${ALIYUN_DYPNS_TEMPLATE_CODE}
ALIYUN_DYPNS_VALID_TIME=${ALIYUN_DYPNS_VALID_TIME}
ALIYUN_DYPNS_INTERVAL=${ALIYUN_DYPNS_INTERVAL}
ALIYUN_DYPNS_CODE_LENGTH=${ALIYUN_DYPNS_CODE_LENGTH}
TENCENTCLOUD_SECRET_ID=${TENCENTCLOUD_SECRET_ID}
TENCENTCLOUD_SECRET_KEY=${TENCENTCLOUD_SECRET_KEY}
TENCENT_SMS_SDK_APP_ID=${TENCENT_SMS_SDK_APP_ID}
TENCENT_SMS_SIGN_NAME=${TENCENT_SMS_SIGN_NAME}
TENCENT_SMS_TEMPLATE_ID=${TENCENT_SMS_TEMPLATE_ID}
TENCENT_SMS_TEMPLATE_PARAM_KEYS=${TENCENT_SMS_TEMPLATE_PARAM_KEYS}
TENCENT_SMS_REGION=${TENCENT_SMS_REGION}
TENCENT_SMS_ENDPOINT=${TENCENT_SMS_ENDPOINT}
TENCENT_SMS_COUNTRY_CODE=${TENCENT_SMS_COUNTRY_CODE}
TENCENT_SMS_VALID_TIME=${TENCENT_SMS_VALID_TIME}
TENCENT_SMS_CODE_LENGTH=${TENCENT_SMS_CODE_LENGTH}

LIGHTQUANT_PAYMENT_MODE=${LIGHTQUANT_PAYMENT_MODE}
PAYMENT_FEATURE_ENABLED=${PAYMENT_FEATURE_ENABLED}
PAYMENT_MOCK_ENABLED=false
PAYMENT_NOTIFY_BASE_URL=https://${APP_DOMAIN}
PAYMENT_RETURN_BASE_URL=https://${APP_DOMAIN}
PAYMENT_ORDER_EXPIRE_MINUTES=${PAYMENT_ORDER_EXPIRE_MINUTES}
MAINTENANCE_SECRET=$(generate_hex 24)

ALIPAY_APP_ID=${ALIPAY_APP_ID}
ALIPAY_PRIVATE_KEY=${ALIPAY_PRIVATE_KEY}
ALIPAY_PUBLIC_KEY=${ALIPAY_PUBLIC_KEY}
ALIPAY_SELLER_ID=${ALIPAY_SELLER_ID}
ALIPAY_GATEWAY_URL=${ALIPAY_GATEWAY_URL}
WECHAT_PAY_APP_ID=${WECHAT_PAY_APP_ID}
WECHAT_PAY_MCH_ID=${WECHAT_PAY_MCH_ID}
WECHAT_PAY_API_KEY=${WECHAT_PAY_API_KEY}
WECHAT_PAY_CERT_SERIAL_NO=${WECHAT_PAY_CERT_SERIAL_NO}
WECHAT_PAY_PRIVATE_KEY=${WECHAT_PAY_PRIVATE_KEY}
WECHAT_PAY_PLATFORM_CERT_SERIAL_NO=${WECHAT_PAY_PLATFORM_CERT_SERIAL_NO}
WECHAT_PAY_PLATFORM_CERTIFICATE=${WECHAT_PAY_PLATFORM_CERTIFICATE}
WECHAT_PAY_GATEWAY_URL=${WECHAT_PAY_GATEWAY_URL}

LIGHTQUANT_AI_PROVIDER=openai_compatible
LIGHTQUANT_AI_BASE_URL=${LIGHTQUANT_AI_BASE_URL}
LIGHTQUANT_AI_MODEL=${LIGHTQUANT_AI_MODEL}
LIGHTQUANT_AI_API_KEY=${LIGHTQUANT_AI_API_KEY}
LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION=false
AI_TASK_TIMEOUT_MS=300000
AI_MAX_RETRIES=1
FILE_UPLOAD_MAX_BYTES=262144
FILE_ALLOWED_EXTENSIONS=.py,.txt

OPENAI_API_KEY=
DEEPSEEK_API_KEY=
DASHSCOPE_API_KEY=
EOF

  run_sudo chmod 600 "$APP_DIR/.env"
  run_sudo chown "${USER:-root}:${USER:-root}" "$APP_DIR/.env"
}

write_deploy_secrets_file() {
  write_file_sudo "$DEPLOY_SECRETS_FILE" <<EOF
# LightQuant deployment bootstrap secrets.
# Keep this file private. Do not commit or paste it into tickets, logs, or chat.
BASIC_AUTH_ENABLED=${BASIC_AUTH_ENABLED}
BASIC_AUTH_USER=${BASIC_AUTH_USER}
BASIC_AUTH_PASSWORD=${BASIC_AUTH_PASSWORD}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
APP_ENV_FILE=${APP_DIR}/.env
EOF

  run_sudo chmod 600 "$DEPLOY_SECRETS_FILE"
  run_sudo chown "${USER:-root}:${USER:-root}" "$DEPLOY_SECRETS_FILE"
}

build_app() {
  cd "$APP_DIR"
  npm ci
  npm run db:migrate
  npm run db:seed
  npm run build

  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  PORT="$APP_PORT" pm2 start npm --name "$APP_NAME" -- start
  pm2 save

  run_sudo env PATH="$PATH" pm2 startup systemd -u "${USER:-root}" --hp "${HOME:-/root}" >/dev/null || true
}

nginx_admin_auth_block() {
  if [[ "$BASIC_AUTH_ENABLED" == "true" ]]; then
    cat <<EOF
        auth_basic "LightQuant";
        auth_basic_user_file /etc/nginx/.htpasswd-${APP_NAME};

EOF
  fi
}

deployment_basic_auth_summary() {
  if [[ "$BASIC_AUTH_ENABLED" == "true" ]]; then
    echo "Basic Auth user: ${BASIC_AUTH_USER}"
  else
    echo "Basic Auth: disabled"
  fi
}

write_nginx_http_config() {
  if [[ "$BASIC_AUTH_ENABLED" == "true" ]]; then
    run_sudo htpasswd -bc "/etc/nginx/.htpasswd-${APP_NAME}" "$BASIC_AUTH_USER" "$BASIC_AUTH_PASSWORD" >/dev/null
  fi
  run_sudo mkdir -p /var/www/html/.well-known/acme-challenge

  write_file_sudo "/etc/nginx/sites-available/${APP_NAME}" <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        auth_basic off;
        root /var/www/html;
    }

    location ^~ /admin {
$(nginx_admin_auth_block)
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        client_max_body_size 2m;
    }

    location ^~ /api/v1/admin {
$(nginx_admin_auth_block)
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        client_max_body_size 2m;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        client_max_body_size 2m;
    }
}
EOF

  run_sudo ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
  run_sudo nginx -t
  run_sudo systemctl reload nginx
}

enable_https_if_requested() {
  if [[ "$ENABLE_SSL" != "true" ]]; then
    return
  fi

  if [[ "$LETSENCRYPT_EMAIL" == "admin@example.com" ]]; then
    echo "Skipping HTTPS because LETSENCRYPT_EMAIL was not set."
    return
  fi

  local cert_dir="/etc/letsencrypt/live/${APP_DOMAIN}"
  if run_sudo test -f "${cert_dir}/fullchain.pem" && run_sudo test -f "${cert_dir}/privkey.pem"; then
    echo "Existing Let's Encrypt certificate found for ${APP_DOMAIN}; skipping certbot certonly."
  else
    run_sudo certbot certonly \
      --webroot \
      -w /var/www/html \
      -d "$APP_DOMAIN" \
      --non-interactive \
      --agree-tos \
      -m "$LETSENCRYPT_EMAIL" \
      --keep-until-expiring
  fi

  write_file_sudo "/etc/nginx/sites-available/${APP_NAME}" <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        auth_basic off;
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${APP_DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${APP_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${APP_DOMAIN}/privkey.pem;

    location ^~ /admin {
$(nginx_admin_auth_block)
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        client_max_body_size 2m;
    }

    location ^~ /api/v1/admin {
$(nginx_admin_auth_block)
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        client_max_body_size 2m;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        client_max_body_size 2m;
    }
}
EOF

  run_sudo nginx -t
  run_sudo systemctl reload nginx
}

main() {
  prompt_if_empty APP_DOMAIN "Domain, for example admin.example.com"
  prompt_if_empty ADMIN_PHONE "Admin phone number"
  prompt_secret_optional LIGHTQUANT_AI_API_KEY "MiMo API key (LIGHTQUANT_AI_API_KEY, leave empty to configure later)"

  validate_inputs
  install_system_packages
  prepare_database
  prepare_source
  write_env_file
  write_deploy_secrets_file
  build_app
  write_nginx_http_config
  enable_https_if_requested

  cat <<EOF

Deploy finished.

App URL: http://${APP_DOMAIN}
$(deployment_basic_auth_summary)
Bootstrap secrets file: ${DEPLOY_SECRETS_FILE}
Database: ${DB_NAME}
Database user: ${DB_USER}

Passwords are not printed by default. Keep the bootstrap secrets file private.
EOF
}

main "$@"
