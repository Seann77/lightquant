import Link from "next/link";
import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type AdminShellProps = {
  active: "overview" | "users" | "credit-ledger" | "credit-adjustments" | "orders" | "contact-requests" | "model-config" | "ai-tasks" | "files";
  adminPhone: string;
  children: ReactNode;
};

const navItems = [
  { key: "overview", href: "/admin", icon: "dashboard", label: "总览" },
  { key: "users", href: "/admin/users", icon: "group", label: "用户" },
  { key: "credit-ledger", href: "/admin/credit-ledger", icon: "account_balance_wallet", label: "积分流水" },
  { key: "credit-adjustments", href: "/admin/credit-adjustments", icon: "add_card", label: "补积分" },
  { key: "orders", href: "/admin/orders", icon: "receipt_long", label: "订单" },
  { key: "contact-requests", href: "/admin/contact-requests", icon: "forum", label: "留言" },
  { key: "model-config", href: "/admin/model-config", icon: "tune", label: "模型配置" },
  { key: "ai-tasks", href: "/admin/ai-tasks", icon: "psychology", label: "AI 任务" },
  { key: "files", href: "/admin/files", icon: "upload_file", label: "文件" }
] as const;

export function AdminShell({ active, adminPhone, children }: AdminShellProps) {
  return (
    <section className="min-h-screen bg-[#f7f8fb] text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-steel/40 bg-paper px-md py-lg md:block">
          <div className="mb-lg">
            <div className="text-body-emphasis text-ink">LightQuant Admin</div>
            <div className="mt-xxs text-caption-sm text-secondary">{adminPhone}</div>
          </div>
          <nav className="space-y-xs">
            {navItems.map((item) => {
              const selected = item.key === active;

              return (
                <Link
                  className={`flex items-center gap-xs rounded-md px-sm py-xs text-button-md transition-colors ${
                    selected ? "bg-primary-container text-primary-deep" : "text-secondary hover:bg-surface-container hover:text-ink"
                  }`}
                  href={item.href}
                  key={item.key}
                >
                  <MaterialIcon size={18}>{item.icon}</MaterialIcon>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <header className="sticky top-0 z-10 border-b border-steel/40 bg-paper px-md py-sm md:px-xl">
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <div>
                <div className="text-caption-sm text-secondary">运营后台</div>
                <h1 className="text-display-xs font-semibold text-ink">{navItems.find((item) => item.key === active)?.label}</h1>
              </div>
              <Link className="text-button-sm text-secondary transition-colors hover:text-primary" href="/">
                返回用户端
              </Link>
            </div>
            <nav className="mt-sm flex gap-xs overflow-x-auto pb-xxs md:hidden">
              {navItems.map((item) => (
                <Link
                  className={`shrink-0 rounded-md px-sm py-xxs text-caption-bold ${
                    item.key === active ? "bg-primary-container text-primary-deep" : "bg-surface text-secondary"
                  }`}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <div className="px-md py-lg md:px-xl">{children}</div>
        </main>
      </div>
    </section>
  );
}

export function AdminLoginRequired() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-md text-center">
      <div className="w-full max-w-sm rounded-lg border border-steel/40 bg-paper p-xl shadow-sm">
        <MaterialIcon className="text-outline" size={32}>lock</MaterialIcon>
        <h1 className="mt-sm text-body-emphasis text-ink">请先登录</h1>
        <p className="mt-xs text-caption-md text-secondary">后台需要管理员账号登录后访问。</p>
        <Link className="mt-md inline-flex rounded-md bg-primary px-md py-xs text-button-md text-on-primary" href="/?login=1">
          去登录
        </Link>
      </div>
    </section>
  );
}

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-steel/40 bg-paper shadow-sm">
      <table className="min-w-full border-collapse text-left text-caption-md">{children}</table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap border-b border-steel/40 bg-surface-container-low px-sm py-xs text-caption-bold text-secondary">{children}</th>;
}

export function Td({ children }: { children: ReactNode }) {
  return <td className="max-w-[280px] whitespace-nowrap border-b border-steel/20 px-sm py-xs align-top text-secondary">{children}</td>;
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const className = {
    neutral: "bg-surface-container text-secondary",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-error-container/30 text-bloom-deep"
  }[tone];

  return <span className={`inline-flex rounded-full px-xs py-[2px] text-caption-sm ${className}`}>{children}</span>;
}

export function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  return (
    <div className="mt-md flex items-center justify-end gap-sm text-caption-md text-secondary">
      <Link className={page <= 1 ? "pointer-events-none text-outline" : "text-primary"} href={href(Math.max(1, page - 1))}>
        上一页
      </Link>
      <span>
        {page} / {totalPages}
      </span>
      <Link className={page >= totalPages ? "pointer-events-none text-outline" : "text-primary"} href={href(Math.min(totalPages, page + 1))}>
        下一页
      </Link>
    </div>
  );
}

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatMoney(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`;
}
