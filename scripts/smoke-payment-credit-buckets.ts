import { randomUUID } from "node:crypto";
import { listRechargePlans, createRechargeOrder, handleMockPaymentNotify } from "@/server/billing/billing-service";
import { applyRechargeCredit, confirmReservation, getCreditAccountForUser, listCreditLedgerForUser, reserveCredits } from "@/server/credits/credit-service";
import { getRepository } from "@/server/repositories";

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.PAYMENT_FEATURE_ENABLED = "true";
process.env.LIGHTQUANT_PAYMENT_MODE = "mock";
process.env.PAYMENT_MOCK_ENABLED = "true";

globalThis.__lightquantMockRepository = undefined;

const failures: string[] = [];

void main();

async function main() {
  await verifyPlans();
  await verifyPromoLimit();
  await verifyLedgerDisplayCopy();
  await verifyMonthlyCardPurchaseMutex();
  await verifyMonthlyCardSummaryFallback();
  await verifyRechargeGrantTypesAndConsumptionPriority();
  await verifyMonthlyExpiry();

  if (failures.length > 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          failures
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify(
        {
          ok: true,
          checks: [
            "5 final recharge plans",
            "promo package purchase limit",
            "ledger display copy categories",
            "active monthly card purchase mutex",
            "active monthly card summary fallback",
            "monthly/permanent recharge buckets",
            "monthly credits consumed before permanent credits",
            "expired monthly credits unavailable"
          ]
        },
        null,
        2
      )
    );
  }
}

async function verifyPlans() {
  const plans = await listRechargePlans(null);
  const expected = new Map([
    ["promo", { priceCents: 990, totalPoints: 900 }],
    ["monthly_plus", { priceCents: 5800, totalPoints: 6000 }],
    ["monthly_pro", { priceCents: 8800, totalPoints: 10000 }],
    ["points_plus", { priceCents: 9900, totalPoints: 7000 }],
    ["points_pro", { priceCents: 19900, totalPoints: 17000 }]
  ]);

  expect("plans-count", plans.items.length === 5);

  for (const [planId, expectedPlan] of expected) {
    const actual = plans.items.find((plan) => plan.id === planId);

    expect(`${planId}-exists`, Boolean(actual));
    expect(`${planId}-price`, actual?.priceCents === expectedPlan.priceCents);
    expect(`${planId}-points`, actual?.totalPoints === expectedPlan.totalPoints);
  }
}

async function verifyPromoLimit() {
  const userId = randomUUID();
  const firstOrder = await createPaidMockOrder(userId, "promo");
  const afterPurchasePlans = await listRechargePlans(userId);
  const promo = afterPurchasePlans.items.find((plan) => plan.id === "promo");

  expect("promo-paid-order", firstOrder.order.status === "PAID");
  expect("promo-plan-marked-purchased", promo?.alreadyPurchased === true);

  try {
    await createRechargeOrder(userId, {
      planId: "promo",
      payChannel: "mock",
      clientRequestId: `promo-repeat-${randomUUID()}`
    });
    failures.push("promo-repeat-create: expected PROMO_PLAN_ALREADY_PURCHASED");
  } catch (error) {
    expect("promo-repeat-error", isApiErrorCode(error, "PROMO_PLAN_ALREADY_PURCHASED"));
  }
}

async function verifyLedgerDisplayCopy() {
  const userId = randomUUID();
  const repository = getRepository();
  const now = new Date().toISOString();

  await repository.applyCreditLedger({
    userId,
    requestId: `signup-display-${randomUUID()}`,
    scene: "signup_bonus",
    type: "bonus",
    direction: "in",
    amount: 300,
    sourceType: "auth",
    sourceId: userId,
    idempotencyKey: `signup-display-${randomUUID()}`,
    remark: "历史注册赠送",
    createdAt: now
  });
  await repository.applyCreditLedger({
    userId,
    requestId: `invite-display-${randomUUID()}`,
    scene: "invite_bonus",
    type: "bonus",
    direction: "in",
    amount: 200,
    sourceType: "invite",
    sourceId: randomUUID(),
    idempotencyKey: `invite-display-${randomUUID()}`,
    remark: "历史邀请奖励",
    createdAt: now
  });
  await repository.applyCreditLedger({
    userId,
    requestId: `refund-display-${randomUUID()}`,
    scene: "ai_task_refund",
    type: "refund",
    direction: "in",
    amount: 50,
    sourceType: "ai_task",
    sourceId: randomUUID(),
    idempotencyKey: `refund-display-${randomUUID()}`,
    remark: "代码解析消耗失败退回",
    createdAt: now
  });

  const displayLedger = await listCreditLedgerForUser(userId, { page: 1, pageSize: 20 });
  const categories = new Set(displayLedger.items.map((item) => item.category));

  expect("display-categories-collapsed", [...categories].every((category) => category === "获取" || category === "消耗" || category === "退回"));
  expect("display-signup-copy", displayLedger.items.some((item) => item.category === "获取" && item.title === "注册赠送" && item.description === "注册赠送：获得 300 基础积分"));
  expect("display-invite-copy", displayLedger.items.some((item) => item.category === "获取" && item.title === "邀请奖励" && item.description === "邀请奖励：获得 200 基础积分"));
  expect("display-refund-copy", displayLedger.items.some((item) => item.category === "退回" && item.title === "任务失败退回——代码翻译解析" && item.description === "代码翻译解析失败：退回 50 基础积分"));
}

