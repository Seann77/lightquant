import type { NextRequest } from "next/server";
import { ApiError } from "@/server/http/api-response";

export async function readJsonObject(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError("BAD_REQUEST", "请求体格式不正确", 400);
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("BAD_REQUEST", "请求体必须是 JSON", 400);
  }
}

export function getStringField(body: Record<string, unknown>, field: string): string;
export function getStringField(body: Record<string, unknown>, field: string, required: false): string | undefined;
export function getStringField(body: Record<string, unknown>, field: string, required = true) {
  const value = body[field];

  if (typeof value === "string") {
    return value;
  }

  if (!required && value === undefined) {
    return undefined;
  }

  throw new ApiError("VALIDATION_ERROR", `${field} 参数不正确`, 400);
}

export function getNumberField(body: Record<string, unknown>, field: string): number;
export function getNumberField(body: Record<string, unknown>, field: string, required: false): number | undefined;
export function getNumberField(body: Record<string, unknown>, field: string, required = true) {
  const value = body[field];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (!required && value === undefined) {
    return undefined;
  }

  throw new ApiError("VALIDATION_ERROR", `${field} 参数不正确`, 400);
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}
