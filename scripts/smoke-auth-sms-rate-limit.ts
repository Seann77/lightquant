import { readFileSync } from "node:fs";

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.LIGHTQUANT_SMS_PROVIDER = "mock";
process.env.AUTH_SECRET ||= "auth-rate-limit-smoke-secret-1234567890";

type ApiErrorShape = {
  code: string;
  message: string;
  status: number;
};

const RATE_LIMIT_MESSAGE = "发送过于频繁，请稍后再试";
const INVALID_CODE_MESSAGE = "验证码不正确或已过期";
const MOCK_CODE = "123456";
const requestIp = "203.0.113.10";
const userAgent = "auth-sms-rate-limit-smoke";
const now = Date.now();

console.log("LightQuant auth SMS rate-limit smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      smsProvider: process.env.LIGHTQUANT_SMS_PROVIDER,
      note:
        "Uses in-process mock repository and mock SMS. It does not call real SMS providers and does not print verification codes or secrets."
    },
    null,
    2
  )
);

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});

async function main() {
  const { requestSmsCode, loginWithSmsCode } = await import("@/server/auth/auth-service");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();

  const phone = createPhone(1001);
  const firstSend = await requestSmsCode({ phone, scene: "login", requestIp });

  expect("first-send-phone", firstSend.phone === phone);
  expect("first-send-hides-mock-code", !("mockCode" in firstSend));

  await expectApiError(
    "cooldown-send",
    () => requestSmsCode({ phone, scene: "login", requestIp }),
    {
      code: "RATE_LIMITED",
      message: RATE_LIMIT_MESSAGE,
      status: 429
    }
  );

  const login = await loginWithSmsCode({
    phone,
    code: MOCK_CODE,
    acceptedLegal: true,
    inviteCode: undefined,
    requestId: "auth-rate-smoke-login",
    requestIp,
    userAgent
  });
  expect("login-success", Boolean(login.user.id));

  await expectApiError(
    "used-code-reuse",
    () => loginWithSmsCode({
      phone,
      code: MOCK_CODE,
      acceptedLegal: true,
      inviteCode: undefined,
      requestId: "auth-rate-smoke-reuse",
      requestIp,
      userAgent
    }),
    {
      code: "VALIDATION_ERROR",
      message: INVALID_CODE_MESSAGE,
      status: 400
    }
  );

  const expiredPhone = createPhone(1002);
  await repository.createSmsCode({
    phone: expiredPhone,
    scene: "login",
    codeHash: null,
    mockCode: MOCK_CODE,
    expiresAt: new Date(now - 1000).toISOString(),
    requestIp,
    createdAt: new Date(now - 10 * 60 * 1000).toISOString()
  });
  await expectApiError(
    "expired-code",
    () => loginWithSmsCode({
      phone: expiredPhone,
      code: MOCK_CODE,
      acceptedLegal: true,
      inviteCode: undefined,
      requestId: "auth-rate-smoke-expired",
      requestIp,
      userAgent
    }),
    {
      code: "VALIDATION_ERROR",
      message: INVALID_CODE_MESSAGE,
      status: 400
    }
  );

  const failurePhone = createPhone(1003);
  await requestSmsCode({ phone: failurePhone, scene: "login", requestIp: "203.0.113.11" });

  for (let index = 0; index < 5; index += 1) {
    await expectApiError(
      `wrong-code-${index + 1}`,
      () => loginWithSmsCode({
        phone: failurePhone,
        code: "654321",
        acceptedLegal: true,
        inviteCode: undefined,
        requestId: `auth-rate-smoke-wrong-${index}`,
        requestIp: "203.0.113.11",
        userAgent
      }),
      {
        code: "VALIDATION_ERROR",
        message: INVALID_CODE_MESSAGE,
        status: 400
      }
    );
  }

  await expectApiError(
    "wrong-code-lock",
    () => loginWithSmsCode({
      phone: failurePhone,
      code: "654321",
      acceptedLegal: true,
      inviteCode: undefined,
      requestId: "auth-rate-smoke-wrong-lock",
      requestIp: "203.0.113.11",
      userAgent
    }),
    {
      code: "RATE_LIMITED",
      message: RATE_LIMIT_MESSAGE,
      status: 429
    }
  );

  const dailyPhone = createPhone(1004);
  const historicalCreatedAt = new Date(now - 2 * 60 * 1000).toISOString();

  for (let index = 0; index < 10; index += 1) {
    await repository.createSmsCode({
      phone: dailyPhone,
      scene: "login",
      codeHash: null,
      mockCode: MOCK_CODE,
      expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
      requestIp: `203.0.113.${40 + index}`,
      createdAt: historicalCreatedAt
    });
  }

  await expectApiError(
    "daily-phone-limit",
    () => requestSmsCode({ phone: dailyPhone, scene: "login", requestIp: "203.0.113.80" }),
    {
      code: "RATE_LIMITED",
      message: RATE_LIMIT_MESSAGE,
      status: 429
    }
  );

  const hourlyIp = "203.0.113.90";

  for (let index = 0; index < 30; index += 1) {
    await repository.createSmsCode({
      phone: createPhone(2000 + index),
      scene: "login",
      codeHash: null,
      mockCode: MOCK_CODE,
      expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
      requestIp: hourlyIp,
      createdAt: historicalCreatedAt
    });
  }

  await expectApiError(
    "hourly-ip-limit",
    () => requestSmsCode({ phone: createPhone(3001), scene: "login", requestIp: hourlyIp }),
    {
      code: "RATE_LIMITED",
      message: RATE_LIMIT_MESSAGE,
      status: 429
    }
  );

  verifyFrontendCooldownSource();

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "first send succeeds",
          "mock code is not returned",
          "same phone cooldown is enforced",
          "used code cannot be reused",
          "expired code is rejected",
          "five wrong code attempts are allowed before a short lock",
          "daily phone limit is enforced",
          "hourly IP limit is enforced",
          "frontend resend button enters a 60s disabled cooldown"
        ]
      },
      null,
      2
    )
  );
}

