import { getPaymentMode, isMockPaymentEnabled, ServerConfigError } from "@/server/env";
import type { RechargeOrder } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";

export function createPaymentInfo(order: RechargeOrder) {
  assertMockPaymentAvailable();

  return {
    provider: "mock",
    payChannel: order.payChannel,
    status: order.status,
    mockPaymentUrl: "/api/v1/payments/mock/notify",
    qrCodeText: `LIGHTQUANT_MOCK_PAY:${order.orderNo}`,
    pollUrl: `/api/v1/payments/${order.id}/status`
  };
}

export function assertMockPaymentAvailable() {
  let paymentMode: ReturnType<typeof getPaymentMode>;

  try {
    paymentMode = getPaymentMode();
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("PAYMENT_CONFIG_ERROR", "支付配置不可用", 500);
    }

    throw error;
  }

  if (paymentMode !== "mock" || process.env.NODE_ENV === "production" || !isMockPaymentEnabled()) {
    throw new ApiError("PAYMENT_CONFIG_ERROR", "当前环境未启用模拟支付", 500);
  }
}

