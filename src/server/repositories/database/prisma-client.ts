import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl } from "@/server/env";

declare global {
  var __lightquantPrismaClient: PrismaClient | undefined;
}

export function getPrismaClient() {
  if (!globalThis.__lightquantPrismaClient) {
    globalThis.__lightquantPrismaClient = new PrismaClient({
      adapter: new PrismaPg(getPgPoolConfig())
    });
  }

  return globalThis.__lightquantPrismaClient;
}

function getPgPoolConfig(): PoolConfig {
  const databaseUrl = getDatabaseUrl();

  try {
    const parsed = new URL(databaseUrl);
    const sslmode = parsed.searchParams.get("sslmode");
    const isSupabaseHost = parsed.hostname.includes("supabase.com");
    const shouldUseSsl = sslmode !== "disable" && (Boolean(sslmode) || isSupabaseHost);

    if (!shouldUseSsl) {
      return {
        connectionString: databaseUrl
      };
    }

    // Let node-postgres receive the SSL object directly. This avoids pg-connection-string
    // treating sslmode=require as certificate verification in some local environments.
    parsed.searchParams.delete("sslmode");

    return {
      connectionString: parsed.toString(),
      ssl: {
        rejectUnauthorized: false
      }
    };
  } catch {
    return {
      connectionString: databaseUrl
    };
  }
}