async function verifyMonthlyCardPurchaseMutex() {
  const userId = randomUUID();
  const activeOrder = await createPaidMockOrder(userId, "monthly_plus");
  const accountWithMonthly = await getCreditAccountForUser(userId);

  expect("monthly-active-paid-order", activeOrder.order.status === "PAID");
  expect("monthly-active-plan-name", accountWithMonthly.monthlyPlanName === "月卡 Plus");
  expect("monthly-active-expires-at", Boolean(accountWithMonthly.monthlyExpiresAt));

  for (const planId of ["monthly_plus", "monthly_pro"]) {
    try {
      await createRechargeOrder(userId, {
        planId,
        payChannel: "mock",
        clientRequestId: `monthly-repeat-${planId}-${randomUUID()}`
      });
      failures.push(`${planId}-active-monthly-create: expected ACTIVE_MONTHLY_CARD_EXISTS`);
    } catch (error) {
      expect(`${planId}-active-monthly-error`, isApiErrorCode(error, "ACTIVE_MONTHLY_CARD_EXISTS"));
    }
  }

  const expiredUserId = randomUUID();
  await createExpiredPaidMonthlyGrant(expiredUserId, "monthly_plus");
  const renewed = await createRechargeOrder(expiredUserId, {
    planId: "monthly_pro",
    payChannel: "mock",
    clientRequestId: `monthly-after-expiry-${randomUUID()}`
  });

  expect("monthly-after-expiry-can-create", renewed.order.status === "PENDING" && renewed.order.planId === "monthly_pro");
}