async function expectApiError(
  step: string,
  action: () => Promise<unknown>,
  expected: ApiErrorShape
) {
  try {
    await action();
  } catch (error) {
    const actual = toApiErrorShape(error);

    if (
      actual.code !== expected.code ||
      actual.message !== expected.message ||
      actual.status !== expected.status
    ) {
      throw new Error(`${step} failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }

    return;
  }

  throw new Error(`${step} failed: expected API error ${expected.code}`);
}

function toApiErrorShape(error: unknown): ApiErrorShape {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    "status" in error
  ) {
    return {
      code: String((error as { code: unknown }).code),
      message: String((error as { message: unknown }).message),
      status: Number((error as { status: unknown }).status)
    };
  }

  return {
    code: "UNKNOWN",
    message: error instanceof Error ? error.message : String(error),
    status: 0
  };
}

function expect(step: string, condition: boolean) {
  if (!condition) {
    throw new Error(`${step} failed`);
  }
}

function verifyFrontendCooldownSource() {
  const source = readFileSync("src/components/shell/LoginModal.tsx", "utf8");

  expect("frontend-cooldown-start", source.includes("setCodeCooldownSeconds(60)"));
  expect(
    "frontend-cooldown-disabled",
    source.includes("disabled={sendingCode || codeCooldownSeconds > 0}")
  );
  expect("frontend-cooldown-text", source.includes("重新发送 ${codeCooldownSeconds}s"));
  expect("frontend-resend-text", source.includes("重新获取"));
  expect("frontend-invalid-phone-text", source.includes("请输入有效手机号"));
}

function createPhone(suffix: number) {
  return `158700${String(suffix).padStart(5, "0")}`.slice(0, 11);
}
