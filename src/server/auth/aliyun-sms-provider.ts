import { randomUUID } from "crypto";
import DypnsClient, { CheckSmsVerifyCodeRequest, SendSmsVerifyCodeRequest } from "@alicloud/dypnsapi20170525";
import { getAliyunSmsConfig } from "@/server/env";
import { ApiError } from "@/server/http/api-response";

type AliyunSmsClient = InstanceType<typeof DypnsClient>;

let aliyunClient: AliyunSmsClient | null = null;

export type AliyunSmsSendResult = {
  outId: string;
  bizId: string | null;
  expiresAt: string;
};

export async function sendAliyunSmsCode(phone: string, outId = `lq_${randomUUID()}`): Promise<AliyunSmsSendResult> {
  const config = getAliyunSmsConfig();
  const expiresAt = new Date(Date.now() + config.validTimeSeconds * 1000).toISOString();
  const request = new SendSmsVerifyCodeRequest({
    phoneNumber: phone,
    signName: config.signName,
    templateCode: config.templateCode,
    templateParam: JSON.stringify({
      code: "##code##",
      min: String(Math.ceil(config.validTimeSeconds / 60))
    }),
    countryCode: config.countryCode,
    outId,
    codeLength: config.codeLength,
    codeType: 1,
    validTime: config.validTimeSeconds,
    interval: config.intervalSeconds,
    duplicatePolicy: 1,
    returnVerifyCode: false,
    autoRetry: 1
  });

  try {
    const response = await getAliyunClient().sendSmsVerifyCode(request);
    const body = response.body;

    if (body?.code !== "OK" || body.success === false) {
      throw createAliyunProviderError("SMS verification code send failed", body?.message || body?.code);
    }

    return {
      outId: body.model?.outId || outId,
      bizId: body.model?.bizId ?? null,
      expiresAt
    };
  } catch (error) {
    throw normalizeAliyunError(error, "SMS verification code send failed");
  }
}

export async function checkAliyunSmsCode(input: { phone: string; code: string; outId: string | null }) {
  const config = getAliyunSmsConfig();
  const request = new CheckSmsVerifyCodeRequest({
    phoneNumber: input.phone,
    verifyCode: input.code,
    countryCode: config.countryCode,
    outId: input.outId ?? undefined,
    caseAuthPolicy: 1
  });

  try {
    const response = await getAliyunClient().checkSmsVerifyCode(request);
    const body = response.body;

    if (body?.code !== "OK" || body.success === false) {
      throw createAliyunProviderError("SMS verification code check failed", body?.message || body?.code);
    }

    return body.model?.verifyResult === "PASS";
  } catch (error) {
    throw normalizeAliyunError(error, "SMS verification code check failed");
  }
}

function getAliyunClient() {
  if (!aliyunClient) {
    const config = getAliyunSmsConfig();
    const clientConfig = {
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: config.endpoint,
      readTimeout: 10000,
      connectTimeout: 5000
    } as unknown as ConstructorParameters<typeof DypnsClient>[0];

    aliyunClient = new DypnsClient(clientConfig);
  }

  return aliyunClient;
}

function normalizeAliyunError(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error;
  }

  return createAliyunProviderError(fallbackMessage, getErrorMessage(error));
}

function createAliyunProviderError(message: string, detail?: string) {
  return new ApiError("SMS_PROVIDER_ERROR", detail ? `${message}: ${detail}` : message, 502);
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "");
  }

  return "";
}