async function verifyMonthlyCardSummaryFallback() {
  const userId = randomUUID();
  const repository = getRepository();
  const paidAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const plan = await repository.findRechargePlanById("monthly_pro");

  if (!plan) {
    throw new Error("Missing monthly_pro plan");
  }

  await repository.createRechargeOrder({
    orderNo: `LQFALLBACK${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
    userId,
    planId: "monthly_pro",
    amountCents: plan.priceCents,
    points: plan.points,
    bonusPoints: plan.bonusPoints,
    totalPoints: plan.totalPoints,
    payChannel: "mock",
    status: "PAID",
    clientRequestId: `fallback-monthly-${randomUUID()}`,
    paidAt,
    closedAt: null,
    createdAt: paidAt,
    updatedAt: paidAt
  });
  await repository.applyCreditLedger({
    userId,
    requestId: `fallback-monthly-grant-${randomUUID()}`,
    scene: "recharge_monthly",
    type: "recharge",
    direction: "in",
    amount: 10000,
    sourceType: "legacy_monthly_grant",
    sourceId: `legacy-${randomUUID()}`,
    idempotencyKey: `fallback-monthly-${randomUUID()}`,
    remark: "legacy monthly grant",
    createdAt: paidAt,
    grantType: "monthly",
    grantExpiresAt: expiresAt
  });

  const account = await getCreditAccountForUser(userId);

  expect("monthly-fallback-balance", account.monthlyBalance === 10000);
  expect("monthly-fallback-plan-id", account.monthlyPlanId === "monthly_pro");
  expect("monthly-fallback-plan-name", account.monthlyPlanName === "月卡 Pro");
  expect("monthly-fallback-expires-at", account.monthlyExpiresAt === expiresAt);
}

async function verifyRechargeGrantTypesAndConsumptionPriority() {
  const userId = randomUUID();

  await createPaidMockOrder(userId, "monthly_plus");
  await createPaidMockOrder(userId, "points_plus");

  const accountAfterRecharge = await getCreditAccountForUser(userId);
  const rechargeLedger = await listCreditLedgerForUser(userId, { page: 1, pageSize: 20 });
  expect("recharge-monthly-balance", accountAfterRecharge.monthlyBalance === 6000);
  expect("recharge-permanent-balance", accountAfterRecharge.permanentBalance === 7000);
  expect("recharge-total-balance", accountAfterRecharge.balance === 13000);
  expect("recharge-ledger-monthly-category", rechargeLedger.items.some((item) => item.category === "获取" && item.title === "月卡充值到账" && item.description.includes("月卡充值到账：订单 ") && item.description.includes("月卡积分")));
  expect("recharge-ledger-package-category", rechargeLedger.items.some((item) => item.category === "获取" && item.title === "基础积分包充值到账" && item.description.includes("基础积分包充值到账：订单 ") && item.description.includes("基础积分")));

  const taskId = randomUUID();
  await reserveCredits({
    userId,
    taskId,
    amount: 6500
  });
  await confirmReservation({
    id: taskId,
    userId,
    conversationId: null,
    type: "strategy_generation",
    status: "SUCCEEDED",
    scopeStatus: "in_scope",
    sourcePlatform: null,
    targetPlatform: null,
    prompt: null,
    inputCode: null,
    inputFileId: null,
    costPoints: 6500,
    clientRequestId: `task-${taskId}`,
    requestId: `request-${taskId}`,
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, `confirm-${taskId}`);

  const accountAfterConsume = await getCreditAccountForUser(userId);
  const ledger = await getRepository().listCreditLedger(userId, { page: 1, pageSize: 20 });
  const displayLedger = await listCreditLedgerForUser(userId, { page: 1, pageSize: 20 });
  const scenes = ledger.items.map((item) => item.scene);

  expect("consume-monthly-first-empty", accountAfterConsume.monthlyBalance === 0);
  expect("consume-permanent-remainder", accountAfterConsume.permanentBalance === 6500);
  expect("consume-total-remainder", accountAfterConsume.balance === 6500);
  expect("consume-ledger-monthly", scenes.includes("ai_task_monthly"));
  expect("consume-ledger-permanent", scenes.includes("ai_task_permanent"));
  expect("consume-display-monthly", displayLedger.items.some((item) => item.category === "消耗" && item.title === "任务消耗——策略生成" && item.description === "策略生成——优先消耗月卡积分"));
  expect("consume-display-permanent", displayLedger.items.some((item) => item.category === "消耗" && item.title === "任务消耗——策略生成" && item.description === "策略生成——消耗基础积分"));
}

async function verifyMonthlyExpiry() {
  const userId = randomUUID();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const repository = getRepository();

  await repository.applyCreditLedger({
    userId,
    requestId: "expired-monthly-grant",
    scene: "recharge_monthly",
    type: "recharge",
    direction: "in",
    amount: 1200,
    sourceType: "test",
    sourceId: `expired-${randomUUID()}`,
    idempotencyKey: `expired-monthly-${randomUUID()}`,
    remark: "expired monthly grant",
    createdAt: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    grantType: "monthly",
    grantExpiresAt: yesterday
  });

  const account = await getCreditAccountForUser(userId);
  const ledger = await repository.listCreditLedger(userId, { page: 1, pageSize: 10 });
  const displayLedger = await listCreditLedgerForUser(userId, { page: 1, pageSize: 10 });

  expect("expired-monthly-unavailable", account.balance === 0 && account.monthlyBalance === 0);
  expect("expired-ledger", ledger.items.some((item) => item.scene === "monthly_expire"));
  expect("expired-display-copy", displayLedger.items.some((item) => item.category === "消耗" && item.title === "月卡积分过期" && item.description === "月卡积分过期：失效 1,200 月卡积分"));
}

async function createPaidMockOrder(userId: string, planId: string) {
  const created = await createRechargeOrder(userId, {
    planId,
    payChannel: "mock",
    clientRequestId: `${planId}-${randomUUID()}`
  });

  return handleMockPaymentNotify({
    orderId: created.order.id,
    mockTradeNo: `MOCK-${created.order.orderNo}`,
    amountCents: created.order.amountCents
  }, `notify-${created.order.id}`);
}

async function createExpiredPaidMonthlyGrant(userId: string, planId: "monthly_plus" | "monthly_pro") {
  const repository = getRepository();
  const paidAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const plan = await repository.findRechargePlanById(planId);

  if (!plan) {
    throw new Error(`Missing plan ${planId}`);
  }

  const order = await repository.createRechargeOrder({
    orderNo: `LQEXPIRED${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
    userId,
    planId,
    amountCents: plan.priceCents,
    points: plan.points,
    bonusPoints: plan.bonusPoints,
    totalPoints: plan.totalPoints,
    payChannel: "mock",
    status: "PAID",
    clientRequestId: `expired-monthly-${randomUUID()}`,
    paidAt,
    closedAt: null,
    createdAt: paidAt,
    updatedAt: paidAt
  });

  await applyRechargeCredit(order, `expired-monthly-credit-${order.id}`);
}

function expect(label: string, passed: boolean) {
  if (!passed) {
    failures.push(label);
  }
}

function isApiErrorCode(error: unknown, code: string) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === code);
}
