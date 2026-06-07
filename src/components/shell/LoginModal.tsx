"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ArrowRight, CircleDollarSign, Gift, LockKeyhole, Phone, Ticket, X } from "lucide-react";

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
    <div className="lq-modal-backdrop" role="presentation">
      <section aria-labelledby="login-modal-title" aria-modal="true" className="lq-modal" role="dialog">
        <button aria-label="关闭登录弹窗" className="lq-icon-button lq-modal-close" onClick={onClose} type="button">
          <X aria-hidden="true" size={18} />
        </button>

        <div className="lq-modal-head">
          <Image
            alt="LightQuant LQ logo"
            className="lq-modal-logo"
            height={34}
            priority
            src="/lightquant/lightquant-app-icon.png"
            width={34}
          />
          <h2 className="lq-modal-title" id="login-modal-title">
            登录 / 注册
          </h2>
          <p className="lq-modal-subtitle">
            <CircleDollarSign aria-hidden="true" size={14} />
            注册即送 500 基础积分
          </p>
        </div>

        <form className="lq-form" onSubmit={handleSubmit}>
          <label className="lq-field-group" htmlFor="login-phone">
            <span className="lq-field-label">手机号</span>
            <span className="lq-field">
              <Phone aria-hidden="true" size={16} />
              <input
                autoComplete="tel"
                id="login-phone"
                name="phone"
                onChange={(event) => setPhone(event.target.value)}
                placeholder="请输入手机号"
                type="tel"
                value={phone}
              />
            </span>
          </label>

          <div className="lq-field-group">
            <label className="lq-field-label" htmlFor="login-code">
              验证码
            </label>
            <div className="lq-code-row">
              <span className="lq-field">
                <LockKeyhole aria-hidden="true" size={16} />
                <input
                  autoComplete="one-time-code"
                  id="login-code"
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="6 位验证码"
                  type="text"
                  value={code}
                />
              </span>
              <button className="lq-code-button" disabled={sendingCode} onClick={handleSendCode} type="button">
                {sendingCode ? "发送中" : "获取验证码"}
              </button>
            </div>
          </div>

          <label className="lq-field-group" htmlFor="login-invite">
            <span className="lq-field-label">邀请码（选填）</span>
            <span className="lq-field">
              <Gift aria-hidden="true" size={16} />
              <input
                autoComplete="off"
                id="login-invite"
                name="invite"
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="请输入邀请码"
                type="text"
                value={inviteCode}
              />
            </span>
          </label>

          {message ? <div className="lq-modal-message">{message}</div> : null}
          {error ? <div className="lq-modal-error">{error}</div> : null}

          <button className="lq-modal-primary" disabled={loggingIn} type="submit">
            <ArrowRight aria-hidden="true" size={17} />
            {loggingIn ? "登录中..." : "登录/注册"}
          </button>
        </form>

        <div className="lq-bonus-card">
          <span>注册即送 500 基础积分，可用于策略生成与代码转换。</span>
          <span className="lq-coin">
            <Ticket aria-hidden="true" size={18} />
          </span>
        </div>
      </section>
    </div>
  );
}
