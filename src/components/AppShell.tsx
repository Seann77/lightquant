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

type RecentConversation = {
  id: string;
  mode: "strategy" | "convert" | "analysis";
  title: string;
  status: "active" | "archived";
  targetPlatform?: string | null;
  sourcePlatform?: string | null;
  lastMessageAt: string;
};

type RecentConversationsData = {
  items: RecentConversation[];
  nextCursor?: string | null;
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

const conversationModeLabels: Record<RecentConversation["mode"], string> = {
  strategy: "策略",
  convert: "转换",
  analysis: "解析"
};

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
  const currentUserId = currentUser?.user.id ?? null;
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);

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

  const refreshRecentConversations = useCallback(async () => {
    try {
      const conversationsResponse = await fetch("/api/v1/ai/conversations?limit=5", {
        cache: "no-store"
      });
      const conversationsPayload = (await conversationsResponse.json()) as ApiResponse<RecentConversationsData>;

      if (conversationsPayload.success) {
        setRecentConversations(conversationsPayload.data.items);
      }
    } catch {
      // Keep the previous lightweight cache to avoid sidebar flicker.
    }
  }, []);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    if (!currentUserId) {
      setRecentConversations([]);
      return;
    }

    void refreshRecentConversations();
  }, [currentUserId, refreshRecentConversations]);

  useEffect(() => {
    function handleCreditsUpdated() {
      void refreshCurrentUser();
      if (isLoggedIn) {
        void refreshRecentConversations();
      }
    }

    function handleAiTasksUpdated() {
      if (isLoggedIn) {
        void refreshRecentConversations();
        void refreshCurrentUser();
      }
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
    window.addEventListener("lightquant:ai-tasks-updated", handleAiTasksUpdated);
    window.addEventListener("lightquant:open-wechat", handleOpenWechat);
    window.addEventListener("lightquant:open-recharge", handleOpenRecharge);

    return () => {
      window.removeEventListener("lightquant:credits-updated", handleCreditsUpdated);
      window.removeEventListener("lightquant:ai-tasks-updated", handleAiTasksUpdated);
      window.removeEventListener("lightquant:open-wechat", handleOpenWechat);
      window.removeEventListener("lightquant:open-recharge", handleOpenRecharge);
    };
  }, [isLoggedIn, refreshCurrentUser, refreshRecentConversations]);

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
          {recentConversations.map((conversation, index) => (
            <Link className="lq-recent-link" href={getRecentConversationHref(conversation)} key={conversation.id}>
              {index === 0 ? <Clock3 aria-hidden="true" /> : <FileText aria-hidden="true" />}
              <span>{getRecentConversationTitle(conversation)}</span>
            </Link>
          ))}
          {isLoggedIn && recentConversations.length === 0 ? (
            <div className="lq-recent-link is-muted">
              <FileText aria-hidden="true" />
              <span>暂无任务记录</span>
            </div>
          ) : null}
          {!isLoggedIn ? (
            <div className="lq-recent-link is-muted">
              <FileText aria-hidden="true" />
              <span>登录后查看任务</span>
            </div>
          ) : null}
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

function getRecentConversationHref(conversation: RecentConversation) {
  if (conversation.mode === "convert") {
    return `/chat?mode=convert&conversationId=${encodeURIComponent(conversation.id)}`;
  }

  if (conversation.mode === "analysis") {
    return `/code-analysis?conversationId=${encodeURIComponent(conversation.id)}`;
  }

  return `/chat?mode=strategy&conversationId=${encodeURIComponent(conversation.id)}`;
}

function getRecentConversationTitle(conversation: RecentConversation) {
  const baseTitle = conversation.title?.trim() || conversationModeLabels[conversation.mode];
  const title = baseTitle.length > 12 ? `${baseTitle.slice(0, 12)}...` : baseTitle;
  return `${title} · ${conversationModeLabels[conversation.mode]}`;
}
