import type { NextRequest } from "next/server";

export function getAdminListParams(request: NextRequest) {
  return {
    page: Number(request.nextUrl.searchParams.get("page") ?? "1"),
    pageSize: Number(request.nextUrl.searchParams.get("pageSize") ?? "20")
  };
}

export function getOptionalParam(request: NextRequest, key: string) {
  return request.nextUrl.searchParams.get(key) ?? undefined;
}
