"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Clock3, FileText, Menu, MessageCircle, UserRoundPlus } from "lucide-react";
import { CreditActionPopover } from "@/components/shell/CreditActionPopover";
import { Logo } from "@/components/shell/Logo";
import { LoginModal } from "@/components/shell/LoginModal";
import { RechargeModal } from "@/components/shell/RechargeModal";
import { ShellNavItem } from "@/components/shell/ShellNavItem";
import { WechatQrModal } from "@/components/shell/WechatQrModal";
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
  const isAdminPath = pathname.startsWith("/admin");
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

    function handleOpenWechat() {
      setWechatOpen(true);
    }

    function handleOpenRecharge() {
      if (isLoggedIn) {
        setRechargeOpen(true);
        return;
      }

      setLoginOpen(true);
    }

    window.addEventListener("lightquant:credits-updated", handleCreditsUpdated);
    window.addEventListener("lightquant:open-wechat", handleOpenWechat);
    window.addEventListener("lightquant:open-recharge", handleOpenRecharge);

    return () => {
      window.removeEventListener("lightquant:credits-updated", handleCreditsUpdated);
      window.removeEventListener("lightquant:open-wechat", handleOpenWechat);
      window.removeEventListener("lightquant:open-recharge", handleOpenRecharge);
    };
  }, [isLoggedIn, refreshCurrentUser]);

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

  function handleOpenRechargeFromMenu() {
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

  if (isAdminPath) {
    return <>{children}</>;
  }

  return (
    <div className="lq-frame">
      <aside className="lq-sidebar">
        <Logo />

        <nav aria-label="主导航" className="lq-nav">
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

        <div className="lq-recent">
          <p className="lq-recent-title">最近</p>
          {recentConversations.map((item, index) => (
            <Link className="lq-recent-link" href="/chat?mode=strategy" key={item}>
              {index === 0 ? <Clock3 aria-hidden="true" /> : <FileText aria-hidden="true" />}
              <span>{item}</span>
            </Link>
          ))}
        </div>

        <div className="lq-login-area">
          <CreditActionPopover
            onClose={() => setCreditActionsOpen(false)}
            onLogout={handleLogout}
            onOpenRecharge={handleOpenRechargeFromMenu}
            onOpenStatement={handleOpenStatement}
            open={creditActionsOpen}
          />
          <button
            aria-label={isLoggedIn ? "打开积分操作菜单" : "打开登录注册弹窗"}
            className="lq-login-card"
            onClick={handleCreditStatusClick}
            type="button"
          >
            <span className="lq-login-icon">
              <UserRoundPlus aria-hidden="true" size={21} strokeWidth={1.8} />
            </span>
            <span>
              <p className="lq-login-title">{currentUser?.user.displayName ?? "未登录"}</p>
              <p className="lq-login-subtitle">{isLoggedIn ? `积分余额 ${userPoints.toLocaleString("zh-CN")}` : "登录后查看积分"}</p>
            </span>
          </button>
        </div>
      </aside>

      <div className="lq-content">
        <header className="lq-topbar">
          <div className="lq-mobile-menu">
            <button aria-label="打开菜单" className="lq-icon-button h-10 w-10" type="button">
              <Menu aria-hidden="true" size={20} />
            </button>
            <Logo />
          </div>

          <button className="lq-wechat" onClick={() => setWechatOpen(true)} type="button">
            <MessageCircle aria-hidden="true" />
            <span>加入微信群</span>
          </button>
        </header>

        <main className="lq-main app-scrollbar">{children}</main>
      </div>

      <LoginModal onClose={() => setLoginOpen(false)} onLoginSuccess={handleLoginSuccess} open={loginOpen} />
      <RechargeModal onClose={() => setRechargeOpen(false)} onRechargeSuccess={refreshCurrentUser} open={rechargeOpen} points={userPoints} />
      <WechatQrModal onClose={() => setWechatOpen(false)} open={wechatOpen} />
    </div>
  );
}
