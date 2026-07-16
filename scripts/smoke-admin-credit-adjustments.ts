import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { resolve } from "path";
import type { User } from "@/server/domain";
import type { CreateAdminAuditLogInput } from "@/server/repositories/types";
import { ApiError } from "@/server/http/api-response";
import {
  adjustAdminUserCreditsForAdmin,
  previewAdminUserCreditAdjustmentForAdmin
} from "@/server/admin/admin-service";
import { MockLightQuantRepository } from "@/server/repositories/mock/mock-repository";

process.env.LIGHTQUANT_DATA_MODE = "mock";
process.env.ADMIN_WRITE_ENABLED = "true";

const repository = new MockLightQuantRepository();
globalThis.__lightquantMockRepository = repository;
let admin: User;
let target: User;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
admin = await createUser("15800001001", "专项测试管理员");
target = await createUser("15800001002", "专项测试用户");
const inactive = await createUser("15800001003", "停用测试用户");
inactive.status = "disabled";

const auditEntries: CreateAdminAuditLogInput[] = [];
const originalCreateAuditLog = repository.createAdminAuditLog.bind(repository);
repository.createAdminAuditLog = async (input) => {
  auditEntries.push(input);
  return originalCreateAuditLog(input);
};

await expectApiError("不存在用户", "NOT_FOUND", 404, () => preview({ phone: "15800001999" }));
await expectApiError("停用用户", "FORBIDDEN", 403, () => preview({ phone: inactive.phone }));
await expectApiError("非法手机号", "VALIDATION_ERROR", 400, () => preview({ phone: "123" }));

for (const amount of [1.5, 0, -1, 1_000_001]) {
  await expectApiError(`非法数量 ${amount}`, "VALIDATION_ERROR", 400, () => preview({ amount }));
}

await expectApiError("原因过短", "VALIDATION_ERROR", 400, () => preview({ reason: "短" }));

process.env.ADMIN_WRITE_ENABLED = "false";
await expectApiError("写开关关闭", "FORBIDDEN", 403, () => adjust(admin, target.phone, 10, randomUUID()));
process.env.ADMIN_WRITE_ENABLED = "true";

const targetPreview = await previewAdminUserCreditAdjustmentForAdmin(admin, adjustmentInput(target.phone, 100));
assert(targetPreview.currentBalance === 0, "普通用户预览初始余额应为 0");
assert(targetPreview.estimatedBalance === 100, "普通用户预览预计余额应为 100");
assert(targetPreview.isCurrentAdmin === false, "普通用户预览不应标记为管理员本人");

const targetRequestId = randomUUID();
const first = await adjust(admin, target.phone, 100, targetRequestId);
assert(first.duplicated === false, "首次补积分不应标记重复");
assert(first.account.balance === 100, "普通用户余额应增加 100");
assert(first.ledger.scene === "admin_credit_adjustment", "流水 scene 不正确");
assert(first.ledger.type === "bonus" && first.ledger.direction === "in", "流水类型或方向不正确");
assert(first.ledger.sourceType === "admin_adjustment", "流水来源类型不正确");
assert(first.ledger.sourceId === targetRequestId, "流水来源 ID 不正确");
assert(first.ledger.idempotencyKey === `admin_credit_adjustment:${targetRequestId}`, "流水幂等键不正确");

const targetLedgers = await repository.listCreditLedger(target.id, { page: 1, pageSize: 20 });
const targetGrants = await repository.getCreditGrantSummary(target.id, new Date().toISOString());
assert(targetLedgers.total === 1, "普通用户应只创建一条积分流水");
assert(targetGrants.permanentBalance === 100, "普通用户应创建 100 永久积分批次");
assert(auditEntries.length === 1, "首次补积分应创建一条后台审计日志");
assert(auditEntries[0]?.action === "credit.adjust", "审计 action 不正确");
assert(auditEntries[0]?.targetId === target.id, "审计目标用户不正确");
assert(auditEntries[0]?.metadata.creditLedgerId === first.ledger.id, "审计日志应记录流水 ID");

