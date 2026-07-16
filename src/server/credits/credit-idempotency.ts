import type { CreditLedger } from "@/server/domain";
import type { ApplyCreditLedgerInput } from "@/server/repositories/types";
import { ApiError } from "@/server/http/api-response";

export function assertIdempotentCreditLedgerMatches(existing: CreditLedger, input: ApplyCreditLedgerInput) {
  const matches =
    existing.userId === input.userId &&
    existing.scene === input.scene &&
    existing.type === input.type &&
    existing.direction === input.direction &&
    existing.amount === input.amount &&
    existing.sourceType === input.sourceType &&
    existing.sourceId === input.sourceId &&
    existing.remark === input.remark;

  if (!matches) {
    throw new ApiError("IDEMPOTENCY_CONFLICT", "该请求编号已用于其他补积分内容，请返回修改后重新确认", 409);
  }
}
