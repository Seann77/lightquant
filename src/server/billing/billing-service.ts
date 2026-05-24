import { randomUUID } from "crypto";
import { applyRechargeCredit } from "@/server/credits/credit-service";
import type { PayChannel, PaymentTransaction, RechargeOrder, RechargePlan } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { assertMockPaymentAvailable, createPaymentInfo } from "@/server/payments/payment-provider";
import { getRepository, withRepositoryTransaction } from "@/server/repositories";

type CreateRechargeOrderInput = {
  planId: string;
  payChannel: string;
  clientRequestId: string;
};

type MockNotifyInput = {
  orderId?: string;
  orderNo?: string;
  mockTradeNo?: string;
  amountCents: number;
};

export async function listRechargePlans() {
  const plans = await getRepository().listEnabledRechargePlans();

  return {
    items: plans.map(toRechargePlanResponse)
  };
}

export async function createRechargeOrder(userId: string, input: CreateRechargeOrderInput) {
  const planId = normalizeNonEmpty(input.planId, "planId");
  const payChannel = normalizePayChannel(input.payChannel);
  const clientRequestId = normalizeClientRequestId(input.clientRequestId);
  const repository = getRepository();
  const plan = await repository.findRechargePlanById(planId);

  if (!plan || !plan.enabled) {
    throw new ApiError("NOT_FOUND", "充值套餐不存在或已下架", 404);
  }

  const existingOrder = await repository.findRechargeOrderByClientRequestId(userId, clientRequestId);

  if (existingOrder) {
    if (existingOrder.planId !== plan.id || existingOrder.payChannel !== payChannel) {
      throw new ApiError("IDEMPOTENCY_CONFLICT", "重复请求参数与原订单不一致", 409);
    }

    return {
      order: toOrderResponse(existingOrder),
      payment: createPaymentInfo(existingOrder),
      duplicated: true
    };
  }

  const now = new Date().toISOString();
  const order = await repository.createRechargeOrder({
    orderNo: createOrderNo(),
    userId,
    planId: plan.id,
    amountCents: plan.priceCents,
    points: plan.points,
    bonusPoints: plan.bonusPoints,
    totalPoints: plan.totalPoints,
    payChannel,
    status: "PENDING",
    clientRequestId,
    paidAt: null,
    closedAt: null,
    createdAt: now,
    updatedAt: now
  });

  return {
    order: toOrderResponse(order),
    payment: createPaymentInfo(order),
    duplicated: false
  };
}

export async function getOrderForUser(userId: string, orderId: string) {
  const order = await getOwnedOrder(userId, orderId);

  return {
    order: toOrderResponse(order),
    payment: toPaymentStatusResponse(order)
  };
}

export async function getPaymentStatusForUser(userId: string, orderId: string) {
  const order = await getOwnedOrder(userId, orderId);

  return {
    order: toOrderResponse(order),
    payment: toPaymentStatusResponse(order)
  };
}

