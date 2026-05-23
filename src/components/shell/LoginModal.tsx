"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { TextField } from "@/components/ui/TextField";

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

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (data: CurrentUserData) => void;
};

export function LoginModal({ onClose, onLoginSuccess, open }: LoginModalProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSendCode() {
    setSendingCode(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/v1/auth/sms-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          scene: "login"
        })
      });
      const payload = (await response.json()) as ApiResponse<{ expiresAt: string; mockCode?: string }>;

      if (!payload.success) {
        setError(payload.error.message);
        return;
      }

      setMessage(payload.data.mockCode ? `验证码已生成：${payload.data.mockCode}` : "验证码已发送，请注意查收");
    } catch {
      setError("验证码发送失败，请稍后再试");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          code,
          inviteCode: inviteCode.trim() || undefined
        })
      });
      const payload = (await response.json()) as ApiResponse<CurrentUserData>;

      if (!payload.success) {
        setError(payload.error.message);
        return;
      }

      onLoginSuccess(payload.data);
    } catch {
      setError("登录失败，请稍后再试");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-md backdrop-blur-[2px]" role="presentation">
      <div
        aria-labelledby="login-modal-title"
        aria-modal="true"
        className="relative w-full max-w-[360px] rounded-xl bg-paper p-xl shadow-modal"
        role="dialog"
      >
        <button
          aria-label="关闭登录弹窗"
          className="absolute right-md top-md text-secondary transition-colors hover:text-primary"
          onClick={onClose}
          type="button"
        >
          <MaterialIcon size={20}>close</MaterialIcon>
        </button>

        <div className="mb-lg">
          <h2 className="text-display-md font-semibold text-on-background" id="login-modal-title">
            登录 / 注册
          </h2>
          <p className="mt-xs text-caption-bold text-primary-bright">注册即送 500 基础积分</p>
        </div>

        <form className="grid gap-md" onSubmit={handleSubmit}>
          <TextField label="手机号" name="phone" onChange={(event) => setPhone(event.target.value)} placeholder="请输入手机号" type="tel" value={phone} />
          <div className="grid gap-xs">
            <span className="text-caption-bold text-on-surface">验证码</span>
            <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-xs">
              <input
                className="h-11 rounded border border-steel bg-paper px-sm text-body-md outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary"
                onChange={(event) => setCode(event.target.value)}
                placeholder="输入验证码"
                type="text"
                value={code}
              />
              <Button disabled={sendingCode} onClick={handleSendCode} size="sm" type="button" variant="outline">
                {sendingCode ? "发送中" : "获取验证码"}
              </Button>
            </div>
          </div>
          <TextField
            label="邀请码（选填）"
            name="invite"
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="如有邀请码请填写"
            type="text"
            value={inviteCode}
          />

          {message ? (
            <div className="rounded bg-primary-soft/50 px-sm py-xs text-caption-md text-primary-bright">{message}</div>
          ) : null}
          {error ? (
            <div className="rounded bg-error-container/40 px-sm py-xs text-caption-md text-bloom-deep">{error}</div>
          ) : null}

          <Button className="mt-xs w-full" disabled={loggingIn} type="submit">
            {loggingIn ? "登录中..." : "登录/注册"}
          </Button>
        </form>

        <div className="mt-lg flex items-center justify-between rounded bg-cloud px-sm py-sm text-caption-sm text-graphite">
          <span>注册即送 500 基础积分，可用于策略生成与代码转换。</span>
          <MaterialIcon className="text-primary" size={18}>
            monetization_on
          </MaterialIcon>
        </div>
      </div>
    </div>
  );
}
