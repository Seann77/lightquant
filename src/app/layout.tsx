import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { getOptionalCurrentUserProfile } from "@/server/auth/current-user";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LightQuant 轻量化",
  description: "面向量化初学者的 AI 策略助手静态前台页面"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialCurrentUser = await getOptionalCurrentUserProfile();

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
          <AppShell initialCurrentUser={initialCurrentUser}>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
