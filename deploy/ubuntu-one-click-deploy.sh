#!/usr/bin/env bash
set -Eeuo pipefail

# LightQuant Ubuntu one-shot deploy script.
#
# First run example:
#   APP_DOMAIN=admin.example.com \
#   REPO_URL=https://github.com/your-name/lightquant.git \
#   ADMIN_PHONE=13800138000 \
#   bash deploy/ubuntu-one-click-deploy.sh
#
# Update-only run after the first deploy:
#   APP_DOMAIN=admin.example.com bash deploy/ubuntu-one-click-deploy.sh

APP_NAME="${APP_NAME:-lightquant}"
APP_DIR="${APP_DIR:-/var/www/lightquant}"
APP_PORT="${APP_PORT:-3000}"
APP_DOMAIN="${APP_DOMAIN:-}"
REPO_URL="${REPO_URL:-}"
REPO_BRANCH="${REPO_BRANCH:-master}"
ADMIN_PHONE="${ADMIN_PHONE:-}"
NODE_MAJOR="${NODE_MAJOR:-22}"
DB_NAME="${DB_NAME:-lightquant}"
DB_USER="${DB_USER:-lightquant}"
DB_PASSWORD="${DB_PASSWORD:-}"
AUTH_SECRET="${AUTH_SECRET:-}"
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

install_system_packages() {
  run_sudo apt-get update
  run_sudo apt-get install -y ca-certificates curl git nginx postgresql postgresql-contrib apache2-utils openssl

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

LIGHTQUANT_PAYMENT_MODE=wechat
PAYMENT_MOCK_ENABLED=false
PAYMENT_NOTIFY_BASE_URL=https://${APP_DOMAIN}
PAYMENT_RETURN_BASE_URL=https://${APP_DOMAIN}
PAYMENT_ORDER_EXPIRE_MINUTES=30
MAINTENANCE_SECRET=$(generate_hex 24)

LIGHTQUANT_AI_PROVIDER=mock
LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION=true
AI_TASK_TIMEOUT_MS=60000
AI_MAX_RETRIES=1
FILE_UPLOAD_MAX_BYTES=262144
FILE_ALLOWED_EXTENSIONS=.py,.txt

OPENAI_API_KEY=
DEEPSEEK_API_KEY=
ZHIPU_API_KEY=
DASHSCOPE_API_KEY=
EOF

  run_sudo chmod 600 "$APP_DIR/.env"
  run_sudo chown "${USER:-root}:${USER:-root}" "$APP_DIR/.env"
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

write_nginx_http_config() {
  run_sudo htpasswd -bc "/etc/nginx/.htpasswd-${APP_NAME}" "$BASIC_AUTH_USER" "$BASIC_AUTH_PASSWORD" >/dev/null
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
        auth_basic "LightQuant";
        auth_basic_user_file /etc/nginx/.htpasswd-${APP_NAME};

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
        auth_basic "LightQuant";
        auth_basic_user_file /etc/nginx/.htpasswd-${APP_NAME};

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

  run_sudo certbot certonly \
    --webroot \
    -w /var/www/html \
    -d "$APP_DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$LETSENCRYPT_EMAIL" \
    --keep-until-expiring

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
        auth_basic "LightQuant";
        auth_basic_user_file /etc/nginx/.htpasswd-${APP_NAME};

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
        auth_basic "LightQuant";
        auth_basic_user_file /etc/nginx/.htpasswd-${APP_NAME};

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

  install_system_packages
  prepare_database
  prepare_source
  write_env_file
  build_app
  write_nginx_http_config
  enable_https_if_requested

  cat <<EOF

Deploy finished.

App URL: http://${APP_DOMAIN}
Basic Auth user: ${BASIC_AUTH_USER}
Basic Auth password: ${BASIC_AUTH_PASSWORD}
Database: ${DB_NAME}
Database user: ${DB_USER}
Database password: ${DB_PASSWORD}

Keep these generated passwords somewhere private.
EOF
}

main "$@"
