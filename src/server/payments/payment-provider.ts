import type { RechargeOrder } from "@/server/domain";
import { basePaymentAction, type PaymentAction } from "@/server/payments/payment-action";
import { createAlipayPaymentAction } from "@/server/payments/providers/alipay-provider";
import { createWechatPaymentAction } from "@/server/payments/providers/wechat-provider";

export async function createPaymentAction(order: RechargeOrder): Promise<PaymentAction> {
  if (order.payChannel === "alipay") {
    return createAlipayPaymentAction(order);
  }

  if (order.payChannel === "wechat") {
    return createWechatPaymentAction(order);
  }

  return {
    ...basePaymentAction(order),
    type: "mock",
    qrCodeText: `LIGHTQUANT_MOCK_PAY:${order.orderNo}`,
    mockPaymentUrl: "/api/v1/payments/mock/notify"
  };
}
