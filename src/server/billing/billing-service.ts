import { randomUUID } from "crypto";
import { applyRechargeCredit } from "@/server/credits/credit-service";
import type { OrderStatus, PayChannel, PaymentProvider, PaymentTransaction, RechargeOrder, RechargePlan } from "@/server/domain";
import { ApiError } from "@/server/http/api-response";
import { requireAdmin } from "@/server/admin/admin-auth";
import { createPaymentAction } from "@/server/payments/payment-provider";
import { assertMockPaymentAvailable, assertPayChannelAvailable, getOrderExpiresAt, getPaymentOrderExpireMinutes, isOrderExpired, isValidMaintenanceSecret } from "@/server/payments/payment-config";
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

type VerifiedPaymentNotifyInput = {
  provider: PaymentProvider;
  orderNo: string;
  providerTradeNo: string;
  notifyId: string;
  amountCents: number;
  rawPayload: Record<string, unknown>;
};

type MaintenanceInput = {
  maintenanceSecret?: string | null;
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
  assertPayChannelAvailable(payChannel);
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

    const paymentAction = await createPaymentAction(existingOrder);

    return {
      order: toOrderResponse(existingOrder),
      paymentAction,
      payment: paymentAction,
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

  const paymentAction = await createPaymentAction(order);

  return {
    order: toOrderResponse(order),
    paymentAction,
    payment: paymentAction,
    duplicated: false
  };
}

export async function getOrderForUser(userId: string, orderId: string) {
  const order = await getOwnedOrder(userId, orderId);
  const transaction = await getRepository().findLatestPaymentTransactionByOrderId(order.id);

  return {
    order: toOrderResponse(order),
    payment: toPaymentStatusResponse(order, transaction)
  };
}

export async function getPaymentStatusForUser(userId: string, orderId: string) {
  const order = await getOwnedOrder(userId, orderId);
  const transaction = await getRepository().findLatestPaymentTransactionByOrderId(order.id);

  return {
    order: toOrderResponse(order),
    payment: toPaymentStatusResponse(order, transaction)
  };
}

export async function handleMockPaymentNotify(input: MockNotifyInput, requestId: string) {
  assertMockPaymentAvailable();

  return withRepositoryTransaction(async () => {
    if (!input.orderId && !input.orderNo) {
      throw new ApiError("VALIDATION_ERROR", "orderId 或 orderNo 至少提供一个", 400);
    }

    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new ApiError("VALIDATION_ERROR", "amountCents 参数不正确", 400);
    }

    const repository = getRepository();
    const order = input.orderId ? await repository.findOrderById(input.orderId) : await repository.findOrderByOrderNo(input.orderNo ?? "");

    if (!order) {
      throw new ApiError("NOT_FOUND", "充值订单不存在", 404);
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

    const now = new Date().toISOString();

    if (input.amountCents !== order.amountCents) {
      await createMockPaymentTransaction({
        order,
        input,
        providerTradeNo,
        notifyId,
        idempotencyKey,
        status: "FAILED",
        failedReason: "PAYMENT_AMOUNT_MISMATCH",
        orderStatusAfter: order.status,
        createdAt: now
      });
      throw new ApiError("PAYMENT_AMOUNT_MISMATCH", "支付金额与订单金额不一致", 400);
    }

    if (order.status === "PAID") {
      throw new ApiError("ORDER_ALREADY_PAID", "订单已支付，请勿重复支付", 409);
    }

    if (order.status === "CLOSED") {
      throw new ApiError("ORDER_CLOSED", "订单已关闭，不能继续支付", 409);
    }

    if (order.status === "FAILED") {
      throw new ApiError("FORBIDDEN", "失败订单不允许自动支付入账", 403);
    }

    if (isOrderExpired(order.createdAt, new Date(now))) {
      const closeResult = await repository.closeExpiredRechargeOrders(paymentCutoff(now), now);
      const closedOrder = closeResult.count > 0 ? await repository.findOrderById(order.id) : null;
      const finalOrder = closedOrder ?? {
        ...order,
        status: "CLOSED" as const,
        closedAt: now,
        updatedAt: now
      };
      await createMockPaymentTransaction({
        order,
        input,
        providerTradeNo,
        notifyId,
        idempotencyKey,
        status: "FAILED",
        failedReason: "ORDER_EXPIRED",
        orderStatusAfter: finalOrder.status,
        createdAt: now
      });
      throw new ApiError("ORDER_EXPIRED", "订单已过期，请重新创建订单", 409);
    }

    const transaction = await createMockPaymentTransaction({
      order,
      input,
      providerTradeNo,
      notifyId,
      idempotencyKey,
      status: "VERIFIED",
      failedReason: null,
      orderStatusAfter: "PAID",
      createdAt: now
    });
    const paidOrder = await repository.markOrderPaid(order.id, now);
    const creditResult = await applyRechargeCredit(paidOrder, requestId);

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

export async function handleVerifiedPaymentNotify(input: VerifiedPaymentNotifyInput, requestId: string) {
  return withRepositoryTransaction(async () => {
    const repository = getRepository();
    const order = await repository.findOrderByOrderNo(input.orderNo);

    if (!order) {
      throw new ApiError("NOT_FOUND", "充值订单不存在", 404);
    }

    if (order.payChannel !== input.provider) {
      throw new ApiError("PAYMENT_VERIFY_FAILED", "支付通知渠道不匹配", 400);
    }

    const idempotencyKey = `payment:${input.provider}:${input.notifyId}`;
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

    const now = new Date().toISOString();

    if (input.amountCents !== order.amountCents) {
      await createPaymentTransaction({
        order,
        provider: input.provider,
        providerTradeNo: input.providerTradeNo,
        notifyId: input.notifyId,
        amountCents: input.amountCents,
        rawPayload: input.rawPayload,
        idempotencyKey,
        status: "FAILED",
        failedReason: "PAYMENT_AMOUNT_MISMATCH",
        orderStatusAfter: order.status,
        createdAt: now
      });
      throw new ApiError("PAYMENT_AMOUNT_MISMATCH", "支付金额与订单金额不一致", 400);
    }

    if (order.status === "PAID") {
      const transaction = await createPaymentTransaction({
        order,
        provider: input.provider,
        providerTradeNo: input.providerTradeNo,
        notifyId: input.notifyId,
        amountCents: input.amountCents,
        rawPayload: input.rawPayload,
        idempotencyKey,
        status: "DUPLICATE",
        failedReason: "ORDER_ALREADY_PAID",
        orderStatusAfter: order.status,
        createdAt: now
      });

      return {
        order: toOrderResponse(order),
        payment: toPaymentStatusResponse(order, transaction, true),
        credit: {
          granted: true,
          duplicated: true
        }
      };
    }

    if (order.status === "CLOSED") {
      await createPaymentTransaction({
        order,
        provider: input.provider,
        providerTradeNo: input.providerTradeNo,
        notifyId: input.notifyId,
        amountCents: input.amountCents,
        rawPayload: input.rawPayload,
        idempotencyKey,
        status: "FAILED",
        failedReason: "ORDER_CLOSED",
        orderStatusAfter: order.status,
        createdAt: now
      });
      throw new ApiError("ORDER_CLOSED", "订单已关闭，不能继续支付", 409);
    }

    if (order.status === "FAILED") {
      await createPaymentTransaction({
        order,
        provider: input.provider,
        providerTradeNo: input.providerTradeNo,
        notifyId: input.notifyId,
        amountCents: input.amountCents,
        rawPayload: input.rawPayload,
        idempotencyKey,
        status: "FAILED",
        failedReason: "ORDER_FAILED",
        orderStatusAfter: order.status,
        createdAt: now
      });
      throw new ApiError("FORBIDDEN", "失败订单不允许自动支付入账", 403);
    }

    if (isOrderExpired(order.createdAt, new Date(now))) {
      const closeResult = await repository.closeExpiredRechargeOrders(paymentCutoff(now), now);
      const closedOrder = closeResult.count > 0 ? await repository.findOrderById(order.id) : null;
      const finalOrder = closedOrder ?? {
        ...order,
        status: "CLOSED" as const,
        closedAt: now,
        updatedAt: now
      };
      await createPaymentTransaction({
        order,
        provider: input.provider,
        providerTradeNo: input.providerTradeNo,
        notifyId: input.notifyId,
        amountCents: input.amountCents,
        rawPayload: input.rawPayload,
        idempotencyKey,
        status: "FAILED",
        failedReason: "ORDER_EXPIRED",
        orderStatusAfter: finalOrder.status,
        createdAt: now
      });
      throw new ApiError("ORDER_EXPIRED", "订单已过期，请重新创建订单", 409);
    }

    const transaction = await createPaymentTransaction({
      order,
      provider: input.provider,
      providerTradeNo: input.providerTradeNo,
      notifyId: input.notifyId,
      amountCents: input.amountCents,
      rawPayload: input.rawPayload,
      idempotencyKey,
      status: "VERIFIED",
      failedReason: null,
      orderStatusAfter: "PAID",
      createdAt: now
    });
    const paidOrder = await repository.markOrderPaid(order.id, now);
    const creditResult = await applyRechargeCredit(paidOrder, requestId);

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

export async function closeExpiredOrders(input: MaintenanceInput = {}) {
  await requireMaintenanceAccess(input);

  const closedAt = new Date().toISOString();
  const result = await getRepository().closeExpiredRechargeOrders(paymentCutoff(closedAt), closedAt);

  return {
    closedCount: result.count,
    expireMinutes: getPaymentOrderExpireMinutes(),
    closedAt,
    cutoff: paymentCutoff(closedAt)
  };
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
  const expiresAt = getOrderExpiresAt(order.createdAt);

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
    expiresAt,
    expired: order.status === "PENDING" && isOrderExpired(order.createdAt),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

function toPaymentStatusResponse(order: RechargeOrder, transaction: PaymentTransaction | null = null, duplicated = false) {
  const expiresAt = getOrderExpiresAt(order.createdAt);

  return {
    provider: transaction?.provider ?? "mock",
    status: order.status,
    paid: order.status === "PAID",
    channel: order.payChannel,
    amountCents: order.amountCents,
    creditGranted: order.status === "PAID",
    expired: order.status === "PENDING" && isOrderExpired(order.createdAt),
    expiresAt,
    duplicated,
    transactionStatus: transaction?.status ?? null,
    latestTransactionStatus: transaction?.status ?? null,
    providerTradeNo: transaction?.providerTradeNo,
    notifyId: transaction?.notifyId,
    failedReason: transaction?.failedReason ?? null
  };
}

async function createMockPaymentTransaction(input: {
  order: RechargeOrder;
  input: MockNotifyInput;
  providerTradeNo: string;
  notifyId: string;
  idempotencyKey: string;
  status: PaymentTransaction["status"];
  failedReason: string | null;
  orderStatusAfter: OrderStatus;
  createdAt: string;
}) {
  return getRepository().createPaymentTransaction({
    orderId: input.order.id,
    provider: "mock",
    providerTradeNo: input.providerTradeNo,
    notifyId: input.notifyId,
    amountCents: input.input.amountCents,
    status: input.status,
    rawPayload: {
      orderId: input.input.orderId,
      orderNo: input.input.orderNo,
      mockTradeNo: input.providerTradeNo,
      amountCents: input.input.amountCents
    },
    idempotencyKey: input.idempotencyKey,
    verifiedAt: input.status === "VERIFIED" ? input.createdAt : null,
    failedReason: input.failedReason,
    orderStatusBefore: input.order.status,
    orderStatusAfter: input.orderStatusAfter,
    createdAt: input.createdAt
  });
}

async function createPaymentTransaction(input: {
  order: RechargeOrder;
  provider: PaymentProvider;
  providerTradeNo: string;
  notifyId: string;
  amountCents: number;
  rawPayload: Record<string, unknown>;
  idempotencyKey: string;
  status: PaymentTransaction["status"];
  failedReason: string | null;
  orderStatusAfter: OrderStatus;
  createdAt: string;
}) {
  return getRepository().createPaymentTransaction({
    orderId: input.order.id,
    provider: input.provider,
    providerTradeNo: input.providerTradeNo,
    notifyId: input.notifyId,
    amountCents: input.amountCents,
    status: input.status,
    rawPayload: input.rawPayload,
    idempotencyKey: input.idempotencyKey,
    verifiedAt: input.status === "VERIFIED" ? input.createdAt : null,
    failedReason: input.failedReason,
    orderStatusBefore: input.order.status,
    orderStatusAfter: input.orderStatusAfter,
    createdAt: input.createdAt
  });
}

async function requireMaintenanceAccess(input: MaintenanceInput) {
  if (isValidMaintenanceSecret(input.maintenanceSecret ?? null)) {
    return;
  }

  try {
    await requireAdmin();
    return;
  } catch {
    throw new ApiError("MAINTENANCE_UNAUTHORIZED", "维护接口未授权", 401);
  }
}

function paymentCutoff(now: string) {
  return new Date(new Date(now).getTime() - getPaymentOrderExpireMinutes() * 60 * 1000).toISOString();
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
