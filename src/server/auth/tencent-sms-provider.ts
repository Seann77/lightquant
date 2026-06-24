import * as tencentcloud from "tencentcloud-sdk-nodejs";
import { getTencentSmsConfig } from "@/server/env";
import { ApiError } from "@/server/http/api-response";

const smsClient = tencentcloud.sms.v20210111.Client;

type TencentSmsClient = InstanceType<typeof smsClient>;

let tencentClient: TencentSmsClient | null = null;

export async function sendTencentSmsCode(input: { phone: string; code: string; outId: string }) {
  const config = getTencentSmsConfig();
  const response = await sendTencentSmsRequest({
    SmsSdkAppId: config.smsSdkAppId,
    SignName: config.signName,
    TemplateId: config.templateId,
    TemplateParamSet: createTemplateParamSet(input.code, config.validTimeSeconds, config.templateParamKeys),
    PhoneNumberSet: [formatTencentPhoneNumber(input.phone, config.countryCode)],
    SessionContext: input.outId
  });
  const firstStatus = response.SendStatusSet?.[0];

  if (!firstStatus || firstStatus.Code !== "Ok") {
    throw new ApiError("SMS_PROVIDER_ERROR", `Tencent SMS send failed: ${firstStatus?.Code || "Unknown"} ${firstStatus?.Message || ""}`.trim(), 502);
  }

  return {
    serialNo: firstStatus.SerialNo ?? null,
    requestId: response.RequestId ?? null
  };
}

async function sendTencentSmsRequest(request: Parameters<TencentSmsClient["SendSms"]>[0]) {
  try {
    return await getTencentClient().SendSms(request);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("SMS_PROVIDER_ERROR", `Tencent SMS send failed: ${getTencentErrorMessage(error)}`, 502);
  }
}

function getTencentClient() {
  if (!tencentClient) {
    const config = getTencentSmsConfig();

    tencentClient = new smsClient({
      credential: {
        secretId: config.secretId,
        secretKey: config.secretKey
      },
      region: config.region,
      profile: {
        signMethod: "HmacSHA256",
        httpProfile: {
          reqMethod: "POST",
          reqTimeout: 10,
          endpoint: config.endpoint
        }
      }
    });
  }

  return tencentClient;
}

function createTemplateParamSet(code: string, validTimeSeconds: number, keys: string[]) {
  const minutes = String(Math.ceil(validTimeSeconds / 60));

  return keys.map((key) => {
    if (key === "code") {
      return code;
    }

    if (key === "minutes" || key === "min") {
      return minutes;
    }

    return key;
  });
}

function formatTencentPhoneNumber(phone: string, countryCode: string) {
  return `+${countryCode}${phone}`;
}

function getTencentErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const code = "code" in error ? String((error as { code?: unknown }).code || "") : "";
    const message = "message" in error ? String((error as { message?: unknown }).message || "") : "";

    return [code, message].filter(Boolean).join(" ");
  }

  return "Unknown error";
}
