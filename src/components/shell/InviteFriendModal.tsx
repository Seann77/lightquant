"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Gift, Link2, X } from "lucide-react";

type InviteFriendModalProps = {
  inviteCode: string | null | undefined;
  onClose: () => void;
  open: boolean;
};

export function InviteFriendModal({ inviteCode, onClose, open }: InviteFriendModalProps) {
  const [origin, setOrigin] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const normalizedInviteCode = normalizeInviteCode(inviteCode);
  const inviteLink = useMemo(() => {
    return buildInviteLink(normalizedInviteCode, origin);
  }, [normalizedInviteCode, origin]);
  const copyContent = useMemo(() => buildInviteShareContent(inviteLink, normalizedInviteCode), [inviteLink, normalizedInviteCode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setOrigin(window.location.origin);
    setCopyState("idle");
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleCopy() {
    if (!copyContent) {
      return;
    }

    const copied = await copyTextToClipboard(copyContent);

    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div className="lq-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }} role="presentation">
      <section aria-labelledby="invite-modal-title" aria-modal="true" className="lq-modal lq-invite-modal" role="dialog">
        <button aria-label="关闭邀请好友弹窗" className="lq-icon-button lq-modal-close" onClick={onClose} type="button">
          <X aria-hidden="true" size={18} />
        </button>

        <div className="lq-modal-head lq-invite-modal-head">
          <span className="lq-invite-modal-icon">
            <Gift aria-hidden="true" size={21} />
          </span>
          <h2 className="lq-modal-title" id="invite-modal-title">
            邀请好友
          </h2>
          <p className="lq-contact-subtitle">
            好友注册时可填写你的邀请码，注册成功后你获得 200 积分奖励。
          </p>
        </div>

        <div className="lq-invite-share-panel">
          <label className="lq-invite-share-field">
            <span>我的邀请码</span>
            <input readOnly value={normalizedInviteCode || "暂无邀请码"} />
          </label>

          <label className="lq-invite-share-field">
            <span>注册链接</span>
            <textarea readOnly rows={2} value={inviteLink || "登录后即可生成邀请链接"} />
          </label>

          <button className="lq-modal-primary" disabled={!copyContent} onClick={handleCopy} type="button">
            {copyState === "copied" ? <Check aria-hidden="true" size={17} /> : <Copy aria-hidden="true" size={17} />}
            {copyState === "copied" ? "已复制邀请内容" : copyState === "failed" ? "复制失败，请手动复制" : "复制邀请链接"}
          </button>

          <p className="lq-invite-share-note">
            <Link2 aria-hidden="true" size={14} />
            邀请码为选填，好友也可以清空后继续注册。
          </p>
        </div>
      </section>
    </div>
  );
}

function normalizeInviteCode(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? "";
}

function buildInviteLink(inviteCode: string, origin: string) {
  if (!inviteCode) {
    return "";
  }

  const base = getSiteBaseUrl(origin);

  if (!base) {
    return "";
  }

  return `${base}/?inviteCode=${encodeURIComponent(inviteCode)}`;
}

function buildInviteShareContent(inviteLink: string, inviteCode: string) {
  if (!inviteLink || !inviteCode) {
    return "";
  }

  return `LightQuant 内测邀请链接：${inviteLink}\n邀请码：${inviteCode}`;
}

function getSiteBaseUrl(origin: string) {
  const configuredSiteUrl = normalizeSiteBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  return normalizeSiteBaseUrl(origin);
}

function normalizeSiteBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/\/+$/, "");
}

async function copyTextToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
