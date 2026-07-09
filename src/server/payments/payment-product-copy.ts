import type { RechargeOrder } from "@/server/domain";

type PaymentProductCopy = {
  subject: string;
  body: string;
};

export function getPaymentProductCopy(order: Pick<RechargeOrder, "planId" | "totalPoints">): PaymentProductCopy {
  if (order.planId === "monthly_plus") {
    return {
      subject: "LightQuant 月卡 Plus（6000积分/30天）",
      body: "月卡积分 30 天内有效，优先消耗"
    };
  }

  if (order.planId === "monthly_pro") {
    return {
      subject: "LightQuant 月卡 Pro（10000积分/30天）",
      body: "月卡积分 30 天内有效，优先消耗"
    };
  }

  if (order.planId === "promo") {
    return {
      subject: "LightQuant 特惠基础积分包（900积分）",
      body: "基础积分长期有效"
    };
  }

  if (order.planId === "points_plus") {
    return {
      subject: "LightQuant 基础积分包 Plus（7000积分）",
      body: "基础积分长期有效"
    };
  }

  if (order.planId === "points_pro") {
    return {
      subject: "LightQuant 基础积分包 Pro（17000积分）",
      body: "基础积分长期有效"
    };
  }

  return {
    subject: `LightQuant 基础积分包（${order.totalPoints}积分）`,
    body: "基础积分长期有效"
  };
}
