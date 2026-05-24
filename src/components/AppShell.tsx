"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CreditActionPopover } from "@/components/shell/CreditActionPopover";
import { Logo } from "@/components/shell/Logo";
import { LoginModal } from "@/components/shell/LoginModal";
import { RechargeModal } from "@/components/shell/RechargeModal";
import { ShellNavItem } from "@/components/shell/ShellNavItem";
import { WechatQrModal } from "@/components/shell/WechatQrModal";
import { Button } from "@/components/ui/Button";
import { CreditStatus } from "@/components/ui/CreditStatus";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { recentConversations } from "@/lib/mock-data";

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  icon: string;
  label: string;
  match: (pathname: string, mode: string | null) => boolean;
};

type CurrentUserData = {
  user: {
    id: string;
    phone: string;
    displayName: string;
    inviteCode: string;
    status: string;
    createdAt: string;
    lastLoginAt: string;
  };
  creditAccount: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    version: number;
    updatedAt: string;
  };
};

type ApiResponse<T> =
  | {
      success: true;
      data: T;
      requestId: string;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
      requestId: string;
    };

const navItems: NavItem[] = [
  {
    href: "/chat?mode=strategy",
    icon: "auto_awesome",
    label: "策略生成",
    match: (pathname, mode) => pathname === "/" || (pathname === "/chat" && mode !== "convert")
  },
  {
    href: "/chat?mode=convert",
    icon: "translate",
    label: "代码转换",
    match: (pathname, mode) => pathname === "/chat" && mode === "convert"
  },
  {
    href: "/code-analysis",
    icon: "code",
    label: "代码翻译解析",
    match: (pathname) => pathname === "/code-analysis"
  },
  {
    href: "/more",
    icon: "grid_view",
    label: "更多功能",
    match: (pathname) => pathname === "/more"
  }
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);
  const [creditActionsOpen, setCreditActionsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(() => searchParams.get("login") === "1");
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [wechatOpen, setWechatOpen] = useState(false);
  const mode = searchParams.get("mode");
  const isLoggedIn = Boolean(currentUser);
  const userPoints = currentUser?.creditAccount.balance ?? 0;

  const refreshCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/me", {
        cache: "no-store"
      });
      const payload = (await response.json()) as ApiResponse<CurrentUserData>;

      setCurrentUser(payload.success ? payload.data : null);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    function handleCreditsUpdated() {
      void refreshCurrentUser();
    }

    window.addEventListener("lightquant:credits-updated", handleCreditsUpdated);

    return () => {
      window.removeEventListener("lightquant:credits-updated", handleCreditsUpdated);
    };
  }, [refreshCurrentUser]);

  function handleCreditStatusClick() {
    if (isLoggedIn) {
      setCreditActionsOpen((open) => !open);
      return;
    }

    setCreditActionsOpen(false);
    setRechargeOpen(false);
    setLoginOpen(true);
  }

  function handleLoginSuccess(data: CurrentUserData) {
    setCurrentUser(data);
    setCreditActionsOpen(false);
    setLoginOpen(false);
    setRechargeOpen(false);
  }

  function handleOpenRecharge() {
    setCreditActionsOpen(false);
    setRechargeOpen(true);
  }

  function handleOpenStatement() {
    setCreditActionsOpen(false);
    router.push("/credits");
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", {
      method: "POST"
    });
    setCurrentUser(null);
    setCreditActionsOpen(false);
    setRechargeOpen(false);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-background">
      <aside className="hidden h-screen w-[var(--app-sidebar-width)] flex-shrink-0 flex-col border-r border-steel bg-cloud p-md md:flex">
        <div className="mb-xxl px-xs pt-sm">
          <Logo />
        </div>

        <nav aria-label="主导航" className="mt-md flex flex-col gap-xxs text-body-emphasis">
          {navItems.map((item) => (
            <ShellNavItem
              active={item.match(pathname, mode)}
              href={item.href}
              icon={item.icon}
              key={item.label}
              label={item.label}
            />
          ))}
        </nav>

        <div className="mt-xl flex-1 overflow-y-auto app-scrollbar">
          <div className="mb-sm px-xs">
            <h3 className="text-caption-bold text-ink">最近</h3>
          </div>
          <div className="flex flex-col gap-xs text-caption-md text-secondary">
            {recentConversations.map((item) => (
              <Link className="truncate rounded-md px-sm py-xs transition-colors hover:bg-fog" href="/chat?mode=strategy" key={item}>
                {item}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mt-auto border-t border-steel pt-sm">
          <CreditActionPopover
            onClose={() => setCreditActionsOpen(false)}
            onLogout={handleLogout}
            onOpenRecharge={handleOpenRecharge}
            onOpenStatement={handleOpenStatement}
            open={creditActionsOpen}
          />
          <button
            aria-label={isLoggedIn ? "打开积分操作菜单" : "打开登录注册弹窗"}
            className="mb-xs w-full border-b border-steel/30 pb-sm text-left"
            onClick={handleCreditStatusClick}
            type="button"
          >
            <CreditStatus label={currentUser?.user.displayName} loggedIn={isLoggedIn} points={userPoints} />
          </button>
        </div>
      </aside>

      <div className="relative flex min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-background">
        <header className="relative z-50 flex h-[var(--app-topbar-height)] w-full flex-shrink-0 items-center gap-md overflow-hidden border-b border-steel bg-paper px-md md:px-xl">
          <div className="absolute left-0 right-0 top-0 h-[var(--app-shell-blue-line)] bg-primary-bright" />
          <div className="flex min-w-0 items-center gap-sm">
            <button className="p-xs text-ink transition-colors hover:text-primary md:hidden" type="button" aria-label="打开菜单">
              <MaterialIcon size={24}>menu</MaterialIcon>
            </button>
            <div className="min-w-0 md:hidden">
              <Logo />
            </div>
            <button
              aria-label="打开登录注册弹窗"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-secondary transition-colors hover:bg-surface-variant hover:text-primary md:hidden"
              onClick={() => setLoginOpen(true)}
              type="button"
            >
              <MaterialIcon size={20}>person</MaterialIcon>
            </button>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-md md:flex">
            <Button className="hidden md:inline-flex" onClick={() => setWechatOpen(true)} size="sm" type="button" variant="ghost">
              <MaterialIcon size={20}>group</MaterialIcon>
              加入微信群
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-background bg-diagonal-texture app-scrollbar">{children}</main>
      </div>

      <LoginModal onClose={() => setLoginOpen(false)} onLoginSuccess={handleLoginSuccess} open={loginOpen} />
      <RechargeModal onClose={() => setRechargeOpen(false)} onRechargeSuccess={refreshCurrentUser} open={rechargeOpen} points={userPoints} />
      <WechatQrModal onClose={() => setWechatOpen(false)} open={wechatOpen} />
    </div>
  );
}
