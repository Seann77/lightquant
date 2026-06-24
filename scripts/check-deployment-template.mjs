import { readFileSync } from "node:fs";

const scriptPath = "deploy/ubuntu-one-click-deploy.sh";
const content = readFileSync(scriptPath, "utf8");
const envTemplate = extractHeredocAfter('write_file_sudo "$APP_DIR/.env" <<EOF');

const requiredSnippets = [
  {
    name: "production node env",
    snippet: "NODE_ENV=production"
  },
  {
    name: "database data mode",
    snippet: "LIGHTQUANT_DATA_MODE=database"
  },
  {
    name: "tencent sms provider default",
    snippet: 'LIGHTQUANT_SMS_PROVIDER="${LIGHTQUANT_SMS_PROVIDER:-tencent}"'
  },
  {
    name: "sms provider passthrough",
    snippet: "LIGHTQUANT_SMS_PROVIDER=${LIGHTQUANT_SMS_PROVIDER}"
  },
  {
    name: "mock sms disabled in production",
    snippet: "LIGHTQUANT_ALLOW_MOCK_SMS_IN_PRODUCTION=false"
  },
  {
    name: "aliyun access key id passthrough",
    snippet: "ALIBABA_CLOUD_ACCESS_KEY_ID=${ALIBABA_CLOUD_ACCESS_KEY_ID}"
  },
  {
    name: "aliyun access key secret passthrough",
    snippet: "ALIBABA_CLOUD_ACCESS_KEY_SECRET=${ALIBABA_CLOUD_ACCESS_KEY_SECRET}"
  },
  {
    name: "aliyun sms sign name passthrough",
    snippet: "ALIYUN_DYPNS_SIGN_NAME=${ALIYUN_DYPNS_SIGN_NAME}"
  },
  {
    name: "aliyun sms template passthrough",
    snippet: "ALIYUN_DYPNS_TEMPLATE_CODE=${ALIYUN_DYPNS_TEMPLATE_CODE}"
  },
  {
    name: "tencent secret id passthrough",
    snippet: "TENCENTCLOUD_SECRET_ID=${TENCENTCLOUD_SECRET_ID}"
  },
  {
    name: "tencent secret key passthrough",
    snippet: "TENCENTCLOUD_SECRET_KEY=${TENCENTCLOUD_SECRET_KEY}"
  },
  {
    name: "tencent sdk app id passthrough",
    snippet: "TENCENT_SMS_SDK_APP_ID=${TENCENT_SMS_SDK_APP_ID}"
  },
  {
    name: "tencent sms sign name passthrough",
    snippet: "TENCENT_SMS_SIGN_NAME=${TENCENT_SMS_SIGN_NAME}"
  },
  {
    name: "tencent sms template id passthrough",
    snippet: "TENCENT_SMS_TEMPLATE_ID=${TENCENT_SMS_TEMPLATE_ID}"
  },
  {
    name: "tencent sms param keys passthrough",
    snippet: "TENCENT_SMS_TEMPLATE_PARAM_KEYS=${TENCENT_SMS_TEMPLATE_PARAM_KEYS}"
  },
  {
    name: "mock payment disabled",
    snippet: "PAYMENT_MOCK_ENABLED=false"
  },
  {
    name: "payment mode env default",
    snippet: 'LIGHTQUANT_PAYMENT_MODE="${LIGHTQUANT_PAYMENT_MODE:-wechat}"'
  },
  {
    name: "payment feature disabled default",
    snippet: 'PAYMENT_FEATURE_ENABLED="${PAYMENT_FEATURE_ENABLED:-false}"'
  },
  {
    name: "payment mode env passthrough",
    snippet: "LIGHTQUANT_PAYMENT_MODE=${LIGHTQUANT_PAYMENT_MODE}"
  },
  {
    name: "payment feature passthrough",
    snippet: "PAYMENT_FEATURE_ENABLED=${PAYMENT_FEATURE_ENABLED}"
  },
  {
    name: "alipay app id passthrough",
    snippet: "ALIPAY_APP_ID=${ALIPAY_APP_ID}"
  },
  {
    name: "alipay private key passthrough",
    snippet: "ALIPAY_PRIVATE_KEY=${ALIPAY_PRIVATE_KEY}"
  },
  {
    name: "wechat app id passthrough",
    snippet: "WECHAT_PAY_APP_ID=${WECHAT_PAY_APP_ID}"
  },
  {
    name: "wechat api key passthrough",
    snippet: "WECHAT_PAY_API_KEY=${WECHAT_PAY_API_KEY}"
  },
  {
    name: "wechat platform certificate passthrough",
    snippet: "WECHAT_PAY_PLATFORM_CERTIFICATE=${WECHAT_PAY_PLATFORM_CERTIFICATE}"
  },
  {
    name: "openai-compatible ai provider",
    snippet: "LIGHTQUANT_AI_PROVIDER=openai_compatible"
  },
  {
    name: "mimo default model",
    snippet: 'LIGHTQUANT_AI_MODEL="${LIGHTQUANT_AI_MODEL:-mimo-v2.5-pro}"'
  },
  {
    name: "mimo api key env passthrough",
    snippet: "LIGHTQUANT_AI_API_KEY=${LIGHTQUANT_AI_API_KEY}"
  },
  {
    name: "mock ai disabled in production",
    snippet: "LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION=false"
  },
  {
    name: "secret input for ai key",
    snippet: "prompt_secret_optional LIGHTQUANT_AI_API_KEY"
  },
  {
    name: "bootstrap secrets file",
    snippet: "write_deploy_secrets_file"
  },
  {
    name: "bootstrap secrets chmod",
    snippet: 'chmod 600 "$DEPLOY_SECRETS_FILE"'
  },
  {
    name: "deployment input validation function",
    snippet: "validate_inputs()"
  },
  {
    name: "domain validation",
    snippet: "validate_domain"
  },
  {
    name: "port range validation",
    snippet: "validate_integer_range APP_PORT 1 65535"
  },
  {
    name: "database name identifier validation",
    snippet: "validate_identifier DB_NAME"
  },
  {
    name: "database user identifier validation",
    snippet: "validate_identifier DB_USER"
  },
  {
    name: "production payment mode validation",
    snippet: 'validate_choice LIGHTQUANT_PAYMENT_MODE "alipay,wechat"'
  },
  {
    name: "payment feature flag validation",
    snippet: 'validate_choice PAYMENT_FEATURE_ENABLED "true,false"'
  },
  {
    name: "production sms provider validation",
    snippet: 'validate_choice LIGHTQUANT_SMS_PROVIDER "aliyun,tencent"'
  },
  {
    name: "sms provider conditional validation",
    snippet: "validate_sms_provider_config"
  },
  {
    name: "single-line secret validation",
    snippet: "validate_no_newline LIGHTQUANT_AI_API_KEY"
  },
  {
    name: "single-line tencent secret validation",
    snippet: "validate_no_newline TENCENTCLOUD_SECRET_KEY"
  }
];

