import type { PayChannel, RechargeOrder } from "@/server/domain";
import { getOrderExpiresAt } from "@/server/payments/payment-config";

export type PaymentAction =
  | PaymentActionBase & {
      type: "mock";
      qrCodeText: string;
      mockPaymentUrl: string;
    }
  | PaymentActionBase & {
      type: "redirect";
      redirectUrl?: string;
      formHtml?: string;
    }
  | PaymentActionBase & {
      type: "qr_code";
      qrCodeText: string;
    };

type PaymentActionBase = {
  provider: PayChannel;
  payChannel: PayChannel;
  status: RechargeOrder["status"];
  orderId: string;
  orderNo: string;
  amountCents: number;
  totalPoints: number;
  expiresAt: string;
  pollUrl: string;
};

export function basePaymentAction(order: RechargeOrder): PaymentActionBase {
  return {
    provider: order.payChannel,
    payChannel: order.payChannel,
    status: order.status,
    orderId: order.id,
    orderNo: order.orderNo,
    amountCents: order.amountCents,
    totalPoints: order.totalPoints,
    expiresAt: getOrderExpiresAt(order.createdAt),
    pollUrl: `/api/v1/payments/${order.id}/status`
  };
}
