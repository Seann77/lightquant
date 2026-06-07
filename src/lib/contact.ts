export type ContactMethod = "邮箱" | "微信号" | "手机号";

export type ContactCategory = "使用问题" | "策略生成" | "代码转换" | "积分/充值" | "其他";

export type ContactRequestPayload = {
  name: string;
  contactMethod: ContactMethod;
  contactValue: string;
  category: ContactCategory;
  message: string;
  source: string;
  createdAt: string;
};

export type ContactRequestResult = {
  success: true;
  message: string;
};

export const contactMethods: ContactMethod[] = ["邮箱", "微信号", "手机号"];

export const contactCategories: ContactCategory[] = ["使用问题", "策略生成", "代码转换", "积分/充值", "其他"];

export async function submitContactRequest(payload: ContactRequestPayload): Promise<ContactRequestResult> {
  // payload.category 对应 UI 中的“问题类型”；未来这里会替换为管理后台 API。
  void payload;

  await new Promise((resolve) => setTimeout(resolve, 360));

  return {
    success: true,
    message: "已收到您的信息，我们会尽快联系您"
  };
}