const forbiddenSnippets = [
  {
    name: "zhipu api key",
    snippet: "ZHIPU_API_KEY"
  },
  {
    name: "glm model",
    pattern: /\bglm[-_.a-z0-9]*/i
  },
  {
    name: "production mock ai allowed",
    snippet: "LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION=true"
  },
  {
    name: "production mock payment enabled",
    snippet: "PAYMENT_MOCK_ENABLED=true"
  },
  {
    name: "production mock sms allowed",
    snippet: "LIGHTQUANT_ALLOW_MOCK_SMS_IN_PRODUCTION=true"
  }
];
const requiredEnvAssignments = [
  "NODE_ENV=production",
  "LIGHTQUANT_DATA_MODE=database",
  "LIGHTQUANT_SMS_PROVIDER=${LIGHTQUANT_SMS_PROVIDER}",
  "LIGHTQUANT_ALLOW_MOCK_SMS_IN_PRODUCTION=false",
  "ALIBABA_CLOUD_ACCESS_KEY_ID=${ALIBABA_CLOUD_ACCESS_KEY_ID}",
  "ALIBABA_CLOUD_ACCESS_KEY_SECRET=${ALIBABA_CLOUD_ACCESS_KEY_SECRET}",
  "TENCENTCLOUD_SECRET_ID=${TENCENTCLOUD_SECRET_ID}",
  "TENCENTCLOUD_SECRET_KEY=${TENCENTCLOUD_SECRET_KEY}",
  "TENCENT_SMS_SDK_APP_ID=${TENCENT_SMS_SDK_APP_ID}",
  "TENCENT_SMS_SIGN_NAME=${TENCENT_SMS_SIGN_NAME}",
  "TENCENT_SMS_TEMPLATE_ID=${TENCENT_SMS_TEMPLATE_ID}",
  "TENCENT_SMS_TEMPLATE_PARAM_KEYS=${TENCENT_SMS_TEMPLATE_PARAM_KEYS}",
  "LIGHTQUANT_PAYMENT_MODE=${LIGHTQUANT_PAYMENT_MODE}",
  "PAYMENT_FEATURE_ENABLED=${PAYMENT_FEATURE_ENABLED}",
  "PAYMENT_MOCK_ENABLED=false",
  "PAYMENT_NOTIFY_BASE_URL=https://${APP_DOMAIN}",
  "PAYMENT_RETURN_BASE_URL=https://${APP_DOMAIN}",
  "ALIPAY_APP_ID=${ALIPAY_APP_ID}",
  "ALIPAY_PRIVATE_KEY=${ALIPAY_PRIVATE_KEY}",
  "WECHAT_PAY_APP_ID=${WECHAT_PAY_APP_ID}",
  "WECHAT_PAY_API_KEY=${WECHAT_PAY_API_KEY}",
  "LIGHTQUANT_AI_PROVIDER=openai_compatible",
  "LIGHTQUANT_AI_API_KEY=${LIGHTQUANT_AI_API_KEY}",
  "LIGHTQUANT_AI_MODEL=${LIGHTQUANT_AI_MODEL}",
  "LIGHTQUANT_ALLOW_MOCK_AI_IN_PRODUCTION=false"
];
const forbiddenEnvPatterns = [
  {
    name: "mock data mode",
    pattern: /^LIGHTQUANT_DATA_MODE=mock$/m
  },
  {
    name: "mock sms provider",
    pattern: /^LIGHTQUANT_SMS_PROVIDER=mock$/m
  },
  {
    name: "mock payment enabled",
    pattern: /^PAYMENT_MOCK_ENABLED=true$/m
  },
  {
    name: "mock ai provider",
    pattern: /^LIGHTQUANT_AI_PROVIDER=mock$/m
  },
  {
    name: "legacy zhipu key",
    pattern: /^ZHIPU_API_KEY=/m
  },
  {
    name: "glm model",
    pattern: /^LIGHTQUANT_AI_MODEL=glm[-_.a-z0-9]*/im
  }
];

