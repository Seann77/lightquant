"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { flushSync } from "react-dom";
import { useCallback, useEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { Code2, LoaderCircle, Menu, MessageCircle, Repeat2, Sparkles, UserRoundPlus, X } from "lucide-react";
import { CreditActionPopover } from "@/components/shell/CreditActionPopover";
import { InviteFriendModal } from "@/components/shell/InviteFriendModal";
import { LegalFooter } from "@/components/shell/LegalFooter";
import { Logo } from "@/components/shell/Logo";
import { LoginModal } from "@/components/shell/LoginModal";
import { RechargeModal } from "@/components/shell/RechargeModal";
import { ShellNavItem } from "@/components/shell/ShellNavItem";
import { WechatQrModal } from "@/components/shell/WechatQrModal";
import {
  WORKBENCH_SWITCH_COMPLETE_EVENT,
  beginWorkbenchSwitchPerf,
  getWorkbenchSwitchPerf,
  logWorkbenchPerf,
  type WorkbenchSwitchCompleteDetail
} from "@/lib/ai/workbench-client";

type AppShellProps = {
  children: ReactNode;
  initialCurrentUser?: CurrentUserData | null;
  paymentFeatureEnabled?: boolean;
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
    monthlyPlanId?: string | null;
    monthlyPlanName?: string | null;
    monthlyExpiresAt?: string | null;
    totalEarned: number;
    totalSpent: number;
    version: number;
    updatedAt: string;
  };
  membership?: {
    betaVip?: {
      active: boolean;
      startsAt: string | null;
      endsAt: string | null;
      label: string;
    };
  } | null;
  inviteReward?: {
    granted: boolean;
    inviterUserId: string | null;
    points: number;
    duplicated: boolean;
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
  latestTaskStatus?: string | null;
  latestTaskType?: string | null;
  targetPlatform?: string | null;
  sourcePlatform?: string | null;
  lastMessageAt: string;
};

type RecentConversationsData = {
  items: RecentConversation[];
  nextCursor?: string | null;
};

type PendingRecentConversation = {
  id: string;
  href: string;
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

const RECENT_CONVERSATION_LIMIT = 20;
const TASK_SWITCH_MIN_VISIBLE_MS = 220;
const TASK_SWITCH_FALLBACK_MS = 30000;

export function AppShell({ children, initialCurrentUser = null, paymentFeatureEnabled = false }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(() => initialCurrentUser);
  const [creditActionsOpen, setCreditActionsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(() => searchParams.get("login") === "1");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mode = searchParams.get("mode");
  const isStrategyLayout = pathname === "/chat" && mode !== "convert";
  const inviteCodeFromUrl = searchParams.get("inviteCode") ?? searchParams.get("invite") ?? "";
  const isAdminPath = pathname.startsWith("/admin");
  const isLoggedIn = Boolean(currentUser);
  const userPoints = currentUser?.creditAccount.balance ?? 0;
  const currentUserId = currentUser?.user.id ?? null;
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [recentNextCursor, setRecentNextCursor] = useState<string | null>(null);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentLoadingMore, setRecentLoadingMore] = useState(false);
  const [pendingRecentConversation, setPendingRecentConversation] = useState<PendingRecentConversation | null>(null);
  const [mainSwitching, setMainSwitching] = useState(false);
  const recentLoadingCursorRef = useRef<string | null>(null);
  const recentSwitchResetTimerRef = useRef<number | null>(null);
  const pendingRecentConversationRef = useRef<PendingRecentConversation | null>(null);
  const currentConversationIdFromUrl = searchParams.get("conversationId");
  const activeRecentConversationId = pendingRecentConversation?.id ?? currentConversationIdFromUrl;

  useEffect(() => {
    if (searchParams.get("login") === "1") {
      setLoginOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, mode]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const clearRecentSwitchResetTimer = useCallback(() => {
    if (recentSwitchResetTimerRef.current === null) {
      return;
    }

    window.clearTimeout(recentSwitchResetTimerRef.current);
    recentSwitchResetTimerRef.current = null;
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/me", {
        cache: "no-store"
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse<CurrentUserData> | null;

      if (payload?.success) {
        setCurrentUser(payload.data);
        return;
      }

      if (response.status === 401 || (payload && !payload.success && payload.error.code === "UNAUTHORIZED")) {
        setCurrentUser(null);
      }
    } catch {
      // Preserve the server-injected user on transient network failures.
    }
  }, []);

  const refreshRecentConversations = useCallback(async (options: { append?: boolean; cursor?: string | null } = {}) => {
    const append = options.append === true;
    const cursor = options.cursor ?? null;

    if (append && (!cursor || recentLoadingCursorRef.current === cursor)) {
      return;
    }

    recentLoadingCursorRef.current = cursor;
    if (append) {
      setRecentLoadingMore(true);
    } else {
      setRecentLoading(true);
    }

    try {
      const query = new URLSearchParams({
        limit: String(RECENT_CONVERSATION_LIMIT)
      });

      if (cursor) {
        query.set("cursor", cursor);
      }

      const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
      const conversationsResponse = await fetch(`/api/v1/ai/conversations?${query.toString()}`, {
        cache: "no-store"
      });
      const conversationsPayload = (await conversationsResponse.json()) as ApiResponse<RecentConversationsData>;

      if (conversationsPayload.success) {
        const finishedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

        logWorkbenchPerf("recent.response", {
          append,
          hasCursor: Boolean(cursor),
          items: conversationsPayload.data.items.length,
          hasNextCursor: Boolean(conversationsPayload.data.nextCursor),
          durationMs: Math.round(finishedAt - startedAt)
        });
        setRecentNextCursor(conversationsPayload.data.nextCursor ?? null);
        setRecentConversations((current) => append ? mergeRecentConversations(current, conversationsPayload.data.items) : conversationsPayload.data.items);
      }
    } catch {
      // Keep the previous lightweight cache to avoid sidebar flicker.
    } finally {
      recentLoadingCursorRef.current = null;
      setRecentLoading(false);
      setRecentLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    return () => {
      clearRecentSwitchResetTimer();
    };
  }, [clearRecentSwitchResetTimer]);

  useEffect(() => {
    pendingRecentConversationRef.current = pendingRecentConversation;
  }, [pendingRecentConversation]);

  const finishRecentConversationSwitch = useCallback((conversationId: string) => {
    if (pendingRecentConversationRef.current?.id !== conversationId) {
      return;
    }

    clearRecentSwitchResetTimer();
    const perfState = getWorkbenchSwitchPerf(conversationId);
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsed = perfState ? now - perfState.clickedAt : TASK_SWITCH_MIN_VISIBLE_MS;
    const resetDelay = Math.max(0, TASK_SWITCH_MIN_VISIBLE_MS - elapsed);
    recentSwitchResetTimerRef.current = window.setTimeout(() => {
      if (pendingRecentConversationRef.current?.id !== conversationId) {
        return;
      }

      setMainSwitching(false);
      setPendingRecentConversation((current) => current?.id === conversationId ? null : current);
      recentSwitchResetTimerRef.current = null;
    }, resetDelay);
  }, [clearRecentSwitchResetTimer]);

  useEffect(() => {
    function handleWorkbenchSwitchComplete(event: Event) {
      const detail = (event as CustomEvent<WorkbenchSwitchCompleteDetail>).detail;

      if (!detail?.conversationId) {
        return;
      }

      finishRecentConversationSwitch(detail.conversationId);
    }

    window.addEventListener(WORKBENCH_SWITCH_COMPLETE_EVENT, handleWorkbenchSwitchComplete);
    return () => {
      window.removeEventListener(WORKBENCH_SWITCH_COMPLETE_EVENT, handleWorkbenchSwitchComplete);
    };
  }, [finishRecentConversationSwitch]);

  useEffect(() => {
    if (!currentUserId) {
      setRecentConversations([]);
      setRecentNextCursor(null);
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
      if (!paymentFeatureEnabled) {
        return;
      }

      if (isLoggedIn) {
        setRechargeOpen(true);
        return;
      }

      setLoginOpen(true);
    }

    function handleOpenLogin() {
      setLoginOpen(true);
    }

    window.addEventListener("lightquant:credits-updated", handleCreditsUpdated);
    window.addEventListener("lightquant:ai-tasks-updated", handleAiTasksUpdated);
    window.addEventListener("lightquant:open-wechat", handleOpenWechat);
    window.addEventListener("lightquant:open-recharge", handleOpenRecharge);
    window.addEventListener("lightquant:open-login", handleOpenLogin);

    return () => {
      window.removeEventListener("lightquant:credits-updated", handleCreditsUpdated);
      window.removeEventListener("lightquant:ai-tasks-updated", handleAiTasksUpdated);
      window.removeEventListener("lightquant:open-wechat", handleOpenWechat);
      window.removeEventListener("lightquant:open-recharge", handleOpenRecharge);
      window.removeEventListener("lightquant:open-login", handleOpenLogin);
    };
  }, [isLoggedIn, paymentFeatureEnabled, refreshCurrentUser, refreshRecentConversations]);

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
    setInviteOpen(false);
    setLoginOpen(false);
    setRechargeOpen(false);
    window.dispatchEvent(new Event("lightquant:auth-updated"));
  }

  function handleOpenRechargeFromMenu() {
    setCreditActionsOpen(false);
    if (!paymentFeatureEnabled) {
      return;
    }

    setRechargeOpen(true);
  }

  function handleOpenStatement() {
    setCreditActionsOpen(false);
    router.push("/credits");
  }

  function handleOpenInviteFromMenu() {
    setCreditActionsOpen(false);
    setInviteOpen(true);
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", {
      method: "POST"
    });
    setCurrentUser(null);
    setCreditActionsOpen(false);
    setInviteOpen(false);
    setRechargeOpen(false);
  }

  function handleRecentScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remaining <= 80 && recentNextCursor && !recentLoading && !recentLoadingMore) {
      void refreshRecentConversations({
        append: true,
        cursor: recentNextCursor
      });
    }
  }

  function handleRecentConversationClick(conversation: RecentConversation) {
    const href = getRecentConversationHref(conversation);

    beginWorkbenchSwitchPerf({
      conversationId: conversation.id,
      href
    });
    logWorkbenchPerf("recent.click", {
      conversationId: conversation.id,
      mode: conversation.mode,
      latestTaskStatus: conversation.latestTaskStatus ?? null
    });
    clearRecentSwitchResetTimer();
    flushSync(() => {
      setPendingRecentConversation({
        id: conversation.id,
        href
      });
      setMainSwitching(true);
    });
    const perfState = getWorkbenchSwitchPerf(conversation.id);

    if (perfState) {
      const activeLink = document.querySelector(`[data-conversation-id="${conversation.id}"]`);
      const loadingOverlay = document.querySelector(".lq-main-switch-overlay");
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();

      logWorkbenchPerf("recent.visible-feedback", {
        conversationId: conversation.id,
        durationMs: Math.round(now - perfState.clickedAt),
        active: Boolean(activeLink?.classList.contains("is-active")),
        loading: Boolean(loadingOverlay)
      });
    }

    const resetDelay = currentConversationIdFromUrl === conversation.id ? TASK_SWITCH_MIN_VISIBLE_MS : TASK_SWITCH_FALLBACK_MS;
    recentSwitchResetTimerRef.current = window.setTimeout(() => {
      if (pendingRecentConversationRef.current?.id !== conversation.id) {
        return;
      }

      setMainSwitching(false);
      setPendingRecentConversation((current) => (
        current?.id === conversation.id && current.href === href ? null : current
      ));
      recentSwitchResetTimerRef.current = null;
    }, resetDelay);
  }

  if (isAdminPath) {
    return <>{children}</>;
  }

  return (
    <div className={`lq-frame ${mobileMenuOpen ? "is-mobile-menu-open" : ""}`.trim()}>
      <aside
        className="lq-sidebar"
        id="lq-primary-navigation"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            setMobileMenuOpen(false);
          }
        }}
      >
        <button aria-label="关闭菜单" className="lq-mobile-sidebar-close" onClick={() => setMobileMenuOpen(false)} type="button">
          <X aria-hidden="true" size={20} />
        </button>
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
          <div className="lq-recent-scroll app-scrollbar" onScroll={handleRecentScroll}>
            {recentConversations.map((conversation) => {
              const title = getRecentConversationTitle(conversation);
              const href = getRecentConversationHref(conversation);
              const active = activeRecentConversationId === conversation.id;

              return (
                <Link
                  className={`lq-recent-link ${active ? "is-active" : ""}`}
                  data-conversation-id={conversation.id}
                  href={href}
                  key={conversation.id}
                  onClick={() => handleRecentConversationClick(conversation)}
                  title={title}
                >
                  <RecentConversationIcon conversation={conversation} />
                  <span>{title}</span>
                </Link>
              );
            })}
            {isLoggedIn && recentLoading && recentConversations.length === 0 ? (
              <div className="lq-recent-link is-muted">
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                <span>正在加载任务</span>
              </div>
            ) : null}
            {isLoggedIn && !recentLoading && recentConversations.length === 0 ? (
              <div className="lq-recent-link is-muted">
                <Sparkles aria-hidden="true" />
                <span>暂无任务记录</span>
              </div>
            ) : null}
            {!isLoggedIn ? (
              <div className="lq-recent-link is-muted">
                <Sparkles aria-hidden="true" />
                <span>登录后查看任务</span>
              </div>
            ) : null}
            {recentLoadingMore ? (
              <div className="lq-recent-link is-muted">
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                <span>正在加载更多</span>
              </div>
            ) : null}
            {isLoggedIn && recentNextCursor && !recentLoadingMore ? (
              <button className="lq-recent-link lq-recent-load-more" onClick={() => void refreshRecentConversations({ append: true, cursor: recentNextCursor })} type="button">
                <LoaderCircle aria-hidden="true" />
                <span>加载更多</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="lq-login-area">
          <CreditActionPopover
            monthlyExpiresAt={currentUser?.creditAccount.monthlyExpiresAt ?? null}
            monthlyPlanName={currentUser?.creditAccount.monthlyPlanName ?? null}
            onClose={() => setCreditActionsOpen(false)}
            onLogout={handleLogout}
            onOpenInvite={handleOpenInviteFromMenu}
            onOpenRecharge={handleOpenRechargeFromMenu}
            onOpenStatement={handleOpenStatement}
            open={creditActionsOpen}
            paymentFeatureEnabled={paymentFeatureEnabled}
          />
          <button
            aria-label={isLoggedIn ? "打开积分操作菜单" : "打开登录注册弹窗"}
            className="lq-login-card"
            onClick={handleCreditStatusClick}
            type="button"
          >
            <span className="lq-login-avatar-shell">
              <span className="lq-login-icon">
                <UserRoundPlus aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
            </span>
            <span className="lq-login-content">
              <p className="lq-login-title">{currentUser?.user.displayName ?? "未登录"}</p>
              <p className="lq-login-subtitle">{isLoggedIn ? `总可用积分 ${userPoints.toLocaleString("zh-CN")}` : "登录后查看积分"}</p>
            </span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <button aria-label="关闭菜单" className="lq-mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)} type="button" />
      ) : null}

      <div className="lq-content">
        <header className="lq-topbar lq-mobile-topbar">
          <div className="lq-mobile-menu">
            <button
              aria-controls="lq-primary-navigation"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
              className="lq-icon-button h-10 w-10"
              onClick={() => setMobileMenuOpen((open) => !open)}
              type="button"
            >
              <Menu aria-hidden="true" size={20} />
            </button>
            <Logo />
          </div>

          <button className="lq-wechat" onClick={() => setWechatOpen(true)} type="button">
            <MessageCircle aria-hidden="true" />
            <span>加入微信群</span>
          </button>
        </header>

        <button aria-label="加入微信群" className="lq-wechat-float" onClick={() => setWechatOpen(true)} type="button">
          <MessageCircle aria-hidden="true" />
          <span>加入微信群</span>
        </button>

        <main aria-busy={mainSwitching || undefined} className="lq-main app-scrollbar">
          <div className={`lq-main-stage ${isStrategyLayout ? "is-strategy-layout" : ""} ${mainSwitching ? "is-switching" : ""}`.trim()}>
            {children}
            <LegalFooter />
          </div>
          {mainSwitching ? (
            <div aria-live="polite" className="lq-main-switch-overlay" role="status">
              <div className="lq-task-switch-indicator">
                <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
                <span>正在载入任务...</span>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <LoginModal initialInviteCode={inviteCodeFromUrl} onClose={() => setLoginOpen(false)} onLoginSuccess={handleLoginSuccess} open={loginOpen} />
      <InviteFriendModal inviteCode={currentUser?.user.inviteCode} onClose={() => setInviteOpen(false)} open={inviteOpen && isLoggedIn} />
      {paymentFeatureEnabled ? (
        <RechargeModal onClose={() => setRechargeOpen(false)} onRechargeSuccess={refreshCurrentUser} open={rechargeOpen} points={userPoints} />
      ) : null}
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
  return `${baseTitle} · ${conversationModeLabels[conversation.mode]}`;
}

function mergeRecentConversations(current: RecentConversation[], incoming: RecentConversation[]) {
  const merged = [...current];
  const seen = new Set(current.map((conversation) => conversation.id));

  for (const conversation of incoming) {
    if (seen.has(conversation.id)) {
      continue;
    }

    seen.add(conversation.id);
    merged.push(conversation);
  }

  return merged;
}

function RecentConversationIcon({ conversation }: { conversation: RecentConversation }) {
  const status = conversation.latestTaskStatus?.toUpperCase() ?? null;

  if (status && !isRecentTaskCompleted(status)) {
    return <LoaderCircle aria-hidden="true" className={isRecentTaskRunning(status) ? "animate-spin" : undefined} />;
  }

  if (conversation.mode === "convert") {
    return <Repeat2 aria-hidden="true" />;
  }

  if (conversation.mode === "analysis") {
    return <Code2 aria-hidden="true" />;
  }

  return <Sparkles aria-hidden="true" />;
}

function isRecentTaskCompleted(status: string) {
  return status === "SUCCEEDED" || status === "COMPLETED" || status === "SUCCESS" || status === "DONE";
}

function isRecentTaskRunning(status: string) {
  return status === "PENDING" || status === "RUNNING" || status === "PROCESSING";
}
