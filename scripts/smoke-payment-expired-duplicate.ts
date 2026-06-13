const clientRequestId = `smoke-expired-duplicate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const userId = "smoke-expired-duplicate-user";
const createdAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.LIGHTQUANT_PAYMENT_MODE = "mock";
process.env.PAYMENT_MOCK_ENABLED = "true";
process.env.PAYMENT_ORDER_EXPIRE_MINUTES = "30";

console.log("LightQuant expired duplicate recharge order smoke test");
console.log(
  JSON.stringify(
    {
      dataMode: process.env.LIGHTQUANT_DATA_MODE,
      paymentMode: process.env.LIGHTQUANT_PAYMENT_MODE,
      note:
        "This smoke uses the mock repository to verify an expired PENDING order with the same clientRequestId is closed and does not return a payment action."
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
  const { createRechargeOrder } = await import("@/server/billing/billing-service");
  const { getRepository } = await import("@/server/repositories");
  const repository = getRepository();

  const seededOrder = await repository.createRechargeOrder({
    orderNo: `LQEXPIRED${Date.now()}`,
    userId,
    planId: "starter",
    amountCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    payChannel: "mock",
    status: "PENDING",
    clientRequestId,
    paidAt: null,
    closedAt: null,
    createdAt,
    updatedAt: createdAt
  });

  const result = await createRechargeOrder(userId, {
    planId: "starter",
    payChannel: "mock",
    clientRequestId
  });

  assertEqual("expired-duplicate-flag", result.duplicated, true);
  assertEqual("expired-duplicate-order-id", result.order.id, seededOrder.id);
  assertEqual("expired-duplicate-order-status", result.order.status, "CLOSED");
  assertEqual("expired-duplicate-payment-action", result.paymentAction, null);
  assertEqual("expired-duplicate-payment", result.payment, null);

  const storedOrder = await repository.findOrderById(seededOrder.id);
  assertEqual("expired-duplicate-stored-status", storedOrder?.status, "CLOSED");

  console.log(
    JSON.stringify(
      {
        ok: true,
        order: {
          id: result.order.id,
          status: result.order.status,
          expired: result.order.expired,
          paymentActionReturned: Boolean(result.paymentAction)
        }
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
