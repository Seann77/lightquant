import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "IDEMPOTENCY_CONFLICT"
  | "INSUFFICIENT_CREDITS"
  | "AI_PROVIDER_CONFIG_ERROR"
  | "AI_TASK_FAILED"
  | "PAYMENT_CONFIG_ERROR"
  | "ORDER_ALREADY_PAID"
  | "PAYMENT_AMOUNT_MISMATCH"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function createRequestId() {
  return randomUUID();
}

export function ok<T>(data: T, requestId: string, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data,
      requestId
    },
    init
  );
}

export function fail(error: unknown, requestId: string) {
  const normalized = normalizeError(error);

  if (normalized.code === "INTERNAL_ERROR") {
    console.error(`[${requestId}]`, error);
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: normalized.code,
        message: normalized.message
      },
      requestId
    },
    {
      status: normalized.status
    }
  );
}

export async function withApiHandler(handler: (requestId: string) => Promise<NextResponse>) {
  const requestId = createRequestId();

  try {
    return await handler(requestId);
  } catch (error) {
    return fail(error, requestId);
  }
}

function normalizeError(error: unknown): { code: ApiErrorCode; message: string; status: number } {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "服务暂时不可用，请稍后再试",
    status: 500
  };
}
