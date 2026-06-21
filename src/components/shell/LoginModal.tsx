"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CircleDollarSign, Gift, LockKeyhole, Phone, X } from "lucide-react";

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

type LoginModalProps = {
  initialInviteCode?: string | null;
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (data: CurrentUserData) => void;
};

export function LoginModal({ initialInviteCode, onClose, onLoginSuccess, open }: LoginModalProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalError, setLegalError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (open) {
      const urlInviteCode = normalizeInviteCode(initialInviteCode || readInviteCodeFromLocation());

      if (urlInviteCode) {
        setInviteCode(urlInviteCode);
      }

      setAcceptedLegal(false);
      setLegalError("");
    }
  }, [initialInviteCode, open]);

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
    setError("");
    setMessage("");

    if (!acceptedLegal) {
      setLegalError("请先阅读并同意用户协议和隐私政策");
      return;
    }

    setLegalError("");
    setLoggingIn(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          code,
          inviteCode: normalizeInviteCode(inviteCode) || undefined,
          acceptedLegal
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
            注册即送 300 基础积分
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
                onChange={(event) => setInviteCode(normalizeInviteCode(event.target.value))}
                placeholder="填写好友邀请码，TA 可获得 200 积分"
                type="text"
                value={inviteCode}
              />
            </span>
          </label>

          <div className="lq-legal-consent">
            <div className="lq-legal-consent-line">
              <label className="lq-legal-consent-check">
                <input
                  checked={acceptedLegal}
                  onChange={(event) => {
                    setAcceptedLegal(event.target.checked);

                    if (event.target.checked) {
                      setLegalError("");
                    }
                  }}
                  type="checkbox"
                />
                <span>我已阅读并同意</span>
              </label>
              <a href="/legal/user-agreement" rel="noreferrer" target="_blank">
                《用户协议》
              </a>
              <span>和</span>
              <a href="/legal/privacy-policy" rel="noreferrer" target="_blank">
                《隐私政策》
              </a>
            </div>
            {legalError ? <div className="lq-legal-consent-error">{legalError}</div> : null}
          </div>

          {message ? <div className="lq-modal-message">{message}</div> : null}
          {error ? <div className="lq-modal-error">{error}</div> : null}

          <button className="lq-modal-primary" disabled={loggingIn} type="submit">
            <ArrowRight aria-hidden="true" size={17} />
            {loggingIn ? "登录中..." : "登录/注册"}
          </button>
        </form>

      </section>
    </div>
  );
}

function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase();
}

function readInviteCodeFromLocation() {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);

  return params.get("inviteCode") ?? params.get("invite") ?? "";
}