const failures = [];

if (!envTemplate) {
  failures.push("Unable to find .env heredoc template in deployment script");
}

for (const item of requiredSnippets) {
  if (!content.includes(item.snippet)) {
    failures.push(`Missing ${item.name}: ${item.snippet}`);
  }
}

for (const item of forbiddenSnippets) {
  const found = item.pattern ? item.pattern.test(content) : content.includes(item.snippet);
  if (found) {
    failures.push(`Forbidden ${item.name} found in ${scriptPath}`);
  }
}

if (envTemplate) {
  for (const assignment of requiredEnvAssignments) {
    if (!envTemplate.includes(assignment)) {
      failures.push(`Generated .env template is missing: ${assignment}`);
    }
  }

  for (const item of forbiddenEnvPatterns) {
    if (item.pattern.test(envTemplate)) {
      failures.push(`Generated .env template contains forbidden ${item.name}`);
    }
  }
}

const deploySummary = content.split("Deploy finished.")[1] ?? "";
if (deploySummary.includes("LIGHTQUANT_AI_API_KEY")) {
  failures.push("Deploy summary must not print LIGHTQUANT_AI_API_KEY");
}
if (deploySummary.includes("${BASIC_AUTH_PASSWORD}")) {
  failures.push("Deploy summary must not print BASIC_AUTH_PASSWORD");
}
if (deploySummary.includes("${DB_PASSWORD}")) {
  failures.push("Deploy summary must not print DB_PASSWORD");
}
if (deploySummary.includes("${AUTH_SECRET}")) {
  failures.push("Deploy summary must not print AUTH_SECRET");
}

const mainIndex = content.indexOf("main() {");
if (mainIndex !== -1) {
  const mainFunction = content.slice(mainIndex);
  const validateIndex = mainFunction.indexOf("validate_inputs");
  const installIndex = mainFunction.indexOf("install_system_packages");

  if (validateIndex === -1 || installIndex === -1 || validateIndex > installIndex) {
    failures.push("validate_inputs must run before install_system_packages in main");
  }
} else {
  failures.push("Unable to find main function in deployment script");
}

if (failures.length > 0) {
  console.error("Deployment template check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Deployment template check passed.");

function extractHeredocAfter(marker) {
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const start = content.indexOf("\n", markerIndex);
  if (start === -1) {
    return null;
  }

  const rest = content.slice(start + 1);
  const endMatch = rest.match(/^EOF$/m);

  return endMatch?.index === undefined ? null : rest.slice(0, endMatch.index);
}
