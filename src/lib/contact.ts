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
  const response = await fetch("/api/v1/contact-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message ?? "提交失败，请稍后重试");
  }

  return {
    success: true,
    message: data.data?.message ?? "已收到您的信息，我们会尽快联系您"
  };
}
