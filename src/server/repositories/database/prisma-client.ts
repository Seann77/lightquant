import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl } from "@/server/env";

declare global {
  var __lightquantPrismaClient: PrismaClient | undefined;
}

export function getPrismaClient() {
  if (!globalThis.__lightquantPrismaClient) {
    globalThis.__lightquantPrismaClient = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: getDatabaseUrl()
      })
    });
  }

  return globalThis.__lightquantPrismaClient;
}
