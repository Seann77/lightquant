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
    id: "promo",
    name: "特惠",
    description: "每个账号限购一次。",
    planType: "permanent",
    validityDays: null,
    purchaseLimit: 1,
    priceCents: 990,
    points: 900,
    bonusPoints: 0,
    totalPoints: 900,
    enabled: true,
    sort: 10
  },
  {
    id: "monthly_plus",
    name: "月卡 Plus",
    description: "30 天内有效。",
    planType: "monthly",
    validityDays: 30,
    purchaseLimit: null,
    priceCents: 5800,
    points: 6000,
    bonusPoints: 0,
    totalPoints: 6000,
    enabled: true,
    sort: 20
  },
  {
    id: "monthly_pro",
    name: "月卡 Pro",
    description: "30 天内有效。",
    planType: "monthly",
    validityDays: 30,
    purchaseLimit: null,
    priceCents: 8800,
    points: 10000,
    bonusPoints: 0,
    totalPoints: 10000,
    enabled: true,
    sort: 30
  },
  {
    id: "points_plus",
    name: "基础积分包 Plus",
    description: "基础积分包。",
    planType: "permanent",
    validityDays: null,
    purchaseLimit: null,
    priceCents: 9900,
    points: 7000,
    bonusPoints: 0,
    totalPoints: 7000,
    enabled: true,
    sort: 40
  },
  {
    id: "points_pro",
    name: "基础积分包 Pro",
    description: "基础积分包。",
    planType: "permanent",
    validityDays: null,
    purchaseLimit: null,
    priceCents: 19900,
    points: 17000,
    bonusPoints: 0,
    totalPoints: 17000,
    enabled: true,
    sort: 50
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
        planType: plan.planType,
        validityDays: plan.validityDays,
        purchaseLimit: plan.purchaseLimit,
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

  await prisma.rechargePlan.updateMany({
    where: {
      id: {
        in: ["starter", "standard", "pro"]
      }
    },
    data: {
      enabled: false,
      updatedAt: new Date()
    }
  });
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
