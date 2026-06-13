import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import type { PoolConfig } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg(getPgPoolConfig())
});

const timestamp = new Date("2026-01-01T00:00:00.000Z");

const rechargePlans = [
  {
    id: "starter",
    name: "入门包",
    description: "适合轻量体验与少量策略生成。",
    priceCents: 990,
    points: 1000,
    bonusPoints: 0,
    totalPoints: 1000,
    enabled: true,
    sort: 10
  },
  {
    id: "standard",
    name: "标准包",
    description: "推荐日常使用，含 500 赠送积分。",
    priceCents: 2990,
    points: 3000,
    bonusPoints: 500,
    totalPoints: 3500,
    enabled: true,
    sort: 20
  },
  {
    id: "pro",
    name: "专业包",
    description: "适合高频转换与策略迭代，含 1,000 赠送积分。",
    priceCents: 5990,
    points: 7000,
    bonusPoints: 1000,
    totalPoints: 8000,
    enabled: true,
    sort: 30
  }
];

async function main() {
  for (const plan of rechargePlans) {
    await prisma.rechargePlan.upsert({
      where: {
        id: plan.id
      },
      create: {
        ...plan,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      update: {
        name: plan.name,
        description: plan.description,
        priceCents: plan.priceCents,
        points: plan.points,
        bonusPoints: plan.bonusPoints,
        totalPoints: plan.totalPoints,
        enabled: plan.enabled,
        sort: plan.sort,
        updatedAt: new Date()
      }
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});

function getPgPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed recharge plans.");
  }

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