const duplicated = await adjust(admin, target.phone, 100, targetRequestId, "retry-request");
assert(duplicated.duplicated === true, "相同 clientRequestId 重试应标记重复");
assert(duplicated.ledger.id === first.ledger.id, "相同 clientRequestId 应返回同一条流水");
assert(duplicated.account.balance === 100, "重复请求不得再次增加余额");
assert((await repository.listCreditLedger(target.id, { page: 1, pageSize: 20 })).total === 1, "重复请求不得新增流水");
assert(auditEntries.length === 1, "重复请求不得新增审计日志");

await expectApiError("幂等内容冲突", "IDEMPOTENCY_CONFLICT", 409, () => adjust(admin, target.phone, 101, targetRequestId));

const selfPreview = await previewAdminUserCreditAdjustmentForAdmin(admin, adjustmentInput(admin.phone, 50));
assert(selfPreview.isCurrentAdmin === true, "管理员本人预览应正确标记");
const selfResult = await adjust(admin, admin.phone, 50, randomUUID());
assert(selfResult.isCurrentAdmin === true, "管理员本人补积分结果应正确标记");
assert(selfResult.account.balance === 50, "管理员本人余额应增加 50");

const rollbackTarget = await createUser("15800001004", "回滚测试用户");
const rollbackRequestId = randomUUID();
const auditCountBeforeRollback = auditEntries.length;
repository.createAdminAuditLog = async () => {
  throw new Error("forced audit failure");
};

await expectError("审计失败", () => adjust(admin, rollbackTarget.phone, 77, rollbackRequestId));
assert((await repository.getCreditAccount(rollbackTarget.id)) === null, "审计失败后账户变更应回滚");
assert((await repository.listCreditLedger(rollbackTarget.id, { page: 1, pageSize: 20 })).total === 0, "审计失败后流水应回滚");
assert((await repository.getCreditGrantSummary(rollbackTarget.id, new Date().toISOString())).permanentBalance === 0, "审计失败后积分批次应回滚");
assert(auditEntries.length === auditCountBeforeRollback, "审计失败不应留下审计记录");
repository.createAdminAuditLog = originalCreateAuditLog;

const formSource = await readFile(resolve("src/app/admin/credit-adjustments/CreditAdjustmentForm.tsx"), "utf8");
assert(formSource.includes("确认补积分"), "表单应显示确认补积分按钮");
assert(formSource.includes("bg-primary"), "确认补积分按钮应使用可见的 primary 背景");
assert(!formSource.includes("bg-bloom "), "表单不应继续使用不存在的 bg-bloom 样式");
assert(formSource.includes("/admin/credit-ledger?phone="), "成功结果应提供积分流水入口");

console.log(JSON.stringify({
  ok: true,
  checks: {
    validation: true,
    writeGuard: true,
    ordinaryUserAdjustment: true,
    adminSelfAdjustment: true,
    ledgerAndPermanentGrant: true,
    auditLog: true,
    idempotentRetry: true,
    auditFailureRollback: true,
    confirmationUiSource: true
  }
}, null, 2));
}

function adjustmentInput(phone: string, amount: number) {
  return {
    phone,
    amount,
    reason: "管理员专项补积分测试",
    note: "仅使用内存 mock repository"
  };
}

function preview(overrides: Partial<ReturnType<typeof adjustmentInput>>) {
  return previewAdminUserCreditAdjustmentForAdmin(admin, {
    ...adjustmentInput(target.phone, 10),
    ...overrides
  });
}

function adjust(adminUser: User, phone: string, amount: number, clientRequestId: string, requestId: string = randomUUID()) {
  return adjustAdminUserCreditsForAdmin(adminUser, {
    ...adjustmentInput(phone, amount),
    clientRequestId,
    requestId,
    requestIp: "127.0.0.1"
  });
}

async function createUser(phone: string, displayName: string) {
  const now = new Date().toISOString();

  return repository.createUser({
    phone,
    displayName,
    inviteCode: `SM${randomUUID().replaceAll("-", "").slice(0, 20)}`,
    referredBy: null,
    createdAt: now,
    lastLoginAt: now
  });
}

async function expectApiError(label: string, code: string, status: number, operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch (error) {
    if (error instanceof ApiError && error.code === code && error.status === status) {
      return;
    }

    throw new Error(`${label}返回了错误的异常`);
  }

  throw new Error(`${label}应当失败`);
}

async function expectError(label: string, operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch {
    return;
  }

  throw new Error(`${label}应当失败`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