export async function handleMockPaymentNotify(input: MockNotifyInput, requestId: string) {
  assertMockPaymentAvailable();

  return withRepositoryTransaction(async () => {

  if (!input.orderId && !input.orderNo) {
    throw new ApiError("VALIDATION_ERROR", "orderId 或 orderNo 至少提供一个", 400);
  }

  const repository = getRepository();
  const order = input.orderId ? await repository.findOrderById(input.orderId) : await repository.findOrderByOrderNo(input.orderNo ?? "");

  if (!order) {
    throw new ApiError("NOT_FOUND", "充值订单不存在", 404);
  }

  const plan = await repository.findRechargePlanById(order.planId);

  if (!plan) {
    throw new ApiError("NOT_FOUND", "充值套餐不存在", 404);
  }

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new ApiError("VALIDATION_ERROR", "amountCents 参数不正确", 400);
  }

  if (input.amountCents !== order.amountCents) {
    throw new ApiError("PAYMENT_AMOUNT_MISMATCH", "支付金额与订单金额不一致", 400);
  }

  const providerTradeNo = normalizeNonEmpty(input.mockTradeNo ?? `MOCK-${order.orderNo}`, "mockTradeNo");
  const notifyId = `mock:${providerTradeNo}`;
  const idempotencyKey = `payment:${notifyId}`;
  const existingTransaction = await repository.findPaymentTransactionByIdempotencyKey(idempotencyKey);

  if (existingTransaction) {
    return {
      order: toOrderResponse(order),
      payment: toPaymentStatusResponse(order, existingTransaction, true),
      credit: {
        granted: order.status === "PAID",
        duplicated: true
      }
    };
  }

  if (order.status === "PAID") {
    throw new ApiError("ORDER_ALREADY_PAID", "订单已支付，请勿重复支付", 409);
  }

  if (order.status !== "PENDING") {
    throw new ApiError("FORBIDDEN", "当前订单状态不允许支付确认", 403);
  }

  const now = new Date().toISOString();
  const transaction = await repository.createPaymentTransaction({
    orderId: order.id,
    provider: "mock",
    providerTradeNo,
    notifyId,
    amountCents: input.amountCents,
    status: "VERIFIED",
    rawPayload: {
      orderId: input.orderId,
      orderNo: input.orderNo,
      mockTradeNo: providerTradeNo,
      amountCents: input.amountCents
    },
    idempotencyKey,
    createdAt: now
  });
  const paidOrder = await repository.markOrderPaid(order.id, now);
  const creditResult = await applyRechargeCredit(paidOrder, plan, requestId);

  return {
    order: toOrderResponse(paidOrder),
    payment: toPaymentStatusResponse(paidOrder, transaction, false),
    credit: {
      granted: true,
      duplicated: creditResult.duplicated,
      account: creditResult.account
    }
  };
  });
}

function toRechargePlanResponse(plan: RechargePlan) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    price: (plan.priceCents / 100).toFixed(2),
    points: plan.points,
    bonusPoints: plan.bonusPoints,
    totalPoints: plan.totalPoints,
    enabled: plan.enabled,
    sort: plan.sort
  };
}

function toOrderResponse(order: RechargeOrder) {
  return {
    id: order.id,
    orderNo: order.orderNo,
    planId: order.planId,
    amountCents: order.amountCents,
    price: (order.amountCents / 100).toFixed(2),
    points: order.points,
    bonusPoints: order.bonusPoints,
    totalPoints: order.totalPoints,
    payChannel: order.payChannel,
    status: order.status,
    clientRequestId: order.clientRequestId,
    paidAt: order.paidAt,
    closedAt: order.closedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

function toPaymentStatusResponse(order: RechargeOrder, transaction?: PaymentTransaction, duplicated = false) {
  return {
    provider: transaction?.provider ?? "mock",
    status: order.status,
    paid: order.status === "PAID",
    creditGranted: order.status === "PAID",
    duplicated,
    providerTradeNo: transaction?.providerTradeNo,
    notifyId: transaction?.notifyId
  };
}

async function getOwnedOrder(userId: string, orderId: string) {
  const order = await getRepository().findOrderById(orderId);

  if (!order) {
    throw new ApiError("NOT_FOUND", "充值订单不存在", 404);
  }

  if (order.userId !== userId) {
    throw new ApiError("FORBIDDEN", "无权查看该订单", 403);
  }

  return order;
}

function normalizePayChannel(value: string): PayChannel {
  if (value === "wechat" || value === "alipay" || value === "mock") {
    return value;
  }

  throw new ApiError("VALIDATION_ERROR", "payChannel 参数不正确", 400);
}

function normalizeClientRequestId(value: string) {
  const normalized = normalizeNonEmpty(value, "clientRequestId");

  if (normalized.length > 80) {
    throw new ApiError("VALIDATION_ERROR", "clientRequestId 过长", 400);
  }

  return normalized;
}

function normalizeNonEmpty(value: string, field: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new ApiError("VALIDATION_ERROR", `${field} 参数不正确`, 400);
  }

  return normalized;
}

function createOrderNo() {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

  return `LQ${timestamp}${suffix}`;
}
