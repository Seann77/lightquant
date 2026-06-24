import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { getOptionalCurrentUserProfile } from "@/server/auth/current-user";
import { isPaymentFeatureEnabled } from "@/server/env";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LightQuant 轻量化 - AI 量化策略生成/修改代码工具——支持聚宽/Ptrade/QMT",
  description:
    "LightQuant 轻量化支持 PTrade、聚宽 JoinQuant、QMT 的 AI 量化策略生成、策略代码转换与代码解析，帮助量化策略研究者更快编写、迁移和理解策略代码。"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialCurrentUser = await getOptionalCurrentUserProfile();
  const paymentFeatureEnabled = isPaymentFeatureEnabled();

  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <AppShell initialCurrentUser={initialCurrentUser} paymentFeatureEnabled={paymentFeatureEnabled}>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
