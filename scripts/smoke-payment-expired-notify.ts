const userId = "smoke-expired-notify-user";
const createdAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const now = new Date().toISOString();

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.LIGHTQUANT_PAYMENT_MODE = "mock";
process.env.PAYMENT_MOCK_ENABLED = "true";
process.env.PAYMENT_ORDER_EXPIRE_MINUTES = "5";

console.log("LightQuant expired payment notify smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      paymentMode: process.env.LIGHTQUANT_PAYMENT_MODE,
      note:
        "This smoke uses the mock repository to verify an expired PENDING order cannot be credited by payment notify."
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
  const { handleMockPaymentNotify } = await import("@/server/billing/billing-service");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();
  const accountBefore = await repository.ensureCreditAccount(userId, now);
  const order = await repository.createRechargeOrder({
    orderNo: `LQEXPNOTIFY${Date.now()}`,
    userId,
    planId: "starter",
    amountCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    payChannel: "mock",
    status: "PENDING",
    clientRequestId: `smoke-expired-notify-${Date.now()}`,
    paidAt: null,
    closedAt: null,
    createdAt,
    updatedAt: createdAt
  });
  let errorCode = "";

  try {
    await handleMockPaymentNotify(
      {
        orderId: order.id,
        mockTradeNo: `MOCK-EXPIRED-${order.orderNo}`,
        amountCents: order.amountCents
      },
      "smoke-expired-notify-request"
    );
  } catch (error) {
    errorCode = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  }

  assertEqual("expired-notify-error-code", errorCode, "ORDER_EXPIRED");

  const storedOrder = await repository.findOrderById(order.id);
  assertEqual("expired-notify-order-status", storedOrder?.status, "CLOSED");

  const transaction = await repository.findLatestPaymentTransactionByOrderId(order.id);

  if (!transaction) {
    throw new Error("expired-notify-transaction missing");
  }

  assertEqual("expired-notify-transaction-status", transaction.status, "FAILED");
  assertEqual("expired-notify-failed-reason", transaction.failedReason, "ORDER_EXPIRED");
  assertEqual("expired-notify-order-before", transaction.orderStatusBefore, "PENDING");
  assertEqual("expired-notify-order-after", transaction.orderStatusAfter, "CLOSED");

  const accountAfter = await repository.getCreditAccount(userId);
  assertEqual("expired-notify-balance-unchanged", accountAfter?.balance, accountBefore.balance);

  console.log(
    JSON.stringify(
      {
        ok: true,
        order: {
          id: order.id,
          status: storedOrder?.status
        },
        transaction: {
          status: transaction.status,
          failedReason: transaction.failedReason,
          orderStatusBefore: transaction.orderStatusBefore,
          orderStatusAfter: transaction.orderStatusAfter
        },
        balanceBefore: accountBefore.balance,
        balanceAfter: accountAfter?.balance
      },
      null,
      2
    )
  );
}

function assertEqual(step: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)}`);
  }
}

export {};
