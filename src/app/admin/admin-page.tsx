import { notFound } from "next/navigation";
import { ApiError } from "@/server/http/api-response";
import { getOptionalAdminForPage, type AdminContext } from "@/server/admin/admin-auth";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function getAdminPageContext(): Promise<AdminContext | null> {
  try {
    return await getOptionalAdminForPage();
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }
}

export async function readSearchParams(searchParams?: SearchParams) {
  return searchParams ? await searchParams : {};
}

export function stringParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

export function numberParam(params: Record<string, string | string[] | undefined>, key: string, fallback: number) {
  const value = Number(stringParam(params, key) ?? fallback);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}
